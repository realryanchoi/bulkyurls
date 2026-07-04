// SettingsManager

// Schema version for chrome.storage.local — increment when storage structure changes.
// This is independent of the extension version in manifest.json.
var CURRENT_VERSION = "5";
var temp_urls = [];

function SettingsManager() {}

SettingsManager.prototype.load = async function() {
  const result = await chrome.storage.local.get(["settings"]);
  if (!result.settings) return this.init();
  try {
    return JSON.parse(result.settings);
  } catch(error) {
    var settings = await this.init();
    settings.error = "Error: " + error + "|Data:" + result.settings;
    return settings;
  }
};

SettingsManager.prototype.save = function(settings) {
  if (settings.error !== undefined) {
    delete settings.error;
  }
  chrome.storage.local.set({ settings: JSON.stringify(settings) });
};

SettingsManager.prototype.init = async function() {
  var settings = {
    "actions": {
      "101": {
        "mouse": 0,  // left mouse button
        "key": 16,   // shift key
        "action": "tabs",
        "color": "#FFA500",
        "options": {
          "smart": 0,
          "ignore": [0],
          "delay": 0,
          "close": 0,
          "block": true,
          "reverse": false,
          "end": false
        }
      }
    },
    "blocked": []
  };

  await chrome.storage.local.set({ settings: JSON.stringify(settings), version: CURRENT_VERSION });
  return settings;
};

SettingsManager.prototype.update = async function() {
  await this.init();
};

SettingsManager.prototype.ensureInit = async function() {
  const r = await chrome.storage.local.get(["version"]);
  if (!r.version) await this.init();
  else if (r.version !== CURRENT_VERSION) await this.update();
};

var settingsManager = new SettingsManager();
settingsManager.ensureInit().catch(function(e) {
  console.error("BulkyURLs: settings init failed", e);
});

function openTab(urls, delay, windowId, tabIndex, closeDelay) {
  if (urls.length === 0) return;
  var url = urls.shift();
  var tabProps = { url: url.url, active: false };
  if (windowId != null) tabProps.windowId = windowId;
  if (tabIndex != null) {
    tabProps.index = tabIndex;
    tabIndex++;
  }
  chrome.tabs.create(tabProps, function(tab) {
    if (closeDelay > 0) {
      setTimeout(function() {
        chrome.tabs.remove(tab.id);
      }, closeDelay * 1000);
    }
    if (urls.length > 0) {
      if (delay > 0) {
        setTimeout(function() {
          openTab(urls, delay, windowId, tabIndex, closeDelay);
        }, delay * 1000);
      } else {
        openTab(urls, delay, windowId, tabIndex, closeDelay);
      }
    }
  });
}

// ------- Bulk opening for the popup / side panel -------

function sleep(seconds) {
  return new Promise(function(resolve) { setTimeout(resolve, seconds * 1000); });
}

function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function createTab(props) {
  return new Promise(function(resolve) { chrome.tabs.create(props, resolve); });
}

function createWindow(props) {
  return new Promise(function(resolve) { chrome.windows.create(props, resolve); });
}

// Resolves when the tab reaches status "complete" (or after a 30s safety timeout,
// so a hung page never stalls the rest of the batch).
function waitForTabLoad(tabId) {
  return new Promise(function(resolve) {
    var timer = setTimeout(done, 30000);
    function done() {
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }
    function listener(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === "complete") done();
    }
    chrome.tabs.onUpdated.addListener(listener);
    // The tab may already be done loading by the time the listener attaches
    chrome.tabs.get(tabId, function(tab) {
      if (!chrome.runtime.lastError && tab && tab.status === "complete") done();
    });
  });
}

function scheduleClose(tabId, seconds) {
  setTimeout(function() {
    chrome.tabs.remove(tabId, function() { void chrome.runtime.lastError; });
  }, seconds * 1000);
}

// Opens urls in batches according to the popup's opener settings.
// mode: "tabs" (current window) or "win" (one new window, unless windowPerBatch).
async function openBulk(urls, mode, o) {
  urls = urls.slice();
  if (urls.length === 0) return;
  if (o.randomOrder) shuffle(urls);
  if (o.reverseOrder) urls.reverse();
  if (o.urlLimit > 0) urls = urls.slice(0, o.urlLimit);

  var batchSize = Math.max(1, parseInt(o.batchSize, 10) || 1);
  var delay = Math.max(0, parseFloat(o.delay) || 0);
  var closeSecs = (o.autoClose && o.autoCloseSecs > 0) ? o.autoCloseSecs : 0;

  var targetWindowId = null;
  if (mode === "win" && !o.windowPerBatch) {
    var first = urls.shift();
    var win = await createWindow({ url: first });
    targetWindowId = win.id;
    if (closeSecs) scheduleClose(win.tabs[0].id, closeSecs);
    if (o.waitForLoad) await waitForTabLoad(win.tabs[0].id);
    if (urls.length === 0) return;
  }

  var batches = [];
  for (var i = 0; i < urls.length; i += batchSize) {
    batches.push(urls.slice(i, i + batchSize));
  }

  for (var b = 0; b < batches.length; b++) {
    var batch = batches[b];
    var batchWindowId = targetWindowId;

    if (o.windowPerBatch) {
      var newWin = await createWindow({ url: batch[0] });
      batchWindowId = newWin.id;
      if (closeSecs) scheduleClose(newWin.tabs[0].id, closeSecs);
      if (o.waitForLoad) await waitForTabLoad(newWin.tabs[0].id);
      batch = batch.slice(1);
    }

    for (var t = 0; t < batch.length; t++) {
      var props = { url: batch[t], active: false };
      if (batchWindowId != null) props.windowId = batchWindowId;
      var tab = await createTab(props);
      if (closeSecs) scheduleClose(tab.id, closeSecs);
      if (o.waitForLoad) await waitForTabLoad(tab.id);
    }

    if (delay > 0 && b < batches.length - 1) {
      await sleep(delay);
    }
  }
}

