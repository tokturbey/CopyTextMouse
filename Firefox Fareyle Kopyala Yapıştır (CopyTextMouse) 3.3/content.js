"use strict";

const copytextmouse = {
  _copytextmouseTimer: null,
  _hideTimer: null,
  _isCopied: false,
  _moveTime: 0,
  _isSelectionActive: false,

  options: {
    copytextmouseTime: 900,
    pasteOnMiddleClick: false,
    collapseSelection: false,
    copyPlainText: false,
    copyProtectionBreak: false,
  },

  get selection() {
    return document.getSelection();
  },

  get notification() {
    let notification = document.querySelector(".copytextmouse-notification");
    if (!notification) {
      notification = document.createElement("div");
      notification.classList.add("copytextmouse-notification", "hide");
      document.body.append(notification);
    }
    return notification;
  },

  async copySelection() {
    this.hideNotification();
    let text = this.selection.toString();
    if (text.trim() === "") {
      return;
    }

    if (this.options.copyPlainText) {
      text = text.trim().replace(/[\r\n]+/g, "\n").replace(/[\s\t\f\v]+/g, " ");
    }

    try {
      await navigator.clipboard.writeText(text);
      this._isCopied = true;
      this.showNotification("Kopyalandı");
    } catch (ex) {
      console.error("Kopyalama başarısız oldu:", ex);
      this._isCopied = false;
    }
  },

  async pasteText(event) {
    const activeElement = document.activeElement;
    const isPasteable = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable);
    
    if (isPasteable) {
      event.preventDefault();
      
      try {
        const text = await navigator.clipboard.readText();
        document.execCommand('insertText', false, text);
        this.showNotification("Yapıştırıldı");
      } catch (ex) {
        console.error("Yapıştırma başarısız oldu:", ex);
        this.showNotification("Yapıştırma başarısız");
      }
    }
  },

  showNotification(message) {
    const notification = this.notification;
    notification.textContent = message;
    if (notification.classList.contains("hide")) {
      notification.classList.remove("hide");
    }

    clearTimeout(this._hideTimer);
    this._hideTimer = setTimeout(() => {
      this.hideNotification();
    }, 300);
  },

  hideNotification() {
    this.notification.classList.add("hide");
  },

  clearTimers() {
    clearTimeout(this._copytextmouseTimer);
    clearTimeout(this._hideTimer);
    this._copytextmouseTimer = null;
    this._hideTimer = null;
  },

  toggleSelectionBreak(enable) {
    if (this.options.copyProtectionBreak) {
      if (enable) {
        document.documentElement.setAttribute("copytextmouse", "enabled");
      } else {
        document.documentElement.removeAttribute("copytextmouse");
      }
    }
  },

  handleEvent(event) {
    if (!event.isTrusted) {
      return;
    }

    switch (event.type) {
      case "mousedown":
        this.toggleSelectionBreak(true);
        
        // Yeni kontrol: Eğer seçenek aktifse yapıştırma işlemini yap
        if (event.button === 1 && this.options.pasteOnMiddleClick) {
          this.pasteText(event);
          this.toggleSelectionBreak(false);
          return;
        }

        if (this.iscopytextmouseBlocker(event)) {
          this.toggleSelectionBreak(false);
          return;
        }

        document.addEventListener("mouseup", this, { once: true });
        document.addEventListener("mousemove", this, { once: true });
        this.addListener("selectionchange");

        this.clearTimers();
        this._copytextmouseTimer = setTimeout(() => {
          this.copySelection();
        }, this.options.copytextmouseTime);
        break;

      case "mouseup":
        document.removeEventListener("mousemove", this);
        this.removeListener("selectionchange");
        this.toggleSelectionBreak(false);
        
        this.clearTimers();
        if (this._isCopied) {
          if (this.options.collapseSelection) {
            this.selection.collapse(this.selection.focusNode, this.selection.focusOffset);
          }
        }
        this._isCopied = false;
        break;

      case "mousemove":
        this.clearTimers();
        this._moveTime = Date.now();
        break;

      case "selectionchange":
        if (this._moveTime && (Date.now() - this._moveTime) > 99) {
          break;
        }
        if (this.selection.isCollapsed) {
          this.clearTimers();
          this.hideNotification();
        } else {
          this.clearTimers();
          this._copytextmouseTimer = setTimeout(() => {
            this.copySelection();
          }, this.options.copytextmouseTime);
        }
        break;
    }
  },

  addListener(type, capture = false) {
    document.addEventListener(type, this, { capture });
  },

  removeListener(type) {
    document.removeEventListener(type, this);
  },

  async init() {
    const items = await chrome.storage.local.get(this.options);
    Object.assign(this.options, items);

    chrome.storage.local.onChanged.addListener(changes => {
      for (const [key, { newValue }] of Object.entries(changes)) {
        this.options[key] = newValue;
      }
    });

    this.addListener("mousedown");
  },

  iscopytextmouseBlocker(event) {
    if (event.button !== 0) {
      return true;
    }

    const selector = `button, input, meter, progress, select, textarea, [role="button"], [role="slider"]`;
    let node = event.target;

    if (node instanceof Element && node.matches(selector)) {
      return true;
    }

    if (!event.altKey) {
      const link = node.closest("a, area");
      if (link && link.hasAttribute("href")) {
        return true;
      }
    }
    return false;
  },
};

copytextmouse.init();