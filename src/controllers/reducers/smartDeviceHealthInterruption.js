var Reducer = require('./reducer');

var smartDeviceHealthRecordInterruptionReducer = new Reducer({
  modelType: require('../../models').SmartDeviceHealthInterruption,
  filterProperties: [{
      propertyName: "customQuery",
      paramName: "customQueryHealthInteruption"
    }, {
      propertyName: "AssetInterruption",
      paramName: "AssetInterruption"
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
      paramName: "AssetId",
      propertyName: "AssetId",
      optional: true
    },
    {
      paramName: "CTFLocationId",
      propertyName: "CTFLocationId",
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

module.exports = smartDeviceHealthRecordInterruptionReducer.reduce.bind(smartDeviceHealthRecordInterruptionReducer);