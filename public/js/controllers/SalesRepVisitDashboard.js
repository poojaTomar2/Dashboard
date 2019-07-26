var chartData;
var markers = [];
var markerCluster;
var map;
var sellerTopValue = true;
var customerTopValue = true;
var totlaVisit;
var filterValues = {};
var salesVisitDuration;
var jsonFilter = JSON.stringify({
	"start": 0,
	"limit": 10
});

function applyDashboardCharts(result) {
	Highcharts.setOptions({
		lang: {
			thousandsSep: ','
		}
	});
	result = result.data;
	coolerDashboard.gridUtils.ajaxIndicatorStop();
	chartData = result;
	if (result) {

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Visit Frequency',
				type: 'column',
				yAxis: 0,
				data: function (record) {
					return record.Visit;
				}
			}, {
				name: 'Sales',
				type: 'spline',
				yAxis: 1,
				data: function (record) {
					return record.Sales;
				}
			}],
			xAxis: function (record) {
				return record.Name;
			},
			data: result.visitFrequency
		});

		$('#visitFrequency').highcharts({
			chart: {
				renderTo: 'visitFrequency'
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
						text: ' Number Of Outlets '
					}
				}, {
					title: {
						text: 'Sales (Cases/Pieces)'
					},
					opposite: true
				},

			],
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Visit Duration',
				type: 'column',
				yAxis: 0,
				data: function (record) {
					return record.Visit;
				}
			}, {
				name: 'Sales',
				type: 'spline',
				yAxis: 1,
				data: function (record) {
					return record.Sales;
				}
			}],
			xAxis: function (record) {
				return record.Name;
			},
			data: result.visitDuration
		});

		$('#visitDuration').highcharts({
			chart: {
				renderTo: 'visitDuration'
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
						text: 'Total Number Of Outlets  '
					}
				}, {
					title: {
						text: 'Sales (Cases/Pieces)'
					},
					opposite: true
				},

			],
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Count Of Visits',
				type: 'column',
				data: function (record) {
					return record.Value;
				}
			}],
			xAxis: function (record) {
				return record.Name;
			},
			data: result.visitBySeller
		});

		$('#visitBySeller').highcharts({
			chart: {
				renderTo: 'visitBySeller'
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
				}
			}, ],
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});

		var seriesData = highChartsHelper.convertToSeries({
			seriesConfig: [{
				name: 'Visit Duration',
				type: 'column',
				data: function (record) {
					return coolerDashboard.common.floatValue(record.Value);
				}
			}],
			xAxis: function (record) {
				return record.Name;
			},
			data: result.visitDurationByCustomer
		});

		$('#visitDurationByCustomer').highcharts({
			chart: {
				renderTo: 'visitDurationByCustomer'
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
					text: 'Duration (Mins)'
				}
			}, ],
			xAxis: seriesData.xAxis,
			series: seriesData.series
		});

		var map = document.getElementById('map-canvas');
		var mapfrequency = document.getElementById('map-canvas-frequency');
		var locationsData = result.visitDurationHeatMap;
		if (gMapPanel.gmap) {
			gMapPanel.mapGetCenter(locationsData);
			//gMapPanel.mapGetCenter(result.visitDurationHeatMap, true);
		}
		var chicago = new google.maps.LatLng(41.850033, -87.6500523);
		var mapOptions = {
			zoom: 12,
			center: this.center || chicago,
			/* Disabling default UI widgets */
			disableDefaultUI: false,
			minZoom: 2,
			maxZoom: 12,
			styles: mapStyles
		}
		var gmap = new google.maps.Map(mapfrequency, mapOptions);
		var latlngbounds = new google.maps.LatLngBounds();
		var heatmap = new google.maps.visualization.HeatmapLayer({
			data: [],
			map: gmap,
			maxIntensity: 10
		});
		var heatmapPoint = [];
		var point;
		locationsData = result.visitHistoryHeatMap;
		for (var i = 0; i < locationsData.length; i++) {
			for (var j = 0; j < 3; j++) {
				heatmapPoint.push(addHeatMapData(locationsData[i]));
			}
			point = new google.maps.LatLng(parseFloat(locationsData[i].Latitude), parseFloat(locationsData[i].Longitude));
			latlngbounds.extend(point);
		}
		var gradient2 = [
			'rgba(255, 255, 0, 0)',
			'rgba(255, 255, 0, 1)',
			'rgba(255, 225, 0, 1)',
			'rgba(0, 0, 255, 1)',
			'rgba(0, 0, 225, 1)',
			'rgba(255, 0, 0, 1)',
			'rgba(225, 0, 0, 1)'
		]

		gmap.setCenter(latlngbounds.getCenter());
		gmap.fitBounds(latlngbounds);
		gmap.setZoom(gmap.getZoom());
		heatmap.setData(heatmapPoint);
		heatmap.set('radius', 20);
		heatmap.set('gradient', gradient2);

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
		$('#smartCoolerSelectedPercentageKPI').data('easyPieChart').update(result.totalSmartAssetCount == 0 ? 0 : (result.smartAssetCount / result.totalSmartAssetCount) * 100);
		totlaVisit = result.visitPerMonth;
		$('#totlaVisit').data('easyPieChart').update(result.visitPerMonth);
		salesVisitDuration = result.salesVisitDuration;
		$('#salesVisitDuration').data('easyPieChart').update(result.salesVisitDuration);
		$('#rateCompliance').data('easyPieChart').update(result.routeCompliance.toFixed(2));
		$('#smartCoolerWareHouseSelectedKPI').html(result.smartAssetCountWareHouse);
		$('#smartCoolerWareHouseSelectedPercentageKPI').data('easyPieChart').update(result.filteredAssets == 0 ? 0 : (result.smartAssetCountWareHouse / result.filteredAssets) * 100);
		//$('#totlaVisit').html( result.totalCustomer);
		//$('#salesVisitDuration').html( result.salesVisitDuration);
		//$('#rateCompliance').html( result.rateCompliance);

	}
}

