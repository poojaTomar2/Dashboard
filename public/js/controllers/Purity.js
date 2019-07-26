var isLoaded = false;
var filterValues = {};
function genrateData(startDate, endDate, interval) {
	var data = [];
	for (var date = moment(startDate); date < moment(endDate); date = moment(date).add(1, interval)) {
		data.push({
			date: date.valueOf(),
			doorCount: Math.round(Math.random() * 50) + 1,
			oosCount: Math.round(Math.random() * 50) + 1
		});
	}

	//return data;
	var seriesData = highChartsHelper.convertToSeries({
		seriesConfig: [{
			name: 'OOS Count',
			data: function (record) {
				var date = new Date(record.date);
				return [Number(date), record.doorCount];
			}
		}, {
			name: 'Door Counts',
			yAxis: 1,
			data: function (record) {
				var date = new Date(record.date);
				return [Number(date), record.oosCount];
			}
		}],
		data: data
	});

	$("#doorOOS").highcharts({
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
			title: {
				text: 'Event Time'
			},
			dateTimeLabelFormats: {
				day: '%d %b %Y' //ex- 01 Jan 2016
			}
		},
		yAxis: [{
			title: {
				text: 'OOS Count'
			},
			min: 0
		}, {
			title: {
				text: 'Door Counts'
			},
			opposite: true
		}],
		series: seriesData.series
	});
}

function sendAjax() {

}

function skuPlanogram(isTop) {
	var data
	if (isTop) {
		data = [{
			name: "Coca-Cola Lata",
			total: 10,
			sku: 10
		}, {
			name: "Sprite Lata",
			total: 9,
			sku: 9
		}, {
			name: "Fanta Lata",
			total: 8,
			sku: 10
		}, {
			name: "Mountain Dew",
			total: 7,
			sku: 10
		}, {
			name: "Vitamin Water",
			total: 6,
			sku: 7
		}, {
			name: "Smart Water",
			total: 5,
			sku: 6
		}, {
			name: "Kinley",
			total: 4,
			sku: 7
		}, {
			name: "Limca",
			total: 3,
			sku: 6
		}, {
			name: "Diet Pepsi",
			total: 2,
			sku: 6
		}, {
			name: "Canada Dry Can",
			total: 1,
			sku: 1
		}, {
			name: "Others",
			total: 1,
			sku: 1
		}];
	} else {
		data = [{
			name: "ThumsUp",
			total: 10,
			sku: 10
		}, {
			name: "Coke Life Bottle",
			total: 9,
			sku: 6
		}, {
			name: "Leche Santa Clara",
			total: 8,
			sku: 10
		}, {
			name: "Mundet mini Lata",
			total: 7,
			sku: 9
		}, {
			name: "Ciel 600 ml Pet",
			total: 7,
			sku: 5
		}, {
			name: "Fanta Lean Can",
			total: 5,
			sku: 7
		}, {
			name: "Ciel 1 litro PET",
			total: 4,
			sku: 8
		}, {
			name: "Coca-Cola Zero Lata",
			total: 3,
			sku: 6
		}, {
			name: "Aquarius",
			total: 2,
			sku: 3
		}, {
			name: "Aam",
			total: 1,
			sku: 6
		}, {
			name: "Others",
			total: 1,
			sku: 6
		}];
	}


	var seriesData = highChartsHelper.convertToSeries({
		seriesConfig: [{
			name: 'SKU Count',
			type: 'column',
			data: function (record) {
				return record.sku;
			}
		}, {
			name: 'Total',
			yAxis: 1,
			data: function (record) {
				return record.total;
			}
		}],
		xAxis: function (record) {
			return record.name;
		},
		data: data
	});

	$("#sKUByPlanogram").highcharts({
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
		yAxis: [{
			title: {
				text: 'SKU Count'
			},
			min: 0,
			tickInterval: 1
		}, {
			title: {
				text: 'Total'
			},
			min: 0,
			opposite: true,
			tickInterval: 1
		}],
		series: seriesData.series
	});
}

