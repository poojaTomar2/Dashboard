var chartData;
var markers = [];
var markerCluster;
var map;
var filterValues = {};
var jsonFilter = JSON.stringify({
	"start": 0,
	"limit": 10
});

function applyDashboardCharts(result) {
	result = result.data;
	$('#tempAndSalesChart').spin(false);
	$('#lightAndSalesChart').spin(false);

	Highcharts.setOptions({
		lang: {
			thousandsSep: ','
		}
	});
	//coolerDashboard.gridUtils.ajaxIndicatorStop();
	if (result) {
		result.tempAndSales = _.sortBy(result.tempAndSales, "Date").reverse();
		result.openAlarmSales = _.sortBy(result.openAlarmSales, "Date").reverse();
		result.powerOnSales = _.sortBy(result.powerOnSales, "Date").reverse();
		result.lightOnSales = _.sortBy(result.lightOnSales, "Date").reverse();
		result.visitFrequencySales = _.sortBy(result.visitFrequencySales, "Date").reverse();
		result.visitDurationSales = _.sortBy(result.visitDurationSales, "Date").reverse();
		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Total Case Volume Sold',
				type: 'column',
				color: '#00FF00',
				yAxis: 0,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.TotalUnitSold))]
					return dataArray;
				}
			}, {
				name: 'Temperature',
				type: 'spline',
				yAxis: 1,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.Value))]
					return dataArray;
				}
			}, {
				name: 'Sales Target',
				type: 'column',
				yAxis: 0,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.SalesTarget))]
					return dataArray;
				}
			}, {
				name: 'Door Actual',
				type: 'column',
				yAxis: 2,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.DoorActual))]
					return dataArray;
				}
			}, {
				name: 'Door Target',
				type: 'column',
				yAxis: 2,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.DoorCountTarget))]
					return dataArray;
				}
			}],
			data: result.tempAndSales
		});

		$('#tempAndSales').highcharts({
			chart: {
				renderTo: 'tempAndSales'
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
					text: 'Total case volume sold'
				}
			}, {
				title: {
					text: 'Temperature'
				},
				opposite: true
			}, {
				title: {
					text: 'Door Count'
				}
			}],
			plotOptions: {
				column: {
					groupPadding: 1,
					pointWidth: 20
				}
			},
			tooltip: {
				headerFormat: '<b>{series.name}</b><br>',
				pointFormat: '{point.x:%b}: {point.y:.2f}'
			},
			xAxis: [{
				type: 'datetime',
				tickInterval: 30 * 24 * 3600 * 1000,
				dateTimeLabelFormats: {
					day: '%b',
					month: ' %b',
					year: '%b'
				}
			}],
			series: seriesData.series
		});



		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Total Case Volume Sold',
				type: 'column',
				color: 'red',
				yAxis: 0,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.TotalUnitSold))]
					return dataArray;
				}
			}, {
				name: 'Light On (Hour)',
				type: 'spline',
				yAxis: 1,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.Value))]
					return dataArray;
				}
			}, {
				name: 'Sales Target',
				type: 'column',
				yAxis: 0,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.SalesTarget))]
					return dataArray;
				}
			}, {
				name: 'Door Actual',
				type: 'column',
				yAxis: 2,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.DoorActual))]
					return dataArray;
				}
			}, {
				name: 'Door Target',
				type: 'column',
				yAxis: 2,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.DoorCountTarget))]
					return dataArray;
				}
			}],
			data: result.lightOnSales
		});
		$('#lightOnSales').highcharts({
			chart: {
				renderTo: 'lightOnSales',
				thousandsSep: ','
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
			tooltip: {
				headerFormat: '<b>{series.name}</b><br>',
				pointFormat: '{point.x:%b}: {point.y:.2f}'
			},
			plotOptions: {
				column: {
					groupPadding: 1,
					pointWidth: 20
				}
			},
			title: {
				text: ''
			},
			yAxis: [{
					title: {
						text: 'Total Case Volume Sold'
					}
				}, {
					title: {
						text: 'Light On (Hour)'
					},
					opposite: true
				}, {
					title: {
						text: 'Door Count'
					}
				}

			],
			xAxis: [{
				type: 'datetime',
				tickInterval: 30 * 24 * 3600 * 1000,
				dateTimeLabelFormats: {
					day: '%b',
					month: ' %b',
					year: '%b'
				}
			}],
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
		}, 50)
		$('#totalCooler').html(totalCooler);
		$('#coolerSelectedKPI').html(result.filteredAssets);
		$('#coolerSelectedPercentageKPI').data('easyPieChart').update(totalCooler == 0 ? 0 : (result.filteredAssets / totalCooler) * 100);
		$('#totalSmartCooler').html(result.totalSmartAssetCount);
		$('#smartCoolerSelectedKPI').html(result.smartAssetCount);
		// $('#smartCoolerSelectedPercentageKPI').data('easyPieChart').update(result.totalSmartAssetCount == 0 ? 0 : (result.smartAssetCount / result.totalSmartAssetCount) * 100);
		$('#smartCoolerSelectedPercentageKPI').data('easyPieChart').update(result.filteredAssets == 0 ? 0 : (result.smartAssetCount / result.filteredAssets) * 100);
	
				
		$('#smartCoolerWareHouseSelectedKPI').html(result.smartAssetCountWareHouse);
		$('#smartCoolerWareHouseSelectedPercentageKPI').data('easyPieChart').update(result.filteredAssets == 0 ? 0 : (result.smartAssetCountWareHouse / result.filteredAssets) * 100);

	}
}

