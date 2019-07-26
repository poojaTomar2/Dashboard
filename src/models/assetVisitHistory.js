"use strict";

var ElasticListBase = require('./elasticListBase'),
  util = require('../util');

class AssetVisitHistory extends ElasticListBase {
  customizeQuery(body, params) {
    var bool = body.query.bool;
    var mustNot = bool.must_not || [];
    mustNot.push({
      "term": {
        "AssetId": 0
      }
    });

    if (params.CoolerHealthMissing && params.CoolerHealthMissing.indexOf("4") != -1) {
      if (body.aggs) {
        body.aggs["AssetCount"] = {
          "filter": {
            "bool": {
              "must": [{
                "term": {
                  "IsMissing": "true"
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
            }
          }
        }
      } else {
        body.aggs = {
          "AssetCount": {
            "filter": {
              "bool": {
                "must": [{
                  "term": {
                    "IsMissing": "true"
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
              }
            }
          }
        }
      }
      util.applyDateFilter(params, bool, this.dateFilter);
    }
    if (params.fromOutletScreenDateFilter) {
      util.applyDateFilter(params, bool, this.dateFilter);
    }
    //console.log(JSON.stringify(body));
  }
};


//Cooler Telemetry Missing/No Data
Object.assign(AssetVisitHistory.prototype, {
  index: 'cooler-iot-assetvisithistory',
  type: 'AssetVisitHistory',
  propertyDefs: ElasticListBase.assignPropertyDefs([
    "AssetId",
    "VisitDateTime",
    "Notes",
    "Latitude",
    "Longitude",
    "CreatedByUserId",
    "CreatedOn",
    "ModifiedByUserId",
    "ModifiedOn",
    "IsDeleted",
    "VisitId",
    "VisitByUserId",
    "StatusId",
    "IsMissing",
    "VisitBy",
    "Status",
    "LocationId"
  ]),
  // sort: [{
  //   field: 'Id',
  //   dir: 'desc'
  // }],
  dateFilter: 'VisitDateTime'
});

module.exports = AssetVisitHistory;