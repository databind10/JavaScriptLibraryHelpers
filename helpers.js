// General Helpers
// version 1.0.0 Build: 1
// © Databind, 2021
// https://github.com/databind10
//
// Released under GNU GENERAL PUBLIC LICENSE
// =====================================================================================================================

/**
 * Create an array of all checkboxes that are checked
 * @param {text} compId     Id of the HTML component
*/
function addAllCheckedToArray(compId) {
    var allSelected = [];
    if (!isEmpty(compId)) {
        $(`#${compId} input:checked`).each(function () {
            var id = $(this).attr('id');
            allSelected.push(id);
        });
    }
    return allSelected;
}

/**
 * Build checkboxes and attach to an HTML component
 * @param {object} array        Array of items to create checkboxes
 * @param {object} filterArray  Array of items to compare if they are checked
 * @param {text} containerId    Id of the HTML component that will contain checkboxes
*/
function buildCheckboxes(array, filterArray, containerId) {
    $.each(array, function (index, value) {
        var label = value.value;
        var checked = (filterArray.includes(label)) ? 'checked' : '';
        $(`#${containerId}`).append(`<label><input type="checkbox" id="${label}" ${checked}> ${label}</label><br/>`);
    });
}

/**
 * Instructions for re-enabling browser location services
 * @param {string} id  (html component class or id)
 */
function enableGeolocationInstructions(id) {
    var html = [];
    html.push('You have added this site to a blacklist for denying location permissions.<br/>',
        'In order to <b>reenable location permissions for this site</b>, you must manage your browser settings manually.<br/><br/><ul>',
        '<li><b>Chrome</b> : (<a href="chrome://settings/content/location">chrome://settings/content/location</a>)</li>',
        '<li><b>Opera</b> : (<a href="opera://settings/content/location">opera://settings/content/location</a>)</li>',
        '<li><b>Firefox</b> : (<a href="about:config">about:config</a> > type "geo.enabled")</li>',
        '<li><b>Safari</b> : (Settings for This Website. A pop-over should appear, with a Location setting at the bottom)</li>',
        '<li><b>Edge</b> : (Windows 10 > Start Menu > Settings > Privacy > Location)</li></ul>');
    $(`#${id}`).html(html.join(''));
    $(`#${id}`).removeClass('hidden');
}

/**
 * Generates a random GUID
 */
function generateGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Gets coordinates in a latitide and longitude component on a form
 * Only in HTTP > [Violation] Only request geolocation information in response to a user gesture.
 * @param {function} callback     Function to call
 */
function getGeoLocationCoords(callback) {
    var json = {};
    var enteredFunction = false;
    if (navigator.geolocation) {
        enteredFunction = true;
        navigator.geolocation.getCurrentPosition(function (position) {
            json['latitude'] = position.coords.latitude;
            json['longitude'] = position.coords.longitude;
            if (!isEmpty(callback))
                return callback(json);
        }, function (error) {
            return callback(showError(error));
        }, { maximumAge: 600000, timeout: 10000 });
    }
    else if (typeof (google) !== 'undefined' && google.gears) {
        //Try Google Gears Geolocation
        var geo = google.gears.factory.create('beta.geolocation');
        enteredFunction = true;
        geo.getCurrentPosition(function (position) {
            json['latitude'] = position.coords.latitude;
            json['longitude'] = position.coords.longitude;
            if (!isEmpty(callback))
                return callback(json);
        }, function (error) {
            return callback(showError(error));
        });
    }
    if ($.isEmptyObject(json) && !enteredFunction) {
        return callback({
            'latitude': 0,
            'longiture': 0,
            'error': 'Location services are turned off for this browser'
        });
    }
}

/**
 * Checks of the browser is a mobile borwser
 */
function isMobile() {
    var mobile = false;
    // device detection
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od|ad)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(navigator.userAgent)
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) {
        mobile = true;
    }
    if (mobile) {
        try {
            document.createEvent("TouchEvent");
        }
        catch (e) {
            //do nothing
        }
    }
    var cssMediaDetected = window.matchMedia("(max-width: 767px)");

    return (mobile || cssMediaDetected.matches);
}

/**
 * Toggle all checkboxes
 * @param {text} triggerId   Id of the HTML component that triggers the toggle
 * @param {text} compId      Id of the HTML component
*/
function toggleAllCheckboxes(triggerId, compId) {
    $(() => {
        if (!isEmpty(triggerId) && !isEmpty(compId)) {
            document.getElementById(triggerId).addEventListener('click', function (e) {
                $(`#${compId} input[type=checkbox]`).each(function () {
                    this.checked = e.currentTarget.checked;
                });
            }, false);
        }
    });
}

/**
 * Trim characters from the beginning or end of a string
 * @param {text} string   
 * @param {text} character 
*/
function trimByChar(string, character) {
    const first = [...string].findIndex(char => char !== character);
    const last = [...string].reverse().findIndex(char => char !== character);
    return string.substring(first, string.length - last);
}