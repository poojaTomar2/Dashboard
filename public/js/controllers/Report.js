var chartData;
var markers = [];
var markerCluster;
var map;
var getAppliedReducerInfoData;
var jsonFilter = JSON.stringify({
    "start": 0,
    "limit": 10
});
var filterdata = {};
var filterValues = {};

function applyDashboardBatteryCharts(result) {
    result = result.data;
    coolerDashboard.gridUtils.ajaxIndicatorStop();
    if (result) {
        //===============battery Level report Chart=====================================//
        var seriesData = highChartsHelper.convertToSeries({
            seriesConfig: [{
                    name: 'Asset Count Battery Level',
                    type: 'column',
                    data: function (record) {
                        return record.assets;
                    }
                }
                // , {
                // 	name: 'Percentage(%)',
                // 	type: 'spline',
                // 	yAxis: 1,
                // 	data: function (record) {
                // 		return record.assets ? coolerDashboard.common.floatValue(((record.assets / record.total) * 100)) : 0
                // 	}
                // }
            ],
            xAxis: function (record) {
                return record.key;
            },
            data: result.batterydata
        });

        $('#BatteryLevel').highcharts({
            chart: {
                renderTo: 'BatteryLevel'
            },
            lang: {
                noData: "No data found to display",
                thousandsSep: ','
            },
            noData: {
                style: {
                    fontWeight: 'bold',
                    fontSize: '15',
                    color: 'Black',
                    textTransform: 'uppercase'
                }
            },
            title: {
                text: ''
            },
            yAxis: [{
                title: {
                    text: 'Assets'
                },
                min: 0
            }, {
                title: {
                    text: '% Assets'
                },
                labels: {
                    format: '{value}%'
                },
                opposite: true,
                min: 0
            }],
            plotOptions: {
                series: {
                    cursor: 'pointer',
                    events: {
                        click: function (event) {
                            coolerDashboard.common.onChartClick('batteryReprtData', event);
                        }
                    }
                }
            },
            xAxis: seriesData.xAxis,
            series: seriesData.series
        });

        var timerBatteryLevel = setInterval(function () {
            if (!$("#BatteryLevel").highcharts()) {
                clearInterval(timerBatteryLevel);
            } else
                $("#BatteryLevel").highcharts().reflow();
        }, 1);
        //===============Data Download By Outlet=====================================//
        var dataarray = [];
        dataarray.push({
            name: result.healthOverview[0].name,
            y: result.healthOverview[0].y,
            color: '#90EE7E'
        });
        dataarray.push({
            name: result.healthOverview[1].name,
            y: result.healthOverview[1].y,
            color: '#ff8000'
        });
        dataarray.push({
            name: result.healthOverview[2].name,
            y: result.healthOverview[2].y,
            color: '#282828'
        });
        $('#DataDownloadOutlet').highcharts({
            chart: {
                type: 'pie',
                renderTo: 'DataDownloadOutlet'
            },
            lang: {
                noData: "No data found to display",
                thousandsSep: ','
            },
            noData: {
                style: {
                    fontWeight: 'bold',
                    fontSize: '15',
                    color: 'Black',
                    textTransform: 'uppercase'
                }
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: false
                    },
                    showInLegend: true
                },
                series: {
                    cursor: 'pointer',
                    events: {
                        click: function (event) {
                            coolerDashboard.common.onChartClick('DataDownloadOutlet', event);
                        }
                    }
                }
            },
            title: {
                text: ''
            },
            series: [{
                name: 'Location%',
                colorByPoint: true,
                data: dataarray
            }]
        });

        var timerDataDownloadOutlet = setInterval(function () {
            if (!$("#DataDownloadOutlet").highcharts()) {
                clearInterval(timerDataDownloadOutlet);
            } else
                $("#DataDownloadOutlet").highcharts().reflow();
        }, 1);
        //====================Executed Command Report Chart======================//
        var seriesData = highChartsHelper.convertToSeries({
            seriesConfig: [{
                name: 'Asset Count',
                type: 'column',
                data: function (record) {
                    return record.assets;
                }
            }],
            xAxis: function (record) {
                return record.key;
            },
            data: result.executedReport
        });

        $('#ExcecuteCommandReport').highcharts({
            chart: {
                renderTo: 'ExcecuteCommandReport'
            },
            lang: {
                noData: "No data found to display",
                thousandsSep: ','
            },
            noData: {
                style: {
                    fontWeight: 'bold',
                    fontSize: '15',
                    color: 'Black',
                    textTransform: 'uppercase'
                }
            },
            title: {
                text: ''
            },
            yAxis: [{
                title: {
                    text: 'Assets'
                },
                min: 0
            }, {
                title: {
                    text: '% Assets'
                },
                labels: {
                    format: '{value}%'
                },
                opposite: true,
                min: 0
            }],
            plotOptions: {
                series: {
                    cursor: 'pointer',
                    events: {
                        click: function (event) {
                            coolerDashboard.common.onChartClick('ExcecuteCommandReport', event);
                        }
                    }
                }
            },
            xAxis: seriesData.xAxis,
            series: seriesData.series
        });

        var timerExcecuteCommandReport = setInterval(function () {
            if (!$("#ExcecuteCommandReport").highcharts()) {
                clearInterval(timerExcecuteCommandReport);
            } else
                $("#ExcecuteCommandReport").highcharts().reflow();
        }, 1);
        //============================Executed Command Spread =====================================//
        var seriesData = highChartsHelper.convertToSeries({
            seriesConfig: [{
                name: 'Percentage(%)',
                type: 'column',
                data: function (record) {
                    return record.assets ? coolerDashboard.common.floatValue(((record.assets / result.summary.smartAssetCount) * 100)) : 0
                }
            }],
            xAxis: function (record) {
                return record.key;
            },
            data: result.executedSpread
        });

        $('#ExcecuteCommandSpread').highcharts({
            chart: {
                renderTo: 'ExcecuteCommandSpread'
            },
            lang: {
                noData: "No data found to display",
                thousandsSep: ','
            },
            noData: {
                style: {
                    fontWeight: 'bold',
                    fontSize: '15',
                    color: 'Black',
                    textTransform: 'uppercase'
                }
            },
            title: {
                text: ''
            },
            yAxis: [{
                title: {
                    text: 'Assets'
                },
                min: 0
            }, {
                title: {
                    text: '% Assets'
                },
                labels: {
                    format: '{value}%'
                },
                opposite: true,
                min: 0
            }],
            plotOptions: {
                series: {
                    cursor: 'pointer',
                    events: {
                        click: function (event) {
                            coolerDashboard.common.onChartClick('ExcecuteCommandSpread', event);
                        }
                    }
                }
            },
            xAxis: seriesData.xAxis,
            series: seriesData.series
        });

        var timerExcecuteCommandSpread = setInterval(function () {
            if (!$("#ExcecuteCommandSpread").highcharts()) {
                clearInterval(timerExcecuteCommandSpread);
            } else
                $("#ExcecuteCommandSpread").highcharts().reflow();
        }, 1);
        //========================================================================//
        ResultPieChart = result.summary;
        $('#totalCustomer').html(ResultPieChart.totalCustomer);
        $('#customerSelectedKPI').html(ResultPieChart.filteredOutlets);

        setTimeout(function () {
            $('#customerSelectedPercentageKPI').data('easyPieChart').update(ResultPieChart.totalCustomer == 0 ? 0 : (ResultPieChart.filteredOutlets / ResultPieChart.totalCustomer) * 100);
        }, 50);

        $('#coolerSelectedKPI').html(ResultPieChart.filteredAssets);
        $('#smartCoolerSelectedKPI').html(ResultPieChart.smartAssetCount);

        $('#smartCoolerSelectedPercentageKPI').data('easyPieChart').update(ResultPieChart.filteredAssets == 0 ? 0 : (ResultPieChart.smartAssetCount / ResultPieChart.filteredAssets) * 100);

    }
}

