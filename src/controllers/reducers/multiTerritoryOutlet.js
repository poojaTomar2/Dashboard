var Reducer = require('./reducer');

var multiTerritoryOutletReducer = new Reducer({
  modelType: require('../../models').MultiTerritoryOutlet,
  filterProperties: [
    {
      propertyName: "TeleSellingTerritoryId",
      paramName: "TeleSellingTerritoryId[]",
      keepValue: true
    },
    {
      propertyName: "TeleSellingTerritoryId",
      paramName: "TeleSellingTerritoryId",
      keepValue: true
    }
  ]
});

module.exports = multiTerritoryOutletReducer.reduce.bind(multiTerritoryOutletReducer);