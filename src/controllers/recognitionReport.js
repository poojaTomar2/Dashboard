"use strict";
var ListBaseController = require('./listBaseController'),
	RecognitionReportModel = require('../models').RecognitionReport,
	aggregators = require('./aggregators'),
	consts = require('./consts'),
	alertTypes = consts.alertTypes,
	OutletController = require('./outlet'),
	reducers = require('./reducers'),
	productDetailQuery = require('./aggregators/productInfo.json'),
	client = require('../models').elasticClient;

class RecognitionReport extends ListBaseController {
	get modelType() {
		return RecognitionReportModel;
	}

	customizeListResults(request, reply, result, options) {
		return reply({
			success: true,
			recordsTotal: result.recordCount,
			recordsFiltered: result.recordCount,
			data: result.records
		});

	}
};

RecognitionReport.prototype.reducers = [{
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
}, {
	property: "AssetId",
	reducer: reducers.alert,
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
}];

module.exports = RecognitionReport;