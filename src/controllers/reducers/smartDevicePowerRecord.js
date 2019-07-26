var Reducer = require('./reducer');

var smartDevicePowerRecordReducer = new Reducer({
  modelType: require('../../models').SmartDevicePowerRecord,
  filterProperties: [{
      propertyName: "PowerBand",
      paramName: "PowerBand"
    },
    {
      propertyName: "telemetryPowerStatus",
      paramName: "telemetryPowerStatus"
    },
    {
      propertyName: "AssetidInterruptions", //for No Interrruptions value
      paramName: "AssetidInterruptions",
      optional: true,
      keepValue: true
    },
    {
      paramName: "OperationalIssuesPower",
      propertyName: "OperationalIssuesPower",
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
    "fromPowerScreen", {
      propertyName: "customQuery",
      paramName: "customQueryPower"
    }, {
      propertyName: "AssetId",
      paramName: "AssetHealth"
    },
    "daysPower", {
      paramName: "AssetId",
      propertyName: "AssetId",
      optional: true
    },
    {
      propertyName: "NoDataAssetIds",
      paramName: "NoDataAssetIds",
      optional: true,
      keepValue: true
    },
    {
      paramName: "CTFLocationId",
      propertyName: "CTFLocationId",
      optional: true
    },
    {
      propertyName: "SmartDeviceManufactureId",
      paramName: "smartdevicemanufactureidPower"
    },
    {
      propertyName: "OutletTypeId",
      paramName: "OutletTypeIdPower"
    }
  ]
});

module.exports = smartDevicePowerRecordReducer.reduce.bind(smartDevicePowerRecordReducer);