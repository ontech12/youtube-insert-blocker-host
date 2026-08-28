(() => {
  "use strict";

  if (window === window.top) return;

  const playback = /\/embed\/|\/embed\?/.test(location.href);
  if (playback) return;

  function embeddedInSlidesOrOffice() {
    try {
      const origins = location.ancestorOrigins;
      if (origins && origins.length) {
        return [...origins].some((o) =>
          /docs\.google\.com|slides\.google\.com|officeapps\.live\.com|(^|\.)office\.com/.test(o)
        );
      }
    } catch {
      /* ignore */
    }
    return /docs\.google\.com|slides\.google\.com|officeapps\.live\.com|office\.com/.test(
      document.referrer || ""
    );
  }

  if (!embeddedInSlidesOrOffice()) return;

  const stop = () => {
    try {
      document.documentElement.innerHTML =
        '<body style="font:14px system-ui;padding:24px;color:#111">YouTube search is disabled in slides.</body>';
    } catch {
      /* ignore */
    }
  };

  stop();
  document.addEventListener("DOMContentLoaded", stop);
})();
