var Reducer = require('./reducer');

var dataDownloadLOutletReducer = new Reducer({
    modelType: require('../../models').DataDownloadLOutlet,
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
        {
            paramName: "DataDownloadOutlet",
            propertyName: "DataDownloadOutlet"
        },
        {
            propertyName: "customQuery",
            paramName: "customDataDownloadOutlet"
        },
        {
            propertyName: "AssetId",
            paramName: "AssetHealth"
        },
        "daysPower", {
            paramName: "LocationId",
            propertyName: "LocationId",
            optional: true
        },
        {
            propertyName: "CTFLocationId",
            paramName: "CTFLocationId",
            optional: true,
            keepValue: true
        },
        {
            propertyName: "SmartDeviceManufactureId",
            paramName: "smartdevicemanufacture",
            keepValue: true
        },
        {
            propertyName: "OutletTypeId",
            paramName: "smartdeviceoutlet"
        }
    ]
});

module.exports = dataDownloadLOutletReducer.reduce.bind(dataDownloadLOutletReducer);