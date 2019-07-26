var util = require('../util'),
	fs = require('fs');

const assetCountQuery = fs.readFileSync(__dirname + '/locationInfo.json', 'utf-8');

const assetCountlProperties = {
	LocationCode: 'N/A',
	Name: 'N/A',
	SalesTerritory: 'N/A',
	City: 'N/A',
	Outlet: 'N/A',
	OutletType: 'N/A',
	LocationType: 'N/A',
	Classification: 'N/A',
	SubTradeChannelType: 'N/A',
	SalesOrganization: 'N/A',
	SalesOffice: 'N/A',
	SalesGroup: 'N/A',
	SalesTerritory: 'N/A',
	SalesTerritoryCode: 'N/A',
	CurrentlyAsssignedBDUsername: 'N/A',
	CurrentlyAssignedBDName: 'N/A',
	Street: 'N/A'
};

module.exports = util.createJoinPropertyFn({
	index: 'cooler-iot-location',
	query: assetCountQuery,
	mergeDataFn: function (config, response) {
		var idMapper = config.idMapper,
			data = config.data;
		var aggregations = response.hits.hits;

		var joinData = {};
		aggregations.forEach(function (agg, index) {
			var key = agg._source.LocationId;
			var record = agg._source;
			joinData[key.toString()] = {
				LocationCode: record.LocationCode,
				Name: record.Name,
				SalesTerritory: record.SalesTerritory,
				City: record.City,
				Outlet: record.Outlet,
				OutletType: record.OutletType,
				LocationType: record.LocationType,
				Classification: record.Classification,
				SubTradeChannelType: record.SubTradeChannelType,
				SalesOrganization: record.SalesOrganization,
				SalesOffice: record.SalesOffice,
				SalesGroup: record.SalesGroup,
				SalesTerritory: record.SalesTerritory,
				SalesTerritoryCode: record.SalesTerritoryCode,
				CurrentlyAsssignedBDUsername: record.CurrentlyAsssignedBDUsername,
				CurrentlyAssignedBDName: record.CurrentlyAssignedBDName,
				Street: record.CityStreet
			};
		});
		data.forEach(function (record, index) {
			var id = idMapper(record, index);
			Object.assign(record, assetCountlProperties, joinData[id]);
		});
	}
});