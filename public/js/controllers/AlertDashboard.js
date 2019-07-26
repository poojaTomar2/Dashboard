var chartData;
var openAlarm = 0;
var closedAlarm = 0;
var coolerMissing = 0;
var sellerTopValue = true;
var customerTopValue = true;
var filterValues = {};
var groupBySales = 'SalesTerritory'
var jsonFilter = JSON.stringify({
	"start": 0,
	"limit": 10
});

function applyDashboardCharts(result) {
	coolerDashboard.gridUtils.ajaxIndicatorStop();
	result = result.data;
	if (result) {

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Active Alerts',
				type: 'column',
				data: function (record) {
					return record.OpenAlert;
				}
			}, {
				name: 'Closed Alerts',
				type: 'column',
				data: function (record) {
					return record.CloseAlert;
				}
			}, {
				name: 'New Alerts',
				type: 'line',
				lineWidth: 0,
				marker: {
					enabled: true,
					radius: 3
				},
				tooltip: {
					valueDecimals: 0
				},
				states: {
					hover: {
						lineWidthPlus: 0
					}
				},
				data: function (record) {
					return record.NewAlert;
				}
			}],
			xAxis: function (record) {
				return record.alertType;
			},
			data: result.alertsByTypeBoth
		});

		$('#alarmByType').highcharts({
			chart: {
				renderTo: 'alarmByType'
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
					text: 'Alert Count'
				}
			}],
			xAxis: seriesData.xAxis,
			plotOptions: {
				column: {
					stacking: 'normal',
					dataLabels: {
						enabled: true,
						color: 'white',
						x: 10
					}
				}
			},
			series: seriesData.series
		});

		var timeralarmByType = setInterval(function () {
			if (!$("#alarmByType").highcharts()) {
				clearInterval(timeralarmByType);
			} else
				$("#alarmByType").highcharts().reflow();
		}, 1);

		var alarmByTypeChart = $('#alarmByType').highcharts();

		if (alarmByTypeChart.yAxis[0].dataMax === 0) {
			alarmByTypeChart.yAxis[0].setExtremes(0, 5);
		}

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Low Priority',
				data: function (record) {
					return record.Low;
				}
			}, {
				name: 'Medium Priority',
				data: function (record) {
					return record.Medium;
				}
			}, {
				name: 'High Priority',
				data: function (record) {
					return record.High;
				}
			}, {
				name: 'Asset Percentage(%)',
				type: 'spline',
				yAxis: 1,
				data: function (record) {
					return coolerDashboard.common.floatValue(record.OpenAlertAssetPercentage);
				}
			}],
			data: result.openAlerts,
			xAxis: function (record) {
				return record.Label;
			}
		});

		$("#alertAgingIOT").highcharts({
			chart: {
				type: 'column',
				renderTo: 'alertAgingIOT'
			},
			title: {
				text: ''
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
			xAxis: seriesData.xAxis,
			yAxis: [{
				title: {
					text: 'Active Alerts (Count)',
					min: 0
				}
			}, {
				title: {
					text: '% Assets'
				},
				labels: {
					format: '{value}%'
				},
				opposite: true
			}],
			series: seriesData.series
		});

		var timeralertAgingIOT = setInterval(function () {
			if (!$("#alertAgingIOT").highcharts()) {
				clearInterval(timeralertAgingIOT);
			} else
				$("#alertAgingIOT").highcharts().reflow();
		}, 1);

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'New Alerts',
				type: 'column',
				stack: 'new',
				data: function (record) {
					return record.created;
				}
			}, {
				name: 'Closed Alerts',
				type: 'column',
				stack: 'closed',
				data: function (record) {
					return record.closed;
				}
			}, {
				name: 'Active Alerts',
				data: function (record) {
					return record.activeAlert;
				}
			}],
			data: result.alertsByWeek,
			xAxis: function (record) {
				var weekday = moment(record.date).startOf('week').weekday(1);
				var date = moment(weekday).format('DD.MMM') + ' - ' + moment(weekday).add(6, 'day').format('DD.MMM');
				return date;
			}
		});


		$("#alertsIOTAlarm").highcharts({
			chart: {
				renderTo: 'alertsIOTAlarm'
			},
			title: {
				text: ''
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
				column: {
					stacking: 'normal',
					dataLabels: {
						enabled: true,
						color: 'white'
					}
				}
			},
			xAxis: seriesData.xAxis,
			yAxis: [{
				title: {
					text: 'Total Alerts (Count)',
					min: 0
				}
			}, {
				title: {
					text: 'Open Alerts (Count)',
					min: 0
				},
				opposite: true
			}],
			series: seriesData.series
		});

		var timeralertsIOTAlarm = setInterval(function () {
			if (!$("#alertsIOTAlarm").highcharts()) {
				clearInterval(timeralertsIOTAlarm);
			} else
				$("#alertsIOTAlarm").highcharts().reflow();
		}, 1);

		result = result.summary;
		var totalCooler = result.totalCooler ? result.totalCooler : 0;

		$('#totalCustomer').html(result.totalCustomer);
		$('#customerSelectedKPI').html(result.filteredOutlets);
		setTimeout(function () {
			$('#customerSelectedPercentageKPI').data('easyPieChart').update(result.totalCustomer == 0 ? 0 : (result.filteredOutlets / result.totalCustomer) * 100);
		}, 50)

		$('#coolerSelectedKPI').html(totalCooler);
		$('#smartCoolerSelectedKPI').html(result.smartAssetCount);
		$('#smartCoolerSelectedPercentageKPI').data('easyPieChart').update(totalCooler == 0 ? 0 : (result.smartAssetCount / totalCooler) * 100);

		//$('#locationAlarmRate').html('<i class="fa fa-arrow-circle-up"></i>&nbsp;' + (result.totalOutlets == 0 ? 0 : (result.locationAlarmRate / result.totalOutlets) * 100).toFixed(2) + '%');
		//$('#totlaAlarm').html('<i class="fa fa-arrow-circle-up"></i>&nbsp;' + result.locationAlarmRate);
		$('#totlaAlarm').data('easyPieChart').update(result.totalNoOfAlarms);
		$('#locationAlarmRate').data('easyPieChart').update(Math.round(result.totalCustomer != 0 ? (result.locationAlarmRate / result.totalCustomer) * 100 : 0));
		$('#assetAlarmRate').data('easyPieChart').update(Math.round(totalCooler != 0 ? (result.assetAlarmRate / totalCooler) * 100 : 0));
		//$('#openAlarm').data('easyPieChart').update(result.openAlert);
		//$('#closedAlarm').data('easyPieChart').update(result.closedAlarm);
		//$('#missing').data('easyPieChart').update(result.missingCooler);
		//$('#powerOff').data('easyPieChart').update(result.isPowerOff);
		//coolerMissing = result.missingCooler;
		//$('#missing').data('easyPieChart').update(result.missingCooler ? (result.missingCooler / totalCooler) * 100 : 0);
		openAlarm = result.activeAlert;
		$('#openAlarm').data('easyPieChart').update(result.openAlert ? (result.openAlert / result.totalAlertCreated) * 100 : 0);
		closedAlarm = result.closedAlarm;
		$('#closedAlarm').data('easyPieChart').update(result.closedAlarm ? (result.closedAlarm / result.totalNoOfAlarms) * 100 : 0);

		//$('#assetAlarmRate').html('<i class="fa fa-arrow-circle-up"></i>&nbsp;' + (result.totalCooler == 0 ? 0 : (result.assetAlarmRate / result.totalCooler) * 100).toFixed(2) + '%');
		//$('#openAlarm').html('<i class="fa fa-arrow-circle-up"></i>&nbsp;' + result.openAlert);
		//$('#closedAlarm').html('<i class="fa fa-arrow-circle-up"></i>&nbsp;' + result.closedAlarm);
		//$('#missing').html('<i class="fa fa-arrow-circle-up"></i>&nbsp;' + result.missingCooler);
		//$('#powerOff').html('<i class="fa fa-arrow-circle-up"></i>&nbsp;' + result.isPowerOff);

	}
}

