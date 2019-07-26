var Reducer = require('./reducer');

var smartDeviceTelemetryMissingDataReducer = new Reducer({
  modelType: require('../../models').AssetVisitHistory,
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
      propertyName: "CoolerHealthMissing",
      paramName: "CoolerHealthMissing",
      keepValue: true
    },
    {
      propertyName: "customQuery",
      paramName: "customQueryHealthMissing"
    },
    {
      propertyName: "AssetCount",
      paramName: "AssetCount"
    },
    "daysPower", {
      paramName: "AssetId",
      propertyName: "AssetId",
      optional: true
    },
    {
      paramName: "LocationId",
      propertyName: "LocationId",
      optional: true
    },
    {
      propertyName: "NoDataAssetIds",
      paramName: "NoDataAssetIds",
      optional: true,
      keepValue: true
    }
  ]
});

module.exports = smartDeviceTelemetryMissingDataReducer.reduce.bind(smartDeviceTelemetryMissingDataReducer);