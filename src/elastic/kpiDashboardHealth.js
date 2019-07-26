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
var smartDeviceMovementReducer = require('../controllers/reducers/smartDeviceMovement');
var smartDevicDoorStatusReducer = require('../controllers/reducers/smartDevicDoorStatus');
var smartDevicHealthReducer = require('../controllers/reducers/smartDeviceHealthRecord');
var smartDevicePowerReducer = require('../controllers/reducers/smartDevicePowerRecord');
var smartDeviceReducer = require('../controllers/reducers/smartDevice');
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
		healthSummary: JSON.stringify(require('./dashboardQueries/kpiHealthSummaryHealth.json'))
	},

	getKPIWidgetData: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload),
			healthSummary = JSON.parse(this.dashboardQueries.healthSummary);
		// client Filter
		var clientQuery = {
			"term": {
				"ClientId": clientId
			}
		};
		if (clientId != 0) {
			healthSummary.query.bool.filter.push(clientQuery);
		}
		healthSummary.query.bool.filter.push({
			"bool": {
				"should": []
			}
		});
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
			var dateRangeQuery = {
				"range": {
					"EventTime": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			healthSummary = util.pushDateQuery(healthSummary, dateRangeQuery);
			//healthSummary.query.bool.filter.bool.should.push(dateRangeQuery);
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

				healthSummary.query.bool.filter.push(filterQuery);

			}

			if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
				var smartDeviceTypeQuery = {
					"terms": {
						"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
					}
				}
				healthSummary.query.bool.filter.push(smartDeviceTypeQuery);
			}

			if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
				var assetManufactureQuery = {
					"terms": {
						"AssetManufacturerId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
					}
				}
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
				healthSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
			}

			if (assetIds) {
				var assetQuery = {
					"terms": {
						"AssetId": assetIds
					}
				}
				healthSummary.query.bool.filter.push(assetQuery);
			}
			if (_this.dateFilter.length > 0) {
				startDate = _this.dateFilter[0].startDate;
				endDate = _this.dateFilter[_this.dateFilter.length - 1].endDate;
			}
			var indexNames = util.getEventsIndexName(startDate, endDate);
			//console.log(indexNames.toString());
			var queries = [{
				key: "events",
				search: {
					index: indexNames.toString(), // 'cooler-iot-events',
					body: healthSummary,
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

			var getMedian = _this.getMedian;
			Promise.all(promises).then(function (values) {
				var data = {},
					finalData = {};
				for (var i = 0, len = values.length; i < len; i++) {
					var value = values[i];
					data[value.config.key] = value.response;
					util.setLogger(value);
				}

				var eventAggs = data.events.aggregations;
				var lightOpenHour = 'N/A',
					tempBelow7Hour = 'N/A',
					hoursCorrectTemperature = 'N/A';
				if (eventAggs) {
					//lightOpenHour = ((moment.duration(eventAggs.HoursLightOn.HoursLightOn.value, 'm').asHours() / eventAggs.HoursLightOn.AssetCount.value) / moment.duration(totalHours, 'hours').asDays()).toLocaleString();
					tempBelow7Hour = ((moment.duration(eventAggs.TemperatureBelow7.TempBelow7.value, 'm').asHours() / eventAggs.TemperatureBelow7.AssetCount.value) / moment.duration(totalHours, 'hours').asDays()).toLocaleString();
					//hoursCorrectTemperature = ((moment.duration(eventAggs.HoursCorrectTemperature.HoursCorrectTemperature.value, 'm').asHours() / eventAggs.HoursCorrectTemperature.AssetCount.value) / moment.duration(totalHours, 'hours').asDays()).toLocaleString();

					var assetDays = 0;
					var assetHours = 0;
					//========================================================//
					var hoursCorrectTemperature1 = 0;
					eventAggs.HoursCorrectTemperature.Asset.buckets.forEach(function (healthData) {
						assetDays = healthData.HealthDays.buckets.length;
						assetHours = healthData.HoursCorrectTemperature.value;
						hoursCorrectTemperature1 += assetHours / assetDays;
					});
					hoursCorrectTemperature1 = hoursCorrectTemperature1 / eventAggs.HoursCorrectTemperature.AssetCount.value;
					//----------------------------------------------------------------------//
					var HoursNotCorrectTemperature = 0;
					eventAggs.HoursNotCorrectTemperature.Asset.buckets.forEach(function (healthData) {
						assetDays = healthData.HealthDays.buckets.length;
						assetHours = healthData.HoursCorrectTemperature.value;
						HoursNotCorrectTemperature += assetHours / assetDays;
					});
					HoursNotCorrectTemperature = HoursNotCorrectTemperature / eventAggs.HoursNotCorrectTemperature.AssetCount.value;
					var hoursCorrectTemperature = (hoursCorrectTemperature1 / HoursNotCorrectTemperature) * 24;
					//===================================================================//
					//===========for hours light on =====================================//
					lightOpenHour = 0;
					assetHours = 0
					var lightOpenHour1 = 0;
					eventAggs.HoursLightOn.Asset.buckets.forEach(function (healthData) {
						assetDays = healthData.HealthDays.buckets.length;
						assetHours = healthData.HoursLightOn.value;
						lightOpenHour1 += assetHours / assetDays;
					});
					lightOpenHour1 = lightOpenHour1 / eventAggs.HoursLightOn.AssetCount.value;
					//-------------------------------------------------------------------------//
					var lightOpenHour2 = 0;
					eventAggs.HoursLightOnNot.Asset.buckets.forEach(function (healthData) {
						assetDays = healthData.HealthDays.buckets.length;
						assetHours = healthData.HoursLightOn.value;
						lightOpenHour2 += assetHours / assetDays;
					});
					lightOpenHour2 = lightOpenHour2 / eventAggs.HoursLightOnNot.AssetCount.value;
					lightOpenHour = (lightOpenHour1 / lightOpenHour2) * 24;
					//===========================================================================//
				}
				if (isNaN(lightOpenHour)) {
					lightOpenHour = 'N/A'
				}
				if (isNaN(tempBelow7Hour)) {
					tempBelow7Hour = 'N/A'
				}

				finalData.summary = {
					coolerAbove7Hour: tempBelow7Hour,
					hoursLightOn: lightOpenHour,
					hoursCorrectTemperature: hoursCorrectTemperature
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


		// smartDeviceReducer(request, params, "SmartDeviceId").then(function (smartDeviceIds) {
		// 	if (smartDeviceIds) {
		// 		if (request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]) {
		// 			params["SmartDeviceId[]"] = smartDeviceIds.length != 0 ? smartDeviceIds : [-1];
		// 		}
		// 		delete params.LocationId;
		// 		if (request.query.SmartDeviceTypeId || request.query["SmartDeviceTypeId[]"]) {
		// 			delete params.SmartDeviceTypeId;
		// 			params["SmartDeviceId[]"] = smartDeviceIds.length != 0 ? smartDeviceIds : [-1];
		// 		}
		// 		if (Array.isArray(params.ConnectivityTypeId)) {
		// 			delete params.Reference;
		// 		} else if (params.ConnectivityTypeId == 2) {
		// 			delete params["LocationId[]"];
		// 			params["GatewayId[]"] = smartDeviceIds.length != 0 ? smartDeviceIds : [-1];
		// 		} else if (params.ConnectivityTypeId == 1) {
		// 			delete params["LocationId[]"];
		// 			params["SmartDeviceId[]"] = smartDeviceIds.length != 0 ? smartDeviceIds : [-1];
		// 		}
		// 	}
		// 	smartDeviceReducer(request, params, "LocationId").then(function (locationIds) {
		// 		if (locationIds && params["SmartDeviceId[]"]) {
		// 			delete params.GatewayId;
		// 			delete params.Reference;
		// 			params["LocationId[]"] = locationIds.length != 0 ? locationIds : [-1];
		// 		}
		// 		if (params.Displacement_To || params.Displacement_From || params["Displacement_To[]"] || params["Displacement_From[]"]) {
		// 			params["startDateMovement"] = params.startDate;
		// 			params["endDateMovement"] = params.endDate;
		// 			params["fromMovementScreen"] = true;
		// 			if (params.dayOfWeek || params["dayOfWeek[]"]) {
		// 				params["dayOfWeekMovement"] = params.dayOfWeek || params["dayOfWeek[]"];
		// 			}
		// 			if (params.yearWeek || params["yearWeek[]"]) {
		// 				params["yearWeekMovement"] = params.yearWeek || params["yearWeek[]"];
		// 			}
		// 			if (params.quarter || params["quarter[]"]) {
		// 				params["quarterMovement"] = params.quarter || params["quarter[]"];
		// 			}
		// 			if (params.month || params["month[]"]) {
		// 				params["monthMovement"] = params.month || params["month[]"];
		// 			}
		// 			params.daysMovement = moment.duration(totalHours, 'hours').asDays();
		// 		}
		// 		smartDeviceMovementReducer(request, params, "AssetId").then(function (assetIds) {
		// 			if (assetIds) {
		// 				params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
		// 			}
		// 			if (params.DoorCount || params["DoorCount[]"]) {
		// 				params["startDateDoor"] = params.startDate;
		// 				params["endDateDoor"] = params.endDate;
		// 				params["fromDoorScreen"] = true;
		// 				params["customQueryDoor"] = true;
		// 				if (params.dayOfWeek || params["dayOfWeek[]"]) {
		// 					params["dayOfWeekDoor"] = params.dayOfWeek || params["dayOfWeek[]"];
		// 				}
		// 				if (params.yearWeek || params["yearWeek[]"]) {
		// 					params["yearWeekDoor"] = params.yearWeek || params["yearWeek[]"];
		// 				}
		// 				if (params.quarter || params["quarter[]"]) {
		// 					params["quarterDoor"] = params.quarter || params["quarter[]"];
		// 				}
		// 				if (params.month || params["month[]"]) {
		// 					params["monthDoor"] = params.month || params["month[]"];
		// 				}

		// 			}
		// 			smartDevicDoorStatusReducer(request, params, "AssetId").then(function (assetIds) {
		// 				delete params["fromDoorScreen"];
		// 				delete params["customQueryDoor"];
		// 				delete params["daysDoor"];
		// 				if (assetIds) {
		// 					params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
		// 				}
		// 				if (params.TempBand || params["TempBand[]"]) {
		// 					params["startDateHealth"] = params.startDate;
		// 					params["endDateHealth"] = params.endDate;
		// 					params["fromHealthScreen"] = true;
		// 					params["customQueryHealth"] = true;
		// 					if (params.dayOfWeek || params["dayOfWeek[]"]) {
		// 						params["dayOfWeekHealth"] = params.dayOfWeek || params["dayOfWeek[]"];
		// 					}
		// 					if (params.yearWeek || params["yearWeek[]"]) {
		// 						params["yearWeekHealth"] = params.yearWeek || params["yearWeek[]"];
		// 					}
		// 					if (params.quarter || params["quarter[]"]) {
		// 						params["quarterHealth"] = params.quarter || params["quarter[]"];
		// 					}
		// 					if (params.month || params["month[]"]) {
		// 						params["monthHealth"] = params.month || params["month[]"];
		// 					}

		// 					if (assetIds) {
		// 						params["AssetDoor"] = assetIds;
		// 					}
		// 				}

		// 				smartDevicHealthReducer(request, params, "AssetId").then(function (assetIds) {
		// 					delete params["fromHealthScreen"];
		// 					delete params["customQueryHealth"];
		// 					delete params["TempBand"];
		// 					delete params["TempBand[]"];
		// 					delete params["startDateHealth"];
		// 					delete params["endDateHealth"];
		// 					delete params["days"];
		// 					delete params["AssetDoor"];
		// 					if (assetIds) {
		// 						params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
		// 					}
		// 					if (params.LightStatus || params["LightStatus[]"]) {
		// 						params["startDateLight"] = params.startDate;
		// 						params["endDateLight"] = params.endDate;
		// 						params.LightStatusBand = params.LightStatus || params["LightStatus[]"];
		// 						params["fromLightScreen"] = true;
		// 						params["customQueryLight"] = true;
		// 						if (params.dayOfWeek || params["dayOfWeek[]"]) {
		// 							params["dayOfWeekLight"] = params.dayOfWeek || params["dayOfWeek[]"];
		// 						}
		// 						if (params.yearWeek || params["yearWeek[]"]) {
		// 							params["yearWeekLight"] = params.yearWeek || params["yearWeek[]"];
		// 						}
		// 						if (params.quarter || params["quarter[]"]) {
		// 							params["quarterLight"] = params.quarter || params["quarter[]"];
		// 						}
		// 						if (params.month || params["month[]"]) {
		// 							params["monthLight"] = params.month || params["month[]"];
		// 						}
		// 						if (assetIds) {
		// 							params["AssetHealth"] = assetIds;
		// 						}

		// 					}
		// 					smartDevicHealthReducer(request, params, "AssetId").then(function (assetIds) {

		// 						if (assetIds) {
		// 							params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
		// 						}
		// 						if (params.PowerStatus || params["PowerStatus[]"]) {
		// 							params["startDatePower"] = params.startDate;
		// 							params["endDatePower"] = params.endDate;
		// 							params.PowerBand = params.PowerStatus || params["PowerStatus[]"];
		// 							params["fromPowerScreen"] = true;
		// 							params["customQueryPower"] = true;
		// 							if (params.dayOfWeek || params["dayOfWeek[]"]) {
		// 								params["dayOfWeekPower"] = params.dayOfWeek || params["dayOfWeek[]"];
		// 							}
		// 							if (params.yearWeek || params["yearWeek[]"]) {
		// 								params["yearWeekPower"] = params.yearWeek || params["yearWeek[]"];
		// 							}
		// 							if (params.quarter || params["quarter[]"]) {
		// 								params["quarterPower"] = params.quarter || params["quarter[]"];
		// 							}
		// 							if (params.month || params["month[]"]) {
		// 								params["monthPower"] = params.month || params["month[]"];
		// 							}
		// 							if (assetIds) {
		// 								params["AssetHealth"] = assetIds;
		// 							}
		// 						}
		// 						smartDevicePowerReducer(request, params, "AssetId").then(function (assetIds) {
		// 							if (assetIds) {
		// 								params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
		// 							}
		// 							assetReducer(request, params, "AssetId").then(function (assetIds) {
		// 								//console.log("Asset Reducer Completed");
		// 								if (assetIds) {
		// 									delete params.LocationId;
		// 									params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
		// 									this.assetIds = params["AssetId[]"];
		// 								} else {
		// 									this.assetIds = null
		// 								}

		// 								assetReducer(request, params, "LocationId").then(function (locationIds) {
		// 									//console.log("Asset Reducer Completed");
		// 									if (locationIds) {
		// 										delete params.LocationId;
		// 										params["LocationId[]"] = locationIds.length != 0 ? locationIds : [-1];
		// 									}

		// 									salesRepReducer(request, params, "LocationId").then(function (locationIds) {
		// 										if (locationIds) {
		// 											delete params.LocationId;
		// 											params["LocationId[]"] = locationIds.length != 0 ? locationIds : [-1];
		// 										}
		// 										outletReducer(request, params).then(function (locationIds) {
		// 											this.locationIds = locationIds;
		// 											delete params.LocationId;
		// 											params["LocationId[]"] = locationIds;
		// 											if (params.AlertTypeId || params.PriorityId || params.StatusId || params["AlertTypeId[]"] || params["PriorityId[]"] || params["StatusId[]"]) {
		// 												params["startDateAlert"] = params.startDate;
		// 												params["endDateAlert"] = params.endDate;
		// 												params["fromOutletScreenAlert"] = true;
		// 												if (params.dayOfWeek || params["dayOfWeek[]"]) {
		// 													params["dayOfWeekAlert"] = params.dayOfWeek || params["dayOfWeek[]"];
		// 												}
		// 												if (params.yearWeek || params["yearWeek[]"]) {
		// 													params["yearWeekAlert"] = params.yearWeek || params["yearWeek[]"];
		// 												}
		// 												if (params.quarter || params["quarter[]"]) {
		// 													params["quarterAlert"] = params.quarter || params["quarter[]"];
		// 												}
		// 												if (params.month || params["month[]"]) {
		// 													params["monthAlert"] = params.month || params["month[]"];
		// 												}
		// 											}
		// 											alertReducer(request, params, "LocationId").then(function (alertLocationIds) {
		// 												if (Array.isArray(this.locationIds) || alertLocationIds) {
		// 													var locationQuery;
		// 													var locationQueryOutlet;
		// 													if (!alertLocationIds) {
		// 														alertLocationIds = [];
		// 														locationQuery = {
		// 															"terms": {
		// 																LocationId: this.locationIds.length != 0 ? this.locationIds : [-1]
		// 															}
		// 														};
		// 														locationQueryOutlet = {
		// 															"terms": {
		// 																"_id": this.locationIds.length != 0 ? this.locationIds : [-1]
		// 															}
		// 														};
		// 													} else {
		// 														locationQuery = {
		// 															"terms": {
		// 																LocationId: alertLocationIds.length != 0 ? alertLocationIds : [-1]
		// 															}
		// 														};
		// 														locationQueryOutlet = {
		// 															"terms": {
		// 																"_id": alertLocationIds.length != 0 ? alertLocationIds : [-1]
		// 															}
		// 														};
		// 													}

		// 													healthSummary.query.bool.filter.push(locationQuery);
		// 												}

		// 												var tags = credentials.tags,
		// 													limitLocation = Number(tags.LimitLocation);
		// 												if (limitLocation != 0) {
		// 													var filterQuery = {
		// 														"terms": {
		// 															LocationId: {
		// 																"index": "filteredlocations",
		// 																"type": "locationIds",
		// 																"id": credentials.user.UserId,
		// 																"path": "LocationId"
		// 															},
		// 															"_cache_key": "experiment_" + credentials.user.UserId
		// 														}

		// 													}

		// 													var filterQueryOutlet = {
		// 														"terms": {
		// 															"_id": {
		// 																"index": "filteredlocations",
		// 																"type": "locationIds",
		// 																"id": credentials.user.UserId,
		// 																"path": "LocationId"
		// 															},
		// 															"_cache_key": "experiment_" + credentials.user.UserId
		// 														}
		// 													}

		// 													healthSummary.query.bool.filter.push(filterQuery);

		// 												}

		// 												if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
		// 													var smartDeviceTypeQuery = {
		// 														"terms": {
		// 															"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
		// 														}
		// 													}
		// 													healthSummary.query.bool.filter.push(smartDeviceTypeQuery);
		// 												}

		// 												if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
		// 													var assetManufactureQuery = {
		// 														"terms": {
		// 															"AssetManufacturerId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
		// 														}
		// 													}
		// 													healthSummary.query.bool.filter.push(assetManufactureQuery);
		// 												}

		// 												if (request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]) {
		// 													var manufacturerSmartDeviceQuery = {
		// 														"terms": {
		// 															"SmartDeviceManufacturerId": request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]
		// 														}
		// 													}
		// 													healthSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
		// 												}

		// 												if (this.assetIds) {
		// 													var assetQuery = {
		// 														"terms": {
		// 															"AssetId": this.assetIds
		// 														}
		// 													}
		// 													healthSummary.query.bool.filter.push(assetQuery);
		// 												}
		// 												if (this.dateFilter.length > 0) {
		// 													startDate = this.dateFilter[0].startDate;
		// 													endDate = this.dateFilter[this.dateFilter.length - 1].endDate;
		// 												}
		// 												var indexNames = util.getEventsIndexName(startDate, endDate);
		// 												//console.log(indexNames.toString());
		// 												var queries = [{
		// 													key: "events",
		// 													search: {
		// 														index: indexNames.toString(), // 'cooler-iot-events',
		// 														body: healthSummary,
		// 														ignore_unavailable: true
		// 													}
		// 												}];
		// 												var promises = [];
		// 												for (var i = 0, len = queries.length; i < len; i++) {
		// 													var query = queries[i];
		// 													var body = {
		// 														from: 0,
		// 														size: 0
		// 													};

		// 													var clientId = request.auth.credentials.user.ScopeId;
		// 													if (clientId != 0) {
		// 														body.query = {
		// 															term: {
		// 																ClientId: client
		// 															}
		// 														};
		// 													}

		// 													Object.assign(query, body);
		// 													promises.push(this.getElasticData(queries[i]));
		// 												}

		// 												var getMedian = this.getMedian;
		// 												Promise.all(promises).then(function (values) {
		// 													var data = {},
		// 														finalData = {};
		// 													for (var i = 0, len = values.length; i < len; i++) {
		// 														var value = values[i];
		// 														data[value.config.key] = value.response;
		// 														util.setLogger(value);
		// 													}

		// 													var eventAggs = data.events.aggregations;
		// 													var lightOpenHour = 'N/A',
		// 														tempBelow7Hour = 'N/A';
		// 													if (eventAggs) {
		// 														lightOpenHour = ((moment.duration(eventAggs.HoursLightOn.HoursLightOn.value, 'm').asHours() / eventAggs.HoursLightOn.AssetCount.value) / moment.duration(totalHours, 'hours').asDays()).toLocaleString();
		// 														tempBelow7Hour = ((moment.duration(eventAggs.TemperatureBelow7.TempBelow7.value, 'm').asHours() / eventAggs.TemperatureBelow7.AssetCount.value) / moment.duration(totalHours, 'hours').asDays()).toLocaleString();
		// 													}
		// 													if (isNaN(lightOpenHour)) {
		// 														lightOpenHour = 'N/A'
		// 													}
		// 													if (isNaN(tempBelow7Hour)) {
		// 														tempBelow7Hour = 'N/A'
		// 													}

		// 													finalData.summary = {
		// 														coolerAbove7Hour: tempBelow7Hour,
		// 														hoursLightOn: lightOpenHour
		// 													};
		// 													return reply({
		// 														success: true,
		// 														data: finalData
		// 													});
		// 												}, function (err) {
		// 													console.trace(err.message);
		// 													 return reply(Boom.badRequest(err.message));
		// 												});

		// 											}.bind(this)).catch(function (err) {
		// 												console.log(err);
		// 												 return reply(Boom.badRequest(err.message));
		// 											});
		// 										}.bind(this)).catch(function (err) {
		// 											console.log(err);
		// 											 return reply(Boom.badRequest(err.message));
		// 										});
		// 									}.bind(this)).catch(function (err) {
		// 										console.log(err);
		// 										 return reply(Boom.badRequest(err.message));
		// 									});
		// 								}.bind(this)).catch(function (err) {
		// 									console.log(err);
		// 									 return reply(Boom.badRequest(err.message));
		// 								});
		// 							}.bind(this)).catch(function (err) {
		// 								console.log(err);
		// 								 return reply(Boom.badRequest(err.message));
		// 							});
		// 						}.bind(this)).catch(function (err) {
		// 							console.log(err);
		// 							 return reply(Boom.badRequest(err.message));
		// 						});
		// 					}.bind(this)).catch(function (err) {
		// 						console.log(err);
		// 						 return reply(Boom.badRequest(err.message));
		// 					});
		// 				}.bind(this)).catch(function (err) {
		// 					console.log(err);
		// 					 return reply(Boom.badRequest(err.message));
		// 				});
		// 			}.bind(this)).catch(function (err) {
		// 				console.log(err);
		// 				 return reply(Boom.badRequest(err.message));
		// 			});
		// 		}.bind(this)).catch(function (err) {
		// 			console.log(err);
		// 			 return reply(Boom.badRequest(err.message));
		// 		});
		// 	}.bind(this)).catch(function (err) {
		// 		console.log(err);
		// 		 return reply(Boom.badRequest(err.message));
		// 	});
		// }.bind(this)).catch(function (err) {
		// 	console.log(err);
		// 	 return reply(Boom.badRequest(err.message));
		// });
	}
}