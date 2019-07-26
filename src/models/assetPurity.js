"use strict";
var ElasticListBase = require('./elasticListBase');
var moment = require('moment'),
	util = require('../util');
class AssetPurity extends ElasticListBase {
	customizeQuery(body, params) {
		var bool = body.query.bool;
		body.aggs = {
			"AssetPurity": {
				"filter": {
					"bool": {
						"must": [{
							"type": {
								"value": "AssetPurity"
							}
						}, {
							"term": {
								"IsDeleted": false
							}
						}],
						"must_not": [{
							"terms": {
								"StatusId": ["-1", "0"]
							}
						}]
					}
				},
				"aggs": {
					"Date": {
						"date_histogram": {
							"field": "PurityDateTime",
							"interval": "day",
							"min_doc_count": 1
						},
						"aggs": {
							"tops": {
								"top_hits": {
									"size": 100
								}
							}
						}
					}
				}
			}
		};
		var must = bool.must || [];
		must.pop({
			"term": {
				"IsDeleted": false
			}
		});
		bool.must = must;

		if (params.fromOutletScreenDateFilter) {
			util.applyDateFilter(params, bool, this.dateFilter);
		}
		//console.log(JSON.stringify(body));
	}

	listResultProcessor(resp, callBack) {
		var records = [],
			total = resp.hits.total;
		if (resp.aggregations) {
			total = 0;
			var groupTerm = resp.aggregations.AssetPurity.Date;

			var from = (groupTerm.buckets.length - 1) - (callBack.from);
			var to = from - callBack.size > groupTerm.buckets.length ? groupTerm.buckets.length : from - callBack.size;
			total = groupTerm.buckets.length;

			//var end = total > callBack.size ? total : callBack.size; 


			for (var j = from; j > to; j--) {
				if (j < 0) {
					continue;
				}
				var record = groupTerm.buckets[j];
				var rec = {};
				var collectionItem = record.tops.hits.hits;
				for (var i = 0, len = collectionItem.length; i < len; i++) {
					rec = {};
					var targetBucket = records.filter(data => data.Key == moment(moment(collectionItem[i]._source.PurityDateTime).format('YYYY-MM-DD[T00:00:00.000Z]')).valueOf());
					if (targetBucket && targetBucket.length > 0) {
						var recordBucket = targetBucket.filter(data => data.AssetId == collectionItem[i]._source.AssetId);
						if (recordBucket && recordBucket.length > 0) {
							recordBucket[0].PurityDetail.push({
								PurityDateTime: collectionItem[i]._source.PurityDateTime,
								StoredFilename: collectionItem[i]._source.StoredFilename,
								ImageCount: collectionItem[i]._source.ImageCount,
								EventTime: collectionItem[i]._source.DoorOpen,
								StatusId: collectionItem[i]._source.StatusId
							});
						} else {
							rec.Key = moment(moment(collectionItem[i]._source.PurityDateTime).format('YYYY-MM-DD[T00:00:00.000Z]')).valueOf();
							rec.AssetSerialNumber = collectionItem[i]._source.AssetSerialNumber;
							rec.PurityDetail = [];
							rec.AssetId = collectionItem[i]._source.AssetId;
							rec.PurityDetail.push({
								PurityDateTime: collectionItem[i]._source.PurityDateTime,
								StoredFilename: collectionItem[i]._source.StoredFilename,
								ImageCount: collectionItem[i]._source.ImageCount,
								EventTime: collectionItem[i]._source.DoorOpen,
								StatusId: collectionItem[i]._source.StatusId
							});
							records.push(rec);
						}

					} else {
						rec.Key = moment(moment(collectionItem[i]._source.PurityDateTime).format('YYYY-MM-DD[T00:00:00.000Z]')).valueOf();
						rec.Date = record.key_as_string;
						rec.AssetSerialNumber = collectionItem[i]._source.AssetSerialNumber;
						rec.PurityDetail = [];
						rec.AssetId = collectionItem[i]._source.AssetId;
						rec.PurityDetail.push({
							PurityDateTime: collectionItem[i]._source.PurityDateTime,
							StoredFilename: collectionItem[i]._source.StoredFilename,
							ImageCount: collectionItem[i]._source.ImageCount,
							EventTime: collectionItem[i]._source.DoorOpen,
							StatusId: collectionItem[i]._source.StatusId
						});
						records.push(rec);
					}
				}
			}

		}
		return {
			success: true,
			records: records,
			recordCount: total
		};
	}
};

Object.assign(AssetPurity.prototype, {
	index: 'cooler-iot-assetpurity',
	type: 'AssetPurity',
	propertyDefs: ElasticListBase.assignPropertyDefs([
		"AssetId",
		"LocationId"
	]),
	sort: [{
		field: 'PurityDateTime',
		dir: 'desc'
	}],
	softDelete: null,
	dateFilter: 'PurityDateTime'
});

module.exports = AssetPurity;