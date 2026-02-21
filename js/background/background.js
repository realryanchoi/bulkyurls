// SettingsManager

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
        "key": 90,   // z key
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
settingsManager.ensureInit();

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
        request.urls = request.urls.unique();
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
              });
          break;
      }

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
              }, null);
            });
          });
        });
      });
      break;
  }
}

chrome.runtime.onMessage.addListener(handleRequests);

Array.prototype.unique = function() {
  var a = [];
  var l = this.length;
  for(var i=0; i<l; i++) {
    for(var j=i+1; j<l; j++) {
      if (this[i].url === this[j].url)
        j = ++i;
    }
    a.push(this[i]);
  }
  return a;
};

chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.removeAll(function() {
    chrome.contextMenus.create({
      title: "Open selected links with BulkyURLs",
      contexts: ["selection"],
      id: "open_selected"
    });
    chrome.contextMenus.create({
      title: "Copy page links to BulkyURLs",
      contexts: ["page"],
      id: "copy_page"
    });
  });
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === "open_selected") {
    chrome.tabs.sendMessage(tab.id, { message: "open_selected" });
  } else if (info.menuItemId === "copy_page") {
    chrome.tabs.sendMessage(tab.id, { message: "copy_page" });
  }
});
