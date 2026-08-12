(() => {
  'use strict';

  let primaryPlayerName = '';
  let primaryPlayerId = '';
  const partyByName = new Map();

  function normalizeName(name) {
    const raw = String(name ?? '').trim();
    if (!raw) return '';
    if (window.FF14Parser?.parseSender) {
      return window.FF14Parser.parseSender(raw, 'party').senderName.trim();
    }
    return raw;
  }

  function nameKey(name) {
    return normalizeName(name).toLocaleLowerCase('zh-CN');
  }

  function setPrimaryPlayer(name, id = '') {
    primaryPlayerName = normalizeName(name);
    primaryPlayerId = String(id ?? '').toUpperCase();
  }

  function updateParty(party) {
    partyByName.clear();
    if (!Array.isArray(party)) return;

    for (const member of party) {
      if (!member) continue;
      const name = normalizeName(member.name);
      if (!name) continue;
      const worldId = window.FF14Worlds?.normalizeWorldId(member.worldId);
      const worldName = window.FF14Worlds?.getWorldName(member.worldId) || '';
      partyByName.set(nameKey(name), {
        name,
        worldId,
        worldName,
        id: member.id ?? '',
        job: member.job ?? '',
        inParty: member.inParty !== false,
      });
    }
  }

  function getMember(name) {
    return partyByName.get(nameKey(name)) || null;
  }

  function isPrimaryPlayer(name, id = '') {
    const idText = String(id ?? '').toUpperCase();
    if (primaryPlayerId && idText && primaryPlayerId === idText) return true;
    if (!primaryPlayerName) return false;
    return nameKey(name) === nameKey(primaryPlayerName);
  }

  function getPrimaryPlayerName() { return primaryPlayerName; }
  function getPrimaryPlayerId() { return primaryPlayerId; }

  function enrich(message) {
    if (!message) return message;

    const senderName = normalizeName(message.senderName || message.sender || '');
    if (!senderName) return message;

    // The user's own chat should never get a server suffix in this overlay.
    if (isPrimaryPlayer(senderName)) {
      return {
        ...message,
        senderName,
        sender: senderName,
        senderWorld: '',
      };
    }

    // A world explicitly present in the chat log is more authoritative than
    // party-memory data, so preserve it if we already parsed one.
    if (message.senderWorld) {
      return {
        ...message,
        senderName,
        sender: senderName,
      };
    }

    const member = getMember(senderName);
    if (!member?.worldName) {
      return {
        ...message,
        senderName,
        sender: senderName,
      };
    }

    return {
      ...message,
      senderName,
      sender: senderName,
      senderWorld: member.worldName,
      senderWorldId: member.worldId,
    };
  }

  function snapshot() {
    return {
      primaryPlayerName,
      primaryPlayerId,
      party: Array.from(partyByName.values()),
    };
  }

  window.FF14Roster = {
    setPrimaryPlayer,
    updateParty,
    getMember,
    isPrimaryPlayer,
    getPrimaryPlayerName,
    getPrimaryPlayerId,
    enrich,
    snapshot,
  };
})();
