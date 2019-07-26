"use strict";

var ElasticListBase = require('./elasticListBase'),
	util = require('../util');

class SmartDeviceInstallationDate extends ElasticListBase {
	customizeQuery(body, params) {
		var bool = body.query.bool;
		var mustNot = bool.must_not || [];
		mustNot.push({
			"term": {
				"AssetAssociatedOn": "0001-01-01T00:00:00"
			}
		});
		bool.mustNot = mustNot;
		if (params.installationDate) {
			if (params.installationDate == 1) {
				util.applyDateFilter(params, bool, this.dateFilter, false, true);
				if (!params.daysDoor) {
					params.daysDoor = params.totalDays
				}
			}
			else if (params.installationDate == 2) {
				util.applyDateFilter(params, bool, this.dateFilter, false, false);
				if (!params.daysDoor) {
					params.daysDoor = params.totalDays
				}
			}
		}
	}
};

Object.assign(SmartDeviceInstallationDate.prototype, {
	index: 'cooler-iot-asset',
	type: 'Asset',
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
		"IsDeleted",
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
		"AverageCapacity"
	]),
	sort: [{
		field: 'SerialNumber',
		dir: 'asc'
	}],
	dateFilter: 'AssetAssociatedOn'
});

module.exports = SmartDeviceInstallationDate;