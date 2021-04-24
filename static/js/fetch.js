/**
 * Fetch a file and run a function on the content
 * @param {str} fileName - The url to fetch
 * @param {Callable} func - The function to call with the returned data
 */
function readFile(fileName, func) {
  $.ajax({
    url: fileName,
    success: func,
  });
}

/**
 * Given a list of file names run a function on each file
 * Note: This collections the contents of the file into an array and then runs
 *       the function on each return data blob once all the data has been featched
 * @param {List[str]} fileNames - A list of urls to fetch
 * @param {Callable} func - The function to call on the list of returned data
 */
function readFiles(fileNames, func) {
  var content = [];
  var requests = [];
  for (var i = 0; i < fileNames.length; i++) {
    requests.push(
      $.ajax({
        url: fileNames[i],
        success: function (data) {
          content.push(data);
        },
      })
    );
  }
  $.when.apply($, requests).done(function () {
    func(content);
  });
}

/**
 * Load a script file from url
 * @param {str} url - The location to load the script from.
 * @param {} location - Where to add the script as a child.
 */
function loadScript(url, location = document.head) {
  var scriptTag = document.createElement("script");
  scriptTag.src = url;
  location.appendChild(scriptTag);
}
