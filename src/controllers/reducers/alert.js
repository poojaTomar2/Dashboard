var Reducer = require('./reducer');

var alertReducer = new Reducer({
  modelType: require('../../models').Alert,
  filterProperties: [{
      paramName: "LocationId",
      propertyName: "LocationId",
      optional: true
    },
    "PriorityId",
    "StatusId", , {
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
    }, {
      paramName: "LocationIds[]",
      propertyName: "LocationId",
      optional: true
    }, {
      paramName: "fromOutletScreenAlert",
      propertyName: "fromOutletScreen"
    }, {
      paramName: "PriorityId",
      propertyName: "PriorityId[]"
    }, {
      paramName: "AlertTypeId",
      propertyName: "AlertTypeId[]",
      keepValue: true
    }, {
      paramName: "AlertTypeId",
      propertyName: "AlertTypeId",
      keepValue: true
    }, {
      paramName: "StatusId",
      propertyName: "StatusId[]"
    }, {
      paramName: "AssetId",
      propertyName: "AssetId",
      optional: true
    }, {
      paramName: "AssetId[]",
      propertyName: "AssetId",
      optional: true
    }
  ],
  field: "AssetId"
});

module.exports = alertReducer.reduce.bind(alertReducer);