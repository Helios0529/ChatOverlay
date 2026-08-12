(() => {
  'use strict';

  // TerritoryType fallback names for common CN-client zones.
  // Runtime 01 ChangeZone log lines remain the preferred source because they
  // carry the exact localized zone name for dungeons, trials and newer areas.
  const STATIC_ZONE_NAMES = Object.freeze({
    '128': '利姆萨·罗敏萨上层甲板',
    '129': '利姆萨·罗敏萨下层甲板',
    '130': '乌尔达哈现世回廊',
    '131': '乌尔达哈来生回廊',
    '132': '格里达尼亚新街',
    '133': '格里达尼亚旧街',
    '134': '中拉诺西亚',
    '135': '拉诺西亚低地',
    '137': '东拉诺西亚',
    '138': '西拉诺西亚',
    '139': '拉诺西亚高地',
    '140': '西萨纳兰',
    '141': '中萨纳兰',
    '142': '日影地修炼所',
    '145': '东萨纳兰',
    '146': '南萨纳兰',
    '147': '北萨纳兰',
    '148': '黑衣森林中央林区',
    '152': '黑衣森林东部林区',
    '153': '黑衣森林南部林区',
    '154': '黑衣森林北部林区',
    '155': '库尔札斯中央高地',
    '156': '摩杜纳',
    '159': '放浪神古神殿',
    '171': '泽梅尔要塞',
    '172': '黄金谷',
    '397': '库尔札斯西部高地',
    '398': '龙堡参天高地',
    '399': '龙堡内陆低地',
    '400': '翻云雾海',
    '401': '阿巴拉提亚云海',
    '402': '魔大陆阿济兹拉',
    '418': '伊修加德基础层',
    '419': '伊修加德砥柱层',
    '478': '田园郡',
    '612': '基拉巴尼亚边区',
    '613': '红玉海',
    '614': '延夏',
    '620': '基拉巴尼亚山区',
    '621': '基拉巴尼亚湖区',
    '622': '太阳神草原',
    '628': '黄金港',
    '635': '神拳痕',
    '813': '雷克兰德',
    '814': '珂露西亚岛',
    '815': '安穆·艾兰',
    '816': '伊尔美格',
    '817': '拉凯提卡大森林',
    '818': '黑风海',
    '819': '水晶都',
    '820': '游末邦',
    '956': '迷津',
    '957': '萨维奈岛',
    '958': '加雷马',
    '959': '叹息海',
    '960': '天外天垓',
    '961': '厄尔庇斯',
    '962': '旧萨雷安',
    '963': '拉札罕'
  });

  const STORAGE_KEY = 'ff14ChatOverlay.learnedZoneNames.v1';
  let learned = {};

  function normalizeId(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    // OverlayPlugin normally emits a decimal TerritoryType id. Accept 0x-prefixed
    // values as well so imported/older records still resolve correctly.
    if (/^0x[0-9a-f]+$/i.test(raw)) return String(parseInt(raw, 16));
    if (/^\d+$/.test(raw)) return String(Number(raw));
    return raw.toUpperCase();
  }

  function loadLearned() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) learned = parsed;
    } catch (_) {
      learned = {};
    }
  }

  function saveLearned() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(learned)); } catch (_) {}
  }

  function learn(zoneId, zoneName) {
    const id = normalizeId(zoneId);
    const name = String(zoneName || '').trim();
    if (!id || !name || /^区域\s*#?/i.test(name)) return name;
    if (learned[id] !== name) {
      learned[id] = name;
      saveLearned();
    }
    return name;
  }

  function resolve(zoneId, providedName = '') {
    const id = normalizeId(zoneId);
    const name = String(providedName || '').trim();
    if (name && !/^区域\s*#?/i.test(name)) {
      learn(id, name);
      return name;
    }
    return (id && (learned[id] || STATIC_ZONE_NAMES[id])) || '';
  }

  loadLearned();

  window.FF14Zones = {
    STATIC_ZONE_NAMES,
    normalizeId,
    resolve,
    learn,
  };
})();
