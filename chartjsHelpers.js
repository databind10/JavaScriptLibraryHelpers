// Chart.JS v2.9.4 Helpers
// version 1.0.0 Build: 1
// © Databind, 2021
// https://github.com/databind10
//
// Released under GNU GENERAL PUBLIC LICENSE
// =====================================================================================================================

/**
 * Globals
 */
//Stores the chart context (todo: may not need this)
var global_chartContexts = [];
//Set a chart height so the reload animation will work
var global_chartHeight = 500;
//Stores all of the charts so you can find and reference styles and options
var global_charts = [];
//Used to control multiple charts with 1 legend
var global_chartsToUpdate = [];
//Used for theme switching
var global_chartStyles = {
    textAlign: 'center',
    textBaseline: 'middle',
    font: "20px 'Helvetica'",
    fillStyle: 'gray'
};
//Used when toggling the visibility of the chart (and animating the width or height). This will maintain the size without stretching
var global_chartDimensions = [];
//Used to find options when building the DC chart
var global_dashboardConfigs = [];
//Used to store all the chart datasets so you can apply style/options based on chart type
var global_datasets = [];
//When a DC has multiple charts, set the selected chart so the chart can rebuild into the new type
var global_selectedChart = '';

/**
 * Add chart datasets
 * @param {object} dashboard        Dashboard Builder JSON
 * @param {object} datasetsJSON     Datasets in JSON
 * @param {text} type               Type of chart (e.g. bar, line, area, scatter, bubble)
 * @param {bool} isWaterfall        Waterfall is a subset of bar
 */
function addChartDatasets(dashboard, datasetsJSON, type, isWaterfall) {
    if (isEmpty(dashboard))
        return false;

    var datasets = [];

    //Trend lines are applied at the dataset level and not the default options of the chart
    var trendLineOptions = {
        trendline: {
            type: dashboard.TrendLineType,
            style: `#${dashboard.TrendLineColor}`,
            lineStyle: dashboard.TrendLineStyle,
            width: dashboard.TrendLineWidth,
            maDays: dashboard.TrendLineMADays
        }
    };

    //Scatter and Bubble point config not available in overlaying of datasets
    var scatter = {
        borderColor: 'transparent',
        //todo: figure out why hover flips between this and expression colors
        //pointHoverBackgroundColor: (!isEmpty(dashboard.PointHoverBackgroundColor)) ? dashboard.PointHoverBackgroundColor : '#FFFFFF',
        pointHoverRadius: (!isEmpty(dashboard.PointHoverRadius)) ? dashboard.PointHoverRadius : 6,
        pointRadius: (!isEmpty(dashboard.PointRadius)) ? dashboard.PointRadius : 7,
        pointStyle: (!isEmpty(dashboard.PointStyle)) ? dashboard.PointStyle : 'rectRounded'
    }

    //Set color opacity - 0.6 default
    var opacity = (dashboard.ChartColorOpacity > 0) ? dashboard.ChartColorOpacity : 0.6;

    var expressionsAvailable = getColorExpressionsFromConfig(dashboard).length;
    //Check to see if overlapping charts is enabled
    var selectedDataset = [];
    if (!isEmpty(global_selectedDataset)) {
        selectedDataset = (datasetsJSON.filter(function (d) {
            return (d.Name == global_selectedDataset) && !d.StandAlone;
        }));
    }

    var datasetArray = (!dashboard.OverlapCharts)
        ? (!isEmpty(selectedDataset))
            ? selectedDataset : datasetsJSON.slice(0, 1)
        : datasetsJSON.filter(function (d) {
            return !d.StandAlone
        });
    //added code to handles series (currently overlap charts can't exist with multi series ...but we may change that eventually)
    if (!isEmpty(dashboard.ChartSeriesAxis)) {
        datasetArray = splitAndNormalizeDataset(dashboard.ChartSeriesAxis, dashboard.ChartXAxis, dashboard.ChartYAxis, datasetArray);
    }

    for (var d = 0; d < datasetArray.length; d++) {
        var dataset = datasetArray[d];
        var showTrendLines = (dashboard.ShowTrendLines);

        //Check to see if multiple charts are selected. If so, ignore the type passed into the function
        if (!isEmpty(dashboard.Charts) && dashboard.Charts.length > 0) {
            var type = (!isEmpty(global_selectedChart)) ? global_selectedChart : (!isEmpty(dashboard.DefaultChart)) ? dashboard.DefaultChart.Value : type;
            var foundChartByDataset = dashboard.Charts.filter(function (c) {
                //Get the dataset name. Format is formid_datasetName
                var datasetName = dataset.Name.split('_')[1];
                return (c.AssociatedDataset == datasetName);
            });
            if (!isEmpty(foundChartByDataset)) {
                type = foundChartByDataset[0].ChartMode;
                showTrendLines = foundChartByDataset[0].ShowTrendLines;
            }
        }

        //Line charts need this setting within the dataset and will not work in the options
        var fill = (type !== 'line' && type !== 'scatter' && type !== 'bubble');

        //Set chart colors
        var data = (dataset.length > 0) ? dataset : dataset.Data;
        var cc;
        if (isWaterfall)
            cc = setWaterFallColors(data, dashboard.ChartYAxis); //Waterfall colors are done before the total is calculated, becarefull moving this
        else if (dashboard.RandomizeChartColors)
            cc = dynamicColors(data, opacity);
        else
            cc = customColors(dashboard.DefaultChartColors, opacity);

        var dataArray;
        if (type == 'scatter' || type == 'bubble') {
            dataArray = getXYDataFromJSON(dataset.Data, dashboard.ChartXAxis, dashboard.ChartYAxis);
        }
        else if (isWaterfall) {
            dataArray = getWaterfallDataFromJSON(dataset.Data, dashboard.ChartYAxis);
        }
        else {
            dataArray = getDataFromJSON(dataset.Data, dashboard.ChartYAxis, '');            
        }

        if (!dataset.StandAlone) {
            var singleColor = (cc.length >= d) ? cc[d] : cc[0];
            var colorArray = (cc.length > 1) ? cc : cc[0];
            //Color array is complex and there are several use-cases coded below:
            //1) Overlap and Stacked, one color per dataset
            //2) Overlap and Stacked, color expressions override the default colors
            //3) One dataset, multiple colors for each piece of data
            //4) Multiple datasets using a line chart, each line is a different color
            //5) Randomize for datasets or 1 dataset with multiple data points 
            var bgColor = (type == 'line') ? singleColor : (expressionsAvailable || !dashboard.OverlapCharts) ? colorArray : singleColor;
            var bdrColor = (!isEmpty(dashboard.BorderColor)) ?
                `#${dashboard.BorderColor}` : (type === 'line') ?
                    singleColor : '#888888';

            var dataset = {
                backgroundColor: bgColor,
                borderColor: bdrColor,
                borderWidth: (type == 'line') ? 2 : 1,
                data: dataArray,
                fill: fill,
                hoverBorderColor: adjustHexOpacity(bgColor, 0.8),
                hoverBackgroundColor: adjustHexOpacity(bgColor, 0.2),
                label: (!isEmpty(dataset.MergeName)) ? dataset.MergeName : dataset.Name,
                pointBorderColor: bdrColor,
                pointBackgroundColor: bgColor,
                type: type
            }

            if (type == 'line') {
                dataset.pointHoverRadius = (!isEmpty(dashboard.PointHoverRadius)) ? dashboard.PointHoverRadius : 6;
                dataset.pointStyle = (!isEmpty(dashboard.PointStyle)) ? dashboard.PointStyle : 'rectRounded';
                dataset.pointRadius = (!isEmpty(dashboard.PointRadius)) ? dashboard.PointRadius : 7;
            }

            if (dashboard.ShowTrendLines && type !== 'scatter' && type !== 'bubble' && showTrendLines)
                _.merge(dataset, trendLineOptions);

            if ((type == 'scatter' || type == 'bubble'))
                _.merge(dataset, scatter);

            datasets.push(dataset);
        }
    }
    return datasets;
}

