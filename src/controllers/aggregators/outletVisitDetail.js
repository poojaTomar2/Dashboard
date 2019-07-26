var util = require('../util'),
    fs = require('fs');
geolib = require('geolib');

const detailQuery = fs.readFileSync(__dirname + '/outletVisitDetail.json', 'utf-8');

const outletProperties = {
	Distance: 0,
	Street: '',
	Street2: '',
	Street3: '',
	Street3: '',
	City: '',
	State: '',
	Country: '',
	Market: '',
	Classification: '',
	Channel: '',
	PrimarySalesRep: ''
};

module.exports = util.createJoinPropertyFn({
	index: 'cooler-iot-location',
	query: detailQuery,
	mergeDataFn: function (config, response) {
		var idMapper = config.idMapper, data = config.data;
		var records = response.hits.hits;
		var joinData = {};
		records.forEach(function (record, index) {
			var recordData = record._source;
			var record = {};
			record.Distance = recordData.LocationGeo;
			record.Street = recordData.Street;
			record.Street2 = recordData.Street2;
			record.Street3 = recordData.Street2;
			record.City = recordData.City;
			record.State = recordData.State;
			record.Country = recordData.Country;
			record.Market = recordData.MarketName;
			record.Channel = recordData.LocationType;
			record.Classification = recordData.Classification;
			record.PrimarySalesRep = recordData.PrimarySalesRep;
			joinData[recordData.Id] = record; //recordData.LocationGeo;

		});
		data.forEach(function (record, index) {
			var id = idMapper(record, index);
			var distance = null;
			if (joinData[id] && joinData[id].Distance && joinData[id].Distance.lat && joinData[id].Distance.lon && record.StartLatitude && record.StartLongitude) {
				var distance = geolib.getDistance({ latitude: record.StartLatitude, longitude: record.StartLongitude }, { latitude: joinData[id].Distance.lat, longitude: joinData[id].Distance.lon });
				distance = geolib.convertUnit('km', distance);
				joinData[id].Distance = distance;
			}
			Object.assign(record, outletProperties, joinData[id]);
			//record.Distance = distance;
		});
	}
});