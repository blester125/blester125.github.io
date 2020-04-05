const MATH_JAX_ROW = "MJX-MTR";
const MATH_JAX_QED_ROW = "MJX-MLABELEDTR";
const classHighlight = "highlight";
const showClass = "show_class";

// A singleton class that will highlight an element.
// It makes sure that only one thing is highlighted at a time.
const Highlighter = {
  _element: null,
  highlight: function (id) {
    if (this._element != null) {
      this._element.classList.remove(classHighlight);
    }
    this._element = id;
    id.classList.add(classHighlight);
  },
};

/**
 * Find the parent mathjax row of to_add_id and bind func to the mouse over
 * @param {str} to_add_id - The element we adding the function to
 * @param {*} func - The function that is bound to the element on mouse over
 */
function addFunctionOnHoverToMathJax(to_add_id, func) {
  var ele = document.getElementById(to_add_id);
  // When we add a `\qed` to a like it becomes a labeled row so we need to grab those too
  while (
    !(ele.nodeName === MATH_JAX_ROW || ele.nodeName === MATH_JAX_QED_ROW)
  ) {
    ele = ele.parentNode;
    if (ele == null) {
      return;
    }
  }
  ele.onmouseover = func;
}

/**
 * Replace the string "show-line" with "explain-line" in id
 * @param {str} id - The string to replace in
 * @returns {str} - The id with "explain-line" replacing "show-line"
 */
function findExplain(id) {
  return id.replace(/show-line/gi, "explain-line");
}

/**
 * Highlight the element with id, id and scroll the parent object so the
 * element is in view. Requires the scollintoview jquery plugin.
 * @param {str} hover - The id of the element that activated this function on mouse over
 * @param {str} id - The id of the element were are highlighting
 * @param {int} pad - The number of pixels to include as padding in the y axis
 * @param {float} dur - How long the scroll should take
 */
function focusExplain(hover, id, pad = 10, dur = 0.01) {
  var ele = document.getElementById(id);
  Highlighter.highlight(ele);
  $("#" + id).scrollintoview({
    duration: dur,
    direction: "y",
    viewPadding: { y: pad },
  });
}

/**
 * Add the hover function to all the elements that match pattern
 * @param {str} pattern - The pattern that all the ids we will add the function to matches
 * @param {int} pad - The number of pixels to include as padding in the y axis
 * @param {float} dur - How long the scroll should take
 */
function addHoverToLines(pattern, pad = 10, dur = 0.01) {
  var show_eles = document.querySelectorAll("[id^=" + pattern + "]");
  for (var i = 0; i < show_eles.length; i++) {
    var id = show_eles[i].id;
    var other = findExplain(id);
    console.log("Hover over " + id + " to act on " + other);
    func = focusExplain.bind(null, id, other, pad, dur);
    addFunctionOnHoverToMathJax(id, func);
  }
}