/**
 * todo: add the ability to add or modify options and re-apply to a chart or dataset
 * Add or Update chart datasets
 * @param {text} formIdNoSymbols    DC Id (guid) without dashes
 */
function addOrUpdateChartOptions(newOptions, formIdNoSymbols, datasetName) {
    if (isEmpty(newOptions))
        return false;

    //Get existing options
    var dcChart = global_charts[formIdNoSymbols];
    if (isEmpty(dcChart))
        return false;

    if (!isEmpty(datasetName)) {
        //Find the dataset
        //var ds = dcChart.data.find(function (element) {
        //    return element.label == datasetName;
        //}); 
        //if (!isEmpty(ds)) {
        //todo: update the options in a dataset
        //}
    }
    else {
        var dcChartOptions = dcChart.options;
        _.merge(dcChartOptions, newOptions);
        dcChart.options = dcChartOptions;
    }

    dcChart.update();
}

/**
 * Build a chart from within a DC
 * @param {text} formIdNoSymbols    DC Id (guid) without dashes
 */
function buildChart(formIdNoSymbols) {

    var dashboard = global_dashboardConfigs[formIdNoSymbols];
    if (isEmpty(dashboard))
        return false;

    var datasetsJSON = global_datasets[formIdNoSymbols];
    if (isEmpty(datasetsJSON))
        return false;

    let type = $(`.toggleChart_${formIdNoSymbols}`).attr('value');
    let isWaterfall = (type == 'waterfall');
    if (isWaterfall) {
        //reset type to bar, a waterfall is a type of bar
        type = 'bar';
        //Grab the last dataset point, put it first, then sort the deltas, add a total
        datasetsJSON = modifyWaterfallDataset(datasetsJSON, dashboard.ChartXAxis);
    }

    //Do not change document.getElementById
    var chartContext = document.getElementById(`chart_${formIdNoSymbols}`).getContext('2d');
    var dcChart = new Chart(chartContext);

    global_chartContexts[formIdNoSymbols] = chartContext;
    global_charts[formIdNoSymbols] = dcChart;

    //Get the first dataset for colors and to apply to the chart as the default
    var firstDataset = datasetsJSON[0].Data;
    var lbls = getDataFromJSON(firstDataset, dashboard.ChartXAxis, '');

    $(`.toggleDataset_${formIdNoSymbols}`).on('click', function () {
        var datasetName = $(this).attr('value');
        global_selectedDataset = datasetName;
        var obj = eval(`d${datasetName}`);
        global_selectedChart = $("input[name='chart_" + formIdNoSymbols + "']:checked").val();

        var type = (dashboard.DefaultChart != null) ? dashboard.DefaultChart.Value : global_selectedChart;
        if (!isWaterfall) {
            lbls = (type == 'scatter' || type == 'bubble') ? getDataFromJSON(obj, 'x', '') : getDataFromJSON(obj, dashboard.ChartXAxis);
        }
        triggerClick(`${type}${formIdNoSymbols}`);
    });

    $(`.toggleChart_${formIdNoSymbols}`).on('click', function () {
        var chartType = $(this).attr('value');
        if (chartType == 'waterfall') {
            //reset type to bar, a waterfall is a type of bar
            chartType = 'bar';
        }

        global_selectedChart = chartType;
        global_selectedDataset = $("input[name='dataset_" + formIdNoSymbols + "']:checked").val();

        var filterType = isWaterfall ? 'waterfall' : chartType;
        var selectedOptions = dashboard.ChartOptions.filter(function (item) {
            return (item.OptionsChart != null) ? item.OptionsChart.Value == filterType : true;
        });

        var optionsAvailable = (!isEmpty(selectedOptions[0]));

        //Add default options
        var so = (optionsAvailable) ? selectedOptions[0] : '';

        var jsonOptions = setDefaultChartOptions(so, chartType, dashboard.ShowDataLabels, isWaterfall, formIdNoSymbols);

        if (dashboard.EnablePanAndZoom) {
            jsonOptions.pan.enabled = true;
            jsonOptions.zoom.enabled = true;
            jsonOptions.zoom.drag = true;
        }

        var scalesConfig = jsonOptions.scales;

        // X-Axis Configuration
        if (!isEmpty(dashboard.ChartXAxisLabel)) {
            scalesConfig.xAxes[0].scaleLabel = { display: true, fontColor: global_chartStyles.fillStyle };
            scalesConfig.xAxes[0].scaleLabel.labelString = (dashboard.ChartXAxisLabel.indexOf('`') > -1) ? eval(dashboard.ChartXAxisLabel) : dashboard.ChartXAxisLabel;
        }

        if (!isEmpty(dashboard.ChartXAxisMax)) {
            if (isEmpty(scalesConfig.xAxes[0].ticks)) scalesConfig.xAxes[0].ticks = {};
            scalesConfig.xAxes[0].ticks.max = dashboard.ChartXAxisMax;
        }

        if (chartType != 'pie' && chartType != 'doughnut') {
            if (!isEmpty(dashboard.ChartXAxisMin)) {
                if (isEmpty(scalesConfig.xAxes[0].ticks)) scalesConfig.xAxes[0].ticks = {};
                scalesConfig.xAxes[0].ticks.min = dashboard.ChartXAxisMin;
            }

            // Y-Axis Configuration
            if (!isEmpty(dashboard.ChartYAxisLabel)) {
                scalesConfig.yAxes[0].scaleLabel = { display: true, fontColor: global_chartStyles.fillStyle };
                scalesConfig.yAxes[0].scaleLabel.labelString = (dashboard.ChartYAxisLabel.indexOf('`') > -1) ? eval(dashboard.ChartYAxisLabel) : dashboard.ChartYAxisLabel;
            }

            if (!isEmpty(dashboard.ChartYAxisMax)) {
                scalesConfig.yAxes[0].ticks.max = dashboard.ChartYAxisMax;
            }

            if (!isEmpty(dashboard.ChartYAxisMin)) {
                scalesConfig.yAxes[0].ticks.min = dashboard.ChartYAxisMin;
            }
        }

        _.merge(jsonOptions, scalesConfig);

        //Apply custom options - this will add or update the defaults
        var json = (optionsAvailable) ? selectedOptions[0].OptionsJSON : '';
        if (!isEmpty(json)) {
            _.merge(jsonOptions, JSON.parse(json));
        }
        var datasets = addChartDatasets(dashboard, datasetsJSON, chartType, isWaterfall);
        if (!isEmpty(dashboard.ChartSeriesAxis)) { //Have make labels distinct because we made new datasets
            lbls = [...new Set(lbls)];
        }
        //Apply fill if line chart and has fill options
        //todo: add fill settings to the dc editor chart section
        if (chartType === 'line' && parseBool(jsonOptions.fill) === true) {
            $.each(datasets, function (ea_index) {
                datasets[ea_index].fill = true;
                if (!isEmpty(jsonOptions.backgroundColor)) datasets[ea_index].backgroundColor = jsonOptions.backgroundColor;
            });
        }

        //Creates separation betweeen the legend and the top of the chart so the data doesn't intersect the legend
        var plugins = [{
            beforeInit: function (chart, options) {
                //Called from the DC JS Content
                var beforeInitFunction = eval(`(typeof chart_${formIdNoSymbols}_beforeInit === 'undefined') ?null: chart_${formIdNoSymbols}_beforeInit;`);
                if (beforeInitFunction !== null) {
                    beforeInitFunction(chart, options);
                }

                if (!isEmpty(chart.legend)) {
                    chart.legend.afterFit = function () {
                        this.height = this.height + 25;
                    }
                }
            },
            afterDraw: function (chart) {
                if (chart.data.datasets.length === 0 || chart.data.datasets[0].data.length === 0) {
                    // No data is present
                    chart.data.dataset = [100];
                    var ctx = chart.chart.ctx;
                    ctx.textAlign = global_chartStyles.textAlign;
                    ctx.textBaseline = global_chartStyles.textBaseline;
                    ctx.font = global_chartStyles.font;
                    ctx.fillStyle = global_chartStyles.fillStyle;
                    ctx.fillText(`No data to display on ${chartType} chart`, chart.chart.width / 2, chart.chart.height / 2);
                }
            }
        }];

        //Apply the labels, datasets, options and plugins to a new object that get applied when creating a new chart
        var merged = (optionsAvailable && parseBool(selectedOptions[0].ApplyToDataset) === true) ?
            $.extend(datasets, jsonOptions) : datasets;

        var chartOptions = {
            type: chartType,
            data: {
                labels: lbls,
                datasets: merged
            },
            options: jsonOptions,
            plugins: plugins
        }

        dcChart.destroy();
        dcChart = new Chart(chartContext, chartOptions);
        dcChart.height = 500;
        global_charts[formIdNoSymbols] = dcChart;

        var canvas = document.getElementById(`chart_${formIdNoSymbols}`);

        //Adding drill-down capabilities
        canvas.onclick = function (evt) {
            var activePoint = dcChart.lastActive[0];
            if (!isEmpty(activePoint)) {
                var bl = $(`#DCBodyLoad${formIdNoSymbols}`);
                var index = activePoint._index;
                var datasetIndex = activePoint._datasetIndex;

                var chartData = activePoint._chart.config.data;
                var label = chartData.labels[index];
                var selectedLabel = chartData.datasets[datasetIndex].label;
                var value = chartData.datasets[datasetIndex].data[index];
                var drillDownToDC = (optionsAvailable) ? selectedOptions[0].DrillDownToDC : '';
                var drillDownDataGrid = (optionsAvailable) ? selectedOptions[0].DrillDownDataGrid : '';

                if (!isEmpty(drillDownToDC) && drillDownToDC != 'null') {
                    bl.fadeIn(3000);
                    var dd = JSON.parse(JSON.stringify(drillDownToDC));

                    //Build extra key / value pairs and add to querystring
                    var extraParams = '';

                    if (!isEmpty(drillDownDataGrid) && !isEmpty(drillDownDataGrid)) {
                        for (var d = 0; d < drillDownDataGrid.length; d++) {
                            //Note: ~ is a boolean check if an item exists in a string value
                            if (~drillDownDataGrid[d].Value.indexOf("['_dcid_']")) {
                                var newValue = drillDownDataGrid[d].Value.replace(/_dcid_/g, formIdNoSymbols);
                                extraParams += '&' + drillDownDataGrid[d].Key + '=' + encodeURIComponent(eval(newValue));
                            }
                            //if the value contains brackets, replace the value with the data equivalent
                            else if (drillDownDataGrid[d].Value.trim().indexOf('[') == 0) {
                                var newValue = drillDownDataGrid[d].Value.trim().slice(1, -1);
                                extraParams += '&' + drillDownDataGrid[d].Key + '=' + encodeURIComponent(eval(`d${formIdNoSymbols}_${selectedLabel}[${index}].${newValue}`));
                            }
                            else {
                                //try to evaluate the value if JavaScript was provided.
                                var newValue = drillDownDataGrid[d].Value;
                                try {
                                    newValue = eval(drillDownDataGrid[d].Value);
                                }
                                catch (e) {
                                    //Do Nothing
                                }
                                finally {
                                    extraParams += '&' + drillDownDataGrid[d].Key + '=' + encodeURIComponent(newValue);
                                }
                            }
                        }
                    }
                    var href = `/dashboard/DashboardComponentAsync?id=${dd.Value}&manualRefresh=true&pageRefresh=false&isModal=true&label=${encodeURIComponent(label)}&selectedLabel=${encodeURIComponent(selectedLabel)}&value=${encodeURIComponent(value)}&dcid=${dd.Value}${extraParams}`;
                    openActionInPopUp(href, dd.Label, false, this);
                    bl.fadeOut(3000);
                }
            }

            if (dashboard.EnablePanAndZoom) {
                //todo: figure out how to make this work in mobile (Safari) - or not
                if (isMobile() && 1 == 2) {
                    var tapped = false;
                    canvas.ontouchstart = function (evt) {
                        if (!tapped) {
                            tapped = setTimeout(function () {
                                //single tapped
                                tapped = null;
                                toggleChartPanZoom(chart);
                            }, 300);
                        }
                        else {
                            //double tapped
                            clearTimeout(tapped);
                            tapped = null;
                            dcChart.resetZoom();
                        }
                        evt.preventDefault();
                    };
                }
            }

            //reset zoom if chart is double-clicked(mobile)
            canvas.ondblclick = function (evt) {
                dcChart.resetZoom();
            };
        }

        //todo: this does not work for bar charts(drill-down) in v2.8
        canvas.hover = function (e) {
            this.css('cursor', e[0] ? 'pointer' : 'default');
        };

        var cea = getColorExpressionsFromConfig(dashboard);
        if (dashboard.DefaultChartColors != null && !isEmpty(cea)) {
            //Change chart colors based on color options (>=< ###)
            setChartColorByExpression(dcChart, cea);
        }

        //Set the chart height first so the reload animation will work
        $(() => { setChartHeight(formIdNoSymbols, global_chartHeight) });
    });
}

