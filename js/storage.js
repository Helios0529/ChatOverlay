(() => {
  'use strict';

  const DB_NAME = 'FF14ChatOverlayDB';
  const DB_VERSION = 3;
  const STORE = 'messages';
  const PARTY_STORE = 'party_history';
  const PARTY_ENCOUNTER_STORE = 'party_encounters';
  const MAX_MESSAGES = 50000;
  const LOAD_LIMIT = 10000;
  const BACKUP_SCHEMA = 1;

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('group', 'group', { unique: false });
          store.createIndex('sender', 'sender', { unique: false });
        }
        if (!db.objectStoreNames.contains(PARTY_STORE)) {
          const partyStore = db.createObjectStore(PARTY_STORE, { keyPath: 'key' });
          partyStore.createIndex('lastSeen', 'lastSeen', { unique: false });
          partyStore.createIndex('name', 'name', { unique: false });
        }
        if (!db.objectStoreNames.contains(PARTY_ENCOUNTER_STORE)) {
          const encounterStore = db.createObjectStore(PARTY_ENCOUNTER_STORE, { keyPath: 'id', autoIncrement: true });
          encounterStore.createIndex('partyKey', 'partyKey', { unique: false });
          encounterStore.createIndex('seenAt', 'seenAt', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return dbPromise;
  }

  async function add(message) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const req = tx.objectStore(STORE).add(message);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function recent(limit = LOAD_LIMIT) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const items = [];
      const req = store.openCursor(null, 'prev');

      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor || items.length >= limit) {
          items.reverse();
          resolve(items);
          return;
        }
        items.push(cursor.value);
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
    });
  }


  function localDateKeyFromDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function localDateRange(dateKey) {
    const match = String(dateKey || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const start = new Date(year, month, day, 0, 0, 0, 0);
    if (Number.isNaN(start.getTime()) || localDateKeyFromDate(start) !== String(dateKey)) return null;
    const end = new Date(year, month, day + 1, 0, 0, 0, 0);
    return { start, end, startISO: start.toISOString(), endISO: end.toISOString() };
  }

  async function messagesForDate(dateKey, limit = MAX_MESSAGES) {
    const range = localDateRange(dateKey);
    if (!range) return [];
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const index = tx.objectStore(STORE).index('timestamp');
      const items = [];
      const keyRange = IDBKeyRange.bound(range.startISO, range.endISO, false, true);
      const req = index.openCursor(keyRange, 'next');

      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor || items.length >= limit) {
          resolve(items);
          return;
        }
        items.push(cursor.value);
        cursor.continue();
      };
    });
  }

  async function monthDateCounts(year, monthIndex) {
    const y = Number(year);
    const m = Number(monthIndex);
    if (!Number.isInteger(y) || !Number.isInteger(m) || m < 0 || m > 11) return {};
    const start = new Date(y, m, 1, 0, 0, 0, 0);
    const end = new Date(y, m + 1, 1, 0, 0, 0, 0);
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const index = tx.objectStore(STORE).index('timestamp');
      const keyRange = IDBKeyRange.bound(start.toISOString(), end.toISOString(), false, true);
      const counts = {};
      const req = index.openCursor(keyRange, 'next');

      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) {
          resolve(counts);
          return;
        }
        const d = new Date(cursor.value?.timestamp);
        const key = localDateKeyFromDate(d);
        if (key) counts[key] = (counts[key] || 0) + 1;
        cursor.continue();
      };
    });
  }

  async function clear() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const req = tx.objectStore(STORE).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function trim() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const countReq = store.count();

      countReq.onerror = () => reject(countReq.error);
      countReq.onsuccess = () => {
        let toDelete = countReq.result - MAX_MESSAGES;
        if (toDelete <= 0) {
          resolve();
          return;
        }

        const cursorReq = store.openCursor();
        cursorReq.onerror = () => reject(cursorReq.error);
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (!cursor || toDelete <= 0) {
            resolve();
            return;
          }
          cursor.delete();
          toDelete -= 1;
          cursor.continue();
        };
      };
    });
  }

  function partyKey(member) {
    const worldPart = member.worldId || member.worldName || '';
    return `${String(member.name || '').trim().toLocaleLowerCase('zh-CN')}|${worldPart}`;
  }

  // Summary + encounter detail are committed in one IndexedDB transaction.
  // This keeps the encounter count and the detailed history in sync.
  async function recordPartyEncounter(member, seenAt = '') {
    const name = String(member?.name || '').trim();
    if (!name) return null;
    const db = await openDB();
    const now = seenAt || new Date().toISOString();
    const key = partyKey(member);

    return new Promise((resolve, reject) => {
      const tx = db.transaction([PARTY_STORE, PARTY_ENCOUNTER_STORE], 'readwrite');
      const summaryStore = tx.objectStore(PARTY_STORE);
      const encounterStore = tx.objectStore(PARTY_ENCOUNTER_STORE);
      const getReq = summaryStore.get(key);

      let record = null;
      getReq.onerror = () => reject(getReq.error);
      getReq.onsuccess = () => {
        const previous = getReq.result || null;
        const previousCount = previous
          ? Math.max(1, Number(previous.encounterCount) || 0)
          : 0;

        record = {
          key,
          name,
          worldId: member.worldId || previous?.worldId || '',
          worldName: member.worldName || previous?.worldName || '',
          firstSeen: previous?.firstSeen || now,
          lastSeen: now,
          encounterCount: previousCount + 1,
          lastActorId: member.id || previous?.lastActorId || '',
          lastJob: member.job ?? previous?.lastJob ?? '',
        };

        summaryStore.put(record);
        encounterStore.add({
          partyKey: key,
          name,
          worldId: record.worldId,
          worldName: record.worldName,
          seenAt: now,
          actorId: member.id || '',
          job: member.job ?? '',
        });
      };

      tx.oncomplete = () => resolve(record);
      tx.onerror = () => reject(tx.error || new Error('party encounter transaction failed'));
      tx.onabort = () => reject(tx.error || new Error('party encounter transaction aborted'));
    });
  }

  async function partyHistory(limit = 1000) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PARTY_STORE, 'readonly');
      const store = tx.objectStore(PARTY_STORE);
      const index = store.index('lastSeen');
      const items = [];
      const req = index.openCursor(null, 'prev');
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor || items.length >= limit) {
          resolve(items);
          return;
        }
        items.push(cursor.value);
        cursor.continue();
      };
    });
  }

  async function partyEncounters(key, limit = 200) {
    if (!key) return [];
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PARTY_ENCOUNTER_STORE, 'readonly');
      const index = tx.objectStore(PARTY_ENCOUNTER_STORE).index('partyKey');
      const items = [];
      const range = IDBKeyRange.only(key);
      const req = index.openCursor(range, 'prev');
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor || items.length >= limit) {
          items.sort((a, b) => String(b.seenAt || '').localeCompare(String(a.seenAt || '')));
          resolve(items);
          return;
        }
        items.push(cursor.value);
        cursor.continue();
      };
    });
  }

  async function findPartyRecord(name, worldName = '') {
    const wantedName = String(name || '').trim().toLocaleLowerCase('zh-CN');
    const wantedWorld = String(worldName || '').trim();
    if (!wantedName) return null;
    const items = await partyHistory(5000);
    const matches = items.filter((item) => String(item.name || '').trim().toLocaleLowerCase('zh-CN') === wantedName);
    if (!matches.length) return null;
    if (wantedWorld) {
      const exactWorld = matches.find((item) => String(item.worldName || '').trim() === wantedWorld);
      if (exactWorld) return exactWorld;
    }
    return matches[0];
  }


  async function readStoreAll(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function counts() {
    const db = await openDB();
    const names = [STORE, PARTY_STORE, PARTY_ENCOUNTER_STORE];
    const result = {};
    await Promise.all(names.map((name) => new Promise((resolve, reject) => {
      const tx = db.transaction(name, 'readonly');
      const req = tx.objectStore(name).count();
      req.onsuccess = () => { result[name] = req.result || 0; resolve(); };
      req.onerror = () => reject(req.error);
    })));
    return {
      messages: result[STORE] || 0,
      partyPlayers: result[PARTY_STORE] || 0,
      partyEncounters: result[PARTY_ENCOUNTER_STORE] || 0,
    };
  }

  async function exportAll(extra = {}) {
    const [messages, partyHistoryData, partyEncounterData] = await Promise.all([
      readStoreAll(STORE),
      readStoreAll(PARTY_STORE),
      readStoreAll(PARTY_ENCOUNTER_STORE),
    ]);
    return {
      format: 'FF14ChatOverlayBackup',
      schemaVersion: BACKUP_SCHEMA,
      exportedAt: new Date().toISOString(),
      dbName: DB_NAME,
      dbVersion: DB_VERSION,
      messages,
      partyHistory: partyHistoryData,
      partyEncounters: partyEncounterData,
      ...extra,
    };
  }

  function asArray(value) { return Array.isArray(value) ? value : []; }

  async function importAll(backup, { replace = true } = {}) {
    if (!backup || backup.format !== 'FF14ChatOverlayBackup') {
      throw new Error('不是有效的 FF14 Chat Overlay 备份文件');
    }
    const db = await openDB();
    const messages = asArray(backup.messages);
    const history = asArray(backup.partyHistory);
    const encounters = asArray(backup.partyEncounters);

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE, PARTY_STORE, PARTY_ENCOUNTER_STORE], 'readwrite');
      const messageStore = tx.objectStore(STORE);
      const historyStore = tx.objectStore(PARTY_STORE);
      const encounterStore = tx.objectStore(PARTY_ENCOUNTER_STORE);

      if (replace) {
        messageStore.clear();
        historyStore.clear();
        encounterStore.clear();
      }

      for (const item of messages) {
        if (item && typeof item === 'object') messageStore.put(item);
      }
      for (const item of history) {
        if (item && typeof item === 'object' && item.key) historyStore.put(item);
      }
      for (const item of encounters) {
        if (item && typeof item === 'object' && item.partyKey) encounterStore.put(item);
      }

      tx.oncomplete = () => resolve({ messages: messages.length, partyHistory: history.length, partyEncounters: encounters.length });
      tx.onerror = () => reject(tx.error || new Error('导入数据库失败'));
      tx.onabort = () => reject(tx.error || new Error('导入数据库已中止'));
    });
  }

  window.FF14Storage = {
    openDB, add, recent, messagesForDate, monthDateCounts, localDateRange, clear, trim,
    partyKey, recordPartyEncounter, partyHistory, partyEncounters, findPartyRecord,
    counts, exportAll, importAll,
    MAX_MESSAGES, LOAD_LIMIT, DB_NAME, DB_VERSION,
  };
})();
