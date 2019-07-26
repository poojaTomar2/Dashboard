"use strict"
var linq = require('node-linq').LINQ,
	fs = require('fs');
var consts = require('../controllers/consts');
var client = require('../models').elasticClient;
var outletReducer = require('../controllers/reducers/outlet');
var smartDeviceInstallationDateReducer = require('../controllers/reducers/smartDeviceInstallationDate');
var smartDeviceLatestDataReducer = require('../controllers/reducers/smartDeviceLatestData');
var salesRepReducer = require('../controllers/reducers/salesRep');
var smartDeviceMovementReducer = require('../controllers/reducers/smartDeviceMovement');
var smartDevicDoorStatusReducer = require('../controllers/reducers/smartDevicDoorStatus');
var smartDevicHealthReducer = require('../controllers/reducers/smartDeviceHealthRecord');
var smartDevicePowerReducer = require('../controllers/reducers/smartDevicePowerRecord');
var alertReducer = require('../controllers/reducers/alert');
var assetReducer = require('../controllers/reducers/asset');
var smartDeviceReducer = require('../controllers/reducers/smartDevice');
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

	dashboardQueries: {
		assetSummary: JSON.stringify(require('./dashboardQueries/imberaAssetSummary.json')),
		alertSummary: JSON.stringify(require('./dashboardQueries/imberaAlertSummary.json')),
		customerSummary: JSON.stringify(require('./dashboardQueries/imberaAlertCustomerSummary.json')),
		TotalAssetLocation: JSON.stringify(require('./dashboardQueries/TotalAssetLocation.json')),
		technicianSummary: JSON.stringify(require('./dashboardQueries/imberaAlertTechnicianSummary.json'))
	},

	getImberaWidgetData: function (request, reply) {
		request.query = Object.assign({}, request.query, request.payload);
		reply.query = Object.assign({}, request.query, request.payload);
		var clientId = request.auth.credentials.user.ScopeId;
		var credentials = request.auth.credentials;
		var params = Object.assign({}, request.query, request.payload),
			assetSummary = JSON.parse(this.dashboardQueries.assetSummary),
			alertSummary = JSON.parse(this.dashboardQueries.alertSummary),
			customerSummary = JSON.parse(this.dashboardQueries.customerSummary),
			technicianSummary = JSON.parse(this.dashboardQueries.technicianSummary),
			//totalAssetLocation = JSON.parse(this.dashboardQueries.TotalAssetLocation),
			isTechnician = params.isTechnician,
			isTechnicianTop = params.isTechnicianTop,
			isCustomer = params.isCustomer,
			isCustomerTop = params.isCustomerTop;
		// client Filter
		var clientQuery = {
			"term": {
				"ClientId": clientId
			}
		};
		if (clientId != 0) {
			assetSummary.query.bool.filter.push(clientQuery);
			alertSummary.query.bool.must.push(clientQuery);
			customerSummary.query.bool.must.push(clientQuery);
			technicianSummary.query.bool.must.push(clientQuery);
			//totalAssetLocation.query.bool.filter.push(clientQuery);
		}
		var isDefaultDateFilter = params.yearWeek || params.dayOfWeek || params.quarter || params.month;
		var dateFilter = [];
		var totalHours = 0;
		var queryDateGeaterRangeFilter = {
			"range": {
				"AlarmSummaryInJson.EventDate": {
					"gte": "now-30d/d"
				}
			}
		};
		var queryDateLesserRangeFilter = {
			"range": {
				"AlarmSummaryInJson.EventDate": {
					"lte": "now"
				}
			}
		};
		if (!isDefaultDateFilter && params.startDate && params.endDate) {
			var startDate = moment(params.startDate).format('YYYY-MM-DD[T00:00:00]');
			var endDate = moment(params.endDate).format('YYYY-MM-DD[T23:59:59]');
			queryDateGeaterRangeFilter = {
				"range": {
					"AlarmSummaryInJson.EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			queryDateLesserRangeFilter = {
				"range": {
					"AlarmSummaryInJson.EventDate": {
						"lte": endDate
					}
				}
			};
			if (!isTechnician && !isCustomer) {
				alertSummary.aggs.AlertCountBoth.aggs.AlertCountBoth.filter.bool.must.push(queryDateGeaterRangeFilter);
				alertSummary.aggs.ByType.aggs.ByType.aggs.AlertOpen.filter.bool.must.push(queryDateLesserRangeFilter);
				alertSummary.aggs.ByType.aggs.ByType.aggs.AlertClosed.filter.bool.must.push(queryDateGeaterRangeFilter);
				alertSummary.aggs.ByCoolerModel.aggs.ByCoolerModel.aggs.AlertOpen.filter.bool.must.push(queryDateLesserRangeFilter);
				alertSummary.aggs.ByCoolerModel.aggs.ByCoolerModel.aggs.AlertClosed.filter.bool.must.push(queryDateGeaterRangeFilter);
				alertSummary.aggs.ByCapacityType.aggs.ByCapacityType.aggs.AlertOpen.filter.bool.must.push(queryDateLesserRangeFilter);
				alertSummary.aggs.ByCapacityType.aggs.ByCapacityType.aggs.AlertClosed.filter.bool.must.push(queryDateGeaterRangeFilter);
				alertSummary.aggs.AlertOpenCount.aggs.AlertOpenCount.filter.bool.must.push(queryDateGeaterRangeFilter);
				alertSummary.aggs.AlertCloseCount.aggs.AlertCloseCount.filter.bool.must.push(queryDateGeaterRangeFilter);
				alertSummary.aggs.TotalAlert.aggs.TotalAlert.filter.bool.must.push(queryDateGeaterRangeFilter);
				// alertSummary.aggs.AlertsCreatedByWeek.aggs.AlertsCreatedByWeek.filter.bool.should.push(queryDateGeaterRangeFilter);
				// alertSummary.aggs.AlertsClosedByWeek.aggs.AlertsClosedByWeek.filter.bool.must.push(queryDateGeaterRangeFilter);
				technicianSummary.aggs.ByTechnicianType.aggs.ByTechnicianType.aggs.AlertOpen.filter.bool.should.push(queryDateLesserRangeFilter);
				technicianSummary.aggs.ByTechnicianType.aggs.ByTechnicianType.aggs.AlertClosed.filter.bool.should.push(queryDateGeaterRangeFilter);
				customerSummary.aggs.ByCustomerType.aggs.ByCustomerType.aggs.AlertOpen.filter.bool.should.push(queryDateLesserRangeFilter);
				customerSummary.aggs.ByCustomerType.aggs.ByCustomerType.aggs.AlertClosed.filter.bool.should.push(queryDateGeaterRangeFilter);
			} else if (isTechnician) {
				technicianSummary.aggs.ByTechnicianType.aggs.ByTechnicianType.terms.order._count = JSON.parse(isTechnicianTop) ? "asc" : "desc";
				technicianSummary.aggs.ByTechnicianType.aggs.ByTechnicianType.aggs.AlertOpen.filter.bool.should.push(queryDateLesserRangeFilter);
				technicianSummary.aggs.ByTechnicianType.aggs.ByTechnicianType.aggs.AlertClosed.filter.bool.should.push(queryDateGeaterRangeFilter);
			} else {
				customerSummary.aggs.ByCustomerType.aggs.ByCustomerType.terms.order._count = JSON.parse(isCustomerTop) ? "asc" : "desc";
				customerSummary.aggs.ByCustomerType.aggs.ByCustomerType.aggs.AlertOpen.filter.bool.should.push(queryDateLesserRangeFilter);
				customerSummary.aggs.ByCustomerType.aggs.ByCustomerType.aggs.AlertClosed.filter.bool.must.push(queryDateGeaterRangeFilter);
			}

			var startWeek = moment.utc(startDate).week('monday').isoWeek() - 1;
			var endWeek = moment.utc(endDate).week('monday').isoWeek();

			var startYear = moment.utc(startDate).year();
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
			for (var i = startWeek; i <= endWeek; i++) {

				var startWeekDate = moment.utc().week(i).startOf('isoweek').format('YYYY-MM-DD[T00:00:00]');
				var endWeekDate = moment.utc().week(i).endOf('isoweek').format('YYYY-MM-DD[T23:59:59]');
				var startDateWeekValue = moment.utc().week(i).startOf('isoweek').valueOf();

				if (moment.utc(startDate).week('monday').isoWeek() === j) {
					startDateWeek = startDate
				}
				alertSummary.aggs.AlertsOpenByWeek.aggs.Bands.aggs.Bands.range.ranges.push({
					"key": startDateWeekValue.toString(),
					"from": startWeekDate,
					"to": endWeekDate
				});

				alertSummary.aggs.AlertsCreatedByWeek.aggs.AlertsCreatedByWeek.filter.bool.should.push({
					"range": {
						"AlarmSummaryInJson.EventDate": {
							"gte": startWeekDate,
							"lte": endWeekDate
						}
					}
				});
				alertSummary.aggs.AlertsClosedByWeek.aggs.AlertsClosedByWeek.filter.bool.should.push({
					"range": {
						"AlarmSummaryInJson.EventDate": {
							"gte": startWeekDate,
							"lte": endWeekDate
						}
					}
				});
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

			queryDateGeaterRangeFilter = {
				"range": {
					"AlarmSummaryInJson.EventDate": {
						"gte": startDate,
						"lte": endDate
					}
				}
			};
			queryDateLesserRangeFilter = {
				"range": {
					"AlarmSummaryInJson.EventDate": {
						"lte": endDate
					}
				}
			};
			if (!isTechnician && !isCustomer) {
				alertSummary.aggs.AlertCountBoth.aggs.AlertCountBoth.filter.bool.should.push(queryDateGeaterRangeFilter);
				alertSummary.aggs.AlertCloseCount.aggs.AlertCloseCount.filter.bool.must.push(queryDateGeaterRangeFilter);
				alertSummary.aggs.AlertOpenCount.aggs.AlertOpenCount.filter.bool.should.push(queryDateGeaterRangeFilter);
				alertSummary.aggs.ByType.aggs.ByType.aggs.AlertOpen.filter.bool.should.push(queryDateLesserRangeFilter);
				alertSummary.aggs.ByType.aggs.ByType.aggs.AlertClosed.filter.bool.must.push(queryDateGeaterRangeFilter);
				alertSummary.aggs.ByCoolerModel.aggs.ByCoolerModel.aggs.AlertOpen.filter.bool.should.push(queryDateLesserRangeFilter);
				alertSummary.aggs.ByCoolerModel.aggs.ByCoolerModel.aggs.AlertClosed.filter.bool.must.push(queryDateGeaterRangeFilter);
				alertSummary.aggs.ByCapacityType.aggs.ByCapacityType.aggs.AlertOpen.filter.bool.should.push(queryDateLesserRangeFilter);
				alertSummary.aggs.ByCapacityType.aggs.ByCapacityType.aggs.AlertClosed.filter.bool.must.push(queryDateGeaterRangeFilter);
				alertSummary.aggs.TotalAlert.aggs.TotalAlert.filter.bool.should.push(queryDateGeaterRangeFilter);
				// alertSummary.aggs.AlertsCreatedByWeek.aggs.AlertsCreatedByWeek.filter.bool.should.push(queryDateGeaterRangeFilter);
				// alertSummary.aggs.AlertsClosedByWeek.aggs.AlertsClosedByWeek.filter.bool.should.push(queryDateGeaterRangeFilter);
				technicianSummary.aggs.ByTechnicianType.aggs.ByTechnicianType.aggs.AlertOpen.filter.bool.should.push(queryDateLesserRangeFilter);
				technicianSummary.aggs.ByTechnicianType.aggs.ByTechnicianType.aggs.AlertClosed.filter.bool.should.push(queryDateGeaterRangeFilter);
				customerSummary.aggs.ByCustomerType.aggs.ByCustomerType.aggs.AlertOpen.filter.bool.should.push(queryDateLesserRangeFilter);
				customerSummary.aggs.ByCustomerType.aggs.ByCustomerType.aggs.AlertClosed.filter.bool.should.push(queryDateGeaterRangeFilter);
			} else if (isTechnician) {
				technicianSummary.aggs.ByTechnicianType.aggs.ByTechnicianType.terms.order._count = JSON.parse(isTechnicianTop) ? "asc" : "desc";
				technicianSummary.aggs.ByTechnicianType.aggs.ByTechnicianType.aggs.AlertOpen.filter.bool.should.push(queryDateLesserRangeFilter);
				technicianSummary.aggs.ByTechnicianType.aggs.ByTechnicianType.aggs.AlertClosed.filter.bool.should.push(queryDateGeaterRangeFilter);
			} else {
				customerSummary.aggs.ByCustomerType.aggs.ByCustomerType.terms.order._count = JSON.parse(isCustomerTop) ? "asc" : "desc";
				customerSummary.aggs.ByCustomerType.aggs.ByCustomerType.aggs.AlertOpen.filter.bool.should.push(queryDateLesserRangeFilter);
				customerSummary.aggs.ByCustomerType.aggs.ByCustomerType.aggs.AlertClosed.filter.bool.should.push(queryDateGeaterRangeFilter);
			}
			var startWeek = moment.utc(startDate).week('monday').isoWeek() - 1;
			var endWeek = moment.utc(endDate).week('monday').isoWeek();

			var startYear = moment.utc(startDate).year();
			var endYear = moment.utc(endDate).year();
			var currentYear = moment.utc().year();
			if (currentYear > startYear) {
				var weekinYear = moment.utc(params.startDate).weeksInYear();
				startWeek = startWeek - weekinYear * (currentYear - startYear);
				endWeek = endWeek - weekinYear * (currentYear - endYear);
			}
			for (var j = startWeek; j <= endWeek; j++) {

				// var startDateWeek = moment().day("Monday").week(j).format('YYYY-MM-DD[T00:00:00]');
				// var startDateWeekValue = moment.utc().day("Monday").week(j).startOf('day').valueOf();

				var startWeekDate = moment.utc().week(i).startOf('isoweek').format('YYYY-MM-DD[T00:00:00]');
				var endWeekDate = moment.utc().week(i).endOf('isoweek').format('YYYY-MM-DD[T23:59:59]');
				var startDateWeekValue = moment.utc().week(i).startOf('isoweek').valueOf();

				if (moment.utc(startDate).week('monday').isoWeek() === j) {
					startDateWeekValue = startDate
				}
				alertSummary.aggs.AlertsOpenByWeek.aggs.Bands.aggs.Bands.range.ranges.push({
					"key": startDateWeekValue.toString(),
					"from": startWeekDate,
					"to": endWeekDate
				});

				alertSummary.aggs.AlertsCreatedByWeek.aggs.AlertsCreatedByWeek.filter.bool.should.push({
					"range": {
						"AlarmSummaryInJson.EventDate": {
							"gte": startWeekDate,
							"lte": endWeekDate
						}
					}
				});
				alertSummary.aggs.AlertsClosedByWeek.aggs.AlertsClosedByWeek.filter.bool.should.push({
					"range": {
						"AlarmSummaryInJson.EventDate": {
							"gte": startWeekDate,
							"lte": endWeekDate
						}
					}
				});
			}
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
			assetSummary.query.bool.filter.push(countryIdsUser);

			alertSummary.query.bool.must.push(countryIdsUser);
			technicianSummary.query.bool.must.push(countryIdsUser);
			customerSummary.query.bool.must.push(countryIdsUser);
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

			assetSummary.query.bool.filter.push(filterQuery);

			alertSummary.query.bool.must.push(filterQuery);
			technicianSummary.query.bool.must.push(filterQuery);
			customerSummary.query.bool.must.push(filterQuery);
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

			if (!isTechnician && !isCustomer) {
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetIds);
				assetSummary.aggs.Locations.filter.bool.must.push(AssetIds);
				alertSummary.query.bool.must.push(AssetIds);
				technicianSummary.query.bool.must.push(AssetIds);
				customerSummary.query.bool.must.push(AssetIds);
			} else if (isTechnician) {
				technicianSummary.query.bool.must.push(AssetIds);
			} else {
				customerSummary.query.bool.must.push(AssetIds);
			}
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

			if (!isTechnician && !isCustomer) {
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(LocationIds);
				assetSummary.aggs.Locations.filter.bool.must.push(LocationIds);
				alertSummary.query.bool.must.push(LocationIds);
				technicianSummary.query.bool.must.push(LocationIds);
				customerSummary.query.bool.must.push(LocationIds);
			} else if (isTechnician) {
				technicianSummary.query.bool.must.push(LocationIds);
			} else {
				customerSummary.query.bool.must.push(LocationIds);
			}
		}

		if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
			var smartDeviceTypeQuery = {
				"terms": {
					"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
				}
			}
			if (!isTechnician && !isCustomer) {
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(smartDeviceTypeQuery);
				assetSummary.aggs.Locations.filter.bool.must.push(smartDeviceTypeQuery);
				alertSummary.query.bool.must.push(smartDeviceTypeQuery);
				technicianSummary.query.bool.must.push(smartDeviceTypeQuery);
				customerSummary.query.bool.must.push(smartDeviceTypeQuery);
			} else if (isTechnician) {
				technicianSummary.query.bool.must.push(smartDeviceTypeQuery);
			} else {
				customerSummary.query.bool.must.push(smartDeviceTypeQuery);
			}
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
			if (!isTechnician && !isCustomer) {
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(IsKeyLocationFilter);
				assetSummary.aggs.Locations.filter.bool.must.push(IsKeyLocationFilter);
				alertSummary.query.bool.must.push(IsKeyLocationFilter);
				technicianSummary.query.bool.must.push(IsKeyLocationFilter);
				customerSummary.query.bool.must.push(IsKeyLocationFilter);
			} else if (isTechnician) {
				technicianSummary.query.bool.must.push(IsKeyLocationFilter);
			} else {
				customerSummary.query.bool.must.push(IsKeyLocationFilter);
			}
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
			if (!isTechnician && !isCustomer) {
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(IsFactoryAssetFilter);
				assetSummary.aggs.Locations.filter.bool.must.push(IsFactoryAssetFilter);
				alertSummary.query.bool.must.push(IsFactoryAssetFilter);
				technicianSummary.query.bool.must.push(IsFactoryAssetFilter);
				customerSummary.query.bool.must.push(IsFactoryAssetFilter);
			} else if (isTechnician) {
				technicianSummary.query.bool.must.push(IsFactoryAssetFilter);
			} else {
				customerSummary.query.bool.must.push(IsFactoryAssetFilter);
			}
		}

		if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
			var assetManufactureQuery = {
				"terms": {
					"AssetManufactureId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
				}
			}
			if (!isTechnician && !isCustomer) {
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetManufactureQuery);
				assetSummary.aggs.Locations.filter.bool.must.push(assetManufactureQuery);
				alertSummary.query.bool.must.push(assetManufactureQuery);
				technicianSummary.query.bool.must.push(assetManufactureQuery);
				customerSummary.query.bool.must.push(assetManufactureQuery);
			} else if (isTechnician) {
				technicianSummary.query.bool.must.push(assetManufactureQuery);
			} else {
				customerSummary.query.bool.must.push(assetManufactureQuery);
			}
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
			if (!isTechnician && !isCustomer) {
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(SalesHierarchyId);
				assetSummary.aggs.Locations.filter.bool.must.push(SalesHierarchyId);
				alertSummary.query.bool.must.push(SalesHierarchyId);
				technicianSummary.query.bool.must.push(SalesHierarchyId);
				customerSummary.query.bool.must.push(SalesHierarchyId);
			} else if (isTechnician) {
				technicianSummary.query.bool.must.push(SalesHierarchyId);
			} else {
				customerSummary.query.bool.must.push(SalesHierarchyId);
			}
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
			if (!isTechnician && !isCustomer) {
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerSmartDeviceQuery);
				assetSummary.aggs.Locations.filter.bool.must.push(manufacturerSmartDeviceQuery);
				alertSummary.query.bool.must.push(manufacturerSmartDeviceQuery);
				technicianSummary.query.bool.must.push(manufacturerSmartDeviceQuery);
				customerSummary.query.bool.must.push(manufacturerSmartDeviceQuery);
			} else if (isTechnician) {
				technicianSummary.query.bool.must.push(manufacturerSmartDeviceQuery);
			} else {
				customerSummary.query.bool.must.push(manufacturerSmartDeviceQuery);
			}
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
			if (!isTechnician && !isCustomer) {
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerOutletTypeId);
				assetSummary.aggs.Locations.filter.bool.must.push(manufacturerOutletTypeId);
				alertSummary.query.bool.must.push(manufacturerOutletTypeId);
				technicianSummary.query.bool.must.push(manufacturerOutletTypeId);
				customerSummary.query.bool.must.push(manufacturerOutletTypeId);
			} else if (isTechnician) {
				technicianSummary.query.bool.must.push(manufacturerOutletTypeId);
			} else {
				customerSummary.query.bool.must.push(manufacturerOutletTypeId);
			}
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
			if (!isTechnician && !isCustomer) {
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(LocationTypeId);
				assetSummary.aggs.Locations.filter.bool.must.push(LocationTypeId);
				alertSummary.query.bool.must.push(LocationTypeId);
				technicianSummary.query.bool.must.push(LocationTypeId);
				customerSummary.query.bool.must.push(LocationTypeId);
			} else if (isTechnician) {
				technicianSummary.query.bool.must.push(LocationTypeId);
			} else {
				customerSummary.query.bool.must.push(LocationTypeId);
			}
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
			if (!isTechnician && !isCustomer) {
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(ClassificationId);
				assetSummary.aggs.Locations.filter.bool.must.push(ClassificationId);
				alertSummary.query.bool.must.push(ClassificationId);
				technicianSummary.query.bool.must.push(ClassificationId);
				customerSummary.query.bool.must.push(ClassificationId);
			} else if (isTechnician) {
				technicianSummary.query.bool.must.push(ClassificationId);
			} else {
				customerSummary.query.bool.must.push(ClassificationId);
			}
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
			if (!isTechnician && !isCustomer) {
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(SubTradeChannelTypeId);
				assetSummary.aggs.Locations.filter.bool.must.push(SubTradeChannelTypeId);
				alertSummary.query.bool.must.push(SubTradeChannelTypeId);
				technicianSummary.query.bool.must.push(SubTradeChannelTypeId);
				customerSummary.query.bool.must.push(SubTradeChannelTypeId);
			} else if (isTechnician) {
				technicianSummary.query.bool.must.push(SubTradeChannelTypeId);
			} else {
				customerSummary.query.bool.must.push(SubTradeChannelTypeId);
			}
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
			if (!isTechnician && !isCustomer) {
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetTypeId);
				assetSummary.aggs.Locations.filter.bool.must.push(AssetTypeId);
				alertSummary.query.bool.must.push(AssetTypeId);
				technicianSummary.query.bool.must.push(AssetTypeId);
				customerSummary.query.bool.must.push(AssetTypeId);
			} else if (isTechnician) {
				technicianSummary.query.bool.must.push(AssetTypeId);
			} else {
				customerSummary.query.bool.must.push(AssetTypeId);
			}
		}

		if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
			var AssetTypeId = {
				"terms": {
					"AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
				}
			}
			if (!isTechnician && !isCustomer) {
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetTypeId);
				assetSummary.aggs.Locations.filter.bool.must.push(AssetTypeId);
				alertSummary.query.bool.must.push(AssetTypeId);
				technicianSummary.query.bool.must.push(AssetTypeId);
				customerSummary.query.bool.must.push(AssetTypeId);
			} else if (isTechnician) {
				technicianSummary.query.bool.must.push(AssetTypeId);
			} else {
				customerSummary.query.bool.must.push(AssetTypeId);
			}
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
			if (!isTechnician && !isCustomer) {
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(SmartDeviceTypeId);
				assetSummary.aggs.Locations.filter.bool.must.push(SmartDeviceTypeId);
				alertSummary.query.bool.must.push(SmartDeviceTypeId);
				technicianSummary.query.bool.must.push(SmartDeviceTypeId);
				customerSummary.query.bool.must.push(SmartDeviceTypeId);
			} else if (isTechnician) {
				technicianSummary.query.bool.must.push(SmartDeviceTypeId);
			} else {
				customerSummary.query.bool.must.push(SmartDeviceTypeId);
			}
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
			if (!isTechnician && !isCustomer) {
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(City);
				assetSummary.aggs.Locations.filter.bool.must.push(City);
				alertSummary.query.bool.must.push(City);
				technicianSummary.query.bool.must.push(City);
				customerSummary.query.bool.must.push(City);
			} else if (isTechnician) {
				technicianSummary.query.bool.must.push(City);
			} else {
				customerSummary.query.bool.must.push(City);
			}
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
			if (!isTechnician && !isCustomer) {
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(CountryId);
				assetSummary.aggs.Locations.filter.bool.must.push(CountryId);
				alertSummary.query.bool.must.push(CountryId);
				technicianSummary.query.bool.must.push(CountryId);
				customerSummary.query.bool.must.push(CountryId);
			} else if (isTechnician) {
				technicianSummary.query.bool.must.push(CountryId);
			} else {
				customerSummary.query.bool.must.push(CountryId);
			}
		}

		if (request.query.LocationCode || request.query["LocationCode[]"]) {
			var LocationCode = {
				"term": {
					"LocationCode": request.query.LocationCode || request.query["LocationCode[]"]
				}
			}
			if (!isTechnician && !isCustomer) {
				assetSummary.aggs.SmartAssetCount.filter.bool.must.push(LocationCode);
				assetSummary.aggs.Locations.filter.bool.must.push(LocationCode);
				alertSummary.query.bool.must.push(LocationCode);
				technicianSummary.query.bool.must.push(LocationCode);
				customerSummary.query.bool.must.push(LocationCode);
			} else if (isTechnician) {
				technicianSummary.query.bool.must.push(LocationCode);
			} else {
				customerSummary.query.bool.must.push(LocationCode);
			}
		}


		var queries = [];
		if (!isTechnician && !isCustomer) {
			queries.push({
				key: "db",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					type: ["AssetEventDataSummary"],
					body: assetSummary,
					ignore_unavailable: true
				}
			});
			// queries.push({
			// 	key: "totalAssetLocation",
			// 	search: {
			// 		index: 'cooler-iot-asset',
			// 		type: ["Asset"],
			// 		body: totalAssetLocation,
			// 		ignore_unavailable: true
			// 	}
			// });
			queries.push({
				key: "alert",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					type: ["AssetEventDataSummary"],
					body: alertSummary,
					ignore_unavailable: true
				}
			});
			queries.push({
				key: "technician",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					type: ["AssetEventDataSummary"],
					body: technicianSummary,
					ignore_unavailable: true
				}
			});
			queries.push({
				key: "customer",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					type: ["AssetEventDataSummary"],
					body: customerSummary,
					ignore_unavailable: true
				}
			});
		} else if (isTechnician) {
			queries.push({
				key: "technician",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					type: ["AssetEventDataSummary"],
					body: technicianSummary,
					ignore_unavailable: true
				}
			});
		} else {
			queries.push({
				key: "customer",
				search: {
					index: 'cooler-iot-asseteventdatasummary',
					type: ["AssetEventDataSummary"],
					body: customerSummary,
					ignore_unavailable: true
				}
			});
		}
		var promises = [];
		for (var i = 0, len = queries.length; i < len; i++) {
			var query = queries[i];
			var body = {
				from: 0,
				size: 0
			};
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
			if (data.hasOwnProperty('alert')) {
				var dbAggs = data.db.aggregations;
				finalData.alertsByTypeBoth = [];
				data.alert.aggregations.ByType.ByType.buckets.forEach(function (bucket) {
					var total = bucket.AlertOpen.Open.value + bucket.AlertClosed.Closed.value;
					if (bucket.key != 0) {
						finalData.alertsByTypeBoth.push({
							AlertType: bucket.AlarmTypeName.hits.hits[0]._source.SmartDeviceAlarmTypeText,
							Count: total,
							OpenAlert: bucket.AlertOpen.Open.value,
							CloseAlert: bucket.AlertClosed.Closed.value
						});
					}
				});

				finalData.alertsByCoolerModel = [];
				data.alert.aggregations.ByCoolerModel.ByCoolerModel.buckets.forEach(function (bucket) {
					var total = bucket.AlertOpen.Open.value + bucket.AlertClosed.Closed.value;
					if (bucket.key != 0) {
						finalData.alertsByCoolerModel.push({
							CoolerModel: bucket.AssetTypeName.hits.hits[0]._source.AssetType,
							Count: total,
							OpenAlert: bucket.AlertOpen.Open.value,
							CloseAlert: bucket.AlertClosed.Closed.value
						});
					}
				});


				finalData.alertsByCapacityType = [];
				data.alert.aggregations.ByCapacityType.ByCapacityType.buckets.forEach(function (bucket) {
					var total = bucket.AlertOpen.Open.value + bucket.AlertClosed.Closed.value;
					if (bucket.key != 0) {
						finalData.alertsByCapacityType.push({
							CapacityType: bucket.CapacityName.hits.hits[0]._source.CapacityType,
							Count: total,
							OpenAlert: bucket.AlertOpen.Open.value,
							CloseAlert: bucket.AlertClosed.Closed.value
						});
					}
				});

				var dateKeys = {};
				finalData.alertsByWeek = [];
				data.alert.aggregations.AlertsCreatedByWeek.AlertsCreatedByWeek.byWeek.buckets.forEach(function (bucket) {
					var record = {
						Date: bucket.key_as_string,
						Created: bucket.Total.value,
						Closed: 0,
						ActiveAlert: 0
					};
					if (!dateKeys[moment(bucket.key).isoWeek()]) {
						dateKeys[moment(bucket.key).isoWeek()] = record;
						finalData.alertsByWeek.push(record);
					} else {
						dateKeys[moment(bucket.key).isoWeek()].Created += bucket.Total.value;
					}
				});

				data.alert.aggregations.AlertsOpenByWeek.Bands.Bands.buckets.forEach(function (bucket) {
					var record = dateKeys[moment(bucket.from_as_string).isoWeek()];
					if (record) {
						record.ActiveAlert += bucket.Open.value;
					}
				});

				data.alert.aggregations.AlertsClosedByWeek.AlertsClosedByWeek.byWeek.buckets.forEach(function (bucket) {
					var record = dateKeys[moment(bucket.key).isoWeek()];
					if (record) {
						record.Closed += bucket.Closed.value;
					}
				});

				//var totalAssetLocation = data.totalAssetLocation.aggregations;
				var totalAsset = dbAggs.AssetCount.AssetCount.buckets.length;
				finalData.summary = {
					totalCooler: totalAsset,
					totalCustomer: dbAggs.LocationCount.LocationCount.buckets.length,
					filteredAssets: dbAggs.AssetCount.AssetCount.buckets.length,
					filteredOutlets: dbAggs.Locations.Locations.buckets.length,
					totalSmartAssetCount: dbAggs.SmartAssetCount.SmartAssetCount.buckets.length,
					smartAssetCount: dbAggs.SmartAssetCount.SmartAssetCount.buckets.length,
					locationAlarmRate: data.alert.aggregations.AlertCountBoth.AlertCountBoth.LocationsCount.value,
					assetAlarmRate: data.alert.aggregations.AlertCountBoth.AlertCountBoth.AssetCount.value,
					closedAlarm: data.alert.aggregations.AlertCloseCount.AlertCloseCount.Closed.value,
					openAlert: data.alert.aggregations.AlertOpenCount.AlertOpenCount.Open.value,
					smartAssetCountWareHouse: dbAggs.SmartAssetCount.SmartAssetCount.buckets.length,
					totalNoOfAlarms: data.alert.aggregations.TotalAlert.TotalAlert.Total.value
				};
			}
			if (data.hasOwnProperty('customer')) {
				finalData.alertsByCustomer = [];
				data.customer.aggregations.ByCustomerType.ByCustomerType.buckets.forEach(function (bucket) {
					var total = bucket.AlertOpen.Open.value + bucket.AlertClosed.Closed.value;
					if (bucket.key != 0) {
						finalData.alertsByCustomer.push({
							Customer: bucket.LocationName.hits.hits[0]._source.LocationName,
							Count: total,
							OpenAlert: bucket.AlertOpen.Open.value,
							CloseAlert: bucket.AlertClosed.Closed.value
						});
					}
				});
			}
			if (data.hasOwnProperty('technician')) {
				finalData.alertsByTechnician = [];
				data.technician.aggregations.ByTechnicianType.ByTechnicianType.buckets.forEach(function (bucket) {
					var total = bucket.AlertOpen.Open.value + bucket.AlertClosed.Closed.value;
					if (bucket.key != 0) {
						finalData.alertsByTechnician.push({
							Technician: bucket.TechnicianName.hits.hits[0]._source.Technician,
							Count: total,
							OpenAlert: bucket.AlertOpen.Open.value,
							CloseAlert: bucket.AlertClosed.Closed.value
						});
					}
				});
			}

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