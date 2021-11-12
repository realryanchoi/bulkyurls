
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

// SettingsManager

var CURRENT_VERSION = "5";

function SettingsManager() {}

SettingsManager.prototype.load = function() {
  try {
    // load data from local storage
    var data = chrome.storage.local["settings"];
    
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

// LinkClump

var settingsManager = new SettingsManager();

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

function openTab(urls, delay, windowId, tabPosition, closeTime) {
  var obj = {
    windowId: windowId,
    url: urls.shift().url,
    selected: false
  };
  
  if(tabPosition != null) {
    obj.index = tabPosition;
    tabPosition++;
  }
  
  chrome.tabs.create(obj, function(tab) {
    if(closeTime > 0) {
      window.setTimeout(function() {
        chrome.tabs.remove(tab.id);
      }, closeTime*1000);
    }
  });
  
  if(urls.length > 0) {
    window.setTimeout(function() {openTab(urls, delay, windowId, tabPosition, closeTime)}, delay*1000);
  }
  
}

function copyToClipboard( text ){
  var copyDiv = document.createElement("textarea");
  copyDiv.contentEditable = true;
  document.body.appendChild(copyDiv);
  copyDiv.innerHTML = text;
  copyDiv.unselectable = "off";
  copyDiv.focus();
  document.execCommand("SelectAll");
  document.execCommand("Copy", false, null);
  document.body.removeChild(copyDiv);
}

function pad(number, length) {
  var str = "" + number;
  while (str.length < length) {
    str = "0" + str;
  }
  
  return str;
}

function timeConverter(a){
  var year = a.getFullYear();
  var month = pad(a.getMonth()+1, 2)
  var day = pad(a.getDate(), 2);
  var hour = pad(a.getHours(),2);
  var min = pad(a.getMinutes(),2);
  var sec = pad(a.getSeconds(),2);
  var time = year+"-"+month+"-"+day+" "+hour+":"+min+":"+sec;
  return time;
}

function handleRequests(request, sender, callback){
  switch(request.message) {
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
        case "copy":
          var text = "";
          for (let i = 0; i < request.urls.length; i++) {
            switch(request.setting.options.copy) {
              case "0":
                text += request.urls[i].title+"\t"+request.urls[i].url+"\n";
                break;
              case "1":
                text += request.urls[i].url+"\n";
                break;
              case "2":
                text += request.urls[i].title+"\n";
                break;
              case "3":
                text += '<a href="'+request.urls[i].url+'">'+request.urls[i].title+"</a>\n";
                break;
              case "4":
                text += '<li><a href="'+request.urls[i].url+'">'+request.urls[i].title+"</a></li>\n";
                break;
              case "5":
                text += "["+request.urls[i].title+"]("+request.urls[i].url+")\n";
                break;
            }
          }
          
          if(request.setting.options.copy == 4) {
            text = "<ul>\n"+text+"</ul>\n"
          }
          
          copyToClipboard(text);
          break;
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
          chrome.tabs.get(sender.tab.id, function(tab) {
            chrome.windows.getCurrent(function(window){
              var tab_index = null;
              
              if(!request.setting.options.end) {
                tab_index = tab.index+1;
              }
              
              openTab(request.urls, request.setting.options.delay, window.id, tab_index, request.setting.options.close);
            })
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
  
  // inject Linkclump into windows currently open to make it just work
  chrome.windows.getAll({ populate: true }, function(windows) {
    for (var i = 0; i < windows.length; ++i) {
      for (var j = 0; j < windows[i].tabs.length; ++j) {
        if (!/^https?:\/\//.test(windows[i].tabs[j].url)) continue;
        chrome.tabs.executeScript(windows[i].tabs[j].id, { file: "linkclump.js" });
      }
    }
  });
  
  // pop up window to show tour and options page
  chrome.runtime.openOptionsPage();
} else if (!settingsManager.isLatest()) {
  settingsManager.update();
}