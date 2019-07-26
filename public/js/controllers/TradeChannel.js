var chartData;
var markers = [];
var markerCluster;
var map;
var filterValues = {};
var infoWindow = new google.maps.InfoWindow({
	content: ""
})
var jsonFilter = JSON.stringify({
	"start": 0,
	"limit": 10
});

function applyDashboardCharts(result) {
	result = result.data;
	coolerDashboard.gridUtils.ajaxIndicatorStop();
	if (result) {

		//var seriesData = highChartsHelper.convertToSeries({
		//	seriesConfig: [
		//	{
		//		name: 'Visit Duration(Mins)',
		//		type: 'column',
		//		yAxis: 0,
		//		data: function (record) {
		//			var dataArray = [];
		//			dataArray = [parseInt(record.Date), parseInt(record.VisitDuration)]
		//			return dataArray;
		//		}
		//	}, {
		//		name: 'Count of Visits',
		//		type: 'spline',
		//		yAxis: 1,
		//		data: function (record) {
		//			var dataArray = [];
		//			dataArray = [parseInt(record.Date), parseInt(record.CountofVisit)]
		//			return dataArray;
		//		}
		//	}
		//	],
		//	data: result.salesVisit
		//});

		//$('#salesVisit').highcharts({
		//	chart: {
		//		renderTo: 'salesVisit'
		//	},
		//	lang: {
		//		noData: "No data found to display"
		//	},
		//	noData: {
		//		style: {
		//			fontWeight: 'bold',
		//			fontSize: '15',
		//			color: 'Black',
		//			textTransform: 'uppercase'
		//		}
		//	},
		//	title: { text: '' },
		//	yAxis: [
		//		{ title: { text: 'Visit Duration (Mins)' } },
		//		{ title: { text: 'Count of Visits' }, opposite: true },

		//	],
		//	xAxis: [{
		//		type: 'datetime'
		//	}],
		//	series: seriesData.series
		//});

		$('#outletCountByTier').highcharts({
			chart: {
				type: 'pie',
				renderTo: 'outletCountByTier'
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
				name: 'Outlet Count/Trade',
				colorByPoint: true,
				data: result.outletCountByTier
			}]
		});

		var timeroutletCountByTier = setInterval(function () {
			if (!$("#outletCountByTier").highcharts()) {
				clearInterval(timeroutletCountByTier);
			} else
				$("#outletCountByTier").highcharts().reflow();
		}, 1);

		$('#assetCountByTier').highcharts({
			chart: {
				type: 'pie',
				renderTo: 'assetCountByTier'
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
				name: 'Asset Count/Trade',
				colorByPoint: true,
				data: result.assetCountByTier
			}]
		});

		var timerassetCountByTier = setInterval(function () {
			if (!$("#assetCountByTier").highcharts()) {
				clearInterval(timerassetCountByTier);
			} else
				$("#assetCountByTier").highcharts().reflow();
		}, 1);

		//if (coolerDashboard.isFilterChanged) {
		result.coolerStatus = $.map(result.coolerStatus, function (v, i) {
			return (isEmpty(v.AssetCount) === "" && isEmpty(v.DoorAssetCount) === "" && isEmpty(v.DoorCount) === "" && isEmpty(v.DoorOpenDuration) === "" && isEmpty(v.HourlyDoorOpen) === "" && isEmpty(v.LightOn) === "" && isEmpty(v.PowerOn) === "" && isEmpty(v.PowerOnAsset) === "" && isEmpty(v.TempHours) === "" && isEmpty(v.ToalLocation) === "" && isEmpty(v.UtilizationRate) === "" ? null : v);
		});
		result.cdeTracking = $.map(result.cdeTracking, function (v, i) {
			return (isEmpty(v.AssetCount) === "" && isEmpty(v.CoolerMovement) === "" && isEmpty(v.MissingCooler) === "" ? null : v);
		});
		result.routeCompliance = $.map(result.routeCompliance, function (v, i) {
			return (isEmpty(v.LocationCount) === "" && isEmpty(v.VisitDuration) === "" && isEmpty(v.VisitPerMonth) === "" ? null : v);
		});

		result.outletPerformance = $.map(result.outletPerformance, function (v, i) {
			return (isEmpty(v.SalesVolume) === "" && isEmpty(v.TotalLocation) === "" && isEmpty(v.Trend) === "" ? null : v);
		});
		result.activityGrid = $.map(result.activityGrid, function (v, i) {
			return (isEmpty(v.DoorCount) === "" && isEmpty(v.DoorOpenHourly) === "" && isEmpty(v.SalesVolume) === "" ? null : v);
		});
		//	}

		$('#dt_basic2').dataTable().fnClearTable();
		if (result.coolerStatus.length != 0) {
			$('#dt_basic2').dataTable().fnAddData(result.coolerStatus);
		}

		$('#cdeTracking').dataTable().fnClearTable();
		if (result.cdeTracking != 0) {
			$('#cdeTracking').dataTable().fnAddData(result.cdeTracking);
		}

		$('#routeCompliance').dataTable().fnClearTable();
		if (result.routeCompliance != 0) {
			$('#routeCompliance').dataTable().fnAddData(result.routeCompliance);
		}

		$('#outletPerformance').dataTable().fnClearTable();
		if (result.outletPerformance != 0) {
			$('#outletPerformance').dataTable().fnAddData(result.outletPerformance);
		}

		$('#activityGrid').dataTable().fnClearTable();
		if (result.activityGrid != 0) {
			$('#activityGrid').dataTable().fnAddData(result.activityGrid);
		}

		result = result.summary;

		var locationsData = [];
		var locationType = [];
		var randomColor = "";

		for (var i = 0, len = result.locationData.length; i < len; i++) {
			var rec = result.locationData[i];
			var latitude = rec.LocationGeo.lat;
			var longitude = rec.LocationGeo.lon;

			locationsData.push({
				"Latitude": latitude,
				"Longitude": longitude,
				"Tier": rec.LocationType ? rec.LocationType : "NoTier",
				"Name": rec.Name,
				"Id": rec.Id,
				"LocationCode": rec.LocationCode
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

		var totalCooler = result.totalCooler ? result.totalCooler : 0;
		$('#totalCustomer').html(result.totalCustomer);
		$('#customerSelectedKPI').html(result.filteredOutlets);
		setTimeout(function () {
			$('#customerSelectedPercentageKPI').data('easyPieChart').update(result.totalCustomer == 0 ? 0 : (result.filteredOutlets / result.totalCustomer) * 100);
		}, 50)

		$('#coolerSelectedKPI').html(result.filteredAssets);
		$('#smartCoolerSelectedKPI').html(result.smartAssetCount);
		$('#smartCoolerSelectedPercentageKPI').data('easyPieChart').update(result.filteredAssets == 0 ? 0 : (result.smartAssetCount / result.filteredAssets) * 100);
	}
}

function isEmpty(value) {
	if (!(isNaN(value) || value === "" || value === null)) {
		return value
	} else {
		return "";
	}
}

function addMapMarkers(locationData, locationType) {
	var vrTempMarker = [];

	if (markers) {
		for (var i = 0; i < markers.length; i++) {
			markers[i].setMap(null);
		}
		markers = [];
	}

	var latLngBounds = new google.maps.LatLngBounds();

	for (var i = 0, len = locationData.length; i < len; i++) {
		var rec = locationData[i];
		var latitude = rec.Latitude;
		var longitude = rec.Longitude,
			position = new google.maps.LatLng(latitude, longitude);
		latLngBounds.extend(position);

		var marker = new google.maps.Marker({
			position: position,
			title: rec.Tier
		});

		markers.push(marker);

		if (rec) {
			coolerDashboard.common.attachMarkerListener(infoWindow, marker, rec, map);
		}
	}

	if (this.map) {
		if (this.markerCluster) {
			this.markerCluster.clearMarkers();
		}

		var opt = {
			"legend": {}
		};
		this.markerCluster = new MarkerClustererTier(map, markers, opt);
		// if (!this.markerCluster) {
		// 	var markerCluster = new MarkerClusterer(map, markers, {
		// 		zoomOnClick: true,
		// 		maxZoom: 12,
		// 		averageCenter: true,
		// 		imagePath: 'img/map/m'
		// 	});
		// 	this.markerCluster = markerCluster;
		// } else {
		// 	this.markerCluster.addMarkers(markers);
		// }
	}

	if (this.map) {
		this.map.fitBounds(latLngBounds);
	}
}

function addMapMarkersOld(locationData, locationType) {
	var markers0 = [];
	var markers1 = [];
	var markers2 = [];
	var markers3 = [];
	var markers4 = [];
	if (markers) {
		for (var i = 0; i < markers.length; i++) {
			markers[i].setMap(null);
		}
	}
	var latLngBounds = new google.maps.LatLngBounds();
	for (var i = 0, len = locationData.length; i < len; i++) {
		var rec = locationData[i];
		var latitude = rec.Latitude;
		var longitude = rec.Longitude,
			position = new google.maps.LatLng(latitude, longitude);
		latLngBounds.extend(position);
		var markerImage = new google.maps.MarkerImage('img/map/' + rec.Color + '.png');
		var marker = new google.maps.Marker({
			position: position,
			title: rec.Name + ' ( ' + rec.Tier + ' )',
			tier: rec.Tie,
			icon: markerImage
		});
		markers.push(marker);
		if (rec) {
			coolerDashboard.common.attachMarkerListener(infoWindow, marker, rec, map);
		}
		if (rec.Tier == "NoTier") {
			markers4.push(marker);
		} else if (rec.Tier == locationType[0].LocationType) {
			markers0.push(marker);
		} else if (rec.Tier == locationType[1].LocationType) {
			markers1.push(marker);
		} else if (rec.Tier == locationType[2].LocationType) {
			markers2.push(marker);
		} else if (rec.Tier == locationType[3].LocationType) {
			markers3.push(marker);
		} else {
			markers4.push(marker);
		}
	}
	if (this.map) {
		if (this.markerCluster) {
			this.markerCluster.clearMarkers();
		}
		this.markerCluster = new MarkerClusterer(this.map, markers0, {
			zoomOnClick: true,
			maxZoom: 12,
			averageCenter: true,
			imagePath: 'img/mapKPI/gold/m'
		});
		if (this.markerCluster1) {
			this.markerCluster1.clearMarkers();
		}
		this.markerCluster1 = new MarkerClusterer(this.map, markers1, {
			zoomOnClick: true,
			maxZoom: 12,
			averageCenter: true,
			imagePath: 'img/mapKPI/diamond/m'
		});
		if (this.markerCluster2) {
			this.markerCluster2.clearMarkers();
		}
		this.markerCluster2 = new MarkerClusterer(this.map, markers2, {
			zoomOnClick: true,
			maxZoom: 12,
			averageCenter: true,
			imagePath: 'img/mapKPI/silver/m'
		});
		if (this.markerCluster3) {
			this.markerCluster3.clearMarkers();
		}
		this.markerCluster3 = new MarkerClusterer(this.map, markers3, {
			zoomOnClick: true,
			maxZoom: 12,
			averageCenter: true,
			imagePath: 'img/mapKPI/bronze/m'
		});

		if (this.markerCluster4) {
			this.markerCluster4.clearMarkers();
		}
		this.markerCluster4 = new MarkerClusterer(this.map, markers4, {
			zoomOnClick: true,
			maxZoom: 12,
			averageCenter: true,
			imagePath: 'img/mapKPI/noTier/m'
		});

	} else {
		this.markerCluster.clearMarkers();
		this.markerCluster1.clearMarkers();
		this.markerCluster2.clearMarkers();
		this.markerCluster3.clearMarkers();
		this.markerCluster4.clearMarkers();

		this.markerCluster.addMarkers(markers0);
		this.markerCluster1.addMarkers(markers1);
		this.markerCluster2.addMarkers(markers2);
		this.markerCluster3.addMarkers(markers3);
		this.markerCluster4.addMarkers(markers4);

	}
	if (this.map) {
		this.map.fitBounds(latLngBounds);
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
					url: coolerDashboard.common.nodeUrl('getTradeChannelWidgetData'),
					data: filterValuesChart,
					type: 'POST',
					success: applyDashboardCharts,
					failure: function (response, opts) {
						coolerDashboard.gridUtils.ajaxIndicatorStop();
					},
					scope: this
				});
			},
			scope: this
		});
	} else {
		$.ajax({
			url: coolerDashboard.common.nodeUrl('getTradeChannelWidgetData'),
			data: filterValuesChart,
			type: 'POST',
			success: applyDashboardCharts,
			failure: function (response, opts) {
				coolerDashboard.gridUtils.ajaxIndicatorStop();
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

	var filterValues = {};
	var responsiveHelper_dt_basic = undefined;
	var breakpointDefinition = {
		tablet: 1024,
		phone: 480
	};

	var sparklineRenderer = function (value, data, row) {
		return '<span class="sparkline-type-pie" data-sparkline-piesize="23px">' +
			(24 - coolerDashboard.common.float(value)) + "," + coolerDashboard.common.float(value) +
			'</span>&nbsp;' + coolerDashboard.common.float(value);
	};

	var sparklineRendererAlarm = function (value, data, row) {
		return '<span class="sparkline-type-pie" data-sparkline-piesize="23px">' +
			(100 - coolerDashboard.common.float(value)) + "," + coolerDashboard.common.float(value) +
			'</span>&nbsp;' + coolerDashboard.common.float(value);
	};

	var sparklineRenderer2 = function (value, data, row) {
		return '<span class="sparkline-type-pie chart2" data-sparkline-piesize="23px">' +
			(row.AssetCount - coolerDashboard.common.float(value)) + "," + coolerDashboard.common.float(value) +
			'</span>&nbsp;' + coolerDashboard.common.float(value);
	};


	var circleRenderer = function (value, data, row) {
		return '<div class="easy-pie-chart chart-volume txt-color-greenLight" data-percent="' + value + '" data-pie-size="5" width:"10px" ><span class="percent">' + value + ' </span></div>&nbsp;';
	};
	var otable = $('#dt_basic2').dataTable({
		ajax: {
			url: './js/ajax/coolerStatus.txt',
			dataSrc: 'data.coolerStatusTrade',
			serverSide: false
		},
		"bPaginate": true,
		"bFilter": false,
		"bSort": false,
		"bInfo": true,
		processing: false,
		columns: [{
			data: 'TradeChannel',
			render: function (value) {
				return value ? value : 'No Channel';
			}
		}, {
			data: 'HourlyDoorOpen',
			render: coolerDashboard.common.float,
			class: 'right'
		}, {
			data: 'DoorOpenDuration',
			render: coolerDashboard.common.float,
			class: 'right'
		}, {
			data: 'PowerOn',
			render: sparklineRenderer,
			"orderable": false
		}, {
			data: 'UtilizationRate',
			render: sparklineRendererAlarm,
			"orderable": false
		}],
		"scrollX": true,
		"scrollY": '300px',
		//"scrollY": '300px',
		//"autoWidth": true,
		"sDom": "" +
			"t" +
			"<'dt-toolbar-footer'<'col-sm-12 col-lg-12 col-xs-12 well-sm'i><'col-sm-8 col-xs-6 hidden-xs'l><'col-xs-12 col-sm-4'p>>",
		"autoWidth": true,
		"oLanguage": {
			"sSearch": '<span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span>'
		},
		"preDrawCallback": function () {
			// Initialize the responsive datatables helper once.
			if (!responsiveHelper_dt_basic) {
				responsiveHelper_dt_basic = new ResponsiveDatatablesHelper($('#dt_basic2'), breakpointDefinition);
			}
		},
		"rowCallback": function (nRow) {
			responsiveHelper_dt_basic.createExpandIcon(nRow);
		},
		"drawCallback": function (oSettings) {
			responsiveHelper_dt_basic.respond();
			$('.sparkline-type-pie').sparkline('html', {
				type: 'pie',
				disableHiddenCheck: true,
				height: '18px',
				width: '18px'
			}).removeClass('sparkline-type-pie');
		}
	});
	coolerDashboard.common.otable = otable;

	var responsiveHelper_dt_basic2 = undefined;
	var otable2 = $('#activityGrid').dataTable({
		ajax: {
			url: './js/ajax/coolerStatus.txt',
			dataSrc: 'data.activitiesTrade',
			serverSide: false
		},
		"bPaginate": true,
		"bFilter": false,
		"bSort": false,
		"bInfo": true,
		processing: false,
		columns: [{
				data: 'TradeChannel',
				render: function (value) {
					return value ? value : 'No Channel';
				}
			},
			//{
			//	data: 'HourlyFooltTraffic',
			//	class: 'right'
			//},
			{
				data: 'DoorCount',
				render: function (value) {

					var v;
					var precision = 2;
					if (!(isNaN(value) || value === "" || value === null)) {
						v = parseFloat(value);
						v = v.toFixed(!precision || isNaN(precision) ? 2 : precision);
						if (precision === 0) {
							v = Number(v);
						} else {
							v = Number(v).toFixed(2);
						}
					} else {
						v = 'N/A';
					}
					return v;
				},
				class: 'right'
			}, {
				data: 'SalesVolume',
				render: function (value) {

					var v;
					var precision = 2;
					if (!(isNaN(value) || value === "" || value === null)) {
						v = parseFloat(value);
						v = v.toFixed(!precision || isNaN(precision) ? 2 : precision);
						if (precision === 0) {
							v = Number(v);
						} else {
							v = Number(v).toFixed(2);
						}
					} else {
						v = 'N/A';
					}
					return v;
				},
				class: 'right'
			}, {
				data: 'DoorOpenHourly',
				render: function (value) {

					var v;
					var precision = 2;
					if (!(isNaN(value) || value === "" || value === null)) {
						v = parseFloat(value);
						v = v.toFixed(!precision || isNaN(precision) ? 2 : precision);
						if (precision === 0) {
							v = Number(v);
						} else {
							v = Number(v).toFixed(2);
						}
					} else {
						v = 'N/A';
					}
					return v;
				},
				class: 'right'
			}
		],
		"scrollX": true,
		"scrollY": '300px',
		//"autoWidth": true,
		"sDom": "" +
			"t" +
			"<'dt-toolbar-footer'<'col-sm-12 col-lg-12 col-xs-12 well-sm'i><'col-sm-8 col-xs-6 hidden-xs'l><'col-xs-12 col-sm-4'p>>",
		"oLanguage": {
			"sSearch": '<span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span>'
		},
		"preDrawCallback": function () {
			// Initialize the responsive datatables helper once.
			if (!responsiveHelper_dt_basic2) {
				responsiveHelper_dt_basic2 = new ResponsiveDatatablesHelper($('#activityGrid'), breakpointDefinition);
			}
		},
		"rowCallback": function (nRow) {
			responsiveHelper_dt_basic2.createExpandIcon(nRow);
		},
		"drawCallback": function (oSettings) {
			responsiveHelper_dt_basic.respond();
			$('.chart-volume').easyPieChart({
				lineWidth: 2,
				size: 30,
				barColor: '#e7e7e7',
				scaleColor: false,
				trackColor: '#e7e7e7',
				lineCap: 'circle'
			});
		}
	});


	var responsiveHelper_outletPerformance = undefined;
	var otable2 = $('#outletPerformance').dataTable({
		ajax: {
			url: './js/ajax/coolerStatus.txt',
			dataSrc: 'data.outletPerformanceTrade',
			serverSide: false
		},
		"bPaginate": true,
		"bFilter": false,
		"bSort": false,
		"bInfo": true,
		processing: false,
		columns: [{
				data: 'TradeChannel',
				width: 40,
				render: function (value) {
					return value ? value : 'No Channel';
				}
			}, {
				data: 'SalesVolume',
				class: 'right',
				render: coolerDashboard.common.float,
				width: 40
			}, {
				data: 'Trend',
				render: coolerDashboard.common.float,
				width: 40,
				class: 'right' //percent percent-sign'
			}
			//, {
			//	data: 'Transactions',
			//	class: 'right',
			//	render: coolerDashboard.common.float,
			//	width: 40
			//}
			//,
			//{
			//	data: 'HourlyFootTraffic',
			//	class: 'right',
			//	width: 40
			//}
		],
		"scrollX": true,
		"scrollY": '300px',
		//"autoWidth": true,
		"sDom": "" +
			"t" +
			"<'dt-toolbar-footer'<'col-sm-12 col-lg-12 col-xs-12 well-sm'i><'col-sm-8 col-xs-6 hidden-xs'l><'col-xs-12 col-sm-4'p>>",
		"oLanguage": {
			"sSearch": '<span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span>'
		},
		"preDrawCallback": function () {
			// Initialize the responsive datatables helper once.
			if (!responsiveHelper_outletPerformance) {
				responsiveHelper_outletPerformance = new ResponsiveDatatablesHelper($('#outletPerformance'), breakpointDefinition);
			}
		},
		"rowCallback": function (nRow) {
			responsiveHelper_outletPerformance.createExpandIcon(nRow);
		},
		"drawCallback": function (oSettings) {
			responsiveHelper_outletPerformance.respond();
		}
	});

	var responsiveHelper_routeCompliance = undefined;
	var otable2 = $('#routeCompliance').dataTable({
		ajax: {
			url: './js/ajax/coolerStatus.txt',
			dataSrc: 'data.routeComplianceTrade',
			serverSide: false
		},
		"bPaginate": true,
		"bFilter": false,
		"bSort": false,
		"bInfo": true,
		processing: false,
		columns: [{
			data: 'TradeChannel',
			width: 40,
			render: function (value) {
				return value ? value : 'No Channel';
			}
		}, {
			data: 'VisitDuration',
			render: coolerDashboard.common.float,
			width: 40
		}, {
			data: 'VisitPerMonth',
			render: coolerDashboard.common.float,
			width: 40
		}],
		"scrollX": true,
		"scrollY": '300px',
		"sDom": "" +
			"t" +
			"<'dt-toolbar-footer'<'col-sm-12 col-lg-12 col-xs-12 well-sm'i><'col-sm-8 col-xs-6 hidden-xs'l><'col-xs-12 col-sm-4'p>>",
		"oLanguage": {
			"sSearch": '<span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span>'
		},
		"preDrawCallback": function () {
			// Initialize the responsive datatables helper once.
			if (!responsiveHelper_routeCompliance) {
				responsiveHelper_routeCompliance = new ResponsiveDatatablesHelper($('#routeCompliance'), breakpointDefinition);
			}
		},
		"rowCallback": function (nRow) {
			responsiveHelper_routeCompliance.createExpandIcon(nRow);
		},
		"drawCallback": function (oSettings) {
			responsiveHelper_routeCompliance.respond();
			$('.chart-volume').easyPieChart({
				lineWidth: 2,
				size: 30,
				barColor: '#e7e7e7',
				scaleColor: false,
				trackColor: '#e7e7e7',
				lineCap: 'circle'
			});
		}
	});

	var responsiveHelper_cdeTracking = undefined;
	var otable2 = $('#cdeTracking').dataTable({
		ajax: {
			url: './js/ajax/coolerStatus.txt',
			dataSrc: 'data.cdeTrackingTrade',
			serverSide: false
		},
		"bPaginate": true,
		"bFilter": false,
		"bSort": false,
		"bInfo": true,
		processing: false,
		columns: [{
			data: 'TradeChannel',
			render: function (value) {
				return value ? value : 'No Channel';
			}
		}, {
			data: 'MissingCooler',
			render: sparklineRenderer2,
			"orderable": false
		}, {
			data: 'CoolerMovement',
			render: sparklineRenderer2,
			"orderable": false
		}],
		"scrollX": true,
		//"autoWidth": true,
		"scrollY": '300px',
		"sDom": "" +
			"t" +
			"<'dt-toolbar-footer'<'col-sm-12 col-lg-12 col-xs-12 well-sm'i><'col-sm-8 col-xs-6 hidden-xs'l><'col-xs-12 col-sm-4'p>>",
		"oLanguage": {
			"sSearch": '<span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span>'
		},
		"preDrawCallback": function () {
			// Initialize the responsive datatables helper once.
			if (!responsiveHelper_cdeTracking) {
				responsiveHelper_cdeTracking = new ResponsiveDatatablesHelper($('#cdeTracking'), breakpointDefinition);
			}
		},
		"rowCallback": function (nRow) {
			responsiveHelper_cdeTracking.createExpandIcon(nRow);
		},
		"drawCallback": function (oSettings) {
			responsiveHelper_cdeTracking.respond();
			$('.chart2').sparkline('html', {
				type: 'pie',
				disableHiddenCheck: true,
				height: '18px',
				width: '18px'
			}).removeClass('sparkline-type-pie chart2');
		}
	});
	var emptyData = {
		salesVisit: {
			Date: '',
			VisitDuration: '',
			CountofVisit: ''
		},
		totalCooler: 0,
		coolerSelected: 0
	};
	//emptyData = JSON.stringify(emptyData);
	//applyDashboardCharts(emptyData);

	//sendAjax(false);

});

$("#exid").click(function () {
	$('#filterSummarySpin').spin(coolerDashboard.common.smallSpin);
	$("#assetGridFilter").DataTable().ajax.reload();
	$("#locationGridFilter").DataTable().ajax.reload();
	setTimeout(function () {
		$('#filterSummarySpin').spin(false);
	}, 10000);
});