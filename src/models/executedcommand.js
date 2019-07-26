"use strict";

var ElasticListBase = require('./elasticListBase'),
    util = require('../util'),
	moment = require('moment');
class executedcommand extends ElasticListBase {
    customizeQuery(body, params) {
        var bool = body.query.bool;
        var LastEndDate = new Date();
        var mustNot = bool.must_not || [];
        mustNot.push({
            "term": {
                "ExecutedOn": "0001-01-01T00:00:00"
            }
        });
        bool.mustNot = mustNot;
        var range;
        if (params.ExcecuteCommandReport) {
            if (body.aggs) {
                body.aggs["Assets"] = {
                    "terms": {
                        "field": "AssetId",
                        "size": 200000
                    }
                }
            } else {
                body.aggs = {
                    "Assets": {
                        "terms": {
                            "field": "AssetId",
                            "size": 200000
                        }
                    }
                };
            }
        }

        if (params.ExcecuteCommandSpread) {
  
            var aggs = {
                "filter": {
                    "bool": {
                        "filter": [{
                            "range": {
                                "ExecutedOn": {
                                    "gte": "2016-01-01T00:00:00",
                                    "lte": "2017-06-30T23:59:59"
                                }
                            }
                        }]
                    }
                },
                "aggs": {
                    "AssetIds": {
                        "terms": {
                            "field": "AssetId",
                            "size": 100000
                        }
                    },
                    "LocationCount": {
                        "cardinality": {
                            "field": "AssetId",
                            "precision_threshold": 4000
                        }
                    }
                }
            };

           // aggs.filter.bool.filter[0].range.ExecutedOn.gte = moment(LastEndDate).add(-59, 'days').format('YYYY-MM-DD[T00:00:00]');
            aggs.filter.bool.filter[0].range.ExecutedOn.lte = moment(LastEndDate).add(-59, 'days').format('YYYY-MM-DD[T00:00:00]');

            if (body.aggs) {
                body.aggs["MoreThen60Days"] = JSON.parse(JSON.stringify(aggs));
            } else {
                body.aggs = {
                    "MoreThen60Days": JSON.parse(JSON.stringify(aggs))
                };
            }

            aggs.filter.bool.filter[0].range.ExecutedOn.gte = moment(LastEndDate).add(-59, 'days').format('YYYY-MM-DD[T00:00:00]');
            aggs.filter.bool.filter[0].range.ExecutedOn.lte = moment(LastEndDate).add(-30, 'days').format('YYYY-MM-DD[T23:59:59]');

            if (body.aggs) {
                body.aggs["Last60Days"] = JSON.parse(JSON.stringify(aggs));
            } else {
                body.aggs = {
                    "Last60Days": JSON.parse(JSON.stringify(aggs))
                };
            }

            aggs.filter.bool.filter[0].range.ExecutedOn.gte = moment(LastEndDate).add(-29, 'days').format('YYYY-MM-DD[T00:00:00]');
            aggs.filter.bool.filter[0].range.ExecutedOn.lte = moment(LastEndDate).add(-15, 'days').format('YYYY-MM-DD[T23:59:59]');

            if (body.aggs) {
                body.aggs["Last30Days"] = JSON.parse(JSON.stringify(aggs));
            } else {
                body.aggs = {
                    "Last30Days": JSON.parse(JSON.stringify(aggs))
                };
            }

            aggs.filter.bool.filter[0].range.ExecutedOn.gte = moment(LastEndDate).add(-14, 'days').format('YYYY-MM-DD[T00:00:00]');
            aggs.filter.bool.filter[0].range.ExecutedOn.lte = LastEndDate;

            if (body.aggs) {
                body.aggs["Last15Days"] = JSON.parse(JSON.stringify(aggs));
            } else {
                body.aggs = {
                    "Last15Days": JSON.parse(JSON.stringify(aggs))
                };
            }
            //body.query.bool.filter.splice(4,4);
        }

        util.applyDateFilter(params, bool, this.dateFilter);
        if (!params.daysPower) {
            params.daysPower = params.totalDays
        }
        if (params.ExcecuteCommandSpread) {
            body.query.bool.filter.splice(-1,1);
        }
        console.log("execute exceute");
        //console.log(JSON.stringify(body));
    }
};

Object.assign(executedcommand.prototype, {
    index: 'cooler-iot-smartdevicecommand',
    type: 'SmartDeviceCommand',
    propertyDefs: ElasticListBase.assignPropertyDefs([
        "SmartDeviceId",
        "GatewayId",
        "DeviceSerial",
        "GatewayMac",
        "GatewaySerialNumber",
        "EventId",
        "EventDate",
        "CreatedOn",
        "AssetId",
        "ClientId",
        "CountryId",
        "StateId",
        "LocationId",
        "City",
        "TimeZoneId",
        "AssetSerialNumber"
    ]),
    softDelete: null,
    dateFilter: 'EventTime'
});

module.exports = executedcommand;