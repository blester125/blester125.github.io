const Cite = require('citation-js')

function make_class(tag, cls_name) {
    var cls = document.createElement(tag);
    if (Array.isArray(cls_name)) {
        for (var i = 0; i < cls_name.length; i++) {
            cls.classList.add(cls_name[i]);
        }
    } else {
        cls.classList.add(cls_name);
    }
    return cls
}

function make_centered_row(pad, root) {

    var row = make_class("div", "row");
    root.appendChild(row);

    var leftPad = make_class("div", "col-lg-" + pad);
    row.appendChild(leftPad);

    var content = make_class("div", "col-lg-" + (12 - pad - pad));
    row.appendChild(content);

    var rightPad = make_class("div", "col-lg-" + pad);
    row.appendChild(rightPad);

    return content
}

function reference_to_html(citation, bibtex) {
    var wrapper = document.createElement("div");

    var link = make_class("a", "paper-link");
    link.href = citation.URL;
    wrapper.appendChild(link);

    var content = make_centered_row(1, link);

    var title = make_class("h3", "paper-title");
    title.innerHTML = citation.title;
    content.appendChild(title);

    var author = make_class("h4", "paper-authors");
    author.innerText = authorString(citation.author);
    content.appendChild(author)

    var description = make_class("p", "paper-venue");
    description.innerHTML = venueString(citation);
    content.appendChild(description)

    var links = make_centered_row(1, wrapper);

    var pdf = make_class("a", ["btn", "btn-primary", "paper-button-first"]);
    pdf.href = citation.URL;
    pdf.innerText = "PDF"
    pdf.style['margin-left'] = "5%";
    links.appendChild(pdf)

    var bib_btn = make_class("a", ["btn", "btn-primary", "paper-button"]);
    bib_btn.innerHTML = "BibTex";

    // Create a model we can write the bibtex in
    var modal = make_class("div", "modal");
    modal.style.display = "none";
    wrapper.appendChild(modal);

    var modal_content = make_class("div", "modal-content");
    modal.appendChild(modal_content);

    var text_area = make_class("pre", "bibtex");
    text_area.innerText = bibtex;
    text_area.setAttribute('readonly', '')
    modal_content.appendChild(text_area);

    bib_btn.onclick = function() {
        modal.style.display = "block";
    }

    window.onclick = function(event) {
        if (event.target.className == "modal") {
            event.target.style.display = "none";
        }
    }
    links.appendChild(bib_btn)

    var copy = make_class("button", ["btn", "btn-primary", "paper-button"]);
    copy.setAttribute("data-clipboard-text", bibtex)
    var clipboard_icon = make_class("i", ["far", "fa-copy"]);
    copy.title = "Copy BibTex to Clipboard"
    copy.appendChild(clipboard_icon)
    links.appendChild(copy)

    return wrapper
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

function readFile(fileName, func) {
    $.ajax({
        url: fileName,
        success: func
    });
}

function readFiles(fileNames, func) {
    var content = [];
    var requests = [];
    for (var i = 0; i < fileNames.length; i++) {
        requests.push($.ajax({
            url: fileNames[i],
            success: function(data) {
                content.push(data);
            }
        }));
    }
    $.when.apply($, requests).done(function() {
        func(content)
    })
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

function create_references(target, content) {
    var bibs = [];
    for (var i = 0; i < content.length; i++) {
        var bib = new Cite(content[i])
        bibs.push(bib.data[0])
    }
    sorted = sort_citations(bibs, content);
    bibs = sorted[0];
    content = sorted[1];
    for (var i = 0; i < bibs.length; i++) {
        var l = reference_to_html(bibs[i], content[i])
        target.appendChild(l);
    }
    clipboard = new ClipboardJS('.paper-button');
}

function generate_references(target, citations) {
    var files = citations.split(/\r?\n/);
    files = files.filter(file => file != '');
    for (var i = 0; i < files.length; i++) {
        files[i] = "references/" + files[i];
    }
    var target = document.getElementById(target)
    var content = readFiles(files, create_references.bind(null, target))
}

function compare_citations(a, b) {
    var a_year = extract_year(a);
    var b_year = extract_year(b);
    if (a_year == b_year) {
        return extract_first_author_family(a) > extract_first_author_family(b) ? 1 : -1;
    }
    return a_year < b_year ? 1 : -1;
}

function sort_citations(citations, content) {
    for (var i = 0; i < citations.length; i++) {
        citations[i] = [citations[i], i]
    }
    citations.sort((a, b) => compare_citations(a[0], b[0]));
    var indices = [];
    for (var i = 0; i < citations.length; i++) {
        indices.push(citations[i][1]);
        citations[i] = citations[i][0];
    }
    sorted_content = new Array(indices.length);
    for (var i = 0; i < indices.length; i++) {
        sorted_content[i] = content[indices[i]];
    }
    return [citations, sorted_content]
}
