(() => {
  'use strict';

  // FFXIV uses private-use Unicode glyphs for its numeric icons. In fonts that do
  // not contain the game glyphs they appear as □, which is what V0.1 displayed.
  // Dalamud SeIconChar currently defines Number1..8 as E061..E068 and
  // BoxedNumber1..8 as E090..E097. Convert both ranges to normal ASCII digits.
  const PARTY_ORDER_ICONS = new Map([
    [0xE061, 1], [0xE062, 2], [0xE063, 3], [0xE064, 4],
    [0xE065, 5], [0xE066, 6], [0xE067, 7], [0xE068, 8],
    [0xE090, 1], [0xE091, 2], [0xE092, 3], [0xE093, 4],
    [0xE094, 5], [0xE095, 6], [0xE096, 7], [0xE097, 8],
    // ACT CN client currently exposes party list order as U+E0E1..U+E0E8.
    // Example observed in a real 00 log: U+E0E1 + player name = party slot 1.
    [0xE0E1, 1], [0xE0E2, 2], [0xE0E3, 3], [0xE0E4, 4],
    [0xE0E5, 5], [0xE0E6, 6], [0xE0E7, 7], [0xE0E8, 8],
  ]);

  const CROSS_WORLD_ICON = '\uE05D';


  // FFXIV also emits private-use glyphs inside chat text. Normal web fonts do not
  // contain these glyphs, so they render as missing-character boxes. U+E0BB is
  // the marker ACT currently exposes before linked/displayed item names.
  // Keep raw text separately and convert known glyphs to readable fallbacks.
  const GAME_TEXT_GLYPH_FALLBACKS = new Map([
    [0xE0BB, '◆'], // item/link marker
  ]);

  function normalizeGameText(text) {
    const value = String(text ?? '');
    let out = '';
    for (const ch of value) {
      const cp = ch.codePointAt(0);
      out += GAME_TEXT_GLYPH_FALLBACKS.get(cp) ?? ch;
    }
    return out;
  }

  function stripLeadingWhitespace(text) {
    return String(text ?? '').replace(/^\s+/, '');
  }

  function takeFirstCodePoint(text) {
    if (!text) return { codePoint: null, char: '', rest: '' };
    const codePoint = text.codePointAt(0);
    const char = String.fromCodePoint(codePoint);
    return { codePoint, char, rest: text.slice(char.length) };
  }

  function extractPartyOrder(text, group) {
    let value = stripLeadingWhitespace(text);
    if (group !== 'party' || !value) return { partyOrder: null, text: value };

    // Some ACT/CN log paths can duplicate the party-order private-use glyph.
    // Record the first valid order, then strip every consecutive party-order glyph
    // so the raw game glyph never leaks through as a □ after we render ①..⑧.
    let partyOrder = null;
    while (value) {
      const first = takeFirstCodePoint(value);
      const order = PARTY_ORDER_ICONS.get(first.codePoint) ?? null;
      if (order === null) break;
      if (partyOrder === null) partyOrder = order;
      value = stripLeadingWhitespace(first.rest);
    }

    return { partyOrder, text: value };
  }

  function splitWorldSuffix(text) {
    let value = String(text ?? '').trim();
    if (!value) return { senderName: '', senderWorld: '' };

    // Most reliable case: FFXIV cross-world icon sits between name and world.
    const iconIndex = value.indexOf(CROSS_WORLD_ICON);
    if (iconIndex > 0) {
      return {
        senderName: value.slice(0, iconIndex).trim(),
        senderWorld: value.slice(iconIndex + CROSS_WORLD_ICON.length).trim(),
      };
    }

    // Some log/render paths put the cross-world icon before the whole sender.
    // In that case the final whitespace-separated token is the world name.
    if (iconIndex === 0) {
      value = value.slice(CROSS_WORLD_ICON.length).trim();
      const lastSpace = value.lastIndexOf(' ');
      if (lastSpace > 0) {
        return {
          senderName: value.slice(0, lastSpace).trim(),
          senderWorld: value.slice(lastSpace + 1).trim(),
        };
      }
      return { senderName: value, senderWorld: '' };
    }

    // Common external/log-friendly forms.
    const atMatch = value.match(/^(.*?)[@＠]([^@＠]+)$/u);
    if (atMatch && atMatch[1].trim() && atMatch[2].trim()) {
      return { senderName: atMatch[1].trim(), senderWorld: atMatch[2].trim() };
    }

    const bracketMatch = value.match(/^(.*?)\s*[（(【\[]([^）)】\]]+)[）)】\]]$/u);
    if (bracketMatch && bracketMatch[1].trim() && bracketMatch[2].trim()) {
      return { senderName: bracketMatch[1].trim(), senderWorld: bracketMatch[2].trim() };
    }

    // CN ACT can concatenate world directly onto the player name with no icon,
    // separator, or whitespace: e.g. 十六夜晴天红玉海. Match against the
    // local CN World list and peel off only a known suffix.
    const knownWorld = window.FF14Worlds?.splitKnownWorldSuffix?.(value);
    if (knownWorld) return knownWorld;

    return { senderName: value, senderWorld: '' };
  }

  function parseSender(rawSender, group = '') {
    const original = String(rawSender ?? '').trim();
    const orderResult = extractPartyOrder(original, group);
    const worldResult = splitWorldSuffix(orderResult.text);

    // Remove every stray party-order glyph left immediately before the name.
    // This is intentionally repeated rather than stripping only one character:
    // some CN logs have been observed to expose the same marker twice.
    let senderName = worldResult.senderName;
    while (senderName) {
      const first = takeFirstCodePoint(senderName);
      if (!PARTY_ORDER_ICONS.has(first.codePoint)) break;
      senderName = stripLeadingWhitespace(first.rest);
    }

    return {
      senderRaw: original,
      senderName,
      senderWorld: worldResult.senderWorld,
      partyOrder: orderResult.partyOrder,
    };
  }

  function parseLogLine(event) {
    const line = event?.line;
    if (!Array.isArray(line) || line.length < 5) return null;
    if (String(line[0]).trim() !== '00') return null;

    const rawCode = String(line[2] ?? '').trim();
    const channel = window.FF14Channels.getChannel(rawCode);
    if (!channel) return null;

    const senderRaw = String(line[3] ?? '').trim();
    const messageRaw = String(line[4] ?? '').trim();
    const message = normalizeGameText(messageRaw);
    if (!senderRaw && !messageRaw) return null;

    const parsedSender = parseSender(senderRaw, channel.group);

    const timestampText = String(line[1] ?? '').trim();
    const date = new Date(timestampText);
    const timestamp = Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();

    return {
      timestamp,
      rawTimestamp: timestampText,
      channelCode: rawCode.toUpperCase(),
      channelKey: channel.key,
      group: channel.group,
      channelName: channel.name,
      channelColor: channel.color,
      colorSetting: channel.colorSetting || channel.key,
      // sender is kept for IndexedDB/search compatibility with V0.1.x.
      sender: parsedSender.senderName,
      senderRaw: parsedSender.senderRaw,
      senderName: parsedSender.senderName,
      senderWorld: parsedSender.senderWorld,
      partyOrder: parsedSender.partyOrder,
      messageRaw,
      message,
    };
  }

  window.FF14Parser = { parseLogLine, parseSender, normalizeGameText, GAME_TEXT_GLYPH_FALLBACKS, PARTY_ORDER_ICONS, CROSS_WORLD_ICON };
})();
