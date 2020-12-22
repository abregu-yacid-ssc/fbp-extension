// background.js

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
  // Send a message to the active tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
  });
});

// Open a new Tab with the Course URL and the Lesson data
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "open_in_feedbackpanda" ) {
      chrome.tabs.create({"url": "https://app.feedbackpanda.com/#/incoming/"+encodeURIComponent(request.url)+"/"+encodeURIComponent(request.lesson)});
      // chrome.tabs.create({"url": "http://local.feedbackpanda.com:5000/#/incoming/"+encodeURIComponent(request.url)+"/"+encodeURIComponent(request.lesson)});
    }

    if (request.message === "transmit_external_data") {
      let dataHash = btoa(unescape(encodeURIComponent(JSON.stringify(request.data))))
      chrome.tabs.create({"url": "https://app.feedbackpanda.com/#/external?data="+encodeURIComponent(dataHash)});
      // chrome.tabs.create({"url": "http://local.feedbackpanda.com:5000/#/external?data="+encodeURIComponent(dataHash)});
    }
  }
);
