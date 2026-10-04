chrome.action.onClicked.addListener(e=>{e.id!=null&&chrome.sidePanel.open({tabId:e.id})});chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:!0}).catch(()=>{});
