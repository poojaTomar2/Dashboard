var Reducer = require('./reducer');

var smartDeviceLastDataReducer = new Reducer({
  modelType: require('../../models').SmartDeviceLastData,
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
      paramName: "dateFilter",
      propertyName: "dateFilter",
      optional: true,
      keepValue: true
    },
    {
      propertyName: "customQuery",
      paramName: "customQueryLastDownloaded"
    },
    {
      propertyName: "customQuery",
      paramName: "customQueryLastDataDownloaded"
    },
    {
      propertyName: "DataDownloaded",
      paramName: "DataDownloaded",
      optional: true,
      keepValue: true
    },
    {
      propertyName: "LastDataDownloaded",
      paramName: "LastDataDownloaded",
      optional: true,
      keepValue: true
    },
    {
      propertyName: "CoolerPerformanceIndex",
      paramName: "CoolerPerformanceIndex",
      optional: true,
      keepValue: true
    },
    "lastDataReceived", {
      propertyName: "AssetId",
      paramName: "AssetId",
      optional: true
    },
    {
      propertyName: "LocationId",
      paramName: "LocationId",
      optional: true
    },
    {
      propertyName: "NoDataAssetIds",
      paramName: "NoDataAssetIds",
      optional: true,
      keepValue: true
    },
    {
      propertyName: "NewAssetId",
      paramName: "NewAssetId",
      optional: true,
      keepValue: true
    },
    {
      propertyName: "SmartDeviceManufactureId",
      paramName: "smartdevicemanufactureidDownload"
    },
    {
      propertyName: "OutletTypeId",
      paramName: "OutletTypeIdDownload"
    }
  ]
});

module.exports = smartDeviceLastDataReducer.reduce.bind(smartDeviceLastDataReducer);