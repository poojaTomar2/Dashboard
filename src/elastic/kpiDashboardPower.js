"use strict"
var linq = require('node-linq').LINQ,
	fs = require('fs');

var client = require('../models').elasticClient;
var outletReducer = require('../controllers/reducers/outlet');
var smartDeviceInstallationDateReducer = require('../controllers/reducers/smartDeviceInstallationDate');
var smartDeviceLatestDataReducer = require('../controllers/reducers/smartDeviceLatestData');
var salesRepReducer = require('../controllers/reducers/salesRep');
var alertReducer = require('../controllers/reducers/alert');
var assetReducer = require('../controllers/reducers/asset');
var smartDeviceReducer = require('../controllers/reducers/smartDevice');
var smartDeviceMovementReducer = require('../controllers/reducers/smartDeviceMovement');
var smartDevicDoorStatusReducer = require('../controllers/reducers/smartDevicDoorStatus');
var smartDevicHealthReducer = require('../controllers/reducers/smartDeviceHealthRecord');
var smartDevicePowerReducer = require('../controllers/reducers/smartDevicePowerRecord');
var consts = require('../controllers/consts');
var moment = require('moment');
var util = require('../util');
var Boom = require('boom');
var defaultHours = 720;
module.exports = {
	getElasticData: function (config) {
		return new Promise(function (resolve, reject) {
			client.search(config.search).then(function (resp) {
				resolve({
					response: resp,
					config: config
				});
			}, function (err) {
				console.log(err);
				reject(err);
			});
		});
	},

	getMedian: function (values) {

		values.sort(function (a, b) {
			return a - b;
		});

		var half = Math.floor(values.length / 2);

		if (values.length % 2)
			return values[half];
		else
			return (values[half - 1] + values[half]) / 2.0;
	},
	dashboardQueries: {
		powerSummary: JSON.stringify(require('./dashboardQueries/kpiPowerSummary.json')),
		assetSummary: JSON.stringify(require('./dashboardQueries/coolerTelemetry/kpiAssetSummaryPower.json')),
		healthSummary: JSON.stringify(require('./dashboardQueries/kpihealthAssetUnique.json'))
	},

	getKPIWidgetData: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload),
			powerSummary = JSON.parse(this.dashboardQueries.powerSummary),
			healthSummary = JSON.parse(this.dashboardQueries.healthSummary),
			assetSummary = JSON.parse(this.dashboardQueries.assetSummary);
		// client Filter
		var clientQuery = {
			"term": {
				"ClientId": clientId
			}
		};
		if (clientId != 0) {
			powerSummary.query.bool.filter.push(clientQuery);
			assetSummary.query.bool.filter.push(clientQuery);
			healthSummary.query.bool.filter.push(clientQuery);
		}

		//Date Filter
		var isDefaultDateFilter = params.yearWeek || params.dayOfWeek || params.quarter || params.month;
		var dateFilter = [];
		var totalHours = 0

		if (!isDefaultDateFilter && !params.startDate && !params.endDate) {
			var dateRangeQuery = {
				"range": {
					"EventDate": {
						"gte": "now-30d/d"
					}
				}
			};

			powerSummary.query.bool.filter.push(dateRangeQuery);
			healthSummary.query.bool.filter.push(dateRangeQuery);
			totalHours = defaultHours;
		} else if (!isDefaultDateFilter && params.startDate && params.endDate) {
			var startDate = moment(params.startDate).format('YYYY-MM-DD[T00:00:00]');
			var endDate = moment(params.endDate).format('YYYY-MM-DD[T23:59:59]');
			var dateRangeQuery = {
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};

			powerSummary.query.bool.filter.push(dateRangeQuery);
			healthSummary.query.bool.filter.push(dateRangeQuery);
			totalHours = moment(endDate).diff(moment(startDate), 'hours') + 1
		}
		if (params.quarter && !params.month) {
			dateFilter.push.apply(dateFilter, util.getDateFromMonth(Array.isArray(params.quarter) ? params.quarter : [params.quarter], true, params.dayOfWeek, params.yearWeek ? Array.isArray(params.yearWeek) ? params.yearWeek : [params.yearWeek] : params.yearWeek, false));
		} else if (params.month) {
			dateFilter.push.apply(dateFilter, util.getDateFromMonth(Array.isArray(params.month) ? params.month : [params.month], false, params.dayOfWeek, params.yearWeek ? Array.isArray(params.yearWeek) ? params.yearWeek : [params.yearWeek] : params.yearWeek, false));
		} else if (params.yearWeek) {
			if (Array.isArray(params.yearWeek)) {
				for (var i = 0, len = params.yearWeek.length; i < len; i++) {
					dateFilter.push.apply(dateFilter, util.getDateFromWeekDay(params.yearWeek[i], params.dayOfWeek));
				}
			} else {
				dateFilter.push.apply(dateFilter, util.getDateFromWeekDay(params.yearWeek, params.dayOfWeek));
			}
		} else if (params.dayOfWeek) {
			var startWeek = moment.utc(params.startDate).week();
			var endWeek = moment.utc(params.endDate).week();

			var startYear = moment.utc(params.startDate).year();
			var endYear = moment.utc(params.endDate).year();
			var currentYear = moment.utc().year();
			if (currentYear > startYear) {
				var weekinYear = moment.utc(params.startDate).weeksInYear();
				startWeek = startWeek - weekinYear * (currentYear - startYear);
				endWeek = endWeek - weekinYear * (currentYear - endYear);
			}
			for (var i = startWeek; i <= endWeek; i++) {
				dateFilter.push.apply(dateFilter, util.getDateFromWeekDay(i, params.dayOfWeek, moment(params.startDate)));
			}
		}


		for (var i = 0, len = dateFilter.length; i < len; i++) {
			var filterDate = dateFilter[i];
			var startDate = filterDate.startDate,
				endDate = filterDate.endDate;
			totalHours += filterDate.totalHours;
			var dateRangeQuery = {
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			powerSummary = util.pushDateQuery(powerSummary, dateRangeQuery);
			healthSummary = util.pushDateQuery(healthSummary, dateRangeQuery);

		}
		this.dateFilter = dateFilter;

		var _this = this;

		var tags = credentials.tags,
			limitLocation = Number(tags.LimitLocation);
		var limitCountry = Number(tags.LimitCountry),
			countryid = Number(tags.CountryId),
			responsibleCountryIds = tags.ResponsibleCountryIds;
		var countryids = [];
		countryids.push(countryid);
		if (responsibleCountryIds != "") {
			responsibleCountryIds = responsibleCountryIds.split(',');
			for (var i = 0; i < responsibleCountryIds.length; i++) {
				countryids.push(responsibleCountryIds[i]);
			}
		}
		if (limitCountry == 1) {
			var countryIdsUser;
			if (responsibleCountryIds != "") {
				countryIdsUser = {
					terms: {
						CountryId: countryids
					}
				};
			} else {
				countryIdsUser = {
					term: {
						CountryId: countryid
					}
				};
			}
			powerSummary.query.bool.filter.push(countryIdsUser);
			assetSummary.query.bool.filter.push(countryIdsUser);
			healthSummary.query.bool.filter.push(countryIdsUser);
		}
		if (limitLocation != 0) {
			var filterQuery = {
				"terms": {
					"LocationId": {
						"index": "filteredlocations",
						"type": "locationIds",
						"id": credentials.user.UserId,
						"path": "LocationId"
					}
				}
			}

			powerSummary.query.bool.filter.push(filterQuery);
			assetSummary.query.bool.filter.push(filterQuery);
			healthSummary.query.bool.filter.push(filterQuery);
		}
		var id = request.auth.credentials.sid;
		if ((params.telemetryDoorCount || params["telemetryDoorCount[]"]) ||
			(params.telemetryPowerStatus || params["telemetryPowerStatus[]"]) ||
			(params.CompressorBand || params["CompressorBand[]"]) ||
			(params.FanBand || params["FanBand[]"]) ||
			(params.OperationalIssues || params["OperationalIssues[]"]) ||
			(params.DataDownloaded || params["DataDownloaded[]"]) ||
			(params.LastDataDownloaded || params["LastDataDownloaded[]"]) ||
			(params.coolerTracking || params["coolerTracking[]"]) ||
			(params.telemetryLightStatus || params["telemetryLightStatus[]"]) ||
			(params.TempLightIssue || params["TempLightIssue[]"]) ||
			(params.EvaporatorTemperatureTele || params["EvaporatorTemperatureTele[]"]) ||
			(params.MagnetFallenChartCTF || params["MagnetFallenChartCTF[]"]) ||
			(params.MagnetFallenSpreadCTF || params["MagnetFallenSpreadCTF[]"]) ||
			(params.TemperatureTele || params["TemperatureTele[]"]) ||
			(params.batteryReprtData || params["batteryReprtData[]"]) ||
			(params.ExcecuteCommandSpread || params["ExcecuteCommandSpread[]"]) ||
			(params.ExcecuteCommandReport || params["ExcecuteCommandReport[]"]) || (params.UserId || params["UserId[]"]) ||
			(params.TeleSellingTerritoryId || params["TeleSellingTerritoryId[]"]) ||
			(params.AssetTypeCapacityId || params["AssetTypeCapacityId[]"])) {
			var AssetIds = {
				"terms": {
					"AssetId": {
						"index": "cooler-iot-ctfassets",
						"type": "assets",
						"id": id,
						"path": "AssetId"
					}
				}
			};

			powerSummary.query.bool.filter.push(AssetIds);
			assetSummary.query.bool.filter.push(AssetIds);
			healthSummary.query.bool.filter.push(AssetIds);
		}

		if ((params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) ||
			(params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) ||
			(params.DataDownloadOutlet || params["DataDownloadOutlet[]"]) || (params.UserId || params["UserId[]"]) ||
			(params.TeleSellingTerritoryId || params["TeleSellingTerritoryId[]"]) ||
			(params.AssetTypeCapacityId || params["AssetTypeCapacityId[]"])) {
			var LocationIds = {
				"terms": {
					"LocationId": {
						"index": "cooler-iot-ctflocations",
						"type": "locations",
						"id": id,
						"path": "LocationId"
					}
				}
			};

			powerSummary.query.bool.filter.push(LocationIds);
			assetSummary.query.bool.filter.push(LocationIds);
			healthSummary.query.bool.filter.push(LocationIds);
		}

		if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
			var smartDeviceTypeQuery = {
				"terms": {
					"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
				}
			}
			powerSummary.query.bool.filter.push(smartDeviceTypeQuery);
			assetSummary.query.bool.filter.push(smartDeviceTypeQuery);
			healthSummary.query.bool.filter.push(smartDeviceTypeQuery);
		}

		if (request.query.IsKeyLocation || request.query["IsKeyLocation[]"]) {
			var key;
			if (request.query.IsKeyLocation == 1) {
				key = true;
			} else {
				key = false;
			}
			var IsKeyLocationFilter = {
				"term": {
					"IsKeyLocation": key
				}
			}
			powerSummary.query.bool.filter.push(IsKeyLocationFilter);
			assetSummary.query.bool.filter.push(IsKeyLocationFilter);
			healthSummary.query.bool.filter.push(IsKeyLocationFilter);
		}

		if (request.query.IsFactoryAsset || request.query["IsFactoryAsset[]"]) {
			var key;
			if (request.query.IsFactoryAsset == 1) {
				key = true;
			} else {
				key = false;
			}
			var IsFactoryAssetFilter = {
				"term": {
					"IsFactoryAsset": key
				}
			}
			powerSummary.query.bool.filter.push(IsFactoryAssetFilter);
			assetSummary.query.bool.filter.push(IsFactoryAssetFilter);
			healthSummary.query.bool.filter.push(IsFactoryAssetFilter);
		}

		if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
			var assetManufactureQuery = {
				"terms": {
					"AssetManufactureId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
				}
			}
			powerSummary.query.bool.filter.push(assetManufactureQuery);
			assetSummary.query.bool.filter.push(assetManufactureQuery);
			healthSummary.query.bool.filter.push(assetManufactureQuery);
		}
		//======filter sales hierarchy================================//
		if (request.query.SalesHierarchyId || request.query["SalesHierarchyId[]"]) {
			if (request.query.SalesHierarchyId.constructor !== Array) {
				var toArray = request.query.SalesHierarchyId;
				request.query.SalesHierarchyId = [];
				request.query.SalesHierarchyId.push(toArray);
			}
			var SalesHierarchyId = {
				"terms": {
					"SalesHierarchyId": request.query.SalesHierarchyId || request.query["SalesHierarchyId[]"]
				}
			}
			powerSummary.query.bool.filter.push(SalesHierarchyId);
			assetSummary.query.bool.filter.push(SalesHierarchyId);
			healthSummary.query.bool.filter.push(SalesHierarchyId);
		}

		if (request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]) {
			if (request.query.SmartDeviceManufacturerId.constructor !== Array) {
				var toArray = request.query.SmartDeviceManufacturerId;
				request.query.SmartDeviceManufacturerId = [];
				request.query.SmartDeviceManufacturerId.push(toArray);
			}
			var manufacturerSmartDeviceQuery = {
				"terms": {
					"SmartDeviceManufactureId": request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]
				}
			}
			powerSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
			assetSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
			healthSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
		}

		if (request.query.OutletTypeId || request.query["OutletTypeId[]"]) {
			if (request.query.OutletTypeId.constructor !== Array) {
				var toArray = request.query.OutletTypeId;
				request.query.OutletTypeId = [];
				request.query.OutletTypeId.push(toArray);
			}
			var manufacturerOutletTypeId = {
				"terms": {
					"OutletTypeId": request.query.OutletTypeId || request.query["OutletTypeId[]"]
				}
			}
			powerSummary.query.bool.filter.push(manufacturerOutletTypeId);
			assetSummary.query.bool.filter.push(manufacturerOutletTypeId);
			healthSummary.query.bool.filter.push(manufacturerOutletTypeId);
		}

		if (request.query.LocationTypeId || request.query["LocationTypeId[]"]) {
			if (request.query.LocationTypeId.constructor !== Array) {
				var toArray = request.query.LocationTypeId;
				request.query.LocationTypeId = [];
				request.query.LocationTypeId.push(toArray);
			}
			var LocationTypeId = {
				"terms": {
					"LocationTypeId": request.query.LocationTypeId || request.query["LocationTypeId[]"]
				}
			}
			powerSummary.query.bool.filter.push(LocationTypeId);
			assetSummary.query.bool.filter.push(LocationTypeId);
			healthSummary.query.bool.filter.push(LocationTypeId);
		}

		if (request.query.ClassificationId || request.query["ClassificationId[]"]) {
			if (request.query.ClassificationId.constructor !== Array) {
				var toArray = request.query.ClassificationId;
				request.query.ClassificationId = [];
				request.query.ClassificationId.push(toArray);
			}
			var ClassificationId = {
				"terms": {
					"ClassificationId": request.query.ClassificationId || request.query["ClassificationId[]"]
				}
			}
			powerSummary.query.bool.filter.push(ClassificationId);
			assetSummary.query.bool.filter.push(ClassificationId);
			healthSummary.query.bool.filter.push(ClassificationId);
		}

		if (request.query.SubTradeChannelTypeId || request.query["SubTradeChannelTypeId[]"]) {
			if (request.query.SubTradeChannelTypeId.constructor !== Array) {
				var toArray = request.query.SubTradeChannelTypeId;
				request.query.SubTradeChannelTypeId = [];
				request.query.SubTradeChannelTypeId.push(toArray);
			}
			var SubTradeChannelTypeId = {
				"terms": {
					"SubTradeChannelTypeId": request.query.SubTradeChannelTypeId || request.query["SubTradeChannelTypeId[]"]
				}
			}
			powerSummary.query.bool.filter.push(SubTradeChannelTypeId);
			assetSummary.query.bool.filter.push(SubTradeChannelTypeId);
			healthSummary.query.bool.filter.push(SubTradeChannelTypeId);
		}

		if (request.query.AssetManufactureId || request.query["AssetManufactureId[]"]) {
			if (request.query.AssetManufactureId.constructor !== Array) {
				var toArray = request.query.AssetManufactureId;
				request.query.AssetManufactureId = [];
				request.query.AssetManufactureId.push(toArray);
			}
			var AssetManufactureId = {
				"terms": {
					"AssetManufactureId": request.query.AssetManufactureId || request.query["AssetManufactureId[]"]
				}
			}
			powerSummary.query.bool.filter.push(AssetManufactureId);
			assetSummary.query.bool.filter.push(AssetManufactureId);
			healthSummary.query.bool.filter.push(AssetManufactureId);
		}

		if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
			var AssetTypeId = {
				"terms": {
					"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
				}
			}
			powerSummary.query.bool.filter.push(AssetTypeId);
			assetSummary.query.bool.filter.push(AssetTypeId);
			healthSummary.query.bool.filter.push(AssetTypeId);
		}

		if (request.query.SmartDeviceTypeId || request.query["SmartDeviceTypeId[]"]) {
			if (request.query.SmartDeviceTypeId.constructor !== Array) {
				var toArray = request.query.SmartDeviceTypeId;
				request.query.SmartDeviceTypeId = [];
				request.query.SmartDeviceTypeId.push(toArray);
			}
			var SmartDeviceTypeId = {
				"terms": {
					"SmartDeviceTypeId": request.query.SmartDeviceTypeId || request.query["SmartDeviceTypeId[]"]
				}
			}
			powerSummary.query.bool.filter.push(SmartDeviceTypeId);
			assetSummary.query.bool.filter.push(SmartDeviceTypeId);
			healthSummary.query.bool.filter.push(SmartDeviceTypeId);
		}

		if (request.query.City || request.query["City[]"]) {
			if (request.query.City.constructor !== Array) {
				var toArray = request.query.City;
				request.query.City = [];
				request.query.City.push(toArray);
			}
			var City = {
				"terms": {
					"City": request.query.City || request.query["City[]"]
				}
			}
			powerSummary.query.bool.filter.push(City);
			assetSummary.query.bool.filter.push(City);
			healthSummary.query.bool.filter.push(City);
		}

		if (request.query.CountryId || request.query["CountryId[]"]) {
			if (request.query.CountryId.constructor !== Array) {
				var toArray = request.query.CountryId;
				request.query.CountryId = [];
				request.query.CountryId.push(toArray);
			}
			var CountryId = {
				"terms": {
					"CountryId": request.query.CountryId || request.query["CountryId[]"]
				}
			}
			powerSummary.query.bool.filter.push(CountryId);
			assetSummary.query.bool.filter.push(CountryId);
			healthSummary.query.bool.filter.push(CountryId);
		}

		if (request.query.LocationCode || request.query["LocationCode[]"]) {
			var LocationCode = {
				"term": {
					"LocationCode": request.query.LocationCode || request.query["LocationCode[]"]
				}
			}
			powerSummary.query.bool.filter.push(LocationCode);
			assetSummary.query.bool.filter.push(LocationCode);
			healthSummary.query.bool.filter.push(LocationCode);
		}

		var queries = [{
				key: "powerEvents",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					type: ["AssetEventDataSummary"],
					body: powerSummary,
					ignore_unavailable: true
				}
			},
			{
				key: "healthEvents",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					type: ["AssetEventDataSummary"],
					body: healthSummary,
					ignore_unavailable: true
				}
			}, {
				key: "db",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					type: ["AssetEventDataSummary"],
					body: assetSummary,
					ignore_unavailable: true
				}
			}
		];
		var promises = [];
		for (var i = 0, len = queries.length; i < len; i++) {
			var query = queries[i];
			var body = {
				from: 0,
				size: 0
			};

			var clientId = request.auth.credentials.user.ScopeId;
			if (clientId != 0) {
				body.query = {
					term: {
						ClientId: client
					}
				};
			}

			Object.assign(query, body);
			promises.push(_this.getElasticData(queries[i]));
		}

		var getMedian = _this.getMedian;
		Promise.all(promises).then(function (values) {
			var data = {},
				finalData = {
					powerData: [{
						"key": '&lt; 1',
						"assets": 0,
						total: 0
					}, {
						"key": '1-4 Hrs',
						"assets": 0,
						total: 0
					}, {
						"key": '4-8 Hrs',
						"assets": 0,
						total: 0
					}, {
						"key": '8-12 Hrs',
						"assets": 0,
						total: 0
					}, {
						"key": '12-16 Hrs',
						"assets": 0,
						total: 0
					}, {
						"key": '16-24 Hrs',
						"assets": 0,
						total: 0
					}]
				};
			for (var i = 0, len = values.length; i < len; i++) {
				var value = values[i];
				data[value.config.key] = value.response;
				util.setLogger(value);
			}
			var dbAggs = data.db.aggregations,
				powerAggs = data.powerEvents.aggregations,
				healthAggs = data.healthEvents.aggregations;
			var totalAssets = data.db.aggregations.AssetCount.value;
			var totalAsset = dbAggs.AssetCount.value;
			var powerOpenHour = 'N/A';
			var powerOffHour = 'N/A';
			var powerDayLength;
			var currentPowerStatus;
			var nextPowerStatus;
			var powerDay;
			var powerOffDuration = 0;
			var smart;
			var smartPower = 0;
			var totalPower = 0;
			var TotalAssets = 0;
			var powerdata = powerAggs.AssetBucket.buckets;
			var healthdata = healthAggs.AssetBucket.buckets;

			if (powerAggs) {
				var smart = dbAggs.AssetCount.value;
				var TotalAssets = healthAggs.AssetBucket.buckets.length;
				smartPower = smart;

				smartPower = smartPower - powerAggs.AssetBucket.buckets.length;
				powerAggs.AssetBucket.buckets.forEach(function (assetBucket) {
					powerOffHour = !isNaN(powerOffHour) ? powerOffHour : 0;
					powerOffHour += moment.duration(assetBucket.PowerOffDuration.value, 'second').asHours();
					powerOffDuration = moment.duration(assetBucket.PowerOffDuration.value, 'second').asHours() / moment.duration(totalHours, 'hours').asDays();
					//change as per the ticket no 7931
					//powerOffDuration = moment.duration(assetBucket.PowerOffDuration.value, 'second').asHours();
					if (powerOffDuration < 1) {
						finalData.powerData[0].assets++;
						totalPower = totalPower + 1;
					} else if (powerOffDuration >= 1 && powerOffDuration < 4) {
						finalData.powerData[1].assets++;
						totalPower = totalPower + 1;
					} else if (powerOffDuration >= 4 && powerOffDuration < 8) {
						finalData.powerData[2].assets++;
						totalPower = totalPower + 1;
					} else if (powerOffDuration >= 8 && powerOffDuration < 12) {
						finalData.powerData[3].assets++;
						totalPower = totalPower + 1;
					} else if (powerOffDuration >= 12 && powerOffDuration < 16) {
						finalData.powerData[4].assets++;
						totalPower = totalPower + 1;
					} else if (powerOffDuration >= 16) {
						finalData.powerData[5].assets++;
						totalPower = totalPower + 1;
					}
				});

				var powerAsset = powerAggs.AssetBucket.buckets.length;
				if (!isNaN(powerOffHour)) {
					powerOpenHour = totalHours * powerAsset - powerOffHour;
					powerOpenHour = (powerOpenHour / powerAsset) / moment.duration(totalHours, 'hours').asDays();
					powerOffHour = (powerOffHour / powerAsset) / moment.duration(totalHours, 'hours').asDays();
					powerOpenHour = powerOpenHour > 24 ? 24 : powerOpenHour < 0 ? 0 : powerOpenHour;
					powerOffHour = powerOffHour > 24 ? 24 : powerOffHour < 0 ? 0 : powerOffHour;
				}
			}

			for (var w = 0; w < powerdata.length; w++) {
				for (var q = 0; q < healthdata.length; q++) {
					if (powerdata[w].key == healthdata[q].key) {
						var index = healthdata.indexOf(healthdata[q]);
						if (index > -1) {
							healthdata.splice(index, 1);
						}
					}
				}
			}
			finalData.powerData.push({
				key: "No-Interruptions",
				assets: healthdata.length,
				outlets: 0,
				total: totalAssets
			});

			if (smartPower < totalAssets && TotalAssets > totalPower) {
				for (var w = 0; w < powerdata.length; w++) {
					for (var q = 0; q < healthdata.length; q++) {
						if (powerdata[w].key == healthdata[q].key) {
							var index = healthdata.indexOf(healthdata[q]);
							if (index > -1) {
								healthdata.splice(index, 1);
							}
						}
					}
				}
				finalData.powerData.push({
					key: "No-Data",
					assets: smartPower - (healthdata.length),
					outlets: 0,
					total: totalAssets
				});
			} else if (TotalAssets < totalPower) {
				for (var w = 0; w < powerdata.length; w++) {
					for (var q = 0; q < healthdata.length; q++) {
						if (powerdata[w].key == healthdata[q].key) {
							var index = healthdata.indexOf(healthdata[q]);
							if (index > -1) {
								healthdata.splice(index, 1);
							}
						}
					}
				}
				finalData.powerData.push({
					key: "No-Data",
					assets: smartPower - (healthdata.length),
					outlets: 0,
					total: totalAssets
				});
			} else {
				finalData.powerData.push({
					key: "No-Data",
					assets: smartPower,
					outlets: 0,
					total: totalAssets
				});
			}

			finalData.powerData[0].total = totalAsset;
			finalData.powerData[1].total = totalAsset;
			finalData.powerData[2].total = totalAsset;
			finalData.powerData[3].total = totalAsset;
			finalData.powerData[4].total = totalAsset;
			finalData.powerData[5].total = totalAsset;

			if (isNaN(powerOpenHour)) {
				powerOpenHour = 'N/A'
			}
			if (isNaN(powerOffHour)) {
				powerOffHour = 'N/A'
			}

			finalData.summary = {
				hoursPowerOn: powerOpenHour,
				hoursPowerOff: powerOffHour
			};
			return reply({
				success: true,
				data: finalData
			});
		}, function (err) {
			console.trace(err.message);
			return reply(Boom.badRequest(err.message));
		});

		//}.bind(null, this));
	}
}