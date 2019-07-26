var Reducer = require('./reducer');

var smartDeviceTelemetryHealthReducer = new Reducer({
  modelType: require('../../models').SmartDeviceTelemetryHealth,
  filterProperties: [{
      propertyName: "PowerBand",
      paramName: "PowerBand"
    }, {
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
      paramName: "TemperatureTele",
      propertyName: "TemperatureTele",
      optional: true,
      keepValue: true
    },
    {
      paramName: "EvaporatorTemperatureTele",
      propertyName: "EvaporatorTemperatureTele"
    },
    {
      paramName: "OperationalIssuesHealth",
      propertyName: "OperationalIssuesHealth",
    },
    {
      paramName: "TempLightIssue",
      propertyName: "TempLightIssue",
      optional: true,
      keepValue: true
    },
    {
      paramName: "CoolerHealthTele",
      propertyName: "CoolerHealthTele",
    },
    {
      propertyName: "DeviceLightStatus",
      paramName: "telemetryLightStatus",
      keepValue: true
    },
    {
      propertyName: "customQuery",
      paramName: "customQueryHealthTele"
    },
    "fromHealthScreen",
    //"fromPowerScreen", 
    // {
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

    {
      propertyName: "NoDataAssetIds",
      paramName: "NoDataAssetIds",
      optional: true,
      keepValue: true
    },
    {
      propertyName: "SmartDeviceManufactureId",
      paramName: "smartdevicemanufactureidTemperature"
    },
    {
      propertyName: "OutletTypeId",
      paramName: "OutletTypeIdTemperature"
    }
  ]
});

module.exports = smartDeviceTelemetryHealthReducer.reduce.bind(smartDeviceTelemetryHealthReducer);