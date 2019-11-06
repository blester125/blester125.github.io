const MATH_JAX_ROW = 'MJX-MTR';
const classHighlight = 'highlight';
const showClass = 'show_class'


const Highlighter = {
    _element: null,
    highlight: function(id) {
        if (this._element != null) {
            this._element.classList.remove(classHighlight);
        }
        this._element = id;
        id.classList.add(classHighlight);
    }
};

function addFunctionOnHoverToMathJax(to_add_id, func) {
    var ele = document.getElementById(to_add_id);
    while (ele.nodeName != MATH_JAX_ROW) {
        ele = ele.parentNode;
        if (ele == null) {
            return;
        }
    }
    ele.onmouseover = func;
}

function findExplain(id) {
    return id.replace(/show-line/gi, 'explain-line');
}

function focusExplain(id) {
    var ele = document.getElementById(id)
    Highlighter.highlight(ele)
}

function addHoverToLines(pattern) {
    var show_eles = document.querySelectorAll('[id^=' + pattern + ']');
    for (var i = 0; i < show_eles.length; i++) {
        var id = show_eles[i].id
        var other = findExplain(id)
        console.log("Hover over " + id + " to act on " + other);
        func = focusExplain.bind(null, other)
        addFunctionOnHoverToMathJax(id, func);
    }
}
