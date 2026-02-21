document.addEventListener('DOMContentLoaded', function() {
  var userInput = document.getElementById('userInput');

  // Shared helper: build a newline-separated URL string from a getURLs response
  function urlsToText(response) {
    if (!response || !response.urls || response.urls.length === 0) return '';
    var s = '';
    for (var i = 0; i < response.urls.length; i++) {
      var url = response.urls[i].url;
      if (url && !s.includes(url)) {
        s += url + "\n";
      }
    }
    return s;
  }

  // Auto-populate the textarea with selection URLs when the popup opens
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs || !tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { type: "getURLs" }, function(response) {
      if (chrome.runtime.lastError) return; // content script not present on this page
      var text = urlsToText(response);
      if (text) {
        userInput.value = text;
      }
    });
  });

  document.addEventListener("click", (userClick) => {
    switch(userClick.target.id) {
      case "extractURLsFromText":
        var userInputValue = userInput.value;
        var urls = extractURLs(userInputValue);
        userInput.value = urls;
        break;
      case "openURLsInTabs":
        var userInputValue = userInput.value;
        loadSites(userInputValue);
        break;
      case "extractURLsFromTabs":
        chrome.tabs.query({})
            .then((tabs) => {
              let length = tabs.length;
              if (length > 0) {
                var s = '';
                for (var i = 0; i < length; i++) {
                  s += tabs[i].url;
                  s = s + "\n";
                }
                userInput.value = s;
              }
            });
        break;
      case "clear":
        userInput.value = '';
        break;
      case "exportCSV":
        exportToCSV(userInput.value);
        break;
      case "importCSV":
        document.getElementById('importCSVInput').click();
        break;
    }
    userClick.preventDefault();
  });

  // File input handler for CSV import
  document.getElementById('importCSVInput').addEventListener('change', function() {
    var file = this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      var text = importFromCSVText(e.target.result);
      if (text) {
        userInput.value = text;
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported if needed
    this.value = '';
  });

  // "Selection Tool URLs" button — manually refresh from the current selection
  var selectorBtn = document.getElementById('openURLsFromSelector');

  selectorBtn.onclick = function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || !tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, { type: "getURLs" }, function(response) {
        if (chrome.runtime.lastError) return;
        var text = urlsToText(response);
        if (text) {
          userInput.value = text;
        } else {
          console.log("No selection URLs available.");
        }
      });
    });
  };
});

// ------- CSV Export -------

function exportToCSV(text) {
  var urls = extractURLs(text)
    .split(/\r\n|\r|\n/)
    .filter(function(u) { return u.trim() !== ''; });

  if (urls.length === 0) return;

  // Build single-column CSV: header row + one quoted URL per row.
  // Double any embedded double-quotes per RFC 4180.
  var rows = urls.map(function(u) {
    return '"' + u.replace(/"/g, '""') + '"';
  });
  var csv = 'url\n' + rows.join('\n');

  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var blobUrl = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'bulkyurls-export.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

// ------- CSV Import -------

// Parse one CSV line into an array of field strings.
// Handles RFC 4180 quoted fields (fields may contain commas and escaped quotes).
function parseCSVLine(line) {
  var fields = [];
  var field = '';
  var inQuotes = false;

  for (var i = 0; i < line.length; i++) {
    var c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped double-quote inside a quoted field
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      fields.push(field);
      field = '';
    } else {
      field += c;
    }
  }
  fields.push(field);
  return fields;
}

// Parse CSV text and return a newline-separated string of URLs found in any column.
// Skips header rows (cells that don't start with http/https).
function importFromCSVText(csvText) {
  var lines = csvText.split(/\r\n|\r|\n/);
  var seen = {};
  var urls = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;

    var fields = parseCSVLine(line);
    for (var j = 0; j < fields.length; j++) {
      var field = fields[j].trim();
      // Accept any field that looks like an absolute URL
      if (/^https?:\/\//i.test(field) && !seen[field]) {
        seen[field] = true;
        urls.push(field);
      }
    }
  }

  return urls.join('\n');
}

// ------- Shared Utilities -------

// Extract URLs from arbitrary text
function extractURLs(text) {
  var urls = '';
  let urlmatcharr = [];
  var urlregex = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»""'']))/ig;
  while( (urlmatcharr = urlregex.exec(text)) !== null )
  {
    var match = urlmatcharr[0];
    urls += match + '\n';
  }
  return urls;
}

// Bulk open tabs from list of URLs
function loadSites(text) {
  var filteredURLs = extractURLs(text);
  var urls = filteredURLs.split(/\r\n|\r|\n/);
  var urlCount = urls.length;
  for(var i = 0; i < urlCount; i++){
    if(urls[i] != '') {
      if(urls[i].indexOf("http://") == 0 || urls[i].indexOf("https://") == 0) {
        chrome.tabs.create({url: urls[i], active: false});
      } else {
        urls[i] = 'http://' + urls[i];
        chrome.tabs.create({url: urls[i], active: false});
      }
    }
  }
}
