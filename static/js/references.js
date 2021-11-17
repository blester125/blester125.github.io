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
      bibtex_location: citations[i].bibtex,
      citation_count: citations[i].citation_count,
      semantic_scholar_id: citations[i].semantic_scholar_id,
    });
  }
  console.log(JSON.stringify(publications));
  // Render the publications into the HTML
  var app = new Vue({
    el: document.getElementById(target),
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
      loadBibTeX: function () {
        // Load the bibtex file as a string.
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
        // fetch citation counts from semantic scholar
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
                console.log(JSON.stringify(publication));
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
      this.loadBibTeX();
      this.citationCount();
    },
  });
  // Activate clipboard js for all the copy bibtext buttons
  clipboard = new ClipboardJS(".paper-button");
}
