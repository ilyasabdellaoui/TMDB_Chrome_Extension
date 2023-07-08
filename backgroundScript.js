// Listen for messages from the content script
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
    if (message.type === 'setApiKey') {
      // Store the API key in Chrome storage
      const apiKey = message.apiKey;
      chrome.storage.sync.set({ apiKey }, () => {
        sendResponse(true);
      });
  
      // Return true to indicate that the response will be sent asynchronously
      return true;
    }
  });
  