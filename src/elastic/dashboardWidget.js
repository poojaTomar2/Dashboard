"use strict"
var linq = require('node-linq').LINQ,
	fs = require('fs');

var moment = require('moment');
var Boom = require('boom');

var outletChartQuery = JSON.stringify(require('./outletChartQuery.json'));
var alertSearchQuery = JSON.stringify(require('./alertChartQuery.json'));
var smartDeviceEventChart = JSON.stringify(require('./smartDeviceEventChart.json'));


var healthChartQuery = JSON.stringify(require('./healthChart.json'));
var config = require('../config');
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
var locationRepQuery = JSON.stringify(require('./locationRep.json'));
var aggregators = require('../controllers/aggregators');

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

	dashboardQueries: {
		alertSummary: JSON.stringify(require('./dashboardQueries/alertSummary.json')),
		healthSummary: JSON.stringify(require('./dashboardQueries/healthSummary.json')),
		assetSummary: JSON.stringify(require('./dashboardQueries/assetSummary.json'))
	},

	getKPIWidgetData: function (request, reply) {
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
		if (clientId != 0) {
			alertSummary.query.bool.must.push(clientQuery);
			healthSummary.query.bool.must.push(clientQuery);
			assetSummary.query.bool.must.push(clientQuery);
		}

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
				if (this.dateFilter.length > 0) {
					startDate = this.dateFilter[0].startDate;
					endDate = this.dateFilter[this.dateFilter.length - 1].endDate;
				}
				var indexNames = util.getEventsIndexName(startDate, endDate);
				var queries = [{
					key: "events",
					search: {
						index: indexNames.toString(),
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
					var doorOpen = 0;
					data.events.aggregations.DoorData.doorCount.buckets.forEach(function (bucket) {
						doorOpen += bucket.doc_count;
					});

					doorOpen = doorOpen != 0 ? doorOpen / 168 : 0;
					data.doorOpenRate = doorOpen;

					var doorOpenDuration = 0;
					data.events.aggregations.DoorData.DoorOpenDuration.buckets.forEach(function (bucket) {
						doorOpenDuration += bucket.alarmRate.value;
					});
					doorOpenDuration = doorOpenDuration != 0 ? doorOpenDuration / data.events.aggregations.DoorData.DoorOpenDuration.buckets.length : 0;
					data.doorOpenDuration = doorOpenDuration;
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

					finalData.alertsByTypeBoth = [];
					data.alert.aggregations.AlertCountBoth.ByType.buckets.forEach(function (bucket) {
						finalData.alertsByTypeBoth.push({
							alertTypeId: bucket.key,
							alertType: consts.alertTypesMappings[bucket.key],
							count: bucket.doc_count,
							OpenAlert: bucket.AlertOpen.doc_count
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
					var doorClassification = data.events.aggregations.DoorData.LocationCount.buckets;
					aggregators.outletClassification({
						data: doorClassification,
						parentProperty: 'key',
						childProperty: "_Id"
					}).then(function () {
						var ret = result;
					})
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
					finalData.peoplePassingBy = //todo need sales data/logic
						[{
							"PeoplePassingBy": 2,
							"DoorOpening": 10
						}]

					finalData.dooropeningSales = [ //todo need sales data/logic
						{
							"DoorOpening": 12,
							"Sales": 200
						}
					]
					var dbAggs = data.db.aggregations;

					finalData.summary = {
						totalCooler: dbAggs.AssetCount.doc_count, //dbAggs.Assets.doc_count,
						totalCustomer: dbAggs.CustomerCount.CustomerCountDistinct.value, //dbAggs.Assets.doc_count,
						totalOutlets: dbAggs.LocationCount.doc_count,
						filteredAssets: dbAggs.Assets.doc_count, //totalAssets,
						filteredOutlets: dbAggs.Locations.doc_count,
						openAlert: data.alert.aggregations.AlertOpenCount.doc_count,
						temperature: data.events.aggregations.HealthData.avg_temp.value,
						coolerAbove7: data.events.aggregations.HealthData.coolerAbove7.coolerAbove7.value,
						coolerBelow30Light: data.events.aggregations.HealthData.lightBelow30.lightBelow30.value,
						hourlyDoorOpen: data.doorOpenRate,
						alarmRate: data.alert.aggregations.AlarmRate.alarmRate.value,
						lightBelow10TempAbove12: dbAggs.Assets.lightBelow10TempAbove12.doc_count,
						lightBelow10: dbAggs.Assets.lightBelow10.doc_count,
						missingCooler: dbAggs.Assets.isMissing.doc_count,
						coolerMoves: dbAggs.Assets.coolerMoves.doc_count,
						isPowerOff: dbAggs.Assets.isPowerOff.doc_count,
						doorOpenDuration: data.doorOpenDuration,
						totalNoOfAlarms: data.alert.aggregations.AlarmRate.doc_count,
						totalHealthEvent: data.events.aggregations.HealthData.doc_count,
						totalActiveCooler: data.events.aggregations.PingData.AssetCount.value,
						locationAlarmRate: data.alert.aggregations.AlertOpen.LocationsCount.value,
						assetAlarmRate: data.alert.aggregations.AlertOpen.AssetCount.value,
						closedAlarm: data.alert.aggregations.alertCloseCount.doc_count,
						salesVisitDuration: 120,
						hourlyFootTraffic: 30,
						hoursLightOn: 22,
						hoursPowerOn: 22
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
	}
}