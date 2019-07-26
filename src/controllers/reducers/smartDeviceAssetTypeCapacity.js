var Reducer = require('./reducer');

var smartDeviceAssetTypeCapacityReducer = new Reducer({
  modelType: require('../../models').SmartDeviceAssetTypeCapacity,
  filterProperties: [
  {
    propertyName: "customQuery",
    paramName: "DoorSwingsVsTargetAssetTypeCapacity"
  },
  {
    propertyName: "AssetTypeCapacity",
    paramName: "AssetTypeCapacity"
  }]
});

module.exports = smartDeviceAssetTypeCapacityReducer.reduce.bind(smartDeviceAssetTypeCapacityReducer);