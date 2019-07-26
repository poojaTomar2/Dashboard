"use strict";

var ElasticListBase = require('./elasticListBase'),
	util = require('../util');

class SmartDevicePowerRecord extends ElasticListBase {
	customizeQuery(body, params) {
		var bool = body.query.bool;
		var must = bool.must_not || [];
		must.push({
			"term": {
				"IsFromPower": true
			}
		});
		bool.must = must;

		var range;

		//power hours off
		if (params.fromPowerScreen || params.OperationalIssuesPower == "5" || params.OperationalIssuesPower == "6") {

			if (body.aggs) {
				body.aggs["PowerData"] = {
					"terms": {
						"field": "AssetId",
						"size": 100000
					},
					"aggs": {
						"PowerOffDuration": {
							"sum": {
								"field": "SumOfPowerOffDuration"
							}
						}
					}
				}
			} else {
				body.aggs = {
					"PowerData": {
						"terms": {
							"field": "AssetId",
							"size": 100000
						},
						"aggs": {
							"PowerOffDuration": {
								"sum": {
									"field": "SumOfPowerOffDuration"
								}
							}
						}
					}
				};
			}
			util.applyDateFilter(params, bool, this.dateFilter);
			if (!params.daysPower) {
				params.daysPower = params.totalDays
			}
		}

	}
};

Object.assign(SmartDevicePowerRecord.prototype, {
	index: 'cooler-iot-asseteventdatasummary',
	type: 'AssetEventDataSummary',
	propertyDefs: ElasticListBase.assignPropertyDefs([
		"PowerOn",
		"EventIdPowerOn",
		"PowerOff",
		"EventIdPowerOff",
		"BatteryLevel",
		"PowerOnDuration",
		"PowerOffDuration",
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

module.exports = SmartDevicePowerRecord;