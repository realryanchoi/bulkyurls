document.addEventListener('DOMContentLoaded', function() {
  var userInput = document.getElementById('userInput');

  // ------- Badge sync -------

  function countURLs(text) {
    if (!text) return 0;
    return extractURLs(text)
      .split(/\r\n|\r|\n/)
      .filter(function(u) { return u.trim() !== ''; })
      .length;
  }

  function updateBadge() {
    var count = countURLs(userInput.value);
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
  chrome.storage.local.get(['csv_import_result'], function(stored) {
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

  // Pick up an import result that arrives while the popup is already open
  chrome.storage.onChanged.addListener(function(changes, area) {
    if (area === 'local' && changes.csv_import_result && changes.csv_import_result.newValue) {
      setTextarea(changes.csv_import_result.newValue);
      chrome.storage.local.remove('csv_import_result');
    }
  });

  // ------- Button handlers -------

  document.addEventListener("click", function(userClick) {
    switch(userClick.target.id) {
      case "extractURLsFromText":
        setTextarea(extractURLs(userInput.value));
        break;
      case "openURLsInTabs":
        loadSites(userInput.value);
        break;
      case "extractURLsFromTabs":
        chrome.tabs.query({}).then(function(tabs) {
          if (tabs.length > 0) {
            var s = '';
            for (var i = 0; i < tabs.length; i++) {
              s += tabs[i].url + "\n";
            }
            setTextarea(s);
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

// ------- Shared utilities -------

function extractURLs(text) {
  var urls = '';
  var m;
  var re = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»""'']))/ig;
  while ((m = re.exec(text)) !== null) {
    urls += m[0] + '\n';
  }
  return urls;
}

function loadSites(text) {
  var filteredURLs = extractURLs(text);
  var urls = filteredURLs.split(/\r\n|\r|\n/);
  for (var i = 0; i < urls.length; i++) {
    if (urls[i] !== '') {
      if (urls[i].indexOf("http://") !== 0 && urls[i].indexOf("https://") !== 0) {
        urls[i] = 'http://' + urls[i];
      }
      chrome.tabs.create({ url: urls[i], active: false });
    }
  }
}
