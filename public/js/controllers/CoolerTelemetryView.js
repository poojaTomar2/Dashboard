var chartData;
var markers = [];
var markerCluster;
var map;
var coolerMissing = 0;
var coolerAbove7 = 0;
var hoursLightOn = 0;
var hoursPowerOff = 0;
var coolerBelow30Light = 0;
var lowUtilization = 0;
var jsonFilter = JSON.stringify({
	"start": 0,
	"limit": 10
});
var filterValues = {};

function applyDashboardCharts(result) {
	result = result.data;
	coolerDashboard.gridUtils.ajaxIndicatorStop();
	if (result) {
		//=================Light Status=========================================//
		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'On',
				type: 'column',
				color: '#90ee7e',
				data: function (record) {
					return record.on;
				}
			}, {
				name: 'Off',
				type: 'column',
				color: '#f45b5b',
				data: function (record) {
					return record.off;
				}
			}, {
				name: 'No-Data',
				type: 'column',
				color: '#2b908f',
				data: function (record) {
					return record.nodata;
				}
			}],
			xAxis: function (record) {
				return record.name;
			},
			data: result.EventTypeLightStatus
		});

		$('#EventTypelightIOT').highcharts({
			chart: {
				renderTo: 'EventTypelightIOT',
				type: 'column'
			},
			exporting: {
				buttons: {
					contextButton: {
						align: 'right',
						x: 10,
						y: 0,
						verticalAlign: 'top'
					}
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

		var timerEventTypelightIOT = setInterval(function () {
			if (!$("#EventTypelightIOT").highcharts()) {
				clearInterval(timerEventTypelightIOT);
			} else
				$("#EventTypelightIOT").highcharts().reflow();
		}, 1);

		//=====================Light Status (SmartTag, SmartVision)=============================//
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
			data: result.lightBands
		});

		$('#lightIOT').highcharts({
			chart: {
				renderTo: 'lightIOT'
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
							coolerDashboard.common.onChartClick('telemetryLightStatus', event);
						}
					}
				}
			},
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});

		var timerlightIOT = setInterval(function () {
			if (!$("#lightIOT").highcharts()) {
				clearInterval(timerlightIOT);
			} else
				$("#lightIOT").highcharts().reflow();
		}, 1);
		//==========================Temperaature===============================//
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
					return record.assets ? coolerDashboard.common.floatValue(((record.assets / result.summary.totalCooler) * 100)) : 0
				}
			}],
			xAxis: function (record) {
				return record.key;
			},
			data: result.temperatureBands
		});

		$('#temperatureIOT').highcharts({
			chart: {
				renderTo: 'temperatureIOT'
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
							coolerDashboard.common.onChartClick('TemperatureTele', event);
						}
					}
				}
			},
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});

		var timertemperatureIOT = setInterval(function () {
			if (!$("#temperatureIOT").highcharts()) {
				clearInterval(timertemperatureIOT);
			} else
				$("#temperatureIOT").highcharts().reflow();
		}, 1);
		//=======================Door Open - Total For Selected Period================================
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
					return record.assets ? coolerDashboard.common.floatValue(((record.assets / result.summary.totalCooler) * 100)) : 0
				}
			}],
			xAxis: function (record) {
				return record.key;
			},
			data: result.doorData
		});

		$('#coolerUtilizationIOT').highcharts({
			chart: {
				renderTo: 'coolerUtilizationIOT'
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
							coolerDashboard.common.onChartClick('telemetryDoorCount', event);
						}
					}
				}
			},
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});

		var timercoolerUtilizationIOT = setInterval(function () {
			if (!$("#coolerUtilizationIOT").highcharts()) {
				clearInterval(timercoolerUtilizationIOT);
			} else
				$("#coolerUtilizationIOT").highcharts().reflow();
		}, 1);

		//========================Temperature And Light Status==================================
		var dataarray = [];
		dataarray.push({
			name: result.healthOverview[0].name,
			y: result.healthOverview[0].y,
			color: '#2C9090'
		});
		dataarray.push({
			name: result.healthOverview[1].name,
			y: result.healthOverview[1].y,
			color: '#F55B5B'
		});
		dataarray.push({
			name: result.healthOverview[2].name,
			y: result.healthOverview[2].y,
			color: '#90EE7E'
		});
		dataarray.push({
			name: result.healthOverview[3].name,
			y: result.healthOverview[3].y,
			color: '#7898BE'
		});

		$('#tempAndLightIssueIOT').highcharts({
			chart: {
				type: 'pie',
				renderTo: 'tempAndLightIssueIOT'
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
							coolerDashboard.common.onChartClick('TempLightIssue', event);
						}
					}
				}
			},
			title: {
				text: ''
			},
			series: [{
				name: 'Assets',
				colorByPoint: true,
				data: dataarray
			}]
		});

		var timertempAndLightIssueIOT = setInterval(function () {
			if (!$("#tempAndLightIssueIOT").highcharts()) {
				clearInterval(timertempAndLightIssueIOT);
			} else
				$("#tempAndLightIssueIOT").highcharts().reflow();
		}, 1);

		//=================================Evaporator Fan=========================
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
					return record.assets ? coolerDashboard.common.floatValue(((record.assets / result.summary.totalCooler) * 100)) : 0
				}
			}],
			xAxis: function (record) {
				return record.key;
			},
			data: result.fanData
		});

		$('#fanIOT').highcharts({
			chart: {
				renderTo: 'fanIOT'
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
							coolerDashboard.common.onChartClick('FanBand', event);
						}
					}
				}
			},
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});

		var timerfanIOT = setInterval(function () {
			if (!$("#fanIOT").highcharts()) {
				clearInterval(timerfanIOT);
			} else
				$("#fanIOT").highcharts().reflow();
		}, 1);

		//=================================Evaporator Temperatur====================
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
					return record.assets ? coolerDashboard.common.floatValue(((record.assets / result.summary.totalCooler) * 100)) : 0
				}
			}],
			xAxis: function (record) {
				return record.key;
			},
			data: result.evaporatortemperatureBands
		});

		$('#evaporatortemperatureIOT').highcharts({
			chart: {
				renderTo: 'evaporatortemperatureIOT'
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
							coolerDashboard.common.onChartClick('EvaporatorTemperatureTele', event);
						}
					}
				}
			},
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});

		var timerevaporatortemperatureIOT = setInterval(function () {
			if (!$("#evaporatortemperatureIOT").highcharts()) {
				clearInterval(timerevaporatortemperatureIOT);
			} else
				$("#evaporatortemperatureIOT").highcharts().reflow();
		}, 1);

		// condensor temperature 
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
					return record.assets ? coolerDashboard.common.floatValue(((record.assets / result.summary.totalCooler) * 100)) : 0
				}
			}],
			xAxis: function (record) {
				return record.key;
			},
			data: result.condensorTemperatureBands
		});

		$('#condensorTemperatureIOT').highcharts({
			chart: {
				renderTo: 'condensorTemperatureIOT'
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
			// plotOptions: {
			// 	series: {
			// 		cursor: 'pointer',
			// 		events: {
			// 			click: function (event) {
			// 				coolerDashboard.common.onChartClick('OperationalIssues', event);
			// 			}
			// 		}
			// 	}
			// },
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});

		var timercondensorTemperatureIOT = setInterval(function () {
			if (!$("#condensorTemperatureIOT").highcharts()) {
				clearInterval(timercondensorTemperatureIOT);
			} else
				$("#condensorTemperatureIOT").highcharts().reflow();
		}, 1);

		// Ambient Temperature
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
					return record.assets ? coolerDashboard.common.floatValue(((record.assets / result.summary.totalCooler) * 100)) : 0
				}
			}],
			xAxis: function (record) {
				return record.key;
			},
			data: result.ambientTemperatureBands
		});

		$('#ambientTemperatureIOT').highcharts({
			chart: {
				renderTo: 'ambientTemperatureIOT'
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
			// plotOptions: {
			// 	series: {
			// 		cursor: 'pointer',
			// 		events: {
			// 			click: function (event) {
			// 				coolerDashboard.common.onChartClick('OperationalIssues', event);
			// 			}
			// 		}
			// 	}
			// },
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});

		var timerambientTemperatureIOT = setInterval(function () {
			if (!$("#ambientTemperatureIOT").highcharts()) {
				clearInterval(timerambientTemperatureIOT);
			} else
				$("#ambientTemperatureIOT").highcharts().reflow();
		}, 1);

		// compressor iot 
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
					return record.assets ? coolerDashboard.common.floatValue(((record.assets / result.summary.totalCooler) * 100)) : 0
				}
			}],
			xAxis: function (record) {
				return record.key;
			},
			data: result.compressorData
		});

		$('#compressorIOT').highcharts({
			chart: {
				renderTo: 'compressorIOT'
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
							coolerDashboard.common.onChartClick('CompressorBand', event);
						}
					}
				}
			},
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});

		var timercompressorIOT = setInterval(function () {
			if (!$("#compressorIOT").highcharts()) {
				clearInterval(timercompressorIOT);
			} else
				$("#compressorIOT").highcharts().reflow();
		}, 1);

		//HeaterIOT
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
					return record.assets ? coolerDashboard.common.floatValue(((record.assets / result.summary.totalCooler) * 100)) : 0
				}
			}],
			xAxis: function (record) {
				return record.key;
			},
			data: result.HeaterData
		});

		$('#HeaterIOT').highcharts({
			chart: {
				renderTo: 'HeaterIOT'
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
			// plotOptions: {
			// 	series: {
			// 		cursor: 'pointer',
			// 		events: {
			// 			click: function (event) {
			// 				coolerDashboard.common.onChartClick('CompressorBand', event);
			// 			}
			// 		}
			// 	}
			// },
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});

		var timerHeaterIOT = setInterval(function () {
			if (!$("#HeaterIOT").highcharts()) {
				clearInterval(timerHeaterIOT);
			} else
				$("#HeaterIOT").highcharts().reflow();
		}, 1);

		var customerSelected = [];
		if (filterValuesChart) {
			$.each(filterValuesChart, function () {
				if (this.name == "OwnerId") {
					customerSelected.push(this);
				}
			});
		}
		result = result.summary;
		result.customerSelected = customerSelected.length;
		var totalCooler = result.totalCooler ? result.totalCooler : 0;

		$('#totalCustomer').html(result.totalCustomer);
		$('#customerSelectedKPI').html(result.filteredOutlets);
		setTimeout(function () {
			$('#customerSelectedPercentageKPI').data('easyPieChart').update(result.totalCustomer == 0 ? 0 : (result.filteredOutlets / result.totalCustomer) * 100);
		}, 50);

		$('#coolerSelectedKPI').html(result.filteredAssets);
		$('#smartCoolerSelectedKPI').html(result.smartAssetCount);
		$('#smartCoolerSelectedPercentageKPI').data('easyPieChart').update(result.filteredAssets == 0 ? 0 : (result.smartAssetCount / result.filteredAssets) * 100);

		coolerMissing = result.missingCooler;
		$('#missingCooler').data('easyPieChart').update(result.missingCooler ? (result.missingCooler / totalCooler) * 100 : 0);
		coolerAbove7 = result.coolerAbove7;
		$('#coolerAbove7').data('easyPieChart').update(result.coolerAbove7 ? (result.coolerAbove7 / totalCooler) * 100 : 0);
		coolerBelow30Light = result.coolerBelow30Light;
		$('#coolerBelow30Light').data('easyPieChart').update(result.coolerBelow30Light ? (result.coolerBelow30Light / totalCooler) * 100 : 0);
		lowUtilization = result.lowUtilization;
		$('#lowUtilized').data('easyPieChart').update(result.lowUtilization ? (result.lowUtilization / totalCooler) * 100 : 0);

	}
}

