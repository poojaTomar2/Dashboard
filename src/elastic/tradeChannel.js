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
var smartDevicHealthReducer = require('../controllers/reducers/smartDeviceHealthRecord');
var smartDevicePowerReducer = require('../controllers/reducers/smartDevicePowerRecord');
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
		assetSummary: JSON.stringify(require('./dashboardQueries/tradeChannel/salesAssetSummary.json')),
		locationSummary: JSON.stringify(require('./dashboardQueries/tradeChannel/kpilocationSummary.json')),
		locationTypeSummary: JSON.stringify(require('./dashboardQueries/tradeChannel/locationtypeSummary.json')),
		momentSummary: JSON.stringify(require('./dashboardQueries/tradeChannel/kpiMovementSummary.json')),
		visitSummary: JSON.stringify(require('./dashboardQueries/tradeChannel/kpiVisitSummary.json')),
		powerSummary: JSON.stringify(require('./dashboardQueries/tradeChannel/powerSummary.json')),
		assetVisitSummary: JSON.stringify(require('./dashboardQueries/tradeChannel/assetVisitSummary.json')),
		doorSummary: JSON.stringify(require('./dashboardQueries/tradeChannel/doorSummary.json')),
		alertSummary: JSON.stringify(require('./dashboardQueries/tradeChannel/alertSummary.json')),
		kpiSalesSummary: JSON.stringify(require('./dashboardQueries/tradeChannel/kpiSalesSummary.json')),
		kpiSalesSummaryTrend: JSON.stringify(require('./dashboardQueries/tradeChannel/kpiSalesSummaryTrend.json')),
		TotalAssetLocation: JSON.stringify(require('./dashboardQueries/TotalAssetLocation.json'))
	},

	getTradeChannelWidgetData: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload),
			alertSummary = JSON.parse(this.dashboardQueries.alertSummary),
			assetSummary = JSON.parse(this.dashboardQueries.assetSummary),
			//totalAssetLocation = JSON.parse(this.dashboardQueries.TotalAssetLocation),
			doorSummary = JSON.parse(this.dashboardQueries.doorSummary),
			powerSummary = JSON.parse(this.dashboardQueries.powerSummary),
			locationSummary = JSON.parse(this.dashboardQueries.locationSummary),
			locationTypeSummary = JSON.parse(this.dashboardQueries.locationTypeSummary),
			momentSummary = JSON.parse(this.dashboardQueries.momentSummary),
			visitSummary = JSON.parse(this.dashboardQueries.visitSummary),
			kpiSalesSummary = JSON.parse(this.dashboardQueries.kpiSalesSummary),
			kpiSalesSummaryTrend = JSON.parse(this.dashboardQueries.kpiSalesSummaryTrend),
			assetVisitSummary = JSON.parse(this.dashboardQueries.assetVisitSummary);
		// client Filter
		var clientQuery = {
			"term": {
				"ClientId": clientId
			}
		};
		if (clientId != 0) {
			alertSummary.query.bool.must.push(clientQuery);
			assetSummary.query.bool.filter.push(clientQuery);
			//totalAssetLocation.query.bool.filter.push(clientQuery);
			doorSummary.query.bool.filter.push(clientQuery);
			locationSummary.query.bool.filter.push(clientQuery);
			powerSummary.query.bool.filter.push(clientQuery);
			assetVisitSummary.query.bool.filter.push(clientQuery);
			momentSummary.query.bool.filter.push(clientQuery);
			visitSummary.query.bool.filter.push(clientQuery);
			kpiSalesSummary.query.bool.filter.push(clientQuery);
			kpiSalesSummaryTrend.query.bool.filter.push(clientQuery);
			locationTypeSummary.query.bool.filter.push(clientQuery);
		}
		//EventDate Filter
		var isDefaultDateFilter = params.yearWeek || params.dayOfWeek || params.quarter || params.month;
		var dateFilter = [];
		var dateFilterTrend = [];
		var totalHours = 0;
		var months = 0;
		assetVisitSummary.query.bool.filter.push({
			"bool": {
				"should": []
			}
		});
		kpiSalesSummary.query.bool.filter.push({
			"bool": {
				"should": []
			}
		});
		powerSummary.query.bool.filter.push({
			"bool": {
				"should": []
			}
		});
		doorSummary.query.bool.filter.push({
			"bool": {
				"should": []
			}
		});
		alertSummary.query.bool["filter"] = {
			"bool": {
				"should": []
			}
		};
		visitSummary.query.bool.filter.push({
			"bool": {
				"should": []
			}
		});

		if (!isDefaultDateFilter && !params.startDate && !params.endDate) {
			var dateRangeQuery = {
				"range": {
					"EventDate": {
						"gte": "now-30d/d"
					}
				}
			};
			kpiSalesSummary.query.bool.filter.push({
				"range": {
					"EventDate": {
						"gte": "now-30d/d"
					}
				}
			});
			kpiSalesSummaryTrend.query.bool.filter.push({
				"range": {
					"EventDate": {
						"gte": "now-60d/d",
						"lte": "now-30d/d"
					}
				}
			});
			powerSummary.query.bool.filter.push(dateRangeQuery);
			doorSummary.query.bool.filter.push(dateRangeQuery);
			assetVisitSummary.query.bool.filter.push({
				"range": {
					"EventDate": {
						"gte": "now-30d/d"
					}
				}
			});
			alertSummary.query.bool.must.push({
				"range": {
					"EventDate": {
						"gte": "now-30d/d"
					}
				}
			});
			visitSummary.query.bool.filter.push({
				"range": {
					"EventDate": {
						"gte": "now-30d/d"
					}
				}
			});
			momentSummary.query.bool.filter.push(dateRangeQuery);
			totalHours = defaultHours;
			months = 1;
		} else if (!isDefaultDateFilter && params.startDate && params.endDate) {
			var startDate = moment(params.startDate).format('YYYY-MM-DD[T00:00:00]');
			var endDate = moment(params.endDate).format('YYYY-MM-DD[T23:59:59]');
			var duration = moment.duration(moment(endDate).diff(moment(startDate))).asDays();

			var startDateTrend = moment.utc(startDate).subtract(duration, 'd').format('YYYY-MM-DD[T00:00:00]');
			var endDateTrend = moment.utc(startDate).subtract(1, 'd').format('YYYY-MM-DD[T23:59:59]');
			var dateRangeQuery = {
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			powerSummary.query.bool.filter.push(dateRangeQuery);
			doorSummary.query.bool.filter.push(dateRangeQuery);
			alertSummary.query.bool.must.push({
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});
			assetVisitSummary.query.bool.filter.push({
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});
			visitSummary.query.bool.filter.push({
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});
			kpiSalesSummary.query.bool.filter.push({
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});
			kpiSalesSummaryTrend.query.bool.filter.push({
				"range": {
					"EventDate": {
						"gte": startDateTrend,
						"lte": endDateTrend
					}
				}
			});
			momentSummary.query.bool.filter.push(dateRangeQuery);
			totalHours = moment(endDate).diff(moment(startDate), 'hours') + 1;
			months = moment(endDate).diff(moment(startDate), 'months', true);
		}

		var quarterArr = [];
		var monthArr = [];

		if (params.quarter && !params.month) {
			dateFilter.push.apply(dateFilter, util.getDateFromMonth(Array.isArray(params.quarter) ? params.quarter : [params.quarter], true, params.dayOfWeek, params.yearWeek ? Array.isArray(params.yearWeek) ? params.yearWeek : [params.yearWeek] : params.yearWeek, false));
			if (Array.isArray(params.quarter)) {
				var length = params.quarter.length;
				params.quarter.forEach(function (data) {
					data = data - length;
					quarterArr.push(data)
				});
			}
			dateFilterTrend.push.apply(dateFilterTrend, util.getDateFromMonth(Array.isArray(params.quarter) ? quarterArr : [params.quarter - 1], true, params.dayOfWeek, params.yearWeek ? Array.isArray(params.yearWeek) ? params.yearWeek : [params.yearWeek] : params.yearWeek, true));
		} else if (params.month) {
			dateFilter.push.apply(dateFilter, util.getDateFromMonth(Array.isArray(params.month) ? params.month : [params.month], false, params.dayOfWeek, params.yearWeek ? Array.isArray(params.yearWeek) ? params.yearWeek : [params.yearWeek] : params.yearWeek, false));
			if (Array.isArray(params.month)) {
				var length = params.month.length;
				params.month.forEach(function (data) {
					data = data - length;
					monthArr.push(data)
				});
			}
			dateFilterTrend.push.apply(dateFilterTrend, util.getDateFromMonth(Array.isArray(params.month) ? monthArr : [params.month - 1], false, params.dayOfWeek, params.yearWeek ? Array.isArray(params.yearWeek) ? params.yearWeek : [params.yearWeek] : params.yearWeek, true));
		} else if (params.yearWeek) {
			if (Array.isArray(params.yearWeek)) {
				for (var i = 0, len = params.yearWeek.length; i < len; i++) {
					dateFilter.push.apply(dateFilter, util.getDateFromWeekDay(params.yearWeek[i], params.dayOfWeek));
					dateFilterTrend.push.apply(dateFilterTrend, util.getDateFromWeekDay(params.yearWeek[i] - len, params.dayOfWeek));
				}
			} else {
				dateFilter.push.apply(dateFilter, util.getDateFromWeekDay(params.yearWeek, params.dayOfWeek));
				dateFilterTrend.push.apply(dateFilterTrend, util.getDateFromWeekDay(params.yearWeek - 1, params.dayOfWeek));
			}
		} else if (params.dayOfWeek) {
			var startWeek = moment.utc(params.startDate).week();
			var endWeek = moment.utc(params.endDate).week();
			for (var i = startWeek; i <= endWeek; i++) {
				dateFilter.push.apply(dateFilter, util.getDateFromWeekDay(i, params.dayOfWeek, moment(params.startDate)));
			}
			var startWeekTrend = moment.utc(params.startDate).week() - 1;
			var endWeekTrend = moment.utc(params.endDate).week() - 1;
			for (var i = startWeekTrend; i <= endWeekTrend; i++) {
				dateFilterTrend.push.apply(dateFilterTrend, util.getDateFromWeekDay(i, params.dayOfWeek, moment(params.startWeekTrend)));
			}
		}

		for (var i = 0, len = dateFilter.length; i < len; i++) {
			var filterDate = dateFilter[i];
			var startDate = filterDate.startDate,
				endDate = filterDate.endDate;
			totalHours += filterDate.totalHours;
			months += filterDate.months;
			var dateRangeQuery = {
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			kpiSalesSummary = util.pushDateQuery(kpiSalesSummary, {
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});
			powerSummary = util.pushDateQuery(powerSummary, dateRangeQuery);
			//doorSummary.query.bool.filter.push(dateRangeQuery);
			doorSummary = util.pushDateQuery(doorSummary, dateRangeQuery);
			assetVisitSummary = util.pushDateQuery(assetVisitSummary, {
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});

			alertSummary.query.bool.filter.bool.should.push({
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});
			visitSummary = util.pushDateQuery(visitSummary, {
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});

			momentSummary = util.pushDateQuery(momentSummary, dateRangeQuery);
		}

		for (var i = 0, len = dateFilterTrend.length; i < len; i++) {
			var filterDate = dateFilterTrend[i];
			var startDateTrend = filterDate.startDate,
				endDateTrend = filterDate.endDate;
			if (i == 0) {
				kpiSalesSummaryTrend.query.bool.filter.push({
					"bool": {
						"should": []
					}
				});
			}

			var kpiSalesSummaryRange = {
				"range": {
					"EventDate": {
						"gte": startDateTrend,
						"lte": endDateTrend
					}
				}
			};
			kpiSalesSummaryTrend = util.pushDateQuery(kpiSalesSummaryTrend, kpiSalesSummaryRange);
		}

		this.dateFilter = dateFilter;
		this.dateFilterTrend = dateFilterTrend;

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
			assetSummary.query.bool.filter.push(countryIdsUser);
			//totalAssetLocation.query.bool.filter.push(countryIdsUser);
			locationSummary.query.bool.filter.push(countryIdsUser);
			powerSummary.query.bool.filter.push(countryIdsUser);
			doorSummary.query.bool.filter.push(countryIdsUser);
			assetVisitSummary.query.bool.filter.push(countryIdsUser);
			momentSummary.query.bool.filter.push(countryIdsUser);
			visitSummary.query.bool.filter.push(countryIdsUser);
			alertSummary.query.bool.must.push(countryIdsUser);
			kpiSalesSummary.query.bool.filter.push(countryIdsUser);
			kpiSalesSummaryTrend.query.bool.filter.push(countryIdsUser);
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
			assetSummary.query.bool.filter.push(filterQuery);
			//totalAssetLocation.query.bool.filter.push(filterQuery);
			locationSummary.query.bool.filter.push(filterQuery);
			powerSummary.query.bool.filter.push(filterQuery);
			doorSummary.query.bool.filter.push(filterQuery);
			assetVisitSummary.query.bool.filter.push(filterQuery);
			momentSummary.query.bool.filter.push(filterQuery);
			visitSummary.query.bool.filter.push(filterQuery);
			alertSummary.query.bool.must.push(filterQuery);
			kpiSalesSummary.query.bool.filter.push(filterQuery);
			kpiSalesSummaryTrend.query.bool.filter.push(filterQuery);
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

			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetIds);
			assetSummary.aggs.AssetCountTotal.filter.bool.must.push(AssetIds);
			assetSummary.aggs.Locations.filter.bool.must.push(AssetIds);
			powerSummary.query.bool.filter.push(AssetIds);
			doorSummary.query.bool.filter.push(AssetIds);
			assetVisitSummary.query.bool.filter.push(AssetIds);
			momentSummary.query.bool.filter.push(AssetIds);
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

			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(LocationIds);
			assetSummary.aggs.AssetCountTotal.filter.bool.must.push(LocationIds);
			assetSummary.aggs.Locations.filter.bool.must.push(LocationIds);
			powerSummary.query.bool.filter.push(LocationIds);
			doorSummary.query.bool.filter.push(LocationIds);
			assetVisitSummary.query.bool.filter.push(LocationIds);
			momentSummary.query.bool.filter.push(LocationIds);
			alertSummary.query.bool.must.push(LocationIds);
		}

		if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
			var smartDeviceTypeQuery = {
				"terms": {
					"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
				}
			}
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(smartDeviceTypeQuery);
			assetSummary.aggs.AssetCountTotal.filter.bool.must.push(smartDeviceTypeQuery);
			assetSummary.aggs.Locations.filter.bool.must.push(smartDeviceTypeQuery);
			powerSummary.query.bool.filter.push(smartDeviceTypeQuery);
			doorSummary.query.bool.filter.push(smartDeviceTypeQuery);
			assetVisitSummary.query.bool.filter.push(smartDeviceTypeQuery);
			momentSummary.query.bool.filter.push(smartDeviceTypeQuery);
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
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(IsKeyLocationFilter);
			assetSummary.aggs.AssetCountTotal.filter.bool.must.push(IsKeyLocationFilter);
			assetSummary.aggs.Locations.filter.bool.must.push(IsKeyLocationFilter);
			powerSummary.query.bool.filter.push(IsKeyLocationFilter);
			doorSummary.query.bool.filter.push(IsKeyLocationFilter);
			assetVisitSummary.query.bool.filter.push(IsKeyLocationFilter);
			momentSummary.query.bool.filter.push(IsKeyLocationFilter);
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
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(IsFactoryAssetFilter);
			assetSummary.aggs.AssetCountTotal.filter.bool.must.push(IsFactoryAssetFilter);
			assetSummary.aggs.Locations.filter.bool.must.push(IsFactoryAssetFilter);
			powerSummary.query.bool.filter.push(IsFactoryAssetFilter);
			doorSummary.query.bool.filter.push(IsFactoryAssetFilter);
			assetVisitSummary.query.bool.filter.push(IsFactoryAssetFilter);
			momentSummary.query.bool.filter.push(IsFactoryAssetFilter);
			alertSummary.query.bool.must.push(IsFactoryAssetFilter);
		}

		if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
			var assetManufactureQuery = {
				"terms": {
					"AssetManufactureId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
				}
			}
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetManufactureQuery);
			assetSummary.aggs.AssetCountTotal.filter.bool.must.push(assetManufactureQuery);
			assetSummary.aggs.Locations.filter.bool.must.push(assetManufactureQuery);
			powerSummary.query.bool.filter.push(assetManufactureQuery);
			doorSummary.query.bool.filter.push(assetManufactureQuery);
			assetVisitSummary.query.bool.filter.push(assetManufactureQuery);
			momentSummary.query.bool.filter.push(assetManufactureQuery);
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
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(SalesHierarchyId);
			assetSummary.aggs.AssetCountTotal.filter.bool.must.push(SalesHierarchyId);
			assetSummary.aggs.Locations.filter.bool.must.push(SalesHierarchyId);
			powerSummary.query.bool.filter.push(SalesHierarchyId);
			doorSummary.query.bool.filter.push(SalesHierarchyId);
			assetVisitSummary.query.bool.filter.push(SalesHierarchyId);
			momentSummary.query.bool.filter.push(SalesHierarchyId);
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
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerSmartDeviceQuery);
			assetSummary.aggs.AssetCountTotal.filter.bool.must.push(manufacturerSmartDeviceQuery);
			assetSummary.aggs.Locations.filter.bool.must.push(manufacturerSmartDeviceQuery);
			powerSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
			doorSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
			assetVisitSummary.query.bool.filter.push(manufacturerOutletTypeId);
			momentSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
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
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerOutletTypeId);
			assetSummary.aggs.AssetCountTotal.filter.bool.must.push(manufacturerOutletTypeId);
			assetSummary.aggs.Locations.filter.bool.must.push(manufacturerOutletTypeId);
			powerSummary.query.bool.filter.push(manufacturerOutletTypeId);
			doorSummary.query.bool.filter.push(manufacturerOutletTypeId);
			assetVisitSummary.query.bool.filter.push(manufacturerOutletTypeId);
			momentSummary.query.bool.filter.push(manufacturerOutletTypeId);
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
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(LocationTypeId);
			assetSummary.aggs.AssetCountTotal.filter.bool.must.push(LocationTypeId);
			assetSummary.aggs.Locations.filter.bool.must.push(LocationTypeId);
			powerSummary.query.bool.filter.push(LocationTypeId);
			doorSummary.query.bool.filter.push(LocationTypeId);
			assetVisitSummary.query.bool.filter.push(LocationTypeId);
			momentSummary.query.bool.filter.push(LocationTypeId);
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
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(ClassificationId);
			assetSummary.aggs.AssetCountTotal.filter.bool.must.push(ClassificationId);
			assetSummary.aggs.Locations.filter.bool.must.push(ClassificationId);
			powerSummary.query.bool.filter.push(ClassificationId);
			doorSummary.query.bool.filter.push(ClassificationId);
			assetVisitSummary.query.bool.filter.push(ClassificationId);
			momentSummary.query.bool.filter.push(ClassificationId);
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
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(SubTradeChannelTypeId);
			assetSummary.aggs.AssetCountTotal.filter.bool.must.push(SubTradeChannelTypeId);
			assetSummary.aggs.Locations.filter.bool.must.push(SubTradeChannelTypeId);
			powerSummary.query.bool.filter.push(SubTradeChannelTypeId);
			doorSummary.query.bool.filter.push(SubTradeChannelTypeId);
			assetVisitSummary.query.bool.filter.push(SubTradeChannelTypeId);
			momentSummary.query.bool.filter.push(SubTradeChannelTypeId);
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
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetManufactureId);
			assetSummary.aggs.AssetCountTotal.filter.bool.must.push(AssetManufactureId);
			assetSummary.aggs.Locations.filter.bool.must.push(AssetManufactureId);
			powerSummary.query.bool.filter.push(AssetManufactureId);
			doorSummary.query.bool.filter.push(AssetManufactureId);
			assetVisitSummary.query.bool.filter.push(AssetManufactureId);
			momentSummary.query.bool.filter.push(AssetManufactureId);
			alertSummary.query.bool.must.push(AssetManufactureId);
		}

		if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
			var AssetTypeId = {
				"terms": {
					"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
				}
			}
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetTypeId);
			assetSummary.aggs.AssetCountTotal.filter.bool.must.push(AssetTypeId);
			assetSummary.aggs.Locations.filter.bool.must.push(AssetTypeId);
			powerSummary.query.bool.filter.push(AssetTypeId);
			doorSummary.query.bool.filter.push(AssetTypeId);
			assetVisitSummary.query.bool.filter.push(AssetTypeId);
			momentSummary.query.bool.filter.push(AssetTypeId);
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
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(SmartDeviceTypeId);
			assetSummary.aggs.AssetCountTotal.filter.bool.must.push(SmartDeviceTypeId);
			assetSummary.aggs.Locations.filter.bool.must.push(SmartDeviceTypeId);
			powerSummary.query.bool.filter.push(SmartDeviceTypeId);
			doorSummary.query.bool.filter.push(SmartDeviceTypeId);
			assetVisitSummary.query.bool.filter.push(SmartDeviceTypeId);
			momentSummary.query.bool.filter.push(SmartDeviceTypeId);
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
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(City);
			assetSummary.aggs.AssetCountTotal.filter.bool.must.push(City);
			assetSummary.aggs.Locations.filter.bool.must.push(City);
			powerSummary.query.bool.filter.push(City);
			doorSummary.query.bool.filter.push(City);
			assetVisitSummary.query.bool.filter.push(City);
			momentSummary.query.bool.filter.push(City);
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
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(CountryId);
			assetSummary.aggs.AssetCountTotal.filter.bool.must.push(CountryId);
			assetSummary.aggs.Locations.filter.bool.must.push(CountryId);
			powerSummary.query.bool.filter.push(CountryId);
			doorSummary.query.bool.filter.push(CountryId);
			assetVisitSummary.query.bool.filter.push(CountryId);
			momentSummary.query.bool.filter.push(CountryId);
			alertSummary.query.bool.must.push(CountryId);
		}

		if (request.query.LocationCode || request.query["LocationCode[]"]) {
			var LocationCode = {
				"term": {
					"LocationCode": request.query.LocationCode || request.query["LocationCode[]"]
				}
			}
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(LocationCode);
			assetSummary.aggs.AssetCountTotal.filter.bool.must.push(LocationCode);
			assetSummary.aggs.Locations.filter.bool.must.push(LocationCode);
			powerSummary.query.bool.filter.push(LocationCode);
			doorSummary.query.bool.filter.push(LocationCode);
			assetVisitSummary.query.bool.filter.push(LocationCode);
			momentSummary.query.bool.filter.push(LocationCode);
			alertSummary.query.bool.must.push(LocationCode);
		}

		var queries = [{
				key: "powerEvents",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					type: ["AssetEventDataSummary"],
					body: powerSummary,
					ignore_unavailable: true
				}
			}, {
				key: "doorData",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					type: ["AssetEventDataSummary"],
					body: doorSummary,
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
			}, {
				key: "location",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					type: ["AssetEventDataSummary"],
					body: locationSummary,
					ignore_unavailable: true
				}
			}, {
				key: "assetVisit",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					type: ["AssetEventDataSummary"],
					body: assetVisitSummary,
					ignore_unavailable: true
				}
			}, {
				key: "movement",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					type: ["AssetEventDataSummary"],
					body: momentSummary,
					ignore_unavailable: true
				}
			}, {
				key: "visit",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					type: ["AssetEventDataSummary"],
					body: visitSummary,
					ignore_unavailable: true
				}
			}, {
				key: "alert",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					type: ["AssetEventDataSummary"],
					body: alertSummary,
					ignore_unavailable: true
				}
			}, {
				key: "sales",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					type: ["AssetEventDataSummary"],
					body: kpiSalesSummary,
					ignore_unavailable: true
				}
			}, {
				key: "salesTrend",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					type: ["AssetEventDataSummary"],
					body: kpiSalesSummaryTrend,
					ignore_unavailable: true
				}
			}, {
				key: "locationType",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					type: ["AssetEventDataSummary"],
					body: locationTypeSummary,
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
		var getMedian = _this.getMedian;
		Promise.all(promises).then(function (values) {
			var data = {},
				finalData = {
					outletCountByTier: [],
					assetCountByTier: [],
					cdeTracking: [],
					routeCompliance: [],
					coolerStatus: [],
					outletPerformance: [],
					activityGrid: []
				};
			for (var i = 0, len = values.length; i < len; i++) {
				var value = values[i];
				data[value.config.key] = value.response;
				util.setLogger(value);
			}
			var alertAggs = data.alert.aggregations,
				assetVisitAggs = data.assetVisit.aggregations,
				dbAggs = data.db.aggregations,
				doorAggs = data.doorData.aggregations,
				movementAggs = data.movement.aggregations,
				powerAgggs = data.powerEvents.aggregations,
				//totalAssetLocation = data.totalAssetLocation.aggregations,
				salesAggs = data.sales.aggregations,
				salesTrendAggs = data.salesTrend.aggregations,
				visitAggs = data.visit.aggregations,
				locationType = data.locationType.aggregations.LocationType.buckets;

			var locationData = []
			data.location.aggregations.LocationBucket.buckets.forEach(function (locationBucket) {
				locationData.push(locationBucket.LocationId.hits.hits[0]._source);
			});
			var classificationLocation = dbAggs.AssetCountTotal.ByChanneloutlet.buckets;
			var classificationAsset = dbAggs.AssetCountTotal.ByChannel.buckets;
			var totalAssets = dbAggs.AssetCount.AssetCount.buckets.length;

			for (var o in classificationLocation) {
				if (o !== "doc_count") {
					finalData.outletCountByTier.push({
						name: classificationLocation[o].key ? classificationLocation[o].key : 'No Tier',
						y: classificationLocation[o].Locations.value
					});
				}
			}
			for (var o in classificationAsset) {
				if (o !== "doc_count") {
					finalData.assetCountByTier.push({
						name: classificationAsset[o].key ? classificationAsset[o].key : 'No Tier',
						y: classificationAsset[o].Locations.value
					});
				}
			}

			var locationTypeData = []
			locationType.forEach(function (locationTypeBucket) {
				locationTypeData.push(locationTypeBucket.LocationType.hits.hits[0]._source);
			});
			locationTypeData.push({
				Name: 'No Tier',
				LocationTypeId: 0
			});

			var missingCooler = 0,
				source, locationDataMissing, cdeTrackingMatched, index, locationDataMovement;

			if (assetVisitAggs) {
				assetVisitAggs.LocationType.buckets.forEach(function (bucket) {
					cdeTrackingMatched = finalData.cdeTracking.filter(data => data.LocationTypeId == bucket.key);
					var locationType = locationTypeData.filter(data => data.LocationTypeId == bucket.key);
					if (locationType.length > 0) {
						locationType = locationType[0].LocationName
					} else {
						locationType = 'No Tier';
						cdeTrackingMatched = finalData.cdeTracking.filter(data => data.TradeChannel == locationType);
					}
					//if (locationDataMissing[0]) {
					if (cdeTrackingMatched.length == 0) {
						finalData.cdeTracking.push({
							"TradeChannel": locationType,
							"LocationTypeId": bucket.key,
							"MissingCooler": bucket.doc_count,
							"CoolerMovement": '',
							"AssetCount": dbAggs.AssetCount.AssetCount.buckets.length
						})
					} else {
						index = finalData.cdeTracking.indexOf(cdeTrackingMatched[0]);
						if (index != -1) {
							finalData.cdeTracking[index].MissingCooler += bucket.doc_count;
						}
					}
					//}
				});
			}

			if (movementAggs) {
				movementAggs.LocationType.buckets.forEach(function (bucket) {
					cdeTrackingMatched = finalData.cdeTracking.filter(data => data.LocationTypeId == bucket.key);
					var locationType = locationTypeData.filter(data => data.LocationTypeId == bucket.key);
					if (locationType.length > 0) {
						locationType = locationType[0].LocationName
					} else {
						locationType = 'No Tier';
						cdeTrackingMatched = finalData.cdeTracking.filter(data => data.TradeChannel == locationType);
					}
					if (cdeTrackingMatched.length == 0) {
						finalData.cdeTracking.push({
							"TradeChannel": locationType,
							"MissingCooler": '',
							"LocationTypeId": bucket.key,
							"CoolerMovement": bucket.AssetCount.value,
							"AssetCount": dbAggs.AssetCount.AssetCount.buckets.length
						})
					} else {
						index = finalData.cdeTracking.indexOf(cdeTrackingMatched[0]);
						if (index != -1) {
							finalData.cdeTracking[index].CoolerMovement += bucket.AssetCount.value;
						}
					}
				});
			}

			// Start : Resolve bug ID 5073 : Joyal : 01-Dec-2016
			for (var i = 0; i < locationTypeData.length; i++) {
				var vrLocation = locationTypeData[i].LocationName;

				if (vrLocation && vrLocation.length > 0) {
					var vrIndexID = finalData.cdeTracking.findIndex(x => x.TradeChannel == vrLocation)

					if (vrIndexID == -1) {
						finalData.cdeTracking.push({
							"TradeChannel": vrLocation,
							"MissingCooler": '',
							"CoolerMovement": '',
							"AssetCount": ''
						})
					}
				}
			}
			// End : Resolve bug ID 5073 : Joyal : 01-Dec-2016

			//var months = moment.duration(totalHours, 'hours').asMonths();
			var locationName, locationDataVisit, routeComplianceMatched, visitCount, sumDuration;

			if (visitAggs) {
				visitAggs.LocationType.buckets.forEach(function (visitData) {
					//locationName = visitData.LocationName.hits.hits[0]._source;
					source = visitData.key;
					visitCount = visitData.doc_count;
					sumDuration = moment.duration(visitData.SumDuration.value, 'seconds').asMinutes();
					routeComplianceMatched = finalData.routeCompliance.filter(data => data.LocationTypeId == visitData.key);
					var locationType = locationTypeData.filter(data => data.LocationTypeId == visitData.key);
					if (locationType.length > 0) {
						locationType = locationType[0].LocationName
					} else {
						locationType = 'No Tier';
						routeComplianceMatched = finalData.routeCompliance.filter(data => data.TradeChannel == locationType);
					}
					if (routeComplianceMatched.length == 0) {
						finalData.routeCompliance.push({
							"TradeChannel": locationType,
							"LocationTypeId": visitData.key,
							"VisitDuration": sumDuration,
							"VisitPerMonth": visitData.doc_count,
							"LocationCount": visitData.LocationCount.value
						})
					} else {
						index = finalData.routeCompliance.indexOf(routeComplianceMatched[0]);
						if (index != -1) {
							finalData.routeCompliance[index].VisitDuration += sumDuration;
							finalData.routeCompliance[index].VisitPerMonth += visitCount;
							finalData.routeCompliance[index].LocationCount += visitData.LocationCount.value;
						}
					}
				});
			}

			finalData.routeCompliance.forEach(function (termBucket) {
				termBucket.VisitDuration = termBucket.VisitDuration ;
				termBucket.VisitPerMonth = termBucket.VisitPerMonth / termBucket.LocationCount / Number(months.toFixed(2));;
			});

			// Start : Resolve bug ID 5073 : Joyal : 01-Dec-2016
			for (var i = 0; i < locationTypeData.length; i++) {
				var vrLocation = locationTypeData[i].LocationName;

				if (vrLocation && vrLocation.length > 0) {
					var vrIndexID = finalData.routeCompliance.findIndex(x => x.TradeChannel == vrLocation)

					if (vrIndexID == -1) {
						finalData.routeCompliance.push({
							"TradeChannel": vrLocation,
							"VisitDuration": '',
							"VisitPerMonth": '',
							"LocationCount": ''
						})
					}
				}
			}
			// End : Resolve bug ID 5073 : Joyal : 01-Dec-2016	

			var alertData, alertDataMatched;

			if (alertAggs) {
				alertAggs.LocationType.LocationType.buckets.forEach(function (bucket) {
					alertDataMatched = finalData.coolerStatus.filter(data => data.LocationTypeId == bucket.key);
					var locationType = locationTypeData.filter(data => data.LocationTypeId == bucket.key);
					if (locationType.length > 0) {
						locationType = locationType[0].LocationName
					} else {
						locationType = 'No Tier';
						alertDataMatched = finalData.coolerStatus.filter(data => data.TradeChannel == locationType);
					}
					if (alertDataMatched.length == 0) {
						finalData.coolerStatus.push({
							"TradeChannel": locationType,
							"LocationTypeId": bucket.key,
							"HourlyDoorOpen": '',
							"DoorOpenDuration": '',
							"TempHours": '',
							"PowerOn": '',
							"PowerOnAsset": '',
							"LightOn": '',
							"DoorAssetCount": '',
							"DoorCount": '',
							"ToalLocation": '',
							"UtilizationRate": bucket.AssetCount.value,
							"AssetCount": dbAggs.AssetCount.AssetCount.buckets.length
						})
					} else {
						index = finalData.coolerStatus.indexOf(alertDataMatched[0]);
						if (index != -1) {
							finalData.coolerStatus[index].UtilizationRate += bucket.AssetCount.value;
							//finalData.coolerStatus[index].UtilizationRate = ((finalData.coolerStatus[index].UtilizationRate / dbAggs.LocationCount.doc_count) * 100).toFixed(2);
						}
					}
				});
			}

			var locationDataHealth, locationDataMatched,
				totalAssets = dbAggs.AssetCount.doc_count;
			var powerOpenHour = 0;
			var powerOffHour = 0;
			var powerDayLength;
			var currentPowerStatus;
			var nextPowerStatus;
			var powerAsset;
			var powerOffDuration = 0;

			if (powerAgggs) {
				powerAgggs.LocationType.buckets.forEach(function (locationBucket) {
					powerAsset = locationBucket.AssetCount.value;
					powerOffHour = moment.duration(locationBucket.PowerOffDuration.value, 'second').asHours();
					powerOpenHour = (totalHours * powerAsset - powerOffHour);
					locationDataMatched = finalData.coolerStatus.filter(data => data.LocationTypeId == locationBucket.key);
					var locationType = locationTypeData.filter(data => data.LocationTypeId == locationBucket.key);
					if (locationType.length > 0) {
						locationType = locationType[0].LocationName
					} else {
						locationType = 'No Tier';
						locationDataMatched = finalData.coolerStatus.filter(data => data.TradeChannel == locationType);
					}
					if (locationDataMatched.length == 0) {
						finalData.coolerStatus.push({
							"TradeChannel": locationType,
							"LocationTypeId": locationBucket.key,
							"HourlyDoorOpen": '',
							"DoorOpenDuration": '',
							"TempHours": '',
							"PowerOn": powerOpenHour,
							"PowerOnAsset": powerAsset,
							"LightOn": '',
							"UtilizationRate": '',
							"DoorAssetCount": '',
							"DoorCount": '',
							"ToalLocation": '',
							"AssetCount": dbAggs.AssetCount.AssetCount.buckets.length
						})
					} else {
						index = finalData.coolerStatus.indexOf(locationDataMatched[0]);
						if (index != -1) {
							finalData.coolerStatus[index].PowerOn = finalData.coolerStatus[index].PowerOn ? finalData.coolerStatus[index].PowerOn : 0;
							finalData.coolerStatus[index].PowerOn += powerOpenHour;
							finalData.coolerStatus[index].PowerOnAsset += locationBucket.AssetCount.value;
							//finalData.coolerStatus[index].PowerOn = Number(((finalData.coolerStatus[index].PowerOn / data.powerEvents.aggregations.LocationBucket.buckets.length) / moment.duration(totalHours, 'hours').asDays()).toLocaleString());
						}
					}
				});
			}

			if (doorAggs) {
				doorAggs.LocationType.buckets.forEach(function (locationBucket) {
					locationDataMatched = finalData.coolerStatus.filter(data => data.LocationTypeId == locationBucket.key);
					var locationType = locationTypeData.filter(data => data.LocationTypeId == locationBucket.key);
					if (locationType.length > 0) {
						locationType = locationType[0].LocationName
					} else {
						locationType = 'No Tier';
						locationDataMatched = finalData.coolerStatus.filter(data => data.TradeChannel == locationType);
					}
					if (locationDataMatched.length == 0) {
						finalData.coolerStatus.push({
							"TradeChannel": locationType,
							"LocationTypeId": locationBucket.key,
							"HourlyDoorOpen": locationBucket.DoorCount.value,
							"DoorOpenDuration": locationBucket.SumDoorOpenDuration.DoorSum.value,
							"TempHours": '',
							"PowerOn": '',
							"PowerOnAsset": '',
							"LightOn": '',
							"UtilizationRate": '',
							"DoorAssetCount": locationBucket.AssetCount.value,
							"DoorCount": locationBucket.DoorCount.value,
							"ToalLocation": data.doorData.aggregations.LocationCount.value,
							"AssetCount": dbAggs.AssetCount.AssetCount.buckets.length
						});
					} else {
						index = finalData.coolerStatus.indexOf(locationDataMatched[0]);
						if (index != -1) {
							finalData.coolerStatus[index].HourlyDoorOpen = finalData.coolerStatus[index].HourlyDoorOpen ? finalData.coolerStatus[index].HourlyDoorOpen : 0;
							finalData.coolerStatus[index].HourlyDoorOpen += locationBucket.DoorCount.value;

							finalData.coolerStatus[index].DoorCount = finalData.coolerStatus[index].DoorCount ? finalData.coolerStatus[index].DoorCount : 0;
							finalData.coolerStatus[index].DoorCount += locationBucket.DoorCount.value;

							finalData.coolerStatus[index].DoorAssetCount = finalData.coolerStatus[index].DoorAssetCount ? finalData.coolerStatus[index].DoorAssetCount : 0;
							finalData.coolerStatus[index].DoorAssetCount += locationBucket.AssetCount.value;

							finalData.coolerStatus[index].ToalLocation = finalData.coolerStatus[index].ToalLocation ? finalData.coolerStatus[index].ToalLocation : 0;
							finalData.coolerStatus[index].ToalLocation += data.doorData.aggregations.LocationCount.value;
							//	finalData.coolerStatus[index].HourlyDoorOpen = Number(((finalData.coolerStatus[index].HourlyDoorOpen / data.doorData.aggregations.LocationCount.value) / totalHours).toFixed(2));

							finalData.coolerStatus[index].DoorOpenDuration = finalData.coolerStatus[index].DoorOpenDuration ? finalData.coolerStatus[index].DoorOpenDuration : 0;
							finalData.coolerStatus[index].DoorOpenDuration += locationBucket.SumDoorOpenDuration.DoorSum.value;
							//finalData.coolerStatus[index].DoorOpenDuration = Number(((finalData.coolerStatus[index].DoorOpenDuration / locationBucket.doc_count)).toFixed(2));
						}
					}
				});
			}

			finalData.coolerStatus.forEach(function (termBucket) {
				termBucket.DoorOpenDuration = termBucket.DoorOpenDuration / termBucket.HourlyDoorOpen;
				termBucket.HourlyDoorOpen = termBucket.DoorCount / termBucket.DoorAssetCount / totalHours;
				termBucket.UtilizationRate = (termBucket.UtilizationRate / dbAggs.AssetCount.AssetCount.buckets.length) * 100;
				termBucket.PowerOn = (termBucket.PowerOn / termBucket.PowerOnAsset) / moment.duration(totalHours, 'hours').asDays();
				termBucket.PowerOn = termBucket.PowerOn > 24 ? 24 : termBucket.PowerOn < 0 ? 0 : termBucket.PowerOn;
				if (termBucket.DoorOpenDuration == 0 && termBucket.HourlyDoorOpen >= 0) {
					termBucket.DoorOpenDuration = 'NAN'
				}
			});

			// Start : Resolve bug ID 5073 : Joyal : 05-Dec-2016
			for (var i = 0; i < locationTypeData.length; i++) {
				var vrCEDUtilization = locationTypeData[i].LocationName;

				if (vrCEDUtilization && vrCEDUtilization.length > 0) {
					var vrIndexID = finalData.coolerStatus.findIndex(x => x.TradeChannel == vrCEDUtilization)

					if (vrIndexID == -1) {
						finalData.coolerStatus.push({
							"TradeChannel": vrCEDUtilization,
							"HourlyDoorOpen": '',
							"DoorOpenDuration": '',
							"TempHours": '',
							"PowerOn": '',
							"PowerOnAsset": '',
							"LightOn": '',
							"UtilizationRate": '',
							"DoorAssetCount": '',
							"DoorCount": '',
							"ToalLocation": '',
							"AssetCount": ''
						});
					}
				}
			}
			// End : Resolve bug ID 5073 : Joyal : 05-Dec-2016
			if (salesAggs) {
				salesAggs.LocationType.buckets.forEach(function (locationBucket) {
					locationDataMatched = finalData.outletPerformance.filter(data => data.LocationTypeId == locationBucket.key);
					var locationType = locationTypeData.filter(data => data.LocationTypeId == locationBucket.key);
					if (locationType.length > 0) {
						locationType = locationType[0].LocationName
					} else {
						locationType = 'No Tier';
						locationDataMatched = finalData.outletPerformance.filter(data => data.TradeChannel == locationType);
					}
					if (locationDataMatched.length == 0) {
						finalData.outletPerformance.push({
							"TradeChannel": locationType,
							"SalesVolume": locationBucket.SalesVolume.value,
							"LocationTypeId": locationBucket.key,
							"TotalLocation": locationBucket.LocationCount.value,
							"Trend": ''
						})
					} else {
						index = finalData.outletPerformance.indexOf(locationDataMatched[0]);
						if (index != -1) {
							finalData.outletPerformance[index].SalesVolume += locationBucket.SalesVolume.value;
							finalData.outletPerformance[index].TotalLocation += locationBucket.LocationCount.value;
						}
					}
				});
			}

			// Start : Resolve bug ID 5074 : Joyal : 06-Dec-2016
			if (salesTrendAggs) {
				salesTrendAggs.LocationType.buckets.forEach(function (locationBucket) {
					locationDataMatched = finalData.outletPerformance.filter(data => data.LocationTypeId == locationBucket.key);
					var locationType = locationTypeData.filter(data => data.LocationTypeId == locationBucket.key);
					if (locationType.length > 0) {
						locationType = locationType[0].LocationName
					} else {
						locationType = 'No Tier';
						locationDataMatched = finalData.outletPerformance.filter(data => data.TradeChannel == locationType);
					}
					if (locationDataMatched.length == 0) {
						finalData.outletPerformance.push({
							"TradeChannel": locationType,
							"LocationTypeId": locationBucket.key,
							"SalesVolume": '',
							"TotalLocation": locationBucket.LocationCount.value,
							"Trend": locationBucket.SalesVolume.value
						})
					} else {
						index = finalData.outletPerformance.indexOf(locationDataMatched[0]);
						if (index != -1) {
							finalData.outletPerformance[index].Trend = finalData.outletPerformance[index].Trend ? finalData.outletPerformance[index].Trend : 0;
							finalData.outletPerformance[index].Trend += locationBucket.SalesVolume.value;
						}
					}
				});
			}

			for (var i = 0; i < finalData.outletPerformance.length; i++) {
				var vrSalesVolume = finalData.outletPerformance[i].SalesVolume;
				var vrSalesTrend = finalData.outletPerformance[i].Trend;

				var vrTrend = vrSalesVolume - vrSalesTrend;

				vrTrend = vrTrend != 0 && vrSalesTrend != 0 ? (vrTrend / vrSalesTrend) * 100 : 0;

				finalData.outletPerformance[i].Trend = vrTrend;
			}

			// End : Resolve bug ID 5074 : Joyal : 06-Dec-2016

			// Start : Resolve bug ID 5073 : Joyal : 01-Dec-2016
			for (var i = 0; i < locationTypeData.length; i++) {
				var vrLocation = locationTypeData[i].LocationName;

				if (vrLocation && vrLocation.length > 0) {
					var vrIndexID = finalData.outletPerformance.findIndex(x => x.TradeChannel == vrLocation)

					if (vrIndexID == -1) {
						finalData.outletPerformance.push({
							"TradeChannel": vrLocation,
							"SalesVolume": '',
							"TotalLocation": '',
							"Trend": ''
						})
					}
				}
			}
			// End : Resolve bug ID 5073 : Joyal : 01-Dec-2016

			finalData.coolerStatus.forEach(function (tier) {
				var activityGridData;
				activityGridData = finalData.outletPerformance.filter(data => data.TradeChannel == tier.TradeChannel);
				if (activityGridData.length != 0) {
					finalData.activityGrid.push({
						"TradeChannel": tier.TradeChannel,
						//"DoorOpenHourly": (tier.DoorCount) / (activityGridData[0].SalesVolume * 24),
						"DoorOpenHourly": (tier.DoorCount) / (activityGridData[0].SalesVolume), //  // remove 24 for #11712 tracker
						"DoorCount": tier.DoorCount,
						"SalesVolume": activityGridData[0].SalesVolume
					});
				}
			})

			//Start : Resolve bug ID 5073 : Joyal : 05-Dec-2016
			for (var i = 0; i < locationTypeData.length; i++) {
				var vrActivity = locationTypeData[i].LocationName;

				if (vrActivity && vrActivity.length > 0) {
					var vrIndexID = finalData.activityGrid.findIndex(x => x.TradeChannel == vrActivity)

					if (vrIndexID == -1) {
						finalData.activityGrid.push({
							"TradeChannel": vrActivity,
							"DoorOpenHourly": '',
							"DoorCount": '',
							"SalesVolume": ''

						});
					}
				}
			}
			//End : Resolve bug ID 5073 : Joyal : 05-Dec-2016

			var smartAssetCount = dbAggs.SmartAssetCount.SmartAssetCount.buckets.length;
			finalData.summary = {
				totalCooler: dbAggs.AssetCount.AssetCount.buckets.length,
				totalCustomer: dbAggs.LocationCount.LocationCount.buckets.length,
				filteredAssets: dbAggs.AssetCount.AssetCount.buckets.length,
				filteredOutlets: dbAggs.Locations.Locations.buckets.length,
				totalOutlets: dbAggs.LocationCount.LocationCount.buckets.length,
				locationData: locationData,
				totalSmartAssetCount: dbAggs.SmartAssetCount.SmartAssetCount.buckets.length,
				smartAssetCountWareHouse: dbAggs.SmartAssetCount.SmartAssetCount.buckets.length,
				smartAssetCount: smartAssetCount
			};

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