"use strict";

var util = require('../util');
var configEnv = require('../config/index');

var rangeOperators = {
	"<": "lt",
	"<=": "lte",
	">": "gt",
	">=": "gte"
};

class ElasticListBase {

	/* keyField */

	/* propertyNames */

	/* index */

	/* type */

	/* sort */

	/* relatedFilters */

	/* isClientBased */

	/* softDelete */

	constructor(config) {
		Object.assign(this, config);
	}

	list(context, config, body, listResultProcessor) {
		if (typeof config === 'string') {
			config = JSON.parse(config);
		}
		if (config === undefined || config === null) {
			config = {};
		}
		var start = typeof config.start === 'number' ? config.start : 0;
		var limit = typeof config.limit === 'number' ? config.limit : 100;
		var client = this.client;

		var searchParams = Object.assign({}, config);

		body = body || {
			from: start,
			size: limit,
			query: {

			}
		};

		if (!body.query) {
			body.query = {
				bool: {
					filter: []
				}
			};
		}

		if (!body.query.bool) {
			body.query.bool = {
				filter: []
			};
		}

		var sort;
		if (typeof config.sort === 'string') {
			sort = [{
				field: config.sort,
				dir: config.dir || 'asc'
			}];
		} else {
			sort = (Array.isArray(config.sort) && config.sort.length > 0) ? config.sort : this.sort;
		}

		var bool = body.query.bool;
		if (!bool.filter) {
			bool.filter = [];
		}

		if (this.type) {
			bool.filter.push({
				type: {
					value: this.type
				}
			});
		}

		var propertiesUpperCase = this.propertiesUpperCase;

		var systemProperties = ['_', 'index', 'sort', 'dir', 'start', 'limit'];

		var propertyDefs = this.propertyDefs,
			searchDefs = this.searchDefs || {},
			isClientBased = this.isClientBased;

		if (isClientBased) {
			var clientId = context.auth.credentials.user.ScopeId;
			if (clientId !== 0) {
				bool.filter.push({
					term: {
						ClientId: clientId
					}
				});
			}
		}

		var tags = context.auth.credentials.tags,
			limitLocation = Number(tags.LimitLocation);
		var limitCountry = Number(tags.LimitCountry),
			countryid = Number(tags.CountryId),
			responsibleCountryIds = tags.ResponsibleCountryIds;
		var countryids = [];
		countryids.push(countryid);
		if (responsibleCountryIds != "") {
			responsibleCountryIds = responsibleCountryIds.split(',');
			for (var i = 0; i < responsibleCountryIds.length; i++) {
				countryids.push(responsibleCountryIds[i]);
			}
		}
		if (limitCountry == 1) {
			if (responsibleCountryIds != "") {
				bool.filter.push({
					terms: {
						CountryId: countryids
					}
				});
			} else {
				bool.filter.push({
					term: {
						CountryId: countryid
					}
				});
			}
		}
		if (limitLocation != 0) {
			var locationIds = tags.LocationIds;
			if (this.keyField == "LocationId") {
				bool.filter.push({
					"terms": {
						"LocationId": {
							"index": "filteredlocations",
							"type": "locationIds",
							"id": context.auth.credentials.user.UserId,
							"path": "LocationId"
						}
					}
				});
			} else if (propertyDefs.get("LocationId")) {
				bool.filter.push({
					"terms": {
						"LocationId": {
							"index": "filteredlocations",
							"type": "locationIds",
							"id": context.auth.credentials.user.UserId,
							"path": "LocationId"
						}
					}
				});
			}
		}

		for (var o in searchParams) {
			var propertyName = o;
			var searchValue = searchParams[propertyName];
			if (searchValue === undefined || searchValue === null || searchValue.length === 0) {
				continue;
			}
			var operator = searchParams[propertyName + "_operator"];
			if (propertyName.indexOf('match_') === 0) {
				propertyName = propertyName.substr(6);
				operator = "MATCH";
			}
			if (propertyName.indexOf('search_') === 0) {
				propertyName = propertyName.substr(7);
				operator = "LIKE";
			}
			if (propertyName.indexOf('_From') != -1) {
				propertyName = propertyName.replace("_From", '');
			}
			if (propertyName.indexOf('_To') != -1) {
				propertyName = propertyName.replace("_To", '');
			}
			if (systemProperties.indexOf(o) === -1) {
				if (propertyName.endsWith("[]")) {
					operator = "IN";
					propertyName = propertyName.substr(0, propertyName.length - 2);
				}
				if (typeof operator !== 'string' || operator.length === 0) {
					operator = "=";
				}
				propertyName = (propertiesUpperCase ? (propertyName.substr(0, 1).toUpperCase()) : (propertyName.substr(0, 1).toLowerCase())) + propertyName.substr(1);
				var criteria = null;
				if (searchDefs[propertyName]) {
					criteria = searchDefs[propertyName](searchValue);
				} else {
					var propertyDef = propertyDefs.get(propertyName);
					if (propertyDef) {
						var criteria, term = {};
						if (operator === "LIKE") {
							term[propertyName] = searchValue;
							criteria = {
								bool: {
									"should": []
								}
							};


							if (configEnv.env === "development") {
								searchValue = searchValue.toUpperCase();
							} else if (configEnv.env === "qaAzure") {
								searchValue = searchValue.toLowerCase();
							}

							criteria.bool.should.push({
								wildcard: {
									[propertyName]: '*' + searchValue + '*'
								}
							});

							criteria.bool.should.push({
								"match": {
									[propertyName]: {
										"query": searchValue,
										"analyzer": "standard",
										"minimum_should_match": "100%"
									}
								}
							});
						} else if (operator === "IN") {
							term[propertyName] = searchValue;
							criteria = Array.isArray(searchValue) ? {
								terms: term
							} : {
								term: term
							}
						} else if (rangeOperators[operator]) {
							term[propertyName] = {};
							term[propertyName][rangeOperators[operator]] = searchValue;
							criteria = {
								range: term
							};
						} else if (operator === "!=" || operator === "<>") {
							term[propertyName] = searchValue;
							if (!bool.must_not) {
								bool.must_not = [];
							}
							bool.must_not.push(Array.isArray(searchValue) ? {
								terms: term
							} : {
								term: term
							});
						} else if (operator === "MATCH") {
							var matchValue = []
							if (Array.isArray(searchValue)) {
								searchValue.forEach(function (value) {
									matchValue.push({
										match: {
											[propertyName]: {
												query: value,
												operator: "and"
											}
										}
									});
								});
							} else {
								matchValue.push({
									match: {
										[propertyName]: {
											query: searchValue,
											operator: "and"
										}
									}
								});
							}
							criteria = {
								bool: {
									"should": matchValue
								}
							};
						} else {
							term[propertyName] = searchValue;
							var id = context.auth.credentials.sid;
							if (propertyName == "IsKeyLocation") {
								term[propertyName] = true;
								criteria = Array.isArray(searchValue) ? {
									terms: term
								} : {
									term: term
								};
							} else if (propertyName == "IsOpenFront") {
								term[propertyName] = true;
								criteria = Array.isArray(searchValue) ? {
									terms: term
								} : {
									term: term
								};
							} else if (propertyName == "IsFactoryAsset") {
								term[propertyName] = true;
								criteria = Array.isArray(searchValue) ? {
									terms: term
								} : {
									term: term
								};
							}
							//  else if (propertyName == "AlertTypeId" || propertyName == "StatusId" || propertyName == "PriorityId") {

							// } 
							else if (propertyName == "AssetId" && searchParams.isCTF == true) {
								criteria = {
									"terms": {
										"AssetId": {
											"index": "cooler-iot-ctfassets",
											"type": "assets",
											"id": id,
											"path": "AssetId"
										}
									}
								};
							} else {
								if (propertyName == "SmartDeviceManufacturerId") {
									if (bool.filter[0].type.value == "Asset") {
										var should = bool.should || [];
										should.push({
											"term": {
												IsGateway: true
											}
										});
										// should.push({
										// 	"terms": {
										// 		SmartDeviceManufacturerId: searchValue
										// 	}
										// });
										bool.should = should;
										criteria = Array.isArray(searchValue) ? {
											terms: term
										} : {
											term: term
										};
									} else {
										criteria = Array.isArray(searchValue) ? {
											terms: term
										} : {
											term: term
										};
									}
								} else {
									criteria = Array.isArray(searchValue) ? {
										terms: term
									} : {
										term: term
									};
								}
							}
						}
					}
				}
				if (criteria) {
					bool.filter.push(criteria);
				}
			}
		}

		if (sort && sort.length > 0) {
			var sortInfo = [];
			for (var i = 0, len = sort.length; i < len; i++) {
				var sortItem = sort[i];
				var o = {};
				o[sortItem.field] = {
					order: ((sortItem.dir === 'desc' || sortItem.dir === 'DESC') ? 'desc' : 'asc')
				};
				sortInfo.push(o);
			}
			body.sort = sortInfo;
		}

		var indexName = config.index || this.index,
			listResultProcessor = listResultProcessor || this.listResultProcessor;

		var types = config.types || this.types;

		var me = this;

		if (this.softDelete) {
			var term = {};
			term[this.softDelete] = 0;
			bool.filter.push({
				term: term
			});
		}

		if (typeof this.customizeQuery === 'function') {
			this.customizeQuery(body, searchParams);
		}

		return new Promise(function (resolve, reject) {
			me.applyRelatedFilters(context, searchParams, null).then(function (ids) {
				if (Array.isArray(ids)) {
					bool.filter.push({
						terms: {
							_id: ids
						}
					});
				}
				var search;
				if (types) {
					search = {
						index: indexName,
						type: types,
						body: body
					};
				} else {
					search = {
						index: indexName,
						body: body
					}
				}
				return client.search(search);
			}).then(function (resp) {
				var result = listResultProcessor(resp, body, searchParams);
				resolve(result, resp);
			}, function (err) {
				console.log(err);
				reject(err);
			}).catch(function (err) {
				console.log(err);
				reject(err);
			});
		});
	}

