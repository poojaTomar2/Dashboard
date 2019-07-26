var chartData;
var markers = [];
var filterValues = {};
var markerCluster;
var coolerMoves = 0;
var coolerMissing = 0;
var coolerAbove7 = 0;
var coolerAbove70 = 0;
var coolerAbove71 = 0;
var coolerAbove72 = 0;
var hoursLightOn = 0;
var hoursLightOn0 = 0;
var hoursLightOn1 = 0;
var hoursLightOn2 = 0;
var hoursPowerOn = 0;
var hoursPowerOn0 = 0;
var hoursPowerOn1 = 0;
var hoursPowerOn2 = 0;
var visitPerMonth = 0;
var salesVisitDuration = 0;
var salesVolume = 0;
var transections = 0;
var trendChart = 0;
var hourlyDoorOpen = 0;
var hourlyDoorOpen0 = 0;
var hourlyDoorOpen1 = 0;
var hourlyDoorOpen2 = 0;
var alarmRate = 0;
var locationConfirmed = 0;
var locationConfirmed0 = 0;
var locationConfirmed1 = 0;
var locationConfirmed2 = 0;
var lastDownloadLess30 = 0;
var lastDownloadLess60 = 0;
var lastDownloadLess90 = 0;
var lastDownloadGreater90 = 0;
var doorOpenDuration = 0;
var filteredAssets = 0;
var filteredOutlets = 0;
var locationConfirmedlast = 0;
var hourlyDoor = 0;
var cpiarray = [];
var map;
var controlPositionDiv;
var infoWindow = new google.maps.InfoWindow({
    content: ""
});
var jsonFilter = JSON.stringify({
    "start": 0,
    "limit": 10
});
var getAppliedReducerInfoData;

function firstDayOfMonth() {
    var d = new Date(Date.apply(null, arguments));

    d.setDate(1);
    return d.toISOString();
}

function lastDayOfMonth() {
    var d = new Date(Date.apply(null, arguments));

    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d.toISOString();
}

function applyDashboardCharts(result) {
    var ResultAlwaysOn;
    var ResultPieChart;
    result = result.data;
    if (result) {
        //operational issues chart//
        var seriesData = highChartsHelper.convertToSeries({
            seriesConfig: [{
                name: 'No Light',
                type: 'column',
                data: function (record) {
                    return record.LowLight;
                }
            }, {
                name: 'High Temperature',
                type: 'column',
                data: function (record) {
                    return record.HighTemperature;
                }
            }, {
                name: 'Power Off',
                type: 'column',
                lineWidth: 0,
                data: function (record) {
                    return record.PowerOff;
                }
            }],
            xAxis: function (record) {
                return record.Range;
            },
            data: result.operationalIssues
        });

        var operationalIssues = new Highcharts.Chart({
            chart: {
                renderTo: 'operationalIssues',
                type: 'column'
            },
            title: {
                text: ''
            },
            xAxis: seriesData.xAxis,
            yAxis: {
                min: 0,
                title: {
                    text: 'Coolers'
                }
            },
            boostThreshold: 500,
            tooltip: {
                headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                    '<td style="padding:0"><b>{point.y:.0f}</b></td></tr>',
                footerFormat: '</table>',
                shared: true,
                useHTML: true
            },
            events: {
                renderedCanvas: function () {
                    console.timeEnd('asyncRender');
                }
            },
            plotOptions: {
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0
                },
                series: {
                    cursor: 'pointer',
                    events: {
                        click: function (event) {
                            coolerDashboard.common.onChartClick('OperationalIssues', event);
                        }
                    }
                }
            },
            series: seriesData.series
        });

        var timeroperationalIssues = setInterval(function () {
            if (!$("#operationalIssues").highcharts()) {
                clearInterval(timeroperationalIssues);
            } else
                $("#operationalIssues").highcharts().reflow();
        }, 1);

        filteredOutlets = result.summary.filteredOutlets;

        ResultPieChart = result.summary;
        $('#totalCustomer').html(ResultPieChart.totalCustomer);
        $('#customerSelectedKPI').html(ResultPieChart.filteredOutlets);
        setTimeout(function () {
            $('#customerSelectedPercentageKPI').data('easyPieChart').update(ResultPieChart.totalCustomer == 0 ? 0 : (ResultPieChart.filteredOutlets / ResultPieChart.totalCustomer) * 100);
        }, 50);
        $('#coolerSelectedKPI').html(ResultPieChart.totalCooler);
        $('#smartCoolerSelectedKPI').html(ResultPieChart.smartAssetCount);
        setTimeout(function () {
            $('#smartCoolerSelectedPercentageKPI').data('easyPieChart').update(ResultPieChart.filteredAssets == 0 ? 0 : (ResultPieChart.smartAssetCount / ResultPieChart.totalCooler) * 100);
        }, 50);
        //=for cooler tarcking always on chart================//
        ResultAlwaysOn = result.summary;
        $('#CoolerTrackingChartAlwaysOn').spin(false);
        $('#CoolerTrackingChartProximity').spin(false);
        var dataarray = [];
        var thershold = JSON.parse(LZString.decompressFromUTF16(localStorage.data)).data.tags.CoolerTrackingThreshold;
        var numberthershold = Number(thershold);
        dataarray.push({
            name: 'Not Transmitting  (Over' + numberthershold + 'Days)',
            y: ResultAlwaysOn.AlwaysNotTransmitting,
            color: '#D54F4F'
        });
        dataarray.push({
            name: 'Wrong Location (Under' + numberthershold + 'Days)',
            y: ResultAlwaysOn.AlwaysWrongLocation,
            color: '#FFC90E'
        });
        dataarray.push({
            name: 'Location as expected (Under' + numberthershold + 'Days)',
            y: ResultAlwaysOn.AlwaysLocationAsExpected,
            color: '#55BF3B'
        });

        if (dataarray[0].y == 0 && dataarray[1].y == 0 && dataarray[2].y == 0) {
            dataarray = [];
        }
        var CoolerTrackingChartAlwaysOn = new Highcharts.chart('CoolerTrackingChartAlwaysOn', {
            chart: {
                type: 'pie'
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
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: false
                    },
                    showInLegend: true
                }
            },
            series: [{
                name: 'Assets',
                colorByPoint: true,
                data: dataarray,
                cursor: 'pointer',
                point: {
                    events: {
                        click: function (event) {
                            coolerDashboard.common.onChartClick('CoolerTracking', event);
                        }
                    }

                }
            }]
        });

        var timerCoolerTrackingChartAlwaysOn = setInterval(function () {
            if (!$("#CoolerTrackingChartAlwaysOn").highcharts()) {
                clearInterval(timerCoolerTrackingChartAlwaysOn);
            } else
                $("#CoolerTrackingChartAlwaysOn").highcharts().reflow();
        }, 1);

        //==================door swing vs data===========================//

        var doorSwingTargetnew = new Highcharts.chart('doorSwingTargetnew', {
            chart: {
                type: 'pie'
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
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: false
                    },
                    showInLegend: true
                }
            },
            series: [{
                name: 'Outlets',
                colorByPoint: true,
                data: result.DoorSwing,
                cursor: 'pointer',
                point: {
                    events: {
                        click: function (event) {
                            coolerDashboard.common.onChartClick('DoorSwingsVsTarget', event);
                        }
                    }

                }
            }]
        });

        var timerdoorSwingTargetnew = setInterval(function () {
            if (!$("#doorSwingTargetnew").highcharts()) {
                clearInterval(timerdoorSwingTargetnew);
            } else
                $("#doorSwingTargetnew").highcharts().reflow();
        }, 1);

        //=chart for last data downlaod-------------.//
        $('#lastDataDownloaded').spin(false);
        $('#locationTracking').spin(false);

        var lastDataDownloaded = new Highcharts.Chart({
            chart: {
                type: 'bar',
                renderTo: 'lastDataDownloaded'
            },
            title: {
                text: ''
            },
            exporting: {
                enabled: false
            },
            xAxis: {
                categories: ['Last Data Downloaded'],
                lineWidth: 0,
                minorGridLineWidth: 0,
                lineColor: 'transparent',
                labels: {
                    enabled: false
                },
                minorTickLength: 0,
                tickLength: 0
            },
            yAxis: {
                min: 0,
                title: {
                    text: ''
                },
                lineWidth: 0,
                minorGridLineWidth: 0,
                lineColor: 'transparent',
                labels: {
                    enabled: false
                },
                minorTickLength: 0,
                tickLength: 0,
                visible: false
            },
            legend: {
                reversed: true
            },
            plotOptions: {
                series: {
                    stacking: 'normal',
                    cursor: 'pointer',
                    events: {
                        click: function (event) {
                            coolerDashboard.common.onChartClick('LastDataDownloaded', event);
                        }
                    }
                }
            },
            boostThreshold: 500,
            events: {
                renderedCanvas: function () {
                    console.timeEnd('asyncRender');
                }
            },
            series: result.lastDataDownloaded,
        });

        //======for data download chart============//
        var locationTracking = new Highcharts.Chart({
            chart: {
                type: 'pie',
                renderTo: 'locationTracking',
                events: {
                    load: function () {
                        var timefilter = $('.timeFilterName').text();
                        var label = this.renderer.label("Time Period :" + timefilter)
                            .css({
                                width: '400px',
                                fontSize: '9px',
                                fontStyle: 'italic'
                            })
                            .add();

                        label.align(Highcharts.extend(label.getBBox(), {
                            align: 'center',
                            x: -10, // offset
                            verticalAlign: 'bottom',
                            y: 0 // offset
                        }), null, 'spacingBox');
                    }
                }
            },
            legend: {
                y: -20
            },
            title: {
                text: ''
            },
            tooltip: {
                headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}:&nbsp; </td>' +
                    '<td style="padding:0"><b>{point.x:.0f}</b></td></tr>',
                footerFormat: '</table>',
                shared: true,
                useHTML: true

            },
            boostThreshold: 500,
            events: {
                renderedCanvas: function () {
                    console.timeEnd('asyncRender');
                }
            },
            plotOptions: {
                series: {
                    cursor: 'pointer',
                    events: {
                        click: function (event) {
                            coolerDashboard.common.onChartClick('DataDownloaded', event);
                        }
                    }
                },
                pie: {
                    innerSize: 100,
                    depth: 45,
                    showInLegend: true,
                    dataLabels: {
                        enabled: true,
                        distance: -25,
                        format: '{point.percentage: .0f}%',
                        style: {
                            color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                        },
                        formatter: function () {
                            return Highcharts.numberFormat(this.y, 2);
                        }
                    }
                }
            },
            series: [{
                name: 'Assets',
                data: result.locationTracking
            }]
        });

        var timerlocationTracking = setInterval(function () {
            if (!$("#locationTracking").highcharts()) {
                clearInterval(timerlocationTracking);
            } else
                $("#locationTracking").highcharts().reflow();
        }, 1);


        result = result.summary;
    }
}

