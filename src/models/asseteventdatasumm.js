"use strict";

var ElasticListBase = require('./elasticListBase');
var limit;
var start;
class Asseteventdatasumm extends ElasticListBase {
	customizeQuery(body, params) {
		limit = params.limit + params.start;
		start = params.start;
		var bool = body.query.bool;
		if (params["SmartDeviceManufacturerId[]"]) {
			bool.filter.push({
				"terms": {
					SmartDeviceManufactureId: params["SmartDeviceManufacturerId[]"]
				}
			});
		}
		body.aggs = {
			"Info": {
				"terms": {
					"field": "AssetId",
					"size": 100000
				}
			}
		};
		console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaa");
		//console.log(JSON.stringify(body));
	}
	listResultProcessor(resp, callBack) {
		var records = [];
		if (resp.aggregations.Info.buckets.length > 0) {
			var total = resp.aggregations.Info.buckets.length;
			var groupTerm = resp.aggregations.Info.buckets;
			if (limit > total) {
				limit = total;
			}
			for (var i = start; i < limit; i++) {
				records.push({
					AssetId: groupTerm[i].key
				})
			}
		}
		return {
			success: true,
			records: records,
			recordCount: total
		};
	}
};

Object.assign(Asseteventdatasumm.prototype, {
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

module.exports = Asseteventdatasumm;