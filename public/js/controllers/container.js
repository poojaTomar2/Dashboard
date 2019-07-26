var isAvailability = false;
var isActivation = false;
var isCoolerMetrics = false;
var chartData;
var filterValues = {};
var jsonFilter = JSON.stringify({
	"start": 0,
	"limit": 10
});

function applyDashboardCharts(result) {
	coolerDashboard.gridUtils.ajaxIndicatorStop();
	if (result) {
		chartData = result;
		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Response',
				type: 'column',
				data: function (record) {
					return record.Count;
				}
			}, {
				name: 'Percentage of total',
				type: 'spline',
				yAxis: 1,
				data: function (record) {
					return record.Percentage;
				},
				tooltip: {
					valueSuffix: '%'
				}
			}, {
				name: 'Total questions',
				type: 'spline',
				data: function (record) {
					return record.TotalCount;
				}
			}, ],
			xAxis: function (record) {
				return record.Label;
			},
			data: isAvailability ? result.ProductAvailabilty.yesResponse : result.ProductAvailabilty.noResponse
		});

		$('#container').highcharts({
			chart: {
				renderTo: 'container'
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
					text: '% age'
				},
				labels: {
					format: '{value}%'
				},
				opposite: true
			}],
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Response',
				type: 'column',
				data: function (record) {
					return record.Count;
				}
			}, {
				name: 'Percentage of total',
				type: 'spline',
				yAxis: 1,
				data: function (record) {
					return record.Percentage;
				},
				tooltip: {
					valueSuffix: '%'
				}
			}, {
				name: 'Total questions',
				type: 'spline',
				data: function (record) {
					return record.TotalCount;
				}
			}, ],
			xAxis: function (record) {
				return record.Label;
			},
			data: isActivation ? result.ActivationMetrics.yesResponse : result.ActivationMetrics.noResponse
		});

		$('#activationmetrics').highcharts({
			chart: {
				renderTo: 'activationmetrics'
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
					text: '% age'
				},
				labels: {
					format: '{value}%'
				},
				opposite: true
			}],
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Response',
				type: 'column',
				data: function (record) {
					return record.Count;
				}
			}, {
				name: 'Percentage of total',
				type: 'spline',
				yAxis: 1,
				data: function (record) {
					return record.Percentage;
				},
				tooltip: {
					valueSuffix: '%'
				}
			}, {
				name: 'Total questions',
				type: 'spline',
				data: function (record) {
					return record.TotalCount;
				}
			}, ],
			xAxis: function (record) {
				return record.Label;
			},
			data: isCoolerMetrics ? result.CoolerMetrics.yesResponse : result.CoolerMetrics.noResponse
		});

		$('#coolerMatrix').highcharts({
			chart: {
				renderTo: 'coolerMatrix'
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
					text: '% age'
				},
				labels: {
					format: '{value}%'
				},
				opposite: true
			}],
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Response',
				type: 'column',
				data: function (record) {
					return record.Count;
				}
			}, {
				name: 'Percentage of total',
				type: 'spline',
				yAxis: 1,
				data: function (record) {
					return record.Percentage;
				},
				tooltip: {
					valueSuffix: '%'
				}
			}, {
				name: 'Total questions',
				type: 'spline',
				data: function (record) {
					return record.TotalCount;
				}
			}, ],
			xAxis: function (record) {
				return record.Label;
			},
			data: result.PurityInfo.record
		});

		$('#purity').highcharts({
			chart: {
				renderTo: 'purity'
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
					text: '% age'
				},
				labels: {
					format: '{value}%'
				},
				opposite: true
			}],
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});

		$('#rankPercentage').highcharts({
			chart: {
				type: 'pie',
				renderTo: 'rankPercentage'
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
			series: [{
				name: 'Rank Percentage',
				colorByPoint: true,
				data: result.RankPercentage.record,
				dataLabels: {
					formatter: function () {
						return '<b>' + this.point.name + ':</b> ' + this.y + ' (' + this.percentage.toFixed(2) + '%)';
					}
				}
			}]
		});

		var map = document.getElementById('map-canvas');
		var locationsData = result.SurveyCoverage.record;
		if (gMapPanel.gmap) {
			gMapPanel.mapGetCenter(locationsData);
		}
		$('#totalSurveyors').html(result.TotalSurveyors);
		$('#totalIssuesReported').html(result.TotalIssues);
		$('#totalOutletsSurveyed').html(result.TotalOutletsSurveyed);
		$('#totalSmartOutlet').html(result.SmartLocation);
		$('#totalOutletsNotSurveyed').html(result.TotalOutletsNotSurveyed);
		$('#totalOutletsSurveyed1').data('easyPieChart').update(result.TotalOutlets == 0 ? 0 : (result.TotalOutletsSurveyed / result.TotalOutlets) * 100);
		$('#totalSmartOutlet1').data('easyPieChart').update(result.TotalOutlets == 0 ? 0 : (result.SmartLocation / result.TotalOutlets) * 100);
		$('#totalOutletsNotSurveyed1').data('easyPieChart').update(result.TotalOutlets == 0 ? 0 : (result.TotalOutletsNotSurveyed / result.TotalOutlets) * 100);

	}
}