function applyDashboardChartsAlert(result) {
	result = result.data;
	$('#openAlarmAndSalesChart').spin(false);
	//coolerDashboard.gridUtils.ajaxIndicatorStop();
	if (result) {
		//result.openAlarmSales = result.openAlarmSales.filter(data => data.Value != 0);
		result.openAlarmSales = _.sortBy(result.openAlarmSales, "Date").reverse();
		result.openAlarmSales = _.filter(result.openAlarmSales, function (data) {
			return moment.utc().diff(moment.utc(data.DateValue), 'days') >= 0
		});
		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Total Case Volume Sold',
				type: 'column',
				yAxis: 0,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.TotalUnitSold))]
					return dataArray;
				}
			}, {
				name: 'Active Alerts',
				type: 'spline',
				yAxis: 1,
				data: function (record) {
					var dataArray = [];
					//	if(!record.Value){
					//		return;
					//	}
					//var value = record.Value ? Math.round((record.Value)) : null;
					dataArray = [moment.utc(record.DateValue).startOf('month').valueOf(), coolerDashboard.common.floatValue((record.Value))]
					return dataArray;
				}
			}, {
				name: 'Sales Target',
				type: 'column',
				yAxis: 0,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.SalesTarget))]
					return dataArray;
				}
			}, {
				name: 'Door Actual',
				type: 'column',
				yAxis: 2,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.DoorActual))]
					return dataArray;
				}
			}, {
				name: 'Door Target',
				type: 'column',
				yAxis: 2,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.DoorCountTarget))]
					return dataArray;
				}
			}],
			data: result.openAlarmSales
		});
		//seriesData.series[1].data = seriesData.series[1].data.filter(data => data['1'] != 0);
		$('#openAlarmSales').highcharts({
			chart: {
				renderTo: 'openAlarmSales'
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
			tooltip: {
				headerFormat: '<b>{series.name}</b><br>',
				pointFormat: '{point.x:%b}: {point.y:.2f}'
			},
			title: {
				text: ''
			},
			yAxis: [{
					title: {
						text: 'Total case volume sold'
					}
				}, {
					title: {
						text: 'Active Alerts'
					},
					opposite: true,
					min: 0
				}, {
					title: {
						text: 'Door Count'
					}
				}

			],
			plotOptions: {
				column: {
					groupPadding: 1,
					pointWidth: 20
				}
			},
			xAxis: [{
				type: 'datetime',
				tickInterval: 30 * 24 * 3600 * 1000,
				dateTimeLabelFormats: {
					day: '%b',
					month: ' %b',
					year: '%b'
				}
			}],
			series: seriesData.series
		});

		result = result.summary;
		var totalCooler = result.totalCooler ? result.totalCooler : 0;
		if ($('#filterForm').serializeArray().length == 0) {
			result.filteredOutlets = result.totalCustomer;
			result.filteredAssets = result.totalCooler;
		}
		$('#totalCustomer').html(result.totalCustomer);
		$('#customerSelectedKPI').html(result.filteredOutlets);
		$('#customerSelectedPercentageKPI').data('easyPieChart').update(result.totalCustomer == 0 ? 0 : (result.filteredOutlets / result.totalCustomer) * 100);
		$('#totalCooler').html(totalCooler);
		$('#coolerSelectedKPI').html(result.filteredAssets);
		$('#coolerSelectedPercentageKPI').data('easyPieChart').update(totalCooler == 0 ? 0 : (result.filteredAssets / totalCooler) * 100);

	}
}

