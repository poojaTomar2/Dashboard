var gmapAsset;
var validLatLong = {
	Latitude: 90,
	Longitude: 180
};
var defaultMapCenterLatLng = {
	Latitude: 41.850033,
	Longitude: -87.6500523
};
var startDate;
var endDate;
var markers = [];
var movementFilter = '{}';
var preferences = [];
var missingProductAsset = [];
missingProduct = [];
var DoorOutletDataCount = 0;
var PowerOutletDataCount = 0;
var LightOutletDataCount = 0;
var TemperatureOutletDataCount = 0;
var OSAOutletDataCount = 0;
var openedGrid = 6;
var LocationId;
var activeDetailViewTab = 'outlets1';
var currentUrl = window.location.href;

var validateLatLog = function (latitude, longitude) {
	return latitude >= -validLatLong.Latitude && latitude <= validLatLong.Latitude && longitude >= -validLatLong.Longitude && longitude <= validLatLong.Longitude;
};
var outletAssetId = [];
var chartAlertParams = [];
var sparklineRenderer = function (value, data, row) {
	return '<span class="sparkline-type-pie" data-sparkline-piesize="23px">' + (row.TotalHealthRecord - coolerDashboard.common.float(value)) + "," + coolerDashboard.common.float(value) +
		'</span>&nbsp;' + (row.TotalHealthRecord > 0 ? coolerDashboard.common.float(value) == 0 ? row.TotalHealthRecord : coolerDashboard.common.float(value) : 'N/A');
};

function getOutletDetailActiveTab(tabId) {
	activeDetailViewTab = tabId;
}

function infoGuideDetailView(sectionId) {
	window.open('#InfoGuide#index=' + sectionId);
}

if (currentUrl.indexOf('LocationMap#salesHierarchy') > 0) {
	$('#bodyId').addClass('no-menu');
	$("#userInfo").remove();
} else if (currentUrl.indexOf('irsignup') > 0 || currentUrl.indexOf('outletDetailsIR') > 0) {
	$('#bodyId').addClass('no-menu');
} else {
	$('#bodyId').removeClass('no-menu');
}

clearMarkers = function () {
	if (markers) {
		for (var i = 0; i < markers.length; i++) {
			markers[i].setMap(null);
		}
		markers = [];
	}
};

var loadChart = function (chartFilter) {
	coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
	DoorOutletDataCount = 0;
	PowerOutletDataCount = 0;
	LightOutletDataCount = 0;
	TemperatureOutletDataCount = 0;
	OSAOutletDataCount = 0;
	$.ajax({
		url: coolerDashboard.common.nodeUrl('chart', chartFilter),
		method: 'POST',
		success: function (data, request) {
			coolerDashboard.gridUtils.ajaxIndicatorStop();
			var rows = data.buckets;
			var chartTypeId = 0;
			if (data.chartTypeId) {
				chartTypeId = Number(data.chartTypeId);
			}
			for (var i = 0, len = rows.length; i < len; i++) {
				rows[i].date = Number(moment.utc(rows[i].dateTime).valueOf());
			}

			data.buckets = _.sortBy(data.buckets, "date").reverse();

			var seriesData = highChartsHelper.convertToSeries({
				seriesConfig: [{
						name: 'Avg Light',
						yAxis: 0,
						data: function (record) {
							if (record.avgLight)
								LightOutletDataCount++;
							return [record.date, record.avgLight ? record.avgLight : null];
						},
						tooltip: {
							pointFormat: "Avg Light: {point.y:.2f}"
						},
						visible: false
					},
					{
						name: 'Avg Power Off Duration',
						yAxis: 1,
						data: function (record) {
							if (record.powerOffDuration)
								PowerOutletDataCount++;
							return [record.date, record.powerOffDuration ? record.powerOffDuration : null];
						},
						tooltip: {
							pointFormat: "Avg Power Off: {point.y:.2f}"
						},
						visible: false
					},
					{
						name: 'Door Opens',
						yAxis: 2,
						type: 'column',
						data: function (record) {
							if (record.doorRecords)
								DoorOutletDataCount++;
							return [record.date, record.doorRecords ? record.doorRecords : null];
						},
						tooltip: {
							pointFormat: "Door Count: {point.y:.0f}"
						},
						visible: false
					},
					{
						name: 'Avg Temperature',
						yAxis: 3,
						data: function (record) {
							if (record.avgTemperature)
								TemperatureOutletDataCount++;
							return [record.date, record.avgTemperature ? record.avgTemperature : null];
						},
						tooltip: {
							pointFormat: "Avg Temperature: {point.y:.2f}"
						},
						visible: false
					}, {
						name: 'OSA SKU',
						yAxis: 4,
						data: function (record) {
							if (record.outOfStockSKU)
								OSAOutletDataCount++;
							return [record.date, record.outOfStockSKU ? record.outOfStockSKU : null];
						},
						tooltip: {
							pointFormat: "OSA SKU: {point.y:.0f}"
						},
						visible: false
					}
				],
				data: data.buckets
			});

			seriesData.xAxis = {
				type: "datetime",
				tickInterval: 24 * 3600 * 1000,
				dateTimeLabelFormats: {
					month: '%e. %b',
					year: '%b'
				}
			};

			$('#assetOverviewChart').highcharts({
				title: {
					text: ''
				},
				yAxis: [{
						min: 0,
						showEmpty: false,
						title: {
							//text: 'Temperature'
							text: 'Light'
						}
					},
					{
						min: 0,
						showEmpty: false,
						title: {
							//text: 'Light'
							text: 'Avg Power Off Duration'
						}
						//labels: {
						//format: '{value:.2f}'
						//}
					},
					{
						min: 0,
						showEmpty: false,
						title: {
							//text: 'Avg Power Off Duration'
							text: 'Door Count'
						}
						//labels: {
						//format: '{value:.2f}'
						//}
					}, {
						min: 0,
						showEmpty: false,
						opposite: true,
						title: {
							//text: 'Door Count'
							text: 'Temperature'
						}
					}, {
						min: 0,
						showEmpty: false,
						opposite: true,
						title: {
							text: 'OSA SKU'
						}
					}
				],
				lang: {
					noData: "No data found to display",
					thousandsSep: ','
				},
				plotOptions: {
					column: {
						pointWidth: 15
					}
				},
				xAxis: seriesData.xAxis,
				series: seriesData.series,
				tooltip: {
					pointFormat: "{point.y:.2f}"
				}

			});
			//if (chartTypeId > 0) {
			// console.log(LightOutletDataCount);
			// console.log(PowerOutletDataCount);
			// console.log(DoorOutletDataCount);
			// console.log(TemperatureOutletDataCount);
			// console.log(OSAOutletDataCount);

			var chartOutlet = $('#assetOverviewChart').highcharts();
			for (var i = 0; i < 5; i++) {
				chartOutlet.series[i].setVisible(false, false);
			}
			if (LightOutletDataCount > 0) {
				chartOutlet.series[0].setVisible(true, false)
			} else if (PowerOutletDataCount > 0) {
				chartOutlet.series[1].setVisible(true, false)
			} else if (DoorOutletDataCount > 0) {
				chartOutlet.series[2].setVisible(true, false)
			} else if (TemperatureOutletDataCount > 0) {
				chartOutlet.series[3].setVisible(true, false)
			} else if (OSAOutletDataCount > 0) {
				chartOutlet.series[4].setVisible(true, false)
			}
			chartOutlet.redraw();

		},
		failure: function (response, opts) {
			coolerDashboard.gridUtils.ajaxIndicatorStop();
		}
	});
}

