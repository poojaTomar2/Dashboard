"use strict";

var ElasticListBase = require('./elasticListBase'),
	util = require('../util');

class ImberaAlert extends ElasticListBase {
	customizeQuery(body, params) {
		var bool = body.query.bool;

		var mustNot = bool.must_not || [];
		mustNot.push({
			"terms": {
				"AlarmTypeId": [8]
			}
		});
		bool.mustNot = mustNot;

		if (params.fromOutletScreen) {
			util.applyDateFilter(params, bool, this.dateFilter);
		}
	}

	listResultProcessor(resp, callBack) {
		var records = [],
			total = resp.hits.total;

		var alert = resp.hits.hits;
		alert.forEach(function (record) {
			records.push(record._source);
		}, this);
		return {
			success: true,
			records: records,
			recordCount: total
		};
	}
};

Object.assign(ImberaAlert.prototype, {
	index: 'cooler-iot-smartdevicealarmtyperecord',
	type: 'SmartDeviceAlarmTypeRecord',
	sort: [{
		field: '_id',
		dir: 'desc'
	}],
	propertyDefs: ElasticListBase.assignPropertyDefs([
		'AssetId',
		'AlarmTypeId',
		'AlertValue',
		'StartEventTime',
		'EndEventTime',
		"IsAlertOpen",
		'CreatedOn',
		'Duration',
		'ModifiedByUserId',
		'ModifiedOn',
		'ClientId',
		'LocationId',
		'AssetSerialNumber',
		'AssetPingDateTime',
		'AlarmType',
		'Location',
		'LocationCode',
		'Street',
		'Street2',
		'Street3',
		'PostalCode',
		'City',
		'State',
		'Country'
	]),
	dateFilter: 'StartEventTime',
	softDelete: null
});

module.exports = ImberaAlert;