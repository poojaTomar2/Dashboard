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
	if (result) {
		var seriesConfigData = [];
		if (result.alertbyTechnical) {
			var seriesLength = result.alertbyTechnical[0].Values.length;
			for (var i = 0; i < seriesLength; i++) {
				seriesConfigData.push({
					type: 'column',
					name: result.alertbyTechnical[0].Values[i].Name,
					data: []
				});
			}
			for (var i = 0; i < result.alertbyTechnical.length; i++) {
				for (var j = 0; j < seriesLength; j++) {
					seriesConfigData[j].data.push(result.alertbyTechnical[i].Values[j].Value);
				}
			}
		}

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [],
			xAxis: function (record) {
				return record.Label;
			},
			data: result.alertbyTechnical
		});

		$('#alarmByTypeTechnicical').highcharts({
			chart: {
				renderTo: 'alarmByTypeTechnicical'
			},
			lang: {
				noData: "No data found to display"
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
			title: {
				text: ''
			},
			yAxis: [{
				title: {
					text: 'Alarm Count'
				}
			}, ],
			xAxis: seriesData.xAxis,
			series: seriesConfigData
		});

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Count of Alarm',
				type: 'bar',
				stack: 'first',
				yAxis: 0,
				data: function (record) {
					return record.Value;
				}
			}, {
				name: 'Alarm Closed',
				type: 'bar',
				stack: 'first',
				yAxis: 0,
				data: function (record) {
					return record.CloseAlert;
				}
			}, {
				name: 'Rate Of Closure',
				type: 'bar',
				yAxis: 1,
				data: function (record) {
					return record.Closure;
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
				noData: "No data found to display"
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
				}
			}, {
				title: {
					text: 'Closure rate(%)'
				},
				opposite: true,
				min: 0,
				max: 99,
				tickInterval: 10
			}, ],
			plotOptions: {
				bar: {
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

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Count Of Alarm',
				type: 'bar',
				data: function (record) {
					return record.Value;
				}
			}, {
				name: 'Alarm Closed',
				type: 'bar',
				data: function (record) {
					return record.CloseAlert;
				}
			}],
			xAxis: function (record) {
				return record.Name;
			},
			data: result.alarmByCustomer
		});

		$('#alarmByCustomer').highcharts({
			chart: {
				renderTo: 'alarmByCustomer'
			},
			lang: {
				noData: "No data found to display"
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
				}
			}, ],
			plotOptions: {
				bar: {
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
					return record.OpenAlertAssetPercentage;
				}
			}, {
				name: 'Low Priority',
				data: function (record) {
					return record.Low;
				}
			}, ],
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
				noData: "No data found to display"
			},
			noData: {
				style: {
					fontWeight: 'bold',
					fontSize: '15',
					color: 'Black',
					textTransform: 'uppercase'
				}
			},
			xAxis: {
				title: {
					text: 'Number Of Days'
				},
				categories: seriesData.xAxis.categories
			},
			yAxis: [{
				title: {
					text: 'Open Alarms (Count)'
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

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Open Alarms',
				data: function (record) {
					var date = new Date(record.date);
					return [Number(date), record.cumulative];
				}
			}, {
				name: 'Total Alarms',
				yAxis: 1,
				data: function (record) {
					var date = new Date(record.date);
					return [Number(date), record.created];
				}
			}],
			data: result.alertsByWeek
		});

		seriesData.xAxis = {
			type: "datetime",
			dateTimeLabelFormats: {
				month: '%e. %b',
				year: '%b'
			}
		};

		$("#alertsIOTAlarm").highcharts({
			chart: {
				renderTo: 'alertsIOT'
			},
			title: {
				text: ''
			},
			lang: {
				noData: "No data found to display"
			},
			noData: {
				style: {
					fontWeight: 'bold',
					fontSize: '15',
					color: 'Black',
					textTransform: 'uppercase'
				}
			},
			xAxis: {
				type: 'datetime',
				dateTimeLabelFormats: { // don't display the dummy year
					month: '%e. %b',
					year: '%b'
				},
				title: {
					text: 'Week'
				}
			},
			yAxis: [{
				title: {
					text: 'Open Alarms (Count)'
				},
				min: 0
			}, {
				title: {
					text: 'Total Alarms (Count)'
				},
				opposite: true
			}],
			series: seriesData.series
		});
		result = result.summary;
		$('#totalCustomer').html(result.totalCustomer);
		$('#customerSelected').html(result.customerSelected);
		$('#totalCooler > strong').html(result.totalCooler);
		$('#coolerSelected > strong').html(result.coolerSelected);
		//$('#locationAlarmRate').html( result.locationAlarmRate);
		//$('#totlaAlarm').html( result.totlaAlarm);
		//$('#assetAlarmRate').html( result.assetAlarmRate + '%');
		$('#totlaAlarm').data('easyPieChart').update(result.totlaAlarm);
		$('#assetAlarmRate').data('easyPieChart').update(result.assetAlarmRate);
		$('#openAlarm').data('easyPieChart').update(result.openAlarm);
		$('#closedAlarm').data('easyPieChart').update(result.closedAlarm);
		$('#rateOfClosure').data('easyPieChart').update(result.rateOfClosure);
		//$('#openAlarm').html( result.openAlarm);
		//$('#closedAlarm').html( result.closedAlarm);
		//$('#serviceDue').html( result.serviceDue);
	}
}

function sendAjax() {
	//$.ajax({
	//	url: coolerDashboard.common.nodeUrl('getKPIWidget', this.filterValuesChart),
	//	data: coolerDashboard.common.defaultFilter,
	//	success: applyDashboardCharts,
	//	failure: function (response, opts) {
	//	},
	//	scope: this
	//});
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
		url: './js/ajax/coolerStatus.json',
		data: coolerDashboard.common.defaultFilter,
		success: applyDashboardCharts,
		failure: function (response, opts) {},
		scope: this
	});
}

$(function () {

	$("#filterFormKPI").load('views/common/filter.html');
	$("#filterSummary").load('views/common/filterSummary.html');
	//pageSetUp();

	var filterValues = {};
	var emptyData = {
		salesVisit: {
			Date: '',
			VisitDuration: '',
			CountofVisit: ''
		},
		alarmType: {
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
		alertsByWeek: '',
		alertbyTechnical: ''
	};
	emptyData = JSON.stringify(emptyData);
	//applyDashboardCharts(emptyData);

	//sendAjax();
});