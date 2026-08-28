(() => {
  "use strict";

  const HOST = location.hostname;
  const HREF = location.href;
  const IS_SLIDES =
    /docs\.google\.com|slides\.google\.com/.test(HOST) &&
    (/\/presentation\//.test(location.pathname) || /\/picker/.test(location.pathname) || /picker/.test(HREF));
  const IS_PICKER = /picker/.test(HREF) || /picker/.test(location.pathname);
  const IS_OFFICE =
    /officeapps\.live\.com$/.test(HOST) ||
    /(^|\.)office\.com$/.test(HOST) ||
    HOST === "powerpoint.office.com";

  if (!IS_SLIDES && !IS_OFFICE && !IS_PICKER) return;

  const YOUTUBE_URL = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)\//i;

  const MENU_LABELS = [
    /^video$/i,
    /^online video$/i,
    /^online videos$/i,
    /^youtube$/i,
    /^from youtube$/i,
    /^insert video$/i,
    /^web video$/i,
  ];

  const DIALOG_HINTS = [
    /insert video/i,
    /search youtube/i,
    /search on youtube/i,
    /youtube search/i,
    /from youtube/i,
    /online video/i,
    /enter the address for online video/i,
    /paste a youtube/i,
    /insert a video from youtube/i,
  ];

  const CANVAS_SKIP = [
    ".punch-viewer-content",
    ".punch-filmstrip",
    "[contenteditable='true']",
    ".sketchy-text-content",
    ".docs-texteventtarget-iframe",
    ".office-canvas",
    "#SlideContainer",
    ".SlideView",
  ].join(", ");

  let toastTimer = 0;
  let lastToast = 0;

  function visibleText(el) {
    const labeled = el.getAttribute("aria-label") || el.getAttribute("title") || el.getAttribute("data-unique-id") || "";
    const text = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
    return `${labeled} ${text}`.trim();
  }

  function isOnCanvas(el) {
    try {
      return !!(el.closest && el.closest(CANVAS_SKIP));
    } catch {
      return false;
    }
  }

  function inChromeUi(el) {
    if (!el || el.nodeType !== 1) return false;
    if (isOnCanvas(el)) return false;
    return !!(
      el.closest(
        '[role="menu"], [role="menubar"], [role="menuitem"], [role="dialog"], [role="toolbar"], [role="tablist"], [role="tab"], [role="listbox"], .goog-menu, .goog-menuitem, .goog-menu-button, .modal-dialog, .docs-dialog, .docs-picker, .office-dialog, .ms-Dialog, .ms-ContextualMenu, [data-unique-id*="Ribbon"], [data-unique-id*="Insert"], .fui-Dialog, .fui-MenuList, .fui-MenuItem'
      ) || IS_PICKER
    );
  }

  function isVideoMenuLabel(text) {
    const t = text.replace(/\s+/g, " ").trim();
    const firstLine = t.split("\n")[0].replace(/\s*Ctrl.+$/i, "").replace(/\s*⌘.+$/u, "").trim();
    return MENU_LABELS.some((re) => re.test(firstLine) || re.test(t));
  }

  function looksLikeInsertVideoDialog(el) {
    const t = visibleText(el);
    if (!t) return false;
    return DIALOG_HINTS.some((re) => re.test(t)) || (/youtube/i.test(t) && /insert|search|url|paste/i.test(t));
  }

  function showToast(message) {
    const now = Date.now();
    if (now - lastToast < 1500) return;
    lastToast = now;
    document.querySelectorAll(".yti-toast").forEach((n) => n.remove());
    const toast = document.createElement("div");
    toast.className = "yti-toast";
    toast.textContent = message;
    (document.body || document.documentElement).appendChild(toast);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.remove(), 2200);
  }

  function disableEl(el, hide) {
    if (!el || el.dataset.ytiProcessed === "1") return;
    el.dataset.ytiProcessed = "1";
    if (hide) {
      el.classList.add("yti-blocked");
      el.dataset.ytiBlocked = "1";
    } else {
      el.classList.add("yti-disabled");
      el.dataset.ytiDisabled = "1";
    }
    el.setAttribute("aria-disabled", "true");
    el.setAttribute("disabled", "true");
    if (el.classList && el.classList.contains("goog-menuitem")) {
      el.classList.add("goog-menuitem-disabled");
    }
  }

  function dismissDialog(dialog) {
    const close = dialog.querySelector(
      '[aria-label="Close"], [aria-label="Cancel"], [data-tooltip="Close"], .modal-dialog-title-close, .docs-dialog-close, button[title="Close"]'
    );
    if (close) {
      try {
        close.click();
        return;
      } catch {
        /* ignore */
      }
    }
    disableEl(dialog, true);
  }

  function blockYouTubeTabs(dialog) {
    const tabs = dialog.querySelectorAll('[role="tab"], [role="tablist"] [role="button"], .goog-tab');
    let blockedTab = false;
    tabs.forEach((tab) => {
      const t = visibleText(tab);
      if (/youtube|search/i.test(t) && !/drive|computer|upload|this device/i.test(t)) {
        disableEl(tab, true);
        blockedTab = true;
      }
    });

    dialog.querySelectorAll("input, textarea").forEach((input) => {
      const ph = `${input.getAttribute("placeholder") || ""} ${input.getAttribute("aria-label") || ""}`;
      if (/youtube|search/i.test(ph) || YOUTUBE_URL.test(input.value || "")) {
        disableEl(input, false);
        input.addEventListener(
          "input",
          (e) => {
            if (YOUTUBE_URL.test(input.value) || /youtube/i.test(ph)) {
              e.stopImmediatePropagation();
              input.value = "";
              showToast("YouTube insert is disabled.");
            }
          },
          true
        );
      }
    });

    return blockedTab;
  }

  function scan(root) {
    if (!root || root.nodeType !== 1 && root.nodeType !== 9) return;

    const scope = root.querySelectorAll
      ? root.querySelectorAll(
          '[role="menuitem"], [role="option"], .goog-menuitem, button, [role="button"], [role="tab"], [data-unique-id], [aria-label]'
        )
      : [];

    scope.forEach((el) => {
      if (isOnCanvas(el) || !inChromeUi(el)) return;
      const label = visibleText(el);
      if (!label) return;

      if (IS_SLIDES || IS_PICKER) {
        if (el.getAttribute("id") === "insertVideoButton" || /insertVideo/i.test(el.id || "")) {
          disableEl(el, false);
          return;
        }
        if (el.getAttribute("role") === "menuitem" && isVideoMenuLabel(label)) {
          disableEl(el, false);
        }
        if (el.classList.contains("goog-menuitem") && isVideoMenuLabel(label)) {
          disableEl(el, false);
        }
      }

      if (IS_OFFICE) {
        if (
          /online video/i.test(label) ||
          /^youtube$/i.test(label.trim()) ||
          /from youtube/i.test(label) ||
          /insert.*youtube/i.test(label)
        ) {
          disableEl(el, false);
        }
        const uid = el.getAttribute("data-unique-id") || "";
        if (/OnlineVideo|InsertVideoOnline|OnlineVideos/i.test(uid)) {
          disableEl(el, false);
        }
      }
    });

    const dialogs = (root.querySelectorAll && root.querySelectorAll('[role="dialog"], .modal-dialog, .docs-dialog, .docs-picker, .ms-Dialog, .fui-Dialog, .office-dialog')) || [];
    dialogs.forEach((dialog) => {
      if (isOnCanvas(dialog)) return;
      if (!looksLikeInsertVideoDialog(dialog) && !IS_PICKER) return;

      const t = visibleText(dialog);
      const youtubeHeavy = /youtube|search youtube|online video/i.test(t);

      if (IS_PICKER && youtubeHeavy) {
        dismissDialog(dialog);
        showToast("YouTube insert is disabled.");
        return;
      }

      if (youtubeHeavy) {
        blockYouTubeTabs(dialog);
        // Google Slides Insert → Video is the YouTube embed menu; close it.
        if (IS_SLIDES || /search youtube|online video|from youtube/i.test(t)) {
          dismissDialog(dialog);
          showToast("YouTube insert is disabled.");
        }
      }
    });
  }

  function shouldBlockEvent(target) {
    if (!target || target.nodeType !== 1) {
      target = target && target.parentElement;
    }
    if (!target) return false;
    if (isOnCanvas(target)) return false;
    const item = target.closest(
      '[role="menuitem"], .goog-menuitem, button, [role="button"], [role="tab"], [data-yti-disabled], [data-yti-blocked], [data-unique-id]'
    );
    if (!item || !inChromeUi(item)) return false;
    if (item.dataset.ytiDisabled === "1" || item.dataset.ytiBlocked === "1") return true;
    const label = visibleText(item);
    if ((IS_SLIDES || IS_PICKER) && isVideoMenuLabel(label) && item.closest('[role="menu"], .goog-menu, [role="menubar"]')) {
      return true;
    }
    if (IS_OFFICE && /online video|from youtube|^youtube$/i.test(label)) {
      return true;
    }
    return false;
  }

  function onPointer(e) {
    if (shouldBlockEvent(e.target)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      showToast("YouTube insert is disabled.");
    }
  }

  function onKey(e) {
    if (shouldBlockEvent(e.target) && (e.key === "Enter" || e.key === " " || e.key === "Spacebar")) {
      e.preventDefault();
      e.stopImmediatePropagation();
      showToast("YouTube insert is disabled.");
    }
  }

  function onPaste(e) {
    const dialog = e.target && e.target.closest && e.target.closest('[role="dialog"], .modal-dialog, .docs-dialog, .ms-Dialog, .fui-Dialog');
    if (!dialog) return;
    const clip = (e.clipboardData && e.clipboardData.getData("text")) || "";
    if (YOUTUBE_URL.test(clip) && looksLikeInsertVideoDialog(dialog)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      showToast("YouTube insert is disabled.");
    }
  }

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "childList") {
        m.addedNodes.forEach((node) => {
          if (node.nodeType === 1) scan(node);
        });
      } else if (m.type === "attributes" && m.target && m.target.nodeType === 1) {
        if (m.target.getAttribute("role") === "dialog" || m.target.classList.contains("goog-menu")) {
          scan(m.target);
        }
      }
    }
  });

  function start() {
    const root = document.documentElement || document.body;
    if (!root) return;
    scan(document);
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-label", "class", "role", "style", "data-unique-id"],
    });
  }

  document.addEventListener("click", onPointer, true);
  document.addEventListener("mousedown", onPointer, true);
  document.addEventListener("pointerdown", onPointer, true);
  document.addEventListener("keydown", onKey, true);
  document.addEventListener("paste", onPaste, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
  setInterval(() => {
    if (document.body) scan(document.body);
  }, 1500);
})();