function getCPIdata(result) {
    coolerDashboard.gridUtils.ajaxIndicatorStop();
    result = result.data;
    if (result) {
        result = result.summary;
        //for right temp avg daily
        coolerAbove7 = result.hoursCorrectTemperatureCPI;
        coolerAbove7 = (coolerAbove7 > 24 ? 24 : coolerAbove7);
        $('#hoursCoolerAbove7').data('easyPieChart').update((coolerAbove7 / 24) * 100); //divide by minute in day

        //for hours light on avg daily
        hoursPowerOn = result.powerOpenHourCPI;
        hoursPowerOn = (hoursPowerOn > 24 ? 24 : hoursPowerOn);
        $('#hoursPowerOn').data('easyPieChart').update((hoursPowerOn / 24) * 100);

        //for hours light on 
        hoursLightOn = result.lightOpenHourCPI;
        hoursLightOn = (hoursLightOn ? hoursLightOn : 0);
        hoursLightOn = hoursLightOn > 100 ? 100 : hoursLightOn;
        $('#hoursLightOn').data('easyPieChart').update((hoursLightOn / 24) * 100); //divide by minute in day

        //for data download
        locationConfirmed = result.dataDownloadedCPI;
        locationConfirmedlast = (Math.round(locationConfirmed)) > 100 ? 100 : (Math.round(locationConfirmed));
        $('#locationConfirmed').data('easyPieChart').update(locationConfirmedlast);

        // for door open avg daily
        hourlyDoorOpen = result.doorOpenRateCPI;
        hourlyDoor = Math.round(hourlyDoorOpen);
        $('#hourlyDoorOpen').data('easyPieChart').update(hourlyDoor);

        LocationMapAll = result.LocationMapAll;

        //=============for CPI===========================//
        for (var i = cpiarray.length; i > 0; i--) {
            cpiarray.pop();
        }
        if (isNaN(result.doorOpenRateCPI)) {
            result.doorOpenRateCPI = 0;
        }
        if (isNaN(result.doorOpenRatePre)) {
            result.doorOpenRatePre = 0;
        }
        if (isNaN(result.doorOpenRateBack)) {
            result.doorOpenRateBack = 0;
        }
        var hourlyDoorOpenCpi = hourlyDoor;
        var dataDownloadedCur = locationConfirmedlast;
        var hoursPowerOnCpi = result.powerOpenHourCPI == null || isNaN(result.powerOpenHourCPI) ? 0 : Math.round(Number(result.powerOpenHourCPI));
        var hoursLightOnCpi = result.lightOpenHourCPI == null || isNaN(result.lightOpenHourCPI) ? 0 : Math.round(Number(result.lightOpenHourCPI));
        var coolerAbove7Cpi = result.hoursCorrectTemperatureCPI == null || isNaN(result.hoursCorrectTemperatureCPI) ? 0 : Math.round(Number(result.hoursCorrectTemperatureCPI));

        var currentData = Math.round(((result.doorOpenRateCPI / 48) * 40 + (dataDownloadedCur / 100) * 24 + (hoursPowerOnCpi / 24) * 12 + (hoursLightOnCpi / 24) * 12 + (coolerAbove7Cpi / 24) * 12).toFixed(2));

        var hourlyDoorOpenCpi = result.doorOpenRatePre;
        var dataDownloadedPre = (Math.round(result.dataDownloadedPre)) > 100 ? 100 : (Math.round(result.dataDownloadedPre));
        var hoursPowerOnCpi = result.powerOpenHourPre == null || isNaN(result.powerOpenHourPre) ? 0 : Math.round(Number(result.powerOpenHourPre));
        var hoursLightOnCpi = result.lightOpenHourPre == null || isNaN(result.lightOpenHourPre) ? 0 : Math.round(Number(result.lightOpenHourPre));
        var coolerAbove7Cpi = result.hoursCorrectTemperaturePre == null || isNaN(result.hoursCorrectTemperaturePre) ? 0 : Math.round(Number(result.hoursCorrectTemperaturePre));
        var previousData = Math.round(((hourlyDoorOpenCpi / 48) * 40 + (dataDownloadedPre / 100) * 24 + (hoursPowerOnCpi / 24) * 12 + (hoursLightOnCpi / 24) * 12 + (coolerAbove7Cpi / 24) * 12).toFixed(2));

        var hourlyDoorOpenCpi = result.doorOpenRateBack;

        var dataDownloadedBack = (Math.round(result.dataDownloadedBack)) > 100 ? 100 : (Math.round(result.dataDownloadedBack));
        var hoursPowerOnCpi = result.powerOpenHourBack == null || isNaN(result.powerOpenHourBack) ? 0 : Math.round(Number(result.powerOpenHourBack));
        var hoursLightOnCpi = result.lightOpenHourBack == null || isNaN(result.lightOpenHourBack) ? 0 : Math.round(Number(result.lightOpenHourBack));
        var coolerAbove7Cpi = result.hoursCorrectTemperatureBack == null || isNaN(result.hoursCorrectTemperatureBack) ? 0 : Math.round(Number(result.hoursCorrectTemperatureBack));
        var TwoMonthBack = Math.round(((hourlyDoorOpenCpi / 48) * 40 + (dataDownloadedBack / 100) * 24 + (hoursPowerOnCpi / 24) * 12 + (hoursLightOnCpi / 24) * 12 + (coolerAbove7Cpi / 24) * 12).toFixed(2));

        TwoMonthBack = TwoMonthBack > 100 ? 100 : TwoMonthBack;
        previousData = previousData > 100 ? 100 : previousData;
        currentData = currentData > 100 ? 100 : currentData;
        cpiarray.push({
            value: TwoMonthBack,
            Month: result.previousMonth2
        });

        cpiarray.push({
            value: previousData,
            Month: result.previousMonth
        });

        cpiarray.push({
            value: currentData,
            Month: result.EventDate
        });
        var seriesData = highChartsHelper.convertToSeries({
            seriesConfig: [{
                name: 'CPI',
                showInLegend: false,
                data: function (record) {
                    return record.value;
                }
            }],
            xAxis: function (record) {
                return record.Month;
            },
            data: cpiarray
        });
        $('#temperatureAsset').highcharts({
            chart: {
                type: 'line',
                renderTo: 'temperatureAsset'
            },
            exporting: {
                enabled: false
            },
            title: {
                text: ''
            },

            yAxis: {
                title: {
                    text: 'CPI'
                }
            },
            xAxis: seriesData.xAxis,
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle'
            },
            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: true
                    },
                    enableMouseTracking: false
                }
            },
            series: seriesData.series
        });

        var timertemperatureAsset = setInterval(function () {
            if (!$("#temperatureAsset").highcharts()) {
                clearInterval(timertemperatureAsset);
            } else
                $("#temperatureAsset").highcharts().reflow();
        }, 1);

        $('#temperatureAssetSpin').spin(false);
        $('#coolerPerformanceIndexSpin').spin(false);
        //---------------------------------------------------------------------------------------------//
        //for cooler performance index

        var hourlyDoorOpenCpi = hourlyDoor;
        var dataDownloadedCur = locationConfirmedlast;
        var hoursPowerOnCpi = hoursPowerOn;
        var hoursLightOnCpi = hoursLightOn;
        var coolerAbove7Cpi = coolerAbove7;
        var resultCPI = [{
            "Value": currentData
        }];


        resultCPI[0].Value = resultCPI[0].Value > 100 ? 100 : resultCPI[0].Value;
        var seriesData = highChartsHelper.convertToSeries({
            seriesConfig: [{
                yAxis: 0,
                name: 'Cooler Performance Index',
                dataLabels: {
                    format: '<div style="text-align:center"><span style="font-size:18px;color:' +
                        ((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y}</span><br/>' +
                        '<span style="font-size:12px;color:silver"></span></div>'
                },
                data: function (record) {
                    return Number(resultCPI[0].Value);
                }
            }],
            data: resultCPI
        });

        $('#coolerPerformanceIndex').highcharts({
            chart: {
                renderTo: 'coolerPerformanceIndex',
                type: 'solidgauge'
            },
            exporting: {
                enabled: false
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
            pane: {
                center: ['50%', '85%'],
                size: '100%',
                startAngle: -90,
                endAngle: 90,
                background: {
                    backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || '#EEE',
                    innerRadius: '60%',
                    outerRadius: '100%',
                    shape: 'arc'
                }
            },
            title: {
                text: ''
            },
            yAxis: {
                stops: [
                    [0.1, '#55BF3B'], // green
                    [0.5, '#DDDF0D'], // yellow
                    [0.9, '#DF5353'] // red
                ],
                lineWidth: 0,
                minorTickInterval: null,
                tickAmount: 2,
                min: 0,
                max: 100,
                labels: {
                    y: 16
                }
            },
            plotOptions: {
                solidgauge: {
                    dataLabels: {
                        y: 5,
                        borderWidth: 0,
                        useHTML: true
                    }
                }
            },
            series: seriesData.series
        });
    }
}

