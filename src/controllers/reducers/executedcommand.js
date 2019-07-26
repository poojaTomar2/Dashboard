var Reducer = require('./reducer');

var executedcommandtReducer = new Reducer({
    modelType: require('../../models').Executedcommand,
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
            paramName: "ExcecuteCommandReport",
            propertyName: "ExcecuteCommandReport"
        },
        {
            paramName: "ExcecuteCommandSpread",
            propertyName: "ExcecuteCommandSpread"
        },
        {
            propertyName: "customQuery",
            paramName: "customExcecuteCommandReport"
        },
        {
            propertyName: "customQuery",
            paramName: "customExcecuteCommandSpread"
        },
        {
            propertyName: "AssetId",
            paramName: "AssetHealth"
        },
        {
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

module.exports = executedcommandtReducer.reduce.bind(executedcommandtReducer);