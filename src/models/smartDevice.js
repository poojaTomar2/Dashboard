"use strict";

var ElasticListBase = require('./elasticListBase');

class SmartDevice extends ElasticListBase {
};

Object.assign(SmartDevice.prototype, {
  index: 'cooler-iot-smartdevice',
  type: 'SmartDevice',
  propertyDefs: ElasticListBase.assignPropertyDefs([
    "SmartDeviceManufacturerId",
    "Reference",
    "SmartDeviceId",
    "GatewayId",
    "SmartDeviceTypeId",
    "LocationId",
    "LinkedAssetId"
  ]),
  softDelete: null
});

module.exports = SmartDevice;
