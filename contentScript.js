// Find the table with class "card credits"
var creditsTable = document.querySelector('table.card.credits');

if (creditsTable) {

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

  // Main function to handle the logic
  async function main() {
    // Get the API key from storage
    const apiKey = await getApiKey();

    if (apiKey) {
      // API key exists, continue with your logic using the key
      console.log('API key:', apiKey);
    } else {
      // API key doesn't exist, open the extension's popup for API key input
      chrome.runtime.sendMessage({ type: 'promptApiKey' });
    }
  }

  // Find all tables with class "credit_group" within the creditsTable
  var creditTables = creditsTable.querySelectorAll('table.credit_group');

  // Iterate over each table
  creditTables.forEach(async function (table) {
    // Find all table rows in the current table
    var tableBodies = table.querySelectorAll('tbody');
    tableBodies.forEach(async function (tableRow) {
      var tableRows = tableRow.querySelectorAll('tr');

      // Iterate over each table row
      tableRows.forEach(async function (row) {
        row.addEventListener('mouseenter', function () {
          row.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
          row.style.transition = 'all .7s ease-in-out';
        });

        row.addEventListener('mouseleave', function () {
          row.style.boxShadow = 'none';
          row.style.transform = 'none';
          row.style.transition = 'all .7s ease-in-out';
        });


        var tdRightElements = row.querySelectorAll('td.role.true.account_adult_false.item_adult_false');
        tdRightElements.forEach(function (element) {
          element.style.borderRadius = '0 12px 12px 0';
          element.style.background = "rgba( 255, 255, 255, 0.25 )";
          element.style.backdropFilter = "blur(5px)";
          element.style.webkitBackdropFilter = "blur(5px)";
          element.style.border = '1px rgba(3, 37, 65, 0.3)';
          element.style.borderStyle = 'solid solid solid none';
        });

        var tdLeftElements = row.querySelectorAll('td.year');
        tdLeftElements.forEach(function (element) {
          element.style.background = "rgba( 255, 255, 255, 0.25 )";
          element.style.borderRadius = '12px 0 0 12px';
          element.style.backdropFilter = "blur(5px)";
          element.style.webkitBackdropFilter = "blur(5px)";
          element.style.border = '1px rgba(3, 37, 65, 0.3)';
          element.style.borderStyle = 'solid none solid solid';
        });

        var tdCenterElements = row.querySelectorAll('td.seperator');
        tdCenterElements.forEach(function (element) {
          element.style.background = "rgba( 255, 255, 255, 0.25 )";
          element.style.backdropFilter = "blur(5px)";
          element.style.webkitBackdropFilter = "blur(5px)";
          element.style.border = '1px rgba(3, 37, 65, 0.3)';
          element.style.borderStyle = 'solid none';
        });

        // Create and append the <hr> element
        var hrElement = document.createElement('hr');
        hrElement.style.border = '0.5px solid white';
        row.insertAdjacentElement('afterend', hrElement);

        // Find all elements within the current row
        var elements = row.querySelectorAll('*');
        // Apply the white color to the text of each element
        elements.forEach(function (element) {
          // element.style.color = '#fff';
        });

        // Find the necessary data from the current row
        var yearElement = row.querySelector('.year');
        var movieUrlElement = row.querySelector('.tooltip');
        var movieTitleElement = row.querySelector('.tooltip bdi');
        var charactertextElement = row.querySelector('.group');
        var characterElement = row.querySelector('.character');
        var spanElement = row.querySelector('.glyphicons_v2.circle-empty.account_adult_false.item_adult_false');
        spanElement.style.backgroundColor = '#fff';
        spanElement.style.borderRadius = '50%';

        // Check if all required elements exist
        // var year = yearElement.textContent;
        var movieUrl = movieUrlElement.getAttribute('href');
        var movieTitle = movieTitleElement.textContent;
        // var character = characterElement.textContent;

        // Function to get the poster URL for a movie ID
        async function getMoviePoster(movieId) {
          const apiKey = await getApiKey();
          const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`;

          try {
            const response = await fetch(url);
            const data = await response.json();

            // Check if the poster path exists
            if (data.poster_path) {
              // Extract the poster URL from the data
              const posterUrl = `https://image.tmdb.org/t/p/w130_and_h195_bestv2${data.poster_path}`;
              return posterUrl;
            } else {
              return null;
            }
          } catch (error) {
            console.error('Error:', error);
            return null;
          }
        }

        // Function to get the rating for a movie ID
        async function getMovieRating(movieId) {
          const apiKey = await getApiKey();
          const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`;

          try {
            const response = await fetch(url);
            const data = await response.json();

            // Check if the rating exists
            if (data.vote_average) {
              // Extract the rating from the data
              const rating = data.vote_average;
              return rating;
            } else {
              return null;
            }
          } catch (error) {
            console.error('Error:', error);
            return null;
          }
        }

        // Check if movieUrl is not null or empty before splitting
        if (movieUrl) {
          // Get the movie ID from the movie URL
          const movieId = movieUrl.split('/').pop();

          // Fetch the poster URL and rating for the movie ID
          const posterUrl = await getMoviePoster(movieId);
          const rating = await getMovieRating(movieId);

          // Create a new HTML element with the provided code if posterUrl exists
          if (posterUrl) {
            // Create a new tooltip container
            var tooltipContainer = document.createElement('div');
            tooltipContainer.className = 'tooltip-container';

            // Create a new div for the movie details
            var movieDetails = document.createElement('div');
            movieDetails.className = 'movie-details';

            // Create a new anchor element for the movie URL
            var anchorElement = document.createElement('a');
            anchorElement.href = movieUrl;

            // Create a new img element for the poster image
            var imgElement = document.createElement('img');
            imgElement.className = 'poster';
            imgElement.src = posterUrl;
            imgElement.alt = movieTitle;
            imgElement.width = 130;
            imgElement.height = 195;
            imgElement.style.borderRadius = '7%';
            imgElement.style.marginTop = '5px';

            // Append the img element and rating element to the anchor element
            anchorElement.appendChild(imgElement);

            if (rating) {
              // Create a new span element for the rating
              var ratingElement = document.createElement('span');
              ratingElement.className = 'rating';
              var starElement = document.createElement('span');
              starElement.className = 'star';
              starElement.textContent = '★ ';
              ratingElement.textContent = starElement.textContent + rating;
              ratingElement.style.float = 'right';

              // Apply the CSS styles to the rating element
              ratingElement.style.backgroundColor = '#01B4E4';
              ratingElement.style.color = '#fff';
              ratingElement.style.padding = '5px';
              ratingElement.style.fontSize = '14.4px';
              ratingElement.style.fontFamily = 'Source Sans Pro, Arial, sans-serif';
              ratingElement.style.fontWeight = 'bold';
              ratingElement.style.borderRadius = '3px';
              ratingElement.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';

              // Append the rating element to the anchor element
              anchorElement.appendChild(ratingElement);
            }

            // Find the necessary <td> element
            var tdElement = row.querySelector('td.role.true.account_adult_false.item_adult_false');

            // Append the anchor element to the <td> element
            tdElement.appendChild(anchorElement);
          }
        }
      });
    });
  });
}
