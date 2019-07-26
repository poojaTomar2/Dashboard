var chartData;
var markers = [];
var filterValues = {};
var markerCluster;
var coolerMoves = 0;
var coolerMissing = 0;
var Tracking = [];
var csiarray = [];
var alarmRate = 0;
var lastDownloadLess30 = 0;
var lastDownloadLess60 = 0;
var lastDownloadLess90 = 0;
var lastDownloadGreater90 = 0;
var doorOpenDuration = 0;
var filteredAssets = 0;
var filteredOutlets = 0;
var locationDataLastdataDownloaded = [];
var TempMapLocation = [];
var PowMapLocation = [];
var AlarmMapLocation = [];
var VolMapLocation = [];
var DoorOpenMapLocation = [];
var TrackingMapLocation = [];
var DoorAvgTracking = 0; //for door open avg
var underUtilization = 0;
var cooleroffpowered = 0;
var rghttemp = 0;
var wrongcooler = 0;
var misscooler = 0;
var map;
var csi = [];
var infoWindow = new google.maps.InfoWindow({
	content: ""
});
var jsonFilter = JSON.stringify({
	"start": 0,
	"limit": 10
});

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
//------=========================================================================================//
//===========================Puroo====================================================//
//======for temperature chart in cooler tracking page
function applyDashboardChartsTemperature(result) {
	result = result.data;
	coolerDashboard.gridUtils.ajaxIndicatorStop();
	if (result) {
		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Asset Count',
				type: 'column',
				data: function (record) {
					return record.assets;
				}
			}, {
				name: 'Percentage(%)',
				type: 'spline',
				yAxis: 1,
				data: function (record) {
					return record.assets ? coolerDashboard.common.floatValue(((record.assets / record.totalAssets) * 100)) : 0
				}
			}],
			xAxis: function (record) {
				return record.key;
			},
			data: result.temperatureBands
		});

		$('#temperaturetracking').highcharts({
			chart: {
				renderTo: 'temperaturetracking'
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
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});
		result = result.summary;
		rghttemp = result.rghttemp;
		$('#IncorrectTempCooler').data('easyPieChart').update(result.rghttemp ? (result.rghttemp / result.totalCooler) * 100 : 0);
		//for map
		TempMapLocation = result.TempMapLocation;

		if (TempMapLocation && TempMapLocation.length == 0) {
			$('#mapclickTemperature').addClass('disabled');
		} else {
			$('#mapclickTemperature').removeClass('disabled');
		}

	}
}
$('#temperaturetracking').spin(coolerDashboard.common.smallSpin);
//=========for door open in cooler tracking page===============//
function applyDashboardChartsDoor(result) {
	result = result.data;
	//coolerDashboard.gridUtils.ajaxIndicatorStop();
	if (result) {
		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
					name: 'Asset Count',
					type: 'column',
					data: function (record) {
						return record.Allassets;
					}
				},
				{
					name: 'Monthly',
					type: 'spline',
					data: function (record) {
						return record.Monthlyassets;
					}
				},
				{
					name: 'Weekly',
					type: 'line',
					data: function (record) {
						return record.Weekassets;
					}
				},
				{
					name: 'Yesterday',
					type: 'line',
					data: function (record) {
						return record.Yesterdayassets;
					}
				}
			],
			xAxis: function (record) {
				return record.key;
			},
			data: result.doorData
		});

		$('#dooropentracking').highcharts({
			chart: {
				renderTo: 'dooropentracking'
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
			}],
			plotOptions: {
				spline: {
					marker: {
						enabled: false
					}
				},
				line: {
					marker: {
						enabled: false
					}
				}
			},
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});
		result = result.summary;
		underUtilization = result.underUtilization;
		$('#underUtilized').data('easyPieChart').update(result.underUtilization ? (result.underUtilization / result.totalCooler) * 100 : 0);

		//for map
		DoorOpenMapLocation = result.DoorOpenMapLocation;

		if (DoorOpenMapLocation && DoorOpenMapLocation.length == 0) {
			$('#mapclickDoor').addClass('disabled');
		} else {
			$('#mapclickDoor').removeClass('disabled');
		}
	}
}
$('#dooropentracking').spin(coolerDashboard.common.smallSpin);
//================================================================================//
// for cooler power status request//
function applyDashboardChartsPower(result) {
	//coolerDashboard.gridUtils.ajaxIndicatorStop();
	result = result.data;
	if (result) {
		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
					name: 'Power On Hour',
					type: 'column',

					data: function (record) {
						return record.PowerOn;
					}
				},
				{
					name: 'Power Off Hour',
					type: 'column',

					data: function (record) {
						return record.PowerOff;
					}

				},
				{
					name: 'No Data',
					type: 'column',

					data: function (record) {
						return record.NoData;
					}

				}
			],
			xAxis: function (record) {
				return record.key;
			},
			data: result.coolerPowerStatuses
		});


		$('#powerstatustracking').highcharts({
			chart: {
				renderTo: 'powerstatustracking',
				type: 'column'
			},
			title: {
				text: ''
			},
			yAxis: {
				min: 0,
				title: {
					text: 'Asset Count'
				}
			},
			plotOptions: {
				column: {
					pointPadding: 0.2,
					borderWidth: 0
				}
			},
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});
		result = result.summary;
		cooleroffpowered = result.cooleroffpowered;
		$('#coolerpoweredoff').data('easyPieChart').update(result.cooleroffpowered ? (result.cooleroffpowered / result.totalCooler) * 100 : 0);
		//fpr map
		PowMapLocation = result.PowMapLocation;

		if (PowMapLocation && PowMapLocation.length == 0) {
			$('#mapclickPowerStatus').addClass('disabled');
		} else {
			$('#mapclickPowerStatus').removeClass('disabled');
		}
	}
}
$('#powerstatustracking').spin(coolerDashboard.common.smallSpin);
//====================================================================================================//
//======for cooler voltage in cooler tracking page
function applyDashboardChartsVoltage(result) {
	result = result.data;
	//coolerDashboard.gridUtils.ajaxIndicatorStop();
	if (result) {
		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Asset Count',
				type: 'column',
				data: function (record) {
					return record.assets;
				}
			}, {
				name: 'Percentage(%)',
				type: 'spline',
				yAxis: 1,
				data: function (record) {
					return record.assets ? coolerDashboard.common.floatValue(((record.assets / record.totalAssets) * 100)) : 0
				}
			}],
			xAxis: function (record) {
				return record.key;
			},
			data: result.VoltageBands
		});

		$('#voltagetracking').highcharts({
			chart: {
				renderTo: 'voltagetracking'
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
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});
	}
	result = result.summary;
	//for map
	VolMapLocation = result.VolMapLocation;

	if (VolMapLocation && VolMapLocation.length == 0) {
		$('#mapclickVoltage').addClass('disabled');
	} else {
		$('#mapclickVoltage').removeClass('disabled');
	}
}
$('#voltagetracking').spin(coolerDashboard.common.smallSpin);
//=================================================================//
// for alarm type  request//
function applyDashboardChartsAlarmType(result) {
	//coolerDashboard.gridUtils.ajaxIndicatorStop();
	if (result.data) {
		result = result.data;
		var summaryResult = result.summary;
		AlarmTypeMapLocation = summaryResult.AlarmTypeMapLocation;

		if (AlarmTypeMapLocation && AlarmTypeMapLocation.length == 0) {
			$('#mapClickAlarm').addClass('disabled');
		} else {
			$('#mapClickAlarm').removeClass('disabled');
		}
		alertsByTypeBoth(result.alertsByTypeBoth);
	}
}

