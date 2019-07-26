"use strict";

var ElasticListBase = require('./elasticListBase'),
	util = require('../util');

class SmartDeviceHealthRecord extends ElasticListBase {
	customizeQuery(body, params) {
		var bool = body.query.bool;
		if (body.sort) {
			body.sort[0] = {
				"EventTime": {
					"order": "desc"
				}
			};
		}
		var mustNot = bool.must_not || [];
		mustNot.push({
			"terms": {
				"EventTypeId": [10]
			}
		}, {
			"terms": {
				"Temperature": [-999, 999]
			}
		});
		bool.mustNot = mustNot;

		var range;
		var rangeLte;
		var rangeGte;
		var shouldArr = [];
		if (params.fromHealthScreen) {
			if (Array.isArray(params.TempBand)) {
				params.TempBand.forEach(function (ranges) {
					if (ranges.indexOf('*') >= 0) {
						rangeGte = Number(ranges.split('*')[0]);
						rangeLte = Number(ranges.split('*')[1]);
						if (rangeGte == 0 && rangeLte != 0) {
							shouldArr.push({
								"range": {
									"Temperature": {
										"lte": rangeLte
									}
								}
							});
						} else if (rangeGte != 0 && rangeLte == 0) {
							shouldArr.push({
								"range": {
									"Temperature": {
										"gte": rangeGte
									}
								}
							});
						} else {
							shouldArr.push({
								"range": {
									"Temperature": {
										"lte": rangeLte,
										"gte": rangeGte
									}
								}
							});
						}
					}
				});
				bool["filter"].push({
					"bool": {
						"should": shouldArr
					}
				});
			} else if (params.TempBand) {
				if (params.TempBand.indexOf('*') >= 0) {
					rangeGte = Number(params.TempBand.split('*')[0]);
					rangeLte = Number(params.TempBand.split('*')[1]);
					if (rangeGte == 0 && rangeLte != 0) {
						bool.filter.push({
							"range": {
								"Temperature": {
									"lte": rangeLte
								}
							}
						});
					} else if (rangeGte != 0 && rangeLte == 0) {
						bool.filter.push({
							"range": {
								"Temperature": {
									"gte": rangeGte
								}
							}
						});
					} else {
						bool.filter.push({
							"range": {
								"Temperature": {
									"lte": rangeLte,
									"gte": rangeGte
								}
							}
						});
					}
				}
			}
			if (body.aggs) {
				body.aggs["AssetIds"] = {
					"terms": {
						"field": "AssetId",
						"size": 100000
					},
					"aggs": {
						"HealthInterval": {
							"sum": {
								"field": "HealthInterval"
							}
						}
					}
				}
			} else {
				body.aggs = {
					"AssetIds": {
						"terms": {
							"field": "AssetId",
							"size": 100000
						},
						"aggs": {
							"HealthInterval": {
								"sum": {
									"field": "HealthInterval"
								}
							}
						}
					}
				};
			}
			util.applyDateFilter(params, bool, this.dateFilter);
			if (!params.days) {
				params.days = params.totalDays
			}
		}

		if (params.fromLightScreen) {
			bool.mustNot.push({
				"term": {
					"LightIntensity": -1
				}
			});

			if (params.LightStatus) {
				bool.filter.push({
					"term": {
						"DeviceLightStatus": "No Light"
					}
				})

			}
			if (!params.fromHealthScreen) {
				if (body.aggs) {
					body.aggs["AssetIds"] = {
						"terms": {
							"field": "AssetId",
							"size": 100000
						},
						"aggs": {
							"HealthInterval": {
								"sum": {
									"field": "HealthInterval"
								}
							}
						}
					}
				} else {
					body.aggs = {
						"AssetIds": {
							"terms": {
								"field": "AssetId",
								"size": 100000
							},
							"aggs": {
								"HealthInterval": {
									"sum": {
										"field": "HealthInterval"
									}
								}
							}
						}
					};
				}
				util.applyDateFilter(params, bool, this.dateFilter);
			}

			if (!params.daysLight) {
				params.daysLight = params.totalDays
			}
		}

	}
};

Object.assign(SmartDeviceHealthRecord.prototype, {
	index: 'cooler-iot-event',
	type: 'SmartDeviceHealthRecord',
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
	sort: [{
		field: 'EventTime',
		dir: 'desc'
	}],
	softDelete: null,
	dateFilter: 'EventTime'
});

module.exports = SmartDeviceHealthRecord;