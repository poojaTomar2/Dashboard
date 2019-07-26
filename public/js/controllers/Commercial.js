var chartData;
var markers = [];
var filterValues = {};
var markerCluster;
var coolerMoves = 0;
var coolerMissing = 0;
var coolerAbove7 = 0;
var hoursLightOn = 0;
var hoursPowerOn = 0;
var visitPerMonth = 0;
var salesVisitDuration = 0;
var salesVolume = 0;
var transections = 0;
var trendChart = 0;
var hourlyDoorOpen = 0;
var alarmRate = 0;
var doorOpenDuration = 0;
var map;
var infoWindow = new google.maps.InfoWindow({
	content: ""
});
var jsonFilter = JSON.stringify({
	"start": 0,
	"limit": 10
});

function applyDashboardCharts(result) {
	result = result.data;
	coolerDashboard.gridUtils.ajaxIndicatorStop();
	if (result) {

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				yAxis: 0,
				name: 'Door Open/Sales',
				dataLabels: {
					format: '<div style="text-align:center"><span style="font-size:25px;color:' +
						((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y}</span><br/>' +
						'<span style="font-size:12px;color:silver"></span></div>'
				},
				data: function (record) {
					return Number(result.dooropeningSales[0].DoorOpening);
				}
			}],
			data: result.dooropeningSales
		});

		$('#doorOpeningSales').highcharts({
			chart: {
				renderTo: 'doorOpeningSales',
				type: 'solidgauge'
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
			yAxis: [{
				stops: [
					[0.1, '#55BF3B'], // green
					[0.5, '#DDDF0D'], // yellow
					[0.9, '#DF5353'] // red
				],
				min: 0,
				max: 10,
				title: {
					y: -70
				},
				labels: {
					y: 16
				}
			}, {
				min: 0,
				max: 10,
				minorTickPosition: 'outside',
				tickPosition: 'outside',
				labels: {
					rotation: 'auto',
					distance: 20
				}
			}],
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

		var doorSales = result.dooorSales;

		$('#salesUtilization').highcharts({
			chart: {
				type: 'pie',
				renderTo: 'salesUtilization'
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
						enabled: true,
						distance: -50,
						format: '{point.x}',
						style: {
							color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
						}
					},
					showInLegend: true
				}
			},
			tooltip: {
				formatter: function () {
					return this.series.name + ':' + this.point.x;
				}
			},
			title: {
				text: ''
			},
			series: [{
				name: 'Location',
				colorByPoint: true,
				data: doorSales
			}]
		});

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Sales',
				type: 'bar',
				data: function (record) {
					return coolerDashboard.common.float(record.Sales);
				}
			}],
			xAxis: function (record) {
				return record.Range;
			},
			data: result.avgCapacity
		});

		$('#avgSalesPerLiter').highcharts({
			chart: {
				renderTo: 'avgSalesPerLiter'
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
					text: 'Sales'
				},
				min: 0,
				visible: false
			}],
			xAxis: {
				categories: seriesData.xAxis.categories
			},
			series: seriesData.series
		});

		result = result.summary;
		var totalCooler = result.totalCooler ? result.totalCooler : 0;
		if ($('#filterForm').serializeArray().length == 0) {
			result.filteredOutlets = result.totalCustomer;
			result.filteredAssets = result.totalCooler;
			result.smartAssetCount = result.totalSmartAssetCount;
		}

		$('#totalCustomer').html(result.totalCustomer);
		$('#customerSelectedKPI').html(result.filteredOutlets);
		setTimeout(function () {
			$('#customerSelectedPercentageKPI').data('easyPieChart').update(result.totalCustomer == 0 ? 0 : (result.filteredOutlets / result.totalCustomer) * 100);
		}, 50);
		$('#totalCooler').html(totalCooler);
		$('#coolerSelectedKPI').html(result.filteredAssets);
		$('#coolerSelectedPercentageKPI').data('easyPieChart').update(totalCooler == 0 ? 0 : (result.filteredAssets / totalCooler) * 100);
		$('#totalSmartCooler').html(result.totalSmartAssetCount);
		$('#smartCoolerSelectedKPI').html(result.smartAssetCount);
		$('#smartCoolerSelectedPercentageKPI').data('easyPieChart').update(result.totalSmartAssetCount == 0 ? 0 : (result.smartAssetCount / result.totalSmartAssetCount) * 100);
		doorOpenDuration = result.doorOpenDuration;
		$('#doorOpenDuration').data('easyPieChart').update(result.doorOpenDuration ? result.doorOpenDuration : 0);
		salesVolume = result.salesVolume;
		$('#salesVolume').data('easyPieChart').update(result.salesVolume ? result.salesVolume : 0);
		trendChart = result.trendChart;
		$('#trendChart').data('easyPieChart').update(result.trendChart ? result.trendChart : 0);
		//$('#hourlyFootTraffic').data('easyPieChart').update(result.hourlyFootTraffic ? result.hourlyFootTraffic : 0);
		salesVisitDuration = result.salesVisitDuration;
		$('#visitDuration').data('easyPieChart').update(result.salesVisitDuration);
		visitPerMonth = result.visitPerMonth;
		$('#visitPerMonth').data('easyPieChart').update(result.visitPerMonth ? result.visitPerMonth : 0);
		hourlyDoorOpen = result.hourlyDoorOpen;
		$('#hourlyDoorOpen').data('easyPieChart').update(result.hourlyDoorOpen ? result.hourlyDoorOpen : 0);
		alarmRate = result.alarmRate;
		$('#alarmRate').data('easyPieChart').update(result.alarmRate ? result.alarmRate : 0);
		coolerMoves = result.coolerMoves;
		$('#coolerMoves').data('easyPieChart').update(result.coolerMoves ? (result.coolerMoves / totalCooler) * 100 : 0);
		coolerMissing = result.missingCooler;
		$('#missingCooler').data('easyPieChart').update(result.missingCooler ? (result.missingCooler / totalCooler) * 100 : 0);
		//$('#coolerMoves').text(10);
		$('#totalNoOfAlarms > strong').html(result.totalNoOfAlarms ? result.totalNoOfAlarms : 0);
		$('#powerHoursOnChart').spin(false);
		hoursPowerOn = result.hoursPowerOn;
		if ($('#hoursPowerOn')) {
			$('#hoursPowerOn').data('easyPieChart').update(result.hoursPowerOn ? (result.hoursPowerOn / 24) * 100 : 0);
		}

		var locationsData = [];
		var classification = [];
		var randomColor = "";

		for (var i = 0, len = result.locationData.length; i < len; i++) {
			var rec = result.locationData[i];
			var latitude = rec.LocationGeo.lat;
			var longitude = rec.LocationGeo.lon;
			locationsData.push({
				"Latitude": latitude,
				"Longitude": longitude,
				"Tier": rec.Classification ? rec.Classification : "NoTier",
				"Name": rec.Name,
				"Id": rec.Id,
				"LocationCode": rec.LocationCode,
				"Utilization": rec.Utilization ? rec.Utilization : "No Data"
			})
		}
		setTimeout(function () {
			google.charts.load('current', {
				'callback': function () {
					addMapMarkers(locationsData);
					return true
				},
				'packages': ['corechart']
			}, {
				packages: ['corechart']
			});
		}, 200);
	}
}

