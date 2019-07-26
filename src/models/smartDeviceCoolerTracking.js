"use strict";

var ElasticListBase = require('./elasticListBase'),
	util = require('../util');
var moment = require('moment');

class SmartDeviceCoolerTracking extends ElasticListBase {
	customizeQuery(body, params) {
		var bool = body.query.bool;
		var mustNot = bool.must_not || [];
		var CoolerTrackingThreshold = params.CoolerTrackingThreshold - 1;
		var CoolerTrackingDisplacementThreshold = params.CoolerTrackingDisplacementThreshold;
		mustNot.push({
			"term": {
				"GatewayLastPing": "0001-01-01T00:00:00"
			}
		});
		bool.mustNot = mustNot;
		if (params.coolerTracking) {

			var AlwaysNotTransmitting = {
				"filter": {
					"bool": {
						"must": [{
							"match": {
								"IsGateway": true
							}
						}]
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

			var AlwaysWrongLocation = {
				"filter": {
					"bool": {
						"must": [{
							"match": {
								"IsGateway": true
							}
						}]
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
			var AlwaysLocationAsExpected = {
				"filter": {
					"bool": {
						"must": [{
							"match": {
								"IsGateway": true
							}
						}]
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


			var displacementless = {
				"range": {
					"Displacement": {
						"lt": CoolerTrackingDisplacementThreshold / 1000
					}
				}
			};
			var displacementgreater = {
				"range": {
					"Displacement": {
						"gte": CoolerTrackingDisplacementThreshold / 1000
					}
				}
			};

			AlwaysLocationAsExpected.filter.bool.must.push(displacementless);
			AlwaysWrongLocation.filter.bool.must.push(displacementgreater);

			var endDate = params.endDate;
			if (CoolerTrackingThreshold == null) {
				var CoolerTrackingThreshold = 89;
			} else {
				var CoolerTrackingThr = CoolerTrackingThreshold;
				var CoolerTrackingThreshold = CoolerTrackingThr;
			}
			var CoolerTrackingThresholdEnd = CoolerTrackingThreshold - 1;
			var startDate = moment(endDate).add(-CoolerTrackingThreshold, 'days').format('YYYY-MM-DD[T23:59:59]'); //find perivous date
			var startDateend = moment(endDate).add(-CoolerTrackingThresholdEnd, 'days').format('YYYY-MM-DD[T00:00:00]'); //find perivous date
			var endDate = moment(endDate).format('YYYY-MM-DD[T23:59:59]');
			var dategateway = { //object to insert date
				"range": {
					"GatewayLastPing": {
						"from": startDateend,
						"to": endDate
					}
				}
			};

			var dategateway1 = { //object to insert date
				"range": {
					"GatewayLastPing": {
						"lte": startDate
					}
				}
			};

			AlwaysNotTransmitting.filter.bool.must.push(dategateway1);

			AlwaysWrongLocation.filter.bool.must.push(dategateway);

			AlwaysLocationAsExpected.filter.bool.must.push(dategateway);

			if (body.aggs) {
				if (params.coolerTracking.indexOf('1') != -1) {
					body.aggs["AlwaysNotTransmitting"] = AlwaysNotTransmitting;
				}
				if (params.coolerTracking.indexOf('2') != -1) {
					body.aggs["AlwaysWrongLocation"] = AlwaysWrongLocation;
				}

				if (params.coolerTracking.indexOf('3') != -1) {
					body.aggs["AlwaysLocationAsExpected"] = AlwaysLocationAsExpected;
				}

			} else {
				body.aggs = {
					"AlwaysNotTransmitting": AlwaysNotTransmitting
				};
				body.aggs = {
					"AlwaysWrongLocation": AlwaysWrongLocation
				};
				body.aggs = {
					"AlwaysLocationAsExpected": AlwaysLocationAsExpected
				};
			}

		}

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
			var CoolerTrackingThresholdEnd = CoolerTrackingThreshold - 1;
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

Object.assign(SmartDeviceCoolerTracking.prototype, {
	index: 'cooler-iot-asset',
	type: 'Asset',
	propertyDefs: ElasticListBase.assignPropertyDefs([
		"EventTime",
		"AssetId",
		"LocationId"
	]),
	softDelete: null
});

module.exports = SmartDeviceCoolerTracking;