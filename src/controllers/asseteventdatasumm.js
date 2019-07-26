"use strict";
var ListBaseController = require('./listBaseController'),
	AssetModel = require('../models').Asseteventdatasumm,
	aggregators = require('./aggregators'),
	consts = require('./consts'),
	alertTypes = consts.alertTypes,
	OutletController = require('./outlet'),
	reducers = require('./reducers'),
	productDetailQuery = require('./aggregators/productInfo.json'),
	client = require('../models').elasticClient,
	util = require('../util');
var Boom = require('boom');

class Asseteventdatasumm extends ListBaseController {
	get modelType() {
		return AssetModel;
	}

	customizeListResults(request, reply, result, options) {
		var doorQuery = JSON.parse(JSON.stringify(require('./aggregators/doorDayCount.json')));
		var params = Object.assign({}, request.query, request.payload),
			bool = doorQuery.query.bool;
		util.applyDateFilter(params, bool, "EventDate");
		aggregators.assetInfo({
			client: options.model.client,
			data: result.records,
			parentProperty: function (record) {
				return Number(record.AssetId);
			},
			childProperty: "AssetId"
		}).then(function () {
			return aggregators.alertCount({
				client: options.model.client,
				data: result.records,
				parentProperty: function (record) {
					return Number(record.AssetId);
				},
				childProperty: "AssetId"
			});
		}).then(function () {
			return aggregators.doorCount({
				client: options.model.client,
				data: result.records,
				parentProperty: function (record) {
					return Number(record.AssetId);
				},
				childProperty: "AssetId"
			});
		}).then(function () {
			var data = result.records;
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
	customizeListResultsAssetExport(request, reply, result, options) {
		var doorQuery = JSON.parse(JSON.stringify(require('./aggregators/doorDayCount.json')));
		var params = Object.assign({}, request.query, request.payload),
			bool = doorQuery.query.bool;
		util.applyDateFilter(params, bool, "EventDate");
		aggregators.assetInfo({
			client: options.model.client,
			data: result.records,
			parentProperty: function (record) {
				return Number(record.AssetId);
			},
			childProperty: "AssetId"
		}).then(function () {
			return aggregators.alertCount({
				client: options.model.client,
				data: result.records,
				parentProperty: function (record) {
					return Number(record.AssetId);
				},
				childProperty: "AssetId"
			});
		}).then(function () {
			return aggregators.doorDayCount({
				client: options.model.client,
				startDate: options.params.startDate,
				endDate: options.params.endDate,
				data: result.records,
				parentProperty: function (record) {
					return Number(record.AssetId);
				},
				childProperty: "AssetId"
			});
		}).then(function () {
			var data = result.records;
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

Asseteventdatasumm.prototype.reducers = [{
		property: "AssetId",
		reducer: reducers.smartDeviceInstallationDate,
		childProperty: "AssetId"
	}, {
		property: "AssetId",
		reducer: reducers.smartDeviceLatestData,
		childProperty: "AssetId"
	}, {
		property: "AssetId",
		reducer: reducers.smartDeviceMovement,
		childProperty: "AssetId"
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
	},
	{
		property: "AssetId",
		reducer: reducers.smartDeviceTelemetryHealth,
		childProperty: "AssetId"
	},
	{
		property: "AssetId",
		reducer: reducers.fallenMagnet,
		childProperty: "AssetId"
	}, {
		property: "AssetId",
		reducer: reducers.smartDeviceTelemetryDoor,
		childProperty: "AssetId"
	},
	{
		property: "AssetId",
		reducer: reducers.smartDeviceCoolerTracking,
		childProperty: "AssetId"
	}, {
		property: "AssetId",
		reducer: reducers.alert,
		childProperty: "AssetId"
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
	}
];

module.exports = Asseteventdatasumm;