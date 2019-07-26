var util = require('../util'),
	fs = require('fs');

const assetCountQuery = fs.readFileSync(__dirname + '/assetInfo.json', 'utf-8');

const assetCountlProperties = {
	LatestScanTime: 'N/A',
	Location: 'N/A',
	LocationCode: 'N/A',
	SerialNumber: 'N/A',
	AssetCurrentStatus: 'N/A',
	LatestGpsId: 'N/A',
	Displacement: 'N/A',
	TechnicalIdentificationNumber: 'N/A',
	SmartDeviceSerialNumber: 'N/A',
	OutletType: 'N/A',
	AssetAssociatedOn: 0,
	LocationType: 'N/A',
	Classification: 'N/A',
	SubTradeChannelType: 'N/A',
	SalesOrganization: 'N/A',
	SalesOffice: 'N/A',
	SalesTerritory: 'N/A',
	SalesGroup: 'N/A',
	SalesTerritoryCode: 'N/A',
	SmartDeviceType: 'N/A',
	GatewayType: 'N/A',
	GatewaySerialNumber: 'N/A',
	LatestDoorTime: 'N/A',
	AssetAssociatedByUser: 'N/A',
	CurrentlyAsssignedBDUsername: 'N/A',
	CurrentlyAssignedBDName: 'N/A',
	AssetType: 'N/A',
	Street: 'N/A',
	EquipmentNumber: 'N/A',
	City: 'N/A',
	Country: 'N/A',
	CCHSolution: 0,
	TimeZoneName: 'N/A',
	BatteryLevel: 'N/A'
};

module.exports = util.createJoinPropertyFn({
	index: 'cooler-iot-asset',
	query: assetCountQuery,
	mergeDataFn: function (config, response) {
		var idMapper = config.idMapper,
			data = config.data;
		var aggregations = response.hits.hits;

		var joinData = {};
		aggregations.forEach(function (agg, index) {
			var key = agg._source.AssetId;
			var record = agg._source;
			joinData[key.toString()] = {
				LatestScanTime: record.LatestScanTime,
				Location: record.Location,
				LocationCode: record.LocationCode,
				SerialNumber: record.SerialNumber,
				AssetCurrentStatus: record.AssetCurrentStatus,
				LatestGpsId: record.LatestGpsId,
				Displacement: record.Displacement,
				TechnicalIdentificationNumber: record.TechnicalIdentificationNumber,
				SmartDeviceSerialNumber: record.SmartDeviceSerialNumber,
				OutletType: record.OutletType,
				AssetAssociatedOn: record.AssetAssociatedOn,
				LocationType: record.LocationType,
				Classification: record.Classification,
				SubTradeChannelType: record.SubTradeChannelType,
				SalesOrganization: record.SalesOrganization,
				SalesOffice: record.SalesOffice,
				SalesTerritory: record.SalesTerritory,
				SalesGroup: record.SalesGroup,
				SalesTerritoryCode: record.SalesTerritoryCode,
				SmartDeviceType: record.SmartDeviceType,
				GatewayType: record.GatewayType,
				GatewaySerialNumber: record.GatewaySerialNumber,
				LatestDoorTime: record.LatestDoorTime,
				AssetAssociatedByUser: record.AssetAssociatedByUser,
				CurrentlyAsssignedBDUsername: record.CurrentlyAsssignedBDUsername,
				AssetAssociatedCurrentlyAssignedBDNameByUser: record.CurrentlyAssignedBDName,
				AssetType: record.AssetType,
				EquipmentNumber: record.EquipmentNumber,
				Street: record.Street,
				City: record.City,
				Country: record.Country,
				CCHSolution: record.CCHSolution,
				TimeZoneName: record.TimeZoneName,
				BatteryLevel: record.BatteryLevel
			};
		});
		data.forEach(function (record, index) {
			var id = idMapper(record, index);
			Object.assign(record, assetCountlProperties, joinData[id]);
		});
	}
});