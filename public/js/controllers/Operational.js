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
var salesLowDoorLow = 0;
var salesLowDoorHigh = 0;
var salesHighDoorLow = 0;
var salesHighDoorHigh = 0;

var salesLowDoorLowpercent = 0;
var salesLowDoorHighpercent = 0;
var salesHighDoorLowpercent = 0;
var salesHighDoorHighpercent = 0;
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
				name: 'Sales/ Door Open',
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
				type: 'solidgauge',
				plotBackgroundImage: null,
				plotBorderWidth: 0,
				plotShadow: false,
				margin: [0, 0, 0, 0]
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
				size: '90%',
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
				max: 4,
				labels: {
					y: 16
				}
			},
			plotOptions: {
				solidgauge: {
					dataLabels: {
						y: 5,
						borderWidth: 0,
						useHTML: true,
						format: '<div style="text-align:center"><span style="font-size:12px;color:silver">{y}</span><br/>'
					}
				}
			},
			series: seriesData.series
		});

		var doorSales = result.dooorSales;

		var grouped = _.groupBy(result.doorVsSalesChart, function (location) {
			return location.Range;
		});

		var keys = Object.keys(grouped);

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Sales',
				data: function (record) {
					return coolerDashboard.common.float(record.Sales);
				}
			}],
			data: result.doorVsSalesChart
		});

		var colors = ['rgba(119, 152, 191, .5)', 'rgba(223, 83, 83, .5)', 'rgba(130, 122, 181, .5)']

		var scatterChart = [];

		var keysLength = keys.length;
		for (var j = 0; j < keysLength; j++) {
			var name = keys[j];
			if (keys[j].indexOf('<') != -1) {
				name = name.replace('<', '&lt;')
			}
			if (colors[j]) {
				scatterChart.push({
					name: name,
					data: [],
					color: colors[j]

				});
			} else {
				scatterChart.push({
					name: name,
					data: []
				});
			}
			var length = grouped[keys[j]] ? grouped[keys[j]].length : 0;
			var keyData = grouped[keys[j]];
			for (var i = 0; i < length; i++) {
				var data = keyData[i];
				scatterChart[j].data.push({
					x: data.Door,
					y: data.Sales,
					LocationId: data.LocationId,
					LocationCode: data.LocationCode,
					Name: data.Name
				})
			}
		}


		// var length = grouped["2+ Door"] ? grouped["2+ Door"].length : 0;

		// for (var i = 0; i < length; i++) {
		// 	var data = grouped["2+ Door"][i]
		// 	scatterChart[2].data.push({
		// 		x: data.Door,
		// 		y: data.Sales,
		// 		LocationId: data.LocationId,
		// 		LocationCode: data.LocationCode,
		// 		Name: data.Name
		// 	})
		// }

		// var length = grouped["< 1 Door"] ? grouped["< 1 Door"].length : 0;

		// for (var i = 0; i < length; i++) {
		// 	var data = grouped["< 1 Door"][i]
		// 	scatterChart[0].data.push({
		// 		x: data.Door,
		// 		y: data.Sales,
		// 		LocationId: data.LocationId,
		// 		LocationCode: data.LocationCode,
		// 		Name: data.Name
		// 	})
		// }

		$('#coolerCapacity').highcharts({
			chart: {
				renderTo: 'coolerCapacity',
				type: 'scatter',
				zoomType: 'xy',
				resetZoomButton: {
					position: {
						align: 'left', // right by default
						verticalAlign: 'top',
						x: 5,
						y: 5
					},
					relativeTo: 'chart'
				}
			},
			title: {
				text: ''
			},
			xAxis: {
				title: {
					enabled: true,
					text: 'Door Opens'
				},
				showLastLabel: true,
				min: 0,
				//max: 48,
				startOnTick: false,
				endOnTick: false
			},
			yAxis: {
				title: {
					text: 'Sales'
				},
				min: 0,
				//max: 96,
				startOnTick: false,
				endOnTick: false

			},
			legend: {
				layout: 'vertical',
				align: 'left',
				verticalAlign: 'top',
				x: 100,
				y: 70,
				floating: true,
				backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
				borderWidth: 1
			},
			plotOptions: {
				series: {
					cursor: 'pointer',
					events: {
						click: function (event) {
							var filterValues = {};
							var name = "LocationId"
							filterValues[name] = event.point.LocationId;
							//filterValues.push({"LocationId": event.point.LocationId});
							$.ajax({
								url: coolerDashboard.common.nodeUrl('getLocationNamedeSalesCorrelation'),
								data: filterValues,
								type: 'POST',
								success: function (result, data) {
									$('.SmallBox').remove();
									var data = result.data.LocationDetail.hits.hits[0]._source
									$.smallBox({
										title: data.Name,
										content: "Location Code : <b>" + data.LocationCode + "</b><p class='text-align-right'><a target='_blank' href='#outletDetails/" + data.LocationCode + "' class='btn btn-primary btn-sm'>Go to Detail</a> <a href='javascript:void(0);' class='btn btn-danger btn-sm'>Close</a></p>",
										color: "#296191",
										timeout: 5000,
										icon: "fa fa-paper-plane ZoomInUp animated"
									});
								}
							});
						}
					}
				},
				scatter: {
					marker: {
						radius: 5,
						states: {
							hover: {
								enabled: true,
								lineColor: 'rgb(100,100,100)'
							}
						}
					},
					states: {
						hover: {
							marker: {
								enabled: false
							}
						}
					},
					tooltip: {
						headerFormat: '<b>{series.name}</b><br>',
						pointFormat: 'Door Opens : {point.x}<br/> Sales: {point.y}'
					}
				}
			},
			series: scatterChart
		});

		var timercoolerCapacity = setInterval(function () {
			if (!$("#coolerCapacity").highcharts()) {
				clearInterval(timercoolerCapacity);
			} else
				$("#coolerCapacity").highcharts().reflow();
		}, 1);

		result = result.summary;
		var totalCooler = result.totalCooler ? result.totalCooler : 0;

		$('#totalCustomer').html(result.totalCustomer);
		$('#customerSelectedKPI').html(result.filteredOutlets);
		setTimeout(function () {
			$('#customerSelectedPercentageKPI').data('easyPieChart').update(result.totalCustomer == 0 ? 0 : (result.filteredOutlets / result.totalCustomer) * 100);
		}, 50);

		$('#coolerSelectedKPI').html(result.filteredAssets);
		$('#smartCoolerSelectedKPI').html(result.smartAssetCount);
		$('#smartCoolerSelectedPercentageKPI').data('easyPieChart').update(result.filteredAssets == 0 ? 0 : (result.smartAssetCount / result.filteredAssets) * 100);

		salesVolume = result.salesVolume;
		$('#salesVolume').data('easyPieChart').update(result.salesVolume ? (result.salesVolume / 96) * 100 : 0);

		hourlyDoorOpen = result.hourlyDoorOpen;
		$('#doorOpenDuration').data('easyPieChart').update(result.hourlyDoorOpen ? (result.hourlyDoorOpen / 48) * 100 : 0);

		salesLowDoorLow = result.salesLowDoorLow;
		salesLowDoorLowpercent = result.filteredOutlets == 0 ? 0 : (salesLowDoorLow / result.filteredOutlets) * 100;
		$('#salesLowDoorLow').data('easyPieChart').update(salesLowDoorLowpercent);

		salesLowDoorHigh = result.salesLowDoorHigh;
		salesLowDoorHighpercent = result.filteredOutlets == 0 ? 0 : (salesLowDoorHigh / result.filteredOutlets) * 100
		$('#salesLowDoorHigh').data('easyPieChart').update(salesLowDoorHighpercent);

		salesHighDoorLow = result.salesHighDoorLow;
		salesHighDoorLowpercent = result.filteredOutlets == 0 ? 0 : (salesHighDoorLow / result.filteredOutlets) * 100
		$('#salesHighDoorLow').data('easyPieChart').update(salesHighDoorLowpercent);

		salesHighDoorHigh = result.salesHighDoorHigh;
		salesHighDoorHighpercent = result.filteredOutlets == 0 ? 0 : (salesHighDoorHigh / result.filteredOutlets) * 100
		$('#salesHighDoorHigh').data('easyPieChart').update(salesHighDoorHighpercent);


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

