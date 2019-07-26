"use strict";

var ElasticListBase = require('./elasticListBase'),
	Alert = require('./alert'),
	util = require('../util');

class Planogram extends ElasticListBase {
	customizeQuery(body,params) {
		var bool = body.query.bool;
		var smartPush = typeof params.SmartDeviceTypeId === "string" ? params.SmartDeviceTypeId : params["SmartDeviceTypeId[]"];
		body.aggs = {
			"Location": {
				"terms": {
					"field": "LocationId",
					"size": body.size
				},
				"aggs": {
					"tops": {
						"top_hits": {
							"size": 100
						}
					}
				}
			},
			"LocationCount": {
				"cardinality": {
					"field": "LocationId"
			}

			}
		};

		var must = bool.must || [];

		if (smartPush) {
		must.push({
			"terms": {
					"SmartDeviceTypeId": [3, 7, 26, ].concat(smartPush)
				}
			});
		} else {
			must.push({
				"terms": {
				"SmartDeviceTypeId": [3, 7, 26, ]
			}
		});
		}



		must.push({
			"term": {
				"IsDeleted": false
			}
		});
		bool.must = must;

		var mustNot = bool.must_not || [];
		mustNot.push({
			"terms": {
				"LocationId": [0]
			}
		});
		bool.mustNot = mustNot;

		//console.log(JSON.stringify(body));
	}
	listResultProcessor(resp, callBack) {
		var records = [],
			total = resp.aggregations.LocationCount.value;
		if (resp.aggregations) {
			// total = 0;
			var groupTerm = resp.aggregations.Location;

			groupTerm.buckets.forEach(function (record) {
				// total++;
				var rec = {};
				rec.LocationId = record.key;
				var collectionItem = record.tops.hits.hits;
				for (var i = 0, len = collectionItem.length; i < len; i++) {
					if (!rec.Name) {
						rec.Name = collectionItem[i]._source.Location;
					}
					if (!rec.LocationCode) {
						rec.LocationCode = collectionItem[i]._source.LocationCode;
					}
					if (!rec.AssetDetails) {
						rec.AssetDetails = [];
					}
					rec.AssetDetails.push({
						AssetId: collectionItem[i]._source.Id,
						PlanogramId: collectionItem[i]._source.PlanogramId,
						LatestProcessedPurityId: collectionItem[i]._source.LatestProcessedPurityId
					});
				}
				records.push(rec);
			});
		}
		return {
			success: true,
			records: records,
			recordCount: total
		};
	}
};

Object.assign(Planogram.prototype, {
	index: 'cooler-iot-asset',
	type: 'Asset',
	keyField: 'AssetId',
	propertyDefs: ElasticListBase.assignPropertyDefs([
		'AssetId',
		'LocationId',
		'Name',
		'LocationCode',
		'TotalFacings',
		'EmptyFacings',
		'TotalForiegnProduct',
		'NonCompliantFacingCount',
		'TotalCocaColaFacings',
		"SmartDeviceTypeId"
	])
});


module.exports = Planogram;