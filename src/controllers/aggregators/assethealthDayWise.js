var util = require('../util'),
	fs = require('fs');

const healthCountQuery = fs.readFileSync(__dirname + '/healthCountDayWise.json', 'utf-8');



module.exports = util.createJoinPropertyFn({
	index: 'cooler-iot-asseteventdatasummary',
	query: healthCountQuery,
	mergeDataFn: function (config, response) {
		var idMapper = config.idMapper,
			data = config.data;
		var aggregations = response.aggregations.HealthData.buckets;

		var joinData = {};
		aggregations.forEach(function (agg, index) {
			var key = agg.key_as_string;
			joinData[key] = {
				"TotalHealthRecord": agg.doc_count,
				"LowLight": agg.LowLight.doc_count,
				"HightTemperature": agg.HightTemperature.doc_count,
				"TempAndLightIssue": agg.TempAndLightIssue.doc_count
			};
		});
		data.forEach(function (record, index) {
			var id = idMapper(record, index);
			if (joinData[record.EventDate]) {
				record.TotalHealthRecord = joinData[record.EventDate].TotalHealthRecord;
				record.LowLight = joinData[record.EventDate].LowLight;
				record.HightTemperature = joinData[record.EventDate].HightTemperature;
				record.TempAndLightIssue = joinData[record.EventDate].TempAndLightIssue;
			} else {
				record.TotalHealthRecord = 0;
				record.LowLight = 0;
				record.HightTemperature = 0;
				record.TempAndLightIssue = 0;
			}
		});
	}
});