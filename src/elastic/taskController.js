"use strict"
var linq = require('node-linq').LINQ,
	fs = require('fs');
var _ = require('underscore');
var Boom = require('boom');
var moment = require('moment');
var excel = require('node-excel-export');
var json2csv = require('json2csv');
var ip = require('ip');
var sql = require('mssql');
var Sequelize = require('sequelize');

var outletChartQuery = JSON.stringify(require('./outletChartQuery.json'));
var alertSearchQuery = JSON.stringify(require('./alertChartQuery.json'));
var smartDeviceEventChart = JSON.stringify(require('./smartDeviceEventChart.json'));
var surveyChartQuery = JSON.stringify(require('./surveyChartQuery.json'));
var outletHealthOverview = JSON.stringify(require('./outletHealthOverview.json'));
var outletDoorOverview = JSON.stringify(require('./outletDoorOverview.json'));
var outletPowerOverview = JSON.stringify(require('./outletPowerOverview.json'));
var outletAssetPurityOverview = JSON.stringify(require('./outletAssetPurityOverview.json'));
var outletAlertOverview = JSON.stringify(require('./outletAlertOverview.json'));
var outletHeaderInfo = JSON.stringify(require('./outletHeaderInfo.json'));
var outletHeaderAlertInfo = JSON.stringify(require('./outletHeaderAlertInfo.json'));
var outletHeaderVisitInfo = JSON.stringify(require('./outletHeaderVisitInfo.json'));
var productInfo = JSON.stringify(require('./productQuery.json'));
var planogram = JSON.stringify(require('./planogram.json'));
var healthChartQuery = JSON.stringify(require('./healthChart.json'));
var assetpuritychart = JSON.stringify(require('./assetpuritychart.json'));
var healthChartAssetQuery = JSON.stringify(require('./healthAssetChart.json'));
var compressorChartAssetQuery = JSON.stringify(require('./compressorAssetChart.json'));
var kpiLastDataSummary = JSON.stringify(require('./dashboardQueries/coolerPerformance/kpiLastDataSummary.json'));

var config = require('../config');
var sqlConfig = config.sql;
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

var format = require('string-format');
var movementMap = JSON.stringify(require('./movementMap.json'));
var coolerStatusQuery = JSON.stringify(require('./coolerStatus.json'));
var geolib = require('geolib');

