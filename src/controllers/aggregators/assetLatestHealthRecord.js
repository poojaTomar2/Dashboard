var util = require('../util'),
    fs = require('fs');

const assetLatestHealthQuery = fs.readFileSync(__dirname + '/assetLatestHealth.json', 'utf-8');

const LatestHealthRecord = {
	LatestHealthRecordTime: '0001-01-01T00:00:00',
	TimeZoneId : undefined,
	DeviceLightStatus: 'Off'
};

module.exports = util.createJoinPropertyFn({
	index: 'cooler-iot-asseteventdatasummary',
	query: assetLatestHealthQuery,
	mergeDataFn: function (config, response) {
		var idMapper = config.idMapper, data = config.data;
		var records = response.aggregations.Assets.buckets;
		var joinData = {};
		records.forEach(function (record, index) {
			var recordData = record.latestRecord.hits.hits[0]._source;
			if (!joinData[record.key]) {
				joinData[record.key] = { LatestHealthRecordTime: '0001-01-01T00:00:00' ,TimeZoneId : undefined  };
			}
			joinData[record.key].LatestHealthRecordTime = recordData.EventDate;
			joinData[record.key].TimeZoneId = recordData.TimeZoneId;
			joinData[record.key].DeviceLightStatus = recordData.DeviceLightStatus;
		});
		data.forEach(function (record, index) {
			var id = idMapper(record, index);
				if (joinData[id]) {
					Object.assign(record, LatestHealthRecord, joinData[id]);
				}
				else {
					Object.assign(record, LatestHealthRecord, []);
				}
		});
	}
});