"use strict";

chrome.runtime.onInstalled.addListener(async details => {
  if (details.reason === "install") {
    const url = chrome.runtime.getURL("copytextmouse.html");
    const tab = await chrome.tabs.create({ url });
    console.log(`Eklenti yüklendi, hoş geldiniz sayfası açılıyor: ${tab.url}`);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "copyText") {
    navigator.clipboard.writeText(message.text).then(() => {
      sendResponse({ copied: true });
    }).catch(error => {
      console.error("Metin kopyalanamadı:", error);
      sendResponse({ copied: false });
    });
    return true; // Asenkron yanıtı işaretle
  }
  return false;
});