function applyDashboardChartsStatic(result) {
	result = JSON.parse(result);
	result = result.data;
	//coolerDashboard.gridUtils.ajaxIndicatorStop();
	if (result) {
		//$('#salesLowDoorLowHealth').highcharts({
		//	chart: {
		//		plotBackgroundColor: null,
		//		plotBorderWidth: 0,
		//		plotShadow: false
		//	},
		//	title: {
		//		text: '',
		//		align: 'center',
		//		verticalAlign: 'middle',
		//		y: 40
		//	},
		//	exporting: { enabled: false },
		//	tooltip: {
		//		pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
		//	},
		//	plotOptions: {
		//		pie: {
		//			dataLabels: {
		//				enabled: true,
		//				distance: -50,
		//				style: {
		//					fontWeight: 'bold',
		//					color: 'white'
		//				}
		//			},
		//			startAngle: -90,
		//			endAngle: 90,
		//			center: ['50%', '75%']
		//		}
		//	},
		//	series: [{
		//		type: 'pie',
		//		name: 'Browser share',
		//		innerSize: '50%',
		//		data: [
		//			['Firefox', 10.38],
		//			['IE', 56.33],
		//			['Chrome', 24.03],
		//			['Safari', 4.77],
		//			['Opera', 0.91],
		//			{
		//				name: 'Proprietary or Undetectable',
		//				y: 0.2,
		//				dataLabels: {
		//					enabled: false
		//				}
		//			}
		//		]
		//	}]
		//});

		//$('#salesLowDoorHighHealth').highcharts({
		//	chart: {
		//		plotBackgroundColor: null,
		//		plotBorderWidth: 0,
		//		plotShadow: false
		//	},
		//	title: {
		//		text: '',
		//		align: 'center',
		//		verticalAlign: 'middle',
		//		y: 40
		//	},
		//	tooltip: {
		//		pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
		//	},
		//	exporting: { enabled: false },
		//	plotOptions: {
		//		pie: {
		//			dataLabels: {
		//				enabled: true,
		//				distance: -50,
		//				style: {
		//					fontWeight: 'bold',
		//					color: 'white'
		//				}
		//			},
		//			startAngle: -90,
		//			endAngle: 90,
		//			center: ['50%', '75%']
		//		}
		//	},
		//	series: [{
		//		type: 'pie',
		//		name: 'Browser share',
		//		innerSize: '50%',
		//		data: [
		//			['Firefox', 10.38],
		//			['IE', 56.33],
		//			['Chrome', 24.03],
		//			['Safari', 4.77],
		//			['Opera', 0.91],
		//			{
		//				name: 'Proprietary or Undetectable',
		//				y: 0.2,
		//				dataLabels: {
		//					enabled: false
		//				}
		//			}
		//		]
		//	}]
		//});

		//$('#salesHighDoorLowHealth').highcharts({
		//	chart: {
		//		plotBackgroundColor: null,
		//		plotBorderWidth: 0,
		//		plotShadow: false
		//	},
		//	title: {
		//		text: '',
		//		align: 'center',
		//		verticalAlign: 'middle',
		//		y: 40
		//	},
		//	tooltip: {
		//		pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
		//	},
		//	exporting: { enabled: false },
		//	plotOptions: {
		//		pie: {
		//			dataLabels: {
		//				enabled: true,
		//				distance: -50,
		//				style: {
		//					fontWeight: 'bold',
		//					color: 'white'
		//				}
		//			},
		//			startAngle: -90,
		//			endAngle: 90,
		//			center: ['50%', '75%']
		//		}
		//	},
		//	series: [{
		//		type: 'pie',
		//		name: 'Browser share',
		//		innerSize: '50%',
		//		data: [
		//			['Firefox', 10.38],
		//			['IE', 56.33],
		//			['Chrome', 24.03],
		//			['Safari', 4.77],
		//			['Opera', 0.91],
		//			{
		//				name: 'Proprietary or Undetectable',
		//				y: 0.2,
		//				dataLabels: {
		//					enabled: false
		//				}
		//			}
		//		]
		//	}]
		//});

		//$('#salesHighDoorHighHealth').highcharts({
		//	chart: {
		//		plotBackgroundColor: null,
		//		plotBorderWidth: 0,
		//		plotShadow: false
		//	},
		//	title: {
		//		text: '',
		//		align: 'center',
		//		verticalAlign: 'middle',
		//		y: 40
		//	},
		//	tooltip: {
		//		pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
		//	},
		//	exporting: { enabled: false },
		//	plotOptions: {
		//		pie: {
		//			dataLabels: {
		//				enabled: true,
		//				distance: -50,
		//				style: {
		//					fontWeight: 'bold',
		//					color: 'white'
		//				}
		//			},
		//			startAngle: -90,
		//			endAngle: 90,
		//			center: ['50%', '75%']
		//		}
		//	},
		//	series: [{
		//		type: 'pie',
		//		name: 'Browser share',
		//		innerSize: '50%',
		//		data: [
		//			['Firefox', 10.38],
		//			['IE', 56.33],
		//			['Chrome', 24.03],
		//			['Safari', 4.77],
		//			['Opera', 0.91],
		//			{
		//				name: 'Proprietary or Undetectable',
		//				y: 0.2,
		//				dataLabels: {
		//					enabled: false
		//				}
		//			}
		//		]
		//	}]
		//});		
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

	//this.markerCluster.addMarkers(markers);

	if (map) {
		map.fitBounds(latLngBounds);
		var center = map.getCenter();
		map.setZoom(2);
		map.setCenter(center);
		google.maps.event.trigger(map, 'resize');
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
	//$("#assetGridFilter").DataTable().ajax.reload();
	//$("#locationGridFilter").DataTable().ajax.reload();
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
					url: coolerDashboard.common.nodeUrl('getKpiWidgetDataForOperationalView'),
					data: filter,
					type: 'POST',
					success: applyDashboardCharts,
					failure: function (response, opts) {},
					scope: this
				});
			},
			scope: this
		});
	} else {
		var filter = JSON.parse(JSON.stringify(filterValuesChart));
		$.ajax({
			url: coolerDashboard.common.nodeUrl('getKpiWidgetDataForOperationalView'),
			data: filter,
			type: 'POST',
			success: applyDashboardCharts,
			failure: function (response, opts) {},
			scope: this
		});
	}
}

