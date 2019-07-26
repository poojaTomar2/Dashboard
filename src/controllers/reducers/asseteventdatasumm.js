var Reducer = require('./reducer');

var assetReducer = new Reducer({
  modelType: require('../../models').Asseteventdatasumm,
  filterProperties: [{
      propertyName: "AssetId",
      paramName: "AssetId"
    }, {
      propertyName: "_id",
      paramName: "LinkedAssetId"
    },
    {
      paramName: "LocationId",
      propertyName: "LocationId"
    },
    {
      paramName: "AssetTypeCapacityId",
      propertyName: "AssetTypeCapacityId",
      keepValue: true
    },
    {
      propertyName: "DoorSwingsVsTarget",
      paramName: "DoorSwingsVsTarget",
      optional: true,
      keepValue: true
    },
    {
      propertyName: "batteryReprtData",
      paramName: "batteryReprtData",
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
      propertyName: "customQuery",
      paramName: "customQuerybattery"
    },
    {
      propertyName: "AssetTypeCapacityData",
      paramName: "AssetTypeCapacityData"
    },
    {
      propertyName: "AssetTypeCapacityDataThreshold",
      paramName: "AssetTypeCapacityDataThreshold"
    },
    {
      propertyName: "smartdevicemanufactureidcheck",
      paramName: "smartdevicemanufactureidcheck"
    },
    {
      propertyName: "SmartDeviceManufactureId",
      paramName: "SmartDeviceManufacturerId[]",
      keepValue: true
    },
    {
      propertyName: "SmartDeviceManufactureId",
      paramName: "SmartDeviceManufacturerId",
      keepValue: true
    },
    {
      propertyName: "OutletTypeId",
      paramName: "OutletTypeId[]",
      keepValue: true
    },
    {
      propertyName: "OutletTypeId",
      paramName: "OutletTypeId",
      keepValue: true
    },
    "LocationTypeId",
    {
      propertyName: "LocationTypeId",
      paramName: "LocationTypeId[]"
    },
    "ClassificationId",
    {
      propertyName: "ClassificationId",
      paramName: "ClassificationId[]"
    },
    "SubTradeChannelTypeId",
    {
      propertyName: "SubTradeChannelTypeId",
      paramName: "SubTradeChannelTypeId[]"
    },
    {
      propertyName: "IsKeyLocation",
      paramName: "IsKeyLocation"
    },
    {
      propertyName: "IsOpenFront",
      paramName: "IsOpenFront",
      keepValue: true
    },
    "CountryId",
    {
      propertyName: "CountryId",
      paramName: "CountryId[]"
    },
    "City",
    {
      propertyName: "City",
      paramName: "City[]"
    },
    "SalesHierarchyId",
    {
      propertyName: "SalesHierarchyId",
      paramName: "SalesHierarchyId[]"
    },
    "AssetTypeId",
    {
      propertyName: "AssetTypeId",
      paramName: "AssetTypeId[]"
    },
    "AssetManufacturerId",
    {
      propertyName: "AssetManufacturerId",
      paramName: "AssetManufacturerId[]"
    },
    {
      propertyName: "LocationCode",
      paramName: "LocationCode",
      keepValue: true
    }
  ]
});

module.exports = assetReducer.reduce.bind(assetReducer);