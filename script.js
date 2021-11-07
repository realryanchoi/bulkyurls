// Sanitize the user input.

function sanitizeInput(input) {
  return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

// Extract URLs from text and replaces value with updated URLs separated by newline.

function extractURLs(e) {
  var text = document.getElementById('urls').value;
  
  var urls = '';
  var urlmatcharr;
  var urlregex = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;
  while( (urlmatcharr = urlregex.exec(text)) !== null )
  {
    var match = urlmatcharr[0];
    urls += match + '\n';
  }
  
  document.getElementById('urls').value = urls;
}

// Copy open tabs URLs as new line separated format to clipboard.

function copyToClipboard(text, html) {
  function oncopy(event) {
    document.removeEventListener("copy", oncopy, true);
    // Hide the event from the page to prevent tampering.
    event.stopImmediatePropagation();
    
    // Overwrite the clipboard content.
    event.preventDefault();
    event.clipboardData.setData("text/plain", text);
    event.clipboardData.setData("text/html", html);
  }
  document.addEventListener("copy", oncopy, true);
  
  // Requires the clipboardWrite permission, or a user gesture:
  document.execCommand("copy");
}

/*
copy the selected text to clipboard
*/
function copySelection() {
  var selectedText = window.getSelection().toString().trim();
  
  if (selectedText) {
    document.execCommand("Copy");
  }
}

// Bulk open tabs from list of URLs or CSV file.

function loadSites(e) {
  var urlschemes = ['http', 'https', 'file', 'view-source'];
  var urls = document.getElementById('urls').value.split('\n');
  var lazyloading = document.getElementsByName('lazyloading')[0].checked;
  
  for(var i=0; i<urls.length; i++){
    theurl = urls[i].trim();
    if(theurl != '') {
      if(urlschemes.indexOf(theurl.split(':')[0]) == -1) {
        theurl = 'http://' + theurl;
      }
      if(lazyloading && theurl.split(':')[0] != 'view-source' && theurl.split(':')[0] != 'file') {
        chrome.tabs.create({url: chrome.extension.getURL('lazyloading.html#') + theurl, selected: false});
      } else {
        chrome.tabs.create({url: theurl, selected: false});
      }
    }
  }
}

// 6. Bookmark multiple tabs.
// Zoom constants. Define Max, Min, increment and default values
const ZOOM_INCREMENT = 0.2;
const MAX_ZOOM = 5;
const MIN_ZOOM = 0.3;
const DEFAULT_ZOOM = 1;

function firstUnpinnedTab(tabs) {
  for (var tab of tabs) {
    if (!tab.pinned) {
      return tab.index;
    }
  }
}

/**
 * listTabs to switch to
 */
function listTabs() {
  getCurrentWindowTabs().then((tabs) => {
    let tabsList = document.getElementById('tabs-list');
    let currentTabs = document.createDocumentFragment();
    let limit = 5;
    let counter = 0;
    
    tabsList.textContent = '';
    
    for (let tab of tabs) {
      if (!tab.active && counter <= limit) {
        let tabLink = document.createElement('a');
        
        tabLink.textContent = tab.title || tab.id;
        tabLink.setAttribute('href', tab.id);
        tabLink.classList.add('switch-tabs');
        currentTabs.appendChild(tabLink);
      }
      
      counter += 1;
    }
    
    tabsList.appendChild(currentTabs);
  });
}

document.addEventListener("DOMContentLoaded", listTabs);

function getCurrentWindowTabs() {
  return browser.tabs.query({currentWindow: true});
}

document.addEventListener("click", (e) => {
  function callOnActiveTab(callback) {
    getCurrentWindowTabs().then((tabs) => {
      for (var tab of tabs) {
        if (tab.active) {
          callback(tab, tabs);
        }
      }
    });
  }
  
  if (e.target.id === "tabs-move-beginning") {
    callOnActiveTab((tab, tabs) => {
      var index = 0;
      if (!tab.pinned) {
        index = firstUnpinnedTab(tabs);
      }
      console.log(`moving ${tab.id} to ${index}`)
      browser.tabs.move([tab.id], {index});
    });
  }
  
  if (e.target.id === "tabs-move-end") {
    callOnActiveTab((tab, tabs) => {
      var index = -1;
      if (tab.pinned) {
        var lastPinnedTab = Math.max(0, firstUnpinnedTab(tabs) - 1);
        index = lastPinnedTab;
      }
      browser.tabs.move([tab.id], {index});
    });
  }
  
  else if (e.target.id === "tabs-duplicate") {
    callOnActiveTab((tab) => {
      browser.tabs.duplicate(tab.id);
    });
  }
  
  else if (e.target.id === "tabs-reload") {
    callOnActiveTab((tab) => {
      browser.tabs.reload(tab.id);
    });
  }
  
  else if (e.target.id === "tabs-remove") {
    callOnActiveTab((tab) => {
      browser.tabs.remove(tab.id);
    });
  }
  
  else if (e.target.id === "tabs-create") {
    browser.tabs.create({url: "https://developer.mozilla.org/en-US/Add-ons/WebExtensions"});
  }
  
  else if (e.target.id === "tabs-create-reader") {
    browser.tabs.create({url: "https://developer.mozilla.org/en-US/Add-ons/WebExtensions", openInReaderMode: true});
  }
  
  else if (e.target.id === "tabs-alertinfo") {
    callOnActiveTab((tab) => {
      let props = "";
      for (let item in tab) {
        props += `${ item } = ${ tab[item] } \n`;
      }
      alert(props);
    });
  }
  
  else if (e.target.id === "tabs-add-zoom") {
    callOnActiveTab((tab) => {
      var gettingZoom = browser.tabs.getZoom(tab.id);
      gettingZoom.then((zoomFactor) => {
        //the maximum zoomFactor is 5, it can't go higher
        if (zoomFactor >= MAX_ZOOM) {
          alert("Tab zoom factor is already at max!");
        } else {
          var newZoomFactor = zoomFactor + ZOOM_INCREMENT;
          //if the newZoomFactor is set to higher than the max accepted
          //it won't change, and will never alert that it's at maximum
          newZoomFactor = newZoomFactor > MAX_ZOOM ? MAX_ZOOM : newZoomFactor;
          browser.tabs.setZoom(tab.id, newZoomFactor);
        }
      });
    });
  }
  
  else if (e.target.id === "tabs-decrease-zoom") {
    callOnActiveTab((tab) => {
      var gettingZoom = browser.tabs.getZoom(tab.id);
      gettingZoom.then((zoomFactor) => {
        //the minimum zoomFactor is 0.3, it can't go lower
        if (zoomFactor <= MIN_ZOOM) {
          alert("Tab zoom factor is already at minimum!");
        } else {
          var newZoomFactor = zoomFactor - ZOOM_INCREMENT;
          //if the newZoomFactor is set to lower than the min accepted
          //it won't change, and will never alert that it's at minimum
          newZoomFactor = newZoomFactor < MIN_ZOOM ? MIN_ZOOM : newZoomFactor;
          browser.tabs.setZoom(tab.id, newZoomFactor);
        }
      });
    });
  }
  
  else if (e.target.id === "tabs-default-zoom") {
    callOnActiveTab((tab) => {
      var gettingZoom = browser.tabs.getZoom(tab.id);
      gettingZoom.then((zoomFactor) => {
        if (zoomFactor == DEFAULT_ZOOM) {
          alert("Tab zoom is already at the default zoom factor");
        } else {
          browser.tabs.setZoom(tab.id, DEFAULT_ZOOM);
        }
      });
    });
  }
  
  else if (e.target.classList.contains('switch-tabs')) {
    var tabId = +e.target.getAttribute('href');
    
    browser.tabs.query({
      currentWindow: true
    }).then((tabs) => {
      for (var tab of tabs) {
        if (tab.id === tabId) {
          browser.tabs.update(tabId, {
            active: true
          });
        }
      }
    });
  }
  
  e.preventDefault();
});

//onRemoved listener. fired when tab is removed
browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log(`The tab with id: ${tabId}, is closing`);
  
  if(removeInfo.isWindowClosing) {
    console.log(`Its window is also closing.`);
  } else {
    console.log(`Its window is not closing`);
  }
});

//onMoved listener. fired when tab is moved into the same window
browser.tabs.onMoved.addListener((tabId, moveInfo) => {
  var startIndex = moveInfo.fromIndex;
  var endIndex = moveInfo.toIndex;
  console.log(`Tab with id: ${tabId} moved from index: ${startIndex} to index: ${endIndex}`);
});