function applyMapPlotFirst(result) {
    result = result.data;
    if (result) {
        result = result.summary;
        LocationMapAll = result.LocationMapAll;
    }
    $('#resetMap').click(function () {
        $('#resetMap').addClass('hidden');
        defaultMapReload();
    });

    defaultMapReload();

    function defaultMapReload() {

        $('#mapName').html('Locations');
        mapSpinnerShow();
        var locationsData = [];
        var classification = [];
        var randomColor = "";

        for (var i = 0, len = LocationMapAll.length; i < len; i++) {
            var rec = LocationMapAll[i];
            var latitude = rec.LocationGeo.lat;
            var longitude = rec.LocationGeo.lon;

            locationsData.push({
                "Latitude": latitude,
                "Longitude": longitude,
                "Tier": rec.Classification ? rec.Classification : "NoTier",
                "Name": rec.Name,
                "Id": rec.Id,
                "LocationCode": rec.LocationCode,
                "LastData": rec.LastData ? rec.LastData : "No Data"
            })
        }

        setTimeout(function () {
            google.charts.load('current', {
                'callback': function () {
                    addMapMarkers(locationsData, 'LastData');
                    mapSpinnerHide();
                    return true
                },
                'packages': ['corechart']
            }, {
                packages: ['corechart']
            });
        }, 200);
    }
}