/**
 * todo: If this is to be used for all clients, Rewrite to make shops and projects into generic datasets with the same label/value and refactor
 * todo: Move this to a custom script section or a DC since it is strictly for SWR
 * Handles the filtering for SWR Scatter charts
 * @param {object} config   Configuration that contains info needed for managing SWR Scatter Plots
 *        - {text}     dcid         ID of the DC being modified
 *        - {array}    qsParams     Key/Value pairs of the querystring parameters
 *        - {array}    timeLabels   Used for populating the Time Period dropdown labels
 *        - {array}    timeValues   Used for populating the Time Period dropdown values
 *        - {array}    metrics      Array of datasets of Projects data for the Projects dropdown and chart info
 *        - {object}   shops        Dataset of Shop data for the Shop dropdown
 *        - {object}   hierarchy    Dataset of Hierarchy data for the SubRegion dropdown
 *        - {text}     render       'horizontal' or 'vertical' defining what directions the controls are rendered,
 */
function BuildScatterData(config) {
    // Time Period dropdown
    if (!isEmpty(config.timeLabels)) {
        $(`#timePeriod${config.dcid}`).find('option').remove().end();
        populateDropDownLabelAndValue(`timePeriod${config.dcid}`, config.timeLabels, config.timeValues, config.qsParams, 'cache', true);
    } else {
        if (config.render == 'vertical') {
            $(`#timePeriod${config.dcid}`).parent().parent().parent().remove();
        } else {
            $(`#timePeriod${config.dcid}`).parent().parent().remove();
        }
    }

    config.metrics = [config.metrics];

    // Sort results
    for (var i = 0; i < config.metrics.length; i++) {
        config.metrics[i].sort(sortByProject);
    }
    // Populate SubRegions
    var subRegions = config.hierarchy.filter(function (proj) {
        return proj.level == 2;
    });

    let uniqSubRegionNames = [...new Set(subRegions.map(d => d.name))];
    let uniqSubRegionIds = [...new Set(subRegions.map(d => d.hierarchyId))];
    populateDropDownLabelAndValue(`subregions${config.dcid}`, uniqSubRegionNames, uniqSubRegionIds, config.qsParams, 'subregion', false);

    // Filtering
    var isProjectFiltered = !isEmpty(config.qsParams.projectNum);
    var isShopFiltered = !isEmpty(config.qsParams.shop);
    var isSubRegionFiltered = !isEmpty(config.qsParams.subregion);

    // Filter by Shop
    if (isShopFiltered) {
        // Get the Project
        var project = config.shops.filter(function (proj) {
            return proj.Shop == config.qsParams.shop;
        });

        config.qsParams.projectNum = project[0].ProjectNumber;
        isProjectFiltered = true;
    }

    //Filter by SubRegion
    if (isSubRegionFiltered) {
        var projects = config.hierarchy.filter(function (proj) {
            return proj.parentId == config.qsParams.subregion;
        });

        // Check if there is more than one dataset
        for (var i = 0; i < config.metrics.length; i++) {
            config.metrics[i] = config.metrics[i].filter(function (metric) {
                return projects.filter(function (proj) {
                    return metric.x.indexOf(proj.name) > -1;
                }).length > 0;
            })
        }
    }

    // Populate Projects, get unique lists of Project Names and Numbers
    let uniqProjNames = [...new Set(config.metrics[0].map(d => d.x))];
    let uniqProjNums = [...new Set(config.metrics[0].map(d => d.ProjectNumber))];
    populateDropDownLabelAndValue(`projects${config.dcid}`, uniqProjNames, uniqProjNums, config.qsParams, 'projectNum', false);

    // Filter by Project
    if (isProjectFiltered) {
        if (isShopFiltered) {
            for (var i = 0; i < config.metrics.length; i++) {
                config.metrics[i] = config.metrics[i].filter(function (proj) {
                    return proj.Shop == config.qsParams.shop;
                });
            }
        } else {
            for (var i = 0; i < config.metrics.length; i++) {
                config.metrics[i] = config.metrics[i].filter(function (proj) {
                    return proj.ProjectNumber == config.qsParams.projectNum;
                });
            }
        }

        if (!isEmpty(config.shops)) {
            config.shops = config.shops.filter(function (proj) {
                return proj.ProjectNumber == config.qsParams.projectNum;
            });
        }
    }

    // Populate Shops
    if (!isEmpty(config.shops)) {
        config.shops = config.shops.filter(function (shop) {
            return config.metrics[0].filter(function (metric) {
                return shop.ProjectNumber == metric.ProjectNumber;
            }).length > 0;
        });

        var uniqShops = config.shops.map(d => d.Shop);
        populateDropDown(`shops${config.dcid}`, uniqShops.sort(), config.qsParams, 'shop', false);

        if (!isSubRegionFiltered || isProjectFiltered) {
            if (config.labels === 'shop') {
                setTimeout(() => {
                    var chart = global_charts[config.dcid];
                    if (isShopFiltered) {
                        chart.data.labels = [config.qsParams.shop];
                    } else {
                        chart.data.labels = uniqShops;
                    }
                    chart.update();
                }, 50);
            }
        }
    } else {
        if (config.render == 'vertical') {
            $(`#shops${config.dcid}`).parent().parent().parent().remove();
        } else {
            $(`#shops${config.dcid}`).parent().parent().remove();
        }
    }

    if (config.metrics.length === 1) {
        return config.metrics[0];
    } else {
        return config.metrics;
    }
}

