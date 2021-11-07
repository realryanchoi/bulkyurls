// background.js
chrome.storage.local.get(["badgeText"], ({ badgeText }) => {
  chrome.action.setBadgeText({ text: badgeText });
});

// Listener is registered on startup
chrome.action.onClicked.addEventListener(handleActionClick);

chrome.runtime.onInstalled.addEventListener(function() {
  for (const key of Object.keys(kLocales)) {
    chrome.contextMenus.create({
      id: key,
      title: kLocales[key],
      type: 'normal',
      contexts: ['selection'],
    });
  }
});

const kLocales = {
  'com.au': 'Australia',
  'com.br': 'Brazil',
  'ca': 'Canada',
  'cn': 'China',
  'fr': 'France',
  'it': 'Italy',
  'co.in': 'India',
  'co.jp': 'Japan',
  'com.ms': 'Mexico',
  'ru': 'Russia',
  'co.za': 'South Africa',
  'co.uk': 'United Kingdom'
};

function updateCount(tabId, isOnRemoved) {
  browser.tabs.query({})
      .then((tabs) => {
        let length = tabs.length;
        
        // onRemoved fires too early and the count is one too many.
        // see https://bugzilla.mozilla.org/show_bug.cgi?id=1396758
        if (isOnRemoved && tabId && tabs.map((t) => { return t.id; }).includes(tabId)) {
          length--;
        }
        
        browser.browserAction.setBadgeText({text: length.toString()});
        if (length > 2) {
          browser.browserAction.setBadgeBackgroundColor({'color': 'green'});
        } else {
          browser.browserAction.setBadgeBackgroundColor({'color': 'red'});
        }
      });
}


browser.tabs.onRemoved.addListener(
    (tabId) => { updateCount(tabId, true);
    });
browser.tabs.onCreated.addListener(
    (tabId) => { updateCount(tabId, false);
    });
updateCount();
