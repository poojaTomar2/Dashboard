var Reducer = require('./reducer');

var smartDeviceMovementReducer = new Reducer({
  modelType: require('../../models').SmartDeviceMovement,
  filterProperties: [{
      propertyName: "DisplacementInKm_From_operator",
      paramName: "Displacement_From_operator"
    }, {
      propertyName: "DisplacementInKm_To_operator",
      paramName: "Displacement_To_operator"
    }, {
      propertyName: "DisplacementInKm_From",
      paramName: "Displacement_From"
    }, {
      propertyName: "DisplacementInKm_To",
      paramName: "Displacement_To"
    },
    {
      propertyName: "DisplacementFilter",
      paramName: "DisplacementFilter",
    },
    {
      propertyName: "DisplacementHistoric",
      paramName: "DisplacementHistoric",
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
    }, {
      paramName: "fromMovementScreen",
      propertyName: "fromMovementScreen",
    },
    {
      paramName: "fromMovementScreenHistoric",
      propertyName: "fromMovementScreenHistoric",
    },
    {
      paramName: "daysMovement",
      propertyName: "daysMovement",
      optional: true
    }, {
      paramName: "AssetId",
      propertyName: "AssetId",
      optional: true
    }
  ]
});

module.exports = smartDeviceMovementReducer.reduce.bind(smartDeviceMovementReducer);