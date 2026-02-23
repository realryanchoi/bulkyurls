// the settings box
var config = {
  "triggers":
      [{"name": "Left"}, {"name": "Middle"}, {"name": "Right"}],
  "actions": {
    "win": {"name": "Opened in a New Window", "options": ["smart", "ignore", "delay", "block", "reverse", "unfocus"]},
    "tabs": {"name": "Opened as New Tabs", "options": ["smart", "ignore", "delay", "close", "block", "reverse", "end"]},
    // "bm": {"name": "Bookmarked", "options": ["smart", "ignore", "block", "reverse"]},
    // "copy": {"name": "Copied to clipboard", "options": ["smart", "ignore", "copy", "block", "reverse"]}
  },
  "options": {
    "smart": {
      "name": "smart select",
      "type": "selection",
      "data": ["on", "off"],
      "extra": "with smart select turned on bulkyurls tries to select only the important links"
    },
    "ignore": {
      "name": "filter links",
      "type": "selection-textbox",
      "data": ["exclude links with words", "include links with words"],
      "extra": "filter links that include/exclude these words; separate words with a comma ,"
    },
    "copy": {
      "name": "copy format",
      "type": "selection",
      "data": ["URLS with titles", "URLS only", "titles only", "as link HTML", "as list link HTML", "as Markdown"],
      "extra": "format of the links saved to the clipboard"
    },
    "delay": {
      "name": "delay in opening",
      "type": "textbox",
      "extra":"number of seconds between the opening of each link"
    },
    "close": {
      "name": "close tab time",
      "type": "textbox",
      "extra":"number of seconds before closing opened tab (0 means the tab wouldn't close)"
    },
    "block": {
      "name": "block repeat links in selection",
      "type": "checkbox",
      "extra":"select to block repeat links from opening"
    },
    "reverse": {
      "name": "reverse order",
      "type": "checkbox",
      "extra":"select to have links opened in reverse order"
    },
    "end": {
      "name": "open tabs at the end",
      "type": "checkbox",
      "extra": "select to have links opened at the end of all other tabs"
    },
    "unfocus": {
      "name": "do not focus on new window",
      "type": "checkbox",
      "extra": "select to stop the new window from coming to the front"
    }
  }
};

var OS_WIN = 0;
var OS_LINUX = 1;
var OS_MAC = 2;

var colors = ["458B74", "838B8B", "CCCCCC", "0000FF", "8A2BE2", "D2691E", "6495ED", "DC143C", "006400", "9400D3", "1E90FF", "228B22", "00FF00", "ADFF2F", "FF69B4", "4B0082", "F0E68C", "8B814C", "87CEFA", "32CD32", "000080", "FFA500", "FF4500", "DA70D6", "8B475D", "8B668B", "FF0000", "2E8B57", "8E388E", "FFFF00"];
var params = null;
var div_history = [];
var keys = displayKeys(0);
var os = ((navigator.appVersion.indexOf("Win") === -1) ? ((navigator.appVersion.indexOf("Mac") === -1) ? OS_LINUX : OS_MAC) : OS_WIN);

function close_form(event) {
  document.getElementById("form-background").style.display = "none";
  event.preventDefault();
}

function tour1() {
  setup_text(keys);
  document.getElementById("page2").style.display = "none";
  document.querySelector(".info-box").style.display = "block";
}

function tour2() {
  var p1 = document.getElementById("page1");
  if (p1) p1.style.display = "none";
  document.getElementById("page2").style.display = "block";
}

// into form

