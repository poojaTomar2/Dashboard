"use strict"
var linq = require('node-linq').LINQ,
    fs = require('fs');
var Boom = require('boom');

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
        healthSummaryCoolerTelemetry: JSON.stringify(require('./dashboardQueries/coolerTelemetry/kpiHealthSummary.json')),
        healthSummaryAmbiant: JSON.stringify(require('./dashboardQueries/coolerTelemetry/kpiHealthSummaryAmbiant.json')),
        assetSummaryCoolerTelemetry: JSON.stringify(require('./dashboardQueries/coolerTelemetry/kpiAssetSummary.json')),
        doorSummaryCoolerTelemetry: JSON.stringify(require('./dashboardQueries/coolerTelemetry/kpiDoorSummary.json')),
        kpiSmartDeviceEventTypeSummaryCoolerTelemetry: JSON.stringify(require('./dashboardQueries/coolerTelemetry/kpiSmartDeviceEventTypeSummary.json')),
        assetVisitSummaryCoolerTelemetry: JSON.stringify(require('./dashboardQueries/coolerTelemetry/assetVisitSummary.json')),
        alertSummaryCommercial: JSON.stringify(require('./dashboardQueries/commercial/kpiAlertSummary.json')),
        assetSummaryCommercial: JSON.stringify(require('./dashboardQueries/commercial/kpiAssetSummary.json')),
        assetSummaryPerformance: JSON.stringify(require('./dashboardQueries/coolerPerformance/KpiAssetSwing.json')),
        assetMapInfo: JSON.stringify(require('./dashboardQueries/coolerPerformance/KpiAssetMapInfo.json')),
        LastDataMap: JSON.stringify(require('./dashboardQueries/coolerPerformance/LastDataDownloadMap.json')),
        locationMapInfo: JSON.stringify(require('./dashboardQueries/coolerPerformance/KpiLocationsMapInfo.json')),
        kpiDoorSummaryPieChartCommercial: JSON.stringify(require('./dashboardQueries/commercial/kpiDoorSummaryPieChart.json')),
        kpiSalesSummaryCommercial: JSON.stringify(require('./dashboardQueries/commercial/kpiSalesSummary.json')),
        kpiSalesSummaryTrendCommercial: JSON.stringify(require('./dashboardQueries/commercial/kpiSalesSummaryTrend.json')),
        powerSummaryCommercial: JSON.stringify(require('./dashboardQueries/commercial/kpiPowerSummary.json')),
        kpiLastDataDownloadSummary: JSON.stringify(require('./dashboardQueries/coolerPerformance/kpiLastDataDownloadSummary.json')),
        kpiLastDataDownloadSummaryDays: JSON.stringify(require('./dashboardQueries/coolerPerformance/kpiLastDataDownloadSummaryDays.json')),
        operationalIssue: JSON.stringify(require('./dashboardQueries/coolerPerformance/operationalIssue.json')),
        operationalIssueMap: JSON.stringify(require('./dashboardQueries/coolerPerformance/OperationalIssueMap.json')),
        operationalIssueFormat: JSON.stringify(require('./dashboardQueries/coolerPerformance/OperationalIssueFormatQuery.json')),
        assetTypeCapacity: JSON.stringify(require('./dashboardQueries/coolerPerformance/assetTypeCapacity.json')),
        assetTypeCapacitythreshold: JSON.stringify(require('./dashboardQueries/coolerPerformance/assetTypeCapacityThreshold.json')),
        doorSummaryCoolerPerformance: JSON.stringify(require('./dashboardQueries/coolerPerformance/kpiDoorSummaryPieChart.json')),
        DataDownloadMap: JSON.stringify(require('./dashboardQueries/coolerPerformance/DataDownloadMap.json')),
        DoorAvgDaily: JSON.stringify(require('./dashboardQueries/coolerPerformance/KpiDoorAvgDaily.json')),
        assetSummaryOperational: JSON.stringify(require('./dashboardQueries/coolerPerformance/assetSummaryOperational.json')),
        assetSummaryCoolerTracking: JSON.stringify(require('./dashboardQueries/coolerPerformance/CoolerTrackingChart/kpiAssetSummary.json')),
        ChartCoolerTracking: JSON.stringify(require('./dashboardQueries/coolerPerformance/CoolerTrackingChart/CoolerTrackingInPerformance.json')),
        ChartCoolerTrackingMap: JSON.stringify(require('./dashboardQueries/coolerPerformance/CoolerTrackingChart/CoolerTrackingMap.json')),
        LastDataCPI: JSON.stringify(require('./dashboardQueries/coolerPerformance/CPI/CPILastdata.json')),
        HealthCPI: JSON.stringify(require('./dashboardQueries/coolerPerformance/CPI/CPIHealth.json')),
        PowerCPI: JSON.stringify(require('./dashboardQueries/coolerPerformance/CPI/CPIPower.json')),
        DoorCPI: JSON.stringify(require('./dashboardQueries/coolerPerformance/CPI/CPIDoor.json')),
        FirstLoadLocationsMap: JSON.stringify(require('./dashboardQueries/coolerPerformance/KpiLocationsFirrstLoad.json')),
        CPIData: JSON.stringify(require('./dashboardQueries/coolerPerformance/AssetCPI.json')),
        DoorAsset: JSON.stringify(require('./dashboardQueries/coolerPerformance/DoorSwingAssetDetails.json')),
        TotalAssetLocation: JSON.stringify(require('./dashboardQueries/TotalAssetLocation.json'))
    },
    getKpiWidgetDataForCoolerPerformance: function (request, reply) {
        request.query = Object.assign({}, request.query, request.payload);
        reply.query = Object.assign({}, request.query, request.payload);
        var clientId = request.auth.credentials.user.ScopeId;
        var credentials = request.auth.credentials;
        var params = Object.assign({}, request.query, request.payload),
            assetSummary = JSON.parse(this.dashboardQueries.assetSummaryPerformance),
            //totalAssetLocation = JSON.parse(this.dashboardQueries.TotalAssetLocation),
            operationalIssue = JSON.parse(this.dashboardQueries.operationalIssue),
            assetTypeCapacity = JSON.parse(this.dashboardQueries.assetTypeCapacity),
            assetTypeCapacitythreshold = JSON.parse(this.dashboardQueries.assetTypeCapacitythreshold),
            kpiLastDataDownloadSummary = JSON.parse(this.dashboardQueries.kpiLastDataDownloadSummary),
            kpiLastDataDownloadSummaryDays = JSON.parse(this.dashboardQueries.kpiLastDataDownloadSummaryDays),
            chartWise = JSON.parse(this.dashboardQueries.ChartCoolerTracking);
        var tags = credentials.tags.FirstName;
        tags = tags.toLowerCase();
        // client Filter
        var clientQuery = {
            "term": {
                "ClientId": clientId
            }
        };
        if (clientId != 0) {
            assetSummary.query.bool.filter.push(clientQuery);
            //totalAssetLocation.query.bool.filter.push(clientQuery);
            chartWise.query.bool.filter.push(clientQuery);
            operationalIssue.query.bool.filter.push(clientQuery);
            assetTypeCapacity.query.bool.filter.push(clientQuery);
            assetTypeCapacitythreshold.query.bool.filter.push(clientQuery);
            kpiLastDataDownloadSummary.query.bool.filter.push(clientQuery);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(clientQuery);
        }

        var countryname = {
            "term": {
                "Country": tags
            }
        };

        assetTypeCapacitythreshold.query.bool.filter.push(countryname);

        var displacementless = {
            "range": {
                "Displacement": {
                    "lt": Number(credentials.tags.CoolerTrackingDisplacementThreshold) / 1000
                }
            }
        };
        var displacementgreater = {
            "range": {
                "Displacement": {
                    "gte": Number(credentials.tags.CoolerTrackingDisplacementThreshold) / 1000
                }
            }
        };

        chartWise.aggs.AlwaysLocationAsExpected.filter.bool.must.push(displacementless);
        chartWise.aggs.AlwaysWrongLocation.filter.bool.must.push(displacementgreater);

        var endDate = params.endDate;
        if (credentials.tags.CoolerTrackingThreshold == null) {
            var CoolerTrackingThreshold = 89;
        } else {
            var CoolerTrackingThr = credentials.tags.CoolerTrackingThreshold;
            var CoolerTrackingThreshold = Number(CoolerTrackingThr); //- 1
        }
        var CoolerTrackingThresholdEnd = CoolerTrackingThreshold; //- 1;
        var startDate = moment(endDate).add(-CoolerTrackingThreshold, 'days').format('YYYY-MM-DD[T23:59:59]'); //find perivous EventDate
        var startDateend = moment(endDate).add(-CoolerTrackingThresholdEnd, 'days').format('YYYY-MM-DD[T00:00:00]'); //find perivous EventDate
        var endDate = moment(endDate).format('YYYY-MM-DD[T23:59:59]');
        var dategateway = { //object to insert EventDate
            "range": {
                "GatewayLastPing": {
                    "from": startDateend,
                    "to": endDate
                }
            }
        };
        var datedevice = { //object to insert EventDate
            "range": {
                "LatestDeviceDate": {
                    "from": startDateend,
                    "to": endDate
                }
            }
        };
        var dategateway1 = { //object to insert EventDate
            "range": {
                "GatewayLastPing": {
                    "lte": startDate
                }
            }
        };
        var datedevice1 = { //object to insert EventDate
            "range": {
                "LatestDeviceDate": {
                    "lte": startDate
                }
            }
        };
        chartWise.aggs.AlwaysNotTransmitting.filter.bool.must.push(dategateway1);

        chartWise.aggs.AlwaysWrongLocation.filter.bool.must.push(dategateway);

        chartWise.aggs.AlwaysLocationAsExpected.filter.bool.must.push(dategateway);

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

            operationalIssue.query.bool.filter.push(dateRangeQuery);
            assetSummary.aggs.SmartLocation.aggs.Location.aggs.DoorCount.filter.bool.must.push(dateRangeQuery);
            kpiLastDataDownloadSummary.query.bool.filter.push(dateRangeQuery);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(dateRangeQuery);
            totalHours = defaultHours;
            months = 1;
        } else if (!isDefaultDateFilter && params.startDate && params.endDate) {
            var startDate = moment(params.startDate).format('YYYY-MM-DD[T00:00:00]');
            var startDateDays = moment(params.endDate).format('YYYY-MM-DD[T00:00:00]');
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
            var dateRangeQuery2 = {
                "range": {
                    "EventDate": {
                        "gte": startDateDays,
                        "lte": endDate
                    }
                }
            };

            operationalIssue.query.bool.filter.push(dateRangeQuery);
            assetSummary.aggs.SmartLocation.aggs.Location.aggs.DoorCount.filter.bool.must.push(dateRangeQuery);
            kpiLastDataDownloadSummary.query.bool.filter.push(dateRangeQuery);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(dateRangeQuery2);
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

                operationalIssue.query.bool.filter.push({
                    "bool": {
                        "should": []
                    }
                });

                assetSummary.aggs.SmartLocation.aggs.Location.aggs.DoorCount.filter.bool.must.push({
                    "bool": {
                        "should": []
                    }
                });

                kpiLastDataDownloadSummary.query.bool.filter.push({
                    "bool": {
                        "should": []
                    }
                });

                kpiLastDataDownloadSummaryDays.query.bool.filter.push({
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

            operationalIssue = util.pushDateQuery(operationalIssue, dateRangeQuery);
            kpiLastDataDownloadSummary = util.pushDateQuery(kpiLastDataDownloadSummary, dateRangeQuery);
            kpiLastDataDownloadSummaryDays = util.pushDateQuery(kpiLastDataDownloadSummaryDays, dateRangeQuery);
            var visitDateRange = {
                "range": {
                    "EventDate": {
                        "gte": startDate,
                        "lte": endDate
                    }
                }
            };

            var assetVisitDateRange = {
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
            operationalIssue.query.bool.filter.push(countryIdsUser);

            kpiLastDataDownloadSummary.query.bool.filter.push(countryIdsUser);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(countryIdsUser);

            chartWise.query.bool.filter.push(countryIdsUser);
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

            assetSummary.query.bool.filter.push(filterQuery);
            operationalIssue.query.bool.filter.push(filterQuery);

            kpiLastDataDownloadSummary.query.bool.filter.push(filterQuery);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(filterQuery);

            chartWise.query.bool.filter.push(filterQuery);
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
            assetSummary.aggs.SmartLocation.filter.bool.must.push(AssetIds);
            operationalIssue.query.bool.filter.push(AssetIds);
            kpiLastDataDownloadSummary.query.bool.filter.push(AssetIds);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(AssetIds);
            chartWise.query.bool.filter.push(AssetIds);
        }

        if ((params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) ||
            (params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) ||
            (params.DataDownloadOutlet || params["DataDownloadOutlet[]"]) ||
            (params.UserId || params["UserId[]"]) || (params.TeleSellingTerritoryId || params["TeleSellingTerritoryId[]"])) {
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
            assetSummary.aggs.SmartLocation.filter.bool.must.push(LocationIds);
            operationalIssue.query.bool.filter.push(LocationIds);
            kpiLastDataDownloadSummary.query.bool.filter.push(LocationIds);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(LocationIds);
            chartWise.query.bool.filter.push(LocationIds);
        }

        if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
            var smartDeviceTypeQuery = {
                "terms": {
                    "AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
                }
            }
            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(smartDeviceTypeQuery);
            assetSummary.aggs.Locations.filter.bool.must.push(smartDeviceTypeQuery);
            operationalIssue.query.bool.filter.push(smartDeviceTypeQuery);

            kpiLastDataDownloadSummary.query.bool.filter.push(smartDeviceTypeQuery);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(smartDeviceTypeQuery);
            chartWise.query.bool.filter.push(smartDeviceTypeQuery);
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
            }
            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetTypeCapacityId);
            assetSummary.aggs.Locations.filter.bool.must.push(AssetTypeCapacityId);
            assetSummary.aggs.SmartLocation.filter.bool.must.push(AssetTypeCapacityId);
            operationalIssue.query.bool.filter.push(AssetTypeCapacityId);

            kpiLastDataDownloadSummary.query.bool.filter.push(AssetTypeCapacityId);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(AssetTypeCapacityId);
            chartWise.query.bool.filter.push(AssetTypeCapacityId);
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
            operationalIssue.query.bool.filter.push(IsFactoryAssetFilter);

            kpiLastDataDownloadSummary.query.bool.filter.push(IsFactoryAssetFilter);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(IsFactoryAssetFilter);
            chartWise.query.bool.filter.push(IsFactoryAssetFilter);
        }

        if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
            var assetManufactureQuery = {
                "terms": {
                    "AssetManufactureId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
                }
            }
            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetManufactureQuery);
            assetSummary.aggs.Locations.filter.bool.must.push(assetManufactureQuery);

            operationalIssue.query.bool.filter.push(assetManufactureQuery);

            kpiLastDataDownloadSummary.query.bool.filter.push(assetManufactureQuery);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(assetManufactureQuery);
            chartWise.query.bool.filter.push(assetManufactureQuery);
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
            assetSummary.aggs.Locations.filter.bool.must.push(SalesHierarchyId);

            operationalIssue.query.bool.filter.push(SalesHierarchyId);

            kpiLastDataDownloadSummary.query.bool.filter.push(SalesHierarchyId);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(SalesHierarchyId);
            chartWise.query.bool.filter.push(SalesHierarchyId);
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
            };
            var manufacturerSmartDeviceQuery1 = {
                "terms": {
                    "SmartDeviceManufacturerId": request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]
                }
            };
            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerSmartDeviceQuery);
            assetSummary.aggs.Locations.filter.bool.must.push(manufacturerSmartDeviceQuery);
            operationalIssue.query.bool.filter.push(manufacturerSmartDeviceQuery);

            kpiLastDataDownloadSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(manufacturerSmartDeviceQuery);
            // chartWise.query.bool.filter.push(manufacturerSmartDeviceQuery1);

            chartWise.aggs.AlwaysNotTransmitting.filter.bool.should.push(manufacturerSmartDeviceQuery1);
            chartWise.aggs.AlwaysWrongLocation.filter.bool.should.push(manufacturerSmartDeviceQuery1);
            chartWise.aggs.AlwaysLocationAsExpected.filter.bool.should.push(manufacturerSmartDeviceQuery1);

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
            assetSummary.aggs.Locations.filter.bool.must.push(manufacturerOutletTypeId);
            operationalIssue.query.bool.filter.push(manufacturerOutletTypeId);

            kpiLastDataDownloadSummary.query.bool.filter.push(manufacturerOutletTypeId);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(manufacturerOutletTypeId);
            chartWise.query.bool.filter.push(manufacturerOutletTypeId);
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
            assetSummary.aggs.Locations.filter.bool.must.push(LocationTypeId);

            operationalIssue.query.bool.filter.push(LocationTypeId);

            kpiLastDataDownloadSummary.query.bool.filter.push(LocationTypeId);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(LocationTypeId);
            chartWise.query.bool.filter.push(LocationTypeId);
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
            assetSummary.aggs.Locations.filter.bool.must.push(ClassificationId);

            operationalIssue.query.bool.filter.push(ClassificationId);

            kpiLastDataDownloadSummary.query.bool.filter.push(ClassificationId);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(ClassificationId);
            chartWise.query.bool.filter.push(ClassificationId);
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
            assetSummary.aggs.Locations.filter.bool.must.push(SubTradeChannelTypeId);

            operationalIssue.query.bool.filter.push(SubTradeChannelTypeId);

            kpiLastDataDownloadSummary.query.bool.filter.push(SubTradeChannelTypeId);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(SubTradeChannelTypeId);
            chartWise.query.bool.filter.push(SubTradeChannelTypeId);
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

            operationalIssue.query.bool.filter.push(AssetManufactureId);

            kpiLastDataDownloadSummary.query.bool.filter.push(AssetManufactureId);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(AssetManufactureId);
            chartWise.query.bool.filter.push(AssetManufactureId);
        }

        if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
            var AssetTypeId = {
                "terms": {
                    "AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
                }
            }
            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetTypeId);
            assetSummary.aggs.Locations.filter.bool.must.push(AssetTypeId);

            operationalIssue.query.bool.filter.push(AssetTypeId);

            kpiLastDataDownloadSummary.query.bool.filter.push(AssetTypeId);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(AssetTypeId);
            chartWise.query.bool.filter.push(AssetTypeId);
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
            assetSummary.aggs.Locations.filter.bool.must.push(SmartDeviceTypeId);

            operationalIssue.query.bool.filter.push(SmartDeviceTypeId);

            kpiLastDataDownloadSummary.query.bool.filter.push(SmartDeviceTypeId);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(SmartDeviceTypeId);
            chartWise.query.bool.filter.push(SmartDeviceTypeId);
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

            operationalIssue.query.bool.filter.push(City);

            kpiLastDataDownloadSummary.query.bool.filter.push(City);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(City);
            chartWise.query.bool.filter.push(City);
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

            operationalIssue.query.bool.filter.push(CountryId);

            kpiLastDataDownloadSummary.query.bool.filter.push(CountryId);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(CountryId);
            chartWise.query.bool.filter.push(CountryId);
        }

        if (request.query.LocationCode || request.query["LocationCode[]"]) {
            var LocationCode = {
                "term": {
                    "LocationCode": request.query.LocationCode || request.query["LocationCode[]"]
                }
            }
            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(LocationCode);
            assetSummary.aggs.Locations.filter.bool.must.push(LocationCode);

            operationalIssue.query.bool.filter.push(LocationCode);

            kpiLastDataDownloadSummary.query.bool.filter.push(LocationCode);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(LocationCode);
            chartWise.query.bool.filter.push(LocationCode);
        }

        var queries = [{
            key: "db",
            search: {
                index: 'cooler-iot-asseteventdatasummary',
                type: ["AssetEventDataSummary"],
                body: assetSummary,
                ignore_unavailable: true
            }
        },
        {
            key: "operationalIssue",
            search: {
                index: 'cooler-iot-asseteventdatasummary',
                type: ["AssetEventDataSummary"],
                body: operationalIssue,
                ignore_unavailable: true
            }
        },
        // {
        //     key: "totalAssetLocation",
        //     search: {
        //         index: "cooler-iot-asset",
        //         type: ["Asset"],
        //         body: totalAssetLocation,
        //         ignore_unavailable: true
        //     }
        // },
        {
            key: "assetTypeCapacitythreshold",
            search: {
                index: "cooler-iot-saleshierarchyassettypecapacitythreshold",
                type: ["SalesHierarchyAssetTypeCapacityThreshold"],
                body: assetTypeCapacitythreshold,
                ignore_unavailable: true
            }
        },
        {
            key: "lastDownloadSummary",
            search: {
                index: 'cooler-iot-asseteventdatasummary',
                type: ["AssetEventDataSummary"],
                body: kpiLastDataDownloadSummary,
                ignore_unavailable: true
            }
        }, {
            key: "lastDataDownloadSummaryDays",
            search: {
                index: 'cooler-iot-asseteventdatasummary',
                type: ["AssetEventDataSummary"],
                body: kpiLastDataDownloadSummaryDays,
                ignore_unavailable: true
            }
        }, {
            key: "ChartDatawise",
            search: {
                index: 'cooler-iot-asset',
                type: ["Asset"],
                body: chartWise,
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

                    "operationalIssues": [{
                        "Range": "8 - 12 Hours",
                        "PowerOff": 0,
                        "HighTemperature": 0,
                        "LowLight": 0
                    },
                    {
                        "Range": "12 - 24 Hours",
                        "PowerOff": 0,
                        "HighTemperature": 0,
                        "LowLight": 0
                    }
                    ],
                    lastDataDownloaded: [{
                        "name": "Last data <= 30",
                        "data": [],
                        "color": "#55BF3B"
                    },
                    {
                        "name": "Last data > 30, <60 days",
                        "data": [],
                        "color": "#fff589"
                    },
                    {
                        "name": "Last data > 60, <90 days",
                        "data": [],
                        "color": "#DF5353"
                    },
                    {
                        "name": "No data for more than 90 days",
                        "data": [],
                        "color": "#333"
                    }
                    ],
                    DoorSwing: [{
                        "name": "A",
                        "y": 0,
                        "color": "#5d883f"
                    },
                    {
                        "name": "B",
                        "y": 0,
                        "color": "#70ad47"
                    },
                    {
                        "name": "C",
                        "y": 0,
                        "color": "#ffc000"
                    },
                    {
                        "name": "D",
                        "y": 0,
                        "color": "#ed7d31"
                    },
                    {
                        "name": "E",
                        "y": 0,
                        "color": "#df5353"
                    }
                    ],
                    "locationTracking": [{
                        "name": "Data Downloaded",
                        "y": null,
                        "x": null,
                        "color": "#6ED854"
                    },
                    {
                        "name": "Data Not Downloaded",
                        "y": null,
                        "x": null,
                        "color": "#df5353"
                    }
                    ]
                };
            for (var i = 0, len = values.length; i < len; i++) {
                var value = values[i];
                data[value.config.key] = value.response;
                util.setLogger(value);

            }

            var dbAggs = data.db.aggregations,
                // totalAssetLocation = data.totalAssetLocation.aggregations,
                operationalIssueAggs = data.operationalIssue.aggregations,
                doorCount, doorOpenRate, doorOpenDuration, doorSumDuration,
                assettypecapacitythreshold = data.assetTypeCapacitythreshold.hits.hits,
                lastDownloadSummaryAggs = data.lastDownloadSummary.aggregations,
                lastDataDownloadSummaryDaysAggs = data.lastDataDownloadSummaryDays.aggregations,
                DataAggs = data.ChartDatawise.aggregations;

            var doorOpens,
                days = moment.duration(totalHours, 'hours').asDays(),
                doorData = finalData.doorData;

            var locationDataMap = [];
            var locationDataMapDoorSwing = [];
            var locationDataMapOperationIssues = [];
            var locationConfirmed = 0;
            var doorOpenTarget = 0;

            var temperatureDuration;
            var lightDuration;
            var powerDuration;
            var TemperatureIssueAssets = [];
            var LightIssueAssets = [];
            var PowerDataAssets = [];
            if (operationalIssueAggs) {
                operationalIssueAggs.HealthData.TempLightIssueCount.TemperatureIssue.AssetBucket.buckets.forEach(function (assetBucket) {
                    temperatureDuration = moment.duration(assetBucket.HealthInterval.value, 'm').asHours() / days;
                    if (temperatureDuration >= 8 && temperatureDuration < 12) {
                        finalData.operationalIssues[0].HighTemperature++;
                        TemperatureIssueAssets.push(assetBucket.key);
                    } else if (temperatureDuration >= 12 && temperatureDuration <= 24) {
                        finalData.operationalIssues[1].HighTemperature++;
                        TemperatureIssueAssets.push(assetBucket.key);
                    }
                });

                operationalIssueAggs.HealthData.TempLightIssueCount.LightIssue.AssetBucket.buckets.forEach(function (assetBucket) {
                    lightDuration = moment.duration(assetBucket.HealthInterval.value, 'm').asHours() / days;
                    if (lightDuration > 24) {
                        lightDuration = 24;
                    }
                    if (lightDuration >= 8 && lightDuration < 12) {
                        finalData.operationalIssues[0].LowLight++;
                        LightIssueAssets.push(assetBucket.key);
                    } else if (lightDuration >= 12 && lightDuration <= 24) {
                        finalData.operationalIssues[1].LowLight++;
                        LightIssueAssets.push(assetBucket.key);
                    }
                });

                operationalIssueAggs.PowerData.AssetBucket.buckets.forEach(function (assetBucket) {
                    powerDuration = moment.duration(assetBucket.PowerOffDuration.value, 'second').asHours() / days;
                    if (powerDuration >= 8 && powerDuration < 12) {
                        finalData.operationalIssues[0].PowerOff++;
                        PowerDataAssets.push(assetBucket.key);
                    } else if (powerDuration >= 12 && powerDuration <= 24) {
                        finalData.operationalIssues[1].PowerOff++;
                        PowerDataAssets.push(assetBucket.key);
                    }
                })
            }

            dbAggs.SmartLocation.Location.buckets.forEach(function (locationData) {
                var locationId = locationData.key;
                var doorActual = 0;
                var SalesOrganisation;
                var doortarget = locationData.DoorOpenTarget.DoorOpenTarget.buckets;
                if (doortarget.length == 0) {
                    doortarget = 0;
                } else {
                    doortarget = doortarget[0].key;
                }
                locationData.SalesOrganization.SalesOrganization.buckets.forEach(function (organisationid) {
                    SalesOrganisation = organisationid.key;
                });
                // var doorValue;
                // if (dbAggs) {
                //     doorValue = dbAggs.SmartLocation.Location.buckets.filter(data => data.key == locationId);
                // }
                // if (doorValue && doorValue.length > 0) {
                doorActual = locationData.DoorCount.DoorCount.value;
                //}
                var AssetType = locationData.AssetTypeCapacity.AssetTypeCapacityId.buckets;
                var doorthreshold = 0;
                var doortargetthreshold = 0;
                var finalthreshold = 0;
                var doornumberthreshold = 0;
                var PercentageValue;
                if (locationData) {
                    var doccount = 0;
                    for (var i = 0; i < AssetType.length; i++) {
                        var CapacityNumber = AssetType[i].key;
                        doccount = AssetType[i].doc_count + doccount;
                        var range = assettypecapacitythreshold.filter(data => data._source.AssetTypeCapacityId == CapacityNumber && data._source.SalesHierarchyId == SalesOrganisation);
                        if (range && range.length > 0) {
                            doorthreshold = range[0]._source.Last30DayDoorThresold * days
                        } else {
                            doortargetthreshold = doortarget * days
                        }
                        if (doorthreshold == 0) {
                            doorthreshold = doortargetthreshold
                        }
                        doorthreshold = doorthreshold * AssetType[i].doc_count;
                        doornumberthreshold = doornumberthreshold + doorthreshold;
                    }
                    if (doornumberthreshold != 0) {
                        doornumberthreshold = doornumberthreshold / doccount;
                    }
                }
                finalthreshold = doornumberthreshold;
                PercentageValue = (doorActual / doornumberthreshold) * 100;
                if (doorActual == 0) {
                    finalData.DoorSwing[4].y++;
                } else {
                    if (PercentageValue >= 100) {
                        finalData.DoorSwing[0].y++;
                    } else if (PercentageValue >= 90 && PercentageValue < 100) {
                        finalData.DoorSwing[1].y++;
                    } else if (PercentageValue >= 50 && PercentageValue < 90) {
                        finalData.DoorSwing[2].y++;
                    } else if (PercentageValue > 0 && PercentageValue < 50) {
                        finalData.DoorSwing[3].y++;
                    } else if (PercentageValue == 0) {
                        finalData.DoorSwing[4].y++;
                    }
                }
            });

            var totalAsset = dbAggs.AssetCount.AssetCount.buckets.length;
            var smartAssetCount = dbAggs.SmartAssetCount.SmartAssetCount.buckets.length;

            //============================for  data download chart====================//
            if (lastDownloadSummaryAggs) {
                locationConfirmed = dbAggs.SmartAssetCount.SmartAssetCount.buckets.length != 0 ? Number(((lastDownloadSummaryAggs.LocationCount.buckets.length / dbAggs.SmartAssetCount.SmartAssetCount.buckets.length) * 100).toFixed(2)) : 0;
                finalData.locationTracking[0].y = locationConfirmed;
                finalData.locationTracking[0].x = lastDownloadSummaryAggs.LocationCount.buckets.length;
                finalData.locationTracking[1].y = dbAggs.SmartAssetCount.SmartAssetCount.buckets.length != 0 ? Math.abs(Number((((dbAggs.SmartAssetCount.SmartAssetCount.buckets.length - lastDownloadSummaryAggs.LocationCount.buckets.length) / dbAggs.SmartAssetCount.SmartAssetCount.buckets.length) * 100).toFixed(2))) : 0;
                finalData.locationTracking[1].y = finalData.locationTracking[1].y == 0 ? null : finalData.locationTracking[1].y;
                finalData.locationTracking[1].x = finalData.locationTracking[1].y == 0 ? null : Math.abs((dbAggs.SmartAssetCount.SmartAssetCount.buckets.length - lastDownloadSummaryAggs.LocationCount.buckets.length));
            }

            var last30DaysLocation = [];
            var last60DaysLocation = [];
            var last90DaysLocation = [];

            //=====================for last data download chart=============================//
            if (lastDataDownloadSummaryDaysAggs) {
                var last30Days = lastDataDownloadSummaryDaysAggs.Last30Days.AssetIds.buckets.length;
                finalData.lastDataDownloaded[0].data.push(last30Days);

                var last60Days = lastDataDownloadSummaryDaysAggs.Last60Days.AssetIds.value;
                finalData.lastDataDownloaded[1].data.push(last60Days);

                var last90Days = lastDataDownloadSummaryDaysAggs.Last90Days.AssetIds.value;
                finalData.lastDataDownloaded[2].data.push(last90Days);
                var ovelldata = last30Days + last60Days + last90Days;
                finalData.lastDataDownloaded[3].data.push(dbAggs.SmartAssetCount.SmartAssetCount.buckets.length - ovelldata);

            }

            finalData.summary = {
                totalCooler: totalAsset,
                totalCustomer: dbAggs.LocationCount.LocationCount.buckets.length,
                filteredAssets: dbAggs.SmartAssetCount.SmartAssetCount.buckets.length,
                filteredOutlets: dbAggs.Locations.Locations.buckets.length,
                totalSmartAssetCount: dbAggs.AssetCount.AssetCount.buckets.length,
                smartAssetCount: smartAssetCount,
                AlwaysNotTransmitting: DataAggs.AlwaysNotTransmitting.Assets.buckets.length,
                AlwaysWrongLocation: DataAggs.AlwaysWrongLocation.Assets.buckets.length,
                AlwaysLocationAsExpected: DataAggs.AlwaysLocationAsExpected.Assets.buckets.length
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
    getLocationsFirstLoadCoolerPerformance: function (request, reply) {
        request.query = Object.assign({}, request.query, request.payload);
        reply.query = Object.assign({}, request.query, request.payload);
        var clientId = request.auth.credentials.user.ScopeId;
        var credentials = request.auth.credentials;
        var params = Object.assign({}, request.query, request.payload),
            assetSummary = JSON.parse(this.dashboardQueries.FirstLoadLocationsMap);
        var tags = credentials.tags.FirstName;
        tags = tags.toLowerCase();
        // client Filter
        var clientQuery = {
            "term": {
                "ClientId": clientId
            }
        };
        if (clientId != 0) {
            assetSummary.query.bool.filter.push(clientQuery);
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

            assetSummary.query.bool.filter.push(filterQuery);
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

            assetSummary.query.bool.filter.push(AssetIds);
        }

        if ((params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) ||
            (params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) ||
            (params.DataDownloadOutlet || params["DataDownloadOutlet[]"])) {
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

            assetSummary.query.bool.filter.push(LocationIds);
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
            };
            assetSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
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
            assetSummary.query.bool.filter.push(manufacturerOutletTypeId);

        }

        var queries = [{
            key: "db",
            search: {
                index: 'cooler-iot-asset',
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

            var LocationMapAll = [];
            dbAggs.Locations.Location.buckets.forEach(function (locationData) {
                var locationId = locationData.key;
                LocationMapAll.push({
                    Id: locationId,
                    LastData: "Locations",
                    LocationGeo: {
                        "lat": locationData.Lat.bounds.top_left.lat,
                        "lon": locationData.Lat.bounds.top_left.lon
                    }
                })
            });


            finalData.summary = {
                LocationMapAll: LocationMapAll
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
    getCPIdata: function (request, reply) {
        request.query = Object.assign({}, request.query, request.payload);
        reply.query = Object.assign({}, request.query, request.payload);
        var clientId = request.auth.credentials.user.ScopeId;
        var credentials = request.auth.credentials;
        var params = Object.assign({}, request.query, request.payload),
            assetSummary = JSON.parse(this.dashboardQueries.CPIData),
            lastdatacpiSummary = JSON.parse(this.dashboardQueries.LastDataCPI),
            healthcpiSummary = JSON.parse(this.dashboardQueries.HealthCPI),
            powercpiSummary = JSON.parse(this.dashboardQueries.PowerCPI),
            doorcpiSummary = JSON.parse(this.dashboardQueries.DoorCPI);
        var tags = credentials.tags.FirstName;
        // client Filter
        var clientQuery = {
            "term": {
                "ClientId": clientId
            }
        };
        if (clientId != 0) {
            assetSummary.query.bool.filter.push(clientQuery);
            lastdatacpiSummary.query.bool.filter.push(clientQuery);
            healthcpiSummary.query.bool.filter.push(clientQuery);
            powercpiSummary.query.bool.filter.push(clientQuery);
            doorcpiSummary.query.bool.filter.push(clientQuery);
        }
        var isDefaultDateFilter = params.yearWeek || params.dayOfWeek || params.quarter || params.month;
        var dateFilter = [];
        var dateFilterTrend = [];
        var totalHours = 0;
        var months = 0;
        if (!isDefaultDateFilter && !params.startDate && !params.endDate) {
            var dateRangeQuery = {
                "range": {
                    "EventDate": {
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
                    "EventDate": {
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
            //==========for easy pie charts============================//
            var endDate = params.endDate;
            var lastEndDate = endDate;
            var startWeek = moment.utc(params.startDate).week();
            var endWeek = moment.utc(lastEndDate).week();

            var startYear = moment.utc(params.startDate).year();
            var endYear = moment.utc(lastEndDate).year();
            var currentYear = moment.utc().year();
            if (currentYear > startYear) {
                var weekinYear = moment.utc(moment(lastEndDate).subtract('months').startOf('month').format('YYYY-MM-DD[T00:00:00]')).weeksInYear();
                startWeek = startWeek - weekinYear * (currentYear - startYear);
                endWeek = endWeek - weekinYear * (currentYear - endYear);
            }
            var dateFilter = [];
            for (var i = startWeek; i <= endWeek; i++) {
                dateFilter.push.apply(dateFilter, util.getDateFromWeekDay(i, params.dayOfWeek, moment(moment(params.startDate).subtract('months').startOf('month').format('YYYY-MM-DD[T00:00:00]')), moment(moment(lastEndDate).subtract('months').endOf('month').format('YYYY-MM-DD[T00:00:00]'))));
            }
            //=push========================//
            for (var i = 0, len = dateFilter.length; i < len; i++) {
                var filterDate = dateFilter[i];
                var startDate = filterDate.startDate,
                    endDate = filterDate.endDate;
                totalHours += filterDate.totalHours;
                months += filterDate.months;
                if (i == 0) {
                    lastdatacpiSummary.aggs.CPI.filter.bool.filter.splice(0, 1);
                    healthcpiSummary.aggs.CPIHoursCorrectTemperature.filter.bool.filter.splice(0, 1);
                    healthcpiSummary.aggs.CPINotTempHours.filter.bool.filter.splice(0, 1);
                    healthcpiSummary.aggs.CPIHoursLightOn.filter.bool.filter.splice(0, 1);
                    powercpiSummary.aggs.CPI.filter.bool.filter.splice(0, 1);
                    doorcpiSummary.aggs.CPI.filter.bool.filter.splice(0, 1);
                    lastdatacpiSummary.aggs.CPI.filter.bool.filter.push({
                        "bool": {
                            "should": []
                        }
                    });

                    healthcpiSummary.aggs.CPIHoursCorrectTemperature.filter.bool.filter.push({
                        "bool": {
                            "should": []
                        }
                    });
                    healthcpiSummary.aggs.CPINotTempHours.filter.bool.filter.push({
                        "bool": {
                            "should": []
                        }
                    });
                    healthcpiSummary.aggs.CPIHoursLightOn.filter.bool.filter.push({
                        "bool": {
                            "should": []
                        }
                    });

                    powercpiSummary.aggs.CPI.filter.bool.filter.push({
                        "bool": {
                            "should": []
                        }
                    });

                    doorcpiSummary.aggs.CPI.filter.bool.filter.push({
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

                lastdatacpiSummary = util.pushDateQueryAllCPI(lastdatacpiSummary, dateRangeQuery);
                healthcpiSummary = util.pushDateQueryCPI(healthcpiSummary, dateRangeQuery);
                powercpiSummary = util.pushDateQueryAllCPI(powercpiSummary, dateRangeQuery);
                doorcpiSummary = util.pushDateQueryAllCPI(doorcpiSummary, dateRangeQuery);
            }

            //==========end end end end end ============================================//
            //=================for current===============================//
            var endDate = params.endDate;
            var lastEndDate = endDate;
            var startWeek = moment.utc(moment(params.startDate).subtract('months').startOf('month').format('YYYY-MM-DD[T00:00:00]')).week();
            var endWeek = moment.utc(moment(lastEndDate).subtract('months').endOf('month').format('YYYY-MM-DD[T23:59:59]')).week();

            var startYear = moment.utc(moment(params.startDate).subtract('months').startOf('month').format('YYYY-MM-DD[T00:00:00]')).year();
            var endYear = moment.utc(moment(lastEndDate).subtract('months').endOf('month').format('YYYY-MM-DD[T23:59:59]')).year();
            var currentYear = moment.utc().year();
            if (currentYear > startYear) {
                var weekinYear = moment.utc(moment(lastEndDate).subtract('months').startOf('month').format('YYYY-MM-DD[T00:00:00]')).weeksInYear();
                startWeek = startWeek - weekinYear * (currentYear - startYear);
                endWeek = endWeek - weekinYear * (currentYear - endYear);
            }
            var dateFilter = [];
            for (var i = startWeek; i <= endWeek; i++) {
                dateFilter.push.apply(dateFilter, util.getDateFromWeekDay(i, params.dayOfWeek, moment(moment(lastEndDate).subtract('months').startOf('month').format('YYYY-MM-DD[T00:00:00]'))));
            }
            //=push========================//
            for (var i = 0, len = dateFilter.length; i < len; i++) {
                var filterDate = dateFilter[i];
                var startDate = filterDate.startDate,
                    endDate = filterDate.endDate;
                totalHours += filterDate.totalHours;
                months += filterDate.months;
                if (i == 0) {
                    lastdatacpiSummary.aggs.Current.filter.bool.filter.splice(0, 1);
                    healthcpiSummary.aggs.CurrentHoursCorrectTemperature.filter.bool.filter.splice(0, 1);
                    healthcpiSummary.aggs.CurrentNotTempHours.filter.bool.filter.splice(0, 1);
                    healthcpiSummary.aggs.CurrentHoursLightOn.filter.bool.filter.splice(0, 1);
                    powercpiSummary.aggs.Current.filter.bool.filter.splice(0, 1);
                    doorcpiSummary.aggs.Current.filter.bool.filter.splice(0, 1);
                    lastdatacpiSummary.aggs.Current.filter.bool.filter.push({
                        "bool": {
                            "should": []
                        }
                    });

                    healthcpiSummary.aggs.CurrentHoursLightOn.filter.bool.filter.push({
                        "bool": {
                            "should": []
                        }
                    });
                    healthcpiSummary.aggs.CurrentHoursCorrectTemperature.filter.bool.filter.push({
                        "bool": {
                            "should": []
                        }
                    });
                    healthcpiSummary.aggs.CurrentNotTempHours.filter.bool.filter.push({
                        "bool": {
                            "should": []
                        }
                    });

                    powercpiSummary.aggs.Current.filter.bool.filter.push({
                        "bool": {
                            "should": []
                        }
                    });

                    doorcpiSummary.aggs.Current.filter.bool.filter.push({
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

                lastdatacpiSummary = util.pushDateQueryCurrent(lastdatacpiSummary, dateRangeQuery);
                healthcpiSummary = util.pushDateQueryCurrentHealth(healthcpiSummary, dateRangeQuery);
                powercpiSummary = util.pushDateQueryCurrent(powercpiSummary, dateRangeQuery);
                doorcpiSummary = util.pushDateQueryCurrent(doorcpiSummary, dateRangeQuery);
            }

            //=================for Previous===============================//

            var startWeek = moment.utc(moment(lastEndDate).subtract(1, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]')).week();
            var endWeek = moment.utc(moment(lastEndDate).subtract(1, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]')).week();

            var startYear = moment.utc(moment(lastEndDate).subtract(1, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]')).year();
            var endYear = moment.utc(moment(lastEndDate).subtract(1, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]')).year();
            var currentYear = moment.utc().year();
            if (currentYear > startYear) {
                var weekinYear = moment.utc(moment(lastEndDate).subtract(1, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]')).weeksInYear();
                startWeek = startWeek - weekinYear * (currentYear - startYear);
                endWeek = endWeek - weekinYear * (currentYear - endYear);
            }
            var dateFilter = [];
            for (var i = startWeek; i <= endWeek; i++) {
                dateFilter.push.apply(dateFilter, util.getDateFromWeekDay(i, params.dayOfWeek, moment(moment(lastEndDate).subtract(1, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]'))));
            }
            //=push========================//
            for (var i = 0, len = dateFilter.length; i < len; i++) {
                var filterDate = dateFilter[i];
                var startDate = filterDate.startDate,
                    endDate = filterDate.endDate;
                totalHours += filterDate.totalHours;
                months += filterDate.months;
                if (i == 0) {
                    lastdatacpiSummary.aggs.Previous.filter.bool.filter.splice(0, 1);
                    healthcpiSummary.aggs.PreviousHoursCorrectTemperature.filter.bool.filter.splice(0, 1);
                    healthcpiSummary.aggs.PrevioustNotTempHours.filter.bool.filter.splice(0, 1);
                    healthcpiSummary.aggs.PreviousHoursLightOn.filter.bool.filter.splice(0, 1);
                    powercpiSummary.aggs.Previous.filter.bool.filter.splice(0, 1);
                    doorcpiSummary.aggs.Previous.filter.bool.filter.splice(0, 1);
                    lastdatacpiSummary.aggs.Previous.filter.bool.filter.push({
                        "bool": {
                            "should": []
                        }
                    });

                    healthcpiSummary.aggs.PreviousHoursCorrectTemperature.filter.bool.filter.push({
                        "bool": {
                            "should": []
                        }
                    });

                    healthcpiSummary.aggs.PrevioustNotTempHours.filter.bool.filter.push({
                        "bool": {
                            "should": []
                        }
                    });

                    healthcpiSummary.aggs.PreviousHoursLightOn.filter.bool.filter.push({
                        "bool": {
                            "should": []
                        }
                    });

                    powercpiSummary.aggs.Previous.filter.bool.filter.push({
                        "bool": {
                            "should": []
                        }
                    });

                    doorcpiSummary.aggs.Previous.filter.bool.filter.push({
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

                lastdatacpiSummary = util.pushDateQueryPrevious(lastdatacpiSummary, dateRangeQuery);
                healthcpiSummary = util.pushDateQueryPreviousHealth(healthcpiSummary, dateRangeQuery);
                powercpiSummary = util.pushDateQueryPrevious(powercpiSummary, dateRangeQuery);
                doorcpiSummary = util.pushDateQueryPrevious(doorcpiSummary, dateRangeQuery);

            }
            //=================for MonthBack===============================//

            var startWeek = moment.utc(moment(lastEndDate).subtract(2, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]')).week();
            var endWeek = moment.utc(moment(lastEndDate).subtract(2, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]')).week();

            var startYear = moment.utc(moment(lastEndDate).subtract(2, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]')).year();
            var endYear = moment.utc(moment(lastEndDate).subtract(2, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]')).year();
            var currentYear = moment.utc().year();
            if (currentYear > startYear) {
                var weekinYear = moment.utc(moment(lastEndDate).subtract(2, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]')).weeksInYear();
                startWeek = startWeek - weekinYear * (currentYear - startYear);
                endWeek = endWeek - weekinYear * (currentYear - endYear);
            }
            var dateFilter = [];
            for (var i = startWeek; i <= endWeek; i++) {
                dateFilter.push.apply(dateFilter, util.getDateFromWeekDay(i, params.dayOfWeek, moment(moment(lastEndDate).subtract(2, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]'))));
            }
            //=push========================//
            for (var i = 0, len = dateFilter.length; i < len; i++) {
                var filterDate = dateFilter[i];
                var startDate = filterDate.startDate,
                    endDate = filterDate.endDate;
                totalHours += filterDate.totalHours;
                months += filterDate.months;
                if (i == 0) {
                    lastdatacpiSummary.aggs.MonthBack.filter.bool.filter.splice(0, 1);
                    healthcpiSummary.aggs.MonthBackHoursCorrectTemperature.filter.bool.filter.splice(0, 1);
                    healthcpiSummary.aggs.MonthBackNotTempHours.filter.bool.filter.splice(0, 1);
                    healthcpiSummary.aggs.MonthBackHoursLightOn.filter.bool.filter.splice(0, 1);
                    powercpiSummary.aggs.MonthBack.filter.bool.filter.splice(0, 1);
                    doorcpiSummary.aggs.MonthBack.filter.bool.filter.splice(0, 1);
                    lastdatacpiSummary.aggs.MonthBack.filter.bool.filter.push({
                        "bool": {
                            "should": []
                        }
                    });

                    healthcpiSummary.aggs.MonthBackHoursCorrectTemperature.filter.bool.filter.push({
                        "bool": {
                            "should": []
                        }
                    });

                    healthcpiSummary.aggs.MonthBackNotTempHours.filter.bool.filter.push({
                        "bool": {
                            "should": []
                        }
                    });

                    healthcpiSummary.aggs.MonthBackHoursLightOn.filter.bool.filter.push({
                        "bool": {
                            "should": []
                        }
                    });

                    powercpiSummary.aggs.MonthBack.filter.bool.filter.push({
                        "bool": {
                            "should": []
                        }
                    });

                    doorcpiSummary.aggs.MonthBack.filter.bool.filter.push({
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

                lastdatacpiSummary = util.pushDateQueryMonthBack(lastdatacpiSummary, dateRangeQuery);
                healthcpiSummary = util.pushDateQueryMonthBackHealth(healthcpiSummary, dateRangeQuery);
                powercpiSummary = util.pushDateQueryMonthBack(powercpiSummary, dateRangeQuery);
                doorcpiSummary = util.pushDateQueryMonthBack(doorcpiSummary, dateRangeQuery);

            }
        } else {
            var endDate = params.endDate;
            var lastEndDate = endDate;
            //for CPI easy pie charts////////////
            lastdatacpiSummary.aggs.CPI.filter.bool.filter[0].range.EventDate.gte = params.startDate;
            lastdatacpiSummary.aggs.CPI.filter.bool.filter[0].range.EventDate.lte = lastEndDate;

            healthcpiSummary.aggs.CPIHoursCorrectTemperature.filter.bool.filter[0].range.EventDate.gte = params.startDate;
            healthcpiSummary.aggs.CPIHoursCorrectTemperature.filter.bool.filter[0].range.EventDate.lte = lastEndDate;

            healthcpiSummary.aggs.CPINotTempHours.filter.bool.filter[0].range.EventDate.gte = params.startDate;
            healthcpiSummary.aggs.CPINotTempHours.filter.bool.filter[0].range.EventDate.lte = lastEndDate;

            healthcpiSummary.aggs.CPIHoursLightOn.filter.bool.filter[0].range.EventDate.gte = params.startDate;
            healthcpiSummary.aggs.CPIHoursLightOn.filter.bool.filter[0].range.EventDate.lte = lastEndDate;

            powercpiSummary.aggs.CPI.filter.bool.filter[0].range.EventDate.gte = params.startDate;
            powercpiSummary.aggs.CPI.filter.bool.filter[0].range.EventDate.lte = lastEndDate;

            doorcpiSummary.aggs.CPI.filter.bool.filter[0].range.EventDate.gte = params.startDate;
            doorcpiSummary.aggs.CPI.filter.bool.filter[0].range.EventDate.lte = lastEndDate;
            //===================================/
            lastdatacpiSummary.aggs.Current.filter.bool.filter[0].range.EventDate.gte = moment(lastEndDate).subtract('months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
            lastdatacpiSummary.aggs.Current.filter.bool.filter[0].range.EventDate.lte = moment(lastEndDate).subtract('months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

            lastdatacpiSummary.aggs.Previous.filter.bool.filter[0].range.EventDate.gte = moment(lastEndDate).subtract(1, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
            lastdatacpiSummary.aggs.Previous.filter.bool.filter[0].range.EventDate.lte = moment(lastEndDate).subtract(1, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

            lastdatacpiSummary.aggs.MonthBack.filter.bool.filter[0].range.EventDate.gte = moment(lastEndDate).subtract(2, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
            lastdatacpiSummary.aggs.MonthBack.filter.bool.filter[0].range.EventDate.lte = moment(lastEndDate).subtract(2, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

            healthcpiSummary.aggs.CurrentHoursCorrectTemperature.filter.bool.filter[0].range.EventDate.gte = moment(lastEndDate).subtract('months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
            healthcpiSummary.aggs.CurrentHoursCorrectTemperature.filter.bool.filter[0].range.EventDate.lte = moment(lastEndDate).subtract('months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

            healthcpiSummary.aggs.CurrentNotTempHours.filter.bool.filter[0].range.EventDate.gte = moment(lastEndDate).subtract('months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
            healthcpiSummary.aggs.CurrentNotTempHours.filter.bool.filter[0].range.EventDate.lte = moment(lastEndDate).subtract('months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

            healthcpiSummary.aggs.CurrentHoursLightOn.filter.bool.filter[0].range.EventDate.gte = moment(lastEndDate).subtract('months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
            healthcpiSummary.aggs.CurrentHoursLightOn.filter.bool.filter[0].range.EventDate.lte = moment(lastEndDate).subtract('months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

            healthcpiSummary.aggs.PreviousHoursCorrectTemperature.filter.bool.filter[0].range.EventDate.gte = moment(lastEndDate).subtract(1, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
            healthcpiSummary.aggs.PreviousHoursCorrectTemperature.filter.bool.filter[0].range.EventDate.lte = moment(lastEndDate).subtract(1, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

            healthcpiSummary.aggs.PrevioustNotTempHours.filter.bool.filter[0].range.EventDate.gte = moment(lastEndDate).subtract(1, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
            healthcpiSummary.aggs.PrevioustNotTempHours.filter.bool.filter[0].range.EventDate.lte = moment(lastEndDate).subtract(1, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

            healthcpiSummary.aggs.PreviousHoursLightOn.filter.bool.filter[0].range.EventDate.gte = moment(lastEndDate).subtract(1, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
            healthcpiSummary.aggs.PreviousHoursLightOn.filter.bool.filter[0].range.EventDate.lte = moment(lastEndDate).subtract(1, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

            healthcpiSummary.aggs.MonthBackHoursCorrectTemperature.filter.bool.filter[0].range.EventDate.gte = moment(lastEndDate).subtract(2, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
            healthcpiSummary.aggs.MonthBackHoursCorrectTemperature.filter.bool.filter[0].range.EventDate.lte = moment(lastEndDate).subtract(2, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

            healthcpiSummary.aggs.MonthBackNotTempHours.filter.bool.filter[0].range.EventDate.gte = moment(lastEndDate).subtract(2, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
            healthcpiSummary.aggs.MonthBackNotTempHours.filter.bool.filter[0].range.EventDate.lte = moment(lastEndDate).subtract(2, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

            healthcpiSummary.aggs.MonthBackHoursLightOn.filter.bool.filter[0].range.EventDate.gte = moment(lastEndDate).subtract(2, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
            healthcpiSummary.aggs.MonthBackHoursLightOn.filter.bool.filter[0].range.EventDate.lte = moment(lastEndDate).subtract(2, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

            powercpiSummary.aggs.Current.filter.bool.filter[0].range.EventDate.gte = moment(lastEndDate).subtract('months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
            powercpiSummary.aggs.Current.filter.bool.filter[0].range.EventDate.lte = moment(lastEndDate).subtract('months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

            powercpiSummary.aggs.Previous.filter.bool.filter[0].range.EventDate.gte = moment(lastEndDate).subtract(1, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
            powercpiSummary.aggs.Previous.filter.bool.filter[0].range.EventDate.lte = moment(lastEndDate).subtract(1, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

            powercpiSummary.aggs.MonthBack.filter.bool.filter[0].range.EventDate.gte = moment(lastEndDate).subtract(2, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
            powercpiSummary.aggs.MonthBack.filter.bool.filter[0].range.EventDate.lte = moment(lastEndDate).subtract(2, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');


            doorcpiSummary.aggs.Current.filter.bool.filter[0].range.EventDate.gte = moment(lastEndDate).subtract('months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
            doorcpiSummary.aggs.Current.filter.bool.filter[0].range.EventDate.lte = moment(lastEndDate).subtract('months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

            doorcpiSummary.aggs.Previous.filter.bool.filter[0].range.EventDate.gte = moment(lastEndDate).subtract(1, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
            doorcpiSummary.aggs.Previous.filter.bool.filter[0].range.EventDate.lte = moment(lastEndDate).subtract(1, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

            doorcpiSummary.aggs.MonthBack.filter.bool.filter[0].range.EventDate.gte = moment(lastEndDate).subtract(2, 'months').startOf('month').format('YYYY-MM-DD[T00:00:00]');
            doorcpiSummary.aggs.MonthBack.filter.bool.filter[0].range.EventDate.lte = moment(lastEndDate).subtract(2, 'months').endOf('month').format('YYYY-MM-DD[T23:59:59]');

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
            lastdatacpiSummary.query.bool.filter.push(countryIdsUser);
            healthcpiSummary.query.bool.filter.push(countryIdsUser);
            powercpiSummary.query.bool.filter.push(countryIdsUser);
            doorcpiSummary.query.bool.filter.push(countryIdsUser);
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
            lastdatacpiSummary.query.bool.filter.push(filterQuery);
            healthcpiSummary.query.bool.filter.push(filterQuery);
            powercpiSummary.query.bool.filter.push(filterQuery);
            doorcpiSummary.query.bool.filter.push(filterQuery);
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

            assetSummary.query.bool.filter.push(AssetIds);
            lastdatacpiSummary.query.bool.filter.push(AssetIds);
            healthcpiSummary.query.bool.filter.push(AssetIds);
            powercpiSummary.query.bool.filter.push(AssetIds);
            doorcpiSummary.query.bool.filter.push(AssetIds);
        }

        if ((params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) ||
            (params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) ||
            (params.DataDownloadOutlet || params["DataDownloadOutlet[]"]) ||
            (params.UserId || params["UserId[]"]) ||
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

            assetSummary.query.bool.filter.push(LocationIds);
            lastdatacpiSummary.query.bool.filter.push(LocationIds);
            healthcpiSummary.query.bool.filter.push(LocationIds);
            powercpiSummary.query.bool.filter.push(LocationIds);
            doorcpiSummary.query.bool.filter.push(LocationIds);
        }

        if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
            var smartDeviceTypeQuery = {
                "terms": {
                    "AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
                }
            }
            assetSummary.query.bool.filter.push(smartDeviceTypeQuery);
            lastdatacpiSummary.query.bool.filter.push(smartDeviceTypeQuery);
            healthcpiSummary.query.bool.filter.push(smartDeviceTypeQuery);
            powercpiSummary.query.bool.filter.push(smartDeviceTypeQuery);
            doorcpiSummary.query.bool.filter.push(smartDeviceTypeQuery);
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
            assetSummary.query.bool.filter.push(IsKeyLocationFilter);
            lastdatacpiSummary.query.bool.filter.push(IsKeyLocationFilter);
            healthcpiSummary.query.bool.filter.push(IsKeyLocationFilter);
            powercpiSummary.query.bool.filter.push(IsKeyLocationFilter);
            doorcpiSummary.query.bool.filter.push(IsKeyLocationFilter);
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
            assetSummary.query.bool.filter.push(AssetTypeCapacityId);
            lastdatacpiSummary.query.bool.filter.push(AssetTypeCapacityId);
            healthcpiSummary.query.bool.filter.push(AssetTypeCapacityId);
            powercpiSummary.query.bool.filter.push(AssetTypeCapacityId);
            doorcpiSummary.query.bool.filter.push(AssetTypeCapacityId);
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
            assetSummary.query.bool.filter.push(IsFactoryAssetFilter);
            lastdatacpiSummary.query.bool.filter.push(IsFactoryAssetFilter);
            healthcpiSummary.query.bool.filter.push(IsFactoryAssetFilter);
            powercpiSummary.query.bool.filter.push(IsFactoryAssetFilter);
            doorcpiSummary.query.bool.filter.push(IsFactoryAssetFilter);
        }

        if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
            var assetManufactureQuery = {
                "terms": {
                    "AssetManufactureId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
                }
            }
            assetSummary.query.bool.filter.push(assetManufactureQuery);
            lastdatacpiSummary.query.bool.filter.push(assetManufactureQuery);
            healthcpiSummary.query.bool.filter.push(assetManufactureQuery);
            powercpiSummary.query.bool.filter.push(assetManufactureQuery);
            doorcpiSummary.query.bool.filter.push(assetManufactureQuery);
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
            assetSummary.query.bool.filter.push(SalesHierarchyId);
            lastdatacpiSummary.query.bool.filter.push(SalesHierarchyId);
            healthcpiSummary.query.bool.filter.push(SalesHierarchyId);
            powercpiSummary.query.bool.filter.push(SalesHierarchyId);
            doorcpiSummary.query.bool.filter.push(SalesHierarchyId);
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
            assetSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
            lastdatacpiSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
            healthcpiSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
            powercpiSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
            doorcpiSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);

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
            assetSummary.query.bool.filter.push(manufacturerOutletTypeId);
            lastdatacpiSummary.query.bool.filter.push(manufacturerOutletTypeId);
            healthcpiSummary.query.bool.filter.push(manufacturerOutletTypeId);
            powercpiSummary.query.bool.filter.push(manufacturerOutletTypeId);
            doorcpiSummary.query.bool.filter.push(manufacturerOutletTypeId);
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
            assetSummary.query.bool.filter.push(LocationTypeId);
            lastdatacpiSummary.query.bool.filter.push(LocationTypeId);
            healthcpiSummary.query.bool.filter.push(LocationTypeId);
            powercpiSummary.query.bool.filter.push(LocationTypeId);
            doorcpiSummary.query.bool.filter.push(LocationTypeId);
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
            assetSummary.query.bool.filter.push(ClassificationId);
            lastdatacpiSummary.query.bool.filter.push(ClassificationId);
            healthcpiSummary.query.bool.filter.push(ClassificationId);
            powercpiSummary.query.bool.filter.push(ClassificationId);
            doorcpiSummary.query.bool.filter.push(ClassificationId);
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
            assetSummary.query.bool.filter.push(SubTradeChannelTypeId);
            lastdatacpiSummary.query.bool.filter.push(SubTradeChannelTypeId);
            healthcpiSummary.query.bool.filter.push(SubTradeChannelTypeId);
            powercpiSummary.query.bool.filter.push(SubTradeChannelTypeId);
            doorcpiSummary.query.bool.filter.push(SubTradeChannelTypeId);
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
            assetSummary.query.bool.filter.push(AssetManufactureId);
            lastdatacpiSummary.query.bool.filter.push(AssetManufactureId);
            healthcpiSummary.query.bool.filter.push(AssetManufactureId);
            powercpiSummary.query.bool.filter.push(AssetManufactureId);
            doorcpiSummary.query.bool.filter.push(AssetManufactureId);
        }

        if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
            var AssetTypeId = {
                "terms": {
                    "AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
                }
            }
            assetSummary.query.bool.filter.push(AssetTypeId);
            lastdatacpiSummary.query.bool.filter.push(AssetTypeId);
            healthcpiSummary.query.bool.filter.push(AssetTypeId);
            powercpiSummary.query.bool.filter.push(AssetTypeId);
            doorcpiSummary.query.bool.filter.push(AssetTypeId);
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
            assetSummary.query.bool.filter.push(SmartDeviceTypeId);
            lastdatacpiSummary.query.bool.filter.push(SmartDeviceTypeId);
            healthcpiSummary.query.bool.filter.push(SmartDeviceTypeId);
            powercpiSummary.query.bool.filter.push(SmartDeviceTypeId);
            doorcpiSummary.query.bool.filter.push(SmartDeviceTypeId);
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
            assetSummary.query.bool.filter.push(City);
            lastdatacpiSummary.query.bool.filter.push(City);
            healthcpiSummary.query.bool.filter.push(City);
            powercpiSummary.query.bool.filter.push(City);
            doorcpiSummary.query.bool.filter.push(City);
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
            assetSummary.query.bool.filter.push(CountryId);
            lastdatacpiSummary.query.bool.filter.push(CountryId);
            healthcpiSummary.query.bool.filter.push(CountryId);
            powercpiSummary.query.bool.filter.push(CountryId);
            doorcpiSummary.query.bool.filter.push(CountryId);
        }

        if (request.query.LocationCode || request.query["LocationCode[]"]) {
            var LocationCode = {
                "term": {
                    "LocationCode": request.query.LocationCode || request.query["LocationCode[]"]
                }
            }
            assetSummary.query.bool.filter.push(LocationCode);
            lastdatacpiSummary.query.bool.filter.push(LocationCode);
            healthcpiSummary.query.bool.filter.push(LocationCode);
            powercpiSummary.query.bool.filter.push(LocationCode);
            doorcpiSummary.query.bool.filter.push(LocationCode);
        }

        var queries = [{
            key: "db",
            search: {
                index: 'cooler-iot-asseteventdatasummary',
                type: ["AssetEventDataSummary"],
                body: assetSummary,
                ignore_unavailable: true
            }
        }, {
            key: "CPILastDataEvents",
            search: {
                index: 'cooler-iot-asseteventdatasummary',
                type: ["AssetEventDataSummary"],
                body: lastdatacpiSummary,
                ignore_unavailable: true
            }
        },
        {
            key: "CPIHoursLightOnEvents",
            search: {
                index: 'cooler-iot-asseteventdatasummary',
                type: ["AssetEventDataSummary"],
                body: healthcpiSummary,
                ignore_unavailable: true
            }
        },
        {
            key: "CPIPowerEvents",
            search: {
                index: 'cooler-iot-asseteventdatasummary',
                type: ["AssetEventDataSummary"],
                body: powercpiSummary,
                ignore_unavailable: true
            }
        },
        {
            key: "CPIDoorEvents",
            search: {
                index: 'cooler-iot-asseteventdatasummary',
                type: ["AssetEventDataSummary"],
                body: doorcpiSummary,
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
                finalData = {};
            for (var i = 0, len = values.length; i < len; i++) {
                var value = values[i];
                data[value.config.key] = value.response;
                util.setLogger(value);
            }

            var dbAggs = data.db.aggregations,
                powAggs = data.CPIPowerEvents.aggregations,
                doorAggscpi = data.CPIDoorEvents.aggregations,
                dataDownloadAggs = data.CPILastDataEvents.aggregations,
                healthAggs = data.CPIHoursLightOnEvents.aggregations,
                days = moment.duration(totalHours, 'hours').asDays();
            // totalHours = 720;
            ///================for cpi chart============================================//

            if (powAggs) {
                var powerOpenHourCur = 'N/A';
                var powerOpenHourPre = 'N/A';
                var powerOpenHourBack = 'N/A';
                var powerOffHour = 'N/A';
                var powerOpenHourCPI = 'N/A';
                var powerAssetCur = powAggs.Current.AssetCount.value;
                var powerOffHour = moment.duration(powAggs.Current.PowerOffDuration.value, 'second').asHours();
                if (!isNaN(powerOffHour)) {
                    var totalHoursCur = moment(endDate).add('months').daysInMonth() * 24;
                    powerOpenHourCur = Math.abs((totalHoursCur * powerAssetCur - powerOffHour).toFixed(2));
                    powerOpenHourCur = (powerOpenHourCur / powerAssetCur) / moment.duration(totalHours, 'hours').asDays();
                    powerOffHour = (powerOffHour / powerAssetCur) / moment.duration(totalHours, 'hours').asDays();
                    powerOpenHourCur = powerOpenHourCur > 24 ? 24 : powerOpenHourCur < 0 ? 0 : powerOpenHourCur.toFixed(2);
                    powerOffHour = powerOffHour > 24 ? 24 : powerOffHour < 0 ? 0 : powerOffHour;
                }
                var powerOffHourPre = 'N/A';
                var powerAssetPre = powAggs.Previous.AssetCount.value;
                var powerOffHourPre = moment.duration(powAggs.Previous.PowerOffDuration.value, 'second').asHours();
                if (!isNaN(powerOffHourPre)) {
                    var totalHoursPre = moment(endDate).add(-1, 'months').daysInMonth() * 24;
                    powerOpenHourPre = Math.abs((totalHoursPre * powerAssetPre - powerOffHourPre).toFixed(2));
                    powerOpenHourPre = (powerOpenHourPre / powerAssetPre) / moment.duration(totalHoursPre, 'hours').asDays();
                    powerOffHourPre = (powerOffHourPre / powerAssetPre) / moment.duration(totalHoursPre, 'hours').asDays();
                    powerOpenHourPre = powerOpenHourPre > 24 ? 24 : powerOpenHourPre < 0 ? 0 : powerOpenHourPre.toFixed(2);
                    powerOffHourPre = powerOffHourPre > 24 ? 24 : powerOffHourPre < 0 ? 0 : powerOffHourPre;
                }
                var powerOffHour = 'N/A';
                var powerAssetBack = powAggs.MonthBack.AssetCount.value;
                var powerOffHourBack = moment.duration(powAggs.MonthBack.PowerOffDuration.value, 'second').asHours();
                if (!isNaN(powerOffHourBack)) {
                    var totalHoursBack = moment(endDate).add(-2, 'months').daysInMonth() * 24;
                    powerOpenHourBack = Math.abs((totalHoursBack * powerAssetBack - powerOffHourBack).toFixed(2));
                    powerOpenHourBack = (powerOpenHourBack / powerAssetBack) / moment.duration(totalHoursBack, 'hours').asDays();
                    powerOffHourBack = (powerOffHourBack / powerAssetBack) / moment.duration(totalHoursBack, 'hours').asDays();
                    powerOpenHourBack = powerOpenHourBack > 24 ? 24 : powerOpenHourBack < 0 ? 0 : powerOpenHourBack.toFixed(2);
                    powerOffHourBack = powerOffHourBack > 24 ? 24 : powerOffHourBack < 0 ? 0 : powerOffHourBack;
                }
                //===================Easy pie charts=========================//
                var powerOffHour = 'N/A';
                var powerAssetCPI = powAggs.CPI.AssetCount.value;
                var powerOffHourCPI = moment.duration(powAggs.CPI.PowerOffDuration.value, 'second').asHours();
                if (!isNaN(powerOffHourCPI)) {
                    var totalHoursCPI = moment.duration(totalHours, 'hours').asDays() * 24 * powerAssetCPI;
                    powerOpenHourCPI = Math.abs((totalHoursCPI - powerOffHourCPI).toFixed(2));
                    powerOpenHourCPI = (powerOpenHourCPI / powerAssetCPI) / moment.duration(totalHours, 'hours').asDays();

                }
            }

            var doorOpenRateCur, doorOpenRatePre, doorOpenRateBack, doorOpenRateCPI;
            if (doorAggscpi) {
                var assetDays = 0;
                doorOpenRateCPI = 0;
                doorOpenRateCur = 0;
                doorOpenRatePre = 0;
                doorOpenRateBack = 0;
                var doorCountcur = 0;
                var doorCountpre = 0;
                var doorCountback = 0;
                var doorCountCPI = 0;
                //======for easy pie chart================//
                doorAggscpi.CPI.Asset.buckets.forEach(function (curData) {
                    assetDays = curData.doc_count;
                    doorCountCPI += curData.DoorCount.value / assetDays;
                });
                doorOpenRateCPI = ((doorCountCPI / doorAggscpi.CPI.AssetCount.value).toFixed(2));
                //===================================//
                doorAggscpi.Current.Asset.buckets.forEach(function (curData) {
                    assetDays = curData.doc_count;
                    doorCountcur += curData.DoorCount.value / assetDays;
                });
                doorOpenRateCur = ((doorCountcur / doorAggscpi.Current.AssetCount.value).toFixed(2));


                doorAggscpi.Previous.Asset.buckets.forEach(function (preData) {
                    assetDays = preData.doc_count;
                    doorCountpre += preData.DoorCount.value / assetDays;
                });
                doorOpenRatePre = ((doorCountpre / doorAggscpi.Previous.AssetCount.value).toFixed(2));


                doorAggscpi.MonthBack.Asset.buckets.forEach(function (backData) {
                    assetDays = backData.doc_count;
                    doorCountback += backData.DoorCount.value / assetDays;
                });
                doorOpenRateBack = ((doorCountback / doorAggscpi.MonthBack.AssetCount.value).toFixed(2));
            }

            var dataDownloadedCur = 0;
            var dataDownloadedPre = 0;
            var dataDownloadedBack = 0;
            var dataDownloadedCPI = 0;
            if (dataDownloadAggs) {
                dataDownloadedCur = dbAggs.Assets.doc_count != 0 ? Number(((dataDownloadAggs.Current.AssetCount.value / dbAggs.Assets.AssetsCountDistinct.value) * 100).toFixed(2)) : 0;
                dataDownloadedPre = dbAggs.Assets.doc_count != 0 ? Number(((dataDownloadAggs.Previous.AssetCount.value / dbAggs.Assets.AssetsCountDistinct.value) * 100).toFixed(2)) : 0;
                dataDownloadedBack = dbAggs.Assets.doc_count != 0 ? Number(((dataDownloadAggs.MonthBack.AssetCount.value / dbAggs.Assets.AssetsCountDistinct.value) * 100).toFixed(2)) : 0;
                //====for easy pie chart//////////////
                dataDownloadedCPI = dbAggs.Assets.doc_count != 0 ? Number(((dataDownloadAggs.CPI.AssetCount.value / dbAggs.Assets.AssetsCountDistinct.value) * 100).toFixed(2)) : 0;
            }

            var lightOpenHourCur, lightOpenHourPre, lightOpenHourBack, lightOpenHourCPI,
                hoursCorrectTemperatureCur, hoursCorrectTemperaturePre, hoursCorrectTemperatureBack, hoursCorrectTemperatureCPI;
            if (healthAggs) {

                var assetDays = 0;
                var assetHours = 0
                hoursCorrectTemperatureCur = 0;
                hoursCorrectTemperaturePre = 0;
                hoursCorrectTemperatureBack = 0;
                hoursCorrectTemperatureCPI = 0;
                var hoursCorrectTemperatureCPI1 = 0;
                var hoursCorrectTemperatureCur1 = 0;
                var hoursCorrectTemperaturePre1 = 0;
                var hoursCorrectTemperatureBack1 = 0;
                lightOpenHourCur = 0;
                lightOpenHourPre = 0;
                lightOpenHourBack = 0;
                lightOpenHourCPI = 0;
                var lightOpenHourCPI1 = 0;
                var lightOpenHourCur1 = 0;
                var lightOpenHourPre1 = 0;
                var lightOpenHourBack1 = 0;
                //==================for easy pie chart======================//
                healthAggs.CPIHoursCorrectTemperature.Asset.buckets.forEach(function (healthData) {
                    assetDays = healthData.doc_count;
                    assetHours = healthData.HoursCorrectTemperature.value;
                    hoursCorrectTemperatureCPI1 += assetHours / assetDays;
                });
                hoursCorrectTemperatureCPI1 = hoursCorrectTemperatureCPI1 / healthAggs.CPIHoursCorrectTemperature.AssetCount.value;
                //--------------------------------------------------------------------//
                var hoursCorrectTemperatureCPI2 = 0;
                healthAggs.CPINotTempHours.Asset.buckets.forEach(function (healthData) {
                    assetDays = healthData.doc_count;
                    assetHours = healthData.HoursCorrectTemperature.value;
                    hoursCorrectTemperatureCPI2 += assetHours / assetDays;
                });
                hoursCorrectTemperatureCPI2 = hoursCorrectTemperatureCPI2 / healthAggs.CPINotTempHours.AssetCount.value;
                hoursCorrectTemperatureCPI = (hoursCorrectTemperatureCPI1 / hoursCorrectTemperatureCPI2) * 24;

                healthAggs.CPIHoursLightOn.Asset.buckets.forEach(function (healthData) {
                    assetDays = healthData.doc_count;
                    assetHours = healthData.HoursCorrectTemperature.value;
                    lightOpenHourCPI1 += assetHours / assetDays;
                });
                lightOpenHourCPI1 = lightOpenHourCPI1 / healthAggs.CPIHoursLightOn.AssetCount.value;
                //-------------------------------------------------------------------------------//

                lightOpenHourCPI = (lightOpenHourCPI1 / hoursCorrectTemperatureCPI2) * 24;
                //====================end easy pie chart=================================//
                //===========for right temp avg daily for current month=============//
                healthAggs.CurrentHoursCorrectTemperature.Asset.buckets.forEach(function (healthData) {
                    assetDays = healthData.doc_count;
                    assetHours = healthData.HoursCorrectTemperature.value;
                    hoursCorrectTemperatureCur1 += assetHours / assetDays;
                });
                hoursCorrectTemperatureCur1 = hoursCorrectTemperatureCur1 / healthAggs.CurrentHoursCorrectTemperature.AssetCount.value;
                //--------------------------------------------------------------------//
                var hoursCorrectTemperatureCur2 = 0;
                healthAggs.CurrentNotTempHours.Asset.buckets.forEach(function (healthData) {
                    assetDays = healthData.doc_count;
                    assetHours = healthData.HoursCorrectTemperature.value;
                    hoursCorrectTemperatureCur2 += assetHours / assetDays;
                });
                hoursCorrectTemperatureCur2 = hoursCorrectTemperatureCur2 / healthAggs.CurrentNotTempHours.AssetCount.value;
                hoursCorrectTemperatureCur = (hoursCorrectTemperatureCur1 / hoursCorrectTemperatureCur2) * 24;
                //=============================End End End End==========================================//
                //===========For hours light on for current month==================//
                healthAggs.CurrentHoursLightOn.Asset.buckets.forEach(function (healthData) {
                    assetDays = healthData.doc_count;
                    assetHours = healthData.HoursCorrectTemperature.value;
                    lightOpenHourCur1 += assetHours / assetDays;
                });
                lightOpenHourCur1 = lightOpenHourCur1 / healthAggs.CurrentHoursLightOn.AssetCount.value;
                //-------------------------------------------------------------------------------//

                lightOpenHourCur = (lightOpenHourCur1 / hoursCorrectTemperatureCur2) * 24;
                //=============================End End End End==========================================//
                //====================Right avg temp for previous month=====================//
                healthAggs.PreviousHoursCorrectTemperature.Asset.buckets.forEach(function (healthData) {
                    var assetDays = healthData.doc_count;
                    var assetHours = healthData.HoursCorrectTemperature.value;
                    hoursCorrectTemperaturePre1 += assetHours / assetDays;
                });
                hoursCorrectTemperaturePre1 = hoursCorrectTemperaturePre1 / healthAggs.PreviousHoursCorrectTemperature.AssetCount.value;
                //--------------------------------------------------------------------------------//
                var hoursCorrectTemperaturePre2 = 0;
                healthAggs.PrevioustNotTempHours.Asset.buckets.forEach(function (healthData) {
                    var assetDays = healthData.doc_count;
                    var assetHours = healthData.HoursCorrectTemperature.value;
                    hoursCorrectTemperaturePre2 += assetHours / assetDays;
                });
                hoursCorrectTemperaturePre2 = hoursCorrectTemperaturePre2 / healthAggs.PrevioustNotTempHours.AssetCount.value;
                hoursCorrectTemperaturePre = (hoursCorrectTemperaturePre1 / hoursCorrectTemperaturePre2) * 24;
                //============================End End End End========================================//
                //===========================for hours light on for previous month=============//
                healthAggs.PreviousHoursLightOn.Asset.buckets.forEach(function (healthData) {
                    var assetDays = healthData.doc_count;
                    var assetHours = healthData.HoursCorrectTemperature.value;
                    lightOpenHourPre1 += assetHours / assetDays;
                });
                lightOpenHourPre1 = lightOpenHourPre1 / healthAggs.PreviousHoursLightOn.AssetCount.value;
                //-------------------------------------------------------------------------------//

                lightOpenHourPre = (lightOpenHourPre1 / hoursCorrectTemperaturePre2) * 24;
                //============================End End End End========================================//
                //=====================for right avg temp for 2 month back====================//
                healthAggs.MonthBackHoursCorrectTemperature.Asset.buckets.forEach(function (healthData) {
                    assetDays = healthData.doc_count;
                    assetHours = healthData.HoursCorrectTemperature.value;
                    hoursCorrectTemperatureBack1 += assetHours / assetDays;
                });
                hoursCorrectTemperatureBack1 = hoursCorrectTemperatureBack1 / healthAggs.MonthBackHoursCorrectTemperature.AssetCount.value;
                //-------------------------------------------------------------------------------------//
                var hoursCorrectTemperatureBack2 = 0;
                healthAggs.MonthBackNotTempHours.Asset.buckets.forEach(function (healthData) {
                    assetDays = healthData.doc_count;
                    assetHours = healthData.HoursCorrectTemperature.value;
                    hoursCorrectTemperatureBack2 += assetHours / assetDays;
                });
                hoursCorrectTemperatureBack2 = hoursCorrectTemperatureBack2 / healthAggs.MonthBackNotTempHours.AssetCount.value;
                hoursCorrectTemperatureBack = (hoursCorrectTemperatureBack1 / hoursCorrectTemperatureBack2) * 24;
                //============================End End End End========================================//
                //==================hours light on for 2 month back ======================//
                healthAggs.MonthBackHoursLightOn.Asset.buckets.forEach(function (healthData) {
                    var assetDays = healthData.doc_count;
                    var assetHours = healthData.HoursCorrectTemperature.value;
                    lightOpenHourBack1 += assetHours / assetDays;
                });
                lightOpenHourBack1 = lightOpenHourBack1 / healthAggs.MonthBackHoursLightOn.AssetCount.value;
                //----------------------------------------------------------------------------//

                lightOpenHourBack = (lightOpenHourBack1 / hoursCorrectTemperatureBack2) * 24;
                //============================End End End End========================================//
            }

            var EventDate = moment(endDate).format('MMM');
            var previousMonth = moment(endDate).add(-1, 'months').format('MMM');
            var previousMonth2 = moment(endDate).add(-2, 'months').format('MMM');

            finalData.summary = {
                hoursCorrectTemperatureCur: hoursCorrectTemperatureCur,
                hoursCorrectTemperaturePre: hoursCorrectTemperaturePre,
                hoursCorrectTemperatureBack: hoursCorrectTemperatureBack,
                powerOpenHourBack: powerOpenHourBack,
                powerOpenHourPre: powerOpenHourPre,
                powerOpenHourCur: powerOpenHourCur,
                dataDownloadedBack: dataDownloadedBack,
                lightOpenHourBack: lightOpenHourBack,
                dataDownloadedPre: dataDownloadedPre,
                lightOpenHourPre: lightOpenHourPre,
                dataDownloadedCur: dataDownloadedCur,
                lightOpenHourCur: lightOpenHourCur,
                doorOpenRateBack: doorOpenRateBack,
                doorOpenRatePre: doorOpenRatePre,
                doorOpenRateCur: doorOpenRateCur,
                lightOpenHourCPI: lightOpenHourCPI,
                hoursCorrectTemperatureCPI: hoursCorrectTemperatureCPI,
                dataDownloadedCPI: dataDownloadedCPI,
                doorOpenRateCPI: doorOpenRateCPI,
                powerOpenHourCPI: powerOpenHourCPI,
                EventDate: moment(endDate).format('MMM'),
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
    },
    getKpiWidgetDataForCommercialView: function (request, reply) {
        request.query = Object.assign({}, request.query, request.payload);
        reply.query = Object.assign({}, request.query, request.payload);
        var clientId = request.auth.credentials.user.ScopeId;
        var credentials = request.auth.credentials;
        var params = Object.assign({}, request.query, request.payload),
            alertSummary = JSON.parse(this.dashboardQueries.alertSummaryCommercial),
            assetSummary = JSON.parse(this.dashboardQueries.assetSummaryCommercial),
            doorSummary = JSON.parse(this.dashboardQueries.kpiDoorSummaryPieChartCommercial),
            kpiSalesSummaryTrend = JSON.parse(this.dashboardQueries.kpiSalesSummaryTrendCommercial),
            powerSummary = JSON.parse(this.dashboardQueries.powerSummaryCommercial),
            kpiSalesSummary = JSON.parse(this.dashboardQueries.kpiSalesSummaryCommercial);
        // client Filter
        var clientQuery = {
            "term": {
                "ClientId": clientId
            }
        };
        if (clientId != 0) {
            alertSummary.query.bool.filter.push(clientQuery);
            assetSummary.query.bool.filter.push(clientQuery);
            doorSummary.query.bool.filter.push(clientQuery);
            kpiSalesSummary.query.bool.filter.push(clientQuery);
            kpiSalesSummaryTrend.query.bool.filter.push(clientQuery);
            powerSummary.query.bool.filter.push(clientQuery);
        }


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
            alertSummary.query.bool.filter.push({
                "range": {
                    "AlertAt": {
                        "gte": "now-30d/d"
                    }
                }
            });
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

            doorSummary.query.bool.filter.push(dateRangeQuery);
            powerSummary.query.bool.filter.push(dateRangeQuery);
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
            alertSummary.query.bool.filter.push({
                "range": {
                    "AlertAt": {
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


            doorSummary.query.bool.filter.push(dateRangeQuery);
            powerSummary.query.bool.filter.push(dateRangeQuery);
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
                alertSummary.query.bool.filter.push({
                    "bool": {
                        "should": []
                    }
                });

                doorSummary.query.bool.filter.push({
                    "bool": {
                        "should": []
                    }
                });
                powerSummary.query.bool.filter.push({
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

            var alertSummaryDateRange = {
                "range": {
                    "AlertAt": {
                        "gte": startDate,
                        "lte": endDate
                    }
                }
            };
            alertSummary = util.pushDateQuery(alertSummary, alertSummaryDateRange);
            doorSummary = util.pushDateQuery(doorSummary, dateRangeQuery);
            powerSummary = util.pushDateQuery(powerSummary, dateRangeQuery);
            var visitDateRange = {
                "range": {
                    "EventDate": {
                        "gte": startDate,
                        "lte": endDate
                    }
                }
            };

            var assetVisitDateRange = {
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

        //util.applyReducers(request, params, totalHours, reducers, function (_this, assetIds, locationIds) {
        var assetIds = params.Assets ? params.Assets.split(",") : null;
        var locationIds = params.Locations ? params.Locations.split(",") : null;
        var _this = this;
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


            alertSummary.query.bool.filter.push(locationQuery);
            doorSummary.query.bool.filter.push(locationQuery);
            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
            assetSummary.aggs.SmartAssets.filter.bool.must.push(locationQuery);
            assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
            powerSummary.query.bool.filter.push(locationQuery);
            assetSummary.aggs.SmartLocation.filter.bool.must.push(locationQuery);
            assetSummary.aggs.NonSmartLocation.filter.bool.must.push(locationQuery);
            var tags = credentials.tags,
                limitLocation = Number(tags.LimitLocation);
            if (Object.keys(request.query).filter(data => data != "startDate" && data != "endDate" && data != "sellerTop" && data != "customerTop" && data != "yearWeek" && data != "dayOfWeek" && data != "quarter" && data != "month").length == 0) {
                if (limitLocation != 0) {
                    kpiSalesSummary.query.bool.filter.push({
                        "terms": {
                            LocationId: limitLocation.length != 0 ? limitLocation : [-1]
                        }
                    });
                    kpiSalesSummaryTrend.query.bool.filter.push({
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
                    kpiSalesSummary.query.bool.filter.push(locationQuery);
                    kpiSalesSummaryTrend.query.bool.filter.push(locationQuery);
                }
            } else {
                assetSummary.aggs.Assets.filter.bool.must.push(locationQuery);
                assetSummary.aggs.SmartAssetCount.filter.bool.must.push(locationQuery);
                assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(locationQuery);
                assetSummary.aggs.Locations.filter.bool.must.push(locationQueryOutlet);
                kpiSalesSummary.query.bool.filter.push(locationQuery);
                kpiSalesSummaryTrend.query.bool.filter.push(locationQuery);
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

            kpiSalesSummary.query.bool.filter.push(filterQuery);
            kpiSalesSummaryTrend.query.bool.filter.push(filterQuery);
            doorSummary.query.bool.filter.push(filterQuery);
            alertSummary.query.bool.filter.push(filterQuery);
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
            doorSummary.query.bool.filter.push(smartDeviceTypeQuery);
            alertSummary.query.bool.filter.push(smartDeviceTypeQuery);
            powerSummary.query.bool.filter.push(smartDeviceTypeQuery);
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
            assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(assetManufactureQuery);
            doorSummary.query.bool.filter.push(assetManufactureQuery);
            alertSummary.query.bool.filter.push(assetManufactureQuery);
            powerSummary.query.bool.filter.push(assetManufactureQuery);
            assetSummary.aggs.SmartLocation.filter.bool.must.push(assetManufactureQuery);
            assetSummary.aggs.NonSmartLocation.filter.bool.must.push(assetManufactureQuery);
        }

        // if (request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]) {
        //     if (request.query.SmartDeviceManufacturerId.constructor !== Array) {
        //         var toArray = request.query.SmartDeviceManufacturerId;
        //         request.query.SmartDeviceManufacturerId = [];
        //         request.query.SmartDeviceManufacturerId.push(toArray);
        //     }

        //     var manufacturerSmartDeviceQuery = {
        //         "terms": {
        //             "SmartDeviceManufacturerId": request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]
        //         }
        //     }
        //     assetSummary.aggs.Assets.filter.bool.must.push(manufacturerSmartDeviceQuery);
        //     assetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerSmartDeviceQuery);
        //     assetSummary.aggs.SmartAssetCountWareHouse.filter.bool.must.push(manufacturerSmartDeviceQuery);
        //     doorSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
        //     alertSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
        //     powerSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
        //     assetSummary.aggs.SmartLocation.filter.bool.must.push(manufacturerSmartDeviceQuery);
        //     assetSummary.aggs.NonSmartLocation.filter.bool.must.push(manufacturerSmartDeviceQuery);
        // }

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
            alertSummary.query.bool.filter.push(assetQuery);
            powerSummary.query.bool.filter.push(assetQuery);
            assetSummary.aggs.SmartLocation.filter.bool.must.push(assetQuery);
            assetSummary.aggs.NonSmartLocation.filter.bool.must.push(assetQuery);
        }

        //console.log(JSON.stringify(kpiSalesSummary));
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
        //console.log(indexNames.toString());
        var queries = [{
            key: "doorData",
            search: {
                index: indexNames.toString(),
                body: doorSummary,
                ignore_unavailable: true
            }
        }, {
            key: "alert",
            search: {
                index: 'cooler-iot-alert',
                body: alertSummary,
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
            key: "sales",
            search: {
                index: indexNamesSales.toString(),
                body: kpiSalesSummary,
                ignore_unavailable: true
            }
        }, {
            key: "salesTrend",
            search: {
                index: indexNamesSalesTrend.toString(),
                body: kpiSalesSummaryTrend,
                ignore_unavailable: true
            }
        }, {
            key: "powerEvents",
            search: {
                index: indexNames.toString(),
                body: powerSummary,
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
                    }]
                };
            for (var i = 0, len = values.length; i < len; i++) {
                var value = values[i];
                data[value.config.key] = value.response;
                //util.setLogger(value);
            }

            var alertAggs = data.alert.aggregations,
                dbAggs = data.db.aggregations,
                doorAggs = data.doorData.aggregations,
                salesAggs = data.sales.aggregations,
                salesTrendAggs = data.salesTrend.aggregations,
                powerAggs = data.powerEvents.aggregations,
                doorCount, doorOpenRate, doorOpenDuration, doorSumDuration;


            var doorOpens,
                days = moment.duration(totalHours, 'hours').asDays(),
                doorData = finalData.doorData;

            var locationDataMap = [];

            if (doorAggs) {
                doorCount = doorAggs.DoorCount.value;
                doorOpenRate = (doorCount / doorAggs.AssetCount.value) / totalHours;
                doorSumDuration = doorAggs.SumDoorOpenDuration;
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

            if (doorAggs || salesAggs) {
                var doorTarget = 0;
                var salesTarget = 0;
                var doorActual = 0;
                var salesActual = 0;
                var salesIssue = true;
                var doorIssue = true;
                dbAggs.SmartLocation.Location.buckets.forEach(function (locationData) {
                    var locationId = locationData.key;
                    doorTarget = 0;
                    salesTarget = 0;
                    salesActual = 0;
                    doorActual = 0;
                    doorTarget = locationData.DoorOpenTarget.value;
                    salesTarget = locationData.SalesTarget.value;
                    var doorValue;
                    if (doorAggs) {
                        doorValue = doorAggs.Location.buckets.filter(data => data.key == locationId);
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

                    doorTarget = doorTarget * days;
                    salesTarget = salesTarget * days;

                    salesIssue = salesTarget === 0 ? true : salesActual < salesTarget ? true : false;
                    doorIssue = doorTarget === 0 ? true : doorActual < doorTarget ? true : false;

                    if (!(salesTarget == 0 && doorTarget == 0)) {
                        var loc = locationDataMap.filter(data => data.Id == locationId);
                        if (salesIssue && !doorIssue) {
                            finalData.dooorSales[0].y++;
                            finalData.dooorSales[0].x++;
                            if (loc && loc.length > 0) {
                                loc[0].Utilization = "Low Sales & High Door Utilization";
                            } else {
                                locationDataMap.push({
                                    Id: locationId,
                                    Utilization: "Low Sales & High Door Utilization",
                                    LocationGeo: {
                                        "lat": locationData.Lat.bounds.top_left.lat,
                                        "lon": locationData.Lat.bounds.top_left.lon
                                    }
                                })
                            }
                        } else if (!salesIssue && !doorIssue) {
                            finalData.dooorSales[1].y++;
                            finalData.dooorSales[1].x++;
                            if (loc && loc.length > 0) {
                                loc[0].Utilization = "High Sales & High Door Utilization";
                            } else {
                                locationDataMap.push({
                                    Id: locationId,
                                    Utilization: "High Sales & High Door Utilization",
                                    LocationGeo: {
                                        "lat": locationData.Lat.bounds.top_left.lat,
                                        "lon": locationData.Lat.bounds.top_left.lon
                                    }
                                })
                            }
                        } else if (!salesIssue && doorIssue) {
                            finalData.dooorSales[2].y++;
                            finalData.dooorSales[2].x++;
                            if (loc && loc.length > 0) {
                                loc[0].Utilization = "High Sales & Low Door Utilization";
                            } else {
                                locationDataMap.push({
                                    Id: locationId,
                                    Utilization: "High Sales & Low Door Utilization",
                                    LocationGeo: {
                                        "lat": locationData.Lat.bounds.top_left.lat,
                                        "lon": locationData.Lat.bounds.top_left.lon
                                    }
                                })
                            }
                        } else if (salesIssue && doorIssue) {
                            finalData.dooorSales[3].y++;
                            finalData.dooorSales[3].x++;
                            if (loc && loc.length > 0) {
                                loc[0].Utilization = "Low Sales & Low Door Utilization";
                            } else {
                                locationDataMap.push({
                                    Id: locationId,
                                    Utilization: "Low Sales & Low Door Utilization",
                                    LocationGeo: {
                                        "lat": locationData.Lat.bounds.top_left.lat,
                                        "lon": locationData.Lat.bounds.top_left.lon
                                    }
                                })
                            }
                        }
                    }
                });

                dbAggs.NonSmartLocation.Location.buckets.forEach(function (locationData) {
                    var locationId = locationData.key;
                    salesTarget = 0;
                    salesActual = 0;
                    salesTarget = locationData.SalesTarget.value;
                    var salesValue;
                    if (salesAggs) {
                        salesValue = salesAggs.Location.buckets.filter(data => data.key == locationId);
                    }

                    if (salesValue && salesValue.length > 0) {
                        salesActual = salesValue[0].SalesVolume.value;
                    }
                    salesTarget = salesTarget * days;

                    if (!salesTarget == 0) {
                        var loc = locationDataMap.filter(data => data.Id == locationId);
                        if (salesActual < salesTarget || salesTarget == 0) {
                            finalData.dooorSales[4].y++;
                            finalData.dooorSales[4].x++;
                            if (loc && loc.length > 0) {
                                loc[0].Utilization = "Non Smart Low Sales";
                            } else {
                                locationDataMap.push({
                                    Id: locationId,
                                    Utilization: "Non Smart Low Sales",
                                    LocationGeo: {
                                        "lat": locationData.Lat.bounds.top_left.lat,
                                        "lon": locationData.Lat.bounds.top_left.lon
                                    }
                                })
                            }
                        } else if (salesActual >= salesTarget) {
                            finalData.dooorSales[5].y++;
                            finalData.dooorSales[5].x++;
                            if (loc && loc.length > 0) {
                                loc[0].Utilization = "Non Smart High Sales";
                            } else {
                                locationDataMap.push({
                                    Id: locationId,
                                    Utilization: "Non Smart High Sales",
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
            finalData.dooorSales.forEach(function (data) {
                if (data.y == 0) {
                    data.y = 0.1;
                }
            });


            var totalAsset = dbAggs.AssetCount.doc_count;
            var smartAssetCount = dbAggs.SmartAssetCount.doc_count;

            if (salesAggs && doorAggs) {
                finalData.dooropeningSales = [{
                    "DoorOpening": (salesAggs.SalesVolume.value) == 0 ? 0 : ((doorAggs.DoorCount.value) / (salesAggs.SalesVolume.value * 24)).toFixed(2),
                    "Sales": 200
                }]
            }

            var salesVolume = 'N/A',
                trendChart = 0,
                transections = 'N/A';
            var locationId, avgSales, avgCapacity, avgVolumeBucket;
            if (salesAggs) {
                salesVolume = salesAggs.SalesVolume.value;
                var salesVolumeTrend = salesTrendAggs.SalesVolume.value;
                trendChart = salesVolume - salesVolumeTrend;
                trendChart = trendChart != 0 ? (trendChart / salesVolumeTrend) * 100 : 0;
                transections = data.sales.hits.total;
                salesVolume = transections > 0 ? salesVolume : 'N/A';
                salesAggs.Location.buckets.forEach(function (locationSales) {
                    avgCapacity = 0;
                    locationId = locationSales.key;
                    avgSales = locationSales.AvgSalesVolume.value != 0 ? locationSales.SalesVolume.value / locationSales.AvgSalesVolume.value : 0;
                    avgSales = avgSales / Number(months.toFixed(2));
                    avgVolumeBucket = dbAggs.SmartLocation.Location.buckets.filter(data => data.key == locationId);
                    if (avgVolumeBucket && avgVolumeBucket.length > 0) {
                        avgCapacity = avgVolumeBucket[0].Capacity.value;
                    }
                    if (avgCapacity > 0) {
                        if (avgCapacity >= 100 && avgCapacity < 500) {
                            finalData.avgCapacity[0].Sales += avgSales;
                        } else if (avgCapacity >= 500 && avgCapacity < 1000) {
                            finalData.avgCapacity[1].Sales += avgSales;
                        } else if (avgCapacity >= 1000 && avgCapacity < 3000) {
                            finalData.avgCapacity[2].Sales += avgSales;
                        }
                    }
                });
            }
            var openAlert = 'N/A',
                alarmRate;
            if (alertAggs) {
                alarmRate = totalAsset == 0 ? 0 : (alertAggs.AssetWithAlertCount.value / totalAsset) * 100;
            }

            var powerOpenHour = 'N/A';
            var powerOffHour = 'N/A';
            if (powerAggs) {
                var powerAsset = powerAggs.AssetCount.value;
                powerOffHour = moment.duration(powerAggs.PowerOffDuration.value, 'second').asHours();
                if (!isNaN(powerOffHour)) {
                    powerOpenHour = Math.abs(totalHours * powerAsset - powerOffHour);
                    powerOpenHour = (powerOpenHour / powerAsset) / moment.duration(totalHours, 'hours').asDays();
                    powerOffHour = (powerOffHour / powerAsset) / moment.duration(totalHours, 'hours').asDays();
                    powerOpenHour = powerOpenHour > 24 ? 24 : powerOpenHour < 0 ? 0 : powerOpenHour;
                    powerOffHour = powerOffHour > 24 ? 24 : powerOffHour < 0 ? 0 : powerOffHour;
                }
            }
            finalData.summary = {
                totalCooler: totalAsset,
                totalCustomer: dbAggs.LocationCount.doc_count,
                filteredAssets: dbAggs.Assets.doc_count,
                filteredOutlets: dbAggs.Locations.doc_count,
                coolerMoves: 0,
                openAlert: 0,
                totalSmartAssetCount: dbAggs.TotalSmartAssetCount.doc_count,
                alarmRate: alarmRate,
                missingCooler: 0,
                doorOpenDuration: doorOpenDuration,
                hourlyDoorOpen: doorOpenRate,
                salesVisitDuration: 0,
                hourlyFootTraffic: 30,
                salesVolume: salesVolume,
                locationData: locationDataMap,
                trendChart: trendChart,
                visitPerMonth: 0,
                smartAssetCount: smartAssetCount,
                smartAssetCountWareHouse: dbAggs.SmartAssetCountWareHouse.doc_count,
                hoursPowerOn: powerOpenHour
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
    getKPIWidgetData: function (request, reply) {
        request.query = Object.assign({}, request.query, request.payload);
        reply.query = Object.assign({}, request.query, request.payload);
        var clientId = request.auth.credentials.user.ScopeId;
        var credentials = request.auth.credentials;
        var params = Object.assign({}, request.query, request.payload),
            //totalAssetLocation = JSON.parse(this.dashboardQueries.TotalAssetLocation),
            healthSummary = JSON.parse(this.dashboardQueries.healthSummaryCoolerTelemetry),
            healthSummaryAmbiant = JSON.parse(this.dashboardQueries.healthSummaryAmbiant),
            assetSummary = JSON.parse(this.dashboardQueries.assetSummaryCoolerTelemetry),
            doorSummary = JSON.parse(this.dashboardQueries.doorSummaryCoolerTelemetry),
            kpiSmartDeviceEventTypeSummary = JSON.parse(this.dashboardQueries.kpiSmartDeviceEventTypeSummaryCoolerTelemetry);
        // assetVisitSummary = JSON.parse(this.dashboardQueries.assetVisitSummaryCoolerTelemetry);
        // client Filter
        var clientQuery = {
            "term": {
                "ClientId": clientId
            }
        };
        if (clientId != 0) {
            healthSummary.query.bool.filter.push(clientQuery);
            healthSummaryAmbiant.query.bool.filter.push(clientQuery);
            assetSummary.query.bool.filter.push(clientQuery);
            //totalAssetLocation.query.bool.filter.push(clientQuery);
            doorSummary.query.bool.filter.push(clientQuery);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push(clientQuery);
            // assetVisitSummary.query.bool.filter.push(clientQuery);
        }

        //EventDate Filter
        var isDefaultDateFilter = params.yearWeek || params.dayOfWeek || params.quarter || params.month;
        var dateFilter = [];
        var totalHours = 0
        var quarterArr = [];
        var dateFilterTrend = [];
        if (!isDefaultDateFilter && !params.startDate && !params.endDate) {
            var dateRangeQuery = {
                "range": {
                    "EventDate": {
                        "gte": "now-30d/d"
                    }
                }
            };
            healthSummary.query.bool.filter.push(dateRangeQuery);
            healthSummaryAmbiant.query.bool.filter.push(dateRangeQuery);
            doorSummary.query.bool.filter.push(dateRangeQuery);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push({
                "range": {
                    "EventDate": {
                        "gte": "now-30d/d"
                    }
                }
            });
            // assetVisitSummary.query.bool.filter.push({
            //     "range": {
            //         "EventDate": {
            //             "gte": "now-30d/d"
            //         }
            //     }
            // });
            totalHours = defaultHours;
        } else if (!isDefaultDateFilter && params.startDate && params.endDate) {
            var startDate = moment(params.startDate).format('YYYY-MM-DD[T00:00:00]');
            var endDate = moment(params.endDate).format('YYYY-MM-DD[T23:59:59]');
            var dateRangeQuery = {
                "range": {
                    "EventDate": {
                        "gte": startDate,
                        "lte": endDate
                    }
                }
            };
            healthSummary.query.bool.filter.push(dateRangeQuery);
            healthSummaryAmbiant.query.bool.filter.push(dateRangeQuery);
            doorSummary.query.bool.filter.push(dateRangeQuery);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push({
                "range": {
                    "EventDate": {
                        "gte": startDate,
                        "lte": endDate
                    }
                }
            });
            // assetVisitSummary.query.bool.filter.push({
            //     "range": {
            //         "EventDate": {
            //             "gte": startDate,
            //             "lte": endDate
            //         }
            //     }
            // });
            totalHours = moment(endDate).diff(moment(startDate), 'hours') + 1
        }
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
                healthSummaryAmbiant.query.bool.filter.push({
                    "bool": {
                        "should": []
                    }
                });
                doorSummary.query.bool.filter.push({
                    "bool": {
                        "should": []
                    }
                });

                kpiSmartDeviceEventTypeSummary.query.bool.filter.push({
                    "bool": {
                        "should": []
                    }
                });
                // assetVisitSummary.query.bool.filter.push({
                //     "bool": {
                //         "should": []
                //     }
                // });

            }
            var dateRangeQuery = {
                "range": {
                    "EventDate": {
                        "gte": startDate,
                        "lte": endDate
                    }
                }
            };
            healthSummary = util.pushDateQuery(healthSummary, dateRangeQuery);
            healthSummaryAmbiant = util.pushDateQuery(healthSummaryAmbiant, dateRangeQuery);

            doorSummary = util.pushDateQuery(doorSummary, dateRangeQuery);
            kpiSmartDeviceEventTypeSummary = util.pushDateQuery(kpiSmartDeviceEventTypeSummary, {
                "range": {
                    "EventDate": {
                        "gte": startDate,
                        "lte": endDate
                    }
                }
            });

            // var visitRangeQuery = {
            //     "range": {
            //         "EventDate": {
            //             "gte": startDate,
            //             "lte": endDate
            //         }
            //     }
            // };
            // assetVisitSummary = util.pushDateQuery(assetVisitSummary, visitRangeQuery);

        }
        var _this = this;
        this.dateFilter = dateFilter;

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
            assetSummary.query.bool.filter.push(countryIdsUser);
            //totalAssetLocation.aggs.AssetCount.filter.bool.must.push(countryIdsUser);
            //totalAssetLocation.aggs.LocationCount.filter.bool.must.push(countryIdsUser);

            doorSummary.query.bool.filter.push(countryIdsUser);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push(countryIdsUser);
            // assetVisitSummary.query.bool.filter.push(filterQuery);
            healthSummary.query.bool.filter.push(countryIdsUser);
            healthSummaryAmbiant.query.bool.filter.push(countryIdsUser);
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
            assetSummary.query.bool.filter.push(filterQuery);
            //totalAssetLocation.aggs.AssetCount.filter.bool.must.push(filterQuery);
            //totalAssetLocation.aggs.LocationCount.filter.bool.must.push(filterQuery);

            doorSummary.query.bool.filter.push(filterQuery);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push(filterQuery);
            // assetVisitSummary.query.bool.filter.push(filterQuery);
            healthSummary.query.bool.filter.push(filterQuery);
            healthSummaryAmbiant.query.bool.filter.push(filterQuery);

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
            assetSummary.aggs.Locations.filter.bool.must.push(AssetIds);

            doorSummary.query.bool.filter.push(AssetIds);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push(AssetIds);
            // assetVisitSummary.query.bool.filter.push(filterQuery);
            healthSummary.query.bool.filter.push(AssetIds);
            healthSummaryAmbiant.query.bool.filter.push(AssetIds);
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
            assetSummary.aggs.Locations.filter.bool.must.push(LocationIds);

            doorSummary.query.bool.filter.push(LocationIds);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push(LocationIds);
            // assetVisitSummary.query.bool.filter.push(filterQuery);
            healthSummary.query.bool.filter.push(LocationIds);
            healthSummaryAmbiant.query.bool.filter.push(LocationIds);
        }

        if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
            var smartDeviceTypeQuery = {
                "terms": {
                    "AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
                }
            }
            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(smartDeviceTypeQuery);
            assetSummary.aggs.Locations.filter.bool.must.push(smartDeviceTypeQuery);
            doorSummary.query.bool.filter.push(smartDeviceTypeQuery);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push(smartDeviceTypeQuery);
            // assetVisitSummary.query.bool.filter.push(smartDeviceTypeQuery);
            healthSummary.query.bool.filter.push(smartDeviceTypeQuery);
            healthSummaryAmbiant.query.bool.filter.push(smartDeviceTypeQuery);
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
            doorSummary.query.bool.filter.push(IsKeyLocationFilter);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push(IsKeyLocationFilter);
            // assetVisitSummary.query.bool.filter.push(smartDeviceTypeQuery);
            healthSummary.query.bool.filter.push(IsKeyLocationFilter);
            healthSummaryAmbiant.query.bool.filter.push(IsKeyLocationFilter);
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
            doorSummary.query.bool.filter.push(IsFactoryAssetFilter);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push(IsFactoryAssetFilter);
            // assetVisitSummary.query.bool.filter.push(smartDeviceTypeQuery);
            healthSummary.query.bool.filter.push(IsFactoryAssetFilter);
            healthSummaryAmbiant.query.bool.filter.push(IsFactoryAssetFilter);
        }

        if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
            var assetManufactureQuery = {
                "terms": {
                    "AssetManufactureId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
                }
            }
            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetManufactureQuery);
            assetSummary.aggs.Locations.filter.bool.must.push(assetManufactureQuery);
            doorSummary.query.bool.filter.push(assetManufactureQuery);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push(assetManufactureQuery);
            // assetVisitSummary.query.bool.filter.push(smartDeviceTypeQuery);
            healthSummary.query.bool.filter.push(assetManufactureQuery);
            healthSummaryAmbiant.query.bool.filter.push(assetManufactureQuery);
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
            assetSummary.aggs.Locations.filter.bool.must.push(SalesHierarchyId);
            doorSummary.query.bool.filter.push(SalesHierarchyId);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push(SalesHierarchyId);
            // assetVisitSummary.query.bool.filter.push(smartDeviceTypeQuery);
            healthSummary.query.bool.filter.push(SalesHierarchyId);
            healthSummaryAmbiant.query.bool.filter.push(SalesHierarchyId);
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
            assetSummary.aggs.Locations.filter.bool.must.push(manufacturerSmartDeviceQuery);
            doorSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
            // assetVisitSummary.query.bool.filter.push(smartDeviceTypeQuery);
            healthSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
            healthSummaryAmbiant.query.bool.filter.push(manufacturerSmartDeviceQuery);
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
            assetSummary.aggs.Locations.filter.bool.must.push(manufacturerOutletTypeId);
            doorSummary.query.bool.filter.push(manufacturerOutletTypeId);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push(manufacturerOutletTypeId);
            // assetVisitSummary.query.bool.filter.push(smartDeviceTypeQuery);
            healthSummary.query.bool.filter.push(manufacturerOutletTypeId);
            healthSummaryAmbiant.query.bool.filter.push(manufacturerOutletTypeId);
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
            assetSummary.aggs.Locations.filter.bool.must.push(LocationTypeId);
            doorSummary.query.bool.filter.push(LocationTypeId);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push(LocationTypeId);
            // assetVisitSummary.query.bool.filter.push(smartDeviceTypeQuery);
            healthSummary.query.bool.filter.push(LocationTypeId);
            healthSummaryAmbiant.query.bool.filter.push(LocationTypeId);
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
            assetSummary.aggs.Locations.filter.bool.must.push(ClassificationId);
            doorSummary.query.bool.filter.push(ClassificationId);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push(ClassificationId);
            // assetVisitSummary.query.bool.filter.push(smartDeviceTypeQuery);
            healthSummary.query.bool.filter.push(ClassificationId);
            healthSummaryAmbiant.query.bool.filter.push(ClassificationId);
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
            assetSummary.aggs.Locations.filter.bool.must.push(SubTradeChannelTypeId);
            doorSummary.query.bool.filter.push(SubTradeChannelTypeId);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push(SubTradeChannelTypeId);
            // assetVisitSummary.query.bool.filter.push(smartDeviceTypeQuery);
            healthSummary.query.bool.filter.push(SubTradeChannelTypeId);
            healthSummaryAmbiant.query.bool.filter.push(SubTradeChannelTypeId);
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
            doorSummary.query.bool.filter.push(AssetManufactureId);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push(AssetManufactureId);
            // assetVisitSummary.query.bool.filter.push(smartDeviceTypeQuery);
            healthSummary.query.bool.filter.push(AssetManufactureId);
            healthSummaryAmbiant.query.bool.filter.push(AssetManufactureId);
        }

        if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
            var AssetTypeId = {
                "terms": {
                    "AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
                }
            }
            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetTypeId);
            assetSummary.aggs.Locations.filter.bool.must.push(AssetTypeId);
            doorSummary.query.bool.filter.push(AssetTypeId);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push(AssetTypeId);
            // assetVisitSummary.query.bool.filter.push(smartDeviceTypeQuery);
            healthSummary.query.bool.filter.push(AssetTypeId);
            healthSummaryAmbiant.query.bool.filter.push(AssetTypeId);
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
            assetSummary.aggs.Locations.filter.bool.must.push(SmartDeviceTypeId);
            doorSummary.query.bool.filter.push(SmartDeviceTypeId);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push(SmartDeviceTypeId);
            // assetVisitSummary.query.bool.filter.push(smartDeviceTypeQuery);
            healthSummary.query.bool.filter.push(SmartDeviceTypeId);
            healthSummaryAmbiant.query.bool.filter.push(SmartDeviceTypeId);
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
            doorSummary.query.bool.filter.push(City);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push(City);
            // assetVisitSummary.query.bool.filter.push(smartDeviceTypeQuery);
            healthSummary.query.bool.filter.push(City);
            healthSummaryAmbiant.query.bool.filter.push(City);
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
            doorSummary.query.bool.filter.push(CountryId);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push(CountryId);
            // assetVisitSummary.query.bool.filter.push(smartDeviceTypeQuery);
            healthSummary.query.bool.filter.push(CountryId);
            healthSummaryAmbiant.query.bool.filter.push(CountryId);
        }

        if (request.query.LocationCode || request.query["LocationCode[]"]) {
            var LocationCode = {
                "term": {
                    "LocationCode": request.query.LocationCode || request.query["LocationCode[]"]
                }
            }
            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(LocationCode);
            assetSummary.aggs.Locations.filter.bool.must.push(LocationCode);
            doorSummary.query.bool.filter.push(LocationCode);
            kpiSmartDeviceEventTypeSummary.query.bool.filter.push(LocationCode);
            // assetVisitSummary.query.bool.filter.push(smartDeviceTypeQuery);
            healthSummary.query.bool.filter.push(LocationCode);
            healthSummaryAmbiant.query.bool.filter.push(LocationCode);
        }

        var queries = [{
            key: "events",
            search: {
                index: 'cooler-iot-asseteventdatasummary',
                type: ["AssetEventDataSummary"],
                body: healthSummary,
                ignore_unavailable: true
            }
        },
        {
            key: "health",
            search: {
                index: 'cooler-iot-asseteventdatasummary',
                type: ["AssetEventDataSummary"],
                body: healthSummaryAmbiant,
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
            key: "smartDeviceRecordData",
            search: {
                index: 'cooler-iot-asseteventdatasummary',
                type: ["AssetEventDataSummary"],
                body: kpiSmartDeviceEventTypeSummary,
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
        }
            // , {
            //     key: "totalAssetLocation",
            //     search: {
            //         index: "cooler-iot-asset",
            //         type: ["Asset"],
            //         body: totalAssetLocation,
            //         ignore_unavailable: true
            //     }
            // }
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
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '26-50',
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '51-75',
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '76-100',
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '101-125',
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '125+',
                        "assets": 0,
                        total: 0
                    }],
                    compressorData: [{
                        "key": '&lt; 1',
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '1-4 Hrs',
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '4-8 Hrs',
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '8-12 Hrs',
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '12-16 Hrs',
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '16-24 Hrs',
                        "assets": 0,
                        total: 0
                    }],
                    fanData: [{
                        "key": '&lt; 1',
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '1-4 Hrs',
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '4-8 Hrs',
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '8-12 Hrs',
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '12-16 Hrs',
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '16-24 Hrs',
                        "assets": 0,
                        total: 0
                    }],
                    HeaterData: [{
                        "key": '&lt; 1',
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '1-4 Hrs',
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '4-8 Hrs',
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '8-12 Hrs',
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '12-16 Hrs',
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '16-24 Hrs',
                        "assets": 0,
                        total: 0
                    }],
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
                    }],
                    lightBands: [{
                        key: 'Light',
                        assets: 0,
                        outlets: 0,
                        totalAssets: 0
                    }, {
                        key: 'No Light',
                        assets: 0,
                        outlets: 0,
                        totalAssets: 0
                    }],
                    condensorTemperatureBands: [{
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
                    }],
                    evaporatortemperatureBands: [{
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
                    }],
                    ambientTemperatureBands: [{
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
                    }],
                    EventTypeLightStatus: [{
                        "name": '&lt; 1',
                        "on": 0,
                        "off": 0,
                        "nodata": null
                    },
                    {
                        "name": '1-4 Hrs',
                        "on": 0,
                        "off": 0,
                        "nodata": null
                    },
                    {
                        "name": '4-8 Hrs',
                        "on": 0,
                        "off": 0,
                        "nodata": null
                    },
                    {
                        "name": '8-12 Hrs',
                        "on": 0,
                        "off": 0,
                        "nodata": null
                    }, {
                        "name": '12-16 Hrs',
                        "on": 0,
                        "off": 0,
                        "nodata": null
                    }, {
                        "name": '16-24 Hrs',
                        "on": 0,
                        "off": 0,
                        "nodata": null
                    }
                    ],
                    openAlerts: [],
                    alertsByWeek: [],
                    healthOverview: []
                };
            for (var i = 0, len = values.length; i < len; i++) {
                var value = values[i];
                data[value.config.key] = value.response;
                util.setLogger(value);
            }

            //  var assetVisitAggs = data.assetVisit.aggregations,
            var dbAggs = data.db.aggregations,
                doorAggs = data.doorData.aggregations,
                // totalAssetLocation = data.totalAssetLocation.aggregations,
                eventsAgggs = data.events.aggregations,
                eventsAmbiantAgggs = data.health.aggregations,
                smartDeviceRecordAggs = data.smartDeviceRecordData.aggregations,
                doorCount, lowUtilization = 'N/A';

            var doorOpens,
                days = moment.duration(totalHours, 'hours').asDays(),
                doorData = finalData.doorData;
            var smart, smartDoor;
            var totalAssets = dbAggs.SmartAssetCount.SmartAssetCount.buckets.length;
            var smartAssetCount = dbAggs.SmartAssetCount.SmartAssetCount.buckets.length;
            if (doorAggs) {

                smart = eventsAgggs.AssetBucket.buckets.length;
                smartDoor = doorAggs.assets.buckets.length;

                var totalAssetDoor = data.doorData.aggregations.assets.buckets.length;
                doorAggs.assets.buckets.forEach(function (bucket) {
                    lowUtilization = !isNaN(lowUtilization) ? lowUtilization : 0;
                    doorOpens = bucket.DoorCount.value;
                    if (doorOpens <= consts.Threshold.LowUtilization * days) {
                        lowUtilization++;
                    }
                    if (doorOpens <= 25) {
                        finalData.doorData[0].assets++;
                        finalData.doorData[0].total = totalAssets;
                    } else if (doorOpens >= 26 && doorOpens <= 50) {
                        finalData.doorData[1].assets++;
                        finalData.doorData[1].total = totalAssets;
                    } else if (doorOpens >= 51 && doorOpens <= 75) {
                        finalData.doorData[2].assets++;
                        finalData.doorData[2].total = totalAssets;
                    } else if (doorOpens >= 76 && doorOpens <= 100) {
                        finalData.doorData[3].assets++;
                        finalData.doorData[3].total = totalAssets;
                    } else if (doorOpens >= 101 && doorOpens <= 125) {
                        finalData.doorData[4].assets++;
                        finalData.doorData[4].total = totalAssets;
                    } else if (doorOpens > 125) {
                        finalData.doorData[5].assets++;
                        finalData.doorData[5].total = totalAssets;
                    }
                });
            }


            var lightValue, evapTempValue, ambTempValue,
                condTempValue, tempValue, hits, toReturn, sumCount, lightStatusArr = [],
                healthOverview = [],
                coolerAbove7 = 'N/A',
                coolerBelow30Light = 'N/A',
                smart = 0,
                smartLight = 0,
                smartAmbTemp = 0,
                smartEvoTemp = 0,
                smartTemp = 0;

            if (eventsAgggs) {
                smart = eventsAgggs.AssetBucket.buckets.length;
                smartLight = smart;
                smartTemp = smart;
                smartEvoTemp = eventsAgggs.AssetBucket.buckets.length;

                eventsAgggs.AssetBucket.buckets.forEach(function (assetBucket) {
                    sumCount = 0;
                    tempValue = assetBucket.temp_stats.value;
                    evapTempValue = assetBucket.evap_temp_stats.value;
                    condTempValue = assetBucket.cond_temp_stats.value;

                    if (tempValue == null) {
                        smart--;
                    } else if (tempValue < 0) {
                        finalData.temperatureBands[0].assets++;
                        finalData.temperatureBands[0].totalAssets = totalAssets;
                    } else if (tempValue >= 0 && tempValue < 5) {
                        finalData.temperatureBands[1].assets++;
                        finalData.temperatureBands[1].totalAssets = totalAssets;
                    } else if (tempValue >= 5 && tempValue < 10) {
                        finalData.temperatureBands[2].assets++;
                        finalData.temperatureBands[2].totalAssets = totalAssets;
                    } else if (tempValue >= 10 && tempValue < 15) {
                        finalData.temperatureBands[3].assets++;
                        finalData.temperatureBands[3].totalAssets = totalAssets;
                    } else if (tempValue >= 15) {
                        finalData.temperatureBands[4].assets++;
                        finalData.temperatureBands[4].totalAssets = totalAssets;
                    }



                    //evaporatortemperature

                    if (evapTempValue == null) {
                        smartEvoTemp--;
                    } else if (evapTempValue < 0) {
                        finalData.evaporatortemperatureBands[0].assets++;
                        finalData.evaporatortemperatureBands[0].totalAssets = totalAssets;
                    } else if (evapTempValue >= 0 && evapTempValue < 5) {
                        finalData.evaporatortemperatureBands[1].assets++;
                        finalData.evaporatortemperatureBands[1].totalAssets = totalAssets;
                    } else if (evapTempValue >= 5 && evapTempValue < 10) {
                        finalData.evaporatortemperatureBands[2].assets++;
                        finalData.evaporatortemperatureBands[2].totalAssets = totalAssets;
                    } else if (evapTempValue >= 10 && evapTempValue < 15) {
                        finalData.evaporatortemperatureBands[3].assets++;
                        finalData.evaporatortemperatureBands[3].totalAssets = totalAssets;
                    } else if (evapTempValue >= 15) {
                        finalData.evaporatortemperatureBands[4].assets++;
                        finalData.evaporatortemperatureBands[4].totalAssets = totalAssets;
                    }

                    if (condTempValue == null) {
                        smartTemp--;
                    } else if (condTempValue < 0) {
                        finalData.condensorTemperatureBands[0].assets++;
                        finalData.condensorTemperatureBands[0].totalAssets = totalAssets;
                    } else if (condTempValue >= 0 && condTempValue < 5) {
                        finalData.condensorTemperatureBands[1].assets++;
                        finalData.condensorTemperatureBands[1].totalAssets = totalAssets;
                    } else if (condTempValue >= 5 && condTempValue < 10) {
                        finalData.condensorTemperatureBands[2].assets++;
                        finalData.condensorTemperatureBands[2].totalAssets = totalAssets;
                    } else if (condTempValue >= 10 && condTempValue < 15) {
                        finalData.condensorTemperatureBands[3].assets++;
                        finalData.condensorTemperatureBands[3].totalAssets = totalAssets;
                    } else if (condTempValue >= 15) {
                        finalData.condensorTemperatureBands[4].assets++;
                        finalData.condensorTemperatureBands[4].totalAssets = totalAssets;
                    }

                });
                var TotalLight = 0
                var healthStatusData = 0
                healthStatusData = eventsAgggs.HealthSummary.HealthSummary.buckets.length;
                eventsAgggs.Light.top_tags.buckets.forEach(function (data) {
                    var light = data.top_hit.hits.hits[0]._source.IsLightOff;
                    if (light == true) {
                        TotalLight++;
                        finalData.lightBands[1].assets++;
                    } else {
                        TotalLight++;
                        finalData.lightBands[0].assets++;
                    }
                });

                var TempLightIssueCount = {
                    "Light Malfunction": 0,
                    "Temperature And Light Issue": 0,
                    "Temperature and Light OK": 0,
                    "Temperature Issue": 0
                }


                data.events.aggregations.TempLightIssue.top_tags.buckets.forEach(function (data) {
                    data.top_hit.hits.hits.forEach(function (topdata) {

                        if (topdata._source.IsLightIssue == false && topdata._source.IsTemperatureIssue == false) {
                            TempLightIssueCount['Temperature and Light OK'] = TempLightIssueCount['Temperature and Light OK'] + 1;
                        }
                        // Light Malfunction

                        if (topdata._source.IsLightIssue == true && topdata._source.IsTemperatureIssue == false) {
                            TempLightIssueCount['Light Malfunction'] = TempLightIssueCount['Light Malfunction'] + 1;

                        }
                        //Temperature Issue
                        if (topdata._source.IsLightIssue == false && topdata._source.IsTemperatureIssue == true) {
                            TempLightIssueCount['Temperature Issue'] = TempLightIssueCount['Temperature Issue'] + 1;
                        }
                        //Temperature And Light Issue
                        if (topdata._source.IsLightIssue == true && topdata._source.IsTemperatureIssue == true) {
                            TempLightIssueCount['Temperature And Light Issue'] = TempLightIssueCount['Temperature And Light Issue'] + 1;
                        }
                    });
                });

                finalData.healthOverview = healthOverview;


                var overview = TempLightIssueCount;
                for (var o in overview) {
                    if (o !== "doc_count") {
                        healthOverview.push({
                            name: o,
                            y: overview[o]
                        });
                    }
                }


                coolerAbove7 = eventsAgggs.TempAbove7.doc_count;
                if (coolerAbove7) {
                    coolerAbove7 = eventsAgggs.TempAbove7.TempAbove7.value;
                } else {
                    coolerAbove7 = 'N/A';
                }

                coolerBelow30Light = eventsAgggs.CoolersWithLowLight.doc_count;
                if (coolerBelow30Light) {
                    coolerBelow30Light = eventsAgggs.CoolersWithLowLight.CoolersWithLowLight.value;
                } else {
                    coolerBelow30Light = 'N/A';
                }

            }

            if (eventsAmbiantAgggs) {
                smartAmbTemp = eventsAmbiantAgggs.AssetBucket.buckets.length;
                eventsAmbiantAgggs.AssetBucket.buckets.forEach(function (assetBucket) {
                    sumCount = 0;
                    ambTempValue = assetBucket.amb_temp_stats.value;

                    //amb temperature

                    if (ambTempValue == null) {
                        smartAmbTemp--;
                    } else if (ambTempValue < 0) {
                        finalData.ambientTemperatureBands[0].assets++;
                        finalData.ambientTemperatureBands[0].totalAssets = totalAssets;
                    } else if (ambTempValue >= 0 && ambTempValue < 5) {
                        finalData.ambientTemperatureBands[1].assets++;
                        finalData.ambientTemperatureBands[1].totalAssets = totalAssets;
                    } else if (ambTempValue >= 5 && ambTempValue < 10) {
                        finalData.ambientTemperatureBands[2].assets++;
                        finalData.ambientTemperatureBands[2].totalAssets = totalAssets;
                    } else if (ambTempValue >= 10 && ambTempValue < 15) {
                        finalData.ambientTemperatureBands[3].assets++;
                        finalData.ambientTemperatureBands[3].totalAssets = totalAssets;
                    } else if (ambTempValue >= 15) {
                        finalData.ambientTemperatureBands[4].assets++;
                        finalData.ambientTemperatureBands[4].totalAssets = totalAssets;
                    }

                });
            }


            if (smart < totalAssets) {
                finalData.temperatureBands.push({
                    key: "No-Data",
                    assets: dbAggs.SmartAssetCount.SmartAssetCount.buckets.length - smart, //dbAggs.Assets.doc_count - smart,
                    outlets: 0,
                    totalAssets: totalAssets
                });
            }
            var totalNoData = dbAggs.SmartAssetCount.SmartAssetCount.buckets.length - TotalLight;
            if (TotalLight < totalAssets && totalNoData >= healthStatusData) {
                finalData.lightBands.push({
                    key: "No-Data",
                    assets: totalNoData - healthStatusData,
                    outlets: 0,
                    totalAssets: totalAssets
                });
            } else if (TotalLight < totalAssets) {
                finalData.lightBands.push({
                    key: "No-Data",
                    assets: totalNoData,
                    outlets: 0,
                    totalAssets: totalAssets
                });
            } else {
                finalData.lightBands.push({
                    key: "No-Data",
                    assets: 0,
                    outlets: 0,
                    totalAssets: 0
                });
            }

            if (smartDoor < totalAssets) {
                finalData.doorData.push({
                    key: "No-Data",
                    assets: dbAggs.SmartAssetCount.SmartAssetCount.buckets.length - smartDoor,
                    outlets: 0,
                    total: totalAssets
                });
            }

            if (smartEvoTemp < totalAssets) {
                finalData.evaporatortemperatureBands.push({
                    key: "No-Data",
                    assets: dbAggs.SmartAssetCount.SmartAssetCount.buckets.length - smartEvoTemp, //dbAggs.Assets.doc_count - smart,
                    outlets: 0,
                    totalAssets: totalAssets
                });
            }

            if (smartTemp < totalAssets) {
                finalData.condensorTemperatureBands.push({
                    key: "No-Data",
                    assets: dbAggs.SmartAssetCount.SmartAssetCount.buckets.length - smartTemp, //dbAggs.Assets.doc_count - smart,
                    outlets: 0,
                    totalAssets: totalAssets
                });
            }

            if (smartAmbTemp < totalAssets) {
                finalData.ambientTemperatureBands.push({
                    key: "No-Data",
                    assets: dbAggs.SmartAssetCount.SmartAssetCount.buckets.length - smartAmbTemp, //dbAggs.Assets.doc_count - smart,
                    outlets: 0,
                    totalAssets: totalAssets
                });
            }

            var fanHour, HeaterHour, LightOnHour, LightOffHour;
            var compressorHour;
            var smartFan, smartCompressor, smartHeater, smartLight;
            if (smartDeviceRecordAggs) {
                //var smart = eventsAgggs.AssetBucket.buckets.length;
                smartFan = smartDeviceRecordAggs.AssetBucket.buckets.length;
                smartCompressor = smartDeviceRecordAggs.AssetBucket.buckets.length;
                smartHeater = smartDeviceRecordAggs.AssetBucket.buckets.length;
                smartLight = smartDeviceRecordAggs.AssetBucket.buckets.length;

                smartDeviceRecordAggs.AssetBucket.buckets.forEach(function (assetBucket) {
                    fanHour = moment.duration(assetBucket.FanDuration.FanDuration.value, 'second').asHours() / days;
                    compressorHour = moment.duration(assetBucket.CompressorDuration.CompressorDuration.value, 'second').asHours() / days;
                    HeaterHour = moment.duration(assetBucket.HeaterDuration.HeaterDuration.value, 'second').asHours() / days;
                    LightOnHour = moment.duration(assetBucket.LightDuration.LightDuration.value, 'second').asHours();

                    var totalHr = (days * 24);

                    if (LightOnHour >= totalHr) {
                        LightOffHour = 0;
                    } else {
                        LightOffHour = (totalHr - LightOnHour) / days;
                    }

                    //LightOffHour = LightOffHour / days;
                    LightOnHour = LightOnHour / days;


                    if (assetBucket.LightDuration.doc_count > 0) {
                        if (LightOnHour < 1) {
                            finalData.EventTypeLightStatus[0].on++;
                        } else if (LightOnHour >= 1 && LightOnHour < 4) {
                            finalData.EventTypeLightStatus[1].on++;
                        } else if (LightOnHour >= 4 && LightOnHour < 8) {
                            finalData.EventTypeLightStatus[2].on++;
                        } else if (LightOnHour >= 8 && LightOnHour < 12) {
                            finalData.EventTypeLightStatus[3].on++;
                        } else if (LightOnHour >= 12 && LightOnHour < 16) {
                            finalData.EventTypeLightStatus[4].on++;
                        } else if (LightOnHour >= 16) {
                            finalData.EventTypeLightStatus[5].on++;
                        }

                        if (LightOffHour < 1) {
                            finalData.EventTypeLightStatus[0].off++;
                        } else if (LightOffHour >= 1 && LightOffHour < 4) {
                            finalData.EventTypeLightStatus[1].off++;
                        } else if (LightOffHour >= 4 && LightOffHour < 8) {
                            finalData.EventTypeLightStatus[2].off++;
                        } else if (LightOffHour >= 8 && LightOffHour < 12) {
                            finalData.EventTypeLightStatus[3].off++;
                        } else if (LightOffHour >= 12 && LightOffHour < 16) {
                            finalData.EventTypeLightStatus[4].off++;
                        } else if (LightOffHour >= 16) {
                            finalData.EventTypeLightStatus[5].off++;
                        }
                    } else {
                        smartLight--;
                    }


                    //  if (assetBucket.FanDuration.doc_count > 0) {
                    if (fanHour < 1) {
                        finalData.fanData[0].assets++;
                    } else if (fanHour >= 1 && fanHour < 4) {
                        finalData.fanData[1].assets++;
                    } else if (fanHour >= 4 && fanHour < 8) {
                        finalData.fanData[2].assets++;
                    } else if (fanHour >= 8 && fanHour < 12) {
                        finalData.fanData[3].assets++;
                    } else if (fanHour >= 12 && fanHour < 16) {
                        finalData.fanData[4].assets++;
                    } else if (fanHour >= 16) {
                        finalData.fanData[5].assets++;
                    }
                    // } else {
                    //     smartFan--;
                    // }



                    //  if (assetBucket.CompressorDuration.doc_count > 0) {
                    if (compressorHour < 1) {
                        finalData.compressorData[0].assets++;
                    } else if (compressorHour >= 1 && compressorHour < 4) {
                        finalData.compressorData[1].assets++;
                    } else if (compressorHour >= 4 && compressorHour < 8) {
                        finalData.compressorData[2].assets++;
                    } else if (compressorHour >= 8 && compressorHour < 12) {
                        finalData.compressorData[3].assets++;
                    } else if (compressorHour >= 12 && compressorHour < 16) {
                        finalData.compressorData[4].assets++;
                    } else if (compressorHour >= 16) {
                        finalData.compressorData[5].assets++;
                    }

                    // } else {
                    //     smartCompressor--;
                    // }


                    if (assetBucket.HeaterDuration.doc_count > 0) {
                        if (HeaterHour < 1) {
                            finalData.HeaterData[0].assets++;
                        } else if (HeaterHour >= 1 && HeaterHour < 4) {
                            finalData.HeaterData[1].assets++;
                        } else if (HeaterHour >= 4 && HeaterHour < 8) {
                            finalData.HeaterData[2].assets++;
                        } else if (HeaterHour >= 8 && HeaterHour < 12) {
                            finalData.HeaterData[3].assets++;
                        } else if (HeaterHour >= 12 && HeaterHour < 16) {
                            finalData.HeaterData[4].assets++;
                        } else if (HeaterHour >= 16) {
                            finalData.HeaterData[5].assets++;
                        }

                    } else {
                        smartHeater--;
                    }
                });
            }



            if (smartFan < totalAssets) {
                finalData.fanData.push({
                    key: "No-Data",
                    assets: dbAggs.SmartAssetCount.SmartAssetCount.buckets.length - smartFan,
                    outlets: 0,
                    total: totalAssets
                });
            }

            if (smartCompressor < totalAssets) {
                finalData.compressorData.push({
                    key: "No-Data",
                    assets: dbAggs.SmartAssetCount.SmartAssetCount.buckets.length - smartCompressor,
                    outlets: 0,
                    total: totalAssets
                });
            }

            if (smartHeater < totalAssets) {
                finalData.HeaterData.push({
                    key: "No-Data",
                    assets: dbAggs.SmartAssetCount.SmartAssetCount.buckets.length - smartHeater,
                    outlets: 0,
                    total: totalAssets
                });
            }

            if (smartLight < totalAssets) {
                finalData.EventTypeLightStatus.push({
                    name: "No-Data",
                    on: null,
                    off: null,
                    nodata: dbAggs.SmartAssetCount.SmartAssetCount.buckets.length - smartLight
                });
            }

            finalData.fanData[0].total = totalAssets;
            finalData.fanData[1].total = totalAssets;
            finalData.fanData[2].total = totalAssets;
            finalData.fanData[3].total = totalAssets;
            finalData.fanData[4].total = totalAssets;
            finalData.fanData[5].total = totalAssets;

            finalData.compressorData[0].total = totalAssets;
            finalData.compressorData[1].total = totalAssets;
            finalData.compressorData[2].total = totalAssets;
            finalData.compressorData[3].total = totalAssets;
            finalData.compressorData[4].total = totalAssets;
            finalData.compressorData[5].total = totalAssets;

            var missingCooler = 'N/A';
            // if (assetVisitAggs) {
            //     var missingDocCount = assetVisitAggs.AssetCount.doc_count;
            //     if (missingDocCount > 0) {
            //         missingCooler = assetVisitAggs.AssetCount.AssetCountDistinct.value
            //     } else {
            //         missingCooler = 'N/A';
            //     }
            // }


            finalData.summary = {
                totalCooler: smartAssetCount,
                totalCustomer: dbAggs.LocationCount.LocationCount.buckets.length,
                filteredAssets: dbAggs.AssetCount.AssetCount.buckets.length,
                filteredOutlets: dbAggs.Locations.Locations.buckets.length,
                totalSmartAssetCount: dbAggs.SmartAssetCount.SmartAssetCount.buckets.length,
                coolerAbove7: coolerAbove7,
                coolerBelow30Light: coolerBelow30Light,
                missingCooler: missingCooler,
                smartAssetCount: smartAssetCount,
                smartAssetCountWareHouse: dbAggs.SmartAssetCount.SmartAssetCount.buckets.length,
                lowUtilization: lowUtilization
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

        //}.bind(null, this));
    },
    getMapAssetForLastDataDownload: function (request, reply) {
        request.query = Object.assign({}, request.query, request.payload);
        reply.query = Object.assign({}, request.query, request.payload);
        var clientId = request.auth.credentials.user.ScopeId;
        var credentials = request.auth.credentials;
        var params = Object.assign({}, request.query, request.payload),
            assetSummary = JSON.parse(this.dashboardQueries.assetMapInfo),
            kpiLastDataDownloadSummaryDays = JSON.parse(this.dashboardQueries.LastDataMap);
        var tags = credentials.tags.FirstName;
        tags = tags.toLowerCase();
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

            kpiLastDataDownloadSummaryDays.query.bool.filter.push(dateRangeQuery);
            totalHours = defaultHours;
            months = 1;
        } else if (!isDefaultDateFilter && params.startDate && params.endDate) {
            var startDate = moment(params.startDate).format('YYYY-MM-DD[T00:00:00]');
            var startDateDays = moment(params.endDate).format('YYYY-MM-DD[T00:00:00]');
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
            var dateRangeQuery2 = {
                "range": {
                    "EventDate": {
                        "gte": startDateDays,
                        "lte": endDate
                    }
                }
            };
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(dateRangeQuery2);
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


                kpiLastDataDownloadSummaryDays.query.bool.filter.push({
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

            kpiLastDataDownloadSummaryDays = util.pushDateQuery(kpiLastDataDownloadSummaryDays, dateRangeQuery);
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
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(countryIdsUser);
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

            assetSummary.query.bool.filter.push(filterQuery);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(filterQuery);
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

            assetSummary.query.bool.filter.push(AssetIds);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(AssetIds);
        }

        if ((params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) ||
            (params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) ||
            (params.DataDownloadOutlet || params["DataDownloadOutlet[]"])) {
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
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(LocationIds);
        }

        if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
            var smartDeviceTypeQuery = {
                "terms": {
                    "AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
                }
            }
            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(smartDeviceTypeQuery);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(smartDeviceTypeQuery);
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
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(IsKeyLocationFilter);
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
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(IsFactoryAssetFilter);
        }

        if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
            var assetManufactureQuery = {
                "terms": {
                    "AssetManufactureId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
                }
            }
            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetManufactureQuery);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(assetManufactureQuery);
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
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(SalesHierarchyId);
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
            };
            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerSmartDeviceQuery);
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
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(manufacturerOutletTypeId);
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
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(LocationTypeId);
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
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(ClassificationId);
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
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(SubTradeChannelTypeId);
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
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(AssetManufactureId);
        }

        if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
            var AssetTypeId = {
                "terms": {
                    "AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
                }
            }
            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetTypeId);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(AssetTypeId);
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
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(SmartDeviceTypeId);
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
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(City);
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
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(CountryId);
        }

        if (request.query.LocationCode || request.query["LocationCode[]"]) {
            var LocationCode = {
                "term": {
                    "LocationCode": request.query.LocationCode || request.query["LocationCode[]"]
                }
            }
            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(LocationCode);
            kpiLastDataDownloadSummaryDays.query.bool.filter.push(LocationCode);
        }

        var queries = [{
            key: "db",
            search: {
                index: 'cooler-iot-asseteventdatasummary',
                type: ["AssetEventDataSummary"],
                body: assetSummary,
                ignore_unavailable: true
            }
        }, {
            key: "lastDataDownloadSummaryDays",
            search: {
                index: 'cooler-iot-asseteventdatasummary',
                type: ["AssetEventDataSummary"],
                body: kpiLastDataDownloadSummaryDays,
                ignore_unavailable: true
            }
        }];

        //console.log(JSON.stringify(queries));
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
                finalData = {};
            for (var i = 0, len = values.length; i < len; i++) {
                var value = values[i];
                data[value.config.key] = value.response;
                util.setLogger(value);
            }

            var dbAggs = data.db.aggregations,
                lastDataDownloadSummaryDaysAggs = data.lastDataDownloadSummaryDays.aggregations,
                last30Days = [],
                last60Days = [],
                last90Days = [],
                More90Days = [],
                ovell = [];
            if (lastDataDownloadSummaryDaysAggs) {
                lastDataDownloadSummaryDaysAggs.Last30Days.AssetIds.buckets.forEach(function (value) {
                    last30Days.push(value.key);
                    ovell.push(value.key);
                });

                lastDataDownloadSummaryDaysAggs.Last60Days.AssetIds.buckets.forEach(function (value) {
                    last60Days.push(value.key);
                    ovell.push(value.key);
                });

                lastDataDownloadSummaryDaysAggs.Last90Days.AssetIds.buckets.forEach(function (value) {
                    last90Days.push(value.key);
                    ovell.push(value.key);
                });

                dbAggs.SmartAssetCount.SmartAssetCount.buckets.forEach(function (value) {
                    var flag = ovell.filter(function (val) {
                        return val == value.key
                    });
                    if (flag.length == 0) {
                        More90Days.push(value.key);
                    }
                });
            }
            var query2 = "SELECT  A.AssetId As assetid,L.latitude As latitude,  L.longitude As longitude FROM Asset A LEFT OUTER JOIN Location L ON A.LocationId = L.LocationId inner join string_split(' " + last30Days + " ', ',') B  ON A.AssetId = B.value WHERE  L.latitude != 0 AND L.longitude != 0";
            var query3 = "SELECT  A.AssetId As assetid,L.latitude As latitude,  L.longitude As longitude FROM Asset A LEFT OUTER JOIN Location L ON A.LocationId = L.LocationId inner join string_split(' " + last60Days + " ', ',') B  ON A.AssetId = B.value WHERE  L.latitude != 0 AND L.longitude != 0";
            var query4 = "SELECT  A.AssetId As assetid,L.latitude As latitude,  L.longitude As longitude FROM Asset A LEFT OUTER JOIN Location L ON A.LocationId = L.LocationId inner join string_split(' " + last90Days + " ', ',') B  ON A.AssetId = B.value WHERE  L.latitude != 0 AND L.longitude != 0";
            var query5 = "SELECT  A.AssetId As assetid,L.latitude As latitude,  L.longitude As longitude FROM Asset A LEFT OUTER JOIN Location L ON A.LocationId = L.LocationId inner join string_split(' " + More90Days + " ', ',') B  ON A.AssetId = B.value WHERE  L.latitude != 0 AND L.longitude != 0";

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
                var name = "Days30"
                data2[name] = value.response;
                var value = values2[1];
                var name = "Days60"
                data2[name] = value.response;
                var value = values2[2];
                var name = "Days60"
                data2[name] = value.response;
                var value = values2[3];
                var name = "More90Days"
                data2[name] = value.response;

                var Map30 = data2.Days30,
                    Map60 = data2.Days60,
                    Map90 = data2.Days60,
                    MapMore90 = data2.More90Days;
                var locationDataMap = [];
                for (var i = 0; i < Map30.length; i++) {
                    locationDataMap.push({
                        Id: Map30[i].assetid,
                        LastDataDownload: "Last data <= 30",
                        LocationGeo: {
                            "lat": Map30[i].latitude,
                            "lon": Map30[i].longitude
                        }
                    })
                }
                for (var i = 0; i < Map60.length; i++) {
                    locationDataMap.push({
                        Id: Map60[i].assetid,
                        LastDataDownload: "Last data > 30, <60 days",
                        LocationGeo: {
                            "lat": Map60[i].latitude,
                            "lon": Map60[i].longitude
                        }
                    })
                }
                for (var i = 0; i < Map90.length; i++) {
                    locationDataMap.push({
                        Id: Map90[i].assetid,
                        LastDataDownload: "Last data > 60, <90 days",
                        LocationGeo: {
                            "lat": Map90[i].latitude,
                            "lon": Map90[i].longitude
                        }
                    })
                }
                for (var i = 0; i < MapMore90.length; i++) {
                    locationDataMap.push({
                        Id: MapMore90[i].assetid,
                        LastDataDownload: "No data for more than 90 days",
                        LocationGeo: {
                            "lat": MapMore90[i].latitude,
                            "lon": MapMore90[i].longitude
                        }
                    })
                }

                finalData.summary = {
                    locationDataLastdataDownloaded: locationDataMap
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
    getMapAssetForDataDownload: function (request, reply) {
        request.query = Object.assign({}, request.query, request.payload);
        reply.query = Object.assign({}, request.query, request.payload);
        var clientId = request.auth.credentials.user.ScopeId;
        var credentials = request.auth.credentials;
        var params = Object.assign({}, request.query, request.payload),
            assetSummary = JSON.parse(this.dashboardQueries.assetMapInfo),
            kpiLastDataDownloadSummary = JSON.parse(this.dashboardQueries.DataDownloadMap);
        var tags = credentials.tags.FirstName;
        // client Filter
        var clientQuery = {
            "term": {
                "ClientId": clientId
            }
        };
        if (clientId != 0) {
            assetSummary.query.bool.filter.push(clientQuery);
            kpiLastDataDownloadSummary.query.bool.filter.push(clientQuery);
        }

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

            kpiLastDataDownloadSummary.query.bool.filter.push(dateRangeQuery);
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

            kpiLastDataDownloadSummary.query.bool.filter.push(dateRangeQuery);
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

                kpiLastDataDownloadSummary.query.bool.filter.push({
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

            kpiLastDataDownloadSummary = util.pushDateQuery(kpiLastDataDownloadSummary, dateRangeQuery);
            var visitDateRange = {
                "range": {
                    "EventDate": {
                        "gte": startDate,
                        "lte": endDate
                    }
                }
            };

            var assetVisitDateRange = {
                "range": {
                    "EventDate": {
                        "gte": startDate,
                        "lte": endDate
                    }
                }
            };

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
            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(countryIdsUser);
            kpiLastDataDownloadSummary.query.bool.filter.push(countryIdsUser);
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

            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(filterQuery);
            kpiLastDataDownloadSummary.query.bool.filter.push(filterQuery);
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
            kpiLastDataDownloadSummary.query.bool.filter.push(AssetIds);
        }


        if ((params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) ||
            (params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) ||
            (params.DataDownloadOutlet || params["DataDownloadOutlet[]"])) {
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
            kpiLastDataDownloadSummary.query.bool.filter.push(LocationIds);
        }

        if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
            var smartDeviceTypeQuery = {
                "terms": {
                    "AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
                }
            }
            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(smartDeviceTypeQuery);
            kpiLastDataDownloadSummary.query.bool.filter.push(smartDeviceTypeQuery);
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
            kpiLastDataDownloadSummary.query.bool.filter.push(IsKeyLocationFilter);
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
            kpiLastDataDownloadSummary.query.bool.filter.push(IsFactoryAssetFilter);
        }

        if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
            var assetManufactureQuery = {
                "terms": {
                    "AssetManufactureId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
                }
            }
            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetManufactureQuery);
            kpiLastDataDownloadSummary.query.bool.filter.push(assetManufactureQuery);
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
            kpiLastDataDownloadSummary.query.bool.filter.push(SalesHierarchyId);
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
            };
            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerSmartDeviceQuery);
            kpiLastDataDownloadSummary.query.bool.filter.push(manufacturerSmartDeviceQuery);
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
            kpiLastDataDownloadSummary.query.bool.filter.push(manufacturerOutletTypeId);
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
            kpiLastDataDownloadSummary.query.bool.filter.push(LocationTypeId);
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
            kpiLastDataDownloadSummary.query.bool.filter.push(ClassificationId);
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
            kpiLastDataDownloadSummary.query.bool.filter.push(SubTradeChannelTypeId);
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
            kpiLastDataDownloadSummary.query.bool.filter.push(AssetManufactureId);
        }

        if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
            var AssetTypeId = {
                "terms": {
                    "AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
                }
            }
            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetTypeId);
            kpiLastDataDownloadSummary.query.bool.filter.push(AssetTypeId);
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
            kpiLastDataDownloadSummary.query.bool.filter.push(SmartDeviceTypeId);
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
            kpiLastDataDownloadSummary.query.bool.filter.push(City);
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
            kpiLastDataDownloadSummary.query.bool.filter.push(CountryId);
        }

        if (request.query.LocationCode || request.query["LocationCode[]"]) {
            var LocationCode = {
                "term": {
                    "LocationCode": request.query.LocationCode || request.query["LocationCode[]"]
                }
            }
            assetSummary.aggs.SmartAssetCount.filter.bool.must.push(LocationCode);
            kpiLastDataDownloadSummary.query.bool.filter.push(LocationCode);
        }


        var queries = [{
            key: "db",
            search: {
                index: 'cooler-iot-asseteventdatasummary',
                type: ["AssetEventDataSummary"],
                body: assetSummary,
                ignore_unavailable: true
            }
        },
        {
            key: "lastDownloadSummary",
            search: {
                index: 'cooler-iot-asseteventdatasummary',
                type: ["AssetEventDataSummary"],
                body: kpiLastDataDownloadSummary,
                ignore_unavailable: true
            }
        }
        ];

        //console.log(JSON.stringify(queries));
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
                finalData = {};
            for (var i = 0, len = values.length; i < len; i++) {
                var value = values[i];
                data[value.config.key] = value.response;
                util.setLogger(value);
            }

            var dbAggs = data.db.aggregations,
                lastDownloadSummaryAggs = data.lastDownloadSummary.aggregations,
                days = moment.duration(totalHours, 'hours').asDays(),
                ovell = [],
                NoData = [];

            if (dbAggs) {
                lastDownloadSummaryAggs.AssetIds.buckets.forEach(function (value) {
                    ovell.push(value.key);
                });

                dbAggs.SmartAssetCount.SmartAssetCount.buckets.forEach(function (value) {
                    var flag = ovell.filter(function (val) {
                        return val == value.key
                    });
                    if (flag.length == 0) {
                        NoData.push(value.key);
                    }
                });
            }

            var query2 = "SELECT  A.AssetId As assetid,L.latitude As latitude,  L.longitude As longitude FROM Asset A LEFT OUTER JOIN Location L ON A.LocationId = L.LocationId inner join string_split(' " + ovell + " ', ',') B  ON A.AssetId = B.value WHERE  L.latitude != 0 AND L.longitude != 0";
            var query3 = "SELECT  A.AssetId As assetid,L.latitude As latitude,  L.longitude As longitude FROM Asset A LEFT OUTER JOIN Location L ON A.LocationId = L.LocationId inner join string_split(' " + NoData + " ', ',') B  ON A.AssetId = B.value WHERE  L.latitude != 0 AND L.longitude != 0";
            var queries2 = [{
                "sql": query2
            }, {
                "sql": query3
            }]
            for (var i = 0, len = queries2.length; i < len; i++) {
                promises2.push(_this.getSqlData(queries2[i]));
            }

            Promise.all(promises2).then(function (values2) {

                var data2 = {};

                var value = values2[0];
                var name = "ovell"
                data2[name] = value.response;
                var value = values2[1];
                var name = "NoData"
                data2[name] = value.response;

                var DataAll = data2.ovell,
                    NoDataAll = data2.NoData,
                    locationMapDataDownload = [];

                for (var i = 0; i < DataAll.length; i++) {
                    locationMapDataDownload.push({
                        Id: DataAll[i].assetid,
                        DataDownload: "Data Downloaded",
                        LocationGeo: {
                            "lat": DataAll[i].latitude,
                            "lon": DataAll[i].longitude
                        }
                    })
                }

                for (var i = 0; i < NoDataAll.length; i++) {
                    locationMapDataDownload.push({
                        Id: NoDataAll[i].assetid,
                        DataDownload: "Data Not Downloaded",
                        LocationGeo: {
                            "lat": NoDataAll[i].latitude,
                            "lon": NoDataAll[i].longitude
                        }
                    })
                }

                finalData.summary = {
                    locationMapDataDownload: locationMapDataDownload
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
    getMapAssetForCoolerTrackingAlwaysOn: function (request, reply) {
        request.query = Object.assign({}, request.query, request.payload);
        reply.query = Object.assign({}, request.query, request.payload);
        var clientId = request.auth.credentials.user.ScopeId;
        var credentials = request.auth.credentials;
        var params = Object.assign({}, request.query, request.payload),
            chartWise = JSON.parse(this.dashboardQueries.ChartCoolerTracking);
        var tags = credentials.tags.FirstName;
        tags = tags.toLowerCase();
        // client Filter
        var clientQuery = {
            "term": {
                "ClientId": clientId
            }
        };
        if (clientId != 0) {
            chartWise.query.bool.filter.push(clientQuery);
        }


        var displacementless = {
            "range": {
                "Displacement": {
                    "lt": Number(credentials.tags.CoolerTrackingDisplacementThreshold) / 1000
                }
            }
        };
        var displacementgreater = {
            "range": {
                "Displacement": {
                    "gte": Number(credentials.tags.CoolerTrackingDisplacementThreshold) / 1000
                }
            }
        };

        chartWise.aggs.AlwaysLocationAsExpected.filter.bool.must.push(displacementless);
        chartWise.aggs.AlwaysWrongLocation.filter.bool.must.push(displacementgreater);

        var endDate = params.endDate;
        if (credentials.tags.CoolerTrackingThreshold == null) {
            var CoolerTrackingThreshold = 89;
        } else {
            var CoolerTrackingThr = credentials.tags.CoolerTrackingThreshold;
            var CoolerTrackingThreshold = Number(CoolerTrackingThr) - 1;
        }
        var CoolerTrackingThresholdEnd = CoolerTrackingThreshold - 1;
        var startDate = moment(endDate).add(-CoolerTrackingThreshold, 'days').format('YYYY-MM-DD[T23:59:59]'); //find perivous EventDate
        var startDateend = moment(endDate).add(-CoolerTrackingThresholdEnd, 'days').format('YYYY-MM-DD[T00:00:00]'); //find perivous EventDate
        var endDate = moment(endDate).format('YYYY-MM-DD[T23:59:59]');
        var dategateway = { //object to insert EventDate
            "range": {
                "GatewayLastPing": {
                    "from": startDateend,
                    "to": endDate
                }
            }
        };
        var datedevice = { //object to insert EventDate
            "range": {
                "LatestDeviceDate": {
                    "from": startDateend,
                    "to": endDate
                }
            }
        };
        var dategateway1 = { //object to insert EventDate
            "range": {
                "GatewayLastPing": {
                    "lte": startDate
                }
            }
        };
        var datedevice1 = { //object to insert EventDate
            "range": {
                "LatestDeviceDate": {
                    "lte": startDate
                }
            }
        };
        chartWise.aggs.AlwaysNotTransmitting.filter.bool.must.push(dategateway1);

        chartWise.aggs.AlwaysWrongLocation.filter.bool.must.push(dategateway);

        chartWise.aggs.AlwaysLocationAsExpected.filter.bool.must.push(dategateway);
        var dateFilter = [];
        var dateFilterTrend = [];
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
            chartWise.query.bool.filter.push(countryIdsUser);
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
            chartWise.query.bool.filter.push(filterQuery);
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

            chartWise.query.bool.filter.push(AssetIds);
        }

        if ((params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) ||
            (params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) ||
            (params.DataDownloadOutlet || params["DataDownloadOutlet[]"])) {
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

            chartWise.query.bool.filter.push(LocationIds);
        }

        if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
            var smartDeviceTypeQuery = {
                "terms": {
                    "AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
                }
            }
            chartWise.query.bool.filter.push(smartDeviceTypeQuery);
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
            chartWise.query.bool.filter.push(IsFactoryAssetFilter);
        }

        if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
            var assetManufactureQuery = {
                "terms": {
                    "AssetManufactureId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
                }
            }
            chartWise.query.bool.filter.push(assetManufactureQuery);
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
            chartWise.query.bool.filter.push(SalesHierarchyId);
        }

        if (request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]) {
            if (request.query.SmartDeviceManufacturerId.constructor !== Array) {
                var toArray = request.query.SmartDeviceManufacturerId;
                request.query.SmartDeviceManufacturerId = [];
                request.query.SmartDeviceManufacturerId.push(toArray);
            }
            var manufacturerSmartDeviceQuery1 = {
                "terms": {
                    "SmartDeviceManufacturerId": request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]
                }
            };
            chartWise.aggs.AlwaysNotTransmitting.filter.bool.should.push(manufacturerSmartDeviceQuery1);
            chartWise.aggs.AlwaysWrongLocation.filter.bool.should.push(manufacturerSmartDeviceQuery1);
            chartWise.aggs.AlwaysLocationAsExpected.filter.bool.should.push(manufacturerSmartDeviceQuery1);
            //chartWise.query.bool.filter.push(manufacturerSmartDeviceQuery);
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
            chartWise.query.bool.filter.push(manufacturerOutletTypeId);
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
            chartWise.query.bool.filter.push(LocationTypeId);
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
            chartWise.query.bool.filter.push(ClassificationId);
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
            chartWise.query.bool.filter.push(SubTradeChannelTypeId);
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
            chartWise.query.bool.filter.push(AssetManufactureId);
        }

        if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
            var AssetTypeId = {
                "terms": {
                    "AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
                }
            }
            chartWise.query.bool.filter.push(AssetTypeId);
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
            chartWise.query.bool.filter.push(SmartDeviceTypeId);
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
            chartWise.query.bool.filter.push(City);
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
            chartWise.query.bool.filter.push(CountryId);
        }

        if (request.query.LocationCode || request.query["LocationCode[]"]) {
            var LocationCode = {
                "term": {
                    "LocationCode": request.query.LocationCode || request.query["LocationCode[]"]
                }
            }
            chartWise.query.bool.filter.push(LocationCode);
        }

        var queries = [{
            key: "ChartDatawise",
            search: {
                index: 'cooler-iot-asset',
                type: ["Asset"],
                body: chartWise,
                ignore_unavailable: true
            }
        }];

        //console.log(JSON.stringify(queries));
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
                finalData = {};
            for (var i = 0, len = values.length; i < len; i++) {
                var value = values[i];
                data[value.config.key] = value.response;
                util.setLogger(value);
            }

            var DataAggs = data.ChartDatawise.aggregations,
                AlwaysNot = [],
                AlwaysWrong = [],
                AlwaysExpected = [],
                trackingMapLocation = [],
                CoolerTrackingMapLocation = [];

            //===for cooler tracking always on map plot information based on asset
            if (DataAggs) {
                DataAggs.AlwaysNotTransmitting.Assets.buckets.forEach(function (ids) {
                    AlwaysNot.push(ids.key);
                });
                DataAggs.AlwaysWrongLocation.Assets.buckets.forEach(function (ids) {
                    AlwaysWrong.push(ids.key);
                });
                DataAggs.AlwaysLocationAsExpected.Assets.buckets.forEach(function (ids) {
                    AlwaysExpected.push(ids.key);
                });
            }

            var query2 = "SELECT  A.AssetId As assetid,L.latitude As latitude,  L.longitude As longitude FROM Asset A LEFT OUTER JOIN Location L ON A.LocationId = L.LocationId inner join string_split(' " + AlwaysNot + " ', ',') B  ON A.AssetId = B.value WHERE  L.latitude != 0 AND L.longitude != 0";
            var query3 = "SELECT  A.AssetId As assetid,L.latitude As latitude,  L.longitude As longitude FROM Asset A LEFT OUTER JOIN Location L ON A.LocationId = L.LocationId inner join string_split(' " + AlwaysWrong + " ', ',') B  ON A.AssetId = B.value WHERE  L.latitude != 0 AND L.longitude != 0";
            var query4 = "SELECT  A.AssetId As assetid,L.latitude As latitude,  L.longitude As longitude FROM Asset A LEFT OUTER JOIN Location L ON A.LocationId = L.LocationId inner join string_split(' " + AlwaysExpected + " ', ',') B  ON A.AssetId = B.value WHERE  L.latitude != 0 AND L.longitude != 0";
            var queries2 = [{
                "sql": query2
            }, {
                "sql": query3
            }, {
                "sql": query4
            }]
            for (var i = 0, len = queries2.length; i < len; i++) {
                promises2.push(_this.getSqlData(queries2[i]));
            }

            Promise.all(promises2).then(function (values2) {
                var data2 = {};

                var value = values2[0];
                var name = "NOtTrans"
                data2[name] = value.response;
                var value = values2[1];
                var name = "WrongLoc"
                data2[name] = value.response;
                var value = values2[2];
                var name = "LocationAsEx"
                data2[name] = value.response;

                var NotTransmitted = data2.NOtTrans,
                    WrongLocation = data2.WrongLoc,
                    LocationAsExpected = data2.LocationAsEx;
                var CoolerTrackingMapLocation = [];
                for (var i = 0; i < NotTransmitted.length; i++) {
                    CoolerTrackingMapLocation.push({
                        Id: NotTransmitted[i].assetid,
                        Band: "Not Transmitting",
                        LocationGeo: {
                            "lat": NotTransmitted[i].latitude,
                            "lon": NotTransmitted[i].longitude
                        }
                    })
                }
                for (var i = 0; i < WrongLocation.length; i++) {
                    CoolerTrackingMapLocation.push({
                        Id: WrongLocation[i].assetid,
                        Band: "Wrong Location",
                        LocationGeo: {
                            "lat": WrongLocation[i].latitude,
                            "lon": WrongLocation[i].longitude
                        }
                    })
                }
                for (var i = 0; i < LocationAsExpected.length; i++) {
                    CoolerTrackingMapLocation.push({
                        Id: LocationAsExpected[i].assetid,
                        Band: "Location as expected",
                        LocationGeo: {
                            "lat": LocationAsExpected[i].latitude,
                            "lon": LocationAsExpected[i].longitude
                        }
                    })
                }

                finalData.summary = {
                    CoolerTrackingMapLocation: CoolerTrackingMapLocation
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
    getMapLocationForOperationalIssues: function (request, reply) {
        request.query = Object.assign({}, request.query, request.payload);
        reply.query = Object.assign({}, request.query, request.payload);
        var clientId = request.auth.credentials.user.ScopeId;
        var credentials = request.auth.credentials;
        var params = Object.assign({}, request.query, request.payload),
            assetSummary = JSON.parse(this.dashboardQueries.operationalIssueMap),
            operationalIssue = JSON.parse(this.dashboardQueries.operationalIssueFormat);
        var tags = credentials.tags.FirstName;
        // client Filter
        var clientQuery = {
            "term": {
                "ClientId": clientId
            }
        };
        if (clientId != 0) {
            assetSummary.query.bool.filter.push(clientQuery);
            operationalIssue.query.bool.filter.push(clientQuery);
        }

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

            operationalIssue.query.bool.filter.push(dateRangeQuery);
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

            operationalIssue.query.bool.filter.push(dateRangeQuery);
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
                operationalIssue.query.bool.filter.push({
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
            operationalIssue = util.pushDateQuery(operationalIssue, dateRangeQuery);
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
            operationalIssue.query.bool.filter.push(countryIdsUser);
        }
        var id = request.auth.credentials.sid;
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

            operationalIssue.query.bool.filter.push(filterQuery);
        }

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

            assetSummary.query.bool.filter.push(AssetIds);
            operationalIssue.query.bool.filter.push(AssetIds);
        }
        // }


        if ((params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) ||
            (params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) ||
            (params.DataDownloadOutlet || params["DataDownloadOutlet[]"])) {
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

            assetSummary.query.bool.filter.push(LocationIds);
            operationalIssue.query.bool.filter.push(LocationIds);
        }

        if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
            var smartDeviceTypeQuery = {
                "terms": {
                    "AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
                }
            }
            operationalIssue.query.bool.filter.push(filterQuery);
        }

        if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
            var assetManufactureQuery = {
                "terms": {
                    "AssetManufacturerId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
                }
            }
            operationalIssue.query.bool.filter.push(assetManufactureQuery);
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
            operationalIssue.query.bool.filter.push(manufacturerSmartDeviceQuery);
        }

        if (request.query.OutletTypeId || request.query["OutletTypeId[]"]) {
            var manufacturerOutletTypeId = {
                "term": {
                    "OutletTypeId": request.query.OutletTypeId || request.query["OutletTypeId[]"]
                }
            }
            operationalIssue.query.bool.filter.push(manufacturerOutletTypeId);
        }

        var queries = [{
            key: "operationalIssue",
            search: {
                index: 'cooler-iot-asseteventdatasummary',
                type: ["AssetEventDataSummary"],
                body: operationalIssue,
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

            var operationalIssueAggs = data.operationalIssue.aggregations,
                days = moment.duration(totalHours, 'hours').asDays(),
                CoolerTrackingMapLocation = [],
                TemperatureIssueAssets = [],
                LightIssueAssets = [],
                PowerDataAssets = [],
                locationDataMapOperationIssues = [],
                temperatureDuration,
                lightDuration,
                powerDuration;


            //===for opertional issues map plot information based on asset     
            if (operationalIssueAggs) {
                operationalIssueAggs.HealthData.TempLightIssueCount.TemperatureIssue.AssetBucket.buckets.forEach(function (assetBucket) {
                    temperatureDuration = moment.duration(assetBucket.HealthInterval.value, 'm').asHours() / days;
                    if (temperatureDuration >= 8 && temperatureDuration <= 24) {
                        TemperatureIssueAssets.push(assetBucket.key);
                    }
                });

                operationalIssueAggs.HealthData.TempLightIssueCount.LightIssue.AssetBucket.buckets.forEach(function (assetBucket) {
                    lightDuration = moment.duration(assetBucket.HealthInterval.value, 'm').asHours() / days;
                    if (lightDuration >= 8 && lightDuration <= 24) {
                        LightIssueAssets.push(assetBucket.key);
                    }
                });

                operationalIssueAggs.PowerData.AssetBucket.buckets.forEach(function (assetBucket) {
                    powerDuration = moment.duration(assetBucket.PowerOffDuration.value, 'second').asHours() / days;
                    if (powerDuration >= 8 && powerDuration <= 24) {
                        PowerDataAssets.push(assetBucket.key);
                    }
                });
            }
            if (TemperatureIssueAssets) {
                var assetQuery = {
                    "terms": {
                        "AssetId": TemperatureIssueAssets
                    }
                }

                assetSummary.aggs.Temperature.filter.bool.must.push(assetQuery);
            }
            if (LightIssueAssets) {
                var assetQuery = {
                    "terms": {
                        "AssetId": LightIssueAssets
                    }
                }

                assetSummary.aggs.Light.filter.bool.must.push(assetQuery);
            }
            if (PowerDataAssets) {
                var assetQuery = {
                    "terms": {
                        "AssetId": PowerDataAssets
                    }
                }

                assetSummary.aggs.Power.filter.bool.must.push(assetQuery);
            }

            var queries2 = [{
                key: "db",
                search: {
                    index: 'cooler-iot-asset',
                    type: ["Asset"],
                    body: assetSummary,
                    ignore_unavailable: true
                }
            }];

            var promises = [];
            for (var i = 0, len = queries2.length; i < len; i++) {
                var query = queries2[i];
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
                promises.push(_this.getElasticData(queries2[i]));
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
                var dbAggs = data.db.aggregations,
                    Light = dbAggs.Light.Location.buckets,
                    Temperature = dbAggs.Temperature.Location.buckets,
                    Power = dbAggs.Power.Location.buckets;

                Light.forEach(function (locationData) {
                    locationDataMapOperationIssues.push({
                        Id: locationData.key,
                        OperationalIssue: "No Light",
                        LocationGeo: {
                            "lat": locationData.Lat.bounds.top_left.lat,
                            "lon": locationData.Lat.bounds.top_left.lon
                        }
                    });
                });
                Temperature.forEach(function (locationData) {
                    locationDataMapOperationIssues.push({
                        Id: locationData.key,
                        OperationalIssue: "High Temperature",
                        LocationGeo: {
                            "lat": locationData.Lat.bounds.top_left.lat,
                            "lon": locationData.Lat.bounds.top_left.lon
                        }
                    });
                });
                Power.forEach(function (locationData) {
                    locationDataMapOperationIssues.push({
                        Id: locationData.key,
                        OperationalIssue: "Power Off",
                        LocationGeo: {
                            "lat": locationData.Lat.bounds.top_left.lat,
                            "lon": locationData.Lat.bounds.top_left.lon
                        }
                    });
                });

                finalData.summary = {
                    locationDataMapOperationIssues: locationDataMapOperationIssues
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
    getMapLocationForDoorSwing: function (request, reply) {
        request.query = Object.assign({}, request.query, request.payload);
        reply.query = Object.assign({}, request.query, request.payload);
        var clientId = request.auth.credentials.user.ScopeId;
        var credentials = request.auth.credentials;
        var params = Object.assign({}, request.query, request.payload),
            assetSummary = JSON.parse(this.dashboardQueries.locationMapInfo),
            assetTypeCapacitythreshold = JSON.parse(this.dashboardQueries.assetTypeCapacitythreshold);
        var tags = credentials.tags.FirstName;
        tags = tags.toLowerCase();
        // client Filter
        var clientQuery = {
            "term": {
                "ClientId": clientId
            }
        };
        if (clientId != 0) {
            assetSummary.query.bool.filter.push(clientQuery);
            assetTypeCapacitythreshold.query.bool.filter.push(clientQuery);
        }
        var countryname = {
            "term": {
                "Country": tags
            }
        };

        assetTypeCapacitythreshold.query.bool.filter.push(countryname);

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

            totalHours = defaultHours;
            months = 1;
        } else if (!isDefaultDateFilter && params.startDate && params.endDate) {
            var startDate = moment(params.startDate).format('YYYY-MM-DD[T00:00:00]');
            var startDateDays = moment(params.endDate).format('YYYY-MM-DD[T00:00:00]');
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
            var dateRangeQuery2 = {
                "range": {
                    "EventDate": {
                        "gte": startDateDays,
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

                assetSummary.aggs.SmartLocation.aggs.Location.aggs.DoorCount.filter.bool.must.push({
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
            var visitDateRange = {
                "range": {
                    "EventDate": {
                        "gte": startDate,
                        "lte": endDate
                    }
                }
            };

            var assetVisitDateRange = {
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
            assetSummary.aggs.SmartLocation.filter.bool.must.push(countryIdsUser);
        }
        if (limitLocation != 0) {
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

            assetSummary.aggs.SmartLocation.filter.bool.must.push(filterQueryOutlet);

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

            assetSummary.aggs.SmartLocation.filter.bool.must.push(AssetIds);
        }

        if ((params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) ||
            (params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) ||
            (params.DataDownloadOutlet || params["DataDownloadOutlet[]"])) {
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

            assetSummary.aggs.SmartLocation.filter.bool.must.push(LocationIds);
        }

        if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
            var smartDeviceTypeQuery = {
                "terms": {
                    "AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
                }
            }
            assetSummary.aggs.SmartLocation.filter.bool.must.push(smartDeviceTypeQuery);
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
            assetSummary.aggs.SmartLocation.filter.bool.must.push(IsKeyLocationFilter);
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
            assetSummary.aggs.SmartLocation.filter.bool.must.push(IsFactoryAssetFilter);
        }

        if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
            var assetManufactureQuery = {
                "terms": {
                    "AssetManufactureId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
                }
            }
            assetSummary.aggs.SmartLocation.filter.bool.must.push(assetManufactureQuery);
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
            assetSummary.aggs.SmartLocation.filter.bool.must.push(SalesHierarchyId);
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
            };
            assetSummary.aggs.SmartLocation.filter.bool.must.push(manufacturerSmartDeviceQuery);
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
            assetSummary.aggs.SmartLocation.filter.bool.must.push(manufacturerOutletTypeId);
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
            assetSummary.aggs.SmartLocation.filter.bool.must.push(LocationTypeId);
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
            assetSummary.aggs.SmartLocation.filter.bool.must.push(ClassificationId);
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
            assetSummary.aggs.SmartLocation.filter.bool.must.push(SubTradeChannelTypeId);
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
            assetSummary.aggs.SmartLocation.filter.bool.must.push(AssetManufactureId);
        }

        if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
            var AssetTypeId = {
                "terms": {
                    "AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
                }
            }
            assetSummary.aggs.SmartLocation.filter.bool.must.push(AssetTypeId);
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
            assetSummary.aggs.SmartLocation.filter.bool.must.push(SmartDeviceTypeId);
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
            assetSummary.aggs.SmartLocation.filter.bool.must.push(City);
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
            assetSummary.aggs.SmartLocation.filter.bool.must.push(CountryId);
        }

        if (request.query.LocationCode || request.query["LocationCode[]"]) {
            var LocationCode = {
                "term": {
                    "LocationCode": request.query.LocationCode || request.query["LocationCode[]"]
                }
            }
            assetSummary.aggs.SmartLocation.filter.bool.must.push(LocationCode);
        }

        var queries = [{
            key: "db",
            search: {
                index: 'cooler-iot-asseteventdatasummary',
                type: ["AssetEventDataSummary"],
                body: assetSummary,
                ignore_unavailable: true
            }
        },
        {
            key: "assetTypeCapacitythreshold",
            search: {
                index: "cooler-iot-saleshierarchyassettypecapacitythreshold",
                type: ["SalesHierarchyAssetTypeCapacityThreshold"],
                body: assetTypeCapacitythreshold,
                ignore_unavailable: true
            }
        }
        ];

        //console.log(JSON.stringify(queries));
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
                finalData = {};
            for (var i = 0, len = values.length; i < len; i++) {
                var value = values[i];
                data[value.config.key] = value.response;
                util.setLogger(value);

            }

            var dbAggs = data.db.aggregations,
                assettypecapacitythreshold = data.assetTypeCapacitythreshold.hits.hits;
            var Avariable = [];
            var Bvariable = [];
            var Cvariable = [];
            var Dvariable = [];
            var Evariable = [];
            var days = moment.duration(totalHours, 'hours').asDays();
            dbAggs.SmartLocation.Location.buckets.forEach(function (locationData) {
                var locationId = locationData.key;
                var doorActual = 0;
                var SalesOrganisation;
                var doortarget = locationData.DoorOpenTarget.DoorOpenTarget.buckets;
                if (doortarget.length == 0) {
                    doortarget = 0;
                } else {
                    doortarget = doortarget[0].key;
                }
                locationData.SalesOrganization.SalesOrganization.buckets.forEach(function (organisationid) {
                    SalesOrganisation = organisationid.key;
                });
                // var doorValue;
                // if (dbAggs) {
                //     doorValue = dbAggs.SmartLocation.Location.buckets.filter(data => data.key == locationId);
                // }
                // if (doorValue && doorValue.length > 0) {
                doorActual = locationData.DoorCount.DoorCount.value;
                //}
                var AssetType = locationData.AssetTypeCapacity.AssetTypeCapacityId.buckets;
                var doorthreshold = 0;
                var doortargetthreshold = 0;
                var finalthreshold = 0;
                var doornumberthreshold = 0;
                var PercentageValue;
                if (locationData) {
                    var doccount = 0;
                    for (var i = 0; i < AssetType.length; i++) {
                        var CapacityNumber = AssetType[i].key;
                        doccount = AssetType[i].doc_count + doccount;
                        var range = assettypecapacitythreshold.filter(data => data._source.AssetTypeCapacityId == CapacityNumber && data._source.SalesHierarchyId == SalesOrganisation);
                        if (range && range.length > 0) {
                            doorthreshold = range[0]._source.Last30DayDoorThresold * days
                        } else {
                            doortargetthreshold = doortarget * days
                        }
                        if (doorthreshold == 0) {
                            doorthreshold = doortargetthreshold
                        }
                        doorthreshold = doorthreshold * AssetType[i].doc_count;
                        doornumberthreshold = doornumberthreshold + doorthreshold;
                    }
                    if (doornumberthreshold != 0) {
                        doornumberthreshold = doornumberthreshold / doccount;
                    }
                }
                finalthreshold = doornumberthreshold;
                PercentageValue = (doorActual / doornumberthreshold) * 100;
                if (doorActual == 0) {
                    Evariable.push(locationId);
                } else {
                    if (PercentageValue >= 100) {
                        Avariable.push(locationId);
                    } else if (PercentageValue >= 90 && PercentageValue < 100) {
                        Bvariable.push(locationId);
                    } else if (PercentageValue >= 50 && PercentageValue < 90) {
                        Cvariable.push(locationId);
                    } else if (PercentageValue > 0 && PercentageValue < 50) {
                        Dvariable.push(locationId);
                    } else if (PercentageValue == 0) {
                        Evariable.push(locationId);
                    }
                }
            });

            var query1 = "select L.LocationId As locationid, L.latitude As latitude,  L.longitude As longitude  from Location L inner join string_split(' " + Avariable + " ', ',') A ON L.LocationId = A.value where latitude != 0 and longitude != 0 ";
            var query2 = "select L.LocationId As locationid, L.latitude As latitude,  L.longitude As longitude  from Location L inner join string_split(' " + Bvariable + " ', ',') A ON L.LocationId = A.value where latitude != 0 and longitude != 0 ";
            var query3 = "select L.LocationId As locationid, L.latitude As latitude,  L.longitude As longitude  from Location L inner join string_split(' " + Cvariable + " ', ',') A ON L.LocationId = A.value where latitude != 0 and longitude != 0 ";
            var query4 = "select L.LocationId As locationid, L.latitude As latitude,  L.longitude As longitude  from Location L inner join string_split(' " + Dvariable + " ', ',') A ON L.LocationId = A.value where latitude != 0 and longitude != 0 ";
            var query5 = "select L.LocationId As locationid, L.latitude As latitude,  L.longitude As longitude  from Location L inner join string_split(' " + Evariable + " ', ',') A ON L.LocationId = A.value where latitude != 0 and longitude != 0 ";
            var queries2 = [{
                "sql": query1
            }, {
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
                var name = "Avar"
                data2[name] = value.response;
                var value = values2[1];
                var name = "Bvar"
                data2[name] = value.response;
                var value = values2[2];
                var name = "Cvar"
                data2[name] = value.response;
                var value = values2[2];
                var name = "Dvar"
                data2[name] = value.response;
                var value = values2[2];
                var name = "Evar"
                data2[name] = value.response;

                var Avariab = data2.Avar,
                    Bvariab = data2.Bvar,
                    Cvariab = data2.Cvar,
                    Dvariab = data2.Dvar,
                    Evariab = data2.Evar;
                var locationDataMapDoorSwing = [];
                for (var i = 0; i < Avariab.length; i++) {
                    locationDataMapDoorSwing.push({
                        Id: Avariab[i].locationId,
                        DoorSwing: "A",
                        LocationGeo: {
                            "lat": Avariab[i].latitude,
                            "lon": Avariab[i].longitude
                        }
                    })
                }
                for (var i = 0; i < Bvariab.length; i++) {
                    locationDataMapDoorSwing.push({
                        Id: Bvariab[i].locationId,
                        DoorSwing: "B",
                        LocationGeo: {
                            "lat": Bvariab[i].latitude,
                            "lon": Bvariab[i].longitude
                        }
                    })
                }
                for (var i = 0; i < Cvariab.length; i++) {
                    locationDataMapDoorSwing.push({
                        Id: Cvariab[i].locationId,
                        DoorSwing: "C",
                        LocationGeo: {
                            "lat": Cvariab[i].latitude,
                            "lon": Cvariab[i].longitude
                        }
                    })
                }
                for (var i = 0; i < Dvariab.length; i++) {
                    locationDataMapDoorSwing.push({
                        Id: Dvariab[i].locationId,
                        DoorSwing: "D",
                        LocationGeo: {
                            "lat": Dvariab[i].latitude,
                            "lon": Dvariab[i].longitude
                        }
                    })
                }
                for (var i = 0; i < Evariab.length; i++) {
                    locationDataMapDoorSwing.push({
                        Id: Evariab[i].locationId,
                        DoorSwing: "E",
                        LocationGeo: {
                            "lat": Evariab[i].latitude,
                            "lon": Evariab[i].longitude
                        }
                    })
                }
                finalData.summary = {
                    locationDataMapDoorSwing: locationDataMapDoorSwing
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
    }
}