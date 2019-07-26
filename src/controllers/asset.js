"use strict";
var ListBaseController = require('./listBaseController'),
	AssetModel = require('../models').Asset,
	aggregators = require('./aggregators'),
	consts = require('./consts'),
	alertTypes = consts.alertTypes,
	OutletController = require('./outlet'),
	reducers = require('./reducers'),
	productDetailQuery = require('./aggregators/productInfo.json'),
	client = require('../models').elasticClient,
	util = require('../util');
var Boom = require('boom');

class Asset extends ListBaseController {
	get modelType() {
		return AssetModel;
	}

	customizeListResults(request, reply, result, options) {
		var doorQuery = JSON.parse(JSON.stringify(require('./aggregators/doorDayCount.json')));
		var params = Object.assign({}, request.query, request.payload),
			bool = doorQuery.query.bool;
		util.applyDateFilter(params, bool, "EventDate");
		//doorQuery = doorQuery.
		aggregators.alertCount({
				client: options.model.client,
				data: result.records,
				parentProperty: function (record) {
					return Number(record.Id);
				},
				childProperty: "AssetId"
			}).then(function () {
				return aggregators.doorCount({
					client: options.model.client,
					data: result.records,
					parentProperty: function (record) {
						return Number(record.Id);
					},
					childProperty: "AssetId"
				});
			}).then(function () {
				return aggregators.assetLatestHealthRecord({
					client: options.model.client,
					data: result.records,
					parentProperty: function (record) {
						return Number(record.Id);
					},
					childProperty: "AssetId"
				});
			}).then(function () {
				return aggregators.doorDayCount({
					client: options.model.client,
					data: result.records,
					query: doorQuery,
					parentProperty: function (record) {
						return Number(record.Id);
					},
					childProperty: "AssetId"
				});
			}).then(function () {
				return aggregators.powerHours({
					client: options.model.client,
					data: result.records,
					parentProperty: function (record) {
						return Number(record.Id);
					},
					childProperty: "AssetId"
				});
			}).then(function () {
				return aggregators.CompressorStart({
					client: options.model.client,
					data: result.records,
					parentProperty: function (record) {
						return Number(record.Id);
					},
					childProperty: "AssetId"
				});
			}).then(function () {
				return aggregators.assetPlanogramAsset({
					client: options.model.client,
					data: result.records,
					parentProperty: function (record) {
						return record.PlanogramId;
					},
					childProperty: "PlanogramId"
				});
			}).then(function () {
				return aggregators.assetPurity({
					client: options.model.client,
					data: result.records,
					parentProperty: function (record) {
						var assetIds = [];
						assetIds.push(record.Id);
						if (assetIds.length > 0) {
							return assetIds;
						} else {
							return 0;
						}
					},
					childProperty: "AssetId"
				})
			}).then(function () {
				return aggregators.assetPurityDetail({
					client: options.model.client,
					data: result.records,
					parentProperty: function (record) {
						return Number(record.Id);
					},
					childProperty: "AssetId"
				});
			})
			.then(function () {
				return aggregators.assetreconignationdetails({
					client: options.model.client,
					data: result.records,
					parentProperty: function (record) {
						return Number(record.Id);
					},
					childProperty: "AssetId"
				});
			})
			.then(function () {
				return aggregators.purityProduct({
					client: options.model.client,
					data: result.records,
					parentProperty: function (record) {
						if (record.LatestProcessedPurityId && record.LatestProcessedPurityId != 0) {
							return Number(record.LatestProcessedPurityId)
						} else {
							return 0
						}
					},
					childProperty: "AssetPurityId"
				});
			})
			.then(function () {
				var data = result.records;

				for (var i = 0; i < data.length; i++) {
					var parentRecord = data[i];
					var totalPlanogramFacings = 0;
					var totalEmptyFacings = 0;
					var totalForiegnProduct = 0;
					var nonCompliantFacingCount = 0;
					var cocaColaFacings = 0;
					var record = data[i];
					var cocaColaProductDetails = [];
					var finalProduct = [];
					var planoGramDetails = record.PlanogramDetails;
					var purityDetails = record.PurityDetails;
					var purityProductsDetails = record.PurityProductsDetails;
					if (planoGramDetails.length > 0 && purityDetails.length > 0) {
						totalPlanogramFacings = totalPlanogramFacings + planoGramDetails[0].Facings;

						if (purityDetails.length > 0) {
							totalEmptyFacings = totalEmptyFacings + purityDetails[0].EmptyFacings;
							totalForiegnProduct = totalForiegnProduct + purityDetails[0].ForeignProduct;
							cocaColaFacings = cocaColaFacings + (purityDetails[0].TotalStock - (purityDetails[0].ForeignProduct));
							var order = 0;
							var planogramProducts = JSON.parse(planoGramDetails[0].FacingDetails);
							for (var x = 0; x < planogramProducts.length; x++) {
								var shelftProducts = planogramProducts[x];
								if (shelftProducts.products.length > 0) {

									for (var y = 0; y < shelftProducts.products.length; y++) {
										if (cocaColaProductDetails[shelftProducts.products[y].id]) {
											cocaColaProductDetails[shelftProducts.products[y].id].PlanogramCount += 1;
										} else {
											cocaColaProductDetails[shelftProducts.products[y].id] = {};
											cocaColaProductDetails[shelftProducts.products[y].id].ProductId = shelftProducts.products[y].id;
											cocaColaProductDetails[shelftProducts.products[y].id].ProductCount = 0;
											cocaColaProductDetails[shelftProducts.products[y].id].PlanogramCount = 1;
											cocaColaProductDetails[shelftProducts.products[y].id].Order = order++;
										}
									}
								}
							}

							var actualProduct = purityDetails[0].PurityStatus.split(',');

							for (var k = 0; k < actualProduct.length; k++) {
								for (var m = 0; m < purityProductsDetails.length; m++) {
									if (!purityProductsDetails[m].IsForeign && purityProductsDetails[m].ProductId === Number(actualProduct[k])) {
										finalProduct.push(actualProduct[k]);
										if (cocaColaProductDetails[actualProduct[k]]) {
											cocaColaProductDetails[actualProduct[k]].ProductCount += 1;
										} else {
											cocaColaProductDetails[actualProduct[k]] = {};
											cocaColaProductDetails[actualProduct[k]].ProductId = actualProduct[k];
											cocaColaProductDetails[actualProduct[k]].ProductCount = 1;
											cocaColaProductDetails[actualProduct[k]].PlanogramCount = 0;
											cocaColaProductDetails[actualProduct[k]].Order = order++; //y == 0 ? planoGramDetails[0].Facings + 1 : planoGramDetails[0].Facings + y;
										}
										break;
									}
								}
							}

						}
					}

					nonCompliantFacingCount = nonCompliantFacingCount + record.NonCompliantFacingCount;

					parentRecord.TotalFacings = totalPlanogramFacings;
					parentRecord.EmptyFacings = totalEmptyFacings;
					parentRecord.TotalForiegnProduct = totalForiegnProduct;
					parentRecord.NonCompliantFacingCount = nonCompliantFacingCount;
					parentRecord.TotalCocaColaFacings = cocaColaFacings < 0 ? cocaColaFacings = 0 : cocaColaFacings;
					parentRecord.CocaColaProductDetails = cocaColaProductDetails;
					parentRecord.finalProduct = finalProduct;
				}
				client.search({
					index: 'cooler-iot-product',
					body: productDetailQuery
				}).then(function (resp) {
					var hits = resp.hits.hits;
					var products = [];
					for (var i = 0, len = hits.length; i < len; i++) {
						if (!hits[i]._source.IsEmpty) {
							var productDetails = {};
							productDetails.Product = hits[i]._source.Product;
							productDetails.BeverageTypeId = hits[i]._source.BeverageTypeId;
							products[hits[i]._source.ProductId] = productDetails; //hits[i]._source.Product;
						}
					}

					var nonEmptyProducts = [];
					resp.hits.hits.forEach(function (validProduct) {
						nonEmptyProducts.push(validProduct._source.ProductId);
					});

					var data = result.records;
					for (var i = 0; i < data.length; i++) {
						var totalEmptyFacings = 0;
						var totalImpureCoolers = 0;
						var totalNCBProducts = 0;
						var totalSSDProducts = 0;
						var distictPlanogramProduct = [];
						var recogniseProduct = [];
						var parentRecord = data[i];
						var totalFacings = 0;
						var skuOOS = 0;
						var isPurityRecord = false;
						var record = parentRecord;

						var planoGramDetails = record.PlanogramDetails;
						if (record.PurityStatus) {
							isPurityRecord = true;
							if (record.PurityIssue == 1) {
								totalImpureCoolers++;
							}
						}

						if (record.finalProduct.length > 0) {
							record.finalProduct.forEach(function (rec) {
								if (products[rec] && products[rec].BeverageTypeId == consts.BeverageType.Sparkling) {
									totalSSDProducts++;
								}
								if (products[rec] && products[rec].BeverageTypeId == consts.BeverageType.NonCarbonated) {
									totalNCBProducts++;
								}
							});
						}
						if (planoGramDetails.length > 0 && record.PurityStatus) {
							totalEmptyFacings = totalEmptyFacings + record.EmptyFacings;

							totalFacings = planoGramDetails[0].Facings;

							var actualProduct = record.PurityStatus.split(',');

							recogniseProduct.push.apply(recogniseProduct, actualProduct);

							var planogramProducts = JSON.parse(planoGramDetails[0].FacingDetails);
							for (var k = 0; k < planogramProducts.length; k++) {
								var shelftProducts = planogramProducts[k];
								for (var z = 0; z < shelftProducts.products.length; z++) {
									if (distictPlanogramProduct.indexOf(shelftProducts.products[z].id) == -1 && nonEmptyProducts.indexOf(shelftProducts.products[z].id) > -1) {
										distictPlanogramProduct.push(shelftProducts.products[z].id);
									}
								}
							}

						}

						for (var x = 0, len = distictPlanogramProduct.length; x < len; x++) {
							if (recogniseProduct.indexOf(distictPlanogramProduct[x].toString()) == -1) {
								skuOOS++;
							}
						}

						parentRecord.TotalEmptyFacings = totalEmptyFacings;
						parentRecord.TotalImpureCoolers = totalImpureCoolers;
						parentRecord.TotalSkuOOS = skuOOS;
						parentRecord.TotalFacings = totalFacings;
						parentRecord.isPurityRecord = isPurityRecord;
						parentRecord.CocaColaFacings = parentRecord.TotalStock - parentRecord.ForeignProduct;
						parentRecord.TotalNCBProducts = totalNCBProducts;
						parentRecord.TotalSSDProducts = totalSSDProducts;
					}
					result.records.forEach(function (record) {
						if (record.SmartDeviceSerialNumber) {
							if (record.IsMissing || record.AssetCurrentStatus === 'Wrong Location') {
								record.Alert_Highest_AlertTypeId = alertTypes.missing;
							}
							//else {
							//  if(record.GatewaySerialNumber && record.IsPowerOn === false) {
							//    record.Alert_Highest_AlertTypeId = alertTypes.power;
							//  }
							//}
							delete record.PlanogramDetails
							delete record.PurityProductsDetails
							delete record.CocaColaProductDetails
							delete record.finalProduct
							delete record.PurityDetails
						}

					});
					return reply({
						success: true,
						recordsTotal: result.recordCount,
						recordsFiltered: result.recordCount,
						data: result.records
					});
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
		//doorQuery = doorQuery.
		aggregators.doorDayCount({
			client: options.model.client,
			data: result.records,
			parentProperty: function (record) {
				return Number(record.Id);
			},
			childProperty: "AssetId"
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

Asset.prototype.reducers = [{
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

module.exports = Asset;