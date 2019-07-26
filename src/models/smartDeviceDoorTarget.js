"use strict";

var ElasticListBase = require('./elasticListBase'),
	util = require('../util');

class SmartDeviceDoorTarget extends ElasticListBase {
	customizeQuery(body, params) {
		var bool = body.query.bool;
		var must = bool.must_not || [];
		must.push({
			"term": {
				"IsFromDoor": true
			}
		});
		bool.must = must;
		if (params.fromDoorScreen) {
			if (body.aggs) {
				body.aggs["AssetIds"] = {
					"terms": {
						"field": "LocationId",
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
					"AssetIds": {
						"terms": {
							"field": "LocationId",
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
			util.applyDateFilter(params, bool, this.dateFilter);
			if (!params.daysDoor) {
				params.daysDoor = params.totalDays
			}
		} else if (params.doorDataSelected) {
			util.applyDateFilter(params, bool, this.dateFilter);
			if (!params.daysDoor) {
				params.daysDoor = params.totalDays
			}
		}
	}
};

Object.assign(SmartDeviceDoorTarget.prototype, {
	index: 'cooler-iot-asseteventdatasummary',
	type: 'AssetEventDataSummary',
	propertyDefs: ElasticListBase.assignPropertyDefs([
		"DoorOpen",
		"DoorOpenDuration",
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
		"AssetCapacity"
	]),
	sort: [{
		field: 'EventDate',
		dir: 'desc'
	}],
	dateFilter: 'EventDate'
});

module.exports = SmartDeviceDoorTarget;