function applySalesDashboardChartsAlarmBySeller(result) {
	//coolerDashboard.gridUtils.ajaxIndicatorStop();
	$('#salesRepChart').spin(false);
	//$('#customerChart').spin(false);
	result = result.data;
	if (result) {
		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Active Alerts',
				type: 'column',
				data: function (record) {
					return record.OpenAlert;
				}
			}, {
				name: 'Closed Alerts',
				type: 'column',
				data: function (record) {
					return record.CloseAlert;
				}
			}, {
				name: 'New Alerts',
				type: 'line',
				lineWidth: 0,
				marker: {
					enabled: true,
					radius: 3
				},
				tooltip: {
					valueDecimals: 0
				},
				states: {
					hover: {
						lineWidthPlus: 0
					}
				},
				data: function (record) {
					return record.NewAlert;
				}
			}],
			xAxis: function (record) {
				return record.Name;
			},
			data: result.alarmBySeller
		});

		$('#alarmBySeller').highcharts({
			chart: {
				renderTo: 'alarmBySeller'
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
					text: 'Count'
				},
				min: 0
			}, ],
			plotOptions: {
				column: {
					stacking: 'normal',
					dataLabels: {
						enabled: true,
						color: 'white',
						x: 10
					}
				}
			},
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});

		var timeralarmBySeller = setInterval(function () {
			if (!$("#alarmBySeller").highcharts()) {
				clearInterval(timeralarmBySeller);
			} else
				$("#alarmBySeller").highcharts().reflow();
		}, 1);
	}
}