function load_action(id) {

  if (id === null) {
    displayKeys(0);
    displayOptions("tabs");
    document.getElementById("form_id").value = "";
    document.getElementById("form_mouse").value = 0;
    document.getElementById("form_key").value = 16;
    document.getElementById("form_color").value = colors[Math.floor(Math.random() * colors.length)];
  } else {
    var param = params.actions[id];
    document.getElementById("form_id").value = id;

    document.getElementById("form_mouse").value = param.mouse;
    displayKeys(param.mouse);
    document.getElementById("form_key").value = param.key;

    document.getElementById("form_color").value = param.color.replace("#", "");

    document.getElementById("form_" + param.action).checked = true;

    displayOptions(param.action);

    for (var i in param.options) {
      switch (config.options[i].type) {
        case "selection":
          document.getElementById("form_option_" + i).value = param.options[i];
          break;

        case "textbox":
          document.getElementById("form_option_" + i).value = param.options[i];
          break;

        case "checkbox":
          document.getElementById("form_option_" + i).checked = !!param.options[i];
          break;

        case "selection-textbox":
          if (param.options[i].length > 1) {
            var selection = param.options[i][0];
            var text = "";
            for (var k = 1; k < param.options[i].length; k++) {
              text += param.options[i][k] + ",";
            }

            document.getElementById("form_option_selection_" + i).value = selection;
            document.getElementById("form_option_text_" + i).value = text;
          }

          break;
      }

    }
  }

  // hide warning and let it show later if required
  document.querySelector(".warning").style.display = "none";

  // place the form at the top of the window+10
  document.querySelector(".form").style.marginTop = (window.pageYOffset + 10) + "px";

  // show the form and set the background to cover the whole page
  document.getElementById("form-background").style.display = "block";
  document.getElementById("form-background").style.height = document.documentElement.scrollHeight + "px";

  check_selection();
}

// delete settings card

function delete_action(id, div) {
  var savedParam = params.actions[id];

  var del = document.createElement("div");
  del.className = "undo";
  del.textContent = "Action has been deleted ";

  var undo = document.createElement("a");
  undo.textContent = "undo";
  undo.href = "#";
  undo.addEventListener("click", function(event) {
    var newCard = setup_action(savedParam, id);
    div_history[id].parentNode.replaceChild(newCard, div_history[id]);
    params.actions[id] = savedParam;

    delete(div_history[id]);

    save_params();
    event.preventDefault();
  });
  del.appendChild(undo);

  div.parentNode.replaceChild(del, div);
  div_history[id] = del;
  delete(params.actions[id]);

  save_params();
}


// Settings form


function setup_action(param, id) {
  var setting = document.createElement("div");
  setting.className = "setting";
  setting.id = "action_" + id;

  setting.insertAdjacentHTML("beforeend", "<h3>" + config.actions[param.action].name + "</h3>");
  setting.insertAdjacentHTML("beforeend", "<p class='setting-trigger'>Activate by " + config.triggers[param.mouse].name + " mouse button</p>");
  if (param.key > 0) {
    setting.appendChild(document.createTextNode(" and \"" + keys[param.key] + "\" key "));
  }

  var list = document.createElement("ul");
  for (var j in param.options) {
    var op = config.options[j];
    var text = op.name + ": ";
    switch (op.type) {
      case "selection":
        text += op.data[param.options[j]];
        break;
      case "textbox":
        // TODO not sure if param.options[j] returns a string or int
        if (param.options[j] === "" || Number(param.options[j]) === 0) {
          continue;
        }
        text += param.options[j];
        break;
      case "checkbox":
        if (!param.options[j]) {
          continue;
        }
        text += param.options[j];
        break;
      case "selection-textbox":
        if (param.options[j].length < 2) {
          continue;
        }
        var selection = param.options[j][0];
        var words = "";
        for (var i = 1; i < param.options[j].length; i++) {
          words += param.options[j][i];

          if (i < param.options[j].length - 1) {
            words += ", ";
          }
        }
        text += op.data[selection] + "; " + words;
        break;
    }

    list.insertAdjacentHTML("beforeend", "<li>" + text + "</li>");
  }
  list.insertAdjacentHTML("beforeend", "<li>selection box color: <div style='background-color: " + param.color + "' class='color'></div></li>");

  setting.appendChild(list);

  var edit = document.createElement("a");
  edit.href = "#";
  edit.className = "button edit";
  edit.textContent = "Edit";
  edit.addEventListener("click", function(event) {
    load_action(id);
    event.preventDefault();
  });

  var del = document.createElement("a");
  del.href = "#";
  del.className = "button delete";
  del.textContent = "Delete";
  del.addEventListener("click", function(event) {
    delete_action(id, this.parentElement);
    event.preventDefault();
  });

  setting.appendChild(del);
  setting.appendChild(edit);

  return setting;
}

