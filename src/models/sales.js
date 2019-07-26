"use strict";

var ElasticListBase = require('./elasticListBase'),
	util = require('../util');

class Sales extends ElasticListBase {
	customizeQuery(body, params) {
		var bool = body.query.bool;
		var must = bool.must_not || [];
		must.push({
			"term": {
				"IsFromSales": true
			}
		});
		bool.must = must;
		if (params.salesDataSelected) {
			if (params.salesDataSelected == 1) {
				util.applyDateFilter(params, bool, this.dateFilter);
			}
		}

		if (params.fromSalesScreen) {

			if (body.aggs) {
				body.aggs["locations"] = {
					"terms": {
						"field": "LocationId",
						"size": 100000
					},
					"aggs": {
						"SalesVolume": {
							"sum": {
								"field": "SumOfSalesQuantity"
							}
						}
					}
				}
			} else {
				body.aggs = {
					"locations": {
						"terms": {
							"field": "LocationId",
							"size": 100000
						},
						"aggs": {
							"SalesVolume": {
								"sum": {
									"field": "SumOfSalesQuantity"
								}
							}
						}
					}
				};
			}
			util.applyDateFilter(params, bool, this.dateFilter);
		}
	}
};


Object.assign(Sales.prototype, {
	index: 'cooler-iot-asseteventdatasummary',
	type: 'AssetEventDataSummary',
	propertyDefs: ElasticListBase.assignPropertyDefs([
		"EventDate",
		"LocationId"
	]),
	softDelete: null,
	dateFilter: 'EventDate'
});

module.exports = Sales;