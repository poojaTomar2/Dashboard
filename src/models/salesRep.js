"use strict";

var ElasticListBase = require('./elasticListBase');

class SalesRep extends ElasticListBase {
};

Object.assign(SalesRep.prototype, {
  index: 'cooler-iot-locationrep',
  type: 'LocationRep',
  propertyDefs: ElasticListBase.assignPropertyDefs([
    "LocationRepId",
    "LocationId",
    "RepId",
    "RoleId"
  ]),
  softDelete: null,
  isClientBased: false
});

module.exports = SalesRep;
