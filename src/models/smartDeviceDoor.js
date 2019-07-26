"use strict";

var ElasticListBase = require('./elasticListBase'),
	util = require('../util');

class SmartDeviceDoor extends ElasticListBase {
	customizeQuery(body, params) {
		var bool = body.query.bool;
		var mustNot = bool.must || [];

		var must = bool.must_not || [];
		must.push({
			"term": {
				"IsFromDoor": true
			}
		});
		bool.must = must;
		body.aggs = {
			"DoorData": {
				"date_histogram": {
					"field": "EventDate",
					"interval": "1d",
					"min_doc_count": 1
				},
				"aggs": {
					"Asset": {
						"terms": {
							"field": "AssetId",
							"size": 100000
						},
						"aggs": {
							"tops": {
								"top_hits": {
									"size": 1,
									"_source": {
										"includes": [
											"AssetTypeCapacity"
										]
									}
								}
							}
						}
					},
					"tops": {
						"top_hits": {
							"size": 100,
							"_source": {
								"includes": ["DoorOpen", "SumOfDoorOpenDuration", "EventDate", "SumOfDoorCount", "AssetSerialNumber", "AssetTypeCapacity"]
							}
						}
					}
				}
			}
		};

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
			var groupTerm = resp.aggregations.DoorData;

			if (callBack.sort[0].EventDate.order === "desc") {
				var from = (groupTerm.buckets.length - 1) - (callBack.from);
				var to = from - callBack.size > groupTerm.buckets.length ? groupTerm.buckets.length : from - callBack.size;

				total = groupTerm.buckets.length;

				for (var j = from; j > to; j--) {
					if (j < 0) {
						continue;
					}
					var record = groupTerm.buckets[j];
					var rec = {};
					rec.EventDate = record.key_as_string;
					var collectionItem = record.tops.hits.hits;
					var assetTotal = record.Asset.buckets;
					rec.AssetSerialNumber = collectionItem.length > 0 ? collectionItem[0]._source.AssetSerialNumber : "";
					rec.AssetTypeCapacity = 0;
					rec.AssetCount = assetTotal.length;

					if (rec.AssetCount) {
						assetTotal.forEach(function (bucket) {
							rec.AssetTypeCapacity += bucket.tops.hits.hits[0]._source.AssetTypeCapacity
						});
					}
					var totalDoorOpen = 0;
					var totalDoorDurationLessThen10 = 0;
					var totalDoorDurationBW10AND60 = 0;
					var totalDoorDurationBW60AND300 = 0;
					var totalDoorDurationMoreThen300 = 0;

					for (var i = 0, len = collectionItem.length; i < len; i++) {
						var duration = collectionItem[i]._source.SumOfDoorOpenDuration;
						totalDoorOpen += collectionItem[i]._source.SumOfDoorCount;

						if (duration > 0 && duration < 10) {
							totalDoorDurationLessThen10++;
						} else if (duration >= 10 && duration <= 60) {
							totalDoorDurationBW10AND60++;
						} else if (duration > 60 && duration <= 300) {
							totalDoorDurationBW60AND300++;
						} else if (duration > 300) {
							totalDoorDurationMoreThen300++;
						}
					}
					rec.TotalDoorOpen = totalDoorOpen;
					rec.DoorDurationLessThen10 = totalDoorDurationLessThen10 != 0 ? totalDoorDurationLessThen10 : totalDoorOpen >= 0 ? 'N/A' : totalDoorDurationLessThen10;
					rec.DoorDurationBW10AND60 = totalDoorDurationBW10AND60 != 0 ? totalDoorDurationBW10AND60 : totalDoorOpen >= 0 ? 'N/A' : totalDoorDurationBW10AND60;
					rec.DoorDurationBW60AND300 = totalDoorDurationBW60AND300 != 0 ? totalDoorDurationBW60AND300 : totalDoorOpen >= 0 ? 'N/A' : totalDoorDurationBW60AND300;
					rec.DoorDurationMoreThen300 = totalDoorDurationMoreThen300 != 0 ? totalDoorDurationMoreThen300 : totalDoorOpen >= 0 ? 'N/A' : totalDoorDurationMoreThen300;

					records.push(rec);
				}
			} else if (callBack.sort[0].EventDate.order === "asc") {
				var from = callBack.from;
				var to = callBack.from + callBack.size > groupTerm.buckets.length ? groupTerm.buckets.length : callBack.from + callBack.size
				total = groupTerm.buckets.length;
				for (var j = from; j < to; j++) {
					if (j < 0) {
						continue;
					}
					var record = groupTerm.buckets[j];
					var rec = {};
					rec.EventDate = record.key_as_string;
					var collectionItem = record.tops.hits.hits;
					var assetTotal = record.Asset.buckets;
					rec.AssetSerialNumber = collectionItem.length > 0 ? collectionItem[0]._source.AssetSerialNumber : "";
					rec.AssetTypeCapacity = 0;
					rec.AssetCount = assetTotal.length;

					if (rec.AssetCount) {
						assetTotal.forEach(function (bucket) {
							rec.AssetTypeCapacity += bucket.tops.hits.hits[0]._source.AssetTypeCapacity
						});
					}
					var totalDoorOpen = 0;
					var totalDoorDurationLessThen10 = 0;
					var totalDoorDurationBW10AND60 = 0;
					var totalDoorDurationBW60AND300 = 0;
					var totalDoorDurationMoreThen300 = 0;

					for (var i = 0, len = collectionItem.length; i < len; i++) {
						var duration = collectionItem[i]._source.SumOfDoorOpenDuration;
						totalDoorOpen += collectionItem[i]._source.SumOfDoorCount;

						if (duration > 0 && duration < 10) {
							totalDoorDurationLessThen10++;
						} else if (duration >= 10 && duration <= 60) {
							totalDoorDurationBW10AND60++;
						} else if (duration > 60 && duration <= 300) {
							totalDoorDurationBW60AND300++;
						} else if (duration > 300) {
							totalDoorDurationMoreThen300++;
						}
					}
					rec.TotalDoorOpen = totalDoorOpen;
					rec.DoorDurationLessThen10 = totalDoorDurationLessThen10 != 0 ? totalDoorDurationLessThen10 : totalDoorOpen >= 0 ? 'N/A' : totalDoorDurationLessThen10;
					rec.DoorDurationBW10AND60 = totalDoorDurationBW10AND60 != 0 ? totalDoorDurationBW10AND60 : totalDoorOpen >= 0 ? 'N/A' : totalDoorDurationBW10AND60;
					rec.DoorDurationBW60AND300 = totalDoorDurationBW60AND300 != 0 ? totalDoorDurationBW60AND300 : totalDoorOpen >= 0 ? 'N/A' : totalDoorDurationBW60AND300;
					rec.DoorDurationMoreThen300 = totalDoorDurationMoreThen300 != 0 ? totalDoorDurationMoreThen300 : totalDoorOpen >= 0 ? 'N/A' : totalDoorDurationMoreThen300;

					records.push(rec);
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

Object.assign(SmartDeviceDoor.prototype, {
	index: 'cooler-iot-asseteventdatasummary',
	type: 'AssetEventDataSummary',
	propertyDefs: ElasticListBase.assignPropertyDefs([
		"DoorOpen",
		"SumOfDoorOpenDuration",
		"SmartDeviceId",
		"GatewayId",
		"DeviceSerial",
		"GatewayMac",
		"GatewaySerialNumber",
		"EventId",
		"EventDate",
		"CreatedOn",
		"AssetId",
		"ClientId",
		"CountryId",
		"StateId",
		"LocationId",
		"City",
		"TimeZoneId",
		'AssetSerialNumber',
		"AssetTypeCapacity"
	]),
	sort: [{
		field: 'EventDate',
		dir: 'desc'
	}],
	dateFilter: 'EventDate'
});

module.exports = SmartDeviceDoor;