function applyDashboardChartsPower(result) {
	result = result.data;
	$('#powerAndSalesChart').spin(false);
	//coolerDashboard.gridUtils.ajaxIndicatorStop();
	if (result) {
		result.powerOnSales = _.sortBy(result.powerOnSales, "Date").reverse();

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Total Case Volume Sold',
				type: 'column',
				yAxis: 0,
				color: 'green',
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.TotalUnitSold))]
					return dataArray;
				}
			}, {
				name: 'Power On (Hour)',
				type: 'spline',
				yAxis: 1,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.Value).toFixed(1))]
					return dataArray;
				}
			}, {
				name: 'Sales Target',
				type: 'column',
				yAxis: 0,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.SalesTarget))]
					return dataArray;
				}
			}, {
				name: 'Door Actual',
				type: 'column',
				yAxis: 2,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.DoorActual))]
					return dataArray;
				}
			}, {
				name: 'Door Target',
				type: 'column',
				yAxis: 2,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.DoorCountTarget))]
					return dataArray;
				}
			}],
			data: result.powerOnSales
		});

		$('#powerOnSales').highcharts({
			chart: {
				renderTo: 'powerOnSales'
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
			tooltip: {
				headerFormat: '<b>{series.name}</b><br>',
				pointFormat: '{point.x:%b}: {point.y:.2f}'
			},
			title: {
				text: ''
			},
			yAxis: [{
				title: {
					text: 'Total case volume sold'
				}
			}, {
				title: {
					text: 'Power On (Hour)'
				},
				opposite: true,
				minPadding: 0,
				maxPadding: 0,
				min: 0,
				showLastLabel: false
			}, {
				title: {
					text: 'Door Count'
				}
			}],
			plotOptions: {
				column: {
					groupPadding: 1,
					pointWidth: 20
				}
			},
			xAxis: [{
				type: 'datetime',
				tickInterval: 30 * 24 * 3600 * 1000,
				dateTimeLabelFormats: {
					day: '%b',
					month: ' %b',
					year: '%b'
				}
			}],
			series: seriesData.series
		});
		result = result.summary;
		var totalCooler = result.totalCooler ? result.totalCooler : 0;
		if ($('#filterForm').serializeArray().length == 0) {
			result.filteredOutlets = result.totalCustomer;
			result.filteredAssets = result.totalCooler;
		}
		$('#totalCustomer').html(result.totalCustomer);
		$('#customerSelectedKPI').html(result.filteredOutlets);
		$('#customerSelectedPercentageKPI').data('easyPieChart').update(result.totalCustomer == 0 ? 0 : (result.filteredOutlets / result.totalCustomer) * 100);
		$('#totalCooler').html(totalCooler);
		$('#coolerSelectedKPI').html(result.filteredAssets);
		$('#coolerSelectedPercentageKPI').data('easyPieChart').update(totalCooler == 0 ? 0 : (result.filteredAssets / totalCooler) * 100);

	}
}