var loadOutletOverview = function (filter) {
	coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
	$.ajax({
		url: coolerDashboard.common.nodeUrl('outletOverviewData', filter),
		method: 'GET',
		success: function (data, request) {
			coolerDashboard.gridUtils.ajaxIndicatorStop();
			var result = data.data.finalData,

				outletLevelSKU = data.data.outletLevelSKU,
				tableData = '',
				record, tempIcon, lightIcon, powerIcon,
				lastPing,
				latestScanTime,
				latestDoorTime,
				door_TodayCount,
				door_7dayCount,
				door_30dayCount,
				verifiedOn,
				tags = JSON.parse(LZString.decompressFromUTF16(localStorage.data)).data.tags,
				temperatureMax = tags.TemperatureMax,
				temperatureMin = tags.TemperatureMin,
				lightMax = tags.LightMax,
				lightMin = tags.LightMin,
				powerOffDuration = tags.PowerOffDuration,
				movementDuration = tags.MovementDuration,
				doorCount = tags.DoorCount,
				performanceGrid = "\'s3\'",
				alertGrid = "\'s1\'",
				doorGrid = "\'s6\'",
				stockGrid = "\'s7\'";
			var distinctSku;
			missingProduct = [];
			missingProductAsset = [];

			if (outletLevelSKU) {

				for (var k = 0; k < outletLevelSKU.length; k++) {

					var IsExists = missingProduct.filter(function (data) {
						return data.ProductId == outletLevelSKU[k].ProductId
					});

					if (IsExists && IsExists.length == 0) {
						missingProduct.push({
							ProductId: outletLevelSKU[k].ProductId,
							PackagingType: outletLevelSKU[k].PackagingType,
							Product: outletLevelSKU[k].Product,
							BrandName: outletLevelSKU[k].BrandName,
							SerialNumber: '-', //record.serialNumber,
							OOSCount: outletLevelSKU[k].OOSCount
						});
					}
				}
			}

			if (result.length > 0) {
				for (var i = 0, len = result.length; i < len; i++) {
					record = outletAssetId.filter(function (obj) {
						return obj.assetId == result[i].AssetId
					})[0];
					if (!result[i].OosProcessed == false) {


						// if (result[i].missingProductOutletLevel && result[i].missingProductOutletLevel.length > 0) {
						// 	for (var k = 0; k < result[i].missingProductOutletLevel.length; k++) {

						// 		var IsExists = missingProduct.filter(function (data) {
						// 			return data.ProductId == result[i].missingProductOutletLevel[k].ProductId
						// 		});
						// 		if (IsExists && IsExists.length == 0) {
						// 			missingProduct.push({
						// 				ProductId: result[i].missingProductOutletLevel[k].ProductId,
						// 				PackagingType: result[i].missingProductOutletLevel[k].PackagingType,
						// 				Product: result[i].missingProductOutletLevel[k].Product,
						// 				BrandName: result[i].missingProductOutletLevel[k].BrandName,
						// 				SerialNumber: '-', //record.serialNumber,
						// 				OOSCount: result[i].missingProductOutletLevel[k].OOSCount
						// 			});
						// 		}

						// 	}

						// }



						if (result[i].missingProduct && result[i].missingProduct.length > 0) {
							for (var k = 0; k < result[i].missingProduct.length; k++) {



								missingProductAsset.push({
									ProductId: result[i].missingProductData[k].ProductId,
									AssetId: result[i].AssetId,
									SerialNumber: record.serialNumber,
									PackagingType: result[i].missingProductData[k].PackagingType,
									Product: result[i].missingProductData[k].Product,
									BrandName: result[i].missingProductData[k].BrandName,
									OOSCount: result[i].missingProductData[k].OOSCount
								});
							}

						}
					}

					var isVision = false;
					var isSmart = false;
					if (record.SmartDeviceTypeId == 3 || record.SmartDeviceTypeId == 7 || record.SmartDeviceTypeId == 26) {
						isVision = true;
					}
					if (record.isSmart) {
						isSmart = true;
					}
					var empty = record.TotalFacings != 0 ? ((record.TotalEmptyFacings * 100) / record.TotalFacings).toFixed(2) : 0;
					var compliancePercentage = record.TotalFacings != 0 ? record.PlanogramCompliance : 0;
					//if device are smart beacon
					if (record.SmartDeviceTypeId == 17 || record.SmartDeviceTypeId == 22 || record.SmartDeviceTypeId == 23 || record.SmartDeviceTypeId == 25) {
						tempIcon = 'grey'; //always grey
						lightIcon = 'grey';
						powerIcon = 'grey';
						doorIcon = 'grey';
					} else { //if device are not smart beacon
						tempIcon = !isSmart ? 'grey' : result[i].TemperatureIssue == "N/A" ? 'na' : (record.temperature > Number(temperatureMax) || record.temperature < Number(temperatureMin)) && result[i].TemperatureIssue ? 'red' : (record.temperature < Number(temperatureMax) && record.temperature > Number(temperatureMin)) && result[i].TemperatureIssue ? 'yellow' : 'green';
						lightIcon = !isSmart ? 'grey' : result[i].LightIssue == "N/A" ? 'na' : (record.lightIntensity > Number(lightMax) || record.lightIntensity < Number(lightMin)) && result[i].LightIssue ? 'red' : (record.lightIntensity < Number(lightMax) && record.lightIntensity > Number(lightMin)) && result[i].LightIssue ? 'yellow' : 'green';
						powerIcon = !isSmart ? 'grey' : result[i].PowerIssue == "N/A" ? 'na' : !record.isPowerOn && result[i].PowerIssue ? 'red' : record.isPowerOn && result[i].PowerIssue ? 'yellow' : 'green';
						doorIcon = !isSmart ? 'grey' : result[i].DoorCountIssue == "N/A" ? 'na' : record.todayDoorCount < doorCount && result[i].DoorCountIssue ? 'red' : record.todayDoorCount > doorCount && result[i].DoorCountIssue ? 'yellow' : 'green';
					}
					oosSkuIcon = !isSmart ? 'grey' : !isVision ? 'grey' : result[i].OosProcessed == false ? 'na' : !result[i].OosSku && !result[i].OosSkuLatest && result[i].OosProcessed ? 'red' : !result[i].OosSku && result[i].OosSkuLatest && result[i].OosProcessed ? 'yellow' : 'green';
					distinctSku = result[i].OosProcessed == false ? '' : result[i].DistinctMissingSku == "N/A" ? 0 : result[i].DistinctMissingSku;
					oosSkuIcon = !isSmart ? 'grey' : !isVision ? 'grey' : result[i].OosProcessed == false ? 'na' : distinctSku != 0 ? 'red' : 'green'
					tableData += '<tr style="height: 2.5em;" class ="text-center">' +
						'<td title="Shows Details of this Asset only" class = "cursorStyle" style ="padding-left: 0px !important; text-align: left;"><span class="smart-form"><label class="toggle"><input data-assetid = ' + record.assetId + ' class="asset-checkbox-toggle" type="checkbox" id="' + record.assetId + '" name="asset-checkbox-toggle" checked><i data-swchon-text="TRUE" data-swchoff-text="FALSE"></i></label></span></td>' +
						'<td class = "inline-link cursorStyle assetSerial2" data-assetid = ' + record.assetId + ' data-serialNumber = ' + record.serialNumber + '> ' + record.serialNumber + ' </td>' +
						'<td> ' + record.SmartDeviceType + '</td>' +
						'<td class = "cursorStyle"><img src="../img/icons/circle_' + tempIcon + '.png" onclick="onImgClick(' + record.assetId + ' ,1)"> </td>' +
						'<td class = "cursorStyle"><img src="../img/icons/circle_' + lightIcon + '.png" onclick="onImgClick(' + record.assetId + ' ,2)"> </td>' +
						'<td class = "cursorStyle"><img src="../img/icons/circle_' + powerIcon + '.png" onclick="onImgClick(' + record.assetId + ' ,3)">  </td>' +
						'<td class = "cursorStyle"><img src="../img/icons/circle_' + doorIcon + '.png" onclick="onImgClick(' + record.assetId + ' ,4)"> </td>' +
						'<td class = "cursorStyle" data-missingsku = "' + missingProductAsset + '"><img src="../img/icons/circle_' + oosSkuIcon + '.png" onclick="onImgClick(' + record.assetId + ' ,5 )""> ' + distinctSku + '</td>' +
						'<td class = "cursorStyle" onclick="onImgClick(' + record.assetId + ' ,6 )">' + result[i].Alarm + '</td>' +
						'<td data-assetid = ' + record.assetId + '> ' + record.door_TodayCount + '</td>' +
						'<td data-assetid = ' + record.assetId + '> ' + record.door_7dayCount + '</td>' +
						'<td data-assetid = ' + record.assetId + '> ' + record.door_30dayCount + '</td>' +
						//'<td class = " refreshData" data-lastPing = "' + record.latestDoorTime + '"> ' + coolerDashboard.renderers.humanizeDurationRenderer(record.latestDoorTime) + ' </div></td>' +
						//'<td class = " refreshData" data-lastPing ="' + record.lastPing + '"> ' + coolerDashboard.renderers.humanizeDurationRenderer(record.lastPing) + ' </div></td>' +
						'<td  data-lastPing = "' + record.LatestHealthRecordDate + '"> ' + record.LatestHealthRecordDate + ' </div></td>' +
						'<td  data-lastPing = "' + record.verifiedOn + '"> ' + coolerDashboard.common.lastRecognitionImageRenderer(moment(record.PurityDateTime), record.StoredFilename, record.ImageCount, record.verifiedOn) + '</div></td>' +
						'<td data-assetid = ' + record.assetId + '> ' + empty + '</td>' +
						'<td data-assetid = ' + record.assetId + '> ' + record.TotalSSDProducts + '</td>' +
						'<td data-assetid = ' + record.assetId + '> ' + record.TotalNCBProducts + '</td>' +
						'<td data-assetid = ' + record.assetId + '> ' + compliancePercentage + '</td>' +
						'<td data-assetid = ' + record.assetId + '> ' + record.PurityPercentage + '</td>' +
						'</tr>';
				}
				var table = '<table class="table table-striped table-hover table-condensed dataTable no-footer" style = "margin-top: 0px !important;">' +
					'<thead >' +
					'<th></th>' +
					'<th></th>' +
					'<th></th>' +
					'<th colspan="3" class ="text-center">Health</th>' +
					'<th class ="text-center">Utilization</th>' +
					'<th class ="text-center">OSA SKU</th>' +
					'<th class ="text-center">Alerts</th>' +
					'<th colspan="3" class ="text-center">Door</th>' +
					'<th colspan="8"></th>' +

					'<tr class="blank">' +
					'<th><div><div class="select-assets" title="Filter as per asset"><i class="fa fa-star" style="font-size: 9px;color: #a90329!important;"></i><i class="fa fa-star" style="font-size: 9px;color: #a90329!important;"></i></div></div></th>' +
					'<th></th>' +
					'<th></th>' +
					'<th class ="text-center cursorStyle"><div><div class="select-fields"><i class="fa fa-star" style="font-size: 9px;color: #a90329!important;"></i></div></div></th>' +
					'<th class ="text-center cursorStyle"><div><div class="select-fields"><i class="fa fa-star" style="font-size: 9px;color: #a90329!important;"></i></div></div></th>' +
					'<th class ="text-center cursorStyle"><div><div class="select-fields"><i class="fa fa-star" style="font-size: 9px;color: #a90329!important;"></i></div></div></th>' +
					'<th class ="text-center cursorStyle"><div><div class="select-fields"><i class="fa fa-star" style="font-size: 9px;color: #a90329!important;"></i></div></div></th>' +
					'<th class ="text-center cursorStyle"><div><div class="select-fields"><i class="fa fa-star" style="font-size: 9px;color: #a90329!important;"></i></div></div></th>' +
					'<th class ="text-center cursorStyle"><div><div class="select-fields"><i class="fa fa-star" style="font-size: 9px;color: #a90329!important;"></i></div></div></th>' +
					'<th class ="text-center"> </th>' +
					'<th class ="text-center"></th>' +
					'<th class ="text-center"></th>' +
					//'<th class ="text-center">Last Door</th>' +
					//'<th class ="text-center">Last Seen on </th>' +
					'<th class ="text-center"></th>' +
					'<th class ="text-center"><div class="select-images" title="Click on values to open Image"><i class="fa fa-star" style="font-size: 9px;color: #a90329!important;"></i><i class="fa fa-star" style="font-size: 9px;color: #a90329!important;"></i><i class="fa fa-star" style="font-size: 9px;color: #a90329!important;"></div></i></th>' +
					'<th class ="text-center"></th>' +
					'<th class ="text-center"></th>' +
					'<th class ="text-center"></th>' +
					'<th class ="text-center"></th>' +
					'<th class ="text-center"></th>' +
					'</tr>' +


					'<tr class="no-top">' +
					'<th></th>' +
					//<span class="smart-form"><label class="toggle"><input type="checkbox"  id="select-all-assets" name="checkbox-toggle"><i data-swchon-text="TRUE" data-swchoff-text="FALSE"></i></label></span>
					'<th>Asset</th>' +
					'<th>Device Type</th>' +
					'<th class ="text-center cursorStyle"><img title="Temperature" src="../img/icons/temperature.png" onclick="onIconClick(' + performanceGrid + ')"></th>' +
					'<th class ="text-center cursorStyle"><img title="Light" src="../img/icons/light.png" onclick="onIconClick(' + performanceGrid + ')"></th>' +
					'<th class ="text-center cursorStyle"><img title="Power" src="../img/icons/power.png" onclick="onIconClick(' + performanceGrid + ')"></th>' +
					'<th class ="text-center cursorStyle"><img title="Door Utilization" src="../img/icons/door.png" onclick="onIconClick(' + doorGrid + ')"></th>' +
					'<th class ="text-center cursorStyle"><img title="OSA SKU" src="../img/icons/stock.png" onclick="onIconClick(' + stockGrid + ')"></th>' +
					'<th class ="text-center cursorStyle"><img title="Alert" src="../img/icons/alert.png" onclick="onIconClick(' + alertGrid + ')"></th>' +
					'<th class ="text-center">Today </th>' +
					'<th class ="text-center">Last 7 Days </th>' +
					'<th class ="text-center">Last 30 Days</th>' +
					//'<th class ="text-center">Last Door</th>' +
					//'<th class ="text-center">Last Seen on </th>' +
					'<th class ="text-center">Latest Health Record</th>' +
					'<th class ="text-center">Last Recognition on</th>' +
					'<th class ="text-center">% Empty</th>' +
					'<th class ="text-center">#SSD</th>' +
					'<th class ="text-center">#NCB</th>' +
					'<th class ="text-center">Planogram compliance %</th>' +
					'<th class ="text-center">Purity %</th>' +
					'</tr>' +
					'</thead >' +
					'<tbody >' +
					tableData +
					'</tbody>' +
					'</table>';
				// need to implement view
				$('#assetOverview').html(table);

				$('#select-all-assets').click(function (params) {

					if ($(params.currentTarget)[0].checked == true) {
						$("input[name=asset-checkbox-toggle]").each(function () {
							$(this)[0].checked = true;
						});
					} else {
						$("input[name=asset-checkbox-toggle]").each(function () {
							$(this)[0].checked = false;
						});
					}
				});

				$('.asset-checkbox-toggle').click(function (params) {
					var assetIdArr = [];
					planogramArr = [];
					$("input[name=asset-checkbox-toggle]").each(function () {
						if ($(this)[0].checked == true) {
							var assetId = $(this)[0].dataset.assetid;
							assetIdArr.push(assetId);

							var planogram = chartAlertParams.filter(function (obj) {
								return obj.assetId == assetId
							})[0];
							planogramArr.push(planogram.planogramId);
						}
					});

					if (assetIdArr.length == 0) {
						getChartFilteredData(0, 0, 0, startDate, endDate, false);
					} else {
						getChartFilteredData(assetIdArr, 0, planogramArr, startDate, endDate, true);
					}
					//onImgClick(assetId, openedGrid);
					onCheckClick(assetIdArr, true);
				});

				// $(".assetSerial").click(function () {
				// 	var assetId = $(this)[0].dataset.assetid;
				// 	var planogram = chartAlertParams.filter(function (obj) {
				// 		return obj.assetId == assetId
				// 	})[0];
				// 	getChartFilteredData(assetId, 0, planogram.planogramId, startDate, endDate);
				// 	onImgClick(assetId, openedGrid);
				// });

				$('#missingSkuGrid').dataTable().fnClearTable();
				if (missingProduct.length != 0) {
					var data = {
						data: missingProduct,
						recordsFiltered: missingProduct.length,
						recordsTotal: missingProduct.length,
						success: true
					};
					$('#missingSkuGrid').dataTable().fnAddData(missingProduct);
				}



				$(".assetSerial2").click(function () {
					var assetId = $(this)[0].dataset.assetid;
					var serialNumber = $(this)[0].dataset.serialnumber;
					serialNumber = serialNumber.toLowerCase();
					//window.location.hash = 'assetDetails/' + serialNumber;
					window.open(window.location.pathname + '#assetDetails/' + serialNumber);
				});
			}

			setInterval(function () {
				var dataArray = $(".refreshData");
				var length = dataArray.length;
				for (var i = 0; i < length; i++) {
					var data = dataArray[i];
					var value = data.dataset.lastping;
					data.innerHTML = coolerDashboard.renderers.humanizeDurationRenderer(value)
				}
			}, 10000)

		},
		failure: function (response, opts) {
			coolerDashboard.gridUtils.ajaxIndicatorStop();
		}
	});
};


