if ($.fn.dataTable) {
	$.fn.dataTable.ext.errMode = 'none';
}

var coolerDashboard = coolerDashboard || {};
//coolerDashboard.dateFormat = 'YYYY/MM/DD';
coolerDashboard.timeFormat = 'HH:MM';
coolerDashboard.dateFormat = 'DD MMM, Y';
coolerDashboard.dateTimeFormat = 'DD MMM, Y hh:mm:ss';
coolerDashboard.pageSize = 20;
//coolerDashboard.dateTimeFormat = "m/d/Y h:i:s";
coolerDashboard.ajaxCounter = 0;
coolerDashboard.preferences = [];
coolerDashboard.isFilterChanged = false;
coolerDashboard.isNavigationChanged = false;
var timeZoneData = []
var filterValuesChart = {};
var AppliedFilterArray = [];
var pagerelod = false;
var IsPerferencePageChange = true;
var perferneceuniqueid = 0;
var checklogintime = true;
var deletedFilterIds = [];
var defaultLayoutItems = [];

var tableIR;
var trIR;
var rowIR;

var mapStyles = [{
		"elementType": "geometry",
		"stylers": [{
			"color": "#f5f5f5"
		}]
	},
	{
		"elementType": "labels.icon",
		"stylers": [{
			"visibility": "off"
		}]
	},
	{
		"elementType": "labels.text.fill",
		"stylers": [{
			"color": "#616161"
		}]
	},
	{
		"elementType": "labels.text.stroke",
		"stylers": [{
			"color": "#f5f5f5"
		}]
	},
	{
		"featureType": "administrative.land_parcel",
		"elementType": "labels.text.fill",
		"stylers": [{
			"color": "#bdbdbd"
		}]
	},
	{
		"featureType": "poi",
		"elementType": "geometry",
		"stylers": [{
			"color": "#eeeeee"
		}]
	},
	{
		"featureType": "poi",
		"elementType": "labels.text.fill",
		"stylers": [{
			"color": "#757575"
		}]
	},
	{
		"featureType": "poi.park",
		"elementType": "geometry",
		"stylers": [{
			"color": "#e5e5e5"
		}]
	},
	{
		"featureType": "poi.park",
		"elementType": "labels.text.fill",
		"stylers": [{
			"color": "#9e9e9e"
		}]
	},
	{
		"featureType": "road",
		"elementType": "geometry",
		"stylers": [{
			"color": "#ffffff"
		}]
	},
	{
		"featureType": "road.arterial",
		"elementType": "labels.text.fill",
		"stylers": [{
			"color": "#757575"
		}]
	},
	{
		"featureType": "road.highway",
		"elementType": "geometry",
		"stylers": [{
			"color": "#dadada"
		}]
	},
	{
		"featureType": "road.highway",
		"elementType": "labels.text.fill",
		"stylers": [{
			"color": "#616161"
		}]
	},
	{
		"featureType": "road.local",
		"elementType": "labels.text.fill",
		"stylers": [{
			"color": "#9e9e9e"
		}]
	},
	{
		"featureType": "transit.line",
		"elementType": "geometry",
		"stylers": [{
			"color": "#e5e5e5"
		}]
	},
	{
		"featureType": "transit.station",
		"elementType": "geometry",
		"stylers": [{
			"color": "#eeeeee"
		}]
	},
	{
		"featureType": "water",
		"elementType": "geometry",
		"stylers": [{
			"color": "#c9c9c9"
		}]
	},
	{
		"featureType": "water",
		"elementType": "labels.text.fill",
		"stylers": [{
			"color": "#9e9e9e"
		}]
	}
]

coolerDashboard.getUrl = function (img) {
	var url = "";
	if (!img) {
		img = "";
	}
	var address = location.href.split('/');
	if (location.href.indexOf('3000') > 0) {
		url = _.filter(address, function (data) {
			return data.indexOf('3000') >= 0
		})[0];

		//url = "localhost/CoolerAzure/";
		url = "portal.ebest-iot.com";

	} else {
		url = _.filter(address, function (data) {
			return data.indexOf('dashboard') >= 0
		})[0];
		if (url.search('cch-dashboard') == -1) {
			url = url.replace('dashboard', 'portal');
		} else {
			url = url.replace('cch-dashboard', 'portal');
		}


		if (url.search('portal-demo') != -1) {
			url = url.replace('portal-demo', 'portal');
		}
	}
	return String.format('{0}{1}{2}', location.protocol + '//', url, img)
};