function alertsByTypeBoth(chartData) {
	var seriesData = highChartsHelper.convertToSeries({
		seriesConfig: [{
			name: 'Total Alarms',
			type: 'column',
			color: '#90EE7E',
			lineWidth: 0,
			marker: {
				enabled: true,
				radius: 3
			},
			data: function (record) {
				return record.Count;
			}
		}],
		xAxis: function (record) {
			return record.AlertType;
		},
		data: chartData
	});

	$('#alarmtracking').highcharts({
		chart: {
			renderTo: 'alarmtracking'
		},
		lang: {
			noData: "No EMD data to display",
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
				text: 'Alarm Count'
			}
		}],
		xAxis: seriesData.xAxis,
		plotOptions: {
			column: {
				stacking: 'normal',
				dataLabels: {
					enabled: true,
					color: 'white'
				}
			}
		},
		series: seriesData.series
	});

	var alarmByTypeChart = $('#alarmtracking').highcharts();

	if (alarmByTypeChart.yAxis[0].dataMax === 0) {
		alarmByTypeChart.yAxis[0].setExtremes(0, 5);
	}
}
$('#alarmtracking').spin(coolerDashboard.common.smallSpin);
//============================================================//
// for cooler missing and wrong location pie chart
function applyDashboardChartsCoolerMissingWrong(result) {
	//coolerDashboard.gridUtils.ajaxIndicatorStop();
	result = result.data;
	for (var i = Tracking.length; i > 0; i--) {
		Tracking.pop();
	}
	Tracking.push({
		name: "Found",
		last30: result.CoolerTracking[0].Found,
		last60: result.CoolerTracking[1].Found,
		last90: result.CoolerTracking[2].Found,
		lastdays: 0
	});
	Tracking.push({
		name: "Missing",
		last30: result.CoolerTracking[0].Missing,
		last60: result.CoolerTracking[1].Missing,
		last90: result.CoolerTracking[2].Missing,
		lastdays: 0
	});
	Tracking.push({
		name: "Wrong Location",
		last30: result.CoolerTracking[0].Wrong,
		last60: result.CoolerTracking[1].Wrong,
		last90: result.CoolerTracking[2].Wrong,
		lastdays: 0
	});
	Tracking.push({
		name: "Not Visited",
		lastdays: result.CoolerTracking[3].NotVisited
	});
	if (result) {
		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Last30Days',
				type: 'column',
				data: function (record) {
					return record.last30;
				}
			}, {
				name: 'Last30-60Days ',
				type: 'column',
				data: function (record) {
					return record.last60;
				}
			}, {
				name: 'Last60-90Days',
				type: 'column',
				data: function (record) {
					return record.last90;
				}
			}, {
				name: 'Not applicable',
				type: 'column',
				data: function (record) {
					return record.lastdays;
				}
			}],
			xAxis: function (record) {
				return record.name;
			},
			data: Tracking
		});

		$('#coolerTracking').highcharts({
			chart: {
				renderTo: 'coolerTracking',
				type: 'column'
			},
			title: {
				text: ''
			},
			yAxis: [{
				title: {
					text: 'Coolers'
				},
				min: 0
			}, ],
			plotOptions: {
				column: {
					stacking: 'normal',
					dataLabels: {
						enabled: true,
						color: 'white'
					}
				}
			},
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});
		//for pie chart
		result = result.Summary;
		wrongcooler = result.wrongcooler;
		$('#CoolerWrongLocation').data('easyPieChart').update(result.wrongcooler ? (result.wrongcooler / result.totalCooler) * 100 : 0);

		misscooler = result.misscooler;
		$('#CoolerMissing').data('easyPieChart').update(result.misscooler ? (result.misscooler / result.totalCooler) * 100 : 0);

		//for map
		TrackingMapLocation = result.TrackingMapLocation;

		if (TrackingMapLocation && TrackingMapLocation.length == 0) {
			$('#mapClickTracking').addClass('disabled');
		} else {
			$('#mapClickTracking').removeClass('disabled');
		}
		var currentData = ((wrongcooler * 20) +
			(misscooler * 20) +
			(cooleroffpowered * 20) +
			(underUtilization * 20) +
			(rghttemp * 20)) / 100;
		for (var i = csi.length; i > 0; i--) {
			csi.pop();
		}
		csi.push({
			value: currentData
		});
		//================================for CSI semi circle graph==============//
		var seriesDatanew = highChartsHelper.convertToSeries({
			seriesConfig: [{
				yAxis: 0,
				name: 'Cooler Issue Index',
				dataLabels: {
					format: '<div style="text-align:center"><span style="font-size:18px;color:' +
						((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y}</span><br/>' +
						'<span style="font-size:12px;color:silver"></span></div>'
				},
				data: function (record) {
					return Number(csi[0].value);
				}
			}],
			data: csi
		});

		$('#coolerSurveyIndex').highcharts({
			chart: {
				renderTo: 'coolerSurveyIndex',
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
			series: seriesDatanew.series
		});
	}
}
//$('#coolerSurveyIndexSpin').spin(coolerDashboard.common.smallSpin);
$('#coolerTracking').spin(coolerDashboard.common.smallSpin);
//=====================================================================================================//
//for CSI================================/
function applyDashboardChartsCoolerCSI(result) {
	result = result.data;
	result = result.summary;

	if (result) {
		for (var i = csiarray.length; i > 0; i--) {
			csiarray.pop();
		}
		// //========for month name============//
		// var filterEndDate = filterValuesChart.filter(function (value) {
		// 	if (value.name == "endDate") {
		// 		return value.value
		// 	}
		// });

		// var isDayOfWeek = filterValuesChart.filter(function (value) {
		// 	if (value.name == "dayOfWeek") {
		// 		return value.value
		// 	}
		// });

		// var date = moment(endDate).format('MMM');
		// var previousMonth = moment(endDate).add(-1, 'months').format('MMM');
		// var previousMonth2 = moment(endDate).add(-2, 'months').format('MMM');

		// if ((filterEndDate && filterEndDate.length == 0) || (isDayOfWeek && isDayOfWeek.length > 0)) {
		// 	date = moment().format('MMM');
		// 	previousMonth = moment().add(-1, 'months').format('MMM');
		// 	previousMonth2 = moment().add(-2, 'months').format('MMM');
		// }
		//=====value of index
		var currentData = ((result.rghttempCur * 20) + (result.powerOffCur * 20) + (result.MissCur * 20) + (result.WrongCur * 20) + (result.underUtilizationCoolersCur * 20)) / 100;
		var perviousData = ((result.rghttempPre * 20) + (result.powerOffPre * 20) + (result.MissPre * 20) + (result.WrongPre * 20) + (result.underUtilizationCoolersPre * 20)) / 100;
		var TwoMonthBack = ((result.rghttempBack * 20) + (result.powerOffBack * 20) + (result.MissBack) * 20 + (result.WrongBack * 20) + (result.underUtilizationCoolersBack * 20)) / 100;
		csiarray.push({
			value: TwoMonthBack,
			Month: result.previousMonth2
		});

		csiarray.push({
			value: perviousData,
			Month: result.previousMonth
		});

		csiarray.push({
			value: currentData,
			Month: result.date
		});

		//================for CSI graph====================//
		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'CII',
				showInLegend: false,
				data: function (record) {
					return record.value;
				}
			}],
			xAxis: function (record) {
				return record.Month;
			},
			data: csiarray
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
					text: 'CII'
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
	}
}
//================================================================//
function applyDashboardCharts(result) {
	//coolerDashboard.gridUtils.ajaxIndicatorStop();
	result = result.data;
	if (result) {
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
		$('#smartCoolerWareHouseSelectedKPI').html(result.smartAssetCountWareHouse);
		$('#smartCoolerWareHouseSelectedPercentageKPI').data('easyPieChart').update(result.filteredAssets == 0 ? 0 : (result.smartAssetCountWareHouse / result.filteredAssets) * 100);
		$('#smartCoolerSelectedPercentageKPI').data('easyPieChart').update(result.filteredAssets == 0 ? 0 : (result.smartAssetCount / result.filteredAssets) * 100);
	}
}

