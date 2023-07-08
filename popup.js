document.addEventListener('DOMContentLoaded', function () {
  const apiKeyInput = document.getElementById('apiKeyInput');
  const submitButton = document.getElementById('submitButton');
  const addWatchListButton = document.getElementById('addWatchList');
  const watchListInput = document.getElementById('watchListInput');
  const submitWatchListButton = document.getElementById('submitWatchListButton');
  const initialContent = document.getElementById('initialContent');
  const watchListContent = document.getElementById('watchListContent');

  submitButton.addEventListener('click', function () {
    const apiKey = apiKeyInput.value.trim();

    if (apiKey) {
      // Store the API key in Chrome storage
      chrome.runtime.sendMessage({ type: 'setApiKey', apiKey: apiKey }, (response) => {
        if (response) {
          console.log('API key:', apiKey);
          chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const activeTab = tabs[0];
            chrome.tabs.reload(activeTab.id);
            window.close(); // Close the popup after storing the API key
          });
        } else {
          console.error('Error storing API key');
        }
      });
    } else {
      console.log('No API key provided');
    }
  });

  addWatchListButton.addEventListener('click', function () {
    initialContent.style.display = 'none';
    watchListContent.style.display = 'flex';
  });

  submitWatchListButton.addEventListener('click', function () {
    const movieList = watchListInput.value.trim();
    if (movieList) {
      // Process the movie list and add it to the watchlist
      // ...
    } else {
      console.log('No movie list provided');
    }
  });
});
