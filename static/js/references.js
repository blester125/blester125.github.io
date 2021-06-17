const Cite = require("citation-js");

/**
 * Extract author information from a citation and convert to a single string.
 * The first letter of the given name is extracted and the people are separated by commas
 * @param {*} author - the author information given by citation-js
 */
function authorString(author) {
  var author_string = "";
  for (var i = 0; i < author.length; i++) {
    author_string += author[i].given[0] + ". ";
    author_string += author[i].family;
    if (i < author.length - 1) {
      author_string += ", ";
    }
  }
  return author_string;
}

/**
 * Extract venue information from the citation and return a string
 * @param {*} citation - The citation object from citation-js
 */
function venueString(citation) {
  var venue_string = "";
  venue_string += citation["container-title"];
  var date_parts = citation.issued["date-parts"][0];
  var year = extractYear(citation);
  if (year != 0) {
    venue_string += ", " + date_parts[0];
  }
  if (citation["publisher-place"]) {
    venue_string += ", " + citation["publisher-place"];
  }
  return venue_string;
}

/**
 * Extract the year from the citation
 * @param {*} citation - The citation object from citation-js
 */
function extractYear(citation) {
  date_parts = citation.issued["date-parts"][0];
  if (date_parts.length >= 1) {
    return parseInt(date_parts[0], 10);
  }
  return 0;
}

/**
 * Extract the month from the citation
 * @param {*} citation - The citation object from citation-js
 */
function extractMonth(citation) {
  date_parts = citation.issued["date-parts"][0];
  if (date_parts.length >= 2) {
    return parseInt(date_parts[1], 10);
  }
  return 0;
}

/**
 * Get the family name of the first author, return a string
 * @param {*} citation - The citation object from citation-js
 */
function extractFirstAuthor_family(citation) {
  return citation.author[0].family;
}

/**
 * Compare citations, return based on the publication year and break ties with the first authors family name
 * @param {*} a - The citation object from citation-js
 * @param {*} b - The citation object from citation-js
 */
function compareCitations(a, b) {
  var a_year = extractYear(a);
  var b_year = extractYear(b);
  if (a_year === b_year) {
    var a_month = extractMonth(a);
    var b_month = extractMonth(b);
    if (a_month === b_month) {
      return extractFirstAuthor_family(a) > extractFirstAuthor_family(b)
        ? 1
        : -1;
    }
    return a_month < b_month ? 1 : -1;
  }
  return a_year < b_year ? 1 : -1;
}

/**
 * Sort citations and permute the raw bibtext to match.
 * @param {*} citations - A list of citation objects
 * @param {List[str]} content - A list of bibtext strings
 */
function sortCitations(citations, content) {
  for (var i = 0; i < citations.length; i++) {
    citations[i] = [citations[i], i];
  }
  citations.sort((a, b) => compareCitations(a[0], b[0]));
  var indices = [];
  for (var i = 0; i < citations.length; i++) {
    indices.push(citations[i][1]);
    citations[i] = citations[i][0];
  }
  sorted_content = new Array(indices.length);
  for (var i = 0; i < indices.length; i++) {
    sorted_content[i] = content[indices[i]];
  }
  return [citations, sorted_content];
}

/**
 * Extract my custom `code` attribute from a citation.
 * @param {*} citation - The full citation object.
 */
function extractCode(citation) {
  return citation._graph[1].data.properties.code;
}

/**
 * Extract my custom `video` attribute from a citation.
 * @param {*} citation - The full citation object.
 */
function extractVideo(citation) {
  return citation._graph[1].data.properties.video;
}

/**
 * Extract my custom `poster` attribute from a citation.
 * @param {*} citation - The full citation object.
 */
function extractPoster(citation) {
  return citation._graph[1].data.properties.poster;
}

/**
 * Extract my custom `slides` attribute from a citation.
 * @param {*} citation - The full citation object.
 */
function extractSlides(citation) {
  return citation._graph[1].data.properties.slides;
}

/**
 * Extract my custom `pdf` attribute from a citation.
 * @param {*} citation - The full citation object.
 */
function extractPDFLink(citation) {
  return citation._graph[1].data.properties.pdf;
}

/**
 * Normalize a link by removing any trailing `/`.
 * @param {str} link - The link.
 * @returns {str} The link with the final `/` removed.
 */
function normalizeLink(link) {
  return link.replace(/\/$/, "");
}

/**
 * Convert common abstract links to pdf links.
 * @param {str} link - The link to the paper abstract.
 * @returns {str} The new link to the pdf, or just the original link if
 *   conversion fails.
 */
function rewritePDFLink(link) {
  link = normalizeLink(link);
  if (link.search("arxiv") != -1) {
    return link.replace("/abs/", "/pdf/").concat(".pdf");
  } else if (link.search("aclweb") != -1) {
    return link.concat(".pdf");
  }
  return link;
}

/**
 * Render out the references into the HTML
 * Note:
 *   This also adds a global onclick to the whole window so if you ever
 *   click on a modal object it will disappear. I couldn't put this on
 *   modal itself because it would make the modal content part unclickable?
 * @param {str} target - The id of the element we are going to be populating
 * @param {List[str]} content - The list of raw bibtext entries
 */
function createReferences(target, content) {
  // Use citation-js to parse bibtext
  var bibs = [];
  for (var i = 0; i < content.length; i++) {
    var bib = new Cite(content[i]);
    bibs.push(bib.data[0]);
  }
  // sort the citations
  sorted = sortCitations(bibs, content);
  bibs = sorted[0];
  content = sorted[1];
  // extract the relevant information from the citations
  var publications = [];
  for (var i = 0; i < bibs.length; i++) {
    publications.push({
      id: bibs[i]["citation-label"],
      modal_id: "modal-" + i,
      link: bibs[i].URL,
      // Try to extract a `pdf` field from the citation, fall back to url
      // rewrites if it is not present.
      direct_link: extractPDFLink(bibs[i]) || rewritePDFLink(bibs[i].URL),
      title: bibs[i].title,
      authors: authorString(bibs[i].author),
      venue: venueString(bibs[i]),
      bibtext: content[i],
      code: extractCode(bibs[i]),
      video: extractVideo(bibs[i]),
      poster: extractPoster(bibs[i]),
      slides: extractSlides(bibs[i]),
    });
  }
  // Render the publications into the HTML
  var app = new Vue({
    el: target,
    data: {
      publications: publications,
    },
    methods: {
      showModal: function (id) {
        var modal = document.getElementById(id);
        modal.style.display = "block";
      },
      hideModal: function (id) {
        var modal = document.getElementById(id);
        modal.style.display = "none";
      },
    },
  });
  // Activate clipboard js for all the copy bibtext buttons
  clipboard = new ClipboardJS(".paper-button");
}

/**
 * Given a list of file names and a path prefix, read all files and render into html
 * @param {str} target - The string name of the element you are going to populate
 * @param {str} prefix - The string prefix to add to all file names
 * @param {str} citations - The index of citation files, each line represents a file to read
 */
function generateReferences(target, prefix, citations) {
  var files = citations.split(/\r?\n/);
  files = files.filter((file) => file != "");
  for (var i = 0; i < files.length; i++) {
    files[i] = prefix + files[i];
  }
  var target = document.getElementById(target);
  readFiles(files, createReferences.bind(null, target));
}