	listResultProcessor(resp, callBack) {
		var records = [],
			total = resp.hits.total;
		if (total > 0) {
			var hits = resp.hits.hits;
			for (var i = 0, len = hits.length; i < len; i++) {
				records.push(hits[i]._source);
			}
		}
		return {
			success: true,
			records: records,
			recordCount: total
		};
	}

	applyRelatedFilters(context, query, ids) {
		var relatedFilters = this.relatedFilters,
			reducerList = [];
		if (relatedFilters) {
			var reducers = {};
			for (var modelName in relatedFilters) {
				var relatedFilter = relatedFilters[modelName],
					filterKeys = relatedFilter.model.prototype.propertyDefs;
				var filtersApplied = [];
				for (var i = 0, len = filterKeys.length; i < len; i++) {
					var queryParameter = filterKeys.get(i);
					var filterValue = query[modelName + "_" + queryParameter];
					if (filterValue !== undefined) {
						if (!reducers[modelName]) {
							reducers[modelName] = Object.assign({
								query: Object.assign({}, relatedFilter.baseQuery)
							}, relatedFilter);
						}
						reducers[modelName].query[queryParameter] = filterValue;
					}
				}
			}
			for (var reducer in reducers) {
				reducerList.push(reducers[reducer]);
			}

			var keyField = this.keyField,
				client = this.client;

			var filterList = function (reducer, index, done) {

				var search = {
					size: 0,
					aggs: {
						ids: {
							terms: {
								field: keyField,
								size: 0
							}
						}
					}
				};

				if (ids) {
					var terms = {};
					terms[keyField] = ids;
					search.query = {
						bool: {
							filter: [{
								terms: terms
							}]
						}
					}
				}

				var ModelType = reducer.model;
				var model = new ModelType();
				model.client = client;
				model.list(context, reducer.query, search, function (resp, callBack) {
					var records = [],
						hits = resp.aggregations.ids.buckets;
					for (var i = 0, len = hits.length; i < len; i++) {
						records.push(hits[i].key);
					}
					return records;
				}).then(function (reducedIds) {
					ids = reducedIds;
					done();
				}).catch(function (err) {
					console.log(err);
					done();
				});
			};
		}

		return new Promise(function (resolve, reject) {
			if (reducerList.length === 0) {
				resolve(ids);
				return;
			}
			util.doSynchronousLoop(reducerList, filterList, function () {
				resolve(ids);
			});
		});
	}
};

class propertyDefs {
	constructor(propertyNames) {
		var lookup = {};

		propertyNames.push("_id");
		for (var i = 0, len = propertyNames.length; i < len; i++) {
			var propertyName = propertyNames[i];
			if (typeof propertyName === 'string') {
				propertyName = {
					name: propertyName
				};
				propertyNames[i] = propertyName;
			}

			if (!propertyName.type) {
				if (propertyName.name.endsWith("Id")) {
					propertyName.type = "number";
				} else if (propertyName.name.startsWith("Is")) {
					propertyName.type = "bool";
				} else {
					propertyName.type = "auto";
				}
			}
			lookup[propertyNames[i].name] = propertyNames[i];
		}
		this.defs = propertyNames;
		this.lookup = lookup;
	}

	get(propertyName) {
		if (typeof propertyName === 'string') {
			return this.lookup[propertyName];
		} else if (typeof propertyName === 'number') {
			return this.defs[propertyName];
		}
	}

	length() {
		return this.defs.length;
	}
};

ElasticListBase.assignPropertyDefs = function (propertyNames) {
	return new propertyDefs(propertyNames);
};

Object.assign(ElasticListBase.prototype, {
	propertiesUpperCase: true,
	isClientBased: true
});

module.exports = ElasticListBase;