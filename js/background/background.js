// function updateCount(tabId, isOnRemoved) {
//   chrome.tabs.query({})
//       .then((tabs) => {
//         let length = tabs.length;

//         // onRemoved fires too early and the count is one too many.
//         // see https://bugzilla.mozilla.org/show_bug.cgi?id=1396758
//         if (isOnRemoved && tabId && tabs.map((t) => { return t.id; }).includes(tabId)) {
//           length--;
//         }

//         chrome.action.setBadgeText({text: length.toString()});
//         if (length > 0) {
//           chrome.action.setBadgeBackgroundColor({'color': 'green'});
//         }
//       });
// }

// chrome.tabs.onRemoved.addListener(
//     (tabId) => { updateCount(tabId, true);
//     });
// chrome.tabs.onCreated.addListener(
//     (tabId) => { updateCount(tabId, false);
//     });
// updateCount();

// SettingsManager

var CURRENT_VERSION = "5";
var temp_urls = [];

function SettingsManager() {}

SettingsManager.prototype.load = function() {
  
  // load data from local storage
  const data = chrome.storage.local.get(["settings"]);
  try {
    
    // attempt to parse, if unable then make the assumption it has been corrupted
    return JSON.parse(data)
  } catch(error) {
    var settings = this.init();
    settings.error = "Error: "+error+"|Data:"+data;
    return settings;
  }
};

SettingsManager.prototype.save = function(settings) {
  // remove any error messages from object (shouldn't be there)
  if (settings.error !== undefined) {
    delete settings.error;
  }
  chrome.storage.local["settings"] = JSON.stringify(settings);
};

SettingsManager.prototype.isInit = function() {
  return (chrome.storage.local["version"] !== undefined);
};

SettingsManager.prototype.isLatest = function() {
  return (chrome.storage.local["version"] === CURRENT_VERSION);
};

// SETTINGS for selctor

SettingsManager.prototype.init = function() {
  // create default settings for first time user
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
  
  // save settings to store
  chrome.storage.local["settings"] = JSON.stringify(settings);
  chrome.storage.local["version"] = CURRENT_VERSION;
  
  return settings;
};


SettingsManager.prototype.update = function() {
  if (!this.isInit()) {
    this.init();
  }
};

var settingsManager = new SettingsManager();

function handleRequests(request, sender, callback){
  switch(request.message) {
    case "links":
      var numberOfLinks = request.count
      chrome.action.setBadgeText({text: numberOfLinks.toString()}); 
      chrome.action.setBadgeBackgroundColor({color: 'green'});
      
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
          chrome.windows.getCurrent(function(currentWindow){
            
            chrome.windows.create({url: request.urls.shift().url, "focused" : !request.setting.options.unfocus}, function(window){
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
          chrome.tabs.query({})
              .then((windows) => {
                var tab_index = null;
                if(!request.setting.options.end) {
                  tab_index = chrome.tabs.index++;
                }
                openTab(request.urls, request.setting.options.delay, windows.id, tab_index, request.setting.options.close);
              });
          break;
      }
      
      break;
    case "init":
      callback(settingsManager.load());
      break;
    case "update":
      settingsManager.save(request.settings);
      
      chrome.windows.getAll({
        populate: true
      }, function(windowList){
        windowList.forEach(function(window){
          window.tabs.forEach(function(tab){
            chrome.tabs.sendMessage(tab.id, {
              message: "update",
              settings: settingsManager.load()
            }, null);
          })
        })
      });
      
      break;
  }
}

chrome.runtime.onMessage.addListener(handleRequests)

if (!settingsManager.isInit()) {
  // initialize settings manager with defaults and to stop this appearing again
  settingsManager.init();
} else if (!settingsManager.isLatest()) {
  settingsManager.update();
}

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

chrome.runtime.onInstalled.addListener(function () {
  // Create one test item for each context type.
  let contexts = [
    'page',
    'selection',
    'link',
    'editable',
    'image',
    'video',
    'audio'
  ];
  for (let i = 0; i < contexts.length; i++) {
    let context = contexts[i];
    let title = "Test '" + context + "' menu item";
    chrome.contextMenus.create({
      title: title,
      contexts: [context],
      id: context
    });
  }
  
  // Create a parent item and two children.
  let parent = chrome.contextMenus.create({
    title: 'Test parent item',
    id: 'parent'
  });
  chrome.contextMenus.create({
    title: 'Child 1',
    parentId: parent,
    id: 'child1'
  });
  chrome.contextMenus.create({
    title: 'Child 2',
    parentId: parent,
    id: 'child2'
  });
  
  // Create a radio item.
  chrome.contextMenus.create({
    title: 'radio',
    type: 'radio',
    id: 'radio'
  });
  
  // Create a checkbox item.
  chrome.contextMenus.create({
    title: 'checkbox',
    type: 'checkbox',
    id: 'checkbox'
  });
});