$('#mapClickLastDataDownloaded').click(function (event) {
    coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
    var filter = JSON.parse(JSON.stringify(filterValuesChart));
    mapSpinnerShow();
    mapMessageHide();
    $.ajax({
        url: coolerDashboard.common.nodeUrl('getMapAssetForLastDataDownload'),
        data: filter,
        type: 'POST',
        success: function (result, data) {
            result = result.data;
            if (result) {
                coolerDashboard.gridUtils.ajaxIndicatorStop();
                coolerDashboard.gridUtils.ajaxIndicatorStart('Ploating Points.. Please Wait..');
                result = result.summary;
                //========map for last downlaod chart======================//
                locationDataLastdataDownloaded = result.locationDataLastdataDownloaded;
                if (locationDataLastdataDownloaded && locationDataLastdataDownloaded.length == 0) {
                    $('#mapClickLastDataDownloaded').addClass('disabled');
                    $('#mapName').html('Last Data Downloaded (All Latitude and Longitude are Zero)');
                } else {
                    $('#mapClickLastDataDownloaded').removeClass('disabled');
                    $('#mapName').html('Last Data Downloaded');
                }


                event.preventDefault();
                $('#resetMap').removeClass('hidden');
                locationsData = [];
                for (var i = 0, len = locationDataLastdataDownloaded.length; i < len; i++) {
                    var rec = locationDataLastdataDownloaded[i];
                    var latitude = rec.LocationGeo.lat;
                    var longitude = rec.LocationGeo.lon;

                    locationsData.push({
                        "Latitude": latitude,
                        "Longitude": longitude,
                        "Tier": rec.Classification ? rec.Classification : "NoTier",
                        "Name": rec.Name,
                        "Id": rec.Id,
                        "LocationCode": rec.LocationCode,
                        "LastDataDownload": rec.LastDataDownload ? rec.LastDataDownload : "No Data"
                    })
                }

                setTimeout(function () {
                    google.charts.load('current', {
                        'callback': function () {
                            addMapMarkers(locationsData, 'LastDataDownload');
                            mapSpinnerHide();
                            coolerDashboard.gridUtils.ajaxIndicatorStop();
                            return true
                        },
                        'packages': ['corechart']
                    }, {
                        packages: ['corechart']
                    });
                }, 200);
            }
        },
        scope: this
    });
});

$('#mapClickLocationTracking').click(function (event) {
    coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
    var filter = JSON.parse(JSON.stringify(filterValuesChart));
    mapMessageHide();
    $.ajax({
        url: coolerDashboard.common.nodeUrl('getMapAssetForDataDownload'),
        data: filter,
        type: 'POST',
        success: function (result, data) {
            result = result.data;
            if (result) {
                result = result.summary;
                //========map for last downlaod chart======================//
                locationMapDataDownload = result.locationMapDataDownload;
                if (locationMapDataDownload && locationMapDataDownload.length == 0) {
                    $('#mapClickLocationTracking').addClass('disabled');
                    $('#mapName').html('Data Downloaded (All Latitude and Longitude are Zero)');
                } else {
                    $('#mapClickLocationTracking').removeClass('disabled');
                    $('#mapName').html('Data Downloaded');
                }

                mapSpinnerShow();
                event.preventDefault();
                $('#resetMap').removeClass('hidden');
                locationsData = [];
                for (var i = 0, len = locationMapDataDownload.length; i < len; i++) {
                    var rec = locationMapDataDownload[i];
                    var latitude = rec.LocationGeo.lat;
                    var longitude = rec.LocationGeo.lon;

                    locationsData.push({
                        "Latitude": latitude,
                        "Longitude": longitude,
                        "Tier": rec.Classification ? rec.Classification : "NoTier",
                        "Name": rec.Name,
                        "Id": rec.Id,
                        "LocationCode": rec.LocationCode,
                        "DataDownload": rec.DataDownload ? rec.DataDownload : "No Data"
                    })
                }

                setTimeout(function () {
                    google.charts.load('current', {
                        'callback': function () {
                            addMapMarkers(locationsData, 'DataDownload');
                            mapSpinnerHide();
                            coolerDashboard.gridUtils.ajaxIndicatorStop();
                            return true
                        },
                        'packages': ['corechart']
                    }, {
                        packages: ['corechart']
                    });
                }, 200);
            }
        },
        scope: this
    });
});

$('#mapClickCoolerTrackingAlways').click(function (event) {
    coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
    var filter = JSON.parse(JSON.stringify(filterValuesChart));
    mapSpinnerShow();
    mapMessageHide();
    $.ajax({
        url: coolerDashboard.common.nodeUrl('getMapAssetForCoolerTrackingAlwaysOn'),
        data: filter,
        type: 'POST',
        success: function (result, data) {
            result = result.data;
            if (result) {
                result = result.summary;

                CoolerTrackingMapLocation = result.CoolerTrackingMapLocation;
                if (CoolerTrackingMapLocation && CoolerTrackingMapLocation.length == 0) {
                    $('#mapClickCoolerTrackingAlways').addClass('disabled');
                    $('#mapName').html('Cooler Tracking Always On (All Latitude and Longitude are Zero)');
                } else {
                    $('#mapClickCoolerTrackingAlways').removeClass('disabled');
                    $('#mapName').html('Cooler Tracking Always On');
                }

                event.preventDefault();
                $('#resetMap').removeClass('hidden');
                locationsData = [];
                for (var i = 0, len = CoolerTrackingMapLocation.length; i < len; i++) {
                    var rec = CoolerTrackingMapLocation[i];
                    var latitude = rec.LocationGeo.lat;
                    var longitude = rec.LocationGeo.lon;

                    locationsData.push({
                        "Latitude": latitude,
                        "Longitude": longitude,
                        "Tier": rec.Classification ? rec.Classification : "NoTier",
                        "Name": rec.Name,
                        "Id": rec.Id,
                        "LocationCode": rec.LocationCode,
                        "BandTracking": rec.Band ? rec.Band : "No Data"
                    })
                }

                setTimeout(function () {
                    google.charts.load('current', {
                        'callback': function () {
                            addMapMarkers(locationsData, 'BandTracking');
                            mapSpinnerHide();
                            coolerDashboard.gridUtils.ajaxIndicatorStop();
                            return true
                        },
                        'packages': ['corechart']
                    }, {
                        packages: ['corechart']
                    });
                }, 200);
            }
        },
        scope: this
    });
});

$('#mapClickOperational').click(function (event) {
    coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
    var filter = JSON.parse(JSON.stringify(filterValuesChart));
    mapSpinnerShow();
    mapMessageHide();
    $.ajax({
        url: coolerDashboard.common.nodeUrl('getMapLocationForOperationalIssues'),
        data: filter,
        type: 'POST',
        success: function (result, data) {
            result = result.data;
            if (result) {
                result = result.summary;

                locationDataMapOperationIssues = result.locationDataMapOperationIssues;
                if (locationDataMapOperationIssues && locationDataMapOperationIssues.length == 0) {
                    $('#mapClickOperational').addClass('disabled');
                } else {
                    $('#mapClickOperational').removeClass('disabled');
                }
                $('#mapName').html('Operational Issues');

                event.preventDefault();
                $('#resetMap').removeClass('hidden');
                locationsData = [];
                for (var i = 0, len = locationDataMapOperationIssues.length; i < len; i++) {
                    var rec = locationDataMapOperationIssues[i];
                    var latitude = rec.LocationGeo.lat;
                    var longitude = rec.LocationGeo.lon;

                    locationsData.push({
                        "Latitude": latitude,
                        "Longitude": longitude,
                        "Tier": rec.Classification ? rec.Classification : "NoTier",
                        "Name": rec.Name,
                        "Id": rec.Id,
                        "LocationCode": rec.LocationCode,
                        "OperationalIssue": rec.OperationalIssue ? rec.OperationalIssue : "No Data"
                    })
                }

                setTimeout(function () {
                    google.charts.load('current', {
                        'callback': function () {
                            addMapMarkers(locationsData, 'OperationalIssue');
                            mapSpinnerHide();
                            coolerDashboard.gridUtils.ajaxIndicatorStop();
                            return true
                        },
                        'packages': ['corechart']
                    }, {
                        packages: ['corechart']
                    });
                }, 200);
            }
        },
        scope: this
    });
});

