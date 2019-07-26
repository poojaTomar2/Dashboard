"use strict"
var linq = require('node-linq').LINQ,
	fs = require('fs');

var client = require('../models').elasticClient;
var outletReducer = require('../controllers/reducers/outlet');
var smartDeviceInstallationDateReducer = require('../controllers/reducers/smartDeviceInstallationDate');
var smartDeviceLatestDataReducer = require('../controllers/reducers/smartDeviceLatestData');
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
var log4js = require('log4js');
var sql = require('mssql');
var Sequelize = require('sequelize');
var config = require('../config'),
	sqlConfig = config.sql;
var sequelize = new Sequelize(sqlConfig.database, sqlConfig.user, sqlConfig.password, {
	host: sqlConfig.server,
	dialect: 'mssql',
	dialectOptions: sqlConfig.dialectOptions,
	multipleStatements: true,
	pool: {
		max: 5,
		min: 0,
		idle: 10000
	},
	define: {
		timestamps: false // true by default
	}
});
log4js.configure({
	appenders: [{
			type: 'console'
		},
		{
			type: 'file',
			filename: 'logs/elastic.log',
			category: 'elastic'
		}
	]
});
var logger = log4js.getLogger('elastic');
//var searchIndex = require('../elastic/searchIndex.js');
var defaultHours = 720;
module.exports = {
	getElasticData: function (config) {
		return new Promise(function (resolve, reject) {
			//console.log("StartTime of "+JSON.stringify(config.search)+"" + new EventDate());
			client.search(config.search).then(function (resp) {
				//console.log("endTime of "+JSON.stringify(config.search)+"" + new EventDate());
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

	getSqlData: function (queries) {
		var result = {};
		return new Promise(function (resolve, reject) {
			sequelize.query(queries.sql).then(function (results) {
				resolve({
					response: results[0],
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
		assetSummaryCommercial: JSON.stringify(require('./dashboardQueries/coolerPerformance/kpiAssetSummary.json')),
		kpiSalesSummaryCommercial: JSON.stringify(require('./dashboardQueries/commercial/kpiSalesSummary.json')),
		assetTypeCapacity: JSON.stringify(require('./dashboardQueries/coolerPerformance/assetTypeCapacity.json')),
		DoorAvgDaily: JSON.stringify(require('./dashboardQueries/coolerPerformance/KpiDoorAvgDaily.json')),
		CorrelationLocationInfo: JSON.stringify(require('./dashboardQueries/coolerPerformance/CorrelationLocationInfo.json')),
		TotalAssetLocation: JSON.stringify(require('./dashboardQueries/TotalAssetLocation.json')),
		doorSummaryCoolerPerformance: JSON.stringify(require('./dashboardQueries/coolerPerformance/kpiDoorSummaryPieChart.json')),
		AssetInfo: JSON.stringify(require('./dashboardQueries/coolerPerformance/KpiAssetInfo.json'))
	},
	getKpiWidgetDataForOperationalView: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload),
			assetSummary = JSON.parse(this.dashboardQueries.assetSummaryCommercial),
			assetInfo = JSON.parse(this.dashboardQueries.AssetInfo),
			doorSummary = JSON.parse(this.dashboardQueries.doorSummaryCoolerPerformance),
			//totalAssetLocation = JSON.parse(this.dashboardQueries.TotalAssetLocation),
			DoorAvgDaily = JSON.parse(this.dashboardQueries.DoorAvgDaily),
			kpiSalesSummary = JSON.parse(this.dashboardQueries.kpiSalesSummaryCommercial),
			assetTypeCapacity = JSON.parse(this.dashboardQueries.assetTypeCapacity);
		// client Filter
		var clientQuery = {
			"term": {
				"ClientId": clientId
			}
		};
		if (clientId != 0) {
			assetSummary.query.bool.filter.push(clientQuery);
			assetInfo.query.bool.filter.push(clientQuery);
			//totalAssetLocation.query.bool.filter.push(clientQuery);
			DoorAvgDaily.query.bool.filter.push(clientQuery);
			doorSummary.query.bool.filter.push(clientQuery);
			kpiSalesSummary.query.bool.filter.push(clientQuery);
			assetTypeCapacity.query.bool.filter.push(clientQuery);
		}

		var datesalesselect = params.salesDataSelected ? params.salesDataSelected : 0;
		var datedoorselect = params.doorDataSelected ? params.salesDataSelected : 0;
		//EventDate Filter
		var isDefaultDateFilter = params.yearWeek || params.dayOfWeek || params.quarter || params.month;
		var dateFilter = [];
		var dateFilterTrend = [];
		var totalHours = 0
		var months = 0;
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

			doorSummary.query.bool.filter.push(dateRangeQuery);
			DoorAvgDaily.query.bool.filter.push(dateRangeQuery);
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
			kpiSalesSummary.query.bool.filter.push({
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});

			doorSummary.query.bool.filter.push(dateRangeQuery);
			DoorAvgDaily.query.bool.filter.push(dateRangeQuery);
			//assetSummary.aggs.NonSmartLocation.aggs.Location.aggs.SalesVolume.filter.bool.must.push(dateRangeQuery);
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

			var startWeekTrend = moment.utc(params.startDate).week() - 1;
			var endWeekTrend = moment.utc(params.endDate).week() - 1;

			if (currentYear > startYear) {
				var weekinYear = moment.utc(params.startDate).weeksInYear();
				startWeekTrend = startWeekTrend - weekinYear * (currentYear - startYear);
				endWeekTrend = endWeekTrend - weekinYear * (currentYear - endYear);
			}
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
			if (i == 0) {
				kpiSalesSummary.query.bool.filter.push({
					"bool": {
						"should": []
					}
				});
				doorSummary.query.bool.filter.push({
					"bool": {
						"should": []
					}
				});
				DoorAvgDaily.query.bool.filter.push({
					"bool": {
						"should": []
					}
				});
			}
			var dateRangeQuery = {
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			var kpiSalesDateRange = {
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			kpiSalesSummary = util.pushDateQuery(kpiSalesSummary, kpiSalesDateRange);
			doorSummary = util.pushDateQuery(doorSummary, dateRangeQuery);
			DoorAvgDaily = util.pushDateQuery(DoorAvgDaily, dateRangeQuery);

			var visitDateRange = {
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
		}

		for (var i = 0, len = dateFilterTrend.length; i < len; i++) {
			var filterDate = dateFilterTrend[i];
			var startDateTrend = filterDate.startDate,
				endDateTrend = filterDate.endDate;
		}
		this.dateFilter = dateFilter;
		this.dateFilterTrend = dateFilterTrend;
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
			assetInfo.query.bool.filter.push(countryIdsUser);
			//totalAssetLocation.query.bool.filter.push(countryIdsUser);
			kpiSalesSummary.query.bool.filter.push(countryIdsUser);
			doorSummary.query.bool.filter.push(countryIdsUser);
			DoorAvgDaily.query.bool.filter.push(countryIdsUser);
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
			assetInfo.query.bool.filter.push(filterQuery);
			//totalAssetLocation.query.bool.filter.push(filterQuery);
			kpiSalesSummary.query.bool.filter.push(filterQuery);
			doorSummary.query.bool.filter.push(filterQuery);
			DoorAvgDaily.query.bool.filter.push(filterQuery);
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
			(params.ExcecuteCommandReport || params["ExcecuteCommandReport[]"]) ||
			(params.installationDate || params["installationDate[]"]) ||
			(params.lastDataReceived || params["lastDataReceived[]"]) ||
			(params.doorDataSelected || params["doorDataSelected[]"]) ||
			(params.CoolerHealth || params["CoolerHealth[]"]) ||
			(params.DisplacementFilterHistoric || params["DisplacementFilterHistoric[]"]) ||
			(params.DisplacementFilter || params["DisplacementFilter[]"]) ||
			(params.AlertTypeId || params["AlertTypeId[]"]) ||
			(params.PriorityId || params["PriorityId[]"]) ||
			(params.StatusId || params["StatusId[]"]) || (params.UserId || params["UserId[]"])) {
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
			assetInfo.aggs.SmartLocation.filter.bool.must.push(AssetIds);
			//assetSummary.aggs.NonSmartLocation.filter.bool.must.push(AssetIds);
			assetSummary.aggs.Locations.filter.bool.must.push(AssetIds);
			doorSummary.query.bool.filter.push(AssetIds);
			DoorAvgDaily.query.bool.filter.push(AssetIds);
			kpiSalesSummary.query.bool.filter.push(AssetIds);
		}

		if ((params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) ||
			(params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) ||
			(params.DataDownloadOutlet || params["DataDownloadOutlet[]"]) ||
			(params.UserId || params["UserId[]"]) ||
			(params.salesDataSelected || params["salesDataSelected[]"]) ||
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
			assetInfo.aggs.SmartLocation.filter.bool.must.push(LocationIds);
			//assetSummary.aggs.NonSmartLocation.filter.bool.must.push(AssetIds);
			assetSummary.aggs.Locations.filter.bool.must.push(LocationIds);
			doorSummary.query.bool.filter.push(LocationIds);
			DoorAvgDaily.query.bool.filter.push(LocationIds);
			kpiSalesSummary.query.bool.filter.push(LocationIds);
		}

		if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
			var smartDeviceTypeQuery = {
				"terms": {
					"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
				}
			}
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(smartDeviceTypeQuery);
			assetInfo.aggs.SmartLocation.filter.bool.must.push(smartDeviceTypeQuery);
			//assetSummary.aggs.NonSmartLocation.filter.bool.must.push(smartDeviceTypeQuery);
			assetSummary.aggs.Locations.filter.bool.must.push(smartDeviceTypeQuery);
			doorSummary.query.bool.filter.push(smartDeviceTypeQuery);
			DoorAvgDaily.query.bool.filter.push(smartDeviceTypeQuery);
			//kpiSalesSummary.query.bool.filter.push(smartDeviceTypeQuery);
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
			assetInfo.aggs.SmartLocation.filter.bool.must.push(IsKeyLocationFilter);
			//assetSummary.aggs.NonSmartLocation.filter.bool.must.push(IsKeyLocationFilter);
			assetSummary.aggs.Locations.filter.bool.must.push(IsKeyLocationFilter);
			doorSummary.query.bool.filter.push(IsKeyLocationFilter);
			DoorAvgDaily.query.bool.filter.push(IsKeyLocationFilter);
			//kpiSalesSummary.query.bool.filter.push(IsKeyLocationFilter);
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
			assetInfo.aggs.SmartLocation.filter.bool.must.push(IsFactoryAssetFilter);
			//assetSummary.aggs.NonSmartLocation.filter.bool.must.push(IsFactoryAssetFilter);
			assetSummary.aggs.Locations.filter.bool.must.push(IsFactoryAssetFilter);
			doorSummary.query.bool.filter.push(IsFactoryAssetFilter);
			DoorAvgDaily.query.bool.filter.push(IsFactoryAssetFilter);
			//kpiSalesSummary.query.bool.filter.push(IsFactoryAssetFilter);
		}

		if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
			var assetManufactureQuery = {
				"terms": {
					"AssetManufactureId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
				}
			}
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetManufactureQuery);
			assetInfo.aggs.SmartLocation.filter.bool.must.push(assetManufactureQuery);
			//assetSummary.aggs.NonSmartLocation.filter.bool.must.push(assetManufactureQuery);
			assetSummary.aggs.Locations.filter.bool.must.push(assetManufactureQuery);
			doorSummary.query.bool.filter.push(assetManufactureQuery);
			DoorAvgDaily.query.bool.filter.push(assetManufactureQuery);
			//kpiSalesSummary.query.bool.filter.push(assetManufactureQuery);
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
			assetInfo.aggs.SmartLocation.filter.bool.must.push(SalesHierarchyId);
			//assetSummary.aggs.NonSmartLocation.filter.bool.must.push(SalesHierarchyId);
			assetSummary.aggs.Locations.filter.bool.must.push(SalesHierarchyId);
			doorSummary.query.bool.filter.push(SalesHierarchyId);
			DoorAvgDaily.query.bool.filter.push(SalesHierarchyId);
			//kpiSalesSummary.query.bool.filter.push(SalesHierarchyId);
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
			var manufacturerSmartDeviceQuery1 = {
				"terms": {
					"SmartDeviceManufacturerId": request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]
				}
			}
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerSmartDeviceQuery);
			assetInfo.aggs.SmartLocation.filter.bool.must.push(manufacturerSmartDeviceQuery1);
			//assetSummary.aggs.NonSmartLocation.filter.bool.must.push(manufacturerSmartDeviceQuery);
			if (!params.DoorOpenVsSales) {
				assetSummary.aggs.Locations.filter.bool.must.push(manufacturerSmartDeviceQuery);
			}
			//doorSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
			DoorAvgDaily.query.bool.filter.push(manufacturerSmartDeviceQuery);
			//kpiSalesSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
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
			assetInfo.aggs.SmartLocation.filter.bool.must.push(manufacturerOutletTypeId);
			//assetSummary.aggs.NonSmartLocation.filter.bool.must.push(manufacturerOutletTypeId);
			if (!params.DoorOpenVsSales) {
				assetSummary.aggs.Locations.filter.bool.must.push(manufacturerOutletTypeId);
			}
			//doorSummary.query.bool.filter.push(manufacturerOutletTypeId);
			DoorAvgDaily.query.bool.filter.push(manufacturerOutletTypeId);
			//kpiSalesSummary.query.bool.filter.push(manufacturerOutletTypeId);
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
			assetInfo.aggs.SmartLocation.filter.bool.must.push(LocationTypeId);
			//assetSummary.aggs.NonSmartLocation.filter.bool.must.push(LocationTypeId);
			assetSummary.aggs.Locations.filter.bool.must.push(LocationTypeId);
			doorSummary.query.bool.filter.push(LocationTypeId);
			DoorAvgDaily.query.bool.filter.push(LocationTypeId);
			//kpiSalesSummary.query.bool.filter.push(LocationTypeId);
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
			assetInfo.aggs.SmartLocation.filter.bool.must.push(ClassificationId);
			//assetSummary.aggs.NonSmartLocation.filter.bool.must.push(ClassificationId);
			assetSummary.aggs.Locations.filter.bool.must.push(ClassificationId);
			doorSummary.query.bool.filter.push(ClassificationId);
			DoorAvgDaily.query.bool.filter.push(ClassificationId);
			//kpiSalesSummary.query.bool.filter.push(ClassificationId);
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
			assetInfo.aggs.SmartLocation.filter.bool.must.push(SubTradeChannelTypeId);
			//assetSummary.aggs.NonSmartLocation.filter.bool.must.push(SubTradeChannelTypeId);
			assetSummary.aggs.Locations.filter.bool.must.push(SubTradeChannelTypeId);
			doorSummary.query.bool.filter.push(SubTradeChannelTypeId);
			DoorAvgDaily.query.bool.filter.push(SubTradeChannelTypeId);
			//kpiSalesSummary.query.bool.filter.push(SubTradeChannelTypeId);
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
			assetInfo.aggs.SmartLocation.filter.bool.must.push(AssetManufactureId);
			//assetSummary.aggs.NonSmartLocation.filter.bool.must.push(AssetManufactureId);
			assetSummary.aggs.Locations.filter.bool.must.push(AssetManufactureId);
			doorSummary.query.bool.filter.push(AssetManufactureId);
			DoorAvgDaily.query.bool.filter.push(AssetManufactureId);
			//kpiSalesSummary.query.bool.filter.push(AssetManufactureId);
		}

		if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
			var AssetTypeId = {
				"terms": {
					"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
				}
			}
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetTypeId);
			assetInfo.aggs.SmartLocation.filter.bool.must.push(AssetTypeId);
			//assetSummary.aggs.NonSmartLocation.filter.bool.must.push(AssetTypeId);
			assetSummary.aggs.Locations.filter.bool.must.push(AssetTypeId);
			doorSummary.query.bool.filter.push(AssetTypeId);
			DoorAvgDaily.query.bool.filter.push(AssetTypeId);
			//kpiSalesSummary.query.bool.filter.push(filterQueAssetTypeIdry);
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
			assetInfo.aggs.SmartLocation.filter.bool.must.push(SmartDeviceTypeId);
			//assetSummary.aggs.NonSmartLocation.filter.bool.must.push(SmartDeviceTypeId);
			assetSummary.aggs.Locations.filter.bool.must.push(SmartDeviceTypeId);
			doorSummary.query.bool.filter.push(SmartDeviceTypeId);
			DoorAvgDaily.query.bool.filter.push(SmartDeviceTypeId);
			//kpiSalesSummary.query.bool.filter.push(SmartDeviceTypeId);
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
			assetInfo.aggs.SmartLocation.filter.bool.must.push(City);
			//assetSummary.aggs.NonSmartLocation.filter.bool.must.push(City);
			assetSummary.aggs.Locations.filter.bool.must.push(City);
			doorSummary.query.bool.filter.push(City);
			DoorAvgDaily.query.bool.filter.push(City);
			//kpiSalesSummary.query.bool.filter.push(City);
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
			assetInfo.aggs.SmartLocation.filter.bool.must.push(CountryId);
			//assetSummary.aggs.NonSmartLocation.filter.bool.must.push(CountryId);
			assetSummary.aggs.Locations.filter.bool.must.push(CountryId);
			doorSummary.query.bool.filter.push(CountryId);
			DoorAvgDaily.query.bool.filter.push(CountryId);
			//kpiSalesSummary.query.bool.filter.push(CountryId);
		}

		if (request.query.LocationCode || request.query["LocationCode[]"]) {
			var LocationCode = {
				"term": {
					"LocationCode": request.query.LocationCode || request.query["LocationCode[]"]
				}
			}
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(LocationCode);
			assetInfo.aggs.SmartLocation.filter.bool.must.push(LocationCode);
			//assetSummary.aggs.NonSmartLocation.filter.bool.must.push(LocationCode);
			assetSummary.aggs.Locations.filter.bool.must.push(LocationCode);
			doorSummary.query.bool.filter.push(LocationCode);
			DoorAvgDaily.query.bool.filter.push(LocationCode);
			//kpiSalesSummary.query.bool.filter.push(LocationCode);
		}

		var queries = [{
				key: "dooravg",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					type: ["AssetEventDataSummary"],
					body: DoorAvgDaily,
					ignore_unavailable: true
				}
			},
			{
				key: "doorSummary",
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
				key: "dbInfor",
				search: {
					index: 'cooler-iot-asset',
					type: ["Asset"],
					body: assetInfo,
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
				key: "assetTypeCapacity",
				search: {
					index: "cooler-iot-assettypecapacity", // 
					body: assetTypeCapacity,
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
		var promises2 = [];
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
					dooropeningSales: [{
						"DoorOpening": 0,
						"Sales": 200
					}],
					dooorSales: [{
						name: 'Low Sales & High Door Utilization',
						y: 0,
						x: 0,
						color: '#3366cc'
					}, {
						name: 'High Sales & High Door Utilization',
						y: 0,
						x: 0,
						color: '#109618'
					}, {
						name: 'High Sales & Low Door Utilization',
						y: 0,
						x: 0,
						color: '#ff9900'
					}, {
						name: 'Low Sales & Low Door Utilization',
						y: 0,
						x: 0,
						color: '#dc3912'
					}, {
						name: 'Non Smart Low Sales',
						y: 0,
						x: 0,
						color: '#990099'
					}, {
						name: 'Non Smart High Sales',
						y: 0,
						x: 0,
						color: '#0099c6'
					}],
					avgCapacity: [{
						"Range": "100-500",
						"Sales": 0
					}, {
						"Range": "500-1000",
						"Sales": 0
					}, {
						"Range": "1000-3000",
						"Sales": 0
					}],
					doorVsSalesChart: []
				};
			for (var i = 0, len = values.length; i < len; i++) {
				var value = values[i];
				data[value.config.key] = value.response;
				util.setLogger(value);
			}

			var dbAggs = data.db.aggregations,
				dbInfo = data.dbInfor.aggregations,
				doorSummary = data.doorSummary.aggregations,
				dooravg = data.dooravg.aggregations,
				//totalAssetLocation = data.totalAssetLocation.aggregations,
				salesAggs = data.sales.aggregations,
				assetTypeCapacityHits = data.assetTypeCapacity.hits.hits,
				doorCount, doorOpenRate, doorOpenDuration, doorSumDuration;


			var doorOpens,
				days = moment.duration(totalHours, 'hours').asDays(),
				doorData = finalData.doorData;

			var locationDataMap = [],
				lowlow = [],
				highhigh = [],
				lowhigh = [],
				highlow = [];

			if (dooravg) {
				var assetDays = 0;
				doorCount = 0;
				dooravg.Asset.buckets.forEach(function (doorData) {
					assetDays = doorData.doc_count;
					doorCount += doorData.DoorCount.value / assetDays;
				});
				doorOpenRate = (doorCount / dooravg.AssetCount.value);
				doorSumDuration = dooravg.SumDoorOpenDuration;
				doorOpenDuration = doorSumDuration.DoorSum.value / doorCount;

				if (isNaN(doorOpenDuration)) {
					doorOpenDuration = 0
				}

				if (doorOpenDuration == 0 && doorCount >= 0 || doorSumDuration.doc_count == 0) {
					doorOpenDuration = 'NAN'
				}
				if (isNaN(doorOpenRate) || doorCount == 0) {
					doorOpenRate = 'N/A'
				}
			}
			var salesLowDoorLow = 0;
			var salesLowDoorHigh = 0;
			var salesHighDoorHigh = 0;
			var salesHighDoorLow = 0;
			if (dooravg || salesAggs) {
				var doorTarget = 0;
				var salesTarget = 0;
				var doorActual = 0;
				var salesActual = 0;
				var salesIssue = true;
				var doorIssue = true;
				dbInfo.SmartLocation.Location.buckets.forEach(function (locationData) {
					var locationId = locationData.key;
					doorTarget = 0;
					salesTarget = 0;
					salesActual = 0;
					doorActual = 0;
					doorTarget = locationData.DoorOpenTarget.value;
					salesTarget = locationData.SalesTarget.value;
					var doorValue;
					if (doorSummary) {
						doorValue = doorSummary.Location.buckets.filter(data => data.key == locationId);
					}
					var salesValue;
					if (salesAggs) {
						salesValue = salesAggs.Location.buckets.filter(data => data.key == locationId);
					}

					if (doorValue && doorValue.length > 0) {
						doorActual = doorValue[0].DoorCount.value;
					}

					if (salesValue && salesValue.length > 0) {
						salesActual = salesValue[0].SalesVolume.value;
					}

					var range;
					var capcity = locationData.CapacityAvg.value;
					range = assetTypeCapacityHits.filter(data => capcity >= data._source.MinCapacity && capcity <= data._source.MaxCapacity);
					if (range && range.length > 0) {
						range = range[0]._source.Range;
					}
					if (range && range.length > 0) {
						var salesDay = Number((salesActual / days).toFixed(1));
						var doorDay = Number((doorActual / days).toFixed(1));

						if (datesalesselect == "1" && datedoorselect == "1") {
							if (salesDay && doorDay) {
								finalData.doorVsSalesChart.push({
									"LocationId": locationId,
									"Range": range,
									"Sales": salesDay,
									"Door": doorDay
								});
							}
						} else {
							if (salesDay && doorDay) {
								finalData.doorVsSalesChart.push({
									"LocationId": locationId,
									"Range": range,
									"Sales": salesDay,
									"Door": doorDay
								});
							}
						}
					}

					doorTarget = doorTarget * days;
					salesTarget = salesTarget * days;

					salesIssue = salesTarget === 0 ? true : salesActual < salesTarget ? true : false;
					doorIssue = doorTarget === 0 ? true : doorActual < doorTarget ? true : false;

					if (salesIssue && !doorIssue) {
						finalData.dooorSales[0].y++;
						finalData.dooorSales[0].x++;
						lowhigh.push(locationId);
						salesLowDoorHigh++;
					} else if (!salesIssue && !doorIssue) {
						finalData.dooorSales[1].y++;
						finalData.dooorSales[1].x++;
						highhigh.push(locationId);
						salesHighDoorHigh++;
					} else if (!salesIssue && doorIssue) {
						finalData.dooorSales[2].y++;
						finalData.dooorSales[2].x++;
						highlow.push(locationId);
						salesHighDoorLow++;
					} else if (salesIssue && doorIssue) {
						finalData.dooorSales[3].y++;
						finalData.dooorSales[3].x++;
						lowlow.push(locationId);
						salesLowDoorLow++;
					}
				});
			}
			//=======================================//
			var query2 = "select L.LocationId As locationid, L.latitude As latitude,  L.longitude As longitude  from Location L inner join string_split(' " + lowlow + " ', ',') A ON L.LocationId = A.value where latitude != 0 and longitude != 0 ";
			var query3 = "select L.LocationId As locationid, L.latitude As latitude,  L.longitude As longitude  from Location L inner join string_split(' " + lowhigh + " ', ',') A ON L.LocationId = A.value where latitude != 0 and longitude != 0 ";
			var query4 = "select L.LocationId As locationid, L.latitude As latitude,  L.longitude As longitude  from Location L inner join string_split(' " + highhigh + " ', ',') A ON L.LocationId = A.value where latitude != 0 and longitude != 0 ";
			var query5 = "select L.LocationId As locationid, L.latitude As latitude,  L.longitude As longitude  from Location L inner join string_split(' " + highlow + " ', ',') A ON L.LocationId = A.value where latitude != 0 and longitude != 0 ";
			var queries2 = [{
				"sql": query2
			}, {
				"sql": query3
			}, {
				"sql": query4
			}, {
				"sql": query5
			}]
			for (var i = 0, len = queries2.length; i < len; i++) {
				promises2.push(_this.getSqlData(queries2[i]));
			}
			Promise.all(promises2).then(function (values2) {
				var data2 = {};

				var value = values2[0];
				var name = "Maplowlow"
				data2[name] = value.response;
				var value = values2[1];
				var name = "Maplowhigh"
				data2[name] = value.response;
				var value = values2[2];
				var name = "Maphighhigh"
				data2[name] = value.response;
				var value = values2[3];
				var name = "Maphighlow"
				data2[name] = value.response;

				var mapDatall = data2.Maplowlow,
					mapDatalh = data2.Maplowhigh,
					mapDatahh = data2.Maphighhigh,
					mapDatahl = data2.Maphighlow;
				for (var i = 0; i < mapDatall.length; i++) {
					locationDataMap.push({
						Id: mapDatall[i].locationid,
						Utilization: "Low Sales & Low Door Utilization",
						LocationGeo: {
							"lat": mapDatall[i].latitude,
							"lon": mapDatall[i].longitude
						}
					})
				}
				for (var i = 0; i < mapDatalh.length; i++) {
					locationDataMap.push({
						Id: mapDatalh[i].locationid,
						Utilization: "Low Sales & High Door Utilization",
						LocationGeo: {
							"lat": mapDatalh[i].latitude,
							"lon": mapDatalh[i].longitude
						}
					})
				}
				for (var i = 0; i < mapDatahh.length; i++) {
					locationDataMap.push({
						Id: mapDatahh[i].locationid,
						Utilization: "High Sales & High Door Utilization",
						LocationGeo: {
							"lat": mapDatahh[i].latitude,
							"lon": mapDatahh[i].longitude
						}
					})
				}
				for (var i = 0; i < mapDatahl.length; i++) {
					locationDataMap.push({
						Id: mapDatahl[i].locationid,
						Utilization: "High Sales & Low Door Utilization",
						LocationGeo: {
							"lat": mapDatahl[i].latitude,
							"lon": mapDatahl[i].longitude
						}
					})
				}


				finalData.dooorSales.forEach(function (data) {
					if (data.y == 0) {
						data.y = 0.1;
					}
				});

				var totalAsset = dbAggs.AssetCount.AssetCount.buckets.length;
				var smartAssetCount = dbAggs.SmartAssetCount.SmartAssetCount.buckets.length;

				var salesVolume = 'N/A';

				var locationId, avgSales, avgCapacity, avgVolumeBucket;
				if (salesAggs) {
					salesVolume = salesAggs.SalesVolume.value;
					salesVolume = salesVolume / days / salesAggs.LocationCount.value;
				}

				if (salesAggs && dooravg) {
					finalData.dooropeningSales = [{
						"DoorOpening": (dooravg.DoorCount.DoorCount.value) == 0 ? 0 : (Math.round(salesVolume) / Math.round(doorOpenRate)).toFixed(2),
						"Sales": 200
					}]
				}

				finalData.summary = {
					totalCooler: totalAsset,
					totalCustomer: dbAggs.LocationCount.LocationCount.buckets.length,
					filteredAssets: dbAggs.AssetCount.AssetCount.buckets.length,
					filteredOutlets: dbAggs.Locations.Locations.buckets.length,
					totalSmartAssetCount: dbAggs.SmartAssetCount.SmartAssetCount.buckets.length,
					doorOpenDuration: doorOpenDuration,
					hourlyDoorOpen: doorOpenRate,
					salesVolume: salesVolume,
					locationData: locationDataMap,
					smartAssetCount: smartAssetCount,
					salesLowDoorLow: salesLowDoorLow,
					salesLowDoorHigh: salesLowDoorHigh,
					salesHighDoorHigh: salesHighDoorHigh,
					smartAssetCountWareHouse: dbAggs.SmartAssetCount.SmartAssetCount.buckets.length,
					salesHighDoorLow: salesHighDoorLow
				};

				return reply({
					success: true,
					data: finalData
				});
			}, function (err) {
				console.trace(err.message);
				return reply(Boom.badRequest(err.message));
			});
		}, function (err) {
			console.trace(err.message);
			return reply(Boom.badRequest(err.message));
		});
	},
	getLocationNamedeSalesCorrelation: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload),
			CorrelationLocationInfo = JSON.parse(this.dashboardQueries.CorrelationLocationInfo);
		var LocationQuery = {
			"term": {
				"LocationId": params.LocationId
			}
		};
		if (params.LocationId != 0) {
			CorrelationLocationInfo.query.bool.filter.push(LocationQuery);
		}

		var queries = [{
			key: "CorrelationLocationInfo",
			search: {
				index: 'cooler-iot-location',
				type: ["Location"],
				body: CorrelationLocationInfo,
				ignore_unavailable: true
			}
		}];

		var promises = [];
		for (var i = 0, len = queries.length; i < len; i++) {
			promises.push(this.getElasticData(queries[i]));
		}

		var data = {};
		Promise.all(promises).then(function (values) {
			for (var i = 0, len = values.length; i < len; i++) {
				var value = values[i];
				data[value.config.key] = value.response;
				util.setLogger(value);
			}
			var dbAggs = data.CorrelationLocationInfo.aggregations;
			return reply({
				success: true,
				data: dbAggs
			});
		}, function (err) {
			console.trace(err.message);
			return reply(Boom.badRequest(err.message));
		});

	}
}