var loadHeaderInfo = function (filter) {
	$.ajax({
		url: coolerDashboard.common.nodeUrl('loadHeaderInfo', filter),
		method: 'GET',
		success: function (data, request) {
			var data = data.data;
			$('#outletAddress').html('<b>Address : ' + data.address + '</b>');
			// $('#outletAddress').html('<b>Address : ' + data.address + '</b> <span id="redirectButtonStatus"><button type="button" onclick="redirectIRSignup()" class="btn btn-primary">Sign Up</button></span>');
			// $("#redirectButtonStatus").hide();
			$('#outletAlertCount').html('<b>Active Alert : ' + data.alertCount + '</b>');
			$('#store').html('<i class="fa-fw fa fa-home"></i>' + data.locationName);
			//$('#outletLastVisit').html('<b>Location Last Visit : ' + coolerDashboard.renderers.dateTime(data.lastVisit) + '</b>');
			// var IRhashUrl = window.location.hash;
			// var signuplocationCode = IRhashUrl.split('/')[1];
			// var params = {
			// 	outletCode: signuplocationCode
			// }
			// $.ajax({
			// 	url: coolerDashboard.common.nodeUrl('getirsignupstatus', params),
			// 	method: 'GET',
			// 	success: function (data, request) {
			// 		if (data && data.data && data.data.length == 0) {
			// 			$("#redirectButtonStatus").show();
			// 		} else {
			// 			$("#redirectButtonStatus").hide();
			// 		}
			// 	},
			// 	failure: function (response, opts) {}
			// });
		},
		failure: function (response, opts) {}
	});
};

function onImgClick(assetId, chartTypeId) {

	var products = _.filter(missingProductAsset, function (product) {
		return product.AssetId == assetId
	});
	var planogram = chartAlertParams.filter(function (obj) {
		return obj.assetId == assetId
	})[0];
	getChartFilteredData(assetId, chartTypeId, planogram.planogramId, startDate, endDate, false);
	var performanceGrid = "s3",
		alertGrid = "s1",
		doorGrid = "s6",
		stockGrid = "s9",
		movementid = "s4",
		gpstid = "s5",
		planogramid = "s7",
		puritytid = "s8";

	var hash;

	if (chartTypeId == 1 || chartTypeId == 2 || chartTypeId == 3) {
		hash = performanceGrid;
	}
	if (chartTypeId == 4) {
		hash = doorGrid;
	}
	if (chartTypeId == 5) {
		hash = stockGrid;
	}
	if (chartTypeId == 6) {
		hash = alertGrid;
	}
	if (chartTypeId == 7) {
		hash = movementid;
	}
	if (chartTypeId == 8) {
		hash = gpstid;
	}
	if (chartTypeId == 9) {
		hash = planogramid;
	}
	if (chartTypeId == 10) {
		hash = puritytid;
	}


	openedGrid = chartTypeId;
	onIconClick(hash, assetId, products, true)
};

function onCheckClick(assetId, iconClicked) {

	// $('#assetDetailScreenTabPanel').children().removeClass("active");
	// tab.parent().addClass('active');
	// $('#myTabContent').children().removeClass("active in");
	// $('#' + hash).addClass('active in');
	var products = [];
	//	if (hash == 's1') {
	var AssetsUrl = '';
	if (assetId.length > 0) {
		assetId.forEach(function (element) {
			AssetsUrl += '&assetId=' + element;
			var product = _.filter(missingProductAsset, function (product) {
				return product.AssetId == assetId
			});
			if (product.length > 0) {
				products.push(product[0]);
			}
		}, this);
	} else {
		AssetsUrl = '&assetId=' + 0;
	}


	var table = $('#outletAlertGrid').DataTable();
	var url = table.ajax.url();

	if (url.indexOf('&assetId') >= 0) {
		url = url.substring(0, url.indexOf('&assetId'));
	}

	if (assetId) {
		url = url + AssetsUrl;
	}
	table.ajax.url(url).load();

	var table = $('#outletHealthGrid').DataTable();
	var url = table.ajax.url();
	if (url.indexOf('&assetId') >= 0) {
		url = url.substring(0, url.indexOf('&assetId'));
	}
	if (assetId) {
		url = url + AssetsUrl;
	}
	table.ajax.url(url).load();

	var table = $('#outletMovementGrid').DataTable();
	var url = table.ajax.url();
	if (url.indexOf('&assetId') >= 0) {
		url = url.substring(0, url.indexOf('&assetId'));
	}
	if (assetId) {
		url = url + AssetsUrl;
	}
	table.ajax.url(url).load();

	var table = $('#outletGpsGrid').DataTable();
	var url = table.ajax.url();
	if (url.indexOf('&assetId') >= 0) {
		url = url.substring(0, url.indexOf('&assetId'));
	}
	if (assetId) {
		url = url + AssetsUrl;
	}
	table.ajax.url(url).load();


	var table = $('#outletDoorGrid').DataTable();
	var url = table.ajax.url();
	if (url.indexOf('&assetId') >= 0) {
		url = url.substring(0, url.indexOf('&assetId'));
	}
	if (assetId) {
		url = url + AssetsUrl;
	}
	table.ajax.url(url).load();


	var table = $('#outletAssetPlanogramGrid').DataTable();
	var url = table.ajax.url();
	if (url.indexOf('&assetId') >= 0) {
		url = url.substring(0, url.indexOf('&assetId'));
	}
	if (assetId) {
		url = url + AssetsUrl;
	}
	table.ajax.url(url).load();


	var table = $('#outletPurityGrid').DataTable();
	var url = table.ajax.url();
	if (url.indexOf('&assetId') >= 0) {
		url = url.substring(0, url.indexOf('&assetId'));
	}
	if (assetId) {
		url = url + AssetsUrl;
	}
	table.ajax.url(url).load();


	$('#missingSkuGrid').dataTable().fnClearTable();
	if (iconClicked) {
		$('#missingSkuGrid').dataTable().fnAddData(products);
	} else {
		if (missingProduct && missingProduct.length != 0) {
			$('#missingSkuGrid').dataTable().fnAddData(missingProduct);
		}
	}

};

