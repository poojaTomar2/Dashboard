"use strict";

var ElasticListBase = require('./elasticListBase'),
  util = require('../util');

class Visit extends ElasticListBase {
  customizeQuery(body, params) {
    var bool = body.query.bool;
    bool.filter.push({
      "term": {
        "IsDeleted": false
      }
    });
    if (params.fromOutletScreen || params.hasOwnProperty('fromOutletScreen')) {
      util.applyDateFilter(params, bool, this.dateFilter);
    }
    console.log("visitvisit");
    //console.log(JSON.stringify(body));
  }
};

Object.assign(Visit.prototype, {
  index: 'cooler-iot-visit',
  type: 'Visit',
  propertyDefs: ElasticListBase.assignPropertyDefs([
    "Date",
    "UserId",
    "LocationId",
    "WasOffRoute",
    "PlannedSequenceInRoute",
    "ActualSequenceInRoute",
    "StartTime",
    "StopTime",
    "VisitTypeId",
    "StartLatitude",
    "StartLongitude",
    "EndLatitude",
    "EndLongitude",
    "DeviceId",
    "Notes",
    "IsDeleted",
    "FirstName",
    "LastName",
    "VisitBy",
    "LocationName",
    "LocationCode",
    "Found",
    "Missing",
    "WrongLocation"
  ]),
  sort: [{
    field: 'StartTime',
    dir: 'desc'
  }],
  dateFilter: 'StartTime'
});

module.exports = Visit;