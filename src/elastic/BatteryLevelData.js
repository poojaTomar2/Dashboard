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
        BatteryLevel: JSON.stringify(require('./dashboardQueries/report/BatteryLevel.json')),
        AssetSummary: JSON.stringify(require('./dashboardQueries/report/BatteryCoolerInfo.json')),
        DataDownloadOutlet: JSON.stringify(require('./dashboardQueries/report/DataDownloadOutlet.json')),
        ExecutedCommandReport: JSON.stringify(require('./dashboardQueries/report/ExecutedCommandReport.json')),
        ExecutedCommandSpread: JSON.stringify(require('./dashboardQueries/report/ExecutedCommandSpread.json')),
        AssetSummaryFallenmagnet: JSON.stringify(require('./dashboardQueries/fallenMagnet/AssetDetailsFallenMagent.json')),
        FallenmagnetChart: JSON.stringify(require('./dashboardQueries/fallenMagnet/FallenMagnet.json')),
        TotalAssetLocation: JSON.stringify(require('./dashboardQueries/TotalAssetLocation.json'))
    },
    getBatteryLevelData: function (request, reply) {
        request.query = Object.assign({}, request.query, request.payload);
        reply.query = Object.assign({}, request.query, request.payload);
        var clientId = request.auth.credentials.user.ScopeId;
        var credentials = request.auth.credentials;
        var params = Object.assign({}, request.query, request.payload),
            BatteryLevel = JSON.parse(this.dashboardQueries.BatteryLevel),
            AssetSummary = JSON.parse(this.dashboardQueries.AssetSummary),
            // totalAssetLocation = JSON.parse(this.dashboardQueries.TotalAssetLocation),
            dataDownload = JSON.parse(this.dashboardQueries.DataDownloadOutlet),
            executedCommandReport = JSON.parse(this.dashboardQueries.ExecutedCommandReport),
            executedCommandSpread = JSON.parse(this.dashboardQueries.ExecutedCommandSpread);
        var tags = credentials.tags.FirstName;
        tags = tags.toLowerCase();
        // client Filter
        var clientQuery = {
            "term": {
                "ClientId": clientId
            }
        };
        if (clientId != 0) {
            BatteryLevel.query.bool.filter.push(clientQuery);
            AssetSummary.query.bool.filter.push(clientQuery);
            // totalAssetLocation.query.bool.filter.push(clientQuery);
            dataDownload.query.bool.filter.push(clientQuery);
            executedCommandReport.query.bool.filter.push(clientQuery);
            executedCommandSpread.query.bool.filter.push(clientQuery);
        }

        //EventDate Filter
        var isDefaultDateFilter = params.yearWeek || params.dayOfWeek || params.quarter || params.month;
        var dateFilter = [];
        var totalHours = 0
        var quarterArr = [];
        var dateFilterTrend = [];
        var months = 0;
        if (!isDefaultDateFilter && !params.startDate && !params.endDate) {
            var dateRangeQuery = {
                "range": {
                    "EventTime": {
                        "gte": "now-30d/d"
                    }
                }
            };
            var dateRangeQuery1 = {
                "range": {
                    "EventDate": {
                        "gte": "now-30d/d"
                    }
                }
            };

            dataDownload.query.bool.filter.push(dateRangeQuery1);
            executedCommandReport.query.bool.filter.push(dateRangeQuery);
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
            var dateRangeQuery1 = {
                "range": {
                    "EventDate": {
                        "gte": startDate,
                        "lte": endDate
                    }
                }
            };

            dataDownload.query.bool.filter.push(dateRangeQuery1);
            executedCommandReport.query.bool.filter.push(dateRangeQuery);
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
        }


        for (var i = 0, len = dateFilter.length; i < len; i++) {
            var filterDate = dateFilter[i];
            var startDate = filterDate.startDate,
                endDate = filterDate.endDate;
            totalHours += filterDate.totalHours;
            if (i == 0) {
                dataDownload.query.bool.filter.push({
                    "bool": {
                        "should": []
                    }
                });
                executedCommandReport.query.bool.filter.push({
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
            var dateRangeQuery1 = {
                "range": {
                    "EventDate": {
                        "gte": startDate,
                        "lte": endDate
                    }
                }
            };

            dataDownload = util.pushDateQuery(dataDownload, dateRangeQuery1);
            executedCommandReport = util.pushDateQuery(executedCommandReport, dateRangeQuery);

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
            BatteryLevel.query.bool.filter.push(countryIdsUser);
            AssetSummary.query.bool.filter.push(countryIdsUser);
            // totalAssetLocation.query.bool.filter.push(countryIdsUser);
            dataDownload.query.bool.filter.push(countryIdsUser);
            executedCommandReport.query.bool.filter.push(countryIdsUser);
            executedCommandSpread.query.bool.filter.push(countryIdsUser);
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

            BatteryLevel.query.bool.filter.push(filterQuery);
            AssetSummary.query.bool.filter.push(filterQuery);
            //totalAssetLocation.query.bool.filter.push(filterQuery);
            dataDownload.query.bool.filter.push(filterQuery);
            executedCommandReport.query.bool.filter.push(filterQuery);
            executedCommandSpread.query.bool.filter.push(filterQuery);
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

            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetIds);
            AssetSummary.aggs.Locations.filter.bool.must.push(AssetIds);
            BatteryLevel.query.bool.filter.push(AssetIds);
            dataDownload.query.bool.filter.push(LocationIds);
            executedCommandReport.query.bool.filter.push(AssetIds);
            executedCommandSpread.query.bool.filter.push(AssetIds);
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

            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(LocationIds);
            AssetSummary.aggs.Locations.filter.bool.must.push(LocationIds);
            BatteryLevel.query.bool.filter.push(LocationIds);
            dataDownload.query.bool.filter.push(LocationIds);
            executedCommandReport.query.bool.filter.push(LocationIds);
            executedCommandSpread.query.bool.filter.push(LocationIds);
        }

        if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
            var smartDeviceTypeQuery = {
                "terms": {
                    "AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
                }
            }
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(smartDeviceTypeQuery);
            AssetSummary.aggs.Locations.filter.bool.must.push(smartDeviceTypeQuery);
            BatteryLevel.query.bool.filter.push(smartDeviceTypeQuery);
            dataDownload.query.bool.filter.push(smartDeviceTypeQuery);
            // executedCommandReport.query.bool.filter.push(smartDeviceTypeQuery);
            // executedCommandSpread.query.bool.filter.push(smartDeviceTypeQuery);
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
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(IsKeyLocationFilter);
            AssetSummary.aggs.Locations.filter.bool.must.push(IsKeyLocationFilter);
            BatteryLevel.query.bool.filter.push(IsKeyLocationFilter);
            dataDownload.query.bool.filter.push(IsKeyLocationFilter);
            //  executedCommandReport.query.bool.filter.push(IsKeyLocationFilter);
            //  executedCommandSpread.query.bool.filter.push(IsKeyLocationFilter);
        }

        if (request.query.IsFactoryAsset || request.query["IsFactoryAsset[]"]) {
            var key;
            if (request.query.IsFactoryAsset == 1) {
                key = true;
            } else {
                key = false;
            }
            var assetManufactureQuery = {
                "term": {
                    "IsFactoryAsset": key
                }
            }
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(IsFactoryAssetFilter);
            AssetSummary.aggs.Locations.filter.bool.must.push(IsFactoryAssetFilter);
            BatteryLevel.query.bool.filter.push(IsFactoryAssetFilter);
            dataDownload.query.bool.filter.push(assetManufactureQuery);
            // executedCommandReport.query.bool.filter.push(assetManufactureQuery);
            //  executedCommandSpread.query.bool.filter.push(assetManufactureQuery);
        }

        if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
            var assetManufactureQuery = {
                "terms": {
                    "AssetManufactureId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
                }
            }
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetManufactureQuery);
            AssetSummary.aggs.Locations.filter.bool.must.push(assetManufactureQuery);
            BatteryLevel.query.bool.filter.push(assetManufactureQuery);
            dataDownload.query.bool.filter.push(assetManufactureQuery);
            // executedCommandReport.query.bool.filter.push(assetManufactureQuery);
            //  executedCommandSpread.query.bool.filter.push(assetManufactureQuery);
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
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(SalesHierarchyId);
            AssetSummary.aggs.Locations.filter.bool.must.push(SalesHierarchyId);
            BatteryLevel.query.bool.filter.push(SalesHierarchyId);
            dataDownload.query.bool.filter.push(SalesHierarchyId);
            //   executedCommandReport.query.bool.filter.push(SalesHierarchyId);
            // executedCommandSpread.query.bool.filter.push(SalesHierarchyId);
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
            var manufacturerSmartDeviceQuery2 = {
                "terms": {
                    "SmartDeviceManufacturerId": request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]
                }
            };
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerSmartDeviceQuery);
            AssetSummary.aggs.Locations.filter.bool.must.push(manufacturerSmartDeviceQuery);
            BatteryLevel.query.bool.filter.push(manufacturerSmartDeviceQuery2);
            dataDownload.query.bool.filter.push(manufacturerSmartDeviceQuery);
            //  executedCommandReport.query.bool.filter.push(manufacturerSmartDeviceQuery2);
            //   executedCommandSpread.query.bool.filter.push(manufacturerSmartDeviceQuery2);
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
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerOutletTypeId);
            AssetSummary.aggs.Locations.filter.bool.must.push(manufacturerOutletTypeId);
            BatteryLevel.query.bool.filter.push(manufacturerOutletTypeId);
            dataDownload.query.bool.filter.push(manufacturerOutletTypeId);
            //   executedCommandReport.query.bool.filter.push(manufacturerOutletTypeId);
            //   executedCommandSpread.query.bool.filter.push(manufacturerOutletTypeId);
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
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(LocationTypeId);
            AssetSummary.aggs.Locations.filter.bool.must.push(LocationTypeId);
            BatteryLevel.query.bool.filter.push(LocationTypeId);
            dataDownload.query.bool.filter.push(LocationTypeId);
            //  executedCommandReport.query.bool.filter.push(LocationTypeId);
            //  executedCommandSpread.query.bool.filter.push(LocationTypeId);
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
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(ClassificationId);
            AssetSummary.aggs.Locations.filter.bool.must.push(ClassificationId);
            BatteryLevel.query.bool.filter.push(ClassificationId);
            dataDownload.query.bool.filter.push(ClassificationId);
            // executedCommandReport.query.bool.filter.push(ClassificationId);
            //  executedCommandSpread.query.bool.filter.push(ClassificationId);
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
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(SubTradeChannelTypeId);
            AssetSummary.aggs.Locations.filter.bool.must.push(SubTradeChannelTypeId);
            BatteryLevel.query.bool.filter.push(SubTradeChannelTypeId);
            dataDownload.query.bool.filter.push(SubTradeChannelTypeId);
            // executedCommandReport.query.bool.filter.push(SubTradeChannelTypeId);
            //  executedCommandSpread.query.bool.filter.push(SubTradeChannelTypeId);
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
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetManufactureId);
            AssetSummary.aggs.Locations.filter.bool.must.push(AssetManufactureId);
            BatteryLevel.query.bool.filter.push(AssetManufactureId);
            dataDownload.query.bool.filter.push(AssetManufactureId);
            // executedCommandReport.query.bool.filter.push(AssetManufactureId);
            // executedCommandSpread.query.bool.filter.push(AssetManufactureId);
        }

        if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
            var AssetTypeId = {
                "terms": {
                    "AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
                }
            }
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetTypeId);
            AssetSummary.aggs.Locations.filter.bool.must.push(AssetTypeId);
            BatteryLevel.query.bool.filter.push(AssetTypeId);
            dataDownload.query.bool.filter.push(AssetTypeId);
            //  executedCommandReport.query.bool.filter.push(AssetTypeId);
            //  executedCommandSpread.query.bool.filter.push(AssetTypeId);
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
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(SmartDeviceTypeId);
            AssetSummary.aggs.Locations.filter.bool.must.push(SmartDeviceTypeId);
            BatteryLevel.query.bool.filter.push(SmartDeviceTypeId);
            dataDownload.query.bool.filter.push(SmartDeviceTypeId);
            // executedCommandReport.query.bool.filter.push(SmartDeviceTypeId);
            //executedCommandSpread.query.bool.filter.push(SmartDeviceTypeId);
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
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(City);
            AssetSummary.aggs.Locations.filter.bool.must.push(City);
            BatteryLevel.query.bool.filter.push(City);
            dataDownload.query.bool.filter.push(City);
            //executedCommandReport.query.bool.filter.push(City);
            // executedCommandSpread.query.bool.filter.push(City);
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
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(CountryId);
            AssetSummary.aggs.Locations.filter.bool.must.push(CountryId);
            BatteryLevel.query.bool.filter.push(CountryId);
            dataDownload.query.bool.filter.push(CountryId);
            // executedCommandReport.query.bool.filter.push(CountryId);
            // executedCommandSpread.query.bool.filter.push(CountryId);
        }

        if (request.query.LocationCode || request.query["LocationCode[]"]) {
            var LocationCode = {
                "term": {
                    "LocationCode": request.query.LocationCode || request.query["LocationCode[]"]
                }
            }
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(LocationCode);
            AssetSummary.aggs.Locations.filter.bool.must.push(LocationCode);
            BatteryLevel.query.bool.filter.push(LocationCode);
            dataDownload.query.bool.filter.push(LocationCode);
            //executedCommandReport.query.bool.filter.push(LocationCode);
            // executedCommandSpread.query.bool.filter.push(LocationCode);
        }

        var lastEndDate = new Date();
        var dateRangeexecute = {
            "range": {
                "ExecutedOn": {
                    "lte": moment(lastEndDate).add(-59, 'days').format('YYYY-MM-DD[T00:00:00]')
                }
            }
        };

        executedCommandSpread.aggs.Last15Days.filter.bool.filter[0].range.ExecutedOn.gte = moment(lastEndDate).add(-14, 'days').format('YYYY-MM-DD[T00:00:00]');
        executedCommandSpread.aggs.Last15Days.filter.bool.filter[0].range.ExecutedOn.lte = lastEndDate;

        executedCommandSpread.aggs.Last30Days.filter.bool.filter[0].range.ExecutedOn.gte = moment(lastEndDate).add(-29, 'days').format('YYYY-MM-DD[T00:00:00]');
        executedCommandSpread.aggs.Last30Days.filter.bool.filter[0].range.ExecutedOn.lte = moment(lastEndDate).add(-15, 'days').format('YYYY-MM-DD[T23:59:59]');

        executedCommandSpread.aggs.Last60Days.filter.bool.filter[0].range.ExecutedOn.gte = moment(lastEndDate).add(-59, 'days').format('YYYY-MM-DD[T00:00:00]');
        executedCommandSpread.aggs.Last60Days.filter.bool.filter[0].range.ExecutedOn.lte = moment(lastEndDate).add(-30, 'days').format('YYYY-MM-DD[T23:59:59]');

        // executedCommandSpread.aggs.MoreThen60Days.filter.bool.filter[0].range.ExecutedOn.gte = moment(lastEndDate).add(-59, 'days').format('YYYY-MM-DD[T00:00:00]');
        executedCommandSpread.aggs.MoreThen60Days.filter.bool.filter.push(dateRangeexecute);
        var indexNames = util.getEventsIndexName(startDate, endDate, 'cooler-iot-smartdevicecommand-');
        var queries = [{
                key: "db",
                search: {
                    index: 'cooler-iot-asseteventdatasummary',
                    type: ["AssetEventDataSummary"],
                    body: AssetSummary,
                    ignore_unavailable: true
                }
            },
            {
                key: "Battery",
                search: {
                    index: 'cooler-iot-asset',
                    type: ["Asset"],
                    body: BatteryLevel,
                    ignore_unavailable: true
                }
            },
            {
                key: "dataDownloaddata",
                search: {
                    index: 'cooler-iot-asseteventdatasummary',
                    type: ["AssetEventDataSummary"],
                    body: dataDownload,
                    ignore_unavailable: true
                }
            }, {
                key: "executedCommandReport",
                search: {
                    index: indexNames.toString(), // 'cooler-iot-event',
                    type: ["SmartDeviceCommand"],
                    body: executedCommandReport,
                    ignore_unavailable: true
                }
            }, {
                key: "executedCommandSpread",
                search: {
                    index: 'cooler-iot-smartdevicecommand', // 'cooler-iot-event',
                    type: ["SmartDeviceCommand"],
                    body: executedCommandSpread,
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
                    batterydata: [{
                        "key": '0%-25%',
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '25%-50%',
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '50%-75%',
                        "assets": 0,
                        total: 0
                    }, {
                        "key": '75%-100%',
                        "assets": 0,
                        total: 0
                    }],
                    healthOverview: [],
                    executedReport: [{
                        "key": 'Executed',
                        "assets": 0
                    }, {
                        "key": 'Scheduled',
                        "assets": 0
                    }],
                    executedSpread: [{
                            "key": "Executed<15 days",
                            "assets": 0,
                            "color": "#55BF3B"
                        },
                        {
                            "key": "Executed > 15, <30 days",
                            "assets": 0,
                            "color": "#fff589"
                        },
                        {
                            "key": "Executed > 30, <60 days",
                            "assets": 0,
                            "color": "#DF5353"
                        },
                        {
                            "key": "Executed >60 days",
                            "assets": 0,
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
                Battery = data.Battery.aggregations,
                //totalAssetLocation = data.totalAssetLocation.aggregations,
                healthAggs = data.dataDownloaddata.aggregations,
                executedReportAggs = data.executedCommandReport.aggregations,
                executedSpreadAggs = data.executedCommandSpread.aggregations;

            //====for battery report data==========//
            finalData.batterydata[0].assets = Battery.Battery0to25.Battery0to25.value;
            finalData.batterydata[1].assets = Battery.Battery25to50.Battery25to50.value;
            finalData.batterydata[2].assets = Battery.Battery50to75.Battery50to75.value;
            finalData.batterydata[3].assets = Battery.Battery75to100.Battery75to100.value;

            //========Data Download Outlet==================//

            var HealthDataDownloadDays = {
                "Full Data": 0,
                "Partial Data": 0,
                "No Data": 0
            };
            var locationDays = 0,
                healthOverview = [],
                AllhealthCount = 0;
            healthAggs.Locations.buckets.forEach(function (data) {
                AllhealthCount = AllhealthCount + 1;
                locationDays = data.HealthDays.buckets.length;
                if (locationDays == Math.round(duration)) {
                    HealthDataDownloadDays['Full Data'] = HealthDataDownloadDays['Full Data'] + 1;
                } else {
                    //console.log(data.key);
                    HealthDataDownloadDays['Partial Data'] = HealthDataDownloadDays['Partial Data'] + 1;
                }
            });
            if (dbAggs.Locations.Locations.buckets.length > AllhealthCount) {
                HealthDataDownloadDays['No Data'] = dbAggs.Locations.Locations.buckets.length - AllhealthCount;
            } else {
                HealthDataDownloadDays['No Data'] = 0;
            }

            finalData.healthOverview = healthOverview;

            var overview = HealthDataDownloadDays;
            for (var o in overview) {
                if (o !== "doc_count") {
                    var percentage = (overview[o] / dbAggs.Locations.Locations.buckets.length) * 100;
                    var percentagefixed = Math.round(percentage * 100) / 100;
                    var percentagefixedround = percentagefixed > 100 ? 100 : percentagefixed;
                    healthOverview.push({
                        name: o,
                        y: percentagefixedround
                    });
                }
            }

            //===========for executed command report ========================//
            if (executedReportAggs) {
                finalData.executedReport[0].assets = executedReportAggs.Assets.buckets.length;
                finalData.executedReport[1].assets = dbAggs.SmartAssetCount.SmartAssetCount.buckets.length - executedReportAggs.Assets.buckets.length;
            }

            //=====================for last data download chart=============================//
            if (executedSpreadAggs) {
                var last15Days = executedSpreadAggs.Last15Days.AssetIds.buckets;
                //finalData.executedSpread[0].data.push(last15Days.length);
                finalData.executedSpread[0].assets = last15Days.length;
                var last30Days = executedSpreadAggs.Last30Days.AssetIds.buckets;
                last30Days = last30Days.filter(function (y) {
                    return last15Days.findIndex(x => x.key === y.key) < 0
                });
                //finalData.executedSpread[1].data.push(last30Days.length);
                finalData.executedSpread[1].assets = last30Days.length;
                var last60Days = executedSpreadAggs.Last60Days.AssetIds.buckets;
                last60Days = last60Days.filter(function (y) {
                    return (last15Days.findIndex(x => x.key === y.key) < 0) && (last30Days.findIndex(x => x.key === y.key) < 0)
                });
                //finalData.executedSpread[2].data.push(last60Days.length);
                finalData.executedSpread[2].assets = last60Days.length;
                finalData.executedSpread[3].assets = executedSpreadAggs.MoreThen60Days.AssetCount.value;
            }
            finalData.summary = {
                totalCustomer: dbAggs.LocationCount.LocationCount.buckets.length,
                filteredAssets: dbAggs.AssetCount.AssetCount.buckets.length,
                filteredOutlets: dbAggs.Locations.Locations.buckets.length,
                smartAssetCount: dbAggs.SmartAssetCount.SmartAssetCount.buckets.length
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
    getFallenMagnetData: function (request, reply) {
        request.query = Object.assign({}, request.query, request.payload);
        reply.query = Object.assign({}, request.query, request.payload);
        var clientId = request.auth.credentials.user.ScopeId;
        var credentials = request.auth.credentials;
        var params = Object.assign({}, request.query, request.payload),
            FallenmagnetChart = JSON.parse(this.dashboardQueries.FallenmagnetChart),
            //totalAssetLocation = JSON.parse(this.dashboardQueries.TotalAssetLocation),
            AssetSummary = JSON.parse(this.dashboardQueries.AssetSummaryFallenmagnet);
        var tags = credentials.tags.FirstName;
        tags = tags.toLowerCase();
        // client Filter
        var clientQuery = {
            "term": {
                "ClientId": clientId
            }
        };
        if (clientId != 0) {
            FallenmagnetChart.query.bool.filter.push(clientQuery);
            AssetSummary.query.bool.filter.push(clientQuery);
            // totalAssetLocation.query.bool.filter.push(clientQuery);
        }

        var dateRangeQuery = {
            "range": {
                "EventDate": {
                    "lte": new Date()
                }
            }
        };
        FallenmagnetChart.query.bool.filter.push(dateRangeQuery);

        // var Fallenmagnet = {
        //     "range": {
        //         "FallenMaganet": {
        //             "gte": 14
        //         }
        //     }
        // };
        // FallenmagnetChart.aggs.FallenMagnet.filter.bool.must.push(Fallenmagnet);

        // var FallenMagnetNot = {
        //     "range": {
        //         "FallenMaganet": {
        //             "lte": 14
        //         }
        //     }
        // };
        // FallenmagnetChart.aggs.FallenMagnetNot.filter.bool.must.push(FallenMagnetNot);

        // var FallenMagnet15to30 = {
        //     "range": {
        //         "FallenMaganet": {
        //             "gte": 15,
        //             "lt": 30
        //         }
        //     }
        // };
        // FallenmagnetChart.aggs.FallenMagnet15to30.filter.bool.must.push(FallenMagnet15to30);

        // var FallenMagnet30to60 = {
        //     "range": {
        //         "FallenMaganet": {
        //             "gte": 30,
        //             "lt": 60
        //         }
        //     }
        // };
        // FallenmagnetChart.aggs.FallenMagnet30to60.filter.bool.must.push(FallenMagnet30to60);

        // var FallenMagnet60to90 = {
        //     "range": {
        //         "FallenMaganet": {
        //             "gte": 60,
        //             "lte": 90
        //         }
        //     }
        // };
        // FallenmagnetChart.aggs.FallenMagnet60to90.filter.bool.must.push(FallenMagnet60to90);

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
            FallenmagnetChart.query.bool.filter.push(countryIdsUser);
            AssetSummary.query.bool.filter.push(countryIdsUser);
            // totalAssetLocation.query.bool.filter.push(countryIdsUser);
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

            FallenmagnetChart.query.bool.filter.push(filterQuery);
            AssetSummary.query.bool.filter.push(filterQuery);
            // totalAssetLocation.query.bool.filter.push(filterQuery);
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

            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetIds);
            AssetSummary.aggs.Locations.filter.bool.must.push(AssetIds);
            FallenmagnetChart.query.bool.filter.push(AssetIds);
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

            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(LocationIds);
            AssetSummary.aggs.Locations.filter.bool.must.push(LocationIds);
            FallenmagnetChart.query.bool.filter.push(LocationIds);
        }

        if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
            var smartDeviceTypeQuery = {
                "terms": {
                    "AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
                }
            }
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(smartDeviceTypeQuery);
            AssetSummary.aggs.Locations.filter.bool.must.push(smartDeviceTypeQuery);
            FallenmagnetChart.query.bool.filter.push(smartDeviceTypeQuery);
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
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(IsKeyLocationFilter);
            AssetSummary.aggs.Locations.filter.bool.must.push(IsKeyLocationFilter);
            FallenmagnetChart.query.bool.filter.push(IsKeyLocationFilter);
        }

        if (request.query.IsFactoryAsset || request.query["IsFactoryAsset[]"]) {
            var key;
            if (request.query.IsFactoryAsset == 1) {
                key = true;
            } else {
                key = false;
            }
            var assetManufactureQuery = {
                "term": {
                    "IsFactoryAsset": key
                }
            }
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(IsFactoryAssetFilter);
            AssetSummary.aggs.Locations.filter.bool.must.push(IsFactoryAssetFilter);
            FallenmagnetChart.query.bool.filter.push(IsFactoryAssetFilter);
        }

        if (request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]) {
            var assetManufactureQuery = {
                "terms": {
                    "AssetManufactureId": request.query.AssetManufacturerId || request.query["AssetManufacturerId[]"]
                }
            }
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(assetManufactureQuery);
            AssetSummary.aggs.Locations.filter.bool.must.push(assetManufactureQuery);
            FallenmagnetChart.query.bool.filter.push(assetManufactureQuery);
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
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(SalesHierarchyId);
            AssetSummary.aggs.Locations.filter.bool.must.push(SalesHierarchyId);
            FallenmagnetChart.query.bool.filter.push(SalesHierarchyId);
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
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerSmartDeviceQuery);
            AssetSummary.aggs.Locations.filter.bool.must.push(manufacturerSmartDeviceQuery);
            // FallenmagnetChart.query.bool.filter.push(manufacturerSmartDeviceQuery);
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
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(manufacturerOutletTypeId);
            AssetSummary.aggs.Locations.filter.bool.must.push(manufacturerOutletTypeId);
            // FallenmagnetChart.query.bool.filter.push(manufacturerOutletTypeId);
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
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(LocationTypeId);
            AssetSummary.aggs.Locations.filter.bool.must.push(LocationTypeId);
            FallenmagnetChart.query.bool.filter.push(LocationTypeId);
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
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(ClassificationId);
            AssetSummary.aggs.Locations.filter.bool.must.push(ClassificationId);
            FallenmagnetChart.query.bool.filter.push(ClassificationId);
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
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(SubTradeChannelTypeId);
            AssetSummary.aggs.Locations.filter.bool.must.push(SubTradeChannelTypeId);
            FallenmagnetChart.query.bool.filter.push(SubTradeChannelTypeId);
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
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetManufactureId);
            AssetSummary.aggs.Locations.filter.bool.must.push(AssetManufactureId);
            FallenmagnetChart.query.bool.filter.push(AssetManufactureId);
        }

        if (request.query.AssetTypeId || request.query["AssetTypeId[]"]) {
            var AssetTypeId = {
                "terms": {
                    "AssetTypeId": request.query.AssetTypeId || request.query["AssetTypeId[]"]
                }
            }
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(AssetTypeId);
            AssetSummary.aggs.Locations.filter.bool.must.push(AssetTypeId);
            FallenmagnetChart.query.bool.filter.push(AssetTypeId);
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
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(SmartDeviceTypeId);
            AssetSummary.aggs.Locations.filter.bool.must.push(SmartDeviceTypeId);
            FallenmagnetChart.query.bool.filter.push(SmartDeviceTypeId);
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
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(City);
            AssetSummary.aggs.Locations.filter.bool.must.push(City);
            FallenmagnetChart.query.bool.filter.push(City);
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
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(CountryId);
            AssetSummary.aggs.Locations.filter.bool.must.push(CountryId);
            FallenmagnetChart.query.bool.filter.push(CountryId);
        }

        if (request.query.LocationCode || request.query["LocationCode[]"]) {
            var LocationCode = {
                "term": {
                    "LocationCode": request.query.LocationCode || request.query["LocationCode[]"]
                }
            }
            AssetSummary.aggs.SmartAssetCount.filter.bool.must.push(LocationCode);
            AssetSummary.aggs.Locations.filter.bool.must.push(LocationCode);
            FallenmagnetChart.query.bool.filter.push(LocationCode);
        }

        var queries = [{
                key: "db",
                search: {
                    index: 'cooler-iot-asseteventdatasummary',
                    type: ["AssetEventDataSummary"],
                    body: AssetSummary,
                    ignore_unavailable: true
                }
            },
            {
                key: "FallenmagnetChart",
                search: {
                    index: 'cooler-iot-asseteventdatasummary',
                    type: ["AssetEventDataSummary"],
                    body: FallenmagnetChart,
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
                    FallenMagnet: [{
                        "key": 'Normal Operation',
                        "assets": 0,
                        "percentage": 0
                    }, {
                        "key": 'Fallen Magnet',
                        "assets": 0,
                        "percentage": 0
                    }],
                    FallenMagnetSpread: [{
                            "key": "30 days > FallenMagnet > 15 days",
                            "assets": 0,
                            "percentage": 0
                        },
                        {
                            "key": "60 days > FallenMagnet > 30 days",
                            "assets": 0,
                            "percentage": 0
                        },
                        {
                            "key": "90 days > FallenMagnet > 60 days",
                            "assets": 0,
                            "percentage": 0
                        }
                    ]
                };
            for (var i = 0, len = values.length; i < len; i++) {
                var value = values[i];
                data[value.config.key] = value.response;
                util.setLogger(value);
            }

            var dbAggs = data.db.aggregations,
                //totalAssetLocation = data.totalAssetLocation.aggregations,
                FallenChart = data.FallenmagnetChart.aggregations;

            //====for Fallen Magnet Chart==========//
            var fallenMagnetyes = 0;
            var fallenMagnetno = 0;
            var fallenMagnet15 = 0;
            var fallenMagnet30 = 0;
            var fallenMagnet60 = 0;
            FallenChart.FallenMagnet.top_tags.buckets.forEach(function (locationData) {
                var checkyes = locationData.top_hit.hits.hits[0]._source.FallenMaganet;
                if (checkyes >= 14) {
                    //console.log(locationData.top_hit.hits.hits[0]._source.AssetId);
                    fallenMagnetyes++;
                } else if (checkyes < 14) {
                    //console.log(locationData.top_hit.hits.hits[0]._source.AssetId);
                    fallenMagnetno++;
                }
            });

            var total = fallenMagnetyes + fallenMagnetno;
            finalData.FallenMagnet[0].assets = fallenMagnetno;
            finalData.FallenMagnet[0].percentage = (fallenMagnetno / total) * 100;

            finalData.FallenMagnet[1].assets = fallenMagnetyes;
            finalData.FallenMagnet[1].percentage = (fallenMagnetyes / total) * 100;
            //========Fallen Magnet Spread==================//
            FallenChart.FallenMagnet.top_tags.buckets.forEach(function (locationData) {
                var checkyes = locationData.top_hit.hits.hits[0]._source.FallenMaganet;
                if (checkyes >= 15 && checkyes < 30) {
                    fallenMagnet15++;
                } else if (checkyes >= 30 && checkyes < 60) {
                    fallenMagnet30++;
                } else if (checkyes >= 60 && checkyes <= 90) {
                    fallenMagnet60++;
                }
            });
            var total = fallenMagnet15 + fallenMagnet30 + fallenMagnet60;
            finalData.FallenMagnetSpread[0].assets = fallenMagnet15;
            finalData.FallenMagnetSpread[0].percentage = (fallenMagnet15 / total) * 100;

            finalData.FallenMagnetSpread[1].assets = fallenMagnet30;
            finalData.FallenMagnetSpread[1].percentage = (fallenMagnet30 / total) * 100;

            finalData.FallenMagnetSpread[2].assets = fallenMagnet60;
            finalData.FallenMagnetSpread[2].percentage = (fallenMagnet60 / total) * 100;

            finalData.summary = {
                totalCustomer: dbAggs.LocationCount.LocationCount.buckets.length,
                filteredAssets: dbAggs.AssetCount.AssetCount.buckets.length,
                filteredOutlets: dbAggs.Locations.Locations.buckets.length,
                smartAssetCount: dbAggs.SmartAssetCount.SmartAssetCount.buckets.length
            };

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