function skuRealogram(isTop) {
	var data;
	if (isTop) {
		data = [{
			name: 'Coca-Cola Lata',
			y: 5
		}, {
			name: "Sprite Lata",
			y: 2
		}, {
			name: "Fanta Lata",
			y: 3
		}, {
			name: "Mountain Dew",
			y: 4
		}, {
			name: "Vitamin Water",
			y: 5
		}, {
			name: "Smart Water",
			y: 6
		}, {
			name: "Kinley",
			y: 7
		}, {
			name: "Limca",
			y: 8
		}, {
			name: "Diet Pepsi",
			y: 9
		}, {
			name: "Canada Dry Can",
			y: 10
		}, {
			name: "Coke Life Bottle",
			y: 6
		}, {
			name: "Leche Santa Clara",
			y: 10
		}, {
			name: "Mundet mini Lata",
			y: 9
		}, {
			name: "Ciel 600 ml Pet",
			y: 5
		}, {
			name: "Fanta Lean Can",
			y: 7
		}, {
			name: "Ciel 1 litro PET",
			y: 8
		}, {
			name: "Coca-Cola Zero Lata",
			y: 6
		}, {
			name: "Aquarius",
			y: 3
		}, {
			name: "Aam",
			y: 6
		}, {
			name: "Dew",
			y: 10
		}, {
			name: "Others",
			y: 20
		}];
	} else {
		data = [{
			name: "ThumsUp",
			y: 20
		}, {
			name: "Coke Life Bottle",
			y: 19
		}, {
			name: "Leche Santa Clara",
			y: 18
		}, {
			name: "Mundet mini Lata",
			y: 17
		}, {
			name: "Ciel 600 ml Pet",
			y: 16
		}, {
			name: "Fanta Lean Can",
			y: 15
		}, {
			name: "Ciel 1 litro PET",
			y: 14
		}, {
			name: "Coca-Cola Zero Lata",
			y: 13
		}, {
			name: "Aquarius",
			y: 12
		}, {
			name: "Aam",
			y: 11
		}, {
			name: "Coke Life Bottle",
			y: 10
		}, {
			name: "Leche Santa Clara",
			y: 9
		}, {
			name: "Mundet mini Lata",
			y: 8
		}, {
			name: "Ciel 600 ml Pet",
			y: 7
		}, {
			name: "Fanta Lean Can",
			y: 6
		}, {
			name: "Ciel 1 litro PET",
			y: 5
		}, {
			name: "Coca-Cola Zero Lata",
			y: 4
		}, {
			name: "Aquarius",
			y: 3
		}, {
			name: "Aam",
			y: 2
		}, {
			name: "Dew",
			y: 1
		}, {
			name: "Others",
			y: 10
		}];
	}

	$("#skuRealogram").highcharts({
		chart: {
			plotBackgroundColor: null,
			plotBorderWidth: null,
			plotShadow: false,
			type: 'pie'
		},
		title: {
			text: ' '
		},
		tooltip: {
			pointFormat: '{series.name}: <b>{point.percentage:.0f}</b>'
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
			name: 'SKU Count',
			colorByPoint: true,
			data: data
		}]
	});
}

function oosCount() {
	$("#skuOos").highcharts({
		chart: {
			type: 'column'
		},
		title: {
			text: ' '
		},
		xAxis: {
			categories: ['Cooler-001', 'Cooler-002', 'Cooler-003']
		},
		yAxis: {
			min: 0,
			title: {
				text: 'OOS Counts'
			},
			stackLabels: {
				enabled: false,
				style: {
					fontWeight: 'bold',
					color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
				}
			}
		},
		tooltip: {
			headerFormat: '<b>{point.x}</b><br/>',
			pointFormat: '{series.name}: {point.y}'
		},
		plotOptions: {
			column: {
				stacking: 'normal',
				dataLabels: {
					enabled: true,
					color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white'
				}
			}
		},
		series: [{
			name: 'Others',
			data: [3, 1, 4, 1, 3]
		}, {
			name: 'Coca-Cola Lata',
			data: [5, 3, 4, 7, 2]
		}, {
			name: 'ThumsUp',
			data: [2, 2, 3, 2, 1]
		}, {
			name: 'Fanta Lean Can',
			data: [3, 4, 4, 2, 5]
		}]
	});
}

function skuDoorCount(startDate, endDate, interval) {
	var data = [];
	for (var date = moment(startDate); date < moment(endDate); date = moment(date).add(1, interval)) {
		data.push({
			date: date.valueOf(),
			doorCount: Math.round(Math.random() * 50) + 1,
			skuCount: Math.round(Math.random() * 50) + 1
		});
	}

	//return data;
	var seriesData = highChartsHelper.convertToSeries({
		seriesConfig: [{
			name: 'SKU Count',
			data: function (record) {
				var date = new Date(record.date);
				return [Number(date), record.doorCount];
			}
		}, {
			name: 'Door Counts',
			yAxis: 1,
			data: function (record) {
				var date = new Date(record.date);
				return [Number(date), record.skuCount];
			}
		}],
		data: data
	});

	$("#skuDoorChart").highcharts({
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
			title: {
				text: 'Event Time'
			},
			dateTimeLabelFormats: {
				day: '%d %b %Y' //ex- 01 Jan 2016
			}
		},
		yAxis: [{
			title: {
				text: 'SKU Count'
			},
			min: 0
		}, {
			title: {
				text: 'Door Counts'
			},
			opposite: true
		}],
		series: seriesData.series
	});
}

