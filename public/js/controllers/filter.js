var startDate;
var endDate;
var startDateCorrelation;
var endDateCorrelation;
// var isDisplacement = true;
var resultToStorage;
var pagechange = false; //during page change
var resetchange = false; //during rest filter
var ClientId = JSON.parse(LZString.decompressFromUTF16(localStorage.data)).data.tags.ClientId;
var currentUrl = window.location.href;

function setFilter() {
	coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
	if (!LZString.decompressFromUTF16(localStorage.comboData)) {
		$.ajax({
			url: coolerDashboard.common.nodeUrl('combos'),
			type: 'GET',
			data: {
				action: 'LoadBasicInfo'
			},
			success: function (result, data) {
				coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
				$.ajax({
					url: coolerDashboard.common.nodeUrl('preferenceState'),
					type: 'POST',
					data: {
						action: 'default'
					},
					success: function (rec, dat) {
						coolerDashboard.gridUtils.ajaxIndicatorStop();
						var prefValue = rec.data.length > 0 ? rec.data[0].PrefValue : "{}";
						filterValuesChart = JSON.parse('"' + prefValue + '"');
						filterValuesChart = JSON.parse(filterValuesChart);
						var data = rec.data && (rec.data.length > 0) ? rec.data[0] : ""
						localStorage.setItem('defaultPreference', LZString.compressToUTF16(JSON.stringify(data)));
						onSuccessFilter(result, data);
					},
					failure: function (response, opts) {
						coolerDashboard.gridUtils.ajaxIndicatorStop();
					},
					scope: this
				});
			},
			failure: function () {
				coolerDashboard.gridUtils.ajaxIndicatorStop();
				alert('Error: Some error occured. Please try later.');
			}
		});
	} else {
		coolerDashboard.gridUtils.ajaxIndicatorStop();
		if (LZString.decompressFromUTF16(localStorage.defaultPreference)) {
			var prefId;
			var defaultPreference = JSON.parse(LZString.decompressFromUTF16(localStorage.defaultPreference));
			if (defaultPreference) {
				prefId = JSON.parse(LZString.decompressFromUTF16(localStorage.defaultPreference)).prefId;
			}
			coolerDashboard.common.onPreferenceClick(prefId, coolerDashboard.isFilterChanged);
		} else {
			coolerDashboard.common.onPreferenceClick(undefined, coolerDashboard.isFilterChanged);
		}

		//var result = JSON.parse(localStorage.comboData);
		//onSuccessFilter(result);
	}
}

