/**
 * Update a color's opacity and return RGBA
 * @param {object} color      Color in hex
 * @param {float} opacity   Transparency from 0.0 (transparent) to 1.0 (opaque)
 */
function adjustHexOpacity(color, opacity) {
    if (typeof color === "string") {
        var newColor = parseColor(color);
        const r = newColor[0];
        const g = newColor[1];
        const b = newColor[2];
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    else {
        var result = [];
        $.each(color, function (ea_index) {
            var newColor = parseColor(color[ea_index]);
            const r = newColor[0];
            const g = newColor[1];
            const b = newColor[2];
            result.push(`rgba(${r}, ${g}, ${b}, ${opacity})`);
        });
        return result;
    }
}

// Color Helpers
// version 1.0.0 Build: 1
// © Databind, 2021
// https://github.com/databind10
//
// Released under GNU GENERAL PUBLIC LICENSE
// =====================================================================================================================

/**
 * Convert a hex code into RGB so you can add opactity
 * @param {text} hex        #555555
 * @param {number} opacity  0.0 to .5 to 1.0
 */
function convertHex(hex, opacity) {
    hex = hex.replace('#', '');
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
    o = parseInt(opacity);

    result = 'rgba(' + r + ',' + g + ',' + b + ',' + o + ')';
    return result;
}

/**
 * Adds custom colors to a chart
 * @param {array} dataArray     Array of colors
 * @param {number} alpha        Opacity level for the colors
 */
function customColors(dataArray, alpha) {
    var chartColors = [];
    /*eslint-disable */
    if (dataArray != null) {
        for (var i in dataArray) {
            chartColors.push(hexToRgbA(dataArray[i].Hex, alpha));
        }
    }
    /*eslint-enable */
    return chartColors;
}

/**
 * Generates dynamic colors for a chart
 * @param {array} dataArray     Array of colors
 * @param {int} opacity         Transparency from 0.0 (transparent) to 1.0 (opaque)
 */
function dynamicColors(dataArray, opacity) {
    var chartColors = [];
    /*eslint-disable */
    if (dataArray != null) {
        $.each(dataArray, function (ea_index) {
            var color = rainbow(dataArray.length, ea_index, opacity, false);
            chartColors.push(color);
        });
    }
    /*eslint-enable */
    return chartColors;
}

/**
 * Converts a hex value for a color to a RBG value with an opacity
 * @param {text} hex        Hex value to convert
 * @param {number} alpha    Opacity level for the color
 */
function hexToRgbA(hex, alpha) {
    var color;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        color = hex.substring(1).split('');
        if (color.length == 3) {
            color = [color[0], color[0], color[1], color[1], color[2], color[2]];
        }
        color = `0x${color.join('')}`;
        return `rgba(${[(color >> 16) & 255, (color >> 8) & 255, color & 255].join(',')},${alpha})`;
    }
    //Default to gray if there is an error
    return `rgba(224, 224, 224, ${alpha})`;
}

/**
 * Lightens or darkens a color
 * @param {text} color  The color - non RGB
 * @param {int} amount  Positive to lighted, negative to darken
 */
function lightenOrDarkenColor(color, amount) {
    //if the color is RGB, convert to HEX
    if (color.toString().indexOf('rgb') > -1) color = rgbToHex(color);

    var result = '#' + color.replace(/^#/, '')
        .replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount))
            .toString(16))
            .substr(-2));
    return result;
}

/**
 * Parse a color:  rgb(r,g,b), rgba(r,g,b,a), #RGB, #RRGGBB and #RRRGGGBBB:
 * Returns RGB
 * @param {text} input      The color in any format
 */
function parseColor(input) {
    if (!isEmpty(input) && typeof input !== "object") {
        if (input.substr(0, 1) == "#") {
            var collen = (input.length - 1) / 3;
            var fact = [17, 1, 0.062272][collen - 1];
            return [
                Math.round(parseInt(input.substr(1, collen), 16) * fact),
                Math.round(parseInt(input.substr(1 + collen, collen), 16) * fact),
                Math.round(parseInt(input.substr(1 + 2 * collen, collen), 16) * fact)
            ];
        }
        else return input.split("(")[1].split(")")[0].split(",").map(x => +x);
    }
    return '';
}

/**
 * Generates vibrant, "evenly spaced" colours (i.e. no clustering). 
 * @param {int} numOfSteps      Length of array
 * @param {int} step            Current index of array
 * @param {float} opacity       Transparency from 0.0 (transparent) to 1.0 (opaque)
 * @param {bool} returnHex      Return the color in hex instead of RGB
 */
function rainbow(numOfSteps, step, opacity, returnHex) {
    var r, g, b;
    var h = step / numOfSteps;
    var i = ~~(h * 6);
    var f = h * 6 - i;
    var q = 1 - f;
    opacity = (isEmpty(opacity)) ? 0.4 : opacity;
    switch (i % 6) {
        //starts off with blue
        case 0: r = 0; g = q; b = 1; break;
        case 1: r = f; g = 0; b = 1; break;
        //red
        case 2: r = 1; g = 0; b = q; break;
        case 3: r = 1; g = f; b = 0; break;
        //green
        case 4: r = q; g = 1; b = 0; break;
        case 5: r = 0; g = 1; b = f; break;
    }
    var c = (returnHex) ?
        `#${("00" + (~ ~(r * 255)).toString(16)).slice(-2)}${("00" + (~ ~(g * 255)).toString(16)).slice(-2)}${("00" + (~ ~(b * 255)).toString(16)).slice(-2)}`
        : `rgba(${r * 255},${g * 255},${b * 255}, ${opacity})`;
    return (c);
}

/**
 * Coverts an RGB color to HEX
 * @param {text} color  The RGB color
 */
function rgbToHex(color) {
    if (color.toString().indexOf('rgb') > -1) {
        try {
            var r = color[0];
            var g = color[1];
            var b = color[2];
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }
        catch {
            return color;
        }
    }
    else
        return color;
}

/**
 * Compares the background color with the text color and changes the color to make the label readable
 * @param {text} backgroundColor   
 * @param {text} textColor         
 */
function setContrast(backgroundColor, textColor) {
    //convert background color into RGB
    var bg = parseColor(backgroundColor);

    const backgroundColorBrightness = Math.round(((parseInt(bg[0]) * 299) +
        (parseInt(bg[1]) * 587) +
        (parseInt(bg[2]) * 114)) / 1000);

    return (backgroundColorBrightness > 150) ? lightenOrDarkenColor(textColor, -75) : textColor;
}

/**
 * Show the color picker. Allows you to select a HEX color
 * Requires colpick > https://github.com/mrgrain/colpick
 * @param {text} element     HTML component Id
 */
function showColorPicker(element) {
    if (!isEmpty(element)) {
        $('#' + element).colpick({
            flat: true,
            layout: 'hex',
            submit: 0
        });
    }
}

/**
 * Updates the background color of a DOM objectReturn the selected number by index [ 2, 1 ]
 * @param {text} id     ID of the DOM object to update
 * @param {text} color  Color to set the background to
 */
function updateComponentBackgroundColor(id, color) {
    $(id).css('background-color', '');
    if (!isEmpty(id) && !isEmpty(color)) {
        $(id).css('background-color', color);
    }
}