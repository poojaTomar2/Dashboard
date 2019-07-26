"use strict";

var ElasticListBase = require('./elasticListBase'),
	util = require('../util');

class smartDeviceTelemetryHealth extends ElasticListBase {
	customizeQuery(body, params) {
		var bool = body.query.bool;
		var must = bool.must_not || [];
		must.push({
			"term": {
				"IsFromHealth": true
			}
		});
		bool.must = must;
		if (params.DeviceLightStatus) {
			if (body.aggs) {
				body.aggs["AssetBucket"] = {
					"filter": {
						"bool": {
							"must": [],
							"must_not": []
						}
					},
					"aggs": {
						"top_tags": {
							"terms": {
								"field": "AssetId",
								"size": 200000
							},
							"aggs": {
								"top_hit": {
									"top_hits": {
										"sort": [{
											"EventDate": {
												"order": "desc"
											}
										}],
										"_source": {
											"includes": ["IsLightOff", "AssetId"]
										},
										"size": 1
									}
								}
							}
						}
					}
				}
			} else {
				body.aggs = {
					"AssetBucket": {
						"filter": {
							"bool": {
								"must": [],
								"must_not": []
							}
						},
						"aggs": {
							"top_tags": {
								"terms": {
									"field": "AssetId",
									"size": 200000
								},
								"aggs": {
									"top_hit": {
										"top_hits": {
											"sort": [{
												"EventDate": {
													"order": "desc"
												}
											}],
											"_source": {
												"includes": ["IsLightOff"]
											},
											"size": 1
										}
									}
								}
							}
						}
					}
				};
			}
		}
		var mustNot = bool.must_not || [];
		bool.mustNot = mustNot;
		mustNot.push();
		var range;
		if (params.TemperatureTele) {

			if (body.aggs) {
				body.aggs["AssetIds"] = {
					"terms": {
						"field": "AssetId",
						"size": 100000
					},
					"aggs": {
						"Temperature": {
							"avg": {
								"field": "AverageTemperature"
							}
						}
					}
				}
			} else {
				body.aggs = {
					"AssetIds": {
						"terms": {
							"field": "AssetId",
							"size": 100000
						},
						"aggs": {
							"Temperature": {
								"avg": {
									"field": "AverageTemperature"
								}
							}
						}
					}
				};
			}
		}

		if (params.EvaporatorTemperatureTele) {

			if (body.aggs) {
				body.aggs["AssetIds"] = {
					"terms": {
						"field": "AssetId",
						"size": 100000
					},
					"aggs": {
						"EvTemperature": {
							"avg": {
								"field": "AverageEvaporatorTemperature"
							}
						}
					}
				}
			} else {
				body.aggs = {
					"AssetIds": {
						"terms": {
							"field": "AssetId",
							"size": 100000
						},
						"aggs": {
							"EvTemperature": {
								"avg": {
									"field": "AverageEvaporatorTemperature"
								}
							}
						}
					}
				};
			}
		}

		// Temperature and Light Status
		if (params.TempLightIssue) {
			if (body.aggs) {
				body.aggs["TempLightIssue"] = {
					"filter": {
						"bool": {
							"must": [],
							"must_not": []
						}
					},
					"aggs": {
						"top_tags": {
							"terms": {
								"field": "AssetId",
								"size": 100000
							},
							"aggs": {
								"top_hit": {
									"top_hits": {
										"sort": [{
											"EventDate": {
												"order": "desc"
											}
										}],
										"_source": {
											"includes": ["IsLightIssue", "IsTemperatureIssue"]
										},
										"size": 1
									}
								}
							}
						}
					}
				}
			} else {
				body.aggs = {
					"TempLightIssue": {
						"filter": {
							"bool": {
								"must": [],
								"must_not": []
							}
						},
						"aggs": {
							"top_tags": {
								"terms": {
									"field": "AssetId",
									"size": 100000
								},
								"aggs": {
									"top_hit": {
										"top_hits": {
											"sort": [{
												"EventDate": {
													"order": "desc"
												}
											}],
											"_source": {
												"includes": ["IsLightIssue", "IsTemperatureIssue"]
											},
											"size": 1
										}
									}
								}
							}
						}
					}
				};
			}
		}
		// Cooler Health > Cooler Above 7 (Temp)
		if (params.CoolerHealthTele && (params.CoolerHealthTele.indexOf("1") != -1)) {
			if (body.aggs) {
				body.aggs["TempAbove7"] = {
					"terms": {
						"field": "AssetId",
						"size": 100000
					},
					"aggs": {
						"TempAbove7": {
							"filter": {
								"term": {
									"IsTemperatureAbove7": true
								}
							},
							"aggs": {
								"TempAbove7": {
									"cardinality": {
										"field": "AssetId"
									}
								}
							}
						}
					}
				}
			} else {
				body.aggs = {
					"TempAbove7": {
						"terms": {
							"field": "AssetId",
							"size": 100000
						},
						"aggs": {
							"TempAbove7": {
								"filter": {
									"term": {
										"IsTemperatureAbove7": true
									}
								},
								"aggs": {
									"TempAbove7": {
										"cardinality": {
											"field": "AssetId"
										}
									}
								}
							}
						}
					}
				};
			}
		}

		// Cooler Health > Coolers With Low Light
		if (params.CoolerHealthTele && (params.CoolerHealthTele.indexOf("2") != -1)) {
			if (body.aggs) {
				body.aggs["CoolersWithLowLight"] = {
					"terms": {
						"field": "AssetId",
						"size": 100000
					},
					"aggs": {
						"CoolersWithLowLight": {
							"filter": {
								"bool": {
									"must": [{
										"term": {
											"DeviceLightStatus": "No Light"
										}
									}]
								}
							},
							"aggs": {
								"CoolersWithLowLight": {
									"cardinality": {
										"field": "AssetId"
									}
								}
							}
						}
					}
				}
			} else {
				body.aggs = {
					"CoolersWithLowLight": {
						"terms": {
							"field": "AssetId",
							"size": 100000
						},
						"aggs": {
							"CoolersWithLowLight": {
								"filter": {
									"bool": {
										"must": [{
											"term": {
												"DeviceLightStatus": "No Light"
											}
										}]
									}
								},
								"aggs": {
									"CoolersWithLowLight": {
										"cardinality": {
											"field": "AssetId"
										}
									}
								}
							}
						}
					}
				};
			}
		}


		if (params.OperationalIssuesHealth && (params.OperationalIssuesHealth.indexOf("1") != -1 || params.OperationalIssuesHealth.indexOf("2") != -1 || params.OperationalIssuesHealth.indexOf("3") != -1 || params.OperationalIssuesHealth.indexOf("4") != -1)) {


			var TempLightIssueCount = {
				"filter": {
					"bool": {
						"must": [],
						"must_not": []
					}
				},
				"aggs": {
					"TemperatureIssue": {
						"filter": {
							"bool": {
								"must_not": []
							}
						},
						"aggs": {
							"AssetBucket": {
								"terms": {
									"field": "AssetId",
									"size": 100000
								},
								"aggs": {
									"HealthInterval": {
										"sum": {
											"field": "SumOfHealthIntervalTempGT12"
										}
									}
								}
							}
						}
					},
					"LightIssue": {
						"filter": {
							"bool": {
								"should": [{
									"term": {
									  "DeviceLightStatus": "No Light"
									}
								  },
								  {
									"term": {
									  "DeviceLightStatus": "Low Brightness"
									}
								  }
								]
							}
						},
						"aggs": {
							"AssetBucket": {
								"terms": {
									"field": "AssetId",
									"size": 100000
								},
								"aggs": {
									"HealthInterval": {
										"sum": {
											"field": "SumOfHealthInterval"
										}
									}
								}
							}
						}
					}
				}
			};

			if (body.aggs) {
				body.aggs["TempLightIssueCount"] = TempLightIssueCount;
			} else {
				body.aggs = {
					"TempLightIssueCount": TempLightIssueCount
				};
			}
		}

		util.applyDateFilter(params, bool, this.dateFilter);
		if (!params.daysPower) {
			params.daysPower = params.totalDays
		}
		console.log("healthhealthhealthhealth");
		//console.log(JSON.stringify(body));
	}
};

Object.assign(smartDeviceTelemetryHealth.prototype, {
	index: 'cooler-iot-asseteventdatasummary',
	type: 'AssetEventDataSummary',
	propertyDefs: ElasticListBase.assignPropertyDefs([
		"SmartDeviceId",
		"GatewayId",
		"DeviceSerial",
		"GatewayMac",
		"GatewaySerialNumber",
		"EventId",
		"EventDate",
		"CreatedOn",
		"AssetId",
		"ClientId",
		"CountryId",
		"StateId",
		"LocationId",
		"City",
		"TimeZoneId",
		"AssetSerialNumber",
		"OutletTypeId",
		"SmartDeviceManufactureId"
	]),
	softDelete: null,
	dateFilter: 'EventDate'
});

module.exports = smartDeviceTelemetryHealth;