$(function () {

	coolerDashboard.gridUtils.initGridStackDynamicView();

	$("#filterFormKPI").load('views/common/filter.html');
	$("#filterSummary").load('views/common/filterSummary.html');
	//pageSetUp();
	this.value = 10;

	$('#doorOpenDuration').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		lineCap: 'round',
		scaleColor: false,
		lineWidth: 5,
		trackColor: 'silver',
		onStep: function (from, to, percent) {
			if (isNaN(hourlyDoorOpen)) {
				hourlyDoorOpen = 'N/A'
			}
			$(this.el).find('.percent').text(coolerDashboard.common.float(hourlyDoorOpen));
		}
	});

	$('#salesVolume').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		lineCap: 'round',
		scaleColor: false,
		lineWidth: 5,
		trackColor: 'silver',
		onStep: function (from, to, percent) {
			if (isNaN(salesVolume)) {
				salesVolume = 'N/A'
			}
			$(this.el).find('.percent').text(coolerDashboard.common.float(salesVolume));
		}
	});


	$('#salesLowDoorLow').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		lineCap: 'round',
		scaleColor: false,
		lineWidth: 5,
		trackColor: 'silver',
		onStep: function (from, to, percent) {
			if (isNaN(salesLowDoorLow)) {
				salesLowDoorLow = 'N/A'
			}
			$(this.el).find('.percent').text(salesLowDoorLow);
		}
	});

	$('#salesLowDoorHigh').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		lineCap: 'round',
		scaleColor: false,
		lineWidth: 5,
		trackColor: 'silver',
		onStep: function (from, to, percent) {
			if (isNaN(salesLowDoorHigh)) {
				salesLowDoorHigh = 'N/A'
			}
			$(this.el).find('.percent').text(salesLowDoorHigh);
		}
	});

	$('#salesHighDoorLow').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		lineCap: 'round',
		scaleColor: false,
		lineWidth: 4,
		trackColor: 'silver',
		onStep: function (from, to, percent) {
			if (isNaN(salesHighDoorLow)) {
				salesHighDoorLow = 'N/A'
			}
			$(this.el).find('.percent').text(salesHighDoorLow);
		}
	});

	$('#salesHighDoorHigh').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		lineCap: 'round',
		scaleColor: false,
		lineWidth: 4,
		trackColor: 'silver',
		onStep: function (from, to, percent) {
			if (isNaN(salesHighDoorHigh)) {
				salesHighDoorHigh = 'N/A'
			}
			$(this.el).find('.percent').text(salesHighDoorHigh);
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

$("#exid").click(function () {
	$('#filterSummarySpin').spin(coolerDashboard.common.smallSpin);
	$("#assetGridFilter").DataTable().ajax.reload();
	$("#locationGridFilter").DataTable().ajax.reload();
	setTimeout(function () {
		$('#filterSummarySpin').spin(false);
	}, 10000);
});