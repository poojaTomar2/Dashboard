var Reducer = require('./reducer');

var smartDeviceTelemetryDoorReducer = new Reducer({
  modelType: require('../../models').SmartDeviceTelemetryDoor,
  filterProperties: [{
      paramName: "startDate",
      propertyName: "startDate",
      optional: true,
      keepValue: true
    }, {
      paramName: "endDate",
      propertyName: "endDate",
      optional: true,
      keepValue: true
    }, {
      paramName: "quarter",
      propertyName: "quarter",
      optional: true,
      keepValue: true
    }, {
      paramName: "dayOfWeek",
      propertyName: "dayOfWeek",
      optional: true,
      keepValue: true
    }, {
      paramName: "yearWeek",
      propertyName: "yearWeek",
      optional: true,
      keepValue: true
    }, {
      paramName: "month",
      propertyName: "month",
      optional: true,
      keepValue: true
    },
    {
      propertyName: "DeviceDoorStatus",
      paramName: "telemetryDoorCount",
      keepValue: true
    },
    {
      propertyName: "CoolerPerformanceIndex",
      paramName: "CoolerPerformanceIndex",
      keepValue: true
    },
    {
      propertyName: "CoolerHealthLowUti",
      paramName: "CoolerHealthLowUti",
      keepValue: true
    },
    {
      propertyName: "customQuery",
      paramName: "customQueryDoorTele"
    },
    // "fromPowerScreen", {
    //   propertyName: "customQuery",
    //   paramName: "customQueryPower"
    // }, 
    {
      propertyName: "AssetId",
      paramName: "AssetHealth"
    },
    "daysPower", {
      paramName: "AssetId",
      propertyName: "AssetId",
      optional: true
    },
    // {
    //   paramName: "LocationId",
    //   propertyName: "LocationId",
    //   optional: true
    // },
    {
      propertyName: "NoDataAssetIds",
      paramName: "NoDataAssetIds",
      optional: true,
      keepValue: true
    },
    {
      propertyName: "SmartDeviceManufactureId",
      paramName: "smartdevicemanufactureidDoorOpens"
    },
    {
      propertyName: "OutletTypeId",
      paramName: "OutletTypeIdDoorOpens"
    }
  ]
});

module.exports = smartDeviceTelemetryDoorReducer.reduce.bind(smartDeviceTelemetryDoorReducer);