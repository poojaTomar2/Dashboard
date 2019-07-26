var LocationfilterValues = {};
var AssetfilterValues = {};
var AlertfilterValues = {};
var VisionfilterValues = {};
var RecognitionfilterValues = {};
var recognitionstartDate;
var recognitionendDate;
var activeLocationTab;

function sendAjax(first) {

	if (jQuery.isEmptyObject(this.filterValuesChart)) {

		this.filterValues = {};
		this.jsonFilter = {
			"start": 0,
			"limit": 10
		};

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
	filterValues = {};

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

	coolerDashboard.common.updateDateFilterText(this.filterValuesChart, '.timeFilterName');
	setTimeout(function () {
		coolerDashboard.common.updateAppliedFilterText(this.filterValuesChart, '.appliedFilter', '.totalFilterCount');
	}, 200);

	initialize(filterValues);
	refresh();

	// loadKpiData(filterValues);
};

function getActiveTab(tabId) {
	activeLocationTab = tabId;
}

function applyDashboardCharts(result) {
	result = result.data;
	coolerDashboard.gridUtils.ajaxIndicatorStop();
	if (result) {
		var totalCooler = result.totalCooler ? result.totalCooler : 0;
		$('#totalCustomer').html(result.totalCustomer);
		$('#customerSelectedKPI').html(result.filteredOutlets);
		setTimeout(function () {
			$('#customerSelectedPercentageKPI').data('easyPieChart').update(result.totalCustomer == 0 ? 0 : (result.filteredOutlets /
				result.totalCustomer) * 100);
		}, 50);

		$('#coolerSelectedKPI').html(totalCooler);
		$('#smartCoolerSelectedKPI').html(result.smartAssetCount);
		setTimeout(function () {
			$('#smartCoolerSelectedPercentageKPI').data('easyPieChart').update(totalCooler == 0 ? 0 : (result.smartAssetCount /
				totalCooler) * 100);
		}, 50);
	}
};

function loadKpiData(filterValues) {
	if (filterValues.DisplacementFilter || filterValues.DisplacementFilter || filterValues.Displacement_To ||
		filterValues.Displacement_From || filterValues["Displacement_To[]"] ||
		filterValues["Displacement_From[]"]) {
		filterValues["startDateMovement"] = filterValues.startDate;
		filterValues["endDateMovement"] = filterValues.endDate;
		filterValues["fromMovementScreen"] = true;
		if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
			filterValues["dayOfWeekMovement"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
		}
		if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
			filterValues["yearWeekMovement"] = filterValues.yearWeek || filterValues["yearWeek[]"];
		}
		if (filterValues.quarter || filterValues["quarter[]"]) {
			filterValues["quarterMovement"] = filterValues.quarter || filterValues["quarter[]"];
		}
		if (filterValues.month || filterValues["month[]"]) {
			filterValues["monthMovement"] = filterValues.month || filterValues["month[]"];
		}
	}

	if (filterValues.DoorCount || filterValues["DoorCount[]"]) {
		filterValues["startDateDoor"] = filterValues.startDate;
		filterValues["endDateDoor"] = filterValues.endDate;
		filterValues["fromDoorScreen"] = true;
		filterValues["customQueryDoor"] = true;
		if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
			filterValues["dayOfWeekDoor"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
		}
		if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
			filterValues["yearWeekDoor"] = filterValues.yearWeek || filterValues["yearWeek[]"];
		}
		if (filterValues.quarter || filterValues["quarter[]"]) {
			filterValues["quarterDoor"] = filterValues.quarter || filterValues["quarter[]"];
		}
		if (filterValues.month || filterValues["month[]"]) {
			filterValues["monthDoor"] = filterValues.month || filterValues["month[]"];
		}
	}

	if (filterValues.TempBand || filterValues["TempBand[]"]) {
		filterValues["startDateHealth"] = filterValues.startDate;
		filterValues["endDateHealth"] = filterValues.endDate;
		filterValues["fromHealthScreen"] = true;
		filterValues["customQueryHealth"] = true;
		if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
			filterValues["dayOfWeekHealth"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
		}
		if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
			filterValues["yearWeekHealth"] = filterValues.yearWeek || filterValues["yearWeek[]"];
		}
		if (filterValues.quarter || filterValues["quarter[]"]) {
			filterValues["quarterHealth"] = filterValues.quarter || filterValues["quarter[]"];
		}
		if (filterValues.month || filterValues["month[]"]) {
			filterValues["monthHealth"] = filterValues.month || filterValues["month[]"];
		}
	}

	if (filterValues.LightStatus || filterValues["LightStatus[]"]) {
		filterValues["startDateLight"] = filterValues.startDate;
		filterValues["endDateLight"] = filterValues.endDate;
		filterValues["fromLightScreen"] = true;
		filterValues["LightStatusBand"] = filterValues.LightStatus || filterValues["LightStatus[]"];
		filterValues["customQueryLight"] = true;
		if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
			filterValues["dayOfWeekLight"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
		}
		if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
			filterValues["yearWeekLight"] = filterValues.yearWeek || filterValues["yearWeek[]"];
		}
		if (filterValues.quarter || filterValues["quarter[]"]) {
			filterValues["quarterLight"] = filterValues.quarter || filterValues["quarter[]"];
		}
		if (filterValues.month || filterValues["month[]"]) {
			filterValues["monthLight"] = filterValues.month || filterValues["month[]"];
		}
	}

	if (filterValues.PowerStatus || filterValues["PowerStatus[]"]) {
		filterValues["startDatePower"] = filterValues.startDate;
		filterValues["endDatePower"] = filterValues.endDate;
		filterValues["fromPowerScreen"] = true;
		filterValues["PowerBand"] = filterValues.PowerStatus || filterValues["PowerStatus[]"];
		filterValues["customQueryPower"] = true;
		if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
			filterValues["dayOfWeekPower"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
		}
		if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
			filterValues["yearWeekPower"] = filterValues.yearWeek || filterValues["yearWeek[]"];
		}
		if (filterValues.quarter || filterValues["quarter[]"]) {
			filterValues["quarterPower"] = filterValues.quarter || filterValues["quarter[]"];
		}
		if (filterValues.month || filterValues["month[]"]) {
			filterValues["monthPower"] = filterValues.month || filterValues["month[]"];
		}
	}

	if (jQuery.isEmptyObject(filterValues)) {
		var startDate = moment().subtract(1, 'months').startOf('month');
		var endDate = moment().subtract(1, 'months').endOf('month');
		filterValues = [];
		if (startDate && endDate) {
			filterValues.push({
				"name": "startDate",
				"value": startDate.format('YYYY-MM-DD[T00:00:00]')
			})
			filterValues.push({
				"name": "endDate",
				"value": endDate.format('YYYY-MM-DD[T23:59:59]')
			})
		}
	}
	coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
	$.ajax({
		url: coolerDashboard.common.nodeUrl('getLocationWidgetData'),
		data: filterValues,
		type: 'POST',
		success: applyDashboardCharts,
		failure: function (response, opts) {
			coolerDashboard.gridUtils.ajaxIndicatorStop();
		},
		scope: this
	});
};

function refresh() {
	$("#assetGrid").DataTable().ajax.reload();
	$("#locationGrid").DataTable().ajax.reload();
	$("#alertGrid").DataTable().ajax.reload();
	$("#planogramGrid").DataTable().ajax.reload();
	$("#visitGrid").DataTable().ajax.reload();
	$("#recognitionReportGrid").DataTable().ajax.reload();
}

