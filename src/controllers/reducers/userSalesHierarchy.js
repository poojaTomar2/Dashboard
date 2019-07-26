var Reducer = require('./reducer');

var userSalesHierarchyReducer = new Reducer({
  modelType: require('../../models').UserSalesHierarchy,
  filterProperties: [
    { propertyName: "UserId", paramName: "UserId" }
  ]
});

module.exports = userSalesHierarchyReducer.reduce.bind(userSalesHierarchyReducer);