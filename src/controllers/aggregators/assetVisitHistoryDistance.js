var util = require('../util'),
    fs = require('fs'),
geolib = require('geolib');

const assetDetailQuery = fs.readFileSync(__dirname + '/assetDetailHstory.json', 'utf-8');

const assetvisitHistoryDistanceProperties = {
	Distance: 'N/A'
};

module.exports = util.createJoinPropertyFn({
	index: 'cooler-iot-asset',
	query: assetDetailQuery,
	mergeDataFn: function (config, response) {
		var idMapper = config.idMapper, data = config.data;
		var records = response.hits.hits;
		var joinData = {};
		records.forEach(function (record, index) {
			var recordData = record._source;
			joinData[recordData.Id] = recordData.LocationGeo;
		});
		data.forEach(function (record, index) {
			var id = idMapper(record, index);
				var distance = null;
				if (joinData[id] && joinData[id].lat && joinData[id].lon && record.Latitude && record.Longitude) {
					var distance = geolib.getDistance({ latitude: record.Latitude, longitude: record.Longitude }, { latitude: joinData[id].lat, longitude: joinData[id].lon });
					distance = geolib.convertUnit('km', distance);
				} 
				record.Distance = distance;

		});
	}
});