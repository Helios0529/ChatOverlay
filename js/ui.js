(() => {
  'use strict';

  const state = {
    messages: [],
    activeTab: 'all',
    query: '',
    partyHistoryRecords: [],
    partyHistoryQuery: '',
    selectedDate: '',
    followToday: true,
    calendarYear: 0,
    calendarMonth: 0,
    calendarCounts: {},
    settings: {
      fontSize: 15,
      opacity: 72,
      showTime: true,
      backgroundColor: '#0D0F14',
      fontColor: '#FFFFFF',
      channelColors: {},
      customCategories: [],
      topTabs: [],
      partyHistorySort: 'recent',
    },
  };

  const els = {};
  let actions = {};
  let contextMessage = null;

  function initElements() {
    els.tabs = document.getElementById('tabs');
    els.messages = document.getElementById('messages');
    els.searchInput = document.getElementById('searchInput');
    els.historyDateBtn = document.getElementById('historyDateBtn');
    els.historyPrevDayBtn = document.getElementById('historyPrevDayBtn');
    els.historyNextDayBtn = document.getElementById('historyNextDayBtn');
    els.calendarDialog = document.getElementById('calendarDialog');
    els.calendarDialogClose = document.getElementById('calendarDialogClose');
    els.calendarPrevMonth = document.getElementById('calendarPrevMonth');
    els.calendarNextMonth = document.getElementById('calendarNextMonth');
    els.calendarMonthLabel = document.getElementById('calendarMonthLabel');
    els.calendarGrid = document.getElementById('calendarGrid');
    els.calendarTodayBtn = document.getElementById('calendarTodayBtn');
    els.calendarDateSummary = document.getElementById('calendarDateSummary');
    els.imeSearchBtn = document.getElementById('imeSearchBtn');
    els.searchDialog = document.getElementById('searchDialog');
    els.searchImeInput = document.getElementById('searchImeInput');
    els.searchDialogClose = document.getElementById('searchDialogClose');
    els.searchApplyBtn = document.getElementById('searchApplyBtn');
    els.searchClearBtn = document.getElementById('searchClearBtn');
    els.systemPromptBtn = document.getElementById('systemPromptBtn');
    els.status = document.getElementById('status');
    els.emptyState = document.getElementById('emptyState');
    els.emptyTitle = document.getElementById('emptyTitle');
    els.emptySubtitle = document.getElementById('emptySubtitle');
    els.app = document.getElementById('app');
    els.partyHistoryBtn = document.getElementById('partyHistoryBtn');
    els.partyHistoryPage = document.getElementById('partyHistoryPage');
    els.partyHistoryBack = document.getElementById('partyHistoryBack');
    els.partyHistoryCount = document.getElementById('partyHistoryCount');
    els.partyHistorySearch = document.getElementById('partyHistorySearch');
    els.partyHistoryImeBtn = document.getElementById('partyHistoryImeBtn');
    els.partyHistorySortTabs = document.getElementById('partyHistorySortTabs');
    els.partyHistoryList = document.getElementById('partyHistoryList');
    els.partyHistoryEmpty = document.getElementById('partyHistoryEmpty');
    els.copyToast = document.getElementById('copyToast');
    els.playerDetailDialog = document.getElementById('playerDetailDialog');
    els.playerDetailTitle = document.getElementById('playerDetailTitle');
    els.playerDetailClose = document.getElementById('playerDetailClose');
    els.playerDetailName = document.getElementById('playerDetailName');
    els.playerDetailWorld = document.getElementById('playerDetailWorld');
    els.playerDetailCount = document.getElementById('playerDetailCount');
    els.playerDetailFirst = document.getElementById('playerDetailFirst');
    els.playerDetailLast = document.getElementById('playerDetailLast');
    els.playerEncounterList = document.getElementById('playerEncounterList');
    els.playerEncounterEmpty = document.getElementById('playerEncounterEmpty');
    els.messageContextMenu = document.getElementById('messageContextMenu');
    els.settingsBtn = document.getElementById('settingsBtn');
    els.settingsDialog = document.getElementById('settingsDialog');
    els.fontSize = document.getElementById('fontSize');
    els.fontSizeValue = document.getElementById('fontSizeValue');
    els.opacity = document.getElementById('opacity');
    els.opacityValue = document.getElementById('opacityValue');
    els.backgroundColorBtn = document.getElementById('backgroundColorBtn');
    els.backgroundColorSwatch = document.getElementById('backgroundColorSwatch');
    els.backgroundColorValue = document.getElementById('backgroundColorValue');
    els.fontColorBtn = document.getElementById('fontColorBtn');
    els.fontColorSwatch = document.getElementById('fontColorSwatch');
    els.fontColorValue = document.getElementById('fontColorValue');
    els.channelColorsBtn = document.getElementById('channelColorsBtn');
    els.channelColorsDialog = document.getElementById('channelColorsDialog');
    els.channelColorsDialogClose = document.getElementById('channelColorsDialogClose');
    els.channelColorsDoneBtn = document.getElementById('channelColorsDoneBtn');
    els.resetChannelColorsBtn = document.getElementById('resetChannelColorsBtn');
    els.channelColorRows = document.getElementById('channelColorRows');
    els.colorDialog = document.getElementById('colorDialog');
    els.colorDialogTitle = document.getElementById('colorDialogTitle');
    els.colorDialogClose = document.getElementById('colorDialogClose');
    els.colorPreview = document.getElementById('colorPreview');
    els.colorPresets = document.getElementById('colorPresets');
    els.colorR = document.getElementById('colorR');
    els.colorG = document.getElementById('colorG');
    els.colorB = document.getElementById('colorB');
    els.colorRValue = document.getElementById('colorRValue');
    els.colorGValue = document.getElementById('colorGValue');
    els.colorBValue = document.getElementById('colorBValue');
    els.colorHex = document.getElementById('colorHex');
    els.colorCancelBtn = document.getElementById('colorCancelBtn');
    els.colorApplyBtn = document.getElementById('colorApplyBtn');
    els.resetInterfaceBtn = document.getElementById('resetInterfaceBtn');
    els.showTime = document.getElementById('showTime');
    els.clearBtn = document.getElementById('clearBtn');
    els.topTabsBtn = document.getElementById('topTabsBtn');
    els.topTabsDialog = document.getElementById('topTabsDialog');
    els.topTabsDialogClose = document.getElementById('topTabsDialogClose');
    els.topTabsDoneBtn = document.getElementById('topTabsDoneBtn');
    els.topTabsResetBtn = document.getElementById('topTabsResetBtn');
    els.topTabsVisibleList = document.getElementById('topTabsVisibleList');
    els.topTabsHiddenList = document.getElementById('topTabsHiddenList');
    els.topTabsHiddenEmpty = document.getElementById('topTabsHiddenEmpty');
    els.customCategoriesBtn = document.getElementById('customCategoriesBtn');
    els.customCategoriesDialog = document.getElementById('customCategoriesDialog');
    els.customCategoriesDialogClose = document.getElementById('customCategoriesDialogClose');
    els.customCategoriesDoneBtn = document.getElementById('customCategoriesDoneBtn');
    els.customCategoryList = document.getElementById('customCategoryList');
    els.customCategoryEmpty = document.getElementById('customCategoryEmpty');
    els.customCategoryAddBtn = document.getElementById('customCategoryAddBtn');
    els.customCategoryEditorDialog = document.getElementById('customCategoryEditorDialog');
    els.customCategoryEditorTitle = document.getElementById('customCategoryEditorTitle');
    els.customCategoryEditorClose = document.getElementById('customCategoryEditorClose');
    els.customCategoryName = document.getElementById('customCategoryName');
    els.customCategoryNativeInputBtn = document.getElementById('customCategoryNativeInputBtn');
    els.customCategoryChannelOptions = document.getElementById('customCategoryChannelOptions');
    els.customCategoryValidation = document.getElementById('customCategoryValidation');
    els.customCategoryDeleteBtn = document.getElementById('customCategoryDeleteBtn');
    els.customCategoryCancelBtn = document.getElementById('customCategoryCancelBtn');
    els.customCategorySaveBtn = document.getElementById('customCategorySaveBtn');
  }

  function hexToRgb(hex, fallback) {
    const value = String(hex || '').trim();
    const match = value.match(/^#([0-9a-f]{6})$/i);
    if (!match) return fallback;
    const n = parseInt(match[1], 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  }

  function makeCategoryId() {
    if (window.crypto?.randomUUID) return `cat-${window.crypto.randomUUID()}`;
    return `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizeCustomCategories(value) {
    const validFilterKeys = new Set((window.FF14Channels?.FILTER_OPTIONS || []).map((entry) => entry.key));
    const seenIds = new Set();
    const out = [];
    for (const raw of Array.isArray(value) ? value : []) {
      if (!raw || typeof raw !== 'object') continue;
      const name = String(raw.name || '').trim().slice(0, 12);
      if (!name) continue;
      let id = String(raw.id || '').trim();
      if (!id || seenIds.has(id)) id = makeCategoryId();
      seenIds.add(id);
      const filters = [...new Set((Array.isArray(raw.filters) ? raw.filters : raw.channels || [])
        .map((key) => String(key))
        .filter((key) => validFilterKeys.has(key)))];
      if (!filters.length) continue;
      out.push({ id, name, filters });
      if (out.length >= 20) break;
    }
    return out;
  }

  function builtinTabToken(key) {
    return `builtin:${key}`;
  }

  function customTabToken(id) {
    return `custom:${id}`;
  }

  function availableTopTabEntries() {
    const entries = [];
    for (const tab of window.FF14Channels?.TABS || []) {
      entries.push({
        token: builtinTabToken(tab.key),
        activeKey: tab.key,
        name: tab.name,
        kind: 'builtin',
      });
    }
    for (const category of state.settings.customCategories || []) {
      entries.push({
        token: customTabToken(category.id),
        activeKey: `custom:${category.id}`,
        name: category.name,
        kind: 'custom',
      });
    }
    return entries;
  }

  function defaultTopTabs() {
    return availableTopTabEntries().map((entry) => entry.token);
  }

  function normalizeTopTabs(value, { fallbackToDefault = false } = {}) {
    const available = availableTopTabEntries();
    const valid = new Set(available.map((entry) => entry.token));
    const seen = new Set();
    const out = [];
    for (const raw of Array.isArray(value) ? value : []) {
      const token = String(raw || '');
      if (!valid.has(token) || seen.has(token)) continue;
      seen.add(token);
      out.push(token);
    }
    if (!out.length && fallbackToDefault) return defaultTopTabs();
    return out;
  }

  function ensureActiveTabVisible() {
    const entriesByToken = new Map(availableTopTabEntries().map((entry) => [entry.token, entry]));
    const visible = (state.settings.topTabs || []).map((token) => entriesByToken.get(token)).filter(Boolean);
    if (!visible.length) return;
    if (!visible.some((entry) => entry.activeKey === state.activeTab)) {
      state.activeTab = visible[0].activeKey;
    }
  }

  function loadSettings() {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem('ff14ChatSettings') || '{}');
      Object.assign(state.settings, saved);
    } catch (_) { saved = {}; }

    // Upgrade old settings safely.
    if (!/^#[0-9a-f]{6}$/i.test(state.settings.backgroundColor || '')) state.settings.backgroundColor = '#0D0F14';
    if (!/^#[0-9a-f]{6}$/i.test(state.settings.fontColor || '')) state.settings.fontColor = '#FFFFFF';
    if (!['recent','count','name'].includes(state.settings.partyHistorySort)) state.settings.partyHistorySort = 'recent';

    const defaults = window.FF14Channels?.DEFAULT_CHANNEL_COLORS || {};
    const savedChannelColors = (state.settings.channelColors && typeof state.settings.channelColors === 'object')
      ? state.settings.channelColors
      : {};
    const migratedChannelColors = { ...savedChannelColors };
    // V0.5 and earlier used one shared LS/CWLS color. Carry that choice forward
    // into every individual slot unless the slot already has its own saved value.
    if (migratedChannelColors.ls) {
      for (let i = 1; i <= 8; i += 1) if (!migratedChannelColors[`ls${i}`]) migratedChannelColors[`ls${i}`] = migratedChannelColors.ls;
    }
    if (migratedChannelColors.cwls) {
      for (let i = 1; i <= 8; i += 1) if (!migratedChannelColors[`cwls${i}`]) migratedChannelColors[`cwls${i}`] = migratedChannelColors.cwls;
    }
    state.settings.channelColors = { ...defaults, ...migratedChannelColors };
    for (const [key, value] of Object.entries(state.settings.channelColors)) {
      if (!/^#[0-9a-f]{6}$/i.test(value || '')) state.settings.channelColors[key] = defaults[key] || '#FFFFFF';
    }
    state.settings.customCategories = normalizeCustomCategories(state.settings.customCategories);
    state.settings.topTabs = normalizeTopTabs(state.settings.topTabs, {
      fallbackToDefault: !Array.isArray(saved.topTabs) || saved.topTabs.length === 0,
    });
    if (!state.settings.topTabs.length) state.settings.topTabs = defaultTopTabs();
    ensureActiveTabVisible();
    applySettings();
  }

  function saveSettings() {
    try {
      localStorage.setItem('ff14ChatSettings', JSON.stringify(state.settings));
    } catch (error) {
      console.warn('[FF14ChatOverlay] settings persistence unavailable:', error);
    }
  }

  function applySettings() {
    document.documentElement.style.setProperty('--font-size', `${state.settings.fontSize}px`);
    document.documentElement.style.setProperty('--panel-alpha', String(state.settings.opacity / 100));
    document.documentElement.style.setProperty('--panel-rgb', hexToRgb(state.settings.backgroundColor, '13, 15, 20'));
    document.documentElement.style.setProperty('--text-rgb', hexToRgb(state.settings.fontColor, '255, 255, 255'));

    if (els.fontSize) {
      els.fontSize.value = state.settings.fontSize;
      els.fontSizeValue.value = `${state.settings.fontSize}px`;
      els.opacity.value = state.settings.opacity;
      els.opacityValue.value = `${state.settings.opacity}%`;
      els.backgroundColorValue.textContent = state.settings.backgroundColor.toUpperCase();
      els.backgroundColorSwatch.style.background = state.settings.backgroundColor;
      els.fontColorValue.textContent = state.settings.fontColor.toUpperCase();
      els.fontColorSwatch.style.background = state.settings.fontColor;
      els.showTime.checked = state.settings.showTime;
      updatePartyHistorySortTabs();
    }
  }

  function selectTab(tabKey) {
    state.activeTab = tabKey;
    buildTabs();
    render(true);
  }

  function buildTabs() {
    els.tabs.replaceChildren();
    const entriesByToken = new Map(availableTopTabEntries().map((entry) => [entry.token, entry]));
    const normalized = normalizeTopTabs(state.settings.topTabs, { fallbackToDefault: true });
    if (normalized.join('\u0000') !== (state.settings.topTabs || []).join('\u0000')) {
      state.settings.topTabs = normalized;
      saveSettings();
    }
    ensureActiveTabVisible();

    for (const token of state.settings.topTabs) {
      const entry = entriesByToken.get(token);
      if (!entry) continue;
      const button = document.createElement('button');
      const isCustom = entry.kind === 'custom';
      button.className = `tab${isCustom ? ' custom-tab' : ''}${state.activeTab === entry.activeKey ? ' active' : ''}`;
      button.textContent = entry.name;
      button.dataset.tab = entry.activeKey;
      button.title = isCustom ? `${entry.name} · 自定义分组` : entry.name;
      button.addEventListener('click', () => selectTab(entry.activeKey));
      els.tabs.appendChild(button);
    }
  }

  function isAtBottom() {
    const el = els.messages;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 45;
  }

  function normalizeSenderMetadata(item) {
    if (!item || !window.FF14Parser) return item;

    // Always re-parse senderRaw when it exists. This upgrades old V0.2.2 records
    // whose saved senderName may still contain a leaked U+E0E1..U+E0E8 glyph.
    const hasRaw = Boolean(item.senderRaw);
    const source = item.senderRaw || item.senderName || item.sender || '';
    const parsed = window.FF14Parser.parseSender(source, item.group || '');

    let normalized = {
      ...item,
      senderRaw: item.senderRaw || parsed.senderRaw,
      senderName: hasRaw ? parsed.senderName : (item.senderName || parsed.senderName),
      senderWorld: item.senderWorld || parsed.senderWorld,
      partyOrder: parsed.partyOrder ?? item.partyOrder ?? null,
      sender: hasRaw
        ? (parsed.senderName || item.sender || '')
        : (item.senderName || parsed.senderName || item.sender || ''),
    };

    if (window.FF14Roster?.enrich) normalized = window.FF14Roster.enrich(normalized);
    return normalized;
  }


  function normalizeMessageText(item) {
    if (!item || !window.FF14Parser?.normalizeGameText) return item;
    const raw = item.messageRaw ?? item.message ?? '';
    return {
      ...item,
      messageRaw: item.messageRaw ?? raw,
      message: window.FF14Parser.normalizeGameText(raw),
    };
  }

  function normalizeChannelMetadata(item) {
    if (!item || !window.FF14Channels) return normalizeMessageText(item);
    const normalizedText = normalizeMessageText(item);
    const channel = window.FF14Channels.getChannel(normalizedText.channelCode);
    if (!channel) return normalizeSenderMetadata(normalizedText);
    return normalizeSenderMetadata({
      ...normalizedText,
      channelKey: channel.key,
      group: channel.group,
      channelName: channel.name,
      channelColor: channel.color,
      colorSetting: channel.colorSetting || channel.key,
    });
  }

  function searchableSender(item) {
    return [item.senderName, item.senderWorld, item.sender, item.senderRaw]
      .filter(Boolean)
      .join(' ');
  }

  function channelMatchesActiveTab(item) {
    if (state.activeTab === 'all') return true;
    if (state.activeTab.startsWith('custom:')) {
      const id = state.activeTab.slice('custom:'.length);
      const category = (state.settings.customCategories || []).find((entry) => entry.id === id);
      if (!category) return false;
      const channelKeys = window.FF14Channels.channelKeysForFilterKeys(category.filters);
      return channelKeys.has(item.channelKey);
    }
    return item.group === state.activeTab;
  }

  function filteredMessages() {
    const q = state.query.trim().toLowerCase();
    return state.messages.filter((item) => {
      if (!channelMatchesActiveTab(item)) return false;
      if (!q) return true;
      return `${searchableSender(item)}\n${item.message}\n${item.channelName}`.toLowerCase().includes(q);
    });
  }

  function formatTime(timestamp) {
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }

  let toastTimer = null;

  function showToast(text) {
    if (!els.copyToast) return;
    els.copyToast.textContent = text;
    els.copyToast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.copyToast.classList.add('hidden'), 1300);
  }

  async function copyMessageText(text) {
    const value = String(text ?? '');
    if (!value) return false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        showToast('已复制消息');
        return true;
      }
    } catch (_) {}

    try {
      const area = document.createElement('textarea');
      area.value = value;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      area.style.pointerEvents = 'none';
      document.body.appendChild(area);
      area.focus();
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      showToast(ok ? '已复制消息' : '复制失败');
      return ok;
    } catch (_) {
      showToast('复制失败');
      return false;
    }
  }

  function formatFullMessage(item) {
    const parts = [];
    if (state.settings.showTime) parts.push(formatTime(item.timestamp));
    if (item.channelName) parts.push(`[${item.channelName}]`);
    let who = '';
    if (Number.isInteger(item.partyOrder) && item.partyOrder >= 1 && item.partyOrder <= 8) {
      const circled = ['', '①','②','③','④','⑤','⑥','⑦','⑧'];
      who += circled[item.partyOrder] || String(item.partyOrder);
    }
    who += item.senderName || item.sender || '';
    if (item.senderWorld) who += ` ${item.senderWorld}`;
    if (who) parts.push(who);
    return `${parts.join(' ')}${parts.length ? ' ' : ''}${item.message || ''}`.trimEnd();
  }

  function openContextMenu(event, item) {
    if (!els.messageContextMenu) return;
    contextMessage = item;
    const hasSender = Boolean(item.senderName || item.sender);
    const senderAction = els.messageContextMenu.querySelector('[data-action="copy-sender"]');
    const detailAction = els.messageContextMenu.querySelector('[data-action="player-detail"]');
    if (senderAction) senderAction.disabled = !hasSender;
    if (detailAction) detailAction.disabled = !hasSender;

    els.messageContextMenu.classList.remove('hidden');
    els.messageContextMenu.style.left = '0px';
    els.messageContextMenu.style.top = '0px';
    const rect = els.messageContextMenu.getBoundingClientRect();
    const maxX = Math.max(4, window.innerWidth - rect.width - 4);
    const maxY = Math.max(4, window.innerHeight - rect.height - 4);
    els.messageContextMenu.style.left = `${Math.max(4, Math.min(event.clientX, maxX))}px`;
    els.messageContextMenu.style.top = `${Math.max(4, Math.min(event.clientY, maxY))}px`;
  }

  function hideContextMenu() {
    if (!els.messageContextMenu) return;
    els.messageContextMenu.classList.add('hidden');
    contextMessage = null;
  }

  function requestPlayerDetail(item) {
    const name = item?.senderName || item?.sender || item?.name || '';
    const world = item?.senderWorld || item?.worldName || '';
    if (!name) return;
    actions.onPlayerDetail?.({ name, worldName: world, record: item?.key ? item : null });
  }

  function messageElement(item) {
    const row = document.createElement('div');
    row.className = 'message';
    if (!item.senderName && !item.sender) row.classList.add('no-sender');
    if (!state.settings.showTime) row.classList.add('no-time');

    if (state.settings.showTime) {
      const time = document.createElement('span');
      time.className = 'time';
      time.textContent = formatTime(item.timestamp);
      row.appendChild(time);
    }

    const messageColor = state.settings.channelColors?.[item.colorSetting] || item.channelColor || '#FFFFFF';

    const channel = document.createElement('span');
    channel.className = 'channel';
    channel.style.setProperty('--channel-color', messageColor);
    channel.textContent = `[${item.channelName}]`;
    row.appendChild(channel);

    if (item.senderName || item.sender) {
      const sender = document.createElement('span');
      sender.className = 'sender';

      if (Number.isInteger(item.partyOrder) && item.partyOrder >= 1 && item.partyOrder <= 8) {
        const order = document.createElement('span');
        order.className = 'party-order';
        const circled = ['', '①','②','③','④','⑤','⑥','⑦','⑧'];
        order.textContent = circled[item.partyOrder] || String(item.partyOrder);
        sender.appendChild(order);
      }

      const name = document.createElement('span');
      name.className = 'sender-name sender-clickable';
      name.textContent = item.senderName || item.sender;
      name.title = '点击查看本地组队记录';
      name.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        requestPlayerDetail(item);
      });
      sender.appendChild(name);

      if (item.senderWorld) {
        const world = document.createElement('span');
        world.className = 'sender-world';
        world.textContent = item.senderWorld;
        sender.appendChild(world);
      }

      // Reserve the visual width of one space between speaker and text.
      const senderGap = document.createElement('span');
      senderGap.className = 'sender-gap';
      senderGap.setAttribute('aria-hidden', 'true');
      senderGap.textContent = '';
      sender.appendChild(senderGap);

      row.appendChild(sender);
    }

    const text = document.createElement('span');
    text.className = 'text';
    text.style.setProperty('--message-color', messageColor);
    text.textContent = item.message;
    row.appendChild(text);

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-message-btn';
    copyBtn.textContent = '复制';
    copyBtn.title = '复制消息内容';
    copyBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      copyMessageText(item.message);
    });
    row.appendChild(copyBtn);

    row.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openContextMenu(event, item);
    });

    return row;
  }

  function localDateKey(value) {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function todayDateKey() {
    return localDateKey(new Date());
  }

  function parseDateKey(dateKey) {
    const match = String(dateKey || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function friendlyDateLabel(dateKey, compact = false) {
    const d = parseDateKey(dateKey);
    if (!d) return '日期';
    const todayKey = todayDateKey();
    if (dateKey === todayKey) return '今天';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateKey === localDateKey(yesterday)) return '昨天';
    if (compact) return `${String(d.getMonth() + 1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
    return d.toLocaleDateString([], { year:'numeric', month:'2-digit', day:'2-digit' });
  }

  function updateDateButton() {
    if (!els.historyDateBtn) return;
    els.historyDateBtn.textContent = friendlyDateLabel(state.selectedDate, true);
    els.historyDateBtn.title = `当前查看：${friendlyDateLabel(state.selectedDate, false)}；点击打开日历`;
    els.historyDateBtn.classList.toggle('viewing-history', state.selectedDate !== todayDateKey());
    if (els.historyNextDayBtn) els.historyNextDayBtn.disabled = state.selectedDate >= todayDateKey();
  }

  function setCalendarMonthFromDate(dateKey) {
    const d = parseDateKey(dateKey) || new Date();
    state.calendarYear = d.getFullYear();
    state.calendarMonth = d.getMonth();
  }

  function sameCalendarMonthAsToday() {
    const now = new Date();
    return state.calendarYear === now.getFullYear() && state.calendarMonth === now.getMonth();
  }

  async function loadCalendarMonth() {
    if (!actions.onLoadCalendarMonth) {
      state.calendarCounts = {};
      return;
    }
    try {
      state.calendarCounts = await actions.onLoadCalendarMonth(state.calendarYear, state.calendarMonth) || {};
    } catch (error) {
      console.error('[FF14ChatOverlay] calendar month load failed:', error);
      state.calendarCounts = {};
    }
  }

  function renderCalendar() {
    if (!els.calendarGrid) return;
    const year = state.calendarYear;
    const month = state.calendarMonth;
    const first = new Date(year, month, 1, 12, 0, 0);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const mondayOffset = (first.getDay() + 6) % 7;
    const todayKey = todayDateKey();

    els.calendarMonthLabel.textContent = `${year}年${month + 1}月`;
    els.calendarGrid.replaceChildren();

    for (let i = 0; i < mondayOffset; i += 1) {
      const blank = document.createElement('span');
      blank.className = 'calendar-day calendar-day-blank';
      els.calendarGrid.appendChild(blank);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day, 12, 0, 0);
      const key = localDateKey(date);
      const count = Number(state.calendarCounts?.[key] || 0);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'calendar-day';
      btn.dataset.date = key;
      if (key === todayKey) btn.classList.add('is-today');
      if (key === state.selectedDate) btn.classList.add('is-selected');
      if (count > 0) btn.classList.add('has-records');
      if (key > todayKey) {
        btn.disabled = true;
        btn.classList.add('is-future');
      }

      const number = document.createElement('span');
      number.className = 'calendar-day-number';
      number.textContent = String(day);
      btn.appendChild(number);

      if (count > 0) {
        const badge = document.createElement('span');
        badge.className = 'calendar-day-count';
        badge.textContent = count > 999 ? '999+' : String(count);
        badge.title = `${count} 条聊天`;
        btn.appendChild(badge);
      } else {
        const dot = document.createElement('span');
        dot.className = 'calendar-day-empty-dot';
        btn.appendChild(dot);
      }

      btn.addEventListener('click', () => selectChatDate(key, { closeCalendar: true }));
      els.calendarGrid.appendChild(btn);
    }

    els.calendarNextMonth.disabled = sameCalendarMonthAsToday();
    const selectedCount = Number(state.calendarCounts?.[state.selectedDate] || 0);
    const selectedDate = parseDateKey(state.selectedDate);
    const selectedInMonth = selectedDate
      && selectedDate.getFullYear() === year
      && selectedDate.getMonth() === month;
    els.calendarDateSummary.textContent = selectedInMonth
      ? `${friendlyDateLabel(state.selectedDate, false)} · ${selectedCount} 条记录`
      : '带数字的日期表示当天保存的聊天数量';
  }

  async function openCalendar() {
    setCalendarMonthFromDate(state.selectedDate || todayDateKey());
    await loadCalendarMonth();
    renderCalendar();
    if (!els.calendarDialog.open) els.calendarDialog.showModal();
  }

  async function shiftCalendarMonth(delta) {
    const candidate = new Date(state.calendarYear, state.calendarMonth + delta, 1, 12, 0, 0);
    const now = new Date();
    if (candidate.getFullYear() > now.getFullYear()
      || (candidate.getFullYear() === now.getFullYear() && candidate.getMonth() > now.getMonth())) return;
    state.calendarYear = candidate.getFullYear();
    state.calendarMonth = candidate.getMonth();
    await loadCalendarMonth();
    renderCalendar();
  }

  async function selectChatDate(dateKey, { closeCalendar = false } = {}) {
    const parsed = parseDateKey(dateKey);
    if (!parsed || dateKey > todayDateKey()) return;
    state.selectedDate = dateKey;
    state.followToday = dateKey === todayDateKey();
    state.query = '';
    if (els.searchInput) els.searchInput.value = '';
    if (els.searchImeInput) els.searchImeInput.value = '';
    updateDateButton();

    let messages = [];
    try {
      messages = await actions.onSelectChatDate?.(dateKey) || [];
    } catch (error) {
      console.error('[FF14ChatOverlay] selected date load failed:', error);
    }
    replaceMessages(messages);

    if (closeCalendar && els.calendarDialog?.open) els.calendarDialog.close();
  }

  function shiftSelectedDate(delta) {
    const base = parseDateKey(state.selectedDate) || new Date();
    base.setDate(base.getDate() + delta);
    const key = localDateKey(base);
    if (!key || key > todayDateKey()) return;
    selectChatDate(key);
  }

  function render(forceBottom = false) {
    const atBottomBefore = isAtBottom();
    const items = filteredMessages();
    const frag = document.createDocumentFragment();
    for (const item of items) frag.appendChild(messageElement(item));
    els.messages.replaceChildren(frag);

    els.emptyState.classList.toggle('hidden', items.length !== 0);
    if (items.length === 0 && els.emptyTitle && els.emptySubtitle) {
      const dateLabel = friendlyDateLabel(state.selectedDate, false);
      if (state.query.trim()) {
        els.emptyTitle.textContent = '没有找到匹配消息';
        els.emptySubtitle.textContent = `${dateLabel}内没有符合当前频道和搜索条件的聊天记录。`;
      } else {
        els.emptyTitle.textContent = `${dateLabel}没有聊天记录`;
        els.emptySubtitle.textContent = state.selectedDate === todayDateKey()
          ? '今天的新聊天会自动显示在这里；也可以点击日期按钮查看历史记录。'
          : '可以点击日期按钮切换到其他有记录的日期。';
      }
    }

    if (forceBottom || atBottomBefore) {
      requestAnimationFrame(() => {
        els.messages.scrollTop = els.messages.scrollHeight;
      });
    }
  }

  function addMessage(message) {
    message = normalizeChannelMetadata(message);
    const messageDate = localDateKey(message.timestamp);
    if (state.followToday && messageDate === todayDateKey() && messageDate !== state.selectedDate) {
      state.selectedDate = messageDate;
      state.messages = [];
      updateDateButton();
    }
    if (messageDate !== state.selectedDate) return;

    const shouldStick = isAtBottom();
    state.messages.push(message);
    if (state.messages.length > window.FF14Storage.MAX_MESSAGES) state.messages.shift();
    render(shouldStick);
  }

  function replaceMessages(messages) {
    state.messages = Array.isArray(messages)
      ? messages.map(normalizeChannelMetadata)
      : [];
    render(true);
  }

  function refreshMetadata() {
    state.messages = state.messages.map(normalizeChannelMetadata);
    render(false);
  }

  function formatSeen(timestamp) {
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString([], {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  function updatePartyHistorySortTabs() {
    const mode = state.settings.partyHistorySort || 'recent';
    els.partyHistorySortTabs?.querySelectorAll('[data-sort]').forEach((button) => {
      const active = button.dataset.sort === mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function renderPartyHistory() {
    updatePartyHistorySortTabs();
    const query = state.partyHistoryQuery.trim().toLocaleLowerCase('zh-CN');
    const all = Array.isArray(state.partyHistoryRecords) ? state.partyHistoryRecords : [];
    const items = all.filter((item) => {
      if (!query) return true;
      return String(item.name || '').toLocaleLowerCase('zh-CN').includes(query);
    });

    const sortMode = state.settings.partyHistorySort || 'recent';
    items.sort((a, b) => {
      if (sortMode === 'count') {
        const countDiff = (Number(b.encounterCount) || 0) - (Number(a.encounterCount) || 0);
        if (countDiff) return countDiff;
        return String(b.lastSeen || '').localeCompare(String(a.lastSeen || ''));
      }
      if (sortMode === 'name') {
        return String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN');
      }
      return String(b.lastSeen || '').localeCompare(String(a.lastSeen || ''));
    });

    els.partyHistoryList.replaceChildren();
    els.partyHistoryEmpty.classList.toggle('hidden', items.length !== 0);
    els.partyHistoryCount.textContent = query
      ? `${items.length} / ${all.length} 位玩家`
      : `${all.length} 位玩家`;

    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'party-history-row';

      const name = document.createElement('span');
      name.className = 'party-history-name';
      name.textContent = item.name || '';

      const world = document.createElement('span');
      world.className = 'party-history-world';
      world.textContent = item.worldName || '未知';

      const count = document.createElement('span');
      count.className = 'party-history-times';
      count.textContent = `${Math.max(1, Number(item.encounterCount) || 0)} 次`;

      const seen = document.createElement('span');
      seen.className = 'party-history-seen';
      seen.textContent = formatSeen(item.lastSeen);

      row.append(name, world, count, seen);
      row.classList.add('party-history-clickable');
      row.title = '点击查看详细组队记录';
      row.addEventListener('click', () => requestPlayerDetail(item));
      els.partyHistoryList.appendChild(row);
    }
  }

  function showPartyHistory(records) {
    state.partyHistoryRecords = Array.isArray(records) ? records : [];
    state.partyHistoryQuery = '';
    if (els.partyHistorySearch) els.partyHistorySearch.value = '';
    updatePartyHistorySortTabs();
    renderPartyHistory();
    els.app.classList.add('hidden');
    els.partyHistoryPage.classList.remove('hidden');
  }

  function hidePartyHistory() {
    els.partyHistoryPage.classList.add('hidden');
    els.app.classList.remove('hidden');
    requestAnimationFrame(() => render(false));
  }

  function showPlayerDetail(record, encounters = []) {
    const item = record || {};
    const count = Math.max(0, Number(item.encounterCount) || 0);
    els.playerDetailName.textContent = item.name || '未知玩家';
    els.playerDetailWorld.textContent = item.worldName || '';
    els.playerDetailTitle.textContent = '玩家记录';
    els.playerDetailCount.textContent = count ? `${count} 次` : '暂无';
    els.playerDetailFirst.textContent = item.firstSeen ? formatSeen(item.firstSeen) : '—';
    els.playerDetailLast.textContent = item.lastSeen ? formatSeen(item.lastSeen) : '—';

    els.playerEncounterList.replaceChildren();
    const list = Array.isArray(encounters) ? encounters : [];
    els.playerEncounterEmpty.classList.toggle('hidden', list.length !== 0);
    for (const encounter of list) {
      const row = document.createElement('div');
      row.className = 'player-encounter-row';
      const when = document.createElement('span');
      when.textContent = formatSeen(encounter.seenAt);
      const world = document.createElement('span');
      world.textContent = encounter.worldName || item.worldName || '';
      row.append(when, world);
      els.playerEncounterList.appendChild(row);
    }

    if (!els.playerDetailDialog.open) els.playerDetailDialog.showModal();
  }

  function topTabTypeLabel(entry) {
    return entry.kind === 'custom' ? '自定义分组' : '系统分类';
  }

  function topTabButton(text, title, onClick, disabled = false, extraClass = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `top-tab-action ${extraClass}`.trim();
    button.textContent = text;
    button.title = title;
    button.disabled = disabled;
    button.addEventListener('click', onClick);
    return button;
  }

  function renderTopTabsManager() {
    if (!els.topTabsVisibleList || !els.topTabsHiddenList) return;
    const entries = availableTopTabEntries();
    const byToken = new Map(entries.map((entry) => [entry.token, entry]));
    state.settings.topTabs = normalizeTopTabs(state.settings.topTabs, { fallbackToDefault: true });
    const visibleTokens = [...state.settings.topTabs];
    const visibleSet = new Set(visibleTokens);

    els.topTabsVisibleList.replaceChildren();
    visibleTokens.forEach((token, index) => {
      const entry = byToken.get(token);
      if (!entry) return;
      const row = document.createElement('div');
      row.className = 'top-tab-manage-row';

      const handle = document.createElement('span');
      handle.className = 'top-tab-handle';
      handle.textContent = '≡';
      handle.setAttribute('aria-hidden', 'true');

      const info = document.createElement('div');
      info.className = 'top-tab-info';
      const name = document.createElement('strong');
      name.textContent = entry.name;
      const type = document.createElement('span');
      type.textContent = topTabTypeLabel(entry);
      info.append(name, type);

      const actionsWrap = document.createElement('div');
      actionsWrap.className = 'top-tab-actions';
      actionsWrap.append(
        topTabButton('↑', '向前移动', () => moveTopTab(token, -1), index === 0),
        topTabButton('↓', '向后移动', () => moveTopTab(token, 1), index === visibleTokens.length - 1),
        topTabButton('移除', '从顶部隐藏', () => hideTopTab(token), false, 'remove')
      );
      row.append(handle, info, actionsWrap);
      els.topTabsVisibleList.appendChild(row);
    });

    els.topTabsHiddenList.replaceChildren();
    const hidden = entries.filter((entry) => !visibleSet.has(entry.token));
    els.topTabsHiddenEmpty?.classList.toggle('hidden', hidden.length !== 0);
    for (const entry of hidden) {
      const row = document.createElement('div');
      row.className = 'top-tab-manage-row hidden-tab-row';
      const marker = document.createElement('span');
      marker.className = 'top-tab-hidden-marker';
      marker.textContent = '+';
      const info = document.createElement('div');
      info.className = 'top-tab-info';
      const name = document.createElement('strong');
      name.textContent = entry.name;
      const type = document.createElement('span');
      type.textContent = topTabTypeLabel(entry);
      info.append(name, type);
      const actionsWrap = document.createElement('div');
      actionsWrap.className = 'top-tab-actions';
      actionsWrap.append(topTabButton('添加', '添加到顶部末尾', () => showTopTab(entry.token), false, 'add'));
      row.append(marker, info, actionsWrap);
      els.topTabsHiddenList.appendChild(row);
    }
  }

  function commitTopTabs(next) {
    const normalized = normalizeTopTabs(next);
    if (!normalized.length) {
      showToast('顶部至少保留一个分类');
      return false;
    }
    state.settings.topTabs = normalized;
    ensureActiveTabVisible();
    saveSettings();
    buildTabs();
    render(false);
    renderTopTabsManager();
    return true;
  }

  function moveTopTab(token, delta) {
    const next = [...(state.settings.topTabs || [])];
    const index = next.indexOf(token);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    commitTopTabs(next);
  }

  function hideTopTab(token) {
    const current = [...(state.settings.topTabs || [])];
    if (current.length <= 1) {
      showToast('顶部至少保留一个分类');
      return;
    }
    if (commitTopTabs(current.filter((entry) => entry !== token))) showToast('已从顶部隐藏');
  }

  function showTopTab(token) {
    const next = [...(state.settings.topTabs || [])];
    if (!next.includes(token)) next.push(token);
    if (commitTopTabs(next)) showToast('已添加到顶部');
  }

  function resetTopTabs() {
    if (commitTopTabs(defaultTopTabs())) showToast('已恢复顶部分类');
  }

  let editingCategoryId = null;

  function categorySummary(category) {
    const map = window.FF14Channels?.FILTER_OPTION_MAP || {};
    return (category.filters || []).map((key) => map[key]?.name).filter(Boolean).join('、');
  }

  function buildCustomCategoryList() {
    if (!els.customCategoryList) return;
    els.customCategoryList.replaceChildren();
    const categories = state.settings.customCategories || [];
    els.customCategoryEmpty?.classList.toggle('hidden', categories.length > 0);

    for (const category of categories) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'custom-category-row';

      const text = document.createElement('span');
      text.className = 'custom-category-row-text';
      const name = document.createElement('strong');
      name.textContent = category.name;
      const summary = document.createElement('span');
      summary.textContent = categorySummary(category) || '未选择频道';
      text.append(name, summary);

      const edit = document.createElement('span');
      edit.className = 'custom-category-edit-mark';
      edit.textContent = '编辑 ›';
      row.append(text, edit);
      row.addEventListener('click', () => openCustomCategoryEditor(category.id));
      els.customCategoryList.appendChild(row);
    }
  }

  function buildCustomCategoryOptions(selected = []) {
    els.customCategoryChannelOptions.replaceChildren();
    const selectedSet = new Set(selected);
    for (const option of window.FF14Channels?.FILTER_OPTIONS || []) {
      const label = document.createElement('label');
      label.className = 'custom-category-option';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = option.key;
      input.checked = selectedSet.has(option.key);
      const text = document.createElement('span');
      text.textContent = option.name;
      label.append(input, text);
      els.customCategoryChannelOptions.appendChild(label);
    }
  }

  function showCategoryValidation(text = '') {
    if (!els.customCategoryValidation) return;
    els.customCategoryValidation.textContent = text;
    els.customCategoryValidation.classList.toggle('hidden', !text);
  }

  function openCustomCategoryEditor(categoryId = null) {
    editingCategoryId = categoryId;
    const category = (state.settings.customCategories || []).find((entry) => entry.id === categoryId) || null;
    els.customCategoryEditorTitle.textContent = category ? '编辑自定义分组' : '新建自定义分组';
    els.customCategoryName.value = category?.name || '';
    buildCustomCategoryOptions(category?.filters || []);
    els.customCategoryDeleteBtn.classList.toggle('hidden', !category);
    showCategoryValidation('');
    if (!els.customCategoryEditorDialog.open) els.customCategoryEditorDialog.showModal();
    setTimeout(() => els.customCategoryName.focus(), 20);
  }

  function saveCustomCategoryFromEditor() {
    const name = String(els.customCategoryName.value || '').trim().slice(0, 12);
    const filters = [...els.customCategoryChannelOptions.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value);
    if (!name) { showCategoryValidation('请输入分类名称。'); return; }
    if (!filters.length) { showCategoryValidation('至少选择一个要显示的频道。'); return; }

    const categories = [...(state.settings.customCategories || [])];
    let newCategoryId = null;
    if (editingCategoryId) {
      const index = categories.findIndex((entry) => entry.id === editingCategoryId);
      if (index >= 0) categories[index] = { ...categories[index], name, filters };
    } else {
      newCategoryId = makeCategoryId();
      categories.push({ id: newCategoryId, name, filters });
    }
    state.settings.customCategories = normalizeCustomCategories(categories);
    if (newCategoryId && state.settings.customCategories.some((entry) => entry.id === newCategoryId)) {
      state.settings.topTabs = normalizeTopTabs([...(state.settings.topTabs || []), customTabToken(newCategoryId)]);
    } else {
      state.settings.topTabs = normalizeTopTabs(state.settings.topTabs, { fallbackToDefault: true });
    }
    saveSettings();
    buildTabs();
    buildCustomCategoryList();
    render(false);
    els.customCategoryEditorDialog.close();
    showToast('已保存分组');
  }

  function deleteEditingCustomCategory() {
    if (!editingCategoryId) return;
    const category = (state.settings.customCategories || []).find((entry) => entry.id === editingCategoryId);
    if (!category) return;
    if (!window.confirm(`删除自定义分组“${category.name}”吗？聊天记录本身不会被删除。`)) return;
    state.settings.customCategories = (state.settings.customCategories || []).filter((entry) => entry.id !== editingCategoryId);
    state.settings.topTabs = (state.settings.topTabs || []).filter((token) => token !== customTabToken(editingCategoryId));
    state.settings.topTabs = normalizeTopTabs(state.settings.topTabs, { fallbackToDefault: true });
    ensureActiveTabVisible();
    saveSettings();
    buildTabs();
    buildCustomCategoryList();
    render(false);
    els.customCategoryEditorDialog.close();
    showToast('已删除分组');
  }

  function setStatus(text, mode = '') {
    if (!els.status) return;
    els.status.textContent = text;
    els.status.classList.remove('status-connected', 'status-connecting', 'status-preview', 'status-error');
    if (mode) els.status.classList.add(`status-${mode}`);
  }

  function wireEvents({ onClear, onOpenPartyHistory }) {
    els.historyDateBtn.addEventListener('click', () => openCalendar());
    els.historyPrevDayBtn?.addEventListener('click', () => shiftSelectedDate(-1));
    els.historyNextDayBtn?.addEventListener('click', () => shiftSelectedDate(1));
    els.calendarDialogClose.addEventListener('click', () => els.calendarDialog.close());
    els.calendarPrevMonth.addEventListener('click', () => shiftCalendarMonth(-1));
    els.calendarNextMonth.addEventListener('click', () => shiftCalendarMonth(1));
    els.calendarTodayBtn.addEventListener('click', () => selectChatDate(todayDateKey(), { closeCalendar: true }));

    // IME-safe search. We intentionally use a plain text input (not type=search)
    // and do not swallow key events while composition is active. Some Windows IMEs
    // (notably Sogou in embedded CEF) need to see the original keyboard sequence.
    let searchComposing = false;
    const commitSearchValue = (value) => {
      const text = String(value ?? '');
      state.query = text;
      els.searchInput.value = text;
      if (els.searchImeInput) els.searchImeInput.value = text;
      render(true);
    };
    const commitSearch = () => commitSearchValue(els.searchInput.value);

    els.searchInput.addEventListener('compositionstart', () => { searchComposing = true; });
    els.searchInput.addEventListener('compositionend', () => { searchComposing = false; commitSearch(); });
    els.searchInput.addEventListener('input', (event) => {
      if (searchComposing || event.isComposing) return;
      commitSearch();
    });
    els.searchInput.addEventListener('keydown', (event) => {
      // Never block composing keystrokes. Only stop propagation after IME is done.
      if (event.isComposing || searchComposing || event.keyCode === 229) return;
      event.stopPropagation();
      if (event.key === 'Escape') { els.searchInput.blur(); }
    });
    els.searchInput.addEventListener('keyup', (event) => {
      if (event.isComposing || searchComposing || event.keyCode === 229) return;
      event.stopPropagation();
    });

    const openSearchDialog = () => {
      els.searchImeInput.value = state.query;
      els.searchDialog.showModal();
      setTimeout(() => { els.searchImeInput.focus(); els.searchImeInput.setSelectionRange(els.searchImeInput.value.length, els.searchImeInput.value.length); }, 40);
    };
    els.imeSearchBtn.addEventListener('click', openSearchDialog);
    els.searchDialogClose.addEventListener('click', () => els.searchDialog.close());
    els.searchApplyBtn.addEventListener('click', () => { commitSearchValue(els.searchImeInput.value); els.searchDialog.close(); });
    els.searchClearBtn.addEventListener('click', () => { els.searchImeInput.value = ''; commitSearchValue(''); els.searchImeInput.focus(); });
    els.searchImeInput.addEventListener('keydown', (event) => {
      if (event.isComposing || event.keyCode === 229) return;
      event.stopPropagation();
      if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); commitSearchValue(els.searchImeInput.value); els.searchDialog.close(); }
    });
    els.systemPromptBtn.addEventListener('click', () => {
      // ngld/CEF can fail to expose IME composition inside overlay text fields.
      // Keep one overlay dialog, and use Chromium's native prompt as the reliable Chinese IME bridge.
      const current = els.searchImeInput.value || state.query || '';
      const value = window.prompt('输入要搜索的中文（可使用搜狗输入法）：', current);
      if (value !== null) {
        els.searchImeInput.value = value;
        setTimeout(() => {
          els.searchImeInput.focus();
          const pos = els.searchImeInput.value.length;
          els.searchImeInput.setSelectionRange(pos, pos);
        }, 20);
      }
    });

    els.partyHistoryBtn.addEventListener('click', () => onOpenPartyHistory?.());
    els.partyHistoryBack.addEventListener('click', hidePartyHistory);

    let partySearchComposing = false;
    const commitPartySearch = () => {
      if (partySearchComposing) return;
      state.partyHistoryQuery = els.partyHistorySearch.value || '';
      renderPartyHistory();
    };
    els.partyHistorySearch.addEventListener('compositionstart', () => { partySearchComposing = true; });
    els.partyHistorySearch.addEventListener('compositionend', () => {
      partySearchComposing = false;
      commitPartySearch();
    });
    els.partyHistorySearch.addEventListener('input', (event) => {
      if (event.isComposing || partySearchComposing) return;
      commitPartySearch();
    });
    els.partyHistorySearch.addEventListener('keydown', (event) => {
      if (event.isComposing || event.keyCode === 229) return;
      event.stopPropagation();
      if (event.key === 'Escape') {
        if (els.partyHistorySearch.value) {
          els.partyHistorySearch.value = '';
          commitPartySearch();
        } else {
          hidePartyHistory();
        }
      }
    });
    els.partyHistoryImeBtn.addEventListener('click', () => {
      const value = window.prompt('输入要搜索的玩家昵称：', els.partyHistorySearch.value || '');
      if (value !== null) {
        els.partyHistorySearch.value = value;
        state.partyHistoryQuery = value;
        renderPartyHistory();
      }
    });
    els.partyHistorySortTabs?.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-sort]');
      if (!button) return;
      const mode = button.dataset.sort || 'recent';
      if (!['recent', 'count', 'name'].includes(mode)) return;
      if (state.settings.partyHistorySort === mode) return;
      state.settings.partyHistorySort = mode;
      saveSettings();
      renderPartyHistory();
    });

    els.playerDetailClose.addEventListener('click', () => els.playerDetailDialog.close());

    els.messageContextMenu.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button || !contextMessage) return;
      const item = contextMessage;
      const action = button.dataset.action;
      hideContextMenu();
      if (action === 'copy-message') copyMessageText(item.message || '');
      else if (action === 'copy-line') copyMessageText(formatFullMessage(item));
      else if (action === 'copy-sender') copyMessageText(item.senderName || item.sender || '');
      else if (action === 'player-detail') requestPlayerDetail(item);
    });
    document.addEventListener('pointerdown', (event) => {
      if (!els.messageContextMenu.classList.contains('hidden') && !els.messageContextMenu.contains(event.target)) hideContextMenu();
    });
    window.addEventListener('blur', hideContextMenu);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') hideContextMenu();
    });

    els.tabs?.addEventListener('wheel', (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) || els.tabs.scrollWidth <= els.tabs.clientWidth) return;
      event.preventDefault();
      els.tabs.scrollLeft += event.deltaY;
    }, { passive: false });

    els.settingsBtn.addEventListener('click', () => els.settingsDialog.showModal());

    els.topTabsBtn.addEventListener('click', () => {
      renderTopTabsManager();
      els.topTabsDialog.showModal();
    });
    els.topTabsDialogClose.addEventListener('click', () => els.topTabsDialog.close());
    els.topTabsDoneBtn.addEventListener('click', () => els.topTabsDialog.close());
    els.topTabsResetBtn.addEventListener('click', resetTopTabs);

    els.customCategoriesBtn.addEventListener('click', () => {
      buildCustomCategoryList();
      els.customCategoriesDialog.showModal();
    });
    els.customCategoriesDialogClose.addEventListener('click', () => els.customCategoriesDialog.close());
    els.customCategoriesDoneBtn.addEventListener('click', () => els.customCategoriesDialog.close());
    els.customCategoryAddBtn.addEventListener('click', () => openCustomCategoryEditor(null));
    els.customCategoryNativeInputBtn.addEventListener('click', () => {
      const current = String(els.customCategoryName.value || '').slice(0, 12);
      const value = window.prompt('输入自定义分组名称（可使用搜狗输入法，最多12个字符）：', current);
      if (value !== null) {
        els.customCategoryName.value = String(value).trim().slice(0, 12);
        showCategoryValidation('');
        setTimeout(() => {
          els.customCategoryName.focus();
          const pos = els.customCategoryName.value.length;
          els.customCategoryName.setSelectionRange(pos, pos);
        }, 20);
      }
    });
    els.customCategoryEditorClose.addEventListener('click', () => els.customCategoryEditorDialog.close());
    els.customCategoryCancelBtn.addEventListener('click', () => els.customCategoryEditorDialog.close());
    els.customCategorySaveBtn.addEventListener('click', saveCustomCategoryFromEditor);
    els.customCategoryDeleteBtn.addEventListener('click', deleteEditingCustomCategory);
    els.customCategoryName.addEventListener('keydown', (event) => {
      if (event.isComposing || event.keyCode === 229) return;
      if (event.key === 'Enter') { event.preventDefault(); saveCustomCategoryFromEditor(); }
    });

    els.fontSize.addEventListener('input', () => {
      state.settings.fontSize = Number(els.fontSize.value);
      applySettings(); saveSettings(); render();
    });

    els.opacity.addEventListener('input', () => {
      state.settings.opacity = Number(els.opacity.value);
      applySettings(); saveSettings();
    });

    const PRESET_COLORS = [
      '#0D0F14','#111827','#1F2937','#000000','#2B1B17','#2B2238','#102A2A','#F5F5F5',
      '#FFFFFF','#D1D5DB','#A7F3D0','#93C5FD','#C4B5FD','#F9A8D4','#FDE68A','#FCA5A5'
    ];
    let colorTarget = 'backgroundColor';
    let colorDraft = '#FFFFFF';
    const parseHex = (hex) => {
      const m = String(hex || '').trim().match(/^#([0-9a-f]{6})$/i);
      if (!m) return null;
      const n = parseInt(m[1], 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const rgbToHex = (r,g,b) => '#' + [r,g,b].map(v => Math.max(0,Math.min(255,Number(v)||0)).toString(16).padStart(2,'0')).join('').toUpperCase();
    const syncColorDialog = (hex) => {
      const rgb = parseHex(hex); if (!rgb) return;
      colorDraft = rgbToHex(...rgb);
      els.colorR.value = rgb[0]; els.colorG.value = rgb[1]; els.colorB.value = rgb[2];
      els.colorRValue.value = rgb[0]; els.colorGValue.value = rgb[1]; els.colorBValue.value = rgb[2];
      els.colorHex.value = colorDraft;
      els.colorPreview.style.background = colorDraft;
    };
    const openColorDialog = (target, title = '', currentValue = '') => {
      colorTarget = target;
      let resolvedTitle = title;
      let resolvedValue = currentValue;

      if (!resolvedTitle) {
        resolvedTitle = target === 'backgroundColor' ? '选择背景颜色' : '选择字体颜色';
      }
      if (!resolvedValue) {
        if (target.startsWith('channel:')) {
          const key = target.slice('channel:'.length);
          resolvedValue = state.settings.channelColors?.[key] || '#FFFFFF';
        } else {
          resolvedValue = state.settings[target];
        }
      }

      els.colorDialogTitle.textContent = resolvedTitle;
      syncColorDialog(resolvedValue);
      els.colorDialog.showModal();
    };
    for (const hex of PRESET_COLORS) {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'color-preset'; btn.title = hex; btn.style.background = hex;
      btn.addEventListener('click', () => syncColorDialog(hex));
      els.colorPresets.appendChild(btn);
    }

    const buildChannelColorRows = () => {
      els.channelColorRows.replaceChildren();
      for (const entry of window.FF14Channels.COLOR_SETTINGS || []) {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'channel-color-row';

        const name = document.createElement('span');
        name.className = 'channel-color-name';
        name.textContent = entry.name;

        const preview = document.createElement('span');
        preview.className = 'channel-color-preview';
        const color = state.settings.channelColors?.[entry.key] || entry.defaultColor;
        preview.style.background = color;

        const value = document.createElement('span');
        value.className = 'channel-color-value';
        value.textContent = color.toUpperCase();

        row.append(name, preview, value);
        row.addEventListener('click', () => {
          openColorDialog(`channel:${entry.key}`, `选择「${entry.name}」消息颜色`, color);
        });
        els.channelColorRows.appendChild(row);
      }
    };

    buildChannelColorRows();
    const sliderColorChanged = () => syncColorDialog(rgbToHex(els.colorR.value, els.colorG.value, els.colorB.value));
    els.colorR.addEventListener('input', sliderColorChanged);
    els.colorG.addEventListener('input', sliderColorChanged);
    els.colorB.addEventListener('input', sliderColorChanged);
    els.colorHex.addEventListener('input', () => { const rgb = parseHex(els.colorHex.value); if (rgb) syncColorDialog(els.colorHex.value); });
    els.backgroundColorBtn.addEventListener('click', () => openColorDialog('backgroundColor'));
    els.fontColorBtn.addEventListener('click', () => openColorDialog('fontColor'));
    els.channelColorsBtn.addEventListener('click', () => { buildChannelColorRows(); els.channelColorsDialog.showModal(); });
    els.channelColorsDialogClose.addEventListener('click', () => els.channelColorsDialog.close());
    els.channelColorsDoneBtn.addEventListener('click', () => els.channelColorsDialog.close());
    els.resetChannelColorsBtn.addEventListener('click', () => {
      state.settings.channelColors = { ...(window.FF14Channels.DEFAULT_CHANNEL_COLORS || {}) };
      saveSettings();
      buildChannelColorRows();
      render(false);
      showToast('已恢复频道默认色');
    });
    els.colorDialogClose.addEventListener('click', () => els.colorDialog.close());
    els.colorCancelBtn.addEventListener('click', () => els.colorDialog.close());
    els.colorApplyBtn.addEventListener('click', () => {
      if (colorTarget.startsWith('channel:')) {
        const key = colorTarget.slice('channel:'.length);
        state.settings.channelColors[key] = colorDraft;
        saveSettings();
        buildChannelColorRows();
        render(false);
      } else {
        state.settings[colorTarget] = colorDraft;
        applySettings();
        saveSettings();
      }
      els.colorDialog.close();
      showToast('已应用颜色');
    });

    els.resetInterfaceBtn.addEventListener('click', () => {
      if (!window.confirm('恢复默认界面设置吗？不会删除聊天记录、组队记录或自定义分组。')) return;
      state.settings.fontSize = 15;
      state.settings.opacity = 72;
      state.settings.showTime = true;
      state.settings.backgroundColor = '#0D0F14';
      state.settings.fontColor = '#FFFFFF';
      state.settings.channelColors = { ...(window.FF14Channels.DEFAULT_CHANNEL_COLORS || {}) };
      state.settings.topTabs = defaultTopTabs();
      applySettings();
      saveSettings();
      buildTabs();
      buildChannelColorRows();
      render(false);
      showToast('已恢复默认界面');
    });

    els.showTime.addEventListener('change', () => {
      state.settings.showTime = els.showTime.checked;
      saveSettings(); render();
    });

    els.clearBtn.addEventListener('click', onClear);
  }

  function getSettings() {
    return JSON.parse(JSON.stringify(state.settings));
  }

  function importSettings(settings) {
    if (!settings || typeof settings !== 'object') return;
    Object.assign(state.settings, settings);
    const defaults = window.FF14Channels?.DEFAULT_CHANNEL_COLORS || {};
    const imported = { ...(state.settings.channelColors || {}) };
    if (imported.ls) for (let i = 1; i <= 8; i += 1) if (!imported[`ls${i}`]) imported[`ls${i}`] = imported.ls;
    if (imported.cwls) for (let i = 1; i <= 8; i += 1) if (!imported[`cwls${i}`]) imported[`cwls${i}`] = imported.cwls;
    state.settings.channelColors = { ...defaults, ...imported };
    state.settings.customCategories = normalizeCustomCategories(state.settings.customCategories);
    state.settings.topTabs = normalizeTopTabs(state.settings.topTabs, { fallbackToDefault: true });
    ensureActiveTabVisible();
    saveSettings();
    applySettings();
    buildTabs();
    render(false);
  }

  function getSelectedDate() {
    return state.selectedDate || todayDateKey();
  }

  function init(callbacks) {
    actions = callbacks || {};
    initElements();
    state.selectedDate = todayDateKey();
    setCalendarMonthFromDate(state.selectedDate);
    loadSettings();
    updateDateButton();
    buildTabs();
    wireEvents(actions);
  }

  window.FF14UI = {
    init, addMessage, replaceMessages, refreshMetadata,
    showPartyHistory, hidePartyHistory, showPlayerDetail,
    setStatus, render, getSettings, importSettings, getSelectedDate, notify: showToast,
  };
})();
