function updateCount(tabId, isOnRemoved) {
  chrome.tabs.query({})
      .then((tabs) => {
        let length = tabs.length;
        
        // onRemoved fires too early and the count is one too many.
        // see https://bugzilla.mozilla.org/show_bug.cgi?id=1396758
        if (isOnRemoved && tabId && tabs.map((t) => { return t.id; }).includes(tabId)) {
          length--;
        }
        
        chrome.action.setBadgeText({text: length.toString()});
        if (length > 0) {
          chrome.action.setBadgeBackgroundColor({'color': 'green'});
        }
      });
}

chrome.tabs.onRemoved.addListener(
    (tabId) => { updateCount(tabId, true);
    });
chrome.tabs.onCreated.addListener(
    (tabId) => { updateCount(tabId, false);
    });
updateCount();