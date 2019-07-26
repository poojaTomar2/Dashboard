var util = require('../util'),
	fs = require('fs');

const detailQuery = fs.readFileSync(__dirname + '/assetPurityDetail.json', 'utf-8');

const assetPurityProperties = {
	PurityDetails: []
};

module.exports = util.createJoinPropertyFn({
	index: 'cooler-iot-assetpurity',
	query: detailQuery,
	mergeDataFn: function (config, response) {
		var idMapper = config.idMapper,
			data = config.data;
		var aggregations = response.aggregations.Keys.buckets;

		var joinData = {};
		aggregations.forEach(function (agg, index) {
			var records = agg.latest.hits.hits[0];
			var recordData = records._source;
			if (!joinData[recordData.AssetId]) {
				joinData[recordData.AssetId] = {
					PurityDetails: [],
					VerifiedOn: recordData.VerifiedOn
				};
			}
			joinData[recordData.AssetId].PurityDetails.push({
				PurityStatus: recordData.PurityStatus,
				ForeignProduct: recordData.ForeignProduct,
				TotalStock: recordData.TotalStock,
				EmptyFacings: recordData.EmptyFacings,
				PurityIssue: recordData.PurityIssue,
				PlanogramCompliance: recordData.PlanogramCompliance,
				PurityPercentage: recordData.PurityPercentage,
				VerifiedOn: recordData.VerifiedOn,
				PlanogramId: recordData.PlanogramId,
				StockPercentage: recordData.StockPercentage,
				SerialNumber: recordData.AssetSerialNumber

			});

		});
		data.forEach(function (record, index) {

			if (!record.AssetDetails) {
				var id = record.Id;
				if (joinData[id]) {
					Object.assign(record, assetPurityProperties, joinData[id]);
				} else {
					Object.assign(record, assetPurityProperties, []);
				}
			} else {
				for (var j = 0; len = record.AssetDetails.length, j < len; j++) {
					var id = record.AssetDetails[j].AssetId;
					if (joinData[id]) {
						Object.assign(record.AssetDetails[j], assetPurityProperties, joinData[id]);
					} else {
						Object.assign(record.AssetDetails[j], assetPurityProperties, []);
					}
				}
			}
		});
	}
});