/**
 * Use a legend to control other charts
 * Push an array to global_chartsToUpdate, so this function knows which charts to trigger
 * If you need a custom legend, pass the parent containing the legend as legendItem
 * @param {object} e            Legend event
 * @param {object} legendItem   Legend object for the selected chart
 * @param {text} formIdNoSymbols    DC Id (guid) without dashes
 */
function chartLegendControl(e, legendItem, formIdNoSymbols) {
    var legendName = '';
    var visibleItems = 0;

    if (!isEmpty(legendItem) && !isEmpty(legendItem.text)) {
        // Save name of clicked label, for later comparison
        legendName = legendItem.text;
        var masterControlChart = global_chartsToUpdate[formIdNoSymbols].filter(function (c) {
            return c.canvas.id == e.currentTarget.id;
        });
        visibleItems = masterControlChart[0].legend.legendItems.filter(function (i) {
            return i.hidden === false || (i.text === legendName && i.hidden === true);
        }).length;
    }
    else {
        //If using a custom legend
        legendName = e.target.innerText;
        if (!isEmpty(legendName)) {
            //The legend text was clicked
            e.target.classList.toggle("strike");
        }
        else {
            //The color was clicked
            legendName = e.target.parentNode.innerText;
            e.target.parentNode.classList.toggle("strike");
        }
        //Add 1 to the list since it starts with 0
        visibleItems = [].filter.call(legendItem.getElementsByTagName('li'), el => el.className.indexOf('strike') === -1).length + 1;

        //Don't let the last legend item hide
        if (visibleItems < 2) {
            if (!isEmpty(legendName))
                e.target.classList.toggle("strike");
            else
                e.target.parentNode.classList.toggle("strike");
        }
    }

    // Iterate through global charts array
    Object.keys(global_chartsToUpdate[formIdNoSymbols]).forEach(function (id) {
        // Assign shorthand variable to address chart easier
        var chrt = global_chartsToUpdate[formIdNoSymbols][id];

        // Determine chart type
        var chartType = chrt.config.type.toLowerCase();

        // Iterate through each legend in the chart
        chrt.legend.legendItems.forEach(function (item) {
            // If legend name matches clicked label
            if (item.text == legendName && visibleItems > 1) {
                if (chartType === 'pie' || chartType === 'doughnut') {
                    if (chrt.getDatasetMeta(0).data[item.index].hidden === true)
                        chrt.getDatasetMeta(0).data[item.index].hidden = false;
                    else
                        if (chrt.getDatasetMeta(0).data[item.index].hidden === false) chrt.getDatasetMeta(0).data[item.index].hidden = true;
                }
                else {
                    if (chartType === 'line' || chartType === 'bar') {
                        if (chrt.getDatasetMeta(item.datasetIndex).hidden === true)
                            chrt.getDatasetMeta(item.datasetIndex).hidden = null;
                        else
                            if (chrt.getDatasetMeta(item.datasetIndex).hidden === null) chrt.getDatasetMeta(item.datasetIndex).hidden = true;
                    }
                }
                chrt.update();

                //Check to see if the chart has any visible legend items - if not, hide the chart
                var foundVisibleLegend = chrt.legend.legendItems.filter(function (l) {
                    return (l.hidden === false);
                });
                //store chart dimensions before modifying. If not, the chart width becomes skewed
                var chartDimensionId = `${formIdNoSymbols}_${chartType}_${item.text}`;
                if (isEmpty(global_chartDimensions[chartDimensionId]))
                    global_chartDimensions[chartDimensionId] = { height: chrt.height, width: chrt.width };

                var id = $(`#${chrt.canvas.id}`);
                if (foundVisibleLegend.length === 0)
                    id.animate({ opacity: 0, width: 0 }, 500);
                else
                    id.animate({ opacity: 100, width: global_chartDimensions[chartDimensionId].width }, 500);
            }

        });
    });

    if (visibleItems == 1)
        simpleNotifyCenter('Chart Legend Filter', 'There are no more legend items to remove', 'fa-filter', 'error', 2500);
}