function sendAjax(firstLoad) {
	coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
	//$.ajax({
	//	url: './js/ajax/coolerStatus.json',
	//	data: coolerDashboard.common.defaultFilter,
	//	success: applyDashboardCharts,
	//	failure: function (response, opts) {
	//	},
	//	scope: this
	//});
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
		var startDate =  moment().subtract(1,'months').startOf('month');
		var endDate = moment().subtract(1,'months').endOf('month');
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
		var startDate =  moment().subtract(1,'months').startOf('month');
		var endDate = moment().subtract(1,'months').endOf('month');

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
	$("#assetGridFilter").DataTable().ajax.reload();
	$("#locationGridFilter").DataTable().ajax.reload();


	$.ajax({
		url: coolerDashboard.common.nodeUrl('getSurveyWidget'),
		data: this.filterValuesChart,
		type: 'POST',
		success: applyDashboardCharts,
		failure: function (response, opts) {
			coolerDashboard.gridUtils.ajaxIndicatorStop();
		},
		scope: this
	});

	if (jQuery.isEmptyObject(filterValuesChart)) {
		this.filterValues = {};
		this.jsonFilter = {
			"start": 0,
			"limit": 10
		};
	}
	this.filterValues = {};

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
	if (!firstLoad) {
		$("#dt_basic").DataTable().ajax.reload();
	}
}


$(function () {

	//pageSetUp();
	setup_widgets_desktop_extended();
	$("#surveyFilterForm").load('views/common/filter.html');
	//coolerDashboard.common.setFilter('Survey');

	isAvailability = $("#productAvailable").is(':checked');
	isActivation = $("#activationAvailable").is(':checked');
	isCoolerMetrics = $("#coolerAvailable").is(':checked');

	$("#productAvailable").click(function () {
		isAvailability = $('#productAvailable').is(':checked');
		applyDashboardCharts(chartData);
	});

	$("#activationAvailable").click(function () {
		isActivation = $('#activationAvailable').is(':checked');
		applyDashboardCharts(chartData);
	});

	$("#coolerAvailable").click(function () {
		isCoolerMetrics = $('#coolerAvailable').is(':checked');
		applyDashboardCharts(chartData);
	});


	var responsiveHelper_dt_basic = undefined;
	var breakpointDefinition = {
		tablet: 1024,
		phone: 480
	};

	this.filterValues = {};

	if (jQuery.isEmptyObject(filterValues)) {
		if (!jQuery.isEmptyObject(filterValuesChart)) {
			$.map(filterValuesChart, function (row) {
				if (typeof filterValues[row.name] === 'undefined') {
					filterValues[row.name] = row.value;
				} else if (typeof filterValues[row.name] === 'object') {
					filterValues[row.name].push(row.value);
				} else {
					filterValues[row.name] = [filterValues[row.name], row.value];
				}
			});
		} else {
		var startDate =  moment().subtract(1,'months').startOf('month');
		var endDate = moment().subtract(1,'months').endOf('month');
			if (startDate && endDate) {
				filterValues.startDate = startDate.format('YYYY-MM-DD[T00:00:00]');
				filterValues.endDate = endDate.format('YYYY-MM-DD[T23:59:59]');
			}
		}
	}

	var otable = $('#dt_basic')
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
					return $.extend(data, filterValues);
				}
			},
			order: [
				[1, "asc"]
			],
			processing: true,
			serverSide: true,
			select: true,
			columns: [{
				data: 'Name'
			}, {
				data: 'LocationCode'
			}, {
				data: 'MarketName'
			}, {
				data: 'LocationType'
			}, {
				data: 'SalesTerritory'
			}, {
				data: 'City'
			}, {
				data: 'Street'
			}, {
				data: 'Country'
			}, {
				data: 'IsKeyLocation',
				render: coolerDashboard.common.bool
			}, {
				data: 'IsSurveyed',
				render: coolerDashboard.common.bool
			}, {
				data: 'IsSmart',
				render: coolerDashboard.common.bool
			}],
			"scrollX": true,
			"scrollY": "29.5em",
			"sDom": "" +
				"t" +
				"<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
			"preDrawCallback": function () {
				// Initialize the responsive datatables helper once.
				if (!responsiveHelper_dt_basic) {
					responsiveHelper_dt_basic = new ResponsiveDatatablesHelper($('#dt_basic'), breakpointDefinition);
				}
			}
		});

	coolerDashboard.common.otable = otable;
	var emptyData = {
			ProductAvailabilty: {
				noResponse: '',
				yesResponse: ''
			},
			ActivationMetrics: {
				noResponse: '',
				yesResponse: ''
			},
			PurityInfo: {
				record: ''
			},
			CoolerMetrics: {
				noResponse: '',
				yesResponse: ''
			},
			RankPercentage: {
				record: ''
			},
			SurveyCoverage: {
				record: ''
			},
			TotalSurveyors: 0,
			TotalIssues: 0,
			TotalOutletsSurveyed: 0,
			SmartLocation: 0,
			TotalOutletsNotSurveyed: 0,
			TotalOutlets: 0
		}
		//applyDashboardCharts(emptyData);

	//$.ajax({
	//	url: coolerDashboard.common.nodeUrl('getSurveyWidget'),
	//	success: applyDashboardCharts,
	//	failure: function (response, opts) {
	//	},
	//	scope: this
	//});
	//sendAjax(true);
});