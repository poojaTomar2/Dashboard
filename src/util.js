'use strict';
const nodemailer = require('nodemailer');
var Boom = require('boom');
var config = require('./config');
var path = require('path');
var fs = require('fs');
var moment = require('moment');
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
module.exports = {
	/*
		directory: directory name to scan
		ignoredFiles: array of files to ignored (optional - defaults to none)
		extensions: extensions to include (optional - defaults to all)
	*/
	loadFiles: function (options) {
		var ignoredFiles = options.ignoredFiles || [];
		var modules = [];
		var directory = options.directory;
		var extensions = options.extensions;
		fs.readdirSync(directory).forEach(function (file) {

			if (extensions) {
				var extName = path.extname(file);
				if (extensions.indexOf(extName) === -1) {
					return;
				}
			}

			if (ignoredFiles.indexOf(file) > -1) return;

			var Module = require(path.join(directory, file));

			var moduleName = path.basename(file, '.js');
			moduleName = options.upperCase !== false ? (moduleName.substr(0, 1).toUpperCase() + moduleName.substr(1)) : moduleName;

			modules[moduleName] = Module;
		});
		return modules;
	},

	// convert this to promises?
	doSynchronousLoop: function (data, processData, done) {
		if (data.length > 0) {
			var loop = function (data, i, processData, done) {
				processData(data[i], i, function () {
					if (++i < data.length) {
						setTimeout(function () {
							loop(data, i, processData, done);
						}, 0);
					} else {
						done();
					}
				});
			};
			loop(data, 0, processData, done);
		} else {
			done();
		}
	},

	getDateFromMonth: function (values, isQuarterly, dayOfWeek, yearWeek, isTrend) {
		var dateFilter = [],
			startWeek = 0,
			endWeek = 0,
			startDate, endDate,
			weekNumber;
		var months;
		for (var i = 0, len = values.length; i < len; i++) {
			startDate = moment().month(isQuarterly ? values[i] - 1 == 0 ? values[i] - 1 : (values[i] - 1) * 3 : values[i] - 1).date(1).format('YYYY-MM-DD[T00:00:00]');
			endDate = moment().month(isQuarterly ? (values[i] * 3) - 1 : values[i] - 1).endOf('month').format('YYYY-MM-DD[T23:59:59]');
			if (yearWeek) {
				for (var j = 0, length = yearWeek.length; j < length; j++) {
					weekNumber = yearWeek[j];
					if (isTrend) {
						weekNumber = weekNumber - yearWeek.length
					}
					dateFilter.push.apply(dateFilter, this.getDateFromWeekDay(weekNumber, dayOfWeek, moment(startDate), moment(endDate)));
				}
			} else if (dayOfWeek) {
				startWeek = moment.utc(startDate).week();
				endWeek = moment.utc(endDate).week();

				var startYear = moment.utc(startDate).year();
				var endYear = moment.utc(endDate).year();
				var currentYear = moment.utc().year();
				if (currentYear > startYear) {
					//	var weekinYear = moment.utc(params.startDate).weeksInYear();
					var weekinYear = moment.utc(startDate).weeksInYear();
					startWeek = startWeek - weekinYear * (currentYear - startYear);
					endWeek = endWeek - weekinYear * (currentYear - endYear);
				}
				for (var k = startWeek; k <= endWeek; k++) {
					dateFilter.push.apply(dateFilter, this.getDateFromWeekDay(k, dayOfWeek, moment(startDate), moment(endDate)));
				}
			} else {
				if ((moment(startDate).year() == moment(endDate).year()) && (moment(startDate).month() == moment(endDate).month())) {
					var daysinMonth = moment(startDate).daysInMonth();
					var diffDays = Number((moment(endDate).diff(moment(startDate), 'days', 1)).toFixed(2));
					months = diffDays / daysinMonth;
				} else {
					months = moment(endDate).diff(moment(startDate), 'months', true)
				}
				dateFilter.push({
					startDate: startDate,
					endDate: endDate,
					totalHours: moment(endDate).diff(moment(startDate), 'hours') + 1,
					months: months,
				});
			}
		}
		return dateFilter;
	},

	getClientIP: function (req) {
		return req.info && req.info.remoteAddress ? req.info.remoteAddress : '';
	},

	getDateFromWeekDay: function (yearWeek, dayOfWeek, startDateDayWeek, endDateDayWeek) {
		yearWeek = Number(yearWeek);
		var dateFilter = [];
		if (!startDateDayWeek) {
			//yearWeek = yearWeek + 1;
		}
		if (dayOfWeek) {
			if (!Array.isArray(dayOfWeek)) {
				dayOfWeek = [dayOfWeek];
			}
			for (var i = 0, len = dayOfWeek.length; i < len; i++) {
				var startDate = moment.utc().day(dayOfWeek[i]).week(yearWeek).format('YYYY-MM-DD[T00:00:00]');
				var endDate = moment.utc().day(dayOfWeek[i]).week(yearWeek).format('YYYY-MM-DD[T23:59:59]');

				if ((startDateDayWeek && startDateDayWeek.diff(startDate) > 0) || (endDateDayWeek && endDateDayWeek.diff(endDate) < 0)) {
					continue;
				}
				dateFilter.push({
					startDate: startDate,
					endDate: endDate,
					totalHours: moment(endDate).diff(moment(startDate), 'hours') + 1,
					months: moment(endDate).diff(moment(startDate), 'months', true),
				});
			}
		} else {
			var startDate = moment.utc().week(yearWeek).startOf('week').toDate();
			var endDate = moment.utc().week(yearWeek).endOf('week').toDate();

			if ((startDateDayWeek && startDateDayWeek.diff(startDate) > 0) || (endDateDayWeek && endDateDayWeek.diff(endDate) < 0)) {
				startDate = startDateDayWeek.format('YYYY-MM-DD[T00:00:00]');
				if (startDateDayWeek.diff(endDate) > 0) {
					endDate = startDateDayWeek.format('YYYY-MM-DD[T23:59:59]');
				}
			}
			dateFilter.push({
				startDate: startDate,
				endDate: endDate,
				totalHours: moment(endDate).diff(moment(startDate), 'hours') + 1,
				months: moment(endDate).diff(moment(startDate), 'months', true),
			});
		}
		return dateFilter;
	},

	getEventsIndexName: function (start, end, index) {
		var startDate;
		var endDate;
		if (!index) {
			index = "cooler-iot-event-";
		}
		if (!start) {
			startDate = moment().subtract(1, 'months').startOf('month');
			endDate = moment().subtract(1, 'months').endOf('month');
		} else {
			var startDate = moment(start);
			var endDate = moment(end);
		}
		var toReturn = [];
		while (startDate.startOf('month') <= endDate && startDate.year() <= endDate.year()) {
			if (startDate > moment()) {
				break;
			} else {
				var indexName = index + (startDate.year()) + "-" + ((startDate.month() + 1).toString().length == 1 ? "0" + (startDate.month() + 1) : startDate.month() + 1);
				toReturn.push(indexName);
				startDate.add(1, 'months');
			}
		}

		if (toReturn.length == 0) {
			var indexNames = index + (startDate.year()) + "-" + ((startDate.month() + 1).toString().length == 1 ? "0" + (startDate.month() + 1) : startDate.month() + 1);
			toReturn.push(indexNames);
		}

		return toReturn.join();

	},
	//===========add ids in index for CTF=================//
	pushDateQuery: function (request, dateRangeQuery) {
		for (var i = 0; i < request.query.bool.filter.length; i++) {
			if (request.query.bool.filter[i].bool) {
				request.query.bool.filter[i].bool.should.push(dateRangeQuery);
			}
		}
		return request;
	},
	pushDateQueryCurrent: function (request, dateRangeQuery) {
		for (var i = 0; i < request.aggs.Current.filter.bool.filter.length; i++) {
			if (request.aggs.Current.filter.bool.filter[i].bool) {
				request.aggs.Current.filter.bool.filter[i].bool.should.push(dateRangeQuery);
			}
		}
		return request;
	},
	pushDateQueryCurrentHealth: function (request, dateRangeQuery) {
		request.aggs.CurrentHoursCorrectTemperature.filter.bool.filter[0].bool.should.push(dateRangeQuery);
		request.aggs.CurrentNotTempHours.filter.bool.filter[0].bool.should.push(dateRangeQuery);
		request.aggs.CurrentHoursLightOn.filter.bool.filter[0].bool.should.push(dateRangeQuery);
		return request;
	},
	pushDateQueryPrevious: function (request, dateRangeQuery) {
		for (var i = 0; i < request.aggs.Previous.filter.bool.filter.length; i++) {
			if (request.aggs.Previous.filter.bool.filter[i].bool) {
				request.aggs.Previous.filter.bool.filter[i].bool.should.push(dateRangeQuery);
			}
		}
		return request;
	},
	pushDateQueryPreviousHealth: function (request, dateRangeQuery) {
		request.aggs.PreviousHoursCorrectTemperature.filter.bool.filter[0].bool.should.push(dateRangeQuery);
		request.aggs.PrevioustNotTempHours.filter.bool.filter[0].bool.should.push(dateRangeQuery);
		request.aggs.PreviousHoursLightOn.filter.bool.filter[0].bool.should.push(dateRangeQuery);
		return request;
	},
	pushDateQueryMonthBack: function (request, dateRangeQuery) {
		for (var i = 0; i < request.aggs.MonthBack.filter.bool.filter.length; i++) {
			if (request.aggs.MonthBack.filter.bool.filter[i].bool) {
				request.aggs.MonthBack.filter.bool.filter[i].bool.should.push(dateRangeQuery);
			}
		}
		return request;
	},
	pushDateQueryMonthBackHealth: function (request, dateRangeQuery) {
		request.aggs.MonthBackHoursCorrectTemperature.filter.bool.filter[0].bool.should.push(dateRangeQuery);
		request.aggs.MonthBackNotTempHours.filter.bool.filter[0].bool.should.push(dateRangeQuery);
		request.aggs.MonthBackHoursLightOn.filter.bool.filter[0].bool.should.push(dateRangeQuery);
		return request;
	},
	pushDateQueryAllCPI: function (request, dateRangeQuery) {
		for (var i = 0; i < request.aggs.CPI.filter.bool.filter.length; i++) {
			if (request.aggs.CPI.filter.bool.filter[i].bool) {
				request.aggs.CPI.filter.bool.filter[i].bool.should.push(dateRangeQuery);
			}
		}
		return request;
	},
	pushDateQueryCPI: function (request, dateRangeQuery) {
		request.aggs.CPIHoursCorrectTemperature.filter.bool.filter[0].bool.should.push(dateRangeQuery);
		request.aggs.CPINotTempHours.filter.bool.filter[0].bool.should.push(dateRangeQuery);
		request.aggs.CPIHoursLightOn.filter.bool.filter[0].bool.should.push(dateRangeQuery);
		return request;
	},
	applyChartClickFilter: function (params, bool, dateFilterOn, onlySmaller, onlySmallerStartDate, onlyGreater) {

		if (params["isChartClicked"]) {
			bool.filter.push({
				"range": {
					[dateFilterOn]: {
						"lte": "now"
					}
				}
			});
		}


	},
	applyDateFilter: function (params, bool, dateFilterOn, onlySmaller, onlySmallerStartDate, onlyGreater) {

		if (params["dayOfWeek[]"]) {
			params.dayOfWeek = params["dayOfWeek[]"];
		}
		if (params["yearWeek[]"]) {
			params.yearWeek = params["yearWeek[]"];
		}
		if (params["quarter[]"]) {
			params.quarter = params["quarter[]"];
		}
		if (params["month[]"]) {
			params.month = params["month[]"];
		}
		var totalHours = 0
		var isSelectedDateFilter = params.yearWeek || params.dayOfWeek || params.quarter || params.month;
		if (!isSelectedDateFilter && !params.startDate && !params.endDate) {
			if (onlySmaller) {
				bool.filter.push({
					"range": {
						[dateFilterOn]: {
							"lte": "now"
						}
					}
				});
			} else {
				bool.filter.push({
					"range": {
						[dateFilterOn]: {
							"gte": "now-30d/d"
						}
					}
				});
			}
		} else if (!isSelectedDateFilter && params.startDate && params.endDate) {
			if (onlySmallerStartDate) {
				bool.filter.push({
					"range": {
						[dateFilterOn]: {
							"lt": params.startDate
						}
					}
				});
			} else if (onlyGreater) {
				bool.filter.push({
					"range": {
						[dateFilterOn]: {
							"gt": params.endDate
						}
					}
				});
			} else if (onlySmaller) {
				bool.filter.push({
					"range": {
						[dateFilterOn]: {
							"lte": params.endDate
						}
					}
				});
			} else {
				bool.filter.push({
					"range": {
						[dateFilterOn]: {
							"gte": params.startDate,
							"lte": params.endDate
						}
					}
				});
			}
			totalHours = moment(params.endDate).diff(moment(params.startDate), 'hours') + 1;
			params.totalDays = moment.duration(totalHours, 'hours').asDays();
		}
		if (isSelectedDateFilter) {
			var dateFilter = [];
			var shouldArr = []
			if (params.quarter && !params.month) {
				dateFilter.push.apply(dateFilter, this.getDateFromMonth(Array.isArray(params.quarter) ? params.quarter : [params.quarter], true, params.dayOfWeek, params.yearWeek ? Array.isArray(params.yearWeek) ? params.yearWeek : [params.yearWeek] : params.yearWeek, false));
			} else if (params.month) {
				dateFilter.push.apply(dateFilter, this.getDateFromMonth(Array.isArray(params.month) ? params.month : [params.month], false, params.dayOfWeek, params.yearWeek ? Array.isArray(params.yearWeek) ? params.yearWeek : [params.yearWeek] : params.yearWeek, false));
			} else if (params.yearWeek) {
				if (Array.isArray(params.yearWeek)) {
					for (var i = 0, len = params.yearWeek.length; i < len; i++) {
						dateFilter.push.apply(dateFilter, this.getDateFromWeekDay(params.yearWeek[i], params.dayOfWeek));
					}
				} else {
					dateFilter.push.apply(dateFilter, this.getDateFromWeekDay(params.yearWeek, params.dayOfWeek));
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
					dateFilter.push.apply(dateFilter, this.getDateFromWeekDay(i, params.dayOfWeek));
				}
			}

			for (var i = 0, len = dateFilter.length; i < len; i++) {
				var filterDate = dateFilter[i];
				var startDate = filterDate.startDate,
					endDate = filterDate.endDate;
				totalHours += filterDate.totalHours;
				if (onlySmallerStartDate) {
					shouldArr.push({
						"range": {
							[dateFilterOn]: {
								"lt": startDate
							}
						}
					});
				} else if (onlyGreater) {
					shouldArr.push({
						"range": {
							[dateFilterOn]: {
								"gt": endDate
							}
						}
					});
				} else if (onlySmaller) {
					shouldArr.push({
						"range": {
							[dateFilterOn]: {
								"lte": endDate
							}
						}
					});
				} else {
					shouldArr.push({
						"range": {
							[dateFilterOn]: {
								"gte": startDate,
								"lte": endDate
							}
						}
					});
				}
			}
			bool["filter"].push({
				"bool": {
					"should": shouldArr
				}
			});
			params.totalDays = moment.duration(totalHours, 'hours').asDays();
		}
	},

	applyReducers: function (request, params, totalHours, reducers, callback) {

		var outletReducer = require('./controllers/reducers/outlet');
		var smartDeviceInstallationDateReducer = require('./controllers/reducers/smartDeviceInstallationDate');
		var smartDeviceLatestDataReducer = require('./controllers/reducers/smartDeviceLatestData');
		var smartDeviceLastDataReducer = require('./controllers/reducers/smartDeviceLastData');
		var salesRepReducer = require('./controllers/reducers/salesRep');
		var userSalesHierarchyReducer = require('./controllers/reducers/userSalesHierarchy');
		var alertReducer = require('./controllers/reducers/alert');
		var assetReducer = require('./controllers/reducers/asset');
		var hierarchyReducer = require('./controllers/reducers/hierarchyoutlet');
		var multiTerritoryReducer = require('./controllers/reducers/multiTerritoryOutlet');
		var batteryReportReducer = require('./controllers/reducers/batteryReport');
		var smartDeviceReducer = require('./controllers/reducers/smartDevice');
		var smartDeviceMovementReducer = require('./controllers/reducers/smartDeviceMovement');
		var smartDevicDoorStatusReducer = require('./controllers/reducers/smartDevicDoorStatus');
		var smartDeviceDoorTargetReducer = require('./controllers/reducers/smartDeviceDoorTarget');
		var smartDevicHealthReducer = require('./controllers/reducers/smartDeviceHealthRecord');
		var smartDevicePowerReducer = require('./controllers/reducers/smartDevicePowerRecord');
		var smartDeviceTelemetryHealth = require('./controllers/reducers/smartDeviceTelemetryHealth');
		var smartDeviceTelemetryDoor = require('./controllers/reducers/smartDeviceTelemetryDoor');
		var fallenMagnet = require('./controllers/reducers/fallenMagnet');
		var smartDeviceTelemetryMissing = require('./controllers/reducers/smartDeviceTelemetryMissingData');
		var smartDeviceTechnicalDiagnosticsReducer = require('./controllers/reducers/smartDeviceTechnicalDiagnostics');
		var salesReducer = require('./controllers/reducers/sales');
		var coolerTrackingReducer = require('./controllers/reducers/smartDeviceCoolerTracking');
		var coolerTrackingReducerProximity = require('./controllers/reducers/smartDeviceCoolerTrackingProximity');
		var smartDeviceAssetTypeCapacityThresholdReducer = require('./controllers/reducers/smartDeviceAssetTypeCapacityThreshold');
		var smartDeviceAssetTypeCapacityReducer = require('./controllers/reducers/smartDeviceAssetTypeCapacity');
		var smartDeviceNoInterruptionsReducer = require('./controllers/reducers/smartDeviceHealthInterruption');
		var elasticClient = require('./models').elasticClient;
		var dataDownloadLOutlet = require('./controllers/reducers/dataDownloadLOutlet');
		var executedcommand = require('./controllers/reducers/executedcommand');
		var assetevent = require('./controllers/reducers/assetEventData');
		var newparamas = Object.assign({}, params);
		//For all filter "No Data" Operation if applicable  

		newparamas["AssetId"] = [];

		// if ((params.telemetryDoorCount && params.telemetryDoorCount.indexOf("7") == 0) ||
		// 	(params.telemetryPowerStatus && params.telemetryPowerStatus.indexOf("7") == 0) ||
		// 	(params.telemetryPowerStatus && params.telemetryPowerStatus.indexOf("8") == 0) ||
		// 	(params.CompressorBand && params.CompressorBand.indexOf("7") == 0) ||
		// 	(params.FanBand && params.FanBand.indexOf("7") == 0) ||
		// 	(params.TemperatureTele && params.TemperatureTele.indexOf("6") == 0) ||
		// 	(params.EvaporatorTemperatureTele && params.EvaporatorTemperatureTele.indexOf("6") == 0) ||
		// 	(params.DataDownloaded && params.DataDownloaded.indexOf("2") == 0) ||
		// 	(params.LastDataDownloaded && params.LastDataDownloaded.indexOf("1") == 0) ||
		// 	(params.isFromGrid == "true")) {

		// 	params["AssetId"] = [];
		// 	params["LocationId"] = [];
		// }
		params["AssetId"] = [];
		params["LocationId"] = [];
		if (params.batteryReprtData || params["batteryReprtData[]"]) {
			params["customQuerybattery"] = true;
		}
		assetevent(request, params, "AssetId").then(function (assetIds) {
			if (assetIds) {
				//Assets for calcutate No data 
				this.assetIds = assetIds;
				params["NoDataAssetIds[]"] = assetIds.length != 0 ? assetIds : [-1];
				params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
			}
			assetevent(request, params, "LocationId").then(function (locationIds) {
				if (locationIds) {
					this.locationIds = locationIds;
					// params["NoDataAssetIds[]"] = assetIds.length != 0 ? assetIds : [-1];
					params["LocationId[]"] = locationIds.length != 0 ? locationIds : [-1];
				}
				// 	outletReducer(request, params, "LocationId").then(function (LocationId) {
				// 		if (LocationId) {
				// 			//Assets for calcutate No data 
				// 			this.locationIds = LocationId;
				// 			params["CTFLocationId[]"] = LocationId.length != 0 ? LocationId : [-1];
				// 			params["LocationId[]"] = LocationId.length != 0 ? LocationId : [-1];
				// 		}

				smartDeviceInstallationDateReducer(request, params, "AssetId").then(function (assetIds) {
					if (assetIds) {
						params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
						this.assetIds = params["AssetId[]"];
					}
					smartDeviceLatestDataReducer(request, params, "AssetId").then(function (assetIds) {
						if (assetIds) {
							params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
						}

						if (params.DoorCount || params["DoorCount[]"]) {
							params["fromDoorScreen"] = true;
							params["customQueryDoor"] = true;
						}
						if (params.Displacement_To || params.Displacement_From || params["Displacement_To[]"] || params["Displacement_From[]"]) {
							params["fromMovementScreen"] = true;
							params.daysMovement = moment.duration(totalHours, 'hours').asDays();
						}

						if (params.DisplacementFilter) {
							params["fromMovementScreen"] = true;
							params.daysMovement = moment.duration(totalHours, 'hours').asDays();
						}

						smartDeviceMovementReducer(request, params, "AssetId").then(function (assetIds) {
							if (assetIds) {
								params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
								this.assetIds = params["AssetId[]"];
							}
							//if (params.DisplacementFilter || params["DisplacementFilter[]"]) {
							delete params["fromMovementScreen"];
							delete params.daysMovement;
							delete params.DisplacementFilter;
							//}
							if (params.DisplacementFilterHistoric || params["DisplacementFilterHistoric[]"]) {
								params["fromMovementScreenHistoric"] = true;
								params["DisplacementHistoric"] = params.DisplacementFilterHistoric || params["DisplacementFilterHistoric[]"];
								params.daysMovement = moment.duration(totalHours, 'hours').asDays();
							}
							smartDeviceMovementReducer(request, params, "AssetId").then(function (assetIds) {
								if (assetIds) {
									params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
									this.assetIds = params["AssetId[]"];
								}

								if (params.DisplacementFilterHistoric || params["DisplacementFilterHistoric[]"]) {
									delete params["fromMovementScreenHistoric"];
									delete params.daysMovement;
									delete params["DisplacementHistoric"];
								}


								if (params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) {
									params["fromDoorScreen"] = true;
									params["customQueryDoor"] = true;
									params["doorTarget"] = true;


									if (params['NoDataAssetIds[]'].length > 0) {
										params["AssetId[]"] = params['NoDataAssetIds[]'];
									}

								}

								if (params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) {
									params["fromDoorScreen"] = true;
									params["customQueryDoor"] = true;
									params["doorTarget"] = true;

								}

								smartDeviceDoorTargetReducer(request, params, "AssetId").then(function (assetIds) {
									delete params["fromDoorScreen"];
									delete params["customQueryDoor"];
									//delete params["LocationId[]"];

									if (assetIds) {
										params["doorTargetAssets"] = assetIds.length != 0 ? assetIds : [-1];
									}

									if (params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) {
										params["fromSalesScreen"] = true;
										params["customQuerySales"] = true;
										params["salesTarget"] = true;
										//	params["LocationId"] = [];
									}

									if (params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) {

										params["AssetTypeCapacity"] = true;
										params["DoorSwingsVsTargetAssetTypeCapacity"] = true;
									}

									smartDeviceAssetTypeCapacityReducer(request, params, "AssetId").then(function (assetIds) {

										if (assetIds) {
											params["AssetTypeCapacityData"] = assetIds;
										}

										if (params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) {

											params["AssetTypeCapacityThresholdCountry"] = request.auth.credentials.tags.FirstName;
											params["DoorSwingsVsTargetAssetTypeCapacityThreshold"] = true;
										}
										smartDeviceAssetTypeCapacityThresholdReducer(request, params, "AssetId").then(function (assetIds) {
											if (assetIds) {
												params["AssetTypeCapacityDataThreshold"] = assetIds;
											}

											// delete params["fromDoorScreen"];
											// delete params["customQueryDoor"];
											// delete params["LocationId[]"];

											// if (assetIds) {
											// 	params["doorTargetAssets"] = assetIds.length != 0 ? assetIds : [-1];
											// }

											if (params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) {
												params["fromSalesScreen"] = true;
												params["customQuerySales"] = true;
												params["salesTarget"] = true;
											}

											salesReducer(request, params, "LocationId").then(function (locationIds) {
												if (locationIds) {
													delete params.LocationId;
													params["LocationId[]"] = locationIds.length != 0 ? locationIds : [-1];
													this.locationIds = params["LocationId[]"];
												}

												if (params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) {
													delete params["fromDoorScreen"];
													delete params["customQueryDoor"];
													delete params["doorTarget"];
													delete params["LocationId[]"];
												}

												if (params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) {
													delete params["fromDoorScreen"];
													delete params["customQueryDoor"]
													delete params["doorTarget"];
												}

												if (params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) {
													delete params["fromSalesScreen"];
													delete params["customQuerySales"];
													delete params["salesTarget"];
													//params["LocationId"] = [];
												}


												if (locationIds) {
													params["salesTargetAssets[]"] = locationIds.length != 0 ? locationIds : [-1];
												}


												// if (params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) {
												// 	params["customQueryDoorSwing"] = true;
												// 	if (params['CTFLocationId[]'].length > 0) {
												// 		params["LocationId[]"] = params['CTFLocationId[]'];
												// 	}
												// 	params["smartdevicemanufactureidcheck"] = params.SmartDeviceManufacturerId;
												// }

												// if (params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) {
												// 	params["customQueryDoorSwing"] = true;
												// }
												// assetReducer(request, params, "LocationId").then(function (locationIds) {
												// 	delete params["customQueryDoorSwing"];
												// 	delete params["LocationId[]"];
												// 	if (locationIds) {
												// 		delete params.LocationId;
												// 		params["LocationId[]"] = locationIds.length != 0 ? locationIds : [-1];
												// 	}
												if (params.TempBand || params["TempBand[]"]) {
													params["fromHealthScreen"] = true;
													params["customQueryHealth"] = true;
												}
												if (params.LightStatus || params["LightStatus[]"]) {
													params["fromLightScreen"] = true;
													params["customQueryHealth"] = true;
												}

												smartDevicHealthReducer(request, params, "AssetId").then(function (assetIds) {
													if (assetIds) {
														params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
													}

													if (params.PowerStatus || params["PowerStatus[]"]) {
														params.PowerBand = params.PowerStatus || params["PowerStatus[]"];
														params["fromPowerScreen"] = true;
														params["customQueryPower"] = true;
													}
													//No interruptions when selected single filter
													if (params.telemetryPowerStatus == "8" || params.telemetryPowerStatus == "7") {

														params["AssetInterruption"] = true;
														params["customQueryHealthInteruption"] = true;
													}
													//No interruption reducer when selected more than 1 filter
													if (params["telemetryPowerStatus[]"]) {
														if (params["telemetryPowerStatus[]"].indexOf("7") == "1" || params["telemetryPowerStatus[]"].indexOf("8") == "1") {

															params["AssetInterruption"] = true;
															params["customQueryHealthInteruption"] = true;
														}
													}
													if (params.telemetryPowerStatus) {
														if (params.telemetryPowerStatus.length > 1) {
															if (params.telemetryPowerStatus.indexOf("8") == "1" || params.telemetryPowerStatus.indexOf("7") == "1") {

																params["AssetInterruption"] = true;
																params["customQueryHealthInteruption"] = true;
															}
														}
													}

													smartDeviceNoInterruptionsReducer(request, params, "AssetId").then(function (assetIds) {
														delete params["AssetInterruption"];
														delete params["customQueryHealthInteruption"];
														if (assetIds) {
															params["AssetidInterruptions[]"] = assetIds.length != 0 ? assetIds : [-1]; //generate new variable for store No interruptions value
															params["AssetId[]"] = params["NoDataAssetIds[]"];
														}

														if (params.telemetryPowerStatus || params["telemetryPowerStatus[]"]) {
															params.telemetryPowerStatus = params.telemetryPowerStatus || params["telemetryPowerStatus[]"];
															params["fromPowerScreen"] = true;
															params["customQueryPower"] = true;
															params["smartdevicemanufactureidPower"] = params.SmartDeviceManufacturerId;
															params["OutletTypeIdPower"] = params.OutletTypeId;
														}

														if (params.OperationalIssues && (params.OperationalIssues.indexOf("5") != -1 || params.OperationalIssues.indexOf("6") != -1)) {
															params.OperationalIssuesPower = params.OperationalIssues || params["OperationalIssues[]"];
															params["fromPowerScreen"] = true;
															params["customQueryPower"] = true;
															params["smartdevicemanufactureidPower"] = params.SmartDeviceManufacturerId;
															params["OutletTypeIdPower"] = params.OutletTypeId;
														}

														smartDevicePowerReducer(request, params, "AssetId").then(function (assetIds) {

															delete params["fromPowerScreen"];
															delete params["customQueryPower"];
															if (assetIds) {
																params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
																this.assetIds = params["AssetId[]"];
															}

															if ((params.CoolerPerformanceIndex && params.CoolerPerformanceIndex.indexOf("2") != -1)) {
																params["customQueryLastDownloaded"] = true;
															}

															if (params.DataDownloaded || params["DataDownloaded[]"]) {
																params.DataDownloaded = params.DataDownloaded || params["DataDownloaded[]"];
																//params["fromPowerScreen"] = true;
																params["customQueryLastDownloaded"] = true;
																params["smartdevicemanufactureidDownload"] = params.SmartDeviceManufacturerId;
																params["OutletTypeIdDownload"] = params.OutletTypeId;
															}

															if (params.LastDataDownloaded || params["LastDataDownloaded[]"]) {
																params.LastDataDownloaded = params.LastDataDownloaded || params["LastDataDownloaded[]"];
																//params["fromPowerScreen"] = true;
																params["customQueryLastDataDownloaded"] = true;
																params["smartdevicemanufactureidDownload"] = params.SmartDeviceManufacturerId;
																params["OutletTypeIdDownload"] = params.OutletTypeId;
															}

															smartDeviceLastDataReducer(request, params, "AssetId").then(function (assetIds) {
																if (assetIds) {
																	//delete params.LocationId;
																	params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
																	this.assetIds = params["AssetId[]"];
																}

																if (params.OperationalIssues && (params.OperationalIssues.indexOf("5") != -1 || params.OperationalIssues.indexOf("6") != -1) || params["OperationalIssues[]"]) {
																	delete params["OperationalIssuesPower"];
																}

																if (params.OperationalIssues && (params.OperationalIssues.indexOf("1") != -1 || params.OperationalIssues.indexOf("2") != -1 || params.OperationalIssues.indexOf("3") != -1 || params.OperationalIssues.indexOf("4") != -1) || params["OperationalIssues[]"]) {
																	params["OperationalIssuesHealth"] = params.OperationalIssues || params["OperationalIssues[]"];
																	params["customQueryHealthTele"] = true;
																	params["smartdevicemanufactureidTemperature"] = params.SmartDeviceManufacturerId;
																	params["OutletTypeIdTemperature"] = params.OutletTypeId;
																}

																if ((params.CoolerHealth && (params.CoolerHealth.indexOf('1') != -1 || params.CoolerHealth.indexOf('2') != -1)) || params["CoolerHealth[]"] || params.TemperatureTele || params["TemperatureTele[]"] || params.EvaporatorTemperatureTele || params["EvaporatorTemperatureTele[]"] || params.telemetryLightStatus || params["telemetryLightStatus[]"] || params.TempLightIssue || params["TempLightIssue[]"]) {
																	params.TemperatureTele = params.TemperatureTele || params["TemperatureTele[]"];
																	params.EvaporatorTemperatureTele = params.EvaporatorTemperatureTele || params["EvaporatorTemperatureTele[]"];
																	params["customQueryHealthTele"] = true;
																	params.CoolerHealthTele = params.CoolerHealth;
																	params["smartdevicemanufactureidTemperature"] = params.SmartDeviceManufacturerId;
																	params["OutletTypeIdTemperature"] = params.OutletTypeId;
																}
																smartDeviceTelemetryHealth(request, params, "AssetId").then(function (assetIds) {
																	if (assetIds) {
																		params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
																		this.assetIds = params["AssetId[]"];
																	}
																	if (params.AlertTypeId || params.PriorityId || params.StatusId || params["AlertTypeId[]"] || params["PriorityId[]"] || params["StatusId[]"]) {
																		params["fromOutletScreenAlert"] = true;
																	}

																	if (params.OperationalIssues || params["OperationalIssues[]"] || (params.CoolerHealth && (params.CoolerHealth.indexOf('1') != -1 || params.CoolerHealth.indexOf('2') != -1)) || params["CoolerHealth[]"] || params.TemperatureTele || params["TemperatureTele[]"] || params.EvaporatorTemperatureTele || params["EvaporatorTemperatureTele[]"] || params.telemetryLightStatus || params["telemetryLightStatus[]"] || params.TempLightIssue || params["TempLightIssue[]"]) {
																		delete params["customQueryHealthTele"];
																		delete params.TemperatureTele;
																		delete params.EvaporatorTemperatureTele;
																		delete params.TempLightIssue;
																		delete params.CoolerHealth;
																		delete params.OperationalIssuesHealth;
																		delete params["LocationId[]"];
																		delete params.smartdevicemanufactureidTemperature;
																		delete params.OutletTypeIdTemperature;
																	}

																	if (params.MagnetFallenChartCTF || params["MagnetFallenChartCTF[]"]) {
																		params["customMagnetFallenChartCTF"] = true;
																	}
																	if (params.MagnetFallenSpreadCTF || params["MagnetFallenSpreadCTF[]"]) {
																		params["customMagnetFallenChartCTF"] = true;
																	}

																	fallenMagnet(request, params, "AssetId").then(function (assetIds) {
																		if (assetIds) {
																			params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
																			this.assetIds = params["AssetId[]"];
																		}

																		if (params.ExcecuteCommandReport || params["ExcecuteCommandReport[]"]) {
																			params["customExcecuteCommandReport"] = true;
																			params["checklocation"] = true;
																		}
																		if (params.ExcecuteCommandSpread || params["ExcecuteCommandSpread[]"]) {
																			params["customExcecuteCommandSpread"] = true;
																			params["checklocation"] = true;
																		}

																		executedcommand(request, params, "AssetId").then(function (assetIds) {
																			if (assetIds) {
																				params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
																				this.assetIds = params["AssetId[]"];
																			}

																			if (params.telemetryDoorCount || params["telemetryDoorCount[]"]) {
																				params["customQueryDoorTele"] = true;
																				params["smartdevicemanufactureidDoorOpens"] = params.SmartDeviceManufacturerId;
																				params["OutletTypeIdDoorOpens"] = params.OutletTypeId;
																			}

																			if ((params.CoolerPerformanceIndex && params.CoolerPerformanceIndex.indexOf("1") != -1)) {
																				params["customQueryDoorTele"] = true;
																			}


																			if (params.CoolerHealth && params.CoolerHealth.indexOf("3") != -1) {
																				params.CoolerHealthLowUti = params.CoolerHealth || params["CoolerHealth[]"];
																				params["customQueryDoorTele"] = true;
																				params["smartdevicemanufactureidDoorOpens"] = params.SmartDeviceManufacturerId;
																				params["OutletTypeIdDoorOpens"] = params.OutletTypeId;
																			}

																			smartDeviceTelemetryDoor(request, params, "AssetId").then(function (assetIds) {
																				if (assetIds) {
																					params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
																					this.assetIds = params["AssetId[]"];
																				}

																				if (params.telemetryDoorCount || params["telemetryDoorCount[]"]) {
																					delete params["customQueryDoorTele"];
																					delete params["LocationId[]"];
																					delete params["smartdevicemanufactureidDoorOpens"];
																					delete params["OutletTypeIdDoorOpens"];
																				}

																				// For Cooler Helath > low Utilization Coolers 
																				if (params.CoolerHealth && params.CoolerHealth.indexOf("3") != -1) {
																					delete params["customQueryDoorTele"];
																					delete params["LocationId[]"];
																				}

																				if ((params.CoolerPerformanceIndex && params.CoolerPerformanceIndex.indexOf("1") != -1)) {
																					delete params["customQueryDoorTele"];
																					delete params["LocationId[]"];
																				}

																				if (params.CoolerHealth && params.CoolerHealth.indexOf("4") != -1) {
																					params.CoolerHealthMissing = params.CoolerHealth || params["CoolerHealth[]"];
																					params["customQueryHealthMissing"] = true;
																				}


																				smartDeviceTelemetryMissing(request, params, "AssetId").then(function (assetIds) {
																					if (assetIds) {
																						params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
																					}


																					if (params.CoolerHealth && params.CoolerHealth.indexOf("4") != -1) {
																						delete params.CoolerHealthMissing; //= params.CoolerHealth || params["CoolerHealth[]"];
																						delete params["customQueryHealthMissing"]; //= true;
																					}

																					if (params.AlertTypeId || params.PriorityId || params.StatusId || params["AlertTypeId[]"] || params["PriorityId[]"] || params["StatusId[]"]) {
																						params["fromOutletScreenAlert"] = true;
																					}


																					if (params.CompressorBand || params["CompressorBand[]"] || params.FanBand || params["FanBand[]"]) {
																						params["customQueryTechnical"] = true;
																					}

																					smartDeviceTechnicalDiagnosticsReducer(request, params, "AssetId").then(function (assetIds) {
																						if (assetIds) {
																							params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
																							this.assetIds = params["AssetId[]"];
																						}

																						if (params.CompressorBand || params["CompressorBand[]"] || params.FanBand || params["FanBand[]"]) {
																							delete params["customQueryTechnical"];
																						}

																						if (params.coolerTracking || params["coolerTracking[]"] || params.coolerTrackingProximity || params["coolerTrackingProximity[]"]) {
																							params["customQueryCoolerTracking"] = true;
																							params["CoolerTrackingThreshold"] = Number(request.auth.credentials.tags.CoolerTrackingThreshold);
																							params["CoolerTrackingDisplacementThreshold"] = Number(request.auth.credentials.tags.CoolerTrackingDisplacementThreshold);
																						}

																						coolerTrackingReducer(request, params, "AssetId").then(function (assetIds) {
																							if (assetIds) {
																								params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
																								this.assetIds = params["AssetId[]"];
																							}

																							if (params.coolerTracking || params["coolerTracking[]"]) {
																								delete params["customQueryCoolerTracking"];
																							}

																							if (params.coolerTrackingProximity || params["coolerTrackingProximity[]"]) {
																								delete params["customQueryCoolerTrackingProximity"];
																							}

																							if (params.AlertTypeId || params.PriorityId || params.StatusId || params["AlertTypeId[]"] || params["PriorityId[]"] || params["StatusId[]"]) {
																								params["fromOutletScreenAlert"] = true;
																							}
																							alertReducer(request, params, "AssetId").then(function (assetIds) {
																								if (assetIds) {
																									params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
																									this.assetIds = params["AssetId[]"];
																								}

																								userSalesHierarchyReducer(request, params, "SalesHierarchyId").then(function (salesHierarchyIds) {
																									if (salesHierarchyIds) {
																										params["SalesHierarchyId[]"] = salesHierarchyIds.length != 0 ? salesHierarchyIds : [-1];
																									}

																									salesReducer(request, params, "LocationId").then(function (locationIds) {
																										if (locationIds) {
																											delete params.LocationId;
																											params["LocationId[]"] = locationIds.length != 0 ? locationIds : [-1];
																										}

																										if (params.DataDownloadOutlet || params["DataDownloadOutlet[]"]) {
																											params["customDataDownloadOutlet"] = true;
																											params["smartdevicemanufacture"] = params["SmartDeviceManufacturerId"];
																											params["smartdeviceoutlet[]"] = params["OutletTypeId"];
																										}

																										dataDownloadLOutlet(request, params, "LocationId").then(function (locationIds) {
																											if (locationIds) {
																												params["LocationId[]"] = locationIds.length != 0 ? locationIds : [-1];
																												this.locationIds = params["LocationId[]"];
																											}

																											if (params.DoorCount || params["DoorCount[]"]) {
																												params["fromDoorScreen"] = true;
																												params["customQueryDoor"] = true;
																											}



																											smartDevicDoorStatusReducer(request, params, "AssetId").then(function (assetIds) {
																												delete params["fromDoorScreen"];
																												delete params["customQueryDoor"];
																												if (assetIds) {
																													params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
																													this.assetIds = params["AssetId[]"];
																												}
																												smartDevicDoorStatusReducer(request, params, "LocationId").then(function (locationids) {
																													delete params["fromDoorScreen"];
																													delete params["customQueryDoor"];
																													if (locationids) {
																														params["LocationId[]"] = locationids.length != 0 ? locationids : [-1];
																														this.locationIds = params["LocationId[]"];
																													}
																													// if (params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) {
																													if (params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) {
																														params["customQueryDoorSwing"] = true;
																														// if (params['CTFLocationId[]'].length > 0) {
																														// 	params["LocationId[]"] = params['CTFLocationId[]'];
																														// }
																														params["smartdevicemanufactureidcheck"] = params.SmartDeviceManufacturerId;
																													}

																													if (params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) {
																														params["customQueryDoorSwing"] = true;
																													}

																													if (params.batteryReprtData || params["batteryReprtData[]"]) {
																														params["smartdevicemanufactureidbatterylevel"] = params.SmartDeviceManufacturerId;
																														params["OutletTypeIdbatterylevel"] = params.OutletTypeId;
																													}

																													batteryReportReducer(request, params, "AssetId").then(function (assetIds) {
																														if (assetIds) {
																															params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
																															this.assetIds = params["AssetId[]"];
																														}

																														hierarchyReducer(request, params, "LocationId").then(function (LocationId) {
																															if (LocationId) {
																																//Assets for calcutate No data LocationId
																																this.locationIds = LocationId;
																																params["LocationId"] = LocationId.length != 0 ? LocationId : [-1];
																															}

																															multiTerritoryReducer(request, params, "LocationId").then(function (locationids) {
																																if (locationids) {
																																	//Assets for calcutate No data LocationId
																																	this.locationIds = locationids;
																																	params["LocationId"] = locationids.length != 0 ? locationids : [-1];
																																}
																																// assetReducer(request, params, "LocationId").then(function (LocationId) {
																																// 	if (LocationId) {
																																// 		//Assets for calcutate No data 
																																// 		this.locationIds = LocationId;
																																// 		params["CTFLocationId[]"] = LocationId.length != 0 ? LocationId : [-1];
																																// 		params["LocationId[]"] = LocationId.length != 0 ? LocationId : [-1];

																																// 	}


																																// assetevent(request, params, "AssetId").then(function (assetIds) {
																																// 	if (assetIds) {
																																// 		params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
																																// 		this.assetIds = params["AssetId[]"];
																																// 		params.AssetId = params["AssetId[]"];
																																// 	}
																																// if (params.isFromGrid == "true") {
																																// 	callback(this.assetIds, this.locationIds);
																																// } else {
																																// 	callback();
																																// }
																																if (params.isFromGrid == true || params.isFromGrid == "true") {
																																	callback(this.assetIds, this.locationIds);
																																} else {
																																	if (this.assetIds) {
																																		var id = request.auth.credentials.sid;
																																		elasticClient.index({
																																			index: 'cooler-iot-ctfassets',
																																			id: id,
																																			type: 'assets',
																																			body: {
																																				"AssetId": this.assetIds
																																			}
																																		}, function (err, resp, status) {
																																			console.log("done");
																																			callback();
																																		});
																																	}
																																	// if (this.locationIds) {
																																	// 	elasticClient.index({
																																	// 		index: 'cooler-iot-ctflocations',
																																	// 		id: id,
																																	// 		type: 'locations',
																																	// 		body: {
																																	// 			"LocationId": this.locationIds
																																	// 		}
																																	// 	}, function (err, resp, status) {
																																	// 		console.log("done Location");
																																	// 		callback();
																																	// 	});
																																	// }
																																}
																															}.bind(this)).catch(function (err) {
																																console.log(err);
																																return reply(Boom.badRequest(err.message));
																															});
																														}.bind(this)).catch(function (err) {
																															console.log(err);
																															return reply(Boom.badRequest(err.message));
																														});
																													}.bind(this)).catch(function (err) {
																														console.log(err);
																														return reply(Boom.badRequest(err.message));
																													});
																												}.bind(this)).catch(function (err) {
																													console.log(err);
																													return reply(Boom.badRequest(err.message));
																												});
																											}.bind(this)).catch(function (err) {
																												console.log(err);
																												return reply(Boom.badRequest(err.message));
																											});
																										}.bind(this)).catch(function (err) {
																											console.log(err);
																											return reply(Boom.badRequest(err.message));
																										});
																									}.bind(this)).catch(function (err) {
																										console.log(err);
																										return reply(Boom.badRequest(err.message));
																									});
																								}.bind(this)).catch(function (err) {
																									console.log(err);
																									return reply(Boom.badRequest(err.message));
																								});
																							}.bind(this)).catch(function (err) {
																								console.log(err);
																								return reply(Boom.badRequest(err.message));
																							});
																						}.bind(this)).catch(function (err) {
																							console.log(err);
																							return reply(Boom.badRequest(err.message));
																						});
																					}.bind(this)).catch(function (err) {
																						console.log(err);
																						return reply(Boom.badRequest(err.message));
																					});
																				}.bind(this)).catch(function (err) {
																					console.log(err);
																					return reply(Boom.badRequest(err.message));
																				});
																			}.bind(this)).catch(function (err) {
																				console.log(err);
																				return reply(Boom.badRequest(err.message));
																			});
																		}.bind(this)).catch(function (err) {
																			console.log(err);
																			return reply(Boom.badRequest(err.message));
																		});
																	}.bind(this)).catch(function (err) {
																		console.log(err);
																		return reply(Boom.badRequest(err.message));
																	});
																}.bind(this)).catch(function (err) {
																	console.log(err);
																	return reply(Boom.badRequest(err.message));
																});
															}.bind(this)).catch(function (err) {
																console.log(err);
																return reply(Boom.badRequest(err.message));
															});
														}.bind(this)).catch(function (err) {
															console.log(err);
															return reply(Boom.badRequest(err.message));
														});
													}.bind(this)).catch(function (err) {
														console.log(err);
														return reply(Boom.badRequest(err.message));
													});
												}.bind(this)).catch(function (err) {
													console.log(err);
													return reply(Boom.badRequest(err.message));
												});
											}.bind(this)).catch(function (err) {
												console.log(err);
												return reply(Boom.badRequest(err.message));
											});
										}.bind(this)).catch(function (err) {
											console.log(err);
											return reply(Boom.badRequest(err.message));
										});
									}.bind(this)).catch(function (err) {
										console.log(err);
										return reply(Boom.badRequest(err.message));
									});
								}.bind(this)).catch(function (err) {
									console.log(err);
									return reply(Boom.badRequest(err.message));
								});
							}.bind(this)).catch(function (err) {
								console.log(err);
								return reply(Boom.badRequest(err.message));
							});
						}.bind(this)).catch(function (err) {
							console.log(err);
							return reply(Boom.badRequest(err.message));
						});
					}.bind(this)).catch(function (err) {
						console.log(err);
						return reply(Boom.badRequest(err.message));
					});
				}.bind(this)).catch(function (err) {
					console.log(err);
					return reply(Boom.badRequest(err.message));
				});
			}.bind(this)).catch(function (err) {
				console.log(err);
				return reply(Boom.badRequest(err.message));
			});
		}.bind(this)).catch(function (err) {
			console.log(err);
			return reply(Boom.badRequest(err.message));
		});
	},
	setLogger: function (value) {
		logger.error('-----------------START-------------------------');
		logger.error(value.config.key);
		logger.error(value.response.took);
		logger.error(JSON.stringify(value.config.search.index));
		logger.error(JSON.stringify(value.config.search.body));
		logger.error('----------------END--------------------------');
	},
	mailSent: function (error) {
		nodemailer.createTestAccount((err, account) => {

			// create reusable transporter object using the default SMTP transport
			let transporter = nodemailer.createTransport(config.email);

			if (config.sendErrorMail == false) {
				return;
			}
			if (error.length == 0) {
				return;
			}

			// setup email data with unicode symbols
			let mailOptions = {
				from: config.mailFrom, // sender address
				to: config.mailTo, // list of receivers
				subject: config.mailSubject, //' Dashbaord QA Azure Error', // Subject line
				text: error, // plain text body
				html: error //'<b>Hello world?</b>' // html body
			};
			transporter.sendMail(mailOptions, (error, info) => {
				if (error) {
					return console.log(error);
				}
				//console.log('Message sent: %s', info.messageId);
				// Preview only available when sending through an Ethereal account
				//console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

				// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
				// Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
			});
		});
	}
}