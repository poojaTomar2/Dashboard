"use strict";
var ListBaseController = require('./listBaseController'),
	AssetVisitHistoryModel = require('../models').AssetVisitHistory,
		aggregators = require('./aggregators');
		var Boom = require('boom');

class AssetVisitHistory extends ListBaseController {
	get modelType() {
		return AssetVisitHistoryModel;
	}

	customizeListResults(request, reply, result, options) {
		aggregators.assetVisitHistoryDistance({
			client: options.model.client,
			data: result.records,
			parentProperty: function (record) {
				return Number(record.AssetId);
			},
			childProperty: "_id"
		}).then(function () {
    	return aggregators.visitCount({
    		client: options.model.client,
    		data: result.records,
    		parentProperty: function (record) {
    			return Number(record.VisitId);
    		},
    		childProperty: "_id"
    	});}).then(function () {
			return reply({ success: true, recordsTotal: result.recordCount, recordsFiltered: result.recordCount, data: result.records });
		}).catch(function (err) {
			console.log(err);
			return reply(Boom.badImplementation(err.message));
		});
	}
};

module.exports = AssetVisitHistory;
