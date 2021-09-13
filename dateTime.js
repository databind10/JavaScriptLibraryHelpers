// DateTime Helpers
// version 1.0.0 Build: 1
// © Databind, 2021
// https://github.com/databind10
//
// Released under GNU GENERAL PUBLIC LICENSE
// =====================================================================================================================

/**
 * Convert a UTC date/time into server time using the timezone offset
 * @param {text} date       UTC Date
 * @param {bool} isUTC      Is the date being passed already UTC? If not, we need to convert it
 * @param {text} offset     Offset e.g. -04:00 or -04:00:00 (default uses timezone offset in settings)
 * @param {text} format     Date Format (default uses timezone offset in settings)
 */
function convertUTCToServer(date, isUTC, offset, format) {
    var results = '';
    if (!isEmpty(date)) {
        var timezoneOffset = (!isEmpty(offset)) ? offset : global_timezoneOffset;
        var dateTimeFormat = (!isEmpty(format)) ? format : global_dateTimeFormat;
        if (!isUTC)
            date = moment(new Date(date)).utc().format(dateTimeFormat);
        var utcDate = moment(new Date(date)).format(dateTimeFormat);
        results = moment(moment(new Date(utcDate)).utcOffset(timezoneOffset)._d).format(dateTimeFormat);
    }
    return results;
}

/**
 * Returns a string formatted to contain the number of days, hours, minutes and seconds from the current datetime
 * @param {datetime} lastDate     Date to substract from the current datetime
 */
function dateAfterSubtracted(lastDate) {
    var seconds = Math.floor((new Date() - lastDate) / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);

    hours = hours - (days * 24);
    minutes = minutes - (days * 24 * 60) - (hours * 60);
    seconds = seconds - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60);

    if (days > 0)
        return days + ((days == 1) ? " day" : " days");
    else if (hours > 0)
        return hours + ((hours == 1) ? " hour" : " hours");
    else if (minutes > 0)
        return minutes + ((minutes == 1) ? " minute" : " minutes");
    else if (seconds > 0)
        return seconds + ((seconds == 1) ? " second" : " seconds");
}

/**
 * Used to sort by Date values
 * @param {date} date1   First date to compare
 * @param {date} date2   Second date to compare
 */
function dateSorter(date1, date2) {
    var d1 = new moment(new Date(date1), 'MM/DD/YYYY');
    var d2 = new moment(new Date(date2), 'MM/DD/YYYY');
    if (d1 < d2) return -1;
    if (d1 > d2) return 1;
    return 0;
}

/**
 * Used to sort by DateTime values
 * @param {datetime} date1   First datetime to compare
 * @param {datetime} date2   Second datetime to compare
 */
function dateTimeSorter(date1, date2) {
    var d1 = +moment(new Date(date1), 'MM/DD/YYYY h:mm:ss a');
    var d2 = +moment(new Date(date2), 'MM/DD/YYYY h:mm:ss a');
    if (d1 < d2) return -1;
    if (d1 > d2) return 1;
    return 0;
}

/**
 * Returns the number of minutes between two datetime values
 * @param {datetime} dt2   Date to subtract from
 * @param {datetime} dt1   Date being subtracted
 */
function diff_minutes(dt2, dt1) {
    var diff = (dt2.getTime() - dt1.getTime()) / 1000;
    diff /= 60;
    return Math.abs(Math.round(diff));
}