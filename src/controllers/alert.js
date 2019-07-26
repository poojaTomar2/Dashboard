"use strict";
var ListBaseController = require('./listBaseController'),
	AlertModel = require('../models').Alert,
	reducers = require('./reducers'),
	aggregators = require('./aggregators');
	var Boom = require('boom');

class Alert extends ListBaseController {
	get modelType() {
		return AlertModel;
	}
	customizeListResults(request, reply, result, options) {
		aggregators.outletVisitDetail({
			client: options.model.client,
			data: result.records,
			parentProperty: function (record) {
				return Number(record.LocationId);
			},
			childProperty: "_id"
		}).then(function () {
			return reply({
				success: true,
				recordsTotal: result.recordCount,
				recordsFiltered: result.recordCount,
				data: result.records,
				priorityCount: result.priorityCount
			});
		}).catch(function (err) {
			console.log(err);
			return reply(Boom.badImplementation(err.message));
		});
	}
};

Alert.prototype.reducers = [{
	property: "AssetId",
	reducer: reducers.smartDeviceInstallationDate,
	childProperty: "AssetId"
}, {
	property: "AssetId",
	reducer: reducers.smartDeviceLatestData,
	childProperty: "AssetId"
}, {
	property: "LocationId",
	reducer: reducers.smartDeviceMovement,
	childProperty: "LocationId"
}, {
	property: "AssetId",
	reducer: reducers.smartDevicDoorStatus,
	childProperty: "AssetId"
}, {
	property: "AssetId",
	reducer: reducers.smartDeviceHealthRecord,
	childProperty: "AssetId"
}, {
	property: "AssetId",
	reducer: reducers.smartDevicePowerRecord,
	childProperty: "AssetId"
}, {
	property: "AssetId",
	reducer: reducers.smartDevice,
	childProperty: "LinkedAssetId"
}, {
	property: "SalesHierarchyId",
	reducer: reducers.userSalesHierarchy,
	childProperty: "SalesHierarchyId"
}, {
	property: "LocationId",
	reducer: reducers.sales,
	childProperty: "LocationId"
}, {
	property: "LocationId",
	reducer: reducers.outlet
}, {
	property: "AssetId",
	reducer: reducers.asset,
	childProperty: "AssetId"
}];

module.exports = Alert;