"use strict";
var ListBaseController = require('./listBaseController'),
	OutletModel = require('../models').Locationeventdatasumm,
	aggregators = require('./aggregators'),
	reducers = require('./reducers'),
	productDetailQuery = require('./aggregators/productInfo.json'),
	client = require('../models').elasticClient,
	util = require('../util');
var Boom = require('boom');

class Outlet extends ListBaseController {
	get modelType() {
		return OutletModel;
	}

	customizeListResults(request, reply, result, options) {
		var doorQuery = JSON.parse(JSON.stringify(require('./aggregators/doorDayCount.json')));
		var params = Object.assign({}, request.query, request.payload),
			bool = doorQuery.query.bool;
		util.applyDateFilter(params, bool, "EventTime");
		aggregators.locationInfo({
			client: options.model.client,
			data: result.records,
			parentProperty: function (record) {
				return Number(record.Id);
			},
			childProperty: "LocationId"
		}).then(function () {
			return aggregators.alertCount({
				client: options.model.client,
				data: result.records,
				parentProperty: function (record) {
					return Number(record.Id);
				},
				childProperty: "LocationId"
			});
		}).then(function () {
			return aggregators.assetCountJoin({
				client: options.model.client,
				data: result.records,
				parentProperty: function (record) {
					return Number(record.Id);
				},
				childProperty: "LocationId"
			})
			// }).then(function () {
			// 	return aggregators.doorCount({
			// 		client: options.model.client,
			// 		data: result.records,
			// 		parentProperty: function (record) {
			// 			return Number(record.Id);
			// 		},
			// 		childProperty: "LocationId"
			// 	});
		}).then(function () {
			return aggregators.doorDayCount({
				client: options.model.client,
				startDate: options.params.startDate,
				endDate: options.params.endDate,
				data: result.records,
				parentProperty: function (record) {
					return Number(record.Id);
				},
				childProperty: "LocationId"
			});
		}).then(function () {
			return aggregators.visitCount({
				client: options.model.client,
				data: result.records,
				parentProperty: function (record) {
					return Number(record.Id);
				},
				childProperty: "LocationId"
			});
		}).then(function () {
			return aggregators.outletAssetDetail({
				client: options.model.client,
				data: result.records,
				parentProperty: function (record) {
					return Number(record.Id);
				},
				childProperty: "LocationId"
			});
		}).then(function () {
			return aggregators.assetPurity({
				client: options.model.client,
				data: result.records,
				parentProperty: function (record) {
					var assetIds = [];
					for (var i = 0; i < record.AssetDetails.length; i++) {
						if (record.AssetDetails[i].AssetId) {
							assetIds.push(Number(record.AssetDetails[i].AssetId));
						}
					}
					if (assetIds.length > 0) {
						return assetIds;
					} else {
						return 0;
					}
				},
				childProperty: "AssetId"
			})
		}).then(function () {
			return aggregators.assetPlanogram({
				client: options.model.client,
				data: result.records,
				parentProperty: function (record) {
					var planogramIds = [];
					for (var i = 0; i < record.AssetDetails.length; i++) {
						if (record.AssetDetails[i].PurityDetails && record.AssetDetails[i].PurityDetails[0] && record.AssetDetails[i].PurityDetails[0].PlanogramId != 0) {
							planogramIds.push(Number(record.AssetDetails[i].PurityDetails[0].PlanogramId));
						}
					}
					if (planogramIds.length > 0) {
						return planogramIds;
					} else {
						return 0;
					}
				},
				childProperty: "PlanogramId"
			});
		}).then(function () {
			client.search({
				index: 'cooler-iot-product',
				body: productDetailQuery
			}).then(function (resp) {
				var hits = resp.hits.hits;
				var products = [];
				for (var i = 0, len = hits.length; i < len; i++) {
					if (!hits[i]._source.IsEmpty) {
						products[hits[i]._source.ProductId] = hits[i]._source.ProductId;
					}
				}
				var data = result.records;
				for (var i = 0; i < data.length; i++) {
					var totalEmptyFacings = 0;
					var totalImpureCoolers = 0;
					var isPurityRecord = false;
					var distictPlanogramProduct = [];
					var recogniseProduct = [];
					var parentRecord = data[i];
					var skuOOS = 0;
					var record = parentRecord.AssetDetails;
					for (var j = 0; j < record.length; j++) {
						var planoGramDetails = record[j].PlanogramDetails;
						var purityDetails = record[j].PurityDetails;
						if (purityDetails.length > 0) {
							isPurityRecord = true;
							if (purityDetails[0].PurityIssue == 1) {
								totalImpureCoolers++;
							}
						}
						if (planoGramDetails.length > 0 && purityDetails.length > 0) {
							if (purityDetails.length > 0) {
								totalEmptyFacings = totalEmptyFacings + purityDetails[0].EmptyFacings;
							}

							var actualProduct = purityDetails[0].PurityStatus.split(',');

							recogniseProduct.push.apply(recogniseProduct, actualProduct);

							var planogramProducts = JSON.parse(planoGramDetails[0].FacingDetails);
							for (var k = 0; k < planogramProducts.length; k++) {
								var shelftProducts = planogramProducts[k];
								for (var z = 0; z < shelftProducts.products.length; z++) {
									if (distictPlanogramProduct.indexOf(shelftProducts.products[z].id) == -1 && products.indexOf(shelftProducts.products[z].id) > -1) {
										distictPlanogramProduct.push(shelftProducts.products[z].id);
									}
								}
							}
						}

					}
					//var oosArr = [];
					for (var x = 0, len = distictPlanogramProduct.length; x < len; x++) {
						if (recogniseProduct.indexOf(distictPlanogramProduct[x].toString()) == -1) {
							//oosArr.push(distictPlanogramProduct[x].toString());
							skuOOS++;
						}
					}
					//console.log(oosArr.join(','))
					parentRecord.TotalEmptyFacings = totalEmptyFacings;
					parentRecord.TotalImpureCoolers = totalImpureCoolers;
					parentRecord.TotalSkuOOS = skuOOS;
					parentRecord.isPurityRecord = isPurityRecord;
				}
				return reply({
					success: true,
					recordsTotal: result.recordCount,
					recordsFiltered: result.recordCount,
					data: result.records
				});
			})

		}).catch(function (err) {
			console.log(err);
			return reply(Boom.badImplementation(err.message));
		});
	}


	get apiEndPoints() {
		return [
			'list',
			'ids'
		];
	}

	ids(request, reply) {
		Outlet.getOutletIds(request, request.query).then(function (result) {
			return reply(result);
		}).catch(function (err) {
			console.log(err);
			return reply(Boom.badImplementation(err.message));
		});
	}
};

Outlet.prototype.reducers = [{
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
	property: "_id",
	reducer: reducers.asset,
	childProperty: "LocationId"
}];

module.exports = Outlet;