var Reducer = require('./reducer');

var smartDeviceLatestDataReducer = new Reducer({
  modelType: require('../../models').SmartDeviceLatestData,
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
    "lastDataReceived", {
      propertyName: "AssetId",
      paramName: "AssetId",
      optional: true
    }, {
      propertyName: "LocationId",
      paramName: "LocationId",
      optional: true
    }
  ]
});

module.exports = smartDeviceLatestDataReducer.reduce.bind(smartDeviceLatestDataReducer);