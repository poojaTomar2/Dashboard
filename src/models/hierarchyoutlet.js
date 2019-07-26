"use strict";

var ElasticListBase = require('./elasticListBase');

class Hierarchyoutlet extends ElasticListBase {
  customizeQuery(body, params) {
    if (params.DoorSwingsVsTarget) {
      if (body.aggs) {
        body.aggs["LocationDoorSwingsVsTarget"] = {
          "filter": {
            "bool": {
              "must_not": [{
                "term": {
                  "SmartDeviceTypeId": 17
                }
              }, {
                "term": {
                  "SmartDeviceTypeId": 22
                }
              }, {
                "term": {
                  "SmartDeviceTypeId": 23
                }
              }, {
                "term": {
                  "SmartDeviceTypeId": 25
                }
              }]
            }
          },
          "aggs": {
            "top_tags": {
              "terms": {
                "field": "LocationId",
                "size": 100000
              },
              "aggs": {
                "DoorOpenTarget": {
                  "filter": {
                    "bool": {
                      "must_not": [{
                        "term": {
                          "DoorOpenTarget": 0
                        }
                      }]
                    }
                  },
                  "aggs": {
                    "DoorOpenTarget": {
                      "terms": {
                        "field": "DoorOpenTarget"
                      }
                    }
                  }
                },
                "AssetTypeCapacity": {
                  "filter": {
                    "bool": {
                      "must_not": [{
                        "term": {
                          "AssetTypeCapacityId": 0
                        }
                      }]
                    }
                  },
                  "aggs": {
                    "AssetTypeCapacityId": {
                      "terms": {
                        "field": "AssetTypeCapacityId"
                      }
                    }
                  }
                },
                "SalesOrganization": {
                  "filter": {
                    "bool": {
                      "must_not": [{
                        "term": {
                          "SalesOrganizationId": 0
                        }
                      }]
                    }
                  },
                  "aggs": {
                    "SalesOrganization": {
                      "terms": {
                        "field": "SalesOrganizationId"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        body.aggs = {
          "LocationDoorSwingsVsTarget": {
            "terms": {
              "field": "LocationId",
              "size": 100000
            },
            "aggs": {
              "DoorOpenTarget": {
                "filter": {
                  "bool": {
                    "must_not": [{
                      "term": {
                        "DoorOpenTarget": 0
                      }
                    }]
                  }
                },
                "aggs": {
                  "DoorOpenTarget": {
                    "terms": {
                      "field": "DoorOpenTarget"
                    }
                  }
                }
              },
              "AssetTypeCapacity": {
                "filter": {
                  "bool": {
                    "must_not": [{
                      "term": {
                        "AssetTypeCapacityId": 0
                      }
                    }]
                  }
                },
                "aggs": {
                  "AssetTypeCapacityId": {
                    "terms": {
                      "field": "AssetTypeCapacityId"
                    }
                  }
                }
              },
              "SalesOrganization": {
                "filter": {
                  "bool": {
                    "must_not": [{
                      "term": {
                        "SalesOrganizationId": 0
                      }
                    }]
                  }
                },
                "aggs": {
                  "SalesOrganization": {
                    "terms": {
                      "field": "SalesOrganizationId"
                    }
                  }
                }
              }
            }
          }
        };
      }
    }

    console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    //console.log(JSON.stringify(body));
  }
};

Object.assign(Hierarchyoutlet.prototype, {
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

module.exports = Hierarchyoutlet;