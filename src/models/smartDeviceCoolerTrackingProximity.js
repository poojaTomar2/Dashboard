"use strict";

var ElasticListBase = require('./elasticListBase'),
	util = require('../util');
var moment = require('moment');

class SmartDeviceCoolerTrackingProximity extends ElasticListBase {
	customizeQuery(body, params) {
		var bool = body.query.bool;
		var mustNot = bool.must_not || [];
		var CoolerTrackingThreshold = params.CoolerTrackingThreshold - 1;
		//var CoolerTrackingDisplacementThreshold = params.CoolerTrackingDisplacementThreshold;
		// mustNot.push({
		// 	"term": {
		// 		"EventTime": "0001-01-01T00:00:00"
		// 	}
		// });
		bool.mustNot = mustNot;
		if (params.coolerTrackingProximity) {

			var ProximityNotVisited = {
				"filter": {
					"bool": {
						"must": [{
								"match": {
									"IsProximity": true
								}
							},
							{
								"match": {
									"IsGateway": false
								}
							}
						]
					}
				},
				"aggs": {
					"Assets": {
						"terms": {
							"field": "AssetId",
							"size": 100000
						}
					}
				}
			};

			var ProximityLocationConfirmed = {
				"filter": {
					"bool": {
						"must": [{
								"match": {
									"IsProximity": true
								}
							},
							{
								"match": {
									"IsGateway": false
								}
							}
						]
					}
				},
				"aggs": {
					"Assets": {
						"terms": {
							"field": "AssetId",
							"size": 100000
						}
					}
				}
			};


			var endDate = params.endDate;
			if (CoolerTrackingThreshold == null) {
				CoolerTrackingThreshold = 89;
			} else {
				var CoolerTrackingThr = CoolerTrackingThreshold;
				CoolerTrackingThreshold = CoolerTrackingThr;
			}
			var CoolerTrackingThresholdEnd = CoolerTrackingThreshold-1;
			var startDate = moment(endDate).add(-CoolerTrackingThreshold, 'days').format('YYYY-MM-DD[T23:59:59]'); //find perivous date
			var startDateend = moment(endDate).add(-CoolerTrackingThresholdEnd, 'days').format('YYYY-MM-DD[T00:00:00]'); //find perivous date
			var endDate = moment(endDate).format('YYYY-MM-DD[T23:59:59]');
			var datedevice = { //object to insert date
				"range": {
					"LatestDeviceDate": {
						"from": startDateend,
						"to": endDate
					}
				}
			};

			var datedevice1 = { //object to insert date
				"range": {
					"LatestDeviceDate": {
						"lte": startDate
					}
				}
			};

			ProximityNotVisited.filter.bool.must.push(datedevice1);

			ProximityLocationConfirmed.filter.bool.must.push(datedevice);

			if (body.aggs) {
				if (params.coolerTrackingProximity.indexOf('1') != -1) {
					body.aggs["ProximityNotVisited"] = ProximityNotVisited;
				}
				if (params.coolerTrackingProximity.indexOf('4') != -1) {
					body.aggs["ProximityLocationConfirmed"] = ProximityLocationConfirmed;
				}

			} else {
				body.aggs = {
					"ProximityNotVisited": ProximityNotVisited
				};
				body.aggs = {
					"ProximityLocationConfirmed": ProximityLocationConfirmed
				};
			}

		}
	}
};

Object.assign(SmartDeviceCoolerTrackingProximity.prototype, {
	index: 'cooler-iot-asset',
	type: 'Asset',
	propertyDefs: ElasticListBase.assignPropertyDefs([
		"EventTime",
		"AssetId",
		"LocationId"
	]),
	softDelete: null
});

module.exports = SmartDeviceCoolerTrackingProximity;