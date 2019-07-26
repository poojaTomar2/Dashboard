var util = require('../util'),
    fs = require('fs'),
geolib = require('geolib');

const assetDetailQuery = fs.readFileSync(__dirname + '/planogramInfo.json', 'utf-8');

const planogramInfoProperties = {
	PlanogramDetails: []
};

module.exports = util.createJoinPropertyFn({
	index: 'cooler-iot-planogram',
	query: assetDetailQuery,
	mergeDataFn: function (config, response) {
		var idMapper = config.idMapper, data = config.data;
		var records = response.hits.hits;
		var joinData = {};
		records.forEach(function (record, index) {
			var recordData = record._source;
			if (!joinData[recordData.PlanogramId]) {
				joinData[recordData.PlanogramId] = { PlanogramDetails: [] };
			}
			joinData[recordData.PlanogramId].PlanogramDetails.push({ FacingDetails: recordData.FacingDetails, Facings: recordData.Facings, Shelves: recordData.Shelves });
		});
		data.forEach(function (record, index) {
			var id = idMapper(record, index);
				if (joinData[id]) {
					Object.assign(record, planogramInfoProperties, joinData[id]);
				}
				else {
					Object.assign(record, planogramInfoProperties, []);
				}
		});
	}
});