function onIconClick(hash, assetId, products, iconClicked) {
	if (hash) {
		var tab = $('#assetDetailScreenTabPanel').children().find('a[href= "#' + hash + '"]');
		if (tab.length > 0) {
			$('#assetDetailScreenTabPanel').children().removeClass("active");
			tab.parent().addClass('active');
			$('#myTabContent').children().removeClass("active in");
			$('#' + hash).addClass('active in');

			//	if (hash == 's1') {
			var table = $('#outletAlertGrid').DataTable();
			var url = table.ajax.url();
			if (url.indexOf('&assetId') >= 0) {
				url = url.substring(0, url.indexOf('&assetId'));
			}
			if (assetId) {
				url = url + '&assetId=' + assetId;
			}
			table.ajax.url(url).load();
			//	}
			//	if (hash == 's3') {
			var table = $('#outletHealthGrid').DataTable();
			var url = table.ajax.url();
			if (url.indexOf('&AssetId') >= 0) {
				url = url.substring(0, url.indexOf('&AssetId'));
			}
			if (assetId) {
				url = url + '&AssetId=' + assetId;
			}
			table.ajax.url(url).load();
			// }
			// if (hash == 's4') {
			var table = $('#outletMovementGrid').DataTable();
			var url = table.ajax.url();
			if (url.indexOf('&AssetId') >= 0) {
				url = url.substring(0, url.indexOf('&AssetId'));
			}
			if (assetId) {
				url = url + '&AssetId=' + assetId;
			}
			table.ajax.url(url).load();
			// }
			// if (hash == 's5') {
			var table = $('#outletGpsGrid').DataTable();
			var url = table.ajax.url();
			if (url.indexOf('&assetId') >= 0) {
				url = url.substring(0, url.indexOf('&assetId'));
			}
			if (assetId) {
				url = url + '&assetId=' + assetId;
			}
			table.ajax.url(url).load();
			// }
			// if (hash == 's6') {
			var table = $('#outletDoorGrid').DataTable();
			var url = table.ajax.url();
			if (url.indexOf('&AssetId') >= 0) {
				url = url.substring(0, url.indexOf('&AssetId'));
			}
			if (assetId) {
				url = url + '&AssetId=' + assetId;
			}
			table.ajax.url(url).load();
			// }

			// if (hash == 's7') {
			var table = $('#outletAssetPlanogramGrid').DataTable();
			var url = table.ajax.url();
			if (url.indexOf('&assetId') >= 0) {
				url = url.substring(0, url.indexOf('&assetId'));
			}
			if (assetId) {
				url = url + '&assetId=' + assetId;
			}
			table.ajax.url(url).load();
			// }
			// if (hash == 's8') {
			var table = $('#outletPurityGrid').DataTable();
			var url = table.ajax.url();
			if (url.indexOf('&assetId') >= 0) {
				url = url.substring(0, url.indexOf('&assetId'));
			}
			if (assetId) {
				url = url + '&assetId=' + assetId;
			}
			table.ajax.url(url).load();
			// }
			// if (hash == 's9') {
			$('#missingSkuGrid').dataTable().fnClearTable();
			if (iconClicked) {
				$('#missingSkuGrid').dataTable().fnAddData(products);
			} else {
				if (missingProduct && missingProduct.length != 0) {
					$('#missingSkuGrid').dataTable().fnAddData(missingProduct);
				}
			}
			//	}
			$('#' + hash).show();
		}
	}
};

