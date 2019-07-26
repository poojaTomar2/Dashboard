var Reducer = require('./reducer');

var smartDeviceReducer = new Reducer({
  modelType: require('../../models').SmartDevice,
  filterProperties: [{
      propertyName: "SmartDeviceManufacturerId",
      paramName: "manufacturerSmartDevice"
    },
    {
      propertyName: "Reference",
      paramName: "Reference"
    },
    {
      propertyName: "SmartDeviceId",
      paramName: "SmartDeviceId"
    },
    "GatewayId",
    "SmartDeviceTypeId",
    "withoutfilter",
    "LinkedAssetId", {
      paramName: "AssetId",
      propertyName: "LinkedAssetId",
      optional: true
    },
    "SmartDeviceManufacturerId",
    {
      propertyName: "SmartDeviceTypeId",
      paramName: "SmartDeviceTypeId[]"
    },
    {
      propertyName: "SmartDeviceManufacturerId",
      paramName: "SmartDeviceManufacturerId[]"
    }
  ]
});

module.exports = smartDeviceReducer.reduce.bind(smartDeviceReducer);