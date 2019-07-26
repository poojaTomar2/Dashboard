var Reducer = require('./reducer');

var smartDeviceCoolerTrackingReducer = new Reducer({
  modelType: require('../../models').SmartDeviceCoolerTrackingProximity,
  filterProperties: [{
      propertyName: "coolerTrackingProximity",
      paramName: "coolerTrackingProximity"
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
      propertyName: "customQuery",
      paramName: "customQueryCoolerTrackingProximity"
    },
   {
      paramName: "AssetId",
      propertyName: "AssetId",
      optional: true
    },
    {
       paramName: "CoolerTrackingThreshold",
       propertyName: "CoolerTrackingThreshold",
       optional: true
     }
  ]
});

module.exports = smartDeviceCoolerTrackingReducer.reduce.bind(smartDeviceCoolerTrackingReducer);