function applySalesDashboardChartsAlarmByCustomer(result) {
	//coolerDashboard.gridUtils.ajaxIndicatorStop();
	//$('#salesRepChart').spin(false);
	$('#customerChart').spin(false);
	result = result.data;
	if (result) {

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Active Alerts',
				type: 'column',
				data: function (record) {
					return record.OpenAlert;
				}
			}, {
				name: 'Closed Alerts',
				type: 'column',
				data: function (record) {
					return record.CloseAlert;
				}
			}, {
				name: 'New Alerts',
				type: 'line',
				lineWidth: 0,
				marker: {
					enabled: true,
					radius: 3
				},
				tooltip: {
					valueDecimals: 0
				},
				states: {
					hover: {
						lineWidthPlus: 0
					}
				},
				data: function (record) {
					return record.NewAlert;
				}
			}],
			xAxis: function (record) {
				if (record.Name.length > 15) {
					return record.Name.substr(0, 15) + "...";
				} else
					return record.Name.substr(0, 15);

			},
			data: result.alarmByCustomer
		});

		$('#alarmByCustomer').highcharts({
			chart: {
				renderTo: 'alarmByCustomer'
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
					text: 'Count'
				},
				min: 0
			}, ],
			plotOptions: {
				column: {
					stacking: 'normal',
					dataLabels: {
						enabled: true,
						color: 'white',
						x: 8
					}
				}
			},
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});

		var timeralarmByCustomer = setInterval(function () {
			if (!$("#alarmByCustomer").highcharts()) {
				clearInterval(timeralarmByCustomer);
			} else
				$("#alarmByCustomer").highcharts().reflow();
		}, 1);

	}
}

