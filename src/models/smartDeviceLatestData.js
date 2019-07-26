"use strict";

var ElasticListBase = require('./elasticListBase'),
	util = require('../util');

class SmartDeviceLatestData extends ElasticListBase {
	customizeQuery(body, params) {
		var bool = body.query.bool;
		var must = bool.must_not || [];
		must.push({
			"term": {
				"IsFromHealth": true
			}
		});
		bool.must = must;
		if (params.lastDataReceived) {
			if (params.lastDataReceived == 1) {
				util.applyDateFilter(params, bool, this.dateFilter, false, false, true);
				if (!params.daysDoor) {
					params.daysDoor = params.totalDays
				}
			} else if (params.lastDataReceived == 2) {
				util.applyDateFilter(params, bool, this.dateFilter, false, false, false);
				if (!params.daysDoor) {
					params.daysDoor = params.totalDays
				}
			}
		}
	}
};

Object.assign(SmartDeviceLatestData.prototype, {
	index: 'cooler-iot-asseteventdatasummary',
	type: 'AssetEventDataSummary',
	propertyDefs: ElasticListBase.assignPropertyDefs([
		"EventDate",
		"AssetId",
		"LocationId"
	]),
	dateFilter: 'EventDate',
	softDelete: null
});

module.exports = SmartDeviceLatestData;