function uniqueURLs(arr) {
  var a = [];
  var l = arr.length;
  for (var i = 0; i < l; i++) {
    for (var j = i + 1; j < l; j++) {
      if (arr[i].url === arr[j].url) j = ++i;
    }
    a.push(arr[i]);
  }
  return a;
}

function handleRequests(request, sender, sendResponse) {
  switch(request.message) {
    case "links":
      var numberOfLinks = request.count;
      if (numberOfLinks === 0) {
        chrome.action.setBadgeText({text: ''});
      } else {
        chrome.action.setBadgeText({text: numberOfLinks.toString()});
        chrome.action.setBadgeBackgroundColor({color: 'green'});
      }
      break;

    case "activate":
      if(request.setting.options.block) {
        request.urls = uniqueURLs(request.urls);
      }

      if(request.urls.length === 0) {
        return;
      }

      if(request.setting.options.reverse) {
        request.urls.reverse();
      }

      switch(request.setting.action) {
        case "win":
          chrome.windows.getCurrent(function(currentWindow) {
            chrome.windows.create({url: request.urls.shift().url, "focused": !request.setting.options.unfocus}, function(window) {
              if(request.urls.length > 0) {
                openTab(request.urls, request.setting.options.delay, window.id, null, 0);
              }
            });
            if(request.setting.options.unfocus) {
              chrome.windows.update(currentWindow.id, {"focused": true});
            }
          });
          break;
        case "tabs":
          chrome.tabs.query({ active: true, currentWindow: true })
              .then((activeTabs) => {
                var tab_index = null;
                if(!request.setting.options.end) {
                  tab_index = activeTabs[0].index + 1;
                }
                openTab(request.urls, request.setting.options.delay, activeTabs[0].windowId, tab_index, request.setting.options.close);
              })
              .catch(function(e) { console.error("BulkyURLs: tab query failed", e); });
          break;
      }

      break;

    // Popup "Open in Tabs / New Window" — runs here so batched/delayed opening
    // continues after the popup closes.
    case "open_urls":
      openBulk(request.urls, request.mode, request.options || {})
        .catch(function(e) { console.error("BulkyURLs: bulk open failed", e); });
      break;

    case "init":
      settingsManager.load().then(sendResponse);
      return true; // keep channel open for async response

    case "update":
      settingsManager.save(request.settings);
      settingsManager.load().then(function(settings) {
        chrome.windows.getAll({
          populate: true
        }, function(windowList) {
          windowList.forEach(function(window) {
            window.tabs.forEach(function(tab) {
              chrome.tabs.sendMessage(tab.id, {
                message: "update",
                settings: settings
              }, function() { void chrome.runtime.lastError; });
            });
          });
        });
      }).catch(function(e) { console.error("BulkyURLs: settings update failed", e); });
      break;
  }
}

chrome.runtime.onMessage.addListener(handleRequests);

// Badge update via storage — content script writes selection_count to avoid
// chrome.runtime.sendMessage race conditions with the service worker.
chrome.storage.onChanged.addListener(function(changes, area) {
  if (area !== 'local' || changes.selection_count === undefined) return;
  var count = changes.selection_count.newValue;
  if (!count) {
    chrome.action.setBadgeText({ text: '' });
  } else {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: 'green' });
  }
});

chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.removeAll(function() {
    chrome.contextMenus.create({
      title: "Add link to BulkyURLs",
      contexts: ["link"],
      id: "add_link"
    });
    chrome.contextMenus.create({
      title: "Copy visible page links to BulkyURLs",
      contexts: ["page"],
      id: "copy_page"
    });
  });
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  var noop = function() { void chrome.runtime.lastError; };
  if (info.menuItemId === "add_link") {
    chrome.tabs.sendMessage(tab.id, { message: "add_link", url: info.linkUrl }, noop);
  } else if (info.menuItemId === "copy_page") {
    chrome.tabs.sendMessage(tab.id, { message: "copy_page" }, noop);
  }
});
