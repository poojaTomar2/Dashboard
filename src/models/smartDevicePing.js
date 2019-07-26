"use strict";

var ElasticListBase = require('./elasticListBase');

class SmartDevicePing extends ElasticListBase {
};

Object.assign(SmartDevicePing.prototype, {
  index: 'cooler-iot-event',
  type: 'SmartDevicePing',
  propertyDefs: ElasticListBase.assignPropertyDefs([
    "Rssi",
    "Latitude",
    "Longitude",
    "AdvertisementInfo",
    "FirstSeen",
    "SmartDeviceId",
    "GatewayId",
    "DeviceSerial",
    "GatewayMac",
    "GatewaySerialNumber",
    "EventId",
    "EventTime",
    "CreatedOn",
    "AssetId",
    "ClientId",
    "CountryId",
    "StateId",
    "LocationId",
    "City",
    "TimeZoneId",
    "AssetTypeId"
  ]),
  sort: [
    { field: 'EventTime', dir: 'desc' }
  ],
  softDelete: null
});

module.exports = SmartDevicePing;
