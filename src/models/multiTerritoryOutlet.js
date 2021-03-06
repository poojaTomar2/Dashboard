"use strict";

var ElasticListBase = require('./elasticListBase');

class MultiTerritoryOutlet extends ElasticListBase {
  customizeQuery(body, params) {
    console.log("MultiTerritoryOutlet");
    // console.log(JSON.stringify(body));
  }
};

Object.assign(MultiTerritoryOutlet.prototype, {
  index: 'cooler-iot-location',
  type: 'Location',
  keyField: 'LocationId',
  propertyDefs: ElasticListBase.assignPropertyDefs([
    'CustomerId',
    'AreaId',
    'LocationTypeId',
    'Name',
    'CountryId',
    'StateId',
    'City',
    'Street',
    'Street2',
    'Street3',
    'PostalCode',
    'IsKeyLocation',
    'ClassificationId',
    'DirectionNotes',
    'ClientId',
    'IsDeleted',
    'CreatedByUserId',
    "CreatedOn",
    "ModifiedByUserId",
    "ModifiedOn",
    "LocationCode",
    "PrimaryContactId",
    "Identity1",
    "Identity2",
    "TimeZoneId",
    "LocationText",
    "OrderStatus",
    "MarketId",
    "PrimaryRepId",
    "PrimaryPhone",
    "PriceTypeId",
    "PriceForTwo",
    "OwnerId",
    "LocationSalesRep",
    "LocationGeo",
    "IsSmart",
    "PrimarySalesRep",
    "State",
    "Country",
    "MarketName",
    "LocationType",
    "IsSurveyed",
    "Classification",
    "Address",
    "SubTradeChannelTypeId",
    "TerritoryId",
    "SalesGroupId",
    "SalesOfficeId",
    "SalesOrganizationId",
    "SalesHierarchyId",
    "OutletTypeId",
    "TeleSellingTerritoryId",
    "LocationId"
  ]),
  searchDefs: {
    "Location": function (value) {
      return { match: { "Name": value } };
    }
  },
  sort: [
    { field: 'Name', dir: 'asc' }
  ]
});

module.exports = MultiTerritoryOutlet;
