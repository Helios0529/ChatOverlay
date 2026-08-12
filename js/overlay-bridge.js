/*
 * Minimal local bridge for ngld/OverlayPlugin.
 * Only implements what this overlay needs: addOverlayListener() and startOverlayEvents().
 * It intentionally targets direct execution inside OverlayPlugin and has no WebSocket/browser mode.
 */
(() => {
  'use strict';

  const subscribers = Object.create(null);
  let startRequested = false;
  let subscribed = false;

  function dispatch(message) {
    if (!message || !message.type) return;
    const handlers = subscribers[message.type];
    if (!handlers) return;
    for (const handler of handlers) {
      try { handler(message); }
      catch (error) { console.error('[FF14ChatOverlay] event handler error:', error); }
    }
  }

  function tryStart() {
    if (!startRequested || subscribed) return;

    const api = window.OverlayPluginApi;
    if (!api || !api.ready || typeof api.callHandler !== 'function') {
      setTimeout(tryStart, 250);
      return;
    }

    window.__OverlayCallback = dispatch;
    api.callHandler(JSON.stringify({
      call: 'subscribe',
      events: Object.keys(subscribers),
    }), () => {});

    subscribed = true;
    window.dispatchEvent(new CustomEvent('ff14overlayconnected'));
  }

  window.addOverlayListener = (eventName, callback) => {
    if (!subscribers[eventName]) subscribers[eventName] = [];
    subscribers[eventName].push(callback);
  };

  window.startOverlayEvents = () => {
    startRequested = true;
    tryStart();
  };
})();
