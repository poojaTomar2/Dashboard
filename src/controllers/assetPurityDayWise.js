"use strict";
var ListBaseController = require('./listBaseController'),
	AssetPurityDayWiseModel = require('../models').AssetPurityDayWise,
	aggregators = require('./aggregators'),
	consts = require('./consts'),
	alertTypes = consts.alertTypes,
	OutletController = require('./outlet'),
	reducers = require('./reducers'),
	productDetailQuery = require('./aggregators/productInfo.json'),
	client = require('../models').elasticClient;

class AssetPurityDayWise extends ListBaseController {
	get modelType() {
		return AssetPurityDayWiseModel;
	}

	customizeListResults(request, reply, result, options) {
		aggregators.assetPlanogram({
				client: options.model.client,
				data: result.records,
				parentProperty: function (record) {
					var planogramIds = [];
					for (var i = 0; i < record.AssetDetails.length; i++) {
						if (record.AssetDetails[i]) {
							for (var j = 0; j < record.AssetDetails[i].PurityDetails.length; j++) {
								planogramIds.push(Number(record.AssetDetails[i].PurityDetails[j].PlanogramId));
							}
						}
					}
					if (planogramIds.length > 0) {
						return planogramIds;
					} else {
						return 0;
					}
				},
				childProperty: "PlanogramId"
			}) //.then(function () {
			//	return aggregators.assetPurityProduct({
			//		client: options.model.client,
			//		data: result.records,
			//		parentProperty: function (record) {
			//			for (var k = 0; k < record.AssetDetails.length; k++) {
			//				if (record.AssetDetails[k].PurityDetails.length > 0) {
			//					for (var i = 0; i < record.AssetDetails[k].PurityDetails.length; i++) {
			//						var productIds = record.AssetDetails[k].PurityDetails[i].PurityStatus.split(',');
			//						var prodIds = [];
			//						for (var j = 0; j < productIds.length; j++) {
			//							prodIds.push(Number(productIds[j]));
			//						}
			//						return prodIds;
			//					}
			//				}
			//				else
			//				{
			//					return 0;
			//				}
			//			}
			//		},
			//		childProperty: "ProductId"
			//	});
			//})
			.then(function () {
				return aggregators.purityProduct({
					client: options.model.client,
					data: result.records,
					parentProperty: function (record) {
						var latestProcessedPurityIds = [];
						for (var i = 0; i < record.AssetDetails.length; i++) {
							if (record.AssetDetails[i]) {
								for (var j = 0; j < record.AssetDetails[i].PurityDetails.length; j++) {
									latestProcessedPurityIds.push(Number(record.AssetDetails[i].PurityDetails[j].AssetPurityId));
								}
							}
						}
						if (latestProcessedPurityIds.length > 0) {
							return latestProcessedPurityIds;
						} else {
							return 0;
						}
					},
					childProperty: "AssetPurityId"
				});
			})
			.then(function () {
				var data = result.records;

				for (var i = 0; i < data.length; i++) {
					var parentRecord = data[i];
					var record = data[i].AssetDetails;
					for (var j = 0; j < record.length; j++) {
						var purityDetail = record[j].PurityDetails;
						for (var l = 0; l < purityDetail.length; l++) {
							var purityDetails = purityDetail[l];
							var totalPlanogramFacings = 0;
							var nonCompliantFacingCount = 0;
							var cocaColaFacings = 0;
							var cocaColaProductDetails = [];
							var finalProduct = [];
							var planoGramDetails = purityDetails.PlanogramDetails;
							var purityProductsDetails = purityDetails.PurityProductsDetails;
							if (planoGramDetails.length > 0 && purityDetails) {
								totalPlanogramFacings = planoGramDetails[0].Facings;

								if (purityDetails) {
									cocaColaFacings = purityDetails.TotalStock - (purityDetails.ForeignProduct);
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

									var actualProduct = purityDetails.PurityStatus.split(',');

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
								cocaColaProductDetails = cocaColaProductDetails.filter(function (n) {
									return n != undefined
								});
							}
							parentRecord.AssetDetails[j].PurityDetails[l].CocaColaProductDetails = cocaColaProductDetails;
							parentRecord.AssetDetails[j].PurityDetails[l].CocaColaFacings = cocaColaFacings < 0 ? cocaColaFacings = 0 : cocaColaFacings;
							parentRecord.AssetDetails[j].PurityDetails[l].PlanogramFacings = totalPlanogramFacings;
							parentRecord.AssetDetails[j].PurityDetails[l].finalProduct = finalProduct;
						}
					}
				}
				client.search({
					index: 'cooler-iot-product',
					body: productDetailQuery
				}).then(function (resp) {
					var hits = resp.hits.hits;
					var products = [];
					var productsForSSD = [];
					for (var i = 0, len = hits.length; i < len; i++) {
						if (!hits[i]._source.IsEmpty) {
							var productDestails = {};
							productDestails.Product = hits[i]._source.Product;
							productDestails.BeverageTypeId = hits[i]._source.BeverageTypeId;

							products[hits[i]._source.ProductId] = productDestails; //hits[i]._source.Product;

							productsForSSD[hits[i]._source.ProductId]
						}
					}

					result.records.forEach(function (locations) {
						locations.AssetDetails.forEach(function (assetDetails) {
							assetDetails.PurityDetails.forEach(function (purityRecords) {
								var totalNCBProducts = 0;
								var totalSSDProducts = 0;
								var totalSSDProductsSKU = 0;
								var totalNCBProductsSKU = 0;
								var redScoreForOutlet = 'No';
								var isPurityAvailable = false;
								var totalPlanogramSSDProducts = 0;
								var totalPlanogramNCBProducts = 0;

								if (purityRecords.finalProduct.length > 0) {
									purityRecords.finalProduct.forEach(function (rec) {
										if (products[rec] && products[rec].BeverageTypeId == consts.BeverageType.Sparkling) {
											totalSSDProducts++;
										}
										if (products[rec] && products[rec].BeverageTypeId == consts.BeverageType.NonCarbonated) {
											totalNCBProducts++;
										}
									});
								}
								if (purityRecords.CocaColaProductDetails.length > 0) {
									purityRecords.CocaColaProductDetails.forEach(function (rec) {
										if (rec) {
											if (products[rec.ProductId]) {
												rec.ProductName = products[rec.ProductId].Product;
												rec.IsSSD = products[rec.ProductId] && products[rec.ProductId].BeverageTypeId == consts.BeverageType.Sparkling ? 'Yes' : 'No';
												rec.IsNCB = products[rec.ProductId] && products[rec.ProductId].BeverageTypeId == consts.BeverageType.NonCarbonated ? 'Yes' : 'No';

											} else {
												purityRecords.CocaColaProductDetails.splice(purityRecords.CocaColaProductDetails.indexOf(rec), 1);
											}
										}
									})
								}
								var distictPlanogramProduct = [];
								var recogniseProduct = [];
								var skuOOS = 0;
								var planoGramDetails = purityRecords.PlanogramDetails;

								if (planoGramDetails.length > 0 && purityRecords) {
									var actualProduct = purityRecords.PurityStatus.split(',');

									recogniseProduct.push.apply(recogniseProduct, actualProduct);

									var planogramProducts = JSON.parse(planoGramDetails[0].FacingDetails);
									for (var k = 0; k < planogramProducts.length; k++) {
										var shelftProducts = planogramProducts[k];
										for (var z = 0; z < shelftProducts.products.length; z++) {

											var productDetailPlanogram = products[shelftProducts.products[z]];
											if (productDetailPlanogram && productDetailPlanogram.BeverageTypeId == consts.BeverageType.Sparkling) {
												totalPlanogramSSDProducts++;
											}
											if (productDetailPlanogram && productDetailPlanogram.BeverageTypeId == consts.BeverageType.NonCarbonated) {
												totalPlanogramNCBProducts++;
											}
											if (distictPlanogramProduct.indexOf(shelftProducts.products[z].id) == -1 && products[shelftProducts.products[z].id]) {
												distictPlanogramProduct.push(shelftProducts.products[z].id);
											}
										}
									}
									for (var x = 0, len = distictPlanogramProduct.length; x < len; x++) {
										if (recogniseProduct.indexOf(distictPlanogramProduct[x].toString()) == -1) {
											skuOOS++;
										}
									}
								}
								var relogramFacing = recogniseProduct.filter((v, i, a) => a.indexOf(v) === i);
								var relogramFacingCount = 0;
								for (var y = 0, len = relogramFacing.length; y < len; y++) {
									isPurityAvailable = true;
									var productDetail = products[relogramFacing[y]];
									if (productDetail && productDetail.BeverageTypeId == consts.BeverageType.Sparkling) {
										totalSSDProductsSKU++;
									}
									if (productDetail && productDetail.BeverageTypeId == consts.BeverageType.NonCarbonated) {
										totalNCBProductsSKU++;
									}

									if (productDetail) {
										//relogramFacingCount ++;
									}
								}
								relogramFacingCount = relogramFacing.length;
								purityRecords.RelogramFacingSKU = relogramFacingCount;
								purityRecords.TotalSkuOOS = skuOOS;
								purityRecords.TotalSSDProducts = totalSSDProducts;
								purityRecords.TotalNCBProducts = totalNCBProducts;
								purityRecords.isPurityAvailable = isPurityAvailable;
								purityRecords.TotalSSDProductsSKU = totalSSDProductsSKU;
								purityRecords.TotalNCBProductsSKU = totalNCBProductsSKU;
							});
						});

					})
					return reply({
						success: true,
						recordsTotal: result.recordCount,
						recordsFiltered: result.recordCount,
						data: result.records
					});
				});
			})
	}
};

module.exports = AssetPurityDayWise;