$(document).ready(function () {

	coolerDashboard.gridUtils.initGridStackDynamicView();

	$("#assetPurityPopup").load('views/common/assetPurityPopup.html');


	$('#liVisit').addClass('hidden');
	if (coolerDashboard.common.hasPermission('DashboardVisit')) {
		$('#liVisit').removeClass('hidden');
	}

	$('#liReport').addClass('hidden');
	if (coolerDashboard.common.hasPermission('DashboardRecognitionReport')) {
		$('#liReport').removeClass('hidden');
	}


	if (window.location.hash == "#location#s6") {


		$("#recognitionreportrangeVerifiedOn").removeClass('hidden');
	} else {
		$("#recognitionreportrangeVerifiedOn").addClass('hidden');
	}

	var start = moment().subtract(1, 'months').startOf('month');
	var end = moment().subtract(1, 'months').endOf('month');


	function dateCallBack(start, end) {
		$('#recognitionreportrange span').html(start.format(coolerDashboard.dateFormat) + ' - ' + end.format(
			coolerDashboard.dateFormat));
		recognitionstartDate = start;
		recognitionendDate = end;
		//getChartFilteredData(0, 0, 0, startDate, endDate);
		$("#recognitionReportGrid").DataTable().ajax.reload();

	}

	$('#recognitionreportrangeVerifiedOn').daterangepicker({
		startDate: start,
		endDate: end,
		changeYear: true,
		"autoApply": false,
		"maxDate": moment(),
		"showButtonPanel": true,
		//"showDropdowns": true,
		"showISOWeekNumbers": true,
		ranges: {

			'This Month': [moment().startOf('month'), moment().endOf('month')],
			'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
		}
	}, dateCallBack);

	if (window.location.hash.indexOf("token") > -1) {

		var token = window.location.hash.substring(window.location.hash.indexOf("token") + 6);
		coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
		$.ajax({
			url: coolerDashboard.common.nodeUrl('getUserByToken'),
			type: 'GET',
			data: {
				tokenId: token
			},
			success: function (data) {
				var loginData = data.data[0];
				if (loginData) {
					var params = {
						username: loginData.UserName,
						password: loginData.PasswordHash,
						encrypt: false
					}
					$.post('/login', params).done(function (data) {

						if (data.success) {
							coolerDashboard.gridUtils.ajaxIndicatorStop();
							$("#wid-id-20").load('views/common/filter.html');
							window.location.href = 'default.html#location#s5';
							localStorage.setItem('data', LZString.compressToUTF16(JSON.stringify(data)));
						} else {
							alert('Authentication failed.');
							coolerDashboard.gridUtils.ajaxIndicatorStop();
						}
					}).fail(function (data) {
						alert('Oops! some server error occured. Please try again.');
					});
				}
			},
			failure: function () {
				coolerDashboard.gridUtils.ajaxIndicatorStop();
				alert('Authentication failed');
			}
		});

	} else {

		$("#wid-id-20").load('views/common/filter.html');

		$('#noresultdialog').dialog({
			autoOpen: false,
			width: 320,
			height: 100,
			resizable: false,
			modal: true,
			title: "Info"
		});
		//pageSetUp();
		//initialize();

		var gridUtils = coolerDashboard.gridUtils;

		//coolerDashboard.common.setFilter();

		var responsiveHelper_dt_basic = undefined;
		var responsiveHelper_dt_Alert = undefined;
		var responsiveHelper_dt_Asset = undefined;
		var responsiveHelper_dt_Visit = undefined;
		var responsiveHelper_dt_Planogram = undefined;
		var responsiveHelper_dt_RecognitionReport = undefined;

		var breakpointDefinition = {
			tablet: 1024,
			phone: 480
		};



		gridUtils.addChildGridHandler({
			gridId: '#alertGrid',
			renderer: function (d) {
				return gridUtils.createDetailTable({
					items: [{
						label: 'Outlet Code',
						value: gridUtils.joinStrings(d.LocationCode)
					}, {
						label: 'Outlet Name',
						value: gridUtils.joinStrings(d.Location)
					}, {
						label: 'Address',
						value: gridUtils.joinStrings(' ', d.Street, d.Street2, d.Street3)
					}, {
						label: 'City',
						value: gridUtils.joinStrings(d.City)
					}, {
						label: 'State',
						value: gridUtils.joinStrings(d.State)
					}, {
						label: 'Country',
						value: gridUtils.joinStrings(d.Country)
					}, {
						label: 'Market',
						value: gridUtils.joinStrings(d.Market)
					}, {
						label: 'Channel',
						value: gridUtils.joinStrings(d.Channel)
					}, {
						label: 'Classification',
						value: gridUtils.joinStrings(d.Classification)
					}, {
						label: 'Territory',
						value: gridUtils.joinStrings(d.SalesTerritory)
					}]
				});
			}
		});

		var common = coolerDashboard.common,
			renderers = coolerDashboard.renderers;

		filterValues = {};

		$('#alertGrid thead tr td').each(function () {
			var title = $(this).text();
			if (title != "") {
				$(this).html('<input type="text" class="form-control" placeholder="Search ' + title + '" />');
				attachFilterListener(this.id);
			}
		});

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
				var startDate = moment().subtract(1, 'months').startOf('month');
				var endDate = moment().subtract(1, 'months').endOf('month');
				if (startDate && endDate) {
					filterValues.startDate = startDate.format('YYYY-MM-DD[T00:00:00]');
					filterValues.endDate = endDate.format('YYYY-MM-DD[T23:59:59]');
				}
			}
		}

		//loadKpiData(filterValues);

		var planogramTable = $('#planogramGrid')
			.dataTable({
				ajax: {
					url: coolerDashboard.common.nodeUrl('planogram/list', {}),
					method: 'POST',
					data: function (data, settings) {
						var searchFilters = $(".filterable");
						for (var i = 0, len = searchFilters.length; i < len; i++) {
							var searchElement = searchFilters[i];
							if (searchElement.dataset.grid == "planogramGrid") {
								var value = $(searchElement.childNodes[0]).val();
								if (value) {
									data['search_' + searchElement.dataset.column] = value;
								}
							}
						}

						if (filterValues.DisplacementFilter || filterValues.DisplacementFilter || filterValues.Displacement_To ||
							filterValues.Displacement_From || filterValues["Displacement_To[]"] ||
							filterValues["Displacement_From[]"]) {
							filterValues["startDateMovement"] = filterValues.startDate;
							filterValues["endDateMovement"] = filterValues.endDate;
							filterValues["fromMovementScreen"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekMovement"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekMovement"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterMovement"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthMovement"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (filterValues.DoorCount || filterValues["DoorCount[]"]) {
							filterValues["startDateDoor"] = filterValues.startDate;
							filterValues["endDateDoor"] = filterValues.endDate;
							filterValues["fromDoorScreen"] = true;
							filterValues["customQueryDoor"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekDoor"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekDoor"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterDoor"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthDoor"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (filterValues.TempBand || filterValues["TempBand[]"]) {
							filterValues["startDateHealth"] = filterValues.startDate;
							filterValues["endDateHealth"] = filterValues.endDate;
							filterValues["fromHealthScreen"] = true;
							filterValues["customQueryHealth"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekHealth"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekHealth"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterHealth"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthHealth"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (filterValues.LightStatus || filterValues["LightStatus[]"]) {
							filterValues["startDateLight"] = filterValues.startDate;
							filterValues["endDateLight"] = filterValues.endDate;
							filterValues["fromLightScreen"] = true;
							filterValues["LightStatusBand"] = filterValues.LightStatus || filterValues["LightStatus[]"];
							filterValues["customQueryLight"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekLight"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekLight"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterLight"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthLight"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (filterValues.PowerStatus || filterValues["PowerStatus[]"]) {
							filterValues["startDatePower"] = filterValues.startDate;
							filterValues["endDatePower"] = filterValues.endDate;
							filterValues["fromPowerScreen"] = true;
							filterValues["PowerBand"] = filterValues.PowerStatus || filterValues["PowerStatus[]"];
							filterValues["customQueryPower"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekPower"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekPower"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterPower"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthPower"] = filterValues.month || filterValues["month[]"];
							}
						}

						filterValues["isFromGrid"] = true;

						return $.extend(data, filterValues);
					}
				},
				processing: true,
				serverSide: true,
				"deferLoading": 0,
				columns: [{
						"className": 'details-control',
						"orderable": false,
						"data": '',
						"defaultContent": '',
						width: 15
					}, {
						data: 'Name',
						"orderable": false,
						width: 150,
						className: 'inline-link',
						render: function (data, type, row) {
							return row.LocationCode + "<br/>" + row.Name;
						}
					}, {
						data: 'RelogramFacingSKU',
						"orderable": false,
						render: function (data, type, row) {
							if (row.TotalFacings != 0) {
								var EmptyFacingColor = row.RelogramFacingSKU < 15 ? "#00964C" : "red";
								return "<div><span class='ProductsCountText' style='background:" + EmptyFacingColor + "'>" + row.RelogramFacingSKU +
									" /  " + row.TotalFacings + "</span></div>";
							} else {
								return 'N/A';
							}
						},
						width: 100
					}, {
						data: 'TotalSkuOOS',
						"orderable": false,
						width: 90,
						render: function (data, type, row) {
							return data || row["isPurityAvailable"] ? data : 'N/A';
						}
					}, {
						data: 'TotalSSDProductsSKU',
						"orderable": false,
						width: 100,
						render: function (data, type, row) {
							return data || row["isPurityAvailable"] ? data : 'N/A';
						}
					}, {
						data: 'TotalNCBProductsSKU',
						"orderable": false,
						width: 100,
						render: function (data, type, row) {
							return data || row["isPurityAvailable"] ? data : 'N/A';
						}
					}, {
						data: 'TotalSSDProducts',
						"orderable": false,
						width: 100,
						render: function (data, type, row) {
							return data || row["isPurityAvailable"] ? data : 'N/A';
						}
					}, {
						data: 'TotalNCBProducts',
						"orderable": false,
						width: 100,
						render: function (data, type, row) {
							return data || row["isPurityAvailable"] ? data : 'N/A';
						}
					}, {
						data: 'Coca-cola-Facings',
						width: 150,
						"orderable": false,
						render: function (data, type, row) {
							var records = row["Coca-cola-Facings"];
							var cocaColaFacingsPercentage = (row.TotalCocaColaFacings * 100) / (row.TotalFacings);
							if (row.TotalFacings != 0) {
								return "<div><span class='ProductsCountText' style='background: #00964C'>" + row.TotalCocaColaFacings +
									" /  " + cocaColaFacingsPercentage.toFixed(0) + "%</span></div>";
							} else {
								return 'N/A';
							}

						}
					}, {
						data: 'TotalForiegnFacing',
						"orderable": false,
						width: 150,
						render: function (data, type, row) {
							var foriegnFacingsPercentage = (row.TotalForiegnProduct * 100) / (row.TotalFacings);
							var foriegnFacingColor = foriegnFacingsPercentage == 0 ? "#00964C" : foriegnFacingsPercentage >= 50 ?
								"orange" : "red";
							if (row.TotalFacings != 0) {
								return "<div><span class='ProductsCountText'  style='background:" + foriegnFacingColor + "'>" + row.TotalForiegnProduct +
									" /  " + foriegnFacingsPercentage.toFixed(0) + "%</span></div>";
							} else {
								return 'N/A';
							}
						}

					}, {
						data: 'EmptyFacings',
						width: 150,
						"orderable": false,
						width: 150,
						render: function (data, type, row) {
							if (row.TotalFacings != 0) {
								var emptyFacingsPercentage = (row.EmptyFacings * 100) / (row.TotalFacings);
								var EmptyFacingColor = emptyFacingsPercentage == 0 ? "#00964C" : emptyFacingsPercentage >= 50 ?
									"orange" : "red";
								return "<div><span class='ProductsCountText' style='background:" + EmptyFacingColor + "'>" + row.EmptyFacings +
									" /  " + emptyFacingsPercentage.toFixed(0) + "%</span></div>";
							} else {
								return 'N/A';
							}
						}
					}, {
						data: 'NumberOfComplaintFacing',
						width: 170,
						"orderable": false,
						render: function (data, type, row) {
							complaintFacingPercentage = (row.NonCompliantFacingCount * 100) / (row.TotalFacings);
							if (row.TotalFacings != 0) {
								var color = complaintFacingPercentage == 0 ? "#00964C" : complaintFacingPercentage >= 50 ? "orange" :
									"red";
								return "<div><span class='ProductsCountText' style='background:" + color + "'>" + row.NonCompliantFacingCount +
									" /  " + complaintFacingPercentage.toFixed(0) + "%</span></div>";
							} else {
								return 'N/A';
							}
						}
					}, {
						data: 'PurityPercentage',
						"orderable": false,
						width: 90,
						render: function (data, type, row) {
							if (row.PlanogramFacings != 0) {
								return row.PurityPercentage ? row.PurityPercentage.toFixed(2) : 0;
							} else {
								return 0;
							}
						}
					}

				],
				"sDom": "" + "t" +
					"<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
				"autoWidth": true,
				"width": "100%",
				//"sScrollXInner": "1500px",
				"sScrollX": "100%",
				"bScrollCollapse": true,
				"preDrawCallback": function () {
					// Initialize the responsive datatables helper once.
					if (!responsiveHelper_dt_Planogram) {
						responsiveHelper_dt_Planogram = new ResponsiveDatatablesHelper($('#planogramGrid'), breakpointDefinition);
					}
				},
				"rowCallback": function (nRow) {
					responsiveHelper_dt_Planogram.createExpandIcon(nRow);
				},
				"drawCallback": function (oSettings) {
					responsiveHelper_dt_Planogram.respond();
				}

			});

		gridUtils.addChildGridHandler({
			gridId: '#planogramGrid',
			renderer: function (d) {
				return gridUtils.createDetailTableForPlanogram({
					items: [{
						label: 'Address',
						value: d
					}]
				});
			}
		});

		$('#recognitionReportGrid thead tr td').each(function () {
			var title = $(this).text();
			if (title != "") {
				$(this).html('<input type="text" class="form-control" placeholder="Search ' + title + '" />');
				attachFilterListener(this.id);
			}
		});

		var recognitionReportTable = $('#recognitionReportGrid')
			.dataTable({
				ajax: {
					url: coolerDashboard.common.nodeUrl('recognitionReport/list', $this.jsonFilter),
					method: 'POST',
					data: function (data, settings) {
						var searchFilters = $(".filterable");
						for (var i = 0, len = searchFilters.length; i < len; i++) {
							var searchElement = searchFilters[i];
							if (searchElement.dataset.grid == "recognitionReportGrid") {
								var value = $(searchElement.childNodes[0]).val();
								if (value) {
									data['search_' + searchElement.dataset.column] = value;
								}
							}
						}

						if (filterValues.DisplacementFilter || filterValues.DisplacementFilter || filterValues.Displacement_To ||
							filterValues.Displacement_From || filterValues["Displacement_To[]"] ||
							filterValues["Displacement_From[]"]) {
							filterValues["startDateMovement"] = filterValues.startDate;
							filterValues["endDateMovement"] = filterValues.endDate;
							filterValues["fromMovementScreen"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekMovement"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekMovement"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterMovement"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthMovement"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (filterValues.DoorCount || filterValues["DoorCount[]"]) {
							filterValues["startDateDoor"] = filterValues.startDate;
							filterValues["endDateDoor"] = filterValues.endDate;
							filterValues["fromDoorScreen"] = true;
							filterValues["customQueryDoor"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekDoor"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekDoor"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterDoor"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthDoor"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (filterValues.TempBand || filterValues["TempBand[]"]) {
							filterValues["startDateHealth"] = filterValues.startDate;
							filterValues["endDateHealth"] = filterValues.endDate;
							filterValues["fromHealthScreen"] = true;
							filterValues["customQueryHealth"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekHealth"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekHealth"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterHealth"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthHealth"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (filterValues.LightStatus || filterValues["LightStatus[]"]) {
							filterValues["startDateLight"] = filterValues.startDate;
							filterValues["endDateLight"] = filterValues.endDate;
							filterValues["fromLightScreen"] = true;
							filterValues["LightStatusBand"] = filterValues.LightStatus || filterValues["LightStatus[]"];
							filterValues["customQueryLight"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekLight"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekLight"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterLight"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthLight"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (filterValues.PowerStatus || filterValues["PowerStatus[]"]) {
							filterValues["startDatePower"] = filterValues.startDate;
							filterValues["endDatePower"] = filterValues.endDate;
							filterValues["fromPowerScreen"] = true;
							filterValues["PowerBand"] = filterValues.PowerStatus || filterValues["PowerStatus[]"];
							filterValues["customQueryPower"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekPower"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekPower"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterPower"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthPower"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (recognitionstartDate && recognitionendDate) {
							data.fromRecognitionReport = true;
							filterValues.startDate = recognitionstartDate.format('YYYY-MM-DD[T00:00:00.000Z]');
							filterValues.endDate = recognitionendDate.format('YYYY-MM-DD[T23:59:59.000Z]');
						}

						filterValues["isFromGrid"] = true;

						RecognitionfilterValues = $.extend(data, filterValues);
						return $.extend(data, filterValues);
					}
				},
				"oTableTools": {
					"sRowSelect": "single"
				},
				order: [
					[2, "asc"]
				],
				processing: true,
				serverSide: true,
				"deferLoading": 0,
				columns: [{
						data: 'Id',
					},
					{
						data: 'OutletCode',
						"orderable": true
					},
					{
						data: 'Outlet',
						width: 130,
						"orderable": true
					},

					{
						data: 'SerialNumber',
					},
					{
						data: 'AssetType'
					},
					{
						data: 'PurityDateTime',
						render: function (data, type, row) {
							return moment(data).format("YYYY-MM-DD HH:mm:ss");
						}
					},
					{
						data: 'VerifiedOn',
						render: function (data, type, row) {
							return moment(data).format("YYYY-MM-DD HH:mm:ss");
						}
					},
					{
						data: 'CreatedOn',
						render: function (data, type, row) {
							return moment(data).format("YYYY-MM-DD HH:mm:ss");
						}
					},
					{
						data: 'TotalFacing'
					},
					{
						data: 'SKUPerVsTotal',
						"orderable": false,
						render: function (data, type, row) {
							return row.SKU + "/" + data + "%";
						}
					},
					{
						data: 'ForeignPerVsTotal',
						render: function (data, type, row) {
							return row.ForeignVsTotal + "/" + data + "%";
						}
					},
					{
						data: 'EmptyPerVsTotal',
						render: function (data, type, row) {
							return row.EmptyVsTotal + "/" + data + "%";
						}
					},
					{
						data: 'UnknownPercentage',
						render: function (data, type, row) {
							return row.UnknownCount + "/" + data + "%";
						}
					},
					{
						data: 'SSDSOCVIPer',
						render: function (data, type, row) {
							return row.SSDSOCVICount + "/" + data + "%";
						}
					},
					{
						data: 'NCBSOCVIPer',
						render: function (data, type, row) {
							return row.NCBSOCVICount + "/" + data + "%";
						}
					},
					{
						data: 'TotalSKU'
					},
					{
						data: 'BottlerSKU'
					},
					{
						data: 'SSDCount'
					},
					{
						data: 'NCBCount'
					},
					{
						data: 'CompetitorSKU'
					},
					{
						data: 'CompetitorSSDSKU'
					},
					{
						data: 'CompetitorNCBSKU'
					},
					{
						data: 'REDPurity'
					},
					{
						data: 'PlanogramCompliance'
					},
					{
						data: 'OOSSkuCount'
					},
				],
				"sDom": +"" +
					"<'dt-toolbar'<'col-sm-12 col-xs-12'C>>" + "t" +
					"<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",

				"autoWidth": true,
				"width": "100%",
				//"sScrollXInner": "1500px",
				"sScrollX": "100%",
				"bScrollCollapse": true,
				"preDrawCallback": function () {
					// Initialize the responsive datatables helper once.
					if (!responsiveHelper_dt_RecognitionReport) {
						responsiveHelper_dt_RecognitionReport = new ResponsiveDatatablesHelper($('#recognitionReportGrid'),
							breakpointDefinition);
					}
				},
				"rowCallback": function (nRow) {
					responsiveHelper_dt_RecognitionReport.createExpandIcon(nRow);
				},
				"drawCallback": function (oSettings) {
					responsiveHelper_dt_RecognitionReport.respond();
				}

			});


		// Start Code for recognitionReportGrid

		$('#recognitionReportGrid').on('click', 'tr', function () {
			var dt = recognitionReportTable.DataTable();
			var planogramId = 0,
				assetPurityId = 0;

			if ($(this).hasClass('selected')) {
				$(this).removeClass('selected');
			} else {
				dt.$('tr.selected').removeClass('selected');
				$(this).addClass('selected');
			}

			//var rowIndex = dt.row(this)[0][0];
			var selectedData = dt.row(this).data();

			//$('#assetPurityModelLabel').value = "Assets Purity" + selectedData.Id;

			var modal = $('#assetPurityModel');
			modal.find('.modal-title').text("Assets Purity : " + selectedData.Id);

			//var filterValues = [];
			filterValues["planogramId"] = selectedData.PlanogramId;
			filterValues["assetPurityId"] = selectedData.Id;
			filterValues["Shelves"] = selectedData.Shelves;
			filterValues["Columns"] = selectedData.Columns;
			$.ajax({
				url: coolerDashboard.common.nodeUrl('facingDetail'),
				data: filterValues,
				type: 'POST',
				success: function (result) {
					$('#assetPurityModel').modal('show');
					coolerDashboard.common.showCoolerImageWindow(result, selectedData);
				},
				failure: function (response, opts) {
					//coolerDashboard.gridUtils.ajaxIndicatorStop();
				},
				scope: this
			});
		});

		// end code for recognitionReportGrid

		var alertTable = $('#alertGrid')
			.dataTable({
				ajax: {
					url: coolerDashboard.common.nodeUrl('alert/list', $this.jsonFilter),
					method: 'POST',
					data: function (data, settings) {
						data.ClosedOn = '0001-01-01T00:00:00';
						//data["openAlert"] = true;
						var searchFilters = $(".filterable");
						for (var i = 0, len = searchFilters.length; i < len; i++) {
							var searchElement = searchFilters[i];
							if (searchElement.dataset.grid == "alertGrid") {
								var value = $(searchElement.childNodes[0]).val();
								if (value) {
									data['search_' + searchElement.dataset.column] = value;
								}
							}
						}
						data["fromOutletScreen"] = true;


						if (filterValues.DisplacementFilter || filterValues.DisplacementFilter || filterValues.Displacement_To ||
							filterValues.Displacement_From || filterValues["Displacement_To[]"] ||
							filterValues["Displacement_From[]"]) {
							filterValues["startDateMovement"] = filterValues.startDate;
							filterValues["endDateMovement"] = filterValues.endDate;
							filterValues["fromMovementScreen"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekMovement"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekMovement"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterMovement"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthMovement"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (filterValues.DoorCount || filterValues["DoorCount[]"]) {
							filterValues["startDateDoor"] = filterValues.startDate;
							filterValues["endDateDoor"] = filterValues.endDate;
							filterValues["fromDoorScreen"] = true;
							filterValues["customQueryDoor"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekDoor"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekDoor"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterDoor"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthDoor"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (filterValues.TempBand || filterValues["TempBand[]"]) {
							filterValues["startDateHealth"] = filterValues.startDate;
							filterValues["endDateHealth"] = filterValues.endDate;
							filterValues["fromHealthScreen"] = true;
							filterValues["customQueryHealth"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekHealth"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekHealth"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterHealth"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthHealth"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (filterValues.LightStatus || filterValues["LightStatus[]"]) {
							filterValues["startDateLight"] = filterValues.startDate;
							filterValues["endDateLight"] = filterValues.endDate;
							filterValues["fromLightScreen"] = true;
							filterValues["LightStatusBand"] = filterValues.LightStatus || filterValues["LightStatus[]"];
							filterValues["customQueryLight"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekLight"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekLight"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterLight"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthLight"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (filterValues.PowerStatus || filterValues["PowerStatus[]"]) {
							filterValues["startDatePower"] = filterValues.startDate;
							filterValues["endDatePower"] = filterValues.endDate;
							filterValues["fromPowerScreen"] = true;
							filterValues["PowerBand"] = filterValues.PowerStatus || filterValues["PowerStatus[]"];
							filterValues["customQueryPower"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekPower"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekPower"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterPower"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthPower"] = filterValues.month || filterValues["month[]"];
							}
						}

						filterValues["isFromGrid"] = true;

						AlertfilterValues = $.extend(data, filterValues);
						return $.extend(data, filterValues);
					}
				},
				order: [
					[7, "asc"]
				],
				processing: true,
				serverSide: true,
				"deferLoading": 0,
				columns: [{
						"className": 'details-control alert-icons alert-icons-location',
						"orderable": false,
						"data": 'AlertTypeId',
						"defaultContent": '',
						render: renderers.alertTypeIcon,
						width: 50
					}, {
						data: 'AlertType'
					}, {
						data: 'AssetSerialNumber',
						className: 'inline-link'
					}, {
						data: 'AlertText'
					}, {
						data: 'AcknowledgeComment',
						render: function (data) {
							return data ? data : '';
						}
					}, {
						data: 'Status'
					}, {
						data: 'AlertAt',
						render: coolerDashboard.common.dateTime
					}, {
						data: 'ClosedOn',
						render: coolerDashboard.common.dateTime
					}, {
						data: 'AlertAge',
						render: renderers.alertAge,
						orderable: false
					}

				],
				"sDom": "" + "t" +
					"<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
				"autoWidth": true,
				"preDrawCallback": function () {
					// Initialize the responsive datatables helper once.
					if (!responsiveHelper_dt_Alert) {
						responsiveHelper_dt_Alert = new ResponsiveDatatablesHelper($('#alertGrid'), breakpointDefinition);
					}
				},
				"rowCallback": function (nRow) {
					responsiveHelper_dt_Alert.createExpandIcon(nRow);
				},
				"drawCallback": function (oSettings) {
					responsiveHelper_dt_Alert.respond();
				}

			});

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

		$('#locationGrid thead tr td').each(function () {
			var title = $(this).text();
			if (title != "") {
				$(this).html('<input type="text" class="form-control" placeholder="Search ' + title.replace(/\s/g, '') + '" />');
				attachFilterListener(this.id);
			}
		});

		gridUtils.addChildGridHandler({
			gridId: '#locationGrid',
			renderer: function (d) {
				return gridUtils.createDetailTable({
					items: [{
						label: 'Street',
						value: gridUtils.joinStrings(d.Street)
					}, {
						label: 'State',
						value: gridUtils.joinStrings(d.State)
					}, {
						label: 'Country',
						value: gridUtils.joinStrings(d.Country)
					}, {
						label: 'Alert Count',
						value: d.Alert_Open
					}]
				});
			}
		});
		var locationGridCount;
		var locationTable = $('#locationGrid')
			.dataTable({
				ajax: {
					url: coolerDashboard.common.nodeUrl('outlet/list', $this.jsonFilter),
					method: 'POST',
					data: function (data, settings) {
						locationGridCount = 0;
						coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');

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
						if (filterValues.AlertTypeId || filterValues.PriorityId || filterValues.StatusId || filterValues[
								"AlertTypeId[]"] || filterValues["PriorityId[]"] || filterValues["StatusId[]"]) {
							filterValues["startDateAlert"] = filterValues.startDate;
							filterValues["endDateAlert"] = filterValues.endDate;
							filterValues["fromOutletScreenAlert"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekAlert"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekAlert"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterAlert"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthAlert"] = filterValues.month || filterValues["month[]"];
							}
						}


						if (filterValues.DisplacementFilter || filterValues.DisplacementFilter || filterValues.Displacement_To ||
							filterValues.Displacement_From || filterValues["Displacement_To[]"] ||
							filterValues["Displacement_From[]"]) {
							filterValues["startDateMovement"] = filterValues.startDate;
							filterValues["endDateMovement"] = filterValues.endDate;
							filterValues["fromMovementScreen"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekMovement"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekMovement"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterMovement"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthMovement"] = filterValues.month || filterValues["month[]"];
							}
						}
						if (filterValues.DoorCount || filterValues["DoorCount[]"]) {
							filterValues["startDateDoor"] = filterValues.startDate;
							filterValues["endDateDoor"] = filterValues.endDate;
							filterValues["fromDoorScreen"] = true;
							filterValues["customQueryDoor"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekDoor"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekDoor"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterDoor"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthDoor"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (filterValues.TempBand || filterValues["TempBand[]"]) {
							filterValues["startDateHealth"] = filterValues.startDate;
							filterValues["endDateHealth"] = filterValues.endDate;
							filterValues["fromHealthScreen"] = true;
							filterValues["customQueryHealth"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekHealth"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekHealth"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterHealth"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthHealth"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (filterValues.LightStatus || filterValues["LightStatus[]"]) {
							filterValues["startDateLight"] = filterValues.startDate;
							filterValues["endDateLight"] = filterValues.endDate;
							filterValues["fromLightScreen"] = true;
							filterValues["LightStatusBand"] = filterValues.LightStatus || filterValues["LightStatus[]"];
							filterValues["customQueryLight"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekLight"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekLight"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterLight"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthLight"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (filterValues.PowerStatus || filterValues["PowerStatus[]"]) {
							filterValues["startDatePower"] = filterValues.startDate;
							filterValues["endDatePower"] = filterValues.endDate;
							filterValues["fromPowerScreen"] = true;
							filterValues["PowerBand"] = filterValues.PowerStatus || filterValues["PowerStatus[]"];
							filterValues["customQueryPower"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekPower"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekPower"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterPower"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthPower"] = filterValues.month || filterValues["month[]"];
							}
						}

						filterValues["isFromGrid"] = true;

						LocationfilterValues = $.extend(data, filterValues);
						return $.extend(data, filterValues);
					}
				},
				order: [
					[2, "asc"]
				],
				processing: true,
				serverSide: true,
				"deferLoading": 0,
				select: true,
				columns: [{
					"className": 'details-control',
					"orderable": false,
					"data": null,
					"defaultContent": '',
					width: 10
				}, {
					data: 'alert',
					render: locationIconsRenderer,
					"orderable": false,
					"className": 'alert-icons alert-icons-location'
				}, {
					data: 'LocationCode',
					className: 'inline-link',
					"orderable": true
				}, {
					data: 'Name',
					className: 'inline-link',
					"orderable": false
				}, {
					data: 'SalesTerritory',
					"orderable": true
				}, {
					data: 'City',
					"orderable": true
				}, {
					data: 'MarketName',
					"orderable": false,
				}, {
					data: 'LocationType',
					"orderable": true
				}, {
					data: 'Classification',
					"orderable": true
				}, {
					data: 'AssetCount',
					className: 'dt-body-right',
					"orderable": false,
					render: function (data, type, row) {
						return row.SmartAssetCount;
					}
				}, {
					data: 'Door_30dayCount',
					"orderable": false,
					render: function (data, type, row) {
						return row["Door_TodayCount"] + " <span class='lighter'>today</span>, " + row["Door_7dayCount"] +
							" <span class='lighter'>7d</span>, " + row["Door_30dayCount"] + " <span class='lighter'>30d</span> ";
					}
				}, {
					data: 'TotalImpureCoolers',
					className: 'dt-body-right',
					"orderable": false,
					render: function (data, type, row) {
						return row["isPurityRecord"] ? data : 'N/A';
					}
				}, {
					data: 'TotalEmptyFacings',
					className: 'dt-body-right',
					"orderable": false,
					render: function (data, type, row) {
						return row["isPurityRecord"] ? data : 'N/A';
					}
				}, {
					data: 'TotalSkuOOS',
					className: 'dt-body-right',
					"orderable": false,
					render: function (data, type, row) {
						return row["isPurityRecord"] ? data : 'N/A';
					}
				}],
				"sScrollX": true,
				"sDom": "" + "t" +
					"<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
				"autoWidth": true,
				"preDrawCallback": function () {
					// Initialize the responsive datatables helper once.
					if (!responsiveHelper_dt_basic) {
						responsiveHelper_dt_basic = new ResponsiveDatatablesHelper($('#locationGrid'), breakpointDefinition);
					}
				},
				"rowCallback": function (nRow) {
					locationGridCount = locationGridCount + 1;
					if (locationGridCount == 1) {
						loadKpiData(filterValues);
						coolerDashboard.gridUtils.ajaxIndicatorStop();
					}
					responsiveHelper_dt_basic.createExpandIcon(nRow);
				},
				"drawCallback": function (oSettings) {
					if (locationGridCount == 0 && oSettings.aoData.length == 0) {
						coolerDashboard.gridUtils.ajaxIndicatorStop();
					}
					responsiveHelper_dt_basic.respond();
				}
			});

		$('#xlsExport').click(function (event, filterValues) {
			exportData(event, filterValues, 'xls');
		});

		$('#csvExport').click(function (event, filterValues) {
			exportData(event, filterValues, 'csv');
		});

		function exportData(event, filterValues, exportType) {
			var activeTab = $('#myTab li.active > a').text().trim()
			//var jsonFilter = filterValues;

			// if (jQuery.isEmptyObject(filterValuesChart)) {
			// 	this.filterValues = {};
			// 	this.jsonFilter = { "start": 0, "limit": 10 };
			// }

			//filterValues = {};

			// $.map(filterValuesChart, function (row) {
			// 	if (typeof filterValues[row.name] === 'undefined') {
			// 		filterValues[row.name] = row.value;
			// 	} else if (typeof filterValues[row.name] === 'object') {
			// 		filterValues[row.name].push(row.value);
			// 	} else {
			// 		filterValues[row.name] = [filterValues[row.name], row.value];
			// 	}
			// });
			if (activeTab == "Outlets") {
				var total = $('#locationGrid').dataTable().fnSettings().fnRecordsTotal();
				//filterValues["length"] = $('#locationGrid').dataTable().fnSettings().fnRecordsTotal();
				//filterValues["limit"] = $('#locationGrid').dataTable().fnSettings().fnRecordsTotal();
				this.jsonFilter = filterValues;
				this.jsonFilter = ({
					"start": 0,
					"limit": total,
					"exportData": "Outlets",
					"exportType": exportType,
					"exportDate": moment().format('YYYY_MM_DD_HH_mm_ss')
				});
				//console.log(JSON.stringify($this.jsonFilter));
				console.log(JSON.stringify(this.jsonFilter));
				//console.log(JSON.stringify(jsonFilter));
				//coolerDashboard.gridUtils.ajaxIndicatorStart();
				console.log('LocationfilterValues: ' + LocationfilterValues);
				LocationfilterValues = $.extend(LocationfilterValues, this.jsonFilter);
				//console.log(JSON.stringify(response.data));
				delete LocationfilterValues.columns;
				delete LocationfilterValues.draw;
				var formElem = this.formElem;
				var hiddenField = this.hiddenField;
				if (!formElem) {
					var formElem = document.createElement("form");
					formElem.target = "_blank";
					formElem.method = "POST"; // or "post" if appropriate
					formElem.action = coolerDashboard.common.nodeUrl('exportData', {});
					hiddenField = document.createElement("input");
					hiddenField.type = "hidden";
					hiddenField.name = "params";
					hiddenField.value = JSON.stringify(LocationfilterValues);

					formElem.appendChild(hiddenField);
					this.formElem = formElem;
					this.hiddenField = hiddenField;
					document.body.appendChild(formElem);
				} else {
					this.hiddenField.value = JSON.stringify(LocationfilterValues);
					this.formElem.action = coolerDashboard.common.nodeUrl('exportData', {});
				}
				formElem.submit();

			} else if (activeTab == "Assets") {

				//LocationfilterValues.isFromOutlet = false;
				var total = $('#assetGrid').dataTable().fnSettings().fnRecordsTotal();
				//filterValues["length"] = $('#locationGrid').dataTable().fnSettings().fnRecordsTotal();
				//filterValues["limit"] = $('#locationGrid').dataTable().fnSettings().fnRecordsTotal();
				this.jsonFilter = filterValues;
				this.jsonFilter = ({
					"start": 0,
					"limit": total,
					"exportData": "Assets",
					"exportType": exportType,
					"exportDate": moment().format('YYYY_MM_DD_HH_mm_ss')
				});
				AssetfilterValues = $.extend(AssetfilterValues, this.jsonFilter);
				delete AssetfilterValues.columns;
				delete AssetfilterValues.draw;
				var formElem = this.formElem;
				var hiddenField = this.hiddenField;
				if (!formElem) {
					var formElem = document.createElement("form");
					formElem.target = "_blank";
					formElem.method = "POST"; // or "post" if appropriate
					formElem.action = coolerDashboard.common.nodeUrl('exportData', {});
					hiddenField = document.createElement("input");
					hiddenField.type = "hidden";
					hiddenField.name = "params";
					hiddenField.value = JSON.stringify(AssetfilterValues);

					formElem.appendChild(hiddenField);
					this.formElem = formElem;
					this.hiddenField = hiddenField;
					document.body.appendChild(formElem);
				} else {
					this.hiddenField.value = JSON.stringify(AssetfilterValues);
					this.formElem.action = coolerDashboard.common.nodeUrl('exportData', {});
				}
				formElem.submit();
			} else if (activeTab == "Alerts") {

				//LocationfilterValues.isFromOutlet = false;
				var total = $('#alertGrid').dataTable().fnSettings().fnRecordsTotal();
				//filterValues["length"] = $('#locationGrid').dataTable().fnSettings().fnRecordsTotal();
				//filterValues["limit"] = $('#locationGrid').dataTable().fnSettings().fnRecordsTotal();
				this.jsonFilter = filterValues;
				this.jsonFilter = ({
					"start": 0,
					"limit": total,
					"exportData": "Alerts",
					"exportType": exportType,
					"exportDate": moment().format('YYYY_MM_DD_HH_mm_ss')
				});
				AlertfilterValues = $.extend(AlertfilterValues, this.jsonFilter);
				delete AlertfilterValues.columns;
				delete AlertfilterValues.draw;
				var formElem = this.formElem;
				var hiddenField = this.hiddenField;
				if (!formElem) {
					var formElem = document.createElement("form");
					formElem.target = "_blank";
					formElem.method = "POST"; // or "post" if appropriate
					formElem.action = coolerDashboard.common.nodeUrl('exportData', {});
					hiddenField = document.createElement("input");
					hiddenField.type = "hidden";
					hiddenField.name = "params";
					hiddenField.value = JSON.stringify(AlertfilterValues);

					formElem.appendChild(hiddenField);
					this.formElem = formElem;
					this.hiddenField = hiddenField;
					document.body.appendChild(formElem);
				} else {
					this.hiddenField.value = JSON.stringify(AlertfilterValues);
					this.formElem.action = coolerDashboard.common.nodeUrl('exportData', {});
				}
				formElem.submit();
			} else if (activeTab == "Vision") {

				//LocationfilterValues.isFromOutlet = false;
				var total = $('#planogramGrid').dataTable().fnSettings().fnRecordsTotal();
				//filterValues["length"] = $('#locationGrid').dataTable().fnSettings().fnRecordsTotal();
				//filterValues["limit"] = $('#locationGrid').dataTable().fnSettings().fnRecordsTotal();
				this.jsonFilter = filterValues;
				this.jsonFilter = ({
					"start": 0,
					"limit": total,
					"exportData": "Vision",
					"exportType": exportType,
					"exportDate": moment().format('YYYY_MM_DD_HH_mm_ss')
				});
				VisionfilterValues = $.extend(VisionfilterValues, this.jsonFilter);
				delete VisionfilterValues.columns;
				delete VisionfilterValues.draw;
				var formElem = this.formElem;
				var hiddenField = this.hiddenField;
				if (!formElem) {
					var formElem = document.createElement("form");
					formElem.target = "_blank";
					formElem.method = "POST"; // or "post" if appropriate
					formElem.action = coolerDashboard.common.nodeUrl('exportData', {});
					hiddenField = document.createElement("input");
					hiddenField.type = "hidden";
					hiddenField.name = "params";
					hiddenField.value = JSON.stringify(VisionfilterValues);

					formElem.appendChild(hiddenField);
					this.formElem = formElem;
					this.hiddenField = hiddenField;
					document.body.appendChild(formElem);
				} else {
					this.hiddenField.value = JSON.stringify(VisionfilterValues);
					this.formElem.action = coolerDashboard.common.nodeUrl('exportData', {});
				}
				formElem.submit();
			} else if (activeTab == "Recognition Report") {

				//LocationfilterValues.isFromOutlet = false;
				var total = $('#recognitionReportGrid').dataTable().fnSettings().fnRecordsTotal();
				//filterValues["length"] = $('#locationGrid').dataTable().fnSettings().fnRecordsTotal();
				//filterValues["limit"] = $('#locationGrid').dataTable().fnSettings().fnRecordsTotal();
				this.jsonFilter = filterValues;
				this.jsonFilter = ({
					"start": 0,
					"limit": total,
					"exportData": "Recognition Report",
					"exportType": exportType,
					"exportDate": moment().format('YYYY_MM_DD_HH_mm_ss')
				});

				RecognitionfilterValues = $.extend(RecognitionfilterValues, this.jsonFilter);
				delete RecognitionfilterValues.columns;
				delete RecognitionfilterValues.draw;
				var formElem = this.formElem;
				var hiddenField = this.hiddenField;
				if (!formElem) {
					var formElem = document.createElement("form");
					formElem.target = "_blank";
					formElem.method = "POST"; // or "post" if appropriate
					formElem.action = coolerDashboard.common.nodeUrl('exportData', {});
					hiddenField = document.createElement("input");
					hiddenField.type = "hidden";
					hiddenField.name = "params";
					hiddenField.value = JSON.stringify(RecognitionfilterValues);

					formElem.appendChild(hiddenField);
					this.formElem = formElem;
					this.hiddenField = hiddenField;
					document.body.appendChild(formElem);
				} else {
					this.hiddenField.value = JSON.stringify(RecognitionfilterValues);
					this.formElem.action = coolerDashboard.common.nodeUrl('exportData', {});
				}
				formElem.submit();
			}

		}
		var assetIcons = {
			noIcon: "img/blank.gif",
			missing: "img/missing.png",
			power: "img/power.png",
			isSmart: "img/smart.png",
			health: "img/health.png"
		};
		$('#assetGrid thead tr td').each(function () {
			var title = $(this).text();
			if (title != "") {
				if (title === "Code") {
					$(this).html('<input type="text" class="form-control" placeholder="Search ' + title +
						'" style="width:8em"/>');
				} else {
					$(this).html('<input type="text" class="form-control" placeholder="Search ' + title + '" />');
				}
				attachFilterListener(this.id);
			}
		});
		onAlertIconClick = function (assetId) {
			var assetTab = $('#s2');
			var alertTab = $('#s3');
			var tabPanel = $('#myTab');

			$(tabPanel.children()[0]).removeClass('active'); //Hide asset grid;
			$(tabPanel.children()[1]).addClass('active'); //show alert grid;
			assetTab.removeClass('active in');
			alertTab.addClass('active in');
			alertTab.show();
			$("#alertGrid").DataTable().ajax.url("alert/list?AssetId=" + assetId + "");
			$("#alertGrid").DataTable().ajax.reload();
		};
		$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
			var target = $(e.target).attr("href") // activated tab
			if (target == "#s3") {
				$("#alertGrid").DataTable().ajax.url("alert/list");
				$("#alertGrid").DataTable().ajax.reload();
			} else if (target == "#s4") {
				$("#visitGrid").DataTable().ajax.reload();
			}

			if (target == "#s6") {
				$("#recognitionreportrangeVerifiedOn").removeClass('hidden');
			} else {
				$("#recognitionreportrangeVerifiedOn").addClass('hidden');
			}

			var text = $('#myTab').children().find('a[href= ' + target + ']').prop('innerText');
			$(".breadcrumb").html("<li> Detailed view </li><li>" + text + "</li>");
		});

		var assetTable = $('#assetGrid')
			.dataTable({
				ajax: {
					url: coolerDashboard.common.nodeUrl('asset/list', $this.jsonFilter),
					method: 'POST',
					data: function (data, settings) {
						var searchFilters = $(".filterable");
						for (var i = 0, len = searchFilters.length; i < len; i++) {
							var searchElement = searchFilters[i];
							if (searchElement.dataset.grid == "assetGrid") {
								var value = $(searchElement.childNodes[0]).val();
								if (value) {
									data['search_' + searchElement.dataset.column] = value;
								}
							}
						}
						if (filterValues.AlertTypeId || filterValues.PriorityId || filterValues.StatusId || filterValues[
								"AlertTypeId[]"] || filterValues["PriorityId[]"] || filterValues["StatusId[]"]) {
							filterValues["startDateAlert"] = filterValues.startDate;
							filterValues["endDateAlert"] = filterValues.endDate;
							filterValues["fromOutletScreenAlert"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekAlert"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekAlert"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterAlert"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthAlert"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (filterValues.DisplacementFilter || filterValues.DisplacementFilter || filterValues.Displacement_To ||
							filterValues.Displacement_From || filterValues["Displacement_To[]"] ||
							filterValues["Displacement_From[]"]) {
							filterValues["startDateMovement"] = filterValues.startDate;
							filterValues["endDateMovement"] = filterValues.endDate;
							filterValues["fromMovementScreen"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekMovement"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekMovement"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterMovement"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthMovement"] = filterValues.month || filterValues["month[]"];
							}
						}
						if (filterValues.DoorCount || filterValues["DoorCount[]"]) {
							filterValues["startDateDoor"] = filterValues.startDate;
							filterValues["endDateDoor"] = filterValues.endDate;
							filterValues["fromDoorScreen"] = true;
							filterValues["customQueryDoor"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekDoor"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekDoor"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterDoor"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthDoor"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (filterValues.TempBand || filterValues["TempBand[]"]) {
							filterValues["startDateHealth"] = filterValues.startDate;
							filterValues["endDateHealth"] = filterValues.endDate;
							filterValues["fromHealthScreen"] = true;
							filterValues["customQueryHealth"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekHealth"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekHealth"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterHealth"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthHealth"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (filterValues.LightStatus || filterValues["LightStatus[]"]) {
							filterValues["startDateLight"] = filterValues.startDate;
							filterValues["endDateLight"] = filterValues.endDate;
							filterValues["fromLightScreen"] = true;
							filterValues["LightStatusBand"] = filterValues.LightStatus || filterValues["LightStatus[]"];
							filterValues["customQueryLight"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekLight"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekLight"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterLight"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthLight"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (filterValues.PowerStatus || filterValues["PowerStatus[]"]) {
							filterValues["startDatePower"] = filterValues.startDate;
							filterValues["endDatePower"] = filterValues.endDate;
							filterValues["fromPowerScreen"] = true;
							filterValues["PowerBand"] = filterValues.PowerStatus || filterValues["PowerStatus[]"];
							filterValues["customQueryPower"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekPower"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekPower"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterPower"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthPower"] = filterValues.month || filterValues["month[]"];
							}
						}

						filterValues["isFromGrid"] = true;

						AssetfilterValues = $.extend(data, filterValues);
						return $.extend(data, filterValues);
					}
				},
				order: [
					[4, "asc"]
				],
				processing: true,
				serverSide: true,
				"deferLoading": 0,
				columns: [{
						"className": 'details-control',
						"orderable": false,
						"data": '',
						"defaultContent": '',
						width: 10
					}, {
						data: 'Alert_Highest_AlertTypeId',
						"orderable": false,
						className: 'alert-icons alert-icons-location',
						render: locationIconsRenderer,
						width: 60

					}, {
						data: 'SerialNumber',
						width: 130,
						className: 'inline-link',
						"orderable": true
					}, {
						data: 'LocationCode',
						width: 110,
						className: 'inline-link',
						"orderable": false
					}, {
						data: 'Location',
						className: 'inline-link',
						"orderable": false
					}, {
						data: 'LatestScanTime',
						width: 160,
						render: function (data, type, row) {
							if (!data) {
								return;
							}
							if (data === coolerDashboard.common.emptyDate) {
								return "N/A";
							}
							var status = common.createBlock(row.AssetCurrentStatus, !!row.AssetCurrentStatus, ["Wrong Location",
								"Missing"
							].indexOf(row.AssetCurrentStatus) > -1 ? 'red' : 'blue');
							return renderers.humanizeDurationRenderer(data, "N/A") + " " + status;
						},
						"orderable": true
					}, {
						data: 'Displacement',
						width: 80,
						className: 'dt-body-right',
						render: function (data, type, row) {
							if (typeof data !== 'number') {
								return data;
							}
							return common.createBlock(row.LatestGpsId == 0 ? 'N/A' : (data.toFixed(2) > 0.499 || data.toFixed(2) < -0.5) ? (data.toFixed(2) >
								2 ? data.toFixed(0) + "km" : data.toFixed(2) + "km") : "Ok", data.toFixed(2) > 0.499 || data < -0.5, "red");
						},
						"orderable": true
					}, {
						data: 'Door_30dayCount',
						width: 180,
						render: function (data, type, row) {
							return row["Door_TodayCount"] + " <span class='lighter'>today</span>, " + row["Door_7dayCount"] +
								" <span class='lighter'>7d</span>, " + row["Door_30dayCount"] + " <span class='lighter'>30d</span> ";
						},
						"orderable": false
					}, {
						data: 'LightIntensity',
						className: 'dt-body-right',
						width: 40,
						render: renderers.light,
						"orderable": true
					}, {
						data: 'Temperature',
						render: renderers.temperature,
						className: 'dt-body-right',
						width: 85,
						"orderable": true
					}, {
						data: 'PurityIssue',
						render: renderers.purityStatus,
						width: 50,
						"orderable": false
					}, {
						data: 'TotalImpureCoolers',
						className: 'dt-body-right',
						"orderable": false,
						render: function (data, type, row) {
							return row["isPurityRecord"] ? data : 'N/A';
						}
					}, {
						data: 'TotalEmptyFacings',
						width: 50,
						"orderable": false,
						render: function (data, type, row) {
							return row.TotalEmptyFacings != 0 ? row.TotalEmptyFacings : 'N/A'
						}
					},
					//{ data: 'AssetLastPing' },
					//{
					//	data: 'SmartDeviceSerialNumber',
					//	width: 90,
					//	render: function (data, type, row) {
					//		return gridUtils.joinStrings("<br />", row.SmartDeviceSerialNumber, row.GatewaySerialNumber);
					//	}
					//},
					{
						data: 'TotalSkuOOS',
						className: 'dt-body-right',
						"orderable": false,
						render: function (data, type, row) {
							return row["isPurityRecord"] ? data : 'N/A';
						}
					}
				],
				"sScrollX": true,
				"sDom": "" + "t" +
					"<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
				"autoWidth": true,
				"preDrawCallback": function () {
					// Initialize the responsive datatables helper once.
					if (!responsiveHelper_dt_Asset) {
						responsiveHelper_dt_Asset = new ResponsiveDatatablesHelper($('#assetGrid'), breakpointDefinition);
					}
				},
				"rowCallback": function (nRow) {
					responsiveHelper_dt_Asset.createExpandIcon(nRow);
				},
				"drawCallback": function (oSettings) {
					responsiveHelper_dt_Asset.respond();
				}
			});

		gridUtils.addChildGridHandler({
			gridId: '#assetGrid',
			renderer: function (d) {
				return gridUtils.createDetailTable({
					items: [{
						label: 'Asset Type',
						value: gridUtils.joinStrings(d.AssetType)
					}, {
						label: 'Outlet Code',
						value: gridUtils.joinStrings(d.LocationCode)
					}, {
						label: 'Outlet Name',
						value: gridUtils.joinStrings(d.Location)
					}, {
						label: 'Address',
						value: gridUtils.joinStrings(' ', d.Street, d.Street2, d.Street3)
					}, {
						label: 'City',
						value: gridUtils.joinStrings(d.City)
					}, {
						label: 'State',
						value: gridUtils.joinStrings(d.State)
					}, {
						label: 'Country',
						value: gridUtils.joinStrings(d.Country)
					}, {
						label: 'Market',
						value: gridUtils.joinStrings(d.MarketName)
					}, {
						label: 'Channel',
						value: gridUtils.joinStrings(d.LocationType)
					}, {
						label: 'Classification',
						value: gridUtils.joinStrings(d.Classification)
					}, {
						label: 'Territory',
						value: gridUtils.joinStrings(d.SalesTerritory)
					}]
				});
			}
		});

		$('#visitGrid thead tr td').each(function () {

			var title = $(this).text();
			if (title != "") {
				$(this).html('<input type="text" class="form-control" placeholder="Search ' + title.replace(/\s/g, '') + '" />');
				attachFilterListener(this.id);
			}
		});

		var visitTable = $('#visitGrid')
			.dataTable({
				ajax: {
					url: coolerDashboard.common.nodeUrl('visit/list', $this.jsonFilter),
					method: 'POST',
					data: function (data, settings) {
						var searchFilters = $(".filterable");
						for (var i = 0, len = searchFilters.length; i < len; i++) {
							var searchElement = searchFilters[i];
							if (searchElement.dataset.grid == "visitGrid") {
								var value = $(searchElement.childNodes[0]).val();
								if (value) {
									data['search_' + searchElement.dataset.column] = value;
								}
							}
						}
						if (filterValues.AlertTypeId || filterValues.PriorityId || filterValues.StatusId || filterValues[
								"AlertTypeId[]"] || filterValues["PriorityId[]"] || filterValues["StatusId[]"]) {
							filterValues["startDateAlert"] = filterValues.startDate;
							filterValues["endDateAlert"] = filterValues.endDate;
							filterValues["fromOutletScreenAlert"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekAlert"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekAlert"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterAlert"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthAlert"] = filterValues.month || filterValues["month[]"];
							}
						}


						if (filterValues.DisplacementFilter || filterValues.DisplacementFilter || filterValues.Displacement_To ||
							filterValues.Displacement_From || filterValues["Displacement_To[]"] ||
							filterValues["Displacement_From[]"]) {
							filterValues["startDateMovement"] = filterValues.startDate;
							filterValues["endDateMovement"] = filterValues.endDate;
							filterValues["fromMovementScreen"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekMovement"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekMovement"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterMovement"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthMovement"] = filterValues.month || filterValues["month[]"];
							}
						}
						if (filterValues.DoorCount || filterValues["DoorCount[]"]) {
							filterValues["startDateDoor"] = filterValues.startDate;
							filterValues["endDateDoor"] = filterValues.endDate;
							filterValues["fromDoorScreen"] = true;
							filterValues["customQueryDoor"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekDoor"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekDoor"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterDoor"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthDoor"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (filterValues.TempBand || filterValues["TempBand[]"]) {
							filterValues["startDateHealth"] = filterValues.startDate;
							filterValues["endDateHealth"] = filterValues.endDate;
							filterValues["fromHealthScreen"] = true;
							filterValues["customQueryHealth"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekHealth"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekHealth"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterHealth"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthHealth"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (filterValues.LightStatus || filterValues["LightStatus[]"]) {
							filterValues["startDateLight"] = filterValues.startDate;
							filterValues["endDateLight"] = filterValues.endDate;
							filterValues["fromLightScreen"] = true;
							filterValues["LightStatusBand"] = filterValues.LightStatus || filterValues["LightStatus[]"];
							filterValues["customQueryLight"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekLight"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekLight"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterLight"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthLight"] = filterValues.month || filterValues["month[]"];
							}
						}

						if (filterValues.PowerStatus || filterValues["PowerStatus[]"]) {
							filterValues["startDatePower"] = filterValues.startDate;
							filterValues["endDatePower"] = filterValues.endDate;
							filterValues["fromPowerScreen"] = true;
							filterValues["PowerBand"] = filterValues.PowerStatus || filterValues["PowerStatus[]"];
							filterValues["customQueryPower"] = true;
							if (filterValues.dayOfWeek || filterValues["dayOfWeek[]"]) {
								filterValues["dayOfWeekPower"] = filterValues.dayOfWeek || filterValues["dayOfWeek[]"];
							}
							if (filterValues.yearWeek || filterValues["yearWeek[]"]) {
								filterValues["yearWeekPower"] = filterValues.yearWeek || filterValues["yearWeek[]"];
							}
							if (filterValues.quarter || filterValues["quarter[]"]) {
								filterValues["quarterPower"] = filterValues.quarter || filterValues["quarter[]"];
							}
							if (filterValues.month || filterValues["month[]"]) {
								filterValues["monthPower"] = filterValues.month || filterValues["month[]"];
							}
						}
						data["fromOutletScreen"] = true;
						filterValues["isFromGrid"] = true;
						return $.extend(data, filterValues);
					}
				},
				order: [
					[3, "desc"]
				],
				processing: true,
				serverSide: true,
				"deferLoading": 0,
				columns: [{
						"className": 'details-control',
						"orderable": false,
						"data": null,
						"defaultContent": '',
						width: 10
					}, {
						data: 'LocationCode',
						width: 100,
						className: 'inline-link'
					}, {
						data: 'LocationName',
						className: 'inline-link'
					}, {
						data: 'StartTime',
						render: coolerDashboard.common.dateTime,
						width: 160
					}, {
						data: 'StopTime',
						render: function (data, type, row) {
							return coolerDashboard.common.dateDiff(coolerDashboard.common.parseDate(row.StopTime), coolerDashboard
								.common
								.parseDate(row.StartTime))
						},
						width: 160
					}, {
						data: 'VisitBy'
					}, {
						data: 'Missing',
						orderable: false,
						render: function (data, type, row) {
							return row.Found + " <span class='smaller'>Found</span>, " +
								common.createBlock(row.Missing, row.Missing > 0, "red") + " <span class='smaller'>Missing</span>, " +
								common.createBlock(row.WrongLocation, row.WrongLocation > 0, "Green") +
								" <span class='smaller'>Wrong</span>";
						},
						width: 170
					}, {
						data: 'Distance',
						width: 160,
						"orderable": false,
						render: function (data, type, row) {
							return row.Distance && row.Distance != "" && typeof (row.Distance) != "object" ? row.Distance.toFixed(
									2) +
								" KM" : "";
						}
					}

				],
				"sScrollX": true,
				"sDom": "" + "t" +
					"<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
				"autoWidth": true,
				"preDrawCallback": function () {
					// Initialize the responsive datatables helper once.
					if (!responsiveHelper_dt_Visit) {
						responsiveHelper_dt_Visit = new ResponsiveDatatablesHelper($('#visitGrid'), breakpointDefinition);
					}
				},
				"rowCallback": function (nRow) {
					responsiveHelper_dt_Visit.createExpandIcon(nRow);
				},
				"drawCallback": function (oSettings) {
					responsiveHelper_dt_Visit.respond();
				}

			});

		gridUtils.addChildGridHandler({
			gridId: '#visitGrid',
			renderer: function (d) {
				return gridUtils.createDetailTableForVisit({
					items: [{
						label: 'Outlet Code',
						value: d
					}]
				});
			}
		});

		$('#assetGrid').on('click', 'tbody td.inline-link', function (e) {
			var dt = assetTable.DataTable();
			var rowIndex = dt.row(this)[0][0];
			if (rowIndex < 0) {
				return;
			}
			var data = dt.data();
			var column = dt.columns($(this).index()).header()[0].innerText;
			//var gridId = e.delegateTarget.id;
			var rowData = data[rowIndex];
			if (column == 'Purity Status') {
				var serialNumber = rowData.SerialNumber;
				serialNumber = serialNumber.toLowerCase();
				//window.location.hash = 'assetDetails/' + serialNumber;
				window.open(window.location.pathname + '#assetDetails/' + serialNumber);
			} else if (column == "Outlet") {
				var locationCode = rowData.LocationCode;
				locationCode = locationCode.toLowerCase();
				//window.location.hash = 'outletDetails/' + locationCode;
				window.open(window.location.pathname + '#outletDetails/' + locationCode);
			} else if (column == "Outlet Code") {
				var locationCode = rowData.LocationCode;
				locationCode = locationCode.toLowerCase();
				//window.location.hash = 'outletDetails/' + locationCode;
				window.open(window.location.pathname + '#outletDetails/' + locationCode);
			} else {
				var serialNumber = rowData.SerialNumber;
				serialNumber = serialNumber.toLowerCase();
				//window.location.hash = 'assetDetails/' + serialNumber;
				window.open(window.location.pathname + '#assetDetails/' + serialNumber);
			}
		});

		$('#alertGrid').on('click', 'tbody td.inline-link', function (e) {
			var dt = alertTable.DataTable();
			var rowIndex = dt.row(this)[0][0];
			if (rowIndex < 0) {
				return;
			}
			var data = dt.data();
			var column = dt.columns($(this).index()).header()[0].innerText;
			//var gridId = e.delegateTarget.id;
			var rowData = data[rowIndex];
			if (column == "Outlet") {
				var locationCode = rowData.LocationCode;
				locationCode = locationCode.toLowerCase();
				//window.location.hash = 'outletDetails/' + locationCode;
				window.open(window.location.pathname + '#outletDetails/' + locationCode);
			} else if (column == "Outlet Code") {
				var locationCode = rowData.LocationCode;
				locationCode = locationCode.toLowerCase();
				//window.location.hash = 'outletDetails/' + locationCode;
				window.open(window.location.pathname + '#outletDetails/' + locationCode);
			} else {
				var serialNumber = rowData.AssetSerialNumber;
				serialNumber = serialNumber.toLowerCase();
				//window.location.hash = 'assetDetails/' + serialNumber;
				window.open(window.location.pathname + '#assetDetails/' + serialNumber);
			}

		});

		$('#visitGrid').on('click', 'tbody td.inline-link', function (e) {
			var dt = visitTable.DataTable();
			var rowIndex = dt.row(this)[0][0];
			if (rowIndex < 0) {
				return;
			}
			var data = dt.data();
			var column = dt.columns($(this).index()).header()[0].innerText;
			//var gridId = e.delegateTarget.id;
			var rowData = data[rowIndex];
			if (column == "Outlet") {
				var locationCode = rowData.LocationCode;
				locationCode = locationCode.toLowerCase();
				//window.location.hash = 'outletDetails/' + locationCode;
				window.open(window.location.pathname + '#outletDetails/' + locationCode);

			} else if (column == "Outlet Code") {
				var locationCode = rowData.LocationCode;
				locationCode = locationCode.toLowerCase();
				//window.location.hash = 'outletDetails/' + locationCode;
				window.open(window.location.pathname + '#outletDetails/' + locationCode);
			}

		});

		$('#planogramGrid').on('click', 'tbody td.inline-link', function (e) {
			var dt = planogramTable.DataTable();
			var rowIndex = dt.row(this)[0][0];
			if (rowIndex < 0) {
				return;
			}
			var data = dt.data();
			var column = dt.columns($(this).index()).header()[0].innerText;
			//var gridId = e.delegateTarget.id;
			var rowData = data[rowIndex];
			if (column == "Outlet Code/Name") {
				var locationCode = rowData.LocationCode;
				locationCode = locationCode.toLowerCase();
				//window.location.hash = 'outletDetails/' + locationCode;
				window.open(window.location.pathname + '#outletDetails/' + locationCode);
			}

		});

		$('#recognitionReportGrid').on('click', 'tbody td.inline-link', function (e) {
			var dt = recognitionReportTable.DataTable();
			var rowIndex = dt.row(this)[0][0];
			if (rowIndex < 0) {
				return;
			}
			var data = dt.data();
			var column = dt.columns($(this).index()).header()[0].innerText;
			//var gridId = e.delegateTarget.id;
			var rowData = data[rowIndex];
			if (column == "Outlet") {
				var locationCode = rowData.OutletCode;
				locationCode = locationCode.toLowerCase();
				//window.location.hash = 'outletDetails/' + locationCode;
				window.open(window.location.pathname + '#outletDetails/' + locationCode);
			} else if (column == "Outlet Code") {
				var locationCode = rowData.OutletCode;
				locationCode = locationCode.toLowerCase();
				//window.location.hash = 'outletDetails/' + locationCode;
				window.open(window.location.pathname + '#outletDetails/' + locationCode);
			}
		});


		$('#locationGrid').on('click', 'tbody td.inline-link', function (e) {
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


		$("#alertStatusCheck").click(function () {
			$('#alertGrid').DataTable().ajax.reload();
		});

		$('#filterForm2').submit(function (e) {
			// todo: validation
			var data = $(this).serializeArray();
			filterValues = {};
			console.log(data);
			$.map(data, function (row) {
				if (typeof filterValues[row.name] === 'undefined') {
					filterValues[row.name] = row.value;
				} else if (typeof filterValues[row.name] === 'object') {
					filterValues[row.name].push(row.value);
				} else {
					filterValues[row.name] = [filterValues[row.name], row.value];
				}
			});
			console.log(filterValues);
			initialize(filterValues);
			e.preventDefault();
			refresh();
		});

		$("#filterSubmit").on('click', function () {
			$("#filterForm2").submit();
		});
		$("#filterReset").on('click', function () {
			var myForm = $("#filterForm2").get(0);
			myForm.reset();
			$("select", myForm).each(
				function () {
					$(this).select2('val', $(this).find('option:selected').val());
				}
			);
			$("#filterForm2").submit();
		});



		// attached the keyup event in the search box
		function attachFilterListener(elementId) {
			//$('#' + elementId + ' input').keyup(function (e) {
			//	/* Ignore tab key */
			//	var code = e.keyCode || e.which;
			//	if (code == '9') return;
			//	var parentElement = this.parentElement;
			//	var grid = parentElement.dataset.grid;
			//	$('#' + grid).DataTable().ajax.reload();
			//});

			$('#' + elementId + ' input').typeWatch({
				captureLength: 1,
				callback: function (value) {
					var parentElement = this.parentElement;
					var grid = parentElement.dataset.grid;
					$('#' + grid).DataTable().ajax.reload();
				}
			});
		}

		var hash = location.hash.split('#')[2];
		if (hash) {
			var tab = $('#myTab').children().find('a[href= "#' + hash + '"]');
			if (tab.length > 0) {
				var text = tab.prop('innerText');
				$(".breadcrumb").html("<li> Detailed view </li><li>" + text + "</li>");
				$('#myTab').children().removeClass("active");
				tab.parent().addClass('active');
				$('#myTabContent').children().removeClass("active in");
				$('#' + hash).addClass('active in');
				$('#' + hash).show();
			}
		}

	}
});