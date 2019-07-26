"use strict"
var linq = require('node-linq').LINQ,
	fs = require('fs');
var consts = require('../controllers/consts');
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
var smartDevicePowerReducer = require('../controllers/reducers/smartDevicePowerRecord');
var smartDevicHealthReducer = require('../controllers/reducers/smartDeviceHealthRecord');
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
		alertSummary: JSON.stringify(require('./dashboardQueries/salesAlertSummary.json')),
		assetSummary: JSON.stringify(require('./dashboardQueries/salesAssetSummary.json')),
		salesAlertSummaryClosed: JSON.stringify(require('./dashboardQueries/salesAlertSummaryClosed.json')),
		TotalAssetLocation: JSON.stringify(require('./dashboardQueries/TotalAssetLocation.json')),
		salesAlertSummarySalesRep: JSON.stringify(require('./dashboardQueries/salesAlertSummarySalesRep.json'))
	},

	getSalesWidgetData: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload),
			alertSummary = JSON.parse(this.dashboardQueries.alertSummary),
			salesAlertSummaryClosed = JSON.parse(this.dashboardQueries.salesAlertSummaryClosed),
			//totalAssetLocation = JSON.parse(this.dashboardQueries.TotalAssetLocation),
			assetSummary = JSON.parse(this.dashboardQueries.assetSummary);
		// client Filter
		var clientQuery = {
			"term": {
				"ClientId": clientId
			}
		};
		if (clientId != 0) {
			alertSummary.query.bool.must.push(clientQuery);
			salesAlertSummaryClosed.query.bool.must.push(clientQuery);
			assetSummary.query.bool.must.push(clientQuery);
			//totalAssetLocation.query.bool.filter.push(clientQuery);
		}
		alertSummary.query.bool["filter"] = {
			"bool": {
				"should": []
			}
		};
		//Date Filter
		var isDefaultDateFilter = params.yearWeek || params.dayOfWeek || params.quarter || params.month;
		var dateFilter = [];
		var totalHours = 0
		if (!isDefaultDateFilter && !params.startDate && !params.endDate) {

			alertSummary.aggs.alertCloseCount.filter.bool.must.push({
				"range": {
					"EventDate": {
						"gte": "now-30d/d"
					}
				}
			});

			alertSummary.aggs.AlertOpenCount.aggs.ByType.aggs.ByType.filter.bool.must.push({
				"range": {
					"AlertSummaryInJson.EventDate": {
						"gte": "now-30d/d"
					}
				}
			});

			alertSummary.aggs.ByType.aggs.ByType.aggs.AlertOpen.filter.bool.must.push({
				"range": {
					"AlertSummaryInJson.EventDate": {
						"lte": "now"
					}
				}
			});

			alertSummary.aggs.ByType.aggs.ByType.aggs.AlertClosed.filter.bool.must.push({
				"range": {
					"AlertSummaryInJson.EventDate": {
						"gte": "now-30d/d"
					}
				}
			});

			alertSummary.aggs.ByType.aggs.ByType.aggs.AlertNew.filter.bool.should.push({
				"range": {
					"AlertSummaryInJson.EventDate": {
						"gte": "now-30d/d"
					}
				}
			});

			alertSummary.aggs.AlertCountBoth.filter.bool.should.push({
				"range": {
					"EventDate": {
						"gte": "now-30d/d"
					}
				}
			});

			alertSummary.aggs.alertsCreatedByWeek.filter.bool.must.push({
				"range": {
					"EventDate": {
						"from": "now-30d/d"
					}
				}
			});
			salesAlertSummaryClosed.aggs.alertsClosedByWeek.filter.bool.should.push({
				"range": {
					"EventDate": {
						"from": "now-30d/d"
					}
				}
			});

			alertSummary.aggs.oldOpenAlerts.filter.bool.must.push({
				"range": {
					"EventDate": {
						"lte": "now"
					}
				}
			});
			totalHours = defaultHours;
		} else if (!isDefaultDateFilter && params.startDate && params.endDate) {
			var startDate = moment(params.startDate).format('YYYY-MM-DD[T00:00:00]');
			var endDate = moment(params.endDate).format('YYYY-MM-DD[T23:59:59]');
			alertSummary.aggs.AlertCountBoth.filter.bool.must.push({
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});

			alertSummary.aggs.ByType.aggs.ByType.aggs.AlertOpen.filter.bool.must.push({
				"range": {
					"AlertSummaryInJson.EventDate": {
						"lte": endDate
					}
				}
			});

			alertSummary.aggs.ByType.aggs.ByType.aggs.AlertClosed.filter.bool.must.push({
				"range": {
					"AlertSummaryInJson.EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});

			alertSummary.aggs.ByType.aggs.ByType.aggs.AlertNew.filter.bool.should.push({
				"range": {
					"AlertSummaryInJson.EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});

			// alertSummary.aggs.AlertOpenCount.filter.bool.must.push({
			// 	"range": {
			// 		"AlertAt": {
			// 			"gte": startDate,
			// 			"lte": endDate
			// 		}
			// 	}
			// });

			alertSummary.aggs.alertCloseCount.filter.bool.must.push({
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});

			alertSummary.aggs.Location.filter.bool.must.push({
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});
			var startWeek = moment.utc(startDate).isoWeek();
			var startYear = moment.utc(startDate).year();
			var endWeek = moment.utc(endDate).isoWeek();
			var endYear = moment.utc(endDate).year();
			var currentYear = moment.utc().year();
			if (startWeek > endWeek) {
				endWeek = 52;
			}
			if (currentYear > startYear) {
				var weekinYear = moment.utc(params.startDate).weeksInYear();
				startWeek = startWeek - weekinYear * (currentYear - startYear);
				endWeek = endWeek - weekinYear * (currentYear - endYear);
			}

			var startWeekDate = moment.utc(startDate).startOf('isoweek').format('YYYY-MM-DD[T00:00:00]');
			var endWeekDate = moment.utc(endDate).endOf('isoweek').format('YYYY-MM-DD[T23:59:59]');
			alertSummary.aggs.alertsCreatedByWeek.filter.bool.must.push({
				"range": {
					"EventDate": {
						"from": startWeekDate,
						"to": endWeekDate
					}
				}
			});
			salesAlertSummaryClosed.aggs.alertsClosedByWeek.filter.bool.must.push({
				"range": {
					"EventDate": {
						"from": startWeekDate,
						"to": endWeekDate
					}
				}
			});


			for (var i = startWeek; i <= endWeek; i++) {
				var startWeekDate = moment.utc().week(i).startOf('isoweek').format('YYYY-MM-DD[T00:00:00]');
				var endWeekDate = moment.utc().week(i).endOf('isoweek').format('YYYY-MM-DD[T23:59:59]');
				var startDateWeekValue = moment.utc().week(i).startOf('isoweek').valueOf();
				salesAlertSummaryClosed.aggs.alertsOpenByWeek.aggs.Bands.range.ranges.push({
					"key": startDateWeekValue.toString(),
					//"to": startWeekDate
					"from": startWeekDate,
					"to": endWeekDate
				});
			}


			alertSummary.aggs.AlertOpenCount.aggs.Bands.range.ranges[0].from = moment.utc(endDate).format('YYYY-MM-DD[T00:00:00]');
			alertSummary.aggs.AlertOpenCount.aggs.Bands.range.ranges[1].from = moment.utc(endDate).add(-3, 'day').format('YYYY-MM-DD[T00:00:00]');
			alertSummary.aggs.AlertOpenCount.aggs.Bands.range.ranges[1].to = moment.utc(endDate).add(-1, 'day').format('YYYY-MM-DD[T23:59:59]');
			alertSummary.aggs.AlertOpenCount.aggs.Bands.range.ranges[2].from = moment.utc(endDate).add(-6, 'day').format('YYYY-MM-DD[T00:00:00]');
			alertSummary.aggs.AlertOpenCount.aggs.Bands.range.ranges[2].to = moment.utc(endDate).add(-4, 'day').format('YYYY-MM-DD[T23:59:59]');
			alertSummary.aggs.AlertOpenCount.aggs.Bands.range.ranges[3].to = moment.utc(endDate).add(-7, 'day').format('YYYY-MM-DD[T23:59:59]');

			alertSummary.aggs.oldOpenAlerts.filter.bool.must.push({
				"range": {
					"EventDate": {
						"lte": endDate
					}
				}
			});

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
			var startWeek = moment.utc(params.startDate).isoWeek();
			var endWeek = moment.utc(params.endDate).isoWeek();

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

			alertSummary.aggs.AlertOpenCount.aggs.Bands.range.ranges[0].from = moment.utc(endDate).format('YYYY-MM-DD[T00:00:00]');
			alertSummary.aggs.AlertOpenCount.aggs.Bands.range.ranges[1].from = moment.utc(endDate).add(-3, 'day').format('YYYY-MM-DD[T00:00:00]');
			alertSummary.aggs.AlertOpenCount.aggs.Bands.range.ranges[1].to = moment.utc(endDate).add(-1, 'day').format('YYYY-MM-DD[T23:59:59]');
			alertSummary.aggs.AlertOpenCount.aggs.Bands.range.ranges[2].from = moment.utc(endDate).add(-6, 'day').format('YYYY-MM-DD[T00:00:00]');
			alertSummary.aggs.AlertOpenCount.aggs.Bands.range.ranges[2].to = moment.utc(endDate).add(-4, 'day').format('YYYY-MM-DD[T23:59:59]');
			alertSummary.aggs.AlertOpenCount.aggs.Bands.range.ranges[3].to = moment.utc(endDate).add(-7, 'day').format('YYYY-MM-DD[T23:59:59]');

			alertSummary.aggs.AlertCountBoth.filter.bool.should.push({
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});

			alertSummary.aggs.ByType.aggs.ByType.aggs.AlertOpen.filter.bool.must.push({
				"range": {
					"AlertAt": {
						"lte": endDate
					}
				}
			});

			alertSummary.aggs.ByType.aggs.ByType.aggs.AlertClosed.filter.bool.must.push({
				"range": {
					"AlertSummaryInJson.EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});

			alertSummary.aggs.ByType.aggs.ByType.aggs.AlertNew.filter.bool.should.push({
				"range": {
					"AlertSummaryInJson.EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});

			alertSummary.aggs.alertCloseCount.filter.bool.must.push({
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});

			alertSummary.aggs.Location.filter.bool.should.push({
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});

			// alertSummary.aggs.AlertOpenCount.filter.bool.should.push({
			// 	"range": {
			// 		"AlertAt": {
			// 			"gte": startDate,
			// 			"lte": endDate
			// 		}
			// 	}
			// });

			var startWeek = moment.utc(startDate).isoWeek();
			var startYear = moment.utc(startDate).year();
			var endWeek = moment.utc(endDate).isoWeek();
			var endYear = moment.utc(endDate).year();
			var startWeekDate = moment.utc(startDate).startOf('isoweek').format(startYear + '-MM-DD[T00:00:00]');
			var endWeekDate = moment.utc(endDate).endOf('isoweek').format(endYear + '-MM-DD[T23:59:59]');
			var currentYear = moment.utc().year();
			if (currentYear > startYear) {
				var weekinYear = moment.utc(params.startDate).weeksInYear();
				startWeek = startWeek - weekinYear * (currentYear - startYear);
				endWeek = endWeek - weekinYear * (currentYear - endYear);
			}

			alertSummary.aggs.alertsCreatedByWeek.filter.bool.must.push({
				"range": {
					"EventDate": {
						"from": startWeekDate,
						"to": endWeekDate
					}
				}
			});
			salesAlertSummaryClosed.aggs.alertsClosedByWeek.filter.bool.should.push({
				"range": {
					"EventDate": {
						"from": startWeekDate,
						"to": endWeekDate
					}
				}
			});

			alertSummary.aggs.oldOpenAlerts.filter.bool.must.push({
				"range": {
					"EventDate": {
						"lte": endDate
					}
				}
			});

			for (var j = startWeek; j <= endWeek + 1; j++) {
				var startWeekDate = moment.utc().week(j).startOf('isoweek').format('YYYY-MM-DD[T00:00:00]');
				var startDateWeekValue = moment.utc().week(j).startOf('isoweek').valueOf();
				salesAlertSummaryClosed.aggs.alertsOpenByWeek.aggs.Bands.range.ranges.push({
					"key": startDateWeekValue.toString(),
					"to": startWeekDate
				});
			}
		}
		var _this = this;
		this.dateFilter = dateFilter;

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
			assetSummary.query.bool.must.push(countryIdsUser);

			salesAlertSummaryClosed.query.bool.must.push(countryIdsUser);
			alertSummary.query.bool.must.push(countryIdsUser);
			//totalAssetLocation.query.bool.filter.push(countryIdsUser);
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
			assetSummary.query.bool.must.push(filterQuery);

			salesAlertSummaryClosed.query.bool.must.push(filterQuery);
			alertSummary.query.bool.must.push(filterQuery);
			//totalAssetLocation.query.bool.filter.push(filterQuery);
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

			assetSummary.aggs.Locations.filter.bool.must.push(AssetIds);
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetIds);

			salesAlertSummaryClosed.query.bool.must.push(AssetIds);
			alertSummary.query.bool.must.push(AssetIds);
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

			assetSummary.aggs.Locations.filter.bool.must.push(LocationIds);
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(LocationIds);

			salesAlertSummaryClosed.query.bool.must.push(LocationIds);
			alertSummary.query.bool.must.push(LocationIds);
		}

		if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
			var smartDeviceTypeQuery = {
				"terms": {
					"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
				}
			}
			assetSummary.aggs.Locations.filter.bool.must.push(smartDeviceTypeQuery);
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(smartDeviceTypeQuery);

			salesAlertSummaryClosed.query.bool.must.push(smartDeviceTypeQuery);
			alertSummary.query.bool.must.push(smartDeviceTypeQuery);
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
			assetSummary.aggs.Locations.filter.bool.must.push(IsKeyLocationFilter);
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(IsKeyLocationFilter);

			salesAlertSummaryClosed.query.bool.must.push(IsKeyLocationFilter);
			alertSummary.query.bool.must.push(IsKeyLocationFilter);
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
			assetSummary.aggs.Locations.filter.bool.must.push(IsFactoryAssetFilter);
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(IsFactoryAssetFilter);

			salesAlertSummaryClosed.query.bool.must.push(IsFactoryAssetFilter);
			alertSummary.query.bool.must.push(IsFactoryAssetFilter);
		}

		if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
			var assetManufactureQuery = {
				"terms": {
					"AssetManufactureId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
				}
			}
			assetSummary.aggs.Locations.filter.bool.must.push(assetManufactureQuery);
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetManufactureQuery);

			salesAlertSummaryClosed.query.bool.must.push(assetManufactureQuery);
			alertSummary.query.bool.must.push(assetManufactureQuery);
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
			assetSummary.aggs.Locations.filter.bool.must.push(SalesHierarchyId);
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(SalesHierarchyId);

			salesAlertSummaryClosed.query.bool.must.push(SalesHierarchyId);
			alertSummary.query.bool.must.push(SalesHierarchyId);
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
			assetSummary.aggs.Locations.filter.bool.must.push(manufacturerSmartDeviceQuery);
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerSmartDeviceQuery);

			salesAlertSummaryClosed.query.bool.must.push(manufacturerSmartDeviceQuery);
			alertSummary.query.bool.must.push(manufacturerSmartDeviceQuery);
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
			assetSummary.aggs.Locations.filter.bool.must.push(manufacturerOutletTypeId);
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerOutletTypeId);

			salesAlertSummaryClosed.query.bool.must.push(manufacturerOutletTypeId);
			alertSummary.query.bool.must.push(manufacturerOutletTypeId);
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
			assetSummary.aggs.Locations.filter.bool.must.push(LocationTypeId);
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(LocationTypeId);

			salesAlertSummaryClosed.query.bool.must.push(LocationTypeId);
			alertSummary.query.bool.must.push(LocationTypeId);
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
			assetSummary.aggs.Locations.filter.bool.must.push(ClassificationId);
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(ClassificationId);

			salesAlertSummaryClosed.query.bool.must.push(ClassificationId);
			alertSummary.query.bool.must.push(ClassificationId);
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
			assetSummary.aggs.Locations.filter.bool.must.push(SubTradeChannelTypeId);
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(SubTradeChannelTypeId);

			salesAlertSummaryClosed.query.bool.must.push(SubTradeChannelTypeId);
			alertSummary.query.bool.must.push(SubTradeChannelTypeId);
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
			assetSummary.aggs.Locations.filter.bool.must.push(AssetManufactureId);
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetManufactureId);

			salesAlertSummaryClosed.query.bool.must.push(AssetManufactureId);
			alertSummary.query.bool.must.push(AssetManufactureId);
		}

		if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
			var AssetTypeId = {
				"terms": {
					"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
				}
			}
			assetSummary.aggs.Locations.filter.bool.must.push(AssetTypeId);
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetTypeId);

			salesAlertSummaryClosed.query.bool.must.push(AssetTypeId);
			alertSummary.query.bool.must.push(AssetTypeId);
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
			assetSummary.aggs.Locations.filter.bool.must.push(SmartDeviceTypeId);
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(SmartDeviceTypeId);

			salesAlertSummaryClosed.query.bool.must.push(SmartDeviceTypeId);
			alertSummary.query.bool.must.push(SmartDeviceTypeId);
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
			assetSummary.aggs.Locations.filter.bool.must.push(City);
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(City);

			salesAlertSummaryClosed.query.bool.must.push(City);
			alertSummary.query.bool.must.push(City);
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
			assetSummary.aggs.Locations.filter.bool.must.push(CountryId);
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(CountryId);

			salesAlertSummaryClosed.query.bool.must.push(CountryId);
			alertSummary.query.bool.must.push(CountryId);
		}

		if (request.query.LocationCode || request.query["LocationCode[]"]) {
			var LocationCode = {
				"term": {
					"LocationCode": request.query.LocationCode || request.query["LocationCode[]"]
				}
			}
			assetSummary.aggs.Locations.filter.bool.must.push(LocationCode);
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(LocationCode);

			salesAlertSummaryClosed.query.bool.must.push(LocationCode);
			alertSummary.query.bool.must.push(LocationCode);
		}


		var queries = [{
				key: "alertClosed",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					body: salesAlertSummaryClosed,
					ignore_unavailable: true
				}
			}, {
				key: "alert",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					body: alertSummary,
					ignore_unavailable: true
				}
			}, {
				key: "db",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					body: assetSummary,
					ignore_unavailable: true
				}
			}
			// , {
			// 	key: "totalAssetLocation",
			// 	search: {
			// 		index: "cooler-iot-asset",
			// 		type: ["Asset"],
			// 		body: totalAssetLocation,
			// 		ignore_unavailable: true
			// 	}
			// }
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

		var data = {};
		Promise.all(promises).then(function (values) {
			var data = {},
				finalData = {
					doorData: {
						low: 0,
						medium: 0,
						high: 0
					},
					openAlerts: [],
					alertsByWeek: [],
					alertsByTypeBoth: []
				};
			for (var i = 0, len = values.length; i < len; i++) {
				var value = values[i];
				data[value.config.key] = value.response;
				util.setLogger(value);
			}
			var dbAggs = data.db.aggregations,
				alertAggs = data.alert.aggregations,
				openAlerts = finalData.openAlerts,
				//totalAssetLocation = data.totalAssetLocation.aggregations,
				totalAsset = dbAggs.AssetCount.AssetCount.buckets.length,
				alertsByWeek = finalData.alertsByWeek;

			var openAlertBuckets = [
				"Today",
				"1-3",
				"4-6",
				"7+"
			];

			openAlertBuckets.forEach(function (bucket) {
				openAlerts.push({
					Label: bucket,
					Low: 0,
					Medium: 0,
					High: 0,
					Assets: 0,
					OpenAlertAssetPercentage: 0
				});
			});
			var alertCounts = 0,
				cumulative;
			var totalAssets = dbAggs.AssetCount.AssetCount.buckets.length,
				locationAlarmRate = 0,
				assetAlarmRate = 0,
				closedAlarm = 0,
				missingCooler = 0,
				openAlert = 0,
				totalNoOfAlarms = 0,
				activeAlert = 0,
				totalAlertCreated = 0;

			if (alertAggs) {
				alertCounts = alertAggs.AlertOpenCount.Bands.buckets;
				for (var bucket in alertCounts) {
					var target = openAlerts[openAlertBuckets.indexOf(bucket)];
					target.Assets = alertCounts[bucket].Assets.value;
					target.OpenAlertAssetPercentage = parseFloat(((alertCounts[bucket].Assets.value / totalAssets) * 100).toFixed(2))
					alertCounts[bucket].Priority.buckets.forEach(function (priorityBucket) {
						target[consts.alertPriorityMappings[priorityBucket.key]] = priorityBucket.ByType.value;
					});
				}

				cumulative = alertAggs.oldOpenAlerts.oldOpenAlerts.All.value;

				var dateKeys = {};

				alertAggs.alertsCreatedByWeek.byWeek.buckets.forEach(function (bucket) {
					var record = {
						date: bucket.key_as_string,
						created: bucket.nested_sellerInfo.All.value,
						closed: 0,
						activeAlert: 0
					};
					if (!dateKeys[Number(moment.utc(bucket.key).format('W'))]) {
						dateKeys[Number(moment.utc(bucket.key).format('W'))] = record;
						alertsByWeek.push(record);
					} else {
						dateKeys[Number(moment.utc(bucket.key).format('W'))].created += bucket.nested_sellerInfo.All.value;
					}
				});

				data.alertClosed.aggregations.alertsOpenByWeek.Bands.buckets.forEach(function (bucket) {
					var record = dateKeys[Number(moment.utc(bucket.to_as_string).format('W'))];
					if (record) {
						record.activeAlert = bucket.alertsOpenByWeek.Open.value;
					}
				});

				data.alertClosed.aggregations.alertsClosedByWeek.byWeek.buckets.forEach(function (bucket) {
					var record = dateKeys[Number(moment.utc(bucket.key).format('W'))];
					if (record) {
						record.closed += bucket.byWeek.Closed.value;
						cumulative = cumulative + (record.created - record.closed);
						record.cumulative += cumulative;
					}

				});

				alertAggs.ByType.ByType.buckets.forEach(function (bucket) {
					var total = bucket.AlertOpen.Open.value + bucket.AlertClosed.Closed.value;
					finalData.alertsByTypeBoth.push({
						alertTypeId: bucket.key,
						alertType: consts.alertTypesMappings[bucket.key],
						count: total,
						OpenAlert: bucket.AlertOpen.Open.value,
						NewAlert: bucket.AlertNew.New.value,
						CloseAlert: bucket.AlertClosed.Closed.value
					});
				});

				locationAlarmRate = alertAggs.AlertCountBoth.Unique.LocationsCount.value;
				assetAlarmRate = alertAggs.AlertCountBoth.Unique.AssetCount.value;
				closedAlarm = alertAggs.alertCloseCount.alertCloseCount.Closed.value;
				openAlert = alertAggs.AlertOpenCount.doc_count;
				totalNoOfAlarms = alertAggs.Location.Location.Location.value;
				activeAlert = alertAggs.oldOpenAlerts.oldOpenAlerts.All.value;
				totalAlertCreated = data.alert.hits.total;
			}

			var smartAssetCount = dbAggs.SmartAssetCount.SmartAssetCount.buckets.length;
			finalData.summary = {
				totalCooler: totalAsset,
				totalCustomer: dbAggs.LocationCount.LocationCount.buckets.length,
				filteredAssets: dbAggs.AssetCount.AssetCount.buckets.length,
				filteredOutlets: dbAggs.Locations.Locations.buckets.length,
				totalOutlets: dbAggs.LocationCount.LocationCount.buckets.length,
				locationAlarmRate: locationAlarmRate,
				assetAlarmRate: assetAlarmRate,
				closedAlarm: closedAlarm,
				missingCooler: 0,
				openAlert: openAlert,
				//isPowerOff: dbAggs.Assets.isPowerOff.doc_count,
				totalNoOfAlarms: totalNoOfAlarms,
				totalSmartAssetCount: dbAggs.AssetCount.AssetCount.buckets.length,
				smartAssetCount: smartAssetCount,
				activeAlert: activeAlert,
				smartAssetCountWareHouse: dbAggs.SmartAssetCount.SmartAssetCount.buckets.length,
				totalAlertCreated: totalAlertCreated
			};

			return reply({
				success: true,
				data: finalData
			});

		}, function (err) {
			console.trace(err.message);
			return reply(Boom.badRequest(err.message));
		});
	},
	getSalesWidgetSalesRep: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload),
			alertSummary = JSON.parse(this.dashboardQueries.salesAlertSummarySalesRep);
		// client Filter
		var clientQuery = {
			"term": {
				"ClientId": clientId
			}
		};
		if (clientId != 0) {
			alertSummary.query.bool.must.push(clientQuery);
		}
		alertSummary.query.bool["filter"] = {
			"bool": {
				"should": []
			}
		};
		//Date Filter
		var isDefaultDateFilter = params.yearWeek || params.dayOfWeek || params.quarter || params.month;
		var dateFilter = [];
		var totalHours = 0
		if (!isDefaultDateFilter && !params.startDate && !params.endDate) {
			alertSummary.aggs.Location.aggs.LocationId.aggs.LocationId.aggs.closeAlert.filter.bool.should.push({
				"range": {
					"AlertSummaryInJson.EventDate": {
						"gte": "now-30d/d"
					}
				}
			});

			alertSummary.aggs.Location.aggs.LocationId.aggs.LocationId.aggs.NewAlert.filter.bool.should.push({
				"range": {
					"AlertSummaryInJson.EventDate": {
						"gte": "now-30d/d"
					}
				}
			});

			alertSummary.aggs.Location.aggs.LocationId.aggs.LocationId.aggs.openAlert.filter.bool.should.push({
				"range": {
					"AlertSummaryInJson.EventDate": {
						"lte": "now"
					}
				}
			});
			totalHours = defaultHours;
		} else if (!isDefaultDateFilter && params.startDate && params.endDate) {
			var startDate = moment(params.startDate).format('YYYY-MM-DD[T00:00:00]');
			var endDate = moment(params.endDate).format('YYYY-MM-DD[T23:59:59]');

			alertSummary.aggs.Location.aggs.LocationId.aggs.LocationId.aggs.Location.filter.bool.should.push({
				"range": {
					"AlertSummaryInJson.EventDate": {
						//"gte": startDate,
						"lte": endDate
					}
				}
			});
			alertSummary.aggs.Location.aggs.LocationId.aggs.LocationId.aggs.closeAlert.filter.bool.should.push({
				"range": {
					"AlertSummaryInJson.EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});

			alertSummary.aggs.Location.aggs.LocationId.aggs.LocationId.aggs.NewAlert.filter.bool.should.push({
				"range": {
					"AlertSummaryInJson.EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});

			alertSummary.aggs.Location.aggs.LocationId.aggs.LocationId.aggs.openAlert.filter.bool.should.push({
				"range": {
					"AlertSummaryInJson.EventDate": {
						"lte": endDate
					}
				}
			});

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
			var startWeek = moment.utc(params.startDate).isoWeek();
			var endWeek = moment.utc(params.endDate).isoWeek();

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

			alertSummary.aggs.Location.aggs.LocationId.aggs.LocationId.aggs.Location.filter.bool.should.push({
				"range": {
					"AlertSummaryInJson.EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});
			alertSummary.aggs.Location.aggs.LocationId.aggs.LocationId.aggs.closeAlert.filter.bool.should.push({
				"range": {
					"AlertSummaryInJson.EventDate": {
						//"gte": startDate,
						"lte": endDate
					}
				}
			});

			alertSummary.aggs.Location.aggs.LocationId.aggs.LocationId.aggs.NewAlert.filter.bool.should.push({
				"range": {
					"AlertSummaryInJson.EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});

			alertSummary.aggs.Location.aggs.LocationId.aggs.LocationId.aggs.openAlert.filter.bool.should.push({
				"range": {
					"AlertSummaryInJson.EventDate": {
						"lte": endDate
					}
				}
			});


		}
		this.dateFilter = dateFilter;

		if (params.Displacement_To || params.Displacement_From || params["Displacement_To[]"] || params["Displacement_From[]"]) {
			params["startDateMovement"] = params.startDate;
			params["endDateMovement"] = params.endDate;
			params["fromMovementScreen"] = true;
			if (params.dayOfWeek || params["dayOfWeek[]"]) {
				params["dayOfWeekMovement"] = params.dayOfWeek || params["dayOfWeek[]"];
			}
			if (params.yearWeek || params["yearWeek[]"]) {
				params["yearWeekMovement"] = params.yearWeek || params["yearWeek[]"];
			}
			if (params.quarter || params["quarter[]"]) {
				params["quarterMovement"] = params.quarter || params["quarter[]"];
			}
			if (params.month || params["month[]"]) {
				params["monthMovement"] = params.month || params["month[]"];
			}
			params.daysMovement = moment.duration(totalHours, 'hours').asDays();
		}
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
			alertSummary.query.bool.must.push(countryIdsUser);
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

			alertSummary.query.bool.must.push(filterQuery);
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
			(params.ExcecuteCommandReport || params["ExcecuteCommandReport[]"])) {
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

			alertSummary.query.bool.must.push(AssetIds);
		}

		if ((params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) ||
			(params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) ||
			(params.DataDownloadOutlet || params["DataDownloadOutlet[]"])) {
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

			alertSummary.query.bool.must.push(LocationIds);
		}

		if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
			var smartDeviceTypeQuery = {
				"terms": {
					"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
				}
			}
			alertSummary.query.bool.must.push(smartDeviceTypeQuery);
		}

		if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
			var assetManufactureQuery = {
				"terms": {
					"AssetManufacturerId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
				}
			}
			alertSummary.query.bool.must.push(assetManufactureQuery);
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
			alertSummary.query.bool.must.push(manufacturerSmartDeviceQuery);
		}

		var queries = [{
			key: "alert",
			search: {
				index: 'cooler-iot-asseteventdatasummary',
				body: alertSummary,
				ignore_unavailable: true
			}
		}];
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

		var data = {};
		Promise.all(promises).then(function (values) {
			var data = {},
				finalData = {
					alarmBySeller: [],
					alarmByCustomer: []
				};
			for (var i = 0, len = values.length; i < len; i++) {
				var value = values[i];
				data[value.config.key] = value.response;
				util.setLogger(value);
			}


			var salesRep = [],
				locationSource,
				name, isAdded = [],
				alarmIndex, total, groupBySales = reply.request.query.groupBySales;
			data.alert.aggregations.Location.LocationId.LocationId.buckets.forEach(function (bucket) {
				if (bucket.Location.Location.hits.hits.length > 0) {
					locationSource = bucket.Location.Location.hits.hits[0]._source;
					if (groupBySales == "SalesRep") {
						//salesRep = data.locationRep.hits.hits.filter(data => data._source.LocationId == bucket.key);
					} else if (groupBySales == "SalesTerritory") {
						salesRep = [{
							"_source": {
								"Username": locationSource.SalesHierarchy,
								"RepId": locationSource.SalesHierarchyId
							}
						}];
					} else if (groupBySales == "SalesGroup") {
						salesRep = [{
							"_source": {
								"Username": locationSource.SalesGroupName,
								"RepId": locationSource.SalesGroupId
							}
						}];
					} else if (groupBySales == "SalesOffice") {
						salesRep = [{
							"_source": {
								"Username": locationSource.SalesOfficeName,
								"RepId": locationSource.SalesOfficeId
							}
						}];
					} else if (groupBySales == "SalesOrg") {
						salesRep = [{
							"_source": {
								"Username": locationSource.SalesOrganizationName,
								"RepId": locationSource.SalesOrganizationId
							}
						}];
					}
					if (salesRep.length > 0) {
						salesRep.forEach(function (data) {
							name = data._source.Username != null ? data._source.Username : null;
							if (name) {
								isAdded = finalData.alarmBySeller.filter(rep => rep.Id == data._source.RepId);
								if (isAdded.length > 0) {
									alarmIndex = finalData.alarmBySeller.indexOf(isAdded[0]);
									total = bucket.openAlert.Open.value + bucket.closeAlert.Closed.value;
									finalData.alarmBySeller[alarmIndex].Value += total;
									finalData.alarmBySeller[alarmIndex].CloseAlert += bucket.closeAlert.Closed.value;
									finalData.alarmBySeller[alarmIndex].OpenAlert += bucket.openAlert.Open.value;
									finalData.alarmBySeller[alarmIndex].NewAlert += bucket.NewAlert.New.value;
								} else {
									total = bucket.openAlert.Open.value + bucket.closeAlert.Closed.value;
									finalData.alarmBySeller.push({
										Name: name,
										Id: data._source.RepId,
										Value: total,
										CloseAlert: bucket.closeAlert.Closed.value,
										OpenAlert: bucket.openAlert.Open.value,
										NewAlert: bucket.NewAlert.New.value
									});
								}
							}
						})
					}
				}
			});
			finalData.alarmBySeller.sort(function (a, b) {
				var keyA = new Date(a.Value),
					keyB = new Date(b.Value);
				// Compare the 2 dates
				if (keyA > keyB) return -1;
				if (keyA < keyB) return 1;
				return 0;
			});
			if (reply.request.query.sellerTop == "false") {
				finalData.alarmBySeller = finalData.alarmBySeller.reverse();
			}
			finalData.alarmBySeller = finalData.alarmBySeller.splice(0, 10);
			data.alert.aggregations.Location.LocationId.LocationId.buckets.forEach(function (bucket) {
				if (bucket.Location.Location.hits.hits.length > 0) {
					total = bucket.openAlert.Open.value + bucket.closeAlert.Closed.value;
					finalData.alarmByCustomer.push({
						Name: bucket.Location.Location.hits.hits[0]._source.LocationName,
						Value: total,
						CloseAlert: bucket.closeAlert.Closed.value,
						OpenAlert: bucket.openAlert.Open.value,
						NewAlert: bucket.NewAlert.New.value
					});
				}
			});

			finalData.alarmByCustomer.sort(function (a, b) {
				var keyA = new Date(a.Value),
					keyB = new Date(b.Value);
				// Compare the 2 dates
				if (keyA > keyB) return -1;
				if (keyA < keyB) return 1;
				return 0;
			});
			if (reply.request.query.customerTop == "false") {
				finalData.alarmByCustomer = finalData.alarmByCustomer.reverse();
			}
			finalData.alarmByCustomer = finalData.alarmByCustomer.splice(0, 10);


			return reply({
				success: true,
				data: finalData
			});

		}, function (err) {
			console.trace(err.message);
			return reply(Boom.badRequest(err.message));
		});

	}
}