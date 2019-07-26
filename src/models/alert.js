"use strict";

var ElasticListBase = require('./elasticListBase'),
	util = require('../util');

class Alert extends ElasticListBase {
	customizeQuery(body, params) {
		var bool = body.query.bool;
		bool.filter.push({
			"term": {
				"IsDeleted": false
			}
		});
		var priorityTerm = {
			"terms": {
				"field": "PriorityId",
				"size": 10000
			}
		};
		if (body.aggs) {
			body.aggs["PriorityCount"] = priorityTerm;
		} else {
			body.aggs = {
				"PriorityCount": priorityTerm
			};
		}

		if (params.FromOutletDetail) {
			var index = -1;
			var assetIndex = -1;
			bool.filter.forEach(function (data) {
				index++;
				var asset = JSON.stringify(data);
				if (asset.indexOf("AssetId") >= 0) {
					assetIndex = index;
				}
			});
			if (assetIndex != -1) {
				bool.filter.splice(assetIndex, 1)
			}
		}
		var mustNot = bool.must_not || [];
		mustNot.push({
			"terms": {
				"AlertTypeId": [1, 12, 14, 27, 37]
			}
		});
		bool.mustNot = mustNot;
		if (params.fromOutletScreen) {
			util.applyDateFilter(params, bool, this.dateFilter, params.openAlert);
		}

		if (params.fromOutletScreenDateFilter) {
			util.applyDateFilter(params, bool, this.dateFilter, params.openAlert);
		}

		//console.log(JSON.stringify(body));
	}

	listResultProcessor(resp, callBack) {
		var records = [],
			total = resp.hits.total,
			priorityCount = [];
		if (resp.aggregations) {
			var groupTerm = resp.aggregations.PriorityCount;
			var bucket = groupTerm.buckets;
			bucket.forEach(function (element) {
				priorityCount.push({
					PriorityId: element.key,
					Count: element.doc_count
				});
			}, this);
		}
		var alert = resp.hits.hits;
		alert.forEach(function (record) {
			records.push(record._source);
		}, this);
		return {
			success: true,
			records: records,
			recordCount: total,
			priorityCount: priorityCount
		};
	}
};

Object.assign(Alert.prototype, {
	index: 'cooler-iot-alert',
	type: 'Alert',
	sort: [{
		field: '_id',
		dir: 'desc'
	}],
	propertyDefs: ElasticListBase.assignPropertyDefs([
		'AssetId',
		'AlertTypeId',
		'AlertValue',
		'AlertAt',
		'PriorityId',
		'AlertText',
		'StatusId',
		'ClosedOn',
		'CreatedOn',
		'Tags',
		'IsDeleted',
		'AlertDefinitionId',
		'LastUpdatedOn',
		'AlertAge',
		'AlertDefinitionAgeThreshold',
		'ModifiedByUserId',
		'ModifiedOn',
		'ClientId',
		'LocationId',
		'AssetSerialNumber',
		'Status',
		'Priority',
		'AlertType',
		'Location',
		'LocationCode',
		'Street',
		'Street2',
		'Street3',
		'PostalCode',
		'City',
		'State',
		'Country',
		'SmartDeviceManufacturerId',
		'AssetTypeId',
		'AssetManufacturerId',
		'SmartDeviceTypeId'
	]),
	dateFilter: 'AlertAt'
});

module.exports = Alert;