var Reducer = require('./reducer');

var assetEventDataReducer = new Reducer({
    modelType: require('../../models').AssetEventData,
    filterProperties: [{
            propertyName: "AssetId",
            paramName: "AssetId",
            keepValue: true
        },
        {
            propertyName: "AssetId",
            paramName: "AssetId[]",
            keepValue: true
        },
        {
            propertyName: "_id",
            paramName: "LinkedAssetId"
        },
        {
            paramName: "LocationId",
            propertyName: "LocationId",
            keepValue: true
        },
        {
            paramName: "LocationId",
            propertyName: "LocationId[]",
            keepValue: true
        },
        {
            paramName: "AssetTypeCapacityId",
            propertyName: "AssetTypeCapacityId",
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
        {
            propertyName: "SalesHierarchyId",
            paramName: "SalesHierarchyId[]",
            keepValue: true
        },
        {
            propertyName: "SalesHierarchyId",
            paramName: "SalesHierarchyId",
            keepValue: true
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
            propertyName: "SmartDeviceTypeId",
            paramName: "SmartDeviceTypeId",
            keepValue: true
        },
        {
            propertyName: "SmartDeviceTypeId",
            paramName: "SmartDeviceTypeId[]",
            keepValue: true
        },
        {
            propertyName: "LocationCode",
            paramName: "LocationCode",
            keepValue: true
        }
    ]
});

module.exports = assetEventDataReducer.reduce.bind(assetEventDataReducer);