function markOutletAssetData(assetData, firstRecord) {
	pageSetUp();
	var gridUtils = coolerDashboard.gridUtils;

	var common = coolerDashboard.common,
		renderers = coolerDashboard.renderers;

	common.assetData = assetData;

	//var locationId = firstRecord.LocationId;
	var responsiveHelper_dt_Alert = undefined;
	var responsiveHelper_dt_Visit = undefined;
	var responsiveHelper_dt_Health = undefined;
	var responsiveHelper_dt_Movement = undefined;
	var responsiveHelper_dt_Door = undefined;
	var responsiveHelper_dt_Ping = undefined;
	var responsiveHelper_dt_GPS = undefined;
	var responsiveHelper_dt_AssetPlanogram = undefined;
	var responsiveHelper_dt_AssetPurity = undefined;

	var breakpointDefinition = {
		tablet: 1024,
		phone: 480
	};

	var baseParams = {
		LocationId: LocationId,
		FromOutletDetail: true
	};
	var gpsGridParams = {
		LocationId: LocationId,
		//MovementTypeId: 78,
		Latitude: 0,
		Latitude_operator: "!="
	};
	var movementGridParams = {
		LocationId: LocationId,
		//MovementTypeId: 78,
		//MovementTypeId_operator: "!=",
		SumOfMovementDuration: 4,
		SumOfMovementDuration_operator: ">"
	};
	var visitGridParams = {
		LocationId: LocationId,
		VisitId: -1,
		VisitId_operator: "!="
	};

	$("#outletAssetGPSStatusCheck").click(function () {
		var gpsTable = $('#outletGpsGrid').DataTable();
		if (this.checked) {
			delete gpsGridParams.Latitude_operator;
			delete gpsGridParams.Latitude;
		} else {
			gpsGridParams.Latitude_operator = "!=";
			gpsGridParams.Latitude = 0;
		}
		var url = 'smartDeviceMovement/list?' + $.param(gpsGridParams);
		gpsTable.ajax.url(url).load();
	});

	$('#outletAlertGrid thead tr td').each(function () {
		var title = $(this).text();
		if (title != "" && title.trim() != "HighMediumLow") {
			$(this).html('<input type="text" class="form-control" placeholder="Search ' + title + '" />');
			attachFilterListener(this.id);
		}
	});

	var oTable = $('#outletAlertGrid')
		.dataTable({
			ajax: {
				url: coolerDashboard.common.nodeUrl('alert/list', baseParams),
				method: 'POST',
				data: function (data, settings) {
					var searchFilters = $(".filterable");
					for (var i = 0, len = searchFilters.length; i < len; i++) {
						var searchElement = searchFilters[i];
						if (searchElement.dataset.grid == "outletAlertGrid") {
							var value = $(searchElement.childNodes[0]).val();
							if (value) {
								data['search_' + searchElement.dataset.column] = value;
							}
						}
					}

					var priorityTypeId = $('.priorityTypeCombo').val();
					if (priorityTypeId != null) {
						data.PriorityId = priorityTypeId;
					}

					data.fromOutletScreenDateFilter = true;
					data.startDate = startDate.format('YYYY-MM-DD[T00:00:00.000Z]');
					data.endDate = endDate.format('YYYY-MM-DD[T23:59:59.000Z]');
					data.ClosedOn = '0001-01-01T00:00:00';
					data["openAlert"] = true;
					return data;
				}
			},
			order: [
				[4, "asc"]
			],
			processing: true,
			serverSide: true,
			columns: [{
				data: 'AlertTypeId',
				render: renderers.alertTypeIcon,
				"className": 'alert-icons',
				"orderable": false,
				width: 80
			}, {
				data: 'AlertType'
			}, {
				data: 'Priority'
			}, {
				data: 'AssetSerialNumber',
				className: 'inline-link'
			}, {
				data: 'AlertText'
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
				render: renderers.alertAge
			}],
			"sDom": "" + "t" + "<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
			"autoWidth": true,
			"preDrawCallback": function () {
				// Initialize the responsive datatables helper once.
				if (!responsiveHelper_dt_Alert) {
					responsiveHelper_dt_Alert = new ResponsiveDatatablesHelper($('#outletAlertGrid'), breakpointDefinition);
				}
			},
			"rowCallback": function (nRow) {
				responsiveHelper_dt_Alert.createExpandIcon(nRow);
			},
			"drawCallback": function (oSettings) {
				responsiveHelper_dt_Alert.respond();
			}

		});

	$('#outletVisitGrid thead tr td').each(function () {
		var title = $(this).text();
		if (title != "") {
			$(this).html('<input type="text" class="form-control" placeholder="Search ' + title + '" />');
			attachFilterListener(this.id);
		}
	});

	var oTable = $('#outletVisitGrid')
		.dataTable({
			ajax: {
				url: coolerDashboard.common.nodeUrl('assetVisitHistory/list', visitGridParams),
				method: 'POST',
				data: function (data, settings) {
					var searchFilters = $(".filterable");
					for (var i = 0, len = searchFilters.length; i < len; i++) {
						var searchElement = searchFilters[i];
						if (searchElement.dataset.grid == "outletVisitGrid") {
							var value = $(searchElement.childNodes[0]).val();
							if (value) {
								data['search_' + searchElement.dataset.column] = value;
							}
						}
					}
					data.fromOutletScreenDateFilter = true;
					data.startDate = startDate.format('YYYY-MM-DD[T00:00:00.000Z]');
					data.endDate = endDate.format('YYYY-MM-DD[T23:59:59.000Z]');
					return data;
				}
			},
			order: [
				[0, "desc"]
			],
			processing: true,
			serverSide: true,
			columns: [{
				data: 'VisitDateTime',
				render: function (data, type, row) {
					return coolerDashboard.common.dateTime(row.Visit_Start_Time);
				}
			}, {
				data: 'AssetSerialNumber',
				className: 'inline-link'
			}, {
				data: 'Visit_First_Name',
				render: function (data, type, row) {
					return gridUtils.joinStrings(' ', row.Visit_First_Name, row.Visit_Last_Name);
				}
			}, {
				data: 'Visit_Start_Time',
				render: function (data, type, row) {
					return coolerDashboard.common.dateDiff(coolerDashboard.common.parseDate(row.VisitDateTime), coolerDashboard.common.parseDate(row.Visit_Start_Time))
				}
			}, {
				data: 'Status',
				render: function (data, type, row) {
					if (!data) {
						return;
					}
					var status = coolerDashboard.common.createBlock(data, !!data, ["Wrong Location", "Missing"].indexOf(data) > -1 ? 'red' : 'blue');
					return status;
				}
			}, {
				data: 'Notes'
			}, {
				data: 'Latitude',
				className: 'dt-body-right',
				render: function (v) {
					return v ? v.toFixed(5) : "-";
				}
			}, {
				data: 'Longitude',
				className: 'dt-body-right',
				render: function (v) {
					return v ? v.toFixed(5) : "-";
				}
			}, {
				data: 'Distance',
				width: 160,
				"orderable": false,
				render: function (data, type, row) {
					return data && !isNaN(data) && data !== "" ? data.toFixed(2) + " KM" : "";
				}
			}],
			"sDom": "" + "t" + "<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
			"autoWidth": true,
			"preDrawCallback": function () {
				// Initialize the responsive datatables helper once.
				if (!responsiveHelper_dt_Visit) {
					responsiveHelper_dt_Visit = new ResponsiveDatatablesHelper($('#outletVisitGrid'), breakpointDefinition);
				}
			},
			"rowCallback": function (nRow) {
				responsiveHelper_dt_Visit.createExpandIcon(nRow);
			},
			"drawCallback": function (oSettings) {
				responsiveHelper_dt_Visit.respond();
			}

		});

	var healthTable = $('#outletHealthGrid')
		.dataTable({
			ajax: {
				url: coolerDashboard.common.nodeUrl('smartDeviceHealth/list', baseParams),
				method: 'POST',
				data: function (data, settings) {
					data.fromOutletScreenDateFilter = true;
					data.startDate = startDate.format('YYYY-MM-DD[T00:00:00.000Z]');
					data.endDate = endDate.format('YYYY-MM-DD[T23:59:59.000Z]');
					return data;
				}
			},
			order: [
				[0, "desc"]
			],
			processing: true,
			serverSide: true,
			select: true,
			columns: [{
				data: 'EventDate',
				render: function (data, type, row) {
					return coolerDashboard.common.dateWithFormat(data, '-', 'date')
				},
				width: 60
			}, {
				data: 'TempIssue',
				width: 60,
				"orderable": false,
				render: sparklineRenderer
			}, {
				data: 'LightIssue',
				width: 60,
				"orderable": false,
				render: sparklineRenderer
			}, {
				data: 'HightTemperature',
				width: 60,
				"orderable": false,
				render: sparklineRenderer
			}, {
				data: 'LowLight',
				width: 60,
				"orderable": false,
				render: sparklineRenderer
			}, {
				data: 'PowerOffCount',
				width: 60,
				"orderable": false,
				render: function (value, data, row) {
					return '<span class="sparkline-type-pie" data-sparkline-piesize="23px">' + (row.TotalPowerRecord - coolerDashboard.common.float(value)) + "," + coolerDashboard.common.float(value) +
						'</span>&nbsp;' + (row.TotalPowerRecord > 0 ? coolerDashboard.common.float(value) == 0 ? row.TotalHealthRecord : coolerDashboard.common.float(value) : 'N/A');
				}
			}, {
				data: 'MissingCount',
				width: 60,
				"orderable": false,
				render: function (value, data, row) {
					return '<span class="sparkline-type-pie" data-sparkline-piesize="23px">' + (row.TotalMissingRecord - coolerDashboard.common.float(value)) + "," + coolerDashboard.common.float(value) +
						'</span>&nbsp;' + (row.TotalMissingRecord > 0 ? coolerDashboard.common.float(value) == 0 ? row.TotalHealthRecord : coolerDashboard.common.float(value) : 'N/A');
				}
			}],
			"sDom": "" + "t" + "<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
			"autoWidth": true,
			"preDrawCallback": function () {
				// Initialize the responsive datatables helper once.
				if (!responsiveHelper_dt_Health) {
					responsiveHelper_dt_Health = new ResponsiveDatatablesHelper($('#outletHealthGrid'), breakpointDefinition);
				}
			},
			"rowCallback": function (nRow) {
				responsiveHelper_dt_Health.createExpandIcon(nRow);
			},
			"drawCallback": function (oSettings) {
				responsiveHelper_dt_Health.respond();
				$('.sparkline-type-pie').sparkline('html', {
					type: 'pie'
				});
			}

		});

	$('#outletMovementGrid thead tr td').each(function () {
		var title = $(this).text();
		if (title != "") {
			$(this).html('<input type="text" class="form-control" placeholder="Search ' + title + '" />');
			attachFilterListener(this.id);
		}
	});

	var movementTable = $('#outletMovementGrid')
		.dataTable({
			ajax: {
				url: coolerDashboard.common.nodeUrl('smartDeviceMovement/list', movementGridParams),
				data: function (data, settings) {
					var searchFilters = $(".filterable");
					for (var i = 0, len = searchFilters.length; i < len; i++) {
						var searchElement = searchFilters[i];
						if (searchElement.dataset.grid == "outletMovementGrid") {
							var value = $(searchElement.childNodes[0]).val();
							if (value) {
								data['search_' + searchElement.dataset.column] = value;
							}
						}
					}
					data.fromOutletScreenDateFilter = true;
					data.startDate = startDate.format('YYYY-MM-DD[T00:00:00.000Z]');
					data.endDate = endDate.format('YYYY-MM-DD[T23:59:59.000Z]');
					//data.MovementTypeId = [170, 171, 82];
					return data;
				},
				method: 'POST'
			},
			order: [
				[0, "desc"]
			],
			processing: true,
			serverSide: true,
			select: true,
			columns: [{
				data: 'EventDate',
				render: coolerDashboard.common.dateTime
			}, {
				data: 'AssetSerialNumber',
				className: 'inline-link'
			}, {
				data: 'GatewaySerialNumber',
				orderable: false
			}, {
				data: 'MovementTypeId',
				render: coolerDashboard.renderers.movementType
			}, {
				data: 'SumOfMovementDuration',
				width: 60,
				className: 'dt-body-right',
			}],
			"sDom": "" + "t" + "<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
			"autoWidth": true,
			"preDrawCallback": function () {
				// Initialize the responsive datatables helper once.
				if (!responsiveHelper_dt_Movement) {
					responsiveHelper_dt_Movement = new ResponsiveDatatablesHelper($('#outletMovementGrid'), breakpointDefinition);
				}
			},
			"rowCallback": function (nRow) {
				responsiveHelper_dt_Movement.createExpandIcon(nRow);
			},
			"drawCallback": function (oSettings) {
				responsiveHelper_dt_Movement.respond();
			}

		});

	$('#outletGpsGrid thead tr td').each(function () {
		var title = $(this).text();
		if (title != "") {
			$(this).html('<input type="text" class="form-control" placeholder="Search ' + title + '" />');
			attachFilterListener(this.id);
		}
	});

	var gpsTable = $('#outletGpsGrid')
		.dataTable({
			ajax: {
				url: coolerDashboard.common.nodeUrl('smartDeviceMovement/list', gpsGridParams),
				method: 'POST',
				data: function (data, settings) {
					var searchFilters = $(".filterable");
					for (var i = 0, len = searchFilters.length; i < len; i++) {
						var searchElement = searchFilters[i];
						if (searchElement.dataset.grid == "outletGpsGrid") {
							var value = $(searchElement.childNodes[0]).val();
							if (value) {
								data['search_' + searchElement.dataset.column] = value;
							}
						}
					}
					data.fromOutletScreenDateFilter = true;
					data.startDate = startDate.format('YYYY-MM-DD[T00:00:00.000Z]');
					data.endDate = endDate.format('YYYY-MM-DD[T23:59:59.000Z]');
					return data;
				}
			},
			order: [
				[0, "desc"]
			],
			processing: true,
			serverSide: true,
			select: true,
			columns: [{
				data: 'EventDate',
				render: coolerDashboard.common.dateTime
			}, {
				data: 'AssetSerialNumber',
				className: 'inline-link'
			}, {
				data: 'GatewaySerialNumber',
				orderable: false
			}, {
				data: 'DisplacementInKm',
				width: 60,
				render: function (data, type, row) {
					return !isNaN(data) && data !== "" ? data.toFixed(2) + " KM" : "N/A";
				},
				className: 'dt-body-right',
			}, {
				data: 'Latitude',
				render: renderers.geo,
				"orderable": false
			}],
			"sDom": "" + "t" + "<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
			"autoWidth": true,
			"preDrawCallback": function () {
				// Initialize the responsive datatables helper once.
				if (!responsiveHelper_dt_GPS) {
					responsiveHelper_dt_GPS = new ResponsiveDatatablesHelper($('#outletGpsGrid'), breakpointDefinition);
				}
			},
			"rowCallback": function (nRow) {
				responsiveHelper_dt_GPS.createExpandIcon(nRow);
			},
			"drawCallback": function (oSettings) {
				responsiveHelper_dt_GPS.respond();
			}

		});

	var doorTable = $('#outletDoorGrid')
		.dataTable({
			ajax: {
				url: coolerDashboard.common.nodeUrl('smartDeviceDoor/list', baseParams),
				method: 'POST',
				data: function (data, settings) {
					data.fromOutletScreenDateFilter = true;
					data.startDate = startDate.format('YYYY-MM-DD[T00:00:00.000Z]');
					data.endDate = endDate.format('YYYY-MM-DD[T23:59:59.000Z]');
					return data;
				}
			},
			order: [
				[0, "desc"]
			],
			processing: true,
			serverSide: true,
			select: true,
			columns: [{
					data: 'EventDate',
					"orderable": false,
					render: function (data, type, row) {
						return coolerDashboard.common.dateWithFormat(data, '-', 'date')
					}
				},
				// {
				// 	data: 'AssetCapacity',
				// 	className: 'dt-body-right text-right',
				// 	"orderable": false
				// },
				{
					data: 'AssetCount',
					className: 'dt-body-right text-right',
					"orderable": false
				}, {
					data: 'TotalDoorOpen',
					className: 'dt-body-right text-right',
					"orderable": false
				}, {
					data: 'DoorDurationLessThen10',
					className: 'dt-body-right text-right',
					"orderable": false
				}, {
					data: 'DoorDurationBW10AND60',
					className: 'dt-body-right text-right',
					"orderable": false
				}, {
					data: 'DoorDurationBW60AND300',
					className: 'dt-body-right text-right',
					"orderable": false
				}, {
					data: 'DoorDurationMoreThen300',
					className: 'dt-body-right text-right',
					"orderable": false
				}
			],
			"sDom": "" + "t" + "<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
			"autoWidth": true,
			"preDrawCallback": function () {
				// Initialize the responsive datatables helper once.
				if (!responsiveHelper_dt_Door) {
					responsiveHelper_dt_Door = new ResponsiveDatatablesHelper($('#outletDoorGrid'), breakpointDefinition);
				}
			},
			"rowCallback": function (nRow) {
				responsiveHelper_dt_Door.createExpandIcon(nRow);
			},
			"drawCallback": function (oSettings) {
				responsiveHelper_dt_Door.respond();
			}

		});

	// $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
	// 	var target = $(e.target).attr("href") // activated tab
	// 	var text = $('#assetDetailScreenTabPanel').children().find('a[href= ' + target + ']').prop('innerText');
	// 	$(".breadcrumb").html("<li> Detailed view </li><li>" + text + "</li>");
	// });

	$('#outletAssetPlanogramGrid thead tr td').each(function () {
		var title = $(this).text();
		if (title != "") {
			$(this).html('<input type="text" class="form-control" placeholder="Search ' + title + '" />');
			attachFilterListener(this.id);
		}
	});

	var assetPlanogramTable = $('#outletAssetPlanogramGrid')
		.dataTable({
			ajax: {
				url: coolerDashboard.common.nodeUrl('assetPurityDayWise/list', baseParams),
				method: 'POST',
				data: function (data, settings) {
					var searchFilters = $(".filterable");
					for (var i = 0, len = searchFilters.length; i < len; i++) {
						var searchElement = searchFilters[i];
						if (searchElement.dataset.grid == "outletAssetPlanogramGrid") {
							var value = $(searchElement.childNodes[0]).val();
							if (value) {
								data['search_' + searchElement.dataset.column] = value;
							}
						}
					}
					data.fromOutletScreenDateFilter = true;
					data.startDate = startDate.format('YYYY-MM-DD[T00:00:00.000Z]');
					data.endDate = endDate.format('YYYY-MM-DD[T23:59:59.000Z]');
					return data;
				},
				dataSrc: function (json) {
					var toReturn = [];
					if (json.data) {
						var assetDetail = json.data[0] ? json.data[0].AssetDetails : [];
						var length = assetDetail.length;
						for (var i = 0; i < length; i++) {
							toReturn.push(assetDetail[i].PurityDetails[0])
						}
					}

					return toReturn;
				}
			},
			processing: true,
			serverSide: true,
			columns: [{
				"className": 'details-control',
				"orderable": false,
				"data": '',
				"defaultContent": '',
				width: 15,
				visible: false
			}, {
				data: 'AssetSerialNumber',
				"orderable": false,
				className: 'inline-link'
			}, {
				data: 'RelogramFacingSKU',
				"orderable": false,
				render: function (data, type, row) {
					if (row.PlanogramFacings != 0) {
						var EmptyFacingColor = row.RelogramFacingSKU < 15 ? "#00964C" : "red";
						return "<div><span class='ProductsCountText' style='background:" + EmptyFacingColor + "'>" + row.RelogramFacingSKU + " /  " + row.PlanogramFacings + "</span></div>";
					} else {
						return 'N/A';
					}
				},
				width: 100
			}, {
				data: 'TotalSkuOOS',
				"orderable": false,
				width: 90
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
				width: 100
			}, {
				data: 'TotalNCBProducts',
				"orderable": false,
				width: 100
			}, {
				data: 'Coca-cola-Facings',
				"orderable": false,
				render: function (data, type, row) {
					var records = row["Coca-cola-Facings"];
					var cocaColaFacingsPercentage = (row.CocaColaFacings * 100) / (row.PlanogramFacings);
					if (row.PlanogramFacings != 0) {
						return "<div><span class='ProductsCountText' style='background: #00964C'>" + row.CocaColaFacings + " /  " + cocaColaFacingsPercentage.toFixed(0) + "%</span></div>";
					} else {
						return '';
					}
				}
			}, {
				data: 'TotalForiegnFacing',
				render: function (data, type, row) {
					var foriegnFacingsPercentage = (row.ForeignProduct * 100) / (row.PlanogramFacings);
					var foriegnFacingColor = foriegnFacingsPercentage == 0 ? "#00964C" : foriegnFacingsPercentage >= 50 ? "orange" : "red";
					if (row.PlanogramFacings != 0) {
						return "<div><span class='ProductsCountText' style='background:" + foriegnFacingColor + "'>" + row.ForeignProduct + " /  " + foriegnFacingsPercentage.toFixed(0) + "%</span></div>";
					} else {
						return '';
					}
				}

			}, {
				data: 'EmptyFacing',
				width: 150,
				render: function (data, type, row) {
					if (row.PlanogramFacings != 0) {
						var emptyFacingsPercentage = (row.EmptyFacings * 100) / (row.PlanogramFacings);
						var EmptyFacingColor = emptyFacingsPercentage == 0 ? "#00964C" : emptyFacingsPercentage >= 50 ? "orange" : "red";
						return "<div><span class='ProductsCountText' style='background:" + EmptyFacingColor + "'>" + row.EmptyFacings + " /  " + emptyFacingsPercentage.toFixed(0) + "%</span></div>";
					} else {
						return '';
					}
				}
			}, {
				data: 'NumberOfComplaintFacing',
				width: 170,
				"orderable": false,
				render: function (data, type, row) {
					var complaintFacingPercentage = (row.NonCompliantFacingCount * 100) / (row.PlanogramFacings);
					var color = complaintFacingPercentage == 0 ? "#00964C" : complaintFacingPercentage >= 50 ? "orange" : "red";
					if (row.PlanogramFacings != 0) {
						return "<div><span class='ProductsCountText' style='background:" + color + "'>" + row.NonCompliantFacingCount + " /  " + complaintFacingPercentage.toFixed(0) + "%</span></div>";
					} else {
						return '';
					}
				}
			}, {
				data: 'PurityPercentage',
				"orderable": false,
				width: 90,
				render: function (data, type, row) {
					if (row.PlanogramFacings != 0) {
						return row.PurityPercentage;
					} else {
						return 0;
					}
				}
			}],
			"sDom": "" + "t" + "<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",

			"autoWidth": true,
			"width": "100%",
			//"sScrollXInner": "1500px",
			"sScrollX": "100%",
			"bScrollCollapse": true,
			"preDrawCallback": function () {
				// Initialize the responsive datatables helper once.
				if (!responsiveHelper_dt_AssetPlanogram) {
					responsiveHelper_dt_AssetPlanogram = new ResponsiveDatatablesHelper($('#outletAssetPlanogramGrid'), breakpointDefinition);
				}
			},
			"rowCallback": function (nRow) {
				responsiveHelper_dt_AssetPlanogram.createExpandIcon(nRow);
			},
			"drawCallback": function (oSettings) {
				responsiveHelper_dt_AssetPlanogram.respond();
			}

		});

	gridUtils.addChildGridHandler({
		gridId: '#outletAssetPlanogramGrid',
		renderer: function (d) {
			return gridUtils.createDetailTableForPlanogram({
				items: [{
					label: '',
					value: d
				}]
			});
		}
	});

	$('#outletPurityGrid thead tr td').each(function () {
		var title = $(this).text();
		if (title != "") {
			$(this).html('<input type="text" class="form-control" placeholder="Search ' + title + '" />');
			attachFilterListener(this.id);
		}
	});

	var planogramTable = $('#outletPurityGrid');
	if (planogramTable) {
		planogramTable.dataTable({
			ajax: {
				url: coolerDashboard.common.nodeUrl('assetPurity/list', baseParams),
				method: 'POST',
				data: function (data, settings) {
					var searchFilters = $(".filterable");
					for (var i = 0, len = searchFilters.length; i < len; i++) {
						var searchElement = searchFilters[i];
						if (searchElement.dataset.grid == "outletPurityGrid") {
							var value = $(searchElement.childNodes[0]).val();
							if (value) {
								data['search_' + searchElement.dataset.column] = value;
							}
						}
					}
					data.fromOutletScreenDateFilter = true;
					data.startDate = startDate.format('YYYY-MM-DD[T00:00:00.000Z]');
					data.endDate = endDate.format('YYYY-MM-DD[T23:59:59.000Z]');
					return data;
				},
			},
			processing: true,
			serverSide: true,
			columns: [{
				data: 'Date',

				"orderable": false,
				render: function (data, type, row) {
					return coolerDashboard.common.dateWithFormat(data, '-', 'date')
				},
				width: 40,
			}, {
				data: 'AssetSerialNumber'
			}, {
				data: '',
				"orderable": false,
				render: coolerDashboard.common.purityImageRenderer
			}],
			order: [
				[0, "desc"]
			],
			"sDom": "" + "t" + "<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",

			"autoWidth": true,
			"bPaginate": true,
			"preDrawCallback": function () {
				// Initialize the responsive datatables helper once.
				if (!responsiveHelper_dt_AssetPurity) {
					responsiveHelper_dt_AssetPurity = new ResponsiveDatatablesHelper($('#outletPurityGrid'), breakpointDefinition);
				}
			},
			"rowCallback": function (nRow) {
				responsiveHelper_dt_AssetPurity.createExpandIcon(nRow);
			},
			"drawCallback": function (oSettings) {
				responsiveHelper_dt_AssetPurity.respond();
			}

		});
	}
	$('#outletGpsGrid').on('click', 'tbody td.inline-link', function (e) {
		var dt = gpsTable.DataTable();
		var rowIndex = dt.row(this)[0][0];
		if (rowIndex < 0) {
			return;
		}
		var data = dt.data();
		var rowData = data[rowIndex];
		var assetId = rowData.Id;
		var startDate = moment(rowData.StartTime);
		var endDate = startDate;
		if (startDate.isValid() && endDate.isValid()) {
			var assetId = rowData.AssetId;
			var assetLatitude = rowData.Latitude;
			var assetLongitude = rowData.Longitude;
			movementFilter = {
				'startDate': startDate.format(),
				'endDate': endDate.format(),
				'assetId': assetId,
				'assetLatitude': assetLatitude,
				'assetLongitude': assetLongitude
			};
			gpsGridSelected = true;
		}
	});

	var responsiveHelper_dt_basic2 = undefined;
	var otable2 = $('#missingSkuGrid').dataTable({
		ajax: {
			url: './js/ajax/coolerStatus.txt',
			dataSrc: 'data.activitiesTrade',
			serverSide: true
		},
		"bPaginate": true,
		"bFilter": false,
		"bSort": false,
		"bInfo": false,
		processing: true,
		serverSide: false,
		columns: [{
				data: 'SerialNumber',
				className: 'inline-link'
			},
			{
				data: 'ProductId',
				render: function (value) {
					if (value) {
						var productImage = coolerDashboard.getUrl('/products/thumbnails/' + value + '.png');
						var noProductImage = coolerDashboard.getUrl('/products/imageNotFound.png');
						return "<div class='ProductsImage'><div><img src='" + productImage + "' style='width: 35px; height: auto;' /></div></div>"
					} else {
						return ''
					}
				}
			},
			{
				data: 'Product',
				className: 'inline-link'
			},
			{
				data: 'PackagingType',
				className: 'inline-link'
			},
			{
				data: 'BrandName',
				className: 'inline-link'
			},
			{
				data: 'OOSCount',
				className: 'inline-link'
			}
		],
		"scrollX": true,
		"sDom": "<'dt-toolbar'<'col-xs-12 col-sm-6'f>r>" +
			"t" +
			"<'dt-toolbar-footer'<'col-sm-4 col-xs-12 hidden-xs'i><'col-sm-4 col-xs-6 hidden-xs'l><'col-xs-12 col-sm-4'p>>",
		"autoWidth": true,
		"oLanguage": {
			"sSearch": '<span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span>'
		},
		"preDrawCallback": function () {
			// Initialize the responsive datatables helper once.
			if (!responsiveHelper_dt_basic2) {
				responsiveHelper_dt_basic2 = new ResponsiveDatatablesHelper($('#missingSkuGrid'), breakpointDefinition);
			}
		},
		"rowCallback": function (nRow) {
			responsiveHelper_dt_basic2.createExpandIcon(nRow);
		},
		"drawCallback": function (oSettings) {
			responsiveHelper_dt_basic2.respond();
		}
	});
}


