function sanitizeInput(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/* 4. Drag and select URLs from hyperlinks. */

/*
Add copySelection() as a listener to mouseup events.

document.addEventListener("mouseup", copySelection);
*/

/*

document.addEventListener('DOMContentLoaded', function () {
  
  // add event listener for buttons
  document.getElementById('open').addEventListener('click', loadSites);
  document.getElementById('extract').addEventListener('click', extractURLs);
  // focus on form field
  document.getElementById('urls').focus();
});

*/

/* History of URLs.

Saves options to chrome.storage

function save_options() {
  var color = document.getElementById('color').value;
  var likesColor = document.getElementById('like').checked;
  chrome.storage.sync.set({
    favoriteColor: color,
    likesColor: likesColor
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    favoriteColor: 'red',
    likesColor: true
  }, function(items) {
    document.getElementById('color').value = items.favoriteColor;
    document.getElementById('like').checked = items.likesColor;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
   
   browser.contextMenus.create({
  id: "copy-link-to-clipboard",
  title: "Copy link to clipboard",
  contexts: ["link"],
});
browser.contextMenus.onClicked.addEventListener((info, tab) => {
  if (info.menuItemId === "copy-link-to-clipboard") {
    // Examples: text and HTML to be copied.
    const text = "This is text: " + info.linkUrl;
    // Always HTML-escape external input to avoid XSS.
    const safeUrl = escapeHTML(info.linkUrl);
    const html = `This is HTML: <a href="${safeUrl}">${safeUrl}</a>`;
    
    // The example will show how data can be copied, but since background
    // pages cannot directly write to the clipboard, we will run a content
    // script that copies the actual content.
    
    // clipboard-helper.js defines function copyToClipboard.
    const code = "copyToClipboard(" +
        JSON.stringify(text) + "," +
        JSON.stringify(html) + ");";
    
    browser.tabs.executeScript({
      code: "typeof copyToClipboard === 'function';",
    }).then((results) => {
      // The content script's last expression will be true if the function
      // has been defined. If this is not the case, then we need to run
      // clipboard-helper.js to define function copyToClipboard.
      if (!results || results[0] !== true) {
        return browser.tabs.executeScript(tab.id, {
          file: "clipboard-helper.js",
        });
      }
    }).then(() => {
      return browser.tabs.executeScript(tab.id, {
        code,
      });
    }).catch((error) => {
      // This could happen if the extension is not allowed to run code in
      // the page, for example if the tab is a privileged page.
      console.error("Failed to copy text: " + error);
    });
  }
});

 */