/**
 * Fit the chart within the parent component
 * Used to resize a small pie chart within a DC
 * @param {text} chart          ID of the chart
 * @param {text} widthOrHeight  If 'width' then ift the width of the chart, else the height
 */
function fitChart(chart, widthOrHeight) {
    var cA = chart.chartArea;
    var pixelRatio = chart.currentDevicePixelRatio;
    var chartSize, size, delta;
    chart.canvas.width /= pixelRatio;
    chart.canvas.height /= pixelRatio;
    if (widthOrHeight === 'width') {
        size = chart.width;
        chartSize = cA.bottom - cA.top;
        if (chartSize < size) {
            delta = size - chartSize;
            chart.canvas.height += delta;
            chart.height += delta;
        }
    }
    else {
        size = chart.height;
        chartSize = cA.right - cA.left;
        if (chartSize < size) {
            delta = size - chartSize;
            chart.canvas.width += delta * pixelRatio;
            chart.width += delta;
        }
    }
    chart.aspectRatio = chart.canvas.width / chart.canvas.height;
    chart.canvas.style.height = chart.canvas.height - 15 + "px";
    chart.canvas.style.width = chart.canvas.width - 15 + "px";
    //Chart.helpers.retinaScale(chart);
    chart.update();
}

/**
 * Return the color expression array
 * @param {object} config       Dashboard configuration
 * @param {text} dcid           ID of the DC. Used to find the dashboard configuration where the color array is stored
 */
function getColorExpressionsFromConfig(config, dcid) {
    if (isEmpty(config) && !isEmpty(dcid)) {
        config = global_dashboardConfigs[dcid];
    }

    if (!isEmpty(config)) {
        var expressionsAvailable = jsonPath(config.DefaultChartColors, '$.[?(@.Sign!="")].Sign').length;
        if (config.DefaultChartColors != null && !isEmpty(expressionsAvailable)) {
            //Change chart colors based on color options (>=< ###)
            var cea = config.DefaultChartColors.filter(function (color) {
                return !isEmpty(color.Sign);
            });
            return cea;
        }
    }
    return [];
}

/**
 * Add chart datasets
 * @param {text} labelFormat            Type of label format (e.g. comma, currency, custom, double, percent)
 * @param {text} unitPrefix             Prepend characters to the beginning of a calculated value
 * @param {text} unitSuffix             Append characters to the end of a calculated value
 * @param {text} hideValueLabel         Hide the value on the label
 * @param {text} useCustomTooltip       Override the built-in tooltip and use a custom one
 * @param {text} type                   Type of chart (e.g. bar, line, area, scatter, bubble)
 * @param {text} formIdNoSymbols        DC Id (guid) without dashes
 */
function getStandAloneChartOptions(labelFormat, unitPrefix, unitSuffix, hideValueLabel, useCustomTooltip, type, formIdNoSymbols) {
    var selectedOptions = {
        ApplyToDataset: false,
        CustomTooltipFormat: '',
        DrillDownDataGrid: [],
        DrillDownToDC: [],
        LabelFormat: labelFormat,
        OptionsChart: [],
        OptionsDataset: '',
        OptionsJSON: {},

        //todo: implement in form
        HideValueLabel: hideValueLabel,
        UnitPrefix: unitPrefix,
        UnitSuffix: unitSuffix,
        UseCustomTooltip: useCustomTooltip
    };
    var showLabels = true;
    var isWaterfall = false;
    return setDefaultChartOptions(selectedOptions, type, showLabels, isWaterfall, formIdNoSymbols);
}

/**
 * Gets data from a JSON object and creates a new object using x / y
 * Primarily used for plotting data on a scatter chart
 * @param {object} obj  The object containing the data
 * @param {text} key    The key of the data to select
 */
function getWaterfallDataFromJSON(obj, key) {
    var data = [];
    if (!isEmpty(obj) && !isEmpty(key)) {
        runningTotal = 0;   //start at 0
        for (i in obj) {
            let value = Number(obj[i][key]);
            data.push([runningTotal, runningTotal + value]); //add deltas
            runningTotal += value;
        }
        //the last datapoint is a total object we added
        data[data.length - 1][0] = 0;
        data[data.length - 1][1] = runningTotal - Number(obj[0][key]);
    }
    return data;
}

/**
 * Gets data from a JSON object and creates a new object using x / y
 * Primarily used for plotting data on a scatter chart
 * @param {object} obj  The object containing the data
 * @param {text} key    The key of the data to select
 */
function getXYDataFromJSON(obj, xKey, yKey) {
    var data = [];
    if (!isEmpty(obj) && !isEmpty(xKey) && !isEmpty(yKey)) {
        for (i in obj) {
            data.push({ x: obj[i][xKey], y: obj[i][yKey] });
        }
    }
    return data;
}

/**
 * Datasets is multidimentional array
 * Grab the last dataset point, put it first, then sort the deltas, add a total
 * @param {any} datasetsJSON
 */
function modifyWaterfallDataset(datasetsJSON, ChartXAxis) {
    datasetsJSON.forEach(dataset => {
        if (dataset.Data != null && dataset.Data.length > 1) {
            let origin = dataset.Data[dataset.Data.length - 1];
            let deltas = dataset.Data.slice(0, dataset.Data.length - 1);
            deltas.sort(function (a, b) {
                return a[ChartXAxis].localeCompare(b[ChartXAxis]);
            });
            let newData = [];
            newData = newData.concat(origin, deltas);
            let total = Object.assign({}, origin);;
            total[ChartXAxis] = 'Total';
            newData.push(total);
            dataset.Data = newData;
        }
    });
    return datasetsJSON;//todo return new dataset
}

/**
 * Sets the colors of a chart by expressions
 * This gets run at the end of the chart building. 
 * If colors fail to render, there could be a JS error in a prior method
 * @param {text} chart          ID of the chart
 * @param {array} colorArray    Array of colors
 */
