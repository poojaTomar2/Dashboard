"use strict";

var ElasticListBase = require('./elasticListBase'),
	util = require('../util');
var moment = require('moment');

class smartDeviceAssetTypeCapacityThreshold extends ElasticListBase {
	customizeQuery(body, params) {
		var bool = body.query.bool;
		var mustNot = bool.must_not || [];
		var AssetTypeCapacityThresholdCountry = params.AssetTypeCapacityThresholdCountry.toLowerCase();;
		//var AssetTypeCapacityClient = params.AssetTypeCapacityClient;

		body.aggs = {
			"tops": {
				"top_hits": {
					"size": 1000,
					"_source": {
						"includes": [
							"AssetTypeCapacityId",
							"Last30DayDoorThresold",
							"SalesHierarchyId"
						]
					}
				}
			}

		}
		var countryname = {
			"term": {
				"Country": AssetTypeCapacityThresholdCountry
			}
		};
		body.query.bool.filter.push(countryname);
	}
};

Object.assign(smartDeviceAssetTypeCapacityThreshold.prototype, {
	index: 'cooler-iot-saleshierarchyassettypecapacitythreshold',
	type: 'SalesHierarchyAssetTypeCapacityThreshold',
	propertyDefs: ElasticListBase.assignPropertyDefs([
		"FirstName",
		"ClientId",
		"IsDeleted"
	]),
	softDelete: null
});

module.exports = smartDeviceAssetTypeCapacityThreshold;