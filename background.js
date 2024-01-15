
// Called when the user clicks on the browser action.
chrome.action.onClicked.addListener(function(tab) {
	// Send a message to the active tab	
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage({msg: "clicked_browser_action"});
	});
});

chrome.commands.onCommand.addListener(function (command) {
    if (command == "fast_forward") {
        // Send a message to the active tab
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {msg: "hotkey_fast_forward"});
		});	
    }
});