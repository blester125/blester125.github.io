const Cite = require('citation-js')

function make_class(tag, cls_name) {
    var cls = document.createElement(tag);
    cls.classList.add(cls_name)
    return cls
}

function entry_to_html(citation, bib) {
    var wrapper = document.createElement("div")

    var link = make_class("a", "paper-link")
    link.href = citation.URL;
    wrapper.appendChild(link)

    var row = make_class("div", "row");
    link.appendChild(row);

    var leftPad = make_class("div", "col-lg-1");
    row.appendChild(leftPad);

    var content = make_class("div", "col-lg-10");
    row.appendChild(content);

    var rightPad = make_class("div", "col-lg-1");
    row.appendChild(rightPad);

    var title = make_class("h3", "paper-title");
    title.innerHTML = citation.title;
    content.appendChild(title);

    var author = make_class("h4", "paper-authors");
    author.innerText = authorString(citation.author);
    content.appendChild(author)

    var description = make_class("p", "paper-venue");
    description.innerHTML = venueString(citation);
    content.appendChild(description)

    // var copy = make_class("button", "button");
    // var cite = new Cite()
    // var bibtex = cite.set(citation).format('bibtex')
    // copy.onclick = copyStringToClipboard.bind(null, bibtex);
    // copy.innerHTML = "Copy BibTex"

    // wrapper.appendChild(copy)

    return wrapper
}


function copyStringToClipboard(str) {
    var el = document.createElement('input');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style = {position: 'absolute', left: '-9999px'};
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}


function authorString(author) {
    var author_string = "";
    for (var i = 0; i < author.length; i++) {
        author_string += author[i].given[0] + ". "
        author_string += author[i].family
        if (i < author.length - 1) {
            author_string += ", "
        }
    }
    return author_string
}


function extract_year(citation) {
    date_parts = citation.issued["date-parts"][0];
    if (date_parts.length >= 1) {
        return date_parts[0]
    }
    return 0;
}


function extract_first_author_family(citations) {
    return citations.author[0].family
}


function venueString(citation) {
    var venue_string = '';
    venue_string += citation['container-title'];
    var date_parts = citation.issued["date-parts"][0];
    var year = extract_year(citation)
    if (year != 0) {
        venue_string += ", " + date_parts[0];
    }
    if (citation["publisher-place"]) {
        venue_string += ", " + citation["publisher-place"];
    }
    return venue_string
}


function generate_references(citations, target) {
    var target = document.getElementById(target)
    bib = new Cite(citations);
    citations = bib.data;
    citations = sort_citations(citations);
    for (var i = 0; i < citations.length; i++) {
        var l = entry_to_html(citations[i], bib)
        target.appendChild(l);
    }
}


function sort_citations(citations) {
    citations.sort((a, b) => (extract_first_author_family(a) > extract_first_author_family(b) ? 1 : -1))
    citations.sort((a, b) => (extract_year(a) < extract_year(b) ? 1 : -1))
    return citations
}
