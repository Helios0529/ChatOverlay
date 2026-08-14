(() => {
  'use strict';

  let insertCount = 0;
  let latestParty = [];
  let primaryReady = false;
  let currentPartyKeys = new Set();
  let pendingPartyClearTimer = null;
  let dailyEncounterSessionKeys = new Set();
  let midnightPartyTimer = null;
  let currentZone = { zoneId: '', zoneName: '', seenAt: '' };
  const activePartyEncounterIds = new Map();

  function localDateKey(timestamp = '') {
    const d = timestamp ? new Date(timestamp) : new Date();
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function normalizeZoneId(value) {
    if (window.FF14Zones?.normalizeId) return window.FF14Zones.normalizeId(value);
    const text = String(value ?? '').trim();
    if (!text) return '';
    return text.toUpperCase();
  }

  function zoneSnapshot() {
    return {
      zoneId: currentZone.zoneId || '',
      zoneName: currentZone.zoneName || '',
      seenAt: currentZone.seenAt || new Date().toISOString(),
    };
  }

  function parseZoneLogLine(event) {
    const line = Array.isArray(event?.line)
      ? event.line
      : String(event?.rawLine || '').split('|');
    if (!Array.isArray(line) || String(line[0] || '').toUpperCase() !== '01') return null;
    return {
      zoneId: normalizeZoneId(line[2]),
      zoneName: String(line[3] || '').trim(),
      seenAt: String(line[1] || '').trim() || new Date().toISOString(),
    };
  }

  async function applyZoneChange(next = {}) {
    const zoneId = normalizeZoneId(next.zoneId || next.id);
    const suppliedName = String(next.zoneName || next.name || '').trim();
    const zoneName = window.FF14Zones?.resolve?.(zoneId, suppliedName) || suppliedName;
    const seenAt = String(next.seenAt || '').trim() || new Date().toISOString();

    const sameId = Boolean(zoneId && currentZone.zoneId && zoneId === currentZone.zoneId);
    const mergedName = zoneName || (sameId ? currentZone.zoneName : '');
    const changed = Boolean(
      (zoneId && zoneId !== currentZone.zoneId) ||
      (mergedName && mergedName !== currentZone.zoneName)
    );

    currentZone = {
      zoneId: zoneId || currentZone.zoneId || '',
      zoneName: mergedName,
      seenAt,
    };

    if (!changed || activePartyEncounterIds.size === 0) return;
    const zone = zoneSnapshot();
    await Promise.all([...activePartyEncounterIds.values()].map((encounterId) =>
      window.FF14Storage.appendPartyEncounterLocation?.(encounterId, zone, seenAt)
        .catch((error) => console.error('[FF14ChatOverlay] encounter location update failed:', error))
    ));
  }

  function isPrimaryName(name) {
    return Boolean(window.FF14Roster?.isPrimaryPlayer?.(String(name || '').trim(), ''));
  }

  async function recordDailyEncounter(player, source, seenAt = '') {
    const name = String(player?.name || player?.senderName || player?.sender || '').trim();
    if (!name || isPrimaryName(name)) return;
    const dateKey = localDateKey(seenAt || player?.timestamp);
    const identity = window.FF14Storage.playerDailyKey?.({
      name,
      worldName: player?.worldName || player?.senderWorld || '',
    }) || name.toLocaleLowerCase('zh-CN');
    const guardKey = `${dateKey}|${identity}|${source}`;
    if (dailyEncounterSessionKeys.has(guardKey)) return;
    dailyEncounterSessionKeys.add(guardKey);
    try {
      await window.FF14Storage.recordDailyPlayerEncounter(player, source, seenAt || player?.timestamp || '');
    } catch (error) {
      dailyEncounterSessionKeys.delete(guardKey);
      console.error('[FF14ChatOverlay] daily encounter save failed:', error);
    }
  }

  async function recordDailyPartyMembers(party, seenAt = '') {
    if (!primaryReady || !Array.isArray(party)) return;
    const members = party.map(normalizePartyMember).filter(Boolean);
    await Promise.all(members.map((member) => recordDailyEncounter(member, 'party', seenAt)));
  }

  function scheduleMidnightPartyRefresh() {
    if (midnightPartyTimer) clearTimeout(midnightPartyTimer);
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5, 0);
    midnightPartyTimer = setTimeout(async () => {
      dailyEncounterSessionKeys = new Set();
      if (latestParty.length) await recordDailyPartyMembers(latestParty);
      scheduleMidnightPartyRefresh();
    }, Math.max(1000, next.getTime() - now.getTime()));
  }

  function shouldRecordChatSpeaker(message) {
    const humanGroups = new Set(['public', 'tell', 'party', 'alliance', 'ls', 'fc', 'novice', 'pvp', 'cwls']);
    return Boolean(message?.senderName && humanGroups.has(String(message.group || '')) && !isPrimaryName(message.senderName));
  }

  async function persistAndShow(message) {
    try {
      if (window.FF14Roster?.enrich) message = window.FF14Roster.enrich(message);
      const id = await window.FF14Storage.add(message);
      message.id = id;
      window.FF14UI.addMessage(message);
      if (shouldRecordChatSpeaker(message)) recordDailyEncounter(message, 'chat', message.timestamp);
      insertCount += 1;
      if (insertCount % 200 === 0) window.FF14Storage.trim().catch(console.error);
    } catch (error) {
      console.error('[FF14ChatOverlay] save failed:', error);
    }
  }

  async function clearMessages() {
    if (!window.confirm('确定清空本机保存的全部聊天记录吗？此操作不可恢复。')) return;
    await window.FF14Storage.clear();
    window.FF14UI.replaceMessages([]);
  }

  function normalizePartyMember(raw) {
    if (!raw || raw.inParty === false) return null;

    const parsed = window.FF14Parser.parseSender(String(raw.name || ''), 'party');
    const name = parsed.senderName || String(raw.name || '').trim();
    if (!name) return null;
    if (window.FF14Roster?.isPrimaryPlayer?.(name, raw.id)) return null;

    const worldId = window.FF14Worlds?.normalizeWorldId?.(raw.worldId) || '';
    const worldName = window.FF14Worlds?.getWorldName?.(raw.worldId) || parsed.senderWorld || '';
    const member = {
      name,
      worldId,
      worldName,
      id: raw.id || '',
      job: raw.job ?? '',
    };
    member.key = window.FF14Storage.partyKey(member);
    return member;
  }

  async function recordPartySnapshot(party) {
    if (!primaryReady || !Array.isArray(party)) return;

    const members = party.map(normalizePartyMember).filter(Boolean);
    const nextKeys = new Set(members.map((member) => member.key));
    await Promise.all(members.map((member) => recordDailyEncounter(member, 'party')));

    // PartyChanged is also emitted around zone changes. Some setups briefly send
    // an empty party while loading. Delay clearing the current-session set so a
    // short zone transition does not count the same teammates again.
    if (nextKeys.size === 0 && currentPartyKeys.size > 0) {
      clearTimeout(pendingPartyClearTimer);
      pendingPartyClearTimer = setTimeout(() => {
        currentPartyKeys = new Set();
        activePartyEncounterIds.clear();
        pendingPartyClearTimer = null;
      }, 5000);
      return;
    }

    if (pendingPartyClearTimer) {
      clearTimeout(pendingPartyClearTimer);
      pendingPartyClearTimer = null;
    }

    for (const member of members) {
      if (currentPartyKeys.has(member.key)) continue;
      try {
        const saved = await window.FF14Storage.recordPartyEncounter(member, '', zoneSnapshot());
        if (saved?.encounterId != null) activePartyEncounterIds.set(member.key, saved.encounterId);
      } catch (error) {
        console.error('[FF14ChatOverlay] party encounter save failed:', error);
      }
    }

    for (const key of [...activePartyEncounterIds.keys()]) {
      if (!nextKeys.has(key)) activePartyEncounterIds.delete(key);
    }
    currentPartyKeys = nextKeys;
  }

  async function openPartyHistory() {
    try {
      const records = await window.FF14Storage.partyHistory();
      window.FF14UI.showPartyHistory(records);
    } catch (error) {
      console.error('[FF14ChatOverlay] party history load failed:', error);
      window.FF14UI.showPartyHistory([]);
    }
  }


  async function openPlayerDetail({ name = '', worldName = '', record = null } = {}) {
    try {
      const resolved = record || await window.FF14Storage.findPartyRecord(name, worldName);
      const displayRecord = resolved || {
        key: '', name, worldName, encounterCount: 0, firstSeen: '', lastSeen: '',
      };
      const encounters = resolved?.key
        ? await window.FF14Storage.partyEncounters(resolved.key, 200)
        : [];
      const dailyEncounters = await window.FF14Storage.playerDailyEncounters(name || displayRecord.name, worldName || displayRecord.worldName);
      window.FF14UI.showPlayerDetail(displayRecord, encounters, dailyEncounters);
    } catch (error) {
      console.error('[FF14ChatOverlay] player detail load failed:', error);
      window.FF14UI.showPlayerDetail({ name, worldName, encounterCount: 0 }, [], []);
    }
  }

  async function init() {
    window.FF14UI.init({
      onClear: clearMessages,
      onOpenPartyHistory: openPartyHistory,
      onPlayerDetail: openPlayerDetail,
      onSelectChatDate: (dateKey) => window.FF14Storage.messagesForDate(dateKey),
      onLoadCalendarMonth: (year, monthIndex) => window.FF14Storage.monthDateCounts(year, monthIndex),
      onLoadDailyEncounterMonth: (year, monthIndex) => window.FF14Storage.monthDailyPlayerCounts(year, monthIndex, { excludeName: window.FF14Roster?.getPrimaryPlayerName?.() || '' }),
      onLoadDailyEncounterDate: (dateKey) => window.FF14Storage.dailyPlayersForDate(dateKey, { excludeName: window.FF14Roster?.getPrimaryPlayerName?.() || '' }),
      onLoadDailyEncounterRange: (startKey, endKey) => window.FF14Storage.dailyPlayersForRange(startKey, endKey, { excludeName: window.FF14Roster?.getPrimaryPlayerName?.() || '' }),
    });
    window.FF14UI.setGameConnectionStatus?.(false);

    try {
      await window.FF14Storage.openDB();
      await window.FF14Storage.trim();
      const selectedDate = window.FF14UI.getSelectedDate?.() || new Date().toISOString().slice(0, 10);
      const messages = await window.FF14Storage.messagesForDate(selectedDate);
      window.FF14UI.replaceMessages(messages);
    } catch (error) {
      console.error('[FF14ChatOverlay] IndexedDB init failed:', error);
    }

    addOverlayListener('PartyChanged', (event) => {
      latestParty = Array.isArray(event?.party) ? event.party : [];
      window.FF14Roster?.updateParty(latestParty);
      window.FF14UI.refreshMetadata?.();
      recordPartySnapshot(latestParty);
    });

    addOverlayListener('LogLine', (event) => {
      const zoneLine = parseZoneLogLine(event);
      if (zoneLine) {
        applyZoneChange(zoneLine);
        return;
      }
      const parsed = window.FF14Parser.parseLogLine(event);
      if (!parsed) return;
      persistAndShow(parsed);
    });

    addOverlayListener('ChangeZone', (event) => {
      applyZoneChange({
        zoneId: event?.zoneID || event?.zoneId || '',
        zoneName: event?.zoneName || event?.name || '',
        seenAt: new Date().toISOString(),
      });
    });

    addOverlayListener('ChangePrimaryPlayer', (event) => {
      const beforeName = window.FF14Roster?.getPrimaryPlayerName?.() || '';
      const beforeId = window.FF14Roster?.getPrimaryPlayerId?.() || '';
      const nextName = String(event?.charName || '');
      const nextId = String(event?.charID || '');

      window.FF14Roster?.setPrimaryPlayer(nextName, nextId);
      primaryReady = Boolean(nextName);

      const changedCharacter = Boolean(
        primaryReady &&
        ((beforeId && nextId && beforeId !== nextId.toUpperCase()) ||
         (beforeName && beforeName !== window.FF14Roster?.getPrimaryPlayerName?.()))
      );
      if (changedCharacter) { currentPartyKeys = new Set(); activePartyEncounterIds.clear(); dailyEncounterSessionKeys = new Set(); }

      if (primaryReady && latestParty.length) recordPartySnapshot(latestParty);
      window.FF14UI.refreshMetadata?.();
      window.FF14UI.setGameConnectionStatus?.(primaryReady, {
        name: window.FF14Roster?.getPrimaryPlayerName?.() || '',
        id: window.FF14Roster?.getPrimaryPlayerId?.() || '',
      });
    });

    window.addEventListener('ff14overlayconnected', () => {
      if (!primaryReady) window.FF14UI.setGameConnectionStatus?.(false);
    });

    scheduleMidnightPartyRefresh();
    startOverlayEvents();

    setTimeout(() => {
      if (!window.OverlayPluginApi) {
        window.FF14UI.setGameConnectionStatus?.(false);
      }
    }, 1800);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