function applyDashboardChartsVisit(result) {
	result = result.data;
	$('#visitFrequencyAndSalesChart').spin(false);
	$('#visitDurationAndSalesChart').spin(false);
	//coolerDashboard.gridUtils.ajaxIndicatorStop();
	if (result) {
		result.visitFrequencySales = _.sortBy(result.visitFrequencySales, "Date").reverse();
		result.visitDurationSales = _.sortBy(result.visitDurationSales, "Date").reverse();

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Total Case Volume Sold',
				type: 'column',
				yAxis: 0,
				color: 'skyblue',
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.TotalUnitSold))]
					return dataArray;
				}
			}, {
				name: 'Visit Frequency',
				type: 'spline',
				yAxis: 1,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.Value))]
					return dataArray;
				}
			}, {
				name: 'Sales Target',
				type: 'column',
				yAxis: 0,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.SalesTarget))]
					return dataArray;
				}
			}, {
				name: 'Door Actual',
				type: 'column',
				yAxis: 2,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.DoorActual))]
					return dataArray;
				}
			}, {
				name: 'Door Target',
				type: 'column',
				yAxis: 2,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.DoorCountTarget))]
					return dataArray;
				}
			}],
			data: result.visitFrequencySales
		});

		$('#visitFrequencySales').highcharts({
			chart: {
				renderTo: 'visitFrequencySales'
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
			tooltip: {
				headerFormat: '<b>{series.name}</b><br>',
				pointFormat: '{point.x:%b}: {point.y:.2f}'
			},
			title: {
				text: ''
			},
			yAxis: [{
				title: {
					text: 'Total Case Volume Sold'
				}
			}, {
				title: {
					text: 'Visit frequency'
				},
				opposite: true
			}, {
				title: {
					text: 'Door Count'
				}
			}],
			plotOptions: {
				column: {
					groupPadding: 1,
					pointWidth: 20
				}
			},
			xAxis: [{
				type: 'datetime',
				tickInterval: 30 * 24 * 3600 * 1000,
				dateTimeLabelFormats: {
					day: '%b',
					month: ' %b',
					year: '%b'
				}
			}],
			series: seriesData.series
		});


		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Total Case Volume Sold',
				type: 'column',
				color: 'pink',
				yAxis: 0,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.TotalUnitSold))]
					return dataArray;
				}
			}, {
				name: 'Visit Duration',
				type: 'spline',
				yAxis: 1,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.Value))]
					return dataArray;
				}
			}, {
				name: 'Sales Target',
				type: 'column',
				yAxis: 0,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.SalesTarget))]
					return dataArray;
				}
			}, {
				name: 'Door Actual',
				type: 'column',
				yAxis: 2,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.DoorActual))]
					return dataArray;
				}
			}, {
				name: 'Door Target',
				type: 'column',
				yAxis: 2,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.DoorCountTarget))]
					return dataArray;
				}
			}],
			data: result.visitDurationSales
		});

		$('#visitDurationSales').highcharts({
			chart: {
				renderTo: 'visitDurationSales'
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
			tooltip: {
				headerFormat: '<b>{series.name}</b><br>',
				pointFormat: '{point.x:%b}: {point.y:.2f}'
			},
			title: {
				text: ''
			},
			yAxis: [{
				title: {
					text: 'Total Case Volume Sold'
				}
			}, {
				title: {
					text: 'Visit Duration (Mins)'
				},
				opposite: true
			}, {
				title: {
					text: 'Door Count'
				}
			}],
			plotOptions: {
				column: {
					groupPadding: 1,
					pointWidth: 20
				}
			},
			xAxis: [{
				type: 'datetime',
				tickInterval: 30 * 24 * 3600 * 1000,
				dateTimeLabelFormats: {
					day: '%b',
					month: ' %b',
					year: '%b'
				}
			}],
			series: seriesData.series
		});

		result = result.summary;
		var totalCooler = result.totalCooler ? result.totalCooler : 0;
		if ($('#filterForm').serializeArray().length == 0) {
			result.filteredOutlets = result.totalCustomer;
			result.filteredAssets = result.totalCooler;
		}
		$('#totalCustomer').html(result.totalCustomer);
		$('#customerSelectedKPI').html(result.filteredOutlets);
		$('#customerSelectedPercentageKPI').data('easyPieChart').update(result.totalCustomer == 0 ? 0 : (result.filteredOutlets / result.totalCustomer) * 100);
		$('#totalCooler').html(totalCooler);
		$('#coolerSelectedKPI').html(result.filteredAssets);
		$('#coolerSelectedPercentageKPI').data('easyPieChart').update(totalCooler == 0 ? 0 : (result.filteredAssets / totalCooler) * 100);

	}
}

