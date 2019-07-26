var util = require('../util'),
	fs = require('fs');

const doorCountQuery = fs.readFileSync(__dirname + '/doorCountDayWise.json', 'utf-8');

module.exports = util.createJoinPropertyFn({
	index: 'cooler-iot-asseteventdatasummary',
	query: doorCountQuery,
	mergeDataFn: function (config, response) {
		var idMapper = config.idMapper,
			data = config.data;
		var aggregations = response.aggregations.DoorData.buckets;

		var joinData = {};
		aggregations.forEach(function (agg, index) {
			var key = agg.key_as_string;
			joinData[key] = agg.DoorCount.value;
		});
		data.forEach(function (record, index) {
			var id = idMapper(record, index);
			if (joinData[record.EventDate]) {
				record.DoorCount = joinData[record.EventDate];
			} else {
				record.DoorCount = 'N/A';
			}
		});
	}
});