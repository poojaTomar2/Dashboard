var util = require('../util'),
	fs = require('fs');

const detailQuery = fs.readFileSync(__dirname + '/assetPurityDetail.json', 'utf-8');

const assetPurityDetailProperty = {
	PurityStatus: null,
	ForeignProduct: 0,
	TotalStock: 0,
	EmptyFacings: 0,
	PurityIssue: 0,
	PlanogramCompliance: 0,
	PurityPercentage: 0,
	//VerifiedOn: '',
	PurityDateTime: '',
	StoredFilename: '',
	ImageCount: 0
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
				joinData[recordData.AssetId] = {};
			}
			joinData[recordData.AssetId] = {
				PurityStatus: recordData.PurityStatus,
				ForeignProduct: recordData.ForeignProduct,
				TotalStock: recordData.TotalStock,
				EmptyFacings: recordData.EmptyFacings,
				PurityIssue: recordData.PurityIssue,
				PlanogramCompliance: recordData.PlanogramCompliance,
				PurityPercentage: recordData.PurityPercentage,
				//VerifiedOn: recordData.VerifiedOn,
				PurityDateTime: recordData.PurityDateTime,
				StoredFilename: recordData.StoredFilename,
				ImageCount: recordData.ImageCount,
				TimeZoneId: recordData.TimeZoneId
			};
			joinData[recordData.AssetId].PurityIssue = recordData.PurityIssue;

		});
		data.forEach(function (record, index) {
			var id = idMapper(record, index);
			Object.assign(record, assetPurityDetailProperty, joinData[id]);
		});
	}
});