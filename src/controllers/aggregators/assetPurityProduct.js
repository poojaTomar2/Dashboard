var util = require('../util'),
    fs = require('fs');

const detailQuery = fs.readFileSync(__dirname + '/productInfo.json', 'utf-8');

const assetPurityProductProperties = {
	ProductDetails: []
};

module.exports = util.createJoinPropertyFn({
	index: 'cooler-iot-product',
	query: detailQuery,
	mergeDataFn: function (config, response) {
		var idMapper = config.idMapper, data = config.data;
		var aggregations = response.hits.hits;

		var joinData = {};
		aggregations.forEach(function (agg, index) {
			//var records = agg.;
			var recordData = agg._source;
			if (!joinData[recordData.ProductId]) {
				joinData[recordData.ProductId] = { ProductDetails: [] };
			}

			joinData[recordData.ProductId].ProductDetails.push({ ProductName: recordData.Product, IsForeign: recordData.IsForeign, IsEmpty: recordData.IsEmpty });

		});
		data.forEach(function (record, index) {
			for (var j = 0; len = record.AssetDetails.length, j < len; j++) {
				var id = record.AssetDetails[j].AssetId;
				if (joinData[id]) {
					Object.assign(record.AssetDetails[j], assetPurityProductProperties, joinData[id]);
				}
				else {
					Object.assign(record.AssetDetails[j], assetPurityProductProperties, []);
				}
			}
		});
	}
});