function getChartFilteredData(assetId, chartTypeId, planogramId, startDate, endDate, isMulti) {
	if (isMulti == false) {
		var assetIds = assetId != 0 ? assetId : outletAssetId.map(function (obj) {
			return obj.assetId;
		});
		var selectedRecord = assetId != 0 ? outletAssetId.filter(function (obj) {
			return obj.assetId == assetId
		})[0] : outletAssetId[0];

		if (assetId == 0) {
			$('#outletChartHeader').html(assetId != 0 ? selectedRecord.location + ' (' + selectedRecord.serialNumber + ')' : selectedRecord.location + ' (No Assets)');
		} else {
			$('#outletChartHeader').html(assetId != 0 ? selectedRecord.location + ' (' + selectedRecord.serialNumber + ')' : selectedRecord.location + ' (All Assets)');
		}


		var planogramIds = planogramId != 0 ? planogramId : assetId != 0 ? 0 : chartAlertParams.map(function (obj) {
			return obj.planogramId;
		});

		// if (assetId == 0) {
		// 	loadOutletOverview({
		// 		'startDate': startDate.format('YYYY-MM-DD[T00:00:00.000Z]'),
		// 		'assetId': assetIds,
		// 		'endDate': endDate.format('YYYY-MM-DD[T23:59:59.000Z]'),
		// 		'startDateWithNoTZ': startDate.format('YYYY-MM-DD[T00:00:00.000Z]'),
		// 		'assetDetails': planogramIds
		// 	});
		// }
		if (assetId == 0) {
			loadChart({
				'startDate': startDate.format('YYYY-MM-DD[T00:00:00.000Z]'),
				'assetId': 0,
				'interval': "day",
				'isFromOutlet': true,
				'chartTypeId': chartTypeId,
				'endDate': endDate.format('YYYY-MM-DD[T23:59:59.000Z]'),
				'assetDetails': 0
			});
		} else {
			loadChart({
				'startDate': startDate.format('YYYY-MM-DD[T00:00:00.000Z]'),
				'assetId': assetIds,
				'interval': "day",
				'isFromOutlet': true,
				'chartTypeId': chartTypeId,
				'endDate': endDate.format('YYYY-MM-DD[T23:59:59.000Z]'),
				'assetDetails': planogramIds
			});
		}


	} else {

		var selectedRecord = assetId.length != 0 ? outletAssetId.filter(function (obj) {
			return obj.assetId == assetId[0]
		})[0] : outletAssetId[0];

		var serialNumber = '';
		outletAssetId.forEach(function (outletElement) {
			assetId.forEach(function (element) {
				if (outletElement.assetId == element)
					if (serialNumber == '')
						serialNumber += outletElement.serialNumber;
					else
						serialNumber += ',' + outletElement.serialNumber;

			}, this);
		}, this);

		$('#outletChartHeader').html(assetId.length != 0 ? selectedRecord.location + ' (' + serialNumber + ')' : selectedRecord.location + ' (All Assets)');

		loadChart({
			'startDate': startDate.format('YYYY-MM-DD[T00:00:00.000Z]'),
			'assetId': assetId,
			'interval': "day",
			'isFromOutlet': true,
			'chartTypeId': chartTypeId,
			'endDate': endDate.format('YYYY-MM-DD[T23:59:59.000Z]'),
			'assetDetails': planogramId
		});
	}
}

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