$('#mapClickDoorSwing').click(function (event) {
    coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
    var filter = JSON.parse(JSON.stringify(filterValuesChart));
    mapSpinnerShow();
    mapMessageHide();
    $.ajax({
        url: coolerDashboard.common.nodeUrl('getMapLocationForDoorSwing'),
        data: filter,
        type: 'POST',
        success: function (result, data) {
            result = result.data;
            if (result) {
                result = result.summary;
                locationDataMapDoorSwing = result.locationDataMapDoorSwing;
                if (locationDataMapDoorSwing && locationDataMapDoorSwing.length == 0) {
                    $('#mapClickDoorSwing').addClass('disabled');
                } else {
                    $('#mapClickDoorSwing').removeClass('disabled');
                }
                $('#mapName').html('Door Swings vs Target');
                event.preventDefault();
                $('#resetMap').removeClass('hidden');
                locationsData = [];
                for (var i = 0, len = locationDataMapDoorSwing.length; i < len; i++) {
                    var rec = locationDataMapDoorSwing[i];
                    var latitude = rec.LocationGeo.lat;
                    var longitude = rec.LocationGeo.lon;

                    locationsData.push({
                        "Latitude": latitude,
                        "Longitude": longitude,
                        "Tier": rec.Classification ? rec.Classification : "NoTier",
                        "Name": rec.Name,
                        "Id": rec.Id,
                        "LocationCode": rec.LocationCode,
                        "DoorSwing": rec.DoorSwing ? rec.DoorSwing : "No Data"
                    })
                }

                setTimeout(function () {
                    google.charts.load('current', {
                        'callback': function () {
                            addMapMarkers(locationsData, 'DoorSwing');
                            mapSpinnerHide();
                            coolerDashboard.gridUtils.ajaxIndicatorStop();
                            return true
                        },
                        'packages': ['corechart']
                    }, {
                        packages: ['corechart']
                    });
                }, 200);
            }
        },
        scope: this
    });
});

function addMapMarkers(locationData, target) {
    var markers = [];
    var latLngBounds = new google.maps.LatLngBounds();
    var oms = new OverlappingMarkerSpiderfier(map, {
        keepSpiderfied: true,
        nearbyDistance: 20,
        circleSpiralSwitchover: 0,
        legWeight: 2
    });
    for (var i = locationData.length; i--;) {
        var rec = locationData[i];
        var latitude = rec.Latitude;
        var longitude = rec.Longitude,
            position = new google.maps.LatLng(latitude, longitude);
        latLngBounds.extend(position);

        var marker = new google.maps.Marker({
            position: position,
            title: (target == 'LastData') ? rec.LastData : (target == 'DoorSwing') ? rec.DoorSwing : (target == 'OperationalIssue') ? rec.OperationalIssue : (target == 'BandTracking') ? rec.BandTracking : (target == 'DataDownload') ? rec.DataDownload : (target == 'LastDataDownload') ? rec.LastDataDownload : rec.Utilization
        });
        markers.push(marker);
        if (rec) {
            oms.addMarker(marker);
            if (target == 'LastDataDownload' || target == 'DataDownload' || target == 'BandTracking' || target == 'OperationalIssue') {
                coolerDashboard.common.attachMarkerListener(infoWindow, marker, rec, map, true);
            } else {
                coolerDashboard.common.attachMarkerListener(infoWindow, marker, rec, map);
            }
        }
    }

    if (this.markerCluster) {
        this.markerCluster.clearMarkers();
    }
    if (target == 'LastData') {
        var opt = {
            "legend": {
                "Locations": "#df5353",
            }
        }
    } else if (target == 'LastDataDownload') {
        var opt = {
            "legend": {
                "No data for more than 90 days": "#333333",
                "Last data > 60, <90 days": "#df5353",
                "Last data > 30, <60 days": "#fff589",
                "Last data <= 30": "#55bf3b"
            }
        };
    } else if (target == 'DataDownload') {
        var opt = {
            "legend": {
                "Data Downloaded": "#6ED854",
                "Data Not Downloaded": "#df5353"
            }
        };
    } else if (target == 'BandTracking') {
        var opt = {
            "legend": {
                "Not Transmitting": "#EE6868",
                "Wrong Location": "#FFC90E",
                "Location as expected": "#3BCA65"
            }
        };
    } else if (target == 'OperationalIssue') {
        var opt = {
            "legend": {
                "No Light": "#2b908f",
                "High Temperature": "#90ee7e",
                "Power Off": "#f45b5b"
            }
        }
    } else if (target == 'DoorSwing') {
        var opt = {
            "legend": {
                "A": "#5D883F",
                "B": "#70AD47",
                "C": "#FFC000",
                "D": "#ED7D31",
                "E": "#DF5353"
            }
        };
    }

    this.markerCluster = new MarkerClustererTier(map, markers, opt);

    // if (!this.markerCluster) {
    //     var markerCluster = new MarkerClusterer(map, markers, {
    //         zoomOnClick: true,
    //         maxZoom: 12,
    //         averageCenter: true,
    //         imagePath: 'img/map/m'
    //     });
    //     this.markerCluster = markerCluster;
    // } else {
    //     this.markerCluster.addMarkers(markers);
    // }

    if (map) {
        map.fitBounds(latLngBounds);
        var center = map.getCenter();
        map.setZoom(2);
        map.setCenter(center);
        google.maps.event.trigger(map, 'resize');
    }
}

