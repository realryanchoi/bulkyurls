document.addEventListener('DOMContentLoaded', function() {
  var userInput = document.getElementById('userInput');
  var urlCount = document.getElementById('urlCount');
  var listName = document.getElementById('listName');
  var listStatus = document.getElementById('listStatus');
  var savedListsContainer = document.getElementById('savedListsContainer');
  var batchSlider = document.getElementById('batchSize');
  var batchNum = document.getElementById('batchSizeNum');
  var delaySlider = document.getElementById('delaySlider');
  var delayNum = document.getElementById('delayNum');
  var batchBadge = document.getElementById('batchBadge');
  var delayBadge = document.getElementById('delayBadge');
  var toolsMenu = document.getElementById('toolsMenu');
  var undoBtn = document.getElementById('undo');
  var redoBtn = document.getElementById('redo');

  var isSidePanel = document.body.classList.contains('sidepanel');

  document.getElementById('appVersion').textContent = 'v' + chrome.runtime.getManifest().version;

  // ------- Opener settings (persisted as one object) -------

  var DEFAULT_SETTINGS = {
    batchSize: 1,
    delay: 0,
    searchQueries: false,
    randomOrder: false,
    reverseOrder: false,
    windowPerBatch: false,
    waitForLoad: false,
    removeOpened: false,
    autoClose: false,
    autoCloseSecs: 10,
    urlLimit: 0
  };

  var settings = Object.assign({}, DEFAULT_SETTINGS);

  var optionInputs = {
    searchQueries: document.getElementById('optSearchQueries'),
    randomOrder: document.getElementById('optRandomOrder'),
    reverseOrder: document.getElementById('optReverseOrder'),
    windowPerBatch: document.getElementById('optWindowPerBatch'),
    waitForLoad: document.getElementById('optWaitForLoad'),
    removeOpened: document.getElementById('optRemoveOpened'),
    autoClose: document.getElementById('optAutoClose')
  };
  var autoCloseSecs = document.getElementById('optAutoCloseSecs');
  var limitSlider = document.getElementById('optLimit');
  var limitNum = document.getElementById('optLimitNum');
  var limitHint = document.getElementById('limitHint');
  var limitDesc = document.getElementById('limitDesc');

  function saveSettings() {
    chrome.storage.local.set({ opener_settings: settings });
  }

  function renderSettings() {
    batchSlider.value = settings.batchSize;
    batchNum.value = settings.batchSize;
    delaySlider.value = settings.delay;
    delayNum.value = settings.delay;
    batchBadge.textContent = settings.batchSize + '/batch';
    delayBadge.textContent = settings.delay + 's';
    Object.keys(optionInputs).forEach(function(key) {
      optionInputs[key].checked = !!settings[key];
    });
    autoCloseSecs.value = settings.autoCloseSecs;
    limitSlider.value = Math.min(settings.urlLimit, parseInt(limitSlider.max, 10));
    limitNum.value = settings.urlLimit;
    limitHint.textContent = settings.urlLimit === 0 ? 'No limit' : settings.urlLimit + ' max';
    limitDesc.textContent = settings.urlLimit === 0
      ? 'Open all URLs in the list'
      : 'Open only the first ' + settings.urlLimit + ' URLs';
  }

  Object.keys(optionInputs).forEach(function(key) {
    optionInputs[key].addEventListener('change', function() {
      settings[key] = optionInputs[key].checked;
      saveSettings();
    });
  });

  autoCloseSecs.addEventListener('change', function() {
    var v = parseInt(autoCloseSecs.value, 10);
    settings.autoCloseSecs = (isNaN(v) || v < 1) ? 1 : v;
    renderSettings();
    saveSettings();
  });

  function setBatchSize(v) {
    v = parseInt(v, 10);
    if (isNaN(v)) v = 1;
    settings.batchSize = Math.min(20, Math.max(1, v));
    renderSettings();
    saveSettings();
  }

  function setDelay(v) {
    v = parseFloat(v);
    if (isNaN(v) || v < 0) v = 0;
    settings.delay = Math.min(100, v);
    renderSettings();
    saveSettings();
  }

  function setLimit(v) {
    v = parseInt(v, 10);
    if (isNaN(v) || v < 0) v = 0;
    settings.urlLimit = v;
    renderSettings();
    saveSettings();
  }

  batchSlider.addEventListener('input', function() { setBatchSize(batchSlider.value); });
  batchNum.addEventListener('change', function() { setBatchSize(batchNum.value); });
  delaySlider.addEventListener('input', function() { setDelay(delaySlider.value); });
  delayNum.addEventListener('change', function() { setDelay(delayNum.value); });
  limitSlider.addEventListener('input', function() { setLimit(limitSlider.value); });
  limitNum.addEventListener('change', function() { setLimit(limitNum.value); });

  // Stepper − / + buttons next to the batch and delay sliders
  document.querySelectorAll('.stepper-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var step = parseInt(btn.dataset.step, 10);
      if (btn.dataset.for === 'batchSize') setBatchSize(settings.batchSize + step);
      else setDelay(settings.delay + step);
    });
  });

  document.getElementById('resetDefaults').addEventListener('click', function() {
    settings = Object.assign({}, DEFAULT_SETTINGS);
    renderSettings();
    saveSettings();
  });

  // ------- Link selection (drag-select) settings -------
  // Edits the default drag-select action and the site blocklist, stored by the
  // background SettingsManager and consumed by the content script.

  var lsMouse = document.getElementById('lsMouse');
  var lsKey = document.getElementById('lsKey');
  var lsAction = document.getElementById('lsAction');
  var lsColor = document.getElementById('lsColor');
  var lsSmart = document.getElementById('lsSmart');
  var lsBlocklist = document.getElementById('lsBlocklist');
  var lsKeyWarning = document.getElementById('lsKeyWarning');

  var OS_WIN = 0, OS_LINUX = 1, OS_MAC = 2;
  var os = navigator.appVersion.indexOf('Win') !== -1 ? OS_WIN
    : (navigator.appVersion.indexOf('Mac') !== -1 ? OS_MAC : OS_LINUX);

  var linkParams = null;
  var linkActionId = null;

  // The allowed modifier keys depend on OS and mouse button: alt is reserved on
  // Linux, and right button always needs a key outside Windows (context menu).
  function fillKeyOptions(mouseButton, selected) {
    var keys = { 16: 'shift', 17: 'ctrl' };
    if (os !== OS_LINUX) keys[18] = 'alt';
    if (parseInt(mouseButton, 10) !== 2 || os === OS_WIN) keys[0] = 'none';
    for (var i = 0; i < 26; i++) keys[65 + i] = String.fromCharCode(97 + i);

    lsKey.innerHTML = '';
    Object.keys(keys).sort(function(a, b) { return a - b; }).forEach(function(code) {
      var opt = document.createElement('option');
      opt.value = code;
      opt.textContent = keys[code];
      lsKey.appendChild(opt);
    });
    lsKey.value = keys[selected] !== undefined ? selected : 16;
  }

  function renderLinkSettings() {
    var a = linkParams.actions[linkActionId];
    lsMouse.value = a.mouse;
    fillKeyOptions(a.mouse, a.key);
    lsAction.value = a.action;
    lsColor.value = a.color;
    lsSmart.checked = Number(a.options.smart) === 0; // stored value: 0 = on, 1 = off
    lsBlocklist.value = (linkParams.blocked || []).join('\n');
    lsKeyWarning.hidden = lsKey.value !== '0';
  }

  function saveLinkSettings() {
    if (!linkParams) return;
    var a = linkParams.actions[linkActionId];
    a.mouse = parseInt(lsMouse.value, 10);
    a.key = parseInt(lsKey.value, 10);
    a.action = lsAction.value;
    a.color = lsColor.value;
    a.options.smart = lsSmart.checked ? 0 : 1;
    linkParams.blocked = lsBlocklist.value.replace(/^\s+|\s+$/g, '').split('\n');
    lsKeyWarning.hidden = lsKey.value !== '0';
    chrome.runtime.sendMessage({ message: 'update', settings: linkParams });
  }

  lsMouse.addEventListener('change', function() {
    fillKeyOptions(lsMouse.value, parseInt(lsKey.value, 10));
    saveLinkSettings();
  });
  [lsKey, lsAction, lsColor, lsSmart].forEach(function(el) {
    el.addEventListener('change', saveLinkSettings);
  });
  lsBlocklist.addEventListener('input', function() {
    if (linkParams) saveLinkSettings();
  });

  chrome.runtime.sendMessage({ message: 'init' }, function(response) {
    if (chrome.runtime.lastError || !response || !response.actions) return;
    linkParams = response;
    linkActionId = Object.keys(response.actions)[0];
    if (!linkActionId) {
      // no actions configured (all deleted pre-0.5) — recreate the default
      linkActionId = '101';
      linkParams.actions[linkActionId] = {
        mouse: 0, key: 16, action: 'tabs', color: '#FFA500',
        options: { smart: 0, ignore: [0], delay: 0, close: 0, block: true, reverse: false, end: false }
      };
    }
    renderLinkSettings();
  });

  // ------- Tab bar -------

  function activateTab(name) {
    document.querySelectorAll('.tab').forEach(function(t) {
      t.classList.toggle('active', t.dataset.tab === name);
    });
    document.getElementById('panel-urls').classList.toggle('active', name === 'urls');
    document.getElementById('panel-tabs').classList.toggle('active', name === 'tabs');
    document.getElementById('panel-settings').classList.toggle('active', name === 'settings');
  }

  document.querySelectorAll('.tab').forEach(function(t) {
    t.addEventListener('click', function() {
      activateTab(t.dataset.tab);
      if (t.dataset.tab === 'tabs') refreshTabsList();
    });
  });

  document.getElementById('backToURLs').addEventListener('click', function() {
    activateTab('urls');
  });

  // ------- Tabs list (copy single / multiple / all tab links) -------

  var tabsListContainer = document.getElementById('tabsListContainer');
  var tabsSelectAll = document.getElementById('tabsSelectAll');
  var tabsListStatus = document.getElementById('tabsListStatus');
  var tabsCountBadge = document.getElementById('tabsCount');
  var openTabsCache = [];

  function isTabsPanelActive() {
    return document.getElementById('panel-tabs').classList.contains('active');
  }

  function setTabsStatus(text) {
    tabsListStatus.textContent = text;
    setTimeout(function() { tabsListStatus.textContent = ''; }, 2000);
  }

  function copyTabLinks(urls, emptyMessage) {
    if (urls.length === 0) {
      setTabsStatus(emptyMessage);
      return;
    }
    navigator.clipboard.writeText(urls.join('\n')).then(function() {
      setTabsStatus('Copied ' + urls.length + ' link' + (urls.length === 1 ? '' : 's'));
    });
  }

  function renderTabsList() {
    tabsListContainer.innerHTML = '';
    tabsCountBadge.textContent = openTabsCache.length + ' tab' + (openTabsCache.length === 1 ? '' : 's');
    tabsSelectAll.checked = false;

    if (openTabsCache.length === 0) {
      var note = document.createElement('p');
      note.className = 'empty-note';
      note.textContent = 'No open tabs';
      tabsListContainer.appendChild(note);
      return;
    }

    openTabsCache.forEach(function(tab) {
      var row = document.createElement('div');
      row.className = 'tab-row';

      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'tab-row-check';
      cb.dataset.tabId = tab.id;

      var icon = document.createElement('img');
      icon.className = 'tab-row-icon';
      icon.src = tab.favIconUrl || 'img/bulkyurls-icon-16x16.png';
      icon.addEventListener('error', function() { icon.src = 'img/bulkyurls-icon-16x16.png'; });

      var title = document.createElement('span');
      title.className = 'tab-row-title';
      title.textContent = tab.title || tab.url;
      title.title = tab.url;

      var copyOne = document.createElement('button');
      copyOne.className = 'tab-row-copy';
      copyOne.title = "Copy this tab's link";
      copyOne.textContent = 'Copy';
      copyOne.addEventListener('click', function() {
        copyTabLinks([tab.url], 'Nothing to copy');
      });

      row.appendChild(cb);
      row.appendChild(icon);
      row.appendChild(title);
      row.appendChild(copyOne);
      tabsListContainer.appendChild(row);
    });
  }

  function refreshTabsList() {
    chrome.tabs.query({}, function(tabs) {
      openTabsCache = tabs.filter(function(t) { return t.url; });
      renderTabsList();
    });
  }

  tabsSelectAll.addEventListener('change', function() {
    tabsListContainer.querySelectorAll('.tab-row-check').forEach(function(cb) {
      cb.checked = tabsSelectAll.checked;
    });
  });

  document.getElementById('tabsRefresh').addEventListener('click', refreshTabsList);

  document.getElementById('copySelectedTabs').addEventListener('click', function() {
    var ids = Array.prototype.map.call(
      tabsListContainer.querySelectorAll('.tab-row-check:checked'),
      function(cb) { return parseInt(cb.dataset.tabId, 10); }
    );
    if (ids.length === 0) {
      setTabsStatus('No tabs selected');
      return;
    }
    var urls = openTabsCache
      .filter(function(t) { return ids.indexOf(t.id) !== -1; })
      .map(function(t) { return t.url; });
    copyTabLinks(urls, 'No tabs selected');
  });

  document.getElementById('copyAllTabs').addEventListener('click', function() {
    copyTabLinks(openTabsCache.map(function(t) { return t.url; }), 'No open tabs');
  });

  // Keep the list current while it's the visible panel
  chrome.tabs.onCreated.addListener(function() { if (isTabsPanelActive()) refreshTabsList(); });
  chrome.tabs.onRemoved.addListener(function() { if (isTabsPanelActive()) refreshTabsList(); });
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {
    if (isTabsPanelActive() && (changeInfo.title !== undefined || changeInfo.url !== undefined || changeInfo.favIconUrl !== undefined)) {
      refreshTabsList();
    }
  });

  // ------- Sidebar / new-tab launchers -------

  var openSidebarBtn = document.getElementById('openSidebar');
  if (isSidePanel) {
    openSidebarBtn.hidden = true;
  } else {
    openSidebarBtn.addEventListener('click', function() {
      chrome.windows.getCurrent(function(win) {
        chrome.sidePanel.open({ windowId: win.id }, function() {
          void chrome.runtime.lastError;
          window.close();
        });
      });
    });
  }

  document.getElementById('openInTab').addEventListener('click', function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('sidepanel.html') });
  });

  // ------- Badge + count sync -------

  function countURLs(text) {
    return textToLines(extractURLs(text)).length;
  }

  function updateBadge() {
    var count = countURLs(userInput.value);
    urlCount.textContent = count + ' valid';
    urlCount.classList.toggle('valid', count > 0);
    if (count === 0) {
      chrome.action.setBadgeText({ text: '' });
    } else {
      chrome.action.setBadgeText({ text: count.toString() });
      chrome.action.setBadgeBackgroundColor({ color: 'green' });
    }
  }

  // ------- Undo / redo history -------

  var history = [userInput.value];
  var historyIndex = 0;
  var historyTimer = null;

  function updateHistoryButtons() {
    undoBtn.disabled = historyIndex === 0;
    redoBtn.disabled = historyIndex === history.length - 1;
  }

  function pushHistory(value) {
    if (history[historyIndex] === value) return;
    history = history.slice(0, historyIndex + 1);
    history.push(value);
    if (history.length > 100) history.shift();
    historyIndex = history.length - 1;
    updateHistoryButtons();
  }

  undoBtn.addEventListener('click', function() {
    if (historyIndex === 0) return;
    historyIndex--;
    userInput.value = history[historyIndex];
    updateHistoryButtons();
    updateBadge();
  });

  redoBtn.addEventListener('click', function() {
    if (historyIndex === history.length - 1) return;
    historyIndex++;
    userInput.value = history[historyIndex];
    updateHistoryButtons();
    updateBadge();
  });

  // Every programmatic textarea write goes through here to keep badge + history in sync
  function setTextarea(value) {
    userInput.value = value;
    pushHistory(value);
    updateBadge();
  }

  // Sync badge on direct user edits (typing, paste, cut); snapshot history after a pause
  userInput.addEventListener('input', function() {
    updateBadge();
    clearTimeout(historyTimer);
    historyTimer = setTimeout(function() { pushHistory(userInput.value); }, 500);
  });

  updateHistoryButtons();

  // ------- Init -------

  // If a CSV import result is waiting in storage, consume it first.
  // Otherwise auto-populate from the page's current drag selection.
  chrome.storage.local.get(['csv_import_result', 'opener_settings', 'popup_delay'], function(stored) {
    if (stored.opener_settings) {
      settings = Object.assign({}, DEFAULT_SETTINGS, stored.opener_settings);
    } else if (stored.popup_delay) {
      // migrate the pre-0.4 delay setting
      var d = parseFloat(stored.popup_delay);
      if (!isNaN(d) && d > 0) settings.delay = d;
    }
    renderSettings();
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

  // ------- Opening -------

  // Turn the textarea into the list of URLs that would actually open.
  // With "search queries" on, every non-empty line counts (non-URLs become searches).
  function collectURLs() {
    if (settings.searchQueries) {
      return textToLines(userInput.value).map(function(line) {
        var extracted = textToLines(extractURLs(line));
        if (extracted.length > 0) return normalizeURL(extracted[0]);
        return 'https://www.google.com/search?q=' + encodeURIComponent(line);
      });
    }
    return textToLines(extractURLs(userInput.value)).map(normalizeURL);
  }

  // Delegate to the background service worker so batched/delayed opening
  // continues even after the popup closes.
  function openURLs(mode) {
    var urls = collectURLs();
    if (urls.length === 0) return;
    var limited = settings.urlLimit > 0 ? urls.slice(0, settings.urlLimit) : urls;
    chrome.runtime.sendMessage({
      message: 'open_urls',
      urls: urls,
      mode: mode,
      options: settings
    });
    if (settings.removeOpened) {
      var opened = {};
      limited.forEach(function(u) { opened[u] = true; });
      var remaining = textToLines(userInput.value).filter(function(line) {
        var extracted = textToLines(extractURLs(line));
        var asURL = extracted.length > 0 ? normalizeURL(extracted[0])
          : (settings.searchQueries ? 'https://www.google.com/search?q=' + encodeURIComponent(line) : null);
        return !(asURL && opened[asURL]);
      });
      setTextarea(remaining.join('\n'));
    }
  }

  // ------- Saved lists -------

  function refreshSavedLists(highlightName) {
    chrome.storage.local.get(['saved_lists'], function(stored) {
      var lists = stored.saved_lists || {};
      var names = Object.keys(lists).sort();
      savedListsContainer.innerHTML = '';
      if (names.length === 0) {
        var note = document.createElement('p');
        note.className = 'empty-note';
        note.textContent = 'No saved lists yet';
        savedListsContainer.appendChild(note);
        return;
      }
      names.forEach(function(name) {
        var row = document.createElement('div');
        row.className = 'saved-list-row';

        var load = document.createElement('button');
        load.className = 'saved-list-name';
        load.textContent = name;
        load.title = 'Load "' + name + '"';
        load.addEventListener('click', function() {
          setTextarea(lists[name]);
          setListStatus('Loaded "' + name + '"');
        });

        var count = document.createElement('span');
        count.className = 'saved-list-count';
        count.textContent = countURLs(lists[name]) + ' URLs';

        var del = document.createElement('button');
        del.className = 'saved-list-delete';
        del.textContent = '×';
        del.title = 'Delete "' + name + '"';
        del.addEventListener('click', function() {
          chrome.storage.local.get(['saved_lists'], function(s) {
            var l = s.saved_lists || {};
            delete l[name];
            chrome.storage.local.set({ saved_lists: l }, function() {
              refreshSavedLists();
              setListStatus('Deleted "' + name + '"');
            });
          });
        });

        row.appendChild(load);
        row.appendChild(count);
        row.appendChild(del);
        savedListsContainer.appendChild(row);
      });
      if (highlightName) setListStatus('Saved "' + highlightName + '"');
    });
  }

  function setListStatus(text) {
    listStatus.textContent = text;
    setTimeout(function() { listStatus.textContent = ''; }, 2000);
  }

  document.getElementById('newListToggle').addEventListener('click', function() {
    var row = document.getElementById('newListRow');
    row.hidden = !row.hidden;
    if (!row.hidden) listName.focus();
  });

  document.getElementById('saveList').addEventListener('click', function() {
    var name = listName.value.trim();
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
        document.getElementById('newListRow').hidden = true;
        refreshSavedLists(name);
      });
    });
  });

  // ------- Tools dropdown -------

  document.getElementById('toolsToggle').addEventListener('click', function(e) {
    e.stopPropagation();
    toolsMenu.hidden = !toolsMenu.hidden;
  });

  document.addEventListener('click', function(e) {
    if (!toolsMenu.hidden && !toolsMenu.contains(e.target)) {
      toolsMenu.hidden = true;
    }
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
      case "copyURLs":
        if (userInput.value) {
          navigator.clipboard.writeText(userInput.value).then(function() {
            setListStatus('Copied to clipboard');
          });
        }
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
    if (userClick.target.classList && userClick.target.classList.contains('tools-item')) {
      toolsMenu.hidden = true;
    }
  });

  // "URLs from Selection" — manually refresh from the current drag selection
  document.getElementById('openURLsFromSelector').addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || !tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, { type: "getURLs" }, function(response) {
        if (chrome.runtime.lastError) return;
        var text = urlsToText(response);
        if (text) setTextarea(text);
      });
    });
  });

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