function applyDashboardChartPower(result) {
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
				return record.assets ? coolerDashboard.common.floatValue(((record.assets / record.total) * 100)) : 0
			}
		}],
		xAxis: function (record) {
			return record.key;
		},
		data: result.data.powerData
	});

	$('#powerIOT').highcharts({
		chart: {
			renderTo: 'powerIOT'
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
						coolerDashboard.common.onChartClick('telemetryPowerStatus', event);
					}
				}
			}
		},
		xAxis: seriesData.xAxis,
		series: seriesData.series
	});

	var timerpowerIOT = setInterval(function () {
		if (!$("#powerIOT").highcharts()) {
			clearInterval(timerpowerIOT);
		} else
			$("#powerIOT").highcharts().reflow();
	}, 1);

	result = result.data;
	$('#powerHoursOffChart').spin(false);
	result = result.summary;
	if (result) {
		hoursPowerOff = result.hoursPowerOff;
		$('#hoursPowerOff').data('easyPieChart').update(result.hoursPowerOff ? (result.hoursPowerOff / 24) * 100 : 0);
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
	this.jsonFilter = filterValues;
	//$("#assetGridFilter").DataTable().ajax.reload();
	//$("#locationGridFilter").DataTable().ajax.reload();

	var filter = JSON.parse(JSON.stringify(filterValuesChart));
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
				$.ajax({
					url: coolerDashboard.common.nodeUrl('getKPIWidget'),
					data: filter,
					type: 'POST',
					success: applyDashboardCharts,
					failure: function (response, opts) {
						coolerDashboard.gridUtils.ajaxIndicatorStop();
					},
					scope: this
				});

				$.ajax({
					url: coolerDashboard.common.nodeUrl('getPowerData'),
					data: filter,
					type: 'POST',
					success: applyDashboardChartPower,
					failure: function (response, opts) {
						$('#powerHoursOffChart').spin(false);
					},
					scope: this
				});

			},
			failure: function (response, opts) {},
			scope: this
		});
	} else {
		$.ajax({
			url: coolerDashboard.common.nodeUrl('getKPIWidget'),
			data: filter,
			type: 'POST',
			success: applyDashboardCharts,
			failure: function (response, opts) {
				coolerDashboard.gridUtils.ajaxIndicatorStop();
			},
			scope: this
		});

		$.ajax({
			url: coolerDashboard.common.nodeUrl('getPowerData'),
			data: filter,
			type: 'POST',
			success: applyDashboardChartPower,
			failure: function (response, opts) {
				$('#powerHoursOffChart').spin(false);
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

	$('#missingCooler').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		scaleColor: false,
		lineCap: 'butt',
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (isNaN(coolerMissing)) {
				coolerMissing = 'N/A'
			}
			$(this.el).find('.percent').text(coolerMissing);
		}
	});
	$('#lowUtilized').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		scaleColor: false,
		lineCap: 'butt',
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (isNaN(lowUtilization)) {
				lowUtilization = 'N/A'
			}
			$(this.el).find('.percent').text(lowUtilization);
		}
	});
	$('#coolerAbove7').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		scaleColor: false,
		lineCap: 'butt',
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (isNaN(coolerAbove7)) {
				coolerAbove7 = 'N/A'
			}
			$(this.el).find('.percent').text(coolerAbove7);
		}
	});
	$('#coolerBelow30Light').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		lineCap: 'butt',
		scaleColor: false,
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (isNaN(coolerBelow30Light)) {
				coolerBelow30Light = 'N/A'
			}
			$(this.el).find('.percent').text(coolerBelow30Light);
		}
	});
	$('#hoursPowerOff').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		scaleColor: false,
		lineCap: 'butt',
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (isNaN(hoursPowerOff)) {
				hoursPowerOff = 'N/A'
			}
			$(this.el).find('.percent').text(coolerDashboard.common.float(hoursPowerOff));
		}
	});
	var filterValues = {};

	var emptyData = {
		doorData: '',
		lightBands: '',
		temperatureBands: '',
		totalCooler: 0,
		coolerSelected: 0,
		avgPowerOn: 0,
		hourlyDoorOpens: 0,
		alarmRate: 0,
		salesVisitDuration: 0,
		healthOverview: '',
		missingCooler: 0,
		doorOpenDuration: 0,
		hourlyFootTraffic: 0,
		coolerMoves: 0,
		totalNoOfAlarms: 0,
		mapData: [],
		openAlert: 0,
		coolerBelow30Light: 0,
		hoursLightOn: 0,
		hoursPowerOff: 0,
		hourlyDoorOpen: 0,
		alarmRate: 0,
		coolerMoves: 0,
		temperature: 0,
		coolerAbove7: 0
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