function cpiIndexMonthFilter(monthIndex) {
    var filters = JSON.parse(JSON.stringify(filterValuesChart));
    var length = filters.length;

    filters = $.map(filters, function (v, i) {
        return v.name === "quarter" ? null : v;
    });
    filters = $.map(filters, function (v, i) {
        return v.name === "month" ? null : v;
    });
    filters = $.map(filters, function (v, i) {
        return v.name === "yearWeek" ? null : v;
    });
    filters = $.map(filters, function (v, i) {
        return v.name === "dayOfWeek" ? null : v;
    });

    if (length == filters.length) {

        filters.forEach(function (value) {
            if (value.name == "startDate") {
                if (monthIndex == 0) {
                    value.value = moment(endDate).startOf('month').format('YYYY-MM-DD[T00:00:00]');
                } else if (monthIndex == 1) {
                    value.value = moment(endDate).subtract(1, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
                } else {
                    value.value = moment(endDate).subtract(2, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
                }
                console.log('index-' + monthIndex + "- " + value.value.toString());
            }
            if (value.name == "endDate") {
                if (monthIndex == 0) {
                    //if (moment(endDate).isAfter(moment())) {
                    if (endDate.month() == moment().month()) {
                        value.value = moment().format('YYYY-MM-DD[T23:59:59]');
                    } else {
                        value.value = moment(endDate).endOf('month').format('YYYY-MM-DD[T23:59:59]');
                    }
                } else if (monthIndex == 1) {
                    value.value = moment(endDate).subtract(1, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');
                } else {
                    value.value = moment(endDate).subtract(2, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');
                }
                console.log('index-' + monthIndex + "- " + value.value.toString());

            }
        });
    } else {

        filters = $.map(filters, function (v, i) {
            return v.name === "startDate" ? null : v;
        });
        filters = $.map(filters, function (v, i) {
            return v.name === "endDate" ? null : v;
        });
        if (monthIndex == 0) {

            filters.push({
                name: 'startDate',
                value: moment().startOf('month').format('YYYY-MM-DD[T00:00:00]')
            });
            filters.push({
                name: 'endDate',
                value: moment().format('YYYY-MM-DD[T23:59:59]')
            })
        } else if (monthIndex == 1) {
            filters.push({
                name: 'startDate',
                value: moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]')
            });
            filters.push({
                name: 'endDate',
                value: moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]')
            })
        } else {
            filters.push({
                name: 'startDate',
                value: moment().subtract(2, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]')
            });
            filters.push({
                name: 'endDate',
                value: moment().subtract(2, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]')
            })
        }
    }
    return filters;
}

function sendAjax(firstLoad) {
    coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
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

    coolerDashboard.common.updateDateFilterText(this.filterValuesChart, '.timeFilterName');

    coolerDashboard.common.updateAppliedFilterText(this.filterValuesChart, '.appliedFilter', '.totalFilterCount', '#ctf-list', '.totalCTFCount');

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
    this.jsonFilter = filterValues;
    // $("#assetGridFilter").DataTable().ajax.reload();
    // $("#locationGridFilter").DataTable().ajax.reload();
    $("#locationGridPerformance").DataTable().ajax.reload();
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
            name == 'StatusId' || name == 'UserId' || name == 'TeleSellingTerritoryId') {
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
                    url: coolerDashboard.common.nodeUrl('getKpiWidgetDataForCoolerPerformance'),
                    data: filter,
                    type: 'POST',
                    success: function (result, data) {
                        applyDashboardCharts(result);
                        var userObj = JSON.parse(LZString.decompressFromUTF16(localStorage.data));
                        var role = userObj && userObj.data.roles && userObj.data.roles.length > 0 && userObj.data.roles[0].Role ? userObj.data.roles[0].Role : '';
                        if (role == 'Client Admin' || role == 'Support ClientAdmin') {
                            // $('#mapName').html('<b style="color:red">Locations not load for client admin</b>');
                            var mapTextName = $('#mapName').text();
                            if (mapTextName != 'Location') {
                                loadDefaultMap();
                            }
                            if (controlPositionDiv) {
                                controlPositionDiv.remove();
                            }
                            var customTitle = document.createElement('h4');
                            customTitle.style.color = 'red';
                            customTitle.innerHTML = 'Locations currently unavailable for Client Admin account';
                            controlPositionDiv = document.createElement('div');
                            controlPositionDiv.appendChild(customTitle);
                            map.controls[google.maps.ControlPosition.CENTER].push(controlPositionDiv);
                        } else {
                            $.ajax({
                                url: coolerDashboard.common.nodeUrl('getLocationsFirstLoadCoolerPerformance'),
                                data: filter,
                                type: 'POST',
                                success: function (result, data) {
                                    applyMapPlotFirst(result);
                                },
                                scope: this
                            });
                        }
                        $.ajax({
                            url: coolerDashboard.common.nodeUrl('getCPIdata'),
                            data: filter,
                            type: 'POST',
                            success: function (result, data) {
                                getCPIdata(result);
                            },
                            failure: function (response, opts) {},
                            scope: this
                        });
                    },
                    scope: this
                });
            },
            scope: this
        });
    } else {
        $.ajax({
            url: coolerDashboard.common.nodeUrl('getKpiWidgetDataForCoolerPerformance'),
            data: filterValuesChart,
            type: 'POST',
            success: function (result, data) {
                applyDashboardCharts(result);
                var userObj = JSON.parse(LZString.decompressFromUTF16(localStorage.data));
                var role = userObj && userObj.data.roles && userObj.data.roles.length > 0 && userObj.data.roles[0].Role ? userObj.data.roles[0].Role : '';
                if (role == 'Client Admin' || role == 'Support ClientAdmin') {
                    // $('#mapName').html('<b style="color:red">Locations not load for client admin</b>');
                    var mapTextName = $('#mapName').text();
                    if (mapTextName != 'Location') {
                        loadDefaultMap();
                    }
                    if (controlPositionDiv) {
                        controlPositionDiv.remove();
                    }
                    var customTitle = document.createElement('h4');
                    customTitle.style.color = 'red';
                    customTitle.innerHTML = 'Locations currently unavailable for Client Admin account';
                    controlPositionDiv = document.createElement('div');
                    controlPositionDiv.appendChild(customTitle);
                    map.controls[google.maps.ControlPosition.CENTER].push(controlPositionDiv);
                } else {
                    $.ajax({
                        url: coolerDashboard.common.nodeUrl('getLocationsFirstLoadCoolerPerformance'),
                        data: filterValuesChart,
                        type: 'POST',
                        success: function (result, data) {
                            applyMapPlotFirst(result);
                        },
                        scope: this
                    });
                }
                $.ajax({
                    url: coolerDashboard.common.nodeUrl('getCPIdata'),
                    data: filterValuesChart,
                    type: 'POST',
                    success: function (result, data) {
                        getCPIdata(result);
                    },
                    failure: function (response, opts) {},
                    scope: this
                });
            },
            scope: this
        });
    }

    $('#coolerPerformanceIndexSpin').spin(coolerDashboard.common.smallSpin);

    //$('#mapSpin').spin(coolerDashboard.common.smallSpin);
}

function mapSpinnerShow() {
    $('#mapSpin').spin(coolerDashboard.common.smallSpin);
}

function mapMessageHide() {
    if (controlPositionDiv) {
        controlPositionDiv.remove();
    }
}

function loadDefaultMap() {
    $('#mapName').html('Locations');
    var locationsData = [];
    var classification = [];
    var randomColor = "";
    var mapDiv = document.getElementById('map-canvas');
    var chicago = new google.maps.LatLng(41.850033, -87.6500523);
    var mapOptions = {
        zoom: 12,
        minZoom: 2,
        maxZoom: 18,
        center: this.center || chicago,
        styles: mapStyles
    }
    map = new google.maps.Map(mapDiv, mapOptions);
}

function mapSpinnerHide() {
    $('#mapSpin').spin(false);
}

