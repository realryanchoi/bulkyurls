document.addEventListener('DOMContentLoaded', function() {
  var mode = new URLSearchParams(window.location.search).get('mode');
  if (mode === 'export') {
    initExport();
  } else if (mode === 'import') {
    initImport();
  }
});

// ------- Export -------

function initExport() {
  document.title = 'BulkyURLs – Export CSV';
  document.getElementById('export-section').style.display = 'block';

  chrome.storage.local.get(['csv_export_pending'], function(result) {
    var csv = generateCSV(result.csv_export_pending || '');
    document.getElementById('csv-preview').value = csv;

    document.getElementById('save-btn').addEventListener('click', async function() {
      try {
        var handle = await window.showSaveFilePicker({
          suggestedName: 'bulkyurls-export.csv',
          types: [{ description: 'CSV file', accept: { 'text/csv': ['.csv'] } }]
        });
        var writable = await handle.createWritable();
        await writable.write(csv);
        await writable.close();
        chrome.storage.local.remove('csv_export_pending');
        window.close();
      } catch(e) {
        if (e.name !== 'AbortError') {
          console.error('BulkyURLs export error:', e);
        }
        // AbortError = user cancelled the dialog — stay open
      }
    });

    document.getElementById('cancel-btn').addEventListener('click', function() {
      chrome.storage.local.remove('csv_export_pending');
      window.close();
    });
  });

  // Clean up if the window is closed any other way (e.g. title-bar X)
  window.addEventListener('beforeunload', function() {
    chrome.storage.local.remove('csv_export_pending');
  });
}

// ------- Import -------

function initImport() {
  document.title = 'BulkyURLs – Import CSV';
  document.getElementById('import-section').style.display = 'block';

  var status = document.getElementById('status');

  document.getElementById('choose-btn').addEventListener('click', async function() {
    status.className = '';
    status.textContent = '';
    try {
      var [fileHandle] = await window.showOpenFilePicker({
        types: [{
          description: 'CSV / text file',
          accept: { 'text/csv': ['.csv'], 'text/plain': ['.csv', '.txt'] }
        }],
        multiple: false
      });

      var file = await fileHandle.getFile();
      var text = await file.text();
      var urls = importFromCSVText(text);
      var count = urls ? urls.split('\n').filter(function(u) { return u.trim(); }).length : 0;

      if (count === 0) {
        status.className = 'error';
        status.textContent = 'No URLs found in that file. Try another.';
        return;
      }

      status.className = 'success';
      status.textContent = count + ' URL' + (count === 1 ? '' : 's') + ' found — sending to BulkyURLs…';

      chrome.storage.local.set({ csv_import_result: urls }, function() {
        setTimeout(function() { window.close(); }, 700);
      });

    } catch(e) {
      if (e.name !== 'AbortError') {
        status.className = 'error';
        status.textContent = 'Error: ' + e.message;
      }
      // AbortError = user cancelled the dialog — stay open
    }
  });
}

// ------- CSV generation -------

function generateCSV(rawText) {
  var urls = extractURLs(rawText)
    .split(/\r\n|\r|\n/)
    .filter(function(u) { return u.trim() !== ''; });

  if (urls.length === 0) return 'url\n';

  var rows = urls.map(function(u) {
    return '"' + u.replace(/"/g, '""') + '"';
  });
  return 'url\n' + rows.join('\n');
}

// ------- CSV parsing -------

// RFC 4180 single-line parser — handles quoted fields with embedded commas/quotes
function parseCSVLine(line) {
  var fields = [];
  var field = '';
  var inQuotes = false;

  for (var i = 0; i < line.length; i++) {
    var c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
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

// Scan every field in every row for absolute URLs; deduplicate
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
      if (/^https?:\/\//i.test(field) && !seen[field]) {
        seen[field] = true;
        urls.push(field);
      }
    }
  }
  return urls.join('\n');
}

// ------- URL extraction (mirrors popup.js) -------

function extractURLs(text) {
  var urls = '';
  var m;
  var re = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»""'']))/ig;
  while ((m = re.exec(text)) !== null) {
    urls += m[0] + '\n';
  }
  return urls;
}
