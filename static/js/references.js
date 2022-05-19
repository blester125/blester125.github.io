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
  } else if (link.search("acl") != -1) {
    return link.concat(".pdf");
  }
  return link;
}

TOP_TIER_CONFERENCES = ["EMNLP", "ACL", "NAACL", "ICLR", "NeurIPS"];

/**
 * Decide which conferences to bold.
 * @param {str} conference - The conference string.
 * @returns {bool} True if the conference and year should be bolded.
 */
function boldConference(conference) {
  var idx = TOP_TIER_CONFERENCES.indexOf(conference);
  if (idx === -1) {
    return null;
  }
  return true;
}

/**
 * Remove some special html from the title as they aren't rendered in the
 * Button title mouse overs.
 * @param {str} title - The title with the html in it.
 * @returns {str} The title without the html.
 */
function cleanTitle(title) {
  // I control all the titles I create so manual cleaning where I update this
  // function when need be seems fine. If things every get really hairy I can
  // add a `raw_title` field to the reference json blob.
  return title.replace(/<\/?samp>/gi, "");
}

/**
 * Convert the list of author {"first": ..., "last": ...} to a string.
 * @param {List[Dict[str, str]]} authors - The list of authors on a paper.
 * @returns {List[str]} A list of formatted author strings.
 */
function formatAuthors(authors) {
  var authorStrings = [];
  for (var i = 0; i < authors.length; i++) {
    authorStrings.push(authors[i].first + " " + authors[i].last);
  }
  return authorStrings;
}

/**
 * Detect if I am the first author on a paper.
 * @param {obj} The json citation.
 * @return {bool} True if I am the first author, false otherwise.
 */
function firstAuthor(citation) {
  if (citation.authors[0].first === "Brian" && (citation.authors[0].last === "Lester" || citation.authors[0].last == "Lester"*)) {
    return true;
  }
  return false;
}


/**
 * Render out the references into the HTML
 * Note:
 *   This also adds a global onclick to the whole window so if you ever
 *   click on a modal object it will disappear. I couldn't put this on
 *   modal itself because it would make the modal content part unclickable?
 * @param {str} target - The id of the element we are going to be populating
 * @param {List} citations - The list of json citation information
 */
function generateReferences(target, citations) {
  var publications = [];
  for (var i = 0; i < citations.length; i++) {
    publications.push({
      id: citations[i].refkey,
      modal_id: "modal-" + i,
      link: citations[i].url,
      // Try to extract a `pdf` field from the citation, fall back to url
      // rewrites if it is not present.
      direct_link: citations[i].pdf || rewritePDFLink(citations[i].url),
      title: citations[i].title,
      authors: formatAuthors(citations[i].author),
      venue: citations[i].conference,
      bold_venue: boldConference(citations[i].conference),
      year: citations[i].year,
      workshop: citations[i].workshop,
      location: citations[i].location,
      code: citations[i].code,
      video: citations[i].video,
      poster: citations[i].poster,
      slides: citations[i].slides,
      bibtex: null,
      raw_title: cleanTitle(citations[i].title),
      bibtex_location: citations[i].bibtex,
      citation_count: citations[i].citation_count,
      semantic_scholar_id: citations[i].semantic_scholar_id,
    });
  }
  // Render the publications into the HTML
  var app = new Vue({
    el: document.getElementById(target),
    data: {
      publications: publications,
    },
    computed: {
      // Create a sorted view of the publications based on citation count.
      // Each time we touch the publications array (like when the citation
      // count is loaded in) a new sorted version will be made.
      sortedPublications: function () {
	// Sort a copy of the publications array as the async functions the
	// are fetching information like citation counts are writing position
	// based into publications and js .sort is in place (would cause
	// writes to the wrong publication if it moved).
	return [...this.publications].sort((p1, p2) => {
          // If two papers have the same citationCount
	  if (p1.citation_count === p2.citation_count) {
            // If two papers came out in the same year
            if (p1.year === p2.year) {
              p1_first = firstAuthor(p1);
              p2_first = firstAuthor(p2);
              // If I am the first author on both or neither
	      // Sort by title
              if (p1_first && p2_first || !(p1_first || p2_first)) {
                return p1.title < p2.title ? 1 : -1;
	      // Put first author papers first.
	      } else if (p1_first) {
                return -1
	      } else if (p2_first) {
		return 1
	      }
	    }
            // Put more recent papers first.
            return p1.year < p2.year ? 1 : -1;
	  }
          // undefined citation counts will be sorted to the end as
          // `N < null` is true
	  return p1.citation_count < p2.citation_count ? 1 : -1;
	});
      }
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
      loadBibTeX: function () {
        // Load the bibtex file as a string and update it in the data async.
        for (var i = 0; i < this.publications.length; i++) {
          const data = this;
          const j = i;
          readFile(this.publications[i].bibtex_location, function (content) {
            let publication = {
              ...data.publications[j],
            };
            publication.bibtex = content;
            data.$set(data.publications, j, publication);
          });
        }
      },
      citationCount: function () {
        // fetch citation counts from semantic scholar and add to data async.
        for (var i = 0; i < this.publications.length; i++) {
          const data = this;
          const j = i;
          if (this.publications[i].citation_count) {
            continue;
          }
          if (this.publications[i].semantic_scholar_id) {
            $.ajax({
              url:
                "https://api.semanticscholar.org/graph/v1/paper/" +
                this.publications[i].semantic_scholar_id +
                "?fields=citationCount",
              success: function (resp) {
                let publication = {
                  ...data.publications[j],
                };
                publication.citation_count = resp.citationCount;
                data.$set(data.publications, j, publication);
              },
              error: function (xhr, error) {
                console.log(
                  "Failed to read " + data.puplications[j].semantic_scholar_id
                );
              },
            });
          }
        }
      },
    },
    mounted() {
      // When this is loaded, start fetching bibtex from disk and Semantic
      // Scholar citation counts async
      this.loadBibTeX();
      this.citationCount();
    },
  });
  // Activate clipboard js for all the copy bibtext buttons
  clipboard = new ClipboardJS(".paper-button");
}
