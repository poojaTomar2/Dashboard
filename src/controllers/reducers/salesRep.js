var Reducer = require('./reducer');

var salesRepReducer = new Reducer({
  modelType: require('../../models').SalesRep,
  filterProperties: [
    { propertyName: "RepId", paramName: "RepId" }
  ]
});

module.exports = salesRepReducer.reduce.bind(salesRepReducer);