function infoGuide(sectionId) {
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

function onSuccessFilter(result, data, isPreference) {
	pagechange = true;
	coolerDashboard.gridUtils.loadUserLayout(true, true); //false for default false

	coolerDashboard.gridUtils.ajaxIndicatorStop();
	if (!LZString.decompressFromUTF16(localStorage.comboData)) {
		var parseData = result;
		var index = _.findIndex(parseData.data.SmartDeviceType, function (data) {
			return data.DisplayValue == "VirtualHub"
		});
		if (index != -1) {
			parseData.data.SmartDeviceType.splice(index, 1);
		}

		localStorage.setItem('comboData', LZString.compressToUTF16(JSON.stringify(result)));
		result = JSON.parse(LZString.decompressFromUTF16(localStorage.comboData));
		// resultToStorage = JSON.parse(localStorage.comboData);
	}

	resultToStorage = JSON.parse(LZString.decompressFromUTF16(localStorage.comboData));
	var channelCombo = $('.tradeChannel');
	var tradeChannelCombo = $('.tradeChannelCombo');
	var classificationComboSelect = $('.classificationCombo');
	var subTradeChannel = $('.subTradeChannel');
	var subTradeChannelTypeCombo = $('.subTradeChannelTypeCombo');
	//var SalesHierarchyCombo = $('.SalesHierarchyId');
	var outletType = $('.outletType');
	var classificationCombo = $('.customerTier');
	//var marketCombo = $('.market');
	var countryCombo = $('.country');
	var country = $('.countryCombo');
	//var salesRepCombo = $('.salesRep');
	var cityCombo = $('.city');
	var city = $('.cityCombo');
	var locationRep = $('.locationRep');
	var TelesellingTerritory = $('.TelesellingTerritoryType');

	var manufacturer = $('.manufacturerCombo');
	var manufacturerCombo = $('.manufacturer');
	var ownerCombo = $('.owner');
	var alertStatusCombo = $('.alertStatus');
	var deviceTypeCombo = $('.deviceType');
	var locationCombo = $('.location');
	var assetTypeCapacityCombo = $('.assetTypeCapacity');
	var assetTypeCombo = $('.assetType');
	var alertTypeCombo = $('.alertType');
	var alertTypeComboSelected = $('.alertTypeComboSelected');
	var displacementTypeCombo = $('.displacement');
	var doorTypeCombo = $('.doorCount');
	var connectivityTypeCombo = $('.connectivityType');
	var assetType = $('.assetTypeCombo');
	var assetTypeCapacity = $('.assetTypeCapacityCombo');
	var alertStatusComboSelect = $('.alertStatusCombo');
	var address = $('.address');
	var manufacturerSmartDevice = $('.manufacturerSmartDeviceCheckBox');
	var manufacturerSmartDeviceCombo = $('.manufacturerSmartDevice');
	var assetDisplacement = $('.assetDisplacement');
	var assetDisplacementHistoric = $('.assetDisplacementHistoric');

	var installationDateType = $('.installationDateType');
	var lastDataReceivedType = $('.lastDataReceivedType');
	var doorDataSelectedType = $('.doorDataSelectedType');
	var salesDataSelectedType = $('.salesDataSelectedType');
	var coolerTrackingType = $('.coolerTrackingType');
	var coolerTrackingTypeProximity = $('.coolerTrackingTypeProximity');

	var assetDoorCount = $('.assetDoorCount');
	var telemetryDoorCount = $('.telemetryDoorCount');
	var batteryReprtData = $('.batteryReprtData');
	var assetTempBand = $('.assetTempBand');
	var TemperatureTele = $('.TemperatureTele');
	var MagnetFallenChartCTF = $('.MagnetFallenChartCTF');
	var MagnetFallenSpreadCTF = $('.MagnetFallenSpreadCTF');
	var EvaporatorTemperatureTele = $('.EvaporatorTemperatureTele');
	var telemetryLightStatus = $('.telemetryLightStatus');
	var assetLightBand = $('.assetLightBand');
	var assetPowerBand = $('.assetPowerBand');
	var telemetryPowerStatus = $('.telemetryPowerStatus');
	var CompressorBand = $('.CompressorBand');
	var FanBand = $('.FanBand');
	var TempLightIssue = $('.TempLightIssue');
	var DoorSwingsVsTarget = $('.DoorSwingsVsTarget');
	var DataDownloadOutlet = $('.DataDownloadOutlet');
	var ExcecuteCommandReport = $('.ExcecuteCommandReport');
	var ExcecuteCommandSpread = $('.ExcecuteCommandSpread');
	var CoolerPerformanceIndex = $('.CoolerPerformanceIndex');
	var DoorOpenVsSales = $('.DoorOpenVsSales');
	var OperationalIssues = $('.OperationalIssues');
	var CoolerHealth = $('.CoolerHealth');
	var DataDownloaded = $('.DataDownloaded');
	var LastDataDownloaded = $('.LastDataDownloaded');
	//=====for cooler tracking filter in cooler performance screen======//
	var coolerTrackingTypeProximity = $('.coolerTrackingTypeProximity');
	//=====for cooler tracking Always on filter in cooler performance screen======//


	result = result.data;



	$(".installationDateType").select2({
		maximumSelectionLength: 1
	});

	$(".lastDataReceivedType").select2({
		maximumSelectionLength: 1
	});

	$(".lastDataReceived").select2({
		maximumSelectionLength: 1
	});

	$(".DataDownloaded").select2({
		maximumSelectionLength: 1
	});

	if (isPreference != true) {
		var myForm = $("#filterForm").get(0);
		myForm.reset();
		$("select", myForm).each(
			function () {
				$(this).select2();
			}
		);
		result.DoorType = [{
			LookupId: 1,
			DisplayValue: 'One'
		}, {
			LookupId: 2,
			DisplayValue: 'Two'
		}];

		result.Connectivity = [{
			LookupId: 1,
			DisplayValue: 'Proximity'
		}, {
			LookupId: 2,
			DisplayValue: 'Always Connected'
		}];
		result.Facing = [];
		for (var i = 0; i < 100; i++) {
			result.Facing.push({
				LookupId: i,
				DisplayValue: i
			});
		}

		result.Displacement = [];
		// result.Displacement.push({
		// 	LookupId: -1,
		// 	DisplayValue: ''
		// });
		result.Displacement.push({
			LookupId: 0,
			DisplayValue: '< .5 km'
		});
		result.Displacement.push({
			LookupId: 1,
			DisplayValue: '.5 km - 1 km'
		});
		result.Displacement.push({
			LookupId: 2,
			DisplayValue: '> 1 km'
		});

		result.DisplacementHistoric = [];
		result.DisplacementHistoric.push({
			LookupId: 0,
			DisplayValue: '< .5 km'
		});
		result.DisplacementHistoric.push({
			LookupId: 1,
			DisplayValue: '.5 km - 1 km'
		});
		result.DisplacementHistoric.push({
			LookupId: 2,
			DisplayValue: '> 1 km'
		});


		result.DoorCount = [];
		result.DoorCount.push({
			LookupId: '10*',
			DisplayValue: 'Low performance (<=10 per day)'
		});

		result.DoorCount.push({
			LookupId: '50*10',
			DisplayValue: 'Normal performance (>10,<50 per day)'
		});

		result.DoorCount.push({
			LookupId: '*50',
			DisplayValue: 'High performance (=>50 per day)'
		});

		result.TempBand = [];
		result.TempBand.push({
			LookupId: '*2.9',
			DisplayValue: 'Low Temperature (<3)'
		});
		result.TempBand.push({
			LookupId: '3*7.9',
			DisplayValue: 'Normal Temperature (>3, <8)'
		});
		result.TempBand.push({
			LookupId: '8*9.9',
			DisplayValue: 'Warning Temperature (>8, <10)'
		});
		result.TempBand.push({
			LookupId: '10*11.9',
			DisplayValue: 'High Temperature (>10, <12)'
		});
		result.TempBand.push({
			LookupId: '12*',
			DisplayValue: 'Extreme Temperature (>12)'
		});


		result.LightBand = [];
		result.LightBand.push({
			LookupId: 'NoLight',
			DisplayValue: 'No Light (> 4h/day)'
		});

		result.PowerBand = [];
		result.PowerBand.push({
			LookupId: '4',
			DisplayValue: 'Power off (< 4 hrs)'
		});

		result.PowerBand.push({
			LookupId: '8',
			DisplayValue: 'Power off (< 8 hrs)'
		});

		result.PowerBand.push({
			LookupId: '12',
			DisplayValue: 'Power off (< 12 hrs)'
		});
		result.InstallationDateType = [];
		result.InstallationDateType.push({
			LookupId: '1',
			DisplayValue: 'Installed before selected period'
		}, {
			LookupId: '2',
			DisplayValue: 'Installed in selected period'
		});
		result.LastDataReceivedType = [];
		result.LastDataReceivedType.push({
			LookupId: '1',
			DisplayValue: 'Last data received after selected period'
		}, {
			LookupId: '2',
			DisplayValue: 'Last data received in selected period'
		});

		result.DoorDataSelectedType = [];
		result.DoorDataSelectedType.push({
			LookupId: '1',
			DisplayValue: 'Door data in selected period'
		});

		result.SalesDataSelectedType = [];
		result.SalesDataSelectedType.push({
			LookupId: '1',
			DisplayValue: 'Sales data in selected period'
		});

		result.DoorDataSelectedType = [];
		result.DoorDataSelectedType.push({
			LookupId: '1',
			DisplayValue: 'Door data in selected period'
		});

		//Telemetry Temperature
		result.TemperatureTele = [];
		result.TemperatureTele.push({
			LookupId: '1',
			DisplayValue: 'Below 0'
		});
		result.TemperatureTele.push({
			LookupId: '2',
			DisplayValue: '0-5'
		});
		result.TemperatureTele.push({
			LookupId: '3',
			DisplayValue: '5-10'
		});
		result.TemperatureTele.push({
			LookupId: '4',
			DisplayValue: '10-15'
		});
		result.TemperatureTele.push({
			LookupId: '5',
			DisplayValue: '>= 15'
		});
		result.TemperatureTele.push({
			LookupId: '6',
			DisplayValue: 'No Data'
		});

		//Fallen Magnet Chart
		result.MagnetFallenChartCTF = [];
		result.MagnetFallenChartCTF.push({
			LookupId: '1',
			DisplayValue: 'Normal Operation'
		});
		result.MagnetFallenChartCTF.push({
			LookupId: '2',
			DisplayValue: 'Fallen Magnet'
		});

		//Fallen Magnet Spread
		result.MagnetFallenSpreadCTF = [];
		result.MagnetFallenSpreadCTF.push({
			LookupId: '1',
			DisplayValue: '30 days > FallenMagnet > 15 days'
		});
		result.MagnetFallenSpreadCTF.push({
			LookupId: '2',
			DisplayValue: '60 days > FallenMagnet > 30 days'
		});
		result.MagnetFallenSpreadCTF.push({
			LookupId: '3',
			DisplayValue: '90 days > FallenMagnet > 60 days'
		});

		//Telemetry Eva Temperature
		result.EvaporatorTemperatureTele = [];
		result.EvaporatorTemperatureTele.push({
			LookupId: '1',
			DisplayValue: 'Below 0'
		});
		result.EvaporatorTemperatureTele.push({
			LookupId: '2',
			DisplayValue: '0-5'
		});
		result.EvaporatorTemperatureTele.push({
			LookupId: '3',
			DisplayValue: '5-10'
		});
		result.EvaporatorTemperatureTele.push({
			LookupId: '4',
			DisplayValue: '10-15'
		});
		result.EvaporatorTemperatureTele.push({
			LookupId: '5',
			DisplayValue: '>= 15'
		});
		result.EvaporatorTemperatureTele.push({
			LookupId: '6',
			DisplayValue: 'No Data'
		});

		//=data download outlet
		result.DataDownloadOutlet = [];
		result.DataDownloadOutlet.push({
			LookupId: '1',
			DisplayValue: 'Full Data'
		});
		result.DataDownloadOutlet.push({
			LookupId: '2',
			DisplayValue: 'Partial Data'
		});
		result.DataDownloadOutlet.push({
			LookupId: '3',
			DisplayValue: 'No Data'
		});

		//=Execute Command Report
		result.ExcecuteCommandReport = [];
		result.ExcecuteCommandReport.push({
			LookupId: '1',
			DisplayValue: 'Executed'
		});
		result.ExcecuteCommandReport.push({
			LookupId: '2',
			DisplayValue: 'Scheduled'
		});

		//=Execute Command Spread
		result.ExcecuteCommandSpread = [];
		result.ExcecuteCommandSpread.push({
			LookupId: '1',
			DisplayValue: 'Executed<15 days'
		});
		result.ExcecuteCommandSpread.push({
			LookupId: '2',
			DisplayValue: 'Executed > 15, <30 days'
		});
		result.ExcecuteCommandSpread.push({
			LookupId: '3',
			DisplayValue: 'Executed > 30, <60 days'
		});
		result.ExcecuteCommandSpread.push({
			LookupId: '4',
			DisplayValue: 'Executed >60 days'
		});

		result.TelemetryLightStatus = [];
		result.TelemetryLightStatus.push({
			LookupId: '1',
			DisplayValue: 'Light'
		});
		result.TelemetryLightStatus.push({
			LookupId: '2',
			DisplayValue: 'No Light'
		});
		// result.TelemetryLightStatus.push({
		// 	LookupId: 'mediumbrightness',
		// 	DisplayValue: 'Medium Brightness'
		// });
		// result.TelemetryLightStatus.push({
		// 	LookupId: 'fulllightbrightness',
		// 	DisplayValue: 'Full Light Brightness'
		// });
		result.TelemetryLightStatus.push({
			LookupId: 'nodata',
			DisplayValue: 'No Data'
		});


		result.TelemetryDoorCount = [];
		result.TelemetryDoorCount.push({
			LookupId: '1',
			DisplayValue: '0-25'
		});
		result.TelemetryDoorCount.push({
			LookupId: '2',
			DisplayValue: '26-50'
		});
		result.TelemetryDoorCount.push({
			LookupId: '3',
			DisplayValue: '51-75'
		});
		result.TelemetryDoorCount.push({
			LookupId: '4',
			DisplayValue: '76-100'
		});
		result.TelemetryDoorCount.push({
			LookupId: '5',
			DisplayValue: '101-125'
		});

		result.TelemetryDoorCount.push({
			LookupId: '6',
			DisplayValue: '125+'
		});
		result.TelemetryDoorCount.push({
			LookupId: '7',
			DisplayValue: 'No Data'
		});


		result.batteryReprtData = [];
		result.batteryReprtData.push({
			LookupId: '1',
			DisplayValue: '0%-25%'
		});
		result.batteryReprtData.push({
			LookupId: '2',
			DisplayValue: '25%-50%'
		});
		result.batteryReprtData.push({
			LookupId: '3',
			DisplayValue: '50%-75%'
		});
		result.batteryReprtData.push({
			LookupId: '4',
			DisplayValue: '75%-100%'
		});

		//telemetry Power off 
		result.telemetryPowerStatus = [];
		result.telemetryPowerStatus.push({
			LookupId: '1',
			DisplayValue: '<1'
		});
		result.telemetryPowerStatus.push({
			LookupId: '2',
			DisplayValue: '1-4 Hours'
		});
		result.telemetryPowerStatus.push({
			LookupId: '3',
			DisplayValue: '4-8 Hours'
		});
		result.telemetryPowerStatus.push({
			LookupId: '4',
			DisplayValue: '8-12 Hours'
		});
		result.telemetryPowerStatus.push({
			LookupId: '5',
			DisplayValue: '12-16 Hours'
		});
		result.telemetryPowerStatus.push({
			LookupId: '6',
			DisplayValue: '16-24 Hours'
		});
		result.telemetryPowerStatus.push({
			LookupId: '8',
			DisplayValue: 'No Interruptions'
		});
		result.telemetryPowerStatus.push({
			LookupId: '7',
			DisplayValue: 'No Data'
		});



		//Technical diagnostics Compressor  
		result.CompressorBand = [];
		result.CompressorBand.push({
			LookupId: '1',
			DisplayValue: '<1'
		});
		result.CompressorBand.push({
			LookupId: '2',
			DisplayValue: '1-4 Hours'
		});
		result.CompressorBand.push({
			LookupId: '3',
			DisplayValue: '4-8 Hours'
		});
		result.CompressorBand.push({
			LookupId: '4',
			DisplayValue: '8-12 Hours'
		});
		result.CompressorBand.push({
			LookupId: '5',
			DisplayValue: '12-16 Hours'
		});
		result.CompressorBand.push({
			LookupId: '6',
			DisplayValue: '16-24 Hours'
		});
		result.CompressorBand.push({
			LookupId: '7',
			DisplayValue: 'No Data'
		});

		//Technical diagnostics Fan  
		result.FanBand = [];
		result.FanBand.push({
			LookupId: '1',
			DisplayValue: '<1'
		});
		result.FanBand.push({
			LookupId: '2',
			DisplayValue: '1-4 Hours'
		});
		result.FanBand.push({
			LookupId: '3',
			DisplayValue: '4-8 Hours'
		});
		result.FanBand.push({
			LookupId: '4',
			DisplayValue: '8-12 Hours'
		});
		result.FanBand.push({
			LookupId: '5',
			DisplayValue: '12-16 Hours'
		});
		result.FanBand.push({
			LookupId: '6',
			DisplayValue: '16-24 Hours'
		});
		result.FanBand.push({
			LookupId: '7',
			DisplayValue: 'No Data'
		});


		result.TempLightIssue = [];
		result.TempLightIssue.push({
			LookupId: '1',
			DisplayValue: 'Temperature and Light Issue'
		});
		result.TempLightIssue.push({
			LookupId: '2',
			DisplayValue: 'Temperature issue'
		});
		result.TempLightIssue.push({
			LookupId: '3',
			DisplayValue: 'Light issue'
		});
		result.TempLightIssue.push({
			LookupId: '4',
			DisplayValue: 'Temperature and Light OK'
		});



		result.DoorSwingsVsTarget = [];
		result.DoorSwingsVsTarget.push({
			LookupId: '1',
			DisplayValue: 'A'
		});
		result.DoorSwingsVsTarget.push({
			LookupId: '2',
			DisplayValue: 'B'
		});
		result.DoorSwingsVsTarget.push({
			LookupId: '3',
			DisplayValue: 'C'
		});
		result.DoorSwingsVsTarget.push({
			LookupId: '4',
			DisplayValue: 'D'
		});
		result.DoorSwingsVsTarget.push({
			LookupId: '5',
			DisplayValue: 'E'
		});

		result.CoolerHealth = [];
		result.CoolerHealth.push({
			LookupId: '1',
			DisplayValue: 'Cooler Above 7 C (Temp)'
		});
		result.CoolerHealth.push({
			LookupId: '2',
			DisplayValue: 'Cooler With Low Light'
		});
		// result.CoolerHealth.push({
		// 	LookupId: '3',
		// 	DisplayValue: 'Hours Power Off'
		// });
		result.CoolerHealth.push({
			LookupId: '3',
			DisplayValue: 'Low Utilization Cooler'
		});
		result.CoolerHealth.push({
			LookupId: '4',
			DisplayValue: 'Missing/No Data'
		});

		result.DataDownloaded = [];
		result.DataDownloaded.push({
			LookupId: '1',
			DisplayValue: 'Data Downloaded'
		});
		result.DataDownloaded.push({
			LookupId: '2',
			DisplayValue: 'Data Not Downloaded'
		});

		result.LastDataDownloaded = [];
		result.LastDataDownloaded.push({
			LookupId: '1',
			DisplayValue: 'No data for more than 90 days'
		});
		result.LastDataDownloaded.push({
			LookupId: '2',
			DisplayValue: 'Last data > 60, <90 days'
		});
		result.LastDataDownloaded.push({
			LookupId: '3',
			DisplayValue: 'Last >30, <60'
		});
		result.LastDataDownloaded.push({
			LookupId: '4',
			DisplayValue: 'Last data <=30'
		});

		result.CoolerPerformanceIndex = [];
		result.CoolerPerformanceIndex.push({
			LookupId: '1',
			DisplayValue: 'Door Opens Avg Daily'
		});
		result.CoolerPerformanceIndex.push({
			LookupId: '2',
			DisplayValue: 'Data Downloaded'
		});
		result.CoolerPerformanceIndex.push({
			LookupId: '3',
			DisplayValue: 'Hours Power On Avg Daily'
		});
		result.CoolerPerformanceIndex.push({
			LookupId: '4',
			DisplayValue: 'Right Temp Avg Daily'
		});
		result.CoolerPerformanceIndex.push({
			LookupId: '5',
			DisplayValue: 'Hours Lights On'
		});

		result.DoorOpenVsSales = [];
		result.DoorOpenVsSales.push({
			LookupId: '1',
			DisplayValue: 'Low Door – Low Sales'
		});
		result.DoorOpenVsSales.push({
			LookupId: '2',
			DisplayValue: 'Low Door – High Sales'
		});
		result.DoorOpenVsSales.push({
			LookupId: '3',
			DisplayValue: 'High Door – Low Sales'
		});
		result.DoorOpenVsSales.push({
			LookupId: '4',
			DisplayValue: 'High Door – High Sales'
		});

		result.OperationalIssues = [];
		result.OperationalIssues.push({
			LookupId: '1',
			DisplayValue: 'No Light (8-12 Hours)'
		});
		result.OperationalIssues.push({
			LookupId: '2',
			DisplayValue: 'No Light (12-24 Hours)'
		});
		result.OperationalIssues.push({
			LookupId: '3',
			DisplayValue: 'High Temperature (8-12 Hours)'
		});
		result.OperationalIssues.push({
			LookupId: '4',
			DisplayValue: 'High Temperature (12-24 Hours)'
		});
		result.OperationalIssues.push({
			LookupId: '5',
			DisplayValue: 'Power Off (8-12 Hours)'
		});
		result.OperationalIssues.push({
			LookupId: '6',
			DisplayValue: 'Power Off (12-24 Hours)'
		});


		result.CoolerTrackingType = [];
		result.CoolerTrackingType.push({
			LookupId: '1',
			DisplayValue: 'Not Transmitting'
		}, {
			LookupId: '2',
			DisplayValue: 'Wrong Location'
		}, {
			LookupId: '3',
			DisplayValue: 'Location as expected'
		});

		//=====for cooler tracking Proximity filter in cooler performance screen======//
		result.CoolerTrackingTypeProximity = [];
		result.CoolerTrackingTypeProximity.push({
				LookupId: '1',
				DisplayValue: 'Not Visited'
			},
			//   {
			//   LookupId: '2',
			//   DisplayValue: 'Missing'
			//  }, {
			//   LookupId: '3',
			//   DisplayValue: 'Wrong Location'
			//  }, 
			{
				LookupId: '4',
				DisplayValue: 'Location Confirmed'
			});

		result.OutletType = [];

		if (coolerDashboard.isNavigationChanged == true) {
			result.OutletType.push({
				LookupId: '6282',
				DisplayValue: 'Market',
			});
		} else {
			result.OutletType.push({
				LookupId: '6282',
				DisplayValue: 'Market',
				IsDefault: true
			});
		}

		result.OutletType.push({
			LookupId: '6283',
			DisplayValue: 'WareHouse'
		});

		result.OutletType.push({
			LookupId: '7287',
			DisplayValue: 'Test'
		});

		result.OutletType.push({
			LookupId: '0',
			DisplayValue: 'All'
		});

		var index = _.findIndex(result.ManufacturerSmartDevice, function (data) {
			return data.DisplayValue == "Insigma Inc"
		});
		if (index != -1) {
			if (coolerDashboard.isNavigationChanged == false) {
				result.ManufacturerSmartDevice[index].IsDefault = true;
			} else {
				result.ManufacturerSmartDevice[index].IsDefault = false;
			}
		}

		var index2 = _.findIndex(result.ManufacturerSmartDevice, function (data) {
			return data.DisplayValue == "Sollatek"
		});
		if (index2 != -1 && ClientId == 1) {
			if (coolerDashboard.isNavigationChanged == false) {
				result.ManufacturerSmartDevice[index2].IsDefault = true;
			} else {
				result.ManufacturerSmartDevice[index2].IsDefault = false;
			}
		}

		if (resultToStorage) {
			resultToStorage.data = result;
			localStorage.setItem('comboData', LZString.compressToUTF16(JSON.stringify(resultToStorage)));
		}
		//addCheckbox(result.Market, marketCombo, 'MarketId');
		//addCheckbox(result.Country, countryCombo, 'CountryId');
		//addCheckbox(result.SalesRep, salesRepCombo, 'LocationRepId');
		//addCheckbox(result.LocationType, channelCombo, 'LocationTypeId');
		//addCheckbox(result.SubTradeChannelType, subTradeChannel, 'SubTradeChannelTypeId');
		addCheckbox(result.OutletType, outletType, 'OutletTypeId');
		//addCheckbox(result.LocationClassification, classificationCombo, 'ClassificationId');
		//addCheckbox(result.City, cityCombo, 'City');
		addCheckbox(result.ManufacturerAsset, manufacturerCombo, 'AssetManufacturerId');
		addCheckbox(result.ManufacturerSmartDevice, manufacturerSmartDevice, 'SmartDeviceManufacturerId');
		addCheckbox(result.StoreOwner, ownerCombo, 'OwnerId');
		//addCheckbox(result.AlertStatus, alertStatusCombo, 'StatusId');
		addCheckbox(result.SmartDeviceType, deviceTypeCombo, 'SmartDeviceTypeId');
		//addCheckbox(result.Location, locationCombo, 'LocationId');
		coolerDashboard.common.addSelectData(country, result.Country, null, null);

		coolerDashboard.common.addSelectData(assetType, result.AssetType);
		//coolerDashboard.common.addSelectData(locationCombo, result.Location);
		coolerDashboard.common.addSelectData(tradeChannelCombo, result.LocationType);
		coolerDashboard.common.addSelectData(classificationComboSelect, result.LocationClassification);
		coolerDashboard.common.addSelectData(alertStatusComboSelect, result.AlertStatus);
		coolerDashboard.common.addSelectData(alertTypeComboSelected, result.AlertType);
		coolerDashboard.common.addSelectData(subTradeChannelTypeCombo, result.SubTradeChannelType);
		coolerDashboard.common.addSelectData(assetTypeCapacity, result.AssetTypeCapacity);
		coolerDashboard.common.addSelectData(manufacturer, result.ManufacturerAsset);
		coolerDashboard.common.addSelectData(manufacturerSmartDeviceCombo, result.ManufacturerSmartDevice);
		coolerDashboard.common.addSelectData(coolerTrackingType, result.CoolerTrackingType);
		coolerDashboard.common.addSelectData(coolerTrackingTypeProximity, result.CoolerTrackingTypeProximity);
		//console.log(result);

		//coolerDashboard.common.addSelectData(SalesHierarchyCombo, result.SalesHierarchy);
		// var longFn = function () {
		// 	return new Promise(function (res, rej) {
		// 		setTimeout(res, 3000);
		coolerDashboard.common.addSelectData(assetDisplacement, result.Displacement);
		coolerDashboard.common.addSelectData(assetDisplacementHistoric, result.DisplacementHistoric);

		// 	});
		// };
		// var coolFn = function () {

		coolerDashboard.common.addSelectData(installationDateType, result.InstallationDateType);
		//};
		// var coolFn1 = function () {

		coolerDashboard.common.addSelectData(assetTempBand, result.TempBand);
		// };
		// var coolFn2 = function () {

		coolerDashboard.common.addSelectData(assetDoorCount, result.DoorCount);
		// };
		// var coolFn3 = function () {

		coolerDashboard.common.addSelectData(salesDataSelectedType, result.SalesDataSelectedType);
		// };
		// var coolFn4 = function () {

		coolerDashboard.common.addSelectData(doorDataSelectedType, result.DoorDataSelectedType);
		// };
		// var coolFn5 = function () {

		coolerDashboard.common.addSelectData(lastDataReceivedType, result.LastDataReceivedType);
		// };
		// var coolFn6 = function () {

		coolerDashboard.common.addSelectData(assetLightBand, result.LightBand);
		// };
		// var coolFn7 = function () {

		coolerDashboard.common.addSelectData(assetPowerBand, result.PowerBand);
		// };
		// var coolFn8 = function () {

		coolerDashboard.common.addSelectData(city, result.City, '', true);
		// };
		// longFn().then(coolFn).then(coolFn1).then(coolFn2).then(coolFn3).then(coolFn4).then(coolFn5).then(coolFn6).then(coolFn7).then(coolFn8);


		coolerDashboard.common.addSelectData(telemetryDoorCount, result.TelemetryDoorCount);
		coolerDashboard.common.addSelectData(batteryReprtData, result.batteryReprtData);
		coolerDashboard.common.addSelectData(TemperatureTele, result.TemperatureTele);
		coolerDashboard.common.addSelectData(MagnetFallenChartCTF, result.MagnetFallenChartCTF);
		coolerDashboard.common.addSelectData(MagnetFallenSpreadCTF, result.MagnetFallenSpreadCTF);
		coolerDashboard.common.addSelectData(EvaporatorTemperatureTele, result.EvaporatorTemperatureTele);
		coolerDashboard.common.addSelectData(telemetryLightStatus, result.TelemetryLightStatus);
		coolerDashboard.common.addSelectData(telemetryPowerStatus, result.telemetryPowerStatus);
		coolerDashboard.common.addSelectData(CompressorBand, result.CompressorBand);
		coolerDashboard.common.addSelectData(FanBand, result.FanBand);
		coolerDashboard.common.addSelectData(TempLightIssue, result.TempLightIssue);
		coolerDashboard.common.addSelectData(DoorSwingsVsTarget, result.DoorSwingsVsTarget);
		coolerDashboard.common.addSelectData(DataDownloadOutlet, result.DataDownloadOutlet);
		coolerDashboard.common.addSelectData(ExcecuteCommandReport, result.ExcecuteCommandReport);
		coolerDashboard.common.addSelectData(ExcecuteCommandSpread, result.ExcecuteCommandSpread);
		coolerDashboard.common.addSelectData(CoolerPerformanceIndex, result.CoolerPerformanceIndex);
		coolerDashboard.common.addSelectData(DoorOpenVsSales, result.DoorOpenVsSales);
		coolerDashboard.common.addSelectData(OperationalIssues, result.OperationalIssues);
		coolerDashboard.common.addSelectData(CoolerHealth, result.CoolerHealth);
		coolerDashboard.common.addSelectData(DataDownloaded, result.DataDownloaded);
		coolerDashboard.common.addSelectData(LastDataDownloaded, result.LastDataDownloaded);

		setTimeout(function () {
			coolerDashboard.common.addSelectData(locationRep, result.SalesRep);
			coolerDashboard.common.addSelectData(TelesellingTerritory, result.TeleSellingTerritory);
		}, 1000);

		//coolerDashboard.common.addSelectData(address, result.Address, '', true);
		//addCheckbox(result.AssetType, assetTypeCombo, 'AssetTypeId');
		//addCheckbox(result.AlertType, alertTypeCombo, 'AlertTypeId');
		addCheckbox(result.DoorType, doorTypeCombo, 'DoorTypeId');
		addCheckbox(result.Connectivity, connectivityTypeCombo, 'ConnectivityTypeId');
	} else {
		var myForm = $("#filterForm").get(0);
		myForm.reset();
		$("select", myForm).each(
			function () {
				$(this).select2();
			}
		);
		start = moment().subtract(1, 'months').startOf('month');
		end = moment().subtract(1, 'months').endOf('month');
		var checkBox = $("input[type=checkbox]"),
			disabledCheckBox;
		for (var i = 0, len = checkBox.length; i < len; i++) {
			disabledCheckBox = $(checkBox[i]);
			disabledCheckBox.attr("disabled", false);
		}
		startDateCorrelation = moment().subtract(364, 'days');
		$("#reportrange").data('daterangepicker').setStartDate(start);
		$("#reportrange").data('daterangepicker').setEndDate(end);
		var isSalesCorrelation = true;
		//cb(start, end, false, isSalesCorrelation);
		$('#jstree').jstree("deselect_all");
		enableDisableDateFilter(1, 12, true);

	}
	var comboData = JSON.parse(LZString.decompressFromUTF16(localStorage.comboData));

	var salesHierarchy = comboData.data.SalesHierarchy;

	if (salesHierarchy && salesHierarchy.length > 0) {

		var grouped = _.groupBy(salesHierarchy, function (data) {
			return data.SalesHierarchyLevel;
		});

		var keys = Object.keys(grouped);

		var hierarchy = [];
		var hierarchyInserted = [];
		var length = salesHierarchy.length;
		for (var j = 0; j < length; j++) {
			var values = salesHierarchy[j];
			hierarchy.push({
				item: {
					id: values.SalesHierarchyId.toString(),
					label: values.Name,
					checked: false
				},
				id: values.SalesHierarchyId.toString(),
				text: values.Name,
				SalesHierarchyLevel: values.SalesHierarchyLevel,
				ParentSalesHierarchyId: values.ParentSalesHierarchyId,
				SalesHierarchyId: values.SalesHierarchyId

			});
		}

		grouped = _.groupBy(hierarchy, function (data) {
			return data.SalesHierarchyLevel;
		});

		var length = keys.length;
		for (var i = length - 1; i >= 0; i--) {
			var childLength = hierarchy.length;
			for (var j = 0; j < childLength; j++) {
				var children = _.filter(grouped[keys[i]], function (data) {
					return data.ParentSalesHierarchyId == hierarchy[j].SalesHierarchyId;
				});

				if (children && children.length > 0) {
					for (var k = 0; k < children.length; k++) {
						hierarchyInserted.push(children[k]);
					}
					hierarchy[j].children = children;
				}

			}
		}
		if (hierarchyInserted && hierarchyInserted.length > 0) {
			for (var k = 0; k < hierarchyInserted.length; k++) {
				var index = jQuery.inArray(hierarchyInserted[k], hierarchy);
				if (index != -1) {
					hierarchy.splice(index, 1);
				}
			}
		}
		hierarchy = _.sortBy(hierarchy, 'text');

		var treedata = $('#jstree').on('loaded.jstree', treeLoaded).jstree({
			"checkbox": {
				"keep_selected_style": false
			},
			'plugins': ["checkbox"],
			'core': {
				'dblclick_toggle': false,
				"themes": {
					"theme": "classic",
					"dots": false,
					//"variant": "small",
					"icons": false,
				},
				'data': hierarchy,
				'check_callback': false
			}
		});
		if (treedata) {

			treedata.bind("select_node.jstree", function (evt, data) {
				//$("#filterForm").submit();
			});

			treedata.bind("deselect_node.jstree", function (evt, data) {
				//$("#filterForm").submit();
			});

		}
	}


	function treeLoaded(event, data) {
		//data.instance.select_node(['2', '5']); //node ids that you want to check
	}

	$('.checkbox').change(function (me) {
		var name = me.target.getAttribute('name');

		if (name === "defaultPreference") {
			return this.value;
		}
		if (name == "yearWeek" || name == "month" || name == "quarter") {
			var value = this.value;
			var arr = [];
			$.each($("input[type=checkbox][name=" + name + "]:checked"), function () {
				arr.push($(this).val());
			});
			for (var i = Number(arr[0]); i < Number(arr[arr.length - 1]); i++) {
				$("input[type=checkbox][name=" + name + "][value = '" + i + "']").prop("checked", true);
			}
			$('#reportrange span').html('');
			startDate = '';
			endDate = '';
			startDateCorrelation = '';
			endDateCorrelation = '';

			var lowerRange = 0;
			var higherRange = 0;
			var maxRange = 0;
			switch (name) {
				case "quarter":
					var quarterValue = 0;
					for (var i = 0, len = arr.length; i < len; i++) {
						quarterValue = Number(arr[i]);
						maxRange = quarterValue * 3;
						lowerRange = lowerRange == 0 ? maxRange - 2 : lowerRange < maxRange - 2 ? lowerRange : maxRange - 2;
						higherRange = higherRange == 0 ? maxRange : higherRange > maxRange ? higherRange : maxRange;
					}
					enableDisableDateFilter(lowerRange == 0 ? 1 : lowerRange, higherRange == 0 ? 12 : higherRange, true);

					break;
				case "month":
					for (var i = 0, len = arr.length; i < len; i++) {
						maxRange = Number(arr[i]);
						lowerRange = lowerRange == 0 ? Number(arr[i]) : lowerRange < Number(arr[i]) ? lowerRange : maxRange - 2;
						higherRange = higherRange == 0 ? maxRange : higherRange > maxRange ? higherRange : maxRange;
					}
					enableDisableDateFilter(lowerRange == 0 ? 1 : lowerRange, higherRange == 0 ? 12 : higherRange, false);

					break;
			}

		}
		var tempArr = [];
		$.each($("input[type=checkbox][name=" + name + "]:checked"), function () {
			tempArr.push($(this).val());
		});

		if (name == "OutletTypeId") {
			coolerDashboard.isNavigationChanged = true;
			var index = tempArr.indexOf("0");
			if (this.value == "0") {
				if (index != -1) {
					$("input[type=checkbox][name=OutletTypeId]").prop("checked", true);

				} else {
					$("input[type=checkbox][name=OutletTypeId]").prop("checked", false);
				}
			} else {
				if (index != -1) {
					tempArr.splice(index, 1);
				}
				$("input[type=checkbox][name=OutletTypeId]").prop("checked", false);
				for (var i = 0; length = tempArr.length, i < length; i++) {
					$("input[type=checkbox][name=" + name + "][value = '" + tempArr[i] + "']").prop("checked", true);
				}
			}
		}
		if (name == "City") {
			selectDefault($(".cityCombo"), items);
			//$(".cityCombo").select2().val(tempArr).change();
		}
		if (name == "LocationTypeId") {
			selectDefault($(".tradeChannelCombo"), items);
			//$(".tradeChannelCombo").select2().val(tempArr).change();
		}
		if (name == "ClassificationId") {
			selectDefault($(".classificationCombo"), items);
			//$(".classificationCombo").select2().val(tempArr).change();
		}
		// if (name == "SalesHierarchyId") {
		// 	$(".SalesHierarchyId").select2().val(tempArr).change();
		// }
		if (name == "SubTradeChannelTypeId") {
			selectDefault($(".subTradeChannelTypeCombo"), items);
			//$(".subTradeChannelTypeCombo").select2().val(tempArr).change();
		}


		if (name == "CountryId") {
			selectDefault($(".countryCombo"), items);
			//$(".countryCombo").select2().val(tempArr).change();
		}
		if (name == "LocationId") {
			selectDefault($(".location"), items);
			//$(".location").select2().val(tempArr).change();
		}
		if (name == "AssetManufacturerId") {
			$(".manufacturerCombo").select2().val(tempArr).change();
		}

		if (name == "AssetTypeId") {
			selectDefault($(".assetTypeCombo"), items);
			//$(".assetTypeCombo").select2().val(tempArr).change();
		}

		if (name == "AssetTypeCapacityId") {
			selectDefault($(".assetTypeCapacityCombo"), items);
		}


		if (name == "StatusId") {
			selectDefault($(".alertStatusCombo"), items);
			//$(".alertStatusCombo").select2().val(tempArr).change();
		}

		if (name == "AlertTypeId") {
			selectDefault($(".alertTypeComboSelected"), items);
			//$(".alertTypeCombo").select2().val(tempArr).change();
		}

		if (name == "SmartDeviceManufacturerId") {
			$(".manufacturerSmartDevice").select2().val(tempArr).change();
			coolerDashboard.isNavigationChanged = true;
		}

		coolerDashboard.isFilterChanged = true;


		//$("#filterForm").submit();
	});

	$(".select2").on("select2:select", function (me) {

		coolerDashboard.common.updateCTFFilterList($('#filterForm').serializeArray(), '#ctf-list', '.totalCTFCount');


		var items = $(this).val();
		var name = me.target.getAttribute('name');
		for (var i = 0; length = items.length, i < length; i++) {
			$("input[type=checkbox][name=" + name + "][value = '" + items[i] + "']").prop("checked", true);
		}
		// if (name == "DisplacementFilter") {
		// 	isDisplacement = true;
		// }
		// $("#filterForm").submit();

		if (name == 'telemetryDoorCount' || name == 'batteryReprtData' || name == 'EvaporatorTemperatureTele' || name == 'TemperatureTele' || name == 'MagnetFallenChartCTF' || name == 'MagnetFallenSpreadCTF' || name == 'telemetryPowerStatus' ||
			name == 'telemetryLightStatus' || name == 'telemetryLightStatus' ||
			name == 'CompressorBand' || name == 'FanBand') {

			//var isNoData = $('.' + name).select2('data').filter(data => data.text == 'No Data');
			var isNoData = $('.' + name).select2('data').filter(function (data) {
				return data.text == 'No Data'
			});

			if (isNoData.length > 0) {
				$('.' + name + ' option').select2().each(function (_this, element) {
					if (element.text != "No Data")
						element.disabled = true;
					$('.' + name).select2().trigger('change');
				});

				$('.' + name).select2().trigger('change');
			} else {
				$('.' + name + ' option').select2().each(function (_this, element) {
					if (element.text == "No Data")
						element.disabled = true;
					$('.' + name).select2().trigger('change');
				});
			}
		}

	});

	$(".select2").on("select2:unselect", function (me) {
		coolerDashboard.common.updateCTFFilterList($('#filterForm').serializeArray(), '#ctf-list', '.totalCTFCount');

		var items = me.params.data.id;
		var name = me.target.getAttribute('name');
		if (name == "city") {
			$("input[type=checkbox][name=" + name + "][value = '" + items + "']").prop("checked", false);
		} else {
			$("input[type=checkbox][name=" + name + "][value = '" + items + "']").prop("checked", false);
		}
		// if (name == "DisplacementFilter") {
		// 	isDisplacement = false;
		// }
		// $("#filterForm").submit();

		if (name == 'CompressorBand' || name == 'FanBand') {

			//var isNoData = $('.' + name).select2('data').filter(data => data.text == 'No Data');
			var isNoData = $('.' + name).select2('data').filter(function (data) {
				return data.text == 'No Data'
			});
			if (isNoData.length > 0 || me.params.data.text == "No Data") {
				$('.' + name + ' option').select2().each(function (_this, element) {
					if (element.text != "No Data")
						element.disabled = false;
					$('.' + name).select2().trigger('change');
				});

				$('.' + name).select2().trigger('change');
			} else if ($('.' + name).select2('data').length == 0) {
				$('.' + name + ' option').select2().each(function (_this, element) {
					if (element.text == "No Data")
						element.disabled = false;
					$('.' + name).select2().trigger('change');
				});
			}
		}

	});

	function selectDefault(id, items) {
		setTimeout(function () {
			var alreadyExist = id.select2('data');
			var _items = [];
			_items.push(items);
			if (alreadyExist.length > 0) {
				alreadyExist.forEach(function (element) {
					_items.push(element.id);
				});
			}

			id.select2().val(_items).change();
		}, 3000);
	};

	if (this.filterValuesChart) {
		var startDateCorrelation, endDateCorrelation;
		var defaultrate = 0;
		var defaultrateInsigma = 0;
		for (var i = 0; i < this.filterValuesChart.length; i++) {
			var items = this.filterValuesChart[i].value;
			var name = this.filterValuesChart[i].name;
			if (items.length > 0) {
				$("input[type=checkbox][name=" + name + "][value = '" + items + "']").prop("checked", true);
			}

			if (name == "yearWeek" || name == "month" || name == "quarter") {
				var value = this.value;
				var arr = [];
				$.each($("input[type=checkbox][name=" + name + "]:checked"), function () {
					arr.push($(this).val());
				});
				for (var z = Number(arr[0]); z < Number(arr[arr.length - 1]); z++) {
					$("input[type=checkbox][name=" + name + "][value = '" + z + "']").prop("checked", true);
				}
				$('#reportrange span').html('');
				startDate = '';
				endDate = '';
				startDateCorrelation = '';
				endDateCorrelation = '';
				var lowerRange = 0;
				var higherRange = 0;
				var maxRange = 0;
				switch (name) {
					case "quarter":
						var quarterValue = 0;
						for (var j = 0, len = arr.length; j < len; j++) {
							quarterValue = Number(arr[j]);
							maxRange = quarterValue * 3;
							lowerRange = lowerRange == 0 ? maxRange - 2 : lowerRange < maxRange - 2 ? lowerRange : maxRange - 2;
							higherRange = higherRange == 0 ? maxRange : higherRange > maxRange ? higherRange : maxRange;
						}
						enableDisableDateFilter(lowerRange == 0 ? 1 : lowerRange, higherRange == 0 ? 12 : higherRange, true);

						break;
					case "month":
						for (var k = 0, len = arr.length; k < len; k++) {
							maxRange = Number(arr[k]);
							lowerRange = lowerRange == 0 ? Number(arr[k]) : lowerRange < Number(arr[k]) ? lowerRange : maxRange - 2;
							higherRange = higherRange == 0 ? maxRange : higherRange > maxRange ? higherRange : maxRange;
						}
						enableDisableDateFilter(lowerRange == 0 ? 1 : lowerRange, higherRange == 0 ? 12 : higherRange, false);

						break;
				}

			}
			var tempArr = [];
			$.each($("input[type=checkbox][name=" + name + "]:checked"), function () {
				tempArr.push($(this).val());
			});
			if (name == "City") {
				//$(".cityCombo").select2().val(tempArr).change();
				selectDefault($(".cityCombo"), items);
			}
			if (name == "LocationTypeId") {
				selectDefault($(".tradeChannelCombo"), items);
				//$(".tradeChannelCombo").select2().val(tempArr).change();
			}
			if (name == "ClassificationId") {
				selectDefault($(".classificationCombo"), items);
				//$(".classificationCombo").select2().val(tempArr).change();
			}
			if (name == "SubTradeChannelTypeId") {
				selectDefault($(".subTradeChannelTypeCombo"), items);
				//$(".subTradeChannelTypeCombo").select2().val(tempArr).change();
			}
			if (name == "CountryId") {
				selectDefault($(".countryCombo"), items);
				//$(".countryCombo").select2().val(items).change();
			}
			if (name == "TeleSellingTerritoryId") {
				selectDefault($(".TelesellingTerritoryType"), items);
				//$(".countryCombo").select2().val(items).change();
			}
			if (name == "UserId") {
				selectDefault($(".locationRep"), items);
				//$(".countryCombo").select2().val(items).change();
			}




			if (name == "LocationId") {
				selectDefault($(".location"), items);
				//$(".location").select2().val(tempArr).change();
			}

			if (name == "AssetManufacturerId") {
				$(".manufacturerCombo").select2().val(tempArr).change();
			}

			if (name == "AssetTypeId") {
				selectDefault($(".assetTypeCombo"), items);
				//$(".assetTypeCombo").select2().val(tempArr).change();
			}

			if (name == "AssetTypeCapacityId") {
				selectDefault($(".assetTypeCapacityCombo"), items);
			}

			if (name == "StatusId") {
				selectDefault($(".alertStatusCombo"), items);
				//$(".alertStatusCombo").select2().val(tempArr).change();
			}


			if (name == "LocationCode") {
				$("input[type=text][name=" + name + "]").val(items);
			}

			if (name == "UserId") {
				tempArr.push($(".locationRep").select2().val(), items);
				$(".locationRep").select2().val(tempArr).change();
			}

			if (name == "TeleSellingTerritoryId") {
				tempArr.push($(".TelesellingTerritoryType").select2().val(), items);
				$(".TelesellingTerritoryType").select2().val(tempArr).change();
			}

			if (name == "SmartDeviceManufacturerId") {
				$(".manufacturerSmartDevice").select2().val(tempArr).change();
				defaultrateInsigma++;
			}
			if (name == "OutletTypeId") {
				defaultrate++;
			}
			if (name == "AlertTypeId") {
				selectDefault($(".alertTypeComboSelected"), items);
				//$(".alertTypeCombo").select2().val(tempArr).change();
			}
			// if (name == "DoorCount") {

			// 	$(".assetDoorCount").select2().val(items).change();
			// }
			if (name == "DoorCount") {
				//$(".assetDoorCount").select2().val(items).change();
				selectDefault($(".assetDoorCount"), items);
			}

			if (name == "telemetryDoorCount") {
				//$(".telemetryDoorCount").select2().val(items).change();
				selectDefault($(".telemetryDoorCount"), items);
			}

			if (name == "batteryReprtData") {
				selectDefault($(".batteryReprtData"), items);
			}

			if (name == "DisplacementFilter") {
				//$(".assetDisplacement").select2().val(items).change();
				selectDefault($(".assetDisplacement"), items);
			}

			if (name == "DisplacementFilterHistoric") {
				selectDefault($(".assetDisplacementHistoric"), items);
			}

			if (name == "TempBand") {
				//$(".assetTempBand").select2().val(items).change();
				selectDefault($(".assetTempBand"), items);
			}

			if (name == "TemperatureTele") {
				//$(".TemperatureTele").select2().val(items).change();
				selectDefault($(".TemperatureTele"), items);
			}

			if (name == "MagnetFallenChartCTF") {
				selectDefault($(".MagnetFallenChartCTF"), items);
			}

			if (name == "MagnetFallenSpreadCTF") {
				selectDefault($(".MagnetFallenSpreadCTF"), items);
			}

			if (name == "EvaporatorTemperatureTele") {
				//$(".EvaporatorTemperatureTele").select2().val(items).change();
				selectDefault($(".EvaporatorTemperatureTele"), items);
			}

			if (name == "PowerStatus") {
				//$(".assetPowerBand").select2().val(items).change();
				selectDefault($(".assetPowerBand"), items);
			}

			if (name == "LightStatus") {
				//$(".assetLightBand").select2().val(items).change();
				selectDefault($(".assetLightBand"), items);
			}

			if (name == "telemetryLightStatus") {
				//$(".telemetryLightStatus").select2().val(items).change();
				selectDefault($(".telemetryLightStatus"), items);
			}

			if (name == "telemetryPowerStatus") {
				//$(".telemetryPowerStatus").select2().val(items).change();
				selectDefault($(".telemetryPowerStatus"), items);
			}

			if (name == "CompressorBand") {
				//$(".CompressorBand").select2().val(items).change();
				selectDefault($(".CompressorBand"), items);
			}
			if (name == "FanBand") {
				//$(".FanBand").select2().val(items).change();
				selectDefault($(".FanBand"), items);
			}

			if (name == "TempLightIssue") {
				//$(".TempLightIssue").select2().val(items).change();
				selectDefault($(".TempLightIssue"), items);
			}

			if (name == "DoorSwingsVsTarget") {
				//$(".DoorSwingsVsTarget").select2().val(items).change();
				selectDefault($(".DoorSwingsVsTarget"), items);
			}

			if (name == "DataDownloadOutlet") {
				selectDefault($(".DataDownloadOutlet"), items);
			}

			if (name == "ExcecuteCommandReport") {
				selectDefault($(".ExcecuteCommandReport"), items);
			}

			if (name == "ExcecuteCommandSpread") {
				selectDefault($(".ExcecuteCommandSpread"), items);
			}

			if (name == "CoolerPerformanceIndex") {
				//$(".CoolerPerformanceIndex").select2().val(items).change();
				selectDefault($(".CoolerPerformanceIndex"), items);
			}

			if (name == "DoorOpenVsSales") {
				//$(".DoorOpenVsSales").select2().val(items).change();
				selectDefault($(".DoorOpenVsSales"), items);
			}

			if (name == "OperationalIssues") {
				//$(".OperationalIssues").select2().val(items).change();
				selectDefault($(".OperationalIssues"), items);
			}

			if (name == "CoolerHealth") {
				//$(".CoolerHealth").select2().val(items).change();
				selectDefault($(".CoolerHealth"), items);
			}

			if (name == "DataDownloaded") {
				//$(".DataDownloaded").select2().val(items).change();
				selectDefault($(".DataDownloaded"), items);
			}

			if (name == "LastDataDownloaded") {
				//$(".LastDataDownloaded").select2().val(items).change();
				selectDefault($(".LastDataDownloaded"), items);
			}

			if (name == "installationDate") {
				$(".installationDateType").select2().val(items).change();
			}

			if (name == "lastDataReceived") {
				$(".lastDataReceivedType").select2().val(items).change();
			}

			if (name == "doorDataSelected") {
				$(".doorDataSelectedType").select2().val(items).change();
			}

			if (name == "salesDataSelected") {
				$(".salesDataSelectedType").select2().val(items).change();
			}

			if (name == "coolerTracking") {
				$(".coolerTrackingType").select2().val(items).change();
				selectDefault($(".coolerTrackingType"), items);
			}

			if (name == "coolerTrackingProximity") {
				$(".coolerTrackingTypeProximity").select2().val(items).change();
				selectDefault($(".coolerTrackingTypeProximity"), items);
			}

			if (name == "startDate") {
				startDate = moment(items);
				//$('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
			}

			if (name == "endDate") {
				endDate = moment(items);
				//$('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
			}
			if (name == "startDateCorrelation") {
				startDateCorrelation = moment(items);
			}
			if (name == "endDateCorrelation") {
				endDateCorrelation = moment(items);
			}
		}
		if (pagerelod == true) {
			if (defaultrate == 1) {
				$("input[type=checkbox][name=OutletTypeId][value = 6282]").prop("checked", true);
			} else {
				$("input[type=checkbox][name=OutletTypeId][value = 6282]").prop("checked", false);
			}

			//debugger;
			var result = JSON.parse(LZString.decompressFromUTF16(localStorage.comboData));
			result = result.data;
			var index2 = _.findIndex(result.ManufacturerSmartDevice, function (data) {
				return data.DisplayValue == "Sollatek"
			});
			if (defaultrateInsigma > 0) {
				$("input[type=checkbox][name=SmartDeviceManufacturerId][value = 3]").prop("checked", true);
				if (index2 != -1 && ClientId == 1) {
					$("input[type=checkbox][name=SmartDeviceManufacturerId][value = 133]").prop("checked", true);
				}
			} else {
				$("input[type=checkbox][name=SmartDeviceManufacturerId][value = 3]").prop("checked", false);
				if (index2 != -1 && ClientId == 1) {
					$("input[type=checkbox][name=SmartDeviceManufacturerId][value = 133]").prop("checked", false);
				}
				$(".manufacturerSmartDevice").select2().val([]).trigger('change');
			}
		}
		pagerelod = false;
		var timeFilter = _.filter(this.filterValuesChart, function (timeData) {
			return timeData.name == "quarter" || timeData.name == "month" || timeData.name == "yearWeek" || timeData.name == "dayOfWeek"
		});
		if (startDate && endDate && timeFilter.length == 0) {
			$('#reportrange span').html(startDate.format(coolerDashboard.dateFormat) + ' - ' + endDate.format(coolerDashboard.dateFormat));
			$("#reportrange").data('daterangepicker').setStartDate(startDate);
			$("#reportrange").data('daterangepicker').setEndDate(endDate);
		}

		var filtersIcon = _.filter(this.filterValuesChart, function (disData) {

			//var start = moment().subtract(29, 'days').format('YYYY-MM-DD[T00:00:00]');

			var start = moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
			var end = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

			var endDateCorrelation = moment().format('YYYY-MM-DD[T23:59:59]');
			var startDateCorrelation = moment().subtract(364, 'days').format('YYYY-MM-DD[T00:00:00]');
			// if (disData.name == 'DisplacementFilter' && disData.value == "-1") {
			// 	return true;
			// } else 
			if (disData.name == 'startDate' && disData.value == start) {
				return true;
			} else if (disData.name == 'endDate' && disData.value == end) {
				return true;
			} else if (disData.name == 'startDateCorrelation' && disData.value == startDateCorrelation) {
				return true;
			} else if (disData.name == 'endDateCorrelation' && disData.value == endDateCorrelation) {
				return true;
			} else if (disData.name == 'endDateCorrelation' && disData.value == endDateCorrelation) {
				return true;
			} else if (disData.name == 'sellerTop' && disData.value == true) {
				return true;
			} else if (disData.name == 'customerTop' && disData.value == true) {
				return true;
			} else if (disData.name == 'groupBySales' && disData.value == 'SalesRep') {
				return true;
			}
		});
		if (filtersIcon.length == this.filterValuesChart.length) {
			$('#chat-container > span > b.filterApplied').addClass('hidden');
		} else {
			$('#chat-container > span > b.filterApplied').removeClass('hidden');
		}


		var salesHierarchyFilter = _.filter(this.filterValuesChart, function (data) {
			return data.name == "SalesHierarchyId";
		});
		if (salesHierarchyFilter && salesHierarchyFilter.length > 0) {
			var ids = [];
			for (var k = 0; k < salesHierarchyFilter.length; k++) {
				ids.push(salesHierarchyFilter[k].value);
			}

		}
		setTimeout(function () {
			var salesJstree = $('#jstree');
			// $('#jstree').jstree("select_node", ids, false);
			if (salesJstree) {
				salesJstree.jstree("select_node", ids, false);
			}

		}, 1500);
	}

	if (jQuery.isEmptyObject(this.filterValuesChart)) {
		var startDateValue = moment().subtract(1, 'months').startOf('month');
		var endDateValue = moment().subtract(1, 'months').endOf('month');
		this.filterValuesChart = [];
		if (startDateValue && endDateValue) {
			this.filterValuesChart.push({
				"name": "startDate",
				"value": startDateValue.format('YYYY-MM-DD[T00:00:00]')
			})
			this.filterValuesChart.push({
				"name": "endDate",
				"value": endDateValue.format('YYYY-MM-DD[T23:59:59]')
			})
		}

		var data = $('#filterForm').serializeArray();

		var dataManufacture = _.filter(data, function (dataManufacture) {
			return dataManufacture.name == "SmartDeviceManufacturerId"
		});

		var dataManufactureLength = dataManufacture.length;

		if (dataManufactureLength > 0) {
			for (var i = 0; i < dataManufactureLength; i++) {
				filterValuesChart.push({
					"name": dataManufacture[i].name,
					"value": dataManufacture[i].value
				});
			}
		}

		var dataOutletType = _.filter(data, function (dataOutletType) {
			return dataOutletType.name == "OutletTypeId"
		});

		var dataOutletTypeLength = dataOutletType.length;

		if (dataOutletTypeLength > 0) {
			for (var i = 0; i < dataOutletTypeLength; i++) {
				filterValuesChart.push({
					"name": dataOutletType[i].name,
					"value": dataOutletType[i].value
				});
			}
		}
	}

	if (LZString.decompressFromUTF16(localStorage.lastUrl) != "#WelcomePage") {
		$('#ribbon').append('<span class="ribbon-button-alignment"><span type="button" class="btn btn-xs btn-primary well-sm" id="filterDialog">Applied Filters &nbsp;' +
			'<span id="totalFilterCount" class="badge totalFilterCount">0</span>' +
			'</span> ' +
			'<span id="btnCTF" type="button" data-toggle="modal" data-target="#ClicktoFilterModal" class="btn btn-xs btn-success well-sm hidden">Click To Filters &nbsp;' +
			'<span id = "totalCTFCount"	class = "badge totalCTFCount" > 0 < /span>' +
			'</span></span>  ' +
			'<button id="default-layout" type="button" class="btn btn-default btn-xs hidden">' +
			'<span class="glyphicon glyphicon-th-large" style="color: #3276b1;"></span> Set Default' +
			'</button> ' +
			'<button id="edit-layout" type="button" class="btn btn-default btn-xs">' +
			'<span class="glyphicon glyphicon-th-large" style="color: #3276b1;"></span> Edit Layout' +
			'</button> ' +
			'<button id="btnsave-layout" type="button" class="btn btn-default btn-xs hidden">' +
			'<span class="glyphicon glyphicon-floppy-disk" style="color: #3276b1;"></span> Save Layout' +
			'</button>' +
			'<button id="dashboardInfo" type="button" class="btn btn-default btn-xs">' +
			'<span class="fa fa-question-circle" style="color: #3276b1;font-size:15px"></span> Help' +
			'</button> '
		);

		//<span id="btnClearCTF" type="button" data-toggle="modal" class="btn btn-xs btn-danger well-sm hidden"><i class="fa fa-trash-o " aria-hidden="true"></i></span>
		$('#edit-layout').click(function () {
			var grid = $('.grid-stack').data('gridstack');
			if (grid) {
				grid.enableMove(true, false);
				grid.enableResize(true, false);
			}
			$('.grid-stack-item-content .drag').css("display", "block");
			$('#edit-layout').addClass('hidden');
			$('#btnsave-layout').removeClass('hidden');
			$('#default-layout').removeClass('hidden');
			$('.grid-stack-item-content').css("box-shadow", "rgba(6, 6, 6, 0.57) 0px 0px 4px 2px");
		});
	}


	$('#default-layout').click(function () {
		var grid = $('.grid-stack').data('gridstack');
		if (grid) {
			grid.enableMove(false, false);
			grid.enableResize(false, false);
		}
		$('.grid-stack-item-content .drag').css("display", "none");
		$('#edit-layout').removeClass('hidden');
		$('#btnsave-layout').addClass('hidden');
		$('#default-layout').addClass('hidden');
		$('.grid-stack-item-content').css("box-shadow", "none");
		$('#SaveDefaultLayoutModal').modal('show');

	});

	$('#dashboardInfo').click(function () {
		window.open('#InfoGuide');
	});

	$('#btnsave-layout').click(function () {
		var grid = $('.grid-stack').data('gridstack');
		if (grid) {
			grid.enableMove(false, false);
			grid.enableResize(false, false);
		}
		$('.grid-stack-item-content .drag').css("display", "none");
		$('#edit-layout').removeClass('hidden');
		$('#btnsave-layout').addClass('hidden');
		$('#default-layout').addClass('hidden');
		$('.grid-stack-item-content').css("box-shadow", "none");
		$('#SaveLayoutModal').modal('show');

	});

	$('#filterDialog').click(function () {

		if ($('#filterDialog').hasClass('disabled'))
			return;

		$('#openfilterDialog').removeClass('hidden');
		//$('#openfilterDialog').dialog('open');

		// var appliedFilterDialog = $('#openfilterDialog').dialog({
		// 	modal: true,
		// 	autoOpen: false,
		// 	width: 500,
		// 	height: 500,
		// 	resizable: false,
		// 	modal: true,
		// 	title: "Applied Filters"
		// });

		// if (appliedFilterDialog) {
		// 	appliedFilterDialog.dialog("open");
		// }
		$('#openfilterDialogModal').modal('show');
	});

	sendAjax();
}


function enableDisableDateFilter(lowerRange, higherRange, isQuarter) {
	var yearWeekCheckBoxs = $("input[type=checkbox][name=yearWeek]"),
		weekCheckBox, value;
	var monthlyCheckBoxs = $("input[type=checkbox][name=month]"),
		monthCheckBox;
	var quarterCheckBoxs = $("input[type=checkbox][name=quarter]"),
		quarterCheckBox, isDisabled = true;
	if (isQuarter) {

		for (var i = 0, len = monthlyCheckBoxs.length; i < len; i++) {
			monthCheckBox = $(monthlyCheckBoxs[i]);
			value = Number(monthCheckBox.val());
			if (monthCheckBox.is(":checked")) {
				monthCheckBox.prop("checked", !(value < lowerRange || value > higherRange));
			}
			//monthCheckBox.attr("disabled", (value < lowerRange || value > higherRange));
		}

	} else {


		if (lowerRange == 1 && higherRange == 12) {
			isDisabled = false;
		}
		for (var i = 0, len = quarterCheckBoxs.length; i < len; i++) {
			quarterCheckBox = $(quarterCheckBoxs[i]);
			quarterCheckBox.prop("checked", false);
			//quarterCheckBox.attr("disabled", isDisabled);
		}

	}

	//var monthlyCheckBoxs = $("input[type=checkbox][name=month]"),monthCheckBox;
	var flag = false;
	for (var i = 0, len = monthlyCheckBoxs.length; i < len; i++) {
		if ($(monthlyCheckBoxs[i]).is(':checked')) {
			flag = true;
			break;
		}
	}
	if (flag) {
		for (var i = 0, len = quarterCheckBoxs.length; i < len; i++) {
			$(quarterCheckBoxs[i]).prop("disabled", true);
		}
	} else {
		var currentQuarterValue = moment().quarter();
		$.each($("input[type=checkbox][name=quarter]"), function () {
			if ($(this).val() > currentQuarterValue)
				$(this).prop("disabled", true);
			else
				$(this).prop("disabled", false);
		});
	}


	var flag = false;

	for (var i = 0, len = quarterCheckBoxs.length; i < len; i++) {
		if ($(quarterCheckBoxs[i]).is(':checked')) {
			flag = true;
			break;
		}
	}
	if (flag) {
		for (var i = 0, len = monthlyCheckBoxs.length; i < len; i++) {
			$(monthlyCheckBoxs[i]).prop("disabled", true);
		}
	} else {
		var currentMonthValue = moment().month() + 1;
		$.each($("input[type=checkbox][name=month]"), function () {
			if ($(this).val() > currentMonthValue)
				$(this).prop("disabled", true);
			else
				$(this).prop("disabled", false);
		});
	}

	var startWeek = moment().month(lowerRange - 1).startOf('month').week();
	var endWeek = moment().month(higherRange - 1).endOf('month').week();

	for (var i = 0, len = yearWeekCheckBoxs.length; i < len; i++) {
		weekCheckBox = $(yearWeekCheckBoxs[i]);
		value = Number(weekCheckBox.val());
		if (weekCheckBox.is(":checked")) {
			weekCheckBox.prop("checked", !(value < lowerRange || value > higherRange));
		}
	}
	var startWeekNew = moment().month(lowerRange - 1).isoWeek() - 4;
	var endWeekNew = moment().month(higherRange - 1).isoWeek();

	for (var i = 0, len = yearWeekCheckBoxs.length; i < len; i++) {
		weekCheckBox = $(yearWeekCheckBoxs[i]);
		value = Number(weekCheckBox.val());
		if (value >= startWeekNew && value <= endWeekNew)
			weekCheckBox.prop("disabled", false);
		else
			weekCheckBox.prop("disabled", true);
	}

}

function addCheckbox(data, combo, name) {
	if (data) {
		var length = data.length,
			value;
		for (var i = 0; i < length; i++) {
			value = data[i].LookupId;
			if (name == "City" || name == "AssetTypeFacings") {
				value = data[i].DisplayValue;
			}
			var isDefault = false;
			var alreadyDataCount = $("input[name=" + name + "][value=" + value + "][type='checkbox']").length;
			if (data[i].IsDefault) {
				isDefault = true;
				if (alreadyDataCount > 0) {
					//$("input[value="+value+"]")[0].prop('checked', isDefault);
				} else
					combo.append('<div class="item ' + name + 'Combo"><label ><input name="' + name + '" value="' + value + '" type="checkbox" class="checkbox style-0" checked ="' + isDefault + '"><span>' + data[i].DisplayValue + '</span></label><br /></div>');
			} else {
				if (alreadyDataCount > 0) {} else
					combo.append('<div class="item ' + name + 'Combo"><label ><input name="' + name + '" value="' + value + '" type="checkbox" class="checkbox style-0"><span>' + data[i].DisplayValue + '</span></label><br /></div>');
			}
		}
	}
}

function addCheckboxPrefrence(data, combo, name) {
	if (data) {

		combo.empty();

		var length = data.length,
			value;
		for (var i = 0; i < length; i++) {
			value = data[i].LookupId;
			if (name == "City" || name == "AssetTypeFacings") {
				value = data[i].DisplayValue;
			}

			var isDefault = false;
			if (data[i].IsDefault) {
				isDefault = true;
				combo.append('<div class="item ' + name + 'Combo"><label ><input name="' + name + '" value="' + value + '" type="checkbox" class="checkbox style-0" checked ="' + isDefault + '"><span>' + data[i].DisplayValue + '</span></label><br /></div>');
			} else {
				combo.append('<div class="item ' + name + 'Combo"><label ><input name="' + name + '" value="' + value + '" type="checkbox" class="checkbox style-0"><span>' + data[i].DisplayValue + '</span></label><br /></div>');
			}
		}
	}
}

function setup_widgets_extended() {
	$('#widget-grid').jarvisWidgets({

		grid: 'article',
		widgets: '.jarviswidget',
		localStorage: LZString.compressToUTF16(localStorageJarvisWidgets),
		deleteSettingsKey: '#deletesettingskey-options',
		settingsKeyLabel: 'Reset settings?',
		deletePositionKey: '#deletepositionkey-options',
		positionKeyLabel: 'Reset position?',
		sortable: sortableJarvisWidgets,
		buttonsHidden: false,
		// toggle button
		toggleButton: true,
		toggleClass: 'fa fa-minus | fa fa-plus',
		toggleSpeed: 200,
		onToggle: function () {},
		buttonOrder: '%refresh% %custom% %edit% %toggle% %fullscreen% %delete%',
		opacity: 1.0,
		dragHandle: '> header',
		placeholderClass: 'jarviswidget-placeholder',
		indicator: true,
		indicatorTime: 600,
		ajax: true,
		timestampPlaceholder: '.jarviswidget-timestamp',
		timestampFormat: 'Last update: %m%/%d%/%y% %h%:%i%:%s%',
		refreshButton: true,
		refreshButtonClass: 'fa fa-refresh',
		labelError: 'Sorry but there was a error:',
		labelUpdated: 'Last Update:',
		labelRefresh: 'Refresh',
		labelDelete: 'Delete widget:',
		afterLoad: function () {},
		rtl: false, // best not to toggle this!
		onChange: function () {

		},
		onSave: function () {

		},
		ajaxnav: $.navAsAjax // declears how the localstorage should be saved (HTML or AJAX Version)

	});

}

function enableDisableMonth() {
	var vrQuarter = false;
	var quarterCheckBoxs = $("input[type=checkbox][name=quarter]"),
		quarterCheckBox;
	for (var i = 0, len = quarterCheckBoxs.length; i < len; i++) {
		quarterCheckBox = $(quarterCheckBoxs[i]);
		if (quarterCheckBox.is(":checked")) {
			vrQuarter = true;
		}
	}

	if (!vrQuarter) {
		var vrDate = new Date();
		var vrMonth = vrDate.getMonth() + 1;

		var monthlyCheckBoxs = $("input[type=checkbox][name=month]"),
			monthCheckBox;
		for (var i = vrMonth, len = monthlyCheckBoxs.length; i < len; i++) {
			monthCheckBox = $(monthlyCheckBoxs[i]);
			value = Number(monthCheckBox.val());
			monthCheckBox.attr("disabled", "true");
		}
	}
}

$(function () {

	var chat_list_btn = $('#chat-container > .chat-list-open-close');
	chat_list_btn.click(function () {
		$(this).parent('#chat-container').toggleClass('open');
	});



	setup_widgets_extended();

	pageSetUp();

	if (!jQuery.isEmptyObject(filterValuesChart)) {
		var startDateCorrelationArr = _.filter(filterValuesChart, function (data) {
			return data.name == 'startDateCorrelation'
		});
		var index = jQuery.inArray(startDateCorrelationArr[0], filterValuesChart);
		if (index != -1) {
			filterValuesChart.splice(index, 1)
		}
		var endDateCorrelatioArr = _.filter(filterValuesChart, function (data) {
			return data.name == 'endDateCorrelation'
		});
		index = jQuery.inArray(endDateCorrelatioArr[0], filterValuesChart);
		if (index != -1) {
			filterValuesChart.splice(index, 1)
		}
	}
	// var start = moment().subtract(29, 'days');
	// var end = moment();

	var start = moment().subtract(1, 'months').startOf('month');
	var end = moment().subtract(1, 'months').endOf('month');

	var startCorrelation = moment().subtract(364, 'days');

	function cb(start, end, isFirst, isSalesCorrelation) {
		$('#reportrange span').html(start.format(coolerDashboard.dateFormat) + ' - ' + end.format(coolerDashboard.dateFormat));
		startDate = start;
		endDate = end;
		if (!isSalesCorrelation) {
			startDateCorrelation = start;
			endDateCorrelation = end;
		}
		$('input[name=month]').attr('checked', false);
		$('input[name=quarter]').attr('checked', false);
		$('input[name=yearWeek]').attr('checked', false);
		$('input[name=month]').attr('disabled', false);
		$('input[name=quarter]').attr('disabled', false);
		$('input[name=yearWeek]').attr('disabled', false);
		enableDisableDateFilter(1, 12, true);

		if (isFirst) {
			coolerDashboard.isFilterChanged = true;
			//$("#filterForm").submit();
		}
	}

	var year = moment().format('YYYY');
	var week = moment().isoWeek();
	for (var i = 1; i < week + 1; i++) {
		$('.yearWeek').append('<label><input name="yearWeek" value="' + i + '" type="checkbox" class="checkbox style-0"><span>' + year + '-' + i + '</span></label><br />');
	}

	$('#reportrange').daterangepicker({
		startDate: start,
		endDate: end,
		changeYear: true,
		"autoApply": false,
		"maxDate": moment(),
		"showDropdowns": true,
		"showISOWeekNumbers": true,
		locale: {
			applyLabel: 'Select',
			cancelLabel: 'Cancel',
		},
		ranges: {
			'Today': [moment(), moment()],
			'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
			'Last 7 Days': [moment().subtract(6, 'days'), moment()],
			'Last 30 Days': [moment().subtract(29, 'days'), moment()],
			'This Month': [moment().startOf('month'), moment().endOf('month')],
			'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
		}
	}, cb);
	cb(start, end, false);

	endDateCorrelation = moment();
	startDateCorrelation = moment().subtract(364, 'days');

	setFilter();
	//updateSelectedFilter();
	$('#filterForm').submit(function (e) {
		coolerDashboard.common.updateCTFFilterList($('#filterForm').serializeArray(), '#ctf-list', '.totalCTFCount');

		e.preventDefault();
		$('#chat-container > span > b.filterApplied').removeClass('hidden');
		$('#filterForm').find('input, textarea').each(function (_, inp) {
			if ($(inp).val() === '' || $(inp).val() === null)
				inp.disabled = true;
		});
		var data = $(this).serializeArray();
		$('#filterForm').find('input, textarea').each(function (_, inp) {
			if ($(inp).val() === '' || $(inp).val() === null)
				inp.disabled = false;
		});
		if (startDate && endDate) {
			data.push({
				"name": "startDate",
				"value": startDate.format('YYYY-MM-DD[T00:00:00]')
			})
			data.push({
				"name": "endDate",
				"value": endDate.format('YYYY-MM-DD[T23:59:59]')
			})
		}

		var ids = $('#jstree').jstree("get_selected");
		if (ids.length > 0 && ids[0].accessKey != "") {
			for (var i = 0; i < ids.length; i++) {
				data.push({
					"name": "SalesHierarchyId",
					"value": ids[i]
				});
			}
		}
		var result = JSON.parse(LZString.decompressFromUTF16(localStorage.comboData));
		result = result.data;
		var index2 = _.findIndex(result.ManufacturerSmartDevice, function (data) {
			return data.DisplayValue == "Sollatek"
		});

		if (pagechange == true && resetchange == true) {
			data.push({
				name: "OutletTypeId",
				value: "6282"
			});
			data.push({
				name: "SmartDeviceManufacturerId",
				value: "3"

			});
			if (index2 != -1 && ClientId == 1) {
				data.push({
					name: "SmartDeviceManufacturerId",
					value: "133"

				});
			}
		}
		resetchange = false; //turns false the reset filter variable
		if (JSON.stringify(data) === JSON.stringify(filterValuesChart)) {
			return;
		}
		if (startDateCorrelation && endDateCorrelation) {
			data.push({
				"name": "startDateCorrelation",
				"value": startDateCorrelation.format('YYYY-MM-DD[T00:00:00]')
			})
			data.push({
				"name": "endDateCorrelation",
				"value": endDateCorrelation.format('YYYY-MM-DD[T23:59:59]')
			})
		}
		if (JSON.stringify(data) === JSON.stringify(filterValuesChart)) {
			return;
		}

		var timeFilter = _.filter(data, function (timeData) {
			return timeData.name == "quarter" || timeData.name == "month" || timeData.name == "yearWeek" || timeData.name == "dayOfWeek"
		});
		var startDateCorrelationArr = _.filter(data, function (timeData) {
			return timeData.name == 'startDateCorrelation'
		});
		var endDateCorrelatioArr = _.filter(data, function (timeData) {
			return timeData.name == 'endDateCorrelation'
		});
		var index;
		if (timeFilter.length == 0) {
			if ($('#reportrange span').html().length == 0) {
				$('#reportrange span').html(start.format(coolerDashboard.dateFormat) + ' - ' + end.format(coolerDashboard.dateFormat));
				startDate = start;
				endDate = end;
				startDateCorrelation = startCorrelation;
				endDateCorrelation = end;

				$("#reportrange").data('daterangepicker').setStartDate(startDate);
				$("#reportrange").data('daterangepicker').setEndDate(endDate);
				var startDateArr = _.filter(data, function (timeData) {
					return timeData.name == 'startDate'
				});
				var endDateArr = _.filter(data, function (timeData) {
					return timeData.name == 'endDate'
				});
				index = jQuery.inArray(startDateArr[0], data);
				if (index != -1) {
					data[index].value = start.format('YYYY-MM-DD[T00:00:00]')
				} else {
					data.push({
						"name": "startDate",
						"value": start.format('YYYY-MM-DD[T00:00:00]')
					})
				}
				index = jQuery.inArray(endDateArr[0], data);
				if (index != -1) {
					data[index].value = end.format('YYYY-MM-DD[T23:59:59]')
				} else {
					data.push({
						"name": "endDate",
						"value": end.format('YYYY-MM-DD[T23:59:59]')
					})
				}

				index = jQuery.inArray(startDateCorrelationArr[0], data);
				if (index != -1) {
					data[index].value = startDateCorrelation.format('YYYY-MM-DD[T23:59:59]')
				} else {
					data.push({
						"name": "endDate",
						"value": startDateCorrelation.format('YYYY-MM-DD[T23:59:59]')
					})
				}
			}

			index = jQuery.inArray(endDateCorrelatioArr[0], data);
			if (index != -1) {
				data[index].value = endDateCorrelation.format('YYYY-MM-DD[T23:59:59]')
			} else {
				data.push({
					"name": "endDate",
					"value": endDateCorrelation.format('YYYY-MM-DD[T23:59:59]')
				})
			}
		}

		var connectivity = _.filter(data, function (timeData) {
			return timeData.name == 'ConnectivityTypeId'
		});
		var connectivityLength = connectivity.length;
		if (connectivityLength > 0) {
			data.Reference = [];
			for (var i = 0; i < connectivityLength; i++) {
				if (connectivity[i].value == 2) {
					data.push({
						"name": "Reference",
						"value": ['sh']
					});
					data.push({
						"name": "Reference",
						"value": ['sc']
					});
				} else {
					data.push({
						"name": "Reference",
						"value": ['st']
					});
					data.push({
						"name": "Reference",
						"value": ['sv']
					});
					data.push({
						"name": "Reference",
						"value": ['sb']
					});
				}
			}
		}
		var locationCode = _.filter(data, function (timeData) {
			return timeData.name == 'LocationCode'
		});
		var locationCodeLength = locationCode.length;
		if (locationCodeLength > 0) {
			data.push({
				"name": "LocationCode_operator",
				"value": 'LIKE'
			});
		}
		// if (isDisplacement) {
		// 	var displacement = _.filter(data, function (disData) {
		// 		return disData.name == 'DisplacementFilter'
		// 	});
		// 	var displacementLength = displacement.length;

		// 	if (displacementLength > 0) {
		// 		if (displacement[0].value == 1) {
		// 			data.push({
		// 				"name": "Displacement_From_operator",
		// 				"value": '>='
		// 			});
		// 			data.push({
		// 				"name": "Displacement_To_operator",
		// 				"value": '<='
		// 			});
		// 			data.push({
		// 				"name": "Displacement_From",
		// 				"value": '0.5'
		// 			});
		// 			data.push({
		// 				"name": "Displacement_To",
		// 				"value": '1'
		// 			});
		// 		}
		// 		if (displacement[0].value == 0) {
		// 			data.push({
		// 				"name": "Displacement_To_operator",
		// 				"value": '<'
		// 			});
		// 			data.push({
		// 				"name": "Displacement_To",
		// 				"value": '0.5'
		// 			});
		// 		}

		// 		if (displacement[0].value == 2) {
		// 			data.push({
		// 				"name": "Displacement_From_operator",
		// 				"value": '>'
		// 			});
		// 			data.push({
		// 				"name": "Displacement_From",
		// 				"value": '1'
		// 			});
		// 		}
		// 	}
		// } else {
		// 	var displacement = _.filter(data, function (disData) {
		// 		return disData.name == 'DisplacementFilter';
		// 	});

		// 	// var index = jQuery.inArray(displacement[0], data);
		// 	// data.splice(index, 1);
		// }

		filterValuesChart = data;

		var filtersIcon = _.filter(data, function (disData) {
			// var start = moment().subtract(29, 'days').format('YYYY-MM-DD[T00:00:00]');
			// var end = moment().format('YYYY-MM-DD[T23:59:59]');
			var start = moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
			var end = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

			var endDateCorrelation = moment().format('YYYY-MM-DD[T23:59:59]');
			var startDateCorrelation = moment().subtract(364, 'days').format('YYYY-MM-DD[T00:00:00]');
			// if (disData.name == 'DisplacementFilter' && disData.value == "-1") {
			// 	return true;
			// } else 
			if (disData.name == 'startDate' && disData.value == start) {
				return true;
			} else if (disData.name == 'endDate' && disData.value == end) {
				return true;
			} else if (disData.name == 'startDateCorrelation' && disData.value == startDateCorrelation) {
				return true;
			} else if (disData.name == 'endDateCorrelation' && disData.value == endDateCorrelation) {
				return true;
			} else if (disData.name == 'endDateCorrelation' && disData.value == endDateCorrelation) {
				return true;
			} else if (disData.name == 'sellerTop' && disData.value == true) {
				return true;
			} else if (disData.name == 'customerTop' && disData.value == true) {
				return true;
			} else if (disData.name == 'groupBySales' && disData.value == 'SalesRep') {
				return true;
			}
		});
		if (filtersIcon.length == filterValuesChart.length) {
			$('#chat-container > span > b.filterApplied').addClass('hidden');
		} else {
			$('#chat-container > span > b.filterApplied').removeClass('hidden');
		}

		//Asset type checkbox/dropdown send id in array(Ticket12345)
		var filterValuesChartAssetTypeId = filterValuesChart.filter(function (data) {
			return data.name == "AssetTypeId"
		});
		if (filterValuesChartAssetTypeId.length == 1) {
			filterValuesChart.push(filterValuesChartAssetTypeId[0]);
		}

		sendAjax();
		//updateSelectedFilter();
		setTimeout(function () {
			coolerDashboard.common.updateAppliedFilterText(this.filterValuesChart, '.appliedFilter', '.totalFilterCount');
		}, 200);

	});

	$("#submitFilter").on('click', function () {
		$("#filterForm").submit();
		$('#ClicktoFilterModal').modal('hide');
	});

	$("#submitAppliedFilter").on('click', function (event) {
		$('#openfilterDialogModal').modal('hide');
		//setTimeout(() => {

		for (var i = 0, len = deletedFilterIds.length; i < len; i++) {
			coolerDashboard.common.updateFilterForm(deletedFilterIds[i]);
		}

		// deletedFilterIds.forEach(element => {
		// 	coolerDashboard.common.updateFilterForm(element);			
		// });

		coolerDashboard.common.updateAppliedFilterText(filterValuesChart, '.appliedFilter', '.totalFilterCount');
		deletedFilterIds = [];
		$("#filterForm").submit();
		//}, 0);

	});

	$("#cancelAppliedFilter").on('click', function () {
		deletedFilterIds = [];
		$('#openfilterDialogModal').modal('hide');
		coolerDashboard.common.updateAppliedFilterText(filterValuesChart, '.appliedFilter', '.totalFilterCount');
	});





	var html = '<div style="background: #474544;height: 38px;">' +
		'<h4  style="padding: 7px;    font-size: 17px;    font-weight: 500 !important;">' +
		'<span style="color: white;    padding: 9px;">' +
		'<i class="fa fa-filter"></i> Filters</span>' +
		'<div class="filter-class">' +
		'<a href="javascript:void(0);" class="btn btn-success btn-xs" id="applyFilter" title="Click here to Search" > <i class="fa fa-check" aria-hidden="true"></i> Apply </a>' + ' ' +
		'<a href="javascript:void(0);" class="btn btn-danger btn-xs" id="filterFormReset" title="Click to reset with default filter"><i class="fa fa-close" aria-hidden="true"></i> Reset All</a>' +
		'</div></h4></div>';
	$('#filterTitle').append(html);

	$('#applyFilter').click(function (e) {
		$("#filterForm").submit();
	});


	$("#filterFormReset").click(function () {
		resetchange = true;
		coolerDashboard.isNavigationChanged = false;
		//$('#chat-container > span > b.filterApplied').addClass('hidden');
		var myForm = $("#filterForm").get(0);
		myForm.reset();
		$("select", myForm).each(
			function () {
				$(this).select2();
			}
		);
		start = moment().subtract(1, 'months').startOf('month');
		end = moment().subtract(1, 'months').endOf('month');
		var checkBox = $("input[type=checkbox]"),
			disabledCheckBox;
		for (var i = 0, len = checkBox.length; i < len; i++) {
			disabledCheckBox = $(checkBox[i]);
			disabledCheckBox.attr("disabled", false);
		}

		// $("input[type=checkbox][value=6282]").prop("checked", true); //add check box of market
		// $("input[type=checkbox][value=3]").prop("checked", true); //add check box of sme

		$.each($("input[type=checkbox][name=OutletTypeId]"), function () {
			if ($(this).val() == 6282)
				$(this).prop("checked", true);
		});
		var result = JSON.parse(LZString.decompressFromUTF16(localStorage.comboData));
		result = result.data;
		var index2 = _.findIndex(result.ManufacturerSmartDevice, function (data) {
			return data.DisplayValue == "Sollatek"
		});
		$.each($("input[type=checkbox][name=SmartDeviceManufacturerId]"), function () {
			if ($(this).val() == 3)
				$(this).prop("checked", true);
			if (index2 != -1) {
				if ($(this).val() == 133 && ClientId == 1)
					$(this).prop("checked", true);
			}
		});

		startDateCorrelation = moment().subtract(364, 'days');
		$("#reportrange").data('daterangepicker').setStartDate(start);
		$("#reportrange").data('daterangepicker').setEndDate(end);
		var isSalesCorrelation = true;
		cb(start, end, false, isSalesCorrelation);
		coolerDashboard.isFilterChanged = false;
		$('#jstree').jstree("deselect_all");
		enableDisableDateFilter(1, 12, true);

		$("#filterForm").submit();


	});

	$("#btnLocationCode").on('click', function () {
		//$("#filterForm").submit();
	})
	$(".applyBtn ").click(function () {
		//cb()
	});

	$("input[type='text']").keyup(function (me) {
		var name = me.target.getAttribute('comboValue');
		if (name) {
			var re = new RegExp($(this).val(), "i");

			$('.' + name + 'Combo').each(function () {
				var text = $(this).text(),
					matches = !!text.match(re);
				$(this).toggle(matches)
			})
		}
	})

	if (!(window.location.hash == "#KPI" || location.hash.split('#')[1] == "location" || window.location.hash == "#Survey" || window.location.hash == "#IOTChart")) {
		$("#salesChartFilter").removeClass('hidden');
	}

	if (window.location.hash == "#Alarm" || window.location.hash == "#Technical" || window.location.hash == "#IOTChart") {
		$("#alarmFilter").removeClass('hidden');
	}

	if (window.location.hash == "#Technical") {
		$("#technicalFilter").removeClass('hidden');
	}
	//enableDisableMonth();

	var currentQuarterValue = moment().quarter();
	$.each($("input[type=checkbox][name=quarter]"), function () {
		if ($(this).val() > currentQuarterValue)
			$(this).prop("disabled", true);
		else
			$(this).prop("disabled", false);
	});

	var currentMonthValue = moment().month() + 1;
	$.each($("input[type=checkbox][name=month]"), function () {
		if ($(this).val() > currentMonthValue)
			$(this).prop("disabled", true);
		else
			$(this).prop("disabled", false);
	});
});