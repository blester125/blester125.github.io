const monthNames = [
    null,
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
]

/**
 * Convert the date as ints into a string
 * Note:
 *   This does no validation that the day is valid in the month
 * @param {int} month - The integer version of the month starting at 1
 * @param {int} day - The integer version of the day starting at 1
 * @param {int} year - The integer version of the year
 * @returns {str} - The date as a string with the month replaced by the name
 */
function dateString(month, day, year) {
    if (day != null) {
        return monthNames[month] + " " + day + ", " + year;
    }
    return monthNames[month] + ", " + year;
}

/**
 * Compare the dates on two blog posts
 * Note:
 *   Sorts so that the more recent thing return 1
 * @param {*} a - The blog object
 * @param {*} b - The second blog object
 * @returns {int} - 1 if the first blog was more recent, -1 if the second
 */
function compare_blogs(a, b) {
    if (a.year == b.year) {
        if (a.month == b.month) {
            return a.day > b.day ? 1 : -1;
        }
        return a.month > b.month ? 1 : -1;
    }
    return a.year > b.year ? 1 : -1
}

/**
 * Populate target with the blog data
 * @param {str} target - The id of the vue blog template
 * @param {List[*]} blogs - A list of objects representing the blogs
 */
function generate_blog(target, blogs) {
    var target = document.getElementById(target);
    blogs.sort((a, b) => -compare_blogs(a, b));
    for (var i = 0; i < blogs.length; i++) {
        blogs[i].date = dateString(blogs[i].month, blogs[i].day, blogs[i].year);
    }
    var app = new Vue({
        el: target,
        data: {
            blogs: blogs
        }
    })
}
