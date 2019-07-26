var Reducer = require('./reducer');

var smartDeviceTechnicalDiagnosticsReducer = new Reducer({
  modelType: require('../../models').SmartDeviceTechnicalDiagnostics,
  filterProperties: [{
      propertyName: "CompressorBand",
      paramName: "CompressorBand"
    },
    {
      propertyName: "FanBand",
      paramName: "FanBand"
    },
     {
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
      propertyName: "customQuery",
      paramName: "customQueryTechnical"
    }, {
      propertyName: "AssetId",
      paramName: "AssetHealth"
    },
    "days", {
      paramName: "AssetId",
      propertyName: "AssetId",
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

module.exports = smartDeviceTechnicalDiagnosticsReducer.reduce.bind(smartDeviceTechnicalDiagnosticsReducer);