// Data Management Helpers
// version 1.0.0 Build: 1
// © Databind, 2021
// https://github.com/databind10
//
// Released under GNU GENERAL PUBLIC LICENSE
// =====================================================================================================================

/**
 * Checks if the URI is encoded
 * @param {text} str   String
 */
function checkEncodeURI(str) {
    return /\%/i.test(str)
}

/**
 * Loop through an object and remove empty or null key/value pairs
 * @param {object} obj      Array or JSON object
 */
function clean(obj) {
    if (!isEmpty(obj)) {
        for (var o = 0; o < obj.length; o++) {
            var propNames = Object.getOwnPropertyNames(obj[o]);
            for (var i = 0; i < propNames.length; i++) {
                var propName = propNames[i];
                if (isEmpty(obj[o][propName])) {
                    delete obj[o][propName];
                }
            }
        }
    }
    return obj
}

/**
 * Clears the cache item with the id provided, then refreshes the page if required
 * @param {text} id         Id of the cache item to clear
 * @param {bool} reload     If true, the page will refresh
 */
function clearCache(id, reload) {
    localStorage.removeItem(id);
    //todo: add an async refresh
    if (reload)
        location.reload();
    return false;
}

/**
 * Return true or false if the first date is greater or less than the second date
 * @param {text} date1       First date
 * @param {text} date2       Second date
 * @param {text} datesOnly   Only compare the date and not the time
 * @param {text} dateFormat  Pass in a date format. The default is 'YYYY MM DD'
 */
function compareDates(date1, date2, datesOnly, dateFormat) {
    if (!isEmpty(date1) && !isEmpty(date2)) {
        var first = new Date(date1);
        var second = new Date(date2);
        if (datesOnly) {
            var format = (!isEmpty(dateFormat)) ? dateFormat : 'YYYY MM DD';
            first = new moment(first).format(format);
            second = new moment(second).format(format);
            first = new Date(first);
            second = new Date(second);
            console.log(first);
            console.log(second);
        }
        return first < second;
    }
}

/**
 * Converts CSV to an array
 * @param {text} strData        Data to convert
 * @param {text} strDelimiter   Deleimeter to separate on
 */
function csvToArray(strData, strDelimiter) {
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");

    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp((
        // Delimiters.
        "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

        // Quoted fields.
        "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

        // Standard fields.
        "([^\"\\" + strDelimiter + "\\r\\n]*))"
    ),
        "gi"
    );

    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;

    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec(strData)) {
        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[1];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (strMatchedDelimiter.length && strMatchedDelimiter !== strDelimiter) {
            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push([]);
        }
        var strMatchedValue;

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[2]) {
            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[2].replace(new RegExp("\"\"", "g"), "\"");
        }
        else {
            // We found a non-quoted value.
            strMatchedValue = arrMatches[3];
        }

        // Now that we have our value string, let's add
        // it to the data array.
        arrData[arrData.length - 1].push(strMatchedValue);
    }

    // Return the parsed data
    return (arrData);
}

/**
 * Converts a number to a percentage
 * @param {number} num              Number to be divided
 * @param {number} tot              Number to divide by
 * @param {number} decimalPlaces    Number of decimal places to format to
 */
function convertToPercentage(num, tot, decimalPlaces) {
    var result = 0;
    var dp = (!isEmpty(decimalPlaces)) ? decimalPlaces : 0;
    if (num > 0 && tot > 0) {
        result = ((num / tot) * 100).toFixed(dp);
    }
    return parseInt(result);
}

/**
 * Copy the text, code, JSON, etc to the clipboard
 * @param {text} data
 * @param {text} name       Name of the data you are copying for the display message
 * @param {bool} close      Close the window after copying
*/
function copyDataToClipboard(data, name, close) {
    if (!isEmpty(data)) {
        name = !isEmpty(name) ? name : 'Data';
        const el = document.createElement('textarea');
        el.value = data;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);

        notify({
            type: 'success',
            message: `${name} successfully copied to your clipboard. This window will self-destruct in 2 seconds...`,
            theme: 'light',
            icon: '<i class="fa fa-file-code-o fa-2x"></i>',
            delay: 2000,
            autoHide: true
        });
        if (parseBool(close)) {
            setTimeout(() => {
                parent.closeModal();
            }, 2000);
        }
    }
}

/**
 * Returns a DIV with the provided content
 * @param {text} html    HTML to place in a DIV
 */
function decodeHtml(html) {
    return $('<div>').html(html).text();
}

/**
 * Delete a cookie by name
 * @param {text} name        Cookie Name
 */
function deleteCookie(name) {
    setCookie(name, '', null, null, null, 1);
}

