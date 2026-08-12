(() => {
  'use strict';

  const DB_NAME = 'FF14ChatOverlayDB';
  const DB_VERSION = 4;
  const STORE = 'messages';
  const PARTY_STORE = 'party_history';
  const PARTY_ENCOUNTER_STORE = 'party_encounters';
  const PLAYER_DAILY_STORE = 'player_daily_encounters';
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
        if (!db.objectStoreNames.contains(PLAYER_DAILY_STORE)) {
          const dailyStore = db.createObjectStore(PLAYER_DAILY_STORE, { keyPath: 'key' });
          dailyStore.createIndex('dateKey', 'dateKey', { unique: false });
          dailyStore.createIndex('playerKey', 'playerKey', { unique: false });
          dailyStore.createIndex('name', 'name', { unique: false });
          dailyStore.createIndex('lastSeenAt', 'lastSeenAt', { unique: false });
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
  function normalizeEncounterZone(zone, seenAt = '') {
    const rawZoneId = String(zone?.zoneId || zone?.id || '').trim();
    const zoneId = window.FF14Zones?.normalizeId?.(rawZoneId) || rawZoneId;
    const suppliedName = String(zone?.zoneName || zone?.name || '').trim();
    const zoneName = window.FF14Zones?.resolve?.(zoneId, suppliedName) || suppliedName;
    if (!zoneId && !zoneName) return null;
    return {
      zoneId,
      zoneName,
      enteredAt: String(zone?.seenAt || seenAt || '').trim() || new Date().toISOString(),
    };
  }

  // Summary + detailed encounter are committed together. The encounter also
  // remembers the map/instance in which the party session was observed.
  async function recordPartyEncounter(member, seenAt = '', zone = null) {
    const name = String(member?.name || '').trim();
    if (!name) return null;
    const db = await openDB();
    const now = seenAt || new Date().toISOString();
    const key = partyKey(member);
    const initialZone = normalizeEncounterZone(zone, now);

    return new Promise((resolve, reject) => {
      const tx = db.transaction([PARTY_STORE, PARTY_ENCOUNTER_STORE], 'readwrite');
      const summaryStore = tx.objectStore(PARTY_STORE);
      const encounterStore = tx.objectStore(PARTY_ENCOUNTER_STORE);
      const getReq = summaryStore.get(key);

      let record = null;
      let encounterId = null;
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
        const detail = {
          partyKey: key,
          name,
          worldId: record.worldId,
          worldName: record.worldName,
          seenAt: now,
          actorId: member.id || '',
          job: member.job ?? '',
          zoneId: initialZone?.zoneId || '',
          zoneName: initialZone?.zoneName || '',
          locations: initialZone ? [initialZone] : [],
        };
        const addReq = encounterStore.add(detail);
        addReq.onsuccess = () => { encounterId = addReq.result; };
        addReq.onerror = () => reject(addReq.error);
      };

      tx.oncomplete = () => resolve({ ...record, encounterId });
      tx.onerror = () => reject(tx.error || new Error('party encounter transaction failed'));
      tx.onabort = () => reject(tx.error || new Error('party encounter transaction aborted'));
    });
  }

  async function appendPartyEncounterLocation(encounterId, zone, seenAt = '') {
    if (encounterId == null) return null;
    const next = normalizeEncounterZone(zone, seenAt);
    if (!next) return null;
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(PARTY_ENCOUNTER_STORE, 'readwrite');
      const store = tx.objectStore(PARTY_ENCOUNTER_STORE);
      const getReq = store.get(encounterId);
      let result = null;

      getReq.onerror = () => reject(getReq.error);
      getReq.onsuccess = () => {
        const record = getReq.result;
        if (!record) { result = null; return; }
        const locations = Array.isArray(record.locations) ? [...record.locations] : [];
        const last = locations.length ? locations[locations.length - 1] : null;
        const sameZone = Boolean(
          last &&
          ((next.zoneId && last.zoneId && next.zoneId === last.zoneId) ||
           (!next.zoneId && !last.zoneId && next.zoneName && next.zoneName === last.zoneName))
        );

        if (sameZone) {
          // ChangeZone only carries the id, while the 01 log line also carries
          // the human-readable name. Merge the two instead of adding a duplicate.
          locations[locations.length - 1] = {
            ...last,
            zoneId: next.zoneId || last.zoneId || '',
            zoneName: next.zoneName || last.zoneName || '',
            enteredAt: last.enteredAt || next.enteredAt,
          };
        } else {
          locations.push(next);
        }

        const latest = locations[locations.length - 1] || next;
        result = {
          ...record,
          zoneId: latest.zoneId || '',
          zoneName: latest.zoneName || '',
          locations,
        };
        store.put(result);
      };
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error || new Error('party encounter location transaction failed'));
      tx.onabort = () => reject(tx.error || new Error('party encounter location transaction aborted'));
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


  const HUMAN_CHAT_GROUPS = new Set(['public', 'tell', 'party', 'alliance', 'ls', 'fc', 'novice', 'pvp', 'cwls']);

  function normalizedPlayerName(value) {
    return String(value || '').trim();
  }

  function normalizedWorldName(value) {
    return String(value || '').trim();
  }

  function playerDailyKey(player) {
    const name = normalizedPlayerName(player?.name || player?.senderName || player?.sender);
    const world = normalizedWorldName(player?.worldName || player?.senderWorld);
    return `${name.toLocaleLowerCase('zh-CN')}|${world.toLocaleLowerCase('zh-CN')}`;
  }

  function playerDayRecordKey(player, dateKey) {
    return `${playerDailyKey(player)}|${dateKey}`;
  }

  function isHumanChatMessage(message) {
    if (!message || !HUMAN_CHAT_GROUPS.has(String(message.group || ''))) return false;
    return Boolean(normalizedPlayerName(message.senderName || message.sender));
  }

  function normalizedSources(value) {
    return [...new Set((Array.isArray(value) ? value : [value]).map((x) => String(x || '').trim()).filter(Boolean))];
  }

  async function recordDailyPlayerEncounter(player, source = 'chat', seenAt = '') {
    const name = normalizedPlayerName(player?.name || player?.senderName || player?.sender);
    if (!name) return null;
    const timestamp = seenAt || player?.timestamp || new Date().toISOString();
    const date = new Date(timestamp);
    const dateKey = localDateKeyFromDate(date);
    if (!dateKey) return null;
    const worldName = normalizedWorldName(player?.worldName || player?.senderWorld);
    const worldId = player?.worldId || '';
    const playerKey = playerDailyKey({ name, worldName });
    const key = playerDayRecordKey({ name, worldName }, dateKey);
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(PLAYER_DAILY_STORE, 'readwrite');
      const store = tx.objectStore(PLAYER_DAILY_STORE);
      const getReq = store.get(key);
      let result = null;
      getReq.onerror = () => reject(getReq.error);
      getReq.onsuccess = () => {
        const prev = getReq.result || null;
        result = {
          key,
          playerKey,
          dateKey,
          name,
          worldName: worldName || prev?.worldName || '',
          worldId: worldId || prev?.worldId || '',
          firstSeenAt: prev?.firstSeenAt || timestamp,
          lastSeenAt: String(prev?.lastSeenAt || '').localeCompare(timestamp) > 0 ? prev.lastSeenAt : timestamp,
          sources: normalizedSources([...(prev?.sources || []), source]),
          actorId: player?.id || player?.actorId || prev?.actorId || '',
          job: player?.job ?? prev?.job ?? '',
        };
        store.put(result);
      };
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error || new Error('daily encounter transaction failed'));
      tx.onabort = () => reject(tx.error || new Error('daily encounter transaction aborted'));
    });
  }

  function mergeEncounterRecord(map, raw) {
    const name = normalizedPlayerName(raw?.name || raw?.senderName || raw?.sender);
    if (!name) return;
    const worldName = normalizedWorldName(raw?.worldName || raw?.senderWorld);
    const nameKey = name.toLocaleLowerCase('zh-CN');
    let key = `${nameKey}|${worldName.toLocaleLowerCase('zh-CN')}`;

    // If one source knows the world and another does not, merge the blank-world
    // record into the single known-world identity instead of showing duplicates.
    if (!worldName) {
      const sameNameKeys = [...map.keys()].filter((k) => k.startsWith(`${nameKey}|`));
      if (sameNameKeys.length === 1) key = sameNameKeys[0];
    } else {
      const blankKey = `${nameKey}|`;
      if (map.has(blankKey) && !map.has(key)) {
        const blank = map.get(blankKey);
        map.delete(blankKey);
        map.set(key, { ...blank, worldName });
      }
    }

    const prev = map.get(key) || null;
    const first = raw.firstSeenAt || raw.seenAt || raw.timestamp || '';
    const last = raw.lastSeenAt || raw.seenAt || raw.timestamp || first;
    const sources = normalizedSources([...(prev?.sources || []), ...(raw.sources || []), raw.source || '']);
    map.set(key, {
      playerKey: key,
      name: prev?.name || name,
      worldName: prev?.worldName || worldName,
      worldId: prev?.worldId || raw.worldId || '',
      dateKey: raw.dateKey || prev?.dateKey || localDateKeyFromDate(new Date(last || first)),
      firstSeenAt: !prev?.firstSeenAt || (first && first < prev.firstSeenAt) ? first : prev.firstSeenAt,
      lastSeenAt: !prev?.lastSeenAt || (last && last > prev.lastSeenAt) ? last : prev.lastSeenAt,
      sources,
      actorId: prev?.actorId || raw.actorId || raw.id || '',
      job: prev?.job ?? raw.job ?? '',
    });
  }

  function isExcludedName(name, excludeName) {
    const a = normalizedPlayerName(name).toLocaleLowerCase('zh-CN');
    const b = normalizedPlayerName(excludeName).toLocaleLowerCase('zh-CN');
    return Boolean(a && b && a === b);
  }

  async function dailyStoreForDate(dateKey) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PLAYER_DAILY_STORE, 'readonly');
      const index = tx.objectStore(PLAYER_DAILY_STORE).index('dateKey');
      const req = index.getAll(IDBKeyRange.only(dateKey));
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function partyEncountersForDate(dateKey) {
    const range = localDateRange(dateKey);
    if (!range) return [];
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PARTY_ENCOUNTER_STORE, 'readonly');
      const index = tx.objectStore(PARTY_ENCOUNTER_STORE).index('seenAt');
      const items = [];
      const req = index.openCursor(IDBKeyRange.bound(range.startISO, range.endISO, false, true), 'next');
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) { resolve(items); return; }
        items.push(cursor.value);
        cursor.continue();
      };
    });
  }

  async function dailyPlayersForDate(dateKey, { excludeName = '' } = {}) {
    const [saved, messages, party] = await Promise.all([
      dailyStoreForDate(dateKey),
      messagesForDate(dateKey),
      partyEncountersForDate(dateKey),
    ]);
    const map = new Map();
    for (const item of saved) {
      if (isExcludedName(item.name, excludeName)) continue;
      mergeEncounterRecord(map, item);
    }
    for (const message of messages) {
      if (!isHumanChatMessage(message)) continue;
      const name = normalizedPlayerName(message.senderName || message.sender);
      if (isExcludedName(name, excludeName)) continue;
      mergeEncounterRecord(map, {
        name,
        worldName: normalizedWorldName(message.senderWorld),
        dateKey,
        timestamp: message.timestamp,
        sources: ['chat'],
      });
    }
    for (const encounter of party) {
      if (isExcludedName(encounter.name, excludeName)) continue;
      mergeEncounterRecord(map, {
        ...encounter,
        dateKey,
        firstSeenAt: encounter.seenAt,
        lastSeenAt: encounter.seenAt,
        sources: ['party'],
      });
    }
    return [...map.values()].sort((a, b) => String(b.lastSeenAt || '').localeCompare(String(a.lastSeenAt || '')) || String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN'));
  }

  async function monthDailyPlayerCounts(year, monthIndex, { excludeName = '' } = {}) {
    const y = Number(year), m = Number(monthIndex);
    if (!Number.isInteger(y) || !Number.isInteger(m) || m < 0 || m > 11) return {};
    const start = new Date(y, m, 1, 0, 0, 0, 0);
    const end = new Date(y, m + 1, 1, 0, 0, 0, 0);
    const startISO = start.toISOString();
    const endISO = end.toISOString();
    const startKey = localDateKeyFromDate(start);
    const endKey = localDateKeyFromDate(end);
    const db = await openDB();

    const [saved, messages, party] = await Promise.all([
      new Promise((resolve, reject) => {
        const tx = db.transaction(PLAYER_DAILY_STORE, 'readonly');
        const index = tx.objectStore(PLAYER_DAILY_STORE).index('dateKey');
        const items = [];
        const req = index.openCursor(IDBKeyRange.bound(startKey, endKey, false, true), 'next');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const cursor = req.result;
          if (!cursor) { resolve(items); return; }
          items.push(cursor.value); cursor.continue();
        };
      }),
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const index = tx.objectStore(STORE).index('timestamp');
        const items = [];
        const req = index.openCursor(IDBKeyRange.bound(startISO, endISO, false, true), 'next');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const cursor = req.result;
          if (!cursor) { resolve(items); return; }
          items.push(cursor.value); cursor.continue();
        };
      }),
      new Promise((resolve, reject) => {
        const tx = db.transaction(PARTY_ENCOUNTER_STORE, 'readonly');
        const index = tx.objectStore(PARTY_ENCOUNTER_STORE).index('seenAt');
        const items = [];
        const req = index.openCursor(IDBKeyRange.bound(startISO, endISO, false, true), 'next');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const cursor = req.result;
          if (!cursor) { resolve(items); return; }
          items.push(cursor.value); cursor.continue();
        };
      }),
    ]);

    const dateMaps = new Map();
    const add = (dateKey, raw) => {
      if (!dateKey || isExcludedName(raw?.name || raw?.senderName || raw?.sender, excludeName)) return;
      let map = dateMaps.get(dateKey);
      if (!map) { map = new Map(); dateMaps.set(dateKey, map); }
      mergeEncounterRecord(map, { ...raw, dateKey });
    };
    for (const item of saved) add(item.dateKey, item);
    for (const message of messages) {
      if (!isHumanChatMessage(message)) continue;
      add(localDateKeyFromDate(new Date(message.timestamp)), {
        name: message.senderName || message.sender,
        worldName: message.senderWorld || '',
        timestamp: message.timestamp,
        sources: ['chat'],
      });
    }
    for (const encounter of party) {
      add(localDateKeyFromDate(new Date(encounter.seenAt)), {
        ...encounter,
        firstSeenAt: encounter.seenAt,
        lastSeenAt: encounter.seenAt,
        sources: ['party'],
      });
    }
    const counts = {};
    for (const [dateKey, map] of dateMaps.entries()) counts[dateKey] = map.size;
    return counts;
  }


  async function dailyPlayersForRange(startKey, endKey, { excludeName = '' } = {}) {
    let startRange = localDateRange(startKey);
    let endRange = localDateRange(endKey);
    if (!startRange || !endRange) return [];
    if (startKey > endKey) {
      const tempKey = startKey; startKey = endKey; endKey = tempKey;
      const tempRange = startRange; startRange = endRange; endRange = tempRange;
    }

    const db = await openDB();
    const startISO = startRange.startISO;
    const endISO = endRange.endISO;
    const endExclusiveKey = localDateKeyFromDate(endRange.end);

    const [saved, messages, party] = await Promise.all([
      new Promise((resolve, reject) => {
        const tx = db.transaction(PLAYER_DAILY_STORE, 'readonly');
        const index = tx.objectStore(PLAYER_DAILY_STORE).index('dateKey');
        const items = [];
        const req = index.openCursor(IDBKeyRange.bound(startKey, endExclusiveKey, false, true), 'next');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const cursor = req.result;
          if (!cursor) { resolve(items); return; }
          items.push(cursor.value);
          cursor.continue();
        };
      }),
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const index = tx.objectStore(STORE).index('timestamp');
        const items = [];
        const req = index.openCursor(IDBKeyRange.bound(startISO, endISO, false, true), 'next');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const cursor = req.result;
          if (!cursor) { resolve(items); return; }
          items.push(cursor.value);
          cursor.continue();
        };
      }),
      new Promise((resolve, reject) => {
        const tx = db.transaction(PARTY_ENCOUNTER_STORE, 'readonly');
        const index = tx.objectStore(PARTY_ENCOUNTER_STORE).index('seenAt');
        const items = [];
        const req = index.openCursor(IDBKeyRange.bound(startISO, endISO, false, true), 'next');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const cursor = req.result;
          if (!cursor) { resolve(items); return; }
          items.push(cursor.value);
          cursor.continue();
        };
      }),
    ]);

    const dateMaps = new Map();
    const add = (dateKey, raw) => {
      if (!dateKey || dateKey < startKey || dateKey > endKey) return;
      const candidateName = raw?.name || raw?.senderName || raw?.sender || '';
      if (isExcludedName(candidateName, excludeName)) return;
      let map = dateMaps.get(dateKey);
      if (!map) { map = new Map(); dateMaps.set(dateKey, map); }
      mergeEncounterRecord(map, { ...raw, dateKey });
    };

    for (const item of saved) add(item.dateKey, item);
    for (const message of messages) {
      if (!isHumanChatMessage(message)) continue;
      add(localDateKeyFromDate(new Date(message.timestamp)), {
        name: message.senderName || message.sender,
        worldName: message.senderWorld || '',
        timestamp: message.timestamp,
        sources: ['chat'],
      });
    }
    for (const encounter of party) {
      add(localDateKeyFromDate(new Date(encounter.seenAt)), {
        ...encounter,
        firstSeenAt: encounter.seenAt,
        lastSeenAt: encounter.seenAt,
        sources: ['party'],
      });
    }

    const items = [];
    for (const [dateKey, map] of dateMaps.entries()) {
      for (const value of map.values()) items.push({ ...value, dateKey });
    }
    return items.sort((a, b) => {
      const at = String(a.firstSeenAt || a.lastSeenAt || '');
      const bt = String(b.firstSeenAt || b.lastSeenAt || '');
      return at.localeCompare(bt)
        || String(a.dateKey || '').localeCompare(String(b.dateKey || ''))
        || String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN');
    });
  }


  async function playerDailyEncounters(name, worldName = '') {
    const wantedName = normalizedPlayerName(name);
    const wantedWorld = normalizedWorldName(worldName);
    if (!wantedName) return [];
    const db = await openDB();
    const dateMap = new Map();

    const mergeDate = (raw, source = '') => {
      const timestamp = raw?.lastSeenAt || raw?.seenAt || raw?.timestamp || raw?.firstSeenAt || '';
      const dateKey = raw?.dateKey || localDateKeyFromDate(new Date(timestamp));
      if (!dateKey) return;
      const rawWorld = normalizedWorldName(raw?.worldName || raw?.senderWorld);
      if (wantedWorld && rawWorld && rawWorld !== wantedWorld) return;
      const first = raw?.firstSeenAt || raw?.seenAt || raw?.timestamp || '';
      const last = raw?.lastSeenAt || raw?.seenAt || raw?.timestamp || first;
      const prev = dateMap.get(dateKey) || null;
      dateMap.set(dateKey, {
        dateKey,
        name: wantedName,
        worldName: wantedWorld || rawWorld || prev?.worldName || '',
        firstSeenAt: !prev?.firstSeenAt || (first && first < prev.firstSeenAt) ? first : prev.firstSeenAt,
        lastSeenAt: !prev?.lastSeenAt || (last && last > prev.lastSeenAt) ? last : prev.lastSeenAt,
        sources: normalizedSources([...(prev?.sources || []), ...(raw?.sources || []), source]),
      });
    };

    // New daily store.
    const saved = await new Promise((resolve, reject) => {
      const tx = db.transaction(PLAYER_DAILY_STORE, 'readonly');
      const store = tx.objectStore(PLAYER_DAILY_STORE);
      const req = store.index('name').getAll(IDBKeyRange.only(wantedName));
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    for (const item of saved) mergeDate(item);

    // Existing chat history, including records created before V1.0.6.
    const messageRows = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const index = tx.objectStore(STORE).index('sender');
      const req = index.getAll(IDBKeyRange.only(wantedName));
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    for (const message of messageRows) {
      if (!isHumanChatMessage(message)) continue;
      mergeDate(message, 'chat');
    }

    // Existing detailed party encounters.
    const partyRecord = await findPartyRecord(wantedName, wantedWorld);
    if (partyRecord?.key) {
      const encounters = await partyEncounters(partyRecord.key, 10000);
      for (const encounter of encounters) mergeDate(encounter, 'party');
    }

    return [...dateMap.values()].sort((a, b) => String(b.dateKey).localeCompare(String(a.dateKey)));
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
    const names = [STORE, PARTY_STORE, PARTY_ENCOUNTER_STORE, PLAYER_DAILY_STORE];
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
      dailyPlayerEncounters: result[PLAYER_DAILY_STORE] || 0,
    };
  }

  async function exportAll(extra = {}) {
    const [messages, partyHistoryData, partyEncounterData, dailyPlayerData] = await Promise.all([
      readStoreAll(STORE),
      readStoreAll(PARTY_STORE),
      readStoreAll(PARTY_ENCOUNTER_STORE),
      readStoreAll(PLAYER_DAILY_STORE),
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
      dailyPlayerEncounters: dailyPlayerData,
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
    const dailyPlayers = asArray(backup.dailyPlayerEncounters);

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE, PARTY_STORE, PARTY_ENCOUNTER_STORE, PLAYER_DAILY_STORE], 'readwrite');
      const messageStore = tx.objectStore(STORE);
      const historyStore = tx.objectStore(PARTY_STORE);
      const encounterStore = tx.objectStore(PARTY_ENCOUNTER_STORE);
      const dailyStore = tx.objectStore(PLAYER_DAILY_STORE);

      if (replace) {
        messageStore.clear();
        historyStore.clear();
        encounterStore.clear();
        dailyStore.clear();
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
      for (const item of dailyPlayers) {
        if (item && typeof item === 'object' && item.key) dailyStore.put(item);
      }

      tx.oncomplete = () => resolve({ messages: messages.length, partyHistory: history.length, partyEncounters: encounters.length, dailyPlayerEncounters: dailyPlayers.length });
      tx.onerror = () => reject(tx.error || new Error('导入数据库失败'));
      tx.onabort = () => reject(tx.error || new Error('导入数据库已中止'));
    });
  }

  window.FF14Storage = {
    openDB, add, recent, messagesForDate, monthDateCounts, localDateRange, clear, trim,
    partyKey, recordPartyEncounter, appendPartyEncounterLocation, partyHistory, partyEncounters, findPartyRecord,
    playerDailyKey, recordDailyPlayerEncounter, dailyPlayersForDate, dailyPlayersForRange, monthDailyPlayerCounts, playerDailyEncounters,
    counts, exportAll, importAll,
    MAX_MESSAGES, LOAD_LIMIT, DB_NAME, DB_VERSION,
  };
})();
