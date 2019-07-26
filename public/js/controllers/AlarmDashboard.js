var openAlarm = 0;
var closedAlarm = 0;
var filterValues = {};
var jsonFilter = JSON.stringify({
	"start": 0,
	"limit": 10
});

function alertsByTypeBoth(chartData) {
	var seriesData = highChartsHelper.convertToSeries({
		seriesConfig: [{
			name: 'Active Alarms',
			type: 'column',
			data: function (record) {
				return record.OpenAlert;
			}
		}, {
			name: 'Closed Alarms',
			type: 'column',
			data: function (record) {
				return record.CloseAlert;
			}
		}, {
			name: 'Total Alarms',
			type: 'line',
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

	$('#alarmByTypeOnMachine').highcharts({
		chart: {
			renderTo: 'alarmByTypeOnMachine'
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

	var timeralarmByTypeOnMachine = setInterval(function () {
		if (!$("#alarmByTypeOnMachine").highcharts()) {
			clearInterval(timeralarmByTypeOnMachine);
		} else
			$("#alarmByTypeOnMachine").highcharts().reflow();
	}, 1);

	var alarmByTypeChart = $('#alarmByTypeOnMachine').highcharts();

	if (alarmByTypeChart.yAxis[0].dataMax === 0) {
		alarmByTypeChart.yAxis[0].setExtremes(0, 5);
	}
}

function technicianData(chartData) {
	var seriesData = highChartsHelper.convertToSeries({
		seriesConfig: [{
			name: 'Active Alarms',
			type: 'column',
			data: function (record) {
				return record.OpenAlert;
			}
		}, {
			name: 'Closed Alarms',
			type: 'column',
			data: function (record) {
				return record.CloseAlert;
			}
		}, {
			name: 'Total Alarms',
			type: 'line',
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
			return record.Technician;
		},
		data: chartData
	});

	$('#alarmByTechnician').highcharts({
		chart: {
			renderTo: 'alarmByTechnician'
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

	var timeralarmByTechnician = setInterval(function () {
		if (!$("#alarmByTechnician").highcharts()) {
			clearInterval(timeralarmByTechnician);
		} else
			$("#alarmByTechnician").highcharts().reflow();
	}, 1);

	var alarmByTechnician = $('#alarmByTechnician').highcharts();

	if (alarmByTechnician.yAxis[0].dataMax === 0) {
		alarmByTechnician.yAxis[0].setExtremes(0, 5);
	}
}

function customerData(chartData) {
	var seriesData = highChartsHelper.convertToSeries({
		seriesConfig: [{
			name: 'Active Alarms',
			type: 'column',
			data: function (record) {
				return record.OpenAlert;
			}
		}, {
			name: 'Closed Alarms',
			type: 'column',
			data: function (record) {
				return record.CloseAlert;
			}
		}, {
			name: 'Total Alarms',
			type: 'line',
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
			return record.Customer;
		},
		data: chartData
	});

	$('#alarmByCustomerOnMachine').highcharts({
		chart: {
			renderTo: 'alarmByCustomerOnMachine'
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

	var timeralarmByCustomerOnMachine = setInterval(function () {
		if (!$("#alarmByCustomerOnMachine").highcharts()) {
			clearInterval(timeralarmByCustomerOnMachine);
		} else
			$("#alarmByCustomerOnMachine").highcharts().reflow();
	}, 1);

	var alarmByCustomer = $('#alarmByCustomerOnMachine').highcharts();

	if (alarmByCustomer.yAxis[0].dataMax === 0) {
		alarmByCustomer.yAxis[0].setExtremes(0, 5);
	}
}

function iotData(chartData) {
	var seriesData = highChartsHelper.convertToSeries({
		seriesConfig: [{
			name: 'New Alarms',
			type: 'column',
			data: function (record) {
				return record.Created;
			}
		}, {
			name: 'Closed Alarms',
			type: 'column',
			data: function (record) {
				return record.Closed;
			}
		}, {
			name: 'Active Alarms',
			data: function (record) {
				return record.ActiveAlert;
			}
		}],
		data: chartData,
		xAxis: function (record) {
			// var date = moment.utc(record.Date).format('DD. MMM');
			// return date;
			var weekday = moment(record.Date).startOf('week').weekday(1);
			var date = moment(weekday).format('DD.MMM') + ' - ' + moment(weekday).add(6, 'day').format('DD.MMM');
			return date;
		}
	});


	$("#iotAlarm").highcharts({
		chart: {
			renderTo: 'iotAlarm'
		},
		title: {
			text: ''
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
		xAxis: seriesData.xAxis,
		yAxis: [{
			title: {
				text: 'Total Alarms (Count)',
				min: 0
			}
		}, {
			title: {
				text: 'Active Alarms (Count)',
				min: 0
			},
			opposite: true
		}],
		series: seriesData.series
	});

	var timeriotAlarm = setInterval(function () {
		if (!$("#iotAlarm").highcharts()) {
			clearInterval(timeriotAlarm);
		} else
			$("#iotAlarm").highcharts().reflow();
	}, 1);
}

function coolerData(chartData) {
	var seriesData = highChartsHelper.convertToSeries({
		seriesConfig: [{
			name: 'Active Alarms',
			type: 'column',
			data: function (record) {
				return record.OpenAlert;
			}
		}, {
			name: 'Closed Alarms',
			type: 'column',
			data: function (record) {
				return record.CloseAlert;
			}
		}, {
			name: 'Total Alarms',
			type: 'line',
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
			return record.CoolerModel;
		},
		data: chartData
	});

	$('#coolerData').highcharts({
		chart: {
			renderTo: 'coolerData'
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

	var timercoolerData = setInterval(function () {
		if (!$("#coolerData").highcharts()) {
			clearInterval(timercoolerData);
		} else
			$("#coolerData").highcharts().reflow();
	}, 1);

	var alarmByCoolerType = $('#coolerData').highcharts();

	if (alarmByCoolerType.yAxis[0].dataMax === 0) {
		alarmByCoolerType.yAxis[0].setExtremes(0, 5);
	}
}


function capacityData(chartData) {
	var seriesData = highChartsHelper.convertToSeries({
		seriesConfig: [{
			name: 'Active Alarms',
			type: 'column',
			data: function (record) {
				return record.OpenAlert;
			}
		}, {
			name: 'Closed Alarms',
			type: 'column',
			data: function (record) {
				return record.CloseAlert;
			}
		}, {
			name: 'Total Alarms',
			type: 'line',
			lineWidth: 0,
			states: {
				hover: {
					lineWidthPlus: 0
				}
			},
			data: function (record) {
				return record.Count;
			}
		}],
		xAxis: function (record) {
			return record.CapacityType;
		},
		data: chartData
	});

	$('#capacityData').highcharts({
		chart: {
			renderTo: 'capacityData'
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

	var timercapacityData = setInterval(function () {
		if (!$("#capacityData").highcharts()) {
			clearInterval(timercapacityData);
		} else
			$("#capacityData").highcharts().reflow();
	}, 1);

	var alarmByCapacityType = $('#capacityData').highcharts();

	if (alarmByCapacityType.yAxis[0].dataMax === 0) {
		alarmByCapacityType.yAxis[0].setExtremes(0, 5);
	}
}

function applyDashboardCharts(result) {
	coolerDashboard.gridUtils.ajaxIndicatorStop();
	if (result.data) {
		result = result.data;
		var summaryResult = result.summary;
		alertsByTypeBoth(result.alertsByTypeBoth);
		technicianData(result.alertsByTechnician);
		customerData(result.alertsByCustomer);
		iotData(result.alertsByWeek);
		coolerData(result.alertsByCoolerModel);
		capacityData(result.alertsByCapacityType);
		var totalCooler = summaryResult.totalCooler ? summaryResult.totalCooler : 0;

		$('#totalCustomer').html(summaryResult.totalCustomer);
		$('#customerSelectedKPI').html(summaryResult.filteredOutlets);
		$('#coolerSelectedKPI').html(totalCooler);
		$('#smartCoolerSelectedKPI').html(summaryResult.smartAssetCount);

		$('#customerSelectedPercentageKPI').data('easyPieChart').update(summaryResult.totalCustomer == 0 ? 0 : (summaryResult.filteredOutlets / summaryResult.totalCustomer) * 100);
		$('#smartCoolerSelectedPercentageKPI').data('easyPieChart').update(totalCooler == 0 ? 0 : (summaryResult.smartAssetCount / totalCooler) * 100);

		$('#totalAlarms1').data('easyPieChart').update(summaryResult.totalNoOfAlarms);
		$('#outletAlarm').data('easyPieChart').update(Math.round(summaryResult.totalCustomer != 0 ? (summaryResult.locationAlarmRate / summaryResult.totalCustomer) * 100 : 0));
		$('#coolerAlarm').data('easyPieChart').update(Math.round(totalCooler != 0 ? (summaryResult.assetAlarmRate / totalCooler) * 100 : 0));
		openAlarm = summaryResult.openAlert;
		$('#openAlarm1').data('easyPieChart').update(summaryResult.openAlert ? (summaryResult.openAlert / summaryResult.totalNoOfAlarms) * 100 : 0);
		closedAlarm = summaryResult.closedAlarm;
		$('#closedAlarm1').data('easyPieChart').update(summaryResult.closedAlarm ? (summaryResult.closedAlarm / summaryResult.totalNoOfAlarms) * 100 : 0);

	}
}

function resetCustomFilter() {
	var filterForRemove = ["isTechnician", "isTechnicianTop", "isCustomer", "isCustomerTop"];
	filterForRemove.forEach(function (value) {
		var filterValue = _.filter(this.filterValuesChart, function (data) {
			return data.name == value;
		});
		var index = jQuery.inArray(filterValue[0], this.filterValuesChart);
		if (index != -1) {
			this.filterValuesChart.splice(index, 1);
		}
	});
}

function technicianChart(isTechnician, isTop) {
	resetCustomFilter();
	this.filterValuesChart.push({
		name: "isTechnician",
		value: isTechnician
	});
	this.filterValuesChart.push({
		name: "isTechnicianTop",
		value: isTop
	});
	$.ajax({
		url: coolerDashboard.common.nodeUrl('getImberaWidgetData'),
		data: this.filterValuesChart,
		type: 'POST',
		success: applyTechnicianCharts,
		failure: function (response, opts) {},
		scope: this
	});
}

function applyTechnicianCharts(result) {
	if (result.data) {
		technicianData(result.data.alertsByTechnician);
	}
}

function customerChart(isCustomer, isTop) {
	resetCustomFilter();
	this.filterValuesChart.push({
		name: "isCustomer",
		value: isCustomer
	});
	this.filterValuesChart.push({
		name: "isCustomerTop",
		value: isTop
	});
	$.ajax({
		url: coolerDashboard.common.nodeUrl('getImberaWidgetData'),
		data: this.filterValuesChart,
		type: 'POST',
		success: applyCustomerChart,
		failure: function (response, opts) {},
		scope: this
	});
}

function applyCustomerChart(result) {
	if (result.data) {
		customerData(result.data.alertsByCustomer);
	}
}

function sendAjax() {
	coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');

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

	if (!Array.isArray(this.filterValuesChart)) {
		this.filterValuesChart = [];
		var startDate = moment().subtract(1, 'months').startOf('month');
		var endDate = moment().subtract(1, 'months').endOf('month');

		if (startDate && endDate) {
			this.filterValuesChart.push({
				'name': 'startDate',
				'value': startDate.format('YYYY-MM-DD[T00:00:00]')
			});
			this.filterValuesChart.push({
				'name': 'endDate',
				'value': endDate.format('YYYY-MM-DD[T23:59:59]')
			});
		}
	}

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


	coolerDashboard.common.updateDateFilterText(this.filterValuesChart, '.timeFilterName');
	setTimeout(function () {
		coolerDashboard.common.updateAppliedFilterText(this.filterValuesChart, '.appliedFilter', '.totalFilterCount');
	}, 200);

	resetCustomFilter();
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
					url: coolerDashboard.common.nodeUrl('getImberaWidgetData'),
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
			url: coolerDashboard.common.nodeUrl('getImberaWidgetData'),
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
	//used to full screen 
	setup_widgets_desktop_extended();

	$('#openAlarm1').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		scaleColor: false,
		lineCap: 'butt',
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (!openAlarm) {
				openAlarm = 'N/A'
			}
			$(this.el).find('.percent').text(openAlarm);
		}
	});
	$('#closedAlarm1').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		scaleColor: false,
		lineCap: 'butt',
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (!closedAlarm) {
				closedAlarm = 'N/A'
			}
			$(this.el).find('.percent').text(closedAlarm);
		}
	});
	//sendAjax();
	$("#customerTop1").click(function () {
		isTop = $('#customerTop1').is(':checked');
		customerChart(true, isTop);
	});
	$("#technicianTop").click(function () {
		isTop = $('#technicianTop').is(':checked');
		technicianChart(true, isTop);
	});
});

$("#exid").click(function () {
	$('#filterSummarySpin').spin(coolerDashboard.common.smallSpin);
	$("#assetGridFilter").DataTable().ajax.reload();
	$("#locationGridFilter").DataTable().ajax.reload();
	setTimeout(function () {
		$('#filterSummarySpin').spin(false);
	}, 10000);
});