function applyDashboardChartsLastDataDownload(result) {
	//coolerDashboard.gridUtils.ajaxIndicatorStop();
	result = result.data;
	if (result) {
		$('#lastDataDownloaded').highcharts({
			chart: {
				type: 'bar',
				renderTo: 'temperatureAsset'
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
					stacking: 'normal'
				}
			},
			series: result.lastDataDownloaded
		});
		result = result.summary;
		locationDataLastdataDownloaded = result.locationDataLastdataDownloaded;
		if (locationDataLastdataDownloaded && locationDataLastdataDownloaded.length == 0) {
			$('#mapClickLastDataDownloaded').addClass('disabled');
		} else {
			$('#mapClickLastDataDownloaded').removeClass('disabled');
		}

		$('#resetMap').click(function () {
			$('#resetMap').addClass('hidden');
			defaultMapReload();
		});

		defaultMapReload();

		function defaultMapReload() {

			$('#mapName').html('Last Seen');
			mapSpinnerShow();
			var locationsData = [];
			var classification = [];
			var randomColor = "";

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

		$('#mapClickLastDataDownloaded').click(function (event) {
			//coolerDashboard.gridUtils.ajaxIndicatorStart();
			$('#mapName').html('Last Seen');
			mapSpinnerShow();
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

		});


		//for temperatur map location
		$('#mapclickTemperature').click(function (event) {
			//coolerDashboard.gridUtils.ajaxIndicatorStart();
			$('#mapName').html('Temperature');
			mapSpinnerShow();
			event.preventDefault();
			$('#resetMap').removeClass('hidden');
			locationsData = [];
			for (var i = 0, len = TempMapLocation.length; i < len; i++) {
				var rec = TempMapLocation[i];
				var latitude = rec.LocationGeo.lat;
				var longitude = rec.LocationGeo.lon;

				locationsData.push({
					"Latitude": latitude,
					"Longitude": longitude,
					"Tier": rec.Classification ? rec.Classification : "NoTier",
					"Name": rec.Name,
					"Id": rec.Id,
					"LocationCode": rec.LocationCode,
					"BandTemp": rec.Band ? rec.Band : "No Data"
				})
			}

			setTimeout(function () {
				google.charts.load('current', {
					'callback': function () {
						addMapMarkers(locationsData, 'BandTemp');
						mapSpinnerHide();
						return true
					},
					'packages': ['corechart']
				}, {
					packages: ['corechart']
				});
			}, 200);

		});

		//for power status map
		$('#mapclickPowerStatus').click(function (event) {
			//coolerDashboard.gridUtils.ajaxIndicatorStart();
			$('#mapName').html('Cooler Power Status');
			mapSpinnerShow();
			event.preventDefault();
			$('#resetMap').removeClass('hidden');
			locationsData = [];
			for (var i = 0, len = PowMapLocation.length; i < len; i++) {
				var rec = PowMapLocation[i];
				var latitude = rec.LocationGeo.lat;
				var longitude = rec.LocationGeo.lon;

				locationsData.push({
					"Latitude": latitude,
					"Longitude": longitude,
					"Tier": rec.Classification ? rec.Classification : "NoTier",
					"Name": rec.Name,
					"Id": rec.Id,
					"LocationCode": rec.LocationCode,
					"BandPower": rec.Band ? rec.Band : "No Data"
				})
			}

			setTimeout(function () {
				google.charts.load('current', {
					'callback': function () {
						addMapMarkers(locationsData, 'BandPower');
						mapSpinnerHide();
						return true
					},
					'packages': ['corechart']
				}, {
					packages: ['corechart']
				});
			}, 200);

		});
		//for alarm type chart map
		$('#mapClickAlarm').click(function (event) {
			//coolerDashboard.gridUtils.ajaxIndicatorStart();
			$('#mapName').html('Coolers By Alarm Type');
			mapSpinnerShow();
			event.preventDefault();
			$('#resetMap').removeClass('hidden');
			locationsData = [];
			for (var i = 0, len = AlarmTypeMapLocation.length; i < len; i++) {
				var rec = AlarmTypeMapLocation[i];
				var latitude = rec.LocationGeo.lat;
				var longitude = rec.LocationGeo.lon;

				locationsData.push({
					"Latitude": latitude,
					"Longitude": longitude,
					"Tier": rec.Classification ? rec.Classification : "NoTier",
					"Name": rec.Name,
					"Id": rec.Id,
					"LocationCode": rec.LocationCode,
					"BandAlarm": rec.AlarmBand ? rec.AlarmBand : "Alarm Asset"
				})
			}

			setTimeout(function () {
				google.charts.load('current', {
					'callback': function () {
						addMapMarkers(locationsData, 'BandAlarm');
						mapSpinnerHide();
						return true
					},
					'packages': ['corechart']
				}, {
					packages: ['corechart']
				});
			}, 200);

		});
		//for voltage chart map
		$('#mapclickVoltage').click(function (event) {
			//coolerDashboard.gridUtils.ajaxIndicatorStart();
			$('#mapName').html('Cooler Voltage');
			mapSpinnerShow();
			event.preventDefault();
			$('#resetMap').removeClass('hidden');
			locationsData = [];
			for (var i = 0, len = VolMapLocation.length; i < len; i++) {
				var rec = VolMapLocation[i];
				var latitude = rec.LocationGeo.lat;
				var longitude = rec.LocationGeo.lon;

				locationsData.push({
					"Latitude": latitude,
					"Longitude": longitude,
					"Tier": rec.Classification ? rec.Classification : "NoTier",
					"Name": rec.Name,
					"Id": rec.Id,
					"LocationCode": rec.LocationCode,
					"BandVolt": rec.Band ? rec.Band : "No Data"
				})
			}

			setTimeout(function () {
				google.charts.load('current', {
					'callback': function () {
						addMapMarkers(locationsData, 'BandVolt');
						mapSpinnerHide();
						return true
					},
					'packages': ['corechart']
				}, {
					packages: ['corechart']
				});
			}, 200);

		});
		//for door open chart map
		$('#mapclickDoor').click(function (event) {
			//coolerDashboard.gridUtils.ajaxIndicatorStart();
			$('#mapName').html('Door Open');
			mapSpinnerShow();
			event.preventDefault();
			$('#resetMap').removeClass('hidden');
			locationsData = [];
			for (var i = 0, len = DoorOpenMapLocation.length; i < len; i++) {
				var rec = DoorOpenMapLocation[i];
				var latitude = rec.LocationGeo.lat;
				var longitude = rec.LocationGeo.lon;

				locationsData.push({
					"Latitude": latitude,
					"Longitude": longitude,
					"Tier": rec.Classification ? rec.Classification : "NoTier",
					"Name": rec.Name,
					"Id": rec.Id,
					"LocationCode": rec.LocationCode,
					"BandDoor": rec.Band ? rec.Band : "No Data"
				})
			}

			setTimeout(function () {
				google.charts.load('current', {
					'callback': function () {
						addMapMarkers(locationsData, 'BandDoor');
						mapSpinnerHide();
						return true
					},
					'packages': ['corechart']
				}, {
					packages: ['corechart']
				});
			}, 200);

		});

		//for cooler tracking chart map
		$('#mapClickTracking').click(function (event) {
			//coolerDashboard.gridUtils.ajaxIndicatorStart();
			$('#mapName').html('Cooler Tracking');
			mapSpinnerShow();
			event.preventDefault();
			$('#resetMap').removeClass('hidden');
			locationsData = [];
			for (var i = 0, len = TrackingMapLocation.length; i < len; i++) {
				var rec = TrackingMapLocation[i];
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
						return true
					},
					'packages': ['corechart']
				}, {
					packages: ['corechart']
				});
			}, 200);

		});
	}
}

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
		//LocationTracking

		var marker = new google.maps.Marker({
			position: position,
			title: (target == 'BandPower') ? rec.BandPower : (target == 'BandTracking') ? rec.BandTracking : (target == 'BandVolt') ? rec.BandVolt : (target == 'BandDoor') ? rec.BandDoor : (target == 'BandTemp') ? rec.BandTemp : (target == 'BandAlarm') ? rec.BandAlarm : (target == 'LastData') ? rec.LastData : rec.Utilization
		});

		markers.push(marker);
		if (rec) {
			oms.addMarker(marker);
			coolerDashboard.common.attachMarkerListener(infoWindow, marker, rec, map, true);
		}
	}

	if (this.markerCluster) {
		this.markerCluster.clearMarkers();
	}


	if (target == 'LastData') {
		var opt = {
			"legend": {
				"No Seen for more then 90 days": "#333333",
				"Last Seen > 60, <90 days": "#df5353",
				"Last Seen > 30, <60 days": "#fff589",
				"Last Seen <= 30": "#55bf3b"
			}
		};

	} else if (target == 'BandPower') {
		var opt = {
			"legend": {
				"Power On": "#2b908f",
				"Power Off": "#55bf3b"
			}
		};
	} else if (target == 'BandTemp') {
		var opt = {
			"legend": {
				// ">0": "#2b908f",
				// "0-5": "#90ee7e",
				// "5-10": "#333333",
				// "10-15": "#df5353",
				// ">=15": "#fff589"
			}
		};
	} else if (target == 'BandAlarm') {
		var opt = {
			"legend": {


			}
		};
	} else if (target == 'BandVolt') {
		var opt = {
			"legend": {

			}
		};
	} else if (target == 'BandDoor') {
		var opt = {
			"legend": {

			}
		};
	} else if (target == 'BandTracking') {
		var opt = {
			"legend": {

			}
		};
	}
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

	//setTimeout(function () {
	coolerDashboard.common.updateAppliedFilterText(this.filterValuesChart, '.appliedFilter', '.totalFilterCount');
	//}, 200);

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
	$("#locationGridPerformance").DataTable().ajax.reload();

	$.ajax({
		url: coolerDashboard.common.nodeUrl('getKpiWidgetDataForCoolerTracking'),
		data: filterValuesChart,
		type: 'POST',
		success: applyDashboardCharts,
		failure: function (response, opts) {},
		scope: this
	});

	// for temperature chart
	$.ajax({
		url: coolerDashboard.common.nodeUrl('getKpiWidgetDataForCoolerTrackingTemperatureChart'),
		data: filterValuesChart,
		type: 'POST',
		success: applyDashboardChartsTemperature,
		failure: function (response, opts) {},
		scope: this
	});

	// for door open
	$.ajax({
		url: coolerDashboard.common.nodeUrl('getKpiWidgetDataForCoolerTrackingDoorOpen'),
		data: filterValuesChart,
		type: 'POST',
		success: applyDashboardChartsDoor,
		failure: function (response, opts) {},
		scope: this
	});

	// for power status
	$.ajax({
		url: coolerDashboard.common.nodeUrl('getKpiWidgetDataForCoolerTrackingPowerStatus'),
		data: filterValuesChart,
		type: 'POST',
		success: applyDashboardChartsPower,
		failure: function (response, opts) {},
		scope: this
	});

	// for cooler voltage
	$.ajax({
		url: coolerDashboard.common.nodeUrl('getKpiWidgetDataForCoolerTrackingCoolerVoltage'),
		data: filterValuesChart,
		type: 'POST',
		success: applyDashboardChartsVoltage,
		failure: function (response, opts) {},
		scope: this
	});

	// for alarm type
	$.ajax({
		url: coolerDashboard.common.nodeUrl('getKpiWidgetDataForCoolerTrackingAlarmType'),
		data: filterValuesChart,
		type: 'POST',
		success: applyDashboardChartsAlarmType,
		failure: function (response, opts) {},
		scope: this
	});

	// for wrong location and missing coolers
	$.ajax({
		url: coolerDashboard.common.nodeUrl('getKpiWidgetDataForCoolerTrackingCoolerMissingWrong'),
		data: filterValuesChart,
		type: 'POST',
		success: applyDashboardChartsCoolerMissingWrong,
		failure: function (response, opts) {},
		scope: this
	});

	// for CSI
	$.ajax({
		url: coolerDashboard.common.nodeUrl('getKpiWidgetDataForCoolerTrackingCSI'),
		data: filterValuesChart,
		type: 'POST',
		success: applyDashboardChartsCoolerCSI,
		failure: function (response, opts) {},
		scope: this
	});

	$.ajax({
		url: coolerDashboard.common.nodeUrl('getKpiWidgetDataForCoolerTrackingLastDataDownload'),
		data: filterValuesChart,
		type: 'POST',
		success: applyDashboardChartsLastDataDownload,
		failure: function (response, opts) {},
		scope: this
	});



	// $('#tempBelow10Chart').spin(coolerDashboard.common.smallSpin);
	// $('#lightHoursOnChart').spin(coolerDashboard.common.smallSpin);
	// $('#temperatureAssetSpin').spin(coolerDashboard.common.smallSpin);
	// $('#coolerSurveyIndexSpin').spin(coolerDashboard.common.smallSpin);
	//$('#powerHoursOnChart').spin(coolerDashboard.common.smallSpin);

	$('#mapSpin').spin(coolerDashboard.common.smallSpin);

}

