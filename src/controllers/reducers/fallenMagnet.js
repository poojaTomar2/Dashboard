var Reducer = require('./reducer');

var fallenMagnetReducer = new Reducer({
    modelType: require('../../models').FallenMagnet,
    filterProperties: [{
            paramName: "startDate",
            propertyName: "startDate",
            optional: true,
            keepValue: true
        }, {
            paramName: "AssetId",
            propertyName: "AssetId",
            optional: true
        },
        {
            paramName: "MagnetFallenChartCTF",
            propertyName: "MagnetFallenChartCTF"
        },
        {
            paramName: "MagnetFallenSpreadCTF",
            propertyName: "MagnetFallenSpreadCTF"
        },
        {
            propertyName: "customQuery",
            paramName: "customMagnetFallenChartCTF"
        }
    ]
});

module.exports = fallenMagnetReducer.reduce.bind(fallenMagnetReducer);