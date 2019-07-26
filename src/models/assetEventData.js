"use strict";

var ElasticListBase = require('./elasticListBase');

class AssetEventData extends ElasticListBase {
  customizeQuery(body, params) {
    console.log("event");
    //console.log(JSON.stringify(body));
  }
};

Object.assign(AssetEventData.prototype, {
  index: 'cooler-iot-asseteventdatasummary',
  type: 'AssetEventDataSummary',
  propertyDefs: ElasticListBase.assignPropertyDefs([
    "TagNumber",
    {
      name: "SerialNumber",
      type: "string"
    },
    "LocationId",
    "AssetTypeId",
    "IsActive",
    "LocationGeo",
    "LatestStockId",
    "LatestPurityId",
    "LatestProcessedPurityId",
    "LatestDoorStatusId",
    "LatestHealthRecordId",
    "CreatedByUserId",
    "CreatedOn",
    "ModifiedByUserId",
    "ModifiedOn",
    "ParentAssetId",
    "Installation",
    "Expiry",
    "WarrantyExpiry",
    "LastTested",
    "ClientId",
    "SmartDeviceId",
    "LatestMovementId",
    "CustomSettings",
    "Usage",
    "LatestAssetVisitHistoryId",
    "PlanogramId",
    "Shelves",
    "LatestGpsId",
    "LatestCellId",
    "LatestVerifiedGpsId",
    "LatestPingId",
    "LightIntensity",
    "Temperature",
    "IsMissing",
    "LocationCode",
    "Location",
    "SmartDeviceSerialNumber",
    //"SerialNumberPrefix",
    "LastPing",
    "LatestScanTime",
    "GatewayLastPing",
    "AssetType",
    "Street",
    "Street2",
    "Street3",
    "City",
    "State",
    "Country",
    "GatewaySerialNumber",
    "AssetCurrentStatus",
    "LatestLocationGeo",
    "Displacement",
    "IsPowerOn",
    "AssetManufacturerId",
    "AssetTypeFacings",
    "AverageCapacity",
    "AssetId",
    "IsFactoryAsset",
    "SmartDeviceManufactureId",
    "OutletTypeId",
    "LocationTypeId",
    "ClassificationId",
    "SubTradeChannelTypeId",
    "IsKeyLocation",
    "CountryId",
    "City",
    "SalesHierarchyId",
    "SmartDeviceTypeId",
    "AssetTypeCapacityId",
    "IsOpenFront",
    "BatteryLevel"
  ])
});

module.exports = AssetEventData;