function setChartColorByExpression(chart, colorArray) {
    if (!isEmpty(chart) && !isEmpty(colorArray) && !isEmpty(chart.config.type)) {
        //Loop through each dataset
        for (var d = 0; d < chart.data.datasets.length; d++) {
            //Loop through each row of the dataset
            var dataset = chart.data.datasets[d];
            if (!isEmpty(dataset.type)) {
                var type = dataset.type.toLowerCase();
                switch (type) {
                    case 'area':
                    case 'bar':
                    case 'bubble':
                    case 'doughnut':
                    case 'horizontalbar':
                    //todo: multi-color case 'line':
                    case 'pie':
                    case 'scatter':
                        for (var r = 0; r < dataset.data.length; r++) {
                            //Loop through the color array
                            for (var c = 0; c < colorArray.length; c++) {
                                var ca = colorArray[c];
                                //Scatter and Bubble charts use points for coloring
                                if (type == 'scatter' || type == 'bubble') {
                                    var color = setDataColorByExpression(ca, dataset.data[r].y);
                                    if (!isEmpty(color)) {
                                        if (Array.isArray(dataset.pointBackgroundColor))
                                            dataset.pointBackgroundColor[r] = color;
                                        else
                                            dataset.pointBackgroundColor = color;
                                    }
                                }
                                else {
                                    var color = setDataColorByExpression(ca, dataset.data[r]);
                                    if (!isEmpty(color)) {
                                        if (Array.isArray(dataset.backgroundColor))
                                            dataset.backgroundColor[r] = color;
                                        else
                                            dataset.backgroundColor = color;
                                    }
                                }
                            }
                        }
                        break;
                }
            }
        }
        chart.update();
    }
}

/**
 * Set the DC chart height
 * A minimum height of 500px is required to re-animate the chart on a re-load (gui visualization)
 * @param {text} formIdNoSymbols    DC Id (guid) without dashes
 * @param {int} height              Height to set the chart to
 */
function setChartHeight(formIdNoSymbols, height) {
    height = (!isEmpty(height)) ? height : 500;
    if (!isEmpty(formIdNoSymbols)) {
        $(`#DCChartContainer${formIdNoSymbols}`).css('min-height', `${height}px`);
        $(`#chart_${formIdNoSymbols}`).height = height;
        $(`#chart_${formIdNoSymbols}`).css('height', `${height}px`);
    }
}

/**
 * Return the color based on color expressions set in the DC (Options > Colors)
 * @param {object} color        Color object that contains an expression ( > < = ### )
 *      - {text}    sign        > < or =
 *      - {int}     number      A number to compare (e.g. > 10 or < 10, or = 10)
 *      - {text}    hex         The hex color value (e.g. #FFFFFF)
 * @param {int}     data        The number to compare
 */
function setDataColorByExpression(color, data) {
    var number = parseInt(data);
    if (!isEmpty(color) && !isEmpty(data)) {
        if ((color.Sign == '>' && number > color.Number) ||
            (color.Sign == '<' && number < color.Number) ||
            (color.Sign == '=' && number == color.Number)) {
            return color.Hex;
        }
    }
    return '';
}

