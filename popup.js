document.addEventListener('DOMContentLoaded', function () {
  const apiKeyInput = document.getElementById('apiKeyInput');
  const submitButton = document.getElementById('submitButton');
  const addWatchListButton = document.getElementById('addWatchList');
  const watchListInput = document.getElementById('watchListInput');
  const submitWatchListButton = document.getElementById('submitWatchListButton');
  const bearerTokenLabel = document.getElementById('bearerTokenLabel');
  const bearerTokenInput = document.getElementById('bearerTokenInput');



  submitButton.addEventListener('click', function () {
    const apiKey = apiKeyInput.value.trim();

    if (apiKey) {
      // Store the API key in Chrome storage
      chrome.storage.sync.set({ apiKey }, function () {
        console.log('API key:', apiKey);
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          const activeTab = tabs[0];
          chrome.tabs.reload(activeTab.id);
        });
      });
    } else {
      console.log('No API key provided');
    }
  });

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

  submitWatchListButton.addEventListener('click', async function () {
    const bearerToken = bearerTokenInput.value.trim();

    if (bearerToken) {
      // Store the API key in Chrome storage
      chrome.storage.sync.set({ bearerToken }, function () {
        console.log('bearerToken :', bearerToken);
      });
    } else {
      console.log('No bearerToken provided');
    }
    await main();
  });

  async function maintest() {
    let bearerToken = await getBearerToken();
    console.log("Bearer : ", bearerToken);
      if (!bearerToken) {
      // Bearer token not found in input field, show the input field
      bearerTokenLabel.style.display = 'block';
      bearerTokenInput.style.display = 'block';
    }
  }

  async function main() {
    console.log('Running main function');
    const apiKey = await getApiKey();
    let bearerToken = await getBearerToken();
    bearerToken = `Bearer ${bearerToken}`;

    // Retrieve the movie list from the input field
    const movieList = watchListInput.value.trim();
    if (movieList) {
      const movies = movieList.split(',');

      if (apiKey && bearerToken) {
        console.log('Adding movies to watchlist');
        await addMoviesToWatchlist(movies, apiKey, bearerToken);
        console.log('Finished adding movies to watchlist');
      } else {
        console.error('API key or bearer token not found');
      }
    } else {
      console.log('No movie list provided');
    }
  }

  async function searchMovie(title, year = null) {
    const apiKey = await getApiKey();
    console.log('Searching movie:', title);

    const params = { api_key: apiKey, query: title };
    if (year) {
      params.primary_release_year = year;
    }

    const url = 'https://api.themoviedb.org/3/search/movie';
    const response = await fetch(url + '?' + new URLSearchParams(params));
    if (response.ok) {
      const data = await response.json();
      const results = data.results;
      if (results.length > 0) {
        console.log('Movie found:', results[0].title);
        return results[0]; // Return the first result
      } else {
        console.log('Movie not found');
        return null;
      }
    } else {
      console.error('Error:', response.status);
      return null;
    }
  }

  async function addMoviesToWatchlist(movies, apiKey, bearerToken) {
    for (const movieEntry of movies) {
      const trimmedEntry = movieEntry.trim();
      const regex = /^(.*?)\s\((\d+)\)$/; // Regex pattern to extract movie title and year

      if (regex.test(trimmedEntry)) {
        const [, movieTitle, movieYear] = trimmedEntry.match(regex);

        const movie = await searchMovie(movieTitle, movieYear);
        if (movie) {
          const movieId = movie.id;

          // Create the payload for the request
          const payload = {
            "media_type": "movie",
            "media_id": movieId,
            "watchlist": true
          };

          // Create the headers for the request
          const headers = {
            "Content-Type": "application/json;charset=utf-8",
            Authorization: bearerToken,
          };

          // Make the request
          const response = await fetch(
            `https://api.themoviedb.org/3/account/19857865/watchlist?api_key=${apiKey}`,
            {
              method: "POST",
              headers,
              body: JSON.stringify(payload)
            }
          );
          if (response.ok) {
            console.log(`Added ${movieTitle} (${movieYear}) to watchlist`);
            const data = await response.json();
            console.log(data);
          } else {
            console.error(
              `Error adding ${movieTitle} (${movieYear}) to watchlist:`,
              response.status
            );
          }

        } else {
          console.error(`Movie not found: ${trimmedEntry}`);
        }
      } else {
        console.error(`Invalid movie entry: ${trimmedEntry}`);
      }
    }

    console.log('After pause');
  }


});
