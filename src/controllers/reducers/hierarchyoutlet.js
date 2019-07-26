var Reducer = require('./reducer');

var assetReducer = new Reducer({
  modelType: require('../../models').Hierarchyoutlet,
  filterProperties: [
    "SalesHierarchyId",
    {
      propertyName: "SalesHierarchyId",
      paramName: "SalesHierarchyId[]",
      keepValue: true
    },
    // {
    //   propertyName: "SmartDeviceTypeId",
    //   paramName: "SmartDeviceTypeId[]",
    //   keepValue: true
    // },
    // {
    //   propertyName: "SmartDeviceTypeId",
    //   paramName: "SmartDeviceTypeId",
    //   keepValue: true
    // },
    {
      propertyName: "DoorSwingsVsTarget",
      paramName: "DoorSwingsVsTarget",
      optional: true,
      keepValue: true
    },
    {
      propertyName: "DoorOpenVsSales",
      paramName: "DoorOpenVsSales",
      optional: true,
      keepValue: true
    },
    {
      propertyName: "salesTargetAssets",
      paramName: "salesTargetAssets",
      optional: true,
      keepValue: true
    },
    {
      propertyName: "doorTargetAssets",
      paramName: "doorTargetAssets",
      optional: true,
      keepValue: true
    },
    {
      propertyName: "customQuery",
      paramName: "customQueryDoorSwing"
    },

    {
      propertyName: "AssetTypeCapacityData",
      paramName: "AssetTypeCapacityData"
    },
    {
      propertyName: "AssetTypeCapacityDataThreshold",
      paramName: "AssetTypeCapacityDataThreshold"
    }
  ]
});

module.exports = assetReducer.reduce.bind(assetReducer);