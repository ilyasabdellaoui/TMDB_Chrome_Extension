document.addEventListener('DOMContentLoaded', function () {
  const apiKeyInput = document.getElementById('apiKeyInput');
  const submitButton = document.getElementById('submitButton');
  const addWatchListButton = document.getElementById('addWatchList');
  const watchListInput = document.getElementById('watchListInput');
  const submitWatchListButton = document.getElementById('submitWatchListButton');
  const bearerTokenLabel = document.getElementById('bearerTokenLabel');
  const bearerTokenInput = document.getElementById('bearerTokenInput');
  const responseElement = document.getElementById('responseMessage'); // Added responseElement
  const progressBar = document.querySelector('.progress');
  const progressBarContainer = document.querySelector('.progress-bar');
  const messageElement = document.querySelector('.message');

  // Store the bearerToken, accountId and API key once retrieved.
  let accountId; 

  submitButton.addEventListener('click', function () {
    const apiKey = apiKeyInput.value.trim();

    if (apiKey) {
      // Show the progress bar with a spinner
      progressBarContainer.style.display = 'flex';
      progressBar.style.display = 'inline-block';

      // Check the validity of the API key
      verifyApiKey(apiKey).then((isValid) => {
        // Hide the progress bar after the API key verification
        progressBarContainer.style.display = 'none';
        progressBar.style.display = 'none';

        if (isValid) {
          // Store the API key in Chrome storage
          chrome.storage.sync.set({ apiKey }, function () {
            console.log('API key:', apiKey);
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
              const activeTab = tabs[0];
              chrome.tabs.reload(activeTab.id);
              showApiMessage('API key submitted successfully.', 'success');
            });
          });
        } else {
          showApiMessage('Invalid API key. Please enter a valid API key.', 'error');
        }
      });
    } else {
      showApiMessage('Please enter a valid API key.', 'error');
    }
  });

  function verifyApiKey(apiKey) {
    // Simple test request to verify the validity of the API key
    const testUrl = `https://api.themoviedb.org/3/configuration?api_key=${apiKey}`;
    return fetch(testUrl)
      .then((response) => response.json())
      .then((data) => {
        return data.status_code !== 7; // A status code of 7 indicates an invalid API key
      })
      .catch(() => {
        return false;
      });
  }

  // Function to show messages
  function showApiMessage(message, type) {
    messageElement.textContent = message;
    messageElement.classList.remove('success', 'error');
    messageElement.classList.add(type);
    messageElement.style.display = 'block';

    // Hide the message after 3 seconds (adjust as needed)
    setTimeout(function () {
      messageElement.style.display = 'none';
    }, 3000);
  }

  // Function to retrieve the API key from the background script
  function getApiKey() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'getApiKey' }, (apiKey) => {
        if (apiKey) {
          resolve(apiKey);
        } else {
          resolve(null);
        }
      });
    });
  }

  addWatchListButton.addEventListener('click', async function () {
    document.getElementById('initialContent').style.display = 'none';
    document.getElementById('watchListContent').style.display = 'flex';
    await maintest();
  });

  function getBearerToken() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'getBearerToken' }, (bearerToken) => {
        if (bearerToken) {
          resolve(bearerToken);
        } else {
          resolve(null);
        }
      });
    });
  }

  async function getAccountDetails(bearerToken) {
    // Fetch account details from the API
    const accountDetails = await fetchAccountDetails(bearerToken);

    if (accountDetails && accountDetails.id) {
      const accountId = accountDetails.id;
      console.log('Account ID:', accountId); // This should print the correct account ID
      return accountId;
    }
    else {
      console.error('Account details not found or invalid bearer token.');
      return null;
    }
  }

  async function fetchAccountDetails(bearerToken) {
    const url = 'https://api.themoviedb.org/3/account';
    const headers = {
      Authorization: bearerToken,
    };

    const response = await fetch(url, { headers });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      console.error('Failed to fetch account details:', response.status);
      return null;
    }
  }

  submitWatchListButton.addEventListener('click', async function () {
    resetMessageDisplay();
    const bearerToken = bearerTokenInput.value.trim();

    if (bearerToken) {
      // Store the API key in Chrome storage
      chrome.storage.sync.set({ bearerToken }, function () {
        console.log('bearerToken :', bearerToken);
      });
    } else {
    }
    await main();
  });

  async function maintest() {
    let bearerToken = await getBearerToken();
    if (!bearerToken) {
      // Bearer token not found in input field, show the input field
      bearerTokenLabel.style.display = 'block';
      bearerTokenInput.style.display = 'block';
    }
  }

  async function main() {
    const apiKey = await getApiKey();
    let bearerToken = await getBearerToken();
    bearerToken = `Bearer ${bearerToken}`;

    // Retrieve the movie list from the input field
    const movieList = watchListInput.value.trim();
    if (movieList) {
      const movies = movieList.split(',');

      if (apiKey && bearerToken) {
        await addMoviesToWatchlist(movies, apiKey, bearerToken);
      } else {
        console.error('API key or bearer token not found');
      }
    } else {
      console.log('No movie list provided');
    }
  }

  // Global cache object to store search results
  const movieCache = new Map();

  async function searchMovie(title, year = null) {
    const apiKey = await getApiKey();

    const params = { api_key: apiKey, query: title };
    if (year) {
      params.primary_release_year = year;
    }

    // Check if the movie is already in the cache
    const cacheKey = JSON.stringify(params);
    if (movieCache.has(cacheKey)) {
      return movieCache.get(cacheKey);
    }

    const url = 'https://api.themoviedb.org/3/search/movie';
    const response = await fetch(url + '?' + new URLSearchParams(params));
    if (response.ok) {
      const data = await response.json();
      const results = data.results;
      if (results.length > 0) {
        // Cache the search results for future use
        movieCache.set(cacheKey, results[0]);
        return results[0]; // Return the first result
      } else {
        return null;
      }
    } else {
      console.error('Error:', response.status);
      return null;
    }
  }

  // Function to show response messages
  function showResponseMessage(message, type) {
    if (!responseElement) {
      console.error('Error: responseMessage element not found.');
      return;
    }

    const newMessageElement = document.createElement('p');
    newMessageElement.textContent = message;
    newMessageElement.classList.add(type);
    responseElement.appendChild(newMessageElement);
    responseElement.style.display = 'grid';
    responseElement.style.textAlign = 'center';
    // Add the progress-message class if the type is "loading"
    if (type === 'loading') {
      newMessageElement.classList.add('progress-message', 'animating');
    }
    return newMessageElement; // Return the new message element
  }

  function resetMessageDisplay() {
    if (!responseElement) {
      console.error('Error: responseMessage element not found.');
      return;
    }
    // Clear the message content
    responseElement.textContent = '';
    responseElement.style.display = 'none';
  }

  // Function to update loading message with dynamic dots
  function updateLoadingMessage(loadingMessage) {
    if (!loadingMessage) {
      console.error('Error: loadingMessage element not found.');
      return;
    }

    // Create the spinner element
    const spinner = document.createElement('span');
    spinner.classList.add('spinner');

    // Add the spinner and text to the loading message
    loadingMessage.appendChild(spinner);

    // Show the loading message
    loadingMessage.style.display = 'block';
  }

  async function checkMovieInWatchlist(movieId, apiKey, bearerToken) {
    const headers = {
      "Content-Type": "application/json;charset=utf-8",
      Authorization: bearerToken,
    };
    if (!accountId) {
      // Retrieve the accountId if it's not available
      accountId = await getAccountDetails(bearerToken);
      if (!accountId) {
        console.error('Failed to get the accountId. Please check the bearer token.');
        return false;
      }
    }
    const response = await fetch(
      `https://api.themoviedb.org/3/account/${accountId}/watchlist/movies?api_key=${apiKey}`,
      {
        method: "GET",
        headers,
      }
    );

    if (response.ok) {
      const data = await response.json();
      const watchlistMovies = data.results;

      // Check if the movie with the given movieId is in the watchlist
      const isInWatchlist = watchlistMovies.some((movie) => movie.id === movieId);

      if (!isInWatchlist && data.total_pages > 1) {
        // Fetch remaining pages of the watchlist in parallel
        const pagePromises = [];
        for (let page = 2; page <= data.total_pages; page++) {
          pagePromises.push(
            fetch(
              `https://api.themoviedb.org/3/account/${accountId}/watchlist/movies?api_key=${apiKey}&page=${page}`,
              {
                method: "GET",
                headers,
              }
            )
          );
        }

        const pageResponses = await Promise.all(pagePromises);
        const pageData = await Promise.all(pageResponses.map((res) => res.json()));

        // Check if the movie is in any of the fetched pages
        for (const pageMovies of pageData) {
          if (pageMovies.results.some((movie) => movie.id === movieId)) {
            return true;
          }
        }
      }

      return isInWatchlist;
    } else {
      throw new Error(`Failed to check watchlist: ${response.status}`);
    }
  }

  async function addMoviesToWatchlist(movies, apiKey, bearerToken) {
    if (!accountId) {
      accountId = await getAccountDetails(bearerToken);
      if (!accountId) {
        console.error('Failed to get the account_id. Please check the bearer token.');
        return;
      }
    }
    const moviesAdded = [];
    const errorMovies = [];
    const notFoundMovies = [];
    const invalidEntry = [];
    const alreadyInWatchlistMovies = [];
    const watchlistAPI = `https://api.themoviedb.org/3/account/${accountId}/watchlist?api_key=${apiKey}`;
    const headers = {
      "Content-Type": "application/json;charset=utf-8",
      Authorization: bearerToken,
    };

    // Show loading message with dynamic dots while processing
    const loadingMessage = showResponseMessage("  ", "loading");
    const loadingInterval = updateLoadingMessage(loadingMessage);

    for (const movieEntry of movies) {
      const trimmedEntry = movieEntry.trim();
      const regex = /^(.*?)\s\((\d+)\)$/; // Regex pattern to extract movie title and year

      if (!regex.test(trimmedEntry)) {
        invalidEntry.push(movieEntry);
        continue;
      }

      const [, movieTitle, movieYear] = trimmedEntry.match(regex);

      const movie = await searchMovie(movieTitle, movieYear);

      if (!movie) {
        notFoundMovies.push(movieEntry);
        continue;
      }

      const movieId = movie.id;

      const isInWatchlist = await checkMovieInWatchlist(movieId, apiKey, bearerToken);

      if (isInWatchlist) {
        alreadyInWatchlistMovies.push(movieEntry);
      } else {
        const payload = {
          media_type: "movie",
          media_id: movieId,
          watchlist: true,
        };

        const response = await fetch(watchlistAPI, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          console.log(`Added ${movieTitle} (${movieYear}) to watchlist`);
          moviesAdded.push(`${movieTitle} (${movieYear})`);
        } else {
          console.error(`Error adding ${movieTitle} (${movieYear}) to watchlist:`, response.status);
          errorMovies.push(`${movieTitle} (${movieYear})`);
        }
      }
    }

    // Hide the loading message when all responses are displayed
    clearInterval(loadingInterval);
    hideLoadingMessage(loadingMessage);

    // Show messages for already in watchlist, added, error, not found, and invalid entries
    if (errorMovies.length > 0) {
      const errorMessages = errorMovies.map((movie) => `${movie.title} (${movie.year})`);
      const errorMessage = `Failed to add ${errorMovies.length} movies: ${errorMessages.join(', ')}.`;
      showResponseMessage(errorMessage, 'error');
    }

    if (notFoundMovies.length > 0) {
      const notFoundMessages = notFoundMovies.map((movieEntry) => `${movieEntry}`);
      const notFoundMessage = `Failed to find ${notFoundMovies.length} movies: ${notFoundMessages.join(', ')}.`;
      showResponseMessage(notFoundMessage, 'error');
    }

    if (invalidEntry.length > 0) {
      const invalidMessages = invalidEntry.map((movieEntry) => `${movieEntry}`);
      const invalidMessage = `Invalid Entry of ${invalidEntry.length} movies: ${invalidMessages.join(', ')}.`;
      showResponseMessage(invalidMessage, 'error');
    }

    if (moviesAdded.length > 0) {
      if (errorMovies.length === 0) {
        showResponseMessage(`Added ${moviesAdded.length} movies successfully.`, 'success');
      } else {
        showResponseMessage(`Added ${moviesAdded.length} movies successfully, but some movies failed to be added.`, 'warning');
      }
    }

    if (alreadyInWatchlistMovies.length > 0) {
      const warningMessages = alreadyInWatchlistMovies.map((movie) => `${movie}`);
      const warningMessage = `Warning: ${alreadyInWatchlistMovies.length} movies already in watchlist: ${warningMessages.join(', ')}.`;
      showResponseMessage(warningMessage, 'warning');
    }
  }

  function hideLoadingMessage(loadingMessage) {
    if (!loadingMessage) {
      console.error('Error: loadingMessage element not found.');
      return;
    }

    loadingMessage.textContent = ``;
    loadingMessage.style.display = 'none';
    return loadingMessage;
  }
});
