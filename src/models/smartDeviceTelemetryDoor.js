"use strict";

var ElasticListBase = require('./elasticListBase'),
	util = require('../util');

class smartDeviceTelemetryDoor extends ElasticListBase {
	customizeQuery(body, params) {
		var bool = body.query.bool;

		var must = bool.must || [];
		var mustNot = bool.must_not || [];
		must.push({
			"range": {
				"SumOfDoorCount": {
					"gte": 0
				}
			}
		});
		mustNot.push({
			"term": {
				"SumOfDoorCount": 0
			}
		});
		bool.mustNot = mustNot;
		bool.must = must;

		var range;
		if (params.DeviceDoorStatus || (params.CoolerHealthLowUti && params.CoolerHealthLowUti.indexOf("3") != -1)) {

			if (body.aggs) {
				body.aggs["assets"] = {
					"terms": {
						"field": "AssetId",
						"size": 100000
					},
					"aggs": {
						"DoorCount": {
							"sum": {
								"field": "SumOfDoorCount"
							}
						}
					}
				}
			} else {
				body.aggs = {
					"assets": {
						"terms": {
							"field": "AssetId",
							"size": 100000
						},
						"aggs": {
							"DoorCount": {
								"sum": {
									"field": "SumOfDoorCount"
								}
							}
						}
					}
				};
			}
		}

		if (params.CoolerPerformanceIndex && params.CoolerPerformanceIndex.indexOf("1") != -1) {

			var doorAggs = {
				"terms": {
					"field": "AssetId",
					"size": 100000
				},
				"aggs": {
					"DoorCountDays": {
						"date_histogram": {
							"field": "EventTime",
							"interval": "day",
							"min_doc_count": 1
						}
					},
					"DoorCount": {
						"sum": {
							"field": "DoorCount"
						}
					}
				}
			};

			if (body.aggs) {
				body.aggs["DoorAsset"] = doorAggs;
				body.aggs["AssetCount"] = {
					"cardinality": {
						"field": "AssetId"
					}
				}

			} else {
				body.aggs = {
					"DoorAsset": doorAggs
				};
				body.aggs = {
					"AssetCount": {
						"cardinality": {
							"field": "AssetId"
						}
					}
				};
			}
		}

		util.applyDateFilter(params, bool, this.dateFilter);
		if (!params.daysPower) {
			params.daysPower = params.totalDays
		}
	}
};

Object.assign(smartDeviceTelemetryDoor.prototype, {
	index: 'cooler-iot-asseteventdatasummary',
	type: 'AssetEventDataSummary',
	propertyDefs: ElasticListBase.assignPropertyDefs([
		"SmartDeviceId",
		"GatewayId",
		"DeviceSerial",
		"GatewayMac",
		"GatewaySerialNumber",
		"EventId",
		"EventTime",
		"CreatedOn",
		"AssetId",
		"ClientId",
		"CountryId",
		"StateId",
		"LocationId",
		"City",
		"TimeZoneId",
		"AssetSerialNumber",
		"SmartDeviceManufactureId",
		"OutletTypeId"
	]),
	softDelete: null,
	dateFilter: 'EventDate'
});

module.exports = smartDeviceTelemetryDoor;