var util = require('../util'),
	fs = require('fs'),
	geolib = require('geolib');

const assetDetailQuery = fs.readFileSync(__dirname + '/purityProduct.json', 'utf-8');

const purityProductInfoProperties = {
	PurityProductsDetails: []
};

module.exports = util.createJoinPropertyFn({
	index: 'cooler-iot-assetpurityproduct',
	query: assetDetailQuery,
	mergeDataFn: function (config, response) {
		var idMapper = config.idMapper,
			data = config.data;
		var records = response.hits.hits;
		var joinData = {};
		records.forEach(function (record, index) {
			var recordData = record._source;
			if (!joinData[recordData.AssetPurityId]) {
				joinData[recordData.AssetPurityId] = {
					PurityProductsDetails: []
				};
			}
			joinData[recordData.AssetPurityId].PurityProductsDetails.push({
				IsForeign: recordData.IsForeign,
				IsCompliant: recordData.IsCompliant,
				ProductId: recordData.ProductId
			});
		});
		data.forEach(function (record, index) {
			var id = idMapper(record, index);
			if (record.AssetDetails) {
				for (var j = 0; len = record.AssetDetails.length, j < len; j++) {
					if (record.DayWise) {
						for (var k = 0; len = record.AssetDetails[j].PurityDetails.length, k < len; k++) {
							var id = record.AssetDetails[j].PurityDetails[k].AssetPurityId;
							var foreignFacingCount = 0;
							var nonCompliantFacingCount = 0;
							if (joinData[id]) {
								for (var l = 0; l < joinData[id].PurityProductsDetails.length; l++) {
									var rec = joinData[id].PurityProductsDetails[l];
									if (!rec.IsCompliant) {
										nonCompliantFacingCount++;
									}
								}
								record.AssetDetails[j].PurityDetails[k].NonCompliantFacingCount = nonCompliantFacingCount;
								Object.assign(record.AssetDetails[j].PurityDetails[k], purityProductInfoProperties, joinData[id]);
							} else {
								record.AssetDetails[j].PurityDetails[k].NonCompliantFacingCount = nonCompliantFacingCount;
								Object.assign(record.AssetDetails[j].PurityDetails[k], purityProductInfoProperties, []);
							}
						}
					} else {
						var id = record.AssetDetails[j].LatestProcessedPurityId;
						var foreignFacingCount = 0;
						var nonCompliantFacingCount = 0;
						if (joinData[id]) {
							for (var k = 0; k < joinData[id].PurityProductsDetails.length; k++) {
								var rec = joinData[id].PurityProductsDetails[k];
								if (!rec.IsCompliant) {
									nonCompliantFacingCount++;
								}
							}
							record.AssetDetails[j].NonCompliantFacingCount = nonCompliantFacingCount;
							Object.assign(record.AssetDetails[j], purityProductInfoProperties, joinData[id]);
						} else {
							record.AssetDetails[j].NonCompliantFacingCount = nonCompliantFacingCount;
							Object.assign(record.AssetDetails[j], purityProductInfoProperties, []);
						}
					}
				}
			} else {
				var id = record.LatestProcessedPurityId;
				var foreignFacingCount = 0;
				var nonCompliantFacingCount = 0;
				var compliantFacingCount = 0;
				if (joinData[id]) {
					for (var k = 0; k < joinData[id].PurityProductsDetails.length; k++) {
						var rec = joinData[id].PurityProductsDetails[k];
						if (!rec.IsCompliant) {
							nonCompliantFacingCount++;
						} else {
							compliantFacingCount++;
						}
					}
					record.NonCompliantFacingCount = nonCompliantFacingCount;
					record.CompliantFacingCount = compliantFacingCount;
					Object.assign(record, purityProductInfoProperties, joinData[id]);
				} else {
					record.NonCompliantFacingCount = nonCompliantFacingCount;
					record.CompliantFacingCount = compliantFacingCount;
					Object.assign(record, purityProductInfoProperties, joinData[id]);
				}
			}
		});
	}
});