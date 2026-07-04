document.addEventListener('DOMContentLoaded', function() {
  var userInput = document.getElementById('userInput');
  var urlCount = document.getElementById('urlCount');
  var delayInput = document.getElementById('delayInput');
  var listName = document.getElementById('listName');
  var savedLists = document.getElementById('savedLists');
  var listStatus = document.getElementById('listStatus');

  // ------- Badge + count sync -------

  function countURLs(text) {
    return textToLines(extractURLs(text)).length;
  }

  function updateBadge() {
    var count = countURLs(userInput.value);
    urlCount.textContent = count === 0 ? 'No URLs' : count + ' URL' + (count === 1 ? '' : 's');
    if (count === 0) {
      chrome.action.setBadgeText({ text: '' });
    } else {
      chrome.action.setBadgeText({ text: count.toString() });
      chrome.action.setBadgeBackgroundColor({ color: 'green' });
    }
  }

  // Every programmatic textarea write goes through here to keep badge in sync
  function setTextarea(value) {
    userInput.value = value;
    updateBadge();
  }

  // Sync badge on direct user edits (typing, paste, cut)
  userInput.addEventListener('input', updateBadge);

  // ------- Init -------

  // If a CSV import result is waiting in storage, consume it first.
  // Otherwise auto-populate from the page's current drag selection.
  chrome.storage.local.get(['csv_import_result', 'popup_delay'], function(stored) {
    if (stored.popup_delay) delayInput.value = stored.popup_delay;
    if (stored.csv_import_result) {
      setTextarea(stored.csv_import_result);
      chrome.storage.local.remove('csv_import_result');
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (!tabs || !tabs[0]) return;
        chrome.tabs.sendMessage(tabs[0].id, { type: "getURLs" }, function(response) {
          if (chrome.runtime.lastError) return;
          var text = urlsToText(response);
          if (text) setTextarea(text);
        });
      });
    }
  });

  refreshSavedLists();

  // Pick up an import result that arrives while the popup is already open
  chrome.storage.onChanged.addListener(function(changes, area) {
    if (area === 'local' && changes.csv_import_result && changes.csv_import_result.newValue) {
      setTextarea(changes.csv_import_result.newValue);
      chrome.storage.local.remove('csv_import_result');
    }
  });

  delayInput.addEventListener('change', function() {
    chrome.storage.local.set({ popup_delay: delayInput.value });
  });

  // ------- Opening -------

  function currentDelay() {
    var d = parseFloat(delayInput.value);
    return (isNaN(d) || d < 0) ? 0 : d;
  }

  // Delegate to the background service worker so delayed opening
  // continues even after the popup closes.
  function openURLs(mode) {
    var urls = textToLines(extractURLs(userInput.value)).map(normalizeURL);
    if (urls.length === 0) return;
    chrome.runtime.sendMessage({
      message: 'open_urls',
      urls: urls,
      mode: mode,
      delay: currentDelay()
    });
  }

  // ------- Saved lists -------

  function refreshSavedLists(selectName) {
    chrome.storage.local.get(['saved_lists'], function(stored) {
      var lists = stored.saved_lists || {};
      savedLists.innerHTML = '';
      var placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Load a saved list…';
      savedLists.appendChild(placeholder);
      Object.keys(lists).sort().forEach(function(name) {
        var opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        savedLists.appendChild(opt);
      });
      if (selectName) savedLists.value = selectName;
    });
  }

  function setListStatus(text) {
    listStatus.textContent = text;
    setTimeout(function() { listStatus.textContent = ''; }, 2000);
  }

  document.getElementById('saveList').addEventListener('click', function() {
    var name = listName.value.trim() || savedLists.value;
    if (!name) {
      setListStatus('Enter a list name first');
      return;
    }
    if (!userInput.value.trim()) {
      setListStatus('Nothing to save');
      return;
    }
    chrome.storage.local.get(['saved_lists'], function(stored) {
      var lists = stored.saved_lists || {};
      lists[name] = userInput.value;
      chrome.storage.local.set({ saved_lists: lists }, function() {
        listName.value = '';
        refreshSavedLists(name);
        setListStatus('Saved "' + name + '"');
      });
    });
  });

  document.getElementById('deleteList').addEventListener('click', function() {
    var name = savedLists.value;
    if (!name) return;
    chrome.storage.local.get(['saved_lists'], function(stored) {
      var lists = stored.saved_lists || {};
      delete lists[name];
      chrome.storage.local.set({ saved_lists: lists }, function() {
        refreshSavedLists();
        setListStatus('Deleted "' + name + '"');
      });
    });
  });

  savedLists.addEventListener('change', function() {
    var name = savedLists.value;
    if (!name) return;
    chrome.storage.local.get(['saved_lists'], function(stored) {
      var lists = stored.saved_lists || {};
      if (lists[name] !== undefined) setTextarea(lists[name]);
    });
  });

  // ------- Button handlers -------

  document.addEventListener("click", function(userClick) {
    switch(userClick.target.id) {
      case "extractURLsFromText":
        setTextarea(extractURLs(userInput.value));
        break;
      case "dedupeURLs":
        setTextarea(dedupeLines(textToLines(userInput.value)).join('\n'));
        break;
      case "openURLsInTabs":
        openURLs('tabs');
        break;
      case "openURLsInWindow":
        openURLs('win');
        break;
      case "extractURLsFromTabs":
        chrome.tabs.query({}).then(function(tabs) {
          if (tabs.length > 0) {
            setTextarea(tabs.map(function(tab) { return tab.url; }).join('\n') + '\n');
          }
        });
        break;
      case "clear":
        setTextarea('');
        break;
      case "exportCSV":
        openExportWindow(userInput.value);
        break;
      case "importCSV":
        openImportWindow();
        break;
    }
    userClick.preventDefault();
  });

  // "Selection Tool URLs" — manually refresh from the current drag selection
  document.getElementById('openURLsFromSelector').onclick = function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || !tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, { type: "getURLs" }, function(response) {
        if (chrome.runtime.lastError) return;
        var text = urlsToText(response);
        if (text) setTextarea(text);
      });
    });
  };

  // ------- Helpers scoped to DOMContentLoaded -------

  function urlsToText(response) {
    if (!response || !response.urls || response.urls.length === 0) return '';
    var s = '';
    for (var i = 0; i < response.urls.length; i++) {
      var url = response.urls[i].url;
      if (url && !s.includes(url)) s += url + "\n";
    }
    return s;
  }
});

// ------- CSV window launchers -------

function openExportWindow(rawText) {
  // Store the raw textarea text; csv.js generates the CSV and handles the save dialog
  chrome.storage.local.set({ csv_export_pending: rawText }, function() {
    chrome.windows.create({
      url: chrome.runtime.getURL('csv.html') + '?mode=export',
      type: 'popup',
      width: 520,
      height: 400
    });
  });
}

function openImportWindow() {
  chrome.windows.create({
    url: chrome.runtime.getURL('csv.html') + '?mode=import',
    type: 'popup',
    width: 440,
    height: 240
  });
}
