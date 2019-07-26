"use strict";

var ElasticListBase = require('./elasticListBase'),
	util = require('../util');

class SmartDeviceHealthInterruption extends ElasticListBase {
	customizeQuery(body, params) {
		var bool = body.query.bool;
		var must = bool.must_not || [];
		must.push({
			"term": {
				"IsFromHealth": true
			}
		});
		bool.must = must;
		bool.filter.push({
			"terms": {
				"AssetId": params.NoDataAssetIds
			}
		});

		if (body.aggs) {
			body.aggs["AssetIds"] = {
				"terms": {
					"field": "AssetId",
					"size": 100000
				}
			}
		}
		util.applyDateFilter(params, bool, this.dateFilter);
	}
};

Object.assign(SmartDeviceHealthInterruption.prototype, {
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
		'AssetSerialNumber'
	]),
	softDelete: null,
	dateFilter: 'EventDate'
});

module.exports = SmartDeviceHealthInterruption;