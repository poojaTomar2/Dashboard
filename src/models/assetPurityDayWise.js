"use strict";
var ElasticListBase = require('./elasticListBase');
var moment = require('moment'),
	util = require('../util');
class AssetPurityDayWise extends ElasticListBase {
	customizeQuery(body, searchParams) {
		var bool = body.query.bool;

		if (searchParams.forAsset) {
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
								"term": {
									"StatusId": "-1"
								}
							}, {
								"term": {
									"VerifiedOn": "0001-01-01T00:00:00"
								}
							}]
						}
					},
					"aggs": {
						"Assets": {
							"terms": {
								"field": "AssetId",
								"size": 100000
							},
							"aggs": {
								"Date": {
									"date_histogram": {
										"field": "PurityDateTime",
										"interval": "day",
										"min_doc_count": 1,
										"order": {
											"_key": "desc"
										}
									},
									"aggs": {
										"tops": {
											"top_hits": {
												"size": 1,
												"sort": [{
													"AssetPurityId": "desc"
												}]
											}
										}
									}
								}
							}
						}
					}
				}
			};
		} else {
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
								"term": {
									"StatusId": "-1"
								}
							}, {
								"term": {
									"VerifiedOn": "0001-01-01T00:00:00"
								}
							}]
						}
					},
					"aggs": {
						"Locations": {
							"terms": {
								"field": "LocationId",
								"size": 100000
							},
							"aggs": {
								"Assets": {
									"terms": {
										"field": "AssetId",
										"size": 100000
									},
									"aggs": {
										"tops": {
											"top_hits": {
												"size": 1,
												"sort": [{
													"AssetPurityId": "desc"
												}]
											}
										}
									}
								}
							}
						}
					}
				}
			};
		}
		var must = bool.must || [];
		must.pop({
			"term": {
				"IsDeleted": false
			}
		});
		bool.must = must;

		if (searchParams.fromOutletScreenDateFilter) {
			util.applyDateFilter(searchParams, bool, this.dateFilter);
		}
		//console.log(JSON.stringify(body));
	}

	listResultProcessor(resp, callBack) {
		var records = [],
			total = resp.hits.total;
		if (resp.aggregations) {
			total = 0;
			if (resp.aggregations.AssetPurity.Locations) {
				var locationGroup = resp.aggregations.AssetPurity.Locations.buckets;
				var tempRecord = {};
				locationGroup.forEach(function (record) {
					tempRecord.LocationId = record.key;
					tempRecord.DayWise = true;
					tempRecord.AssetDetails = [];
					total = record.Assets.buckets.length;
					record.Assets.buckets.forEach(function (assetRecord) {
						tempRecord.AssetDetails[assetRecord.key] = {
							AssetId: assetRecord.key,
							PurityDetails: []
						};
						tempRecord.AssetDetails[assetRecord.key].PurityDetails.push(assetRecord.tops.hits.hits[0]._source);
					});
					tempRecord.AssetDetails = tempRecord.AssetDetails.filter(function (n) {
						return n != undefined
					});
					records.push(tempRecord);
					tempRecord = {};
				});
				var from = callBack.from;
				var to = from + callBack.size > total ? total : from + callBack.size;
				total = total;
				if (records[0]) {
					records[0].AssetDetails = records[0].AssetDetails.splice(from, 10);
				}
			} else {
				var tempRecord = {};
				var total = 0;
				var key = 0;
				resp.aggregations.AssetPurity.Assets.buckets.forEach(function (assetRecord) {
					tempRecord.DayWise = true;
					tempRecord.AssetDetails = [];
					tempRecord.AssetDetails[assetRecord.key] = {
						AssetId: assetRecord.key,
						PurityDetails: []
					};
					total = assetRecord.Date.buckets.length;
					assetRecord.Date.buckets.forEach(function (dateRecord) {
						tempRecord.AssetDetails[assetRecord.key].PurityDetails.push(dateRecord.tops.hits.hits[0]._source);
					});
					tempRecord.AssetDetails = tempRecord.AssetDetails.filter(function (n) {
						return n != undefined
					});
					records.push(tempRecord);
					tempRecord = {};
					key = assetRecord.key;
				});

				var from = callBack.from;
				var to = from + callBack.size > total ? total : from + callBack.size;
				total = total;
				if (records[0]) {
					records[0].AssetDetails[0].PurityDetails = records[0].AssetDetails[0].PurityDetails.splice(from, 10);
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

Object.assign(AssetPurityDayWise.prototype, {
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

module.exports = AssetPurityDayWise;