coolerDashboard.gridUtils = {
	joinStrings: function () {
		var values = [],
			args = arguments,
			separator = args.length < 2 ? '' : args[0];
		for (var i = args.length < 2 ? 0 : 1, len = args.length; i < len; i++) {
			var value = args[i];
			if (value !== null && value !== undefined && value.length > 0) {
				values.push(value);
			}
		}
		if (values.length === 0) {
			return '';
		}
		return values.join(separator);
	},

	createDetailTable: function (config) {
		var items = config.items,
			rows = [],
			data = config.data;
		for (var i = 0, len = items.length; i < len; i++) {
			var item = items[i],
				value = item.value;
			if (typeof value === 'function') {
				value = value(data);
			}
			rows.push('<tr>');
			rows.push('<td>' + item.label + '</td>');
			rows.push('<td>' + value + '</td>');
			rows.push('</tr>');
		}
		return '<table class="table table-striped table-hover table-condensed">' +
			rows.join('') +
			'</table>';
	},
	createDetailTableForRecognitionReport: function (config) {
		var items = config.items,
			rows = [],
			data = config.data;
		for (var i = 0, len = items.length; i < len; i++) {
			var item = items[i],
				value = item.value;
			if (typeof value === 'function') {
				value = value(data);
			}
			rows.push('<tr>');
			rows.push('<td width="30%">' + item.label + '</td>');
			rows.push('<td width="70%">' + value + '</td>');
			rows.push('</tr>');
		}
		return '<table class="table table-striped table-hover table-condensed">' +
			rows.join('') +
			'</table>';
	},

	createDetailTableForPlanogram: function (config) {
		var items = config.items,
			rows = [],
			data = config.data;
		for (var i = 0, len = items.length; i < len; i++) {
			var item = items[i],
				value = item.value;
			var records = coolerDashboard.common.cleanArray(value["CocaColaProductDetails"]);
			records.sort(function compare(currentRecord, nextRecord) {
				if (currentRecord) {
					if (currentRecord.Order < nextRecord.Order)
						return -1;
					if (currentRecord.Order > nextRecord.Order)
						return 1;
					return 0;
				}
			});
			var recordLength = records.length;
			var returnHtml = [];
			for (var j = 0; j < recordLength; j++) {
				var record = records[j];
				if (record) {
					var productImage = coolerDashboard.getUrl('/products/thumbnails/' + record.ProductId + '.png');
					var percentage = record.PlanogramCount == 0 ? 0 : ((record.ProductCount / record.PlanogramCount) * 100).toFixed(0);
					rows.push("<tr>");
					rows.push("<td><div class='ProductsImage'><div><img src='" + productImage + "' style='width: 35px; height: auto;' /></div></div></td>");
					rows.push("<td>" + record.ProductName + "</td>");
					rows.push("<td>" + record.PlanogramCount + "</td>");
					if (record.ProductCount == 0) {
						rows.push("<td><span class='ProductsCountText' style='background:red'>" + record.ProductCount + "</span></td>");
					} else {
						rows.push("<td>" + record.ProductCount + "</td>");
					}
					if (record.PlanogramCount > 0 && record.ProductCount == 0) {
						rows.push("<td><span class='ProductsCountText' style='background:red'>OOS</span></td>");
					} else {
						rows.push("<td></td>");
					}
					rows.push("<td>" + record.IsSSD + '/' + record.IsNCB + "</td>");
					rows.push("</tr>");
				}
			}
		}
		if (rows.join('') == "") {
			return '<div align="middle"><h6>No Data Is To Be Displayed<h6></div>';
		} else {
			return '<table class="table table-striped table-hover table-condensed">' +
				'<th>' +
				'<tr>' +
				'<th>Product</th>' +
				'<th>Name</th>' +
				'<th>Planogram Facings</th>' +
				'<th>Realogram Facings</th>' +
				'<th>OOS</th>' +
				'<th>SSD/NCB</th>' +
				'</tr>' +
				'</th>' +
				'<tbody>' +
				rows.join('') +
				'</tbody>' +
				'</table>';
		}
	},

	createDetailTableForIRAsset: function (config) {
		var items = config.items,
			rows = [];
		for (var i = 0, len = items.length; i < len; i++) {
			var item = items[i],
				value = item.value;
			var assetPurityBestResult = item.value && item.value.assetPurityBestResult ? item.value.assetPurityBestResult : [];
			var assetPurityAvailableBestResult = item.value && item.value.assetPurityAvailableBestResult ? item.value.assetPurityAvailableBestResult : [];
			var assetPurityMissingBestResult = item.value && item.value.assetPurityMissingBestResult ? item.value.assetPurityMissingBestResult : [];

			var assetPurityLatestResult = item.value && item.value.assetPurityLatestResult ? item.value.assetPurityLatestResult : [];
			var assetPurityAvailableLatestResult = item.value && item.value.assetPurityAvailableLatestResult ? item.value.assetPurityAvailableLatestResult : [];
			var assetPurityMissinglatestResult = item.value && item.value.assetPurityMissingLatestResult ? item.value.assetPurityMissingLatestResult : [];

			var records = coolerDashboard.common.cleanArray(assetPurityBestResult);
			var recordsAvailableBest = coolerDashboard.common.cleanArray(assetPurityAvailableBestResult);
			var recordsMissingBest = coolerDashboard.common.cleanArray(assetPurityMissingBestResult);

			var recordsLatest = coolerDashboard.common.cleanArray(assetPurityLatestResult);
			var recordsAvailableLatest = coolerDashboard.common.cleanArray(assetPurityAvailableLatestResult);
			var recordsMissingLatest = coolerDashboard.common.cleanArray(assetPurityMissinglatestResult);
			var imagesBest = [];
			var recordLength = records.length;
			for (var j = 0; j < recordLength; j++) {
				var record = records[j];
				if (record) {
					var formatPurityDateTime = new Date(record.PurityDateTime);
					var imagePurityDateTime = moment(record.PurityDateTime).format('YYYY-MM-DD');
					var imagePurityDate = imagePurityDateTime.replace(/-/g, '');
					//var productImage = coolerDashboard.getUrl('/Controllers/CoolerImagePreview.ashx?AssetImageName=' + record.Filename + '&ImageId=' + record.AssetPurityId + '&v=' + formatPurityDateTime + '&PurityDateTime=' + imagePurityDate);
					var OccupancyEarnedMoney = record.OccupancyEarnedMoney || record.OccupancyEarnedMoney == 0 ? '€ ' + record.OccupancyEarnedMoney : 0;
					var AssortmentEarnedMoney = record.AssortmentEarnedMoney || record.AssortmentEarnedMoney == 0 ? '€ ' + record.AssortmentEarnedMoney : 0;
					var TotalEarnedMoney = record.TotalEarnedMoney || record.TotalEarnedMoney == 0 ? '€ ' + record.TotalEarnedMoney : 0;
					var Gold = record.Gold || record.Gold == 0 ? record.Gold : 0;
					var Silver = record.Silver || record.Silver == 0 ? record.Silver : 0;
					var Other = record.Other || record.Other == 0 ? record.Other : 0;
					var PurityDateTime = moment(record.PurityDateTime).format('DD/MM/YYYY hh:mm a');
					var IsBestResult = record.IsBestResult == 1 ? 'BEST' : '';
					var imageFileNameBest = record.Filename;
					rows.push("<tr>");
					// rows.push("<td onclick='subGrid("+ record.AssetPurityId +")'><img src=/img/icons/BasicPlus.png rel=0 alt=expand/collapse></td>");
					// rows.push("<td><span id = 'spanId" + j + "-" + record.AssetPurityId + "' class = 'glyphicon glyphicon-plus greenColorPlus' style='cursor:pointer'></span></td>");
					// rows.push("<td><img src=/img/icons/BasicPlus.png rel=0 alt=expand/collapse></td>");
					rows.push("<td>" + PurityDateTime + "</td>");
					if (imageFileNameBest.indexOf(',') > -1) {
						var imageFilesBest = imageFileNameBest.split(',');
						for (var indexBest = 0; indexBest < imageFilesBest.length; indexBest++) {
							var elementFileBest = imageFilesBest[indexBest];
							var productImageBest = coolerDashboard.getUrl('/Controllers/CoolerImagePreview.ashx?AssetImageName=' + elementFileBest + '&ImageId=' + record.AssetPurityId + '&v=' + formatPurityDateTime + '&PurityDateTime=' + imagePurityDate);
							imagesBest.push("<div class='ProductsImage'><div><img src='" + productImageBest + "' style='width: 50px; height: auto;' /></div></div>");
						}
					} else {
						var productImageBest = coolerDashboard.getUrl('/Controllers/CoolerImagePreview.ashx?AssetImageName=' + imageFileNameBest + '&ImageId=' + record.AssetPurityId + '&v=' + formatPurityDateTime + '&PurityDateTime=' + imagePurityDate);
						imagesBest.push("<div class='ProductsImage'><div><img src='" + productImageBest + "' style='width: 50px; height: auto;' /></div></div>");
					}
					rows.push("<td>" + imagesBest.join("") + "</td>");

					// rows.push("<td><div class='ProductsImage'><div><img src='" + productImage + "' style='width: 131px; height: auto;' /></div></div></td>");
					rows.push("<td>" + OccupancyEarnedMoney + "</td>");
					rows.push("<td>" + AssortmentEarnedMoney + "</td>");
					rows.push("<td>" + TotalEarnedMoney + "<span style=font-weight:bold>" + ' ' + IsBestResult + "</span></td>");
					rows.push("<td>" + Gold + "</td>");
					rows.push("<td>" + Silver + "</td>");
					rows.push("<td>" + Other + "</td>");
					rows.push("</tr>");
					// rows.push("<tr class='hidden' id = 'rowClass" + j + "'></tr>");
					// rows.push("<tr><td><table><tr class='hidden' id = 'rowClass" + j + "'></tr></table></td></tr>");
				}
			}

			var recordLengthLatest = recordsLatest.length;
			var rowsLatest = [];
			var images = [];
			for (var m = 0; m < recordLengthLatest; m++) {
				var recordLatest = recordsLatest[m];
				if (recordLatest) {
					var formatPurityDateTime = new Date(recordLatest.PurityDateTime);
					var imagePurityDateTime = moment(recordLatest.PurityDateTime).format('YYYY-MM-DD');
					var imagePurityDate = imagePurityDateTime.replace(/-/g, '');
					//var productImage = coolerDashboard.getUrl('/Controllers/CoolerImagePreview.ashx?AssetImageName=' + recordLatest.Filename + '&ImageId=' + recordLatest.AssetPurityId + '&v=' + formatPurityDateTime + '&PurityDateTime=' + imagePurityDate);
					var OccupancyEarnedMoney = recordLatest.OccupancyEarnedMoney || recordLatest.OccupancyEarnedMoney == 0 ? '€ ' + recordLatest.OccupancyEarnedMoney : 0;
					var AssortmentEarnedMoney = recordLatest.AssortmentEarnedMoney || recordLatest.AssortmentEarnedMoney == 0 ? '€ ' + recordLatest.AssortmentEarnedMoney : 0;
					var TotalEarnedMoney = recordLatest.TotalEarnedMoney || recordLatest.TotalEarnedMoney == 0 ? '€ ' + recordLatest.TotalEarnedMoney : 0;
					var Gold = recordLatest.Gold || recordLatest.Gold == 0 ? recordLatest.Gold : 0;
					var Silver = recordLatest.Silver || recordLatest.Silver == 0 ? recordLatest.Silver : 0;
					var Other = recordLatest.Other || recordLatest.Other == 0 ? recordLatest.Other : 0;
					var PurityDateTime = moment(recordLatest.PurityDateTime).format('DD/MM/YYYY hh:mm a');
					var IsBestResult = recordLatest.IsBestResult == 1 ? 'BEST' : '';
					var imageFileName = recordLatest.Filename;
					rowsLatest.push("<tr>");
					// rowsLatest.push("<td onclick='subGrid("+ recordLatest.AssetPurityId +")'><img src=/img/icons/BasicPlus.png rel=0 alt=expand/collapse></td>");
					// rowsLatest.push("<td><span id = 'spanId" + j + "-" + recordLatest.AssetPurityId + "' class = 'glyphicon glyphicon-plus greenColorPlus' style='cursor:pointer'></span></td>");
					// rowsLatest.push("<td><img src=/img/icons/BasicPlus.png rel=0 alt=expand/collapse></td>");
					rowsLatest.push("<td>" + PurityDateTime + "</td>");
					if (imageFileName.indexOf(',') > -1) {
						var imageFiles = imageFileName.split(',');
						for (var index = 0; index < imageFiles.length; index++) {
							var elementFile = imageFiles[index];
							var productImage = coolerDashboard.getUrl('/Controllers/CoolerImagePreview.ashx?AssetImageName=' + elementFile + '&ImageId=' + recordLatest.AssetPurityId + '&v=' + formatPurityDateTime + '&PurityDateTime=' + imagePurityDate);
							images.push("<div class='ProductsImage'><div><img src='" + productImage + "' style='width: 50px; height: auto;' /></div></div>");
						}
					} else {
						var productImage = coolerDashboard.getUrl('/Controllers/CoolerImagePreview.ashx?AssetImageName=' + imageFileName + '&ImageId=' + recordLatest.AssetPurityId + '&v=' + formatPurityDateTime + '&PurityDateTime=' + imagePurityDate);
						images.push("<div class='ProductsImage'><div><img src='" + productImage + "' style='width: 50px; height: auto;' /></div></div>");
					}
					rowsLatest.push("<td>" + images.join("") + "</td>");
					// rowsLatest.push("<td><div class='ProductsImage'><div><img src='" + productImage + "' style='width: 131px; height: auto;' /></div></div></td>");
					rowsLatest.push("<td>" + OccupancyEarnedMoney + "</td>");
					rowsLatest.push("<td>" + AssortmentEarnedMoney + "</td>");
					rowsLatest.push("<td>" + TotalEarnedMoney + "<span style=font-weight:bold>" + ' ' + IsBestResult + "</span></td>");
					rowsLatest.push("<td>" + Gold + "</td>");
					rowsLatest.push("<td>" + Silver + "</td>");
					rowsLatest.push("<td>" + Other + "</td>");
					rowsLatest.push("</tr>");
					// rowsLatest.push("<tr class='hidden' id = 'rowClass" + j + "'></tr>");
					// rowsLatest.push("<tr><td><table><tr class='hidden' id = 'rowClass" + j + "'></tr></table></td></tr>");
				}
			}

			var recordLengthAvailableBest = recordsAvailableBest.length;
			var rowsrAvailableBest = [];
			rowsrAvailableBest.push("<tr>");
			for (var k = 0; k < recordLengthAvailableBest; k++) {
				var recordAvailableBest = recordsAvailableBest[k];
				if (recordAvailableBest) {
					var skuCount = recordAvailableBest.SKUCount ? recordAvailableBest.SKUCount : 0;
					if (recordAvailableBest.DisplayValue == 'Gold') {
						var DisplayValue = skuCount;
						var displayColorClass = 'goldCircle';
					} else if (recordAvailableBest.DisplayValue == 'Silver') {
						var DisplayValue = skuCount;
						var displayColorClass = 'silverCircle';
					} else {
						var DisplayValue = skuCount;
						var displayColorClass = 'otherCircle';
					}
					var productImage = coolerDashboard.getUrl('/products/thumbnails/' + recordAvailableBest.ProductId + '.png');
					//rowsrAvailableBest.push("<td></td>");
					var productImageDataNotAvailable = '/img/noimage.png';
					rowsrAvailableBest.push("<td><div id = 'topContainerAvailable'><div class=" + displayColorClass + ">" + DisplayValue + "</div><img src='" + productImage + "' onerror=this.src='" + productImageDataNotAvailable + "' style='width: auto; max-width:100px; height: auto;max-height:100px' /><div style='font-size: 12px;'>" + recordAvailableBest.Product + "</div></td>");
				}
			}
			rowsrAvailableBest.push("</tr>");

			var recordLengthAvailableLatest = recordsAvailableLatest.length;
			var rowsrAvailableLatest = [];
			rowsrAvailableLatest.push("<tr>");
			for (var n = 0; n < recordLengthAvailableLatest; n++) {
				var recordAvailableLatest = recordsAvailableLatest[n];
				if (recordAvailableLatest) {
					var skuCount = recordAvailableLatest.SKUCount ? recordAvailableLatest.SKUCount : 0;
					if (recordAvailableLatest.DisplayValue == 'Gold') {
						var DisplayValue = skuCount;
						var displayColorClass = 'goldCircle';
					} else if (recordAvailableLatest.DisplayValue == 'Silver') {
						var DisplayValue = skuCount;
						var displayColorClass = 'silverCircle';
					} else {
						var DisplayValue = skuCount;
						var displayColorClass = 'otherCircle';
					}
					var productImage = coolerDashboard.getUrl('/products/thumbnails/' + recordAvailableLatest.ProductId + '.png');
					//rowsrAvailableLatest.push("<td></td>");
					var productImageDataNotAvailable = '/img/noimage.png';
					rowsrAvailableLatest.push("<td><div id = 'containerLatestAvailable'><div class=" + displayColorClass + ">" + DisplayValue + "</div><img src='" + productImage + "' onerror=this.src='" + productImageDataNotAvailable + "' style='width: auto; max-width:100px height: auto; max-height:100px' /><div style='font-size: 12px;'>" + recordAvailableLatest.Product + "</div></div></td>");
				}
			}
			rowsrAvailableLatest.push("</tr>");

			var recordLengthMissingBest = recordsMissingBest.length;
			var rowsMissingBest = [];
			rowsMissingBest.push("<tr>");
			for (var l = 0; l < recordLengthMissingBest; l++) {
				var recordMissingBestData = recordsMissingBest[l];
				if (recordMissingBestData) {
					var skuCount = recordMissingBestData.SKUCount ? recordMissingBestData.SKUCount : 0;
					if (recordMissingBestData.DisplayValue == 'Gold') {
						var DisplayValue = 'G';
						var displayColorClass = 'goldCircle';
					} else if (recordMissingBestData.DisplayValue == 'Silver') {
						var DisplayValue = 'S';
						var displayColorClass = 'silverCircle';
					} else {
						var DisplayValue = 'O';
						var displayColorClass = 'otherCircle';
					}
					var productImageData = coolerDashboard.getUrl('/products/thumbnails/' + recordMissingBestData.ProductId + '.png');
					var productImageDataNotAvailable = '/img/noimage.png';
					//rowsMissingBest.push("<td></td>");
					rowsMissingBest.push("<td><div id = 'containerMissing'><div class=" + displayColorClass + ">" + DisplayValue + "</div><img src='" + productImageData + "' onerror=this.src='" + productImageDataNotAvailable + "' style='width: auto; max-width:100px height: auto; max-height:100px;'/><div style='font-size: 12px;'>" + recordMissingBestData.Product + "</div></div></td>");
				}
			}
			rowsMissingBest.push("</tr>");

			var recordLengthMissingLatest = recordsMissingLatest.length;
			var rowsMissingLatest = [];
			rowsMissingLatest.push("<tr>");
			for (var o = 0; o < recordLengthMissingLatest; o++) {
				var recordMissingLatestData = recordsMissingLatest[o];
				if (recordMissingLatestData) {
					var skuCountLatest = recordMissingLatestData.SKUCount ? recordMissingLatestData.SKUCount : 0;
					if (recordMissingLatestData.DisplayValue == 'Gold') {
						var DisplayValueLatest = 'G';
						var displayColorClassLatest = 'goldCircle';
					} else if (recordMissingLatestData.DisplayValue == 'Silver') {
						var DisplayValueLatest = 'S';
						var displayColorClassLatest = 'silverCircle';
					} else {
						var DisplayValueLatest = 'O';
						var displayColorClassLatest = 'otherCircle';
					}
					var productImageDataLatest = coolerDashboard.getUrl('/products/thumbnails/' + recordMissingLatestData.ProductId + '.png');
					//rowsMissingLatest.push("<td></td>");
					var productImageDataNotAvailable = '/img/noimage.png';
					rowsMissingLatest.push("<td><div id = 'containerMissingLatest'><div class=" + displayColorClassLatest + ">" + DisplayValueLatest + "</div><img src='" + productImageDataLatest + "' onerror=this.src='" + productImageDataNotAvailable + "' style='width: auto; max-width:100px; height: auto; max-height:100px' /><div style='font-size: 12px;'>" + recordMissingLatestData.Product + "</div></div></td>");
				}
			}
			rowsMissingLatest.push("</tr>");

		}
		if (rows.join('') == "") {
			// rows.push("<tr><td>Best Result</td></tr>");
			rows.push('<td>No Data Is To Be Displayed<td>');
		}
		if (rowsrAvailableBest.join('') == "<tr></tr>") {
			// rowsrAvailableBest.push("<tr><td>Best Available Products</td></tr>");
			rowsrAvailableBest.push('<td>No Data Is To Be Displayed<td>');
		}
		if (rowsMissingBest.join('') == "<tr></tr>") {
			// rowsMissingBest.push("<tr><td>Best Missing Products</td></tr>");
			rowsMissingBest.push('<td>No Data Is To Be Displayed<td>');
		}
		if (rowsLatest.join('') == "") {
			// rowsLatest.push("<tr><td>Lastest Result</td></tr>");
			rowsLatest.push('<td>No Data Is To Be Displayed<td>');
		}
		if (rowsrAvailableLatest.join('') == "<tr></tr>") {
			// rowsrAvailableLatest.push("<tr><td>Lastest Available Products</td></tr>");
			rowsrAvailableLatest.push('<td>No Data Is To Be Displayed<td>');
		}
		if (rowsMissingLatest.join('') == "<tr></tr>") {
			// rowsMissingLatest.push("<tr><td>Lastest Missing Product</td></tr>");
			rowsMissingLatest.push('<td>No Data Is To Be Displayed<td>');
		}
		var bestResult = '<table class="table table-striped table-hover table-condensed">' +
			// '<th>' +
			'<tr>' +
			'<tr><td><b>Best Result</b></td></tr>' +
			'<th>Date Time</th>' +
			'<th>Image</th>' +
			'<th>Occupancy</th>' +
			'<th>Assortment</th>' +
			'<th>Total</th>' +
			'<th>Gold SKU</th>' +
			'<th>Silver SKU</th>' +
			'<th>Other</th>' +
			'</tr>' +
			// '</th>' +
			'<tbody>' +
			rows.join('') +
			'</tbody>' +
			'</table>';

		var bestAvailableProducts = '<div id="outletDetailsImage" style="overflow-x:auto;"><table style="table-layout: fixed;width: 100%;" class="table table-striped table-hover table-condensed">' +
			'<tr>' +
			'<th>Best Available Product</th>' +
			// '<tr><td>Available Products</td></tr>' +
			'</tr>' +
			'<tbody style="display:  block;">' +
			rowsrAvailableBest.join('') +
			'</tbody>' +
			'</table></div>';

		var bestMissingProducts = '<div id="outletDetailsImage" style="overflow-x:auto;"><table style="table-layout: fixed;width: 100%;" class="table table-striped table-hover table-condensed">' +
			'<tr>' +
			'<th>Best Missing Products</th>' +
			// '<tr><td>Missing Products</td></tr>' +
			'</tr>' +
			'<tbody style="display:  block;">' +
			rowsMissingBest.join('') +
			'</tbody>' +
			'</table></div>';

		var bestLatestResult = '<table class="table table-striped table-hover table-condensed">' +
			// '<th>' +
			'<tr>' +
			'<tr><td><b>Last Result</b></td></tr>' +
			'<th>Date Time</th>' +
			'<th>Image</th>' +
			'<th>Occupancy</th>' +
			'<th>Assortment</th>' +
			'<th>Total</th>' +
			'<th>Gold SKU</th>' +
			'<th>Silver SKU</th>' +
			'<th>Other</th>' +
			'</tr>' +
			// '</th>' +
			'<tbody>' +
			rowsLatest.join('') +
			'</tbody>' +
			'</table>';

		var latestAvailableProducts = '<div id="outletDetailsImage" style="overflow-x:auto;"><table style="table-layout: fixed;width: 100%;" class="table table-striped table-hover table-condensed">' +
			'<tr>' +
			'<th>Last Available Product</th>' +
			// '<tr><td>Available Products</td></tr>' +
			'</tr>' +
			'<tbody style="display:  block;">' +
			rowsrAvailableLatest.join('') +
			'</tbody>' +
			'</table></div>';

		var latestMissingProducts = '<div id="outletDetailsImage" style="overflow-x:auto;"><table style="table-layout: fixed;width: 100%;" class="table table-striped table-hover table-condensed">' +
			'<tr>' +
			'<th>Last Missing Product</th>' +
			// '<tr><td>Available Products</td></tr>' +
			'</tr>' +
			'<tbody style="display:  block;">' +
			rowsMissingLatest.join('') +
			'</tbody>' +
			'</table></div>';

		return bestResult + bestAvailableProducts + bestMissingProducts + bestLatestResult + latestAvailableProducts + latestMissingProducts;
	},

	ajaxIndicatorStart: function (text) {
		if (jQuery('body').find('#resultLoading').attr('id') != 'resultLoading') {
			jQuery('body').append('<div id="resultLoading" style="display:none"><div><div class="loader">Loading...</div><div>' + text + '</div></div><div class="bg"></div></div>');
		}
		jQuery('#resultLoading').css({
			'width': '100%',
			'height': '100%',
			'position': 'fixed',
			'z-index': '10000000',
			'top': '0',
			'left': '0',
			'right': '0',
			'bottom': '0',
			'margin': 'auto'
		});

		jQuery('#resultLoading .bg').css({
			'background': 'rgb(83,83,83)',
			'opacity': '0.7',
			'width': '100%',
			'height': '100%',
			'position': 'absolute',
			'top': '0'
		});

		jQuery('#resultLoading>div:first').css({
			'width': '250px',
			'height': '75px',
			'text-align': 'center',
			'position': 'fixed',
			'top': '0',
			'left': '0',
			'right': '0',
			'bottom': '0',
			'margin': 'auto',
			'font-size': '16px',
			'z-index': '10',
			'color': '#ffffff'

		});

		jQuery('#resultLoading .bg').height('100%');
		jQuery('#resultLoading').fadeIn(300);
		jQuery('body').css('cursor', 'wait');
		coolerDashboard.ajaxCounter++;
	},

	ajaxIndicatorStop: function () {
		coolerDashboard.ajaxCounter--;
		if (coolerDashboard.ajaxCounter == 0) {
			jQuery('#resultLoading .bg').height('100%');
			jQuery('#resultLoading').fadeOut(300);
			jQuery('body').css('cursor', 'default');
		}
	},
	ajaxIndicatorStopForce: function () {
		//coolerDashboard.ajaxCounter--;
		//if (coolerDashboard.ajaxCounter == 0) {
		jQuery('#resultLoading .bg').height('100%');
		jQuery('#resultLoading').fadeOut(300);
		jQuery('body').css('cursor', 'default');
		//}
	},
	initGridStackDynamicView: function () {
		var options = {
			cellHeight: 80,
			verticalMargin: 20,
			animate: true,
			draggable: {
				handle: '.drag'
			}
		};
		$('.grid-stack').gridstack(options);
		var grid = $('.grid-stack').data('gridstack');
		if (grid) {
			grid.enableMove(false, false);
			grid.enableResize(false, false);
		}
		$('.grid-stack').on('change', function (event, items) {
			coolerDashboard.gridUtils.fireRefreshEventOnWindow();
		});
	},
	fireRefreshEventOnWindow: function () {
		setTimeout(function () {
			var evt = document.createEvent("HTMLEvents");
			evt.initEvent('resize', true, false);
			window.dispatchEvent(evt);
		}, 500);
	},
	loadUserLayout: function (def, saveDefault) {
		var items = [];
		if (saveDefault == true) {
			$('.grid-stack-item.ui-draggable').each(function () {
				var $this = $(this);
				defaultLayoutItems.push({
					id: $this.attr('data-gs-id'),
					x: $this.attr('data-gs-x'),
					y: $this.attr('data-gs-y'),
					w: $this.attr('data-gs-width'),
					h: $this.attr('data-gs-height')
					//content: this.outerHTML
				});
			});
		}

		if (def == true) {
			var storedData = JSON.parse(LZString.decompressFromUTF16(localStorage.getItem("userLayout")));
			if (storedData && storedData.length > 0) {
				storedData.forEach(function (element) {
					if (element.Page == location.hash.replace(/^#/, "")) {
						items = JSON.parse(element.Value);
					}
				});
				//items = JSON.parse(storedData[0].Value);
			}
		} else {
			items = defaultLayoutItems;
		}

		var grid = $('.grid-stack').data('gridstack');
		if (grid) {
			_.each(items, function (node) {
				grid.grid.nodes.forEach(function (element) {
					if (element.id === node.id) {
						grid.grid.batchUpdate();
						grid.update(element.el, parseInt(node.x), parseInt(node.y), parseInt(node.w), parseInt(node.h));
						grid.grid.commit();
					}
				});
			});
		}
	},
	createDetailTableForVisit: function (config) {
		var items = config.items,
			rows = [],
			data = config.data;

		for (var i = 0, len = items.length; i < len; i++) {
			var item = items[i],
				value = item.value;
			var assetDetailRecords = value.details;
			rows.push("<tr>");
			rows.push("<tr><td>Outlet Code</td><td colspan='2'>" + coolerDashboard.gridUtils.joinStrings(value.LocationCode) + "</td></tr>");
			rows.push("<tr><td>Outlet Name</td><td colspan='2'>" + coolerDashboard.gridUtils.joinStrings(value.LocationName) + "</td></tr>");
			rows.push("<tr><td>Address</td><td colspan='2'>" + coolerDashboard.gridUtils.joinStrings(' ', value.Street, value.Street2, value.Street3) + "</td></tr>");
			rows.push("<tr><td>City</td><td colspan='2'>" + coolerDashboard.gridUtils.joinStrings(value.City) + "</td></tr>");
			rows.push("<tr><td>State</td><td colspan='2'>" + coolerDashboard.gridUtils.joinStrings(value.State) + "</td></tr>");
			rows.push("<tr><td>Country</td><td colspan='2'>" + coolerDashboard.gridUtils.joinStrings(value.Country) + "</td></tr>");
			rows.push("<tr><td>Market</td><td colspan='2'>" + coolerDashboard.gridUtils.joinStrings(value.Market) + "</td></tr>");
			rows.push("<tr><td>Channel</td><td colspan='2'>" + coolerDashboard.gridUtils.joinStrings(value.Channel) + "</td></tr>");
			rows.push("<tr><td>Classification</td><td colspan='2'>" + coolerDashboard.gridUtils.joinStrings(value.Classification) + "</td></tr>");

			for (var j = 0, count = assetDetailRecords.length; j < count; j++) {
				rows.push("<tr><td>Serial Number</td><td>" + assetDetailRecords[j].SerialNumber + "</td><td class=" + assetDetailRecords[j].Status + ">" + assetDetailRecords[j].Status + "</td></tr>");
			}
		}
		return '<table class="table table-striped table-hover table-condensed">' +
			rows.join('') +
			'</table>';
	},
	addChildGridHandler: function (options) {
		var gridId = options.gridId,
			renderer = options.renderer;
		$(gridId).on('click', 'td.details-control', function () {
			var table = $(gridId).DataTable();
			var tr = $(this).closest('tr');
			var row = table.row(tr);

			if (row.child.isShown()) {
				// This row is already open - close it
				row.child.hide();
				tr.removeClass('shown');
			} else {
				// Open this row
				row.child(renderer(row.data())).show();
				tr.addClass('shown');
			}
		});
	},

	addChildGridHandlerForIR: function (options) {
		var gridId = options.gridId,
			renderer = options.renderer;
		$(gridId).on('click', 'td.details-control', function () {
			tableIR = $(gridId).DataTable();
			trIR = $(this).closest('tr');
			rowIR = tableIR.row(trIR);

			if (rowIR.child.isShown()) {
				// This row is already open - close it
				rowIR.child.hide();
				trIR.removeClass('shown');
			} else {
				// Open this row
				rowIR.child(renderer(rowIR.data())).show();
				trIR.addClass('shown');
			}
		});
	},

	addChildGridHandlerForIRExpand: function (options) {
		var gridId = options.gridId,
			renderer = options.renderer;
		// $(gridId).on('click', 'td.details-control', function () {
		// var tableIR = $(gridId).DataTable();
		// var trIR = $(this).closest('tr');
		// var rowIR = table.row(tr);

		if (rowIR.child.isShown()) {
			// Open this row
			rowIR.child(renderer(rowIR.data())).show();
			trIR.addClass('shown');
		} else {
			// This row is already open - close it
			rowIR.child.hide();
			trIR.removeClass('shown');
		}
		// });
	}


};

coolerDashboard.common = {
	nodeUrl: function (api, parameters) {
		var returnValue = api;
		if (typeof parameters === 'object') {
			parameters = $.param(parameters);
		}
		if (typeof parameters === 'string') {
			returnValue += (returnValue.indexOf('?') > -1 ? '&' : '?') + parameters;
		}
		return returnValue;
	},
	errorMessage: function (response) {
		$.bigBox({
			title: response.error,
			content: response.message,
			color: "#C46A69",
			icon: "fa fa-warning shake animated",
			number: response.statusCode,
			timeout: 7000
		});
	},
	oTable: {},

	openAlert: 0,

	alertPriority: {
		Medium: 4226,
		Low: 4225,
		High: 4227
	},

	alertStatus: {
		New: 1,
		Planned: 2,
		Complete: 254,
		Closed: 255,
		Acknowledged: 256
	},

	month: {
		1: "January",
		2: "February",
		3: "March",
		4: "April",
		5: "May",
		6: "June",
		7: "July",
		8: "August",
		9: "September",
		10: "October",
		11: "November",
		12: "December"
	},

	week: {
		7: "Sunday",
		1: "Monday",
		2: "Tuesday",
		3: "Wednesday",
		4: "Thursday",
		5: "Friday",
		6: "Saturday"
	},

	startRefresh: null,

	smallSpin: {
		lines: 11,
		length: 0,
		width: 13,
		radius: 42,
		scale: 0.30,
		corners: 1,
		color: '#747474',
		opacity: 0.4,
		rotate: 29,
		direction: 1,
		speed: 1.6,
		trail: 60,
		fps: 20,
		zIndex: 200,
		className: 'spinner',
		top: '50%',
		left: '50%',
		shadow: false,
		hwaccel: false,
		position: 'absolute'
	},

	bigSpin: {
		lines: 11,
		length: 0,
		width: 20,
		radius: 49,
		scale: 0.25,
		corners: 1,
		color: '#747474',
		opacity: 0.15,
		rotate: 25,
		direction: 1,
		speed: 1.2,
		trail: 79,
		fps: 20,
		zIndex: 200,
		className: 'spinner',
		top: '49%',
		left: '51%',
		shadow: true,
		hwaccel: true,
		position: 'absolute'
	},


	attachMarkerListener: function (infoWindow, marker, record, map, IsAsset) {
		google.maps.event.addListener(marker, 'click', function () {
			var me = this;
			var locationId = record.Id;
			var mapLocFilter;
			if (IsAsset) {
				mapLocFilter = {
					'start': 0,
					'limit': 10000,
					'AssetId': locationId
				};
			} else {
				mapLocFilter = {
					'start': 0,
					'limit': 10000,
					'LocationId': locationId
				};
			}
			var mapLocJsonFilter = mapLocFilter;
			$.ajax({
				url: coolerDashboard.common.nodeUrl('asset/list', mapLocJsonFilter),
				type: 'GET',
				success: function (result, data) {
					var records = result.data;
					var locationName = record.Name ? record.Name : records[0].Location;
					var locationCode = record.LocationCode ? record.LocationCode : records[0].LocationCode;
					var text = '<div class="row inline-link-outlet" id= Location_' + Number(record.Id) + ' data-locationCode = "' + locationCode + '">' +
						'<div class="col-sm-12 "><b>' + locationName + '</b> (' + locationCode + ')</div>' +
						'</div>';
					renderers = coolerDashboard.renderers;

					for (var i = 0, len = records.length; i < len; i++) {
						var rec = records[i];
						var icons = [];
						if (rec) {
							var length = rec["Alert_Open_All_Type"].length;
							for (var j = 0; j < length; j++) {
								var icon = renderers.alertTypeIcons[rec["Alert_Open_All_Type"][j]];
								var titleText = renderers.alertTypeText[rec["Alert_Open_All_Type"][j]];
								if (icon) {
									icons.push("<div style='display:inline-block; padding:1px;'><img src='" + icon + "' title= '" + titleText + "' /></div>");
								}
							}
							icons = icons.join("");
						}
						var alertTypeIcon = rec["Alert_Highest_AlertTypeId"] == 0 ? "" : '<div style="display:inline-block; padding:1px;"><img src=' + coolerDashboard.renderers.alertTypeIcons[rec["Alert_Highest_AlertTypeId"]] + ' /></div>';
						var purityText = rec.PurityIssue == null || rec.PurityIssue == 0 ? "N/A" : rec.PurityIssue == 255 ? "Pure" : "Impure"
						var LastPingText = rec["LastPing"] == "0001-01-01T00:00:00" ? "-" : moment(rec["LastPing"]).format('DD MMM,YYYY');
						var LatestHealthRecordTimeText = rec["LatestHealthRecordTime"] == "0001-01-01T00:00:00" ? "-" : moment(rec["LatestHealthRecordTime"]).format('DD MMM,YYYY');
						var LatestDoorTimeText = rec["LatestDoorTime"] == "0001-01-01T00:00:00" ? "-" : moment(rec["LatestDoorTime"]).format('DD MMM,YYYY');
						text += '<p style="border-bottom: medium solid #000000;"></p>' +
							'<table class="marker table">' +
							'<tr id="' + rec.Id + '" data-serialNumber = "' + rec.SerialNumber + '"><td class="text-label">Serial Number:</td><td class="inline-link"><b>' + rec.SerialNumber + '</b></td></tr>' +
							// '<tr><td class="text-label">Power:</td><td>' + (rec.GatewaySerialNumber == "" ? "N/A" : rec.IsPowerOn ? "On" : "Off") + '</td></tr>' +
							'<tr><td class="text-label">Equipment Number</td><td>' + rec["EquipmentNumber"] + '</td></tr>' +
							'<tr><td class="text-label">Asset Type</td><td>' + rec["AssetType"] + '</td></tr>' +
							'<tr><td class="text-label">SmartDevice Type</td><td>' + rec["SmartDeviceType"] + '</td></tr>' +
							'<tr><td class="text-label">Latest Data Upload</td><td>' + LastPingText + '</td></tr>' +
							'<tr><td class="text-label">Latest Health Record Time</td><td>' + LatestHealthRecordTimeText + '</td></tr>' +
							'<tr><td class="text-label">Open Alerts:</td><td>' + rec["Alert_Open"] + '&nbsp;  ' + icons + '</td></tr>' +
							'<tr><td class="text-label">Door Count:</td><td>' + rec["Door_TodayCount"] + " <span class='lighter'>today</span>, " + rec["Door_7dayCount"] + " <span class='lighter'>7d</span>, " + rec["Door_30dayCount"] + " <span class='lighter'>30d</span></td></tr>" +
							'<tr><td class="text-label">Latest Door:</td><td>' + LatestDoorTimeText + '</td></tr>' +
							'<tr><td class="text-label">Latest Temp.:</td><td>' + renderers.temperature(rec.Temperature) + '</td></tr>' +
							'<tr><td class="text-label">Latest Light:</td><td>' + renderers.lightStatus(rec.LightIntensity, rec.SmartDeviceTypeId) + '</td></tr>';

						if (rec.SmartDeviceTypeId == 3 || rec.SmartDeviceTypeId == 7 || rec.SmartDeviceTypeId == 26) {
							text += '<tr><td class="text-label"># of SKU OOS:</td><td>' + rec.TotalSkuOOS + '</td></tr>' +
								'<tr><td class="text-label">Empty facings:</td><td>' + rec.TotalEmptyFacings + '</td></tr>' +
								'<tr><td class="text-label">Purity:</td><td>' + purityText + '</td></tr>' +
								'<tr><td class="text-label">Planogram compliance:</td><td>' + rec.PlanogramCompliance + '</td></tr>';
						}
						text += '</table>';
					}



					text = text.replace(/false/g, 'Off');
					text = text.replace(/true/g, 'On');
					infoWindow.setContent('<div style="overflow:auto; height:224px; width:250px; overflow-x: hidden;">' + text + '</div>');
					infoWindow.open(map, me);
					marker.setMap(map);

					//add event once the info window visible
					for (var i = 0, len = records.length; i < len; i++) {
						$('#' + records[i].Id).off("click");
						$('#' + records[i].Id).on("click", function () {
							var id = this.getAttribute('data-serialNumber');
							id = id.toLowerCase();
							//window.location.hash = 'assetDetails/' + id;
							window.open(window.location.pathname + '#assetDetails/' + id);
						});
					}

					$('#Location_' + record.Id).off("click");
					$('#Location_' + record.Id).on("click", function () {
						var locationCode = this.getAttribute('data-locationCode');
						locationCode = locationCode.toLowerCase();
						//window.location.hash = 'outletDetails/' + locationCode;
						window.open(window.location.pathname + '#outletDetails/' + locationCode);
					});
				}
			});
		});
	},

	openAlertCount: function () {
		$('#lastUpdateId').html('Last updated on: ' + moment().format(coolerDashboard.dateTimeFormat));
		var alertParams = {
			//ClosedOn: '0001-01-01T00:00:00',
			start: 0,
			length: 0
		};
		$.ajax({
			url: coolerDashboard.common.nodeUrl('alert/list', alertParams),
			method: 'POST',
			success: function (data, request) {
				coolerDashboard.common.clearRefreshAlert();
				coolerDashboard.common.openAlert = data.recordsTotal;
				var priorityData = data.priorityCount;
				$('#activity > .badge').text(coolerDashboard.common.openAlert);
				var length = priorityData.length;
				if (length > 0) {
					var boolRed = $('#activity > .badge').hasClass('bg-color-red');
					if (!boolRed) {
						$('#activity > .badge').addClass('bg-color-red');
					}
					for (var i = 0; i < length; i++) {
						var id = priorityData[i].PriorityId;
						var count = priorityData[i].Count;
						if (id == coolerDashboard.common.alertPriority.Medium) {
							$('#mediumCount').html('Medium (' + count + ')');
						} else if (id == coolerDashboard.common.alertPriority.Low) {
							$('#lowCount').html('Low (' + count + ')');
						} else if (id == coolerDashboard.common.alertPriority.High) {
							$('#highCount').html('High (' + count + ')');
						}
					}
				} else {
					$('#activity > .badge').removeClass('bg-color-red');
				}
			}
		});
	},

	getPreferencesList: function () {
		$.ajax({
			url: coolerDashboard.common.nodeUrl('preferenceState'),
			type: 'POST',
			data: {
				action: 'load'
			},
			success: function (rec, dat) {
				coolerDashboard.preferences = [];
				var prefName = "";
				var isDefault = false;
				var data = rec.data;
				var prefId = 0;
				var active = "";
				var length = 0;
				if (data) {
					length = data.length;
				}
				$("li[data-prefId").remove();
				if (length > 0) {
					for (var i = 0; i < length; i++) {
						prefId = data[i].prefId;
						coolerDashboard.preferences[prefId] = data[i];
						active = "";
						prefName = data[i].PrefName;
						isDefault = data[i].IsDefault;
						if (isDefault) {
							active = "active";
							prefName = prefName + " (Default)";
							localStorage.setItem('defaultPreference', LZString.compressToUTF16(JSON.stringify(data[i])));
						}
						$('.preferenceDropdown').append('<li class = "' + active + '" data-prefId = "' + prefId + '"><a onclick="coolerDashboard.common.onPreferenceClick(' + prefId + ')" >' + prefName + '</a></li>')
					}
					coolerDashboard.common.onMangePreference();

				}
				//onSuccessFilter(result, data);
			},
			failure: function (response, opts) {
				//coolerDashboard.gridUtils.ajaxIndicatorStop();
			},
			scope: this
		});
	},

	toHexString: function (byteArray) {
		return byteArray.map(function (byte) {
			return ('0' + (byte & 0xFF).toString(16)).slice(-2);
		}).join('')
	},

	onMangePreference: function () {
		var tableRow = '';
		var preferences = coolerDashboard.preferences;
		$("#manageTable tbody tr").remove()
		for (var i = 0; i < preferences.length; i++) {
			if (preferences[i]) {
				tableRow += '<tr>' +
					'<td>' + preferences[i].PrefName + '</td>' +
					'<td>' + preferences[i].PrefDesc + '</td>' +
					'<td>' + preferences[i].IsDefault + '</td>' +
					'<td><p data-placement="top" data-toggle="tooltip" title="Edit"><button class="btn btn-primary btn-xs" data-title="Edit" data-toggle="modal" data-target="#edit" data-gridTitle = "' + preferences[i].GridTitle + '" data-prefDesc = "' + preferences[i].PrefDesc + '" data-isDefault = "' + preferences[i].IsDefault + '" data-prefId = "' + preferences[i].GridPreferenceId + '"><span class="glyphicon glyphicon-pencil"></span></button></p></td>' +
					'<td><p data-placement="top" data-toggle="tooltip" title="Delete"><button class="btn btn-danger btn-xs" data-title="Delete" data-toggle="modal" data-target="#delete" data-prefId = "' + preferences[i].GridPreferenceId + '" ><span class="glyphicon glyphicon-trash"></span></button></p></td>' +
					'</tr>'
			}
		}

		$("#manageTable tbody").append(tableRow);
	},

	onPreferenceClick: function (prefId, navigatation) {
		coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
		if (!prefId) {
			var activeList = $('.preferenceDropdown li.active');
			prefId = activeList.data() ? activeList.data().prefid : 0;
		}

		var data = coolerDashboard.preferences[prefId];
		//jQuery.isEmptyObject(filterValuesChart)
		if (data && !navigatation) {
			coolerDashboard.isFilterChanged = false;
			var prefValue = data.PrefValue;
			filterValuesChart = JSON.parse('"' + prefValue + '"');
			filterValuesChart = JSON.parse(filterValuesChart);
			var result = [];
			$('.preferenceDropdown li').removeClass('active');
			$("li[data-prefId='" + prefId + "']").toggleClass('active');
		} else if (!data && !navigatation && prefId) {
			filterValuesChart = JSON.parse(LZString.decompressFromUTF16(localStorage.defaultPreference)).PrefValue;
			filterValuesChart = JSON.parse('"' + filterValuesChart + '"');
			filterValuesChart = JSON.parse(filterValuesChart);
		}
		if (LZString.decompressFromUTF16(localStorage.comboData)) {
			result = JSON.parse(LZString.decompressFromUTF16(localStorage.comboData));
		}
		if (!prefId) {
			setTimeout(function () {
				onSuccessFilter(result);
				IsPerferencePageChange = false;
			}, 1500);
		} else {

			setTimeout(function () {
				pagerelod = true;
				if (IsPerferencePageChange == false) {
					onSuccessFilter(result, null, true);
					//IsPerferencePageChange = false;
				} else {
					onSuccessFilter(result, null, false);
					IsPerferencePageChange = false;
				}
			}, 1500);
		}

	},

	hasPermission: function (moduleName) {
		var hasPermission = false;
		var data = LZString.decompressFromUTF16(localStorage.data);
		data = data ? JSON.parse(data).data : data;
		if (data) {
			if (data.roles[0].Role == 'Admin') {
				hasPermission = true;
			} else {
				var module = data.modules[moduleName];
				if (module && module.Permissions) {
					hasPermission = Number(module.Permissions.charAt(0)) != 0;
				}
			}
		}
		return hasPermission;
	},
	updateAlertStatus: function (alertId, statusId) {
		var alertParams = {
			AlertId: alertId,
			StatusId: statusId
		};
		$.ajax({
			url: coolerDashboard.common.nodeUrl('updateAlertStatus', alertParams),
			method: 'GET',
			success: function (data, request) {
				if (data.success) {
					var alertIdObj = LZString.decompressFromUTF16(localStorage.getItem("alertId"));
					if (!alertIdObj) {
						alertIdObj = '[]';
					}
					alertIdArr = JSON.parse(alertIdObj);
					alertIdArr.push(alertId)
					localStorage.setItem("alertId", LZString.compressToUTF16(JSON.stringify(alertIdArr)));
					$('#alertCount > .active > input').change();
				}
			}
		});
	},

	startRefreshAlert: function () {
		if (!this.startRefresh) {
			this.startRefresh = setInterval(function () {
				$('#alertCount > .active > input').change();
				coolerDashboard.common.openAlertCount();
			}, 60000);
		}
	},

	clearRefreshAlert: function () {
		if (this.startRefresh) {
			clearInterval(this.startRefresh);
			this.startRefresh = null;
			coolerDashboard.common.startRefreshAlert();
		}
	},

	alertDiv: function (priorityId, id) {
		var alertParams = {
			ClosedOn: '0001-01-01T00:00:00',
			start: 0,
			length: 100,
			PriorityId: priorityId
		};
		$.ajax({
			url: coolerDashboard.common.nodeUrl('alert/list', alertParams),
			method: 'GET',
			success: function (data, request) {
				var div = '';
				coolerDashboard.common.clearRefreshAlert();
				if (data && data.data) {
					var data = data.data,
						length = data.length,
						alertTypeIcons = coolerDashboard.renderers.alertTypeIcons,
						alertTypeText = coolerDashboard.renderers.alertTypeText;
					if (length > 0) {
						var data = _.sortBy(data, "AlertAt").reverse();
						for (var i = 0; i < length; i++) {
							var alertIdObj = LZString.decompressFromUTF16(localStorage.getItem("alertId")),
								record = data[i],
								alertId = record.Id;
							if (!alertIdObj) {
								alertIdObj = '[]';
							}
							var alertIdArr = JSON.parse(alertIdObj),
								index = jQuery.inArray(alertId, alertIdArr),
								icon = alertTypeIcons[record.AlertTypeId],
								text = alertTypeText[record.AlertTypeId],
								duration = moment(record.AlertAt).fromNow(),
								statusId = record.StatusId,
								unReadCss = coolerDashboard.common.alertStatus.New == statusId && index == -1 ? "unread" : "";

							div += '<li class = "alertLi" alertId =' + alertId + ' statusId =' + statusId + '>' +
								'<span class= ' + unReadCss + '>' +
								'<a href="javascript:void(0);" class="msg">' +
								'<img src= ' + icon + ' alt="" class="air air-top-left margin-top-5" width="40" height="40" />' +
								'<span class="from">' + record.Location + ' <i class="icon-paperclip"></i></span>' +
								'<time>' + duration + '</time>' +
								'<span class="subject">' + text + '</span>' +
								'<span class="msg-body">' + record.AlertText + ' </span>' +
								'</a>' +
								'</span>' +
								'</li>';
						}
					} else {
						div += '<div class="alert alert-transparent" style = " text-align: center;">' +
							'<h4>No Alert found</h4>' +
							'</div>';
					}
				}
				$(id).html(div);
				$('ul.notification-body li').click(function (e) {
					var alertId = $(this).attr('alertId');
					var statusId = $(this).attr('statusId');
					if (coolerDashboard.common.alertStatus.Acknowledged == statusId) {
						return;
					} else if (coolerDashboard.common.alertStatus.New == statusId) {
						coolerDashboard.common.updateAlertStatus(alertId, coolerDashboard.common.alertStatus.Acknowledged);
					}
				});
			},
			failure: function () {
				var div = '<div class="alert alert-transparent" style = " text-align: center;">' +
					'<h4>Some error occured</h4>' +
					'</div>';
				$(id).html(div);
			}
		});
	},

	updateDateFilterText: function (data, id) {
		var timeFilter = [];
		var htmlText = [];
		var year = (new Date()).getFullYear();
		if (Array.isArray(data)) {
			timeFilter = _.filter(data, function (timeData) {
				return timeData.name == "quarter" || timeData.name == "month" || timeData.name == "yearWeek" || timeData.name == "dayOfWeek"
			});
			if (timeFilter.length > 0) {
				var quarter = _.filter(timeFilter, function (timeData) {
					return timeData.name == 'quarter'
				}).forEach(function (name) {
					htmlText.push('Q' + name.value + '-' + year);
				});
				var month = _.filter(timeFilter, function (timeData) {
					return timeData.name == 'month'
				}).forEach(function (name) {
					htmlText.push(coolerDashboard.common.month[name.value]);
				});
				var yearWeek = _.filter(timeFilter, function (timeData) {
					return timeData.name == 'yearWeek'
				}).forEach(function (name) {
					htmlText.push('W' + name.value + '-' + year);
				});
				var dayOfWeek = _.filter(timeFilter, function (timeData) {
					return timeData.name == 'dayOfWeek'
				}).forEach(function (name) {
					htmlText.push(coolerDashboard.common.week[name.value]);
				});

				$(id).html('<b>' + htmlText.join(',') + '</b>');
			} else {
				var startDate = _.filter(data, function (timeData) {
					return timeData.name == 'startDate'
				}).forEach(function (name) {
					htmlText.push(this.dateTime(name.value, '-', coolerDashboard.dateFormat, false, 0, true));
				}, this);
				var endDate = _.filter(data, function (timeData) {
					return timeData.name == 'endDate'
				}).forEach(function (name) {
					htmlText.push(this.dateTime(name.value, '-', coolerDashboard.dateFormat, false, 0, true));
				}, this);
				$(id).html('<b>' + htmlText.join('-') + '</b>');
				return;
			}
		}
		if (timeFilter.length == 0) {
			$(id).html('<b>' + this.dateTime(data.startDate, '-', coolerDashboard.dateFormat, false, 0, true) + ' - ' + this.dateTime(data.endDate, '-', coolerDashboard.dateFormat, false, 0, true) + '</b>');
		}
	},

	onChartClick: function (chart, event) {
		setTimeout(function () {
			coolerDashboard.common.updateCTFFilterList($('#filterForm').serializeArray(), '#ctf-list', '.totalCTFCount');
		}, 100);
		var value;
		var $select2; // = select2;
		var thershold = JSON.parse(LZString.decompressFromUTF16(localStorage.data)).data.tags.CoolerTrackingThreshold;
		var numberthershold = Number(thershold);
		if (chart == 'CoolerTracking') {
			$select2 = $(".coolerTrackingType");
			if (event.point.name == 'Not Transmitting  (Over' + numberthershold + 'Days)') {
				value = "1";
			} else if (event.point.name == 'Wrong Location (Under' + numberthershold + 'Days)') {
				value = "2";
			} else {
				value = "3";
			}
		}
		if (chart == 'CoolerTrackingProximity') {
			$select2 = $(".coolerTrackingTypeProximity");
			if (event.point.name == 'Not Visited  (Over' + numberthershold + 'Days)') {
				value = "1";
			} else if (event.point.name == 'Missing (Under' + numberthershold + 'Days)') {
				value = "2";
			} else if (event.point.name == 'Wrong Location (Under' + numberthershold + 'Days)') {
				value = "3";
			} else {
				value = "4";
			}
		}
		if (chart == 'LastDataDownloaded') {
			$select2 = $(".LastDataDownloaded");
			if (event.point.series.name == 'No data for more than 90 days') {
				value = "1";
			} else if (event.point.series.name == 'Last data > 60, <90 days') {
				value = "2";
			} else if (event.point.series.name == 'Last data > 30, <60 days') {
				value = "3";
			} else {
				value = "4";
			}
		}

		if (chart == 'DoorSwingsVsTarget') {

			$select2 = $(".DoorSwingsVsTarget");
			if (event.point.name == 'A') {
				value = "1";
			} else if (event.point.name == 'B') {
				value = "2";
			} else if (event.point.name == 'C') {
				value = "3";
			} else if (event.point.name == 'D') {
				value = "4";
			} else if (event.point.name == 'E') {
				value = "5";
			}
		}

		if (chart == 'DataDownloadOutlet') {

			$select2 = $(".DataDownloadOutlet");
			if (event.point.name == 'Full Data') {
				value = "1";
			} else if (event.point.name == 'Partial Data') {
				value = "2";
			} else if (event.point.name == 'No Data') {
				value = "3";
			}
		}

		if (chart == 'ExcecuteCommandReport') {

			$select2 = $(".ExcecuteCommandReport");
			if (event.point.category == 'Executed') {
				value = "1";
			} else if (event.point.category == 'Scheduled') {
				value = "2";
			}
		}

		if (chart == 'ExcecuteCommandSpread') {

			$select2 = $(".ExcecuteCommandSpread");
			if (event.point.category == 'Executed<15 days') {
				value = "1";
			} else if (event.point.category == 'Executed > 15, <30 days') {
				value = "2";
			} else if (event.point.category == 'Executed > 30, <60 days') {
				value = "3";
			} else if (event.point.category == 'Executed >60 days') {
				value = "4";
			}
		}

		if (chart == 'DataDownloaded') {
			$select2 = $(".DataDownloaded");
			if (event.point.name == 'Data Downloaded') {
				value = "1";
			} else if (event.point.name == 'Data Not Downloaded') {
				value = "2";
			}
		}

		if (chart == 'OperationalIssues') {
			$select2 = $(".OperationalIssues");
			if (event.point.series.name == 'No Light' && event.point.category == '8 - 12 Hours') {
				value = "1";
			} else if (event.point.series.name == 'No Light' && event.point.category == '12 - 24 Hours') {
				value = "2";
			} else if (event.point.series.name == 'High Temperature' && event.point.category == '8 - 12 Hours') {
				value = "3";
			} else if (event.point.series.name == 'High Temperature' && event.point.category == '12 - 24 Hours') {
				value = "4";
			} else if (event.point.series.name == 'Power Off' && event.point.category == '8 - 12 Hours') {
				value = "5";
			} else if (event.point.series.name == 'Power Off' && event.point.category == '12 - 24 Hours') {
				value = "6";
			}
		}

		if (chart == 'telemetryDoorCount') {
			$select2 = $(".telemetryDoorCount");
			if (event.point.category == '0-25') {
				value = "1";
			} else if (event.point.category == '26-50') {
				value = "2";
			} else if (event.point.category == '51-75') {
				value = "3";
			} else if (event.point.category == '76-100') {
				value = "4";
			} else if (event.point.category == '101-125') {
				value = "5";
			} else if (event.point.category == '125+') {
				value = "6";
			} else if (event.point.category == 'No-Data') {
				value = "7";
			}
		}

		if (chart == 'batteryReprtData') {
			$select2 = $(".batteryReprtData");
			if (event.point.category == '0%-25%') {
				value = "1";
			} else if (event.point.category == '25%-50%') {
				value = "2";
			} else if (event.point.category == '50%-75%') {
				value = "3";
			} else if (event.point.category == '75%-100%') {
				value = "4";
			}
		}

		if (chart == 'TemperatureTele') {
			$select2 = $(".TemperatureTele");
			if (event.point.category == 'Below 0') {
				value = "1";
			} else if (event.point.category == '0-5') {
				value = "2";
			} else if (event.point.category == '5-10') {
				value = "3";
			} else if (event.point.category == '10-15') {
				value = "4";
			} else if (event.point.category == ' >= 15') {
				value = "5";
			} else if (event.point.category == 'No-Data') {
				value = "6";
			}
		}

		if (chart == 'MagnetFallenChartCTF') {
			$select2 = $(".MagnetFallenChartCTF");
			if (event.point.category == 'Normal Operation') {
				value = "1";
			} else if (event.point.category == 'Fallen Magnet') {
				value = "2";
			}
		}

		if (chart == 'MagnetFallenSpreadCTF') {
			$select2 = $(".MagnetFallenSpreadCTF");
			if (event.point.category == '30 days > FallenMagnet > 15 days') {
				value = "1";
			} else if (event.point.category == '60 days > FallenMagnet > 30 days') {
				value = "2";
			} else if (event.point.category == '90 days > FallenMagnet > 60 days') {
				value = "3";
			}
		}

		if (chart == 'EvaporatorTemperatureTele') {
			$select2 = $(".EvaporatorTemperatureTele");
			if (event.point.category == 'Below 0') {
				value = "1";
			} else if (event.point.category == '0-5') {
				value = "2";
			} else if (event.point.category == '5-10') {
				value = "3";
			} else if (event.point.category == '10-15') {
				value = "4";
			} else if (event.point.category == ' >= 15') {
				value = "5";
			} else if (event.point.category == 'No-Data') {
				value = "6";
			}
		}

		if (chart == 'telemetryPowerStatus') {
			$select2 = $(".telemetryPowerStatus");
			if (event.point.category == '&lt; 1') {
				value = "1";
			} else if (event.point.category == '1-4 Hrs') {
				value = "2";
			} else if (event.point.category == '4-8 Hrs') {
				value = "3";
			} else if (event.point.category == '8-12 Hrs') {
				value = "4";
			} else if (event.point.category == '12-16 Hrs') {
				value = "5";
			} else if (event.point.category == '16-24 Hrs') {
				value = "6";
			} else if (event.point.category == 'No-Data') {
				value = "7";
			} else if (event.point.category == 'No-Interruptions') {
				value = "8";
			}
		}

		if (chart == 'telemetryLightStatus') {
			$select2 = $(".telemetryLightStatus");
			if (event.point.category == 'Light') {
				value = "1";
			} else if (event.point.category == 'No Light') {
				value = "2";
			} else if (event.point.category == 'No-Data') {
				value = "nodata";
			}
		}


		if (chart == 'CompressorBand') {
			$select2 = $(".CompressorBand");
			if (event.point.category == '&lt; 1') {
				value = "1";
			} else if (event.point.category == '1-4 Hrs') {
				value = "2";
			} else if (event.point.category == '4-8 Hrs') {
				value = "3";
			} else if (event.point.category == '8-12 Hrs') {
				value = "4";
			} else if (event.point.category == '12-16 Hrs') {
				value = "5";
			} else if (event.point.category == '16-24 Hrs') {
				value = "6";
			} else if (event.point.category == 'No-Data') {
				value = "7";
			}
		}

		if (chart == 'FanBand') {
			$select2 = $(".FanBand");
			if (event.point.category == '&lt; 1') {
				value = "1";
			} else if (event.point.category == '1-4 Hrs') {
				value = "2";
			} else if (event.point.category == '4-8 Hrs') {
				value = "3";
			} else if (event.point.category == '8-12 Hrs') {
				value = "4";
			} else if (event.point.category == '12-16 Hrs') {
				value = "5";
			} else if (event.point.category == '16-24 Hrs') {
				value = "6";
			} else if (event.point.category == 'No-Data') {
				value = "7";
			}
		}



		if (chart == 'TempLightIssue') {

			$select2 = $(".TempLightIssue");
			if (event.point.name == 'Temperature And Light Issue') {
				value = "1";
			} else if (event.point.name == 'Temperature Issue') {
				value = "2";
			} else if (event.point.name == 'Light Malfunction') {
				value = "3";
			} else if (event.point.name == 'Temperature and Light OK') {
				value = "4";
			}
		}

		if (chart == 'DoorOpenvsSales') {
			$select2 = $(".DoorOpenVsSales");
			value = event;
		}


		var alreadyExist = $select2.select2('data');
		var _items = [];
		_items.push(value);
		if (alreadyExist.length > 0) {
			alreadyExist.forEach(function (element) {
				_items.push(element.id);
			});
		}

		$select2.select2().val(_items).change();
	},
	updateAppliedFilterText: function (data, id, countId, ctflist) {
		coolerDashboard.common.updateCTFFilterList(data, '#ctf-list', '.totalCTFCount');
		Array.prototype.uniqueObjects = function () {
			function compare(a, b) {
				for (var prop in a) {
					if (a[prop] != b[prop]) {
						return false;
					}
				}
				return true;
			}
			return this.filter(function (item, index, list) {
				for (var i = 0; i < index; i++) {
					if (compare(item, list[i])) {
						return false;
					}
				}
				return true;
			});
		}

		data = data.uniqueObjects();

		//data = $.unique(data);

		var datainto = data;
		var htmlData = '';
		var ctfHtmlData = '';
		var ctfHtmlDataTitle;
		var comboData = JSON.parse(LZString.decompressFromUTF16(localStorage.getItem("comboData")));
		comboData = comboData.data;
		var filterMapping = {
			//"startDate": "Start Date",
			//"endDate": "End Date",
			"LocationTypeId": "Trade Channel",
			"IsKeyLocation": "Key Location",
			"ClassificationId": "Customer Tier",
			"SubTradeChannelTypeId": "Sub Trade Channel",
			"LocationCode": "Location Code",
			"CountryId": "Country",
			"City": "City",
			//Sales organizarion 
			"SalesOrganizationId": "SalesOrganization",
			"SalesOfficeId": "Sales Office",
			"SalesGroupId": "Sales Group",
			"TerritoryId": "Sales Territory",
			"UserId": "Sales Rep",
			"SalesHierarchyId": "Sales Hierarchy",
			//Cooler
			"AssetManufacturerId": "Cooler Manufacturer",
			"AssetTypeId": "Model",
			"IsFactoryAsset": "Factory Asset",
			"IsOpenFront": "Open Front",
			"AssetTypeCapacityId": "Asset Type capacity",
			//Smart Device
			"SmartDeviceManufacturerId": "Smart Device Manufacturer",
			"SmartDeviceTypeId": "Device Type",
			//Alert
			"AlertTypeId": "Alert Type",
			"PriorityId": "Alarm Priority",
			"StatusId": "Alarm Status",
			//KPI
			"DisplacementFilter": "Displacement",
			"DisplacementFilterHistoric": "Historic Displacement",
			"DoorCount": "Door Count",
			"TempBand": "Temperature",
			"LightStatus": "Light Status",
			"PowerStatus": "Power off",
			"DoorOpenVsSales": "Door Open Vs Sales",
			"OperationalIssues": "Operational Issues",
			"CoolerHealth": "Cooler Health",
			"TempLightIssue": "Temperature and Light Status",
			"DoorSwingsVsTarget": "Door Swings Vs Target",
			//Data
			"installationDate": "Installation Date",
			"lastDataReceived": "Last Data Received",
			"doorDataSelected": "Door Data",
			"salesDataSelected": "Sales Data",
			"coolerTracking": "Cooler Tracking Always On",
			"coolerTrackingProximity": "Cooler Tracking Proximity",
			"OutletTypeId": "Outlet Type",
			"TeleSellingTerritoryId": "MultiTerritory",
			"LastDataDownloaded": "Last Data Downloaded",
			"DataDownloaded": "Data Downloaded",
			//Telemetry
			"telemetryDoorCount": "Door Status",
			"TemperatureTele": "Temperature",
			"EvaporatorTemperatureTele": "Evaporator Temperature",
			"telemetryPowerStatus": "Power Off",
			"telemetryLightStatus": "Light Status",
			//TechnicalDiagnostics
			"CompressorBand": "Compressor",
			"FanBand": "Fan",
			//Report
			"batteryReprtData": "Battery Level Report",
			"DataDownloadOutlet": "Data Download By Outlet",
			"ExcecuteCommandReport": "Exceuted Command Report",
			"ExcecuteCommandSpread": "Exceuted Command Spread",
			//Fallen Magnet
			"MagnetFallenChartCTF": "Magnet Fallen Chart",
			"MagnetFallenSpreadCTF": "Magnet Fallen Spread"
		};


		//var isDupicate = false;
		var LastValue = '';
		var filtercount = 0; // data.length;
		var isOutletClassification = false;
		var isLocation = false;
		var isSalesOrganization = false;
		var isCooler = false;
		var isSmartDevice = false;
		var isAlert = false;
		var isKPI = false;
		var isData = false;
		//var isCTF = false;
		var isTechnicalDiagnostics = false;
		var isTelemetry = false;

		$(".SelectedLocationTypeId").html('');
		$(".SelectedIsKeyLocation").html('');
		$(".SelectedClassificationId").html('');
		$(".SelectedSubTradeChannelTypeId").html('');
		$(".SelectedCity").html('');
		$(".SelectedCountryId").html('');
		$(".SelectedLocationCode").html('');
		$(".SelectedSalesOrganizationId").html('');
		$(".SelectedSalesOfficeId").html('');
		$(".SelectedSalesGroupId").html('');
		$(".SelectedTerritoryId").html('');
		$(".SelectedUserId").html('');
		$(".SelectedSalesHierarchyId").html('');
		$(".SelectedAssetManufacturerId").html('');
		$(".SelectedIsFactoryAsset").html('');
		$(".SelectedAssetTypeId").html('');
		$(".SelectedIsOpenFront").html('');
		$(".SelectedAssetCapacityType").html('');
		$(".SelectedSmartTypeId").html('');
		$(".SelectedOutletTypeId").html('');
		$(".SelectedTeleSellingTerritoryId").html('');
		$(".SelectedSmartDeviceManufacturerId").html('');
		$(".SelectedSmartDeviceTypeId").html('');

		$(".SelectedAlertTypeId").html('');
		$(".SelectedPriorityId").html('');
		$(".SelectedStatusId").html('');

		$(".SelectedDisplacementFilter").html('');
		$(".SelectedDisplacementFilterHistoric").html('');
		$(".SelectedDoorCount").html('');
		$(".SelectedTempBand").html('');
		$(".SelectedLightStatus").html('');
		$(".SelectedPowerStatus").html('');

		$(".SelectedcoolerTracking").html('');
		$(".SelectedcoolerTrackingProximity").html('');
		$(".SelectedDoorOpenVsSales").html('');
		$(".SelectedOperationalIssues").html('');
		$(".SelectedCoolerHealth").html('');
		$(".SelectedTempLightIssue").html('');
		$(".SelectedDoorSwingsVsTarget").html('');
		$(".SelectedDataDownloadOutlet").html('');
		$(".SelectedExcecuteCommandReport").html('');
		$(".SelectedExcecuteCommandSpread").html('');
		$(".SelectedinstallationDate").html('');
		$(".SelectedlastDataReceived").html('');
		$(".SelecteddoorDataSelected").html('');
		$(".SelectedsalesDataSelected").html('');
		$(".SelectedLastDataDownloaded").html('');
		$(".SelectedDataDownloaded").html('');

		$(".SelectedtelemetryDoorCount").html('');
		$(".SelectedbatteryReprtData").html('');
		$(".SelectedTemperatureTele").html('');
		$(".SelectedMagnetFallenChartCTF").html('');
		$(".SelectedMagnetFallenSpreadCTF").html('');
		$(".SelectedtelemetryPowerStatus").html('');
		$(".SelectedtelemetryLightStatus").html('');
		$(".SelectedEvaporatorTemperatureTele").html('');

		$(".SelectedTechnicalDiagnosticsSelected").html('');

		$(".SelectedCompressorBand").html('');
		$(".SelectedFanBand").html('');

		var Filtered = {};
		AppliedFilterArray = [];
		data.forEach(function (filter) {

			//ignore Some Filters
			htmlData = '';
			//ctfHtmlData = '';
			if (filter.name == 'startDate' || filter.name == 'endDate') {
				filtercount++;
				return;
			}

			if (filter.name == 'DisplacementFilter' && filter.value == '-1') {
				filtercount++;
				return;
			}

			var filterName = datainto.filter(function (data) {
				return data.name == filter.name
			});

			if (filterName && filterName.length > 0) {
				var DisplayName = filterMapping[filterName[0].name];

				if (DisplayName == undefined) {
					filtercount++;
					return
				} else if (LastValue != DisplayName) {
					htmlData = '<span class="alert alert-info col-sm-12 well"><div style="padding-right:10px">' + DisplayName + '</div>';
					ctfHtmlDataTitle = '<span class="ctf-title">' + DisplayName + '</span><div class="ctf-filter">';
				} else
					return

				LastValue = DisplayName;
				Filtered.FilteredValue = '';
				Filtered.FilteredSegment = LastValue;

				filterName.forEach(function (data) {

					var combo, comboSales;
					if (data.name == "LocationTypeId") {
						combo = comboData.LocationType;
						isOutletClassification = true;
						Filtered.FilteredSection = "Outlet Classification";
					}
					if (data.name == "IsKeyLocation") {
						combo = combo = [{
							"LookupId": "1",
							"DisplayValue": "True",
							//"ComboType": "City"
						}];
						isOutletClassification = true;
						Filtered.FilteredSection = "Outlet Classification";
					}
					if (data.name == "IsFactoryAsset") {
						combo = [{
							"LookupId": "1",
							"DisplayValue": "True",
							"IsDefault": true

						}];
						isCooler = true;
						Filtered.FilteredSection = "Cooler";
					}
					if (data.name == "IsOpenFront") {
						combo = [{
							"LookupId": "1",
							"DisplayValue": "True",
							"IsDefault": true

						}];
						isCooler = true;
						Filtered.FilteredSection = "Cooler";
					}
					if (data.name == "ClassificationId") {
						combo = comboData.LocationClassification;
						isOutletClassification = true;
						Filtered.FilteredSection = "Outlet Classification";
					}
					if (data.name == "SubTradeChannelTypeId") {
						combo = comboData.SubTradeChannelType;
						isOutletClassification = true;
						Filtered.FilteredSection = "Outlet Classification";
					}
					if (data.name == "LocationCode") {
						combo = comboData.LocationType;
						isLocation = true;
						Filtered.FilteredSection = "Location";
					}
					if (data.name == "CountryId") {
						combo = comboData.Country;
						isLocation = true;
						Filtered.FilteredSection = "Location";
					}
					if (data.name == "City") {
						isLocation = true;
						Filtered.FilteredSection = "Location";
					}
					if (data.name == "SalesOrganizationId") {
						combo = comboData.SalesOrganization;
						//isSalesOrganization = true;
						Filtered.FilteredSection = "Sales Organization";
					}
					if (data.name == "SalesOfficeId") {
						combo = comboData.SalesOffice;
						//	isSalesOrganization = true;
						Filtered.FilteredSection = "Sales Organization";
					}
					if (data.name == "SalesGroupId") {
						combo = comboData.SalesGroup;
						//	isSalesOrganization = true;
						Filtered.FilteredSection = "Sales Organization";
					}

					if (data.name == "SalesHierarchyId") {
						comboSales = comboData.SalesHierarchy;
						isSalesOrganization = true;
						Filtered.FilteredSection = "Sales Organization";
					}
					if (data.name == "TerritoryId") {
						combo = comboData.SalesTerritory;
						//isCooler = true;
					}
					if (data.name == "UserId") {
						combo = comboData.SalesRep;
						isSalesOrganization = true;
						Filtered.FilteredSection = "Sales Organization";
					}
					if (data.name == "AssetManufacturerId") {
						combo = comboData.ManufacturerAsset;
						isCooler = true;
						Filtered.FilteredSection = "Cooler";
					}
					if (data.name == "AssetTypeId") {
						combo = comboData.AssetType;
						isCooler = true;
						Filtered.FilteredSection = "Cooler";
					}

					if (data.name == "AssetTypeCapacityId") {
						combo = comboData.AssetTypeCapacity;
						isCooler = true;
						Filtered.FilteredSection = "Cooler";
					}


					if (data.name == "OutletTypeId") {
						//	combo = comboData.AssetType;
						//isCooler = true;
						isLocation = true;
						Filtered.FilteredSection = "Cooler";
					}

					if (data.name == "TeleSellingTerritoryId") {
						combo = comboData.TeleSellingTerritory;
						//isCooler = true;
						isSalesOrganization = true;
						Filtered.FilteredSection = "MultiTerritoryy";
					}

					if (data.name == "SmartDeviceManufacturerId") {
						combo = comboData.ManufacturerSmartDevice;
						isSmartDevice = true;
						Filtered.FilteredSection = "Smart Device";
					}
					if (data.name == "SmartDeviceTypeId") {
						combo = comboData.SmartDeviceType;
						isSmartDevice = true;
						Filtered.FilteredSection = "Smart Device";
					}
					if (data.name == "AlertTypeId") {
						combo = comboData.AlertType;
						isAlert = true;
						Filtered.FilteredSection = "Alert";
					}
					if (data.name == "PriorityId") {
						combo = [{
								"LookupId": "4227",
								"DisplayValue": "High",
								//"ComboType": "City"
							},
							{
								"LookupId": "4226",
								"DisplayValue": "Medium",
								//"ComboType": "City"
							},
							{
								"LookupId": "4225",
								"DisplayValue": "Low",
								//"ComboType": "City"
							},
						]

						isAlert = true;
						Filtered.FilteredSection = "Alert";
					}
					if (data.name == "StatusId") {
						combo = comboData.AlertStatus;
						isAlert = true;
						Filtered.FilteredSection = "Alert";
					}
					if (data.name == "DisplacementFilter") {
						combo = comboData.Displacement;
						//isKPI = true;
						isTelemetry = true;
						Filtered.FilteredSection = "Telemetry";
					}
					if (data.name == "DisplacementFilterHistoric") {
						combo = comboData.DisplacementHistoric;
						isTelemetry = true;
						Filtered.FilteredSection = "Telemetry";
					}
					if (data.name == "DoorCount") {
						combo = comboData.DoorCount;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
					}
					if (data.name == "TempBand") {
						combo = comboData.TempBand;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
					}
					if (data.name == "LightStatus") {
						combo = comboData.LightBand;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
					}
					if (data.name == "PowerStatus") {
						combo = comboData.PowerBand;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
					}
					if (data.name == "installationDate") {
						combo = comboData.InstallationDateType;
						isData = true;
						Filtered.FilteredSection = "Data";
					}
					if (data.name == "lastDataReceived") {
						combo = comboData.LastDataReceivedType;
						isData = true;
						Filtered.FilteredSection = "Data";
					}
					if (data.name == "doorDataSelected") {
						combo = comboData.DoorDataSelectedType;
						isData = true;
						Filtered.FilteredSection = "Data";
					}
					if (data.name == "salesDataSelected") {
						combo = comboData.SalesDataSelectedType;
						isData = true;
						Filtered.FilteredSection = "Data";
					}
					if (data.name == "coolerTracking") {
						combo = comboData.CoolerTrackingType;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
						//isCTF = true;
					}

					if (data.name == "coolerTrackingProximity") {
						combo = comboData.CoolerTrackingTypeProximity;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
						//isCTF = true;
					}

					if (data.name == "OutletTypeId") {
						combo = [{
							LookupId: '6282',
							DisplayValue: 'Market',
							IsDefault: true
						}, {
							LookupId: '6283',
							DisplayValue: 'WareHouse'
						}, {
							LookupId: '7287',
							DisplayValue: 'Test'
						}, {
							LookupId: '0',
							DisplayValue: 'All'
						}];
					}


					//KPI
					if (data.name == "DoorOpenVsSales") {
						combo = comboData.DoorOpenVsSales;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
					}


					if (data.name == "OperationalIssues") {
						combo = comboData.OperationalIssues;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
					}


					if (data.name == "CoolerHealth") {
						combo = comboData.CoolerHealth;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
					}


					if (data.name == "TempLightIssue") {
						combo = comboData.TempLightIssue;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
					}

					if (data.name == "DoorSwingsVsTarget") {
						combo = comboData.DoorSwingsVsTarget;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
					}

					if (data.name == "DataDownloadOutlet") {
						combo = comboData.DataDownloadOutlet;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
					}

					if (data.name == "ExcecuteCommandReport") {
						combo = comboData.ExcecuteCommandReport;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
					}

					if (data.name == "ExcecuteCommandSpread") {
						combo = comboData.ExcecuteCommandSpread;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
					}

					//Data
					if (data.name == "LastDataDownloaded") {
						combo = comboData.LastDataDownloaded;
						isData = true;
						Filtered.FilteredSection = "Data";
					}

					if (data.name == "DataDownloaded") {
						combo = comboData.DataDownloaded;
						isData = true;
						Filtered.FilteredSection = "Data";
					}

					//Report
					if (data.name == "batteryReprtData") {
						combo = comboData.batteryReprtData;
						isTelemetry = true;
						Filtered.FilteredSection = "Telemetry";
					}

					//Fallen Magnet
					if (data.name == "MagnetFallenChartCTF") {
						combo = comboData.MagnetFallenChartCTF;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
					}

					//Fallen Magnet Spread
					if (data.name == "MagnetFallenSpreadCTF") {
						combo = comboData.MagnetFallenSpreadCTF;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
					}

					//Telemetry

					if (data.name == "telemetryDoorCount") {
						combo = comboData.TelemetryDoorCount;
						isTelemetry = true;
						Filtered.FilteredSection = "Telemetry";
					}

					if (data.name == "TemperatureTele") {
						combo = comboData.TemperatureTele;
						isTelemetry = true;
						Filtered.FilteredSection = "Telemetry";
					}

					if (data.name == "EvaporatorTemperatureTele") {
						combo = comboData.EvaporatorTemperatureTele;
						isTelemetry = true;
						Filtered.FilteredSection = "Telemetry";
					}

					if (data.name == "telemetryPowerStatus") {
						combo = comboData.telemetryPowerStatus;
						isTelemetry = true;
						Filtered.FilteredSection = "Telemetry";
					}

					if (data.name == "telemetryLightStatus") {
						combo = comboData.TelemetryLightStatus;
						isTelemetry = true;
						Filtered.FilteredSection = "Telemetry";
					}
					//TechnicalDiagnostics
					if (data.name == "CompressorBand") {
						combo = comboData.CompressorBand;
						isTechnicalDiagnostics = true;
						Filtered.FilteredSection = "Technical Diagnostics";
					}
					if (data.name == "FanBand") {
						combo = comboData.FanBand;
						isTechnicalDiagnostics = true;
						Filtered.FilteredSection = "Technical Diagnostics";
					}


					var value = data.value;
					if (combo) {
						var detailfilter = combo.filter(function (combodata) {
							return combodata.LookupId == data.value;
						});
						if (detailfilter && detailfilter.length > 0) {
							value = detailfilter[0].DisplayValue;
						}
					}

					if (comboSales) {
						var detailfilter = comboSales.filter(function (combodata) {
							return combodata.SalesHierarchyId == data.value
						});
						if (detailfilter && detailfilter.length > 0) {
							value = detailfilter[0].Name
						}
					}

					//htmlData += '<span class="label label-info label-lg">' + value + '</span>\n';
					htmlData += '<span class="ctf-type">' + value + '<span class="ctf-close-type"><button onclick="coolerDashboard.common.updateFilter(event)" id="' + data.name + '-' + data.value.replace(/\s/g, '___').replace('.', "_dot_") + '-applied"><i class="fa fa-close"></i></button></span></span>';
					// if (isCTF) {
					// 	ctfHtmlData += '<span class="ctf-type">' + value + '<span class="ctf-close-type"><button onclick="coolerDashboard.common.updateCTFFilter(event)" id="' + data.name + '-' + data.value + '"><i class="fa fa-close"></i></button></span></span>'
					// }
					Filtered.FilteredValue += value + ",";

					//AppliedFilterArray.push(Filtered);
					//htmlData = "";
				});
				htmlData += '</span>';
				AppliedFilterArray.push(Filtered);
				Filtered = {};
				$('.Selected' + filterName[0].name).html(htmlData);
				// if (isCTF) {
				// 	ctfHtmlData += '</div>';
				// 	$(ctflist).html(ctfHtmlDataTitle + ctfHtmlData);
				// } else {
				// 	$(ctflist).html('');
				// }
			}
		});


		if (isOutletClassification) {
			$('#SelectedClassification').removeClass('hidden');
			$('#SelectedClassificationDiv').removeClass('hidden');

		} else {
			$('#SelectedClassification').addClass('hidden');
			$('#SelectedClassificationDiv').addClass('hidden');
		}

		if (isLocation) {
			$('#SelectedLocation').removeClass('hidden');
			$('#SelectedLocationDiv').removeClass('hidden');
		} else {
			$('#SelectedLocation').addClass('hidden');
			$('#SelectedLocationDiv').addClass('hidden');
		}

		if (isSalesOrganization) {
			$('#SelectedSalesOrganization').removeClass('hidden');
			$('#SelectedSalesOrganizationDiv').removeClass('hidden');
		} else {
			$('#SelectedSalesOrganization').addClass('hidden');
			$('#SelectedSalesOrganizationDiv').addClass('hidden');
		}

		if (isCooler) {
			$('#SelectedCooler').removeClass('hidden');
			$('#SelectedCoolerDiv').removeClass('hidden');
		} else {
			$('#SelectedCooler').addClass('hidden');
			$('#SelectedCoolerDiv').addClass('hidden');
		}

		if (isSmartDevice) {
			$('#SelectedSmartDevice').removeClass('hidden');
			$('#SelectedSmartDeviceDiv').removeClass('hidden');
		} else {
			$('#SelectedSmartDevice').addClass('hidden');
			$('#SelectedSmartDeviceDiv').addClass('hidden');
		}

		if (isAlert) {
			$('#SelectedAlert').removeClass('hidden');
			$('#SelectedAlertDiv').removeClass('hidden');
		} else {
			$('#SelectedAlert').addClass('hidden');
			$('#SelectedAlertDiv').addClass('hidden');
		}

		if (isKPI) {
			$('#SelectedKPI').removeClass('hidden');
			$('#SelectedKPIDiv').removeClass('hidden');
		} else {
			$('#SelectedKPI').addClass('hidden');
			$('#SelectedKPIDiv').addClass('hidden');
		}

		if (isData) {
			$('#SelectedData').removeClass('hidden');
			$('#SelectedDataDiv').removeClass('hidden');
		} else {
			$('#SelectedData').addClass('hidden');
			$('#SelectedDataDiv').addClass('hidden');
		}

		if (isTelemetry) {
			$('#SelectedTelemetry').removeClass('hidden');
			$('#SelectedTelemetryDiv').removeClass('hidden');
		} else {
			$('#SelectedTelemetry').addClass('hidden');
			$('#SelectedTelemetryDiv').addClass('hidden');
		}

		if (isTechnicalDiagnostics) {
			$('#SelectedTechnicalDiagnostics').removeClass('hidden');
			$('#SelectedTechnicalDiagnosticsDiv').removeClass('hidden');
		} else {
			$('#SelectedTechnicalDiagnostics').addClass('hidden');
			$('#SelectedTechnicalDiagnosticsDiv').addClass('hidden');
		}




		if (filtercount == 0) {
			$('#noFilterSlected').removeClass('hidden');
		} else {
			$('#noFilterSlected').addClass('hidden');
		}


		if (data.length > 0) {
			if (filtercount != 0) {
				$(countId).html(data.length - filtercount);
				if (data.length - filtercount == 0) {
					$('#filterDialog').addClass('disabled');
				} else {
					$('#filterDialog').removeClass('disabled');
				}

			} else {
				$(countId).html(data.length);
				if (data.length == 0) {
					$('#filterDialog').addClass('disabled');
				} else {
					$('#filterDialog').removeClass('disabled');
				}

			}

		}
	},
	updateCTFFilterList: function (data, ctflist, ctfCount) {
		$(ctflist).html('');
		Array.prototype.uniqueObjects = function () {
			function compare(a, b) {
				for (var prop in a) {
					if (a[prop] != b[prop]) {
						return false;
					}
				}
				return true;
			}
			return this.filter(function (item, index, list) {
				for (var i = 0; i < index; i++) {
					if (compare(item, list[i])) {
						return false;
					}
				}
				return true;
			});
		}

		data = data.uniqueObjects();

		//data = $.unique(data);

		var datainto = data;
		//var htmlData = '';
		var ctfHtmlData = '';
		var ctfHtmlDataTitle;
		var comboData = JSON.parse(LZString.decompressFromUTF16(localStorage.getItem("comboData")));
		comboData = comboData.data;
		var filterMapping = {
			//KPI
			"DoorOpenVsSales": "Door Open Vs Sales",
			"OperationalIssues": "Operational Issues",
			"CoolerHealth": "Cooler Health",
			"TempLightIssue": "Temperature and Light Status",
			"DoorSwingsVsTarget": "Door Swings Vs Target",
			//Data
			"coolerTracking": "Cooler Tracking Always On",
			"coolerTrackingProximity": "Cooler Tracking Proximity",
			"TeleSellingTerritoryId": "MultiTerritory",
			"LastDataDownloaded": "Last Data Downloaded",
			"DataDownloaded": "Data Downloaded",
			//Telemetry
			"telemetryDoorCount": "Door Status",
			"TemperatureTele": "Temperature",
			"EvaporatorTemperatureTele": "Evaporator Temperature",
			"telemetryPowerStatus": "Power Off",
			"telemetryLightStatus": "Light Status",
			//TechnicalDiagnostics
			"CompressorBand": "Compressor",
			"FanBand": "Fan",
			//Report
			"batteryReprtData": "Battery Level Report",
			//reort
			"DataDownloadOutlet": "Data Download By Outlet",
			"ExcecuteCommandReport": "Exceuted Command Report",
			"ExcecuteCommandSpread": "Exceuted Command Spread",
			//Fallen Magnet
			"MagnetFallenChartCTF": "Magnet Fallen Chart",
			"MagnetFallenSpreadCTF": "Magnet Fallen Spread"
		};


		//var isDupicate = false;
		var LastValue = '';
		var filtercount = 0; // data.length;
		var isCTF = false;

		var Filtered = {};
		//AppliedFilterArray = [];
		data.forEach(function (filter) {

			//ignore Some Filters
			htmlData = '';
			//ctfHtmlData = '';
			if (filter.name == 'startDate' || filter.name == 'endDate') {
				//filtercount++;
				return;
			}
			var filterName = datainto.filter(function (data) {
				return data.name == filter.name
			});

			if (filterName && filterName.length > 0) {
				var DisplayName = filterMapping[filterName[0].name];

				if (DisplayName == undefined) {
					//filtercount++;
					return
				} else if (LastValue != DisplayName) {
					//htmlData = '<span class="alert alert-info col-sm-12 well"><div style="padding-right:10px">' + DisplayName + '</div>';
					ctfHtmlData += '<span class="ctf-title">' + DisplayName + '</span><div class="ctf-filter">';
				} else
					return

				LastValue = DisplayName;
				Filtered.FilteredValue = '';
				Filtered.FilteredSegment = LastValue;

				filterName.forEach(function (data) {

					var combo, comboSales;
					if (data.name == "coolerTracking") {
						combo = comboData.CoolerTrackingType;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
						isCTF = true;
					}
					if (data.name == "coolerTrackingProximity") {
						combo = comboData.CoolerTrackingTypeProximity;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
						isCTF = true;
					}

					if (data.name == "coolerTracking") {
						combo = comboData.CoolerTrackingType;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
						//isCTF = true;
						isCTF = true;
					}

					if (data.name == "coolerTrackingProximity") {
						combo = comboData.CoolerTrackingTypeProximity;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
						isCTF = true;
					}

					//KPI
					if (data.name == "DoorOpenVsSales") {
						combo = comboData.DoorOpenVsSales;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
						isCTF = true;
					}


					if (data.name == "OperationalIssues") {
						combo = comboData.OperationalIssues;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
						isCTF = true;
					}


					if (data.name == "CoolerHealth") {
						combo = comboData.CoolerHealth;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
						isCTF = true;
					}


					if (data.name == "TempLightIssue") {
						combo = comboData.TempLightIssue;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
						isCTF = true;
					}

					if (data.name == "DoorSwingsVsTarget") {
						combo = comboData.DoorSwingsVsTarget;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
						isCTF = true;
					}

					if (data.name == "DataDownloadOutlet") {
						combo = comboData.DataDownloadOutlet;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
						isCTF = true;
					}

					if (data.name == "ExcecuteCommandReport") {
						combo = comboData.ExcecuteCommandReport;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
						isCTF = true;
					}

					if (data.name == "ExcecuteCommandSpread") {
						combo = comboData.ExcecuteCommandSpread;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
						isCTF = true;
					}
					//Data
					if (data.name == "LastDataDownloaded") {
						combo = comboData.LastDataDownloaded;
						isData = true;
						Filtered.FilteredSection = "Data";
						isCTF = true;
					}

					if (data.name == "DataDownloaded") {
						combo = comboData.DataDownloaded;
						isData = true;
						Filtered.FilteredSection = "Data";
						isCTF = true;
					}

					//Report
					if (data.name == "batteryReprtData") {
						combo = comboData.batteryReprtData;
						isTelemetry = true;
						Filtered.FilteredSection = "Telemetry";
						isCTF = true;
					}

					//Fallen Magnet
					if (data.name == "MagnetFallenChartCTF") {
						combo = comboData.MagnetFallenChartCTF;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
						isCTF = true;
					}

					//Fallen Magnet Spread
					if (data.name == "MagnetFallenSpreadCTF") {
						combo = comboData.MagnetFallenSpreadCTF;
						isKPI = true;
						Filtered.FilteredSection = "KPI";
						isCTF = true;
					}

					//Telemetry

					if (data.name == "telemetryDoorCount") {
						combo = comboData.TelemetryDoorCount;
						isTelemetry = true;
						Filtered.FilteredSection = "Telemetry";
						isCTF = true;
					}

					if (data.name == "TemperatureTele") {
						combo = comboData.TemperatureTele;
						isTelemetry = true;
						Filtered.FilteredSection = "Telemetry";
						isCTF = true;
					}

					if (data.name == "EvaporatorTemperatureTele") {
						combo = comboData.EvaporatorTemperatureTele;
						isTelemetry = true;
						Filtered.FilteredSection = "Telemetry";
						isCTF = true;
					}

					if (data.name == "telemetryPowerStatus") {
						combo = comboData.telemetryPowerStatus;
						isTelemetry = true;
						Filtered.FilteredSection = "Telemetry";
						isCTF = true;
					}

					if (data.name == "telemetryLightStatus") {
						combo = comboData.TelemetryLightStatus;
						isTelemetry = true;
						Filtered.FilteredSection = "Telemetry";
						isCTF = true;
					}
					//TechnicalDiagnostics
					if (data.name == "CompressorBand") {
						combo = comboData.CompressorBand;
						isTechnicalDiagnostics = true;
						Filtered.FilteredSection = "Technical Diagnostics";
						isCTF = true;
					}
					if (data.name == "FanBand") {
						combo = comboData.FanBand;
						isTechnicalDiagnostics = true;
						Filtered.FilteredSection = "Technical Diagnostics";
						isCTF = true;
					}


					var value = data.value;
					if (combo) {
						var detailfilter = combo.filter(function (combodata) {
							return combodata.LookupId == data.value;
						});
						if (detailfilter && detailfilter.length > 0) {
							value = detailfilter[0].DisplayValue;
						}
					}

					if (isCTF) {
						ctfHtmlData += '<span class="ctf-type">' + value + '<span class="ctf-close-type"><button onclick="coolerDashboard.common.updateCTFFilter(event)" id="' + data.name + '-' + data.value + '"><i class="fa fa-close"></i></button></span></span>'
						filtercount++;
					}

				});
				if (isCTF) {
					ctfHtmlData += '</div>';
					$(ctflist).html(ctfHtmlData);
				}
			}
		});

		$(ctfCount).html(filtercount);
		if (filtercount == 0) {
			$('#btnCTF').addClass('hidden');
			$('#btnClearCTF').addClass('hidden');
		} else {
			$('#btnCTF').removeClass('hidden');
			$('#btnClearCTF').removeClass('hidden');
		}


	},
	updateCTFFilter: function (event) {
		event.preventDefault();
		coolerDashboard.common.updateFilterForm(event.currentTarget.id);
		coolerDashboard.common.updateCTFFilterList($('#filterForm').serializeArray(), '#ctf-list', '.totalCTFCount');
	},
	updateFilterForm: function (targetId) {
		var target = targetId.split('-');
		if (target.length > 1) {
			if (target[0] == "City") {
				target[1] = target[1].replace(new RegExp('___', 'g'), ' ');
				target[1] = target[1].replace('_dot_', '.');
			}

			if (target[0] == "LocationCode") {
				$("input[type=text][name=" + target[0] + "]")[0].value = '';
			}

			if ($("input[type=checkbox][name=" + target[0] + "][value='" + target[1] + "']").length > 0) {
				if (target[0] == "OutletTypeId" || target[0] == "SmartDeviceManufacturerId") {
					coolerDashboard.isNavigationChanged = true;
				}
				$("input[type=checkbox][name=" + target[0] + "][value='" + target[1] + "']").prop("checked", false);
			}

			if (target[0] == "SalesHierarchyId" && document.getElementById(target[1] + "_anchor")) {
				document.getElementById(target[1] + "_anchor").click();
			}

			if ($('[name=' + target[0] + '] option[value="' + target[1] + '"]').select2().length > 0) {
				$('[name=' + target[0] + '] option[value="' + target[1] + '"]').select2()[0].selected = false;
				$('[name=' + target[0] + ']').trigger("change");
			}
		}
	},
	updateFilter: function (event) {
		//$('#openfilterDialog').parent().parent().spin(coolerDashboard.common.smallSpin);
		if (event.currentTarget.id.indexOf('-applied') != -1) {
			$('#' + event.currentTarget.id).unbind('click');
			$('#' + event.currentTarget.id).parent().parent().remove();
			deletedFilterIds.push(event.currentTarget.id);
		}
	},
	setFilterSuccess: function (result, data) {
		if (!LZString.decompressFromUTF16(localStorage.comboDataVisit)) {
			localStorage.setItem('comboDataVisit', LZString.compressToUTF16(JSON.stringify(result)));
			result = JSON.parse(LZString.decompressFromUTF16(localStorage.comboDataVisit));
		}

		var salesRepForVisitReport = $('#salesRepForVisitReport');
		var locationVisit = $('#locationVisit');
		coolerDashboard.common.addSelectData(salesRepForVisitReport, result.SalesRep, "All Sales Rep");
		coolerDashboard.common.addSelectData(locationVisit, result.Location, "Select Outlet");
	},

	setFilter: function (screenName) {

		var screenId = '';
		if (screenName) {
			screenId = screenName;
		}
		if (!LZString.decompressFromUTF16(localStorage.comboDataVisit)) {
			$.ajax({
				url: coolerDashboard.common.nodeUrl('combosVisit'),
				type: 'GET',
				data: {
					action: 'LoadBasicInfo'
				},
				success: this.setFilterSuccess,
				failure: function () {
					alert('Error: Some error occured. Please try later.');
				}
			});
		} else {
			var result = JSON.parse(LZString.decompressFromUTF16(localStorage.comboDataVisit));
			this.setFilterSuccess(result);
		}

	},

	getTimeZone: function () {

		if (!LZString.decompressFromUTF16(localStorage.comboDataVisit)) {
			$.ajax({
				url: coolerDashboard.common.nodeUrl('combosTimeZone'),
				type: 'GET',
				success: function (result, data) {
					timeZoneData = result
				},
				failure: function () {
					alert('Error: Some error occured. Please try later.');
				}
			});
		} else {
			var result = JSON.parse(LZString.decompressFromUTF16(localStorage.comboDataVisit));
			this.setFilterSuccess(result);
		}

	},

	/*
	 *renderer for the Boolean.
	 */
	bool: function (value, p, r) {
		if (value) {
			return value === "true" || value === "1" || value === true || value === 1 || (value !== "false") && value.ToLower() === "yes" ? "Yes" : "No";
		}
		return "No";
	},

	float: function (value) {
		var precision = 2;
		var returnValue = function (value, precision) {
			var v;
			if (!(isNaN(value) || value === "" || value === null)) {
				v = parseFloat(value);
				v = v.toFixed(!precision || isNaN(precision) ? 2 : precision);
				if (precision === 0) {
					v = Number(v);
				} else {
					v = Math.round(v);
				}
			} else {
				v = 'N/A';
			}
			return v;
		};

		return returnValue(value, precision);
	},

	emptyDate: "0001-01-01T00:00:00",
	coolerStatusFilterType: "Classification",
	parseDate: function (value) {
		if (!value) {
			return;
		}
		return moment(value.replace("T", " "));
	},

	pad: function (str, max) {
		str = str.toString();
		return str.length < max ? (new Array(max - str.length + 1).join('0') + str) : str;
	},

	dateDiff: function (date1, date2) {
		var ms, pad = coolerDashboard.common.pad;
		if (typeof date1 === 'number') {
			ms = date1 * 1000;
		} else {
			if (typeof date1 !== 'object' || typeof date2 !== 'object' || date1 === null || date2 === null) {
				return '-';
			}
			ms = date1 - date2;
		}
		var s = Math.floor(ms / 1000);
		ms = ms % 1000;
		var m = Math.floor(s / 60);
		s = s % 60;
		var h = Math.floor(m / 60);
		m = m % 60;
		var d = Math.floor(h / 24);
		h = h % 24;
		if (d === 0) {
			if (h > 0) {
				return h + "h " + m + "m";
			}
			if (m > 0) {
				return m + "m";
			}
			return s + "s";
		}
		return d + " days";
	},

	facingRenderer: function (record) {
		if (record.LatestProcessedPurityId != 0) {
			var toReturn = '';
			toReturn = "<span class='lighter'>Realogram Facings</span> " + record.TotalFacings;
			toReturn += " <span class='lighter'>Complainant</span> " + record.CompliantFacingCount;
			toReturn += " <span class='lighter'>Non compliant</span> " + record.NonCompliantFacingCount;
			toReturn += " <span class='lighter'>#Foreign</span> " + record.ForeignProduct;
			toReturn += " <span class='lighter'>#Empty</span> " + record.EmptyFacings;
			toReturn += " <span class='lighter'>#Our facing</span> " + record.CocaColaFacings;
			return toReturn;
		} else {
			return "N/A";
		}
	},

	visionKpiRenderer: function (record) {
		if (record.LatestProcessedPurityId != 0) {
			var toReturn = '';
			toReturn = "<span class='lighter'>Planogram compliance</span> " + record.PlanogramCompliance + "%";
			toReturn += " <span class='lighter'>Purity</span> " + record.PurityPercentage + "%";
			return toReturn;
		} else {
			return "N/A";
		}
	},

	createBlock: function (value, shouldCreate, color) {
		if (value.length === 0) {
			return "";
		}
		if (shouldCreate) {
			return '<div class="highlight-block-text" style="background-color:' + color + '">' + value + '</div>';
		}
		return value;
	},

	emptyDate: "0001-01-01T00:00:00",

	dateTime: function (value, emptyValue, dateFormat, isTimeZone, timezoneId, ignoreTime) {
		var arr = arguments.length === 2 ? emptyValue : "-";
		if (value && value !== coolerDashboard.common.emptyDate) {

			if (moment(value).isValid()) {
				var format = ignoreTime ? coolerDashboard.dateFormat : coolerDashboard.dateTimeFormat;
				arr = moment.utc(value).format(format);
			} else {
				arr = value.split(/[- :T.+]/);
				arr = new Date(arr[0], arr[1] - 1, arr[2], arr[3], arr[4], arr[5]);
				var format = typeof dateFormat === "string" ? dateFormat : coolerDashboard.dateTimeFormat;
				if (isTimeZone) {
					arr = new Date(value);
					arr = moment(arr).format(format)
				} else {

					arr = moment(arr).format(format);
				}
			}
		}
		if (timezoneId && arr != "-") {
			arr = arr + ' ' + (coolerDashboard.common.TimeZone[timezoneId] ? coolerDashboard.common.TimeZone[timezoneId] : '')
		}
		return arr;
	},

	dateTimeZone: function (value, emptyValue, dateFormat, isTimeZone, timezoneId, ignoreTime) {
		if (value !== '' && value) {
			if (timeZoneData && timeZoneData.TimeZones) {
				var zone = timeZoneData && timeZoneData.TimeZones.filter(function (data) {
					return data.TimeZoneId === timezoneId
				});
			}
			if (zone[0].GenericAbbreviation === 'IST') {
				var tz = '';
			} else {
				var tz = zone[0].GenericAbbreviation;
			}

			var dt = value.replace('T', ' ');
		}

		if (moment.tz(dt, tz).isDST()) { //checking whether given time is under DST or not.
			var arr = arguments.length === 2 ? emptyValue : "-";
			if (value && value !== coolerDashboard.common.emptyDate) {

				if (moment(value).isValid()) {
					var format = ignoreTime ? coolerDashboard.dateFormat : coolerDashboard.dateTimeFormat;
					arr = moment.utc(value).format(format);

					if (timeZoneData) {
						if (zone && zone.length > 0) {
							var minute = zone[0].StdTimeDiff * 60;
							arr = moment(arr).add('m', minute).format(format);
							//for DST 1 hour is added 
							arr = moment(arr).add('m', 60).format(format);
						}
					}

				} else {
					arr = value.split(/[- :T.+]/);
					arr = new Date(arr[0], arr[1] - 1, arr[2], arr[3], arr[4], arr[5]);
					var format = typeof dateFormat === "string" ? dateFormat : coolerDashboard.dateTimeFormat;
					if (isTimeZone) {
						arr = new Date(value);
						arr = moment(arr).format(format)
					} else {
						arr = moment(arr).format(format);
					}
					//for DST 1 hour is added 
					arr = moment(arr).add('m', 60).format(format);
				}
			}

			if (timezoneId && arr != "-") {
				arr = arr + ' ' + (coolerDashboard.common.TimeZone[timezoneId] ? coolerDashboard.common.TimeZone[timezoneId] : '')
			}
			return arr;
		} else {
			var arr = arguments.length === 2 ? emptyValue : "-";
			if (value && value !== coolerDashboard.common.emptyDate) {

				if (moment(value).isValid()) {
					var format = ignoreTime ? coolerDashboard.dateFormat : coolerDashboard.dateTimeFormat;
					arr = moment.utc(value).format(format);

					if (timeZoneData) {
						var zone = timeZoneData.TimeZones.filter(function (data) {
							return data.TimeZoneId == timezoneId
						});
						if (zone && zone.length > 0) {
							var savingtime = zone[0].StdTimeDiff;
							var minute = savingtime * 60;
							arr = moment(arr).add('m', minute).format(format);
						}
					}

				} else {
					arr = value.split(/[- :T.+]/);
					arr = new Date(arr[0], arr[1] - 1, arr[2], arr[3], arr[4], arr[5]);
					var format = typeof dateFormat === "string" ? dateFormat : coolerDashboard.dateTimeFormat;
					if (isTimeZone) {
						arr = new Date(value);
						arr = moment(arr).format(format)
					} else {

						arr = moment(arr).format(format);
					}
				}
			}

			if (timezoneId && arr != "-") {
				arr = arr + ' ' + (coolerDashboard.common.TimeZone[timezoneId] ? coolerDashboard.common.TimeZone[timezoneId] : '')
			}
			return arr;
		}
	},

	getDateFromMonth: function (values, isQuarterly, dayOfWeek, yearWeek, isTrend) {
		var dateFilter = [],
			startWeek = 0,
			endWeek = 0,
			startDate, endDate,
			weekNumber;
		var months;
		for (var i = 0, len = values.length; i < len; i++) {
			values[i] = values[i].value;
			startDate = moment().month(isQuarterly ? values[i] - 1 == 0 ? values[i] - 1 : (values[i] - 1) * 3 : values[i] - 1).date(1).format('YYYY-MM-DD[T00:00:00]');
			endDate = moment().month(isQuarterly ? (values[i] * 3) - 1 : values[i] - 1).endOf('month').format('YYYY-MM-DD[T23:59:59]');
			if (yearWeek) {
				for (var j = 0, length = yearWeek.length; j < length; j++) {
					weekNumber = yearWeek[j];
					if (isTrend) {
						weekNumber = weekNumber - yearWeek.length
					}
					dateFilter.push.apply(dateFilter, this.getDateFromWeekDay(weekNumber, dayOfWeek, moment(startDate), moment(endDate)));
				}
			} else if (dayOfWeek) {
				startWeek = moment.utc(startDate).week();
				endWeek = moment.utc(endDate).week();

				var startYear = moment.utc(startDate).year();
				var endYear = moment.utc(endDate).year();
				var currentYear = moment.utc().year();
				if (currentYear > startYear) {
					//	var weekinYear = moment.utc(params.startDate).weeksInYear();
					var weekinYear = moment.utc(startDate).weeksInYear();
					startWeek = startWeek - weekinYear * (currentYear - startYear);
					endWeek = endWeek - weekinYear * (currentYear - endYear);
				}
				for (var k = startWeek; k <= endWeek; k++) {
					dateFilter.push.apply(dateFilter, this.getDateFromWeekDay(k, dayOfWeek, moment(startDate), moment(endDate)));
				}
			} else {
				if ((moment(startDate).year() == moment(endDate).year()) && (moment(startDate).month() == moment(endDate).month())) {
					var daysinMonth = moment(startDate).daysInMonth();
					var diffDays = Number((moment(endDate).diff(moment(startDate), 'days', 1)).toFixed(2));
					months = diffDays / daysinMonth;
				} else {
					months = moment(endDate).diff(moment(startDate), 'months', true)
				}
				dateFilter.push({
					startDate: startDate,
					endDate: endDate,
					totalHours: moment(endDate).diff(moment(startDate), 'hours') + 1,
					months: months,
				});
			}
		}
		return dateFilter;
	},

	TimeZone: {
		1: "BIT",
		2: "UTC",
		3: "HST",
		4: "AKT",
		5: "PST",
		6: "PT",
		7: "MT",
		8: "MSTM",
		9: "MT",
		10: "CT",
		11: "CT",
		12: "CT",
		13: "CT",
		15: "ET",
		16: "ET",
		17: "VST",
		18: "PRST",
		19: "AT",
		20: "CBST",
		21: "SAWST",
		22: "PSAST",
		23: "NT",
		24: "ESAST",
		25: "ART",
		26: "SAEST",
		27: "GNST",
		28: "MVST",
		30: "UTC",
		32: "AZOST",
		34: "WET",
		35: "UTC",
		36: "GMT",
		37: "GMT",
		38: "CET",
		39: "CET",
		40: "CET",
		41: "CET",
		42: "WAT",
		43: "WAT",
		44: "EET",
		45: "EET",
		46: "EET",
		47: "EET",
		48: "EET",
		49: "EET",
		50: "SAST",
		51: "EET",
		52: "EET",
		53: "ISST",
		54: "EET",
		55: "EET",
		56: "ARST",
		57: "ABST",
		58: "EEST",
		60: "EAT",
		61: "IRST",
		62: "ARBST",
		63: "AZT",
		65: "MUT",
		66: "GET",
		67: "AMT",
		68: "AFT",
		71: "PKT",
		72: "IST",
		73: "IST",
		74: "NPT",
		75: "BTT",
		76: "BST",
		78: "MYST",
		79: "THA",
		81: "CST",
		83: "SGT",
		84: "AWT",
		85: "TIST",
		86: "UST",
		87: "TST",
		88: "KST",
		90: "ACT",
		91: "ACT",
		92: "AET",
		93: "AET",
		94: "WPST",
		95: "AET",
		96: "MAGT",
		99: "SBT",
		101: "NZT",
		103: "FJT",
		104: "PETT",
		105: "PHOT",
		106: "SMST"

	},
	purityImageRenderer: function (data, type, row) {
		var images = [];
		for (var i = 0, len = row.PurityDetail.length; i < len; i++) {
			var PurityDateTime = moment.utc(row.PurityDetail[i].PurityDateTime);
			var month = PurityDateTime.month() + 1;
			var date;
			if (month.toString().length == 1) {
				month = '0' + month;
			}
			date = PurityDateTime.date().toString();
			if (date.length == 1) {
				date = '0' + date;
			}
			var folderName = PurityDateTime.year().toString() + month + date;
			var renderDivStringStart = '<div style="display: inline-block;padding-left:8px;">',
				renderDivStringEnd = '',
				renderDivStringImage = '';
			for (var j = 0; j < row.PurityDetail[i].ImageCount; j++) {
				var imageUrl = coolerDashboard.getUrl("/thumbnail.ashx?imagePath=processed");
				imageUrl = imageUrl + "/" + folderName;
				var fileName = row.PurityDetail[i].StoredFilename;
				var imageName = j == 0 ? fileName.split('.')[0] + "_1" + ".jpg" : fileName.split('.')[0] + "_2" + ".jpg";
				imageUrl = imageUrl + "/" + imageName;
				imageUrl = imageUrl + "&isStockimages=true&v=" + new Date().getTime();
				imageName = "'" + imageName + "'";
				var purityDateTime = coolerDashboard.common.dateWithFormat(row.PurityDetail[i].EventTime, '-', 'time');

				if (row.PurityDetail[i].StatusId == 2) {
					renderDivStringImage += '<img onclick="coolerDashboard.common.onAssetPurityImageClick(' + folderName + ', ' + imageName + ', ' + row.PurityDetail[i].ImageCount + ')" src="' + imageUrl + '"/><br/><br/>';
					renderDivStringEnd = '<span><b>Captured Time:</b> ' + purityDateTime + '</spn></div>';
					if (j % 2 != 0) {
						images.push(renderDivStringStart + renderDivStringImage + renderDivStringEnd);
						renderDivStringImage = '';
					}
				}
			}
		}


		return images.join("");
	},
	lastRecognitionImageRenderer: function (PurityDateTime, StoredFilename, ImageCount, title) {
		var images = [];
		if (title == "-")
			return title;

		//var PurityDateTime = moment.utc(row.PurityDetail[i].PurityDateTime);
		var month = PurityDateTime.month() + 1;
		var date;
		if (month.toString().length == 1) {
			month = '0' + month;
		}
		date = PurityDateTime.date().toString();
		if (date.length == 1) {
			date = '0' + date;
		}
		var folderName = PurityDateTime.year().toString() + month + date;

		var fileName = StoredFilename;
		var imageName = fileName.split('.')[0] + "_1" + ".jpg";
		imageName = "'" + imageName + "'";
		return '<a href="#" class="btn-link btn-sm" title="Open Image" onclick="coolerDashboard.common.onAssetPurityImageClick(' + folderName + ', ' + imageName + ', ' + ImageCount + ')">' + title + '</a>';
	},
	onAssetPurityImageClick: function (folder, imageName, imageCount) {
		var image1Url = '';
		var image2Url = '';
		var content = [];
		if (imageCount > 1) {
			var url = coolerDashboard.getUrl("/Controllers/CoolerImagePreview.ashx?AssetImageName=");
			imageName = imageName.split('_');
			image1Url = url + imageName[0] + "_1.jpg&v=" + new Date() + "&PurityDateTime=" + folder;
			image2Url = url + imageName[0] + "_2.jpg&v=" + new Date() + "&PurityDateTime=" + folder;

			image1Url = '<img id="zoom_01" style="height: auto;width: 100%;" src="' + image1Url + '" data-zoom-image="' + image1Url + '"></img>';
			image2Url = '<img id="zoom_02" style="height: auto;width: 100%;" src="' + image2Url + '" data-zoom-image="' + image2Url + '"></img>';

			content.push(image1Url);
			content.push(image2Url);
		}

		$('#imagePreview').html(content.join(''));

		var dialogOptions = {
			"title": "Image Preview",
			"width": 500,
			"height": 750,
			"modal": true,
			"resizable": false,
			"draggable": true
		};
		var dialogExtendOptions = {
			"closable": true,
			"maximizable": true,
			"dblclick": $("#my-form [name=dblclick]:checked").val() || false,
			"titlebar": $("#my-form [name=titlebar]:checked").val() || false
		};
		$('#imagePreview').dialog(dialogOptions).dialogExtend(dialogExtendOptions).dialog('open');
		$('#zoom_01').elevateZoom({
			zoomWindowPosition: 10,
			zoomWindowOffetx: 10
		});
		$('#zoom_02').elevateZoom({
			zoomWindowPosition: 2,
			zoomWindowOffetx: 10
		});
	},
	floatValue: function (value, precision) {
		var precision = 2;
		var v;
		if (!value) {
			value = 0;
		}
		if (!isNaN(value)) {
			v = parseFloat(value);
			v = parseFloat(v.toFixed(!precision || isNaN(precision) ? 2 : precision));
			if (precision === 0) {
				v = Number(v);
			}
		} else {
			v = 0;
		}
		return v;
	},

	dateWithFormat: function (value, emptyValue, dateFormat) {
		var arr = arguments.length === 2 ? emptyValue : "-";
		if (value && value !== coolerDashboard.common.emptyDate) {
			arr = value.split(/[- :T.]/);
			arr = new Date(arr[0], arr[1] - 1, arr[2], arr[3], arr[4], arr[5]);
			if (dateFormat == "date") {
				arr = moment(arr).format(coolerDashboard.dateFormat);
			} else if (dateFormat == "time") {
				arr = moment(arr).format('HH:mm:ss');
			} else {
				arr = moment(arr).format(coolerDashboard.dateTimeFormat);
			}

		}
		return arr;
	},

	addSelectData: function (select, data, defaultOption, useDisplayValue) {
		$('option', select).remove();
		if (typeof data !== 'object' || data === null || data === undefined) {}
		if (defaultOption === true) {
			defaultOption = "All";
		}
		if (typeof defaultOption === 'string') {
			var option = new Option(defaultOption, 0);
			select.append($(option));
		}

		$.each(data, function (text, key) {
			var option = new Option(key.DisplayValue, key.LookupId);
			if (useDisplayValue) {
				option = new Option(key.DisplayValue, key.DisplayValue);
			}
			select.append($(option));
			if (key.IsDefault) {
				option.setAttribute("selected", "selected");
			}
			if (key.disabled) {
				option.setAttribute("disabled", "disabled");
			}
		});
	},

	alertTypes: {
		missing: 9,
		power: 17,
		unhealthy: 3
	},
	cleanArray: function (actual) {
		var newArray = new Array();
		for (var i = 0; i < actual.length; i++) {
			if (actual[i]) {
				newArray.push(actual[i]);
			}
		}
		return newArray;
	},
	onRecogGridClick: function (selectedData) {

		var modal = $('#assetPurityModel');
		modal.find('.modal-title').text("Assets Purity : " + selectedData.Id);
		//$('#assetPurityModelLabel').value = "Assets Purity : " + selectedData.PlanogramId;
		//var filterValues = [];
		filterValues["planogramId"] = selectedData.PlanogramId;
		filterValues["assetPurityId"] = selectedData.Id;
		filterValues["Shelves"] = selectedData.Shelves;
		filterValues["Columns"] = selectedData.Columns;
		$('#model-spinner').spin(coolerDashboard.common.smallSpin);
		$.ajax({
			url: coolerDashboard.common.nodeUrl('facingDetail'),
			data: filterValues,
			type: 'POST',
			success: function (result) {
				$('#assetPurityModel').modal('show');
				coolerDashboard.common.showCoolerImageWindow(result, selectedData);
				$('#model-spinner').spin(false);
			},
			failure: function (response, opts) {
				//coolerDashboard.gridUtils.ajaxIndicatorStop();
				$('#model-spinner').spin(false);
			},
			scope: this
		});
	},
	getUserLayout: function () {
		$.ajax({
			url: coolerDashboard.common.nodeUrl('getUserLayout'),
			type: 'POST',
			success: function (result) {
				if (result.success == true) {
					//console.log(JSON.parse(result.data[0].Value));
					localStorage.setItem("userLayout", LZString.compressToUTF16(JSON.stringify(result.data)));
					return result;
				} else {
					return false;
				}
			},
			failure: function (response, opts) {},
			scope: this
		});
	},
	showCoolerImageWindow: function (data, SelectedData) {
		var planogramProductDiv = $('#planogramProductDiv');
		var html = '<div class="rectangle-red">' +
			'<div class="productDetailText">PLANOGRAM</div>' +
			'</div>';
		var productImage = '';
		data.data.planogram.Shelves.forEach(function (Shelve) {
			productImage += '<div class="rectangle-grey">' +
				'<div class="coolerProductImage">';
			var columnCount = Shelve.ColumnCount;
			Shelve.Products.forEach(function (Product) {

				if (!Product.ProductId || Product.ProductId == "0" || Product.ProductId == 107) {
					//Product.thumbnail = './images/blank.png';
					Product.ProductId = 'blank';
				}
				var width = Product.Width || 0;
				var style;
				if (width === 0) {
					//var columnCount = this.columnCount;
					width = columnCount ? Number((100 / (columnCount * 5)).toFixed(2)) + 'vw;' : 2.2 + 'vw;';
					style = 'style="width:' + width + '"';
				} else {
					width = Number((width / 75).toFixed(2));
					width = width < .3 ? 0.5 : width;
					style = 'style="width:' + width + 'vw;"';
				}

				productImage += '<span class="imagePlanogram">' +
					'<img ' + style + ' ' +
					'src=' + coolerDashboard.getUrl('/products/thumbnails/' + Product.ProductId + '.png') +
					//' onerror=' + coolerDashboard.getUrl('/products/imageNotFound.png') +
					'> ' +
					//'<span class="rectanglePosition" style="background-color:#C71D1E;">' +'</span>' +
					'</span>';
			});
			productImage += '</div></div>';
		});
		html += productImage;
		planogramProductDiv.html(html);

		var realogramProductDiv = $('#realogramProductDiv');
		//coolerDashboard.getUrl('/products/thumbnails/' + value + '.png');

		var html = '<div class="rectangle-red">' +
			'<div class="productDetailText">REALOGRAM</div>' +
			'</div>';

		var productImage = '';
		data.data.realogram.Shelves.forEach(function (Shelve) {
			productImage += '<div class="rectangle-grey">' +
				'<div class="coolerProductImage">';
			var columnCount = Shelve.ColumnCount;
			Shelve.Products.forEach(function (Product) {

				if (!Product.ProductId || Product.ProductId == "0" || Product.ProductId == 107) {
					//Product.thumbnail = './images/blank.png';
					Product.ProductId = 'blank';
				}
				var width = Product.Width || 0;
				var style;
				if (width === 0) {
					//	var columnCount = this.columnCount;
					width = columnCount ? Number((100 / (columnCount * 5)).toFixed(2)) + 'vw;' : 2.2 + 'vw;';
					style = 'style="width:' + width + '"';
				} else {
					width = Number((width / 75).toFixed(2));
					width = width < .3 ? 0.5 : width;
					style = 'style="width:' + width + 'vw;"';
				}

				productImage += '<span class="imagePlanogram">' +
					'<img ' + style + ' ' +
					'src=' + coolerDashboard.getUrl('/products/thumbnails/' + Product.ProductId + '.png') +
					//' onerror=' + coolerDashboard.getUrl('/products/imageNotFound.png') +
					'> ' +
					'<span class="rectanglePosition" style="background-color:' + Product.Color + '"></span>' +
					'</span>';
			});
			productImage += '</div></div>';
		});
		html += productImage;
		realogramProductDiv.html(html);

		//To Show Product Legent  
		var planogramLegend = $('#planogram-legend');
		var productList = data.data.planogramProductList;
		var htmlPl = '';
		if (productList && productList.length > 0) {
			productList.forEach(function (element) {
				htmlPl += '<div class="planogram-legend-div">' +
					'<div style="background-color:' + element.DisplayColor + '" ;="" class="planogram-legend-rect"></div>' +
					'<div class="planogram-legend-text">' + element.Product + '</div></div>';
			}, this);
			planogramLegend.html(htmlPl);
		}

		if (data.data.ImageData) {
			var PurityDateTime = data.data.ImageData.PurityDateTime ? moment.utc(data.data.ImageData.PurityDateTime) : '';
			var ImageCount = data.data.ImageData.ImageCount ? data.data.ImageData.ImageCount : 0;
			var StoredFilename = data.data.ImageData.StoredFilename ? data.data.ImageData.StoredFilename : '';
			$('#PurityPercentage').html(data.data.ImageData.PurityPercentage + '%');
			$('#StockPercentage').html(data.data.ImageData.StockPercentage + '%');
			$('#PlanogramCompliance').html(data.data.ImageData.PlanogramCompliance + '%');
		}

		// Imgae Load

		var images = [];

		if (PurityDateTime) {
			var month = PurityDateTime.month() + 1;
			var date;
			if (month.toString().length == 1) {
				month = '0' + month;
			}
			date = PurityDateTime.date().toString();
			if (date.length == 1) {
				date = '0' + date;
			}
			var folder = PurityDateTime.year().toString() + month + date;

			var fileName = StoredFilename;
			var imageName = fileName.split('.')[0] + "_1" + ".jpg";

			var image1Url = '';
			var image2Url = '';
			var content = [];

			if (ImageCount && ImageCount > 1) {
				var url = coolerDashboard.getUrl("/Controllers/CoolerImage/");
				imageName = imageName.split('_');
				image1Url = url + imageName[0] + "_1.jpg/" + folder;
				image2Url = url + imageName[0] + "_2.jpg/" + folder;
				image1Url = '<img id="zoom_01" style="height: auto;width: 100%;" src="' + image1Url + '"></img>';
				image2Url = '<img id="zoom_02" style="height: auto;width: 100%;" src="' + image2Url + '"></img>';
				var lastUpdateDate = 'Last updated on ' + moment(SelectedData.PurityDateTime).format('MMM DD YYYY HH:MM:SS');
				$('#purityImageImage1').html(image1Url + lastUpdateDate);
				$('#purityImageImage2').html(image2Url + lastUpdateDate);
			}
		}
	}
};

coolerDashboard.renderers = {

	humanizeDurationRenderer: function (data, type, row) {
		var startDate = moment(data);
		if (startDate.isValid()) {
			var endTime = moment();
			var duration = moment.duration(endTime.diff(startDate)).asMilliseconds();
			duration = humanizeDuration(duration, {
				largest: 3
			})
			return duration;
		} else
			return '-';
	},
	temperature: function (data, type, row) {
		if (typeof data !== 'number' || data == 127 || data == -100) {
			return 'N/A';
		}
		var isAbnormal = data > 8;
		data += "&#8451;";
		if (isAbnormal) {
			data = '<span style="color:red">' + data + "</span>";
		}
		return data;
	},

	dateTime: function (value, emptyValue, dateFormat) {
		var arr = arguments.length === 2 ? emptyValue : "-";
		if (value && value !== coolerDashboard.common.emptyDate) {
			arr = value.split(/[- :T.+]/);
			arr = new Date(arr[0], arr[1] - 1, arr[2], arr[3], arr[4], arr[5]);
			arr = moment(arr).format(coolerDashboard.dateTimeFormat);
		}
		return arr;
	},

	light: function (value) {
		if (typeof value !== 'number' || value == 127 || value == -1) {
			return 'N/A';
		}
		if (value > 10) {
			return value;
		} else {
			return '<span style="color:red">' + value + '</span>';
		}
	},
	lightStatus: function (lightIntensity, SmartDeviceTypeId) {
		if (SmartDeviceTypeId == 16 || SmartDeviceTypeId == 8 || SmartDeviceTypeId == 2 || SmartDeviceTypeId == 1 || SmartDeviceTypeId == 5) {
			if (lightIntensity <= 19) {
				return 'No Light'
			} else {
				if (lightIntensity > 19 && lightIntensity <= 30) {
					return 'Low Brightness'
				} else {
					if (lightIntensity > 20 && lightIntensity <= 450) {
						return 'Medium Brightness'
					} else {
						return 'Full Light Brightness'
					}
				}
			}

		} else {

			if (SmartDeviceTypeId == 3 || SmartDeviceTypeId == 7 || SmartDeviceTypeId == 26) {
				if (lightIntensity <= 3) {
					return 'No Light'
				} else {
					if (lightIntensity > 3 && lightIntensity <= 5) {
						return 'Low Brightness'
					} else {
						if (lightIntensity > 5 && lightIntensity <= 23) {
							return 'Medium Brightness'
						} else {
							return 'Full Light Brightness'
						}
					}
				}

			} else {


				if (SmartDeviceTypeId == 15) {

					if (lightIntensity <= 10) {
						return 'No Light'
					} else {
						if (lightIntensity > 10 && lightIntensity <= 100) {
							return 'Low Brightness'
						} else {
							if (lightIntensity > 100 && lightIntensity <= 160) {
								return 'Medium Brightness'
							} else {
								return 'Full Light Brightness'
							}
						}
					}
				} else {
					return 'N/A'
				}
			}
		}
	},

	geo: function (value, type, row) {
		if (!row.Latitude && !row.Longitude) {
			return "-";
		}
		return row.Latitude.toFixed(5) + ", " + row.Longitude.toFixed(5);
	},

	priorityIcons: {
		medium: "img/priority-normal.png",
		low: "img/priority-low.png",
		high: "img/priority-high.png"
	},

	priorityIconColor: {
		4227: "img/icons/circle_red_2.png",
		4226: "img/icons/orange.png",
		4225: "img/icons/yellow.png",
		100: "img/icons/green.png"
	},

	alertTypeIcons: {
		1: "img/AlertType/Battery.png",
		2: "img/AlertType/CoolerConnectivity.png",
		3: "img/AlertType/CoolerMalfunction.png",
		4: "img/AlertType/DeviceAccumulatedMovement.png",
		5: "img/AlertType/DoorOpenDuration.png",
		6: "img/AlertType/DoorOpenMax.png",
		7: "img/AlertType/DoorOpenMin.png",
		8: "img/AlertType/EnvironmentHealth.png",
		9: "img/AlertType/GPSDisplacement.png",
		10: "img/AlertType/Temperature.png",
		11: "img/AlertType/HubAccumulatedMovement.png",
		12: "img/AlertType/MissingData.png",
		13: "img/AlertType/MovementDuration.png",
		14: "img/AlertType/NoData.png",
		15: "img/AlertType/NoDoorData.png",
		16: "img/AlertType/PlanogramAlert.png",
		17: "img/AlertType/Power.png",
		18: "img/AlertType/PurityAlert.png",
		19: "img/AlertType/StockAlert.png",
		20: "img/AlertType/MovementCount.png",
		21: "img/AlertType/StockAlertProductWise.png",
		22: "img/AlertType/StockAlertShelfWise.png",
		23: "img/AlertType/Light.png",
		24: "img/AlertType/EnvironmentLight.png"
	},
	alertTypeText: {
		1: "Battery Alert",
		2: "Cooler Connectivity Alert",
		3: "Cooler Malfunction Alert",
		4: "Device Accumulated Movement Alert",
		5: "Door Duration Alert",
		6: "Door Open Max Alert",
		7: "Door Open Min Alert",
		8: "Environment Temperature ALert",
		9: "GPS Displacement Alert",
		10: "Temperature Alert",
		11: "Hub Accumulated Movement Alert",
		12: "Missing Data Alert",
		13: "Movement Duration Alert",
		14: "No Data Alert",
		15: "No Door Data Alert",
		16: "Planogram Alert",
		17: "Power Alert",
		18: "Purity Alert",
		19: "Stock Alert",
		20: "Movement Count Alert",
		21: "Stock Alert Product Wise",
		22: "Stock Alert Shelf Wise",
		23: "Light Alert",
		24: "Environment Light"
	},

	alertTypeIcon: function (data, type, row) {

		return "<div class='circle-red no-padding' style ='margin-left: 0.1em;'>" + 1 + "</div>";

		//var alertTypeIcons = coolerDashboard.renderers.alertTypeIcons;
		//alertTypeText = coolerDashboard.renderers.alertTypeText;
		//var icons = [];
		//if (data === null || data === undefined) {
		//	return;
		//}
		//if (typeof data !== 'object') {
		//	data = [data];
		//}
		//for (var i = 0, len = data.length; i < len; i++) {
		//	var icon = alertTypeIcons[data[i]];
		//	var text = alertTypeText[data[i]];
		//	if (icon) {
		//		icons.push("<div><img src='" + icon + "' title= '" + text + "' /></div>");
		//	}
		//}

		//if (row && row.Priority) {
		//	var icon = coolerDashboard.renderers.priorityIcons[(row.Priority || "medium").toLowerCase()];
		//	icons.push("<div><img src='" + icon + "' /></div>");
		//}
		//return icons.join("");
	},
	alertAge: function (value, type, row) {
		var common = coolerDashboard.common;
		return common.dateDiff(row.ClosedOn === common.emptyDate ? new Date() : common.parseDate(row.ClosedOn), common.parseDate(row.AlertAt));
	},

	alertAgeImbera: function (value, type, row) {
		var common = coolerDashboard.common;
		var dateTime = row.EndEventTime != common.emptyDate ? row.EndEventTime : row.AssetPingDateTime && row.AssetPingDateTime != common.emptyDate ? row.AssetPingDateTime : moment.utc().format('YYYY-MM-DDTHH:MM:SS');
		return common.dateDiff(dateTime === common.emptyDate ? new Date() : common.parseDate(dateTime), common.parseDate(row.StartEventTime));
	},

	purityStatus: function (value, type, row) {
		return value == 0 ? "N/A" : value == 255 ? "Pure" : "Impure";
	},

	movementType: function (typeId) {

		var type = ''
		switch (typeId) {

			case 78:
				type = 'GPS';
				break;
			case 79:
				type = 'Linear';
				break;
			case 80:
				type = 'Angular';
				break
			case 81:
				type = 'Magnet';
				break;
			case 82:
				type = 'Time';
				break;
			case 97:
				type = 'Micro';
				break;
			case 117:
				type = 'Hub';
				break;
			case 170:
				type = 'Device Accumulated';
				break;
			case 171:
				type = 'Hub Accumulated';
				break;
			default:
				break;
		}
		return type;
	},
	alertTypeIconWithHyperLink: function (data, type, row) {
		var alertTypeIcons = coolerDashboard.renderers.alertTypeIcons;
		var alertTypeText = coolerDashboard.renderers.alertTypeText;
		var icons = [];
		if (data === null || data === undefined) {
			return;
		}
		if (typeof data !== 'object') {
			data = [data];
		}
		for (var i = 0, len = data.length; i < len; i++) {
			var icon = alertTypeIcons[data[i]];
			var text = alertTypeText[data[i]];
			if (icon) {
				icons.push("<div><img src='" + icon + "' onclick='onAlertIconClick(" + row.Id + ")' title='" + text + "' /></div>");
				if (row["Alert_Open"]) {
					icons.push("<div>" + row["Alert_Open"] + "</div>")
				}
			}
		}

		if (row && row.Priority) {
			var icon = coolerDashboard.renderers.priorityIcons[(row.Priority || "medium").toLowerCase()];
			icons.push("<div><img src='" + icon + "' /></div>");
		}
		return icons.join("");
	},
	dateLocalizer: function (value) {
		if (!value || value == coolerDashboard.common.emptyDate) {
			return '-';
		}
		if (typeof value === 'string') {
			value = new Date(value);
		}
		return moment.utc(value).local().format(coolerDashboard.dateTimeFormat);
	}
}

var highChartsHelper = {
	convertToSeries: function (options) {
		var seriesConfig = options.seriesConfig,
			seriesData = [],
			sourceData = options.data;
		for (var i = 0, len = seriesConfig.length; i < len; i++) {
			var name = seriesConfig[i].name;
			var dataFn = seriesConfig[i].data;
			var data = [];
			for (var j = 0, sourceDataLen = sourceData.length; j < sourceDataLen; j++) {
				data.push(dataFn(sourceData[j]));
			}
			seriesData.push($.extend({}, seriesConfig[i], {
				data: data
			}));
		}

		var xAxis = [],
			xAxisFn = options.xAxis;
		if (xAxisFn) {
			for (var j = 0, sourceDataLen = sourceData.length; j < sourceDataLen; j++) {
				xAxis.push(xAxisFn(sourceData[j]));
			}
		}

		return {
			series: seriesData,
			xAxis: {
				categories: xAxis
			}
		}
	}
};