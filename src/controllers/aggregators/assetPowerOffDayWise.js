var util = require('../util'),
    fs = require('fs');

const powerOffQuery = fs.readFileSync(__dirname + '/powerOffCountDayWise.json', 'utf-8');

module.exports = util.createJoinPropertyFn({
	index: 'cooler-iot-asseteventdatasummary',
	query: powerOffQuery,
	mergeDataFn: function (config, response) {
		var idMapper = config.idMapper, data = config.data;
		var aggregations = response.aggregations.PowerOff.buckets;

		var joinData = {};
		aggregations.forEach(function (agg, index) {
			var key = agg.key_as_string;
			joinData[key] = {"TotalPowerRecord": agg.AssetCount.value, "PowerOffCount" : agg.PowerOffCount.AssetCount.value};
		});
		data.forEach(function (record, index) {
			var id = idMapper(record, index);
			if (joinData[record.EventDate]) {
				record.TotalPowerRecord = joinData[record.EventDate].TotalPowerRecord;
				record.PowerOffCount = joinData[record.EventDate].PowerOffCount;
			}
			else {
				record.TotalPowerRecord = 0;
				record.PowerOffCount = 0;
			}
		});
	}
});