function addHeatMapData(item) {
	var latlong = new google.maps.LatLng(item.Latitude, item.Longitude);
	var weight = item.total;
	return {
		location: latlong,
		weight: weight * weight
	};
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
	coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
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

	var sellerTopArr = _.filter(this.filterValuesChart, function (data) {
		return data.name == 'sellerTop'
	});
	var customerTopArr = _.filter(this.filterValuesChart, function (data) {
		return data.name == 'customerTop'
	});

	var sellerTopIndexes = jQuery.inArray(sellerTopArr[0], this.filterValuesChart);
	var customerTopIndexes = jQuery.inArray(customerTopArr[0], this.filterValuesChart);

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
	$("#assetGridFilter").DataTable().ajax.reload();
	$("#locationGridFilter").DataTable().ajax.reload();

	$.ajax({
		url: coolerDashboard.common.nodeUrl('getSalesVisitWidget'),
		data: this.filterValuesChart,
		type: 'POST',
		success: applyDashboardCharts,
		failure: function (response, opts) {
			coolerDashboard.gridUtils.ajaxIndicatorStop();
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

	//pageSetUp();
	setup_widgets_desktop_extended();
	$("#filterFormKPI").load('views/common/filter.html');
	$("#filterSummary").load('views/common/filterSummary.html');


	sellerTopValue = $("#sellerTop").is(':checked');
	customerTopValue = $("#customerTop").is(':checked');

	$("#sellerTop").click(function () {
		sellerTopValue = $('#sellerTop').is(':checked');

		sendAjax();
	});

	$('#totlaVisit').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		lineCap: 'butt',
		scaleColor: false,
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (isNaN(totlaVisit)) {
				totlaVisit = 'N/A'
			}
			$(this.el).find('.percent').text(coolerDashboard.common.float(totlaVisit));
		}
	});

	$('#salesVisitDuration').easyPieChart({
		size: 50, //110
		barColor: '#a90329',
		lineCap: 'butt',
		scaleColor: false,
		lineWidth: 4,
		onStep: function (from, to, percent) {
			if (isNaN(salesVisitDuration)) {
				salesVisitDuration = 'N/A'
			}
			$(this.el).find('.percent').text(coolerDashboard.common.float(salesVisitDuration));
		}
	});

	$("#customerTop").click(function () {
		customerTopValue = $('#customerTop').is(':checked');

		sendAjax();
	});
	var filterValues = {};

	var emptyData = {
		salesVisit: {
			Date: '',
			VisitDuration: '',
			CountofVisit: ''
		},
		visitBySeller: {
			Name: '',
			Value: ''
		},
		visitDurationByCustomer: {
			Name: '',
			Value: ''
		},
		visitFrequency: '',
		visitDuration: '',
		visitHistoryHeatMap: '',
		totalCooler: 0,
		coolerSelected: 0
	};
	emptyData = JSON.stringify(emptyData);
	//applyDashboardCharts(emptyData);

	//sendAjax(false);

});