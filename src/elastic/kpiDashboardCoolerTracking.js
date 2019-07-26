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
			//console.log("StartTime of "+JSON.stringify(config.search)+"" + new Date());
			client.search(config.search).then(function (resp) {
				//console.log("endTime of "+JSON.stringify(config.search)+"" + new Date());
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
		healthSummaryCoolerTracking: JSON.stringify(require('./dashboardQueries/coolerTracking/kpiHealthSummaryLatest.json')),
		SummaryVoltageCoolerTracking: JSON.stringify(require('./dashboardQueries/coolerTracking/KpiHealthVoltage.json')),
		assetSummaryCoolerTracking: JSON.stringify(require('./dashboardQueries/coolerTracking/kpiAssetSummary.json')),
		doorSummaryCoolerTracking: JSON.stringify(require('./dashboardQueries/coolerTracking/kpiDoorSummary.json')),
		doorSummaryWiseCoolerTracking: JSON.stringify(require('./dashboardQueries/coolerTracking/kpiDoorWiseSummary.json')),
		powerStatusCoolerTracking: JSON.stringify(require('./dashboardQueries/coolerTracking/KPIPowerStatus.json')),
		assetSummaryCommercial: JSON.stringify(require('./dashboardQueries/coolerTracking/AssetTopHeaderQuery.json')),
		alarmSummaryCoolerTracking: JSON.stringify(require('./dashboardQueries/coolerTracking/KPIAlarmType.json')),
		kpiLastDataDownloadSummaryDays: JSON.stringify(require('./dashboardQueries/coolerTracking/kpiLastDataDownloadSummaryDays.json')),
		MissWrongCoolerTracking: JSON.stringify(require('./dashboardQueries/coolerTracking/KPICoolerMissingWrong.json')),
		FoundCoolerTracking: JSON.stringify(require('./dashboardQueries/coolerTracking/KPICoolerTrackingChart.json')),
		MissCoolerCSI: JSON.stringify(require('./dashboardQueries/coolerTracking/CSI/CSICoolerMissingWrong.json')),
		TemperatureCSI: JSON.stringify(require('./dashboardQueries/coolerTracking/CSI/CSIHealthSummaryLatest.json')),
		PowerCSI: JSON.stringify(require('./dashboardQueries/coolerTracking/CSI/CSIPowerStatus.json')),
		DoorCSI: JSON.stringify(require('./dashboardQueries/coolerTracking/CSI/CSIDoorSummary.json'))
	},
	getKpiWidgetDataForCoolerTracking: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload),
			assetSummary = JSON.parse(this.dashboardQueries.assetSummaryCommercial);

		// client Filter
		var clientQuery = {
			"term": {
				"ClientId": clientId
			}
		};
		if (clientId != 0) {
			assetSummary.query.bool.filter.push(clientQuery);
		}


		//Date Filter
		var isDefaultDateFilter = params.yearWeek || params.dayOfWeek || params.quarter || params.month;
		var dateFilter = [];
		var dateFilterTrend = [];
		var totalHours = 0
		var months = 0;
		if (!isDefaultDateFilter && !params.startDate && !params.endDate) {
			var dateRangeQuery = {
				"range": {
					"EventTime": {
						"gte": "now-30d/d"
					}
				}
			};

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
					"EventTime": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};

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
			if (i == 0) {}
			var dateRangeQuery = {
				"range": {
					"EventTime": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			var kpiSalesDateRange = {
				"range": {
					"Date": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};

			var visitDateRange = {
				"range": {
					"Date": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};

			var assetVisitDateRange = {
				"range": {
					"VisitDateTime": {
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


		var reducers = {
			outletReducer: outletReducer,
			salesRepReducer: salesRepReducer,
			alertReducer: alertReducer,
			assetReducer: assetReducer,
			smartDeviceReducer: smartDeviceReducer,
			smartDeviceMovementReducer: smartDeviceMovementReducer,
			smartDevicDoorStatusReducer: smartDevicDoorStatusReducer,
			smartDevicHealthReducer: smartDevicHealthReducer,
			smartDevicePowerReducer: smartDevicePowerReducer,
			smartDeviceInstallationDateReducer: smartDeviceInstallationDateReducer,
			smartDeviceLatestDataReducer: smartDeviceLatestDataReducer
		}

		util.applyReducers(request, params, totalHours, reducers, function (_this, assetIds, locationIds) {
			if (Array.isArray(locationIds)) {
				var locationQuery;
				var locationQueryOutlet;

				locationQuery = {
					"terms": {
						LocationId: locationIds.length != 0 ? locationIds : [-1]
					}
				};
				locationQueryOutlet = {
					"terms": {
						"_id": locationIds.length != 0 ? locationIds : [-1]
					}
				};

				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
				assetSummary.aggs.SmartAssets.filter.bool.must.push(locationQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(locationQuery);
				assetSummary.aggs.NonSmartLocation.filter.bool.must.push(locationQuery);
				var tags = credentials.tags,
					limitLocation = Number(tags.LimitLocation);
				if (Object.keys(request.query).filter(data => data != "startDate" && data != "endDate" && data != "sellerTop" && data != "customerTop" && data != "yearWeek" && data != "dayOfWeek" && data != "quarter" && data != "month").length == 0) {
					if (limitLocation != 0) {

						assetSummary.aggs.Assets.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.SmartAssetCount.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.Locations.filter.bool.must.push({
							"terms": {
								"_id": limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
					} else {
						assetSummary.aggs.Assets.filter.bool.must.push(locationQuery);
						assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
						assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
						assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
					}
				} else {
					assetSummary.aggs.Assets.filter.bool.must.push(locationQuery);
					assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
					assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
					assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
				}
			}
			var tags = credentials.tags,
				limitLocation = Number(tags.LimitLocation);
			if (limitLocation != 0) {
				var filterQuery = {
					"terms": {
						"SalesHierarchyId": {
							"index": "filteredlocations",
							"type": "locationIds",
							"id": credentials.user.UserId,
							"path": "SalesHierarchyId"
						},
						"_cache_key": "experiment_" + credentials.user.UserId
					}

				}

				var filterQueryOutlet = {
					"terms": {
						"SalesHierarchyId": {
							"index": "filteredlocations",
							"type": "locationIds",
							"id": credentials.user.UserId,
							"path": "SalesHierarchyId"
						},
						"_cache_key": "experiment_" + credentials.user.UserId
					}
				}


				assetSummary.aggs.Assets.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssets.filter.bool.must.push(filterQuery);
				assetSummary.aggs.TotalSmartAssetCount.filter.bool.must.push(filterQuery);

				assetSummary.aggs.SmartLocation.filter.bool.must.push(filterQuery);
				assetSummary.aggs.NonSmartLocation.filter.bool.must.push(filterQuery);
				assetSummary.aggs.Locations.filter.bool.must.push(filterQueryOutlet);

				assetSummary.aggs.AssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.LocationCount.filter.bool.must.push(filterQueryOutlet);
			}

			if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
				var smartDeviceTypeQuery = {
					"terms": {
						"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.NonSmartLocation.filter.bool.must.push(smartDeviceTypeQuery);
			}

			if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
				var assetManufactureQuery = {
					"terms": {
						"AssetManufacturerId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(assetManufactureQuery);;
				assetSummary.aggs.SmartLocation.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.NonSmartLocation.filter.bool.must.push(assetManufactureQuery);
			}

			if (request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]) {
				if (request.query.SmartDeviceManufacturerId.constructor !== Array) {
					var toArray = request.query.SmartDeviceManufacturerId;
					request.query.SmartDeviceManufacturerId = [];
					request.query.SmartDeviceManufacturerId.push(toArray);
				}
				var manufacturerSmartDeviceQuery = {
					"terms": {
						"SmartDeviceManufacturerId": request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.NonSmartLocation.filter.bool.must.push(manufacturerSmartDeviceQuery);

			}

			if (assetIds) {
				var assetQuery = {
					"terms": {
						"AssetId": assetIds
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(assetQuery);
				assetSummary.aggs.NonSmartLocation.filter.bool.must.push(assetQuery);
			}

			if (_this.dateFilter.length > 0) {
				startDate = _this.dateFilter[0].startDate;
				endDate = _this.dateFilter[_this.dateFilter.length - 1].endDate;
			}
			var indexNames = util.getEventsIndexName(startDate, endDate);
			var indexNamesSales = util.getEventsIndexName(startDate, endDate, 'cooler-iot-salesorderdetail-');
			if (_this.dateFilterTrend.length > 0) {
				startDateTrend = _this.dateFilterTrend[0].startDate;
				endDateTrend = _this.dateFilterTrend[_this.dateFilterTrend.length - 1].endDate;
			}
			var indexNamesSalesTrend = util.getEventsIndexName(startDateTrend, endDateTrend, 'cooler-iot-salesorderdetail-');

			var lastEndDate = endDate;


			var queries = [{
				key: "db",
				search: {
					index: 'cooler-iot-asset,cooler-iot-location',
					body: assetSummary,
					ignore_unavailable: true
				}
			}];

			//console.log(JSON.stringify(queries));
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
					finalData = {};
				for (var i = 0, len = values.length; i < len; i++) {
					var value = values[i];
					data[value.config.key] = value.response;
					util.setLogger(value);
				}

				var dbAggs = data.db.aggregations;
				finalData.summary = {
					totalCooler: dbAggs.SmartAssetCount.doc_count,
					totalCustomer: dbAggs.LocationCount.doc_count,
					filteredAssets: dbAggs.Assets.doc_count,
					filteredOutlets: dbAggs.Locations.doc_count,
					totalSmartAssetCount: dbAggs.TotalSmartAssetCount.doc_count,
					smartAssetCount: dbAggs.SmartAssetCount.doc_count,
					smartAssetCountWareHouse: dbAggs.SmartAssetCountWareHouse.doc_count
				};

				return reply({
					success: true,
					data: finalData
				});
			}, function (err) {
				console.trace(err.message);
				return reply(Boom.badRequest(err.message));
			});

		}.bind(null, this));
	},
	getKpiWidgetDataForCoolerTrackingLastDataDownload: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload),
			assetSummary = JSON.parse(this.dashboardQueries.assetSummaryCoolerTracking),
			kpiLastDataDownloadSummaryDays = JSON.parse(this.dashboardQueries.kpiLastDataDownloadSummaryDays);

		// client Filter
		var clientQuery = {
			"term": {
				"ClientId": clientId
			}
		};
		if (clientId != 0) {
			assetSummary.query.bool.filter.push(clientQuery);
			kpiLastDataDownloadSummaryDays.query.bool.filter.push(clientQuery);
		}


		//Date Filter
		var isDefaultDateFilter = params.yearWeek || params.dayOfWeek || params.quarter || params.month;
		var dateFilter = [];
		var dateFilterTrend = [];
		var totalHours = 0
		var months = 0;
		if (!isDefaultDateFilter && !params.startDate && !params.endDate) {
			var dateRangeQuery = {
				"range": {
					"EventTime": {
						"gte": "now-30d/d"
					}
				}
			};

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
					"EventTime": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};

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


			}
			var dateRangeQuery = {
				"range": {
					"EventTime": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			var kpiSalesDateRange = {
				"range": {
					"Date": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};

			var visitDateRange = {
				"range": {
					"Date": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};

			var assetVisitDateRange = {
				"range": {
					"VisitDateTime": {
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


		var reducers = {
			outletReducer: outletReducer,
			salesRepReducer: salesRepReducer,
			alertReducer: alertReducer,
			assetReducer: assetReducer,
			smartDeviceReducer: smartDeviceReducer,
			smartDeviceMovementReducer: smartDeviceMovementReducer,
			smartDevicDoorStatusReducer: smartDevicDoorStatusReducer,
			smartDevicHealthReducer: smartDevicHealthReducer,
			smartDevicePowerReducer: smartDevicePowerReducer,
			smartDeviceInstallationDateReducer: smartDeviceInstallationDateReducer,
			smartDeviceLatestDataReducer: smartDeviceLatestDataReducer
		}

		util.applyReducers(request, params, totalHours, reducers, function (_this, assetIds, locationIds) {
			if (Array.isArray(locationIds)) {
				var locationQuery;
				var locationQueryOutlet;

				locationQuery = {
					"terms": {
						LocationId: locationIds.length != 0 ? locationIds : [-1]
					}
				};
				locationQueryOutlet = {
					"terms": {
						"_id": locationIds.length != 0 ? locationIds : [-1]
					}
				};
				kpiLastDataDownloadSummaryDays.query.bool.filter.push(locationQuery);

				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(locationQuery);
				var tags = credentials.tags,
					limitLocation = Number(tags.LimitLocation);
				if (Object.keys(request.query).filter(data => data != "startDate" && data != "endDate" && data != "sellerTop" && data != "customerTop" && data != "yearWeek" && data != "dayOfWeek" && data != "quarter" && data != "month").length == 0) {
					if (limitLocation != 0) {

						assetSummary.aggs.Assets.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.SmartAssetCount.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.Locations.filter.bool.must.push({
							"terms": {
								"_id": limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
					} else {
						assetSummary.aggs.Assets.filter.bool.must.push(locationQuery);
						assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
						assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
						assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
					}
				} else {
					assetSummary.aggs.Assets.filter.bool.must.push(locationQuery);
					assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
					assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
					assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
				}
			}
			var tags = credentials.tags,
				limitLocation = Number(tags.LimitLocation);
			if (limitLocation != 0) {
				var filterQuery = {
					"terms": {
						"SalesHierarchyId": {
							"index": "filteredlocations",
							"type": "locationIds",
							"id": credentials.user.UserId,
							"path": "SalesHierarchyId"
						},
						"_cache_key": "experiment_" + credentials.user.UserId
					}

				}

				var filterQueryOutlet = {
					"terms": {
						"SalesHierarchyId": {
							"index": "filteredlocations",
							"type": "locationIds",
							"id": credentials.user.UserId,
							"path": "SalesHierarchyId"
						},
						"_cache_key": "experiment_" + credentials.user.UserId
					}
				}


				assetSummary.aggs.Assets.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssets.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(filterQueryOutlet);
				assetSummary.aggs.TotalSmartAssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.Locations.filter.bool.must.push(filterQueryOutlet);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(filterQuery);
				assetSummary.aggs.AssetCount.filter.bool.must.push(filterQuery);
				kpiLastDataDownloadSummaryDays.query.bool.filter.push(filterQuery);

			}

			if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
				var smartDeviceTypeQuery = {
					"terms": {
						"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(smartDeviceTypeQuery);

			}

			if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
				var assetManufactureQuery = {
					"terms": {
						"AssetManufacturerId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(assetManufactureQuery);
				kpiLastDataDownloadSummaryDays.query.bool.filter.push(assetManufactureQuery);
			}

			if (request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]) {
				if (request.query.SmartDeviceManufacturerId.constructor !== Array) {
					var toArray = request.query.SmartDeviceManufacturerId;
					request.query.SmartDeviceManufacturerId = [];
					request.query.SmartDeviceManufacturerId.push(toArray);
				}
				var manufacturerSmartDeviceQuery = {
					"terms": {
						"SmartDeviceManufacturerId": request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(manufacturerSmartDeviceQuery);
				kpiLastDataDownloadSummaryDays.query.bool.filter.push(manufacturerSmartDeviceQuery);
			}

			if (assetIds) {
				var assetQuery = {
					"terms": {
						"AssetId": assetIds
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(assetQuery);
				kpiLastDataDownloadSummaryDays.query.bool.filter.push(assetQuery);
			}

			if (_this.dateFilter.length > 0) {
				startDate = _this.dateFilter[0].startDate;
				endDate = _this.dateFilter[_this.dateFilter.length - 1].endDate;
			}
			var indexNames = util.getEventsIndexName(startDate, endDate);
			var indexNamesSales = util.getEventsIndexName(startDate, endDate, 'cooler-iot-salesorderdetail-');
			if (_this.dateFilterTrend.length > 0) {
				startDateTrend = _this.dateFilterTrend[0].startDate;
				endDateTrend = _this.dateFilterTrend[_this.dateFilterTrend.length - 1].endDate;
			}
			var indexNamesSalesTrend = util.getEventsIndexName(startDateTrend, endDateTrend, 'cooler-iot-salesorderdetail-');

			var lastEndDate = endDate;

			kpiLastDataDownloadSummaryDays.aggs.Last30Days.filter.bool.filter[0].range.EventTime.gte = moment(lastEndDate).add(-29, 'days').format('YYYY-MM-DD[T00:00:00]');
			kpiLastDataDownloadSummaryDays.aggs.Last30Days.filter.bool.filter[0].range.EventTime.lte = lastEndDate;

			kpiLastDataDownloadSummaryDays.aggs.Last60Days.filter.bool.filter[0].range.EventTime.gte = moment(lastEndDate).add(-59, 'days').format('YYYY-MM-DD[T00:00:00]');
			kpiLastDataDownloadSummaryDays.aggs.Last60Days.filter.bool.filter[0].range.EventTime.lte = moment(lastEndDate).add(-30, 'days').format('YYYY-MM-DD[T23:59:59]');

			kpiLastDataDownloadSummaryDays.aggs.Last90Days.filter.bool.filter[0].range.EventTime.gte = moment(lastEndDate).add(-89, 'days').format('YYYY-MM-DD[T00:00:00]');
			kpiLastDataDownloadSummaryDays.aggs.Last90Days.filter.bool.filter[0].range.EventTime.lte = moment(lastEndDate).add(-60, 'days').format('YYYY-MM-DD[T23:59:59]');

			kpiLastDataDownloadSummaryDays.aggs.MoreThen90Days.filter.bool.filter[0].range.EventTime.gte = moment(lastEndDate).add(-89, 'days').format('YYYY-MM-DD[T00:00:00]');
			kpiLastDataDownloadSummaryDays.aggs.MoreThen90Days.filter.bool.filter[0].range.EventTime.lte = lastEndDate;
			//console.log(indexNames.toString());
			var queries = [{
					key: "db",
					search: {
						index: 'cooler-iot-asset,cooler-iot-location',
						body: assetSummary,
						ignore_unavailable: true
					}
				}, {
					key: "lastDataDownloadSummaryDays",
					search: {
						index: "cooler-iot-event", // 'cooler-iot-event',
						body: kpiLastDataDownloadSummaryDays,
						type: ["SmartDeviceHealthRecord"],
						ignore_unavailable: true
					}
				}

			];

			//console.log(JSON.stringify(queries));
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
							lastDataDownloaded: [{
									"name": "Last Seen <= 30",
									"data": [],
									"color": "#55BF3B"
								},
								{
									"name": "Last Seen > 30, <60 days",
									"data": [],
									"color": "#fff589"
								},
								{
									"name": "Last Seen > 60, <90 days",
									"data": [],
									"color": "#DF5353"
								},
								{
									"name": "No Seen for more then 90 days",
									"data": [],
									"color": "#333"
								}
							]
						};
					for (var i = 0, len = values.length; i < len; i++) {
						var value = values[i];
						data[value.config.key] = value.response;
						util.setLogger(value);
					}

					var dbAggs = data.db.aggregations,
						lastDataDownloadSummaryDaysAggs = data.lastDataDownloadSummaryDays.aggregations;

					var locationDataMap = [];
					var locationDataLastdataDownloaded = [];

					var last30DaysLocation = [];
					var last60DaysLocation = [];
					var last90DaysLocation = [];


					if (lastDataDownloadSummaryDaysAggs) {
						var last30Days = lastDataDownloadSummaryDaysAggs.Last30Days.AssetIds.buckets;
						finalData.lastDataDownloaded[0].data.push(last30Days.length);
						var last60Days = lastDataDownloadSummaryDaysAggs.Last60Days.AssetIds.buckets;
						last60Days = last60Days.filter(function (y) {
							return last30Days.findIndex(x => x.key === y.key) < 0
						});
						finalData.lastDataDownloaded[1].data.push(last60Days.length);
						var last90Days = lastDataDownloadSummaryDaysAggs.Last90Days.AssetIds.buckets;
						last90Days = last90Days.filter(function (y) {
							return (last30Days.findIndex(x => x.key === y.key) < 0) && (last60Days.findIndex(x => x.key === y.key) < 0)
						});
						finalData.lastDataDownloaded[2].data.push(last90Days.length);
						finalData.lastDataDownloaded[3].data.push(dbAggs.Assets.doc_count - lastDataDownloadSummaryDaysAggs.MoreThen90Days.LocationCount.value);


						last30DaysLocation = lastDataDownloadSummaryDaysAggs.Last30Days.AssetIds.buckets;
						last60DaysLocation = lastDataDownloadSummaryDaysAggs.Last60Days.AssetIds.buckets;
						last60DaysLocation = last60DaysLocation.filter(function (y) {
							return last30DaysLocation.findIndex(x => x.key === y.key) < 0
						});
						last90DaysLocation = lastDataDownloadSummaryDaysAggs.Last90Days.AssetIds.buckets;
						last90DaysLocation = last90DaysLocation.filter(function (y) {
							return (last30DaysLocation.findIndex(x => x.key === y.key) < 0) && (last60DaysLocation.findIndex(x => x.key === y.key) < 0)
						});
					}

					if (dbAggs) {

						dbAggs.SmartLocation.Location.buckets.forEach(function (locationData) {
							var locationId = locationData.key;
							//last download 
							if (lastDataDownloadSummaryDaysAggs) {

								var Last30Days = last30DaysLocation.filter(data => data.key == locationId);
								var Last60Days = last60DaysLocation.filter(data => data.key == locationId);
								var Last90Days = last90DaysLocation.filter(data => data.key == locationId);
								var MoreThen90Days = lastDataDownloadSummaryDaysAggs.MoreThen90Days.LocationIds.buckets.filter(data => data.key == locationId);

								if (Last30Days && Last30Days.length > 0) {
									var loc = locationDataLastdataDownloaded.filter(data => data.Id == locationId);
									if (loc && loc.length > 0) {
										loc[0].LastData = "Last Seen <= 30";
									} else {
										locationDataLastdataDownloaded.push({
											Id: locationId,
											LastData: "Last Seen <= 30",
											LocationGeo: {
												"lat": locationData.Lat.bounds.top_left.lat,
												"lon": locationData.Lat.bounds.top_left.lon
											}
										})
									}
								}
								if (Last60Days && Last60Days.length > 0) {

									var loc = locationDataLastdataDownloaded.filter(data => data.Id == locationId);
									if (loc && loc.length > 0) {
										loc[0].LastData = "Last Seen > 30, <60 days";
									} else {
										locationDataLastdataDownloaded.push({
											Id: locationId,
											LastData: "Last Seen > 30, <60 days",
											LocationGeo: {
												"lat": locationData.Lat.bounds.top_left.lat,
												"lon": locationData.Lat.bounds.top_left.lon
											}
										})
									}
								}
								if (Last90Days && Last90Days.length > 0) {
									var loc = locationDataLastdataDownloaded.filter(data => data.Id == locationId);
									if (loc && loc.length > 0) {
										loc[0].LastData = "Last Seen > 60, <90 days";
									} else {
										locationDataLastdataDownloaded.push({
											Id: locationId,
											LastData: "Last Seen > 60, <90 days",
											LocationGeo: {
												"lat": locationData.Lat.bounds.top_left.lat,
												"lon": locationData.Lat.bounds.top_left.lon
											}
										})
									}
								}

								if (MoreThen90Days && MoreThen90Days.length == 0) {
									var loc = locationDataLastdataDownloaded.filter(data => data.Id == locationId);
									if (loc && loc.length > 0) {
										loc[0].LastData = "No Seen for more then 90 days";
									} else {
										locationDataLastdataDownloaded.push({
											Id: locationId,
											LastData: "No Seen for more then 90 days",
											LocationGeo: {
												"lat": locationData.Lat.bounds.top_left.lat,
												"lon": locationData.Lat.bounds.top_left.lon
											}
										})
									}
								}
							}
						});
					}

					finalData.summary = {
						locationDataLastdataDownloaded: locationDataLastdataDownloaded
					};

					return reply({
						success: true,
						data: finalData
					});
				},
				function (err) {
					console.trace(err.message);
					return reply(Boom.badRequest(err.message));
				});

		}.bind(null, this));
	},
	getKpiWidgetDataForCoolerTrackingTemperatureChart: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload),
			healthSummary = JSON.parse(this.dashboardQueries.healthSummaryCoolerTracking),
			assetSummary = JSON.parse(this.dashboardQueries.assetSummaryCoolerTracking);
		// client Filter
		var clientQuery = {
			"term": {
				"ClientId": clientId
			}
		};
		if (clientId != 0) {
			healthSummary.query.bool.filter.push(clientQuery);
			assetSummary.query.bool.filter.push(clientQuery);
		}

		//Date Filter
		var isDefaultDateFilter = params.yearWeek || params.dayOfWeek || params.quarter || params.month;
		var dateFilter = [];
		var totalHours = 0

		if (!isDefaultDateFilter && !params.startDate && !params.endDate) {
			var dateRangeQuery = {
				"range": {
					"EventTime": {
						"gte": "now-30d/d"
					}
				}
			};
			healthSummary.query.bool.filter.push(dateRangeQuery);
			totalHours = defaultHours;
		} else if (!isDefaultDateFilter && params.startDate && params.endDate) {
			var startDate = moment(params.startDate).format('YYYY-MM-DD[T00:00:00]');
			var endDate = moment(params.endDate).format('YYYY-MM-DD[T23:59:59]');
			var dateRangeQuery = {
				"range": {
					"EventTime": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
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
			if (i == 0) {
				healthSummary.query.bool.filter.push({
					"bool": {
						"should": []
					}
				});
			}
			var dateRangeQuery = {
				"range": {
					"EventTime": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			healthSummary = util.pushDateQuery(healthSummary, dateRangeQuery);
		}

		this.dateFilter = dateFilter;

		var reducers = {
			outletReducer: outletReducer,
			salesRepReducer: salesRepReducer,
			alertReducer: alertReducer,
			assetReducer: assetReducer,
			smartDeviceReducer: smartDeviceReducer,
			smartDeviceMovementReducer: smartDeviceMovementReducer,
			smartDevicDoorStatusReducer: smartDevicDoorStatusReducer,
			smartDevicHealthReducer: smartDevicHealthReducer,
			smartDevicePowerReducer: smartDevicePowerReducer,
			smartDeviceInstallationDateReducer: smartDeviceInstallationDateReducer,
			smartDeviceLatestDataReducer: smartDeviceLatestDataReducer
		}

		util.applyReducers(request, params, totalHours, reducers, function (_this, assetIds, locationIds) {
			if (Array.isArray(locationIds)) {
				var locationQuery;
				var locationQueryOutlet;
				locationQuery = {
					"terms": {
						LocationId: locationIds.length != 0 ? locationIds : [-1]
					}
				};
				locationQueryOutlet = {
					"terms": {
						"_id": locationIds.length != 0 ? locationIds : [-1]
					}
				};

				healthSummary.query.bool.filter.push(locationQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(locationQuery);
				var tags = credentials.tags,
					limitLocation = Number(tags.LimitLocation);
				if (Object.keys(request.query).filter(data => data != "startDate" && data != "endDate" && data != "sellerTop" && data != "customerTop" && data != "yearWeek" && data != "dayOfWeek" && data != "quarter" && data != "month").length == 0) {
					if (limitLocation != 0) {
						assetSummary.aggs.Assets.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.SmartAssetCount.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.Locations.filter.bool.must.push({
							"terms": {
								"_id": limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
					} else {
						assetSummary.aggs.Assets.filter.bool.must.push(locationQuery);
						assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
						assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
						assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
					}
				} else {
					assetSummary.aggs.Assets.filter.bool.must.push(locationQuery);
					assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
					assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
					assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
				}
			}
			var tags = credentials.tags,
				limitLocation = Number(tags.LimitLocation);
			if (limitLocation != 0) {
				var filterQuery = {
					"terms": {
						"SalesHierarchyId": {
							"index": "filteredlocations",
							"type": "locationIds",
							"id": credentials.user.UserId,
							"path": "SalesHierarchyId"
						},
						"_cache_key": "experiment_" + credentials.user.UserId
					}

				}

				var filterQueryOutlet = {
					"terms": {
						"SalesHierarchyId": {
							"index": "filteredlocations",
							"type": "locationIds",
							"id": credentials.user.UserId,
							"path": "SalesHierarchyId"
						},
						"_cache_key": "experiment_" + credentials.user.UserId
					}
				}


				assetSummary.aggs.Assets.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssets.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(filterQuery);
				assetSummary.aggs.TotalSmartAssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.Locations.filter.bool.must.push(filterQueryOutlet);
				assetSummary.aggs.AssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.LocationCount.filter.bool.must.push(filterQueryOutlet);
				healthSummary.query.bool.filter.push(filterQuery);

			}


			if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
				var smartDeviceTypeQuery = {
					"terms": {
						"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(smartDeviceTypeQuery);
				healthSummary.query.bool.filter.push(smartDeviceTypeQuery);
			}

			if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
				var assetManufactureQuery = {
					"terms": {
						"AssetManufacturerId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(assetManufactureQuery);
				healthSummary.query.bool.filter.push(assetManufactureQuery);
			}

			if (request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]) {
				if (request.query.SmartDeviceManufacturerId.constructor !== Array) {
					var toArray = request.query.SmartDeviceManufacturerId;
					request.query.SmartDeviceManufacturerId = [];
					request.query.SmartDeviceManufacturerId.push(toArray);
				}
				var manufacturerSmartDeviceQuery = {
					"terms": {
						"SmartDeviceManufacturerId": request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(manufacturerSmartDeviceQuery);
				healthSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
			}

			if (assetIds) {
				var assetQuery = {
					"terms": {
						"AssetId": assetIds
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(assetQuery);
				healthSummary.query.bool.filter.push(assetQuery);
			}

			if (_this.dateFilter.length > 0) {
				startDate = _this.dateFilter[0].startDate;
				endDate = _this.dateFilter[_this.dateFilter.length - 1].endDate;
			}
			var indexNames = util.getEventsIndexName(startDate, endDate);
			var queries = [{
					key: "events",
					search: {
						index: indexNames.toString(), // 'cooler-iot-event',
						body: healthSummary,
						ignore_unavailable: true
					}
				},
				{
					key: "db",
					search: {
						index: 'cooler-iot-asset,cooler-iot-location',
						body: assetSummary,
						ignore_unavailable: true
					}
				}
			];

			//console.log(JSON.stringify(queries));
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
							temperatureBands: [{
								key: 'Below 0',
								assets: 0,
								outlets: 0,
								totalAssets: 0
							}, {
								key: '0-5',
								assets: 0,
								outlets: 0,
								totalAssets: 0
							}, {
								key: '5-10',
								assets: 0,
								outlets: 0,
								totalAssets: 0
							}, {
								key: '10-15',
								assets: 0,
								outlets: 0,
								totalAssets: 0
							}, {
								key: ' >= 15',
								assets: 0,
								outlets: 0,
								totalAssets: 0
							}]
						};

					for (var i = 0, len = values.length; i < len; i++) {
						var value = values[i];
						data[value.config.key] = value.response;
						util.setLogger(value);
					}
					var eventsAgggs = data.events.aggregations;
					var dbAggs = data.db.aggregations;
					var totalAssets = dbAggs.SmartAssetCount.doc_count;
					var rghttemp = 'N/A';
					var temperatureMapLocation = [];
					if (eventsAgggs) {
						//var smart = eventsAgggs.AssetBucket.buckets.length;
						var smart = eventsAgggs.TempLatest.top_tags.buckets.length;
						//smartLight = smart;
						eventsAgggs.TempLatest.top_tags.buckets.forEach(function (assetBucket) {

							var tempValue = assetBucket.top_hit.hits.hits[0]._source.Temperature;
							rghttemp = !isNaN(rghttemp) ? rghttemp : 0;
							if (tempValue > Number(tags.TemperatureMax) || tempValue < Number(tags.TemperatureMin)) {
								rghttemp++;
							}
							if (tempValue == null) {
								smart--;
							} else if (tempValue < 0) {
								temperatureMapLocation.push({
									LocationTemp: ">0",
									Key: assetBucket.top_hit.hits.hits[0]._source.AssetId
								});
								finalData.temperatureBands[0].assets++;
								finalData.temperatureBands[0].totalAssets = totalAssets;
							} else if (tempValue >= 0 && tempValue < 5) {
								temperatureMapLocation.push({
									LocationTemp: "0-5",
									Key: assetBucket.top_hit.hits.hits[0]._source.AssetId
								});
								finalData.temperatureBands[1].assets++;
								finalData.temperatureBands[1].totalAssets = totalAssets;
							} else if (tempValue >= 5 && tempValue < 10) {
								temperatureMapLocation.push({
									LocationTemp: "5-10",
									Key: assetBucket.top_hit.hits.hits[0]._source.AssetId
								});
								finalData.temperatureBands[2].assets++;
								finalData.temperatureBands[2].totalAssets = totalAssets;
							} else if (tempValue >= 10 && tempValue < 15) {
								temperatureMapLocation.push({
									LocationTemp: "10-15",
									Key: assetBucket.top_hit.hits.hits[0]._source.AssetId
								});
								finalData.temperatureBands[3].assets++;
								finalData.temperatureBands[3].totalAssets = totalAssets;
							} else if (tempValue >= 15) {
								temperatureMapLocation.push({
									LocationTemp: ">=15",
									Key: assetBucket.top_hit.hits.hits[0]._source.AssetId
								});
								finalData.temperatureBands[4].assets++;
								finalData.temperatureBands[4].totalAssets = totalAssets;
							}
						});
					}

					var TempMapLocation = [];

					if (dbAggs) {
						dbAggs.SmartLocation.Location.buckets.forEach(function (locationData) {
							var assetid = locationData.key;
							var loc = temperatureMapLocation.filter(data => data.Key == assetid);
							if (loc.length == 0) {
								//loc[0].LastData = "No data for more then 90 days";
							} else {
								TempMapLocation.push({
									Id: loc[0].Key,
									Band: loc[0].LocationTemp,
									LocationGeo: {
										"lat": locationData.Lat.bounds.top_left.lat,
										"lon": locationData.Lat.bounds.top_left.lon
									}
								})
							}
						});
					}
					//console.log(TempMapLocation);

					if (smart < totalAssets) {
						finalData.temperatureBands.push({
							key: "No-Data",
							assets: dbAggs.SmartAssetCount.doc_count - smart, //dbAggs.Assets.doc_count - smart,
							outlets: 0,
							totalAssets: totalAssets
						});
					}

					finalData.summary = {
						totalCooler: totalAssets,
						rghttemp: rghttemp,
						TempMapLocation: TempMapLocation
					};

					return reply({
						success: true,
						data: finalData
					});
				},
				function (err) {
					console.trace(err.message);
					return reply(Boom.badRequest(err.message));
				});

		}.bind(null, this));
	},
	getKpiWidgetDataForCoolerTrackingDoorOpen: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload),
			assetSummary = JSON.parse(this.dashboardQueries.assetSummaryCoolerTracking),
			doorSummary = JSON.parse(this.dashboardQueries.doorSummaryCoolerTracking),
			doorSummaryWise = JSON.parse(this.dashboardQueries.doorSummaryWiseCoolerTracking);

		// client Filter
		var clientQuery = {
			"term": {
				"ClientId": clientId
			}
		};
		if (clientId != 0) {
			assetSummary.query.bool.filter.push(clientQuery);
			doorSummary.query.bool.filter.push(clientQuery);
			doorSummaryWise.query.bool.filter.push(clientQuery);
		}

		//for yestraday value
		var currentDate = moment().format(); //find today date
		var startDate = moment(currentDate).add(-1, 'days').format('YYYY-MM-DD[T00:00:00]'); //find perivous date
		var endDate = moment(currentDate).add(-1, 'days').format('YYYY-MM-DD[T23:59:59]');
		var dateyesterday = { //object to insert date
			"range": {
				"EventTime": {
					"from": startDate,
					"to": endDate
				}
			}
		};

		doorSummaryWise.aggs.Yesterday.filter.bool.must.push(dateyesterday); //push yesterday date

		//for week date value
		var startDate = moment(currentDate).startOf('W').format('YYYY-MM-DD[T00:00:00]'); //find week start date
		var endDate = moment(currentDate).endOf('W').format('YYYY-MM-DD[T23:59:59]'); //find week end date
		var dateweek = { //object to insert date
			"range": {
				"EventTime": {
					"from": startDate,
					"to": endDate
				}
			}
		};

		doorSummaryWise.aggs.Week.filter.bool.must.push(dateweek); //push week date

		//for month date value
		var startDate = moment(currentDate).startOf('month').format('YYYY-MM-DD[T00:00:00]'); //find month start date
		var endDate = moment(currentDate).endOf('month').format('YYYY-MM-DD[T23:59:59]'); //find month end date
		var datemonth = { //object to insert date
			"range": {
				"EventTime": {
					"from": startDate,
					"to": endDate
				}
			}
		};

		doorSummaryWise.aggs.Month.filter.bool.must.push(datemonth); //push month date

		//Date Filter
		var isDefaultDateFilter = params.yearWeek || params.dayOfWeek || params.quarter || params.month;
		var dateFilter = [];
		var totalHours = 0

		if (!isDefaultDateFilter && !params.startDate && !params.endDate) {
			var dateRangeQuery = {
				"range": {
					"EventTime": {
						"gte": "now-30d/d"
					}
				}
			};
			doorSummary.query.bool.filter.push(dateRangeQuery);
			totalHours = defaultHours;
		} else if (!isDefaultDateFilter && params.startDate && params.endDate) {
			var startDate = moment(params.startDate).format('YYYY-MM-DD[T00:00:00]');
			var endDate = moment(params.endDate).format('YYYY-MM-DD[T23:59:59]');
			var dateRangeQuery = {
				"range": {
					"EventTime": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			doorSummary.query.bool.filter.push(dateRangeQuery);
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
			if (i == 0) {
				doorSummary.query.bool.filter.push({
					"bool": {
						"should": []
					}
				});
			}
			var dateRangeQuery = {
				"range": {
					"EventTime": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			doorSummary = util.pushDateQuery(doorSummary, dateRangeQuery);
		}

		this.dateFilter = dateFilter;

		var reducers = {
			outletReducer: outletReducer,
			salesRepReducer: salesRepReducer,
			alertReducer: alertReducer,
			assetReducer: assetReducer,
			smartDeviceReducer: smartDeviceReducer,
			smartDeviceMovementReducer: smartDeviceMovementReducer,
			smartDevicDoorStatusReducer: smartDevicDoorStatusReducer,
			smartDevicHealthReducer: smartDevicHealthReducer,
			smartDevicePowerReducer: smartDevicePowerReducer,
			smartDeviceInstallationDateReducer: smartDeviceInstallationDateReducer,
			smartDeviceLatestDataReducer: smartDeviceLatestDataReducer
		}

		util.applyReducers(request, params, totalHours, reducers, function (_this, assetIds, locationIds) {
			if (Array.isArray(locationIds)) {
				var locationQuery;
				var locationQueryOutlet;
				locationQuery = {
					"terms": {
						LocationId: locationIds.length != 0 ? locationIds : [-1]
					}
				};
				locationQueryOutlet = {
					"terms": {
						"_id": locationIds.length != 0 ? locationIds : [-1]
					}
				};

				doorSummary.query.bool.filter.push(locationQuery);
				doorSummaryWise.query.bool.filter.push(locationQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
				var tags = credentials.tags,
					doorCount = tags.DoorCount, //as per ticket #10780 threshold
					limitLocation = Number(tags.LimitLocation);
				if (Object.keys(request.query).filter(data => data != "startDate" && data != "endDate" && data != "sellerTop" && data != "customerTop" && data != "yearWeek" && data != "dayOfWeek" && data != "quarter" && data != "month").length == 0) {
					if (limitLocation != 0) {
						assetSummary.aggs.Assets.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.SmartAssetCount.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.Locations.filter.bool.must.push({
							"terms": {
								"_id": limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
					} else {
						assetSummary.aggs.Assets.filter.bool.must.push(locationQuery);
						assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
						assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
						assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
					}
				} else {
					assetSummary.aggs.Assets.filter.bool.must.push(locationQuery);
					assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
					assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
					assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
				}
			}
			var tags = credentials.tags,
				limitLocation = Number(tags.LimitLocation);
			if (limitLocation != 0) {
				var filterQuery = {
					"terms": {
						"SalesHierarchyId": {
							"index": "filteredlocations",
							"type": "locationIds",
							"id": credentials.user.UserId,
							"path": "SalesHierarchyId"
						},
						"_cache_key": "experiment_" + credentials.user.UserId
					}

				}

				var filterQueryOutlet = {
					"terms": {
						"SalesHierarchyId": {
							"index": "filteredlocations",
							"type": "locationIds",
							"id": credentials.user.UserId,
							"path": "SalesHierarchyId"
						},
						"_cache_key": "experiment_" + credentials.user.UserId
					}
				}


				assetSummary.aggs.Assets.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssets.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(filterQueryOutlet);
				assetSummary.aggs.TotalSmartAssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.Locations.filter.bool.must.push(filterQueryOutlet);
				assetSummary.aggs.AssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.LocationCount.filter.bool.must.push(filterQueryOutlet);

				doorSummary.query.bool.filter.push(filterQuery);
				doorSummaryWise.query.bool.filter.push(filterQuery);
			}

			if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
				var smartDeviceTypeQuery = {
					"terms": {
						"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(smartDeviceTypeQuery);
				doorSummary.query.bool.filter.push(smartDeviceTypeQuery);
				doorSummaryWise.query.bool.filter.push(smartDeviceTypeQuery);
			}

			if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
				var assetManufactureQuery = {
					"terms": {
						"AssetManufacturerId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(assetManufactureQuery);
				doorSummary.query.bool.filter.push(assetManufactureQuery);
				doorSummaryWise.query.bool.filter.push(assetManufactureQuery);
			}

			if (request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]) {
				if (request.query.SmartDeviceManufacturerId.constructor !== Array) {
					var toArray = request.query.SmartDeviceManufacturerId;
					request.query.SmartDeviceManufacturerId = [];
					request.query.SmartDeviceManufacturerId.push(toArray);
				}
				var manufacturerSmartDeviceQuery = {
					"terms": {
						"SmartDeviceManufacturerId": request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(manufacturerSmartDeviceQuery)
				doorSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
				doorSummaryWise.query.bool.filter.push(manufacturerSmartDeviceQuery);
			}

			if (assetIds) {
				var assetQuery = {
					"terms": {
						"AssetId": assetIds
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(assetQuery);
				doorSummary.query.bool.filter.push(assetQuery);
				doorSummaryWise.query.bool.filter.push(assetQuery);
			}

			if (_this.dateFilter.length > 0) {
				startDate = _this.dateFilter[0].startDate;
				endDate = _this.dateFilter[_this.dateFilter.length - 1].endDate;
			}
			var indexNames = util.getEventsIndexName(startDate, endDate);
			var queries = [{
					key: "doorData",
					search: {
						index: indexNames.toString(), // 'cooler-iot-event',
						body: doorSummary,
						ignore_unavailable: true
					}
				},
				{
					key: "doorDatawise",
					search: {
						index: 'cooler-iot-event', // 'cooler-iot-event',
						body: doorSummaryWise,
						ignore_unavailable: true
					}
				},
				{
					key: "db",
					search: {
						index: 'cooler-iot-asset,cooler-iot-location',
						body: assetSummary,
						ignore_unavailable: true
					}
				}
			];

			//console.log(JSON.stringify(queries));
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
							doorData: [{
								"key": '0-25',
								"Allassets": 0,
								"Monthlyassets": 0,
								"Weekassets": 0,
								"Yesterdayassets": 0
							}, {
								"key": '25-50',
								"Allassets": 0,
								"Monthlyassets": 0,
								"Weekassets": 0,
								"Yesterdayassets": 0
							}, {
								"key": '50-75',
								"Allassets": 0,
								"Monthlyassets": 0,
								"Weekassets": 0,
								"Yesterdayassets": 0
							}, {
								"key": '75-100',
								"Allassets": 0,
								"Monthlyassets": 0,
								"Weekassets": 0,
								"Yesterdayassets": 0
							}, {
								"key": '100-125',
								"Allassets": 0,
								"Monthlyassets": 0,
								"Weekassets": 0,
								"Yesterdayassets": 0
							}, {
								"key": '125+',
								"Allassets": 0,
								"Monthlyassets": 0,
								"Weekassets": 0,
								"Yesterdayassets": 0
							}],
						};

					for (var i = 0, len = values.length; i < len; i++) {
						var value = values[i];
						data[value.config.key] = value.response;
						util.setLogger(value);
					}
					var doorAggsWise = data.doorDatawise.aggregations;
					var doorAggs = data.doorData.aggregations;

					var dbAggs = data.db.aggregations;
					var totalAssets = dbAggs.SmartAssetCount.doc_count;
					var doorOpens, lowUtilization = 'N/A',
						underUtilization = 0;
					var smartDoor, smartDoorMonthly, smartDoorWeek, smartDoorYesterday;
					var days = moment.duration(totalHours, 'hours').asDays();
					var doorMapLocation = [];
					var AssetCheck = [];
					if (doorAggs) {
						var assetDays = 0;
						var doorOpensavg = 0;
						smartDoor = doorAggs.assets.buckets.length;
						doorAggs.Avgassets.buckets.forEach(function (doorData) {
							assetDays = doorData.DoorCountDays.buckets.length;
							doorOpensavg = doorData.DoorCount.value / assetDays;
							AssetCheck.push({
								Key: doorData.key,
								doorOpensavg: doorOpensavg
							});
						});
						//console.log(AssetCheck);
						doorAggs.assets.buckets.forEach(function (bucket) {
							doorOpens = bucket.DoorCount.value;
							if (doorOpens < 25) {
								finalData.doorData[0].Allassets++;
								doorMapLocation.push({
									LocationTemp: "0-25",
									Key: bucket.key
								});
							} else if (doorOpens >= 25 && doorOpens < 50) {
								finalData.doorData[1].Allassets++;
								doorMapLocation.push({
									LocationTemp: "25-50",
									Key: bucket.key
								});
							} else if (doorOpens >= 50 && doorOpens < 75) {
								finalData.doorData[2].Allassets++;
								doorMapLocation.push({
									LocationTemp: "50-75",
									Key: bucket.key
								});
							} else if (doorOpens >= 75 && doorOpens < 100) {
								finalData.doorData[3].Allassets++;
								doorMapLocation.push({
									LocationTemp: "75-100",
									Key: bucket.key
								});
							} else if (doorOpens >= 100 && doorOpens < 125) {
								finalData.doorData[4].Allassets++;
								doorMapLocation.push({
									LocationTemp: "100-125",
									Key: bucket.key
								});
							} else if (doorOpens >= 125) {
								finalData.doorData[5].Allassets++;
								doorMapLocation.push({
									LocationTemp: ">=125",
									Key: bucket.key
								});
							}
						});
					}

					if (dbAggs) {
						dbAggs.SmartLocation.DoorTarget.buckets.forEach(function (locationData) {
							var assetid = locationData.key;
							var loc = AssetCheck.filter(data => data.Key == assetid);
							if (loc.length == 0) {
								//loc[0].LastData = "No data for more then 90 days";
							} else {
								//console.log( loc[0].doorOpensavg);
								var dooropentarget = locationData.Door_hits.hits.hits[0]._source.DoorOpenTarget;
								var DoorCountMatch = loc[0].doorOpensavg;
								if (DoorCountMatch < dooropentarget) {
									underUtilization++;
								}
							}
						});
					}

					var DoorOpenMapLocation = [];

					if (dbAggs) {
						dbAggs.SmartLocation.Location.buckets.forEach(function (locationData) {
							var assetid = locationData.key;
							var loc = doorMapLocation.filter(data => data.Key == assetid);
							if (loc.length == 0) {
								//loc[0].LastData = "No data for more then 90 days";
							} else {
								DoorOpenMapLocation.push({
									Id: loc[0].Key,
									Band: loc[0].LocationTemp,
									LocationGeo: {
										"lat": locationData.Lat.bounds.top_left.lat,
										"lon": locationData.Lat.bounds.top_left.lon
									}
								})
							}
						});
					}
					//for monthly data

					if (doorAggsWise) {

						smartDoorMonthly = doorAggsWise.Month.assets.buckets.length;
						doorAggsWise.Month.assets.buckets.forEach(function (bucket) {
							lowUtilization = !isNaN(lowUtilization) ? lowUtilization : 0;
							doorOpens = bucket.DoorCount.value;
							if (doorOpens <= consts.Threshold.LowUtilization * days) {
								lowUtilization++;
							}
							if (doorOpens < 25) {
								finalData.doorData[0].Monthlyassets++;

							} else if (doorOpens >= 25 && doorOpens < 50) {
								finalData.doorData[1].Monthlyassets++;

							} else if (doorOpens >= 50 && doorOpens < 75) {
								finalData.doorData[2].Monthlyassets++;

							} else if (doorOpens >= 75 && doorOpens < 100) {
								finalData.doorData[3].Monthlyassets++;

							} else if (doorOpens >= 100 && doorOpens < 125) {
								finalData.doorData[4].Monthlyassets++;

							} else if (doorOpens >= 125) {
								finalData.doorData[5].Monthlyassets++;

							}
						});
					}

					//for weekly data

					if (doorAggsWise) {

						smartDoorWeek = doorAggsWise.Week.assets.buckets.length;
						doorAggsWise.Week.assets.buckets.forEach(function (bucket) {
							lowUtilization = !isNaN(lowUtilization) ? lowUtilization : 0;
							doorOpens = bucket.DoorCount.value;
							if (doorOpens <= consts.Threshold.LowUtilization * days) {
								lowUtilization++;
							}
							if (doorOpens < 25) {
								finalData.doorData[0].Weekassets++;

							} else if (doorOpens >= 25 && doorOpens < 50) {
								finalData.doorData[1].Weekassets++;

							} else if (doorOpens >= 50 && doorOpens < 75) {
								finalData.doorData[2].Weekassets++;

							} else if (doorOpens >= 75 && doorOpens < 100) {
								finalData.doorData[3].Weekassets++;

							} else if (doorOpens >= 101 && doorOpens < 125) {
								finalData.doorData[4].Weekassets++;

							} else if (doorOpens >= 125) {
								finalData.doorData[5].Weekassets++;

							}
						});
					}

					//for yesterday data

					if (doorAggsWise) {

						smartDoorWeek = doorAggsWise.Yesterday.assets.buckets.length;
						doorAggsWise.Yesterday.assets.buckets.forEach(function (bucket) {
							lowUtilization = !isNaN(lowUtilization) ? lowUtilization : 0;
							doorOpens = bucket.DoorCount.value;
							if (doorOpens <= consts.Threshold.LowUtilization * days) {
								lowUtilization++;
							}
							if (doorOpens < 25) {
								finalData.doorData[0].Yesterdayassets++;

							} else if (doorOpens >= 25 && doorOpens < 50) {
								finalData.doorData[1].Yesterdayassets++;

							} else if (doorOpens >= 50 && doorOpens < 75) {
								finalData.doorData[2].Yesterdayassets++;

							} else if (doorOpens >= 75 && doorOpens < 100) {
								finalData.doorData[3].Yesterdayassets++;

							} else if (doorOpens >= 100 && doorOpens < 125) {
								finalData.doorData[4].Yesterdayassets++;

							} else if (doorOpens >= 125) {
								finalData.doorData[5].Yesterdayassets++;

							}
						});
					}

					finalData.doorData.push({
						key: "No-Data",
						Allassets: dbAggs.SmartAssetCount.doc_count - smartDoor,
						Monthlyassets: dbAggs.SmartAssetCount.doc_count - smartDoorMonthly,
						Weekassets: dbAggs.SmartAssetCount.doc_count - smartDoorWeek,
						Yesterdayassets: dbAggs.SmartAssetCount.doc_count - smartDoorYesterday
					});

					finalData.summary = {
						totalCooler: totalAssets,
						underUtilization: underUtilization,
						DoorOpenMapLocation: DoorOpenMapLocation
					};

					return reply({
						success: true,
						data: finalData
					});
				},
				function (err) {
					console.trace(err.message);
					return reply(Boom.badRequest(err.message));
				});

		}.bind(null, this));
	},
	getKpiWidgetDataForCoolerTrackingPowerStatus: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload),
			assetSummary = JSON.parse(this.dashboardQueries.assetSummaryCoolerTracking),
			powerSummary = JSON.parse(this.dashboardQueries.powerStatusCoolerTracking);

		var clientQuery = {
			"term": {
				"ClientId": clientId
			}
		};
		if (clientId != 0) {
			powerSummary.query.bool.filter.push(clientQuery);
			assetSummary.query.bool.filter.push(clientQuery);
		}

		//Date Filter
		var isDefaultDateFilter = params.yearWeek || params.dayOfWeek || params.quarter || params.month;
		var dateFilter = [];
		var totalHours = 0

		if (!isDefaultDateFilter && !params.startDate && !params.endDate) {
			var dateRangeQuery = {
				"range": {
					"EventTime": {
						"gte": "now-30d/d"
					}
				}
			};
			powerSummary.query.bool.filter.push(dateRangeQuery);
			totalHours = defaultHours;
		} else if (!isDefaultDateFilter && params.startDate && params.endDate) {
			var startDate = moment(params.startDate).format('YYYY-MM-DD[T00:00:00]');
			var endDate = moment(params.endDate).format('YYYY-MM-DD[T23:59:59]');
			var dateRangeQuery = {
				"range": {
					"EventTime": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			powerSummary.query.bool.filter.push(dateRangeQuery);
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
			if (i == 0) {
				powerSummary.query.bool.filter.push({
					"bool": {
						"should": []
					}
				});
			}
			var dateRangeQuery = {
				"range": {
					"EventTime": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			powerSummary = util.pushDateQuery(powerSummary, dateRangeQuery);
		}

		this.dateFilter = dateFilter;

		var reducers = {
			outletReducer: outletReducer,
			salesRepReducer: salesRepReducer,
			alertReducer: alertReducer,
			assetReducer: assetReducer,
			smartDeviceReducer: smartDeviceReducer,
			smartDeviceMovementReducer: smartDeviceMovementReducer,
			smartDevicDoorStatusReducer: smartDevicDoorStatusReducer,
			smartDevicHealthReducer: smartDevicHealthReducer,
			smartDevicePowerReducer: smartDevicePowerReducer,
			smartDeviceInstallationDateReducer: smartDeviceInstallationDateReducer,
			smartDeviceLatestDataReducer: smartDeviceLatestDataReducer
		}

		util.applyReducers(request, params, totalHours, reducers, function (_this, assetIds, locationIds) {
			if (Array.isArray(locationIds)) {
				var locationQuery;
				var locationQueryOutlet;
				locationQuery = {
					"terms": {
						LocationId: locationIds.length != 0 ? locationIds : [-1]
					}
				};
				locationQueryOutlet = {
					"terms": {
						"_id": locationIds.length != 0 ? locationIds : [-1]
					}
				};

				powerSummary.query.bool.filter.push(locationQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(locationQuery);
				var tags = credentials.tags,
					limitLocation = Number(tags.LimitLocation);
				if (Object.keys(request.query).filter(data => data != "startDate" && data != "endDate" && data != "sellerTop" && data != "customerTop" && data != "yearWeek" && data != "dayOfWeek" && data != "quarter" && data != "month").length == 0) {
					if (limitLocation != 0) {
						assetSummary.aggs.Assets.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.SmartAssetCount.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.Locations.filter.bool.must.push({
							"terms": {
								"_id": limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
					} else {
						assetSummary.aggs.Assets.filter.bool.must.push(locationQuery);
						assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
						assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
						assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
					}
				} else {
					assetSummary.aggs.Assets.filter.bool.must.push(locationQuery);
					assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
					assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
					assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
				}
			}
			var tags = credentials.tags,
				limitLocation = Number(tags.LimitLocation);
			if (limitLocation != 0) {
				var filterQuery = {
					"terms": {
						"SalesHierarchyId": {
							"index": "filteredlocations",
							"type": "locationIds",
							"id": credentials.user.UserId,
							"path": "SalesHierarchyId"
						},
						"_cache_key": "experiment_" + credentials.user.UserId
					}

				}

				var filterQueryOutlet = {
					"terms": {
						"SalesHierarchyId": {
							"index": "filteredlocations",
							"type": "locationIds",
							"id": credentials.user.UserId,
							"path": "SalesHierarchyId"
						},
						"_cache_key": "experiment_" + credentials.user.UserId
					}
				}


				assetSummary.aggs.Assets.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssets.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(filterQueryOutlet);
				assetSummary.aggs.TotalSmartAssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.Locations.filter.bool.must.push(filterQueryOutlet);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(filterQuery);
				assetSummary.aggs.AssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.LocationCount.filter.bool.must.push(filterQueryOutlet);
				powerSummary.query.bool.filter.push(filterQuery);

			}


			if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
				var smartDeviceTypeQuery = {
					"terms": {
						"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(smartDeviceTypeQuery);
				powerSummary.query.bool.filter.push(smartDeviceTypeQuery);
			}

			if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
				var assetManufactureQuery = {
					"terms": {
						"AssetManufacturerId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(assetManufactureQuery);
				powerSummary.query.bool.filter.push(assetManufactureQuery);
			}

			if (request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]) {
				if (request.query.SmartDeviceManufacturerId.constructor !== Array) {
					var toArray = request.query.SmartDeviceManufacturerId;
					request.query.SmartDeviceManufacturerId = [];
					request.query.SmartDeviceManufacturerId.push(toArray);
				}
				var manufacturerSmartDeviceQuery = {
					"terms": {
						"SmartDeviceManufacturerId": request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(manufacturerSmartDeviceQuery);
				powerSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
			}

			if (assetIds) {
				var assetQuery = {
					"terms": {
						"AssetId": assetIds
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(assetQuery);
				powerSummary.query.bool.filter.push(assetQuery);
			}

			if (_this.dateFilter.length > 0) {
				startDate = _this.dateFilter[0].startDate;
				endDate = _this.dateFilter[_this.dateFilter.length - 1].endDate;
			}
			var indexNames = util.getEventsIndexName(startDate, endDate);
			var queries = [{
					key: "powerEvents",
					search: {
						index: indexNames.toString(), // 'cooler-iot-event',
						body: powerSummary,
						ignore_unavailable: true
					}
				},
				{
					key: "db",
					search: {
						index: 'cooler-iot-asset,cooler-iot-location',
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

							"coolerPowerStatuses": [{

								"PowerOn": 0,
								"PowerOff": 0,
								"NoData": 0,
								key: 'Power Status'
							}]
						};
					for (var i = 0, len = values.length; i < len; i++) {
						var value = values[i];
						data[value.config.key] = value.response;
						util.setLogger(value);
					}

					var dbAggs = data.db.aggregations,
						powerAggs = data.powerEvents.aggregations;

					var totalAsset = dbAggs.SmartAssetCount.doc_count;
					var smartAssetCount = dbAggs.SmartAssetCount.doc_count;

					var powerOnHour = 0;
					var powerOffHour = 0;
					var powerMapLocation = [];
					if (powerAggs) {
						var smart = powerAggs.Power.buckets.length;
						powerAggs.Power.buckets.forEach(function (powerBucket) {
							var powerstat = powerBucket.Power_hits.hits.hits[0]._source.PowerStatus;
							if (powerstat == 0) {
								powerMapLocation.push({
									LocationPower: "Power Off",
									Key: powerBucket.Power_hits.hits.hits[0]._source.AssetId
								});
								finalData.coolerPowerStatuses[0].PowerOff++;
								powerOffHour++;
							} else {
								powerMapLocation.push({
									LocationPower: "Power On",
									Key: powerBucket.Power_hits.hits.hits[0]._source.AssetId
								});
								finalData.coolerPowerStatuses[0].PowerOn++;
							}

						});
					}

					//for map
					var PowMapLocation = [];

					if (dbAggs) {
						dbAggs.SmartLocation.Location.buckets.forEach(function (locationData) {
							var locationId = locationData.key;
							var loc = powerMapLocation.filter(data => data.Key == locationId);
							if (loc.length == 0) {
								//loc[0].LastData = "No data for more then 90 days";
							} else {
								PowMapLocation.push({
									Id: loc[0].Key,
									Band: loc[0].LocationPower,
									LocationGeo: {
										"lat": locationData.Lat.bounds.top_left.lat,
										"lon": locationData.Lat.bounds.top_left.lon
									}
								})
							}
						});
					}

					if (smart < totalAsset) {
						finalData.coolerPowerStatuses[0].NoData = dbAggs.SmartAssetCount.doc_count - smart
					}

					finalData.summary = {
						totalCooler: totalAsset,
						cooleroffpowered: powerOffHour,
						PowMapLocation: PowMapLocation
					};


					return reply({
						success: true,
						data: finalData
					});
				},
				function (err) {
					console.trace(err.message);
					return reply(Boom.badRequest(err.message));
				});

		}.bind(null, this));
	},
	getKpiWidgetDataForCoolerTrackingCoolerVoltage: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload),
			healthVoltage = JSON.parse(this.dashboardQueries.SummaryVoltageCoolerTracking),
			assetSummary = JSON.parse(this.dashboardQueries.assetSummaryCoolerTracking);
		// client Filter
		var clientQuery = {
			"term": {
				"ClientId": clientId
			}
		};
		if (clientId != 0) {
			healthVoltage.query.bool.filter.push(clientQuery);
			assetSummary.query.bool.filter.push(clientQuery);
		}

		//Date Filter
		var isDefaultDateFilter = params.yearWeek || params.dayOfWeek || params.quarter || params.month;
		var dateFilter = [];
		var totalHours = 0

		if (!isDefaultDateFilter && !params.startDate && !params.endDate) {
			var dateRangeQuery = {
				"range": {
					"EventTime": {
						"gte": "now-30d/d"
					}
				}
			};
			healthVoltage.query.bool.filter.push(dateRangeQuery);
			totalHours = defaultHours;
		} else if (!isDefaultDateFilter && params.startDate && params.endDate) {
			var startDate = moment(params.startDate).format('YYYY-MM-DD[T00:00:00]');
			var endDate = moment(params.endDate).format('YYYY-MM-DD[T23:59:59]');
			var dateRangeQuery = {
				"range": {
					"EventTime": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			healthVoltage.query.bool.filter.push(dateRangeQuery);
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
			if (i == 0) {
				healthVoltage.query.bool.filter.push({
					"bool": {
						"should": []
					}
				});
			}
			var dateRangeQuery = {
				"range": {
					"EventTime": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			healthVoltage = util.pushDateQuery(healthVoltage, dateRangeQuery);
		}

		this.dateFilter = dateFilter;

		var reducers = {
			outletReducer: outletReducer,
			salesRepReducer: salesRepReducer,
			alertReducer: alertReducer,
			assetReducer: assetReducer,
			smartDeviceReducer: smartDeviceReducer,
			smartDeviceMovementReducer: smartDeviceMovementReducer,
			smartDevicDoorStatusReducer: smartDevicDoorStatusReducer,
			smartDevicHealthReducer: smartDevicHealthReducer,
			smartDevicePowerReducer: smartDevicePowerReducer,
			smartDeviceInstallationDateReducer: smartDeviceInstallationDateReducer,
			smartDeviceLatestDataReducer: smartDeviceLatestDataReducer
		}

		util.applyReducers(request, params, totalHours, reducers, function (_this, assetIds, locationIds) {
			if (Array.isArray(locationIds)) {
				var locationQuery;
				var locationQueryOutlet;
				locationQuery = {
					"terms": {
						LocationId: locationIds.length != 0 ? locationIds : [-1]
					}
				};
				locationQueryOutlet = {
					"terms": {
						"_id": locationIds.length != 0 ? locationIds : [-1]
					}
				};

				healthVoltage.query.bool.filter.push(locationQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
				var tags = credentials.tags,
					limitLocation = Number(tags.LimitLocation);
				if (Object.keys(request.query).filter(data => data != "startDate" && data != "endDate" && data != "sellerTop" && data != "customerTop" && data != "yearWeek" && data != "dayOfWeek" && data != "quarter" && data != "month").length == 0) {
					if (limitLocation != 0) {
						assetSummary.aggs.Assets.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.SmartAssetCount.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.Locations.filter.bool.must.push({
							"terms": {
								"_id": limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
					} else {
						assetSummary.aggs.Assets.filter.bool.must.push(locationQuery);
						assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
						assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
						assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
					}
				} else {
					assetSummary.aggs.Assets.filter.bool.must.push(locationQuery);
					assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
					assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
					assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
				}
			}
			var tags = credentials.tags,
				limitLocation = Number(tags.LimitLocation);
			if (limitLocation != 0) {
				var filterQuery = {
					"terms": {
						"SalesHierarchyId": {
							"index": "filteredlocations",
							"type": "locationIds",
							"id": credentials.user.UserId,
							"path": "SalesHierarchyId"
						},
						"_cache_key": "experiment_" + credentials.user.UserId
					}

				}

				var filterQueryOutlet = {
					"terms": {
						"SalesHierarchyId": {
							"index": "filteredlocations",
							"type": "locationIds",
							"id": credentials.user.UserId,
							"path": "SalesHierarchyId"
						},
						"_cache_key": "experiment_" + credentials.user.UserId
					}
				}


				assetSummary.aggs.Assets.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssets.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(filterQueryOutlet);
				assetSummary.aggs.TotalSmartAssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.Locations.filter.bool.must.push(filterQueryOutlet);
				assetSummary.aggs.AssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.LocationCount.filter.bool.must.push(filterQueryOutlet);
				healthVoltage.query.bool.filter.push(filterQuery);

			}


			if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
				var smartDeviceTypeQuery = {
					"terms": {
						"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(smartDeviceTypeQuery);
				healthVoltage.query.bool.filter.push(smartDeviceTypeQuery);
			}

			if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
				var assetManufactureQuery = {
					"terms": {
						"AssetManufacturerId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(assetManufactureQuery);
				healthVoltage.query.bool.filter.push(assetManufactureQuery);
			}

			if (request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]) {
				if (request.query.SmartDeviceManufacturerId.constructor !== Array) {
					var toArray = request.query.SmartDeviceManufacturerId;
					request.query.SmartDeviceManufacturerId = [];
					request.query.SmartDeviceManufacturerId.push(toArray);
				}
				var manufacturerSmartDeviceQuery = {
					"terms": {
						"SmartDeviceManufacturerId": request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(manufacturerSmartDeviceQuery)
				healthVoltage.query.bool.filter.push(manufacturerSmartDeviceQuery);
			}

			if (assetIds) {
				var assetQuery = {
					"terms": {
						"AssetId": assetIds
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(assetQuery);
				healthVoltage.query.bool.filter.push(assetQuery);
			}

			if (_this.dateFilter.length > 0) {
				startDate = _this.dateFilter[0].startDate;
				endDate = _this.dateFilter[_this.dateFilter.length - 1].endDate;
			}
			var indexNames = util.getEventsIndexName(startDate, endDate);
			var queries = [{
					key: "eventsvoltage",
					search: {
						index: 'cooler-iot-event', // 'cooler-iot-event',
						body: healthVoltage,
						ignore_unavailable: true
					}
				},
				{
					key: "db",
					search: {
						index: 'cooler-iot-asset,cooler-iot-location',
						body: assetSummary,
						ignore_unavailable: true
					}
				}
			];

			//console.log(JSON.stringify(queries));
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
							VoltageBands: [{
								key: '0-25',
								assets: 0,
								outlets: 0,
								totalAssets: 0
							}, {
								key: '25-50',
								assets: 0,
								outlets: 0,
								totalAssets: 0
							}, {
								key: '50-75',
								assets: 0,
								outlets: 0,
								totalAssets: 0
							}, {
								key: '75-100',
								assets: 0,
								outlets: 0,
								totalAssets: 0
							}, {
								key: '100-125',
								assets: 0,
								outlets: 0,
								totalAssets: 0
							}, {
								key: '125-150',
								assets: 0,
								outlets: 0,
								totalAssets: 0
							}, {
								key: '150-175',
								assets: 0,
								outlets: 0,
								totalAssets: 0
							}, {
								key: '175-200',
								assets: 0,
								outlets: 0,
								totalAssets: 0
							}, {
								key: '200-225',
								assets: 0,
								outlets: 0,
								totalAssets: 0
							}, {
								key: '225-250',
								assets: 0,
								outlets: 0,
								totalAssets: 0
							}, {
								key: '>=250',
								assets: 0,
								outlets: 0,
								totalAssets: 0
							}]
						};

					for (var i = 0, len = values.length; i < len; i++) {
						var value = values[i];
						data[value.config.key] = value.response;
						util.setLogger(value);
					}
					var eventsAgggs = data.eventsvoltage.aggregations;
					var dbAggs = data.db.aggregations;
					var totalAssets = dbAggs.SmartAssetCount.doc_count;
					var voltageMapLocation = [];
					if (eventsAgggs) {
						var smart = eventsAgggs.top_tags.buckets.length;
						eventsAgggs.top_tags.buckets.forEach(function (assetBucket) {
							var VoltageValue = assetBucket.top_hit.hits.hits[0]._source.CoolerVoltage;
							if (VoltageValue == null) {
								smart--;
							} else if (VoltageValue >= 0 && VoltageValue < 25) {
								finalData.VoltageBands[0].assets++;
								finalData.VoltageBands[0].totalAssets = totalAssets;
								voltageMapLocation.push({
									LocationTemp: "0-25",
									Key: assetBucket.top_hit.hits.hits[0]._source.AssetId
								});
							} else if (VoltageValue >= 25 && VoltageValue < 50) {
								finalData.VoltageBands[1].assets++;
								finalData.VoltageBands[1].totalAssets = totalAssets;
								voltageMapLocation.push({
									LocationTemp: "25-50",
									Key: assetBucket.top_hit.hits.hits[0]._source.AssetId
								});
							} else if (VoltageValue >= 50 && VoltageValue < 75) {
								finalData.VoltageBands[2].assets++;
								finalData.VoltageBands[2].totalAssets = totalAssets;
								voltageMapLocation.push({
									LocationTemp: "50-75",
									Key: assetBucket.top_hit.hits.hits[0]._source.AssetId
								});
							} else if (VoltageValue >= 75 && VoltageValue < 100) {
								finalData.VoltageBands[3].assets++;
								finalData.VoltageBands[3].totalAssets = totalAssets;
								voltageMapLocation.push({
									LocationTemp: "75-100",
									Key: assetBucket.top_hit.hits.hits[0]._source.AssetId
								});
							} else if (VoltageValue >= 100 && VoltageValue < 125) {
								finalData.VoltageBands[4].assets++;
								finalData.VoltageBands[4].totalAssets = totalAssets;
								voltageMapLocation.push({
									LocationTemp: "100-125",
									Key: assetBucket.top_hit.hits.hits[0]._source.AssetId
								});
							} else if (VoltageValue >= 125 && VoltageValue < 150) {
								finalData.VoltageBands[5].assets++;
								finalData.VoltageBands[5].totalAssets = totalAssets;
								voltageMapLocation.push({
									LocationTemp: "125-150",
									Key: assetBucket.top_hit.hits.hits[0]._source.AssetId
								});
							} else if (VoltageValue >= 150 && VoltageValue < 175) {
								finalData.VoltageBands[6].assets++;
								finalData.VoltageBands[6].totalAssets = totalAssets;
								voltageMapLocation.push({
									LocationTemp: "150-175",
									Key: assetBucket.top_hit.hits.hits[0]._source.AssetId
								});
							} else if (VoltageValue >= 175 && VoltageValue < 200) {
								finalData.VoltageBands[7].assets++;
								finalData.VoltageBands[7].totalAssets = totalAssets;
								voltageMapLocation.push({
									LocationTemp: "175-200",
									Key: assetBucket.top_hit.hits.hits[0]._source.AssetId
								});
							} else if (VoltageValue >= 200 && VoltageValue < 225) {
								finalData.VoltageBands[8].assets++;
								finalData.VoltageBands[8].totalAssets = totalAssets;
								voltageMapLocation.push({
									LocationTemp: "200-225",
									Key: assetBucket.top_hit.hits.hits[0]._source.AssetId
								});
							} else if (VoltageValue >= 225 && VoltageValue < 250) {
								finalData.VoltageBands[9].assets++;
								finalData.VoltageBands[9].totalAssets = totalAssets;
								voltageMapLocation.push({
									LocationTemp: "225-250",
									Key: assetBucket.top_hit.hits.hits[0]._source.AssetId
								});
							} else if (VoltageValue >= 250) {
								finalData.VoltageBands[10].assets++;
								finalData.VoltageBands[10].totalAssets = totalAssets;
								voltageMapLocation.push({
									LocationTemp: ">=250",
									Key: assetBucket.top_hit.hits.hits[0]._source.AssetId
								});
							}
						});
					}

					var VolMapLocation = [];

					if (dbAggs) {
						dbAggs.SmartLocation.Location.buckets.forEach(function (locationData) {
							var assetid = locationData.key;
							var loc = voltageMapLocation.filter(data => data.Key == assetid);
							if (loc.length == 0) {
								//loc[0].LastData = "No data for more then 90 days";
							} else {
								VolMapLocation.push({
									Id: loc[0].Key,
									Band: loc[0].LocationTemp,
									LocationGeo: {
										"lat": locationData.Lat.bounds.top_left.lat,
										"lon": locationData.Lat.bounds.top_left.lon
									}
								})
							}
						});
					}

					if (smart < totalAssets) {
						finalData.VoltageBands.push({
							key: "No-Data",
							assets: dbAggs.SmartAssetCount.doc_count - smart, //dbAggs.Assets.doc_count - smart,
							outlets: 0,
							totalAssets: totalAssets
						});
					}

					finalData.summary = {
						totalCooler: totalAssets,
						VolMapLocation: VolMapLocation
					};

					return reply({
						success: true,
						data: finalData
					});
				},
				function (err) {
					console.trace(err.message);
					return reply(Boom.badRequest(err.message));
				});

		}.bind(null, this));
	},
	getKpiWidgetDataForCoolerTrackingAlarmType: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload),
			assetSummary = JSON.parse(this.dashboardQueries.assetSummaryCoolerTracking),
			alarmSummary = JSON.parse(this.dashboardQueries.alarmSummaryCoolerTracking);

		var clientQuery = {
			"term": {
				"ClientId": clientId
			}
		};
		if (clientId != 0) {
			alarmSummary.query.bool.filter.push(clientQuery);
			assetSummary.query.bool.filter.push(clientQuery);
		}

		var isdeleted = {
			"term": {
				"IsDeleted": false
			}
		};
		alarmSummary.query.bool.filter.push(isdeleted);
		var isDefaultDateFilter = params.yearWeek || params.dayOfWeek || params.quarter || params.month;
		var dateFilter = [];
		var totalHours = 0;
		var queryDateGeaterRangeFilter = {
			"range": {
				"StartEventTime": {
					"gte": "now-30d/d"
				}
			}
		};
		var queryDateLesserRangeFilter = {
			"range": {
				"StartEventTime": {
					"lte": "now"
				}
			}
		};
		if (!isDefaultDateFilter && params.startDate && params.endDate) {
			var startDate = moment(params.startDate).format('YYYY-MM-DD[T00:00:00]');
			var endDate = moment(params.endDate).format('YYYY-MM-DD[T23:59:59]');
			queryDateGeaterRangeFilter = {
				"range": {
					"StartEventTime": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			queryDateLesserRangeFilter = {
				"range": {
					"StartEventTime": {
						"lte": endDate
					}
				}
			};
			alarmSummary.aggs.ByType.aggs.AlertClosed.filter.bool.must.push(queryDateGeaterRangeFilter);


			var startWeek = moment.utc(startDate).week('monday').week() - 1;
			var endWeek = moment.utc(endDate).week('monday').week();

			var startYear = moment.utc(startDate).year();
			var endYear = moment.utc(endDate).year();
			var currentYear = moment.utc().year();
			if (currentYear > startYear) {
				var weekinYear = moment.utc(params.startDate).weeksInYear();
				startWeek = startWeek - weekinYear * (currentYear - startYear);
				endWeek = endWeek - weekinYear * (currentYear - endYear);
			}
			for (var i = startWeek; i <= endWeek; i++) {
				var startDateWeek = moment().day("Monday").week(i).format('YYYY-MM-DD[T00:00:00]');
				var startDateWeekValue = moment.utc().day("Monday").week(i).startOf('day').valueOf();
				if (moment.utc(startDate).week('monday').week() === i) {
					startDateWeek = startDate
				}

			}
			totalHours = moment(endDate).diff(moment(startDate), 'hours') + 1;
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

			queryDateGeaterRangeFilter = {
				"range": {
					"StartEventTime": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			queryDateLesserRangeFilter = {
				"range": {
					"StartEventTime": {
						"lte": endDate
					}
				}
			};
			alarmSummary.aggs.ByType.aggs.AlertClosed.filter.bool.must.push(queryDateGeaterRangeFilter);
			var startWeek = moment.utc(startDate).week('monday').week() - 1;
			var endWeek = moment.utc(endDate).week('monday').week();

			var startYear = moment.utc(startDate).year();
			var endYear = moment.utc(endDate).year();
			var currentYear = moment.utc().year();
			if (currentYear > startYear) {
				var weekinYear = moment.utc(params.startDate).weeksInYear();
				startWeek = startWeek - weekinYear * (currentYear - startYear);
				endWeek = endWeek - weekinYear * (currentYear - endYear);
			}
			for (var j = startWeek; j <= endWeek; j++) {
				var startDateWeek = moment().day("Monday").week(j).format('YYYY-MM-DD[T00:00:00]');
				var startDateWeekValue = moment.utc().day("Monday").week(j).startOf('day').valueOf();
				if (moment.utc(startDate).week('monday').week() === j) {
					startDateWeek = startDate
				}

			}
		}

		this.dateFilter = dateFilter;

		var reducers = {
			outletReducer: outletReducer,
			salesRepReducer: salesRepReducer,
			alertReducer: alertReducer,
			assetReducer: assetReducer,
			smartDeviceReducer: smartDeviceReducer,
			smartDeviceMovementReducer: smartDeviceMovementReducer,
			smartDevicDoorStatusReducer: smartDevicDoorStatusReducer,
			smartDevicHealthReducer: smartDevicHealthReducer,
			smartDevicePowerReducer: smartDevicePowerReducer,
			smartDeviceInstallationDateReducer: smartDeviceInstallationDateReducer,
			smartDeviceLatestDataReducer: smartDeviceLatestDataReducer
		}

		util.applyReducers(request, params, totalHours, reducers, function (_this, assetIds, locationIds) {
			if (Array.isArray(locationIds)) {
				var locationTerm;
				var locationQueryOutlet;

				locationTerm = {
					"terms": {
						LocationId: locationIds.length != 0 ? locationIds : [-1]
					}
				};
				locationQueryOutlet = {
					"terms": {
						"_id": locationIds.length != 0 ? locationIds : [-1]
					}
				};

				assetSummary.aggs.Assets.filter.bool.must.push(locationTerm);
				assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationTerm);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationTerm);
				alarmSummary.aggs.ByType.aggs.AlertClosed.filter.bool.must.push(locationTerm);
				var tags = credentials.tags,
					limitLocation = Number(tags.LimitLocation);
				if (Object.keys(request.query).filter(data => data != "startDate" && data != "endDate" && data != "sellerTop" && data != "customerTop" && data != "yearWeek" && data != "dayOfWeek" && data != "quarter" && data != "month").length == 0) {
					if (limitLocation != 0) {
						assetSummary.aggs.Assets.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.Locations.filter.bool.must.push({
							"terms": {
								"_id": limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.SmartAssetCount.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});

						assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});

					} else {
						assetSummary.aggs.Assets.filter.bool.must.push(locationTerm);
						assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationTerm);
						assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationTerm);
						assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
					}
				} else {
					assetSummary.aggs.Assets.filter.bool.must.push(locationTerm);
					assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationTerm);
					assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationTerm);
					assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
				}
			}
			var tags = credentials.tags,
				limitLocation = Number(tags.LimitLocation);
			if (limitLocation != 0) {
				var filterQuery = {
					"terms": {
						"SalesHierarchyId": {
							"index": "filteredlocations",
							"type": "locationIds",
							"id": credentials.user.UserId,
							"path": "SalesHierarchyId"
						},
						"_cache_key": "experiment_" + credentials.user.UserId
					}

				}

				var filterQueryOutlet = {
					"terms": {
						"SalesHierarchyId": {
							"index": "filteredlocations",
							"type": "locationIds",
							"id": credentials.user.UserId,
							"path": "SalesHierarchyId"
						},
						"_cache_key": "experiment_" + credentials.user.UserId
					}
				}

				assetSummary.aggs.AssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.Assets.filter.bool.must.push(filterQuery);
				assetSummary.aggs.LocationCount.filter.bool.must.push(filterQueryOutlet);
				assetSummary.aggs.Locations.filter.bool.must.push(filterQueryOutlet);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(filterQuery);
				assetSummary.aggs.TotalSmartAssetCount.filter.bool.must.push(filterQuery);

				alarmSummary.query.bool.filter.push(filterQuery);


			}

			if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
				var smartDeviceTypeQuery = {
					"terms": {
						"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(smartDeviceTypeQuery);
				alarmSummary.query.bool.filter.push(smartDeviceTypeQuery);
			}

			if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
				var assetManufactureQuery = {
					"terms": {
						"AssetManufacturerId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(assetManufactureQuery);
				alarmSummary.query.bool.filter.push(assetManufactureQuery);
			}

			if (request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]) {
				if (request.query.SmartDeviceManufacturerId.constructor !== Array) {
					var toArray = request.query.SmartDeviceManufacturerId;
					request.query.SmartDeviceManufacturerId = [];
					request.query.SmartDeviceManufacturerId.push(toArray);
				}

				var manufacturerSmartDeviceQuery = {
					"terms": {
						"SmartDeviceManufacturerId": request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(manufacturerSmartDeviceQuery);
				alarmSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
			}

			if (assetIds) {
				var assetQuery = {
					"terms": {
						"AssetId": assetIds
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(assetQuery);
				alarmSummary.query.bool.filter.push(assetQuery);

			}

			var queries = [{
					key: "db",
					search: {
						index: 'cooler-iot-asset,cooler-iot-location',
						body: assetSummary,
						ignore_unavailable: true
					}
				},
				{
					key: "alert",
					search: {
						index: 'cooler-iot-smartdevicealarmtyperecord',
						body: alarmSummary,
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
			var data = {};
			Promise.all(promises).then(function (values) {
				var data = {},
					finalData = {};
				for (var i = 0, len = values.length; i < len; i++) {
					var value = values[i];
					data[value.config.key] = value.response;
					util.setLogger(value);
				}
				var dbAggs = data.db.aggregations;
				var dbAlert = data.alert.aggregations;
				var alarmMapLocation = [];
				if (dbAlert) {
					if (data.hasOwnProperty('alert')) {

						finalData.alertsByTypeBoth = [];
						data.alert.aggregations.ByType.buckets.forEach(function (bucket) {
							var total = bucket.AlertClosed.doc_count;
							if (bucket.key != 0) {
								finalData.alertsByTypeBoth.push({
									AlertType: bucket.AlarmTypeName.hits.hits[0]._source.AlarmType,
									Count: total
								});
								alarmMapLocation.push({
									LocationTemp: "Alarm",
									Key: bucket.AlarmTypeName.hits.hits[0]._source.AssetId
								});
							}
						});
					}
				}

				var AlarmTypeMapLocation = [];

				if (dbAggs) {
					dbAggs.SmartLocation.Location.buckets.forEach(function (locationData) {
						var assetid = locationData.key;
						var loc = alarmMapLocation.filter(data => data.Key == assetid);
						if (loc.length == 0) {
							//loc[0].LastData = "No data for more then 90 days";
						} else {
							AlarmTypeMapLocation.push({
								Id: loc[0].Key,
								Band: loc[0].LocationTemp,
								LocationGeo: {
									"lat": locationData.Lat.bounds.top_left.lat,
									"lon": locationData.Lat.bounds.top_left.lon
								}
							})
						}
					});
				}

				finalData.summary = {
					AlarmTypeMapLocation: AlarmTypeMapLocation
				};

				return reply({
					success: true,
					data: finalData
				});

			}, function (err) {
				console.trace(err.message);
				return reply(Boom.badRequest(err.message));
			});
		}.bind(null, this));
	},
	getKpiWidgetDataForCoolerTrackingCoolerMissingWrong: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload),
			assetSummary = JSON.parse(this.dashboardQueries.assetSummaryCoolerTracking),
			coolerfound = JSON.parse(this.dashboardQueries.FoundCoolerTracking),
			missingSummary = JSON.parse(this.dashboardQueries.MissWrongCoolerTracking);

		var clientQuery = {
			"term": {
				"ClientId": clientId
			}
		};
		if (clientId != 0) {
			missingSummary.query.bool.filter.push(clientQuery);
			assetSummary.query.bool.filter.push(clientQuery);
			coolerfound.query.bool.filter.push(clientQuery);
		}

		//Date Filter
		var isDefaultDateFilter = params.yearWeek || params.dayOfWeek || params.quarter || params.month;
		var dateFilter = [];
		var totalHours = 0

		if (!isDefaultDateFilter && !params.startDate && !params.endDate) {
			var dateRangeQuery = {
				"range": {
					"VisitDateTime": {
						"gte": "now-30d/d"
					}
				}
			};
			missingSummary.query.bool.filter.push(dateRangeQuery);
			totalHours = defaultHours;
		} else if (!isDefaultDateFilter && params.startDate && params.endDate) {
			var startDate = moment(params.startDate).format('YYYY-MM-DD[T00:00:00]');
			var endDate = moment(params.endDate).format('YYYY-MM-DD[T23:59:59]');
			var dateRangeQuery = {
				"range": {
					"VisitDateTime": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			missingSummary.query.bool.filter.push(dateRangeQuery);

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
			if (i == 0) {
				missingSummary.query.bool.filter.push({
					"bool": {
						"should": []
					}
				});
			}
			var dateRangeQuery = {
				"range": {
					"VisitDateTime": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			missingSummary = util.pushDateQuery(missingSummary, dateRangeQuery);
		}

		this.dateFilter = dateFilter;

		var reducers = {
			outletReducer: outletReducer,
			salesRepReducer: salesRepReducer,
			alertReducer: alertReducer,
			assetReducer: assetReducer,
			smartDeviceReducer: smartDeviceReducer,
			smartDeviceMovementReducer: smartDeviceMovementReducer,
			smartDevicDoorStatusReducer: smartDevicDoorStatusReducer,
			smartDevicHealthReducer: smartDevicHealthReducer,
			smartDevicePowerReducer: smartDevicePowerReducer,
			smartDeviceInstallationDateReducer: smartDeviceInstallationDateReducer,
			smartDeviceLatestDataReducer: smartDeviceLatestDataReducer
		}

		util.applyReducers(request, params, totalHours, reducers, function (_this, assetIds, locationIds) {
			if (Array.isArray(locationIds)) {
				var locationQuery;
				var locationQueryOutlet;
				locationQuery = {
					"terms": {
						LocationId: locationIds.length != 0 ? locationIds : [-1]
					}
				};
				locationQueryOutlet = {
					"terms": {
						"_id": locationIds.length != 0 ? locationIds : [-1]
					}
				};

				missingSummary.query.bool.filter.push(locationQuery);
				coolerfound.query.bool.filter.push(locationQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
				var tags = credentials.tags,
					limitLocation = Number(tags.LimitLocation);
				if (Object.keys(request.query).filter(data => data != "startDate" && data != "endDate" && data != "sellerTop" && data != "customerTop" && data != "yearWeek" && data != "dayOfWeek" && data != "quarter" && data != "month").length == 0) {
					if (limitLocation != 0) {
						assetSummary.aggs.Assets.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.SmartAssetCount.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.Locations.filter.bool.must.push({
							"terms": {
								"_id": limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
					} else {
						assetSummary.aggs.Assets.filter.bool.must.push(locationQuery);
						assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
						assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
						assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
					}
				} else {
					assetSummary.aggs.Assets.filter.bool.must.push(locationQuery);
					assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
					assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
					assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
				}
			}
			var tags = credentials.tags,
				limitLocation = Number(tags.LimitLocation);
			if (limitLocation != 0) {
				var filterQuery = {
					"terms": {
						"SalesHierarchyId": {
							"index": "filteredlocations",
							"type": "locationIds",
							"id": credentials.user.UserId,
							"path": "SalesHierarchyId"
						},
						"_cache_key": "experiment_" + credentials.user.UserId
					}
				}

				var filterQueryOutlet = {
					"terms": {
						"SalesHierarchyId": {
							"index": "filteredlocations",
							"type": "locationIds",
							"id": credentials.user.UserId,
							"path": "SalesHierarchyId"
						},
						"_cache_key": "experiment_" + credentials.user.UserId
					}
				}

				assetSummary.aggs.Assets.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssets.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(filterQueryOutlet);
				assetSummary.aggs.TotalSmartAssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.Locations.filter.bool.must.push(filterQueryOutlet);
				assetSummary.aggs.AssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.LocationCount.filter.bool.must.push(filterQueryOutlet);
				coolerfound.query.bool.filter.push(filterQuery);
				missingSummary.query.bool.filter.push(filterQuery);
			}

			if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
				var smartDeviceTypeQuery = {
					"terms": {
						"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(smartDeviceTypeQuery);
				coolerfound.query.bool.filter.push(smartDeviceTypeQuery);
				missingSummary.query.bool.filter.push(smartDeviceTypeQuery);
			}

			if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
				var assetManufactureQuery = {
					"terms": {
						"AssetManufacturerId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(assetManufactureQuery);
				coolerfound.query.bool.filter.push(assetManufactureQuery);
				missingSummary.query.bool.filter.push(assetManufactureQuery);
			}

			if (request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]) {
				if (request.query.SmartDeviceManufacturerId.constructor !== Array) {
					var toArray = request.query.SmartDeviceManufacturerId;
					request.query.SmartDeviceManufacturerId = [];
					request.query.SmartDeviceManufacturerId.push(toArray);
				}
				var manufacturerSmartDeviceQuery = {
					"terms": {
						"SmartDeviceManufacturerId": request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(manufacturerSmartDeviceQuery)
				coolerfound.query.bool.filter.push(manufacturerSmartDeviceQuery);
				missingSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
			}

			if (assetIds) {
				var assetQuery = {
					"terms": {
						"AssetId": assetIds
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(assetQuery);
				coolerfound.query.bool.filter.push(assetQuery);
				missingSummary.query.bool.filter.push(assetQuery);
			}

			if (_this.dateFilter.length > 0) {
				startDate = _this.dateFilter[0].startDate;
				endDate = _this.dateFilter[_this.dateFilter.length - 1].endDate;
			}
			var lastEndDate = endDate;
			coolerfound.aggs.Last30Days.filter.bool.filter[0].range.VisitDateTime.gte = moment(lastEndDate).add(-29, 'days').format('YYYY-MM-DD[T00:00:00]');
			coolerfound.aggs.Last30Days.filter.bool.filter[0].range.VisitDateTime.lte = lastEndDate;

			coolerfound.aggs.Last60Days.filter.bool.filter[0].range.VisitDateTime.gte = moment(lastEndDate).add(-59, 'days').format('YYYY-MM-DD[T00:00:00]');
			coolerfound.aggs.Last60Days.filter.bool.filter[0].range.VisitDateTime.lte = moment(lastEndDate).add(-30, 'days').format('YYYY-MM-DD[T23:59:59]');

			coolerfound.aggs.Last90Days.filter.bool.filter[0].range.VisitDateTime.gte = moment(lastEndDate).add(-89, 'days').format('YYYY-MM-DD[T00:00:00]');
			coolerfound.aggs.Last90Days.filter.bool.filter[0].range.VisitDateTime.lte = moment(lastEndDate).add(-60, 'days').format('YYYY-MM-DD[T23:59:59]');

			var indexNames = util.getEventsIndexName(startDate, endDate);
			var queries = [{
					key: "MissingEvents",
					search: {
						index: 'cooler-iot-assetvisithistory', // 'cooler-iot-event',
						body: missingSummary,
						ignore_unavailable: true
					}
				},
				{
					key: "db",
					search: {
						index: 'cooler-iot-asset,cooler-iot-location',
						body: assetSummary,
						ignore_unavailable: true
					}
				},
				{
					key: "coolerfound",
					search: {
						index: 'cooler-iot-assetvisithistory', // 'cooler-iot-event',
						body: coolerfound,
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
							"CoolerTracking": [{
									"name": "Last Seen <= 30",
									"Missing": 0,
									"Wrong": 0,
									"Found": 0,
									"color": "#2B908F"
								},
								{
									"name": "Last Seen > 30, <60 days",
									"Missing": 0,
									"Wrong": 0,
									"Found": 0,
									"color": "#90EE7E"
								},
								{
									"name": "Last Seen > 60, <90 days",
									"Missing": 0,
									"Wrong": 0,
									"Found": 0,
									"color": "#F45B5B"
								},
								{
									"name": "Not Applicable",
									"NotVisited": 0,
									"color": "#F45B5B"
								}
							]
						};
					for (var i = 0, len = values.length; i < len; i++) {
						var value = values[i];
						data[value.config.key] = value.response;
						util.setLogger(value);
					}

					var coolerMissWrong = data.coolerfound.aggregations;
					var coolerWrong = data.MissingEvents.aggregations;
					var dbAggs = data.db.aggregations;
					var totalAssets = dbAggs.SmartAssetCount.doc_count;
					var TrackingChartMapLocation = [];
					if (coolerMissWrong) {
						coolerMissWrong.Last30Days.assets.buckets.forEach(function (MissWrongBucket) {
							var status = MissWrongBucket.top_hit.hits.hits[0]._source.Status;
							if (status == "Found") {
								finalData.CoolerTracking[0].Found++;
								TrackingChartMapLocation.push({
									LocationTemp: "Last30Days: Found",
									Key: MissWrongBucket.top_hit.hits.hits[0]._source.AssetId
								});
							} else if (status == "Missing") {
								finalData.CoolerTracking[0].Missing++;
								TrackingChartMapLocation.push({
									LocationTemp: "Last30Days: Missing",
									Key: MissWrongBucket.top_hit.hits.hits[0]._source.AssetId
								});
							} else if (status == "Wrong Location") {
								finalData.CoolerTracking[0].Wrong++;
								TrackingChartMapLocation.push({
									LocationTemp: "Last30Days: WrongLocation",
									Key: MissWrongBucket.top_hit.hits.hits[0]._source.AssetId
								});
							}
						});
						coolerMissWrong.Last60Days.assets.buckets.forEach(function (MissWrongBucket) {
							var status60 = MissWrongBucket.top_hit.hits.hits[0]._source.Status;
							if (status60 == "Found") {
								finalData.CoolerTracking[1].Found++;
								TrackingChartMapLocation.push({
									LocationTemp: "Last60Days: Found",
									Key: MissWrongBucket.top_hit.hits.hits[0]._source.AssetId
								});
							} else if (status60 == "Missing") {
								finalData.CoolerTracking[1].Missing++;
								TrackingChartMapLocation.push({
									LocationTemp: "Last60Days: Missing",
									Key: MissWrongBucket.top_hit.hits.hits[0]._source.AssetId
								});
							} else if (status60 == "Wrong Location") {
								finalData.CoolerTracking[1].Wrong++;
								TrackingChartMapLocation.push({
									LocationTemp: "Last60Days: WrongLocation",
									Key: MissWrongBucket.top_hit.hits.hits[0]._source.AssetId
								});
							}
						});
						coolerMissWrong.Last90Days.assets.buckets.forEach(function (MissWrongBucket) {
							var status90 = MissWrongBucket.top_hit.hits.hits[0]._source.Status;
							if (status90 == "Found") {
								finalData.CoolerTracking[2].Found++;
								TrackingChartMapLocation.push({
									LocationTemp: "Last90Days: Found",
									Key: MissWrongBucket.top_hit.hits.hits[0]._source.AssetId
								});
							} else if (status90 == "Missing") {
								finalData.CoolerTracking[2].Missing++;
								TrackingChartMapLocation.push({
									LocationTemp: "Last90Days: Missing",
									Key: MissWrongBucket.top_hit.hits.hits[0]._source.AssetId
								});
							} else if (status90 == "Wrong Location") {
								finalData.CoolerTracking[2].Wrong++;
								TrackingChartMapLocation.push({
									LocationTemp: "Last90Days: WrongLocation",
									Key: MissWrongBucket.top_hit.hits.hits[0]._source.AssetId
								});
							}
						});
					}
					var alldata = (finalData.CoolerTracking[0].Found + finalData.CoolerTracking[0].Missing + finalData.CoolerTracking[0].Wrong +
						finalData.CoolerTracking[1].Found + finalData.CoolerTracking[1].Missing + finalData.CoolerTracking[1].Wrong +
						finalData.CoolerTracking[2].Found + finalData.CoolerTracking[2].Missing + finalData.CoolerTracking[2].Wrong);
					if (alldata > totalAssets){
						finalData.CoolerTracking[3].NotVisited = 0;
					}else{
						finalData.CoolerTracking[3].NotVisited = totalAssets-alldata;
					}
						var Wrong = 0;
					var Miss = 0;

					if (coolerWrong) {
						coolerWrong.top_tags.buckets.forEach(function (MissWrongBucket) {
							var status = MissWrongBucket.top_hit.hits.hits[0]._source.Status;
							if (status == "Wrong Location") {
								Wrong++;
							}
							if (status == "Missing") {
								Miss++;
							}
						});
					}

					var TrackingMapLocation = [];

					if (dbAggs) {
						dbAggs.SmartLocation.Location.buckets.forEach(function (locationData) {
							var assetid = locationData.key;
							var loc = TrackingChartMapLocation.filter(data => data.Key == assetid);
							if (loc.length == 0) {
								//loc[0].LastData = "No data for more then 90 days";
							} else {
								TrackingMapLocation.push({
									Id: loc[0].Key,
									Band: loc[0].LocationTemp,
									LocationGeo: {
										"lat": locationData.Lat.bounds.top_left.lat,
										"lon": locationData.Lat.bounds.top_left.lon
									}
								})
							}
						});
					}

					finalData.Summary = {
						wrongcooler: Wrong,
						misscooler: Miss,
						totalCooler: totalAssets,
						TrackingMapLocation: TrackingMapLocation
					};

					return reply({
						success: true,
						data: finalData
					});
				},
				function (err) {
					console.trace(err.message);
					return reply(Boom.badRequest(err.message));
				});

		}.bind(null, this));
	},
	getKpiWidgetDataForCoolerTrackingCSI: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload),
			assetSummary = JSON.parse(this.dashboardQueries.assetSummaryCoolerTracking),
			missingSummary = JSON.parse(this.dashboardQueries.MissCoolerCSI),
			tempcsiSummary = JSON.parse(this.dashboardQueries.TemperatureCSI),
			powercsiSummary = JSON.parse(this.dashboardQueries.PowerCSI),
			doorcsiSummary = JSON.parse(this.dashboardQueries.DoorCSI);

		var clientQuery = {
			"term": {
				"ClientId": clientId
			}
		};
		if (clientId != 0) {
			missingSummary.query.bool.filter.push(clientQuery);
			assetSummary.query.bool.filter.push(clientQuery);
			tempcsiSummary.query.bool.filter.push(clientQuery);
			powercsiSummary.query.bool.filter.push(clientQuery);
			doorcsiSummary.query.bool.filter.push(clientQuery);
		}

		//Date Filter
		var isDefaultDateFilter = params.yearWeek || params.dayOfWeek || params.quarter || params.month;
		var dateFilter = [];
		var totalHours = 0

		if (!isDefaultDateFilter && !params.startDate && !params.endDate) {
			var dateRangeQuery = {
				"range": {
					"VisitDateTime": {
						"gte": "now-30d/d"
					}
				}
			};
			//missingSummary.query.bool.filter.push(dateRangeQuery);
			totalHours = defaultHours;
		} else if (!isDefaultDateFilter && params.startDate && params.endDate) {
			var startDate = moment(params.startDate).format('YYYY-MM-DD[T00:00:00]');
			var endDate = moment(params.endDate).format('YYYY-MM-DD[T23:59:59]');
			var dateRangeQuery = {
				"range": {
					"VisitDateTime": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			//missingSummary.query.bool.filter.push(dateRangeQuery);

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
			if (i == 0) {
				/*missingSummary.query.bool.filter.push({
					"bool": {
						"should": []
					}
				});*/
			}
			var dateRangeQuery = {
				"range": {
					"VisitDateTime": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			//missingSummary = util.pushDateQuery(missingSummary, dateRangeQuery);
		}

		this.dateFilter = dateFilter;

		var reducers = {
			outletReducer: outletReducer,
			salesRepReducer: salesRepReducer,
			alertReducer: alertReducer,
			assetReducer: assetReducer,
			smartDeviceReducer: smartDeviceReducer,
			smartDeviceMovementReducer: smartDeviceMovementReducer,
			smartDevicDoorStatusReducer: smartDevicDoorStatusReducer,
			smartDevicHealthReducer: smartDevicHealthReducer,
			smartDevicePowerReducer: smartDevicePowerReducer,
			smartDeviceInstallationDateReducer: smartDeviceInstallationDateReducer,
			smartDeviceLatestDataReducer: smartDeviceLatestDataReducer
		}

		util.applyReducers(request, params, totalHours, reducers, function (_this, assetIds, locationIds) {
			if (Array.isArray(locationIds)) {
				var locationQuery;
				var locationQueryOutlet;
				locationQuery = {
					"terms": {
						LocationId: locationIds.length != 0 ? locationIds : [-1]
					}
				};
				locationQueryOutlet = {
					"terms": {
						"_id": locationIds.length != 0 ? locationIds : [-1]
					}
				};

				missingSummary.query.bool.filter.push(locationQuery);
				tempcsiSummary.query.bool.filter.push(locationQuery);
				powercsiSummary.query.bool.filter.push(locationQuery);
				doorcsiSummary.query.bool.filter.push(locationQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
				var tags = credentials.tags,
					limitLocation = Number(tags.LimitLocation);
				if (Object.keys(request.query).filter(data => data != "startDate" && data != "endDate" && data != "sellerTop" && data != "customerTop" && data != "yearWeek" && data != "dayOfWeek" && data != "quarter" && data != "month").length == 0) {
					if (limitLocation != 0) {
						assetSummary.aggs.Assets.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.SmartAssetCount.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.Locations.filter.bool.must.push({
							"terms": {
								"_id": limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
						assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
					} else {
						assetSummary.aggs.Assets.filter.bool.must.push(locationQuery);
						assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
						assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
						assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
					}
				} else {
					assetSummary.aggs.Assets.filter.bool.must.push(locationQuery);
					assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
					assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
					assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
				}
			}
			var tags = credentials.tags,
				limitLocation = Number(tags.LimitLocation);
			if (limitLocation != 0) {
				var filterQuery = {
					"terms": {
						"SalesHierarchyId": {
							"index": "filteredlocations",
							"type": "locationIds",
							"id": credentials.user.UserId,
							"path": "SalesHierarchyId"
						},
						"_cache_key": "experiment_" + credentials.user.UserId
					}
				}

				var filterQueryOutlet = {
					"terms": {
						"SalesHierarchyId": {
							"index": "filteredlocations",
							"type": "locationIds",
							"id": credentials.user.UserId,
							"path": "SalesHierarchyId"
						},
						"_cache_key": "experiment_" + credentials.user.UserId
					}
				}

				assetSummary.aggs.Assets.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartAssets.filter.bool.must.push(filterQuery);
				assetSummary.aggs.SmartLocation.filter.bool.must.push(filterQueryOutlet);
				assetSummary.aggs.TotalSmartAssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.Locations.filter.bool.must.push(filterQueryOutlet);
				assetSummary.aggs.AssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.LocationCount.filter.bool.must.push(filterQueryOutlet);
				missingSummary.query.bool.filter.push(filterQuery);
				tempcsiSummary.query.bool.filter.push(filterQuery);
				powercsiSummary.query.bool.filter.push(filterQuery);
				doorcsiSummary.query.bool.filter.push(filterQuery);
			}

			if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
				var smartDeviceTypeQuery = {
					"terms": {
						"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(smartDeviceTypeQuery);
				missingSummary.query.bool.filter.push(smartDeviceTypeQuery);
				tempcsiSummary.query.bool.filter.push(smartDeviceTypeQuery);
				powercsiSummary.query.bool.filter.push(smartDeviceTypeQuery);
				doorcsiSummary.query.bool.filter.push(smartDeviceTypeQuery);
			}

			if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
				var assetManufactureQuery = {
					"terms": {
						"AssetManufacturerId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(assetManufactureQuery);
				missingSummary.query.bool.filter.push(assetManufactureQuery);
				tempcsiSummary.query.bool.filter.push(assetManufactureQuery);
				powercsiSummary.query.bool.filter.push(assetManufactureQuery);
				doorcsiSummary.query.bool.filter.push(assetManufactureQuery);
			}

			if (request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]) {
				if (request.query.SmartDeviceManufacturerId.constructor !== Array) {
					var toArray = request.query.SmartDeviceManufacturerId;
					request.query.SmartDeviceManufacturerId = [];
					request.query.SmartDeviceManufacturerId.push(toArray);
				}
				var manufacturerSmartDeviceQuery = {
					"terms": {
						"SmartDeviceManufacturerId": request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(manufacturerSmartDeviceQuery)
				missingSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
				tempcsiSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
				powercsiSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
				doorcsiSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
			}

			if (assetIds) {
				var assetQuery = {
					"terms": {
						"AssetId": assetIds
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(assetQuery);
				missingSummary.query.bool.filter.push(assetQuery);
				tempcsiSummary.query.bool.filter.push(assetQuery);
				powercsiSummary.query.bool.filter.push(assetQuery);
				doorcsiSummary.query.bool.filter.push(assetQuery);
			}

			if (_this.dateFilter.length > 0) {
				startDate = _this.dateFilter[0].startDate;
				endDate = _this.dateFilter[_this.dateFilter.length - 1].endDate;
			}
			var lastEndDate = endDate;
			missingSummary.aggs.Current.filter.bool.filter[0].range.VisitDateTime.gte = moment(lastEndDate).subtract('months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
			missingSummary.aggs.Current.filter.bool.filter[0].range.VisitDateTime.lte = lastEndDate;

			missingSummary.aggs.Previous.filter.bool.filter[0].range.VisitDateTime.gte = moment(lastEndDate).subtract(1, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
			missingSummary.aggs.Previous.filter.bool.filter[0].range.VisitDateTime.lte = moment(lastEndDate).subtract(1, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

			missingSummary.aggs.MonthBack.filter.bool.filter[0].range.VisitDateTime.gte = moment(lastEndDate).subtract(2, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
			missingSummary.aggs.MonthBack.filter.bool.filter[0].range.VisitDateTime.lte = moment(lastEndDate).subtract(2, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

			tempcsiSummary.aggs.Current.filter.bool.filter[0].range.EventTime.gte = moment(lastEndDate).subtract('months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
			tempcsiSummary.aggs.Current.filter.bool.filter[0].range.EventTime.lte = lastEndDate;

			tempcsiSummary.aggs.Previous.filter.bool.filter[0].range.EventTime.gte = moment(lastEndDate).subtract(1, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
			tempcsiSummary.aggs.Previous.filter.bool.filter[0].range.EventTime.lte = moment(lastEndDate).subtract(1, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

			tempcsiSummary.aggs.MonthBack.filter.bool.filter[0].range.EventTime.gte = moment(lastEndDate).subtract(2, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
			tempcsiSummary.aggs.MonthBack.filter.bool.filter[0].range.EventTime.lte = moment(lastEndDate).subtract(2, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

			powercsiSummary.aggs.Current.filter.bool.filter[0].range.EventTime.gte = moment(lastEndDate).subtract('months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
			powercsiSummary.aggs.Current.filter.bool.filter[0].range.EventTime.lte = lastEndDate;

			powercsiSummary.aggs.Previous.filter.bool.filter[0].range.EventTime.gte = moment(lastEndDate).subtract(1, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
			powercsiSummary.aggs.Previous.filter.bool.filter[0].range.EventTime.lte = moment(lastEndDate).subtract(1, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

			powercsiSummary.aggs.MonthBack.filter.bool.filter[0].range.EventTime.gte = moment(lastEndDate).subtract(2, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
			powercsiSummary.aggs.MonthBack.filter.bool.filter[0].range.EventTime.lte = moment(lastEndDate).subtract(2, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');


			doorcsiSummary.aggs.Current.filter.bool.filter[0].range.EventTime.gte = moment(lastEndDate).subtract('months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
			doorcsiSummary.aggs.Current.filter.bool.filter[0].range.EventTime.lte = lastEndDate;

			doorcsiSummary.aggs.Previous.filter.bool.filter[0].range.EventTime.gte = moment(lastEndDate).subtract(1, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
			doorcsiSummary.aggs.Previous.filter.bool.filter[0].range.EventTime.lte = moment(lastEndDate).subtract(1, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

			doorcsiSummary.aggs.MonthBack.filter.bool.filter[0].range.EventTime.gte = moment(lastEndDate).subtract(2, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
			doorcsiSummary.aggs.MonthBack.filter.bool.filter[0].range.EventTime.lte = moment(lastEndDate).subtract(2, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

			var indexNames = util.getEventsIndexName(startDate, endDate);
			var queries = [{
					key: "MissingEvents",
					search: {
						index: 'cooler-iot-assetvisithistory', // 'cooler-iot-event',
						body: missingSummary,
						ignore_unavailable: true
					}
				},
				{
					key: "db",
					search: {
						index: 'cooler-iot-asset,cooler-iot-location',
						body: assetSummary,
						ignore_unavailable: true
					}
				},
				{
					key: "TemperatureEvents",
					search: {
						index: 'cooler-iot-event', // 'cooler-iot-event'
						body: tempcsiSummary,
						ignore_unavailable: true
					}
				},
				{
					key: "PowerEvents",
					search: {
						index: 'cooler-iot-event', // 'cooler-iot-event'
						body: powercsiSummary,
						ignore_unavailable: true
					}
				},
				{
					key: "DoorEvents",
					search: {
						index: 'cooler-iot-event', // 'cooler-iot-event'
						body: doorcsiSummary,
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
						finalData = {};
					for (var i = 0, len = values.length; i < len; i++) {
						var value = values[i];
						data[value.config.key] = value.response;
						util.setLogger(value);
					}

					var dbAggs = data.db.aggregations;
					var totalAssets = dbAggs.SmartAssetCount.doc_count;
					var tempAggs = data.TemperatureEvents.aggregations;
					var rghttempBack = 0;
					var rghttempPre = 0;
					var rghttempCur = 0;
					var powAggs = data.PowerEvents.aggregations;
					var powerOffBack = 0;
					var powerOffPre = 0;
					var powerOffCur = 0;
					var coolerAggs = data.MissingEvents.aggregations;
					var WrongBack = 0;
					var MissBack = 0;
					var WrongPre = 0;
					var MissPre = 0;
					var WrongCur = 0;
					var MissCur = 0;
					var underAggs = data.DoorEvents.aggregations;
					var tags = credentials.tags,
						doorCount = tags.DoorCount, //as per ticket #10780 threshold
						limitLocation = Number(tags.LimitLocation);
					var underUtilizationCoolersBack = 0;
					var underUtilizationCoolersPre = 0;
					var underUtilizationCoolersCur = 0;
					//for temperature==========
					if (tempAggs) {
						tempAggs.MonthBack.top_tags.buckets.forEach(function (buckets) {

							var tempValue = buckets.top_hit.hits.hits[0]._source.Temperature;
							rghttempBack = !isNaN(rghttempBack) ? rghttempBack : 0;
							if (tempValue > Number(tags.TemperatureMax) || tempValue < Number(tags.TemperatureMin)) {
								rghttempBack++;
							}
						});

						tempAggs.Previous.top_tags.buckets.forEach(function (buckets) {

							var tempValue = buckets.top_hit.hits.hits[0]._source.Temperature;
							rghttempPre = !isNaN(rghttempPre) ? rghttempPre : 0;
							if (tempValue > Number(tags.TemperatureMax) || tempValue < Number(tags.TemperatureMin)) {
								rghttempPre++;
							}
						});

						tempAggs.Current.top_tags.buckets.forEach(function (buckets) {

							var tempValue = buckets.top_hit.hits.hits[0]._source.Temperature;
							rghttempCur = !isNaN(rghttempCur) ? rghttempCur : 0;
							if (tempValue > Number(tags.TemperatureMax) || tempValue < Number(tags.TemperatureMin)) {
								rghttempCur++;
							}
						});
					}
					// for Power......

					if (powAggs) {
						powAggs.MonthBack.Power.buckets.forEach(function (buckets) {

							var powStat = buckets.Power_hits.hits.hits[0]._source.PowerStatus;
							if (powStat == 0) {
								powerOffBack++;
							}
						});
						powAggs.Previous.Power.buckets.forEach(function (buckets) {

							var powStat = buckets.Power_hits.hits.hits[0]._source.PowerStatus;
							if (powStat == 0) {
								powerOffPre++;
							}
						});
						powAggs.Current.Power.buckets.forEach(function (buckets) {

							var powStat = buckets.Power_hits.hits.hits[0]._source.PowerStatus;
							if (powStat == 0) {
								powerOffCur++;
							}
						});
					}
					//for Coolers......

					if (coolerAggs) {
						coolerAggs.MonthBack.top_tags.buckets.forEach(function (MissWrongBucket) {
							var status = MissWrongBucket.top_hit.hits.hits[0]._source.Status;
							if (status == "Wrong Location") {
								WrongBack++;
							}
							if (status == "Missing") {
								MissBack++;
							}
						});
						coolerAggs.Previous.top_tags.buckets.forEach(function (MissWrongBucket) {
							var status = MissWrongBucket.top_hit.hits.hits[0]._source.Status;
							if (status == "Wrong Location") {
								WrongPre++;
							}
							if (status == "Missing") {
								MissPre++;
							}
						});
						coolerAggs.Current.top_tags.buckets.forEach(function (MissWrongBucket) {
							var status = MissWrongBucket.top_hit.hits.hits[0]._source.Status;
							if (status == "Wrong Location") {
								WrongCur++;
							}
							if (status == "Missing") {
								MissCur++;
							}
						});
					}
					//for UnderUtilized coolers.....
					var AssetCheckBack = [];
					var AssetCheckPrevious = [];
					var AssetCheckCurrent = [];
					if (underAggs) {
						underAggs.MonthBack.Avgassets.buckets.forEach(function (buckets) {
							var assetDays = 0;
							var doorOpensavg = 0;
							assetDays = buckets.DoorCountDays.buckets.length;
							doorOpensavg = buckets.DoorCount.value / assetDays;
							AssetCheckBack.push({
								Key: buckets.key,
								doorOpensavg: doorOpensavg
							});
						});
						underAggs.Previous.Avgassets.buckets.forEach(function (buckets) {
							var assetDays = 0;
							var assetDays = 0;
							var doorOpensavg = 0;
							assetDays = buckets.DoorCountDays.buckets.length;
							doorOpensavg = buckets.DoorCount.value / assetDays;
							AssetCheckPrevious.push({
								Key: buckets.key,
								doorOpensavg: doorOpensavg
							});
						});
						underAggs.Current.Avgassets.buckets.forEach(function (buckets) {
							var assetDays = 0;
							var doorOpensavg = 0;
							assetDays = buckets.DoorCountDays.buckets.length;
							doorOpensavg = buckets.DoorCount.value / assetDays;
							AssetCheckCurrent.push({
								Key: buckets.key,
								doorOpensavg: doorOpensavg
							});
						});
					}

					if (dbAggs) {
						dbAggs.SmartLocation.DoorTarget.buckets.forEach(function (locationData) {
							var assetid = locationData.key;
							var loc = AssetCheckBack.filter(data => data.Key == assetid);
							if (loc.length == 0) {
								//loc[0].LastData = "No data for more then 90 days";
							} else {
								//console.log( loc[0].doorOpensavg);
								underUtilizationCoolersBack = !isNaN(underUtilizationCoolersBack) ? underUtilizationCoolersBack : 0;
								var dooropentarget = locationData.Door_hits.hits.hits[0]._source.DoorOpenTarget;
								var DoorCountMatch = loc[0].doorOpensavg;
								if (DoorCountMatch < dooropentarget) {
									underUtilizationCoolersBack++;
								}
							}
						});

						dbAggs.SmartLocation.DoorTarget.buckets.forEach(function (locationData) {
							var assetid = locationData.key;
							var loc = AssetCheckPrevious.filter(data => data.Key == assetid);
							if (loc.length == 0) {
								//loc[0].LastData = "No data for more then 90 days";
							} else {
								//console.log( loc[0].doorOpensavg);
								underUtilizationCoolersPre = !isNaN(underUtilizationCoolersPre) ? underUtilizationCoolersPre : 0;
								var dooropentarget = locationData.Door_hits.hits.hits[0]._source.DoorOpenTarget;
								var DoorCountMatch = loc[0].doorOpensavg;
								if (DoorCountMatch < dooropentarget) {
									underUtilizationCoolersPre++;
								}
							}
						});

						dbAggs.SmartLocation.DoorTarget.buckets.forEach(function (locationData) {
							var assetid = locationData.key;
							var loc = AssetCheckCurrent.filter(data => data.Key == assetid);
							if (loc.length == 0) {
								//loc[0].LastData = "No data for more then 90 days";
							} else {
								//console.log( loc[0].doorOpensavg);
								underUtilizationCoolersCur = !isNaN(underUtilizationCoolersCur) ? underUtilizationCoolersCur : 0;
								var dooropentarget = locationData.Door_hits.hits.hits[0]._source.DoorOpenTarget;
								var DoorCountMatch = loc[0].doorOpensavg;
								if (DoorCountMatch < dooropentarget) {
									underUtilizationCoolersCur++;
								}
							}
						});
					}

					finalData.summary = {
						totalCooler: totalAssets,
						rghttempBack: rghttempBack,
						rghttempPre: rghttempPre,
						rghttempCur: rghttempCur,
						powerOffBack: powerOffBack,
						powerOffPre: powerOffPre,
						powerOffCur: powerOffCur,
						WrongBack: WrongBack,
						MissBack: MissBack,
						WrongPre: WrongPre,
						MissPre: MissPre,
						WrongCur: WrongCur,
						MissCur: MissCur,
						underUtilizationCoolersBack: underUtilizationCoolersBack,
						underUtilizationCoolersPre: underUtilizationCoolersPre,
						underUtilizationCoolersCur: underUtilizationCoolersCur,
						date: moment(endDate).format('MMM'),
						previousMonth: moment(endDate).add(-1, 'months').format('MMM'),
						previousMonth2: moment(endDate).add(-2, 'months').format('MMM')
					};

					return reply({
						success: true,
						data: finalData
					});
				},
				function (err) {
					console.trace(err.message);
					return reply(Boom.badRequest(err.message));
				});

		}.bind(null, this));
	}
}