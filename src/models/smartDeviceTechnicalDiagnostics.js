"use strict";

var ElasticListBase = require('./elasticListBase'),
	util = require('../util');

class SmartDeviceTechnicalDiagnostics extends ElasticListBase {
	customizeQuery(body, params) {
		var bool = body.query.bool;
		var must = bool.must_not || [];
		must.push({
			"term": {
				"IsFromEvent": true
			}
		});
		bool.must = must;
		var mustNot = bool.must_not || [];

		bool.mustNot = mustNot;

		var range;

		if (params.CompressorBand) {
			if (body.aggs) {
				body.aggs["CompressorData"] = {
					"terms": {
						"field": "AssetId",
						"size": 100000
					},
					"aggs": {
						"CompressorDuration": {
							"filter": {
								"bool": {
									"filter": []
								}
							},
							"aggs": {
								"CompressorDuration": {
									"sum": {
										"field": "SumOfCompressorDuration"
									}
								}
							}
						}
					}
				}
			} else {
				body.aggs = {
					"CompressorData": {
						"terms": {
							"field": "AssetId",
							"size": 100000
						},
						"aggs": {
							"CompressorDuration": {
								"filter": {
									"bool": {
										"filter": []
									}
								},
								"aggs": {
									"CompressorDuration": {
										"sum": {
											"field": "SumOfCompressorDuration"
										}
									}
								}
							}
						}
					}
				};
			}
		}

		if (params.FanBand) {
			if (body.aggs) {
				body.aggs["FanData"] = {
					"terms": {
						"field": "AssetId",
						"size": 100000
					},
					"aggs": {
						"FanDuration": {
							"filter": {
								"bool": {
									"filter": []
								}
							},
							"aggs": {
								"FanDuration": {
									"sum": {
										"field": "SumOfFanDuration"
									}
								}
							}
						}
					}
				}
			} else {
				body.aggs = {
					"FanData": {
						"terms": {
							"field": "AssetId",
							"size": 100000
						},
						"aggs": {
							"FanDuration": {
								"filter": {
									"bool": {
										"filter": []
									}
								},
								"aggs": {
									"FanDuration": {
										"sum": {
											"field": "SumOfFanDuration"
										}
									}
								}
							}
						}
					}
				};
			}
		}

		util.applyDateFilter(params, bool, this.dateFilter);
		if (!params.days) {
			params.days = params.totalDays
		}
	}
};

Object.assign(SmartDeviceTechnicalDiagnostics.prototype, {
	index: 'cooler-iot-asseteventdatasummary',
	type: 'AssetEventDataSummary',
	propertyDefs: ElasticListBase.assignPropertyDefs([
		"SmartDeviceId",
		"GatewayId",
		"DeviceSerial",
		"GatewayMac",
		"GatewaySerialNumber",
		"EventId",
		"StartEventTime",
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

module.exports = SmartDeviceTechnicalDiagnostics;