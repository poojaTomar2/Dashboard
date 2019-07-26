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
		assetSummary: JSON.stringify(require('./dashboardQueries/salesAssetSummarySalesCorrelation.json')),
		kpiSalesSummary: JSON.stringify(require('./dashboardQueries/salesCorelationSalesSummerySalesChart.json')),
		kpiDoorSummary: JSON.stringify(require('./dashboardQueries/salesCorelationDoorSummaryDoorChart.json'))
	},

	getSalesCorrelationWidgetData: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload),
			assetSummary = JSON.parse(this.dashboardQueries.assetSummary),
			kpiSalesSummary = JSON.parse(this.dashboardQueries.kpiSalesSummary),
			kpiDoorSummary = JSON.parse(this.dashboardQueries.kpiDoorSummary);
		// client Filter
		var clientQuery = {
			"term": {
				"ClientId": clientId
			}
		};
		params.startDate = params.startDateCorrelation;
		params.endDate = params.endDateCorrelation;
		if (clientId != 0) {
			assetSummary.query.bool.filter.push(clientQuery);
			kpiSalesSummary.query.bool.filter.push(clientQuery);
			kpiDoorSummary.query.bool.filter.push(clientQuery);
		}

		//Date Filter
		var isDefaultDateFilter = params.yearWeek || params.dayOfWeek || params.quarter || params.month;
		var dateFilter = [];
		var totalHours = 0
		if (!isDefaultDateFilter && !params.startDate && !params.endDate) {

			kpiSalesSummary.query.bool.filter.push({
				"range": {
					"Date": {
						"gte": "now-30d/d"
					}
				}
			});

			kpiDoorSummary.query.bool.filter.push({
				"range": {
					"EventTime": {
						"gte": "now-30d/d"
					}
				}
			});
			totalHours = defaultHours;
		} else if (!isDefaultDateFilter && params.startDate && params.endDate) {
			var startDate = moment(params.startDate).format('YYYY-MM-DD[T00:00:00]');
			var endDate = moment(params.endDate).format('YYYY-MM-DD[T23:59:59]');

			kpiSalesSummary.query.bool.filter.push({
				"range": {
					"Date": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});

			kpiDoorSummary.query.bool.filter.push({
				"range": {
					"EventTime": {
						"gte": startDate,
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
				kpiSalesSummary.query.bool.filter.push({
					"bool": {
						"should": []
					}
				});

				kpiDoorSummary.query.bool.filter.push({
					"bool": {
						"should": []
					}
				});
			}

			kpiSalesSummary = util.pushDateQuery(kpiSalesSummary, {
				"range": {
					"Date": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});

			kpiDoorSummary = util.pushDateQuery(kpiDoorSummary, {
				"range": {
					"EventTime": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});
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

				//assetSummary.aggs.Assets.filter.bool.must.push(locationTerm);
				assetSummary.aggs.AssetCountTotal.filter.bool.must.push(locationTerm);
				//assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
				assetSummary.aggs.LocationCountTotal.filter.bool.must.push(locationQueryOutlet);
				assetSummary.aggs.CustomerCount.filter.bool.must.push(locationQueryOutlet);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationTerm);
				var tags = credentials.tags,
					limitLocation = Number(tags.LimitLocation);
				if (Object.keys(request.query).filter(data => data != "startDate" && data != "endDate" && data != "sellerTop" && data != "customerTop" && data != "yearWeek" && data != "dayOfWeek" && data != "quarter" && data != "month").length == 0) {
					if (limitLocation != 0) {
						kpiSalesSummary.query.bool.filter.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
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
						kpiDoorSummary.query.bool.filter.push({
							"terms": {
								LocationId: limitLocation.length != 0 ? limitLocation : [-1]
							}
						});
					} else {
						assetSummary.aggs.Assets.filter.bool.must.push(locationTerm);
						assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationTerm);
						assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
						kpiSalesSummary.query.bool.filter.push(locationQuery);
						kpiDoorSummary.query.bool.filter.push(locationQuery);
					}
				} else {
					assetSummary.aggs.Assets.filter.bool.must.push(locationTerm);
					assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationTerm);
					assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
					kpiSalesSummary.query.bool.filter.push(locationTerm);
					kpiDoorSummary.query.bool.filter.push(locationTerm);
				}
			}

			var tags = credentials.tags,
				limitLocation = Number(tags.LimitLocation);
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

				var filterQueryOutlet = {
					"terms": {
						"LocationId": {
							"index": "filteredlocations",
							"type": "locationIds",
							"id": credentials.user.UserId,
							"path": "LocationId"
						}
					}
				}


				assetSummary.aggs.AssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.AssetCountTotal.filter.bool.must.push(filterQuery);
				assetSummary.aggs.Assets.filter.bool.must.push(filterQuery);
				assetSummary.aggs.CustomerCount.filter.bool.must.push(filterQueryOutlet);
				assetSummary.aggs.LocationCount.filter.bool.must.push(filterQueryOutlet);
				assetSummary.aggs.LocationCountTotal.filter.bool.must.push(filterQueryOutlet);
				assetSummary.aggs.Locations.filter.bool.must.push(filterQueryOutlet);

				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(filterQuery);
				assetSummary.aggs.TotalSmartAssetCount.filter.bool.must.push(filterQuery);

				kpiSalesSummary.query.bool.filter.push(filterQuery);
				kpiDoorSummary.query.bool.filter.push(filterQuery);

			}

			if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
				var smartDeviceTypeQuery = {
					"terms": {
						"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(smartDeviceTypeQuery);
				kpiDoorSummary.query.bool.filter.push(smartDeviceTypeQuery);
			}

			if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
				var assetManufactureQuery = {
					"terms": {
						"AssetManufacturerId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetManufactureQuery);
				kpiDoorSummary.query.bool.filter.push(assetManufactureQuery);
			}

			if (request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]) {
				if(request.query.SmartDeviceManufacturerId.constructor !== Array)
				{
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
				kpiDoorSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
			}

			if (assetIds) {
				var assetQuery = {
					"terms": {
						"AssetId": assetIds
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(assetQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetQuery);
				kpiDoorSummary.query.bool.filter.push(assetQuery);
			}

			if (_this.dateFilter.length > 0) {
				startDate = _this.dateFilter[0].startDate;
				endDate = _this.dateFilter[_this.dateFilter.length - 1].endDate;
			}
			var indexNames = util.getEventsIndexName(startDate, endDate);

			var queries = [{
				key: "db",
				search: {
					index: 'cooler-iot-asset,cooler-iot-location',
					body: assetSummary,
					ignore_unavailable: true
				}
			}, {
				key: "sales",
				search: {
					index: 'cooler-iot-salesorderdetail',
					body: kpiSalesSummary,
					ignore_unavailable: true
				}
			}, {
				key: "door",
				search: {
					index: indexNames.toString(),
					body: kpiDoorSummary,
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
			var getMedian = _this.getMedian;
			Promise.all(promises).then(function (values) {
				var data = {},
					finalData = {
						tempAndSales: [],
						powerOnSales: [],
						openAlarmSales: [],
						lightOnSales: [],
						visitFrequencySales: [],
						visitDurationSales: [],
						doorUtilizationSales: [],
						salesUtilizationSales: []
					};
				for (var i = 0, len = values.length; i < len; i++) {
					var value = values[i];
					data[value.config.key] = value.response;
					util.setLogger(value);
				}
				var salesData;
				var visitFrequency = 0,
					doorData, doorOpenTarget, salesTarget;
				var salesAggs = data.sales.aggregations,
					doorAggs = data.door.aggregations,
					dbAggs = data.db.aggregations;
				var lowCount = 0,
					mediumCount = 0,
					highCount = 0,
					lowCountSales = 0,
					mediumCountSales = 0,
					highCountSales = 0,
					doorAssetTarget = 0,
					doorAssetTenPercent = 0,
					salesAssetTarget = 0,
					salesAssetTenPercent = 0;
				if (doorAggs) {
					doorAggs.Door.buckets.forEach(function (door) {
						lowCount = 0;
						mediumCount = 0;
						highCount = 0;
						lowCountSales = 0;
						mediumCountSales = 0;
						highCountSales = 0;
						doorOpenTarget = 0;
						salesTarget = 0;
						doorAssetTarget = 0;
						doorAssetTenPercent = 0;
						salesAssetTarget = 0;
						salesAssetTenPercent = 0;
						salesData = undefined;
						if (salesAggs) {
							salesData = salesAggs.Sales.buckets.filter(data => data.key == door.key);
						}
						if (salesData && salesData.length > 0) {
							if (Array.isArray(salesData)) {
								salesData[0].Location.buckets.forEach(function (salesAsset) {
									var assetId = salesAsset.key;
									var asset = dbAggs.Locations.Location.buckets.filter(data => data.key == assetId);
									if (asset && asset.length > 0) {
										salesTarget += asset[0].SalesTarget.value;
										salesAssetTarget = asset[0].SalesTarget.value;
										salesAssetTenPercent = salesAssetTarget * 0.10;
										if (salesAssetTarget != 0) {
											if ((salesAssetTarget - salesAssetTenPercent < salesAsset.SalesVolume.value) && (salesAsset.SalesVolume.value < salesAssetTarget + salesAssetTenPercent)) {
												mediumCountSales++;
											} else if (salesAsset.SalesVolume.value >= salesAssetTarget + salesAssetTenPercent) {
												highCountSales++;
											} else if (salesAssetTarget - salesAssetTenPercent >= salesAsset.SalesVolume.value) {
												lowCountSales++;
											}
										}
									}
								});
								salesTarget = salesTarget / salesData[0].Location.buckets.length;
								salesData = salesData[0].SalesVolume.value;
							} else {
								salesData = salesData.SalesVolume.value
							}
						} else {
							salesData = 0
						}
						door.Asset.buckets.forEach(function (doorAsset) {
							var assetId = doorAsset.key;
							var asset = dbAggs.Assets.Asset.buckets.filter(data => data.key == assetId);
							if (asset && asset.length > 0) {
								doorOpenTarget += asset[0].DoorOpenTarget.value;
								doorAssetTarget = asset[0].DoorOpenTarget.value * moment(door.key_as_string).daysInMonth();
								doorAssetTenPercent = doorAssetTarget * 0.10;
								if (doorAssetTarget != 0) {
									if ((doorAssetTarget - doorAssetTenPercent < doorAsset.DoorCount.value) && (doorAsset.DoorCount.value < doorAssetTarget + doorAssetTenPercent)) {
										mediumCount++;
									} else if (doorAsset.DoorCount.value >= doorAssetTarget + doorAssetTenPercent) {
										highCount++;
									} else if (doorAssetTarget - doorAssetTenPercent >= doorAsset.DoorCount.value) {
										lowCount++;
									}
								}
							}
						});
						var assetLength = door.Asset.buckets.length;
						doorData = door.DoorCount.value / assetLength;
						doorOpenTarget = doorOpenTarget / assetLength;
						doorOpenTarget = doorOpenTarget * moment(door.key_as_string).daysInMonth();

						finalData.doorUtilizationSales.push({
							"Date": door.key,
							"DateValue": door.key_as_string,
							"TotalUnitSold": salesData,
							"LowValue": lowCount,
							"MediumValue": mediumCount,
							"HighValue": highCount,
							"DoorActual": doorData,
							"DoorCountTarget": doorOpenTarget,
							"SalesTarget": salesTarget
						});

						finalData.salesUtilizationSales.push({
							"Date": door.key,
							"DateValue": door.key_as_string,
							"TotalUnitSold": salesData,
							"LowValue": lowCountSales,
							"MediumValue": mediumCountSales,
							"HighValue": highCountSales,
							"DoorActual": doorData,
							"DoorCountTarget": doorOpenTarget,
							"SalesTarget": salesTarget
						});
					});
				}
				var salesUtilizationData;
				if (salesAggs) {
					salesAggs.Sales.buckets.forEach(function (sales) {
						doorOpenTarget = 0;
						salesTarget = 0;
						lowCountSales = 0;
						mediumCountSales = 0;
						highCountSales = 0;
						salesAssetTarget = 0;
						salesAssetTenPercent = 0;
						salesData = finalData.doorUtilizationSales.find(data => data.Date == sales.key);
						salesUtilizationData = finalData.salesUtilizationSales.find(data => data.Date == sales.key);
						doorData = undefined;
						if (doorAggs) {
							doorData = doorAggs.Door.buckets.filter(data => data.key == sales.key);
						}
						sales.Location.buckets.forEach(function (salesAsset) {
							var assetId = salesAsset.key;
							var asset = dbAggs.Locations.Location.buckets.filter(data => data.key == assetId);
							if (asset && asset.length > 0) {
								salesTarget += asset[0].SalesTarget.value;
								salesAssetTarget = asset[0].SalesTarget.value;
								salesAssetTenPercent = salesAssetTarget * 0.10;
								if (salesAssetTarget != 0) {
									if ((salesAssetTarget - salesAssetTenPercent < salesAsset.SalesVolume.value) && (salesAsset.SalesVolume.value < salesAssetTarget + salesAssetTenPercent)) {
										mediumCountSales++;
									} else if (salesAsset.SalesVolume.value >= salesAssetTarget + salesAssetTenPercent) {
										highCountSales++;
									} else if (salesAssetTarget - salesAssetTenPercent >= salesAsset.SalesVolume.value) {
										lowCountSales++;
									}
								}
							}
						});
						var salesVolume = sales.SalesVolume.value;
						salesTarget = salesTarget / sales.Location.buckets.length;
						if (doorData && doorData.length > 0) {
							if (Array.isArray(doorData)) {
								doorData[0].Asset.buckets.forEach(function (doorAsset) {
									var assetId = doorAsset.key;
									var asset = dbAggs.Assets.Asset.buckets.filter(data => data.key == assetId);
									if (asset && asset.length > 0) {
										doorOpenTarget += asset[0].DoorOpenTarget.value;
									}
								});
								var assetLength = doorData[0].Asset.buckets.length;
								doorData = doorData[0].DoorCount.value / assetLength;
								doorOpenTarget = doorOpenTarget / assetLength;
							} else {
								doorData = doorData.DoorCount.value
							}
						} else {
							doorData = 0
						}

						doorOpenTarget = doorOpenTarget * moment(sales.key_as_string).daysInMonth();
						if (!(salesData && salesData.Date)) {
							finalData.doorUtilizationSales.push({
								"Date": sales.key,
								"DateValue": sales.key_as_string,
								"TotalUnitSold": salesVolume,
								"LowValue": 0,
								"MediumValue": 0,
								"HighValue": 0,
								"DoorActual": 0,
								"DoorCountTarget": doorOpenTarget,
								"SalesTarget": salesTarget
							});
						}

						if (!(salesUtilizationData && salesUtilizationData.Date)) {
							finalData.salesUtilizationSales.push({
								"Date": sales.key,
								"DateValue": sales.key_as_string,
								"TotalUnitSold": salesVolume,
								"LowValue": 0,
								"MediumValue": 0,
								"HighValue": 0,
								"DoorActual": 0,
								"DoorCountTarget": doorOpenTarget,
								"SalesTarget": salesTarget
							});
						}
					});
				}
				var smartAssetCount = data.db.aggregations.SmartAssetCount.doc_count;
				finalData.summary = {
					totalCooler: dbAggs.AssetCount.doc_count,
					totalCustomer: dbAggs.LocationCount.doc_count,
					filteredAssets: dbAggs.AssetCountTotal.doc_count,
					filteredOutlets: dbAggs.LocationCountTotal.doc_count,
					totalOutlets: dbAggs.LocationCount.doc_count,
					totalSmartAssetCount: dbAggs.TotalSmartAssetCount.doc_count,
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
		}.bind(null, this));
	}
}