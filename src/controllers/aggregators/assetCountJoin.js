var util = require('../util'),
    fs = require('fs');

const assetCountQuery = fs.readFileSync(__dirname + '/assetCount.json', 'utf-8');

const assetCountlProperties = {
	AssetCount: 0,
	SmartAssetCount : 0
};

module.exports = util.createJoinPropertyFn({
	index: 'cooler-iot-asset',
	query: assetCountQuery,
	mergeDataFn: function (config, response) {
		var idMapper = config.idMapper, data = config.data;
		var aggregations = response.aggregations.Keys.buckets;

		var joinData = {};
		aggregations.forEach(function (agg, index) {
			var key = agg.key;
			var record = agg.doc_count;
			joinData[key.toString()] = { AssetCount: record , SmartAssetCount : agg.SmartAssetCount.doc_count};
		});
		data.forEach(function (record, index) {
			var id = idMapper(record, index);
			Object.assign(record, assetCountlProperties, joinData[id]);
		});
	}
});