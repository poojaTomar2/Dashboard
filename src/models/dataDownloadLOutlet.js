"use strict";

var ElasticListBase = require('./elasticListBase'),
    util = require('../util');

class dataDownloadLOutlet extends ElasticListBase {
    customizeQuery(body, params) {
        var bool = body.query.bool;
        var mustNot = bool.must_not || [];
        var must = bool.must || [];
        must.push({
            "term": {
                "IsFromHealth": true
            }
        });
        bool.must = must;
        var range;
        if (params.DataDownloadOutlet) {
            if (body.aggs) {
                body.aggs["Locations"] = {
                    "terms": {
                        "field": "LocationId",
                        "size": 200000
                    },
                    "aggs": {
                        "HealthDays": {
                            "date_histogram": {
                                "field": "EventDate",
                                "interval": "day",
                                "min_doc_count": 1
                            }
                        }
                    }
                }
            } else {
                body.aggs = {
                    "Locations": {
                        "terms": {
                            "field": "LocationId",
                            "size": 200000
                        },
                        "aggs": {
                            "HealthDays": {
                                "date_histogram": {
                                    "field": "EventDate",
                                    "interval": "day",
                                    "min_doc_count": 1
                                }
                            }
                        }
                    }
                };
            }
        }

        util.applyDateFilter(params, bool, this.dateFilter);
        if (!params.daysPower) {
            params.daysPower = params.totalDays
        }
        console.log("datadatadtatadtatdatdtatdatdatda");
        //console.log(JSON.stringify(body));
    }
};

Object.assign(dataDownloadLOutlet.prototype, {
    index: 'cooler-iot-asseteventdatasummary',
    type: 'AssetEventDataSummary',
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
        "AssetSerialNumber",
        "SmartDeviceManufactureId",
        "OutletTypeId"
    ]),
    softDelete: null,
    dateFilter: 'EventDate'
});

module.exports = dataDownloadLOutlet;