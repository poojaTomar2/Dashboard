"use strict";

var ElasticListBase = require('./elasticListBase'),
	util = require('../util');

class TechnicalDiagnostics extends ElasticListBase {
	customizeQuery(body, params) {
		var bool = body.query.bool;

		var mustNot = bool.must_not || [];

		bool.mustNot = mustNot;

		body.aggs = {
			"HealthData": {
				"date_histogram": {
					"field": "EventDate",
					"interval": "1d",
					"min_doc_count": 1
				},
				"aggs": {
					"tops": {
						"top_hits": {
							"size": 1,
							"_source": {
								"includes": [
									"AssetId",
									"AssetSerialNumber"
								]
							}
						}
					},
					"EvaporatorTemperature": {
						"filter": {
							"bool": {
								"must": [{
									"term": {
										"IsFromHealth": true
									}
								}]
							}
						},
						"aggs": {
							"HealthMin": {
								"min": {
									"field": "MinEvaporatorTemperature"
								}
							},
							"HealthMax": {
								"max": {
									"field": "MaxEvaporatorTemperature"
								}
							},
							"HealthMedian": {
								"percentiles": {
									"field": "AverageEvaporatorTemperature",
									"percents": [
										50
									]
								}
							}
						}
					},
					"CondensorTemperature": {
						"filter": {
							"bool": {
								"must": [{
									"term": {
										"IsFromHealth": true
									}
								}]
							}
						},
						"aggs": {
							"HealthMin": {
								"min": {
									"field": "MinCondensorTemperature"
								}
							},
							"HealthMax": {
								"max": {
									"field": "MaxCondensorTemperature"
								}
							},
							"HealthMedian": {
								"percentiles": {
									"field": "AverageCondensorTemperature",
									"percents": [
										50
									]
								}
							}
						}
					},
					"AmbientTemperature": {
						"filter": {
							"bool": {
								"must": [{
									"term": {
										"IsFromHealth": true
									}
								}]
							}
						},
						"aggs": {
							"HealthMin": {
								"min": {
									"field": "MinTemperature"
								}
							},
							"HealthMax": {
								"max": {
									"field": "MaxTemperature"
								}
							},
							"HealthMedian": {
								"percentiles": {
									"field": "AverageTemperature",
									"percents": [
										50
									]
								}
							}
						}
					}
				},
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
			var groupTerm = resp.aggregations.HealthData;

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
					rec.AssetSerialNumber = '';
					rec.AssetId = 0;

					var minCompressorTempratureForDay = 0;
					var maxCompressorTempratureForDay = 0;
					var medianCompressorTempratureForDay = 0;
					var MinEvaporatorTempratureForDay = 0;
					var MaxEvaporatorTempratureForDay = 0;
					var MedianEvaporatorTempratureForDay = 0;
					var MinAmbientTempratureForDay = 0;
					var MaxAmbientTempratureForDay = 0;
					var MedianAmbientTempratureForDay = 0;

					var tempValues = [];

					var collectionItem = record.tops.hits.hits;
					if (collectionItem.length > 0) {
						rec.AssetSerialNumber = collectionItem[0]._source.AssetSerialNumber;
						rec.AssetId = collectionItem[0]._source.AssetId;
					}
					rec.MinCompressorTempratureForDay = (record.CondensorTemperature.HealthMin.value != null) ? record.CondensorTemperature.HealthMin.value : 'N/A';
					rec.MaxCompressorTempratureForDay = (record.CondensorTemperature.HealthMax.value != null) ? record.CondensorTemperature.HealthMax.value : 'N/A';
					rec.MedianCompressorTempratureForDay = !isNaN(record.CondensorTemperature.HealthMedian.values["50.0"]) ? record.CondensorTemperature.HealthMedian.values["50.0"].toFixed(1) : 'N/A';
					rec.MinEvaporatorTempratureForDay = (record.EvaporatorTemperature.HealthMin.value != null) ? record.EvaporatorTemperature.HealthMin.value : 'N/A';
					rec.MaxEvaporatorTempratureForDay = (record.EvaporatorTemperature.HealthMax.value != null) ? record.EvaporatorTemperature.HealthMax.value : 'N/A';
					rec.MedianEvaporatorTempratureForDay = !isNaN(record.EvaporatorTemperature.HealthMedian.values["50.0"]) ? record.EvaporatorTemperature.HealthMedian.values["50.0"].toFixed(1) : 'N/A';
					rec.MinAmbientTempratureForDay = record.AmbientTemperature.HealthMin.value != null ? record.AmbientTemperature.HealthMin.value : 'N/A';
					rec.MaxAmbientTempratureForDay = record.AmbientTemperature.HealthMax.value != null ? record.AmbientTemperature.HealthMax.value : 'N/A';
					rec.MedianAmbientTempratureForDay = !isNaN(record.AmbientTemperature.HealthMedian.values["50.0"]) ? record.AmbientTemperature.HealthMedian.values["50.0"].toFixed(1) : 'N/A';

					records.push(rec);
				}
			} else if (callBack.sort[0].EventDate.order === "asc") {
				var from = callBack.from
				var to = callBack.from + callBack.size > groupTerm.buckets.length ? groupTerm.buckets.length : callBack.from + callBack.size
				total = groupTerm.buckets.length;

				for (var j = from; j < to; j++) {
					if (j < 0) {
						continue;
					}
					var record = groupTerm.buckets[j];
					var rec = {};
					rec.EventDate = record.key_as_string;
					rec.AssetSerialNumber = '';
					rec.AssetId = 0;

					var minCompressorTempratureForDay = 0;
					var maxCompressorTempratureForDay = 0;
					var medianCompressorTempratureForDay = 0;
					var MinEvaporatorTempratureForDay = 0;
					var MaxEvaporatorTempratureForDay = 0;
					var MedianEvaporatorTempratureForDay = 0;
					var MinAmbientTempratureForDay = 0;
					var MaxAmbientTempratureForDay = 0;
					var MedianAmbientTempratureForDay = 0;

					var tempValues = [];

					var collectionItem = record.tops.hits.hits;
					if (collectionItem.length > 0) {
						rec.AssetSerialNumber = collectionItem[0]._source.AssetSerialNumber;
						rec.AssetId = collectionItem[0]._source.AssetId;
					}
					rec.MinCompressorTempratureForDay = (record.CondensorTemperature.HealthMin.value != null) ? record.CondensorTemperature.HealthMin.value : 'N/A';
					rec.MaxCompressorTempratureForDay = (record.CondensorTemperature.HealthMax.value != null) ? record.CondensorTemperature.HealthMax.value : 'N/A';
					rec.MedianCompressorTempratureForDay = !isNaN(record.CondensorTemperature.HealthMedian.values["50.0"]) ? record.CondensorTemperature.HealthMedian.values["50.0"].toFixed(1) : 'N/A';
					rec.MinEvaporatorTempratureForDay = (record.EvaporatorTemperature.HealthMin.value != null) ? record.EvaporatorTemperature.HealthMin.value : 'N/A';
					rec.MaxEvaporatorTempratureForDay = (record.EvaporatorTemperature.HealthMax.value != null) ? record.EvaporatorTemperature.HealthMax.value : 'N/A';
					rec.MedianEvaporatorTempratureForDay = !isNaN(record.EvaporatorTemperature.HealthMedian.values["50.0"]) ? record.EvaporatorTemperature.HealthMedian.values["50.0"].toFixed(1) : 'N/A';
					rec.MinAmbientTempratureForDay = record.AmbientTemperature.HealthMin.value != null ? record.AmbientTemperature.HealthMin.value : 'N/A';
					rec.MaxAmbientTempratureForDay = record.AmbientTemperature.HealthMax.value != null ? record.AmbientTemperature.HealthMax.value : 'N/A';
					rec.MedianAmbientTempratureForDay = !isNaN(record.AmbientTemperature.HealthMedian.values["50.0"]) ? record.AmbientTemperature.HealthMedian.values["50.0"].toFixed(1) : 'N/A';

					records.push(rec);
				}
			}

			return {
				success: true,
				records: records,
				recordCount: total
			};
		}
	}
};

Object.assign(TechnicalDiagnostics.prototype, {
	index: 'cooler-iot-asseteventdatasummary',
	type: 'AssetEventDataSummary',
	propertyDefs: ElasticListBase.assignPropertyDefs([
		"LightIntensity",
		"Temperature",
		"Humidity",
		"SoundLevel",
		"IsDoorOpen",
		"EventTypeId",
		"PowerStatusId",
		"BatteryLevel",
		"SmartDeviceId",
		"GatewayId",
		"DeviceSerial",
		"CondensorTemperature",
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
		'AssetSerialNumber'
	]),
	sort: [{
		field: 'EventDate',
		dir: 'desc'
	}],
	softDelete: null,
	dateFilter: 'EventDate'
});

module.exports = TechnicalDiagnostics;