function addMapMarkers(locationData) {
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
			title: rec.Utilization
		});

		markers.push(marker);
		if (rec) {
			oms.addMarker(marker);
			coolerDashboard.common.attachMarkerListener(infoWindow, marker, rec, map);
		}
	}

	if (this.markerCluster) {
		this.markerCluster.clearMarkers();
	}

	var opt = {
		"legend": {
			"Low Sales & High Door Utilization": "#3366cc",
			"High Sales & High Door Utilization": "#109618",
			"High Sales & Low Door Utilization": "#ff9900",
			"Low Sales & Low Door Utilization": "#dc3912",
			"Non Smart Low Sales": "#990099",
			"Non Smart High Sales": "#0099c6"
		}
	};
	//this.markerCluster = new MarkerClustererTier(map, markers, opt);
	if (!this.markerCluster) {
        var markerCluster = new MarkerClusterer(map, markers, {
            zoomOnClick: true,
            maxZoom: 12,
            averageCenter: true,
            imagePath: 'img/map/m'
        });
        this.markerCluster = markerCluster;
    } else {
        this.markerCluster.addMarkers(markers);
    }

	//this.markerCluster.addMarkers(markers);

	if (map) {
		map.fitBounds(latLngBounds);
		var center = map.getCenter();
		map.setZoom(2);
		map.setCenter(center);
		google.maps.event.trigger(map, 'resize');
	}
}

function applyDashboardChartsHealth(result) {
	result = result.data;
	$('#tempBelow10Chart').spin(false);
	$('#lightHoursOnChart').spin(false);
	result = result.summary;
	if (result) {
		coolerAbove7 = result.coolerAbove7Hour;
		if ($('#hoursCoolerAbove7').length > 0) {
			$('#hoursCoolerAbove7').data('easyPieChart').update(result.coolerAbove7Hour ? (result.coolerAbove7Hour / 24) * 100 : 0);
		}

		hoursLightOn = result.hoursLightOn;
		if ($('#hoursLightOn').length > 0) {
			$('#hoursLightOn').data('easyPieChart').update(result.hoursLightOn ? (result.hoursLightOn / 24) * 100 : 0);
		}
	}
}

