(() => {
  'use strict';

  // Complete TerritoryType mapping strategy:
  // 1) Exact zone name carried by ACT/OverlayPlugin 01 ChangeZone logs.
  // 2) Names learned locally from previous 01 logs.
  // 3) Complete CN TerritoryType map loaded from the generated FF14 map dataset.
  // 4) Small built-in fallback table so common zones still resolve if the remote
  //    dataset has not finished loading or is temporarily unavailable.
  //
  // The complete map is cached in localStorage after the first successful load,
  // so later starts can resolve all previously downloaded zone ids immediately.

  const STATIC_ZONE_NAMES = Object.freeze({
    '128': '利姆萨·罗敏萨上层甲板',
    '129': '利姆萨·罗敏萨下层甲板',
    '130': '乌尔达哈现世回廊',
    '131': '乌尔达哈来生回廊',
    '132': '格里达尼亚新街',
    '133': '格里达尼亚旧街',
    '134': '中拉诺西亚',
    '135': '拉诺西亚低地',
    '136': '海雾村',
    '137': '东拉诺西亚',
    '138': '西拉诺西亚',
    '139': '拉诺西亚高地',
    '140': '西萨纳兰',
    '141': '中萨纳兰',
    '142': '日影地修炼所',
    '144': '金碟游乐场',
    '145': '东萨纳兰',
    '146': '南萨纳兰',
    '147': '北萨纳兰',
    '148': '黑衣森林中央林区',
    '149': '狼狱演习场',
    '151': '暗之世界',
    '152': '黑衣森林东部林区',
    '153': '黑衣森林南部林区',
    '154': '黑衣森林北部林区',
    '155': '库尔札斯中央高地',
    '156': '摩杜纳',
    '159': '放浪神古神殿',
    '160': '天狼星灯塔',
    '167': '无限城古堡',
    '171': '泽梅尔要塞',
    '172': '黄金谷',
    '174': '古代人迷宫',
    '176': '陌迪翁牢狱',
    '177': '后桅旅店',
    '178': '沙钟旅亭',
    '179': '栖木旅馆',
    '180': '拉诺西亚外地',
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
    '963': '拉札罕',
    '1185': '图莱尤拉',
    '1186': '九号解决方案',
    '1187': '奥阔帕恰山',
    '1188': '克扎玛乌卡湿地',
    '1189': '亚克特尔树海',
    '1190': '夏劳尼荒野',
    '1191': '遗产之地',
    '1192': '活着的记忆',
    '1193': '沃刻佐莫山',
    '1194': '深空天坑',
    '1198': '先锋营',
    '1199': '亚历山德里亚',
    '1203': '仙人刺谷',
    '1204': '迷途鬼区',
    '1208': '创生设施',
    '1238': '另一个未来',
    '1242': '玉韦亚瓦塔',
    '1323': '极限格斗场',
    '1324': '霸王格斗场',
    '1326': '登天格斗场',
    '1328': '特雷诺',
    '1345': '克吕提俄斯魔导工厂',
    '1346': '新月岛北部',
    '1368': '温达斯：第三巡行',
    '1384': '星芒市场',
  });

  const LEARNED_STORAGE_KEY = 'ff14ChatOverlay.learnedZoneNames.v2';
  const FULL_MAP_STORAGE_KEY = 'ff14ChatOverlay.fullZoneNames.v1';
  const FULL_MAP_META_KEY = 'ff14ChatOverlay.fullZoneNamesMeta.v1';

  // Generated CN TerritoryType map. This source contains overworld maps,
  // dungeons, trials, raids, quest instances, housing areas, PvP areas, etc.
  const FULL_MAP_URL =
    'https://raw.githubusercontent.com/Souma-Sumire/ff14-overlay-vue/main/src/resources/generated/map.json';

  // Refresh at most once every 7 days. Cached data is still used immediately.
  const REFRESH_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

  let learned = {};
  let fullZoneNames = {};
  let fullMapReady = false;
  let fullMapSource = 'builtin';

  function normalizeId(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    if (/^0x[0-9a-f]+$/i.test(raw)) return String(parseInt(raw, 16));
    if (/^\d+$/.test(raw)) return String(Number(raw));
    return raw.toUpperCase();
  }

  function safeReadJson(key, fallback = {}) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch (_) {}
    return fallback;
  }

  function safeWriteJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  function loadLearned() {
    learned = safeReadJson(LEARNED_STORAGE_KEY, {});
  }

  function loadCachedFullMap() {
    const cached = safeReadJson(FULL_MAP_STORAGE_KEY, {});
    if (Object.keys(cached).length) {
      fullZoneNames = cached;
      fullMapReady = true;
      fullMapSource = 'cache';
    }
  }

  function saveLearned() {
    safeWriteJson(LEARNED_STORAGE_KEY, learned);
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

    // ACT 01 logs are the most accurate source for the current client locale.
    if (name && !/^区域\s*#?/i.test(name)) {
      learn(id, name);
      return name;
    }

    return (
      (id && learned[id]) ||
      (id && fullZoneNames[id]) ||
      (id && STATIC_ZONE_NAMES[id]) ||
      ''
    );
  }

  function extractChineseNames(raw) {
    const result = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;

    for (const [rawId, value] of Object.entries(raw)) {
      const id = normalizeId(rawId);
      const name = String(value?.name?.cn || value?.name?.chs || value?.cn || value?.chs || '').trim();
      if (!id || !name) continue;
      result[id] = name;
    }
    return result;
  }

  function shouldRefresh() {
    const meta = safeReadJson(FULL_MAP_META_KEY, {});
    const updatedAt = Number(meta.updatedAt) || 0;
    return !fullMapReady || Date.now() - updatedAt >= REFRESH_INTERVAL_MS;
  }

  async function refreshFullMap({ force = false } = {}) {
    if (!force && !shouldRefresh()) return fullZoneNames;

    try {
      const response = await fetch(FULL_MAP_URL, {
        cache: 'no-cache',
        mode: 'cors',
        credentials: 'omit',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const raw = await response.json();
      const mapped = extractChineseNames(raw);
      const count = Object.keys(mapped).length;
      if (count < 100) throw new Error(`zone map is unexpectedly small (${count})`);

      fullZoneNames = mapped;
      fullMapReady = true;
      fullMapSource = 'remote';
      safeWriteJson(FULL_MAP_STORAGE_KEY, mapped);
      safeWriteJson(FULL_MAP_META_KEY, {
        updatedAt: Date.now(),
        count,
        source: FULL_MAP_URL,
      });

      window.dispatchEvent(new CustomEvent('ff14zonesupdated', {
        detail: { count, source: fullMapSource },
      }));
      return fullZoneNames;
    } catch (error) {
      console.warn('[FF14ChatOverlay] complete zone map refresh failed:', error);
      // Existing cache + learned names + built-ins remain usable.
      return fullZoneNames;
    }
  }

  function getStats() {
    return {
      staticCount: Object.keys(STATIC_ZONE_NAMES).length,
      cachedFullCount: Object.keys(fullZoneNames).length,
      learnedCount: Object.keys(learned).length,
      fullMapReady,
      fullMapSource,
    };
  }

  loadLearned();
  loadCachedFullMap();

  // Start loading the complete map without blocking Overlay startup.
  const ready = refreshFullMap().catch(() => fullZoneNames);

  window.FF14Zones = {
    STATIC_ZONE_NAMES,
    FULL_MAP_URL,
    normalizeId,
    resolve,
    learn,
    refreshFullMap,
    getStats,
    ready,
  };
})();