function applyDashboardChartsDoor(result) {
	result = result.data;
	$('#doorUtilizationAndSalesChart').spin(false);
	$('#salesUtilizationAndSalesChart').spin(false);
	//coolerDashboard.gridUtils.ajaxIndicatorStop();
	if (result) {
		result.doorUtilizationSales = _.sortBy(result.doorUtilizationSales, "Date").reverse();

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Total Case Volume Sold',
				type: 'column',
				yAxis: 0,
				color: 'green',
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.TotalUnitSold))]
					return dataArray;
				}
			}, {
				name: 'Low',
				type: 'column',
				yAxis: 1,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.LowValue).toFixed(1))]
					return dataArray;
				}
			}, {
				name: 'Medium',
				type: 'column',
				yAxis: 1,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.MediumValue).toFixed(1))]
					return dataArray;
				}
			}, {
				name: 'High',
				type: 'column',
				yAxis: 1,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.HighValue).toFixed(1))]
					return dataArray;
				}
			}, {
				name: 'Sales Target',
				type: 'column',
				yAxis: 0,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.SalesTarget))]
					return dataArray;
				}
			}, {
				name: 'Door Actual',
				type: 'column',
				yAxis: 2,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.DoorActual))]
					return dataArray;
				}
			}, {
				name: 'Door Target',
				type: 'column',
				yAxis: 2,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.DoorCountTarget))]
					return dataArray;
				}
			}],
			data: result.doorUtilizationSales
		});

		$('#doorUtilizationAndSales').highcharts({
			chart: {
				renderTo: 'doorUtilizationAndSales'
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
			tooltip: {
				headerFormat: '<b>{series.name}</b><br>',
				pointFormat: '{point.x:%b}: {point.y:.2f}'
			},
			title: {
				text: ''
			},
			yAxis: [{
				title: {
					text: 'Total case volume sold'
				}
			}, {
				title: {
					text: 'Asset Count'
				},
				opposite: true
			}, {
				title: {
					text: 'Door Count'
				}
			}],
			plotOptions: {
				column: {
					groupPadding: 1,
					pointWidth: 20
				}
			},
			xAxis: [{
				type: 'datetime',
				tickInterval: 30 * 24 * 3600 * 1000,
				dateTimeLabelFormats: {
					day: '%b',
					month: ' %b',
					year: '%b'
				}
			}],
			series: seriesData.series
		});

		result.salesUtilizationSales = _.sortBy(result.salesUtilizationSales, "Date").reverse();

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Total Case Volume Sold',
				type: 'column',
				yAxis: 0,
				color: 'green',
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.TotalUnitSold))]
					return dataArray;
				}
			}, {
				name: 'Low',
				type: 'column',
				yAxis: 1,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.LowValue).toFixed(1))]
					return dataArray;
				}
			}, {
				name: 'Medium',
				type: 'column',
				yAxis: 1,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.MediumValue).toFixed(1))]
					return dataArray;
				}
			}, {
				name: 'High',
				type: 'column',
				yAxis: 1,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.HighValue).toFixed(1))]
					return dataArray;
				}
			}, {
				name: 'Sales Target',
				type: 'column',
				yAxis: 0,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.SalesTarget))]
					return dataArray;
				}
			}, {
				name: 'Door Actual',
				type: 'column',
				yAxis: 2,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.DoorActual))]
					return dataArray;
				}
			}, {
				name: 'Door Target',
				type: 'column',
				yAxis: 2,
				data: function (record) {
					var dataArray = [];
					dataArray = [moment.utc(record.DateValue).valueOf(), coolerDashboard.common.floatValue((record.DoorCountTarget))]
					return dataArray;
				}
			}],
			data: result.salesUtilizationSales
		});

		$('#salesUtilizationAndSales').highcharts({
			chart: {
				renderTo: 'salesUtilizationAndSales'
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
			tooltip: {
				headerFormat: '<b>{series.name}</b><br>',
				pointFormat: '{point.x:%b}: {point.y:.2f}'
			},
			title: {
				text: ''
			},
			yAxis: [{
				title: {
					text: 'Total case volume sold'
				}
			}, {
				title: {
					text: 'Location Count'
				},
				opposite: true
			}, {
				title: {
					text: 'Door Count'
				}
			}],
			plotOptions: {
				column: {
					groupPadding: 1,
					pointWidth: 20
				}
			},
			xAxis: [{
				type: 'datetime',
				tickInterval: 30 * 24 * 3600 * 1000,
				dateTimeLabelFormats: {
					day: '%b',
					month: ' %b',
					year: '%b'
				}
			}],
			series: seriesData.series
		});
		result = result.summary;
		var totalCooler = result.totalCooler ? result.totalCooler : 0;
		if ($('#filterForm').serializeArray().length == 0) {
			result.filteredOutlets = result.totalCustomer;
			result.filteredAssets = result.totalCooler;
		}
		$('#totalCustomer').html(result.totalCustomer);
		$('#customerSelectedKPI').html(result.filteredOutlets);
		$('#customerSelectedPercentageKPI').data('easyPieChart').update(result.totalCustomer == 0 ? 0 : (result.filteredOutlets / result.totalCustomer) * 100);
		$('#totalCooler').html(totalCooler);
		$('#coolerSelectedKPI').html(result.filteredAssets);
		$('#coolerSelectedPercentageKPI').data('easyPieChart').update(totalCooler == 0 ? 0 : (result.filteredAssets / totalCooler) * 100);

	}
}

