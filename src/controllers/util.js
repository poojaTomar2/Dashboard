var Boom = require('boom');
module.exports = {
	/**
	 * Creates a function for join
	 * @param {Object} options - index: Elastic index name to use, mergeDataFn: Function to merge data, query: Query object
	 * @return {Function} new function
	 */
	createJoinPropertyFn: function (options) {
		return function (config) {
			var data = config.data,
				parentProperty = config.parentProperty,
				childProperty = config.childProperty,
				query = config.query;
			return new Promise(function (resolve, reject) {
				var idMapper = parentProperty;
				if (typeof idMapper === 'string') {
					idMapper = function (record, index) {
						return record[parentProperty];
					};
				}
				var ids = data.map(idMapper);

				// load query fresh each time to avoid conflicts
				var body = query ? typeof config.query === 'string' ? JSON.parse(config.query) : config.query : typeof options.query === 'string' ? JSON.parse(options.query) : options.query;

				if (body.aggs && body.aggs.Keys) {
					body.aggs.Keys.terms.field = childProperty;
				}

				var filter = {};
				var newIds = [];
				for (var k = 0; k < ids.length; k++) {
					if (typeof (ids[k]) === "object") {
						for (var j = 0; j < ids[k].length; j++) {
							newIds.push(Number(ids[k][j]));
						}
					} else {
						if (ids[k]) {
							newIds.push(ids[k]);
						}
					}
				}
				filter[childProperty] = newIds;

				body.query.bool.filter.push({
					terms: filter
				});

				if (config.startDate && config.endDate) {
					var dateRangeFilterQuery = {
						"range": {
							"EventDate": {
								"gte": config.startDate,
								"lte": config.endDate
							}
						}
					};
					body.query.bool.filter.push(dateRangeFilterQuery);
				}
				var alertCounts = config.client.search({
					index: options.index,
					body: body
				}).then(function (resp) {
					options.mergeDataFn(Object.assign({
						idMapper: idMapper
					}, config), resp);
					resolve();
				}, function (err) {
					console.log(err);
					reject(err);
				});
			});
		};
	},

	applyReducers: function (request, params, totalHours, reducers, callback) {

		var outletReducer = require('./controllers/reducers/outlet');
		var smartDeviceInstallationDateReducer = require('./controllers/reducers/smartDeviceInstallationDate');
		var smartDeviceLatestDataReducer = require('./controllers/reducers/smartDeviceLatestData');
		var smartDeviceLastDataReducer = require('./controllers/reducers/smartDeviceLastData');
		var salesRepReducer = require('./controllers/reducers/salesRep');
		var userSalesHierarchyReducer = require('./controllers/reducers/userSalesHierarchy');
		var alertReducer = require('./controllers/reducers/alert');
		var assetReducer = require('./controllers/reducers/asset');
		var smartDeviceReducer = require('./controllers/reducers/smartDevice');
		var smartDeviceMovementReducer = require('./controllers/reducers/smartDeviceMovement');
		var smartDevicDoorStatusReducer = require('./controllers/reducers/smartDevicDoorStatus');
		var smartDeviceDoorTargetReducer = require('./controllers/reducers/smartDeviceDoorTarget');
		var smartDevicHealthReducer = require('./controllers/reducers/smartDeviceHealthRecord');
		var smartDevicePowerReducer = require('./controllers/reducers/smartDevicePowerRecord');
		var smartDeviceTelemetryHealth = require('./controllers/reducers/smartDeviceTelemetryHealth');
		var smartDeviceTelemetryDoor = require('./controllers/reducers/smartDeviceTelemetryDoor');
		var smartDeviceTechnicalDiagnosticsReducer = require('./controllers/reducers/smartDeviceTechnicalDiagnostics');
		var salesReducer = require('./controllers/reducers/sales');

		//For all filter "No Data" Operation if applicable  
		params["AssetId"] = [];

		assetReducer(request, params, "AssetId").then(function (assetIds) {
			delete params["AssetId"];

			if (assetIds) {
				//Assets for calcutate No data 
				params["NoDataAssetIds[]"] = assetIds.length != 0 ? assetIds : [-1];
			}

			smartDeviceInstallationDateReducer(request, params, "AssetId").then(function (assetIds) {
				if (assetIds) {
					params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
				}
				smartDeviceLatestDataReducer(request, params, "AssetId").then(function (assetIds) {
					if (assetIds) {
						params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
					}
					// if (params.DoorCount || params["DoorCount[]"]) {
					// 	params["fromDoorScreen"] = true;
					// 	params["customQueryDoor"] = true;
					// }
					// // if (params.Displacement_To || params.Displacement_From || params["Displacement_To[]"] || params["Displacement_From[]"]) {
					// 	params["fromMovementScreen"] = true;
					// 	params.daysMovement = moment.duration(totalHours, 'hours').asDays();
					// }

					if ((params.CoolerPerformanceIndex && params.CoolerPerformanceIndex.indexOf("2") != -1)) {
						params["customQueryLastDownloaded"] = true;
					}

					if (params.DataDownloaded || params["DataDownloaded[]"]) {
						params.DataDownloaded = params.DataDownloaded || params["DataDownloaded[]"];
						//params["fromPowerScreen"] = true;
						params["customQueryLastDownloaded"] = true;
					}

					if (params.LastDataDownloaded || params["LastDataDownloaded[]"]) {
						params.LastDataDownloaded = params.LastDataDownloaded || params["LastDataDownloaded[]"];
						//params["fromPowerScreen"] = true;
						params["customQueryLastDataDownloaded"] = true;
					}

					smartDeviceLastDataReducer(request, params, "AssetId").then(function (assetIds) {
						if (assetIds) {
							params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
						}
						if (params.DoorCount || params["DoorCount[]"]) {
							params["fromDoorScreen"] = true;
							params["customQueryDoor"] = true;
						}
						if (params.Displacement_To || params.Displacement_From || params["Displacement_To[]"] || params["Displacement_From[]"]) {
							params["fromMovementScreen"] = true;
							params.daysMovement = moment.duration(totalHours, 'hours').asDays();
						}

						if (params.DataDownloaded || params["DataDownloaded[]"]) {
							delete params["customQueryLastDownloaded"];
						}

						if ((params.CoolerPerformanceIndex && params.CoolerPerformanceIndex.indexOf("2") != -1)) {
							delete params["customQueryLastDownloaded"];
							delete params["DataDownloaded"];
						}

						if (params.LastDataDownloaded || params["LastDataDownloaded[]"]) {
							params.LastDataDownloaded = params.LastDataDownloaded || params["LastDataDownloaded[]"];
							delete params["customQueryLastDataDownloaded"];
						}

						smartDeviceMovementReducer(request, params, "AssetId").then(function (assetIds) {
							if (assetIds) {
								params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
							}
							if (params.DoorCount || params["DoorCount[]"]) {
								params["fromDoorScreen"] = true;
								params["customQueryDoor"] = true;
							}

							smartDevicDoorStatusReducer(request, params, "AssetId").then(function (assetIds) {
								delete params["fromDoorScreen"];
								delete params["customQueryDoor"];
								if (assetIds) {
									params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
								}

								if (params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) {
									params["fromDoorScreen"] = true;
									params["customQueryDoor"] = true;
									params["doorTarget"] = true;
								}

								if (params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) {
									params["fromDoorScreen"] = true;
									params["customQueryDoor"] = true;
									params["doorTarget"] = true;
								}

								smartDeviceDoorTargetReducer(request, params, "AssetId").then(function (assetIds) {
									delete params["fromDoorScreen"];
									delete params["customQueryDoor"];

									if (assetIds) {
										params["doorTargetAssets"] = assetIds.length != 0 ? assetIds : [-1];
									}

									if (params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) {
										params["fromSalesScreen"] = true;
										params["customQuerySales"] = true;
										params["salesTarget"] = true;
										//params["LocationId"] = [];
									}

									salesReducer(request, params, "LocationId").then(function (locationIds) {
										// if (locationIds) {
										// 	delete params.LocationId;
										// 	params["LocationId[]"] = locationIds.length != 0 ? locationIds : [-1];
										// }

										if (params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) {
											delete params["fromDoorScreen"];
											delete params["customQueryDoor"];
											delete params["doorTarget"];
										}

										if (params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) {
											delete params["fromDoorScreen"];
											delete params["customQueryDoor"]
											delete params["doorTarget"];
										}

										if (params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) {
											delete params["fromSalesScreen"];
											delete params["customQuerySales"];
											delete params["salesTarget"];
											//params["LocationId"] = [];
										}


										if (locationIds) {
											params["salesTargetAssets[]"] = locationIds.length != 0 ? locationIds : [-1];
										}

										if (params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) {
											params["customQueryDoorSwing"] = true;
										}

										if (params.DoorOpenVsSales || params["DoorOpenVsSales[]"]) {
											params["customQueryDoorSwing"] = true;
										}

										assetReducer(request, params, "LocationId").then(function (locationIds) {
											//console.log("Asset Reducer Completed");
											delete params["customQueryDoorSwing"];

											// if (assetIds) {
											// 	params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
											// }

											if (locationIds) {
												delete params.LocationId;
												params["LocationId[]"] = locationIds.length != 0 ? locationIds : [-1];
											}

											if (params.TempBand || params["TempBand[]"]) {
												params["fromHealthScreen"] = true;
												params["customQueryHealth"] = true;
											}
											if (params.LightStatus || params["LightStatus[]"]) {
												params["fromLightScreen"] = true;
												params["customQueryHealth"] = true;
											}

											smartDevicHealthReducer(request, params, "AssetId").then(function (assetIds) {
												if (assetIds) {
													params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
												}

												if (params.PowerStatus || params["PowerStatus[]"]) {
													params.PowerBand = params.PowerStatus || params["PowerStatus[]"];
													params["fromPowerScreen"] = true;
													params["customQueryPower"] = true;
												}

												if (params.telemetryPowerStatus || params["telemetryPowerStatus[]"]) {
													params.telemetryPowerStatus = params.telemetryPowerStatus || params["telemetryPowerStatus[]"];
													params["fromPowerScreen"] = true;
													params["customQueryPower"] = true;
												}

												if (params.OperationalIssues && (params.OperationalIssues.indexOf("5") != -1 || params.OperationalIssues.indexOf("6") != -1) || params["OperationalIssues[]"]) {
													params.OperationalIssuesPower = params.OperationalIssues || params["OperationalIssues[]"];
													params["fromPowerScreen"] = true;
													params["customQueryPower"] = true;
												}
												smartDevicePowerReducer(request, params, "AssetId").then(function (assetIds) {
													delete params["fromPowerScreen"];
													delete params["customQueryPower"];
													if (assetIds) {
														params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
													}
													if (params.AlertTypeId || params.PriorityId || params.StatusId || params["AlertTypeId[]"] || params["PriorityId[]"] || params["StatusId[]"]) {
														params["fromOutletScreenAlert"] = true;
													}

													if (params.OperationalIssues && (params.OperationalIssues.indexOf("5") != -1 || params.OperationalIssues.indexOf("6") != -1) || params["OperationalIssues[]"]) {
														delete params["OperationalIssuesPower"];
													}

													if (params.OperationalIssues && (params.OperationalIssues.indexOf("1") != -1 || params.OperationalIssues.indexOf("2") != -1 || params.OperationalIssues.indexOf("3") != -1 || params.OperationalIssues.indexOf("4") != -1) || params["OperationalIssues[]"]) {
														params["OperationalIssuesHealth"] = params.OperationalIssues;
														params["customQueryHealthTele"] = true;
													}

													if ((params.CoolerHealth && (params.CoolerHealth.indexOf('1') != -1 || params.CoolerHealth.indexOf('2') != -1)) || params["CoolerHealth[]"] || params.TemperatureTele || params["TemperatureTele[]"] || params.telemetryLightStatus || params["telemetryLightStatus[]"] || params.TempLightIssue || params["TempLightIssue[]"]) {
														params.TemperatureTele = params.TemperatureTele || params["TemperatureTele[]"];
														params["customQueryHealthTele"] = true;
													}
													smartDeviceTelemetryHealth(request, params, "AssetId").then(function (assetIds) {
														if (assetIds) {
															params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
														}
														if (params.AlertTypeId || params.PriorityId || params.StatusId || params["AlertTypeId[]"] || params["PriorityId[]"] || params["StatusId[]"]) {
															params["fromOutletScreenAlert"] = true;
														}

														if (params.OperationalIssues || params["OperationalIssues[]"] || (params.CoolerHealth && (params.CoolerHealth.indexOf('1') != -1 || params.CoolerHealth.indexOf('2') != -1)) || params["CoolerHealth[]"] || params.TemperatureTele || params["TemperatureTele[]"] || params.telemetryLightStatus || params["telemetryLightStatus[]"] || params.TempLightIssue || params["TempLightIssue[]"]) {
															delete params["customQueryHealthTele"];
															delete params.TemperatureTele;
															delete params.TempLightIssue;
															delete params.CoolerHealth;
															delete params.OperationalIssuesHealth;
														}
														if (params.telemetryDoorCount || params["telemetryDoorCount[]"]) {
															params["customQueryDoorTele"] = true;
														}

														if ((params.CoolerPerformanceIndex && params.CoolerPerformanceIndex.indexOf("1") != -1)) {
															params["customQueryDoorTele"] = true;
														}


														if (params.CoolerHealth && params.CoolerHealth.indexOf("3") != -1) {
															params.CoolerHealthLowUti = params.CoolerHealth || params["CoolerHealth[]"];
															params["customQueryDoorTele"] = true;
														}

														smartDeviceTelemetryDoor(request, params, "AssetId").then(function (assetIds) {
															if (assetIds) {
																params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
															}

															if (params.AlertTypeId || params.PriorityId || params.StatusId || params["AlertTypeId[]"] || params["PriorityId[]"] || params["StatusId[]"]) {
																params["fromOutletScreenAlert"] = true;
															}

															if (params.telemetryDoorCount || params["telemetryDoorCount[]"]) {
																delete params["customQueryDoor"];
															}

															// For Cooler Helath > low Utilization Coolers 
															if (params.CoolerHealth && params.CoolerHealth.indexOf("3") != -1) {
																delete params["customQueryDoor"];
															}

															if ((params.CoolerPerformanceIndex && params.CoolerPerformanceIndex.indexOf("1") != -1)) {
																delete params["customQueryDoor"];
															}

															if (params.CompressorBand || params["CompressorBand[]"] || params.FanBand || params["FanBand[]"]) {
																params["customQueryTechnical"] = true;
															}

															smartDeviceTechnicalDiagnosticsReducer(request, params, "AssetId").then(function (assetIds) {
																if (assetIds) {
																	params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
																}

																if (params.CompressorBand || params["CompressorBand[]"] || params.FanBand || params["FanBand[]"]) {
																	delete params["customQueryTechnical"];
																}
																alertReducer(request, params, "AssetId").then(function (assetIds) {
																	if (assetIds) {
																		params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
																	}
																	smartDeviceReducer(request, params, "LinkedAssetId").then(function (assetIds) {
																		if (assetIds) {
																			delete params.GatewayId;
																			delete params.Reference;
																			params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
																		}
																		userSalesHierarchyReducer(request, params, "SalesHierarchyId").then(function (salesHierarchyIds) {
																			if (salesHierarchyIds) {
																				params["SalesHierarchyId[]"] = salesHierarchyIds.length != 0 ? salesHierarchyIds : [-1];
																			}

																			salesReducer(request, params, "LocationId").then(function (locationIds) {
																				if (locationIds) {
																					delete params.LocationId;
																					params["LocationId[]"] = locationIds.length != 0 ? locationIds : [-1];
																				}
																				outletReducer(request, params).then(function (locationIds) {
																					this.locationIds = null;
																					delete params.LocationId;
																					if (locationIds) {
																						delete params.LocationId;
																						params["LocationId[]"] = locationIds.length != 0 ? locationIds : [-1];
																						this.locationIds = params["LocationId[]"];
																					}

																					// if (params.DoorSwingsVsTarget || params["DoorSwingsVsTarget[]"]) {
																					// 	params["customQueryDoorSwing"] = true;
																					// }
																					assetReducer(request, params, "AssetId").then(function (assetIds) {
																						//console.log("Asset Reducer Completed");
																						// delete params["customQueryDoorSwing"];

																						if (assetIds) {
																							delete params.LocationId;
																							params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
																							this.assetIds = params["AssetId[]"];
																						} else {
																							this.assetIds = null
																						}

																						assetReducer(request, params, "LocationId").then(function (locationIds) {
																							//console.log("Asset Reducer Completed");
																							if (locationIds) {
																								delete params.LocationId;
																								params["LocationId[]"] = locationIds.length != 0 ? locationIds : [-1];
																								this.locationIds = params["LocationId[]"];
																							} else {
																								this.locationIds = this.locationIds ? this.locationIds : null;
																							}

																							callback(this.assetIds, this.locationIds);

																						}.bind(this)).catch(function (err) {
																							console.log(err);
																							 return reply(Boom.badRequest(err.message));
																						});
																					}.bind(this)).catch(function (err) {
																						console.log(err);
																						 return reply(Boom.badRequest(err.message));
																					});
																				}.bind(this)).catch(function (err) {
																					console.log(err);
																					 return reply(Boom.badRequest(err.message));
																				});
																			}.bind(this)).catch(function (err) {
																				console.log(err);
																				 return reply(Boom.badRequest(err.message));
																			});
																		}.bind(this)).catch(function (err) {
																			console.log(err);
																			 return reply(Boom.badRequest(err.message));
																		});
																	}.bind(this)).catch(function (err) {
																		console.log(err);
																		 return reply(Boom.badRequest(err.message));
																	});
																}.bind(this)).catch(function (err) {
																	console.log(err);
																	 return reply(Boom.badRequest(err.message));
																});
															}.bind(this)).catch(function (err) {
																console.log(err);
																 return reply(Boom.badRequest(err.message));
															});
														}.bind(this)).catch(function (err) {
															console.log(err);
															 return reply(Boom.badRequest(err.message));
														});
													}.bind(this)).catch(function (err) {
														console.log(err);
														 return reply(Boom.badRequest(err.message));
													});
												}.bind(this)).catch(function (err) {
													console.log(err);
													 return reply(Boom.badRequest(err.message));
												});
											}.bind(this)).catch(function (err) {
												console.log(err);
												 return reply(Boom.badRequest(err.message));
											});
										}.bind(this)).catch(function (err) {
											console.log(err);
											 return reply(Boom.badRequest(err.message));
										});
									}.bind(this)).catch(function (err) {
										console.log(err);
										 return reply(Boom.badRequest(err.message));
									});
								}.bind(this)).catch(function (err) {
									console.log(err);
									 return reply(Boom.badRequest(err.message));
								});
							}.bind(this)).catch(function (err) {
								console.log(err);
								 return reply(Boom.badRequest(err.message));
							});
						}.bind(this)).catch(function (err) {
							console.log(err);
							 return reply(Boom.badRequest(err.message));
						});
					}.bind(this)).catch(function (err) {
						console.log(err);
						 return reply(Boom.badRequest(err.message));
					});
				}.bind(this)).catch(function (err) {
					console.log(err);
					 return reply(Boom.badRequest(err.message));
				});
			}.bind(this)).catch(function (err) {
				console.log(err);
				 return reply(Boom.badRequest(err.message));
			});
		}.bind(this)).catch(function (err) {
			console.log(err);
			 return reply(Boom.badRequest(err.message));
		});
	}
	// applyReducers: function (request, params, reducers, callback) {
	// 	var smartDeviceReducer = reducers.smartDeviceReducer,
	// 		smartDeviceMovementReducer = reducers.smartDeviceMovementReducer,
	// 		smartDevicDoorStatusReducer = reducers.smartDevicDoorStatusReducer,
	// 		smartDevicHealthReducer = reducers.smartDevicHealthReducer,
	// 		smartDevicePowerReducer = reducers.smartDevicePowerReducer,
	// 		assetReducer = reducers.assetReducer,
	// 		salesRepReducer = reducers.salesRepReducer,
	// 		outletReducer = reducers.outletReducer,
	// 		alertReducer = reducers.alertReducer;

	// 	if (params.Displacement_To || params.Displacement_From || params["Displacement_To[]"] || params["Displacement_From[]"]) {
	// 		params["fromMovementScreen"] = true;
	// 		params.daysMovement = moment.duration(totalHours, 'hours').asDays();
	// 	}
	// 	smartDeviceMovementReducer(request, params, "AssetId").then(function (assetIds) {
	// 		if (assetIds) {
	// 			params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
	// 		}
	// 		if (params.DoorCount || params["DoorCount[]"]) {
	// 			params["fromDoorScreen"] = true;
	// 			params["customQueryDoor"] = true;
	// 		}
	// 		smartDevicDoorStatusReducer(request, params, "AssetId").then(function (assetIds) {
	// 			delete params["fromDoorScreen"];
	// 			delete params["customQueryDoor"];
	// 			if (assetIds) {
	// 				params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
	// 			}
	// 			if (params.TempBand || params["TempBand[]"]) {
	// 				params["fromHealthScreen"] = true;
	// 				params["customQueryHealth"] = true;
	// 			}

	// 			smartDevicHealthReducer(request, params, "AssetId").then(function (assetIds) {
	// 				delete params["fromHealthScreen"];
	// 				delete params["customQueryHealth"];
	// 				delete params["TempBand"];
	// 				delete params["TempBand[]"];
	// 				delete params["days"];
	// 				delete params["AssetDoor"];
	// 				if (assetIds) {
	// 					params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
	// 				}
	// 				if (params.LightStatus || params["LightStatus[]"]) {
	// 					params.LightStatusBand = params.LightStatus || params["LightStatus[]"];
	// 					params["fromLightScreen"] = true;
	// 					params["customQueryLight"] = true;
	// 				}
	// 				smartDevicHealthReducer(request, params, "AssetId").then(function (assetIds) {

	// 					if (assetIds) {
	// 						params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
	// 					}
	// 					if (params.PowerStatus || params["PowerStatus[]"]) {
	// 						params.PowerBand = params.PowerStatus || params["PowerStatus[]"];
	// 						params["fromPowerScreen"] = true;
	// 						params["customQueryPower"] = true;
	// 					}
	// 					smartDevicePowerReducer(request, params, "AssetId").then(function (assetIds) {
	// 						if (assetIds) {
	// 							params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
	// 						}
	// 						if (params.AlertTypeId || params.PriorityId || params.StatusId || params["AlertTypeId[]"] || params["PriorityId[]"] || params["StatusId[]"]) {
	// 							params["fromOutletScreenAlert"] = true;
	// 						}
	// 						alertReducer(request, params, "AssetId").then(function (assetIds) {
	// 							if (assetIds) {
	// 								params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
	// 							}
	// 							smartDeviceReducer(request, params, "SmartDeviceId").then(function (smartDeviceIds) {
	// 								if (smartDeviceIds) {
	// 									if (request.query.SmartDeviceManufacturerId || request.query["SmartDeviceManufacturerId[]"]) {
	// 										params["SmartDeviceId[]"] = smartDeviceIds.length != 0 ? smartDeviceIds : [-1];
	// 									}
	// 									delete params.LocationId;
	// 									if (request.query.SmartDeviceTypeId || request.query["SmartDeviceTypeId[]"]) {
	// 										delete params.SmartDeviceTypeId;
	// 										params["SmartDeviceId[]"] = smartDeviceIds.length != 0 ? smartDeviceIds : [-1];
	// 									}
	// 									if (Array.isArray(params.ConnectivityTypeId)) {
	// 										delete params.Reference;
	// 									} else if (params.ConnectivityTypeId == 2) {
	// 										delete params["LocationId[]"];
	// 										params["GatewayId[]"] = smartDeviceIds.length != 0 ? smartDeviceIds : [-1];
	// 									} else if (params.ConnectivityTypeId == 1) {
	// 										delete params["LocationId[]"];
	// 										params["SmartDeviceId[]"] = smartDeviceIds.length != 0 ? smartDeviceIds : [-1];
	// 									}
	// 								}
	// 								smartDeviceReducer(request, params, "LinkedAssetId").then(function (assetIds) {
	// 									if (assetIds && params["SmartDeviceId[]"]) {
	// 										delete params.GatewayId;
	// 										delete params.Reference;
	// 										params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
	// 									}
	// 									salesRepReducer(request, params, "LocationId").then(function (locationIds) {
	// 										if (locationIds) {
	// 											delete params.LocationId;
	// 											params["LocationId[]"] = locationIds.length != 0 ? locationIds : [-1];
	// 										}
	// 										outletReducer(request, params).then(function (locationIds) {
	// 											this.locationIds = null;
	// 											this.locationIds = locationIds;
	// 											delete params.LocationId;
	// 											params["LocationId[]"] = locationIds;
	// 											assetReducer(request, params, "AssetId").then(function (assetIds) {
	// 												//console.log("Asset Reducer Completed");
	// 												if (assetIds) {
	// 													delete params.LocationId;
	// 													params["AssetId[]"] = assetIds.length != 0 ? assetIds : [-1];
	// 													this.assetIds = params["AssetId[]"];
	// 												} else {
	// 													this.assetIds = null
	// 												}

	// 												assetReducer(request, params, "LocationId").then(function (locationIds) {
	// 													//console.log("Asset Reducer Completed");
	// 													if (locationIds) {
	// 														delete params.LocationId;
	// 														params["LocationId[]"] = locationIds.length != 0 ? locationIds : [-1];
	// 														this.locationIds = params["LocationId[]"];
	// 													} else {
	// 														this.locationIds = this.locationIds ? this.locationIds : null;
	// 													}

	// 													callback(this.assetIds, this.locationIds);

	// 												}.bind(this)).catch(function (err) {
	// 													console.log(err);
	// 													 return reply(Boom.badRequest(err.message));
	// 												});
	// 											}.bind(this)).catch(function (err) {
	// 												console.log(err);
	// 												 return reply(Boom.badRequest(err.message));
	// 											});
	// 										}.bind(this)).catch(function (err) {
	// 											console.log(err);
	// 											 return reply(Boom.badRequest(err.message));
	// 										});
	// 									}.bind(this)).catch(function (err) {
	// 										console.log(err);
	// 										 return reply(Boom.badRequest(err.message));
	// 									});
	// 								}.bind(this)).catch(function (err) {
	// 									console.log(err);
	// 									 return reply(Boom.badRequest(err.message));
	// 								});
	// 							}.bind(this)).catch(function (err) {
	// 								console.log(err);
	// 								 return reply(Boom.badRequest(err.message));
	// 							});
	// 						}.bind(this)).catch(function (err) {
	// 							console.log(err);
	// 							 return reply(Boom.badRequest(err.message));
	// 						});
	// 					}.bind(this)).catch(function (err) {
	// 						console.log(err);
	// 						 return reply(Boom.badRequest(err.message));
	// 					});
	// 				}.bind(this)).catch(function (err) {
	// 					console.log(err);
	// 					 return reply(Boom.badRequest(err.message));
	// 				});
	// 			}.bind(this)).catch(function (err) {
	// 				console.log(err);
	// 				 return reply(Boom.badRequest(err.message));
	// 			});
	// 		}.bind(this)).catch(function (err) {
	// 			console.log(err);
	// 			 return reply(Boom.badRequest(err.message));
	// 		});
	// 	}.bind(this)).catch(function (err) {
	// 		console.log(err);
	// 		 return reply(Boom.badRequest(err.message));
	// 	});
	// }
};