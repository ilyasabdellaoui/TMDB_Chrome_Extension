document.addEventListener('DOMContentLoaded', function () {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const submitButton = document.getElementById('submitButton');
  
    submitButton.addEventListener('click', function () {
      const apiKey = apiKeyInput.value.trim();
  
      if (apiKey) {
        // Store the API key in Chrome storage
        chrome.runtime.sendMessage({ type: 'setApiKey', apiKey: apiKey }, (response) => {
          if (response) {
            console.log('API key:', apiKey);
            window.close(); // Close the popup after storing the API key
          } else {
            console.error('Error storing API key');
          }
        });
      } else {
        console.log('No API key provided');
      }
    });
  });
  