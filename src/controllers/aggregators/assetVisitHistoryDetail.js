var util = require('../util'),
	fs = require('fs'),
	geolib = require('geolib'),
	geodist = require('geodist');

const assetDetailQuery = fs.readFileSync(__dirname + '/assetDetailHstory.json', 'utf-8');

const assetvisitHistoryDetailProperties = {
	Distance: 0
};

module.exports = util.createJoinPropertyFn({
	index: 'cooler-iot-asset',
	query: assetDetailQuery,
	mergeDataFn: function (config, response) {
		var idMapper = config.idMapper,
			data = config.data;
		var records = response.hits.hits;
		var joinData = {};
		records.forEach(function (record, index) {
			var recordData = record._source;
			joinData[recordData.Id] = recordData.LocationGeo;
		});
		data.forEach(function (record, index) {
			var id = idMapper(record, index);
			for (var j = 0; len = record.details.length, j < len; j++) {
				var distance = null;
				if (record.details[j].Status == 'Missing') {
					distance = 0;
				} else {
					if (joinData[id] && joinData[id].lat && joinData[id].lon && record.StartLatitude && record.StartLongitude) {
						// var distance = geolib.getDistance({
						// 	latitude: record.details[j].lat,
						// 	longitude: record.details[j].lon
						// }, {
						// 	latitude: joinData[id].lat,
						// 	longitude: joinData[id].lon
						// });
						var distance = geodist({
							lat: record.details[j].lat,
							lon: record.details[j].lon
						}, {
							lat: joinData[id].lat,
							lon: joinData[id].lon
						}, {
							exact: true,
							unit: 'km'
						});
						// distance = geolib.convertUnit('km', distance);
					}
				}
				record.details[j].Distance = distance;
			}

		});
	}
});