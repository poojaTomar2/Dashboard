"use strict";

var ElasticListBase = require('./elasticListBase'),
	Alert = require('./alert'),
	util = require('../util');

class RecognitionReport extends ElasticListBase {
	customizeQuery(body,params) {
		var bool = body.query.bool;
		body.aggs = {
			"Location": {
				"terms": {
					"field": "LocationId",
					"size": body.size
				}
				// ,
				// "aggs": {
				// 	"tops": {
				// 		"top_hits": {
				// 			"size": 500
				// 		}
				// 	}
				// }
			}
		};
		var must = bool.must || [];

		bool.must = must;

		var mustNot = bool.must_not || [];
		mustNot.push({
			"terms": {
				"LocationId": [0]
			}
		});
		bool.mustNot = mustNot;

		if (params.fromRecognitionReport) {
			util.applyDateFilter(params, bool, this.dateFilter, false);
		}


		//console.log(JSON.stringify(body));
	}

};

Object.assign(RecognitionReport.prototype, {
	index: 'cooler-iot-recognitionreportattribute',
	type: 'RecognitionReportAttribute',

	propertyDefs: ElasticListBase.assignPropertyDefs([
		'AssetId',
		'LocationId',
		'Name',
		'LocationCode',
		'TotalFacings',
		'EmptyFacings',
		'TotalForiegnProduct',
		'NonCompliantFacingCount',
		'TotalCocaColaFacings',
		'OutletCode'
	]),
	softDelete: null,
	dateFilter: 'VerifiedOn',
	sort: [{
		field: 'SerialNumber',
		dir: 'asc'
	}]
});


module.exports = RecognitionReport;