/**
 * Extract Numbers from an array and sort
 * @param {object} array       Array
 * @param {text} fieldName     Field name within the array to find numbers and sort
 */
function extractNumbersAndSortArray(array, fieldName) {
    var sorted = array;
    if (!isEmpty(array)) {
        sorted = array.sort(function (a, b) {
            var one = a[fieldName].replace(/\D/g, '');
            if (isEmpty(one)) one = 0;
            var two = b[fieldName].replace(/\D/g, '');
            if (isEmpty(two)) two = 0;
            return parseInt(one) - parseInt(two);
        });
    }
    return sorted;
}

/**
 * Searches a collection for an object with the specified property
 * @param {objects} collection  Collection of to search
 * @param {text}    property    Property name to search on
 * @param {text}    searchFor   Value of property to search for
 */
function findInCollection(collection, property, searchFor) {
    var result = null;
    for (var i = 0; i < collection.length; i++) {
        if (collection[i][property] == searchFor) {
            result = collection[i];
            break;
        }
    }
    return result;
}

/**
 * Searches a subcollection from the collection passed in for an object with the specified property
 * @param {objects} collection      Collection of to search
 * @param {text}    subcollection   Name of subcollection to check
 * @param {text}    property        Property name to search on
 * @param {text}    searchFor       Value of property to search for
 */
function findInSubCollection(collection, subcollection, property, searchFor) {
    var result = null;

    for (var i = 0; i < collection.length; i++) {
        var proj = findInCollection(collection[i][subcollection], property, searchFor)
        if (proj != null) {
            result = collection[i];
            break;
        }
    }
    return result;
}

/**
 * Get a cookie by name
 * @param {text} name        Cookie Name
 */
function getCookie(name) {
    var cname = name + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(cname) == 0) {
            return c.substring(cname.length, c.length);
        }
    }
    return "";
}

/**
 * Gets data from a JSON object
 * @param {object} obj      The object containing the data
 * @param {text} key        The key of the data to select
 * @param {text} orderBy    The key of the data to order by
 */
function getDataFromJSON(obj, key, orderBy) {
    var data = [];
    if (!isEmpty(obj) && !isEmpty(key)) {
        //Sort
        if (!isEmpty(orderBy)) obj = _.sortBy(obj, (o) => { return o[orderBy] });

        //Add unique keys
        for (i in obj) data.push(obj[i][key]);
    }
    return data;
}

/**
 * Create a new array by grouping data in the whitelist and keys to find the average of each key after grouping
 * @param {array} data              Data array
 * @param {text} lookupColumn       Column to filter based on the whitelist
 * @param {text} columnsToAverage   Column to average
 * @param {int} divideBy            Divide the final average to shorten the number
 * @param {int} decimalPlaces       Decimal places for average
 */
function getGroupedData(data, lookupColumn, columnsToAverage, divideBy, decimalPlaces) {
    decimalPlaces = (!isEmpty(decimalPlaces)) ? decimalPlaces : 0;
    divideBy = (!isEmpty(divideBy)) ? divideBy : 1;
    // Calculate the sums and group data (while tracking count)
    const reduced = data.reduce(function (m, d) {
        if (!m[d[lookupColumn]]) {
            m[d[lookupColumn]] = {
                ...d,
                count: 1
            };
            return m;
        }
        columnsToAverage.forEach(function (key) {
            m[d[lookupColumn]][key] = parseFloat(m[d[lookupColumn]][key]) + parseFloat(d[key]);
        });
        m[d[lookupColumn]].count += 1;
        return m;
    }, {});

    // Create new array from grouped data and compute the average
    return Object.keys(reduced).map(function (k) {
        const item = reduced[k];
        const itemAverage = columnsToAverage.reduce(function (m, key) {
            m[key] = (item[key] / divideBy / item.count).toFixed(decimalPlaces);
            return m;
        }, {})
        return {
            ...item, // Preserve any non white-listed keys
            ...itemAverage // Add computed averege for whitelisted keys
        }
    })
}

/**
 * Gets keys from an object
 * @param {bool} valid     Is the data validated
 * @param {object} data    The data to get the keys from
 */
