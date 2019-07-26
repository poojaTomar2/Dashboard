"use strict";

var ElasticListBase = require('./elasticListBase'),
  util = require('../util');

class SmartDeviceMovement extends ElasticListBase {
  customizeQuery(body, params) {
    var bool = body.query.bool;

    var must = bool.must || [];
    var must_not = bool.must_not || [];


    // if (params.fromMovementScreen) {
    //   must_not.push({
    //     "term": {
    //       "Latitude": 0
    //     }
    //   }, {
    //     "term": {
    //       "Longitude": 0
    //     }
    //   });

    //   must.push({
    //     "term": {
    //       "MovementTypeId": 78
    //     }
    //   }, {
    //     "term": {
    //       "IsDeleted": false
    //     }
    //   });
    //   // bool.must = must;
    //   // bool.must_not = must_not;
    // }


    if (params.DisplacementHistoric) {
      must.push({
        "term": {
          "IsFromMovement": true
        }
      });

      if (params.DisplacementHistoric.indexOf("0") != -1) {
        must.push({
          "term": {
            "DisplacementInKmLT0P5": true
          }
        });
      }
      if (params.DisplacementHistoric.indexOf("1") != -1) {
        must.push({
          "term": {
            "DisplacementInKmGTIsEqToP5AndLTIsEqTo1": true
          }
        });
      }
      if (params.DisplacementHistoric.indexOf("2") != -1) {
        must.push({
          "term": {
            "DisplacementInKmGTIsEqTo1": true
          }
        });
      }
    }

    bool.must = must;
    bool.must_not = must_not;

    if (params.fromMovementScreen) {
      if (body.aggs) {
        body.aggs["AssetIds"] = {
            "terms": {
              "field": "AssetId",
              "size": 100000
            },
            "aggs": {
              "MovementDuration": {
                "sum": {
                  "field": "SumOfMovementDuration"
                }
              }
            }
          },
          body.aggs["DisplacementInKmLT0P5"] = {
            "filter": {
              "bool": {
                "must": [{
                  "term": {
                    "DisplacementInKmLT0P5": true
                  }
                }]
              }
            },
            "aggs": {
              "DisplacementInKmLT0P5": {
                "terms": {
                  "field": "AssetId",
                  "size": 200000
                }
              }
            }
          },
          body.aggs["DisplacementInKmGTIsEqToP5AndLTIsEqTo1"] = {
            "filter": {
              "bool": {
                "must": [{
                  "term": {
                    "DisplacementInKmGTIsEqToP5AndLTIsEqTo1": true
                  }
                }]
              }
            },
            "aggs": {
              "DisplacementInKmGTIsEqToP5AndLTIsEqTo1": {
                "terms": {
                  "field": "AssetId",
                  "size": 200000
                }
              }
            }
          },
          body.aggs["DisplacementInKmGTIsEqTo1"] = {
            "filter": {
              "bool": {
                "must": [{
                  "term": {
                    "DisplacementInKmGTIsEqTo1": true
                  }
                }]
              }
            },
            "aggs": {
              "DisplacementInKmGTIsEqTo1": {
                "terms": {
                  "field": "AssetId",
                  "size": 200000
                }
              }
            }
          }
      } else {
        body.aggs = {
          "AssetIds": {
            "terms": {
              "field": "AssetId",
              "size": 100000
            },
            "aggs": {
              "MovementDuration": {
                "sum": {
                  "field": "MovementDuration"
                }
              }
            }
          },
          "DisplacementInKmLT0P5" :{
            "filter": {
              "bool": {
                "must": [{
                  "term": {
                    "DisplacementInKmLT0P5": true
                  }
                }]
              }
            },
            "aggs": {
              "DisplacementInKmLT0P5": {
                "terms": {
                  "field": "AssetId",
                  "size": 200000
                }
              }
            }
          },
          "DisplacementInKmGTIsEqToP5AndLTIsEqTo1":{
            "filter": {
              "bool": {
                "must": [{
                  "term": {
                    "DisplacementInKmGTIsEqToP5AndLTIsEqTo1": true
                  }
                }]
              }
            },
            "aggs": {
              "DisplacementInKmGTIsEqToP5AndLTIsEqTo1": {
                "terms": {
                  "field": "AssetId",
                  "size": 200000
                }
              }
            }
          },
          "DisplacementInKmGTIsEqTo1": {
            "filter": {
              "bool": {
                "must": [{
                  "term": {
                    "DisplacementInKmGTIsEqTo1": true
                  }
                }]
              }
            },
            "aggs": {
              "DisplacementInKmGTIsEqTo1": {
                "terms": {
                  "field": "AssetId",
                  "size": 200000
                }
              }
            }
          }
        };
      }
      if (!params.daysMovement) {
        params.daysMovement = params.totalDays
      }
    }

    if (params.fromMovementScreen) {
      util.applyDateFilter(params, bool, this.dateFilter, true, false, false);
    } else if (params.DisplacementHistoric) {
      util.applyDateFilter(params, bool, this.dateFilter);
    }
    if (params.fromOutletScreenDateFilter) {
      util.applyDateFilter(params, bool, this.dateFilter);
    }
    //console.log(JSON.stringify(body));
  }
};

Object.assign(SmartDeviceMovement.prototype, {
  index: 'cooler-iot-asseteventdatasummary',
  type: 'AssetEventDataSummary',
  propertyDefs: ElasticListBase.assignPropertyDefs([
    "Movement",
    "Latitude",
    "Longitude",
    "StartTime",
    "IsDoorOpen",
    "MovementTypeId",
    "MovementDuration",
    "SumOfMovementDuration",
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
    'AssetSerialNumber'
    //"DisplacementInKm"
  ]),
  sort: [{
    field: 'EventDate',
    dir: 'desc'
  }],
  softDelete: null,
  dateFilter: 'EventDate'
});

module.exports = SmartDeviceMovement;