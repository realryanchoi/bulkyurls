// the settings box 
var config = {
    "triggers":
        [{ "name": "Left" }, { "name": "Middle" }, { "name": "Right" }],
    "actions": {
        "win": { "name": "Opened in a New Window", "options": ["smart", "ignore", "delay", "block", "reverse", "unfocus"] },
        "tabs": { "name": "Opened as New Tabs", "options": ["smart", "ignore", "delay", "close", "block", "reverse", "end"] },
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
            "extra": "number of seconds between the opening of each link"
        },
        "close": {
            "name": "close tab time",
            "type": "textbox",
            "extra": "number of seconds before closing opened tab (0 means the tab wouldn't close)"
        },
        "block": {
            "name": "block repeat links in selection",
            "type": "checkbox",
            "extra": "select to block repeat links from opening"
        },
        "reverse": {
            "name": "reverse order",
            "type": "checkbox",
            "extra": "select to have links opened in reverse order"
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
    $("#form-background").fadeOut();

    event.preventDefault();
}

function tour1() {
    setup_text(keys);
    $("#page2").fadeOut(0);
    $("#test_area").focus();
}

function tour2() {
    $("#page2").fadeIn();
}


function load_action(id) { 
  
    if(id === null) {
      displayKeys(0);
      displayOptions("tabs");
      $("#form_id").val("");
      $("#form_mouse").val(0);  // default to left mouse button
      $("#form_key").val(90);   // and z key
      $(".colorpicker-trigger").css("background-color", "#"+colors[Math.floor(Math.random()*colors.length)]);
    }
    // } else {
    //   var param = params.actions[id];
    //   $("#form_id").val(id);
      
    //   $("#form_mouse").val(param.mouse);
    //   displayKeys(param.mouse);
    //   $("#form_key").val(param.key);
      
    //   $(".colorpicker-trigger").css("background-color", param.color);
      
    //   $("#form_"+param.action).attr("checked","checked");
      
    //   displayOptions(param.action);
      
    //   for(var i in param.options) {
    //     switch(config.options[i].type) {
    //       case "selection":
    //         $("#form_option_"+i).val(param.options[i]);
    //         break;
          
    //       case "textbox":
    //         $("#form_option_"+i).val(param.options[i]);
    //         break;
          
    //       case "checkbox":
    //         if(param.options[i]) {
    //           $("#form_option_"+i).attr("checked", true);
    //         } else {
    //           $("#form_option_"+i).attr("checked", false);
    //         }
    //         break;
          
    //       case "selection-textbox":
    //         if(param.options[i].length > 1) {
    //           var selection = param.options[i][0];
    //           var text = "";
    //           for(var k = 1; k < param.options[i].length; k++) {
    //             text += param.options[i][k]+",";
    //           }
              
    //           $("#form_option_selection_"+i).val(selection);
    //           $("#form_option_text_"+i).val(text);
    //         }
            
    //         break;
    //     }
        
    //   }
    // }
    
    // hide warning and let it show later if required
    $(".warning").hide();
    
    // place the form at the top of the window+10
    $(".form").css("margin-top", $(window).scrollTop()+10);
    
    // fade in the form and set the background to cover the whole page
    $("#form-background").fadeIn();
    $("#form-background").css("height", $(document).height());
    
    check_selection();
  }