/**
 * Return default chart options
 * @param {text} so                 Selected Options > Format the label. Currently available: comma, currency, custom, double, percent 
 * @param {text} type               Type of chart (e.g. bar, line, area, scatter, bubble)
 * @param {bool} showLabels         Show the chart labels
 * @param {bool} isWaterfall        Is this a waterfall chart
 * @param {text} formIdNoSymbols    DC Id (guid) without dashes
*/
function setDefaultChartOptions(so, type, showLabels, isWaterfall, formIdNoSymbols) {
    var hideValueLabel = (!isEmpty(so.HideValueLabel)) ? so.HideValueLabel : false;
    var unitPrefix = (!isEmpty(so.UnitPrefix)) ? so.UnitPrefix : '';
    var unitSuffix = (!isEmpty(so.UnitSuffix)) ? so.UnitSuffix : '';
    var jsonOptions = {
        maintainAspectRatio: false,
        responsive: true,
        layout: {
            padding: {
                left: 0,
                right: 0,
                top: 5,
                bottom: 0
            }
        },
        plugins: {
            labels: {
                render: function (args) {
                    var val = '';
                    let argValue = args.value;
                    if (isWaterfall) {
                        argValue = argValue[1] - argValue[0];
                    }

                    if (!isEmpty(so) && !isEmpty(so.LabelFormat) && showLabels) {
                        switch (so.LabelFormat.toLowerCase()) {
                            case "currency": val = currencyFormatter(argValue); break;
                            case "comma": val = commaFormatter(argValue); break;
                            case "labelvalue": val = `${unitPrefix}${argValue}${unitSuffix}`; break;
                        }
                    }
                    //todo: create a setting for this to control the percentage threshold
                    var percentageThreshold = 3;
                    var thresholdToHideLabel = 100 / args.dataset.data.length;
                    return (hideValueLabel) ? '' : (args.percentage < percentageThreshold && args.percentage < thresholdToHideLabel) ? '' : val;
                },
                fontColor: function (args) {
                    var bg = (typeof args.dataset.backgroundColor === 'object') ?
                        args.dataset.backgroundColor[args.index] :
                        args.dataset.backgroundColor;
                    return setContrast(bg, global_chartStyles.fillStyle);
                }
            }
        },
        legend: {
            display: true,
            labels: {
                fontColor: global_chartStyles.fillStyle
            }
        },
        elements: {
            point: {
                radius: 0
            }
        },
        hover: {
            mode: 'nearest',
            intersect: true
        },
        tooltips: {
            mode: (type === 'horizontalBar') ? 'y' : (type === 'scatter' || type === 'bubble' || type === 'pie' || type === 'doughnut') ? 'nearest' : 'x-axis',
            enabled: !parseBool(so.UseCustomTooltip),
            custom: function (tooltipModel) {
                if (parseBool(so.UseCustomTooltip)) {
                    const tooltipEl = $(`#DCTooltip_${formIdNoSymbols}`)[0];

                    //Hide if no tooltip
                    if (tooltipModel.opacity === 0) {
                        tooltipEl.style.opacity = 0;
                        return;
                    }

                    //Set caret Position
                    tooltipEl.classList.remove('above', 'below', 'no-transform');
                    tooltipEl.classList.add((tooltipModel.yAlign) ? tooltipModel.yAlign : 'no-transform');

                    //Set Text
                    if (tooltipModel.body) {
                        var titleLines = tooltipModel.title || [];
                        var bodyLines = tooltipModel.body.map(function (bodyItem) { return bodyItem.lines; });

                        var html = [];
                        html.push('<table><thead>');
                        titleLines.forEach(function (title) {
                            var style = `background-color:${tooltipModel.labelColors[0].backgroundColor};`;
                            html.push(`<tr><th><span style="${style}">&nbsp; &nbsp; &nbsp;</span> ${title}</th></tr>`);
                        });
                        html.push('</thead><tbody>');

                        bodyLines.forEach(function (body, i) {
                            var colors = tooltipModel.labelColors[i];
                            var style = `background:${colors.backgroundColor}; border-color:${colors.borderColor}; border-width: 2px`;
                            html.push(`<tr><td><span style="${style}"></span>${body}</td></tr>`);
                        });
                        html.push('</tbody></table>');
                        tooltipEl.innerHTML = html.join('');
                    }

                    var position = this._chart.canvas.getBoundingClientRect();
                    var selfOffsetTop = this._chart.ctx.canvas.offsetTop;
                    var parentOffsetTop = this._chart.ctx.canvas.offsetParent.offsetTop;
                    //Take the highest number
                    var top = (selfOffsetTop > parentOffsetTop) ? selfOffsetTop : parentOffsetTop;

                    //Display, position, and set styles for font
                    tooltipEl.style.opacity = 1;
                    tooltipEl.style.position = 'absolute';
                    tooltipEl.style.left = `${position.left + tooltipModel.caretX}px`;
                    tooltipEl.style.top = `${tooltipModel.caretY + top}px`;
                    tooltipEl.style.fontFamily = tooltipModel._bodyFontFamily;
                    tooltipEl.style.fontSize = `${tooltipModel.bodyFontSize}px`;
                    tooltipEl.style.fontStyle = tooltipModel._bodyFontStyle;
                    tooltipEl.style.padding = `${tooltipModel.yPadding}px ${tooltipModel.xPadding}px`;
                    tooltipEl.style.pointerEvents = 'none';
                }
            },
            callbacks: {
                label: function (tooltipItem, data) {
                    var key = (type == 'scatter' || type === 'bubble') ? data.labels[tooltipItem.index] : data.datasets[tooltipItem.datasetIndex].label || '';
                    var val = tooltipItem.yLabel || '';
                    if (isWaterfall) {
                        let temp = JSON.parse(val);
                        let delta = temp[1] - temp[0];
                        val = delta;
                    }

                    if (key) key += ': ';

                    if (!isEmpty(so)) {
                        switch (so.LabelFormat.toLowerCase()) {
                            case "comma":
                                val = key + (!isEmpty(val) ? val.toLocaleString('en') : 0);
                                break;
                            case "currency":
                                val = key + val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
                                break;
                            case "custom":
                                if (!isEmpty(so.CustomTooltipFormat) && !isEmpty(so)) {
                                    val = replaceBracketedProperties(so.CustomTooltipFormat, tooltipItem.datasetIndex, tooltipItem.index, formIdNoSymbols, data);
                                }
                                break;
                            case "double":
                                val = key + (!isEmpty(val) ? val.toFixed(2) : 0);
                                break;
                            case "percent":
                                val = key + (!isEmpty(val) ? val.toFixed(2) : 0) + '%';
                                break;
                            case "labelvalue":
                                val = `${data.labels[tooltipItem.index]}: ${unitPrefix}${data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]}${unitSuffix}`;
                                break;
                            default:
                                val = key + val;
                                break;
                        }
                    }
                    return val;
                },
                title: function (tooltipItem, data) {
                    var index = tooltipItem.index === undefined ? tooltipItem[0].index : tooltipItem.index;
                    var key = (!isEmpty(data.datasets[0].label)) ? data.datasets[0].label : data.labels[index];
                    var title = tooltipItem[0].label;
                    switch (so.LabelFormat.toLowerCase()) {
                        case "custom":
                        case "labelvalue":
                            title = key;
                            break;
                        case "comma":
                        case "currency":
                        case "double":
                        case "percent":
                        default:
                            break;
                    }
                    return title;
                }
            },
            itemSort: function (a, b) {
                return b.datasetIndex - a.datasetIndex;
            }
        },
        pan: {
            enabled: false,
            mode: 'xy'
        },
        zoom: {
            enabled: false,
            drag: false,
            mode: 'xy'
        },
        scales: {
            xAxes: [{ display: false }],
            yAxes: [{ display: false }]
        },
        defaultFontColor: '#838383'
    }

    //Pie charts don't need gridlines
    if (type !== 'pie' && type !== 'doughnut') {
        var scales = {
            scales: {
                xAxes: [{
                    display: true,
                    gridLines: {
                        offsetGridLines: true
                    },
                    ticks: {
                        fontColor: global_chartStyles.fillStyle
                    }
                }],
                yAxes: [{
                    position: 'left',
                    display: true,
                    ticks: {
                        fontColor: global_chartStyles.fillStyle,
                        beginAtZero: true,
                        callback: function (value, index, values) {
                            var val = value;

                            if (!isEmpty(so) && !isEmpty(so.LabelFormat)) {
                                switch (so.LabelFormat.toLowerCase()) {
                                    case 'comma': val = (!isEmpty(val) ? val.toLocaleString('en') : 0); break
                                    case 'currency': val = value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }); break;
                                    case 'double': val = (!isEmpty(val) ? val.toFixed(2) : 0); break;
                                    case 'percent': val = (!isEmpty(val) ? val.toFixed(2) : 0) + '%'; break;
                                    case 'labelvalue': val = `${unitPrefix}${val}${unitSuffix}`; break;
                                }
                            }
                            return val;
                        }
                    }
                }]
            }
        }
    }
    _.merge(jsonOptions, scales);
    return jsonOptions;
}

/**
 * Set the default waterfall chart colors
 * todo: define the colors in the dashboard builder so these can be customized
 * @param {object} data     The first and last point of the data are special
 * @param {text} YAxisKey Y-Axis Key name
 */
function setWaterFallColors(data, YAxisKey) {
    const red_rgb = "rgb(238, 55, 37)";
    const green_rgb = "rgb(69, 149, 89)"
    const blue_rgb = "rgb(40,106,192)";
    let colors = [];
    colors.push(blue_rgb);
    for (let i = 1; i < data.length - 1; i++) {
        let value = data[i][YAxisKey];
        colors.push((value != null && value.length > 0 && Number(value) >= 0) ? green_rgb : red_rgb);
    }
    colors.push(blue_rgb);
    return colors;
}

/**
 * Handles the resizing to the columns containing the chart and its related controls
 * @param {text} dcid       ID of the DC used to target the chart columns
 * @param {int}  westCol    Width of left column between 1 and 12
 * @param {int}  centerCol  Width of center column between 1 and 12
 * @param {int}  eastCol    Width of right column between 1 and 12
 */
function sizeChartControls(dcid, westCol, centerCol, eastCol) {
    var leftCls = `col-lg-${westCol.toString()}`;
    var centerCls = `col-lg-${centerCol.toString()}`;
    var rightCls = `col-lg-${eastCol.toString()}`;
    var colLg2 = 'col-lg-2';
    var colLg12 = 'col-lg-12';

    $(`#center_${dcid}`).removeClass(colLg12).addClass(centerCls);
    $(`#north_${dcid}`).removeClass(colLg12).addClass(centerCls);
    $(`#south_${dcid}`).removeClass(colLg12).addClass(centerCls);
    $(`#east_${dcid}`).removeClass(colLg2).addClass(rightCls);
    $(`#west_${dcid}`).removeClass(colLg2).addClass(leftCls);
}

