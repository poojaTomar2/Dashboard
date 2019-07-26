var Reducer = require('./reducer');

var smartDevicDoorStatusReducer = new Reducer({
  modelType: require('../../models').SmartDeviceDoorStatus,
  filterProperties: [{
      propertyName: "DoorCount",
      paramName: "DoorCount"
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
    "fromDoorScreen",
    "doorDataSelected", {
      propertyName: "customQuery",
      paramName: "customQueryDoor"
    },
    "daysDoor", {
      paramName: "AssetId",
      propertyName: "AssetId",
      optional: true
    },
    {
      paramName: "LocationId",
      propertyName: "LocationId",
      optional: true
    }
  ]
});

module.exports = smartDevicDoorStatusReducer.reduce.bind(smartDevicDoorStatusReducer);