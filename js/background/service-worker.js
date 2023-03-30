Create a service-worker file that will use this context-script file and open tabs when they have selected by detech function
Here is context-script file

// if (!this.smart_select) {
			// 	if (this.links[i].important) {
			// 		this.smart_select = true;
			// 		return false;
			// 	}
			// } else {
			// 	if (this.links[i].important) {
			// 		count++;
			// 	}
			// }




            // if (this.smart_select && count === 0) {
	// 	this.smart_select = false;
	// 	return false;
	// }



    // chrome.runtime.sendMessage({
		// 	message: "activate",
		// 	urls: open_tabs,
		// 	setting: this.settings[this.setting]
		// },);


        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if (request.action === 'getLinks') {
              // Get the URLs from the open_tabs array in content script
              chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'getLinks' }, function(response) {
                  sendResponse({ message: 'Received URLs', urls: response.urls });
                });
              });
          
              // Required to use sendResponse asynchronously
              return true;
            }
          });


          chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if (request.action === 'getLinks') {
              // Send the URLs from the open_tabs array
              var open_tabs = [];
              // Code to populate open_tabs array
              // ...
          
              sendResponse({ message: 'Received URLs', urls: open_tabs });
            }
          });

          chrome.runtime.sendMessage({ action: 'getLinks' }, function(response) {
            if (response.urls && response.urls.length > 0) {
              // Display the URLs in the popup text field
              var userInput = document.getElementById('userInput');
              userInput.value = response.urls.join('\n');
            }
          });


          <head>
  <meta charset="UTF-8">
  <title></title>
  <link rel="stylesheet" href="css/popup.css">
</head>

<body>
  <h1><img src="img/bulkyurls-icon-32x32.png"> BulkyURLs</h1>
  <textarea name="somethingInput" rows="4" cols="50" id="userInput" placeholder="Enter text here..."></textarea>
  <script src="js/popup.js"></script>
</body>

</html>



// chrome.storage.local.get("urls", function(data) {
//   if(typeof data.urls == "undefined") {
//       console.log('No data')
//   } else {
//       console.log(data)
//   }
// });

// chrome.runtime.onMessage.addListener(
//   function(request, sender, sendResponse) {
//    if(request.action === 'openLinks') { 
//     var temp_url = request.urls;
//    }
//    sendResponse({ message: 'Received in pop up data', urls: temp_urls })
//   }
// );

// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//   if (request .action === 'openLinks') {
//     // Get the URLs from the request
//     temp_urls = request.urls;
    
//     // Send the URLs back to the popup script
//     sendResponse({ message: 'Received URLs', urls: temp_urls, });
//   }
// });


// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//   if (request .action === 'check_links') {
//     // Get the URLs from the request
//     let temp_urls = request.urls;
    
//     // Send the URLs back to the popup script
//     sendResponse({ message: 'Received URLs', urls: temp_urls, });
//   }
// });




// CONTENT SCRIPT 
	// chrome.runtime.sendMessage({action: 'openLinks', urls: open_tabs}, function(response) {
		// 	console.log(response);
		//   });
		// chrome.storage.local.set({urls: open_tabs })

		// (async () => {
		// 	const response = await chrome.runtime.sendMessage({action: 'openLinks', urls: open_tabs});
		// 	// do something with response here, not outside the function
		// 	console.log(response);
		//   })();