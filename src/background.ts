// Background service worker – Manifest V3
// Opens the side panel when the user clicks the extension icon.

chrome.action.onClicked.addListener((tab) => {
  if (tab.id == null) return
  chrome.sidePanel.open({ tabId: tab.id })
})

// Keep the side panel open on all URLs (optional – remove if you want it
// to close when navigating away from specific pages)
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
  // Older Chrome versions may not support setPanelBehavior
})

export {}
