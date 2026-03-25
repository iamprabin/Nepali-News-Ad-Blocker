(() => {
  'use strict';

  /** @type {string[]} Cosmetic selectors for ads */
  const adSelectors = [
    'ins.adsbygoogle',
    '[data-ad-slot]',
    '[data-ad-client]',
    'div[data-google-query-id]',
    'div[id^="div-gpt-"]',
    'iframe[src*="doubleclick.net"]',
    'iframe[src*="googlesyndication.com"]',
    'iframe[src*="googleadservices.com"]',
    '[id^="google_ads_iframe"]',
    '[id^="aswift_"]',
    'div[id^="taboola-"]',
    '[class*="ad-slot"]',
    '[class*="ad_unit"]',
    '[class*="adunit"]',
    '[class*="ad-unit"]',
    '[class*="ad_wrapper"]',
    '[class*="ad-wrapper"]',
    '[class*="ad_container"]',
    '[class*="ad-container"]',
    '[class*="banner-ad"]',
    '[class*="banner_ad"]',
    '[class*="-ad-"]',
    'div[class*="advert"]',
    'div[id*="advert"]',
    '[class*="advertisement"]',
    'div[aria-label*="advertisement"]',
    'div[class*="bigyaapan"]',
    'div[id*="bigyaapan"]',
    '[class~="okam-ad"]',
    '[class~="sp-ad-unit"]',
    '[class~="top-ad"]',
    '[class~="ek-ad-wrapper"]',
    '[class~="ad-widget"]',
  ];

  const nepaliListGenericSelectors = [
    '[class*="adalyticsblock"]',
    '.in__between_ads',
    '[class~="desktop-ad"]',
    '[class~="mobile-ad"]',
    '[class*="roadblock"]',
    '[id*="roadblock"]',
  ];

  /** @type {Record<string, string[]>} Suffix match: host equals key or host.endsWith("." + key) */
  const nepaliListHostSelectors = {
    'onlinekhabar.com': [
      '.nh_widget_wrap',
      '.ok-full-widht-adv',
      '.ok-post-emoji',
      '.okam-ad-position-wrap',
      '.okam-device-desktop.flip-score-card-bottom.carousel',
      '.tribox-add',
    ],
    'ekantipur.com': [
      '#roadblock-ad',
      '.qfx-banner-section',
      '.qfx-quiz-container',
      '.sponsor-mobile',
      '.static-sponsor',
    ],
    'deshsanchar.com': ['.advertise-wrap', '.cube-container', '.sp-advertise-section'],
    'baahrakhari.com': ['.modalbox'],
    'ratopati.com': ['.content-banner--single'],
    'nepalpress.com': ['.bannerSticky', '.single-inbetweenstories-2', '.roadblock', '[class*="npad"]'],
    'nagariknetwork.com': ['[id^="adverts"]'],
    'thehimalayantimes.com': ['#fixed-social', '.stayInTouch'],
    'ukeraa.com': ['#roadBlock'],
  };

  function selectorsForHostname(hostname) {
    const h = String(hostname || '').toLowerCase();
    const out = [];
    for (const [domain, sels] of Object.entries(nepaliListHostSelectors)) {
      if (h === domain || h.endsWith('.' + domain)) {
        out.push(...sels);
      }
    }
    return out;
  }

  const DEBOUNCE_MS = 280;
  const IDLE_TIMEOUT_MS = 450;
  const CHUNK_SIZE = 250;

  let combinedSelector = '';
  try {
    const merged = [
      ...adSelectors,
      ...nepaliListGenericSelectors,
      ...selectorsForHostname(location.hostname),
    ];
    const ok = merged.filter((sel) => {
      try {
        document.querySelectorAll(sel);
        return true;
      } catch {
        return false;
      }
    });
    combinedSelector = ok.join(', ');
  } catch {
    combinedSelector = '';
  }

  if (!combinedSelector) {
    return;
  }

  let observer = null;
  let debounceTimer = null;
  let idleCallbackId = null;
  let observing = false;
  let scanBusy = false;

  function disconnectObserver() {
    if (!observer || !observing) return;
    try {
      observer.disconnect();
    } catch {
      /* ignore */
    }
    observing = false;
  }

  function connectObserver() {
    if (!observer || !document.body || observing) return;
    try {
      observer.observe(document.body, { childList: true, subtree: true });
      observing = true;
    } catch {
      /* ignore */
    }
  }

  function applyHideToElements(elements, start, end) {
    for (let i = start; i < end; i++) {
      const el = elements[i];
      if (!el || el.nodeType !== Node.ELEMENT_NODE) continue;
      try {
        el.style.setProperty('display', 'none', 'important');
      } catch {
        /* ignore */
      }
    }
  }

  function queryMatches() {
    try {
      return document.querySelectorAll(combinedSelector);
    } catch {
      return null;
    }
  }

  function runScanAndReconnect(done) {
    if (!document.body) {
      done();
      return;
    }

    disconnectObserver();

    const list = queryMatches();
    if (!list || list.length === 0) {
      done();
      return;
    }

    if (list.length <= CHUNK_SIZE) {
      try {
        applyHideToElements(list, 0, list.length);
      } catch {
        /* ignore */
      }
      done();
      return;
    }

    let index = 0;
    const step = () => {
      try {
        const end = Math.min(index + CHUNK_SIZE, list.length);
        applyHideToElements(list, index, end);
        index = end;
        if (index < list.length) {
          requestAnimationFrame(step);
        } else {
          done();
        }
      } catch {
        done();
      }
    };
    requestAnimationFrame(step);
  }

  function afterScan() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          connectObserver();
        } finally {
          scanBusy = false;
        }
      });
    });
  }

  function performBlockingPass() {
    if (scanBusy) {
      scheduleBlockingPass();
      return;
    }
    scanBusy = true;
    runScanAndReconnect(afterScan);
  }

  function cancelScheduled() {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (idleCallbackId !== null && typeof cancelIdleCallback === 'function') {
      cancelIdleCallback(idleCallbackId);
      idleCallbackId = null;
    }
  }

  function scheduleBlockingPass() {
    cancelScheduled();
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      const run = () => {
        idleCallbackId = null;
        try {
          performBlockingPass();
        } catch {
          connectObserver();
        }
      };
      if (typeof requestIdleCallback === 'function') {
        idleCallbackId = requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS });
      } else {
        setTimeout(run, 0);
      }
    }, DEBOUNCE_MS);
  }

  observer = new MutationObserver((records) => {
    for (let r = 0; r < records.length; r++) {
      if (records[r].addedNodes && records[r].addedNodes.length > 0) {
        scheduleBlockingPass();
        break;
      }
    }
  });

  function initialPass() {
    try {
      const list = queryMatches();
      if (list && list.length) {
        if (list.length <= CHUNK_SIZE) {
          applyHideToElements(list, 0, list.length);
        } else {
          let index = 0;
          const step = () => {
            try {
              const end = Math.min(index + CHUNK_SIZE, list.length);
              applyHideToElements(list, index, end);
              index = end;
              if (index < list.length) {
                requestAnimationFrame(step);
              } else {
                connectObserver();
              }
            } catch {
              connectObserver();
            }
          };
          requestAnimationFrame(step);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    connectObserver();
  }

  function onVisibilityChange() {
    if (document.hidden) {
      cancelScheduled();
      disconnectObserver();
    } else {
      try {
        performBlockingPass();
      } catch {
        connectObserver();
      }
    }
  }

  function onPageHide() {
    cancelScheduled();
    disconnectObserver();
  }

  if (document.body) {
    initialPass();
  } else {
    const boot = new MutationObserver(() => {
      if (!document.body) return;
      boot.disconnect();
      initialPass();
    });
    try {
      boot.observe(document.documentElement, { childList: true, subtree: true });
    } catch {
      /* ignore */
    }
  }

  document.addEventListener('visibilitychange', onVisibilityChange, { passive: true });
  window.addEventListener('pagehide', onPageHide, { passive: true });
})();
