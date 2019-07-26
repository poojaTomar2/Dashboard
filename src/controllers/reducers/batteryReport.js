var Reducer = require('./reducer');

var batteryReportDataReducer = new Reducer({
    modelType: require('../../models').BatteryReport,
    filterProperties: [{
            propertyName: "batteryReprtData",
            paramName: "batteryReprtData",
            keepValue: true
        },
        {
            propertyName: "customQuery",
            paramName: "customQuerybattery"
        },
        {
            propertyName: "SmartDeviceManufactureId",
            paramName: "smartdevicemanufactureidbatterylevel"
        },
        {
            propertyName: "OutletTypeId",
            paramName: "OutletTypeIdbatterylevel"
        }
    ]
});

module.exports = batteryReportDataReducer.reduce.bind(batteryReportDataReducer);