function setup_form() {
  var mouse = document.getElementById("form_mouse");
  for (var i = 0; i < config.triggers.length; i++) {
    mouse.insertAdjacentHTML("beforeend", '<option value="' + i + '">' + config.triggers[i].name + '</option>');
  }

  mouse.addEventListener("change", function(event) {
    displayKeys(this.value);
    check_selection();
  });

  var color = document.getElementById("form_color");
  for (var i in colors) {
    color.insertAdjacentHTML("beforeend", "<option value='" + colors[i] + "'>" + colors[i] + "</option>");
  }

  // No colorpicker plugin — the <select> element is used directly

  var action = document.getElementById("form_action");
  for (var i in config.actions) {
    var input = document.createElement("input");
    input.type = "radio";
    input.name = "action";
    input.value = i;
    input.id = "form_" + i;
    input.addEventListener("click", function(event) {
      displayOptions(this.value);
    });
    action.appendChild(input);
    action.appendChild(document.createTextNode(config.actions[i].name));
    action.insertAdjacentHTML("beforeend", "<br/>");
  }

  document.querySelector('input[value="tabs"]').checked = true;
}

function setup_text(keys) {
  var param;
  for (var i in params.actions) {
    param = params.actions[i];
    break;
  }
  if (param === undefined) {
    return;
  }
  var mouseName = document.getElementById("mouse_name");
  if (mouseName) mouseName.textContent = config.triggers[param.mouse].name;
  var actionName = document.getElementById("action_name");
  if (actionName) actionName.textContent = config.actions[param.action].name;
  var keyName = document.getElementById("key_name");
  if (keyName) {
    if (param.key > 0) {
      keyName.innerHTML = "the <b>" + keys[param.key] + "</b> key and";
    } else {
      keyName.innerHTML = "";
    }
  }
}

function check_selection() {
  var m = document.getElementById("form_mouse").value;
  var k = document.getElementById("form_key").value;
  var id = document.getElementById("form_id").value;

  var keyWarning = document.getElementById("key_warning");
  keyWarning.innerHTML = "";
  if (k === "0") {
    keyWarning.textContent = "WARNING: Not using a key could cause unexpected behavior on some websites";
    if (getComputedStyle(document.querySelector(".warning2")).display === "none") {
      document.querySelector(".warning2").style.display = "block";
    }
  } else {
    if (getComputedStyle(document.querySelector(".warning2")).display !== "none") {
      document.querySelector(".warning2").style.display = "none";
    }
  }

  for (var i in params.actions) {
    // not sure if mouse/key are strings or ints
    if (i !== id && params.actions[i].mouse === parseInt(m, 10) && params.actions[i].key === parseInt(k, 10)) {
      if (getComputedStyle(document.querySelector(".warning")).display === "none") {
        document.querySelector(".warning").style.display = "block";
      }

      return;
    }
  }

  if (getComputedStyle(document.querySelector(".warning")).display !== "none") {
    document.querySelector(".warning").style.display = "none";
  }
}

function displayOptions(action) {
  var options = document.getElementById("form_options");
  options.innerHTML = "";

  //pop up options settings
  for (var i in config.actions[action].options) {
    var op = config.options[config.actions[action].options[i]];
    var title = document.createElement("label");
    title.textContent = op.name;
    var p = document.createElement("p");
    p.appendChild(title);

    switch (op.type) {
      case "selection":
        var selector = document.createElement("select");
        selector.id = "form_option_" + config.actions[action].options[i];
        for (var j in op.data) {
          selector.insertAdjacentHTML("beforeend", '<option value="' + j + '">' + op.data[j] + '</option>');
        }
        p.appendChild(selector);
        break;

      case "textbox":
        p.insertAdjacentHTML("beforeend", '<input type="text" name="' + op.name + '" id="form_option_' + config.actions[action].options[i] + '"/>');
        break;

      case "checkbox":
        p.insertAdjacentHTML("beforeend", '<input type="checkbox" name="' + op.name + '" id="form_option_' + config.actions[action].options[i] + '"/>');
        break;

      case "selection-textbox":
        var selector = document.createElement("select");
        selector.id = "form_option_selection_" + config.actions[action].options[i];
        for (var j in op.data) {
          selector.insertAdjacentHTML("beforeend", '<option value="' + j + '">' + op.data[j] + '</option>');
        }
        p.appendChild(selector);
        p.insertAdjacentHTML("beforeend", "<label>&nbsp;</label>");
        p.insertAdjacentHTML("beforeend", '<input type="text" name="' + op.name + '" id="form_option_text_' + config.actions[action].options[i] + '"/>');
        break;
    }

    (function(extra, elem) {
      elem.addEventListener("mouseover", function() {
        var extraEl = document.getElementById("form_extra");
        extraEl.innerHTML = extra;
        extraEl.style.top = elem.offsetTop + "px";
        extraEl.style.left = (elem.offsetLeft + 500) + "px";
        extraEl.style.display = "block";
      });
      elem.addEventListener("mouseout", function() {
        document.getElementById("form_extra").style.display = "none";
      });
    })(op.extra, p);

    options.appendChild(p);

  }
}

