(() => {
  'use strict';

  let insertCount = 0;
  let latestParty = [];
  let primaryReady = false;
  let currentPartyKeys = new Set();
  let pendingPartyClearTimer = null;

  async function persistAndShow(message) {
    try {
      if (window.FF14Roster?.enrich) message = window.FF14Roster.enrich(message);
      const id = await window.FF14Storage.add(message);
      message.id = id;
      window.FF14UI.addMessage(message);
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

    // PartyChanged is also emitted around zone changes. Some setups briefly send
    // an empty party while loading. Delay clearing the current-session set so a
    // short zone transition does not count the same teammates again.
    if (nextKeys.size === 0 && currentPartyKeys.size > 0) {
      clearTimeout(pendingPartyClearTimer);
      pendingPartyClearTimer = setTimeout(() => {
        currentPartyKeys = new Set();
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
        await window.FF14Storage.recordPartyEncounter(member);
      } catch (error) {
        console.error('[FF14ChatOverlay] party encounter save failed:', error);
      }
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
      window.FF14UI.showPlayerDetail(displayRecord, encounters);
    } catch (error) {
      console.error('[FF14ChatOverlay] player detail load failed:', error);
      window.FF14UI.showPlayerDetail({ name, worldName, encounterCount: 0 }, []);
    }
  }

  async function init() {
    window.FF14UI.init({
      onClear: clearMessages,
      onOpenPartyHistory: openPartyHistory,
      onPlayerDetail: openPlayerDetail,
      onSelectChatDate: (dateKey) => window.FF14Storage.messagesForDate(dateKey),
      onLoadCalendarMonth: (year, monthIndex) => window.FF14Storage.monthDateCounts(year, monthIndex),
    });
    window.FF14UI.setStatus('连接 Overlay…', 'connecting');

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
      const parsed = window.FF14Parser.parseLogLine(event);
      if (!parsed) return;
      persistAndShow(parsed);
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
      if (changedCharacter) currentPartyKeys = new Set();

      if (primaryReady && latestParty.length) recordPartySnapshot(latestParty);
      window.FF14UI.refreshMetadata?.();
      window.FF14UI.setStatus('Overlay 已连接', 'connected');
    });

    window.addEventListener('ff14overlayconnected', () => {
      window.FF14UI.setStatus('Overlay 已连接', 'connected');
    });

    startOverlayEvents();

    setTimeout(() => {
      if (!window.OverlayPluginApi) {
        window.FF14UI.setStatus('浏览器预览', 'preview');
      }
    }, 1800);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