function loadSalesRepChartAlarmBySeller(groupBySales) {
	if (!groupBySales) {
		groupBySales = 'SalesTerritory';
	}
	//coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
	var sellerTopArr = _.filter(this.filterValuesChart, function (data) {
		return data.name == 'sellerTop'
	});
	var customerTopArr = _.filter(this.filterValuesChart, function (data) {
		return data.name == 'customerTop'
	});
	var groupByArr = _.filter(this.filterValuesChart, function (data) {
		return data.name == 'groupBySales'
	});
	var index = jQuery.inArray(sellerTopArr[0], this.filterValuesChart);
	var sellerTopIndexes = jQuery.inArray(sellerTopArr[0], this.filterValuesChart);
	var customerTopIndexes = jQuery.inArray(customerTopArr[0], this.filterValuesChart);
	var salesRepTopIndexes = jQuery.inArray(groupByArr[0], this.filterValuesChart);
	if (sellerTopIndexes == -1) {
		this.filterValuesChart.push({
			'name': 'sellerTop',
			'value': sellerTopValue
		});
	} else {
		this.filterValuesChart[sellerTopIndexes].value = sellerTopValue;
	}
	if (customerTopIndexes == -1) {
		this.filterValuesChart.push({
			'name': 'customerTop',
			'value': customerTopValue
		});
	} else {
		this.filterValuesChart[customerTopIndexes].value = customerTopValue;
	}

	if (salesRepTopIndexes == -1) {
		this.filterValuesChart.push({
			'name': 'groupBySales',
			'value': groupBySales
		});
	} else {
		this.filterValuesChart[salesRepTopIndexes].value = groupBySales;
	}

	$('#salesRepChart').spin(coolerDashboard.common.smallSpin);
	//$('#customerChart').spin(coolerDashboard.common.smallSpin);
	$.ajax({
		url: coolerDashboard.common.nodeUrl('getSalesWidgetSalesRep'),
		data: this.filterValuesChart,
		type: 'POST',
		success: applySalesDashboardChartsAlarmBySeller,
		failure: function (response, opts) {
			//coolerDashboard.gridUtils.ajaxIndicatorStop();
			$('#salesRepChart').spin(false);
			//$('#customerChart').spin(false);
		},
		scope: this
	});
}

function loadSalesRepChartAlarmByCustomer(groupBySales) {
	if (!groupBySales) {
		groupBySales = 'SalesTerritory';
	}
	//coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
	var sellerTopArr = _.filter(this.filterValuesChart, function (data) {
		return data.name == 'sellerTop'
	});
	var customerTopArr = _.filter(this.filterValuesChart, function (data) {
		return data.name == 'customerTop'
	});
	var groupByArr = _.filter(this.filterValuesChart, function (data) {
		return data.name == 'groupBySales'
	});
	var index = jQuery.inArray(sellerTopArr[0], this.filterValuesChart);
	var sellerTopIndexes = jQuery.inArray(sellerTopArr[0], this.filterValuesChart);
	var customerTopIndexes = jQuery.inArray(customerTopArr[0], this.filterValuesChart);
	var salesRepTopIndexes = jQuery.inArray(groupByArr[0], this.filterValuesChart);
	if (sellerTopIndexes == -1) {
		this.filterValuesChart.push({
			'name': 'sellerTop',
			'value': sellerTopValue
		});
	} else {
		this.filterValuesChart[sellerTopIndexes].value = sellerTopValue;
	}
	if (customerTopIndexes == -1) {
		this.filterValuesChart.push({
			'name': 'customerTop',
			'value': customerTopValue
		});
	} else {
		this.filterValuesChart[customerTopIndexes].value = customerTopValue;
	}

	if (salesRepTopIndexes == -1) {
		this.filterValuesChart.push({
			'name': 'groupBySales',
			'value': groupBySales
		});
	} else {
		this.filterValuesChart[salesRepTopIndexes].value = groupBySales;
	}

	//$('#salesRepChart').spin(coolerDashboard.common.smallSpin);
	$('#customerChart').spin(coolerDashboard.common.smallSpin);

	$.ajax({
		url: coolerDashboard.common.nodeUrl('getSalesWidgetSalesRep'),
		data: this.filterValuesChart,
		type: 'POST',
		success: applySalesDashboardChartsAlarmByCustomer,
		failure: function (response, opts) {
			//coolerDashboard.gridUtils.ajaxIndicatorStop();
			//$('#salesRepChart').spin(false);
			$('#customerChart').spin(false);
		},
		scope: this
	});
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
				setTimeout(function(){
					loadSalesRepChartAlarmBySeller(groupBySales);
					loadSalesRepChartAlarmByCustomer(groupBySales);
				}, 0)

				var filter = JSON.parse(JSON.stringify(filterValuesChart));
				$.ajax({
					url: coolerDashboard.common.nodeUrl('getSalesWidget'),
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
			url: coolerDashboard.common.nodeUrl('getSalesWidget'),
			data: filterValuesChart,
			type: 'POST',
			success: applyDashboardCharts,
			failure: function (response, opts) {
				coolerDashboard.gridUtils.ajaxIndicatorStop();
			},
			scope: this
		});
	}

	//loadSalesRepChart(groupBySales);

}

