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
  if (link) {
    link = normalizeLink(link);
    if (link.search("arxiv") != -1) {
      return link.replace("/abs/", "/pdf/").concat(".pdf");
    } else if (link.search("acl") != -1) {
      return link.concat(".pdf");
    }
  }
  return link;
}

TOP_TIER_CONFERENCES = [
  "EMNLP",
  "ACL",
  "NAACL",
  "ICLR",
  "NeurIPS",
  "ICML",
  "JMLR",
];

/**
 * Decide which conferences to bold.
 * @param {str} conference - The conference string.
 * @returns {bool} True if the conference and year should be bolded.
 */
function boldConference(conference, conferences = TOP_TIER_CONFERENCES) {
  return conferences.indexOf(conference) != -1;
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
  if (
    citation.authors[0] === "Brian Lester" ||
    citation.authors[0] === "Brian Lester*"
  ) {
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
      month: citations[i].month || 13,
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
      fallback_citation_count_date: citations[i].fallback_citation_count_date,
      semantic_scholar_id: citations[i].semantic_scholar_id,
      position: citations[i].position || null,
    });
  }
  // Render the publications into the HTML
  var app = new Vue({
    el: document.getElementById(target),
    data: {
      publications: publications,
      // Is our citation data live?
      live_data: true,
      sort_by: "custom",
      h_index: 0,
    },
    computed: {
      // Create a sorted view of the publications based on citation count.
      // Each time we touch the publications array (like when the citation
      // count is loaded in) a new sorted version will be made.
      sortedPublications: function () {
        if (this.sort_by == "custom") {
          // Sort a copy of the publications array as the async functions the
          // are fetching information like citation counts are writing position
          // based into publications and js .sort is in place (would cause
          // writes to the wrong publication if it moved).
          return [...this.publications].sort((p1, p2) => {
            // If two papers have the same citationCount
            console.debug("=================================================");
            console.debug("Publication Titles:");
            console.debug(p1.title);
            console.debug(p2.title);
            console.debug("Publication Citations:");
            console.debug(p1.citation_count);
            console.debug(p2.citation_count);
            // Make sure 0 and null are treated as equal for this comparison.
            if ((p1.citation_count || 0) === (p2.citation_count || 0)) {
              // If two papers came out in the same year
              console.debug("Publication Years:");
              console.debug(p1.year);
              console.debug(p2.year);
              if (p1.year === p2.year) {
                p1_first = firstAuthor(p1);
                p2_first = firstAuthor(p2);
                console.debug("I'm I the first author of the publication?");
                console.debug(p1_first);
                console.debug(p2_first);
                // If I am the first author on both or neither
                // Sort by title
                if ((p1_first && p2_first) || !(p1_first || p2_first)) {
                  console.debug("Sorting by title");
                  return p1.title < p2.title ? 1 : -1;
                  // Put first author papers first.
                } else if (p1_first) {
                  console.debug("Sorting by me being the first author.");
                  return -1;
                } else if (p2_first) {
                  console.debug("Sorting by me not being the first author.");
                  return 1;
                }
              }
              // Put more recent papers first.
              console.debug("Unequal years, sorting by publication year");
              return p1.year < p2.year ? 1 : -1;
            }
            // undefined citation counts will be sorted to the end as
            // `N < null` is true
            console.debug("Unequal Citations, sorting by citation count");
            return p1.citation_count < p2.citation_count ? 1 : -1;
          });
        } else if (this.sort_by == "year") {
          return [...this.publications].sort((p1, p2) => {
            if (p1.year === p2.year) {
              if (p1.month == p2.month) {
                p1_first = firstAuthor(p1);
                p2_first = firstAuthor(p2);
                console.debug("I'm I the first author of the publication?");
                console.debug(p1_first);
                console.debug(p2_first);
                // If I am the first author on both or neither
                // Sort by title
                if ((p1_first && p2_first) || !(p1_first || p2_first)) {
                  console.debug("Sorting by title");
                  return p1.title < p2.title ? 1 : -1;
                  // Put first author papers first.
                } else if (p1_first) {
                  console.debug("Sorting by me being the first author.");
                  return -1;
                } else if (p2_first) {
                  console.debug("Sorting by me not being the first author.");
                  return 1;
                }
              }
              console.debug("Unequal months, sorting by year/month");
              return p1.month < p2.month ? 1 : -1;
            }
            // Put more recent papers first.
            console.debug("Unequal years, sorting by publication year");
            return p1.year < p2.year ? 1 : -1;
          });
        }
      },
      // Re-order citations based on override key, this lets me edit the order
      // how I want, i.e. put prompt-tuning first. Note: the "position" key
      // starts at `1` not `0`
      displayPublications: function () {
        if (this.sort_by == "custom") {
          var display = this.sortedPublications.filter((ent) => !ent.position);
          var special = this.sortedPublications.filter((ent) => ent.position);
          special.forEach((ent) => display.splice(ent.position - 1, 0, ent));
          return display;
        } else {
          return this.sortedPublications;
        }
      },
      // Sum the total number of citations across publications.
      totalCitations: function () {
        return this.publications.reduce(
          (partialSum, p) => partialSum + p.citation_count || 0,
          0
        );
      },
      // Calculate my H Index. Given a list of publications, sorted by citation
      // count, if the 6th paper (1-indexed) has >= 6 citations, it means that
      // there are (at least) 6 papers with at least 6 citations as all previous
      // publications have more citations (due to the sort). We find the first
      // 0-indexed publication where this doesn't hold to find our H Index.
      hIndex: function () {
        for (var i = 0; i < this.sortedPublications.length; i++) {
          if ((this.sortedPublications[i].citation_count || 0) < i + 1) {
            break;
          }
        }
        if (this.h_index == 0) {
          this.h_index = i;
        }
        return this.h_index;
      },
      publicationCount: function () {
        return this.sortedPublications.length;
      },
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
      toggleSort: function () {
        if (this.sort_by == "custom") {
          this.sort_by = "year";
        } else if (this.sort_by == "year") {
          this.sort_by = "custom";
        }
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
        const data = this;
        data.live_data = false;
        // The new API limits on SemanticScholar makes it impossible to get the
        // data live on client side anymore :(
        //
        // fetch citation counts from semantic scholar and add to data async.
        // for (var i = 0; i < this.publications.length; i++) {
        //   const data = this;
        //   const j = i;
        //   if (this.publications[i].semantic_scholar_id) {
        //     $.ajax({
        //       url:
        //         "https://api.semanticscholar.org/graph/v1/paper/" +
        //         this.publications[i].semantic_scholar_id +
        //         "?fields=citationCount",
        //       success: function (resp) {
        //         let publication = {
        //           ...data.publications[j],
        //         };
        //         publication.citation_count = resp.citationCount;
        //         // Remove the fallback date as it is live
        //         publication.fallback_citation_count_date = null;
        //         data.$set(data.publications, j, publication);
        //       },
        //       error: function (xhr, error) {
        //         console.log(
        //           "Failed to read " + data.publications[j].semantic_scholar_id
        //         );
        //         console.log(xhr);
        //         // Triggers data staleness warning
        //         data.live_data = false;
        //       },
        //     });
        //   }
        // }
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
