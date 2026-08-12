(() => {
  'use strict';

  // Local World row-id -> display-name mapping for the CN client.
  // Kept local so the overlay never needs a web request at runtime.
  const WORLD_NAMES = new Map([
    // Older CN world rows still seen by some ACT/game-data paths.
    [160, '陆行鸟s-bella'],
    [161, '陆行鸟'],
    [165, '陆行鸟s-guttata'],
    [166, '莫古力'],
    [168, '鲶鱼精'],
    [186, '莫古力s-cucullatus'],
    [187, '豆豆柴s-bicolor'],
    [190, '豆豆柴'],

    // Current CN world rows from the game World sheet.
    [1044, '幻影群岛'],
    [1045, '摩杜纳'],
    [1060, '萌芽池'],
    [1076, '白金幻象'],
    [1081, '神意之地'],
    [1106, '静语庄园'],
    [1113, '旅人栈桥'],
    [1121, '拂晓之间'],
    [1166, '龙巢神殿'],
    [1167, '红玉海'],
    [1169, '延夏'],
    [1170, '潮风亭'],
    [1171, '神拳痕'],
    [1172, '白银乡'],
    [1173, '宇宙和音'],
    [1174, '沃仙曦染'],
    [1175, '晨曦王座'],
    [1176, '梦羽宝境'],
    [1177, '海猫茶屋'],
    [1178, '柔风海湾'],
    [1179, '琥珀原'],
    [1180, '太阳海岸'],
    [1183, '银泪湖'],
    [1186, '伊修加德'],
    [1192, '水晶塔'],
    [1200, '亚马乌罗提'],
    [1201, '红茶川'],
  ]);

  // ACT CN chat logs can concatenate a player's world directly onto the name,
  // e.g. “十六夜晴天红玉海”. Build a longest-first suffix list so this can be
  // reconstructed locally as “十六夜晴天 + 红玉海（小号后缀）”. Internal s-* rows are excluded.
  const PUBLIC_WORLD_NAMES = [...new Set([...WORLD_NAMES.values()])]
    .filter((name) => name && !name.includes('s-'))
    .sort((a, b) => b.length - a.length);

  function normalizeWorldId(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const text = String(value ?? '').trim();
    if (!text) return null;
    const parsed = /^0x/i.test(text) ? parseInt(text, 16) : parseInt(text, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function getWorldName(worldId) {
    const id = normalizeWorldId(worldId);
    if (id === null) return '';
    return WORLD_NAMES.get(id) || '';
  }

  function splitKnownWorldSuffix(value) {
    const text = String(value ?? '').trim();
    if (!text) return null;

    for (const world of PUBLIC_WORLD_NAMES) {
      if (!text.endsWith(world)) continue;
      const name = text.slice(0, text.length - world.length).trim();
      // A world-only sender is not a player name; avoid producing an empty name.
      if (!name) continue;
      return { senderName: name, senderWorld: world };
    }
    return null;
  }

  window.FF14Worlds = {
    WORLD_NAMES,
    PUBLIC_WORLD_NAMES,
    normalizeWorldId,
    getWorldName,
    splitKnownWorldSuffix,
  };
})();
