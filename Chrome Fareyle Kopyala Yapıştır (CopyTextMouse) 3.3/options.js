"use strict";

async function saveOptions(event) {
  const el = event.target;
  let res = {};

  switch (el.id) {
    case "copytextmouseTime":
      res.copytextmouseTime = el.valueAsNumber * 900;
      break;
    case "pasteOnMiddleClick":
      res.pasteOnMiddleClick = el.checked;
      break;
    case "collapseSelection":
      res.collapseSelection = el.checked;
      break;
    case "copyPlainText":
      res.copyPlainText = el.checked;
      break;
    case "copyProtectionBreak":
      res.copyProtectionBreak = el.checked;
      break;
    default:
      return;
  }
  await chrome.storage.local.set(res);
}

async function restoreOptions() {
  const defaults = {
    copytextmouseTime: 900,
    collapseSelection: false,
    pasteOnMiddleClick: false,
    copyPlainText: true,
    copyProtectionBreak: false,
  };
  const items = await chrome.storage.local.get(defaults);

  document.getElementById("copytextmouseTime").valueAsNumber = items.copytextmouseTime / 900;
  document.getElementById("pasteOnMiddleClick").checked = items.pasteOnMiddleClick;
  document.getElementById("collapseSelection").checked = items.collapseSelection;
  document.getElementById("copyPlainText").checked = items.copyPlainText;
  document.getElementById("copyProtectionBreak").checked = items.copyProtectionBreak;
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelectorAll('input').forEach(input => {
    input.addEventListener("change", saveOptions);
});