function applyDashboardChartPower(result, filterValuesChart) {
	if (jQuery.isEmptyObject(filterValuesChart)) {
		filterValuesChart = {};
		var startDate = moment().subtract(1, 'months').startOf('month');
		var endDate = moment().subtract(1, 'months').endOf('month');
		if (startDate && endDate) {
			filterValuesChart.startDate = startDate.format('YYYY-MM-DD[T00:00:00]');
			filterValuesChart.endDate = endDate.format('YYYY-MM-DD[T23:59:59]');
		}
	}


	result = result.data;

	result = result.summary;
	if (result) {
		hoursPowerOn = result.hoursPowerOn;
		if ($('#hoursPowerOn')) {
			$('#hoursPowerOn').data('easyPieChart').update(result.hoursPowerOn ? (result.hoursPowerOn / 24) * 100 : 0);
		}
	}
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
	this.jsonFilter = filterValues;
	$("#assetGridFilter").DataTable().ajax.reload();
	$("#locationGridFilter").DataTable().ajax.reload();

	$.ajax({
		url: coolerDashboard.common.nodeUrl('getKpiWidgetDataForCommercialView'),
		data: this.filterValuesChart,
		type: 'POST',
		success: applyDashboardCharts,
		failure: function (response, opts) {
			coolerDashboard.gridUtils.ajaxIndicatorStop();
		},
		scope: this
	});
	
	$('#tempBelow10Chart').spin(coolerDashboard.common.smallSpin);
	$('#lightHoursOnChart').spin(coolerDashboard.common.smallSpin);
	$('#powerHoursOnChart').spin(coolerDashboard.common.smallSpin);


	$.ajax({
		url: coolerDashboard.common.nodeUrl('getHealthData'),
		data: this.filterValuesChart,
		type: 'POST',
		success: applyDashboardChartsHealth,
		failure: function (response, opts) {
			$('#tempBelow10Chart').spin(false);
			$('#lightHoursOnChart').spin(false);
		},
		scope: this
	});

	/*$.ajax({
		url: coolerDashboard.common.nodeUrl('getHealthData', this.filterValuesChart),
		data: coolerDashboard.common.defaultFilter,
		success: applyDashboardChartsHealth,
		failure: function (response, opts) {
			$('#tempBelow10Chart').spin(false);
			$('#lightHoursOnChart').spin(false);
		},
		scope: this
	});*/
}

$(function () {
	$("#filterFormKPI").load('views/common/filter.html');
	$("#filterSummary").load('views/common/filterSummary.html');
	//pageSetUp();
	this.value = 10;
	$('#coolerMoves').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		lineCap: 'butt',
		scaleColor: false,
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (isNaN(coolerMoves)) {
				coolerMoves = 'N/A';
			}
			$(this.el).find('.percent').text(coolerMoves);
		}
	});
	$('#missingCooler').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		lineCap: 'butt',
		scaleColor: false,
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (isNaN(coolerMissing)) {
				coolerMissing = 'N/A';
			}
			$(this.el).find('.percent').text(coolerMissing);
		}
	});
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

	$('#visitDuration').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		lineCap: 'butt',
		scaleColor: false,
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (isNaN(salesVisitDuration)) {
				visitDuration = 'N/A'
			}
			$(this.el).find('.percent').text(coolerDashboard.common.float(salesVisitDuration));
		}
	});

	$('#visitPerMonth').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		lineCap: 'butt',
		scaleColor: false,
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (isNaN(visitPerMonth)) {
				visitPerMonth = 'N/A'
			}
			$(this.el).find('.percent').text(coolerDashboard.common.float(visitPerMonth));
		}
	});

	$('#doorOpenDuration').easyPieChart({
		size: 50, //110
		barColor: '#f5f5f5',
		lineCap: 'butt',
		scaleColor: false,
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (isNaN(doorOpenDuration)) {
				doorOpenDuration = 'N/A'
			}
			$(this.el).find('.percent').text(coolerDashboard.common.float(doorOpenDuration));
		}
	});

	$('#salesVolume').easyPieChart({
		size: 50, //110
		barColor: '#f5f5f5',
		lineCap: 'butt',
		scaleColor: false,
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (isNaN(salesVolume)) {
				salesVolume = 'N/A'
			}
			$(this.el).find('.percent').text(coolerDashboard.common.float(salesVolume));
		}
	});

	$('#trendChart').easyPieChart({
		size: 50, //110
		barColor: '#f5f5f5',
		lineCap: 'butt',
		scaleColor: false,
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (isNaN(trendChart)) {
				trendChart = 'N/A'
			}
			$(this.el).find('.percent').text(coolerDashboard.common.float(trendChart));
		}
	});

	$('#hourlyDoorOpen').easyPieChart({
		size: 50, //110
		barColor: '#f5f5f5',
		lineCap: 'butt',
		scaleColor: false,
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (isNaN(hourlyDoorOpen)) {
				hourlyDoorOpen = 'N/A'
			}
			$(this.el).find('.percent').text(coolerDashboard.common.float(hourlyDoorOpen));
		}
	});

	$('#alarmRate').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		lineCap: 'butt',
		scaleColor: false,
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (isNaN(alarmRate)) {
				alarmRate = 'N/A'
			}
			$(this.el).find('.percent').text(coolerDashboard.common.float(alarmRate));
		}
	});
	var filterValues = {};
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
		dooorSales: []
	};
	emptyData = JSON.stringify(emptyData);
	//applyDashboardCharts(emptyData);
	//sendAjax(false);
});