function getJSONKeys(valid, data) {
    var keys = '';
    if (data != undefined && data != '') {
        try {
            //data is a string
            var json = (data != '') ? JSON.parse(data) : '';
        }
        catch (e) {
            //data is a JObject
            var json = (data != '') ? JSON.parse(JSON.stringify(data)) : '';
        }
        try {
            if (valid && json != '') {
                if (json.length > 0) {
                    //Remove line breaks and spaces
                    var jsonNoSpaces = data.replace(/(\r\n|\n|\r)/gm, '').replace(/\s/g, '');

                    if (jsonNoSpaces.startsWith('[{')) {
                        //JToken: [ { "key": "2018", "value": "1" }, { "key": "2019", "value": "2" } ]
                        //Note: some data may be inconsistent and miss keys
                        var jsonKeys = [];
                        for (var i = 0; i < json.length; i++) {
                            Object.keys(json[i]).forEach(function (key) {
                                //keys += `"${key}",`;
                                jsonKeys.push(key);
                            });
                        }
                        //Filter down to unique keys
                        var filteredKeys = new Set(jsonKeys);   
                        //keys = [...filteredKeys].join(',');
                        filteredKeys.forEach(function (key) {
                            keys += `"${key}",`;
                        });
                    }
                    else if (jsonNoSpaces.startsWith('[[') && json[0].length > 1) {
                        //JArray: [ [ 1, 2, 3 ], [ 4, 5, 6 ] ]
                        var parsedJSON = json[0][0];
                        Object.keys(parsedJSON).forEach(function (key) {
                            keys += `"${key}",`;
                        });
                    }
                    else {
                        //JArray: [ 1, 2, 3 ]
                        var parsedJSON = JSON.parse(data);
                        for (var i = 0; i < parsedJSON.length; i++)
                            keys += `"${parsedJSON[i]}",`;
                    }
                    keys = keys.slice(0, -1);
                }
                else {
                    //JObject: { "key": "2018", "value": "1" }
                    Object.keys(json).forEach(function (key) {
                        keys += `"${key}",`;
                    });
                    keys = keys.slice(0, -1);
                }
            }
        }
        catch (e) {
            //Do Nothing
        }
    }
    return keys;
}

/**
 * Returns a value from localStorage
 * @param {text} key    Key of the localStorage item to retrieve
 */
function getLocalStorage(key) {
    if (key != '') {
        return localStorage[key];
    }
}

/**
 * Parses the querystring from a URL
 * @param {text} url    URL to parse
 */
function getUrlQuerystring(url) {
    var qs = '';
    if (!isEmpty(url)) {
        url = decodeURI(url);
        var hashes = url.split("?")[1];
        if (!isEmpty(hashes)) {
            var hash = hashes.split('&');
            var l = hash.length;

            for (var i = 0; i < l; i++) {
                if (!isEmpty(hash[i])) qs += `${!isEmpty(qs) ? '&' : ''}${hash[i]}`;
            }
        }
    }
    return qs;
}

/**
 * Returns key/value pairs from the querystring
 * @param {text} url    URL to parse
 */
function getUrlVars(url) {
    var vars = {};
    if (!isEmpty(url)) {
        url = decodeURI(url);
        var hashes = url.split("?")[1];
        if (!isEmpty(hashes)) {
            var hash = hashes.split('&');
            var l = hash.length;

            for (var i = 0; i < l; i++) {
                params = hash[i].split("=");
                vars[params[0]] = params[1];
            }
        }
    }
    return vars;
}

/**
 * Returns a decoded url
 * @param {text} input    URL
 */
function htmlDecode(input) {
    if (!isEmpty(input)) {
        var e = document.createElement('textarea');
        e.innerHTML = decodeURI(input);
        return e.childNodes.length === 0 ? '' : e.childNodes[0].nodeValue;
    }
}

/**
 * Determines if an object's value is empty
 * @param {object} data     Object to check if Empty
 */
function isEmpty(data) {
    var empty = false;
    if (data === null || data == null ||
        data === undefined || data == undefined ||
        data.toString() == '' ||
        typeof data === 'undefined') {
        empty = true;
    }
    else if (data.length === 0 ||
        data.toString() == '[]' || data === [] ||
        data.toString() == '{}' || data === {}) {
        empty = true;
    }
    return empty;
}

/**
 * Checks if a string is in JSON format
 * @param {text} str    string to sheck for JSON content
 */
