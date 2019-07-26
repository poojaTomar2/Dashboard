function applyDashboardCharts(result) {
	if (result) {

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [
				{
					name: 'Low Priority',
					data: function (record) {
						return record.Low;
					}
				},
				{
					name: 'Medium Priority',
					data: function (record) {
						return record.Medium;
					}
				},
				{
					name: 'High Priority',
					data: function (record) {
						return record.High;
					}
				},
				{
					name: 'Asset Percentage(%)',
					type: 'spline',
					yAxis: 1,
					data: function (record) {
						return record.OpenAlertAssetPercentage;
					}
				}
			],
			data: result.data.openAlerts,
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
			xAxis: seriesData.xAxis,
			yAxis: [
				{ title: { text: 'Open Alarms (Count)' } },
				{ title: { text: '% Assets' }, labels: { format: '{value}%' }, opposite: true }
			],
			series: seriesData.series
		});


		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [
				{
					name: 'Open Alarms',
					data: function (record) {
						var date = new Date(record.date);
						return [Number(date), record.cumulative];
					}
				}
			],
			data: result.data.alertsByWeek
		});

		seriesData.xAxis = {
			type: "datetime",
			dateTimeLabelFormats: {
				month: '%e. %b',
				year: '%b'
			}
		};

		$("#alertsIOT").highcharts({
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
			yAxis: {
				title: {
					text: 'Open Alarms (Count)'
				},
				min: 0
			},
			series: seriesData.series
		});

		$('#tempAndLightIssueIOT').highcharts({
			chart: {
				type: 'pie',
				renderTo: 'tempAndLightIssueIOT'
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
			series: [
				{
					name: 'Assets',
					colorByPoint: true,
					data: result.data.healthOverview
				}
			]
		});

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [
				{
					name: 'Asset Count',
					type: 'column',
					data: function (record) {
						return record.assets;
					}
				},
				{
					name: 'Percentage(%)',
					type: 'spline',
					yAxis: 1,
					data: function (record) {
						return record.assets / 25 * 100
					}
				}
			],
			xAxis: function (record) {
				return record.key;
			},
			data: result.data.lightBands
		});

		$('#lightIOT').highcharts({
			chart: {
				renderTo: 'lightIOT'
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
			title: { text: '' },
			yAxis: [
				{ title: { text: 'Assets' } },
				{
					title: { text: '% Assets' },
					labels: { format: '{value}%' },
					opposite: true
				}
			],
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [
				{
					name: 'Asset Count',
					type: 'column',
					data: function (record) {
						return record.assets;
					}
				},
				{
					name: 'Percentage(%)',
					type: 'spline',
					yAxis: 1,
					data: function (record) {
						return record.assets / 25 * 100
					}
				}
			],
			xAxis: function (record) {
				return record.key;
			},
			data: result.data.temperatureBands
		});

		$('#temperatureIOT').highcharts({
			chart: {
				renderTo: 'temperatureIOT'
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
			title: { text: '' },
			yAxis: [
				{ title: { text: 'Assets' } },
				{
					title: { text: '% Assets' },
					labels: { format: '{value}%' },
					opposite: true
				}
			],
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});

		seriesData = result.data.doorData;

		$('#coolerUtilizationIOT').highcharts({
			chart: {
				renderTo: 'coolerUtilizationIOT'
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
			title: { text: '' },
			yAxis: [
				{ title: { text: 'Assets' } }
			],
			xAxis: { categories: ['Low', 'Medium', 'High'] },
			series: [
				{
					name: 'Cooler Utilization',
					type: 'column',
					data: [seriesData.low, seriesData.medium, seriesData.high]
				}
			],
			tooltip: {
				formatter: function () {
					if (this.x == "Low") {
						return "Door open < 250/month ";
					}
					else if (this.x == "Medium") {
						return "Door open < 500/month ";
					}
					else {
						return "Door open > 500/month ";
					}
				}
			}
		});


		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [
				{
					name: 'Alarm Count',
					type: 'column',
					data: function (record) {
						return record.count;
					}
				}
			],
			xAxis: function (record) {
				return record.alertType;
			},
			data: result.data.alertsByType
		});

		$('#alertsByType').highcharts({
			chart: {
				renderTo: 'coolerUtilizationIOT'
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
			title: { text: '' },
			yAxis: [
				{ title: { text: 'Alarm Count' } }
			],
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [
				{
					name: 'Asset',
					type: 'column',
					data: function (record) {
						return [record.key, record.assets];
					}
				},
				{
					name: 'Asset %',
					data: function (record) {
						return [record.key, record.PercentageAsset];
					}
				}
			],
			data: result.data.PingData
		});

		seriesData.xAxis = {
			type: "datetime",
			dateTimeLabelFormats: {
				month: '%e. %b',
				year: '%b'
			}
		};

		$("#communicationIOT").highcharts({
			chart: {
				renderTo: 'communicationIOT'
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
					text: 'Asset'
				},
				min: 0
			},
			{
				title: { text: '% Assets' },
				labels: { format: '{value}%' },
				opposite: true
			}
			],
			series: seriesData.series
		});

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [
				{
					name: 'Asset',
					type: 'column',
					data: function (record) {
						return [record.key, record.assets];
					}
				},
				{
					name: 'Asset %',
					data: function (record) {
						return [record.key, record.PercentageAsset];
					}
				}
			],
			data: result.data.PowerData
		});

		seriesData.xAxis = {
			type: "datetime",
			dateTimeLabelFormats: {
				month: '%e. %b',
				year: '%b'
			}
		};

		$("#powerIOT").highcharts({
			chart: {
				renderTo: 'powerIOT'
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
					text: 'Asset'
				},
				min: 0
			},
			{
				title: { text: '% Assets' },
				labels: { format: '{value}%' },
				opposite: true
			}
			],
			series: seriesData.series
		});

		var summary = result.data.summary;
		var alertOpen = summary.openAlerts;
		var tempAbove7 = summary.tempAbove12;
		var totalAsset = summary.totalAssets;
		var totalOutlet = summary.totalOutlets;

		$('#totalOutletIOT').html( totalOutlet);
		$('#outletSelectedIOT').html(summary.filteredOutlets);

		$('#totalAssetIOT').html( totalAsset);
		$('#assetSelectedIOT').html(summary.filteredAssets);

		$('#coolerAbove7IOT').html(tempAbove7);
		$('#openAlertIOT').html( alertOpen);

		$('#outletSelectedIOTPercentage').data('easyPieChart').update(totalOutlet == 0 ? 0 : (summary.filteredOutlets / totalOutlet) * 100);
		$('#totalAssetIOTPercentage').data('easyPieChart').update(totalAsset == 0 ? 0 : (summary.filteredAssets / totalAsset) * 100);

		var info = [
			summary.tempAbove12,
			summary.lightBelow10,
			summary.lightBelow10TempAbove12,
			summary.isMissing,
			summary.isPowerOff
		];

		for (var i = 0, len = info.length; i < len; i++) {
			$("#info" + i).html(info[i]);
		}
	}
}

