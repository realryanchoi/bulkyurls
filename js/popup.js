var s = '';

document.addEventListener('DOMContentLoaded', function() {
  var userInput = document.getElementById('userInput');
  
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
        var clearText = '';
        userInput.value = clearText;
    }
    userClick.preventDefault();
  });
});

var selectorBtn = document.getElementById('openURLsFromSelector')

selectorBtn.onclick = function() { 
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { type: "getURLs" }, function (urls) {
      if (typeof urls == "undefined") {
        // That's kind of bad
        console.log("undefined")
        if (chrome.runtime.lastError) {
          // We couldn't talk to the content script, probably it's not there
        }
      } else {
        let length = urls.urls.length
        console.log(urls.urls)
        if (length > 0) {
          // var s = '';
          for (let i = 0; i < length; i++) {
            s += urls.urls[i].url;
            s = s + "\n";
            console.log(urls.urls[i].url)
          }
          userInput.value = s;
        } else {
          console.log("The 'urls' array is undefined or empty.");
        }
      }
    });
  })
}

// let popupPort = null;

// // Establish a connection with the background script
// chrome.runtime.connect({name: "popupConnection"}, (port) => {
//   popupPort = port;
  
//   // Listen for incoming messages from the background script
//   popupPort.onMessage.addListener((message) => {
//     console.log("Received message from background script: " + message);
    
//     // Use chrome.tabs API to detect the tab(s) from which the message has been delivered
//     chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//       // tabs variable will contain an array of Tab objects that match the query criteria
//       console.log("Message received from tab with ID: " + tabs[0].id);
//     });
//   });
// });

// // Send a message to the background script when the popup is clicked
// document.getElementById("button").addEventListener("click", () => {
//   popupPort.postMessage("Hello from the popup!");
// });

// document.addEventListener('DOMContentLoaded', function() {
  // Establish a connection with the background script
  // const backgroundPort = chrome.runtime.connect({name: "popupConnection"});
  
  // // Listen for messages from the background script
  // backgroundPort.onMessage.addListener((message) => {
  //   console.log("Received message from background script:", message);

  //   // Check if the message is an array
  //   if (message.type === "array" && Array.isArray(message.data)) {
  //     // Display the array in the popup
  //     const arrayElement = document.getElementById("array");
  //     arrayElement.textContent = message.data.join(", ");
  //   }
  // });
//   chrome.runtime.onConnect.addListener((port) => {
//       chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//       // tabs variable will contain an array of Tab objects that match the query criteria
//       console.log("Message received from tab with ID: " + tabs[0].id);
//       if (port.name === "popupConnection") {
//         console.log("Pop up connect!");
//       }
//     });

//   })
// });


// // Get the button element from the popup
// const buttonElement = document.getElementById("button");

// // Add a click event listener to the button
// buttonElement.addEventListener("click", () => {
//   // Send a message to the background script
//   backgroundPort.postMessage({ type: "buttonClicked" });
// });


// Data function

 

// Extract URLs from textarea
function extractURLs(text) {
  var urls = '';
  let urlmatcharr = [];
  var urlregex = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;
  while( (urlmatcharr = urlregex.exec(text)) !== null )
  {
    var match = urlmatcharr[0];
    urls += match + '\n';
  }
  return urls;
}

//Bulk open tabs from list of URLs
function loadSites(text) {
  var filteredURLs = extractURLs(text);
  var urls = filteredURLs.split(/\r\n|\r|\n/);
  var urlCount = urls.length;
  for(var i = 0; i < urlCount; i++){
    if(urls[i] != '') {
      if(urls[i].indexOf("http://") == 0 || urls[i].indexOf("https://") == 0) {
        chrome.tabs.create({url: urls[i], selected: false});
      } else {
        urls[i] = 'http://' + urls[i];
        chrome.tabs.create({url: urls[i], selected: false});
      }
    }
  }
}
