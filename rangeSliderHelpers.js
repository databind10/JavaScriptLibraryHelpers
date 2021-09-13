// ion.RangeSlider v2.3.1 Helpers
// version 1.0.0 Build: 1
// © Databind, 2021
// https://github.com/databind10
//
// Released under GNU GENERAL PUBLIC LICENSE
// =====================================================================================================================

/**
 * Globals
 */
//Used for moving sliders to a different location
var global_sliderContainers = [];
//Store sliders to use the options and configuration when updating
var global_sliders = [];

/**
 * Build the DC ion range slider
 * A minimum height of 500px is required to re-animate the chart on a re-load (gui visualization)
 * @param {text} formIdNoSymbols    DC Id (guid) without dashes
 */
function buildRangeSlider(formIdNoSymbols) {
    var ionSlider = $(`#slider_${formIdNoSymbols}`).ionRangeSlider({
        skin: 'big',
        grid: true,
        force_edges: true,
        hide_min_max: true,
        hide_from_to: true,
        from_fixed: true,
        to_fixed: true
    });
    var slider = ionSlider.data("ionRangeSlider");
    global_sliders[formIdNoSymbols] = slider;

    var sliderContainer = $(`#sliderContainer_${formIdNoSymbols}`);
    sliderContainer.on('mouseover', function () {
        if (slider.options.hide_min_max == true) slider.update({ hide_min_max: false });
        if (slider.options.hide_min_max == true) slider.update({ hide_from_to: false });
        global_sliders[formIdNoSymbols] = slider;
    }).on('mouseleave', function () {
        if (slider.options.hide_min_max == false) slider.update({ hide_min_max: true });
        if (slider.options.hide_min_max == false) slider.update({ hide_from_to: true });
        global_sliders[formIdNoSymbols] = slider;
    });
    global_sliderContainers[formIdNoSymbols] = sliderContainer;
}

/**
 * Range Slider - Get date
 * @param {date} date   The value to get the date from
 */
function dateToTS(date) {
    return date.valueOf();
}

/**
 * Move the slider to another element on the page
 * Pass in the element or just the id
 * @param {text} qsParams   Querystring parameters
 * @param {text} moveToId   HTML element ID to move the range slider to.
 */
function moveRangeSlider(qsParams, moveToId) {
    var sliderContainer = global_sliderContainers[qsParams['dcid']];
    if (!isEmpty(sliderContainer)) {
        return moveTo(sliderContainer, moveToId);
    }
}

/**
 * Populate a range slider in a DC
 * Make sure to include startDate and endDate in the qsParams
 * Will override preset date ranges by setting qsPrams['dateRange'] = 'Custom'
 * http://ionden.com/a/plugins/ion.rangeSlider/
 * @param {text} qsParams       Querystring parameters
 * @param {text} dataMinMax     Data object holding the min/max date values
 * @param {text} dataStartEnd   Data object holding the start/end date values
 * @param {text} slider         HTML object of the slider
 * @param {text} skin           Visual look of the slider: flat, big, modern, sharp, round, square
 * @param {object} options      Visual look of the slider: flat, big, modern, sharp, round, square
     * field          When a range has been selected, set the value to this field in qsParams
     * dataType       Type of slider: single, double, date
     * step           Increments for the slider
     * prefix         Prepend text to the beginning of the sliders
     * postfix        Append text to the beginning of the sliders
 */
