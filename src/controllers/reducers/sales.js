var Reducer = require('./reducer');

var salesReducer = new Reducer({
  modelType: require('../../models').Sales,
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
    "fromSalesScreen",
    "salesDataSelected", {
      propertyName: "LocationId",
      paramName: "LocationId",
      optional: true
    },
    {
      propertyName: "doorTargetAssets",
      paramName: "doorTargetAssets",
      optional: true,
      keepValue: true
    },
    {
      propertyName: "customQuery",
      paramName: "customQuerySales"
    },
    {
      propertyName: "salesTarget",
      paramName: "salesTarget"
    }
  ]
});

module.exports = salesReducer.reduce.bind(salesReducer);