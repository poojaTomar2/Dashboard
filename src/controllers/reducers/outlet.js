var Reducer = require('./reducer');

var outletReducer = new Reducer({
  modelType: require('../../models').Outlet,
  filterProperties: [{
      propertyName: "_id",
      paramName: "LocationId"
    },
    "Market",
    "MarketId",
    "LocationType",
    "LocationTypeId",
    "Classification",
    "ClassificationId",
    "City",
    "Country",
    "CountryId",
    "LocationCode",
    "PrimarySalesRep",
    "PrimaryRepId",
    "SupervisorId",
    "SubTradeChannelTypeId",
    "IsKeyLocation",
    {
      propertyName: "match_Address",
      paramName: "Address"
    },
    "LocationCode_operator",
    "TerritoryId",
    "SalesGroupId",
    "SalesOfficeId",
    "SalesOrganizationId",
    "SalesHierarchyId",
    {
      propertyName: "OutletTypeId",
      paramName: "OutletTypeId[]",
      keepValue: true
    },
    {
      propertyName: "OutletTypeId",
      paramName: "OutletTypeId",
      keepValue: true
    }, {
      paramName: "LocationId[]",
      propertyName: "LocationId",
      optional: true
    },
    "TeleSellingTerritoryId"
  ]
});

module.exports = outletReducer.reduce.bind(outletReducer);