function displayKeys(mouseButton) {
  var key = document.getElementById("form_key");
  var keys = [];

  keys[16] = "shift";
  keys[17] = "ctrl";

  if (os !== OS_LINUX) {
    keys[18] = "alt";
  }

  // if not left or windows then allow no key
  // NOTE mouseButton is sometimes a string, sometimes an int
  if (parseInt(mouseButton, 10) !== 2 || os === OS_WIN) {
    keys[0] = '';
  }

  // add on alpha characters
  for (var i = 0; i < 26; i++) {
    keys[65 + i] = String.fromCharCode(97 + i);
  }

  if (key) {
    key.innerHTML = "";
    for (var i in keys) {
      key.insertAdjacentHTML("beforeend", '<option value="' + i + '">' + keys[i] + '</option>');
    }
    // set selected value to shift
    key.value = 16;
  }

  return keys;
}

function load_new_action(event) {
  load_action(null);
  event.preventDefault();
}

function save_action(event) {
  var id = document.getElementById("form_id").value;

  var param = {};

  param.mouse = parseInt(document.getElementById("form_mouse").value, 10);
  param.key = parseInt(document.getElementById("form_key").value, 10);
  param.color = "#" + document.getElementById("form_color").value;
  param.action = document.querySelector("input[name=action]:checked").value;
  param.options = {};

  for (var opt in config.actions[param.action].options) {
    var name = config.actions[param.action].options[opt];
    var type = config.options[name].type;
    if (type === "checkbox") {
      param.options[name] = document.getElementById("form_option_" + name).checked;
    } else {
      if (name === "ignore") {
        var ignore = document.getElementById("form_option_text_" + name).value.replace(/^ */, "").replace(/, */g, ",").toLowerCase().split(",");
        // if the last entry is empty then just remove from array
        if (ignore.length > 0 && ignore[ignore.length - 1] === "") {
          ignore.pop();
        }
        // add selection to the start of the array
        ignore.unshift(param.options[name] = document.getElementById("form_option_selection_" + name).value);

        param.options[name] = ignore;
      } else if (name === "delay" || name === "close") {
        var delay;
        try {
          delay = parseFloat(document.getElementById("form_option_" + name).value);
        } catch (err) {
          delay = 0;
        }
        if (isNaN(delay)) {
          delay = 0;
        }

        param.options[name] = delay;
      } else {
        param.options[name] = document.getElementById("form_option_" + name).value;
      }
    }
  }

  if (id === "" || params.actions[id] === null) {
    var newDate = new Date;
    id = newDate.getTime();

    params.actions[id] = param;
    document.getElementById("settings").appendChild(setup_action(param, id));
  } else {
    params.actions[id] = param;
    var update = setup_action(param, id);
    var old = document.getElementById("action_" + id);
    old.parentNode.replaceChild(update, old);
  }

  save_params();
  close_form(event);
}

function save_params() {
  chrome.runtime.sendMessage({
    message: "update",
    settings: params
  });
}

function save_block() {
  // replace any whitespace at end to stop empty site listings
  var sites = document.getElementById("form_block").value.replace(/^\s+|\s+$/g, "").split("\n");

  if (Array.isArray(sites)) {
    params.blocked = sites;
    save_params();
  }
}

document.addEventListener("DOMContentLoaded", function() {
  // temp check to not load if in test mode
  if (document.getElementById("guide2") === null) {
    return;
  }

  document.getElementById("guide2").addEventListener("click", tour2);

  const g1 = document.getElementById("guide1");
  if (g1) g1.addEventListener("click", tour1);

  document.getElementById("add").addEventListener("click", load_new_action);
  document.getElementById("form_block").addEventListener("keyup", save_block);
  document.getElementById("form_key").addEventListener("change", check_selection);
  document.getElementById("cancel").addEventListener("click", close_form);
  document.getElementById("save").addEventListener("click", save_action);

  setup_form();

  chrome.runtime.sendMessage({
    message: "init"
  }, function(response) {
    params = response;

    for (var i in params.actions) {
      document.getElementById("settings").appendChild(setup_action(params.actions[i], i));
    }
    setup_text(keys);

    document.getElementById("form_block").value = params.blocked.join("\n");
  });
});