function getOutletData() {
	var hash = window.location.hash;
	var locationCode = hash.split('/')[1];


	$('#locationCode').html(locationCode);

	outletAssetId = [];
	chartAlertParams = [];

	// if (jQuery.isEmptyObject(this.filterValuesChart)) {
	// 	startDate = moment().subtract(1, 'months').startOf('month');
	// 	endDate = moment().subtract(1, 'months').endOf('month');
	// }
	startDate = moment().subtract(7, 'days');
	endDate = moment();

	$('#reportrangeOutlet span').html(startDate.format(coolerDashboard.dateFormat) + ' - ' + endDate.format(coolerDashboard.dateFormat));

	var priorityTypeCombo = $('.priorityTypeCombo');
	var Priority = [];
	Priority.push({
		LookupId: 4227,
		DisplayValue: 'High'
	});
	Priority.push({
		LookupId: 4226,
		DisplayValue: 'Medium'
	});
	Priority.push({
		LookupId: 4225,
		DisplayValue: 'Low'
	});

	coolerDashboard.common.addSelectData(priorityTypeCombo, Priority, '');

	var outletFilter = {
		'start': 0,
		'limit': 100,
		'search_LocationCode': locationCode
	};

	var outletFilterLocation = {
		'start': 0,
		'limit': 100,
		'LocationId': -1,
		'startDate': startDate.format('YYYY-MM-DD[T00:00:00.000Z]'),
		'endDate': endDate.format('YYYY-MM-DD[T23:59:59.000Z]')
	};

	function cb(start, end) {
		$('#reportrangeOutlet span').html(start.format(coolerDashboard.dateFormat) + ' - ' + end.format(coolerDashboard.dateFormat));
		startDate = start;
		endDate = end;
		getChartFilteredData(0, 0, 0, startDate, endDate, false);

		$('#outletAlertGrid').DataTable().ajax.reload();
		$('#outletVisitGrid').DataTable().ajax.reload();
		$('#outletHealthGrid').DataTable().ajax.reload();
		$('#outletMovementGrid').DataTable().ajax.reload();
		$('#outletGpsGrid').DataTable().ajax.reload();
		$('#outletDoorGrid').DataTable().ajax.reload();
		$('#outletAssetPlanogramGrid').DataTable().ajax.reload();
		$('#outletPurityGrid').DataTable().ajax.reload();
	}

	$('#reportrangeOutlet').daterangepicker({
		startDate: startDate,
		endDate: endDate,
		changeYear: true,
		"autoApply": false,
		"maxDate": moment(),
		"showDropdowns": true,
		"showISOWeekNumbers": true,
		ranges: {
			'Today': [moment(), moment()],
			'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
			'Last 7 Days': [moment().subtract(6, 'days'), moment()],
			'Last 30 Days': [moment().subtract(29, 'days'), moment()],
			'Last 90 Days': [moment().subtract(89, 'days'), moment()],
			'This Month': [moment().startOf('month'), moment().endOf('month')],
			'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
		}
	}, cb);
	coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');

	$.ajax({
		url: coolerDashboard.common.nodeUrl('outlet/list', outletFilter),
		type: 'GET',
		success: function (result, data) {

			var data = result.data;
			var length = result.data.length;
			var locationId = -1;
			for (var i = 0; i < length; i++) {
				result.data = _.filter(data, function (locationData) {
					return locationData.LocationCode.toLocaleLowerCase() == locationCode;
				});

				if (result.data.length > 0) {
					locationId = result.data[0].LocationId;
				}
			}


			if (locationId == -1) {
				coolerDashboard.gridUtils.ajaxIndicatorStopForce();
				// $.SmartMessageBox({
				// 	title: "No Data Found",
				// 	content: "Outlet has no smart devices.",
				// 	buttons: '[Back to Home Screen]'
				// }, function (ButtonPressed) {

				// 	if (ButtonPressed === "Back to Home Screen") {

				// 		window.location.hash = 'CoolerPerformance';

				// 	}

				// });

				window.location.hash = 'NoDataFound';

			}
			outletFilterLocation.LocationId = locationId;
			LocationId = locationId;
			loadHeaderInfo({
				'LocationId': outletFilterLocation.LocationId
			});
			$.ajax({
				url: coolerDashboard.common.nodeUrl('loadLastDataInfo', outletFilterLocation),
				type: 'GET',
				success: function (result, data) {
					coolerDashboard.gridUtils.ajaxIndicatorStop();
					if (result.data && result.data.length > 0) {
						var overviewData = [];
						result.data.forEach(function (data) {
							overviewData.push([
								data.SerialNumber, coolerDashboard.common.dateTime(data.LastPing), coolerDashboard.common.dateTime(data.LatestScanTime), coolerDashboard.common.dateTime(data.LatestDoorTime), data.Door_TodayCount, coolerDashboard.common.dateTime(data.VerifiedOn)
							]);
							chartAlertParams.push({
								assetId: data.Id,
								planogramId: data.PlanogramId
							});
							outletAssetId.push({
								assetId: data.Id,
								location: data.Location,
								serialNumber: data.SerialNumber,
								isPowerOn: data.IsPowerOn,
								temperature: data.Temperature,
								lightIntensity: data.LightIntensity,
								todayDoorCount: data.Door_TodayCount,
								warrantyExpiry: data.WarrantyExpiry,
								lastPing: coolerDashboard.common.dateTime(data.LastPing),
								latestScanTime: coolerDashboard.common.dateTime(data.LatestScanTime),
								latestDoorTime: coolerDashboard.common.dateTime(data.LatestDoorTime),
								door_TodayCount: data.Door_TodayCount,
								verifiedOn: coolerDashboard.common.dateTimeZone(data.VerifiedOn, '-', coolerDashboard.dateTimeFormat, false, data.TimeZoneId),
								door_7dayCount: data.Door_7dayCount,
								door_30dayCount: data.Door_30dayCount,
								SmartDeviceTypeId: data.SmartDeviceTypeId,
								SmartDeviceType: data.SmartDeviceType,
								TotalEmptyFacings: data.TotalEmptyFacings,
								TotalFacings: data.TotalFacings,
								PlanogramCompliance: data.PlanogramCompliance,
								PurityPercentage: data.PurityPercentage,
								TotalNCBProducts: data.TotalNCBProducts,
								TotalSSDProducts: data.TotalSSDProducts,
								isSmart: data.SmartDeviceSerialNumber == "" ? false : true,
								LatestHealthRecordDate: coolerDashboard.common.dateTime(data.LatestHealthRecordTime, '-', coolerDashboard.dateTimeFormat, false, data.TimeZoneId),
								PurityDateTime: data.PurityDateTime,
								StoredFilename: data.StoredFilename,
								ImageCount: data.ImageCount

							});
						});
						var firstRecord = result.data[0];

						markOutletAssetData(result.data, firstRecord);
						var assetIds = outletAssetId.map(function (obj) {
							return obj.assetId;
						});
						var planogramIds = chartAlertParams.map(function (obj) {
							return obj.planogramId;
						});
						$('#outletChartHeader').html(firstRecord.Location + ' (All Assets)');
						loadOutletOverview({
							'startDate': moment().subtract(6, "days").format('YYYY-MM-DD[T00:00:00.000Z]'),
							'assetId': assetIds,
							'endDate': moment().format('YYYY-MM-DD[T23:59:59.000Z]'),
							'startDateWithNoTZ': moment().subtract(6, "days").format('YYYY-MM-DD[T00:00:00.000Z]'),
							'assetDetails': planogramIds
						});
						loadChart({
							'startDate': moment().subtract(6, "days").format('YYYY-MM-DD[T00:00:00.000Z]'),
							'assetId': assetIds,
							'interval': "day",
							'isFromOutlet': true,
							'chartTypeId': 0,
							'endDate': moment().format('YYYY-MM-DD[T23:59:59.000Z]'),
							'assetDetails': planogramIds
						});
					}
				},
				failure: function () {
					coolerDashboard.gridUtils.ajaxIndicatorStop();
					alert('Error: Some error occured. Please try later.');
				}
			});
		},
		failure: function () {
			coolerDashboard.gridUtils.ajaxIndicatorStop();
			alert('Error: Some error occured. Please try later.');
		}
	});

	$("#assetAlertStatusCheck").click(function () {
		var alertTable = $('#outletAlertGrid').DataTable();
		var url = alertTable.ajax.url();
		alertTable.ajax.url(url).load();
	});

	$('#outletAssetPlanogramGrid').on('click', 'tbody td.inline-link', function (e) {
		var dt = $('#outletAssetPlanogramGrid').DataTable();
		var rowIndex = dt.row(this)[0][0];
		if (rowIndex < 0) {
			return;
		}
		var data = dt.data();
		var column = dt.columns($(this).index()).header()[0].innerText;
		//var gridId = e.delegateTarget.id;
		var rowData = data[rowIndex];
		if (column == "Serial Number") {
			var serialNumber = rowData.AssetSerialNumber;
			serialNumber = serialNumber.toLowerCase();
			// window.location.hash = 'assetDetails/' + serialNumber;
			window.open(window.location.pathname + '#assetDetails/' + serialNumber);
		}

	});

	$('#outletAlertGrid').on('click', 'tbody td.inline-link', function (e) {
		var dt = $('#outletAlertGrid').DataTable();
		var rowIndex = dt.row(this)[0][0];
		if (rowIndex < 0) {
			return;
		}
		var data = dt.data();
		var column = dt.columns($(this).index()).header()[0].innerText;
		//var gridId = e.delegateTarget.id;
		var rowData = data[rowIndex];
		if (column == "Serial Number") {
			var serialNumber = rowData.AssetSerialNumber;
			serialNumber = serialNumber.toLowerCase();
			//window.location.hash = 'assetDetails/' + serialNumber;
			window.open(window.location.pathname + '#assetDetails/' + serialNumber);
		}

	});

	$('#outletVisitGrid').on('click', 'tbody td.inline-link', function (e) {
		var dt = $('#outletVisitGrid').DataTable();
		var rowIndex = dt.row(this)[0][0];
		if (rowIndex < 0) {
			return;
		}
		var data = dt.data();
		var column = dt.columns($(this).index()).header()[0].innerText;
		//var gridId = e.delegateTarget.id;
		var rowData = data[rowIndex];
		if (column == "Serial Number") {
			var serialNumber = rowData.AssetSerialNumber;
			serialNumber = serialNumber.toLowerCase();
			//window.location.hash = 'assetDetails/' + serialNumber;
			window.open(window.location.pathname + '#assetDetails/' + serialNumber);
		}

	});

	$('#outletGpsGrid').on('click', 'tbody td.inline-link', function (e) {
		var dt = $('#outletGpsGrid').DataTable();
		var rowIndex = dt.row(this)[0][0];
		if (rowIndex < 0) {
			return;
		}
		var data = dt.data();
		var column = dt.columns($(this).index()).header()[0].innerText;
		//var gridId = e.delegateTarget.id;
		var rowData = data[rowIndex];
		if (column == "Serial Number") {
			var serialNumber = rowData.AssetSerialNumber;
			serialNumber = serialNumber.toLowerCase();
			//window.location.hash = 'assetDetails/' + serialNumber;
			window.open(window.location.pathname + '#assetDetails/' + serialNumber);
		}

	});

	$('#outletMovementGrid').on('click', 'tbody td.inline-link', function (e) {
		var dt = $('#outletMovementGrid').DataTable();
		var rowIndex = dt.row(this)[0][0];
		if (rowIndex < 0) {
			return;
		}
		var data = dt.data();
		var column = dt.columns($(this).index()).header()[0].innerText;
		//var gridId = e.delegateTarget.id;
		var rowData = data[rowIndex];
		if (column == "Serial Number") {
			var serialNumber = rowData.AssetSerialNumber;
			serialNumber = serialNumber.toLowerCase();
			//window.location.hash = 'assetDetails/' + serialNumber;
			window.open(window.location.pathname + '#assetDetails/' + serialNumber);
		}

	});

	$('#outletPurityGrid').on('click', 'tbody td.inline-link', function (e) {
		var dt = $('#outletPurityGrid').DataTable();
		var rowIndex = dt.row(this)[0][0];
		if (rowIndex < 0) {
			return;
		}
		var data = dt.data();
		var column = dt.columns($(this).index()).header()[0].innerText;
		//var gridId = e.delegateTarget.id;
		var rowData = data[rowIndex];
		if (column == "Serial Number") {
			var serialNumber = rowData.AssetSerialNumber;
			serialNumber = serialNumber.toLowerCase();
			//window.location.hash = 'assetDetails/' + serialNumber;
			window.open(window.location.pathname + '#assetDetails/' + serialNumber);
		}

	});
	//var start, end;
	$("#chartReset").click(function () {
		//	start = moment().subtract(1, 'months').startOf('month');
		//	end = moment().subtract(1, 'months').endOf('month');

		var start = moment().subtract(7, 'days');
		var end = moment();

		cb(start, end);

		$('#reportrangeOutlet').daterangepicker({
			startDate: start,
			endDate: end,
			changeYear: true,
			"autoApply": false,
			"maxDate": moment(),
			"showDropdowns": true,
			"showISOWeekNumbers": true,
			ranges: {
				'Today': [moment(), moment()],
				'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
				'Last 7 Days': [moment().subtract(6, 'days'), moment()],
				'Last 30 Days': [moment().subtract(29, 'days'), moment()],
				'Last 90 Days': [moment().subtract(89, 'days'), moment()],
				'This Month': [moment().startOf('month'), moment().endOf('month')],
				'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
			}
		}, cb);

		var table = $('#outletAlertGrid').DataTable();
		var url = table.ajax.url();
		if (url.indexOf('&assetId') >= 0) {
			url = url.substring(0, url.indexOf('&assetId'));
		}
		table.ajax.url(url).load();

		var table = $('#outletHealthGrid').DataTable();
		var url = table.ajax.url();
		if (url.indexOf('&AssetId') >= 0) {
			url = url.substring(0, url.indexOf('&AssetId'));
		}
		table.ajax.url(url).load();

		var table = $('#outletMovementGrid').DataTable();
		var url = table.ajax.url();
		if (url.indexOf('&AssetId') >= 0) {
			url = url.substring(0, url.indexOf('&AssetId'));
		}
		table.ajax.url(url).load();

		var table = $('#outletGpsGrid').DataTable();
		var url = table.ajax.url();
		if (url.indexOf('&assetId') >= 0) {
			url = url.substring(0, url.indexOf('&assetId'));
		}
		table.ajax.url(url).load();

		var table = $('#outletDoorGrid').DataTable();
		var url = table.ajax.url();
		if (url.indexOf('&AssetId') >= 0) {
			url = url.substring(0, url.indexOf('&AssetId'));
		}
		table.ajax.url(url).load();

		var table = $('#outletAssetPlanogramGrid').DataTable();
		var url = table.ajax.url();
		if (url.indexOf('&assetId') >= 0) {
			url = url.substring(0, url.indexOf('&assetId'));
		}
		table.ajax.url(url).load();

		var table = $('#outletPurityGrid').DataTable();
		var url = table.ajax.url();
		if (url.indexOf('&assetId') >= 0) {
			url = url.substring(0, url.indexOf('&assetId'));
		}
		table.ajax.url(url).load();




		$('#missingSkuGrid').dataTable().fnAddData(missingProduct);

	});

	$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
		var target = $(e.target).attr("href") // activated tab
		if (target == "#s3") {
			$('#outletHealthGrid').dataTable().fnDraw();
		}

		if (target == "#s1") {
			openedGrid = 6;
		} else if (target == "#s3") {
			openedGrid = 1;
		} else if (target == "#s4") {
			openedGrid = 7;
		} else if (target == "#s5") {
			openedGrid = 8;
		} else if (target == "#s6") {
			openedGrid = 4;
		} else if (target == "#s7") {
			openedGrid = 9;
		} else if (target == "#s8") {
			openedGrid = 10;
		} else if (target == "#s9") {
			openedGrid = 5;
		}
	});

	$(".priorityTypeCombo").change(function () {
		$('#outletAlertGrid').DataTable().ajax.reload();
	});

	$("#filterPriorityReset").bind("click", function () {
		$(".priorityTypeCombo")[0].selectedIndex = 0;
		$('#outletAlertGrid').DataTable().ajax.reload();
	});
}
getOutletData();