/** 
  * Update chart by splitting once data source into multiple series
  * To configure the config object
  * config.chart = the chart object ... get it from global_charts
  * config.dcDataSet = the dataset the current chart is graphing
  * config.dataSetLabelField pass the name of the column that contains the Labels for the series
  * config.xField pass the name of the column for the x axis
  * config.yField pass the name of the column for the y axis. This should be a numeric column
  * config.datasetOptionsCallback pass a function that is a call back to you to do stuff the the dataset to do things like set the colors ex:
  * @param {any} config
   
    //Get the chart
    let chart = global_charts['_dcid_'];

    //sort your data now
    d_dcid__pmMetricsYear.sort((d1, d2) => {
        let s1 = d1.Project.localeCompare(d2.Project);
        if (s1 !== 0)
            return s1;
        else if (d1.TargetDateYear !== d2.TargetDateYear)
            return Number(d1.TargetDateYear) - Number(d2.TargetDateYear);
        else
            return Number(d1.TargetDateMonthNum) - Number(d2.TargetDateMonthNum);
    });

    //configure the options
    let config = {
        'dcDataSet': d_dcid__pmMetricsYear,
        'dataSetLabelField': 'TargetDateMonth',
        'xField': 'Project',
        'yField': 'RCCompletePercent',
        'datasetOptionsCallback': function (chartDataset) {
            let colors = [];
            chartDataset.data.forEach(value => {
                if (value < 70)
                    colors.push('#FF0000');
                else if (value < 90)
                    colors.push('#ffff00');
                else
                    colors.push('#00e600');
            });
            chartDataset.backgroundColor = colors;
            chartDataset.borderColor = '#555555';
            chartDataset.borderWidth = 1;
        },
        'chart': chart
    };  
    
    call > splitChartIntoSeries(config);
 */
function splitChartIntoSeries(config) {
    //Get variables from config
    let chart = config.chart;
    let records = config.dcDataSet;
    let dataSetLabelField = config.dataSetLabelField;
    let xField = config.xField;
    let yField = config.yField;
    let datasetOptionsCallback = config.datasetOptionsCallback;

    //Store the labels
    let xLabelsByName = [];
    let xFieldLabels = [];

    records.forEach(record => {
        let xFieldLabel = record[xField];
        if (xLabelsByName[xFieldLabel] === undefined) {
            xLabelsByName[xFieldLabel] = xFieldLabel;
            xFieldLabels.push(xFieldLabel);
        }
    });

    //create a new chart data object with labels
    let data = {
        'labels': xFieldLabels,
        'datasets': []
    };

    let datasetsByDatasetLabel = [];
    let datasetLabels = [];

    //Loop over records and build a new datastructure that has missing columns filled in
    records.forEach(record => {
        let datasetLabel = record[dataSetLabelField];
        let dataset = datasetsByDatasetLabel[datasetLabel];
        if (dataset === undefined) {
            dataset = {
                'label': datasetLabel,
                'dataByXLabel': []
            };
            datasetsByDatasetLabel[datasetLabel] = dataset;
            datasetLabels.push(datasetLabel);
        }
        let xFieldLabel = record[xField];
        dataset.dataByXLabel[xFieldLabel] = Number(record[yField]);
    });

    //Take the new records and map them to datasets
    datasetLabels.forEach(datasetlabel => {
        let chartDataset = {
            'label': datasetlabel,
            'data': []
        };
        let dataset = datasetsByDatasetLabel[datasetlabel];
        xFieldLabels.forEach(xFieldLabel => {
            let yValue = dataset.dataByXLabel[xFieldLabel];
            if (yValue === undefined)
                yValue = 0;
            chartDataset.data.push(yValue);
        });
        data.datasets.push(chartDataset);
    });
    // After datasets created give the caller a chance to do things like map colors 
    if (datasetOptionsCallback !== null) {
        data.datasets.forEach(ds => {
            //todo if colors are not set use the DC's settings
            datasetOptionsCallback(ds);
        });
    }
    //Assign the data and refresh the chart
    chart.data = data;
    if (config.runUpdate !== undefined && true === config.runUpdate)
        chart.update();
}

/**
 * Toggles the pan and Zoom function of a chart
 * @param {text} chart          ID of the chart
 */
function toggleChartPanZoom(chart) {
    if (!isEmpty(chart)) {
        var drag = chart.options.zoom.drag;
        chart.options.zoom.drag = (drag == false) ? true : false;
        var pan = chart.options.pan.enabled;
        chart.options.pan.enabled = (pan == false) ? true : false;
        chart.update();
    }
}

/**
 * ChartJS extension to align text to the center of a doughnut chart
 * use the property options.centerText = 'text to show';
 * use enableCenterText = true;
 */
if (typeof Chart !== 'undefined') {
    Chart.pluginService.register({
        beforeInit: function (chart, options) {
            if (!isEmpty(chart.legend) && chart.legend.position === 'top') {
                chart.legend.afterFit = function () {
                    this.height = this.height + 15;
                }
            }
        },
        beforeDraw: function (chart) {
            var width = chart.chart.width,
                height = chart.chart.height,
                ctx = chart.chart.ctx,
                type = chart.config.type;

            if (type == 'doughnut' && chart.options.enableCenterText === true) {
                var percent = Math.round((chart.config.data.datasets[0].data[0] * 100) /
                    (chart.config.data.datasets[0].data[0] +
                        chart.config.data.datasets[0].data[1]));
                var fontSize = ((height - chart.chartArea.top) / 120).toFixed(2);

                ctx.restore();
                ctx.font = fontSize + "em arial narrow";
                ctx.textBaseline = "middle";

                //Check if the legend is visible - re-adjust for left or right aligned legends
                var legendWidth = 0;
                switch (chart.legend.options.position) {
                    case 'left': legendWidth = chart.legend.right - chart.legend.left; break;
                    case 'right': legendWidth = chart.legend.left - chart.legend.right; break;
                }
                var text = (!isEmpty(chart.options.centerText)) ? chart.options.centerText : percent + "%",
                    textX = Math.round((width - ctx.measureText(text).width + legendWidth) / 2),
                    textY = (height + chart.chartArea.top) / 2;

                ctx.fillStyle = chart.config.options.defaultFontColor; //.data.datasets[0].backgroundColor[0];
                ctx.fillText(text, textX, textY);
                ctx.save();
            }
        }
    });
}

/**
 * Splits an array into multiple series and fill in missing values
 * @param {text} chartSeriesAxis    Name of key to split values on
 * @param {text} chartXAxis         Name of the dataset x-axis
 * @param {text} chartYAxis         Name of the dataset y-axis
 * @param {object} datasetArray     Array of datasets
 */
function splitAndNormalizeDataset(chartSeriesAxis, chartXAxis, chartYAxis, datasetArray) {
    const uniqueSeriesLabels = [...new Set(datasetArray[0].Data.map(r => r[chartSeriesAxis]))];
    const uniqueXLabels = [...new Set(datasetArray[0].Data.map(r => r[chartXAxis]))];
    let splitDatasetData = [];
    let valueMap = [];
    datasetArray[0].Data.forEach(r => {
        valueMap[r[chartSeriesAxis] + "\n" + r[chartXAxis]] =  r[chartYAxis];
    });
    //loop over unique series labels
    uniqueSeriesLabels.forEach(s => {
        let seriesArray = [];
     //loop over each unique set and figure out which values are missing, set them to 0
        uniqueXLabels.forEach(x => {
            let value = valueMap[s + "\n" + x];
            if (isEmpty(value))
                value = "0";
            let point = {};
            point[chartSeriesAxis] = s;
            point[chartXAxis] = x;
            point[chartYAxis] = value;
            seriesArray.push(point);
        });

        splitDatasetData.push({
            "MergeName" : s,
            "Name" : "MultiSeries_" +s,
            "Data": seriesArray,
            "StandAlone": false
        });

    });
    //replace the data;
    datasetArray = splitDatasetData;
      
    return datasetArray;
}