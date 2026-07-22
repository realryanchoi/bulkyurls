// Shared URL utilities — loaded by sidepanel.html and csv.html before their page scripts.

// Extract everything that looks like a URL from free text; one URL per line.
function extractURLs(text) {
  var urls = '';
  var m;
  var re = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»""'']))/ig;
  while ((m = re.exec(text)) !== null) {
    urls += m[0] + '\n';
  }
  return urls;
}

// Split multi-line text into an array of non-empty trimmed lines.
function textToLines(text) {
  if (!text) return [];
  return text.split(/\r\n|\r|\n/)
    .map(function(line) { return line.trim(); })
    .filter(function(line) { return line !== ''; });
}

// Remove duplicate lines, preserving first-seen order.
function dedupeLines(lines) {
  var seen = {};
  return lines.filter(function(line) {
    if (seen[line]) return false;
    seen[line] = true;
    return true;
  });
}

// Prefix schemeless URLs with http:// so chrome.tabs.create treats them as web URLs.
function normalizeURL(url) {
  if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) {
    return 'http://' + url;
  }
  return url;
}
