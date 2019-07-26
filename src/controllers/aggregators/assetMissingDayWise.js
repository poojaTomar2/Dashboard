var util = require('../util'),
    fs = require('fs');

const missingQuery = fs.readFileSync(__dirname + '/missingCountDayWise.json', 'utf-8');

module.exports = util.createJoinPropertyFn({
	index: 'cooler-iot-assetvisithistory',
	query: missingQuery,
	mergeDataFn: function (config, response) {
		var idMapper = config.idMapper, data = config.data;
		var aggregations = response.aggregations.MissingData.buckets;

		var joinData = {};
		aggregations.forEach(function (agg, index) {
			var key = agg.key_as_string;
			joinData[key] = {"TotalMissingRecord": agg.AssetCount.value, "MissingCount" : agg.MissingData.AssetCount.value};
		});
		data.forEach(function (record, index) {
			var id = idMapper(record, index);
			if (joinData[record.EventDate]) {
				record.TotalMissingRecord = joinData[record.EventDate].TotalMissingRecord;
				record.MissingCount = joinData[record.EventDate].MissingCount;
			}
			else {
				record.TotalMissingRecord = 0;
				record.MissingCount = 0;
			}
		});
	}
});