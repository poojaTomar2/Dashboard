"use strict";

var ElasticListBase = require('./elasticListBase'),
	util = require('../util'),
	moment = require('moment');

class SmartDeviceLastData extends ElasticListBase {
	customizeQuery(body, params) {
		var bool = body.query.bool;
		var mustNot = bool.must || [];
		var LastEndDate;

		if (params.startDate || params.endDate) {
			LastEndDate = params.endDate;
		} else {
			var endDate = moment().month(true ? (params.quarter * 3) - 1 : params.quarter - 1).endOf('month').format('YYYY-MM-DD[T23:59:59]');
			LastEndDate = endDate;
		}


		if (params.DataDownloaded || (params.CoolerPerformanceIndex && params.CoolerPerformanceIndex.indexOf("2") != -1)) {
			mustNot.push({
				"term": {
					"IsFromHealth": true
				}
			});
			bool.must = mustNot;
			util.applyDateFilter(params, bool, this.dateFilter, false, false, false);
			if (!params.daysDoor) {
				params.daysDoor = params.totalDays
			}
		}

		if (params.LastDataDownloaded) {
			var startDateDays = moment(params.endDate).format('YYYY-MM-DD[T00:00:00]');
			var endDate = moment(params.endDate).format('YYYY-MM-DD[T23:59:59]');
			var dateRangeQuery2 = {
				"range": {
					"EventDate": {
						"gte": startDateDays,
						"lte": endDate
					}
				}
			};
			bool.filter.push(dateRangeQuery2);

			if (body.aggs) {
				body.aggs["Last30Days"] = {
						"filter": {
							"bool": {
								"must": [{
									"term": {
										"LastDataDownloadedFlag": 1
									}
								}]
							}
						},
						"aggs": {
							"Last30Days": {
								"terms": {
									"field": "AssetId",
									"size": 200000
								}
							}
						}
					},
					body.aggs["Last60Days"] = {
						"filter": {
							"bool": {
								"must": [{
									"term": {
										"LastDataDownloadedFlag": 2
									}
								}]
							}
						},
						"aggs": {
							"Last60Days": {
								"terms": {
									"field": "AssetId",
									"size": 200000
								}
							}
						}
					},
					body.aggs["Last90Days"] = {
						"filter": {
							"bool": {
								"must": [{
									"term": {
										"LastDataDownloadedFlag": 3
									}
								}]
							}
						},
						"aggs": {
							"Last90Days": {
								"terms": {
									"field": "AssetId",
									"size": 200000
								}
							}
						}
					},
					body.aggs["MoreThen90Days"] = {
						"filter": {
							"bool": {
								"must": [{
									"term": {
										"LastDataDownloadedFlag": 4
									}
								}]
							}
						},
						"aggs": {
							"MoreThen90Days": {
								"terms": {
									"field": "AssetId",
									"size": 200000
								}
							}
						}
					}
			} else {
				body.aggs = {
					"Battery0to25": {
						"filter": {
							"bool": {
								"must": [{
									"range": {
										"BatteryLevel": {
											"gte": "0",
											"lt": "25"
										}
									}
								}],
								"must_not": [{
									"term": {
										"LatestHealthRecordOn": "1970-01-01T00:00:00"
									}
								}]
							}
						},
						"aggs": {
							"Battery0to25": {
								"terms": {
									"field": "AssetId",
									"size": 200000
								}
							}
						}
					},
					"Battery25to50": {
						"filter": {
							"bool": {
								"must": [{
									"range": {
										"BatteryLevel": {
											"gte": "25",
											"lt": "50"
										}
									}
								}],
								"must_not": [{
									"term": {
										"LatestHealthRecordOn": "1970-01-01T00:00:00"
									}
								}]
							}
						},
						"aggs": {
							"Battery25to50": {
								"terms": {
									"field": "AssetId",
									"size": 200000
								}
							}
						}
					},
					"Battery50to75": {
						"filter": {
							"bool": {
								"must": [{
									"range": {
										"BatteryLevel": {
											"gte": "50",
											"lt": "75"
										}
									}
								}],
								"must_not": [{
									"term": {
										"LatestHealthRecordOn": "1970-01-01T00:00:00"
									}
								}]
							}
						},
						"aggs": {
							"Battery50to75": {
								"terms": {
									"field": "AssetId",
									"size": 200000
								}
							}
						}
					},
					"Battery75to100": {
						"filter": {
							"bool": {
								"must": [{
									"range": {
										"BatteryLevel": {
											"gte": "75",
											"lte": "100"
										}
									}
								}],
								"must_not": [{
									"term": {
										"LatestHealthRecordOn": "1970-01-01T00:00:00"
									}
								}]
							}
						},
						"aggs": {
							"Battery75to100": {
								"terms": {
									"field": "AssetId",
									"size": 200000
								}
							}
						}
					}
				};
			}
		}
		//console.log(JSON.stringify(body));
	}
};

Object.assign(SmartDeviceLastData.prototype, {
	index: 'cooler-iot-asseteventdatasummary',
	type: 'AssetEventDataSummary',
	propertyDefs: ElasticListBase.assignPropertyDefs([
		"EventDate",
		"AssetId",
		"LocationId",
		"SmartDeviceManufactureId",
		"OutletTypeId"
	]),
	dateFilter: 'EventDate',
	softDelete: null
});

module.exports = SmartDeviceLastData;