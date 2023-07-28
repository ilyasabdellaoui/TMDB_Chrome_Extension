// Listen for messages from the content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getApiKey') {
    // Retrieve the API key from the Chrome storage
    chrome.storage.sync.get('apiKey', (data) => {
      const apiKey = data.apiKey;
      sendResponse(apiKey);
    });
    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
  if (message.type === 'getBearerToken') {
    // Retrieve the bearer token from the Chrome storage
    chrome.storage.sync.get('bearerToken', (data) => {
      const bearerToken = data.bearerToken;
      sendResponse(bearerToken);
    });
    return true;
  }

  if (message.type === 'setApiKey') {
    // Store the API key in Chrome storage
    const apiKey = message.apiKey;
    chrome.storage.sync.set({ apiKey }, () => {
      sendResponse(true);
    });
    return true;
  }

  if (message.type === 'setBearerToken') {
    // Store the bearer token in Chrome storage
    const bearerToken = message.bearerToken;
    chrome.storage.sync.set({ bearerToken }, () => {
      sendResponse(true);
    });
    return true;
  }

  if (message.type === 'promptApiKey') {
    // Open the extension's popup for API key input
    chrome.runtime.openOptionsPage();
  }

  if (message.type === 'promptBearerToken') {
    // Open the extension's popup for API key input
    chrome.runtime.openOptionsPage();
  }

  chrome.storage.sync.remove('bearerToken', () => {
    sendResponse(true);
  });

});
