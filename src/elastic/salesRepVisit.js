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
		assetSummary: JSON.stringify(require('./dashboardQueries/salesAssetSummary.json')),
		locationRep: JSON.stringify(require('./locationRep.json')),
		visitSummary: JSON.stringify(require('./dashboardQueries/kpiVisitSummary.json')),
		kpiSalesSummary: JSON.stringify(require('./dashboardQueries/kpiSalesSummary.json'))
	},

	getSalesVisitWidgetData: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload),
			assetSummary = JSON.parse(this.dashboardQueries.assetSummary),
			locationRep = JSON.parse(this.dashboardQueries.locationRep),
			visitSummary = JSON.parse(this.dashboardQueries.visitSummary),
			kpiSalesSummary = JSON.parse(this.dashboardQueries.kpiSalesSummary);
		// client Filter
		var clientQuery = {
			"term": {
				"ClientId": clientId
			}
		};
		if (clientId != 0) {
			assetSummary.query.bool.filter.push(clientQuery);
			visitSummary.query.bool.filter.push(clientQuery);
			locationRep.query.bool.filter.push(clientQuery);
			kpiSalesSummary.query.bool.filter.push(clientQuery);
		}
		visitSummary.query.bool.filter.push({
			"bool": {
				"should": []
			}
		});
		kpiSalesSummary.query.bool.filter.push({
			"bool": {
				"should": []
			}
		});
		//Date Filter
		var isDefaultDateFilter = params.yearWeek || params.dayOfWeek || params.quarter || params.month;
		var dateFilter = [];
		var totalHours = 0;
		var months = 0;
		if (!isDefaultDateFilter && !params.startDate && !params.endDate) {

			visitSummary.query.bool.filter.push({
				"range": {
					"Date": {
						"gte": "now-30d/d"
					}
				}
			});
			kpiSalesSummary.query.bool.filter.push({
				"range": {
					"Date": {
						"gte": "now-30d/d"
					}
				}
			});
			totalHours = defaultHours;
			months = 1;
		} else if (!isDefaultDateFilter && params.startDate && params.endDate) {
			var startDate = moment(params.startDate).format('YYYY-MM-DD[T00:00:00]');
			var endDate = moment(params.endDate).format('YYYY-MM-DD[T23:59:59]');
			visitSummary.query.bool.filter.push({
				"range": {
					"Date": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});
			kpiSalesSummary.query.bool.filter.push({
				"range": {
					"Date": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});
			totalHours = moment(endDate).diff(moment(startDate), 'hours') + 1;
			months = moment(endDate).diff(moment(startDate), 'months', true);
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
			months += filterDate.months;
			this.dateFilter = dateFilter;
			visitSummary = util.pushDateQuery(visitSummary, {
				"range": {
					"Date": {
						"gte": startDate,
						"lte": endDate
					}
				}
			});
			kpiSalesSummary = util.pushDateQuery(kpiSalesSummary, {
				"range": {
					"Date": {
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

				var alertTypeId = request.query.AlertTypeId || request.query["AlertTypeId[]"];
				var priorityId = request.query.PriorityId || request.query["PriorityId[]"];
				var repId = request.query.RepId || request.query["RepId[]"];
				var salesRepTerms = [];
				if (repId) {
					if (typeof (repId) === 'string') {
						salesRepTerms.push({
							"term": {
								RepId: repId
							}
						});
					} else {
						salesRepTerms.push({
							"terms": {
								RepId: repId
							}
						});
					}
				}
				locationRep.query.bool.filter.push(locationTerm);
				if (salesRepTerms.length > 0) {
					locationRep.query.bool.filter.push(salesRepTerms);
				}
				//assetSummary.aggs.Assets.filter.bool.must.push(locationTerm);
				assetSummary.aggs.AssetCountTotal.filter.bool.must.push(locationTerm);
				visitSummary.query.bool.filter.push(locationTerm);
				//assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
				assetSummary.aggs.LocationCountTotal.filter.bool.must.push(locationQueryOutlet);
				assetSummary.aggs.CustomerCount.filter.bool.must.push(locationQueryOutlet);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationTerm);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationTerm);
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
						kpiSalesSummary.query.bool.filter.push(locationQuery);
					}
				} else {
					assetSummary.aggs.Assets.filter.bool.must.push(locationTerm);
					assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationTerm);
					assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationTerm);
					assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
					kpiSalesSummary.query.bool.filter.push(locationTerm);
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
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(filterQuery);

				visitSummary.query.bool.filter.push(filterQueryOutlet);
				kpiSalesSummary.query.bool.filter.push(filterQuery);

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
			}

			if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
				var assetManufactureQuery = {
					"terms": {
						"AssetManufacturerId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
					}
				}
				assetSummary.aggs.Assets.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetManufactureQuery);
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
				assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(manufacturerSmartDeviceQuery);
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
			}

			if (_this.dateFilter.length > 0) {
				startDate = _this.dateFilter[0].startDate;
				endDate = _this.dateFilter[_this.dateFilter.length - 1].endDate;
			}
			var indexNamesSales = util.getEventsIndexName(startDate, endDate, 'cooler-iot-salesorderdetail-');

			var queries = [{
				key: "visit",
				search: {
					index: 'cooler-iot-visit',
					body: visitSummary,
					ignore_unavailable: true
				}
			}, {
				key: "db",
				search: {
					index: 'cooler-iot-asset,cooler-iot-location',
					body: assetSummary,
					ignore_unavailable: true
				}
			}, {
				key: "locationRep",
				search: {
					index: 'cooler-iot-locationrep',
					body: locationRep,
					ignore_unavailable: true
				}
			}, {
				key: "sales",
				search: {
					index: indexNamesSales.toString(),
					body: kpiSalesSummary,
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
						visitFrequency: [{
							"Name": 'No Visits',
							"Visit": 0,
							Sales: 0
						}, {
							"Name": '&lt; 2/Month',
							"Visit": 0,
							Sales: 0
						}, {
							"Name": '2-5/Month',
							"Visit": 0,
							Sales: 0
						}, {
							"Name": '5-8/Month',
							"Visit": 0,
							Sales: 0
						}, {
							"Name": '>= 8/Month',
							"Visit": 0,
							Sales: 0
						}],
						visitDuration: [{
							"Name": 'No Visits',
							"Visit": 0,
							Sales: 0
						}, {
							"Name": '&lt; 5 mins',
							"Visit": 0,
							Sales: 0
						}, {
							"Name": '5-10 mins',
							"Visit": 0,
							Sales: 0
						}, {
							"Name": '10-15 mins',
							"Visit": 0,
							Sales: 0
						}, {
							"Name": '15-20 mins',
							"Visit": 0,
							Sales: 0
						}, {
							"Name": '>= 20 mins',
							"Visit": 0,
							Sales: 0
						}],
						openAlerts: [],
						alertsByWeek: [],
						visitBySeller: [],
						visitDurationByCustomer: [],
						visitHistoryHeatMap: [],
						visitDurationHeatMap: []
					};
				for (var i = 0, len = values.length; i < len; i++) {
					var value = values[i];
					data[value.config.key] = value.response;
					util.setLogger(value);
				}
				var dbAggs = data.db.aggregations,
					visitAggs = data.visit.aggregations;

				var totalAssets = dbAggs.AssetCount.doc_count;
				var visitDuration,
					visitPerMonth = 'N/A',
					salesRepsVisitDuration = [],
					salesRep,
					locationName,
					visitCount, assetVisitCount,
					sumDuration, visitDurationSum = 0;
				var sales, salesValue = 0;

				if (visitAggs) {
					visitAggs.VisitFrequency.buckets.forEach(function (latitudeData) {
						latitudeData.Longitude.buckets.forEach(function (longitudeData) {
							finalData.visitHistoryHeatMap.push({
								"Latitude": latitudeData.key,
								"Longitude": longitudeData.key,
								"Total": longitudeData.doc_count
							});
							longitudeData.VisitData.hits.hits.forEach(function (durationData) {
								visitDurationSum += durationData._source.VisitDuration;
							});
							finalData.visitDurationHeatMap.push({
								"Latitude": latitudeData.key,
								"Longitude": longitudeData.key,
								"Total": visitDurationSum
							});
							visitDurationSum = 0;
						});

					});
					var isAdded = [],
						name, alarmIndex;

					visitAggs.SalesRepData.buckets.forEach(function (salesRepData) {
						salesValue = 0;
						salesRepData.VisitData.hits.hits.forEach(function (visitData) {
							visitDuration = visitDuration ? visitDuration : 0;
							visitDuration += visitData._source.VisitDuration;
							assetVisitCount = assetVisitCount ? assetVisitCount : 0;
							assetVisitCount++;
							//salesRepsVisitDuration.push(visitData._source.VisitDuration);
						});
						salesRep = data.locationRep.hits.hits.filter(data => data._source.RepId == salesRepData.key);
						if (salesRep.length > 0) {
							var salesDataFirst = salesRep[0];
							name = salesDataFirst._source.Username != null ? salesDataFirst._source.Username : salesDataFirst._source.Name != null ? salesDataFirst._source.Name : bucket.key;
							if (name) {
								isAdded = finalData.visitBySeller.filter(rep => rep.RepId == salesDataFirst._source.RepId);
								if (isAdded.length > 0) {
									alarmIndex = finalData.visitBySeller.indexOf(isAdded[0]);
									finalData.visitBySeller[alarmIndex].Value += salesRepData.doc_count;
									finalData.visitBySeller[alarmIndex].Sales += salesRepData.doc_count;
								} else {
									finalData.visitBySeller.push({
										Name: name,
										RepId: salesRepData.key,
										Value: salesRepData.doc_count,
										Sales: salesRepData.doc_count
									});
								}
							}
						}

						//visitDuration = 0;
						//console.log(visitDuration);
					});

					if (reply.request.query.sellerTop == "false") {
						finalData.visitBySeller = finalData.visitBySeller.reverse();
					}
					finalData.visitBySeller = finalData.visitBySeller.splice(0, 10);
					//var months = moment.duration(totalHours, 'hours').asMonths();


					finalData.visitBySeller.sort(function (a, b) {
						var keyA = new Date(a.Value),
							keyB = new Date(b.Value);
						// Compare the 2 dates
						if (keyA > keyB) return -1;
						if (keyA < keyB) return 1;
						return 0;
					});


					visitAggs.LocationData.buckets.forEach(function (locationData) {
						salesValue = 0;
						locationName = locationData.LocationName.hits.hits[0]._source;
						finalData.visitDurationByCustomer.push({
							Name: locationName.LocationName,
							Value: moment.duration(locationData.AvgDuration.value, 'seconds').asMinutes(),
							Sales: locationData.doc_count
						});
						visitCount = locationData.doc_count / Number(months.toFixed(2));
						sales = data.sales.aggregations.Location.buckets.find(data => data.key == locationData.key);
						if (sales) {
							salesValue = sales.SalesVolume.value;
						}
						sumDuration = moment.duration(locationData.AvgDuration.value, 'seconds').asMinutes();
						if (visitCount < 2) {
							finalData.visitFrequency[1].Visit++;
							finalData.visitFrequency[1].Sales += salesValue;
						} else if (visitCount >= 2 && visitCount < 5) {
							finalData.visitFrequency[2].Visit++;
							finalData.visitFrequency[2].Sales += salesValue;
						} else if (visitCount >= 5 && visitCount < 8) {
							finalData.visitFrequency[3].Visit++;
							finalData.visitFrequency[3].Sales += salesValue;
						} else if (visitCount >= 8) {
							finalData.visitFrequency[4].Visit++;
							finalData.visitFrequency[4].Sales += salesValue;
						}

						if (sumDuration < 5) {
							finalData.visitDuration[1].Visit++;
							finalData.visitDuration[1].Sales += salesValue;
						} else if (sumDuration >= 5 && sumDuration < 10) {
							finalData.visitDuration[2].Visit++;
							finalData.visitDuration[2].Sales += salesValue;
						} else if (sumDuration >= 10 && sumDuration < 15) {
							finalData.visitDuration[3].Visit++;
							finalData.visitDuration[3].Sales += salesValue;
						} else if (sumDuration >= 15 && sumDuration < 20) {
							finalData.visitDuration[4].Visit++;
							finalData.visitDuration[4].Sales += salesValue;
						} else if (sumDuration >= 20) {
							finalData.visitDuration[5].Visit++;
							finalData.visitDuration[5].Sales += salesValue;
						}
					});
					finalData.visitFrequency[0].Visit = (dbAggs.Locations.doc_count - visitAggs.LocationData.buckets.length);
					finalData.visitDuration[0].Visit = (dbAggs.Locations.doc_count - visitAggs.LocationData.buckets.length);


					if (reply.request.query.customerTop == "false") {
						finalData.visitDurationByCustomer = finalData.visitDurationByCustomer.reverse();
					}
					finalData.visitDurationByCustomer = finalData.visitDurationByCustomer.splice(0, 10);

					if (data.visit.hits.total) {
						visitPerMonth = (data.visit.hits.total / visitAggs.LocationCount.value) / Number(months.toFixed(2));
						if (isNaN(visitPerMonth)) {
							visitPerMonth = 0
						}
					} else {
						visitPerMonth = 'N/A';
					}
				}

				if (visitDuration) {
					data.visitDuration = moment.duration(visitDuration, 'seconds').asMinutes() / assetVisitCount;
					if (isNaN(data.visitDuration)) {
						data.visitDuration = 'N/A'
					}
				} else {
					data.visitDuration = 'N/A'
				}
				var smartAssetCount = dbAggs.SmartAssetCount.doc_count;
				finalData.summary = {
					totalCooler: dbAggs.AssetCount.doc_count,
					totalCustomer: dbAggs.LocationCount.doc_count,
					filteredAssets: dbAggs.Assets.doc_count,
					filteredOutlets: dbAggs.Locations.doc_count,
					totalOutlets: dbAggs.LocationCount.doc_count,
					salesVisitDuration: data.visitDuration,
					visitPerMonth: visitPerMonth,
					routeCompliance: 10, //todo
					totalSmartAssetCount: dbAggs.TotalSmartAssetCount.doc_count,
					smartAssetCountWareHouse: dbAggs.SmartAssetCountWareHouse.doc_count,
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