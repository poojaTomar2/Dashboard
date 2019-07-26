var Reducer = require('./reducer');

var smartDeviceAssetTypeCapacityThresholdReducer = new Reducer({
  modelType: require('../../models').SmartDeviceAssetTypeCapacityThreshold,
  filterProperties: [
    {
      propertyName: "customQuery",
      paramName: "DoorSwingsVsTargetAssetTypeCapacityThreshold"
    },
    {
      propertyName: "AssetTypeCapacityThresholdCountry",
      paramName: "AssetTypeCapacityThresholdCountry"
    }
  ]
});

module.exports = smartDeviceAssetTypeCapacityThresholdReducer.reduce.bind(smartDeviceAssetTypeCapacityThresholdReducer);