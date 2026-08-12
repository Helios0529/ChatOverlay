(() => {
  'use strict';

  // Base chat types follow FFXIV XivChatType values.
  // colorSetting points to the user-facing color bucket used by V0.3.
  const CHANNELS = {
    10:  { key: 'say',      group: 'public',   name: '说话',       color: '#FFFFFF', colorSetting: 'say' },
    11:  { key: 'shout',    group: 'public',   name: '喊话',       color: '#FF8A5B', colorSetting: 'shout' },
    12:  { key: 'tellOut',  group: 'tell',     name: '私聊 →',     color: '#FF82C5', colorSetting: 'tell' },
    13:  { key: 'tellIn',   group: 'tell',     name: '私聊 ←',     color: '#FF82C5', colorSetting: 'tell' },
    14:  { key: 'party',    group: 'party',    name: '小队',       color: '#68A7FF', colorSetting: 'party' },
    15:  { key: 'alliance', group: 'alliance', name: '团队',       color: '#FF936C', colorSetting: 'alliance' },
    16:  { key: 'ls1',      group: 'ls',       name: '通讯贝1',     color: '#70D68B', colorSetting: 'ls1' },
    17:  { key: 'ls2',      group: 'ls',       name: '通讯贝2',     color: '#70D68B', colorSetting: 'ls2' },
    18:  { key: 'ls3',      group: 'ls',       name: '通讯贝3',     color: '#70D68B', colorSetting: 'ls3' },
    19:  { key: 'ls4',      group: 'ls',       name: '通讯贝4',     color: '#70D68B', colorSetting: 'ls4' },
    20:  { key: 'ls5',      group: 'ls',       name: '通讯贝5',     color: '#70D68B', colorSetting: 'ls5' },
    21:  { key: 'ls6',      group: 'ls',       name: '通讯贝6',     color: '#70D68B', colorSetting: 'ls6' },
    22:  { key: 'ls7',      group: 'ls',       name: '通讯贝7',     color: '#70D68B', colorSetting: 'ls7' },
    23:  { key: 'ls8',      group: 'ls',       name: '通讯贝8',     color: '#70D68B', colorSetting: 'ls8' },
    24:  { key: 'fc',       group: 'fc',       name: '部队',       color: '#61D7FF', colorSetting: 'fc' },
    27:  { key: 'novice',   group: 'novice',   name: '新人频道',   color: '#D7AA6A', colorSetting: 'novice' },
    28:  { key: 'emoteC',   group: 'emote',    name: '情感动作',   color: '#CFA882', colorSetting: 'emote' },
    29:  { key: 'emoteS',   group: 'emote',    name: '情感动作',   color: '#CFA882', colorSetting: 'emote' },
    30:  { key: 'yell',     group: 'public',   name: '呼喊',       color: '#FFE35C', colorSetting: 'yell' },
    32:  { key: 'crossParty', group: 'party',  name: '跨界小队',   color: '#68A7FF', colorSetting: 'party' },
    36:  { key: 'pvp',      group: 'pvp',      name: 'PvP',        color: '#E9B174', colorSetting: 'pvp' },
    37:  { key: 'cwls1',    group: 'cwls',     name: '跨服贝1',     color: '#8DB7FF', colorSetting: 'cwls1' },
    56:  { key: 'echo',     group: 'echo',     name: 'Echo',       color: '#B8B8B8', colorSetting: 'echo' },
    61:  { key: 'npc',      group: 'npc',      name: 'NPC',        color: '#E5D39A', colorSetting: 'npc' },
    101: { key: 'cwls2',    group: 'cwls',     name: '跨服贝2',     color: '#8DB7FF', colorSetting: 'cwls2' },
    102: { key: 'cwls3',    group: 'cwls',     name: '跨服贝3',     color: '#8DB7FF', colorSetting: 'cwls3' },
    103: { key: 'cwls4',    group: 'cwls',     name: '跨服贝4',     color: '#8DB7FF', colorSetting: 'cwls4' },
    104: { key: 'cwls5',    group: 'cwls',     name: '跨服贝5',     color: '#8DB7FF', colorSetting: 'cwls5' },
    105: { key: 'cwls6',    group: 'cwls',     name: '跨服贝6',     color: '#8DB7FF', colorSetting: 'cwls6' },
    106: { key: 'cwls7',    group: 'cwls',     name: '跨服贝7',     color: '#8DB7FF', colorSetting: 'cwls7' },
    107: { key: 'cwls8',    group: 'cwls',     name: '跨服贝8',     color: '#8DB7FF', colorSetting: 'cwls8' },
  };

  const TABS = [
    { key: 'all',      name: '全部' },
    { key: 'party',    name: '小队' },
    { key: 'alliance', name: '团队' },
    { key: 'fc',       name: '部队' },
    { key: 'tell',     name: '私聊' },
    { key: 'ls',       name: '通讯贝' },
    { key: 'cwls',     name: '跨服贝' },
    { key: 'public',   name: '公共' },
    { key: 'novice',   name: '新人' },
  ];


  const TAB_MAP = Object.fromEntries(TABS.map((entry) => [entry.key, entry]));

  // Options exposed to the custom-category editor. A filter option can map to
  // one or more exact channel keys (e.g. "小队" includes local + cross-world party).
  const FILTER_OPTIONS = [
    { key: 'say',      name: '说话',       channelKeys: ['say'] },
    { key: 'shout',    name: '喊话',       channelKeys: ['shout'] },
    { key: 'yell',     name: '呼喊',       channelKeys: ['yell'] },
    { key: 'tell',     name: '私聊',       channelKeys: ['tellIn', 'tellOut'] },
    { key: 'party',    name: '小队',       channelKeys: ['party', 'crossParty'] },
    { key: 'alliance', name: '团队',       channelKeys: ['alliance'] },
    { key: 'fc',       name: '部队',       channelKeys: ['fc'] },
    { key: 'ls1',      name: '通讯贝1',    channelKeys: ['ls1'] },
    { key: 'ls2',      name: '通讯贝2',    channelKeys: ['ls2'] },
    { key: 'ls3',      name: '通讯贝3',    channelKeys: ['ls3'] },
    { key: 'ls4',      name: '通讯贝4',    channelKeys: ['ls4'] },
    { key: 'ls5',      name: '通讯贝5',    channelKeys: ['ls5'] },
    { key: 'ls6',      name: '通讯贝6',    channelKeys: ['ls6'] },
    { key: 'ls7',      name: '通讯贝7',    channelKeys: ['ls7'] },
    { key: 'ls8',      name: '通讯贝8',    channelKeys: ['ls8'] },
    { key: 'cwls1',    name: '跨服贝1',    channelKeys: ['cwls1'] },
    { key: 'cwls2',    name: '跨服贝2',    channelKeys: ['cwls2'] },
    { key: 'cwls3',    name: '跨服贝3',    channelKeys: ['cwls3'] },
    { key: 'cwls4',    name: '跨服贝4',    channelKeys: ['cwls4'] },
    { key: 'cwls5',    name: '跨服贝5',    channelKeys: ['cwls5'] },
    { key: 'cwls6',    name: '跨服贝6',    channelKeys: ['cwls6'] },
    { key: 'cwls7',    name: '跨服贝7',    channelKeys: ['cwls7'] },
    { key: 'cwls8',    name: '跨服贝8',    channelKeys: ['cwls8'] },
    { key: 'novice',   name: '新人频道',   channelKeys: ['novice'] },
    { key: 'emote',    name: '情感动作',   channelKeys: ['emoteC', 'emoteS'] },
    { key: 'pvp',      name: 'PvP',        channelKeys: ['pvp'] },
    { key: 'echo',     name: '默语',       channelKeys: ['echo'] },
    { key: 'npc',      name: 'NPC',        channelKeys: ['npc'] },
  ];

  const FILTER_OPTION_MAP = Object.fromEntries(FILTER_OPTIONS.map((entry) => [entry.key, entry]));

  function channelKeysForFilterKeys(filterKeys) {
    const keys = new Set();
    for (const filterKey of Array.isArray(filterKeys) ? filterKeys : []) {
      const option = FILTER_OPTION_MAP[filterKey];
      if (!option) continue;
      for (const channelKey of option.channelKeys) keys.add(channelKey);
    }
    return keys;
  }

  // One user-configurable message color per meaningful chat category.
  // V0.6 gives every LS/CWLS slot its own color bucket.
  const COLOR_SETTINGS = [
    { key: 'say',      name: '说话',     defaultColor: '#FFFFFF' },
    { key: 'shout',    name: '喊话',     defaultColor: '#FF8A5B' },
    { key: 'yell',     name: '呼喊',     defaultColor: '#FFE35C' },
    { key: 'tell',     name: '私聊',     defaultColor: '#FF82C5' },
    { key: 'party',    name: '小队',     defaultColor: '#68A7FF' },
    { key: 'alliance', name: '团队',     defaultColor: '#FF936C' },
    { key: 'fc',       name: '部队',     defaultColor: '#61D7FF' },
    { key: 'ls1',      name: '通讯贝1',  defaultColor: '#70D68B' },
    { key: 'ls2',      name: '通讯贝2',  defaultColor: '#70D68B' },
    { key: 'ls3',      name: '通讯贝3',  defaultColor: '#70D68B' },
    { key: 'ls4',      name: '通讯贝4',  defaultColor: '#70D68B' },
    { key: 'ls5',      name: '通讯贝5',  defaultColor: '#70D68B' },
    { key: 'ls6',      name: '通讯贝6',  defaultColor: '#70D68B' },
    { key: 'ls7',      name: '通讯贝7',  defaultColor: '#70D68B' },
    { key: 'ls8',      name: '通讯贝8',  defaultColor: '#70D68B' },
    { key: 'cwls1',    name: '跨服贝1',  defaultColor: '#8DB7FF' },
    { key: 'cwls2',    name: '跨服贝2',  defaultColor: '#8DB7FF' },
    { key: 'cwls3',    name: '跨服贝3',  defaultColor: '#8DB7FF' },
    { key: 'cwls4',    name: '跨服贝4',  defaultColor: '#8DB7FF' },
    { key: 'cwls5',    name: '跨服贝5',  defaultColor: '#8DB7FF' },
    { key: 'cwls6',    name: '跨服贝6',  defaultColor: '#8DB7FF' },
    { key: 'cwls7',    name: '跨服贝7',  defaultColor: '#8DB7FF' },
    { key: 'cwls8',    name: '跨服贝8',  defaultColor: '#8DB7FF' },
    { key: 'novice',   name: '新人频道', defaultColor: '#D7AA6A' },
    { key: 'emote',    name: '情感动作', defaultColor: '#CFA882' },
    { key: 'pvp',      name: 'PvP',      defaultColor: '#E9B174' },
    { key: 'echo',     name: '默语',     defaultColor: '#B8B8B8' },
    { key: 'npc',      name: 'NPC',      defaultColor: '#E5D39A' },
  ];

  const DEFAULT_CHANNEL_COLORS = Object.fromEntries(
    COLOR_SETTINGS.map((entry) => [entry.key, entry.defaultColor])
  );

  function parseChatCode(codeText) {
    if (codeText === undefined || codeText === null) return null;
    const text = String(codeText).trim();
    if (!text) return null;

    // ACT chat codes are commonly represented as four hex digits (e.g. 000E).
    // Keep only the low byte/type value so optional high-byte flags do not break grouping.
    const parsed = /^[0-9a-f]+$/i.test(text) ? parseInt(text, 16) : Number(text);
    if (!Number.isFinite(parsed)) return null;
    return parsed & 0xFF;
  }

  function getChannel(codeText) {
    const value = parseChatCode(codeText);
    return value === null ? null : (CHANNELS[value] || null);
  }

  window.FF14Channels = {
    CHANNELS,
    TABS,
    TAB_MAP,
    FILTER_OPTIONS,
    FILTER_OPTION_MAP,
    COLOR_SETTINGS,
    DEFAULT_CHANNEL_COLORS,
    parseChatCode,
    getChannel,
    channelKeysForFilterKeys,
  };
})();