function setRangeSliderSettings(qsParams, dataMinMax, dataStartEnd, skin, options) {
    var dataType = 'date';
    var qsParamsKey = 'dcid';
    var field = 'Date';
    var step = '';
    var prefix = '';
    var postfix = '';
    if (!isEmpty(options)) {
        if (typeof options.dataType !== 'undefined') dataType = options.dataType.toLowerCase();
        if (typeof options.field !== 'undefined') qsParamsKey = `${qsParams.dcid}${options.field}`;
        if (typeof options.field !== 'undefined') field = options.field;
        if (typeof options.step !== 'undefined') step = options.step;
        if (typeof options.prefix !== 'undefined') prefix = options.prefix;
        if (typeof options.postfix !== 'undefined') postfix = options.postfix;
    }

    var sliderObj = global_sliders[qsParamsKey];
    if (!isEmpty(qsParams) && !isEmpty(sliderObj)) {
        //default settings for the date formatters: dateToTS, tsToDate, tsToDateFormat
        var year = new Date().getFullYear();

        //min max range
        var minAvailable = false;
        var maxAvailable = false;
        if (!isEmpty(dataMinMax)) {
            if (!isEmpty(dataMinMax[0])) {
                minAvailable = (!isEmpty(dataMinMax[0].Start));
                maxAvailable = (!isEmpty(dataMinMax[0].End));
            }
        }
        switch (dataType) {
            case 'single':
            case 'double':
                var min = (!minAvailable) ? 0 : dataMinMax[0].Start;
                var max = (!maxAvailable) ? 0 : dataMinMax[0].End;
                break;
            default:
                var min = (!minAvailable) ? new Date(year, 0, 1) : moment(dataMinMax[0].Start)._d;
                var max = (!maxAvailable) ? new Date() : moment(dataMinMax[0].End)._d;
                break;
        }

        //current date range
        var startAvailable = false;
        var endAvailable = false;
        if (!isEmpty(dataStartEnd)) {
            if (!isEmpty(dataStartEnd[0])) {
                startAvailable = (!isEmpty(dataStartEnd[0].Start));
                endAvailable = (!isEmpty(dataStartEnd[0].End));
            }
        }
        switch (dataType) {
            case 'single':
            case 'double':
                var start = (!startAvailable) ? 0 : parseFloat(dataStartEnd[0].Start);
                var end = (!endAvailable) ? 0 : parseFloat(dataStartEnd[0].End);
                break;
            default:
                var start = (!startAvailable) ? new Date(year, 0, 1) : moment(dataStartEnd[0].Start)._d;
                var end = (!endAvailable) ? new Date() : moment(dataStartEnd[0].End)._d;
                break;
        }

        //Common defaults
        sliderObj.update({
            type: dataType,
            skin: (isEmpty(skin)) ? 'modern' : skin,
            from_fixed: false,
            to_fixed: false,
            step: step,
            prefix: prefix,
            postfix: postfix,
            onFinish: function (data) {
                refresh();
            }
        });

        //set options based on dataType
        start = (start < min) ? min : start;
        end = (end > max) ? max : end;
        switch (dataType) {
            case 'single':
            case 'double':
                sliderObj.update({
                    min: min,
                    max: max,
                    from: start.toFixed(16),
                    to: end.toFixed(16),
                    prettify_enabled: false
                });
                break;
            default:
                sliderObj.update({
                    min: dateToTS(min),
                    max: dateToTS(max),
                    from: dateToTS(start),
                    to: dateToTS(end),
                    prettify: tsToDateFormat
                });
                break;
        }

        function refresh() {
            var startId = `start${field}`;
            var endId = `end${field}`;
            switch (dataType) {
                case 'single':
                case 'double':
                    if (qsParams[startId] == sliderObj.result.from && qsParams[endId] == sliderObj.result.to) {
                        //Do Nothing
                    }
                    else {
                        qsParams[startId] = sliderObj.result.from;
                        qsParams[endId] = sliderObj.result.to;
                    }
                    break;
                default:
                    if (qsParams[startId] == sliderObj.result.from_pretty && qsParams[endId] == sliderObj.result.to_pretty) {
                        //Do Nothing
                    }
                    else {
                        qsParams[startId] = sliderObj.result.from_pretty;
                        qsParams[endId] = sliderObj.result.to_pretty;
                        qsParams['dateRange'] = 'Custom';
                    }
                    break;
            }
            var query = queryBuilder(qsParams);
            RefreshDCAsync(qsParams['dcid'], 'true', 'false', query);
        }
    }
    return true;
}

/**
 * Range Slider - Prettify date
 * @param {timespan} ts       Timespan to format to a date format
 */
function tsToDate(ts) {
    var lang = "en-us";
    var d = new Date(ts);

    return d.toLocaleDateString(lang, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });
}

/**
 * Range Slider - Format the date
 * Set a dateFormat variable
 * @param {timespan} ts       Timespan to format to a date format
 * @param {text} dateFormat   Format of the value being returned
 */
function tsToDateFormat(ts, dateFormat) {
    var d = new Date(ts);
    var format = (!isEmpty(dateFormat)) ? dateFormat : 'MM-DD-YYYY';
    return moment(d).format(format);
}

/**
 * Update the DC ion range slider
 * @param {text} formIdNoSymbols    DC Id (guid) without dashes
 * @param {object} newOptions       JSON object of new options
 */
function updateRangeSliderOptions(formIdNoSymbols, newOptions) {
    var slider = global_sliders[formIdNoSymbols];
    if (!isEmpty(slider)) {
        var options = slider.options;
        _.merge(options, newOptions);
        slider.options = options;
        slider.update();
        global_sliders[formIdNoSymbols] = slider;
    }
}