"use strict";

var ElasticListBase = require('./elasticListBase'),
    util = require('../util');

class fallenMagnet extends ElasticListBase {
    customizeQuery(body, params) {
        var bool = body.query.bool;
        var must = bool.must || [];
        var must_not = bool.must_not || [];
        must.push({
            "term": {
                "IsFromHealth": true
            }
        });
        must.push({
            "range": {
                "EventDate": {
                    "lte": new Date()
                }
            }
        });
        bool.must = must;
        must_not.push({
            "term": {
                "FallenMaganet": 32765
            }
        });
        bool.must_not = must_not;
        if (params.MagnetFallenChartCTF) {
            if (body.aggs) {
                body.aggs["FallenMagnet"] = {
                    "filter": {
                        "bool": {
                            "must": []
                        }
                    },
                    "aggs": {
                        "top_tags": {
                            "terms": {
                                "field": "AssetId",
                                "size": 100000
                            },
                            "aggs": {
                                "top_hit": {
                                    "top_hits": {
                                        "sort": [{
                                            "EventDate": {
                                                "order": "desc"
                                            }
                                        }],
                                        "_source": {
                                            "includes": [
                                                "AssetId",
                                                "FallenMaganet"
                                            ]
                                        },
                                        "size": 1
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                body.aggs = {
                    "FallenMagnet": {
                        "filter": {
                            "bool": {
                                "must": []
                            }
                        },
                        "aggs": {
                            "top_tags": {
                                "terms": {
                                    "field": "AssetId",
                                    "size": 100000
                                },
                                "aggs": {
                                    "top_hit": {
                                        "top_hits": {
                                            "sort": [{
                                                "EventDate": {
                                                    "order": "desc"
                                                }
                                            }],
                                            "_source": {
                                                "includes": [
                                                    "AssetId",
                                                    "FallenMaganet"
                                                ]
                                            },
                                            "size": 1
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            }

        }

        if (params.MagnetFallenSpreadCTF) {
            if (body.aggs) {
                body.aggs["FallenMagnetSpread"] = {
                    "filter": {
                        "bool": {
                            "must": []
                        }
                    },
                    "aggs": {
                        "top_tags": {
                            "terms": {
                                "field": "AssetId",
                                "size": 100000
                            },
                            "aggs": {
                                "top_hit": {
                                    "top_hits": {
                                        "sort": [{
                                            "EventDate": {
                                                "order": "desc"
                                            }
                                        }],
                                        "_source": {
                                            "includes": [
                                                "AssetId",
                                                "FallenMaganet"
                                            ]
                                        },
                                        "size": 1
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                body.aggs = {
                    "FallenMagnetSpread": {
                        "filter": {
                            "bool": {
                                "must": []
                            }
                        },
                        "aggs": {
                            "top_tags": {
                                "terms": {
                                    "field": "AssetId",
                                    "size": 100000
                                },
                                "aggs": {
                                    "top_hit": {
                                        "top_hits": {
                                            "sort": [{
                                                "EventDate": {
                                                    "order": "desc"
                                                }
                                            }],
                                            "_source": {
                                                "includes": [
                                                    "AssetId",
                                                    "FallenMaganet"
                                                ]
                                            },
                                            "size": 1
                                        }
                                    }
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
        console.log("FallenFallen");
        //console.log(JSON.stringify(body));
    }
};

Object.assign(fallenMagnet.prototype, {
    index: 'cooler-iot-asseteventdatasummary',
    type: 'AssetEventDataSummary',
    propertyDefs: ElasticListBase.assignPropertyDefs([
        "SmartDeviceId",
        "GatewayId",
        "DeviceSerial",
        "GatewayMac",
        "GatewaySerialNumber",
        "EventId",
        "CreatedOn",
        "AssetId",
        "ClientId",
        "CountryId",
        "StateId",
        "LocationId",
        "City",
        "TimeZoneId",
        "AssetSerialNumber",
        "FallenMaganet"
    ])
});

module.exports = fallenMagnet;