$(function () {

    coolerDashboard.gridUtils.initGridStackDynamicView();

    $("#filterFormKPI").load('views/common/filter.html');
    $("#filterSummary").load('views/common/filterSummary.html');
    this.value = 10;

    $('#hoursCoolerAbove7').easyPieChart({
        size: 50, //110
        barColor: '#a90329',
        lineCap: 'butt',
        scaleColor: false,
        lineWidth: 4,
        onStep: function (from, to, percent) {
            if (isNaN(coolerAbove7)) {
                coolerAbove7 = 'N/A'
            }
            $(this.el).find('.percent').text(coolerDashboard.common.float(coolerAbove7));
        }
    });
    $('#hoursLightOn').easyPieChart({
        size: 50, //110
        barColor: '#a90329',
        lineCap: 'butt',
        scaleColor: false,
        lineWidth: 4,
        onStep: function (from, to, percent) {
            if (isNaN(hoursLightOn)) {
                hoursLightOn = 'N/A'
            }
            $(this.el).find('.percent').text(coolerDashboard.common.float(hoursLightOn));
        }
    });
    $('#hoursPowerOn').easyPieChart({
        size: 50, //110
        barColor: '#a90329',
        lineCap: 'butt',
        scaleColor: false,
        lineWidth: 4,
        onStep: function (from, to, percent) {
            if (isNaN(hoursPowerOn)) {
                hoursPowerOn = 'N/A'
            }
            $(this.el).find('.percent').text(coolerDashboard.common.float(hoursPowerOn));
        }
    });

    $('#hourlyDoorOpen').easyPieChart({
        size: 50, //110
        barColor: '#a90329',
        lineCap: 'butt',
        scaleColor: false,
        lineWidth: 4,
        onStep: function (from, to, percent) {
            if (isNaN(hourlyDoor)) {
                hourlyDoor = 'N/A'
            }
            $(this.el).find('.percent').text(coolerDashboard.common.float(hourlyDoor));
        }
    });

    $('#locationConfirmed').easyPieChart({
        size: 50, //110
        barColor: '#a90329',
        lineCap: 'butt',
        scaleColor: false,
        lineWidth: 4,
        onStep: function (from, to, percent) {
            if (isNaN(locationConfirmedlast)) {
                locationConfirmedlast = 'N/A'
            }
            $(this.el).find('.percent').text(coolerDashboard.common.float(locationConfirmedlast));
        }
    });

    var filterValues = {};
    var responsiveHelper_dt_basic = undefined;
    var breakpointDefinition = {
        tablet: 1024,
        phone: 480
    };
    var mapDiv = document.getElementById('map-canvas');
    var chicago = new google.maps.LatLng(41.850033, -87.6500523);
    var mapOptions = {
        zoom: 12,
        minZoom: 2,
        maxZoom: 18,
        center: this.center || chicago,
        styles: mapStyles
    }
    map = new google.maps.Map(mapDiv, mapOptions);

    var icons = {
        noIcon: "img/blank.gif",
        //isSmart: "img/smart.png",
        isKeyLocation: "img/keylocation.png"
    };

    var locationIconsRenderer = function (data, type, row) {
        var rowIcons = [
            //row.IsSmart ? icons.isSmart : icons.noIcon,
            row.IsKeyLocation ? icons.isKeyLocation : icons.noIcon
        ];
        var html = [];
        if (row.Alert_Open && !isNaN(row.Alert_Open)) {
            html.push("<div class='circle-red no-padding'>" + row.Alert_Open + "</div>")
        } else {
            html.push("<div class='circle-green no-padding'></div>")
        }
        //html.push(renderers.alertTypeIcon(row["Alert_Highest_AlertTypeId"], type, row));
        if (html[0] == "") {
            html.push("<div><img src='img/blank.gif' /></div>");
        }
        for (var i = 0, len = rowIcons.length; i < len; i++) {
            if (rowIcons[i] != icons.noIcon) {
                html.push("<div><img src='" + rowIcons[i] + "' /></div>");
            }
        }
        return html.join('');

    };

    $('#locationGridPerformance').on('click', 'tbody td.inline-link', function (e) {
        var dt = locationTable.DataTable();
        var rowIndex = dt.row(this)[0][0];
        if (rowIndex < 0) {
            return;
        }
        var data = dt.data();
        var column = dt.columns($(this).index()).header()[0].innerText;
        //var gridId = e.delegateTarget.id;
        var rowData = data[rowIndex];
        var locationCode = rowData.LocationCode;
        locationCode = locationCode.toLowerCase();
        //window.location.hash = 'outletDetails/' + locationCode;
        window.open(window.location.pathname + '#outletDetails/' + locationCode);
    });

    var locationTable = $('#locationGridPerformance')
        .dataTable({
            ajax: {
                url: coolerDashboard.common.nodeUrl('outlet/list', $this.jsonFilter),
                method: 'POST',
                data: function (data, settings) {
                    var searchFilters = $(".filterable");
                    for (var i = 0, len = searchFilters.length; i < len; i++) {
                        var searchElement = searchFilters[i];
                        if (searchElement.dataset.grid == "locationGrid") {
                            var value = $(searchElement.childNodes[0]).val();
                            if (value) {
                                data['search_' + searchElement.dataset.column] = value;
                            }
                        }
                    }
                    if (jsonFilter.AlertTypeId || jsonFilter.PriorityId || jsonFilter.StatusId || jsonFilter[
                            "AlertTypeId[]"] || jsonFilter["PriorityId[]"] || jsonFilter["StatusId[]"]) {
                        jsonFilter["startDateAlert"] = jsonFilter.startDate;
                        jsonFilter["endDateAlert"] = jsonFilter.endDate;
                        jsonFilter["fromOutletScreenAlert"] = true;
                        if (jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"]) {
                            jsonFilter["dayOfWeekAlert"] = jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"];
                        }
                        if (jsonFilter.yearWeek || jsonFilter["yearWeek[]"]) {
                            jsonFilter["yearWeekAlert"] = jsonFilter.yearWeek || jsonFilter["yearWeek[]"];
                        }
                        if (jsonFilter.quarter || jsonFilter["quarter[]"]) {
                            jsonFilter["quarterAlert"] = jsonFilter.quarter || jsonFilter["quarter[]"];
                        }
                        if (jsonFilter.month || jsonFilter["month[]"]) {
                            jsonFilter["monthAlert"] = jsonFilter.month || jsonFilter["month[]"];
                        }
                    }


                    if (jsonFilter.Displacement_To || jsonFilter.Displacement_From || jsonFilter["Displacement_To[]"] ||
                        jsonFilter["Displacement_From[]"]) {
                        jsonFilter["startDateMovement"] = jsonFilter.startDate;
                        jsonFilter["endDateMovement"] = jsonFilter.endDate;
                        jsonFilter["fromMovementScreen"] = true;
                        if (jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"]) {
                            jsonFilter["dayOfWeekMovement"] = jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"];
                        }
                        if (jsonFilter.yearWeek || jsonFilter["yearWeek[]"]) {
                            jsonFilter["yearWeekMovement"] = jsonFilter.yearWeek || jsonFilter["yearWeek[]"];
                        }
                        if (jsonFilter.quarter || jsonFilter["quarter[]"]) {
                            jsonFilter["quarterMovement"] = jsonFilter.quarter || jsonFilter["quarter[]"];
                        }
                        if (jsonFilter.month || jsonFilter["month[]"]) {
                            jsonFilter["monthMovement"] = jsonFilter.month || jsonFilter["month[]"];
                        }
                    }
                    if (jsonFilter.DoorCount || jsonFilter["DoorCount[]"]) {
                        jsonFilter["startDateDoor"] = jsonFilter.startDate;
                        jsonFilter["endDateDoor"] = jsonFilter.endDate;
                        jsonFilter["fromDoorScreen"] = true;
                        jsonFilter["customQueryDoor"] = true;
                        if (jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"]) {
                            jsonFilter["dayOfWeekDoor"] = jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"];
                        }
                        if (jsonFilter.yearWeek || jsonFilter["yearWeek[]"]) {
                            jsonFilter["yearWeekDoor"] = jsonFilter.yearWeek || jsonFilter["yearWeek[]"];
                        }
                        if (jsonFilter.quarter || jsonFilter["quarter[]"]) {
                            jsonFilter["quarterDoor"] = jsonFilter.quarter || jsonFilter["quarter[]"];
                        }
                        if (jsonFilter.month || jsonFilter["month[]"]) {
                            jsonFilter["monthDoor"] = jsonFilter.month || jsonFilter["month[]"];
                        }
                    }

                    if (jsonFilter.TempBand || jsonFilter["TempBand[]"]) {
                        jsonFilter["startDateHealth"] = jsonFilter.startDate;
                        jsonFilter["endDateHealth"] = jsonFilter.endDate;
                        jsonFilter["fromHealthScreen"] = true;
                        jsonFilter["customQueryHealth"] = true;
                        if (jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"]) {
                            jsonFilter["dayOfWeekHealth"] = jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"];
                        }
                        if (jsonFilter.yearWeek || jsonFilter["yearWeek[]"]) {
                            jsonFilter["yearWeekHealth"] = jsonFilter.yearWeek || jsonFilter["yearWeek[]"];
                        }
                        if (jsonFilter.quarter || jsonFilter["quarter[]"]) {
                            jsonFilter["quarterHealth"] = jsonFilter.quarter || jsonFilter["quarter[]"];
                        }
                        if (jsonFilter.month || jsonFilter["month[]"]) {
                            jsonFilter["monthHealth"] = jsonFilter.month || jsonFilter["month[]"];
                        }
                    }

                    if (jsonFilter.LightStatus || jsonFilter["LightStatus[]"]) {
                        jsonFilter["startDateLight"] = jsonFilter.startDate;
                        jsonFilter["endDateLight"] = jsonFilter.endDate;
                        jsonFilter["fromLightScreen"] = true;
                        jsonFilter["LightStatusBand"] = jsonFilter.LightStatus || jsonFilter["LightStatus[]"];
                        jsonFilter["customQueryLight"] = true;
                        if (jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"]) {
                            jsonFilter["dayOfWeekLight"] = jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"];
                        }
                        if (jsonFilter.yearWeek || jsonFilter["yearWeek[]"]) {
                            jsonFilter["yearWeekLight"] = jsonFilter.yearWeek || jsonFilter["yearWeek[]"];
                        }
                        if (jsonFilter.quarter || jsonFilter["quarter[]"]) {
                            jsonFilter["quarterLight"] = jsonFilter.quarter || jsonFilter["quarter[]"];
                        }
                        if (jsonFilter.month || jsonFilter["month[]"]) {
                            jsonFilter["monthLight"] = jsonFilter.month || jsonFilter["month[]"];
                        }
                    }

                    if (jsonFilter.PowerStatus || jsonFilter["PowerStatus[]"]) {
                        jsonFilter["startDatePower"] = jsonFilter.startDate;
                        jsonFilter["endDatePower"] = jsonFilter.endDate;
                        jsonFilter["fromPowerScreen"] = true;
                        jsonFilter["PowerBand"] = jsonFilter.PowerStatus || jsonFilter["PowerStatus[]"];
                        jsonFilter["customQueryPower"] = true;
                        if (jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"]) {
                            jsonFilter["dayOfWeekPower"] = jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"];
                        }
                        if (jsonFilter.yearWeek || jsonFilter["yearWeek[]"]) {
                            jsonFilter["yearWeekPower"] = jsonFilter.yearWeek || jsonFilter["yearWeek[]"];
                        }
                        if (jsonFilter.quarter || jsonFilter["quarter[]"]) {
                            jsonFilter["quarterPower"] = jsonFilter.quarter || jsonFilter["quarter[]"];
                        }
                        if (jsonFilter.month || jsonFilter["month[]"]) {
                            jsonFilter["monthPower"] = jsonFilter.month || jsonFilter["month[]"];
                        }
                    }
                    //LocationfilterValues = $.extend(data, jsonFilter);
                    return $.extend(data, jsonFilter);
                }
            },
            order: [
                [2, "asc"]
            ],
            processing: true,
            serverSide: true,
            "deferLoading": 0,
            select: true,
            columns: [{
                data: 'alert',
                render: locationIconsRenderer,
                "orderable": false,
                "className": 'alert-icons alert-icons-location'
            }, {
                data: 'LocationCode',
                className: 'inline-link'
            }, {
                data: 'Name',
                className: 'inline-link'
            }, {
                data: 'LocationType'
            }, {
                data: 'Classification'
            }],
            "sScrollX": true,
            "scrollY": "36em",
            "sDom": "" + "t" +
                "<'dt-toolbar-footer'<'col-sm-12 col-lg-12 col-xs-12 hidden-xs'i><'col-xs-12 col-sm-6 col-lg-12'p>>",
            "autoWidth": true,
            "preDrawCallback": function () {
                // Initialize the responsive datatables helper once.
                if (!responsiveHelper_dt_basic) {
                    responsiveHelper_dt_basic = new ResponsiveDatatablesHelper($('#locationGridPerformance'), breakpointDefinition);
                }
            },
            "rowCallback": function (nRow) {
                responsiveHelper_dt_basic.createExpandIcon(nRow);
            },
            "drawCallback": function (oSettings) {
                responsiveHelper_dt_basic.respond();
            }
        });

    var emptyData = {
        salesVisit: {
            Date: '',
            VisitDuration: '',
            CountofVisit: ''
        },
        peoplePassingBy: {
            DoorOpening: '',
            PeoplePassingBy: ''
        },
        footTrafficOpening: [],
        totalCooler: 0,
        coolerSelected: 0,
        avgPowerOn: 0,
        salesVisitDuration: 0,
        missingCooler: 0,
        doorOpenDuration: 0,
        hourlyFootTraffic: 0,
        coolerMoves: 0,
        totalNoOfAlarms: 0,
        openAlert: 0,
        coolerBelow30Light: 0,
        hoursLightOn: 0,
        hoursPowerOn: 0,
        hourlyDoorOpen: 0,
        alarmRate: 0,
        temperature: 0,
        coolerAbove7: 0,
        locationData: [],
        //locationDataDoorSwing: [],
        dooorSales: []
    };
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

$("#tipclicklastdatadownload").click(function () {
    var win = window.open(window.location.pathname + '#NoDataFound');
    win.focus();
});