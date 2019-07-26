"use strict";

var ElasticListBase = require('./elasticListBase'),
	util = require('../util');
var moment = require('moment');

class smartDeviceAssetTypeCapacity extends ElasticListBase {
	customizeQuery(body, params) {
		var bool = body.query.bool;
		var mustNot = bool.must_not || [];
		//var AssetTypeCapacityClient = params.AssetTypeCapacityClient;
		// var AssetTypeCapacity = {
		// 	"filter": {
		// 		"bool": {
		// 			"must": [{
		// 				"term": {
		// 					"IsDeleted": false
		// 				}
		// 			}]
		// 		}
		// 	}
		// };
		body.aggs = {
			"tops": {
				"top_hits": {
					"size": 1000,
					"_source": {
						"includes": [
							"MinCapacity",
							"MaxCapacity",
							"Range"
						]
					}
				}
			}

		}
		// var clientQuery = {
		// 	"term": {
		// 		"ClientId": AssetTypeCapacityClient
		// 	}
		// };
		// AssetTypeCapacity.filter.bool.must.push(clientQuery);
	}
};

Object.assign(smartDeviceAssetTypeCapacity.prototype, {
	index: 'cooler-iot-assettypecapacity',
	type: 'AssetTypeCapacity',
	propertyDefs: ElasticListBase.assignPropertyDefs([
		"ClientId"
	]),
	softDelete: "IsDeleted"
});

module.exports = smartDeviceAssetTypeCapacity;