$(function () {

	pageSetUp();

	var emptyData = { data: { openAlerts: '', alertsByType: '', alertsByWeek: '', doorData: '', lightBands: '', temperatureBands: '', healthOverview: '', summary: { filteredOutlets: 0, totalOutlets: 0, totalAssets: 0, filteredAssets: 0, openAlerts: 0 }, PingData: '', PowerData: '' } }
	applyDashboardCharts(emptyData);

	var responsiveHelper_dt_basic = undefined;
	var breakpointDefinition = {
		tablet: 1024,
		phone: 480
	};

	var sparklineRenderer = function (value, data, row) {
		return '<span class="sparkline-type-pie" data-sparkline-piesize="23px">' +
			(row.AssetCount - value) + "," + value +
			'</span>&nbsp;' + value;
	};

	var otable = $('#coolerStatusGridIOT').dataTable({
		ajax: {
			url: coolerDashboard.common.nodeUrl('getCoolerStatusData/'),
			method: 'GET',
			data: function (data, settings) {
				data.type = coolerDashboard.common.coolerStatusFilterType;
				coolerDashboard.common.coolerStatusFilterType = "Classification"
			}
		},
		processing: true,
		columns: [
			{
				data: 'City',
				"orderable": false
			},
			{
				data: 'Locations',
				class: 'right',
				"orderable": false
			},
			{
				data: 'AssetCount',
				class: 'right',
				"orderable": false
			},
			{
				data: 'Unhealthy',
				render: sparklineRenderer,
				width: 50,
				"orderable": false
			},
			{
				data: 'HighTemp',
				render: sparklineRenderer,
				width: 50,
				"orderable": false
			},
			{
				data: 'LowLight',
				render: sparklineRenderer,
				width: 50,
				"orderable": false
			},
			{
				data: 'PowerOff',
				render: sparklineRenderer,
				width: 50,
				"orderable": false
			},
			{
				data: 'IsMissing',
				render: sparklineRenderer,
				width: 50,
				"orderable": false
			}
		],
		"scrollX": true,
		//"autoWidth": true,
		"sDom": "" +
		"t" +
		"<'dt-toolbar-footer'<'col-sm-4 col-xs-12 hidden-xs'i><'col-sm-4 col-xs-6 hidden-xs'l><'col-xs-12 col-sm-4'p>>",
		"autoWidth": true,
		"oLanguage": {
			"sSearch": '<span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span>'
		},
		"preDrawCallback": function () {
			// Initialize the responsive datatables helper once.
			if (!responsiveHelper_dt_basic) {
				responsiveHelper_dt_basic = new ResponsiveDatatablesHelper($('#coolerStatusGridIOT'), breakpointDefinition);
			}
		},
		"rowCallback": function (nRow) {
			responsiveHelper_dt_basic.createExpandIcon(nRow);
		},
		"drawCallback": function (oSettings) {
			responsiveHelper_dt_basic.respond();
			$('.sparkline-type-pie').sparkline('html', {
				type: 'pie'
			});
		}
	});
	coolerDashboard.common.otable = otable;
	var responsiveHelper_dt_basic = undefined;
	var breakpointDefinition = {
		tablet: 1024,
		phone: 480
	};
	//coolerDashboard.common.setFilter('Iot');

	$.ajax({
		url: coolerDashboard.common.nodeUrl('getIOTWidget'),
		data: coolerDashboard.common.defaultFilter,
		success: applyDashboardCharts,
		failure: function (response, opts) {
		},
		scope: this
	});

	$(".js-status-update a").click(function () {
		var selText = $(this).text();
		if (selText == " Market" || selText == " Channel" || selText == " Classification") {
			coolerDashboard.common.coolerStatusFilterType = selText == " Market" ? "MarketName" : selText == " Channel" ? "LocationType" : "Classification";
			var $this = $(this);
			$this.parents('.btn-group').find('.dropdown-toggle').html(selText + ' <span class="caret"></span>');
			$this.parents('.dropdown-menu').find('li').removeClass('active');
			$this.parent().addClass('active');
			document.getElementById('typeClumnForReport').innerHTML = selText;
			$('#coolerStatusGridIOT').DataTable().ajax.reload();
		}
	});

	$('#chartFilterForm').submit(function (e) {


	data = 	$('#chartFilterForm').serializeArray();
		e.preventDefault();
		var data = $(this).serializeArray();
		filterValues = {};
		var form = $(this);
		$.ajax({
			url: coolerDashboard.common.nodeUrl('getIOTWidget'),
			data: data,
			success: applyDashboardCharts,
			failure: function (response, opts) {
			},
			scope: this
		});
	});

	$("#chartFilterSubmit").on('click', function () {
		$("#chartFilterForm").submit();
	});

	$("#chartFilterReset").on('click', function () {
		var myForm = $("#chartFilterForm").get(0);
		myForm.reset();
		$("select", myForm).each(
			function () {
				$(this).select2('val', $(this).find('option:selected').val());
			}
		);
		$("#chartFilterForm").submit();
	});
});
