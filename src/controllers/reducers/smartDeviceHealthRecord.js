var Reducer = require('./reducer');

var smartDeviceHealthRecordReducer = new Reducer({
  modelType: require('../../models').SmartDeviceHealthRecord,
  filterProperties: [{
      propertyName: "TempBand",
      paramName: "TempBand"
    }, {
      propertyName: "LightStatus",
      paramName: "LightStatus"
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
    "fromHealthScreen",
    "fromLightScreen",
    {
      propertyName: "customQuery",
      paramName: "customQueryHealth"
    }, {
      propertyName: "customQuery",
      paramName: "customQueryLight"
    },
    "days", {
      propertyName: "AssetId",
      paramName: "AssetDoor"
    },
    "daysLight", {
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

module.exports = smartDeviceHealthRecordReducer.reduce.bind(smartDeviceHealthRecordReducer);