var client = require('../models').elasticClient;
var consts = require('../controllers/consts');
var outletReducer = require('../controllers/reducers/outlet');
var smartDeviceInstallationDateReducer = require('../controllers/reducers/smartDeviceInstallationDate');
var smartDeviceLatestDataReducer = require('../controllers/reducers/smartDeviceLatestData');
var alertReducer = require('../controllers/reducers/alert');
var salesRepReducer = require('../controllers/reducers/salesRep');
var smartDevicePowerReducer = require('../controllers/reducers/smartDevicePowerRecord');
var assetReducer = require('../controllers/reducers/asset');
var smartDeviceReducer = require('../controllers/reducers/smartDevice');
var locationRepQuery = JSON.stringify(require('./locationRep.json'));
var smartDeviceMovementReducer = require('../controllers/reducers/smartDeviceMovement');
var smartDevicDoorStatusReducer = require('../controllers/reducers/smartDevicDoorStatus');
var smartDevicHealthReducer = require('../controllers/reducers/smartDeviceHealthRecord');
var outletController = require('../controllers/outlet');
var assetController = require('../controllers/asset');
var asseteventController = require('../controllers/asseteventdatasumm');
var locationeventController = require('../controllers/locationeventdatasumm');
var alertController = require('../controllers/alert');
var visionController = require('../controllers/planogram');
var recognitionController = require('../controllers/recognitionReport');
var util = require('../util');

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
	getSqlData: function (queries) {
		var result = {};
		return new Promise(function (resolve, reject) {
			sequelize.query(queries.sql).then(function (results) {
				resolve({
					response: results[0],
					config: queries
				});
			}, function (err) {
				console.log(err);
				reject(err);
			});
		});
	},
	loadHeaderInfo: function (request, reply) {
		var params = Object.assign({}, request.query, request.payload),
			outletHeaderInfoQuery = JSON.parse(outletHeaderInfo),
			outletHeaderAlertInfoQuery = JSON.parse(outletHeaderAlertInfo),
			outletHeaderVisitInfoQuery = JSON.parse(outletHeaderVisitInfo);
		var locationFilter = {
			"term": {
				"LocationId": params.LocationId
			}
		};
		outletHeaderInfoQuery.query.bool.must.push(locationFilter);
		outletHeaderAlertInfoQuery.aggs.AlertData.filter.bool.must.push(locationFilter);
		outletHeaderVisitInfoQuery.aggs.VisitData.filter.bool.must.push(locationFilter);

		var clientId = request.auth.credentials.user.ScopeId;

		var clientFilter = {
			"term": {
				"ClientId": clientId
			}
		};
		if (clientId != 0) {
			// outletHeaderAlertInfoQuery.query.bool.filter.push(clientFilter);
			// outletHeaderInfoQuery.query.bool.must.push(locationFilter);
			// //planogramQuery.query.bool.filter.push(clientFilter);
			outletHeaderInfoQuery.query.bool.must.push(clientFilter);
			outletHeaderAlertInfoQuery.aggs.AlertData.filter.bool.must.push(clientFilter);
			outletHeaderVisitInfoQuery.aggs.VisitData.filter.bool.must.push(clientFilter);
		}


		var queries = [{
			key: "Location",
			search: {
				index: "cooler-iot-location",
				body: outletHeaderInfoQuery,
				ignore_unavailable: true
			}
		}, {
			key: "Visit",
			search: {
				index: "cooler-iot-visit",
				body: outletHeaderVisitInfoQuery,
				ignore_unavailable: true
			}
		}, {
			key: "Alert",
			search: {
				index: "cooler-iot-alert",
				body: outletHeaderAlertInfoQuery,
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

			var alertCount = data.Alert.aggregations.AlertData.doc_count,
				visit = data.Visit.aggregations.VisitData.latestRecord.hits.hits,
				lastVisit = visit.length > 0 ? visit[0]._source.StartTime : '',
				location = data.Location.hits.hits,
				finalData = {};
			finalData.alertCount = alertCount;
			finalData.lastVisit = lastVisit;
			finalData.address = '';
			if (location.length > 0) {
				location = location.length > 0 ? location[0]._source : location;
				finalData.locationName = location.Name;
				finalData.address = [location.Street, location.Street2, location.Street3].filter(function (val) {
					return val;
				}).join(', ');
			}
			return reply({
				success: true,
				data: finalData
			});
		}, function (err) {
			console.trace(err.message);
			return reply(Boom.badRequest(err.message));
		});
	},

	loadLastDataInfo: function (request, reply) {
		var params = Object.assign({}, request.query, request.payload),
			startDate = params.startDate,
			endDate = params.endDate,
			kpiLastDataSummaryQuery = JSON.parse(kpiLastDataSummary),
			kpiLastDatadb = JSON.parse(kpiLastDataSummary);
		var locationFilter = {
			"term": {
				"LocationId": params.LocationId
			}
		};

		kpiLastDataSummaryQuery.query.bool.filter.push(locationFilter);
		kpiLastDatadb.query.bool.filter.push(locationFilter);
		var rangefilter = {
			"range": {
				"EventDate": {
					"gte": startDate,
					"lte": endDate
				}
			}
		};
		kpiLastDataSummaryQuery.query.bool.filter.push(rangefilter);
		var queries = [{
			key: "lastDownloadSummary",
			search: {
				index: 'cooler-iot-asseteventdatasummary',
				type: ["AssetEventDataSummary"],
				body: kpiLastDataSummaryQuery,
				ignore_unavailable: true
			}
		}, {
			key: "db",
			search: {
				index: 'cooler-iot-asset,cooler-iot-location',
				body: kpiLastDatadb,
				ignore_unavailable: true
			}
		}];

		var promises = [];
		for (var i = 0, len = queries.length; i < len; i++) {
			promises.push(this.getElasticData(queries[i]));
		}

		var data = {};
		Promise.all(promises).then(function (_this, values) {
			for (var i = 0, len = values.length; i < len; i++) {
				var value = values[i];
				data[value.config.key] = value.response;
				util.setLogger(value);
			}
			var assetDataAggs = data.db.aggregations;
			var lastDownloadSummary = data.lastDownloadSummary.aggregations;

			var params = {
				AssetId: []
			};

			if (assetDataAggs) {
				assetDataAggs.AssetIds.buckets.forEach(function (data) {
					params.AssetId.push(data.key);
				})
			}

			if (lastDownloadSummary) {
				lastDownloadSummary.AssetIds.buckets.forEach(function (data) {
					params.AssetId.push(data.key);
				});
			}

			var promises = [];

			if (params.AssetId.length != 0) {
				promises.push(_this.getAssetsData(request, params));
			}

			Promise.all(promises).then(function (values) {
				// You can define styles as json object 
				// More info: https://github.com/protobi/js-xlsx#cell-styles 
				var data;
				for (var i = 0, len = values.length; i < len; i++) {
					var value = values[i];
					data = value.data;
				}
				return reply({
					success: true,
					data: data
				});
			});
		}.bind(null, this), function (err) {
			console.trace(err.message);
			return reply(Boom.badRequest(err.message));
		});
	},

	getOutletOverviewData: function (request, reply) {
		var params = Object.assign({}, request.query, request.payload),
			startDate = params.startDate,
			endDate = params.endDate,
			tags = request.auth.credentials.tags,
			temperatureMax = tags.TemperatureMax,
			temperatureMin = tags.TemperatureMin,
			lightMax = tags.LightMax,
			lightMin = tags.LightMin,
			powerOffDuration = tags.PowerOffDuration,
			healthIntervals = tags.HealthIntervals,
			outOfStockSKU = tags.OutOfStockSKU,
			doorCount = tags.DoorCount,
			assets = params["assetId[]"],
			assetCount = Array.isArray(assets) ? assets.length : assets ? 1 : 0,
			planogramIds = params["assetDetails[]"],
			healthOverviewQuery = JSON.parse(outletHealthOverview),
			doorOverviewQuery = JSON.parse(outletDoorOverview),
			productQuery = JSON.parse(productInfo),
			planogramQuery = JSON.parse(planogram),
			powerOverviewQuery = JSON.parse(outletPowerOverview),
			assetPurityOverviewQuery = JSON.parse(outletAssetPurityOverview),
			alertOverviewQuery = JSON.parse(outletAlertOverview),
			rangefilter = {
				"range": {
					"EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			},
			rangefilter2 = {
				"range": {
					"EventTime": {
						"gte": startDate,
						"lte": endDate
					}
				}
			},
			alertRangefilter = {
				"range": {
					"AlertAt": {
						"lte": endDate
					}
				}
			},
			tempfilter = {
				"range": {
					"AverageTemperature": {
						"gt": temperatureMin,
						"lt": temperatureMax
					}
				}
			},
			lightfilter = {
				"range": {
					"AverageTemperature": {
						"gt": lightMin,
						"lt": lightMax
					}
				}
			},
			powerfilter = {
				"range": {
					"SumOfPowerOffDuration": {
						"gt": moment.duration(Number(powerOffDuration), 'minute').asSeconds()
					}
				}
			};
		if (assetCount == 0) {
			assets = -1;
		}
		var assetIdfilter = assetCount > 1 ? {
			"terms": {
				"AssetId": assets
			}
		} : {
			"term": {
				"AssetId": assets
			}
		};
		var clientId = request.auth.credentials.user.ScopeId;

		healthOverviewQuery.query.bool.must.push(rangefilter);
		healthOverviewQuery.query.bool.must.push(assetIdfilter);
		healthOverviewQuery.aggs.AssetWithTempIssue.filter.bool.must_not.push(tempfilter);
		healthOverviewQuery.aggs.AssetWithLightIssue.filter.bool.must_not.push(lightfilter);

		doorOverviewQuery.query.bool.must.push(rangefilter);
		doorOverviewQuery.query.bool.must.push(assetIdfilter);

		powerOverviewQuery.query.bool.must.push(rangefilter);
		powerOverviewQuery.query.bool.must.push(assetIdfilter);
		powerOverviewQuery.query.bool.must.push(powerfilter);

		assetPurityOverviewQuery.aggs.AssetPurity.filter.bool.must.push(rangefilter2);
		assetPurityOverviewQuery.aggs.AssetPurity.filter.bool.must.push(assetIdfilter);
		assetPurityOverviewQuery.aggs.AssetPurityLastRecord.filter.bool.must.push(assetIdfilter);
		assetPurityOverviewQuery.aggs.AssetPurityLastRecord.filter.bool.must.push({
			"range": {
				"EventTime": {
					"lt": startDate
				}
			}
		});

		var clientFilter = {
			"term": {
				"ClientId": clientId
			}
		};
		if (clientId != 0) {
			productQuery.query.bool.filter.push(clientFilter);
			planogramQuery.query.bool.filter.push(clientFilter);
			alertOverviewQuery.query.bool.must.push(clientFilter);
		}
		planogramQuery.query.bool.filter.push(assetCount > 1 ? {
			"terms": {
				"_id": planogramIds
			}
		} : {
			"term": {
				"_id": planogramIds
			}
		});
		alertOverviewQuery.query.bool.must.push(alertRangefilter);
		alertOverviewQuery.query.bool.must.push(assetIdfilter);

		var queries = [{
			key: "healthOverview",
			search: {
				index: 'cooler-iot-asseteventdatasummary',
				body: healthOverviewQuery,
				ignore_unavailable: true
			}
		}, {
			key: "doorOverview",
			search: {
				index: 'cooler-iot-asseteventdatasummary',
				body: doorOverviewQuery,
				ignore_unavailable: true
			}
		}, {
			key: "powerOverview",
			search: {
				index: 'cooler-iot-asseteventdatasummary',
				body: powerOverviewQuery,
				ignore_unavailable: true
			}
		}, {
			key: "assetPurityOverview",
			search: {
				index: 'cooler-iot-assetpurity',
				body: assetPurityOverviewQuery,
				ignore_unavailable: true
			}
		}, {
			key: "alert",
			search: {
				index: 'cooler-iot-alert',
				body: alertOverviewQuery,
				ignore_unavailable: true
			}
		}, {
			key: "product",
			search: {
				index: 'cooler-iot-product',
				body: productQuery,
				ignore_unavailable: true
			}
		}, {
			key: "planogram",
			search: {
				index: 'cooler-iot-planogram',
				body: planogramQuery,
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
			var nonEmptyProducts = [];
			data.product.hits.hits.forEach(function (validProduct) {
				nonEmptyProducts.push(validProduct._source.ProductId);
			});
			var latestImages = [];
			var missingProductOutletLevel = [];
			var overviewObj, finalData = [],
				assetId, outletUniProductIds = [];
			for (var i = 0; i < assetCount; i++) {
				var planogramId = assetCount == 1 ? Number(planogramIds) : Number(planogramIds[i]),
					parsePlanogramDetails, productIds = [],
					products, productId,
					assetId = assetCount == 1 ? assets : assets[i];
				overviewObj = {
					"AssetId": 0,
					"TemperatureIssue": false,
					"LightIssue": false,
					"PowerIssue": false,
					"DoorCountIssue": false,
					"OosSku": true,
					"OosProcessed": false,
					"OosSkuLatest": true,
					"DistinctMissingSku": 'N/A',
					"Alarm": 0,
					"missingProduct": [],
					"missingProductData": [],
				};
				overviewObj.AssetId = assetId;
				var lightData = data.healthOverview.aggregations.AssetWithLightIssue.assets.buckets.filter(data => data.key == assetId);
				if (lightData && lightData.length > 0) {
					if (moment.duration(Number(healthIntervals), 'hour').asMinutes() < data.healthOverview.aggregations.AssetWithLightIssue.healthInterval.value) {
						overviewObj.LightIssue = true;
					}
				}
				if (data.healthOverview.hits.total == 0) {
					overviewObj.LightIssue = "N/A";
				}
				var tempData = data.healthOverview.aggregations.AssetWithTempIssue.assets.buckets.filter(data => data.key == assetId);
				if (tempData && tempData.length > 0) {
					if (moment.duration(Number(healthIntervals), 'hour').asMinutes() < data.healthOverview.aggregations.AssetWithTempIssue.healthInterval.value) {
						overviewObj.TemperatureIssue = true;
					}
				}
				if (data.healthOverview.hits.total == 0) {
					overviewObj.TemperatureIssue = "N/A";
				}
				var doorData = data.doorOverview.aggregations.assets.buckets.filter(data => data.key == assetId);
				if (doorData && doorData.length > 0) {
					doorData[0].DoorData.buckets.forEach(function (data) {
						if (data.DoorData.value < Number(doorCount)) {
							overviewObj.DoorCountIssue = true;
							return;
						}
					});
				}
				if (data.doorOverview.hits.total == 0) {
					overviewObj.DoorCountIssue = "N/A";
				}
				var powerData = data.powerOverview.aggregations.assets.buckets.filter(data => data.key == assetId);
				if (powerData && powerData.length > 0) {
					overviewObj.PowerIssue = true;
				}

				if (data.powerOverview.hits.total == 0) {
					overviewObj.PowerIssue = "N/A";
				}

				if (data.planogram.hits.hits && data.planogram.hits.hits.length > 0) {
					var planogramInfo = data.planogram.hits.hits.filter(data => data._id == planogramId);
					if (planogramInfo && planogramInfo.length > 0) {
						parsePlanogramDetails = JSON.parse(planogramInfo[0]._source.FacingDetails);
						for (var k = 0, kLen = parsePlanogramDetails.length; k < kLen; k++) {
							products = parsePlanogramDetails[k].products;
							for (var j = 0, jLen = products.length; j < jLen; j++) {
								productId = products[j].id;
								if (productIds.indexOf(productId) == -1 && nonEmptyProducts.indexOf(productId) > -1) {
									productIds.push(productId);
									outletUniProductIds.push(productId);

								}
							}
						}
						var assetPurityData = data.assetPurityOverview.aggregations.AssetPurity.assets.buckets.filter(data => data.key == assetId);
						var dataProcessed = false;
						var len = 0;
						if (assetPurityData && assetPurityData.length > 0) {
							len = assetPurityData[0].PurityData.buckets.length;
							for (var m = len; m > 0; m--) {
								var purityData = assetPurityData[0].PurityData.buckets[m - 1];
								overviewObj.OosProcessed = true;
								if (overviewObj.OosSku || m == len) {
									purityData.latestRecord.hits.hits.forEach(function (purity) {

										var purityProductArray = purity._source.PurityStatus.split(',').filter(function (item, m, ar) {
											return ar.indexOf(item) === m;
										}).map(Number);
										var missingProductIds = productIds.filter(function (m) {
											return purityProductArray.indexOf(m) < 0;
										});
										var missingProduct = missingProductIds.filter((v, i, a) => a.indexOf(v) === i);
										var distinctMissingSku = missingProductIds.filter((v, i, a) => a.indexOf(v) === i).length;
										//if (missingProductIds.length > Number(outOfStockSKU)) {
										if (m == len) {
											dataProcessed = true;
											overviewObj.OosSkuLatest = false;
											overviewObj.DistinctMissingSku = distinctMissingSku;
											overviewObj.missingProduct = missingProduct;
											purity._source.PurityStatus.split(',').forEach(function (id) {
												latestImages.push(id);
											});
										} else {
											overviewObj.OosSku = false;
										}
										return false;
										//}
									});
								} else {
									break;
								}
							}
						}
						var isStartDayValueExists = len == 0 ? false : assetPurityData[0].PurityData.buckets.filter(data => data.key == params.startDateWithNoTZ.valueOf())[0];
						if (!dataProcessed || !isStartDayValueExists) {
							var assetPurityData = data.assetPurityOverview.aggregations.AssetPurityLastRecord.assets.buckets.filter(data => data.key == assetId);
							if (assetPurityData && assetPurityData.length > 0) {
								assetPurityData = assetPurityData[0];
								assetPurityData.latestRecord.hits.hits.forEach(function (purityStatus) {

									var purityProductArray = purityStatus._source.PurityStatus.split(',').filter(function (item, i, ar) {
										return ar.indexOf(item) === i;
									}).map(Number);
									var missingProductIds = productIds.filter(function (i) {
										return purityProductArray.indexOf(i) < 0;
									});
									var missingProduct = missingProductIds.filter((v, i, a) => a.indexOf(v) === i)
									var distinctMissingSku = missingProductIds.filter((v, i, a) => a.indexOf(v) === i).length;
									//if (missingProductIds.length > Number(outOfStockSKU)) {
									overviewObj.OosSku = false;
									if (!dataProcessed) {
										overviewObj.OosSkuLatest = false;
										overviewObj.DistinctMissingSku = distinctMissingSku;
										overviewObj.missingProduct = missingProduct;
										// purityStatus._source.PurityStatus.split(',').forEach(function (id) {
										// 	latestImages.push(id);
										// });
									}
									return false;
									//}
								});
							}
						}
					} else {

						var assetPurityData = data.assetPurityOverview.aggregations.AssetPurity.assets.buckets.filter(data => data.key == assetId);
						var dataProcessed = false;
						var len = 0;
						if (assetPurityData && assetPurityData.length > 0) {
							len = assetPurityData[0].PurityData.buckets.length;
							for (var m = len; m > 0; m--) {
								var purityData = assetPurityData[0].PurityData.buckets[m - 1];
								if (overviewObj.OosSku || m == len) {
									purityData.latestRecord.hits.hits.forEach(function (purity) {

										if (m == len) {

											purity._source.PurityStatus.split(',').forEach(function (id) {
												latestImages.push(id);
											});
										}
										return false;
									});
								} else {
									break;
								}
							}
						}
						var isStartDayValueExists = len == 0 ? false : assetPurityData[0].PurityData.buckets.filter(data => data.key == params.startDateWithNoTZ.valueOf())[0];
						if (!dataProcessed || !isStartDayValueExists) {
							var assetPurityData = data.assetPurityOverview.aggregations.AssetPurityLastRecord.assets.buckets.filter(data => data.key == assetId);
							if (assetPurityData && assetPurityData.length > 0) {
								assetPurityData = assetPurityData[0];
								assetPurityData.latestRecord.hits.hits.forEach(function (purityStatus) {
									overviewObj.OosSku = false;
									if (!dataProcessed) {
										// purityStatus._source.PurityStatus.split(',').forEach(function (id) {
										// 	latestImages.push(id);
										// });
									}
									return false;
									//}
								});
							}
						}

						overviewObj.OosSku = false;
						overviewObj.OosSkuLatest = false;
					}
				} else {
					overviewObj.OosSku = false;
					overviewObj.OosSkuLatest = false;
				}

				var alertData = data.alert.aggregations.assets.buckets.filter(data => data.key == assetId);
				if (alertData && alertData.length > 0) {
					overviewObj.Alarm = alertData[0].doc_count;
				}

				overviewObj.missingProduct.forEach(function (id) {
					var sourceData = data.product.hits.hits.filter(function (validProductData) {
						if (id == validProductData._source.ProductId) {
							return validProductData._source
						}
					});

					if (sourceData.length > 0) {
						var productCount = productIds.filter(data => data == sourceData[0]._source.ProductId).length;
						overviewObj.missingProductData.push({
							ProductId: sourceData[0]._source.ProductId,
							PackagingType: sourceData[0]._source.PackagingType,
							Product: sourceData[0]._source.Product,
							BrandName: sourceData[0]._source.BrandName,
							OOSCount: productCount
						});
					}
				});

				finalData.push(overviewObj)
			}

			outletUniProductIds.forEach(function (id) {
				var sourceData = data.product.hits.hits.filter(function (validProductData) {
					if (id == validProductData._source.ProductId) {
						return validProductData._source
					}
				});

				if (sourceData.length > 0) {
					var productCount = productIds.filter(data => data == sourceData[0]._source.ProductId).length;
					missingProductOutletLevel.push({
						ProductId: sourceData[0]._source.ProductId,
						PackagingType: sourceData[0]._source.PackagingType,
						Product: sourceData[0]._source.Product,
						BrandName: sourceData[0]._source.BrandName,
						OOSCount: productCount
					});
				}
			});


			var missingProductOutletLevelSKU = [];

			latestImages = latestImages.filter((v, i, a) => a.indexOf(v) === i)

			if (latestImages && latestImages.length > 0) {
				missingProductOutletLevel.forEach(function (sku) {
					var isMissing = latestImages.filter(function (letestData) {
						return letestData == sku.ProductId.toString();
					});
					if (isMissing && isMissing.length == 0) {
						missingProductOutletLevelSKU.push(sku);
					}
				});
			}

			var finalDataAll = ({
				finalData: finalData,
				outletLevelSKU: missingProductOutletLevelSKU
			});

			return reply({
				success: true,
				data: finalDataAll
			});
		}, function (err) {
			console.trace(err.message);
			return reply(Boom.badRequest(err.message));
		});
	},

	getDashboardData: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var queries = [{
			key: "cooler-iot-event",
			search: {
				index: 'cooler-iot-event',
				body: JSON.parse(smartDeviceEventChart)
			}
		}, {
			key: "surveys",
			search: {
				index: 'surveys',
				body: JSON.parse(surveyChartQuery)
			}
		}, {
			key: "cooler-iot-alert",
			search: {
				index: 'cooler-iot-alert',
				body: JSON.parse(alertSearchQuery)
			}
		}, {
			key: "cooler-iot-asset,cooler-iot-location",
			search: {
				index: 'cooler-iot-asset,cooler-iot-location',
				body: JSON.parse(outletChartQuery)
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
			return reply({
				success: true,
				data: data
			});
		}, function (err) {
			console.trace(err.message);
			return reply(Boom.badRequest(err.message));
		});
	},

	getRecord: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		if (request.params.options) {
			var params = JSON.parse(request.params.options);
			for (var key in params) {
				var data = params[key];
				if (data && typeof (data) == 'object') {
					if (data.length != 0) {
						//ToDo
					}
				}
			}
		}
		client.search({
			index: 'cooler-iot-asset,cooler-iot-location',
			body: JSON.parse(outletChartQuery)
		}).then(function (resp) {
			if (resp.aggregations) {
				global.smartLocation = 0;
				global.totalOutlet = 0;
				var agg = resp.aggregations,
					light = agg.LightBandChart,
					temp = agg.TempBandChart,
					tempLight = agg.TempLightIssueCount,
					smartLocation = agg.SmartLocation.doc_count;
				var lightCount = [],
					tempCount = [],
					tempLightCount = [],
					totalValue = 0;
				global.smartLocation = smartLocation;
				global.totalOutlet = agg.TotalOutlets.doc_count;
				////for Light Band Chart
				for (var key in light) {
					if (key == 'doc_count' || key == 'OutletCount') {
						continue;
					}
					var obj = light[key];
					lightCount.push({
						Label: key,
						value: obj.doc_count,
						Percentage: parseFloat(((obj.OutletCount.value / smartLocation) * 100).toFixed(2)),
						outletCount: smartLocation
					});
				}

				////for temp Band Chart
				for (var key in temp) {
					if (key == 'doc_count' || key == 'OutletCount') {
						continue;
					}
					var obj = temp[key];
					tempCount.push({
						Label: key,
						value: obj.doc_count,
						Percentage: parseFloat(((obj.OutletCount.value / smartLocation) * 100).toFixed(2)),
						outletCount: smartLocation
					});
				}

				////for Temp Light Issue Chart:
				for (var key in tempLight) {
					if (tempLight[key].doc_count) {
						totalValue += tempLight[key].doc_count;
					}
				}

				for (var key in tempLight) {
					if (key == 'doc_count' || key == 'OutletCount') {
						continue;
					}
					var obj = tempLight[key];
					tempLightCount.push({
						Label: key,
						Count: obj.doc_count,
						Percentage: parseFloat(((obj.doc_count / totalValue) * 100).toFixed(2))
					});
				}
				return reply({
					Success: true,
					SmartLocation: smartLocation,
					LightBandChart: {
						record: lightCount,
						outletUsedCount: light.OutletCount.value
					},
					TempBandChart: {
						record: tempCount,
						outletUsedCount: temp.OutletCount.value
					},
					TempLightIssueCount: {
						record: tempLightCount,
						outletUsedCount: tempLight.OutletCount.value
					},
					TotalOutlets: agg.TotalOutlets.doc_count
				});
			}
		}, function (err) {
			console.trace(err.message);
		}).catch(function (err) {
			return reply(Boom.badRequest(err.message));
		});
	},

	getAssetChartData: function (request, reply) {
		var params = Object.assign({}, request.query, request.payload);
		var startDate = params.startDate || '2016-06-07T00:00:00Z';
		var endDate = params.endDate;
		var interval = params.interval || "day";
		var filterAssetId = isNaN(params.assetId) ? 4577 : params.assetId;
		var filters = [{
			"range": {
				"EventDate": {
					"gte": startDate
				}
			}
		}, {
			"term": {
				"AssetId": filterAssetId
			}
		}];

		if (endDate) {
			filters[0].range.EventDate.lte = endDate;
		}

		var filtersCompressor = [{
			"range": {
				"EventDate": {
					"gte": startDate
				}
			}
		}, {
			"term": {
				"AssetId": filterAssetId
			}
		}];

		if (endDate) {
			filtersCompressor[0].range.EventDate.lte = endDate;
		}

		var query = JSON.parse(healthChartAssetQuery);
		var compressorQuery = JSON.parse(compressorChartAssetQuery);
		query.aggs.HealthData.aggs.time_buckets.date_histogram.interval = interval;
		query.aggs.DoorData.aggs.time_buckets.date_histogram.interval = interval;
		query.aggs.HealthData.filter.bool.must = [{
			type: {
				value: "AssetEventDataSummary"
			}
		}].concat(filters);
		query.aggs.DoorData.filter.bool.must = [{
			type: {
				value: "AssetEventDataSummary"
			}
		}].concat(filters);
		query.aggs.PowerData.filter.bool.must = [{
			type: {
				value: "AssetEventDataSummary"
			}
		}].concat(filters);

		compressorQuery.aggs.CompressorData.filter.bool.must = [{
			type: {
				value: "AssetEventDataSummary"
			}
		}].concat(filtersCompressor);

		var queries = [{
			key: "events",
			search: {
				index: "cooler-iot-asseteventdatasummary",
				body: query,
				ignore_unavailable: true
			}
		}, {
			key: "compressor",
			search: {
				index: "cooler-iot-asseteventdatasummary",
				body: compressorQuery,
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

			var aggs = data.events.aggregations,
				doorData = aggs.DoorData,
				powerData = aggs.PowerData,
				compressorData = data.compressor.aggregations.CompressorData,
				healthData = aggs.HealthData;
			var buckets = [],
				timeBuckets = doorData.time_buckets.buckets;

			for (var i = 0, len = timeBuckets.length; i < len; i++) {
				var bucket = timeBuckets[i];
				buckets.push({
					dateTime: bucket.key_as_string,
					key: bucket.key,
					doorRecords: bucket.DoorCount.value,
					doorOpenDuration: bucket.door_duration.value
				});
			}

			timeBuckets = healthData.time_buckets.buckets;
			for (var i = 0, len = timeBuckets.length; i < len; i++) {
				var bucket = timeBuckets[i];
				var targetBucket = buckets.find(function (b) {
					return b.key === bucket.key;
				});
				if (!targetBucket) {
					var index = buckets.findIndex(function (a) {
						return new Date(a.key_as_string) < new Date(bucket.key_as_string);
					})

					targetBucket = {
						dateTime: bucket.key_as_string,
						key: bucket.key,
						doorRecords: 0,
						doorOpenDuration: 0,
						power: 0,
						compressorDuration: 0,
						fanDuration: 0,
						evaporatorTemperature: 0,

					};
					if (index > -1) {
						buckets.splice(index + 1, 0, targetBucket);
					} else {
						buckets.splice(0, 0, targetBucket);
					}
				}
				Object.assign(targetBucket, {
					avgTemperature: bucket.Temperature.avg_temperature.value,
					avgLight: bucket.Light.avg_light.value,
					evaporatorTemperature: bucket.EvaporatorTemperature.avg_temperature.value
				});
			}

			timeBuckets = powerData.time_buckets.buckets;
			for (var i = 0, len = timeBuckets.length; i < len; i++) {
				var bucket = timeBuckets[i];
				var targetBucket = buckets.find(function (b) {
					return b.key === bucket.key;
				});
				if (!targetBucket) {
					var index = buckets.findIndex(function (a) {
						return new Date(a.key_as_string) < new Date(bucket.key_as_string);
					})

					targetBucket = {
						dateTime: bucket.key_as_string,
						key: bucket.key,
						doorRecords: 0,
						doorOpenDuration: 0,
						avgTemperature: 0,
						avgLight: 0,
						power: 0,
						compressorDuration: 0,
						fanDuration: 0,
						evaporatorTemperature: 0,

					};
					if (index > -1) {
						buckets.splice(index + 1, 0, targetBucket);
					} else {
						buckets.splice(0, 0, targetBucket);
					}
				}
				Object.assign(targetBucket, {
					power: 24 - moment.duration(bucket.PowerOffDuration.value, 'second').asHours()
				});
			}

			timeBuckets = compressorData.time_buckets.buckets;
			for (var i = 0, len = timeBuckets.length; i < len; i++) {
				var bucket = timeBuckets[i];
				var targetBucket = buckets.find(function (b) {
					return b.key === bucket.key;
				});
				if (!targetBucket) {
					var index = buckets.findIndex(function (a) {
						return new Date(a.key_as_string) < new Date(bucket.key_as_string);
					})

					targetBucket = {
						dateTime: bucket.key_as_string,
						key: bucket.key,
						doorRecords: 0,
						doorOpenDuration: 0,
						avgTemperature: 0,
						avgLight: 0,
						power: 0,
						compressorDuration: 0,
						fanDuration: 0,
						evaporatorTemperature: 0,

					};
					if (index > -1) {
						buckets.splice(index + 1, 0, targetBucket);
					} else {
						buckets.splice(0, 0, targetBucket);
					}
				}
				Object.assign(targetBucket, {
					compressorDuration: moment.duration(bucket.CompressorDuration.CompressorDuration.value, 'second').asHours(),
					fanDuration: moment.duration(bucket.FanDuration.FanDuration.value, 'second').asHours()

				});
			}

			return reply({
				success: true,
				buckets: buckets
			});

		}, function (err) {
			console.trace(err.message);
			return reply(Boom.badRequest(err.message));
		});
	},

	getChartData: function (request, reply) {
		var params = Object.assign({}, request.query, request.payload);
		var startDate = params.startDate || '2016-06-07T00:00:00Z';
		var endDate = params.endDate;
		var interval = params.interval || "day";
		var isFromOutlet = params.isFromOutlet;
		var clientId = request.auth.credentials.user.ScopeId;
		var filterAssetId = params["assetId[]"] || params.assetId || -1,
			assetCount = Array.isArray(filterAssetId) ? filterAssetId.length : 1,
			planogramIds = params["assetDetails[]"] || params.assetDetails;
		var filters = [{
			"range": {
				"EventDate": {
					"gte": startDate
				}
			}
		}];
		var filterspurity = [{
			"range": {
				"EventTime": {
					"gte": startDate
				}
			}
		}];

		var filterAssetPurity = [{
			"range": {
				"EventTime": {
					"lt": startDate
				}
			}
		}];
		filters.push(Array.isArray(filterAssetId) ? {
			"terms": {
				"AssetId": filterAssetId
			}
		} : {
			"term": {
				"AssetId": filterAssetId
			}
		});
		filterspurity.push(Array.isArray(filterAssetId) ? {
			"terms": {
				"AssetId": filterAssetId
			}
		} : {
			"term": {
				"AssetId": filterAssetId
			}
		});
		filterAssetPurity.push(Array.isArray(filterAssetId) ? {
			"terms": {
				"AssetId": filterAssetId
			}
		} : {
			"term": {
				"AssetId": filterAssetId
			}
		});
		if (endDate) {
			filters[0].range.EventDate.lte = endDate;
			filterspurity[0].range.EventTime.lte = endDate;
		}

		var query = JSON.parse(healthChartQuery),
			querypurity = JSON.parse(assetpuritychart),
			productQuery = JSON.parse(productInfo),
			planogramQuery = JSON.parse(planogram);
		var clientFilter = {
			"term": {
				"ClientId": clientId
			}
		};
		productQuery.query.bool.filter.push(clientFilter);
		planogramQuery.query.bool.filter.push(clientFilter);
		planogramQuery.query.bool.filter.push(assetCount > 1 ? {
			"terms": {
				"_id": planogramIds
			}
		} : {
			"term": {
				"_id": planogramIds
			}
		});
		query.aggs.HealthData.aggs.time_buckets.date_histogram.interval = interval;
		query.aggs.DoorData.aggs.time_buckets.date_histogram.interval = interval;
		querypurity.aggs.AssetPurity.aggs.assets.aggs.time_buckets.date_histogram.interval = interval;
		query.aggs.PowerData.aggs.time_buckets.date_histogram.interval = interval;
		query.aggs.HealthData.filter.bool.must = [{
			type: {
				value: "AssetEventDataSummary"
			}
		}].concat(filters);
		query.aggs.DoorData.filter.bool.must = [{
			type: {
				value: "AssetEventDataSummary"
			}
		}].concat(filters);
		querypurity.aggs.AssetPurity.filter.bool.must = [{
			type: {
				value: "AssetPurity"
			}
		}].concat(filterspurity);
		querypurity.aggs.AssetPurityLastRecord.filter.bool.must = [{
			type: {
				value: "AssetPurity"
			}
		}].concat(filterAssetPurity);
		query.aggs.PowerData.filter.bool.must = [{
			type: {
				value: "AssetEventDataSummary"
			}
		}].concat(filters);

		var queries = [{
			key: "eventData",
			search: {
				index: "cooler-iot-asseteventdatasummary",
				body: query
			}
		}, {
			key: "purityData",
			search: {
				index: "cooler-iot-assetpurity",
				body: querypurity
			}
		}, {
			key: "product",
			search: {
				index: 'cooler-iot-product',
				body: productQuery,
				ignore_unavailable: true
			}
		}, {
			key: "planogram",
			search: {
				index: 'cooler-iot-planogram',
				body: planogramQuery,
				ignore_unavailable: true
			}
		}];

		var promises = [];
		for (var i = 0, len = queries.length; i < len; i++) {
			promises.push(this.getElasticData(queries[i]));
		}
		Promise.all(promises).then(function (values) {
			var data = {};
			for (var i = 0, len = values.length; i < len; i++) {
				var value = values[i];
				data[value.config.key] = value.response;
				util.setLogger(value);
			}
			var aggs = data.eventData.aggregations,
				aggspurity = data.purityData.aggregations,
				doorData = aggs.DoorData,
				healthData = aggs.HealthData,
				powerData = aggs.PowerData,
				assetPurity = aggspurity.AssetPurity,
				assetPurityLastRecord = aggspurity.AssetPurityLastRecord;
			var buckets = [],
				timeBuckets = doorData.time_buckets.buckets;

			for (var i = 0, len = timeBuckets.length; i < len; i++) {
				var bucket = timeBuckets[i];
				if (bucket.DoorCount.buckets.length > 0 && bucket.door_duration.buckets.length > 0) {
					buckets.push({
						dateTime: bucket.key_as_string,
						key: bucket.key,
						doorRecords: bucket.DoorCount.buckets[0].key,
						doorOpenDuration: bucket.door_duration.buckets[0].key,
						outOfStockSKU: 0
					});
				}
			}
			var startSooSku = 0;
			if (isFromOutlet) {
				if ((assetPurity.assets.buckets && assetPurity.assets.buckets.length > 0) || (assetPurityLastRecord.assets.buckets && assetPurityLastRecord.assets.buckets.length > 0)) {
					var nonEmptyProducts = [];
					data.product.hits.hits.forEach(function (validProduct) {
						nonEmptyProducts.push(validProduct._source.ProductId);
					});
					for (var i = 0; i < assetCount; i++) {
						var planogramId = assetCount == 1 ? Number(planogramIds) : Number(planogramIds[i]),
							parsePlanogramDetails, productIds = [],
							products, productId;
						if (planogramId != 0 && data.planogram.hits.hits && data.planogram.hits.hits.length > 0) {
							var planogramInfo = data.planogram.hits.hits.filter(data => data._id == planogramId);
							if (planogramInfo && planogramInfo.length > 0) {
								parsePlanogramDetails = JSON.parse(planogramInfo[0]._source.FacingDetails);
								for (var k = 0, kLen = parsePlanogramDetails.length; k < kLen; k++) {
									products = parsePlanogramDetails[k].products;
									for (var j = 0, jLen = products.length; j < jLen; j++) {
										productId = products[j].id;
										if (productIds.indexOf(productId) == -1 && nonEmptyProducts.indexOf(productId) > -1) {
											productIds.push(productId);
										}
									}
								}
								var assetId = assetCount == 1 ? filterAssetId : filterAssetId[i];
								if (assetPurity.assets.buckets && assetPurity.assets.buckets.length > 0) {
									var assetData = assetPurity.assets.buckets.filter(data => data.key == assetId);
									if (assetData && assetData.length > 0) {
										assetData[0].time_buckets.buckets.forEach(function (dateWiseRecord) {
											var targetBucket = buckets.find(function (b) {
												return b.key === dateWiseRecord.key;
											});
											if (!targetBucket) {
												var index = buckets.findIndex(function (a) {
													return new Date(a.key_as_string) < new Date(dateWiseRecord.key_as_string);
												})
												targetBucket = {
													dateTime: buckets.key_as_string,
													key: buckets.key,
													doorRecords: 0,
													doorOpenDuration: 0,
													outOfStockSKU: 0
												};
												if (index > -1) {
													buckets.splice(index + 1, 0, targetBucket);
												} else {
													buckets.splice(0, 0, targetBucket);
												}
											}
											dateWiseRecord.latestRecord.hits.hits.forEach(function (purity) {
												var purityProductArray = purity._source.PurityStatus.split(',').filter(function (item, i, ar) {
													return ar.indexOf(item) === i;
												}).map(Number);
												var missingProductIds = productIds.filter(function (i) {
													return purityProductArray.indexOf(i) < 0;
												});
												targetBucket.outOfStockSKU += missingProductIds.length;
											});
										});
									}
								}
								if (assetPurityLastRecord.assets.buckets && assetPurityLastRecord.assets.buckets.length > 0) {
									var assetPurityLastRecordData = assetPurityLastRecord.assets.buckets.filter(data => data.key == assetId);
									if (assetPurityLastRecordData && assetPurityLastRecordData.length > 0) {
										assetPurityLastRecordData[0].latestRecord.hits.hits.forEach(function (purity) {
											var purityProductArray = purity._source.PurityStatus.split(',').filter(function (item, i, ar) {
												return ar.indexOf(item) === i;
											}).map(Number);
											var missingProductIds = productIds.filter(function (i) {
												return purityProductArray.indexOf(i) < 0;
											});
											startSooSku += missingProductIds.length;
										});
									}
								}
							}
						}
					}
				}
			}

			for (var date = new Date(params.startDate); date < new Date(params.endDate); date = moment(date).add(1, 'days')._d) {
				var targetBucket = buckets.find(function (b) {
					return b.key === moment(date).valueOf();
				});
				if (!targetBucket) {
					var index = buckets.findIndex(function (a) {
						return new Date(a.key_as_string) < new Date(date);
					})
					targetBucket = {
						dateTime: date,
						key: moment(date).valueOf(),
						doorRecords: 0,
						doorOpenDuration: 0,
						outOfStockSKU: startSooSku
					};
					if (index > -1) {
						buckets.splice(index + 1, 0, targetBucket);
					} else {
						buckets.splice(buckets.length - 1, 0, targetBucket);
					}
				} else {
					if (targetBucket.outOfStockSKU > 0) {
						startSooSku = targetBucket.outOfStockSKU;
					} else {
						targetBucket.outOfStockSKU = startSooSku;
					}
				}
			}
			timeBuckets = powerData.time_buckets.buckets;

			for (var i = 0, len = timeBuckets.length; i < len; i++) {
				var bucket = timeBuckets[i];
				var targetBucket = buckets.find(function (b) {
					return b.key === bucket.key;
				});
				if (!targetBucket) {
					var index = buckets.findIndex(function (a) {
						return new Date(a.key_as_string) < new Date(bucket.key_as_string);
					})

					targetBucket = {
						dateTime: bucket.key_as_string,
						key: bucket.key,
						doorRecords: 0,
						doorOpenDuration: 0,
						outOfStockSKU: 0
					};
					if (index > -1) {
						buckets.splice(index + 1, 0, targetBucket);
					} else {
						buckets.splice(0, 0, targetBucket);
					}
				}
				if (bucket.avg_duration.buckets.length > 0) {
					Object.assign(targetBucket, {
						powerOffDuration: moment.duration(bucket.avg_duration.buckets[0].key, 'second').asHours()
					});
				}
			}

			timeBuckets = healthData.time_buckets.buckets;
			for (var i = 0, len = timeBuckets.length; i < len; i++) {
				var bucket = timeBuckets[i];
				var targetBucket = buckets.find(function (b) {
					return b.key === bucket.key;
				});
				if (!targetBucket) {
					var index = buckets.findIndex(function (a) {
						return new Date(a.key_as_string) < new Date(bucket.key_as_string);
					})

					targetBucket = {
						dateTime: bucket.key_as_string,
						key: bucket.key,
						doorRecords: 0,
						doorOpenDuration: 0,
						outOfStockSKU: 0,
						powerOffDuration: 0
					};
					if (index > -1) {
						buckets.splice(index + 1, 0, targetBucket);
					} else {
						buckets.splice(0, 0, targetBucket);
					}
				}
				if (bucket.Temperature.avg_temperature.buckets.length > 0 && bucket.Light.avg_light.buckets.length > 0) {
					Object.assign(targetBucket, {
						avgTemperature: bucket.Temperature.avg_temperature.buckets[0].key,
						avgLight: bucket.Light.avg_light.buckets[0].key

					});
				}
			}

			return reply({
				success: true,
				buckets: buckets,
				chartTypeId: params.chartTypeId
			});
		}, function (err) {
			console.log(err.message);
		});
	},
	getMovementGPS: function (request, reply) {
		var assetLatitude = 0;
		var assetLongitude = 0;
		var assetId = 0;
		var movementQuery = JSON.parse(movementMap);
		var startDate = moment().startOf('day');
		var endDate = moment().endOf('day');

		var params = Object.assign({}, request.query, request.payload);

		movementQuery.from = params.start || 0;
		if (params.assetLatitude) {
			assetLatitude = params.assetLatitude;
		}
		if (params.assetLongitude) {
			assetLongitude = params.assetLongitude;
		}
		if (params.assetId) {
			assetId = params.assetId;
			movementQuery.query.bool.must[1].term.AssetId = assetId;
		}
		if (params.startDate) {
			startDate = params.startDate;
			movementQuery.query.bool.must[3].range.EventTime.gte = startDate;
		}
		if (params.endDate) {
			endDate = params.endDate;
			movementQuery.query.bool.must[3].range.EventTime.lte = endDate;

		}

		client.search({
			index: 'cooler-iot-event',
			body: movementQuery
		}).then(function (resp) {
			var gpsDT = [],
				total = resp.hits.total;
			var minDistance = request.auth.credentials.tags.MinMovementDisplacement;
			if (!minDistance) {
				minDistance = 0.5;
			}
			if (total > 0) {
				var hits = resp.hits.hits;
				var len = hits.length;
				var start = 0;
				var startLatitude = assetLatitude,
					startLongitude = assetLatitude;
				if (!assetLatitude && !assetLongitude) {
					startLatitude = hits[0]._source.Latitude;
					startLongitude = hits[0]._source.Longitude;
					start = 1;
				}
				for (var i = start; i < len; i++) {
					var secondRow = hits[i]._source;
					var endLatitude = secondRow.Latitude;
					var endLongitude = secondRow.Longitude;
					var distance = geolib.getDistance({
						latitude: startLatitude,
						longitude: startLongitude
					}, {
						latitude: endLatitude,
						longitude: endLongitude
					});
					distance = geolib.convertUnit('km', distance);
					if (distance >= minDistance || distance <= -minDistance) {
						var data = {
							"Latitude": endLatitude,
							"Longitude": endLongitude,
							"EventTime": secondRow.EventTime
						};
						gpsDT.push(data);
						startLatitude = endLatitude;
						startLongitude = endLongitude;
					}
				}
			} else {
				var data = {
					"Latitude": assetLatitude,
					"Longitude": assetLongitude,
					"EventTime": endDate
				};
				gpsDT.push(data);
			}
			return reply({
				success: true,
				record: gpsDT,
				totalRecord: total
			});
		}, function (err) {
			console.trace(err.message);
		});
	},

	dashboardQueries: {
		alertSummary: JSON.stringify(require('./dashboardQueries/alertSummary.json')),
		healthSummary: JSON.stringify(require('./dashboardQueries/healthSummary.json')),
		assetSummary: JSON.stringify(require('./dashboardQueries/assetSummary.json')),
		surveySummary: JSON.stringify(require('./dashboardQueries/surveySummary.json')),
		locationSummary: JSON.stringify(require('./dashboardQueries/smartLocation.json')),
		TotalAssetLocation: JSON.stringify(require('./dashboardQueries/TotalAssetLocation.json')),
		assetSummaryLocation: JSON.stringify(require('./dashboardQueries/salesAssetSummary.json'))
	},

	getLocationWidgetData: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload),
			//totalAssetLocation = JSON.parse(this.dashboardQueries.TotalAssetLocation),
			assetSummary = JSON.parse(this.dashboardQueries.assetSummaryLocation);
		// client Filter
		var clientQuery = {
			"term": {
				"ClientId": clientId
			}
		};
		if (clientId != 0) {
			assetSummary.query.bool.must.push(clientQuery);
			//totalAssetLocation.query.bool.filter.push(clientQuery);
		}

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
			assetSummary.query.bool.must.push(countryIdsUser);
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
			(params.ExcecuteCommandReport || params["ExcecuteCommandReport[]"]) ||
			(params.installationDate || params["installationDate[]"]) ||
			(params.lastDataReceived || params["lastDataReceived[]"]) ||
			(params.doorDataSelected || params["doorDataSelected[]"]) ||
			(params.salesDataSelected || params["salesDataSelected[]"]) ||
			(params.CoolerHealth || params["CoolerHealth[]"]) ||
			(params.DisplacementFilterHistoric || params["DisplacementFilterHistoric[]"]) ||
			(params.DisplacementFilter || params["DisplacementFilter[]"]) ||
			(params.AlertTypeId || params["AlertTypeId[]"]) ||
			(params.PriorityId || params["PriorityId[]"]) ||
			(params.StatusId || params["StatusId[]"]) || (params.UserId || params["UserId[]"]) ||
			(params.TeleSellingTerritoryId || params["TeleSellingTerritoryId[]"])) {
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
			assetSummary.aggs.Locations.filter.bool.must.push(AssetIds);
		}

		if ((params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) ||
			(params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) ||
			(params.DataDownloadOutlet || params["DataDownloadOutlet[]"]) || (params.UserId || params["UserId[]"]) ||
			(params.TeleSellingTerritoryId || params["TeleSellingTerritoryId[]"])) {
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
			assetSummary.aggs.Locations.filter.bool.must.push(LocationIds);
		}

		assetSummary.aggs.SmartAssetCount.filter.bool.must.push(LocationIds);
		assetSummary.aggs.Locations.filter.bool.must.push(LocationIds);

		if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
			var smartDeviceTypeQuery = {
				"terms": {
					"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
				}
			}
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(smartDeviceTypeQuery);
			assetSummary.aggs.Locations.filter.bool.must.push(smartDeviceTypeQuery);
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
			assetSummary.aggs.Locations.filter.bool.must.push(IsKeyLocationFilter);
			assetSummary.aggs.SmartLocation.filter.bool.must.push(IsKeyLocationFilter);
			// doorSummary.query.bool.filter.push(smartDeviceTypeQuery);
			// DoorAvgDaily.query.bool.filter.push(smartDeviceTypeQuery);
			operationalIssue.query.bool.filter.push(IsKeyLocationFilter);

			kpiLastDataDownloadSummary.query.bool.filter.push(IsKeyLocationFilter);
			kpiLastDataDownloadSummaryDays.query.bool.filter.push(IsKeyLocationFilter);
			chartWise.query.bool.filter.push(IsKeyLocationFilter);
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
			assetSummary.aggs.Locations.filter.bool.must.push(IsFactoryAssetFilter);
		}

		if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
			var assetManufactureQuery = {
				"terms": {
					"AssetManufactureId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
				}
			}
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetManufactureQuery);
			assetSummary.aggs.Locations.filter.bool.must.push(assetManufactureQuery);
		}
		//======filter sales hierarchy================================//
		if (request.query.SalesHierarchyId || request.query["SalesHierarchyId[]"]) {
			if (request.query.SalesHierarchyId && request.query.SalesHierarchyId.constructor && request.query.SalesHierarchyId.constructor !== Array) {
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
			assetSummary.aggs.Locations.filter.bool.must.push(SalesHierarchyId);
		}

		if (request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]) {
			if (request.query["SmartDeviceManufacturerId[]"].constructor !== Array) {
				var toArray = request.query.SmartDeviceManufacturerId;
				request.query.SmartDeviceManufacturerId = [];
				request.query.SmartDeviceManufacturerId.push(toArray);
			}
			var manufacturerSmartDeviceQuery = {
				"terms": {
					"SmartDeviceManufactureId": request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]
				}
			};
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerSmartDeviceQuery);
			assetSummary.aggs.Locations.filter.bool.must.push(manufacturerSmartDeviceQuery);
		}

		if (request.query.AssetTypeCapacityId || request.query["AssetTypeCapacityId[]"]) {
			if (request.query.AssetTypeCapacityId.constructor !== Array) {
				var toArray = request.query.AssetTypeCapacityId;
				request.query.AssetTypeCapacityId = [];
				request.query.AssetTypeCapacityId.push(toArray);
			}
			var AssetTypeCapacityId = {
				"terms": {
					"AssetTypeCapacityId": request.query.AssetTypeCapacityId || request.query["AssetTypeCapacityId[]"]
				}
			};
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetTypeCapacityId);
			assetSummary.aggs.Locations.filter.bool.must.push(AssetTypeCapacityId);
		}

		if (request.query.OutletTypeId || request.query["OutletTypeId[]"]) {
			if (request.query.OutletTypeId && request.query.OutletTypeId.constructor && request.query.OutletTypeId.constructor !== Array) {
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
			assetSummary.aggs.Locations.filter.bool.must.push(manufacturerOutletTypeId);
		}

		if (request.query.LocationTypeId || request.query["LocationTypeId[]"]) {
			if (request.query.LocationTypeId && request.query.LocationTypeId.constructor && request.query.LocationTypeId.constructor !== Array) {
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
			assetSummary.aggs.Locations.filter.bool.must.push(LocationTypeId);
		}

		if (request.query.ClassificationId || request.query["ClassificationId[]"]) {
			if (request.query.ClassificationId && request.query.ClassificationId.constructor && request.query.ClassificationId.constructor !== Array) {
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
			assetSummary.aggs.Locations.filter.bool.must.push(ClassificationId);
		}

		if (request.query.SubTradeChannelTypeId || request.query["SubTradeChannelTypeId[]"]) {
			if (request.query.SubTradeChannelTypeId && request.query.SubTradeChannelTypeId.constructor && request.query.SubTradeChannelTypeId.constructor !== Array) {
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
			assetSummary.aggs.Locations.filter.bool.must.push(SubTradeChannelTypeId);
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
			assetSummary.aggs.Locations.filter.bool.must.push(AssetManufactureId);
		}

		if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
			var AssetTypeId = {
				"terms": {
					"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
				}
			}
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetTypeId);
			assetSummary.aggs.Locations.filter.bool.must.push(AssetTypeId);
		}

		if (request.query.SmartDeviceTypeId || request.query["SmartDeviceTypeId[]"]) {
			if (request.query.SmartDeviceTypeId && request.query.SmartDeviceTypeId.constructor && request.query.SmartDeviceTypeId.constructor !== Array) {
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
			assetSummary.aggs.Locations.filter.bool.must.push(SmartDeviceTypeId);
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
			assetSummary.aggs.Locations.filter.bool.must.push(City);
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
			assetSummary.aggs.Locations.filter.bool.must.push(CountryId);
		}

		if (request.query.LocationCode || request.query["LocationCode[]"]) {
			var LocationCode = {
				"term": {
					"LocationCode": request.query.LocationCode || request.query["LocationCode[]"]
				}
			}
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(LocationCode);
			assetSummary.aggs.Locations.filter.bool.must.push(LocationCode);
		}

		var queries = [{
				key: "db",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					type: ["AssetEventDataSummary"],
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
				finalData = {};
			for (var i = 0, len = values.length; i < len; i++) {
				var value = values[i];
				data[value.config.key] = value.response;
				util.setLogger(value);
			}
			var dbAggs = data.db.aggregations;
			var smartAssetCount = dbAggs.SmartAssetCount.SmartAssetCount.buckets.length;
			//var totalAssetLocation = data.totalAssetLocation.aggregations;
			var totalAsset = dbAggs.AssetCount.AssetCount.buckets.length;
			finalData = {
				totalCooler: totalAsset,
				totalCustomer: dbAggs.LocationCount.LocationCount.buckets.length,
				filteredAssets: dbAggs.AssetCount.AssetCount.buckets.length,
				filteredOutlets: dbAggs.Locations.Locations.buckets.length,
				totalOutlets: dbAggs.LocationCount.LocationCount.buckets.length,
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
		//}.bind(null, this));
	},

	getSurveyWidgetData: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload),
			locationSummary = JSON.parse(this.dashboardQueries.locationSummary),
			surveySummary = JSON.parse(this.dashboardQueries.surveySummary);
		var clientId = request.auth.credentials.user.ScopeId;
		if (clientId != 0) {
			var clientQuery = {
				"term": {
					"ClientId": clientId
				}
			};
			surveySummary.query.bool.filter.push(clientQuery);
			locationSummary.query.bool.must.push(clientQuery);
		}

		//Date Filter
		var isDefaultDateFilter = params.yearWeek || params.dayOfWeek || params.quarter || params.month;
		var dateFilter = [];
		var totalHours = 0
		if (!isDefaultDateFilter && !params.startDate && !params.endDate) {

			surveySummary.query.bool.filter.push({
				"range": {
					"SurveyDateTime": {
						"gte": "now-30d/d"
					}
				}
			});
			totalHours = defaultHours;
		} else if (!isDefaultDateFilter && params.startDate && params.endDate) {
			var startDate = moment(params.startDate).format('YYYY-MM-DD[T00:00:00]');
			var endDate = moment(params.endDate).format('YYYY-MM-DD[T23:59:59]');
			surveySummary.query.bool.filter.push({
				"range": {
					"SurveyDateTime": {
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

				surveySummary.query.bool.filter.push({
					"bool": {
						"should": []
					}
				});
			}
			surveySummary = util.pushDateQuery(surveySummary, {
				"range": {
					"SurveyDateTime": {
						"gte": startDate,
						"lte": endDate
					}
				}
			})

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

				surveySummary.query.bool.filter.push(locationQuery);
				locationSummary.aggs.SmartLocation.filter.bool.must.push(locationQueryOutlet);
				locationSummary.aggs.TotalOutlets.filter.bool.must.push(locationQueryOutlet);
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


				surveySummary.query.bool.filter.push(filterQuery);
				locationSummary.aggs.SmartLocation.filter.bool.must.push(filterQueryOutlet);
				locationSummary.aggs.TotalOutlets.filter.bool.must.push(filterQueryOutlet);

			}
			var queries = [{
				key: "survey",
				search: {
					index: 'surveys',
					body: surveySummary
				}
			}, {
				key: "db",
				search: {
					index: 'cooler-iot-asset,cooler-iot-location',
					body: locationSummary
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
			var response = [];
			Promise.all(promises).then(function (values) {

				for (var i = 0, len = values.length; i < len; i++) {
					var value = values[i];
					response[value.config.key] = value.response;
				}

				var agg = response["survey"].aggregations,
					locationAgg = response["db"].aggregations,
					smartLocation = locationAgg.SmartLocation.doc_count,
					availabilty = agg.ProductAvailabilty,
					activationMetrics = agg.ActivationMetrics,
					coolerMetrics = agg.CoolerMetrics,
					rankData = agg.RankPercentage,
					purityData = agg.PurityInfo,
					surveyCoverageData = agg.SurveyCoverage,
					yesResponse = [],
					rankPercentageData = [],
					rankPercentageBucket = [],
					purityInfo = [],
					noResponse = [],
					surveyCoverage = [],
					totalValue = 0,
					data, productAvailabiltyData, activationMetricsData, coolerMetricsData;

				for (var i = 0; i < 3; i++) {
					//for Product Availabilty / UnAvailabilty, ActivationMetrics, CoolerMetrics
					noResponse = [],
						yesResponse = [];
					switch (i) {
						case 0:
							data = availabilty;
							break;
						case 1:
							data = activationMetrics;
							break;
						case 2:
							data = coolerMetrics;
							break;
					}

					var questionCount = data.SurveyQuestionWithCount.buckets;
					for (var key in data) {
						if (key == 'doc_count' || key == 'OutletCount' || key == 'SurveyQuestionWithCount') {
							continue;
						}
						var obj = data[key];
						obj.Survey.buckets.forEach(function (data) {
							var totalObj = questionCount.find((function (obj) {
								return obj.key === data.key;
							}));
							var label = data.values.hits.hits[0]._source.Tag,
								countData = questionCount,
								count = data.doc_count,
								totalCount = totalObj && totalObj.doc_count ? totalObj.doc_count : 0;
							if (key == 'ResponseNo') {
								noResponse.push({
									SurveyTagId: data.key,
									Label: label,
									TotalCount: totalCount,
									Percentage: parseFloat(((data.doc_count / totalCount) * 100).toFixed(2)),
									Count: count
								});
							} else {
								yesResponse.push({
									SurveyTagId: data.key,
									Label: label,
									TotalCount: totalCount,
									Percentage: parseFloat(((data.doc_count / totalCount) * 100).toFixed(2)),
									Count: count
								});
							}
						});
					}
					switch (i) {
						case 0:
							productAvailabiltyData = {
								noResponse: noResponse,
								yesResponse: yesResponse,
								outletUsedCount: availabilty.OutletCount.value
							};
							break;
						case 1:
							activationMetricsData = {
								noResponse: noResponse,
								yesResponse: yesResponse,
								outletUsedCount: availabilty.OutletCount.value
							};
							break;
						case 2:
							coolerMetricsData = {
								noResponse: noResponse,
								yesResponse: yesResponse,
								outletUsedCount: availabilty.OutletCount.value
							};
							break;
					}

				}

				//for Rank Percentage Data Chart:
				for (var i = 1; i <= 5; i++) {
					rankPercentageBucket.push({
						name: format("{0}-{1}", i == 1 ? 0 : ((i - 1) * 20) + 1, i * 20),
						y: 0,
						Percentage: 0,
						TotalCount: rankData.OutletCount.value,
						ActualPercentage: 0
					});
				}

				for (var key in rankData) {
					if (key == 'doc_count' || key == 'OutletCount') {
						continue;
					}
					var obj = rankData[key];
					obj.buckets.forEach(function (data) {
						var totalPoint = data.totalPoint.value,
							totalCount = data.doc_count,
							percentage = Number(((totalPoint / totalCount) * 100).toFixed(0));
						var loadBucket = (percentage == 0 ? 1 : Math.floor((percentage + 19) / 20) == 0 ? 1 : Math.floor((percentage + 19) / 20)) * 20;
						var bucket = rankPercentageBucket.find((function (obj) {
							var splitData = obj.name.split('-');
							return Number(splitData[splitData.length - 1]) === loadBucket;
						}));
						bucket.y += 1;
						var percent = ((bucket.y / (bucket.TotalCount == 0 ? 1 : bucket.TotalCount)) * 100).toFixed(2);
						bucket.Percentage = Number(percent).toFixed(0) == 100 ? 99.99 : percent;
						bucket.ActualPercentage = percent;
					});
				}

				//for purityInfo Chart
				for (var key in purityData) {
					if (key == 'doc_count' || key == 'OutletCount') {
						continue;
					}
					var obj = purityData[key];
					purityInfo.push({
						Label: key,
						Count: obj.OutletCount.value,
						Percentage: parseFloat(((obj.OutletCount.value / purityData.OutletCount.value) * 100).toFixed(2)),
						TotalCount: purityData.OutletCount.value
					});
				}

				//for Survey Coverage on Map
				for (var key in surveyCoverageData) {
					if (key == 'doc_count') {
						continue;
					}
					var obj = surveyCoverageData[key];
					if (obj.buckets) {
						obj.buckets.forEach(function (data) {
							var record = data.Longitude.buckets[0];
							surveyCoverage.push({
								Latitude: data.key,
								Longitude: record.key,
								Total: record.doc_count
							});
						});
					}
				}
				var totalOutletsNotSurveyed = locationAgg.TotalOutlets.doc_count - agg.TotalOutletsSurveyed.OutletCount.value;

				return reply({
					Success: true,
					SmartLocation: smartLocation,
					TotalOutlets: locationAgg.TotalOutlets.doc_count,
					TotalIssues: agg.TotalIssues.doc_count,
					TotalOutletsSurveyed: agg.TotalOutletsSurveyed.OutletCount.value,
					TotalSurveyors: agg.TotalSurveyors.Surveyors.value,
					TotalOutletsNotSurveyed: totalOutletsNotSurveyed,
					ProductAvailabilty: productAvailabiltyData,
					ActivationMetrics: activationMetricsData,
					CoolerMetrics: coolerMetricsData,
					RankPercentage: {
						record: rankPercentageBucket,
						outletUsedCount: rankData.OutletCount.value
					},
					PurityInfo: {
						record: purityInfo,
						outletUsedCount: purityData.OutletCount.value
					},
					SurveyCoverage: {
						record: surveyCoverage
					}
				});
			}, function (err) {
				console.trace(err.message);
				return reply(Boom.badRequest(err.message));
			});

		}.bind(null, this));
	},

	getIOTWidgetData: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload),
			alertSummary = JSON.parse(this.dashboardQueries.alertSummary),
			healthSummary = JSON.parse(this.dashboardQueries.healthSummary),
			assetSummary = JSON.parse(this.dashboardQueries.assetSummary);

		var clientQuery = {
			"term": {
				"ClientId": clientId
			}
		};

		alertSummary.query.bool.must.push(clientQuery);
		healthSummary.query.bool.must.push(clientQuery);
		assetSummary.query.bool.must.push(clientQuery);

		var tags = credentials.tags,
			limitLocation = Number(tags.LimitLocation),
			limitLocations = [];
		if (limitLocation != 0) {
			limitLocations = tags.LocationIds;
			var locationQuery = {
				"terms": {
					"LocationId": limitLocations.length != 0 ? limitLocations : [0]
				}
			};

			alertSummary.query.bool.must.push(locationQuery);
			healthSummary.query.bool.must.push(locationQuery);
			assetSummary.aggs.Assets.filter.bool.must.push(locationQuery);
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
			assetSummary.aggs.AssetCount.filter.bool.must.push(locationQuery);
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
			locationQuery = {
				"terms": {
					"_id": limitLocations.length != 0 ? limitLocations : [0]
				}
			};
			assetSummary.aggs.LocationCount.filter.bool.must.push(locationQuery);
			assetSummary.aggs.Locations.filter.bool.must.push(locationQuery);

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


			alertSummary.query.bool.must.push(filterQuery);
			healthSummary.query.bool.must.push(filterQuery);
			assetSummary.aggs.Assets.filter.bool.must.push(filterQuery);
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(filterQuery);
			assetSummary.aggs.AssetCount.filter.bool.must.push(filterQuery);
			assetSummary.aggs.SmartAssetCount.filter.bool.must.push(filterQuery);

			assetSummary.aggs.LocationCount.filter.bool.must.push(filterQueryOutlet);
			assetSummary.aggs.Locations.filter.bool.must.push(filterQueryOutlet);

		}
		outletReducer(request, params).then(function (locationIds) {
			params["LocationIds" + "[]"] = locationIds;
			this.locationIds = locationIds;
			params["LocationIds[]"] = locationIds;
			if (params.AlertTypeId || params.PriorityId || params.StatusId || params["AlertTypeId[]"] || params["PriorityId[]"] || params["StatusId[]"]) {
				params["startDateAlert"] = params.startDate;
				params["endDateAlert"] = params.endDate;
				params["fromOutletScreenAlert"] = true;
				if (params.dayOfWeek || params["dayOfWeek[]"]) {
					params["dayOfWeekAlert"] = params.dayOfWeek || params["dayOfWeek[]"];
				}
				if (params.yearWeek || params["yearWeek[]"]) {
					params["yearWeekAlert"] = params.yearWeek || params["yearWeek[]"];
				}
				if (params.quarter || params["quarter[]"]) {
					params["quarterAlert"] = params.quarter || params["quarter[]"];
				}
				if (params.month || params["month[]"]) {
					params["monthAlert"] = params.month || params["month[]"];
				}
			}
			alertReducer(request, params, "LocationId").then(function (alertLocationIds) {
				if (Array.isArray(this.locationIds)) {
					if (Array.isArray(alertLocationIds) || !alertLocationIds) {
						var locationTerm
						if (!alertLocationIds) {
							locationTerm = {
								"terms": {
									LocationId: this.locationIds
								}
							};
							assetSummary.aggs.Locations.filter.bool.must.push({
								"terms": {
									"_id": this.locationIds
								}
							});
						} else {
							locationTerm = {
								"terms": {
									LocationId: this.locationIds.length == 0 ? this.locationIds : alertLocationIds
								}
							};
							assetSummary.aggs.Locations.filter.bool.must.push({
								"terms": {
									"_id": this.locationIds.length == 0 ? this.locationIds : alertLocationIds
								}
							});
						}
						var alertTypeId = request.query.AlertTypeId || request.query["AlertTypeId[]"];
						var priorityId = request.query.PriorityId || request.query["PriorityId[]"];

						alertSummary.aggs.AlertOpenCount.filter.bool.must.push(locationTerm);
						alertSummary.aggs.alertsCreatedByWeek.filter.bool.must.push(locationTerm);
						alertSummary.aggs.alertsClosedByWeek.filter.bool.must.push(locationTerm);

						assetSummary.aggs.Assets.filter.bool.must.push(locationTerm);
						assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationTerm);
						healthSummary.aggs.DoorData.filter.bool.must.push(locationTerm);
						healthSummary.aggs.PingData.filter.bool.must.push(locationTerm);
						healthSummary.aggs.PowerData.filter.bool.must.push(locationTerm);

						var terms = [];
						if (alertTypeId) {
							if (typeof (alertTypeId) === 'string') {
								terms.push({
									"term": {
										AlertTypeId: alertTypeId
									}
								});
							} else {
								terms.push({
									"terms": {
										AlertTypeId: alertTypeId
									}
								});
							}
						}
						if (priorityId) {
							if (typeof (priorityId) === 'string') {
								terms.push({
									"term": {
										PriorityId: priorityId
									}
								});
							} else {
								terms.push({
									"terms": {
										PriorityId: priorityId
									}
								});
							}

						}
						if (terms.length > 0) {
							alertSummary.aggs.AlertOpenCount.filter.bool.must.push(terms);
							alertSummary.aggs.alertsCreatedByWeek.filter.bool.must.push(terms);
							alertSummary.aggs.alertsClosedByWeek.filter.bool.must.push(terms);
						}

					}
				}

				var queries = [{
					key: "events",
					search: {
						index: 'cooler-iot-event',
						body: healthSummary
					}
				}, {
					key: "alert",
					search: {
						index: 'cooler-iot-alert',
						body: alertSummary
					}
				}, {
					key: "db",
					search: {
						index: 'cooler-iot-asset,cooler-iot-location',
						body: assetSummary
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
					promises.push(this.getElasticData(queries[i]));
				}

				var data = {};
				Promise.all(promises).then(function (values) {
					for (var i = 0, len = values.length; i < len; i++) {
						var value = values[i];
						data[value.config.key] = value.response;
						util.setLogger(value);
					}
					var finalData = {
						doorData: {
							low: 0,
							medium: 0,
							high: 0
						},
						openAlerts: [],
						alertsByWeek: []
					};
					var smartAssetCount = data.db.aggregations.SmartAssetCount.doc_count;

					var doorData = finalData.doorData,
						openAlerts = finalData.openAlerts,
						alertsByWeek = finalData.alertsByWeek;
					var openAlertBuckets = [
						"Today",
						"1-3",
						"3-6",
						"6+"
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
					var remainingSmartAssetForDoorData = smartAssetCount - data.events.aggregations.DoorData.assets.buckets.length;

					data.events.aggregations.DoorData.assets.buckets.forEach(function (bucket) {
						var doorOpens = bucket.doc_count;
						if (doorOpens < 250) {
							doorData.low = doorData.low + 1;
						} else if (doorOpens < 500) {
							doorData.medium = doorData.medium + 1;
						} else {
							doorData.high = doorData.high + 1;
						}
					});
					if (doorData.low > 0) {
						doorData.low = doorData.low + remainingSmartAssetForDoorData;
					}

					var alertCounts = data.alert.aggregations.AlertOpenCount.Bands.buckets,
						totalAssets = data.db.aggregations.Assets.doc_count;

					for (var bucket in alertCounts) {
						var target = openAlerts[openAlertBuckets.indexOf(bucket)];
						target.Assets = alertCounts[bucket].Assets.value;
						target.OpenAlertAssetPercentage = parseFloat(((alertCounts[bucket].Assets.value / totalAssets) * 100).toFixed(2))
						alertCounts[bucket].Priority.buckets.forEach(function (priorityBucket) {
							target[consts.alertPriorityMappings[priorityBucket.key]] = priorityBucket.doc_count;
						});
					}

					finalData.alertsByType = [];
					data.alert.aggregations.AlertOpenCount.ByType.buckets.forEach(function (bucket) {
						finalData.alertsByType.push({
							alertTypeId: bucket.key,
							alertType: consts.alertTypesMappings[bucket.key],
							count: bucket.doc_count
						});
					});

					var cumulative = data.alert.aggregations.oldOpenAlerts.doc_count;

					var dateKeys = {};

					data.alert.aggregations.alertsCreatedByWeek.byWeek.buckets.forEach(function (bucket) {
						var record = {
							date: bucket.key_as_string,
							created: bucket.doc_count,
							closed: 0
						};
						alertsByWeek.push(record);
						dateKeys[bucket.key] = record;
					});

					data.alert.aggregations.alertsClosedByWeek.byWeek.buckets.forEach(function (bucket) {
						var record = dateKeys[bucket.key];
						//record.closed = bucket.doc_count;

						//cumulative = cumulative + record.created - record.closed;
						//record.cumulative = cumulative;
						if (record) {
							record.closed = bucket.doc_count;
							cumulative = cumulative + (record.created - record.closed);
							record.cumulative = cumulative;
						}
					});

					var temperatureBands = [],
						lightBands = [],
						healthOverview = [],
						totalAssets = data.db.aggregations.Assets.doc_count,
						smart;

					finalData.PingData = [];
					data.events.aggregations.PingData.Date.buckets.forEach(function (bucket) {
						finalData.PingData.push({
							key: bucket.key,
							assets: bucket.AssetCount.value,
							total: bucket.doc_count,
							PercentageAsset: parseFloat(((bucket.AssetCount.value / totalAssets) * 100).toFixed(2))
						});
					});

					finalData.PowerData = [];
					data.events.aggregations.PowerData.Date.buckets.forEach(function (bucket) {
						finalData.PowerData.push({
							key: bucket.key,
							assets: bucket.AssetCount.value,
							total: bucket.doc_count,
							PercentageAsset: parseFloat(((bucket.AssetCount.value / totalAssets) * 100).toFixed(2))
						});
					});

					data.db.aggregations.Assets.TempBandChart.TempRanges.buckets.forEach(function (bucket) {
						temperatureBands.push({
							key: bucket.key,
							assets: bucket.doc_count,
							outlets: bucket.OutletCount.value
						});
					});

					smart = data.db.aggregations.Assets.TempBandChart.doc_count;
					if (smart < totalAssets) {
						temperatureBands.push({
							key: "Non-Smart",
							assets: totalAssets - smart,
							outlets: 0
						});
					}

					data.db.aggregations.Assets.LightBandChart.TempRanges.buckets.forEach(function (bucket) {
						lightBands.push({
							key: bucket.key,
							assets: bucket.doc_count,
							outlets: bucket.OutletCount.value
						});
					});

					if (smart < totalAssets) {
						lightBands.push({
							key: "Non-Smart",
							assets: totalAssets - smart,
							outlets: 0
						});
					}

					var overview = data.db.aggregations.Assets.TempLightIssueCount;
					for (var o in overview) {
						if (o !== "doc_count") {
							healthOverview.push({
								name: o,
								y: overview[o].doc_count
							});
						}
					}

					finalData.temperatureBands = temperatureBands;
					finalData.lightBands = lightBands;
					finalData.healthOverview = healthOverview;

					var groups = [];
					data.db.aggregations.Assets.ByCity.buckets.forEach(function (bucket) {
						groups.push({
							key: bucket.key,
							IsMissing: bucket.IsMissing.doc_count,
							LowLight: bucket.LowLight.doc_count,
							HighTemp: bucket.HighTemp.doc_count,
							Unhealthy: bucket.Unhealthy.doc_count,
							PowerOff: bucket.PowerOff.doc_count,
							Outlets: bucket.Locations.value,
							Assets: bucket.doc_count
						});
					});

					finalData.groups = groups;

					var dbAggs = data.db.aggregations;

					finalData.summary = {
						totalAssets: dbAggs.AssetCount.doc_count, //dbAggs.Assets.doc_count,
						totalOutlets: dbAggs.LocationCount.doc_count,
						filteredAssets: dbAggs.Assets.doc_count, //totalAssets,
						filteredOutlets: dbAggs.Locations.doc_count,
						openAlerts: data.alert.aggregations.AlertOpenCount.doc_count,
						lightBelow10TempAbove12: dbAggs.Assets.lightBelow10TempAbove12.doc_count,
						lightBelow10: dbAggs.Assets.lightBelow10.doc_count,
						isMissing: dbAggs.Assets.isMissing.doc_count,
						isPowerOff: dbAggs.Assets.isPowerOff.doc_count,
						tempAbove12: dbAggs.Assets.tempAbove12.doc_count
					};

					return reply({
						success: true,
						data: finalData
					});
				}, function (err) {
					console.trace(err.message);
					return reply(Boom.badRequest(err.message));
				});
			}.bind(this)).catch(function (err) {
				console.log(err);
				return reply(Boom.badRequest(err.message));
			})

		}.bind(this)).catch(function (err) {
			console.log(err);
			return reply(Boom.badRequest(err.message));
		});
	},

	getCoolerStatusData: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var params = Object.assign({}, request.query, request.payload),
			coolerStatus = JSON.parse(coolerStatusQuery);
		coolerStatus.aggs.ByCity.terms.field = params.type;

		var clientId = request.auth.credentials.user.ScopeId;
		var clientQuery = {
			"term": {
				"ClientId": clientId
			}
		};
		coolerStatus.query.bool.must.push(clientQuery);

		client.search({
			index: 'cooler-iot-asset,cooler-iot-location',
			body: coolerStatus
		}).then(function (resp) {
			var aggs = resp.aggregations;
			var cityBcket = aggs.ByCity;
			var coolerBucket = cityBcket.buckets;
			var buckets = [];
			for (var i = 0, len = coolerBucket.length; i < len; i++) {
				var bucket = coolerBucket[i];
				buckets.push({
					City: bucket.key,
					AssetCount: bucket.doc_count,
					IsMissing: bucket.IsMissing.doc_count,
					LowLight: bucket.LowLight.doc_count,
					Locations: bucket.Locations.value,
					HighTemp: bucket.HighTemp.doc_count,
					Unhealthy: bucket.Unhealthy.doc_count,
					PowerOff: bucket.PowerOff.doc_count
				});
			}
			return reply({
				success: true,
				data: buckets
			});
		}, function (err) {
			console.trace(err.message);
		});
	},
	getLocationForSalesRep: function (request, reply, response, sid, data) {
		var locationRep = JSON.parse(locationRepQuery);
		locationRep.query.bool.filter.push({
			"term": {
				"RepId": data.user.UserId
			}
		});
		client.search({
			index: 'cooler-iot-locationrep',
			body: locationRep
		}).then(function (resp) {
			var hits = resp.hits.hits,
				len = hits.length,
				locationIds = [];
			for (var i = 0; i < len; i++) {
				var record = hits[i]._source;
				locationIds.push(record.LocationId);
			}
			data.tags.LocationIds = locationIds;
			request.server.app.cache.set(sid, {
				data: data
			}, 0, (err) => {
				if (err) {
					console.log(err);
					return reply(Boom.badImplementation('Error setting session value'));
				}
				request.cookieAuth.set({
					sid: sid
				});
				return reply(response);
			});
		}, function (err) {
			console.trace(err.message);
		});
	},
	exportData: function (request, reply) {
		if (request.payload && request.payload.params) {
			request.payload = typeof request.payload.params === 'string' ? JSON.parse(request.payload.params) : request.payload.params;
			reply.request.payload = request.payload;
		}
		var params = Object.assign({}, request.query, request.payload);

		var promises = [];
		promises.push(this.getExportData(request, params));

		Promise.all(promises).then(function (_this, values) {
				// You can define styles as json object 
				// More info: https://github.com/protobi/js-xlsx#cell-styles 
				var _this = _this;
				var data;
				for (var i = 0, len = values.length; i < len; i++) {
					var value = values[i];
					data = value.data;
				}

				var params = Object.assign({}, reply.request.query, reply.request.payload);
				var styles = {
					headerDark: {
						fill: {
							fgColor: {
								rgb: 'c4c4c4c4'
							}
						},
						font: {
							color: {
								rgb: 'FF000000'
							},
							sz: 11,
							bold: true
						}
					},
					cellPink: {
						fill: {
							fgColor: {
								rgb: 'FFFFCCFF'
							}
						}
					},
					cellGreen: {
						fill: {
							fgColor: {
								rgb: 'FF00FF00'
							}
						}
					}
				};

				//Array of objects representing heading rows (very top) 
				//let heading = [];
				var DateGenerated = moment().format('DD/MMM/YYYY').toString();
				var GeneratedFor = reply.request.auth.credentials.tags.FirstName + " " + reply.request.auth.credentials.tags.LastName;
				var headerData = [];
				var heading = [];

				var dateFilteredSegment = params["quarter"] ? "Quarter" : params["month"] ? "Month" : params["yearWeek"] ? "Year Week" : "Range";
				if (params["dayOfWeek"]) {
					dateFilteredSegment = dateFilteredSegment + "," + "Day Of Week";
				}

				if (params.exportData == "AFSROutlet" || params.exportData == "AFSRAsset") {
					heading = [
						[{
								value: 'Filtered Section',
								style: styles.headerDark,
								cellStyle: styles.cellPink
							}, {
								value: 'Filtered Segment',
								style: styles.headerDark,
								cellStyle: styles.cellPink
							}, {
								value: 'Filtered Value',
								style: styles.headerDark,
								cellStyle: styles.cellPink
							}, null, null,
							{
								value: 'Date Generated',
								style: styles.headerDark,
								cellStyle: styles.cellPink
							},
							DateGenerated
						],
						['Time Period',
							dateFilteredSegment,
							params.FilterDate,
							null,
							null,
							{
								value: 'Generated For',
								style: styles.headerDark,
								cellStyle: styles.cellPink
							},
							GeneratedFor
						]
					];



					if (params.AppliedFilterArray) {
						params.AppliedFilterArray.forEach(function (element) {
							var newValue = (element.FilteredValue).substring(0, element.FilteredValue.length - 1);
							heading.push([element.FilteredSection, element.FilteredSegment, newValue]);
						}, this);
						heading.push([null, null, null]);
					}
				}

				var specification;
				var name;
				var exportType = params.exportType;
				var exportDate = params.exportDate;
				//var data = JSON.parse(params.xlsExport)[0];

				if (params.exportData == "AFSR") {
					name = "FilterSummary";
					specification = {

						TechnicalIdentificationNumber: {
							displayName: 'Asset Technical ID',
							headerStyle: styles.headerDark,
							width: '20'
						},

						SerialNumber: {
							displayName: 'Serial Number',
							headerStyle: styles.headerDark,
							width: '20'
						},

						Location: {
							displayName: 'Outlet',
							headerStyle: styles.headerDark,
							width: '30'
						},

						LocationCode: {
							displayName: 'Outlet Code',
							headerStyle: styles.headerDark,
							width: '20'
						},

						OutletType: {
							displayName: 'Outlet Type',
							headerStyle: styles.headerDark,
							width: '20'
						},

						LocationType: {
							displayName: 'Trade Channel',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Classification: {
							displayName: 'Customer Tier',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SubTradeChannelType: {
							displayName: 'Sub Trade Channel',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SalesOrganization: {
							displayName: 'Sales Organization',
							headerStyle: styles.headerDark,
							width: '20'
						},

						SalesOffice: {
							displayName: 'Sales Office',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SalesGroup: {
							displayName: 'Sales Group',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SalesTerritory: {
							displayName: 'Sales Territory',
							headerStyle: styles.headerDark,
							width: '20'
						},
						AssetLastPing: {
							displayName: 'Asset Ping',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								value = moment(value).format('YYYY-MM-DD HH:mm:ss');
								return value == '0001-01-01 00:00:00' ? '' : value;
							}
						},
						IsSmartAsset: {
							displayName: 'Is Smart Asset',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SmartDeviceSerialNumber: {
							displayName: 'Smart Device',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SmartDeviceType: {
							displayName: 'Smart Device Type',
							headerStyle: styles.headerDark,
							width: '20'
						},
						LastPing: {
							displayName: 'Smart Device Ping',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								value = moment(value).format('YYYY-MM-DD HH:mm:ss');
								return value == '0001-01-01 00:00:00' ? '' : value;
							}
						},
						LatestHealthRecordTime: {
							displayName: 'Latest Health Record Event Time',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								value = moment(value).format('YYYY-MM-DD HH:mm:ss');
								return value == '0001-01-01 00:00:00' ? '' : value;
							}
						},

						LightIntensity: {
							displayName: 'Light Intensity',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Temperature: {
							displayName: 'Temperature',
							headerStyle: styles.headerDark,
							width: '20'
						},
						BatteryStatus: {
							displayName: 'Battery Status',
							headerStyle: styles.headerDark,
							width: '20'
						},
						LatestLatitude: {
							displayName: 'Latest GPS Latitude',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								return row.LatestLocationGeo.lat
							}
						},
						LatestLongitude: {
							displayName: 'Latest GPS Longitude',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								return row.LatestLocationGeo.lon
							}
						},
						Displacement: {
							displayName: 'Displacement',
							headerStyle: styles.headerDark,
							width: '20'
						},
						GPSreceived: {
							displayName: 'GPS Received On',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								value = moment(value).format('YYYY-MM-DD HH:mm:ss');
								return value == '0001-01-01 00:00:00' ? '' : value;
							}
						},
						LatestDoorTime: {
							displayName: 'Latest Door Event',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								value = moment(value).format('YYYY-MM-DD HH:mm:ss');
								return value == '0001-01-01 00:00:00' ? '' : value;
							}
						},
						DoorCount: {
							displayName: 'Door Count',
							headerStyle: styles.headerDark,
							width: '30'
						},
						IsPowerOn: {
							displayName: 'Is Power On',
							headerStyle: styles.headerDark,
							width: '30'
						},
						GatewaySerialNumber: {
							displayName: 'Gateway',
							headerStyle: styles.headerDark,
							width: '30'
						},
						GatewayType: {
							displayName: 'Gateway Type',
							headerStyle: styles.headerDark,
							width: '30'
						},
						GatewayLastPing: {
							displayName: 'Gateway Ping',
							headerStyle: styles.headerDark,
							width: '30',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								value = moment(value).format('YYYY-MM-DD HH:mm:ss');
								return value == '0001-01-01 00:00:00' ? '' : value;
							}
						},
						LatestScanTime: {
							displayName: 'Last Visited On',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								//return (value == '0001-01-01T00:00:00') ? '' : value;
								value = moment(value).format('YYYY-MM-DD HH:mm:ss');
								return value == '0001-01-01 00:00:00' ? '' : value;
							}
						},
						AssetCurrentStatus: {
							displayName: 'Visit Status',
							headerStyle: styles.headerDark,
							width: '30'
						},
						PrimarySalesRep: {
							displayName: 'Responsible BD Username',
							headerStyle: styles.headerDark,
							width: '30'
						},
						BDFirstName: {
							displayName: 'Responsible BD First Name',
							headerStyle: styles.headerDark,
							width: '30'
						},
						BDPhoneNumber: {
							displayName: 'Responsible BD Phone number',
							headerStyle: styles.headerDark,
							width: '30'
						},
						AssetType: {
							displayName: 'Asset Type',
							headerStyle: styles.headerDark,
							width: '20'
						},

						EquipmentNumber: {
							displayName: 'Equipment Number',
							headerStyle: styles.headerDark,
							width: '20'
						},
						AssetCategory: {
							displayName: 'Category',
							headerStyle: styles.headerDark,
							width: '20'
						},
						IsCompetition: {
							displayName: 'Is Competition',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Street: {
							displayName: 'Street',
							headerStyle: styles.headerDark,
							width: '20'
						},
						City: {
							displayName: 'City',
							headerStyle: styles.headerDark,
							width: '20'
						},
						State: {
							displayName: 'State',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Country: {
							displayName: 'Country',
							headerStyle: styles.headerDark,
							width: '20'
						},
						HasVision: {
							displayName: 'Is Vision',
							headerStyle: styles.headerDark,
							width: '20'
						},
						IsSmart: {
							displayName: 'Is Smart',
							headerStyle: styles.headerDark,
							width: '20'
						},
						InstallPositionlat: {
							displayName: 'Install Position Latitude',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								return row.LocationGeo.lat
							}
						},
						InstallPositionlong: {
							displayName: 'Install Position Longitude',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								return row.LocationGeo.lon
							}
						},
						CellIdReceived: {
							displayName: 'Cell Id Received On',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								value = moment(value).format('YYYY-MM-DD HH:mm:ss');
								return value == '0001-01-01 00:00:00' ? '' : value;
							}
						},
						GPSverified: {
							displayName: 'GPS Verified On',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								value = moment(value).format('YYYY-MM-DD HH:mm:ss');
								return value == '0001-01-01 00:00:00' ? '' : value;
							}
						},
						LatestCellLocationLatitude: {
							displayName: 'Latest Cell Location Latitude',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								return row.LatestCellLocationGeo.lat
							}
						},
						LatestCellLocationLongitude: {
							displayName: 'Latest Cell Location Longitude',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								return row.LatestCellLocationGeo.lon
							}
						},
						LatestCellLocationLatitude: {
							displayName: 'Latest Cell Location Latitude',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								return row.LatestCellLocationGeo.lat
							}
						},
						LatestCellLocationLongitude: {
							displayName: 'Latest Cell Location Longitude',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								return row.LatestCellLocationGeo.lon
							}
						},
						CalculatedAssetLocationGeoLatitude: {
							displayName: 'Calculated Asset Latitude',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								return row.CalculatedAssetLocationGeo.lat
							}
						},
						CalculatedAssetLocationGeoLongitude: {
							displayName: 'Calculated Asset Longitude',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								return row.CalculatedAssetLocationGeo.lon
							}
						},
						Accuracy: {
							displayName: 'Accuracy',
							headerStyle: styles.headerDark,
							width: '20'
						},
						CCHSolution: {
							displayName: 'CCH Solution',
							headerStyle: styles.headerDark,
							width: '20'
						},
						AssetAssociatedOn: {
							displayName: 'AssetAssociatedOn',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								value = moment(value).format('YYYY-MM-DD HH:mm:ss');
								return value == '0001-01-01 00:00:00' ? '' : value;
							}
						},
						AssetAssociatedByUser: {
							displayName: 'Associated By BD User Name',
							headerStyle: styles.headerDark,
							width: '20'
						},
						AssetAssociatedByUserName: {
							displayName: 'Associated By BD Name',
							headerStyle: styles.headerDark,
							width: '20'
						},
						TimeZoneName: {
							displayName: 'Time Zone',
							headerStyle: styles.headerDark,
							width: '20'
						}
					};
				} else if (params.exportData == "AFSROutlet") {
					name = "Outlet_FilterSummary";
					specification = {
						Name: {
							displayName: 'Outlet',
							headerStyle: styles.headerDark,
							width: '30'
						},

						LocationCode: {
							displayName: 'Outlet Code',
							headerStyle: styles.headerDark,
							width: '20'
						},

						OutletType: {
							displayName: 'Outlet Type',
							headerStyle: styles.headerDark,
							width: '20'
						},

						LocationType: {
							displayName: 'Trade Channel',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Classification: {
							displayName: 'Customer Tier',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SubTradeChannelType: {
							displayName: 'Sub Trade Channel',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SalesOrganization: {
							displayName: 'Sales Organization',
							headerStyle: styles.headerDark,
							width: '20'
						},

						SalesOffice: {
							displayName: 'Sales Office',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SalesGroup: {
							displayName: 'Sales Group',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SalesTerritory: {
							displayName: 'Sales Territory',
							headerStyle: styles.headerDark,
							width: '20'
						},
						DoorCount: {
							displayName: 'Door Count(' + params.FilterDate + ')',
							headerStyle: styles.headerDark,
							width: '30'
						},
						SalesTerritoryCode: {
							displayName: 'Sales Territory Code',
							headerStyle: styles.headerDark,
							width: '30'
						},
						CurrentlyAsssignedBDUsername: {
							displayName: 'BD username',
							headerStyle: styles.headerDark,
							width: '30'
						},
						CurrentlyAssignedBDName: {
							displayName: 'BD Name',
							headerStyle: styles.headerDark,
							width: '30'
						},

						Street: {
							displayName: 'Street',
							headerStyle: styles.headerDark,
							width: '20'
						},
						City: {
							displayName: 'City',
							headerStyle: styles.headerDark,
							width: '20'
						},

						Country: {
							displayName: 'Country',
							headerStyle: styles.headerDark,
							width: '20'
						}
					};
				} else if (params.exportData == "AFSRAsset") {
					name = "Asset_FilterSummary";
					specification = {

						TechnicalIdentificationNumber: {
							displayName: 'Asset Technical ID',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SerialNumber: {
							displayName: 'Serial Number',
							headerStyle: styles.headerDark,
							width: '20'
						},
						EquipmentNumber: {
							displayName: 'Equipment Number',
							headerStyle: styles.headerDark,
							width: '20'
						},
						AssetType: {
							displayName: 'Asset Type',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SmartDeviceType: {
							displayName: 'Smart Device Type',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SmartDeviceSerialNumber: {
							displayName: 'Smart Device',
							headerStyle: styles.headerDark,
							width: '20'
						},
						GatewayType: {
							displayName: 'Gateway Type',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) {
								return value == 0 ? 'N/A' : value;
							}
						},
						GatewaySerialNumber: {
							displayName: 'Gateway Serial Number',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) {
								return value == 0 ? 'N/A' : value;
							}
						},
						Location: {
							displayName: 'Outlet',
							headerStyle: styles.headerDark,
							width: '30'
						},
						LocationCode: {
							displayName: 'Outlet Code',
							headerStyle: styles.headerDark,
							width: '20'
						},

						OutletType: {
							displayName: 'Outlet Type',
							headerStyle: styles.headerDark,
							width: '20'
						},
						LocationType: {
							displayName: 'Trade Channel',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Classification: {
							displayName: 'Customer Tier',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SubTradeChannelType: {
							displayName: 'Sub Trade Channel',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SalesOrganization: {
							displayName: 'Sales Organization',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SalesOffice: {
							displayName: 'Sales Office',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SalesGroup: {
							displayName: 'Sales Group',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SalesTerritory: {
							displayName: 'Sales Territory',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SalesTerritoryCode: {
							displayName: 'Sales Territory Code',
							headerStyle: styles.headerDark,
							width: '30'
						},
						AssetAssociatedOn: {
							displayName: 'AssetAssociatedOn',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								value = moment(value).format('YYYY-MM-DD HH:mm:ss');
								return value == '0001-01-01 00:00:00' || value == '1970-01-01 00:00:00' ? 'N/A' : value;
							}
						},
						AssetAssociatedByUser: {
							displayName: 'Associated By BD User Name',
							headerStyle: styles.headerDark,
							width: '20'
						},

						CurrentlyAsssignedBDUsername: {
							displayName: 'BD username',
							headerStyle: styles.headerDark,
							width: '30'
						},
						CurrentlyAssignedBDName: {
							displayName: 'BD Name',
							headerStyle: styles.headerDark,
							width: '30'
						},
						LatestDoorTime: {
							displayName: 'Latest Door Event',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								value = value == 'N/A' ? '' : moment(value).format('YYYY-MM-DD HH:mm:ss');
								return value == '0001-01-01 00:00:00' ? '' : value;
							}
						},
						DoorCount: {
							displayName: 'Door Count(' + params.FilterDate + ')',
							headerStyle: styles.headerDark,
							width: '30'
						},
						BatteryLevel: {
							displayName: 'Battery Level',
							headerStyle: styles.headerDark,
							width: '30',
							cellFormat: function (value, row) {
								return (value >= 0 && value < 25) ? '0%-25%' : (value >= 25 && value < 50) ? '25%-50%' : (value >= 50 && value < 75) ? '50%-75%' : (value >= 75 && value <= 100) ? '75%-100%' : 'N/A';
							}
						},

						Street: {
							displayName: 'Street',
							headerStyle: styles.headerDark,
							width: '20'
						},
						City: {
							displayName: 'City',
							headerStyle: styles.headerDark,
							width: '20'
						},

						Country: {
							displayName: 'Country',
							headerStyle: styles.headerDark,
							width: '20'
						},

						CCHSolution: {
							displayName: 'CCH Solution',
							headerStyle: styles.headerDark,
							width: '20'
						},

						TimeZoneName: {
							displayName: 'Time Zone',
							headerStyle: styles.headerDark,
							width: '20'
						}
					};
				} else if (params.exportData == "Assets") {
					name = "Assets";
					specification = {
						SerialNumber: {
							displayName: 'Serial Number',
							headerStyle: styles.headerDark,
							width: '20'
						},
						EquipmentNumber: {
							displayName: 'Equipment Number',
							headerStyle: styles.headerDark,
							width: '20'
						},

						TechnicalIdentificationNumber: {
							displayName: 'Asset Technical ID',
							headerStyle: styles.headerDark,
							width: '20'
						},
						AssetType: {
							displayName: 'Asset Type',
							headerStyle: styles.headerDark,
							width: '20'
						},
						//Code: { displayName: 'Code' , headerStyle: styles.headerDark,	width: '10'},
						LocationCode: {
							displayName: 'Outlet Code',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Location: {
							displayName: 'Outlet',
							headerStyle: styles.headerDark,
							width: '30'
						},
						SmartDeviceSerialNumber: {
							displayName: 'Smart Device Serial Number',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SmartDeviceType: {
							displayName: 'Smart Device Type',
							headerStyle: styles.headerDark,
							width: '20'
						},
						AssetAssociatedOn: {
							displayName: 'Installation Date',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								value = moment(value).format('YYYY-MM-DD HH:mm:ss');
								return value == '0001-01-01 00:00:00' ? 'N/A' : value;
							}
						},
						LastPing: {
							displayName: 'Data Last Uploaded',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								value = moment(value).format('YYYY-MM-DD HH:mm:ss');
								return value == '0001-01-01 00:00:00' ? 'N/A' : value;
							}
						},
						LatestScanTime: {
							displayName: 'Data Last Recorded',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								//return (value == '0001-01-01T00:00:00') ? '' : value;
								value = moment(value).format('YYYY-MM-DD HH:mm:ss');
								return value == '0001-01-01 00:00:00' ? 'N/A' : value;
							}
						},
						DoorCount: {
							displayName: 'Total Door Openings for Period Selected',
							headerStyle: styles.headerDark,
							width: '30'
						},
						Door_Days: {
							displayName: '# of Days Door Open for Period Selected',
							headerStyle: styles.headerDark,
							width: '30'
						},
						Door_TodayCount: {
							displayName: 'Door Count Today',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Door_7dayCount: {
							displayName: 'Door Count 7 Days',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Door_30dayCount: {
							displayName: 'Door Count 30 Days',
							headerStyle: styles.headerDark,
							width: '20'
						},
						City: {
							displayName: 'City',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Country: {
							displayName: 'Country',
							headerStyle: styles.headerDark,
							width: '20'
						},
						LocationType: {
							displayName: 'Channel',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Classification: {
							displayName: 'Customer Tier',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SubTradeChannelType: {
							displayName: 'Sub Trade Channel',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SalesTerritory: {
							displayName: 'Sales Territory',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SalesGroup: {
							displayName: 'Sales Group',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SalesOffice: {
							displayName: 'Sales Office',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SalesOrganization: {
							displayName: 'Sales Organization',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Alert_Open: {
							displayName: '# Open Alerts',
							headerStyle: styles.headerDark,
							width: '20'
						},
						TotalSkuOOS: {
							displayName: 'TotalSkuOOS',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) {
								return value == 0 ? 'N/A' : value;
							}
						},
						TotalEmptyFacings: {
							displayName: 'Empty Facings',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) {
								return value == 0 ? 'N/A' : value;
							}
						},
						TotalImpureCoolers: {
							displayName: 'Impure Coolers',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) {

								return row["isPurityRecord"] != false ? value : 'N/A';
							}
						},
						PurityIssue: {
							displayName: 'Purity Status',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) {
								return value == null || value == 0 ? "N/A" : value == 255 ? "Pure" : "Impure";
							}
						},
						Temperature: {
							displayName: 'Temperature',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) {
								return value == 127 ? 'N/A' : value;
							}
						},
						LightIntensity: {
							displayName: 'Light',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) {
								return value == 127 || value < 0 ? 'N/A' : value;
							}
						},
						Displacement: {
							displayName: 'GPS',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) {
								if (typeof value !== 'number') {
									return value;
								}

								return row.LatestGpsId == 0 ? 'N/A' :
									(value.toFixed(2) > 0.499 || value.toFixed(2) < -0.5) ? (value.toFixed(2) >
										2 ? value.toFixed(0) + "km" : value.toFixed(2) + "km") :
									"Ok";
							}
						}
					};
				} else if (params.exportData == "Outlets") {
					name = "Outlets";
					specification = {
						LocationCode: {
							displayName: 'Outlet Code',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Name: {
							displayName: 'Outlet',
							headerStyle: styles.headerDark,
							width: '30'
						},
						DoorCount: {
							displayName: 'Total Door Openings for Period Selected',
							headerStyle: styles.headerDark,
							width: '30'
						},
						Door_Days: {
							displayName: '# of Days Door Open for Period Selected',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Alert_Open: {
							displayName: 'Alert',
							headerStyle: styles.headerDark,
							width: '30'
						},
						//Code: { displayName: 'Code' , headerStyle: styles.headerDark,	width: '10'},
						// PrimarySalesRep: {
						// 	displayName: 'Sales Rep',
						// 	headerStyle: styles.headerDark,
						// 	width: '20'
						// },
						City: {
							displayName: 'City',
							headerStyle: styles.headerDark,
							width: '20'
						},
						State: {
							displayName: 'State',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Country: {
							displayName: 'Country',
							headerStyle: styles.headerDark,
							width: '20'
						},
						MarketName: {
							displayName: 'Market',
							headerStyle: styles.headerDark,
							width: '20'
						},
						LocationType: {
							displayName: 'Channel',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Classification: {
							displayName: 'Customer Tier',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SubTradeChannelType: {
							displayName: 'Sub Trade Channel',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SalesTerritory: {
							displayName: 'Sales Territory',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SalesGroup: {
							displayName: 'Sales Group',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SalesOffice: {
							displayName: 'Sales Office',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SalesOrganization: {
							displayName: 'Sales Organization',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Door_30dayCount: {
							displayName: 'Door Count 30 Days',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Door_TodayCount: {
							displayName: 'Door Count Today',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Door_7dayCount: {
							displayName: 'Door Count 7 Days',
							headerStyle: styles.headerDark,
							width: '20'
						},
						AssetCount: {
							displayName: 'Asset Total',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Alert_Open: {
							displayName: 'Alert Count',
							headerStyle: styles.headerDark,
							width: '20'
						},
						TotalImpureCoolers: {
							displayName: 'Impure Coolers',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) {
								return row["isPurityRecord"] != false ? value : 'N/A';
							}
						},
						TotalSkuOOS: {
							displayName: 'OSA SKU',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) {
								return row["isPurityRecord"] ? value : 'N/A';
							}
						},
						TotalEmptyFacings: {
							displayName: 'Empty Facings',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) {
								return row["isPurityRecord"] ? value : 'N/A';
							}
						}
					};
				} else if (params.exportData == "Alerts") {
					name = "Alerts";
					specification = {
						AlertType: {
							displayName: 'Alert Type',
							headerStyle: styles.headerDark,
							width: '20'
						},
						AssetSerialNumber: {
							displayName: 'Asset Serial Number',
							headerStyle: styles.headerDark,
							width: '30'
						},
						AlertText: {
							displayName: 'Alert Text',
							headerStyle: styles.headerDark,
							width: '30'
						},
						AcknowledgeComment: {
							displayName: 'Notes',
							headerStyle: styles.headerDark,
							width: '30',
							cellFormat: function (value, row) {
								return value == 0 ? '' : value;
							}
						},
						Tags: {
							displayName: 'Tags',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Status: {
							displayName: 'Status',
							headerStyle: styles.headerDark,
							width: '30'
						},

						AlertAt: {
							displayName: 'Alert At',
							headerStyle: styles.headerDark,
							width: '20'
						},
						ClosedOn: {
							displayName: 'Closed On',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								//return (value == '0001-01-01T00:00:00') ? '' : value;
								value = moment(value).format('YYYY-MM-DD HH:mm:ss');
								return value == '0001-01-01 00:00:00' ? '' : value;
							}
						},
						AlertAge: {
							displayName: 'Alert Age',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (_this, value, row) {
								return _this.dateDiff(row.ClosedOn === '0001-01-01T00:00:00' ? new Date() : _this.parseDate(row.ClosedOn), _this.parseDate(row.AlertAt));
							}.bind(null, _this)
						},
						LocationCode: {
							displayName: 'Outlet Code',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Location: {
							displayName: 'Location',
							headerStyle: styles.headerDark,
							width: '30'
						},
						Street: {
							displayName: 'Street',
							headerStyle: styles.headerDark,
							width: '30'
						},
						City: {
							displayName: 'City',
							headerStyle: styles.headerDark,
							width: '30'
						},
						State: {
							displayName: 'State',
							headerStyle: styles.headerDark,
							width: '30'
						},
						Country: {
							displayName: 'Country',
							headerStyle: styles.headerDark,
							width: '30'
						},
						Market: {
							displayName: 'Market',
							headerStyle: styles.headerDark,
							width: '30'
						},
						Channel: {
							displayName: 'Channel',
							headerStyle: styles.headerDark,
							width: '30'
						},
						Classification: {
							displayName: 'Classification',
							headerStyle: styles.headerDark,
							width: '30'
						},
						PrimarySalesRep: {
							displayName: 'Primary Sales Rep',
							headerStyle: styles.headerDark,
							width: '30'
						}
					};
				} else if (params.exportData == "Vision") {
					name = "Vision";
					specification = {
						LocationCode: {
							displayName: 'Location Code',
							headerStyle: styles.headerDark,
							width: '20'
						},
						Name: {
							displayName: 'Name',
							headerStyle: styles.headerDark,
							width: '30'
						},
						RelogramFacingSKU: {
							displayName: 'Relogram Facing SKU',
							headerStyle: styles.headerDark,
							width: '30',
							cellFormat: function (value, row) {
								if (row.TotalFacings != 0) {
									return row.RelogramFacingSKU + "/" + row.TotalFacings;
								} else {
									return 'N/A';
								}
							}
						},
						TotalSkuOOS: {
							displayName: 'Total Sku OOS',
							headerStyle: styles.headerDark,
							width: '30',
							cellFormat: function (data, row) {
								return data || row["isPurityAvailable"] ? data : 'N/A';
							}
						},
						TotalSSDProductsSKU: {
							displayName: 'Total SSD Products SKU',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (data, row) {
								return data || row["isPurityAvailable"] ? data : 'N/A';
							}
						},
						TotalNCBProductsSKU: {
							displayName: 'Total NCB Products SKU',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (data, row) {
								return data || row["isPurityAvailable"] ? data : 'N/A';
							}
						},
						TotalSSDProducts: {
							displayName: 'Total SSD Products',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (data, row) {
								return data || row["isPurityAvailable"] ? data : 'N/A';
							}
						},
						TotalNCBProducts: {
							displayName: 'Total NCB Products',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (data, row) {
								return data || row["isPurityAvailable"] ? data : 'N/A';
							}
						},
						TotalCocaColaFacings: {
							displayName: 'Total CocaCola Facings',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (data, row) {
								var records = row["Coca-cola-Facings"];
								var cocaColaFacingsPercentage = Math.round((row.TotalCocaColaFacings * 100) / (row.TotalFacings));
								if (row.TotalFacings != 0) {
									return row.TotalCocaColaFacings + "/" + cocaColaFacingsPercentage + "%";
								} else {
									return 'N/A';
								}
							}
						},
						TotalForiegnProduct: {
							displayName: 'Total Foriegn Product',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (data, row) {
								var foriegnFacingsPercentage = Math.round((row.TotalForiegnProduct * 100) / (row.TotalFacings));
								if (row.TotalFacings != 0) {
									return row.TotalForiegnProduct + "/" + foriegnFacingsPercentage + "%";
								} else {
									return 'N/A';
								}
							}
						},
						EmptyFacings: {
							displayName: 'Empty Facings',
							headerStyle: styles.headerDark,
							width: '30',
							cellFormat: function (data, row) {
								if (row.TotalFacings != 0) {
									var emptyFacingsPercentage = Math.round((row.EmptyFacings * 100) / (row.TotalFacings));
									return row.EmptyFacings + "/" + emptyFacingsPercentage + "%";
								} else {
									return 'N/A';
								}
							}
						},
						NonCompliantFacingCount: {
							displayName: 'Non Compliant Facing Count',
							headerStyle: styles.headerDark,
							width: '30',
							cellFormat: function (data, row) {
								var complaintFacingPercentage = Math.round((row.NonCompliantFacingCount * 100) / (row.TotalFacings));
								if (row.TotalFacings != 0) {

									return row.NonCompliantFacingCount + "/" + complaintFacingPercentage + "%";
								} else {
									return 'N/A';
								}
							}
						},
						PurityPercentage: {
							displayName: 'Purity Percentage',
							headerStyle: styles.headerDark,
							width: '30'
						}

					};
				} else if (params.exportData == "Recognition Report") {
					name = "RecognitionReport";
					specification = {
						Id: {
							displayName: 'Id',
							headerStyle: styles.headerDark,
							width: '20'
						},
						OutletCode: {
							displayName: 'Outlet Code',
							headerStyle: styles.headerDark,
							width: '30'
						},
						Outlet: {
							displayName: 'Outlet',
							headerStyle: styles.headerDark,
							width: '30'
						},
						SerialNumber: {
							displayName: 'Serial Number',
							headerStyle: styles.headerDark,
							width: '30'
						},
						AssetType: {
							displayName: 'Asset Type',
							headerStyle: styles.headerDark,
							width: '30'
						},
						PurityDateTime: {
							displayName: 'Purity Date Time',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								//return (value == '0001-01-01T00:00:00') ? '' : value;
								value = moment(value).format('YYYY-MM-DD HH:mm:ss');
								return value == '0001-01-01 00:00:00' ? '' : value;
							}
						},
						VerifiedOn: {
							displayName: 'Verified On',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								//return (value == '0001-01-01T00:00:00') ? '' : value;
								value = moment(value).format('YYYY-MM-DD HH:mm:ss');
								return value == '0001-01-01 00:00:00' ? '' : value;
							}
						},
						CreatedOn: {
							displayName: 'Created On',
							headerStyle: styles.headerDark,
							width: '20',
							cellFormat: function (value, row) { // <- Renderer function, you can access also any row.property 
								//return (value == '0001-01-01T00:00:00') ? '' : value;
								value = moment(value).format('YYYY-MM-DD HH:mm:ss');
								return value == '0001-01-01 00:00:00' ? '' : value;
							}
						},
						TotalFacing: {
							displayName: 'Total Facing',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SKU: {
							displayName: 'SKU',
							headerStyle: styles.headerDark,
							width: '20'
						},
						SKUPerVsTotal: {
							displayName: 'SKU Per Vs Total',
							headerStyle: styles.headerDark,
							width: '20'
						},
						ForeignVsTotal: {
							displayName: 'Foreign Vs Total',
							headerStyle: styles.headerDark,
							width: '20'
						},
						ForeignPerVsTotal: {
							displayName: 'Foreign Per Vs Total',
							headerStyle: styles.headerDark,
							width: '20'
						},
						EmptyVsTotal: {
							displayName: 'Empty Vs Total',
							headerStyle: styles.headerDark,
							width: '30'
						},
						EmptyPerVsTotal: {
							displayName: 'Empty Per Vs Total',
							headerStyle: styles.headerDark,
							width: '30'
						},
						UnknownCount: {
							displayName: 'Unknown Count',
							headerStyle: styles.headerDark,
							width: '30'
						},
						UnknownPercentage: {
							displayName: 'Unknown Percentage',
							headerStyle: styles.headerDark,
							width: '30'
						},
						SSDSOCVICount: {
							displayName: 'SSD SOCVI Count',
							headerStyle: styles.headerDark,
							width: '30'
						},
						SSDSOCVIPer: {
							displayName: 'SSDSOCVIPer',
							headerStyle: styles.headerDark,
							width: '30'
						},
						NCBSOCVICount: {
							displayName: 'NCB SOCVI Count',
							headerStyle: styles.headerDark,
							width: '30'
						},
						NCBSOCVIPer: {
							displayName: 'NCBSOCVIPer',
							headerStyle: styles.headerDark,
							width: '30'
						},
						TotalSKU: {
							displayName: 'Total SKU',
							headerStyle: styles.headerDark,
							width: '30'
						},
						BottlerSKU: {
							displayName: 'Bottler SKU',
							headerStyle: styles.headerDark,
							width: '30'
						},
						SSDCount: {
							displayName: 'SSD Count',
							headerStyle: styles.headerDark,
							width: '30'
						},
						NCBCount: {
							displayName: 'NCB Count',
							headerStyle: styles.headerDark,
							width: '30'
						},
						CompetitorSKU: {
							displayName: 'Competitor SKU',
							headerStyle: styles.headerDark,
							width: '30'
						},
						CompetitorSSDSKU: {
							displayName: 'Competitor SSD SKU',
							headerStyle: styles.headerDark,
							width: '30'
						},
						CompetitorNCBSKU: {
							displayName: 'Competitor NCB SKU',
							headerStyle: styles.headerDark,
							width: '30'
						},
						REDPurity: {
							displayName: 'RED Purity',
							headerStyle: styles.headerDark,
							width: '30'
						},
						PlanogramCompliance: {
							displayName: 'Planogram Compliance',
							headerStyle: styles.headerDark,
							width: '30'
						},
						OOSSkuCount: {
							displayName: 'OOS Sku Count',
							headerStyle: styles.headerDark,
							width: '30'
						}
					};
				}

				var dataset = data;

				var filename = name + '_' + exportDate

				if (exportType == 'csv') {

					var headingCsv = [],
						header = []; // set custom heading to csv header

					Object.keys(specification).forEach(function (key) {

						headingCsv.push(specification[key].displayName);
						var CurrentKey = key;
						if (key == 'AssetAssociatedOn' || key == 'LastPing' || key == 'LatestScanTime') {
							header.push({
								label: specification[key].displayName,
								key: key, // (optional, column will be labeled 'path.to.something' if not defined)
								value: function (row, field, data) {
									var value = moment(row[CurrentKey]).format('YYYY-MM-DD HH:mm:ss');
									return value == '0001-01-01 00:00:00' ? '' : value.toString();
								}.bind(this), // data.path.to.something
								default: '' // default if value is not found (optional, overrides `defaultValue` for column)
							});
						} else {
							header.push(key);
						}

					});

					var result = json2csv({
						data: data,
						fields: header, //Object.keys(specification),
						fieldNames: headingCsv
					});
					return reply(result)
						.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
						.header('Content-Type', 'application/octet-stream')
						.header('Content-Disposition', 'attachment; filename="' + filename + '.csv"');
					//.header('Content-Length', result.length);
					//.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
					//.header('Content-Disposition', 'attachment; filename="' + filename + '.xlsx"')
					//.header('Content-Length', report.length);

				} else {

					var report = excel.buildExport(
						[ // <- Notice that this is an array. Pass multiple sheets to create multi sheet report 
							{
								name: name, // <- Specify sheet name (optional) 
								heading: heading, // <- Raw heading array (optional) 
								specification: specification, // <- Report specification 
								data: dataset // <-- Report data 
							}
						]
					);

					return reply(report)
						.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
						.header('Content-Disposition', 'attachment; filename="' + filename + '.xlsx"')
						.header('Content-Length', report.length);
				}
			}.bind(null, this),
			function (err) {
				console.trace(err.message);
				return reply(Boom.badRequest(err.message));
			});

	},
	getExportData: function (request, params) {
		var dataController;
		if (params.exportData == "Outlets") {
			dataController = new outletController();
		} else if (params.exportData == "Assets") {
			dataController = new assetController();
		} else if (params.exportData == "Alerts") {
			dataController = new alertController();
		} else if (params.exportData == "Vision") {
			dataController = new visionController();
		} else if (params.exportData == "Recognition Report") {
			dataController = new recognitionController();
		} else if (params.exportData == "AFSRAsset") {
			dataController = new asseteventController();
		} else if (params.exportData == "AFSROutlet") {
			dataController = new locationeventController();
		}


		//var data = asset.list(request, reply);recognitionController
		//asset.list(request, reply);

		return new Promise(function (resolve, reject) {
			dataController.list(request, function (data) {
				resolve(data);
			});
		});

	},
	getAssetsData: function (request, params) {
		var dataController;
		delete request.query.LocationId
		request.query.AssetId = params.AssetId;
		request.query.isCTF = false;
		// if (params.isFromOutlet == true) {
		// 	dataController = new outletController();
		// } else {
		dataController = new assetController();
		//}
		//var data = asset.list(request, reply);
		//asset.list(request, reply);

		return new Promise(function (resolve, reject) {
			dataController.list(request, function (data) {
				resolve(data);
			});
		});
	},
	parseDate: function (value) {
		if (!value) {
			return;
		}
		return moment(value.replace("T", " "));
	},
	dateDiff: function (date1, date2) {
		var ms;
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
	getFacingDetail: function (request, reply) {
		var params = Object.assign({}, request.query, request.payload);

		var planogramIds = params["planogramId"],
			assetPurityId = params["assetPurityId"],
			Shelves = params["Shelves"],
			Columns = params["Columns"],
			// healthOverviewQuery = JSON.parse(outletHealthOverview),
			// doorOverviewQuery = JSON.parse(outletDoorOverview),
			productQuery = JSON.parse(productInfo),
			planogramQuery = JSON.parse(planogram),
			assetPurityOverviewQuery = {
				"from": 0,
				"query": {
					"bool": {
						"filter": [{
								"type": {
									"value": "AssetPurity"
								}
							},
							{
								"term": {
									"IsDeleted": false
								}
							}
						]
					}
				},
				"_source": {
					"includes": [
						"PurityStatus",
						"AssetPurityId",
						"PlanogramId",
						"PurityDateTime",
						"ImageCount",
						"StoredFilename",
						"PurityPercentage",
						"StockPercentage",
						"PlanogramCompliance"
					]
				}
			};

		var clientId = request.auth.credentials.user.ScopeId;

		var clientFilter = {
			"term": {
				"ClientId": clientId
			}
		};
		if (clientId != 0) {
			productQuery.query.bool.filter.push(clientFilter);
			planogramQuery.query.bool.filter.push(clientFilter);
		}
		planogramQuery.query.bool.filter.push({
			"term": {
				"PlanogramId": planogramIds
			}
		});

		planogramQuery._source.includes.push("Shelves");
		planogramQuery._source.includes.push("Facings");

		assetPurityOverviewQuery.query.bool.filter.push({
			"term": {
				"AssetPurityId": assetPurityId
			}
		})

		productQuery._source.includes.push("BeverageTypeId");
		productQuery._source.includes.push("DisplayColor");
		productQuery._source.includes.push("IsEmpty");
		productQuery._source.includes.push("IsForeign");
		productQuery._source.includes.push("Height");
		productQuery._source.includes.push("Width");
		var queries = [

			{
				key: "assetPurityOverview",
				search: {
					index: 'cooler-iot-assetpurity',
					body: assetPurityOverviewQuery,
					ignore_unavailable: true
				}
			},

			{
				key: "product",
				search: {
					index: 'cooler-iot-product',
					body: productQuery,
					ignore_unavailable: true
				}
			}, {
				key: "planogram",
				search: {
					index: 'cooler-iot-planogram',
					body: planogramQuery,
					ignore_unavailable: true
				}
			}
		];

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
			var nonEmptyProducts = [];
			var params = Object.assign({}, request.query, request.payload);

			var latestImages = [];
			var missingProductOutletLevel = [];
			var overviewObj, finalData = [],
				assetId, outletUniProductIds = [],
				parsePlanogramDetails, productIds = [],
				products, productId;
			var planogramProductList = [];
			overviewObj = {
				planogram: {},
				realogram: {}
			};
			overviewObj.planogram.Shelves = [];
			//assetId = assetCount == 1 ? assets : assets[i];

			//Get all Products 
			data.product.hits.hits.forEach(function (validProduct) {
				nonEmptyProducts.push(validProduct._source);
			});

			//Get Planogram Details
			//if (data.planogram.hits.hits && data.planogram.hits.hits.length > 0) {
			var planogramInfo = data.planogram.hits.hits;
			if (planogramInfo && planogramInfo.length > 0) {
				parsePlanogramDetails = JSON.parse(planogramInfo[0]._source.FacingDetails);
				for (var k = 0, kLen = parsePlanogramDetails.length; k < kLen; k++) {
					products = parsePlanogramDetails[k].products;
					var product = [];
					for (var j = 0, jLen = params.Columns; j < jLen; j++) {
						if (products[j]) {
							productId = products[j].id;
						} else {
							productId = "";
						}

						var productInfo = nonEmptyProducts.filter(function (data) {
							return data.ProductId == productId
						})
						if (productInfo.length > 0) {
							product.push(productInfo[0]);
							if (planogramProductList.filter(data => data.ProductId == 2310).length == 0) {
								planogramProductList.push(productInfo[0]);
							}
						} else {
							product.push({
								ProductId: productId
							});
						}
					}
					//if (overviewObj.planogram.Shelves.Products) {
					overviewObj.planogram.Shelves.push({
						Products: product,
						ColumnCount: product.length
					});
					//}
				}

			} else {

				for (var k = 0, kLen = params.Shelves; k < kLen; k++) {
					var product = [];
					for (var j = 0, jLen = params.Columns; j < jLen; j++) {
						productId = "";

						var productInfo = nonEmptyProducts.filter(function (data) {
							return data.ProductId == productId
						})
						if (productInfo.length > 0) {
							product.push(productInfo[0]);
						} else {
							product.push({
								ProductId: productId
							});
						}
					}
					overviewObj.planogram.Shelves.push({
						Products: product,
						ColumnCount: product.length
					});
				}
			}


			//}


			overviewObj.realogram.Shelves = [];
			var purityProductArray = data.assetPurityOverview.hits.hits.length > 0 ? data.assetPurityOverview.hits.hits[0]._source.PurityStatus.split(',') : [];
			var product = [];
			var count = 0;
			//	purityProductArray.forEach(function (purityProduct) {
			//product.push(productInfo[0]);
			for (var i = 0; i < Number(params.Shelves); i++) {
				var product = [];
				var Columns;
				var planogramProducts;
				if (overviewObj.planogram.Shelves[i]) {
					planogramProducts = overviewObj.planogram.Shelves[i].Products;

					if (overviewObj.planogram.Shelves[i]) {
						Columns = overviewObj.planogram.Shelves[i].ColumnCount
					} else {
						Columns = (Number(params.Columns));
					}

					for (var j = 0; j < Columns; j++) {
						// if (!overviewObj.realogram.Shelves[i]) {
						// 	overviewObj.realogram.Shelves[i] = [];
						// }
						var productInfo = nonEmptyProducts.filter(function (data) {
							return data.ProductId == purityProductArray[count];
						});
						if (productInfo.length > 0) {
							//overviewObj.realogram.Shelves[i][j] = productInfo[0];
							if (productInfo[0].ProductId != planogramProducts[j].ProductId) {
								productInfo[0].Color = planogramProducts[j].DisplayColor;
							}
							product.push(productInfo[0]);
						} else {
							//overviewObj.realogram.Shelves[i][j] = {};
							product.push({
								ProductId: purityProductArray[count],
								Color: planogramProducts[j] ? planogramProducts[j].DisplayColor : ''
							});
						}
						count++;
					}
					//overviewObj.realogram.Shelves.Products.push(product);
					//overviewObj.realogram.Shelves.Products.push(product);
					//overviewObj.realogram.Shelves.ColumnCount.push(product.length);
					overviewObj.realogram.Shelves.push({
						Products: product,
						ColumnCount: product.length
					});
				}
			}

			if (data.assetPurityOverview.hits.hits.length > 0) {
				overviewObj.ImageData = {
					ImageCount: data.assetPurityOverview.hits.hits[0]._source.ImageCount,
					PurityDateTime: data.assetPurityOverview.hits.hits[0]._source.PurityDateTime,
					StoredFilename: data.assetPurityOverview.hits.hits[0]._source.StoredFilename,
					PurityPercentage: data.assetPurityOverview.hits.hits[0]._source.PurityPercentage,
					StockPercentage: data.assetPurityOverview.hits.hits[0]._source.StockPercentage,
					PlanogramCompliance: data.assetPurityOverview.hits.hits[0]._source.PlanogramCompliance
				}
			}

			if (planogramProductList.length > 0) {
				overviewObj.planogramProductList = planogramProductList;
			}

			return reply({
				success: true,
				data: overviewObj
			});

		}, function (err) {
			console.trace(err.message);
			return reply(Boom.badRequest(err.message));
		});
	},
	getAppliedReducerInfo: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload);



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

		util.applyReducers(request, params, totalHours, reducers, function (assetIds, locationIds) {
			var location, asset;
			if (Array.isArray(assetIds)) {
				asset = assetIds;
			} else {
				asset = [];
			}


			if (Array.isArray(locationIds)) {
				location = locationIds;
			} else {
				location = [];
			}
			var finalData = {
				'AssetIds': asset,
				'LocationIds': location
			};
			return reply({
				success: true,
				data: finalData
			});

		});
	},
	saveLayout: function (request, reply) {
		var params = Object.assign({}, request.query, request.payload);

		client.indices.create({
			index: 'cooler-iot-layoutpreferences'
		}, {
			ignore: 400
		});

		//var client = require('./connection.js');

		client.index({
			index: 'cooler-iot-layoutpreferences',
			id: request.auth.credentials.user.UserId + "" + params.Page,
			type: 'layoutpreferences',
			body: {
				"UserId": request.auth.credentials.user.UserId,
				"Page": params.Page,
				"Name": params.Name,
				"Desc": params.Desc,
				"Value": params.StoreValue
			}
		}, function (err, resp, status) {
			if (status == 200) {
				return reply({
					success: true,
					data: true
				});
			} else {
				return reply({
					success: false,
					data: false
				});
			}
			console.log(resp);
		});
	},
	saveUserDetails: function (request, reply) {
		var clientIP = ip.address();
		var params = Object.assign({}, request.query, request.payload);
		var userName = params.UserName ? params.UserName : '';
		var actionType = params.ActionType ? params.ActionType : '';
		var loginType = 'Dashboard';
		var loginAttempt = new Date().toISOString().slice(0, 23).replace('T', ' ');

		var insertQuery = "Insert into LoginActivity (UserName,ActionType,Action,LoginAttempt,LoginType,IpAddress,UserId) values ('" + userName + "','" + actionType + "','" + params.IsLoggedIn + "','" + loginAttempt + "','" + loginType + "','" + clientIP + "','" + params.UserId + "')"

		sequelize.query(insertQuery).then(function (results) {
			console.log('User details saved successfully.');
		}).catch(function (err) {
			console.log("Error in user details: ", err);
		});
	},
	saveIRUserDetails: function (request, reply) {
		var params = Object.assign({}, request.query, request.payload);
		var clientId = params.ClientId;
		var countryId = params.CountryId ? params.CountryId : '0';
		var signupEmail = params.signupEmail ? params.signupEmail : '';
		var outletCode = params.outletCode ? params.outletCode : '';
		var domainName = params.domainName ? params.domainName : '';
		var signupType = params.signupType ? params.signupType : '';

		var bind = {};
		var bindQuery = {};
		var bindExistingQuery = {};
		var bindUpdateExistingQuery = {};
		var bindUpdateNewCustomerQuery = {};

		if (signupType == 'existing') {
			var selectExistingUserSP = "EXEC dbo.usp_DashboardExistingCustomerSignUp @ActionMode = $actionMode, @EmailId = $signupEmail";
			var updateExistingUserSP = "EXEC dbo.usp_DashboardExistingCustomerSignUpUpdate @RetailerId = $retailerId,  @LocationCode = $outletCode";

			bindExistingQuery.actionMode = 'Email';
			bindExistingQuery.signupEmail = signupEmail;
			bindExistingQuery.outletCode = outletCode;

			bindUpdateExistingQuery.outletCode = outletCode;

			sequelize.query(selectExistingUserSP, {
				bind: bindExistingQuery
			}).then(function (results) {
				if (results && results[0] && results[0].length > 0) {
					bindUpdateExistingQuery.retailerId = results[0][0].ConsumerId
					sequelize.query(updateExistingUserSP, {
						bind: bindUpdateExistingQuery
					}).then(function (results) {
						if (results && results[0]) {
							console.log('Updated existing user.');
							return reply('existinguserupdated');
						} else {
							return reply('error');
						}
					}).catch(function (err) {
						console.log("Error in Update Existing details: ", err);
						return reply('error');
					});
				} else {
					return reply('existinguser');
				}
			}).catch(function (err) {
				console.log("Error in Update IR Signup details: ", err);
				return reply('error');
			});
		} else {
			var insertQuerySP = "EXEC dbo.usp_DashboardIRSignup $signupEmail, $countryId, $clientId, $outletCode, $domainUrl";
			var selectUserQuery = "EXEC dbo.usp_DashboardConsumerDetailGet $signupEmail";
			var updateNewCustomerQuery = "EXEC dbo.usp_DashboardExistingCustomerSignUpUpdate @RetailerId = $retailerId,  @LocationCode = $outletCode";

			bind.signupEmail = signupEmail;
			bindQuery.signupEmail = signupEmail;
			bindQuery.countryId = countryId;
			bindQuery.clientId = clientId;
			bindQuery.outletCode = outletCode;
			bindQuery.domainUrl = domainName;

			bindUpdateNewCustomerQuery.outletCode = outletCode;

			sequelize.query(selectUserQuery, {
				bind: bind
			}).then(function (results) {
				if (results && results[0] && results[0].length > 0) {
					bindUpdateNewCustomerQuery.retailerId = results[0][0].ConsumerId
					sequelize.query(updateNewCustomerQuery, {
						bind: bindUpdateNewCustomerQuery
					}).then(function (results) {
						if (results && results[0]) {
							return reply(results[0]);
						} else {
							return reply('error');
						}
					}).catch(function (err) {
						console.log("Error in Update New Customer details: ", err);
						return reply('error');
					});
				} else {
					sequelize.query(insertQuerySP, {
						bind: bindQuery
					}).then(function (results) {
						if (results && results[0]) {
							console.log('IR Signup details saved successfully.');
							return reply(results[0]);
						} else {
							return reply('error');
						}
					}).catch(function (err) {
						console.log("Error in IR Signup details: ", err);
						return reply('error');
					});
				}
			}).catch(function (err) {
				return reply('error');
			});
		}

	},
	getIRsignupStatus: function (request, reply) {
		var params = Object.assign({}, request.query, request.payload);
		var outletCode = params.outletCode ? params.outletCode : '';
		var bind = {};
		var selectQuerySP = '';
		selectQuerySP = "EXEC dbo.usp_DashboardExistingCustomerSignUp @ActionMode = $actionMode, @LocationCode = $outletCode";
		bind.outletCode = outletCode;
		bind.actionMode = 'Outlet';

		sequelize.query(selectQuerySP, {
			bind: bind
		}).then(function (results) {
			console.log('Get IR Signup details successfully.');
			if (results && results[0]) {
				return reply({
					success: true,
					data: results[0]
				});
			} else {
				return reply(false);
			}
		}).catch(function (err) {
			console.log("Error in IR Signup getting IR details: ", err);
			return reply(false);
		});
	},
	getIRStatusDetails: function (request, reply) {
		var params = Object.assign({}, request.query, request.payload);
		//Pagination Code
		if (params.start) {
			var startPageIndex = parseInt(params.start);
			var endPageIndex = parseInt(params.length);
		}
		var credentials = request.auth.credentials;
		var tags = credentials.tags,
			limitLocation = Number(tags.LimitLocation);
		//Sorting Code
		if (params) {
			var sorting = 2;
			var sorting_sequence = 'ASC'
			for (var key in params) {
				if (params.hasOwnProperty(key)) {
					if (key == 'order[0][dir]') {
						sorting_sequence = params[key];
					}
					if (key == 'order[0][column]') {
						sorting = params[key];
					}
				}
			}
			var sorting_paramater = 'Code'
			for (var key in params) {
				if (params.hasOwnProperty(key)) {
					if (key == 'columns[' + sorting + '][data]') {
						sorting_paramater = params[key];
					}
				}
			}
		}

		//Searching Functionality For LocationCode
		var searchCode = 'Not'
		if (params.search_Code) {
			searchCode = params.search_Code.trim();
		}

		//Searching Functionality For Location Name
		var searchName = 'Not'
		if (params.search_Name) {
			searchName = params.search_Name.trim();
		}

		//Searching Functionality For PrimaryEmail
		var searchPrimaryEmail = 'Not'
		if (params.search_PrimaryEmail) {
			searchPrimaryEmail = params.search_PrimaryEmail.trim();
		}
		var RoleUserId = 0;
		if (credentials.user.UserId && limitLocation == 1) {
			RoleUserId = credentials.user.UserId;
		}

		var bind = {};
		var selectQuerySP = '';
		selectQuerySP = "EXEC dbo.usp_DashboardLocationIRStatusGet $clientId, $countryId, @PageStart = $startPageIndex, @PageEnd = $endPageIndex, @SortingParameter = $sorting_paramater,@SortingSequence = $sorting_sequence,@SearchLocationCode = $searchCode,@SearchLocationName = $searchName,@SearchPrimaryEmail = $searchPrimaryEmail,@RoleUserId = $RoleUserId";
		var countryId = request.auth.credentials.tags.CountryId ? request.auth.credentials.tags.CountryId : '0'
		countryId = Number(countryId);
		bind.clientId = request.auth.credentials.tags.ClientId;
		bind.startPageIndex = startPageIndex;
		bind.endPageIndex = endPageIndex;
		bind.sorting_paramater = sorting_paramater;
		bind.sorting_sequence = sorting_sequence;
		bind.searchCode = searchCode;
		bind.searchName = searchName;
		bind.searchPrimaryEmail = searchPrimaryEmail;
		bind.RoleUserId = RoleUserId;

		var responsibleCountryIds = request.auth.credentials.tags.ResponsibleCountryIds;
		var countryIds = [];
		countryIds.push(countryId);
		if (responsibleCountryIds != "") {
			responsibleCountryIds = responsibleCountryIds.split(',');
			for (var i = 0; i < responsibleCountryIds.length; i++) {
				countryIds.push(responsibleCountryIds[i]);
			}
		}

		if (responsibleCountryIds != "") {
			countryIds = countryIds.toString();
			bind.countryId = countryIds;
		} else {
			bind.countryId = countryId;
		}

		sequelize.query(selectQuerySP, {
			bind: bind
		}).then(function (results) {
			console.log('Get IR details successfully.');
			if (results && results[0] && results[0].length > 0) {
				var totalLength = results[0].length - 1;
				var totalOutlets = results[0][totalLength].totalOutlets
				return reply({
					success: true,
					recordsTotal: totalOutlets,
					recordsFiltered: totalOutlets,
					data: results[0]
				});
			} else {
				return reply({
					success: true,
					recordsTotal: 0,
					recordsFiltered: 0,
					data: ''
				});
			}

		}).catch(function (err) {
			console.log("Error in IR getting IR details: ", err);
			return reply(false);
		});
	},
	getOutletIRStatusDetail: function (request, reply) {
		var params = Object.assign({}, request.query, request.payload);
		// var userName = params.userName ? params.userName : '';
		var outletCode = params.outletCode ? params.outletCode : '';
		// var details = request.auth.credentials.tags.ClientId;
		// var userId = request.auth.credentials.user.UserId;
		var bind = {};
		var bindSelect = {};
		if (params) {
			if (params.ClientId) {
				var countryId = params.CountryId ? params.CountryId : '0'
				countryId = Number(countryId);
				bindSelect.clientId = params.ClientId;
				// bindSelect.countryId = countryId;
				bindSelect.outletCode = outletCode;

				var responsibleCountryIds = params.ResponsibleCountryIds;
				var countryIds = [];
				countryIds.push(countryId);
				if (responsibleCountryIds != "") {
					responsibleCountryIds = responsibleCountryIds.split(',');
					for (var i = 0; i < responsibleCountryIds.length; i++) {
						countryIds.push(responsibleCountryIds[i]);
					}
				}

				if (responsibleCountryIds != "") {
					countryIds = countryIds.toString();
					bindSelect.countryId = countryIds;
					bind.countryId = countryIds;
				} else {
					bindSelect.countryId = countryId;
					bind.countryId = countryId;
				}

				var selectOutletDetailForUser = "EXEC dbo.usp_DashboardLocationDetailsForIRSignup $outletCode, $clientId, $countryId";
				var selectOutletDetailSP = "EXEC dbo.usp_DashboardLocationDetailGet $outletCode, $clientId, $countryId";
				bind.outletCode = outletCode;
				bind.clientId = params.ClientId;
				// bind.countryId = countryId;

				sequelize.query(selectOutletDetailForUser, {
					bind: bindSelect
				}).then(function (results) {
					if (results && results[0] && results[0].length == 0) {
						return reply('OutletNotFound');
					} else {
						sequelize.query(selectOutletDetailSP, {
							bind: bind
						}).then(function (results) {
							console.log('Get IR details status successfully.');
							return reply({
								success: true,
								data: results[0]
							});
						}).catch(function (err) {
							console.log("Error in IR getting IR status details: ", err);
							return reply('error');
						});
					}
				}).catch(function (err) {
					console.log("Error in found outlet details: ", err);
					return reply('error');
				});
			} else {
				return reply({
					success: true,
					data: 'Out'
				});
			}
		} else {
			return reply({
				success: true,
				data: 'Out'
			});
		}
	},
	updateOutletIRStatusDetail: function (request, reply) {
		var params = Object.assign({}, request.query, request.payload);
		// var userName = params.userName ? params.userName : '';
		var outletCode = params.outletCode ? params.outletCode : '';
		var consumerId = params.consumerId;
		var signupEmail = params.signupEmail ? params.signupEmail : '';
		var domainName = params.domainName ? params.domainName : '';
		// var details = request.auth.credentials.tags.ClientId;
		// var userId = request.auth.credentials.user.UserId;
		var bind = {};
		var bindSelect = {};
		var bindUpdateNewCustomerQuery = {};

		var countryId = params.CountryId ? params.CountryId : '0'
		countryId = Number(countryId);
		bindSelect.clientId = params.ClientId;
		// bindSelect.countryId = countryId;
		bindSelect.outletCode = outletCode;

		var responsibleCountryIds = params.ResponsibleCountryIds;
		var countryIds = [];
		countryIds.push(countryId);
		if (responsibleCountryIds != "") {
			responsibleCountryIds = responsibleCountryIds.split(',');
			for (var i = 0; i < responsibleCountryIds.length; i++) {
				countryIds.push(responsibleCountryIds[i]);
			}
		}

		if (responsibleCountryIds != "") {
			countryIds = countryIds.toString();
			bindSelect.countryId = countryIds;
			bind.countryId = countryIds;
		} else {
			bindSelect.countryId = countryId;
			bind.countryId = countryId;
		}

		var selectUserQuery = "EXEC dbo.usp_DashboardConsumerDetailGet $signupEmail";
		var updateNewCustomerQuery = "EXEC dbo.usp_DashboardExistingCustomerSignUpUpdate @RetailerId = $retailerId,  @LocationCode = $outletCode";
		var updateOutletDetails = "EXEC dbo.usp_DashboardSignupUpdate $signupEmail, $countryId, $clientId, $outletCode, $domainUrl, $consumerId";
		bind.signupEmail = signupEmail;
		bind.clientId = params.ClientId;
		bind.outletCode = outletCode;
		bind.consumerId = consumerId;
		bind.domainUrl = domainName;

		bindSelect.signupEmail = signupEmail;
		bindUpdateNewCustomerQuery.outletCode = outletCode;
		// sequelize.query(updateOutletDetails, {
		// 	bind: bind
		// }).then(function (results) {
		// 	console.log(results);
		// 	return reply({
		// 		success: true,
		// 		data: results[0]
		// 	});
		// }).catch(function (err) {
		// 	console.log("Error in IR update IR status details: ", err);
		// 	return reply('error');
		// });

		sequelize.query(selectUserQuery, {
			bind: bindSelect
		}).then(function (results) {
			if (results && results[0] && results[0].length > 0) {
				bindUpdateNewCustomerQuery.retailerId = results[0][0].ConsumerId
				sequelize.query(updateNewCustomerQuery, {
					bind: bindUpdateNewCustomerQuery
				}).then(function (results) {
					if (results && results[0]) {
						return reply(results[0]);
					} else {
						return reply('error');
					}
				}).catch(function (err) {
					console.log("Error in Update New Customer details: ", err);
					return reply('error');
				});
			} else {
				sequelize.query(updateOutletDetails, {
					bind: bind
				}).then(function (results) {
					if (results && results[0]) {
						return reply({
							success: true,
							data: results[0]
						});
					} else {
						return reply('error');
					}
				}).catch(function (err) {
					console.log("Error in update IR Signup details: ", err);
					return reply('error');
				});
			}
		}).catch(function (err) {
			return reply('error');
		});
	},
	getUserLayout: function (request, reply) {
		var layoutpreferences = {
			"query": {
				"bool": {
					"must": [{
						"term": {
							"UserId": request.auth.credentials.user.UserId
						}
					}],
					"must_not": [],
					"should": []
				}
			},
			"from": 0,
			"size": 100
		};

		var queries = [{
			key: "layoutpreferences",
			search: {
				index: 'cooler-iot-layoutpreferences',
				body: layoutpreferences,
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
			var finalData = []
			data.layoutpreferences.hits.hits.forEach(function (data) {
				finalData.push(data._source);
			});
			return reply({
				success: true,
				data: finalData
			});

		}, function (err) {
			console.trace(err.message);
			return reply(Boom.badRequest(err.message));
		});
	},
	getOutletIRInfo: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		//var clientId = request.auth.credentials.user.ScopeId;
		//var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload);
		//var tags = credentials.tags.FirstName;
		//tags = tags.toLowerCase();
		if (params) {
			if (params.ClientId) {
				var query1 = "EXEC usp_DashboardOutletDetailsForIR @DateLower = '" + params.startDate + "' ,@DateUpper = '" + params.endDate + "'  , @LocationCode = '" + params.locationCode + "'";

				var _this = this;

				var queries = [{
					"sql": query1,
					key: "OutletIRDetail"
				}]
				var promises = [];
				for (var i = 0, len = queries.length; i < len; i++) {
					var query = queries[i];
					promises.push(_this.getSqlData(queries[i]));
				}

				var getMedian = _this.getMedian;
				Promise.all(promises).then(function (values) {
					var data = {},
						finalData = {};
					for (var i = 0, len = values.length; i < len; i++) {
						var value = values[i];
						data[value.config.key] = value.response;
					}
					// var visitData = [];
					var OutletIRDetails = data.OutletIRDetail;
					var groupedOutletIRDetails = _.groupBy(OutletIRDetails, "Type");

					var outletDetailsInfo = groupedOutletIRDetails.OutletDetails ? groupedOutletIRDetails.OutletDetails : [],
						outletDetailsImageInfo = groupedOutletIRDetails.SecondGrid ? groupedOutletIRDetails.SecondGrid : [],
						outletDetailsSubImageInfo = groupedOutletIRDetails.ThirdGrid ? groupedOutletIRDetails.ThirdGrid : [];

					finalData.summary = {
						outletDetailsInfo: outletDetailsInfo,
						outletDetailsImageInfo: outletDetailsImageInfo,
						outletDetailsSubImageInfo: outletDetailsSubImageInfo
					};
					return reply({
						success: true,
						data: finalData
					});
				}, function (err) {
					console.trace(err.message);
					return reply(Boom.badRequest(err.message));
				});
			} else {
				return reply({
					success: true,
					data: 'Out'
				});
			}
		} else {
			return reply({
				success: true,
				data: 'Out'
			});
		}
	},
	getOutletGridIRInfo: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		//var clientId = request.auth.credentials.user.ScopeId;
		//var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload);
		//var tags = credentials.tags.FirstName;
		//tags = tags.toLowerCase();
		if (params) {
			if (params.ClientId) {
				var query1 = "EXEC usp_DashboardOutletDetailsForIR @DateLower = '" + params.startDate + "' ,@DateUpper = '" + params.endDate + "'  , @LocationCode = '" + params.locationCode + "'";

				var _this = this;

				var queries = [{
					"sql": query1,
					key: "OutletIRDetail"
				}]
				var promises = [];
				for (var i = 0, len = queries.length; i < len; i++) {
					var query = queries[i];
					promises.push(_this.getSqlData(queries[i]));
				}

				var getMedian = _this.getMedian;
				Promise.all(promises).then(function (values) {
					var data = {},
						finalData = {};
					for (var i = 0, len = values.length; i < len; i++) {
						var value = values[i];
						data[value.config.key] = value.response;
					}
					// var visitData = [];
					var OutletIRDetails = data.OutletIRDetail;
					var groupedOutletIRDetails = _.groupBy(OutletIRDetails, "Type");

					var outletDetailsInfo = groupedOutletIRDetails.OutletDetails ? groupedOutletIRDetails.OutletDetails : [],
						outletDetailsImageInfo = groupedOutletIRDetails.SecondGrid ? groupedOutletIRDetails.SecondGrid : [],
						outletDetailsSubImageInfo = groupedOutletIRDetails.ThirdGrid ? groupedOutletIRDetails.ThirdGrid : [],
						totalOutlets = outletDetailsSubImageInfo.length;

					finalData.summary = {
						outletDetailsInfo: outletDetailsInfo,
						outletDetailsImageInfo: outletDetailsImageInfo,
						outletDetailsSubImageInfo: outletDetailsSubImageInfo
					};
					return reply({
						success: true,
						data: outletDetailsSubImageInfo,
						recordsTotal: totalOutlets,
						recordsFiltered: totalOutlets
					});
				}, function (err) {
					console.trace(err.message);
					return reply(Boom.badRequest(err.message));
				});
			} else {
				return reply({
					success: true,
					data: 'Out'
				});
			}
		} else {
			return reply({
				success: true,
				data: 'Out'
			});
		}
	},
	getAssetIRInfo: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload);
		var tags = credentials.tags.FirstName;
		tags = tags.toLowerCase();

		var query1 = "EXEC usp_DashboardOutletAssetDetailsForIR @DateLower = '" + params.startDate + "' ,@DateUpper = '" + params.endDate + "'  , @AssetId = " + params.AssetId + " ,@RDCustomerId = " + params.rdCustomerId;
		var query2 = "EXEC usp_DashboardOutletAssetDetailsForIRLastResult @DateLower = '" + params.startDate + "' ,@DateUpper = '" + params.endDate + "'  , @AssetId = " + params.AssetId + " ,@RDCustomerId = " + params.rdCustomerId;

		var _this = this;

		var queries = [{
			"sql": query1,
			key: "AssetIRDetail"
		}, {
			"sql": query2,
			key: "AssetIRDetailLastResult"
		}]
		var promises = [];
		for (var i = 0, len = queries.length; i < len; i++) {
			var query = queries[i];
			promises.push(_this.getSqlData(queries[i]));
		}

		var getMedian = _this.getMedian;
		Promise.all(promises).then(function (values) {
			var data = {},
				finalData = {};
			for (var i = 0, len = values.length; i < len; i++) {
				var value = values[i];
				data[value.config.key] = value.response;
			}

			var AssetIRDetails = data.AssetIRDetail;
			var assetIRDetailLastResults = data.AssetIRDetailLastResult;
			var groupedAssetIRDetails = _.groupBy(AssetIRDetails, "type");
			var groupedAssetIRDetailLastResults = _.groupBy(assetIRDetailLastResults, "type");

			var assetPurityBestResult = groupedAssetIRDetails.Best ? groupedAssetIRDetails.Best : [],
				assetPurityAvailableBestResult = groupedAssetIRDetails.AvailableBest ? groupedAssetIRDetails.AvailableBest : [],
				assetPurityMissingBestResult = groupedAssetIRDetails.MissingBest ? groupedAssetIRDetails.MissingBest : [],
				assetPurityLatestResult = groupedAssetIRDetailLastResults.Latest ? groupedAssetIRDetailLastResults.Latest : [],
				assetPurityAvailableLatestResult = groupedAssetIRDetailLastResults.AvailableLatest ? groupedAssetIRDetailLastResults.AvailableLatest : [],
				assetPurityMissingLatestResult = groupedAssetIRDetailLastResults.MissingLatest ? groupedAssetIRDetailLastResults.MissingLatest : [];

			finalData.summary = {
				assetPurityBestResult: assetPurityBestResult,
				assetPurityAvailableBestResult: assetPurityAvailableBestResult,
				assetPurityMissingBestResult: assetPurityMissingBestResult,
				assetPurityLatestResult: assetPurityLatestResult,
				assetPurityAvailableLatestResult: assetPurityAvailableLatestResult,
				assetPurityMissingLatestResult: assetPurityMissingLatestResult,
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
	getAssetPurityIRInfo: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload);
		var tags = credentials.tags.FirstName;
		tags = tags.toLowerCase();

		// if (params.quarter) {
		// 	if (params.quarter.length > 1) {
		// 		params.startDate = moment().quarter(params.quarter[0]).startOf('quarter').format('YYYY-MM-DD[T00:00:00]');
		// 		params.endDate = moment().quarter(params.quarter[params.quarter.length - 1]).endOf('quarter').format('YYYY-MM-DD[T23:59:59]');
		// 	} else {
		// 		params.startDate = moment().quarter(params.quarter).startOf('quarter').format('YYYY-MM-DD[T00:00:00]');
		// 		params.endDate = moment().quarter(params.quarter).endOf('quarter').format('YYYY-MM-DD[T23:59:59]');
		// 	}
		// }
		// params.startDate = '2019-05-01';
		// params.endDate = '2019-05-15';

		var query1 = "EXEC usp_DashboardOutletAssetImageDetailsForIR  @AssetPurityId = " + params.AssetPurityId + " ,@RDCustomerId = " + params.rdCustomerId;

		var _this = this;
		// var tags = credentials.tags,
		// 	limitLocation = Number(tags.LimitLocation);
		// var limitCountry = Number(tags.LimitCountry),
		// 	countryid = Number(tags.CountryId),
		// 	responsibleCountryIds = tags.ResponsibleCountryIds;
		// var countryids = [];
		// countryids.push(countryid);
		// if (responsibleCountryIds != "") {
		// 	responsibleCountryIds = responsibleCountryIds.split(',');
		// 	for (var i = 0; i < responsibleCountryIds.length; i++) {
		// 		countryids.push(responsibleCountryIds[i]);
		// 	}
		// }
		// if (limitCountry == 1) {
		// 	var countryIdsUser;
		// 	if (responsibleCountryIds != "") {
		// 		countryids = countryids.toString()
		// 		query1 = query1 + ",@CountryId = '" + countryids + "'";
		// 	} else {
		// 		query1 = query1 + ",@CountryId = '" + countryid + "'";
		// 	}
		// }

		var queries = [{
			"sql": query1,
			key: "AssetPurityIRDetail"
		}]
		var promises = [];
		for (var i = 0, len = queries.length; i < len; i++) {
			var query = queries[i];
			promises.push(_this.getSqlData(queries[i]));
		}

		var getMedian = _this.getMedian;
		Promise.all(promises).then(function (values) {
			var data = {},
				finalData = {};
			for (var i = 0, len = values.length; i < len; i++) {
				var value = values[i];
				data[value.config.key] = value.response;
			}

			var AssetPurityIRDetails = data.AssetPurityIRDetail;
			var groupedAssetPurityIRDetails = _.groupBy(AssetPurityIRDetails, "type");

			var assetPurityAvailableProduts = groupedAssetPurityIRDetails.Available ? groupedAssetPurityIRDetails.Available : [],
				assetPurityMissingProducts = groupedAssetPurityIRDetails.Missing ? groupedAssetPurityIRDetails.Missing : [];

			finalData.summary = {
				assetPurityAvailableProduts: assetPurityAvailableProduts,
				assetPurityMissingProducts: assetPurityMissingProducts
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
	getOutletRedirectionIRInfo: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		//var clientId = request.auth.credentials.user.ScopeId;
		//var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload);
		//var tags = credentials.tags.FirstName;
		//tags = tags.toLowerCase();
		if (params) {
			if (params.ClientId) {
				var query1 = "EXEC usp_DashboardOutletAccountStatusDetailsForIR @LocationCode = '" + params.locationCode + "'";

				var _this = this;

				var queries = [{
					"sql": query1,
					key: "OutletIRAccountStatusDetail"
				}]
				var promises = [];
				for (var i = 0, len = queries.length; i < len; i++) {
					var query = queries[i];
					promises.push(_this.getSqlData(queries[i]));
				}

				var getMedian = _this.getMedian;
				Promise.all(promises).then(function (values) {
					var data = {},
						finalData = {};
					for (var i = 0, len = values.length; i < len; i++) {
						var value = values[i];
						data[value.config.key] = value.response;
					}

					var OutletIRAccountStatusDetails = data.OutletIRAccountStatusDetail;

					return reply({
						success: true,
						data: OutletIRAccountStatusDetails
					});
				}, function (err) {
					return reply({
						success: true,
						data: 'Out'
					});
				});
			} else {
				return reply({
					success: true,
					data: 'Out'
				});
			}
		} else {
			return reply({
				success: true,
				data: 'Out'
			});
		}
	},
}