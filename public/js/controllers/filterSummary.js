$(function () {

	/* Current Applied Filter */
	var LocationfilterValues = {};
	var AssetfilterValues = {};
	var activeGrid = "Outlet";
	var isLoaded = false;
	var gridUtils = coolerDashboard.gridUtils;
	//coolerDashboard.common.setFilter();		
	var responsiveHelper_dt_basic = undefined;
	var responsiveHelper_dt_Alert = undefined;
	var responsiveHelper_dt_Asset = undefined;
	var responsiveHelper_dt_Visit = undefined;
	var responsiveHelper_dt_Planogram = undefined;
	var breakpointDefinition = {
		tablet: 1024,
		phone: 480
	};
	var icons = {
		noIcon: "img/blank.gif",
		//isSmart: "img/smart.png",		
		isKeyLocation: "img/keylocation.png"
	};
	var common = coolerDashboard.common,
		renderers = coolerDashboard.renderers;
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
	coolerDashboard.common.dataTableNumbers

	$.fn.DataTable.ext.pager.numbers_length = 5;

	gridUtils.addChildGridHandler({
		gridId: '#locationGridFilter',
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
	$('#locationGridFilter').dataTable({
		"bDestroy": true
	}).fnDestroy();
	$('#assetGridFilter').dataTable({
		"bDestroy": true
	}).fnDestroy();
	if (!$.fn.dataTable.isDataTable('#locationGridFilter')) {


		var locationTable = $('#locationGridFilter');

		if (locationTable) {
			locationTable.dataTable({
				ajax: {
					//url: coolerDashboard.common.nodeUrl('outlet/list',{}),		
					url: coolerDashboard.common.nodeUrl('locationeventdatasumm/list', $this.jsonFilter),
					method: 'POST',
					destroy: true,
					data: function (data, settings) {
						var searchFilters = $(".filterable");
						for (var i = 0, len = searchFilters.length; i < len; i++) {
							var searchElement = searchFilters[i];
							if (searchElement.dataset.grid == "locationGridFilter") {
								var value = $(searchElement.childNodes[0]).val();
								if (value) {
									data['search_' + searchElement.dataset.column] = value;
								}
							}
						}
						if (jsonFilter.AlertTypeId || jsonFilter.PriorityId || jsonFilter.StatusId || jsonFilter["AlertTypeId[]"] || jsonFilter["PriorityId[]"] || jsonFilter["StatusId[]"]) {
							jsonFilter["startDateAlert"] = jsonFilter.startDate;
							jsonFilter["endDateAlert"] = jsonFilter.endDate;
							jsonFilter["fromOutletScreenAlert"] = true;
							if (jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"]) {
								jsonFilter["dayOfWeekAlert"] = jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"];
							}
							if (jsonFilter.yearWeek || jsonFilter["yearWeek[]"]) {
								jsonFilter["yearWeekAlert"] = jsonFilter.yearWeek || jsonFilter["yearWeek[]"];
							}
							if (jsonFilter.quarter || jsonFilter["quarter[]"]) {
								jsonFilter["quarterAlert"] = jsonFilter.quarter || jsonFilter["quarter[]"];
							}
							if (jsonFilter.month || jsonFilter["month[]"]) {
								jsonFilter["monthAlert"] = jsonFilter.month || jsonFilter["month[]"];
							}
						}


						if (jsonFilter.DisplacementFilter) {
							jsonFilter["startDateMovement"] = jsonFilter.startDate;
							jsonFilter["endDateMovement"] = jsonFilter.endDate;
							jsonFilter["fromMovementScreen"] = true;
							if (jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"]) {
								jsonFilter["dayOfWeekMovement"] = jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"];
							}
							if (jsonFilter.yearWeek || jsonFilter["yearWeek[]"]) {
								jsonFilter["yearWeekMovement"] = jsonFilter.yearWeek || jsonFilter["yearWeek[]"];
							}
							if (jsonFilter.quarter || jsonFilter["quarter[]"]) {
								jsonFilter["quarterMovement"] = jsonFilter.quarter || jsonFilter["quarter[]"];
							}
							if (jsonFilter.month || jsonFilter["month[]"]) {
								jsonFilter["monthMovement"] = jsonFilter.month || jsonFilter["month[]"];
							}
						}
						if (jsonFilter.DoorCount || jsonFilter["DoorCount[]"]) {
							jsonFilter["startDateDoor"] = jsonFilter.startDate;
							jsonFilter["endDateDoor"] = jsonFilter.endDate;
							jsonFilter["fromDoorScreen"] = true;
							jsonFilter["customQueryDoor"] = true;
							if (jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"]) {
								jsonFilter["dayOfWeekDoor"] = jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"];
							}
							if (jsonFilter.yearWeek || jsonFilter["yearWeek[]"]) {
								jsonFilter["yearWeekDoor"] = jsonFilter.yearWeek || jsonFilter["yearWeek[]"];
							}
							if (jsonFilter.quarter || jsonFilter["quarter[]"]) {
								jsonFilter["quarterDoor"] = jsonFilter.quarter || jsonFilter["quarter[]"];
							}
							if (jsonFilter.month || jsonFilter["month[]"]) {
								jsonFilter["monthDoor"] = jsonFilter.month || jsonFilter["month[]"];
							}
						}

						if (jsonFilter.TempBand || jsonFilter["TempBand[]"]) {
							jsonFilter["startDateHealth"] = jsonFilter.startDate;
							jsonFilter["endDateHealth"] = jsonFilter.endDate;
							jsonFilter["fromHealthScreen"] = true;
							jsonFilter["customQueryHealth"] = true;
							if (jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"]) {
								jsonFilter["dayOfWeekHealth"] = jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"];
							}
							if (jsonFilter.yearWeek || jsonFilter["yearWeek[]"]) {
								jsonFilter["yearWeekHealth"] = jsonFilter.yearWeek || jsonFilter["yearWeek[]"];
							}
							if (jsonFilter.quarter || jsonFilter["quarter[]"]) {
								jsonFilter["quarterHealth"] = jsonFilter.quarter || jsonFilter["quarter[]"];
							}
							if (jsonFilter.month || jsonFilter["month[]"]) {
								jsonFilter["monthHealth"] = jsonFilter.month || jsonFilter["month[]"];
							}
						}

						if (jsonFilter.LightStatus || jsonFilter["LightStatus[]"]) {
							jsonFilter["startDateLight"] = jsonFilter.startDate;
							jsonFilter["endDateLight"] = jsonFilter.endDate;
							jsonFilter["fromLightScreen"] = true;
							jsonFilter["LightStatusBand"] = jsonFilter.LightStatus || jsonFilter["LightStatus[]"];
							jsonFilter["customQueryLight"] = true;
							if (jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"]) {
								jsonFilter["dayOfWeekLight"] = jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"];
							}
							if (jsonFilter.yearWeek || jsonFilter["yearWeek[]"]) {
								jsonFilter["yearWeekLight"] = jsonFilter.yearWeek || jsonFilter["yearWeek[]"];
							}
							if (jsonFilter.quarter || jsonFilter["quarter[]"]) {
								jsonFilter["quarterLight"] = jsonFilter.quarter || jsonFilter["quarter[]"];
							}
							if (jsonFilter.month || jsonFilter["month[]"]) {
								jsonFilter["monthLight"] = jsonFilter.month || jsonFilter["month[]"];
							}
						}

						if (jsonFilter.PowerStatus || jsonFilter["PowerStatus[]"]) {
							jsonFilter["startDatePower"] = jsonFilter.startDate;
							jsonFilter["endDatePower"] = jsonFilter.endDate;
							jsonFilter["fromPowerScreen"] = true;
							jsonFilter["PowerBand"] = jsonFilter.PowerStatus || jsonFilter["PowerStatus[]"];
							jsonFilter["customQueryPower"] = true;
							if (jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"]) {
								jsonFilter["dayOfWeekPower"] = jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"];
							}
							if (jsonFilter.yearWeek || jsonFilter["yearWeek[]"]) {
								jsonFilter["yearWeekPower"] = jsonFilter.yearWeek || jsonFilter["yearWeek[]"];
							}
							if (jsonFilter.quarter || jsonFilter["quarter[]"]) {
								jsonFilter["quarterPower"] = jsonFilter.quarter || jsonFilter["quarter[]"];
							}
							if (jsonFilter.month || jsonFilter["month[]"]) {
								jsonFilter["monthPower"] = jsonFilter.month || jsonFilter["month[]"];
							}
						}
						if (jsonFilter.coolerTracking || jsonFilter["coolerTracking[]"]) {
							jsonFilter["customQueryCoolerTracking"] = true;
							jsonFilter["CoolerTrackingThreshold"] = Number(JSON.parse(LZString.decompressFromUTF16(localStorage.data)).data.tags.CoolerTrackingThreshold);
							jsonFilter["CoolerTrackingDisplacementThreshold"] = Number(JSON.parse(LZString.decompressFromUTF16(localStorage.data)).data.tags.CoolerTrackingDisplacementThreshold);
						}

						jsonFilter["isFromGrid"] = true;


						LocationfilterValues = $.extend(data, jsonFilter);
						return $.extend(data, jsonFilter);
					}
				},
				order: [],
				"columnDefs": [{
					"orderable": false,
					"targets": 0
				}],
				processing: true,
				serverSide: true,
				"deferLoading": 0,
				"bLengthChange": false,
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
						"orderable": false
					}, {
						data: 'Name',
						className: 'inline-link',
						"orderable": false
					}, {
						data: 'SalesTerritory',
						"orderable": false
					}, {
						data: 'City',
						"orderable": false
					},
					// { data: 'MarketName' },
					// { data: 'LocationType' },
					// { data: 'Classification' },
					// {
					// 	data: 'AssetCount', className: 'dt-body-right', "orderable": false,
					// 	render: function (data, type, row) {
					// 		return row.SmartAssetCount + "/" + data;
					// 	}
					// },
					// {
					// 	data: 'Door_30dayCount',
					// 	"orderable": false,
					// 	render: function (data, type, row) {
					// 		return row["Door_TodayCount"] + " <span class='lighter'>today</span>, " + row["Door_7dayCount"] + " <span class='lighter'>7d</span>, " + row["Door_30dayCount"] + " <span class='lighter'>30d</span> ";
					// 	}
					// },
					// {
					// 	data: 'TotalImpureCoolers', className: 'dt-body-right', "orderable": false,
					// 	render: function (data, type, row) {
					// 		return row["isPurityRecord"] ? data : 'N/A';
					// 	}
					// },
					// {
					// 	data: 'TotalEmptyFacings', className: 'dt-body-right', "orderable": false,
					// 	render: function (data, type, row) {
					// 		return row["isPurityRecord"] ? data : 'N/A';
					// 	}
					// },
					// {
					// 	data: 'TotalSkuOOS', className: 'dt-body-right', "orderable": false,
					// 	render: function (data, type, row) {
					// 		return row["isPurityRecord"] ? data : 'N/A';
					// 	}
					// }
				],
				"sScrollX": true,
				"sDom": "" + "t" + "<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
				"autoWidth": true,
				"preDrawCallback": function () {
					// Initialize the responsive datatables helper once.		
					if (!responsiveHelper_dt_basic) {
						responsiveHelper_dt_basic = new ResponsiveDatatablesHelper($('#locationGridFilter'), breakpointDefinition);
					}
				},
				"rowCallback": function (nRow) {
					responsiveHelper_dt_basic.createExpandIcon(nRow);
				},
				"drawCallback": function (oSettings) {
					responsiveHelper_dt_basic.respond();
				}
			});
		}
	}
	// function attachFilterListener(elementId)		
	// {		
	// 	$('#' + elementId + ' input').typeWatch({		
	// 		captureLength: 1,		
	// 		callback: function (value) {		
	// 			var parentElement = this.parentElement;		
	// 			var grid = parentElement.dataset.grid;		
	// 			$('#' + grid).DataTable().ajax.reload();		
	// 		}		
	// 	});		
	// }		
	$('#locationGridFilter').on('click', 'tbody td.inline-link', function (e) {
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
	var assetIcons = {
		noIcon: "img/blank.gif",
		missing: "img/missing.png",
		power: "img/power.png",
		isSmart: "img/smart.png",
		health: "img/health.png"
	};
	// $('#assetGrid thead tr td').each(function () {		
	// 	var title = $(this).text();		
	// 	if (title != "") {		
	// 		$(this).html('<input type="text" class="form-control" placeholder="Search ' + title + '" />');		
	// 		attachFilterListener(this.id);		
	// 	}		
	// });	
	if (!$.fn.dataTable.isDataTable('#example')) {



		var assetTable = $('#assetGridFilter');

		if (assetTable) {
			assetTable.dataTable({
				ajax: {
					url: coolerDashboard.common.nodeUrl('asseteventdatasumm/list', $this.jsonFilter),
					//url: coolerDashboard.common.nodeUrl('asset/list',{}),		
					method: 'POST',
					data: function (data, settings) {
						var searchFilters = $(".filterable");
						for (var i = 0, len = searchFilters.length; i < len; i++) {
							var searchElement = searchFilters[i];
							if (searchElement.dataset.grid == "assetGridFilter") {
								var value = $(searchElement.childNodes[0]).val();
								if (value) {
									data['search_' + searchElement.dataset.column] = value;
								}
							}
						}
						if (jsonFilter.AlertTypeId || jsonFilter.PriorityId || jsonFilter.StatusId || jsonFilter["AlertTypeId[]"] || jsonFilter["PriorityId[]"] || jsonFilter["StatusId[]"]) {
							jsonFilter["startDateAlert"] = jsonFilter.startDate;
							jsonFilter["endDateAlert"] = jsonFilter.endDate;
							jsonFilter["fromOutletScreenAlert"] = true;
							if (jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"]) {
								jsonFilter["dayOfWeekAlert"] = jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"];
							}
							if (jsonFilter.yearWeek || jsonFilter["yearWeek[]"]) {
								jsonFilter["yearWeekAlert"] = jsonFilter.yearWeek || jsonFilter["yearWeek[]"];
							}
							if (jsonFilter.quarter || jsonFilter["quarter[]"]) {
								jsonFilter["quarterAlert"] = jsonFilter.quarter || jsonFilter["quarter[]"];
							}
							if (jsonFilter.month || jsonFilter["month[]"]) {
								jsonFilter["monthAlert"] = jsonFilter.month || jsonFilter["month[]"];
							}
						}

						if (jsonFilter.DisplacementFilter || jsonFilter.DisplacementFilter || jsonFilter.Displacement_To || jsonFilter.Displacement_From || jsonFilter["Displacement_To[]"] || jsonFilter["Displacement_From[]"]) {
							jsonFilter["startDateMovement"] = jsonFilter.startDate;
							jsonFilter["endDateMovement"] = jsonFilter.endDate;
							jsonFilter["fromMovementScreen"] = true;
							if (jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"]) {
								jsonFilter["dayOfWeekMovement"] = jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"];
							}
							if (jsonFilter.yearWeek || jsonFilter["yearWeek[]"]) {
								jsonFilter["yearWeekMovement"] = jsonFilter.yearWeek || jsonFilter["yearWeek[]"];
							}
							if (jsonFilter.quarter || jsonFilter["quarter[]"]) {
								jsonFilter["quarterMovement"] = jsonFilter.quarter || jsonFilter["quarter[]"];
							}
							if (jsonFilter.month || jsonFilter["month[]"]) {
								jsonFilter["monthMovement"] = jsonFilter.month || jsonFilter["month[]"];
							}
						}
						if (jsonFilter.DoorCount || jsonFilter["DoorCount[]"]) {
							jsonFilter["startDateDoor"] = jsonFilter.startDate;
							jsonFilter["endDateDoor"] = jsonFilter.endDate;
							jsonFilter["fromDoorScreen"] = true;
							jsonFilter["customQueryDoor"] = true;
							if (jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"]) {
								jsonFilter["dayOfWeekDoor"] = jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"];
							}
							if (jsonFilter.yearWeek || jsonFilter["yearWeek[]"]) {
								jsonFilter["yearWeekDoor"] = jsonFilter.yearWeek || jsonFilter["yearWeek[]"];
							}
							if (jsonFilter.quarter || jsonFilter["quarter[]"]) {
								jsonFilter["quarterDoor"] = jsonFilter.quarter || jsonFilter["quarter[]"];
							}
							if (jsonFilter.month || jsonFilter["month[]"]) {
								jsonFilter["monthDoor"] = jsonFilter.month || jsonFilter["month[]"];
							}
						}

						if (jsonFilter.TempBand || jsonFilter["TempBand[]"]) {
							jsonFilter["startDateHealth"] = jsonFilter.startDate;
							jsonFilter["endDateHealth"] = jsonFilter.endDate;
							jsonFilter["fromHealthScreen"] = true;
							jsonFilter["customQueryHealth"] = true;
							if (jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"]) {
								jsonFilter["dayOfWeekHealth"] = jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"];
							}
							if (jsonFilter.yearWeek || jsonFilter["yearWeek[]"]) {
								jsonFilter["yearWeekHealth"] = jsonFilter.yearWeek || jsonFilter["yearWeek[]"];
							}
							if (jsonFilter.quarter || jsonFilter["quarter[]"]) {
								jsonFilter["quarterHealth"] = jsonFilter.quarter || jsonFilter["quarter[]"];
							}
							if (jsonFilter.month || jsonFilter["month[]"]) {
								jsonFilter["monthHealth"] = jsonFilter.month || jsonFilter["month[]"];
							}
						}

						if (jsonFilter.LightStatus || jsonFilter["LightStatus[]"]) {
							jsonFilter["startDateLight"] = jsonFilter.startDate;
							jsonFilter["endDateLight"] = jsonFilter.endDate;
							jsonFilter["fromLightScreen"] = true;
							jsonFilter["LightStatusBand"] = jsonFilter.LightStatus || jsonFilter["LightStatus[]"];
							jsonFilter["customQueryLight"] = true;
							if (jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"]) {
								jsonFilter["dayOfWeekLight"] = jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"];
							}
							if (jsonFilter.yearWeek || jsonFilter["yearWeek[]"]) {
								jsonFilter["yearWeekLight"] = jsonFilter.yearWeek || jsonFilter["yearWeek[]"];
							}
							if (jsonFilter.quarter || jsonFilter["quarter[]"]) {
								jsonFilter["quarterLight"] = jsonFilter.quarter || jsonFilter["quarter[]"];
							}
							if (jsonFilter.month || jsonFilter["month[]"]) {
								jsonFilter["monthLight"] = jsonFilter.month || jsonFilter["month[]"];
							}
						}

						if (jsonFilter.PowerStatus || jsonFilter["PowerStatus[]"]) {
							jsonFilter["startDatePower"] = jsonFilter.startDate;
							jsonFilter["endDatePower"] = jsonFilter.endDate;
							jsonFilter["fromPowerScreen"] = true;
							jsonFilter["PowerBand"] = jsonFilter.PowerStatus || jsonFilter["PowerStatus[]"];
							jsonFilter["customQueryPower"] = true;
							if (jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"]) {
								jsonFilter["dayOfWeekPower"] = jsonFilter.dayOfWeek || jsonFilter["dayOfWeek[]"];
							}
							if (jsonFilter.yearWeek || jsonFilter["yearWeek[]"]) {
								jsonFilter["yearWeekPower"] = jsonFilter.yearWeek || jsonFilter["yearWeek[]"];
							}
							if (jsonFilter.quarter || jsonFilter["quarter[]"]) {
								jsonFilter["quarterPower"] = jsonFilter.quarter || jsonFilter["quarter[]"];
							}
							if (jsonFilter.month || jsonFilter["month[]"]) {
								jsonFilter["monthPower"] = jsonFilter.month || jsonFilter["month[]"];
							}
						}
						if (jsonFilter.coolerTracking || jsonFilter["coolerTracking[]"]) {
							jsonFilter["customQueryCoolerTracking"] = true;
							jsonFilter["CoolerTrackingThreshold"] = Number(JSON.parse(LZString.decompressFromUTF16(localStorage.data)).data.tags.CoolerTrackingThreshold);
							jsonFilter["CoolerTrackingDisplacementThreshold"] = Number(JSON.parse(LZString.decompressFromUTF16(localStorage.data)).data.tags.CoolerTrackingDisplacementThreshold);
						}

						jsonFilter["isFromGrid"] = true;

						AssetfilterValues = $.extend(data, jsonFilter);
						return $.extend(data, jsonFilter);
					}
				},
				order: [],
				processing: true,
				destroy: true,
				serverSide: true,
				"deferLoading": 0,
				"bLengthChange": false,
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
						"orderable": false
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
						"orderable": false,
						render: function (data, type, row) {
							if (!data) {
								return;
							}
							var status = common.createBlock(row.AssetCurrentStatus, !!row.AssetCurrentStatus, ["Wrong Location", "Missing"].indexOf(row.AssetCurrentStatus) > -1 ? 'red' : 'blue');
							return renderers.dateTime(data, "N/A") + " " + status;
						}
					}, {
						data: 'Displacement',
						width: 80,
						className: 'dt-body-right',
						"orderable": false,
						render: function (data, type, row) {
							if (typeof data !== 'number') {
								return data;
							}
							return common.createBlock(row.LatestGpsId == 0 ? 'N/A' : (data > 0.5 || data < -0.5) ? (data.toFixed(2) > 2 ? data.toFixed(0) + "km" : data.toFixed(2) + "km") : "Ok", data > 0.5 || data < -0.5, "red");
						}
					}
					//,
					// {
					// 	data: 'Door_30dayCount',
					// 	render: function (data, type, row) {
					// 		return row["Door_TodayCount"] + " <span class='lighter'>today</span>, " + row["Door_7dayCount"] + " <span class='lighter'>7d</span>, " + row["Door_30dayCount"] + " <span class='lighter'>30d</span> ";
					// 	}
					// },
					// {
					// 	data: 'LightIntensity',
					// 	className: 'dt-body-right',
					// 	width: 40,
					// 	render: renderers.light
					// },
					// {
					// 	data: 'Temperature',
					// 	render: renderers.temperature,
					// 	className: 'dt-body-right',
					// 	width: 85
					// },
					// {
					// 	data: 'PurityIssue',
					// 	render: renderers.purityStatus,
					// 	width: 50,
					// 	"orderable": false
					// },
					// {
					// 	data: 'TotalImpureCoolers', className: 'dt-body-right', "orderable": false,
					// 	render: function (data, type, row) {
					// 		return row["isPurityRecord"] ? data : 'N/A';
					// 	}
					// },
					// {
					// 	data: 'TotalEmptyFacings',
					// 	width: 50,
					// 	"orderable": false,
					// 	render: function (data, type, row) {
					// 		return row.TotalEmptyFacings != 0 ? row.TotalEmptyFacings : 'N/A'
					// 	}
					// },
					// {
					// 	data: 'TotalSkuOOS', className: 'dt-body-right', "orderable": false,
					// 	render: function (data, type, row) {
					// 		return row["isPurityRecord"] ? data : 'N/A';
					// 	}
					// }
				],
				"sScrollX": true,
				"sDom": "" + "t" + "<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
				"autoWidth": true,
				"preDrawCallback": function () {
					// Initialize the responsive datatables helper once.		
					if (!responsiveHelper_dt_Asset) {
						responsiveHelper_dt_Asset = new ResponsiveDatatablesHelper($('#assetGridFilter'), breakpointDefinition);
					}
				},
				"rowCallback": function (nRow) {
					responsiveHelper_dt_Asset.createExpandIcon(nRow);
				},
				"drawCallback": function (oSettings) {
					responsiveHelper_dt_Asset.respond();
				}
			});
		}
	}
	gridUtils.addChildGridHandler({
		gridId: '#assetGridFilter',
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
	$('#assetGridFilter').on('click', 'tbody td.inline-link', function (e) {
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
			var assetId = rowData.Id;
			window.location.hash = 'purity/' + assetId;
		} else if (column == "Outlet") {
			var LocationCode = rowData.LocationCode;
			//window.location.hash = 'outletDetails/' + locationId;
			window.open(window.location.pathname + '#outletDetails/' + LocationCode);
		} else if (column == "Outlet Code") {
			var LocationCode = rowData.LocationCode;
			//window.location.hash = 'outletDetails/' + locationId;
			window.open(window.location.pathname + '#outletDetails/' + LocationCode);
		} else {
			var serialNumber = rowData.SerialNumber;
			serialNumber = serialNumber.toLowerCase();
			//window.location.hash = 'assetDetails/' + serialNumber;
			window.open(window.location.pathname + '#assetDetails/' + serialNumber);
		}
	});

	$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
		activeGrid = e.target.outerText;
		if (!isLoaded) {
			isLoaded = true;
			$.fn.dataTable
				.tables({
					visible: true,
					api: true
				})
				.columns.adjust();
		}
	});

	$('#xlsExport').click(function (event, filterValues) {
		exportData(event, filterValues, 'xls');
	});

	function exportData(event, filterValues, exportType) {
		var activeTab = $('#myTab li.active > a').text().trim();
		if (activeTab == "Outlets") {
			var total = $('#locationGridFilter').dataTable().fnSettings().fnRecordsTotal();
			var filterDate = $('.timeFilterName b').text();
			var jsonFilter = ({
				"start": 0,
				"limit": total,
				"exportData": "AFSROutlet",
				"exportType": exportType,
				"exportDate": moment().format('YYYY_MM_DD_HH_mm_ss'),
				"AppliedFilterArray": AppliedFilterArray,
				"FilterDate": filterDate
			});

			AssetfilterValues = $.extend(AssetfilterValues, jsonFilter);
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

		} else {

			var total = $('#assetGridFilter').dataTable().fnSettings().fnRecordsTotal();
			//filterValues["length"] = $('#locationGrid').dataTable().fnSettings().fnRecordsTotal();
			//filterValues["limit"] = $('#locationGrid').dataTable().fnSettings().fnRecordsTotal();
			//var jsonFilter = JSON.parse(JSON.stringify(filterValues));
			var filterDate = $('.timeFilterName b').text();
			var jsonFilter = ({
				"start": 0,
				"limit": total,
				"exportData": "AFSRAsset",
				"exportType": exportType,
				"exportDate": moment().format('YYYY_MM_DD_HH_mm_ss'),
				"AppliedFilterArray": AppliedFilterArray,
				"FilterDate": filterDate
			});

			AssetfilterValues = $.extend(AssetfilterValues, jsonFilter);
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

		}
	}
});