function sendAjax(firstLoad) {
    if (!jQuery.isEmptyObject(this.filterValuesChart)) {
        var startDateCorrelationArr = _.filter(this.filterValuesChart, function (data) {
            return data.name == 'startDateCorrelation'
        });
        var index = jQuery.inArray(startDateCorrelationArr[0], this.filterValuesChart);
        if (index != -1) {
            this.filterValuesChart.splice(index, 1)
        }
        var endDateCorrelatioArr = _.filter(this.filterValuesChart, function (data) {
            return data.name == 'endDateCorrelation'
        });
        index = jQuery.inArray(endDateCorrelatioArr[0], this.filterValuesChart);
        if (index != -1) {
            this.filterValuesChart.splice(index, 1)
        }
    }

    if (jQuery.isEmptyObject(this.filterValuesChart)) {
        var startDate = moment().subtract(1, 'months').startOf('month');
        var endDate = moment().subtract(1, 'months').endOf('month');
        this.filterValuesChart = [];
        if (startDate && endDate) {
            this.filterValuesChart.push({
                "name": "startDate",
                "value": startDate.format('YYYY-MM-DD[T00:00:00]')
            })
            this.filterValuesChart.push({
                "name": "endDate",
                "value": endDate.format('YYYY-MM-DD[T23:59:59]')
            })
        }
    }

    this.filterValuesChart.isFromTelemetry = true;
    $('#powerHoursOffChart').spin(coolerDashboard.common.smallSpin);
    coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
    coolerDashboard.common.updateDateFilterText(this.filterValuesChart, '.timeFilterName');
    setTimeout(function () {
        coolerDashboard.common.updateAppliedFilterText(this.filterValuesChart, '.appliedFilter', '.totalFilterCount');
    }, 200);
    if (jQuery.isEmptyObject(filterValuesChart)) {
        this.filterValues = {};
        this.jsonFilter = {
            "start": 0,
            "limit": 10
        };
    }
    var filterValues = {};

    $.map(filterValuesChart, function (row) {
        if (typeof filterValues[row.name] === 'undefined') {
            filterValues[row.name] = row.value;
        } else if (typeof filterValues[row.name] === 'object') {
            filterValues[row.name].push(row.value);
        } else {
            filterValues[row.name] = [filterValues[row.name], row.value];
        }
    });
    filterdata = $.extend(filterdata, filterValues);
    this.jsonFilter = filterValues;
    //$("#assetGridFilter").DataTable().ajax.reload();
    //$("#locationGridFilter").DataTable().ajax.reload();
    var IsCTFFilter = 0;
    for (var i = 0; i < filterValuesChart.length; i++) {
        var name = filterValuesChart[i].name;
        if (name == 'telemetryDoorCount' || name == 'telemetryPowerStatus' ||
            name == 'CompressorBand' || name == 'LastDataDownloaded' ||
            name == 'coolerTracking' || name == 'FanBand' ||
            name == 'DoorOpenVsSales' || name == 'OperationalIssues' ||
            name == 'DataDownloaded' || name == 'DoorSwingsVsTarget' ||
            name == 'DataDownloadOutlet' || name == 'ExcecuteCommandReport' ||
            name == 'ExcecuteCommandSpread' || name == 'batteryReprtData' ||
            name == 'TemperatureTele' || name == 'MagnetFallenChartCTF' ||
            name == 'MagnetFallenSpreadCTF' || name == 'EvaporatorTemperatureTele' ||
            name == 'telemetryLightStatus' || name == 'TempLightIssue' ||
            name == 'installationDate' || name == 'TempLightIssue' ||
            name == 'lastDataReceived' || name == 'doorDataSelected' ||
            name == 'salesDataSelected' || name == 'CoolerHealth' ||
            name == 'DisplacementFilterHistoric' || name == 'DisplacementFilter' ||
            name == 'AlertTypeId' || name == 'PriorityId' ||
            name == 'StatusId' || name == 'UserId' || name == 'TeleSellingTerritoryId' ||
            name == 'AssetTypeCapacityId') {
            IsCTFFilter = 1;
        }
    }
    if (IsCTFFilter == 1) {
        $.ajax({
            url: coolerDashboard.common.nodeUrl('getAppliedReducerInfo'),
            data: filterValuesChart,
            type: 'POST',
            success: function (response, opts) {
                var filter = JSON.parse(JSON.stringify(filterValuesChart));
                $.ajax({
                    url: coolerDashboard.common.nodeUrl('getBatteryLevelData'),
                    data: filter,
                    type: 'POST',
                    success: function (result, data) {
                        applyDashboardBatteryCharts(result);
                    },
                    scope: this
                });
            },
            scope: this
        });
    } else {
        $.ajax({
            url: coolerDashboard.common.nodeUrl('getBatteryLevelData'),
            data: filterValuesChart,
            type: 'POST',
            success: function (result, data) {
                applyDashboardBatteryCharts(result);
            },
            scope: this
        });
    }
}

$(function () {

    coolerDashboard.gridUtils.initGridStackDynamicView();

    $("#filterFormKPI").load('views/common/filter.html');
    $("#filterSummary").load('views/common/filterSummary.html');
    //pageSetUp();
    setup_widgets_desktop_extended();

    var filterValues = {};

    var emptyData = {};
    emptyData = JSON.stringify(emptyData);
});

$("#exid").click(function () {
    $('#filterSummarySpin').spin(coolerDashboard.common.smallSpin);
    $("#assetGridFilter").DataTable().ajax.reload();
    $("#locationGridFilter").DataTable().ajax.reload();
    setTimeout(function () {
        $('#filterSummarySpin').spin(false);
    }, 10000);
});