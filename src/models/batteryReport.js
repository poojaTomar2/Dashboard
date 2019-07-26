"use strict";

var ElasticListBase = require('./elasticListBase');

class BatteryReport extends ElasticListBase {
    customizeQuery(body, params) {
        var bool = body.query.bool;
        bool.filter.push({
            "term": {
                "IsDeleted": false
            }
        });
        var mustNot = bool.must_not || [];

        bool.mustNot = mustNot;

        if (params.batteryReprtData) {
            if (body.aggs) {
                body.aggs["Battery0to25"] = {
                        "filter": {
                            "bool": {
                                "must": [{
                                    "range": {
                                        "BatteryLevel": {
                                            "gte": "0",
                                            "lt": "25"
                                        }
                                    }
                                }],
                                "must_not": [{
                                    "term": {
                                        "LatestHealthRecordId": 0
                                    }
                                }]
                            }
                        },
                        "aggs": {
                            "Battery0to25": {
                                "terms": {
                                    "field": "AssetId",
                                    "size": 200000
                                }
                            }
                        }
                    },
                    body.aggs["Battery25to50"] = {
                        "filter": {
                            "bool": {
                                "must": [{
                                    "range": {
                                        "BatteryLevel": {
                                            "gte": "25",
                                            "lt": "50"
                                        }
                                    }
                                }],
                                "must_not": [{
                                    "term": {
                                        "LatestHealthRecordId": 0
                                    }
                                }]
                            }
                        },
                        "aggs": {
                            "Battery25to50": {
                                "terms": {
                                    "field": "AssetId",
                                    "size": 200000
                                }
                            }
                        }
                    },
                    body.aggs["Battery50to75"] = {
                        "filter": {
                            "bool": {
                                "must": [{
                                    "range": {
                                        "BatteryLevel": {
                                            "gte": "50",
                                            "lt": "75"
                                        }
                                    }
                                }],
                                "must_not": [{
                                    "term": {
                                        "LatestHealthRecordId": 0
                                    }
                                }]
                            }
                        },
                        "aggs": {
                            "Battery50to75": {
                                "terms": {
                                    "field": "AssetId",
                                    "size": 200000
                                }
                            }
                        }
                    },
                    body.aggs["Battery75to100"] = {
                        "filter": {
                            "bool": {
                                "must": [{
                                    "range": {
                                        "BatteryLevel": {
                                            "gte": "75",
                                            "lte": "100"
                                        }
                                    }
                                }],
                                "must_not": [{
                                    "term": {
                                        "LatestHealthRecordId": 0
                                    }
                                }]
                            }
                        },
                        "aggs": {
                            "Battery75to100": {
                                "terms": {
                                    "field": "AssetId",
                                    "size": 200000
                                }
                            }
                        }
                    }
            } else {
                body.aggs = {
                    "Battery0to25": {
                        "filter": {
                            "bool": {
                                "must": [{
                                    "range": {
                                        "BatteryLevel": {
                                            "gte": "0",
                                            "lt": "25"
                                        }
                                    }
                                }],
                                "must_not": [{
                                    "term": {
                                        "LatestHealthRecordId": 0
                                    }
                                }]
                            }
                        },
                        "aggs": {
                            "Battery0to25": {
                                "terms": {
                                    "field": "AssetId",
                                    "size": 200000
                                }
                            }
                        }
                    },
                    "Battery25to50": {
                        "filter": {
                            "bool": {
                                "must": [{
                                    "range": {
                                        "BatteryLevel": {
                                            "gte": "25",
                                            "lt": "50"
                                        }
                                    }
                                }],
                                "must_not": [{
                                    "term": {
                                        "LatestHealthRecordId": 0
                                    }
                                }]
                            }
                        },
                        "aggs": {
                            "Battery25to50": {
                                "terms": {
                                    "field": "AssetId",
                                    "size": 200000
                                }
                            }
                        }
                    },
                    "Battery50to75": {
                        "filter": {
                            "bool": {
                                "must": [{
                                    "range": {
                                        "BatteryLevel": {
                                            "gte": "50",
                                            "lt": "75"
                                        }
                                    }
                                }],
                                "must_not": [{
                                    "term": {
                                        "LatestHealthRecordId": 0
                                    }
                                }]
                            }
                        },
                        "aggs": {
                            "Battery50to75": {
                                "terms": {
                                    "field": "AssetId",
                                    "size": 200000
                                }
                            }
                        }
                    },
                    "Battery75to100": {
                        "filter": {
                            "bool": {
                                "must": [{
                                    "range": {
                                        "BatteryLevel": {
                                            "gte": "75",
                                            "lte": "100"
                                        }
                                    }
                                }],
                                "must_not": [{
                                    "term": {
                                        "LatestHealthRecordId": 0
                                    }
                                }]
                            }
                        },
                        "aggs": {
                            "Battery75to100": {
                                "terms": {
                                    "field": "AssetId",
                                    "size": 200000
                                }
                            }
                        }
                    }
                };
            }
        }

        console.log("BatteryReport");
        // console.log(JSON.stringify(body));
    }
};

Object.assign(BatteryReport.prototype, {
    index: 'cooler-iot-asset',
    type: 'Asset',
    propertyDefs: ElasticListBase.assignPropertyDefs([
        "TagNumber",
        {
            name: "SerialNumber",
            type: "string"
        },
        "LocationId",
        "AssetTypeId",
        "IsActive",
        "LocationGeo",
        "LatestStockId",
        "LatestPurityId",
        "LatestProcessedPurityId",
        "LatestDoorStatusId",
        "LatestHealthRecordId",
        "CreatedByUserId",
        "CreatedOn",
        "ModifiedByUserId",
        "ModifiedOn",
        "ParentAssetId",
        "Installation",
        "Expiry",
        "WarrantyExpiry",
        "LastTested",
        "ClientId",
        "SmartDeviceId",
        "LatestMovementId",
        "CustomSettings",
        "Usage",
        "LatestAssetVisitHistoryId",
        "PlanogramId",
        "Shelves",
        "LatestGpsId",
        "LatestCellId",
        "LatestVerifiedGpsId",
        "LatestPingId",
        "LightIntensity",
        "Temperature",
        "IsMissing",
        "LocationCode",
        "Location",
        "SmartDeviceSerialNumber",
        //"SerialNumberPrefix",
        "LastPing",
        "LatestScanTime",
        "GatewayLastPing",
        "AssetType",
        "Street",
        "Street2",
        "Street3",
        "City",
        "State",
        "Country",
        "GatewaySerialNumber",
        "AssetCurrentStatus",
        "LatestLocationGeo",
        "Displacement",
        "IsPowerOn",
        "AssetManufacturerId",
        "AssetTypeFacings",
        "AverageCapacity",
        "AssetId",
        "IsFactoryAsset",
        "SmartDeviceManufacturerId",
        "OutletTypeId",
        "LocationTypeId",
        "ClassificationId",
        "SubTradeChannelTypeId",
        "IsKeyLocation",
        "CountryId",
        "City",
        "SalesHierarchyId",
        "SmartDeviceTypeId",
        "AssetTypeCapacityId",
        "IsOpenFront",
        "BatteryLevel"
    ]),
    sort: [{
        field: 'SerialNumber',
        dir: 'asc'
    }]
});

module.exports = BatteryReport;