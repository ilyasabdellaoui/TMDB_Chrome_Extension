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

  async function searchMovie(title, year = null) {
    const apiKey = await getApiKey();
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
        return results[0]; // Return the first result
      } else {
        return null;
      }
    } else {
      console.error('Error:', response.status);
      return null;
    }
  }

  function showResponseMessage(message, type) {
    const responseElement = document.getElementById('responseMessage');
    const newMessageElement = document.createElement('p');
    newMessageElement.textContent = message;
    newMessageElement.classList.add(type);
    responseElement.appendChild(newMessageElement);
    responseElement.style.display = 'grid';
    responseElement.style.textAlign = 'center';
  }

  function resetMessageDisplay() {
    const responseMessageElement = document.getElementById('responseMessage');
    // Clear the message content
    responseMessageElement.textContent = '';
  }

  async function checkMovieInWatchlist(movieId, apiKey, bearerToken) {
    const headers = {
      "Content-Type": "application/json;charset=utf-8",
      Authorization: bearerToken,
    };
  
    const response = await fetch(
      `https://api.themoviedb.org/3/account/19857865/watchlist/movies?api_key=${apiKey}`,
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
              `https://api.themoviedb.org/3/account/19857865/watchlist/movies?api_key=${apiKey}&page=${page}`,
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
    const moviesAdded = [];
    const errorMovies = [];
    const notFoundMovies = [];
    const invalidEntry = [];
    const alreadyInWatchlistMovies = [];
    const watchlistAPI = `https://api.themoviedb.org/3/account/19857865/watchlist?api_key=${apiKey}`;
    const headers = {
      "Content-Type": "application/json;charset=utf-8",
      Authorization: bearerToken,
    };
  
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
});
