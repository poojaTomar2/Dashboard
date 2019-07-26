"use strict";
var ListBaseController = require('./listBaseController'),
	VisitModel = require('../models').Visit,
	reducers = require('./reducers'),
	aggregators = require('./aggregators');
	var Boom = require('boom');


class Visit extends ListBaseController {
	get modelType() {
		return VisitModel;
	}

	customizeListResults(request, reply, result, options) {
		aggregators.visitDetail({
			client: options.model.client,
			data: result.records,
			parentProperty: function (record) {
				return Number(record.Id);
			},
			childProperty: "VisitId"
		}).then(function () {
			return aggregators.outletVisitDetail({
				client: options.model.client,
				data: result.records,
				parentProperty: function (record) {
					return Number(record.LocationId);
				},
				childProperty: "_id"
			});
		}).then(function () {
			return aggregators.assetVisitHistoryDetail({
				client: options.model.client,
				data: result.records,
				parentProperty: function (record) {
					for (var i = 0; i < record.details.length; i++) {
						return Number(record.details[i].AssetId);
					}
				},
				childProperty: "_id"
			});
		}).then(function () {
			return reply({
				success: true,
				recordsTotal: result.recordCount,
				recordsFiltered: result.recordCount,
				data: result.records
			});
		}).catch(function (err) {
			console.log(err);
			return reply(Boom.badImplementation(err.message));
		});
	}

};

Visit.prototype.reducers = [{
	property: "LocationId",
	reducer: reducers.outlet
}, {
	property: "LocationId",
	reducer: reducers.alert,
	childProperty: "LocationId"
},{
	property: "LocationId",
	reducer: reducers.smartDevice,
	childProperty: "LocationId"
}, {
	property: "SalesHierarchyId",
	reducer: reducers.userSalesHierarchy,
	childProperty: "SalesHierarchyId"
},{
	property: "AssetId",
	reducer: reducers.smartDeviceMovement,
	childProperty: "LocationId"
},{
	property: "AssetId",
	reducer: reducers.smartDevicDoorStatus,
	childProperty: "AssetId"
},{
	property: "AssetId",
	reducer: reducers.smartDeviceHealthRecord,
	childProperty: "AssetId"
}, {
	property: "AssetId",
	reducer: reducers.smartDeviceInstallationDate,
	childProperty: "AssetId"
}, {
	property: "AssetId",
	reducer: reducers.smartDeviceLatestData,
	childProperty: "AssetId"
},{
	property: "AssetId",
	reducer: reducers.smartDevicePowerRecord,
	childProperty: "AssetId"
}, {
	property: "LocationId",
	reducer: reducers.asset,
	childProperty: "LocationId"
}, {
	property: "LocationId",
	reducer: reducers.sales,
	childProperty: "LocationId"
}];

module.exports = Visit;