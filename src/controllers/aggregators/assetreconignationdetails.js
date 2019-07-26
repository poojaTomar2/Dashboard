var util = require('../util'),
	fs = require('fs');

const detailQuery = fs.readFileSync(__dirname + '/assetreconignationDetail.json', 'utf-8');

const assetPurityDetailProperty = {
	//VerifiedOn: ''
};

module.exports = util.createJoinPropertyFn({
	index: 'cooler-iot-recognitionreportattribute',
	query: detailQuery,
	mergeDataFn: function (config, response) {
		var idMapper = config.idMapper,
			data = config.data;
		var aggregations = response.aggregations && response.aggregations.Keys.buckets
		var joinData = {};

		if (aggregations) {
			aggregations.forEach((agg) => {
				var recordData = agg.latest.hits.hits[0]._source;
				if (!joinData[recordData.AssetId]) {
					joinData[recordData.AssetId] = {};
				}
				joinData[recordData.AssetId] = {
					//VerifiedOn: recordData.VerifiedOn ? recordData.VerifiedOn : "",
					TimeZoneId: recordData.TimeZoneId
				};

			})


		}

		//	});
		data.forEach(function (record, index) {
			var id = idMapper(record, index);
			Object.assign(record, assetPurityDetailProperty, joinData[id]);
		});
	}
});