function sendAjax(firstLoad) {
	if (jQuery.isEmptyObject(this.filterValuesChart)) {
		var startDate = moment().subtract(364, 'days');
		var endDate = moment();
		this.filterValuesChart = [];
		if (startDate && endDate) {
			this.filterValuesChart.push({
				"name": "startDateCorrelation",
				"value": startDate.format('YYYY-MM-DD[T00:00:00]')
			})
			this.filterValuesChart.push({
				"name": "endDateCorrelation",
				"value": endDate.format('YYYY-MM-DD[T23:59:59]')
			})
		}
	}
	var startDateCorrelationArr = _.filter(this.filterValuesChart, function (data) {
		return data.name == 'startDateCorrelation'
	});
	var endDateCorrelationArr = _.filter(this.filterValuesChart, function (data) {
		return data.name == 'endDateCorrelation'
	});
	if (firstLoad) {
		var startDate = moment().subtract(364, 'days');
		var endDate = moment();

		var index = jQuery.inArray(startDateCorrelationArr[0], this.filterValuesChart);
		if (index != -1) {
			this.filterValuesChart[index].value = startDate.format('YYYY-MM-DD[T00:00:00]')
		} else {
			this.filterValuesChart.push({
				"name": "startDateCorrelation",
				"value": startDate.format('YYYY-MM-DD[T00:00:00]')
			})
		}
		index = jQuery.inArray(endDateCorrelationArr[0], this.filterValuesChart);
		if (index != -1) {
			this.filterValuesChart[index].value = endDate.format('YYYY-MM-DD[T00:00:00]')
		} else {
			this.filterValuesChart.push({
				"name": "endDateCorrelation",
				"value": endDate.format('YYYY-MM-DD[T23:59:59]')
			})
		}
	} else if (startDateCorrelationArr && startDateCorrelationArr.length == 0) {
		var startDate = _.filter(this.filterValuesChart, function (data) {
			return data.name == 'startDate'
		})[0].value;
		var endDate = _.filter(this.filterValuesChart, function (data) {
			return data.name == 'endDate'
		})[0].value;
		startDate = moment(startDate);
		endDate = moment(endDate);
		var index = jQuery.inArray(startDateCorrelationArr[0], this.filterValuesChart);
		if (index != -1) {
			this.filterValuesChart[index].value = startDate.format('YYYY-MM-DD[T00:00:00]')
		} else {
			this.filterValuesChart.push({
				"name": "startDateCorrelation",
				"value": startDate.format('YYYY-MM-DD[T00:00:00]')
			})
		}
		index = jQuery.inArray(endDateCorrelationArr[0], this.filterValuesChart);
		if (index != -1) {
			this.filterValuesChart[index].value = endDate.format('YYYY-MM-DD[T00:00:00]')
		} else {
			this.filterValuesChart.push({
				"name": "endDateCorrelation",
				"value": endDate.format('YYYY-MM-DD[T23:59:59]')
			})
		}
	}


	//coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');

	$('#tempAndSalesChart').spin(coolerDashboard.common.smallSpin);
	$('#powerAndSalesChart').spin(coolerDashboard.common.smallSpin);
	$('#lightAndSalesChart').spin(coolerDashboard.common.smallSpin);
	$('#openAlarmAndSalesChart').spin(coolerDashboard.common.smallSpin);
	$('#visitFrequencyAndSalesChart').spin(coolerDashboard.common.smallSpin);
	$('#visitDurationAndSalesChart').spin(coolerDashboard.common.smallSpin);
	$('#doorUtilizationAndSalesChart').spin(coolerDashboard.common.smallSpin);
	$('#salesUtilizationAndSalesChart').spin(coolerDashboard.common.smallSpin);

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
	//debugger;
	

    setTimeout(function () {
			
	}, 1000)
	
	$("#assetGridFilter").DataTable().ajax.reload();
	  setTimeout(function () {
			
	}, 1000)
	
	$("#locationGridFilter").DataTable().ajax.reload();

	$.ajax({
		url: coolerDashboard.common.nodeUrl('getSalesCorrelation'),
		data: this.filterValuesChart,
		type: 'POST',
		success: applyDashboardCharts,
		failure: function (response, opts) {
			//coolerDashboard.gridUtils.ajaxIndicatorStop();
			$('#tempAndSalesChart').spin(false);
		},
		scope: this
	});
	$.ajax({
		url: coolerDashboard.common.nodeUrl('getSalesCorrelationAlert'),
		data: this.filterValuesChart,
		type: 'POST',
		success: applyDashboardChartsAlert,
		failure: function (response, opts) {
			//coolerDashboard.gridUtils.ajaxIndicatorStop();
			$('#openAlarmAndSalesChart').spin(false);
		},
		scope: this
	});
	$.ajax({
		url: coolerDashboard.common.nodeUrl('getSalesCorrelationPower'),
		data: this.filterValuesChart,
		type: 'POST',
		success: applyDashboardChartsPower,
		failure: function (response, opts) {
			//	coolerDashboard.gridUtils.ajaxIndicatorStop();
			$('#powerAndSalesChart').spin(false);
		},
		scope: this
	});
	$.ajax({
		url: coolerDashboard.common.nodeUrl('getSalesCorrelationVisit'),
		data: this.filterValuesChart,
		type: 'POST',
		success: applyDashboardChartsVisit,
		failure: function (response, opts) {
			//coolerDashboard.gridUtils.ajaxIndicatorStop();
			$('#visitFrequencyAndSalesChart').spin(false);
			$('#visitDurationAndSalesChart').spin(false);
		},
		scope: this
	});

	$.ajax({
		url: coolerDashboard.common.nodeUrl('getSalesCorrelationDoor'),
		data: this.filterValuesChart,
		type: 'POST',
		success: applyDashboardChartsDoor,
		failure: function (response, opts) {
			//coolerDashboard.gridUtils.ajaxIndicatorStop();
			$('#doorUtilizationAndSalesChart').spin(false);
			$('#salesUtilizationAndSalesChart').spin(false);
		},
		scope: this
	});
	//$.ajax({
	//	url: './js/ajax/coolerStatus.json',
	//	data: coolerDashboard.common.defaultFilter,
	//	success: applyDashboardCharts,
	//	failure: function (response, opts) {
	//	},
	//	scope: this
	//});
}

$(function () {
	$("#filterFormKPI").load('views/common/filter.html');
	$("#filterSummary").load('views/common/filterSummary.html');
	//pageSetUp();
	setup_widgets_desktop_extended();
	//coolerDashboard.common.setFilter('KPI');

	var emptyData = {
		tempAndSales: {
			Date: '',
			TotalUnitSold: '',
			Value: ''
		},
		customereExposure: {
			Date: '',
			TotalUnitSold: '',
			Value: ''
		},
		powerOnSales: {
			Date: '',
			TotalUnitSold: '',
			Value: ''
		},
		lightOnSales: {
			Date: '',
			TotalUnitSold: '',
			Value: ''
		},
		totalCooler: 0,
		coolerSelected: 0
	};
	emptyData = JSON.stringify(emptyData);
	//applyDashboardCharts(emptyData);

	//sendAjax(true);
});