function mapSpinnerShow() {

	$('#mapSpin').spin(coolerDashboard.common.smallSpin);

}

function mapSpinnerHide() {
	$('#mapSpin').spin(false);
}

$(function () {
	
	$("#filterFormKPI").load('views/common/filter.html');
	$("#filterSummary").load('views/common/filterSummary.html');
	//pageSetUp();
	setup_widgets_desktop_extended();
	this.value = 10;

	//for under utilized cooler

	$('#underUtilized').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		lineCap: 'butt',
		scaleColor: false,
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (isNaN(underUtilization)) {
				underUtilization = 'N/A'
			}
			$(this.el).find('.percent').text(coolerDashboard.common.float(underUtilization));
		}
	});

	//for cooler with incorrect temp

	$('#IncorrectTempCooler').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		lineCap: 'butt',
		scaleColor: false,
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (isNaN(rghttemp)) {
				rghttemp = 'N/A'
			}
			$(this.el).find('.percent').text(coolerDashboard.common.float(rghttemp));
		}
	});

	//for cooler powered off

	$('#coolerpoweredoff').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		lineCap: 'butt',
		scaleColor: false,
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (isNaN(cooleroffpowered)) {
				cooleroffpowered = 'N/A'
			}
			$(this.el).find('.percent').text(coolerDashboard.common.float(cooleroffpowered));
		}
	});

	//for wrong location

	$('#CoolerWrongLocation').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		lineCap: 'butt',
		scaleColor: false,
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (isNaN(wrongcooler)) {
				wrongcooler = 'N/A'
			}
			$(this.el).find('.percent').text(coolerDashboard.common.float(wrongcooler));
		}
	});

	//for missing cooler

	$('#CoolerMissing').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		lineCap: 'butt',
		scaleColor: false,
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (isNaN(misscooler)) {
				misscooler = 'N/A'
			}
			$(this.el).find('.percent').text(coolerDashboard.common.float(misscooler));
		}
	});

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