function isJsonString(str) {
    try {
        if (typeof str === 'object') str = JSON.stringify(str);
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

/**
 * Add 0 records if the required field is missing
 * This is so the bar charts show the correct data. (All data is shifted to the left if not)
 * @param {array} data              Data array
 * @param {text} keyToCheck         Column key to check for missing fields
 * @param {array} requiredFields    Required fields needed in the data array
 * @param {array} fieldsToCopy      Fields to copy from the original data array
 */
function normalizeData(data, keyToCheck, requiredFields, fieldsToCopy) {
    var dataKeys = Object.keys(data[0]);
    var result = [];
    requiredFields.forEach(field => {
        const item = data.find(item => item[keyToCheck] === field);
        if (item)
            result.push(item);
        else {
            //add empty record
            var newData = {};
            dataKeys.forEach(key => {
                if (key === keyToCheck)
                    newData[keyToCheck] = field;
                else if (fieldsToCopy.indexOf(key) > -1)
                    newData[key] = data[0][key];
                else {
                    //figure out the type of data in order to add te correct default
                    if (typeof parseInt(data[0][key]) === 'number')
                        newData[key] = 0;
                    else if (typeof parseBool(data[0][key]) === 'boolean')
                        newData[key] = false;
                    else
                        newData[key] = '';
                }
            });
            result.push(newData);
        }
    });
    return result;
}

/**
 * Converts a string to a bool
 * @param {text} string     String to parse
 */
function parseBool(string) {
    var result = false;
    try {
        if (!isEmpty(string) && (string == true || string.toString().toLowerCase() == 'true' || string == 1 || string == '1' || string.toString().toLowerCase() == 'yes')) {
            result = true;
        }
    }
    catch (e) {
        //do nothing
    }
    return result;
}

/**
 * TODO: parse bools and ints
 * Parse QueryString using String Splitting
 * @param {text} queryString    Querystring in string form
 */
function parseQS(queryString) {
    var dictionary = {};

    // remove the '?' from the beginning of the
    // if it exists
    if (queryString.indexOf('?') === 0) {
        queryString = queryString.substr(1);
    }

    //html decode
    queryString = decodeURI(queryString);

    // Step 1: separate out each key/value pair
    var parts = queryString.split('&');

    for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        // Step 2: Split Key/Value pair
        var keyValuePair = p.split('=');

        // Step 3: Add Key/Value pair to Dictionary object
        var key = keyValuePair[0];
        var value = keyValuePair[1];

        // decode URI encoded string
        value = decodeURIComponent(value);
        value = value.replace(/\+/g, ' ');

        dictionary[key] = value;
    }

    // Step 4: Return Dictionary Object
    return dictionary;
}

/**
 * Build a querystring based on a JSON object
 * @param {object} obj   Object to build the querystring from
 */
function queryBuilder(obj) {
    var query = '';
    if (!isEmpty(obj)) {
        Object.keys(obj).forEach(function (key) {
            // Encode so modals don't break
            var value = (checkEncodeURI(obj[key])) ? obj[key] : encodeURI(obj[key]);
            query += `${key}=${value}&`;
        });
    }
    // Trim the trailing &
    query = query.substring(0, query.length - 1);
    return query;
}

/**
 * Loads a JSON file
 * @param {text} file           Url of the JSON file
 * @param {callback} callback   Callback function to execute once the JSON file is retrieved
 */
function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState == 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}

/**
 * Find and replace data in a string
 * @param {text} str        string to find and replace
 * @param {text} find       character to look for
 * @param {text} replace    character as the replacement
 */
function replace(str, find, replace) {
    if (find != "") {
        str = str.toString();
        var aStr = str.split(find);
        for (var i = 0; i < aStr.length; i++) {
            if (i > 0) {
                str = str + replace + aStr[i];
            } else {
                str = aStr[i];
            }
        }
    }
    return str;
}

/**
 * Set a cookie by name
 * @param {text} name        Cookie Name
 * @param {text} value       Cookie Value
 * @param {int} days        Cookie Days for expiration
 */
function setCookie(name, value, days) {
    days = (!isEmpty(days)) ? days : 1;
    var d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
}

/**
 * Sets the value of an input if currently empty
 * @param {text} curVal     Current value of the input
 * @param {text} newVal     Value to return if current value is empty
 */
function setValueIfEmpty(curVal, newVal) {
    var val = '';
    if (isEmpty(curVal)) {
        val = newVal;
    }
    return val;
}

/**
 * Disable Chrome auto-complete
 * @param {text} selector     component selector
*/
function stopAutoFill(selector) {
    $(`${selector} input`).attr('autocomplete', 'one-time-code');
}

/**
 * Trim characters from both the start and and of a string
 * @param {text} string         
 * @param {text} charToRemove
 */
function trimChar(string, charToRemove) {
    if (!isEmpty(string)) {
        while (string.charAt(0) == charToRemove) {
            string = string.substring(1);
        }
        while (string.charAt(string.length - 1) == charToRemove) {
            string = string.substring(0, string.length - 1);
        }
    }
    return string;
}

/**
 * Removes leading and ending double quotes
 * @param {text} str    Value to remove quotes fromo
 */
function trimQuotes(str) {
    return (str != undefined && str != '') ? str.replace(/(^")|("$)/g, '') : '';
}

/**
 * Trim spaces from value
 * @param {text} value    The value to trim spaces from
 */
function trimValue(value) {
    var result = '';
    if (value != null && value != undefined && value != NaN) {
        result = value.toString().trim();
    }
    return result;
}