function applyDashboardCharts() {
	genrateData(moment().format('YYYY-MM-DD[T01:00:00.000Z]'), moment().add(1,'days').format('YYYY-MM-DD[T01:00:00.000Z]'), 'hour');
	skuDoorCount(moment().format('YYYY-MM-DD[T01:00:00.000Z]'), moment().add(1,'days').format('YYYY-MM-DD[T01:00:00.000Z]'), 'hour');
	skuPlanogram(true);
	skuRealogram(true);
	oosCount();
	$('#totalCustomer').html(200);
	$('#customerSelected').html(10);
	$('#totalCooler').html(100);
	$('#coolerSelected').html(10);
	$('#totalSmartCooler').html(100);
	$('#smartCoolerSelected').html(10);
	$('#ssd').data('easyPieChart').update(30);
	$('#nsb').data('easyPieChart').update(70);
	$('#coke').data('easyPieChart').update(55);
	$('#nomcoke').data('easyPieChart').update(75);
	$('#oos').data('easyPieChart').update(10);
	$('#low').data('easyPieChart').update(20);
	$('#full').data('easyPieChart').update(70);
	$('#doorcounts ').data('easyPieChart').update(10);
	$('#uiplanogram ').data('easyPieChart').update(60);
	$('#uirealogram ').data('easyPieChart').update(30);
	$('#ssd1').data('easyPieChart').update(30);
	$('#nsb1').data('easyPieChart').update(70);
	$('#coke1').data('easyPieChart').update(55);
	$('#nomcoke1').data('easyPieChart').update(75);
}

$(function () {
	$("#filterFormKPI").load('views/common/filter.html');
	$("#filterSummary").load('views/common/filterSummary.html');
	setup_widgets_desktop_extended();
	this.value = 10;
	var emptyData = {
		salesVisit: {
			Date: '',
			VisitDuration: '',
			CountofVisit: ''
		}
	};
	$("#outletOverviewDropdown a").click(function () {
		var selText = $(this).text();
		var $this = $(this);
		$this.parents('.btn-group').find('.dropdown-toggle').html(selText + ' <span class="caret"></span>');
		$this.parents('.dropdown-menu').find('li').removeClass('active');
		$this.parent().addClass('active');
		var endDate = moment().format('YYYY-MM-DD[T23:59:59.000Z]');
		var interval = 'hour'
		switch (selText.trim()) {
			case 'Today':
				startDate = moment().format('YYYY-MM-DD[T01:00:00.000Z]');
				endDate = moment().add(1,'days').format('YYYY-MM-DD[T01:00:00.000Z]');
				break;
			case 'Last 7 Days':
				startDate = moment().subtract(6, "days").format('YYYY-MM-DD[T01:00:00.000Z]');
				interval = 'day'
				break;
		}
		genrateData(startDate, endDate, interval);

	});
	$("#skuChartCount a").click(function () {
		var selText = $(this).text();
		var $this = $(this);
		$this.parents('.btn-group').find('.dropdown-toggle').html(selText + ' <span class="caret"></span>');
		$this.parents('.dropdown-menu').find('li').removeClass('active');
		$this.parent().addClass('active');
		var endDate = moment().format('YYYY-MM-DD[T23:59:59.000Z]');
		var interval = 'hour'
		switch (selText.trim()) {
			case 'Today':
				startDate = moment().format('YYYY-MM-DD[T01:00:00.000Z]');
				endDate = moment().add(1,'days').format('YYYY-MM-DD[T01:00:00.000Z]');
				break;
			case 'Last 7 Days':
				startDate = moment().subtract(6, "days").format('YYYY-MM-DD[T01:00:00.000Z]');
				interval = 'day'
				break;
		}
		skuDoorCount(startDate, endDate, interval);

	});
	$("#skuproduct a").click(function () {
		var selText = $(this).text();
		var $this = $(this);
		$this.parents('.btn-group').find('.dropdown-toggle').html(selText + ' <span class="caret"></span>');
		$this.parents('.dropdown-menu').find('li').removeClass('active');
		$this.parent().addClass('active');
		var isTop = true;
		switch (selText.trim()) {
			case 'Top 10':
				isTop = true;
				break;
			case 'Bottom 10':
				isTop = false;
				break;
		}
		skuPlanogram(isTop);

	});
	$("#skuproductrealogram a").click(function () {
		var selText = $(this).text();
		var $this = $(this);
		$this.parents('.btn-group').find('.dropdown-toggle').html(selText + ' <span class="caret"></span>');
		$this.parents('.dropdown-menu').find('li').removeClass('active');
		$this.parent().addClass('active');
		var isTop = true;
		switch (selText.trim()) {
			case 'Top 20':
				isTop = true;
				break;
			case 'Bottom 20':
				isTop = false;
				break;
		}
		skuRealogram(isTop);

	});
	setInterval(function () {
		if (!isLoaded) {
			applyDashboardCharts();
			isLoaded = true;
		}
	}, 4000);
});