$(function () {

	coolerDashboard.gridUtils.initGridStackDynamicView();

	$("#filterFormKPI").load('views/common/filter.html');
	$("#filterSummary").load('views/common/filterSummary.html');
	//pageSetUp();

	//used to full screen 
	setup_widgets_desktop_extended();

	$('#openAlarm').easyPieChart({
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
	$('#closedAlarm').easyPieChart({
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

	sellerTopValue = $("#sellerTop").is(':checked');
	customerTopValue = $("#customerTop").is(':checked');

	$("#sellerTop").click(function () {
		sellerTopValue = $('#sellerTop').is(':checked');
		//loadSalesRepChart(groupBySales);
		loadSalesRepChartAlarmBySeller(groupBySales);
	});

	$("#customerTop").click(function () {
		customerTopValue = $('#customerTop').is(':checked');
		//loadSalesRepChart(groupBySales);
		loadSalesRepChartAlarmByCustomer(groupBySales);
	});

	$(".js-status-update a").click(function () {
		var selText = $(this).text();
		var $this = $(this);
		$this.parents('.btn-group').find('.dropdown-toggle').html(selText + ' <span class="caret"></span>');
		$this.parents('.dropdown-menu').find('li').removeClass('active');
		$this.parent().addClass('active');
		groupBySales = 'SalesTerritory';
		switch (selText) {
			case ' Sales Rep':
				groupBySales = 'SalesRep';
				break;
			case ' Sales Territory':
				groupBySales = 'SalesTerritory';
				break;
			case ' Sales Group':
				groupBySales = 'SalesGroup';
				break;
			case ' Sales Office':
				groupBySales = 'SalesOffice';
				break;
			case ' Sales Org':
				groupBySales = 'SalesOrg';
				break;
			default:
				groupBySales = 'SalesTerritory';
				break;
		}
		//loadSalesRepChart(groupBySales);
		loadSalesRepChartAlarmBySeller(groupBySales);
		//loadSalesRepChartAlarmByCustomer(groupBySales);
	});
	//$('#missing').easyPieChart({
	//	size: 50, //110
	//	barColor: '#a90329',
	//	scaleColor: false,
	//	lineWidth: 4,
	//	onStep: function (from, to, percent) {
	//		$(this.el).find('.percent').text(coolerMissing);
	//	}
	//});
	var filterValues = {};

	var emptyData = {
		salesVisit: {
			Date: '',
			VisitDuration: '',
			CountofVisit: ''
		},
		alertsByTypeBoth: {
			AlarmType: '',
			Count: ''
		},
		totalCooler: 0,
		coolerSelected: 0,
		alarmBySeller: {
			Name: '',
			Value: ''
		},
		alarmByCustomer: {
			Name: '',
			Value: ''
		},
		openAlerts: '',
		alertsByWeek: ''
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