var util = require('../util'),
    fs = require('fs');

const outletAsstDetailQuery = fs.readFileSync(__dirname + '/outletAsset.json', 'utf-8');

const outletAssetDetailProperties = {
	AssetDetails: []
};

module.exports = util.createJoinPropertyFn({
	index: 'cooler-iot-asset',
	query: outletAsstDetailQuery,
	mergeDataFn: function (config, response) {
		var idMapper = config.idMapper, data = config.data;
		var aggregations = response.hits.hits;

		var joinData = {};
		aggregations.forEach(function (agg, index) {
			var key = agg.key;
			var record = agg._source;
			if (!joinData[record.LocationId]) {
				joinData[record.LocationId] = { AssetDetails: [] };
			}
			joinData[record.LocationId].AssetDetails.push({ AssetId: record.Id, PlanogramId: record.PlanogramId, LatestProcessedPurityId: record.LatestProcessedPurityId });
		});
		var returnRecord = [];
		data.forEach(function (record, index) {
			var id = idMapper(record, index);
			Object.assign(record, outletAssetDetailProperties, joinData[id]);
		});
	}
});