"use strict";

var ElasticListBase = require('./elasticListBase'),
	util = require('../util');

class SmartDeviceHealth extends ElasticListBase {
	customizeQuery(body, params) {
		var bool = body.query.bool;

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
					"Temperature": {
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
									"field": "MinAmbientTemperature"
								}
							},
							"HealthMax": {
								"max": {
									"field": "MaxAmbientTemperature"
								}
							},
							"HealthMedian": {
								"percentiles": {
									"field": "AverageAmbientTemperature",
									"percents": [
										50
									]
								}
							}
						}
					},
					"Light": {
						"filter": {
							"bool": {
								"should": [{
										"term": {
											"DeviceLightStatus": "mediumbrightness"
										}
									},
									{
										"term": {
											"DeviceLightStatus": "fulllightbrightness"
										}
									}
								],
								"must": [{
									"term": {
										"IsFromHealth": true
									}
								}]
							}
						},
						"aggs": {
							"HoursLightOn": {
								"sum": {
									"field": "SumOfHealthInterval"
								}
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

					var minTempratureForDay = 'N/A';
					var maxTempratureForDay = 'N/A';
					var medianTempratureForDay = 'N/A';
					var lightOnHours = 'N/A';
					var tempValues = [];
					var lightValues = [];
					var minCompressorTempratureForDay = 'N/A';
					var maxCompressorTempratureForDay = 'N/A';
					var medianCompressorTempratureForDay = 'N/A';
					var minEvaporatorTempratureForDay = 'N/A';
					var maxEvaporatorTempratureForDay = 'N/A';
					var medianEvaporatorTempratureForDay = 'N/A';
					var MinAmbientTempratureForDay = 'N/A';
					var MaxAmbientTempratureForDay = 'N/A';
					var MedianAmbientTempratureForDay = 'N/A';


					var collectionItem = record.tops.hits.hits;
					if (collectionItem.length > 0) {
						rec.AssetSerialNumber = collectionItem[0]._source.AssetSerialNumber;
						rec.AssetId = collectionItem[0]._source.AssetId;
					}
					rec.MinTempratureForDay = record.Temperature.HealthMin.value != null ? record.Temperature.HealthMin.value : 'N/A';
					rec.MaxTempratureForDay = record.Temperature.HealthMax.value != null ? record.Temperature.HealthMax.value : 'N/A';
					rec.MedianTempratureForDay = !isNaN(record.Temperature.HealthMedian.values["50.0"]) ? record.Temperature.HealthMedian.values["50.0"].toFixed(1) : 'N/A';
					rec.LightOnHours = record.Light.HoursLightOn.value > 0 ? (record.Light.HoursLightOn.value / 60).toFixed(0) : 'N/A';
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
					rec.AssetSerialNumber = '';
					rec.AssetId = 0;

					var minTempratureForDay = 'N/A';
					var maxTempratureForDay = 'N/A';
					var medianTempratureForDay = 'N/A';
					var lightOnHours = 'N/A';
					var tempValues = [];
					var lightValues = [];
					var minCompressorTempratureForDay = 'N/A';
					var maxCompressorTempratureForDay = 'N/A';
					var medianCompressorTempratureForDay = 'N/A';
					var minEvaporatorTempratureForDay = 'N/A';
					var maxEvaporatorTempratureForDay = 'N/A';
					var medianEvaporatorTempratureForDay = 'N/A';
					var MinAmbientTempratureForDay = 'N/A';
					var MaxAmbientTempratureForDay = 'N/A';
					var MedianAmbientTempratureForDay = 'N/A';


					var collectionItem = record.tops.hits.hits;
					if (collectionItem.length > 0) {
						rec.AssetSerialNumber = collectionItem[0]._source.AssetSerialNumber;
						rec.AssetId = collectionItem[0]._source.AssetId;
					}
					rec.MinTempratureForDay = record.Temperature.HealthMin.value != null ? record.Temperature.HealthMin.value : 'N/A';
					rec.MaxTempratureForDay = record.Temperature.HealthMax.value != null ? record.Temperature.HealthMax.value : 'N/A';
					rec.MedianTempratureForDay = !isNaN(record.Temperature.HealthMedian.values["50.0"]) ? record.Temperature.HealthMedian.values["50.0"].toFixed(1) : 'N/A';
					rec.LightOnHours = record.Light.HoursLightOn.value > 0 ? (record.Light.HoursLightOn.value / 60).toFixed(0) : 'N/A';
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

		}
		return {
			success: true,
			records: records,
			recordCount: total
		};
	}
};

Object.assign(SmartDeviceHealth.prototype, {
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
		"GatewayMac",
		"GatewaySerialNumber",
		"CondensorTemperature",
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

module.exports = SmartDeviceHealth;