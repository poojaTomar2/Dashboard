var sql = require('mssql');
var Sequelize = require('sequelize');
var config = require('../config'),
	sqlConfig = config.sql;
var log4js = require('log4js'),
	util = require('../util'),
	crypto = require('crypto');
var Boom = require('boom');
var logger = log4js.getLogger();
var consts = require('../controllers/consts');
var threshold = consts.Threshold;
var elasticClient = require('../models').elasticClient;

var sequelize = new Sequelize(sqlConfig.database, sqlConfig.user, sqlConfig.password, {
	host: sqlConfig.server,
	dialect: 'mssql',
	dialectOptions: sqlConfig.dialectOptions,
	multipleStatements: true,
	pool: {
		max: 5,
		min: 0,
		idle: 10000
	},
	define: {
		timestamps: false // true by default
	}
});

module.exports = {
	globalCombos: ['Country', 'LocationClassification', 'LocationType', 'AlertType', 'CityFilter', 'AlertStatus', 'SensorType', 'AssetTypeFacings', 'SmartDeviceType'],
	locationCombos: ['Country', 'LocationClassification', 'LocationType', 'CityFilter', 'Address'],
	assetCombos: ['Manufacturer', 'AssetType', 'AssetTypeFacings'],
	alertCombos: ['AlertType'],
	validateUser: function (username, password, encrypt) {
		var hmac = crypto.createHash('sha1');

		var bind = {},
			query = "EXEC dbo.Security_Login $userName, $passwordHash";
		bind.userName = username;
		if (encrypt === "true") {
			bind.passwordHash = hmac.update(password).digest('hex').toUpperCase();
		} else {
			bind.passwordHash = password;
		}

		return new Promise(function (resolve, reject) {
			sequelize.query(query, {
				bind: bind
			}).then(function (results) {
				var data = results[0];
				if (data.length < 1) {
					resolve({
						success: false
					});
				} else {

					// hackish as results are merged by sequelize
					var roles = [],
						modules = {},
						tags = {};
					for (var i = 1, len = data.length; i < len; i++) {
						var row = data[i];
						if (row.Role) {
							roles.push(row);
						} else if (row.Module) {
							modules[row.Module] = row;
						} else if (row.Key) {
							tags[row.Key] = row.Value;
						}
					}

					tags.TemperatureMax = tags.TemperatureMax == null ? threshold.MaxTempValue : tags.TemperatureMax;
					tags.TemperatureMin = tags.TemperatureMin == null ? threshold.MinTempValue : tags.TemperatureMin;
					tags.LightMax = tags.LightMax == null ? threshold.LightMax : tags.LightMax;
					tags.LightMin = tags.LightMin == null ? threshold.LightMin : tags.LightMin;
					tags.OutOfStockSKU = tags.OutOfStockSKU == null ? threshold.OOSSKU : tags.OutOfStockSKU;
					tags.PowerOffDuration = tags.PowerOffDuration == null ? threshold.PowerOff : tags.PowerOffDuration;
					tags.HealthIntervals = tags.HealthIntervals == null ? threshold.HealthIntervals : tags.HealthIntervals;
					tags.DoorCount = tags.DoorCount == null ? threshold.LowUtilization : tags.DoorCount;

					var limitLocation = Number(tags.LimitLocation);
					if (limitLocation != 0) {
						var UserId = data[0].UserId;
						var promises = [];
						var bind = {},
							query = "EXEC dbo.USP_GetUserTempLocation $UserId";
						bind.UserId = UserId;
						Promise.all(promises).then(function (values) {
							sequelize.query(query, {
								bind: bind
							}).then(function (results) {
								var data2 = results[0];
								if (data2.length < 1) {
									resolve({
										success: false
									});
								} else {
									elasticClient.indices.create({
										index: 'filteredlocations'
									}, function (err, resp, status) {
										if (err) {
											console.log(err);
										} else {
											console.log("create", resp);
										}
										var locationIds
										if (data2[0].LocationInCSV) {
											locationIds = data2[0].LocationInCSV.split(',');
										}

										elasticClient.search()

										elasticClient.index({
											index: 'filteredlocations',
											id: data[0].UserId,
											type: 'locationIds',
											body: {
												"LocationId": locationIds
											}
										}, function (err, resp, status) {
											console.log(resp);
											tags.LocationIds = [];
											resolve({
												success: true,
												data: {
													user: data[0],
													roles: roles,
													modules: modules,
													tags: tags
												}
											});
										});
									});
								}
							});
						});
					} else {
						resolve({
							success: true,
							data: {
								user: data[0],
								roles: roles,
								modules: modules,
								tags: tags
							}
						});
					}
				}
			}).catch(function (err) {
				reject(err);
			});
		});
	},
	validateUserSso: function (username, password, encrypt) {
		var hmac = crypto.createHash('sha1');

		var bind = {},
			//query = "EXEC dbo.Security_Login $userName, $passwordHash";
			query = "EXEC dbo.Security_Login $userName,$passwordHash";
		bind.userName = username;
		bind.passwordHash = null;
		// if (encrypt === "true") {
		// 	bind.passwordHash = hmac.update(password).digest('hex').toUpperCase();
		// } else {
		// 	bind.passwordHash = password;
		// }

		return new Promise(function (resolve, reject) {
			sequelize.query(query, {
				bind: bind
			}).then(function (results) {
				var data = results[0];
				if (data.length < 1) {
					resolve({
						success: false
					});
				} else {

					// hackish as results are merged by sequelize
					var roles = [],
						modules = {},
						tags = {};
					for (var i = 1, len = data.length; i < len; i++) {
						var row = data[i];
						if (row.Role) {
							roles.push(row);
						} else if (row.Module) {
							modules[row.Module] = row;
						} else if (row.Key) {
							tags[row.Key] = row.Value;
						}
					}

					tags.TemperatureMax = tags.TemperatureMax == null ? threshold.MaxTempValue : tags.TemperatureMax;
					tags.TemperatureMin = tags.TemperatureMin == null ? threshold.MinTempValue : tags.TemperatureMin;
					tags.LightMax = tags.LightMax == null ? threshold.LightMax : tags.LightMax;
					tags.LightMin = tags.LightMin == null ? threshold.LightMin : tags.LightMin;
					tags.OutOfStockSKU = tags.OutOfStockSKU == null ? threshold.OOSSKU : tags.OutOfStockSKU;
					tags.PowerOffDuration = tags.PowerOffDuration == null ? threshold.PowerOff : tags.PowerOffDuration;
					tags.HealthIntervals = tags.HealthIntervals == null ? threshold.HealthIntervals : tags.HealthIntervals;
					tags.DoorCount = tags.DoorCount == null ? threshold.LowUtilization : tags.DoorCount;

					var limitLocation = Number(tags.LimitLocation);
					if (limitLocation != 0) {
						var UserId = data[0].UserId;
						var promises = [];
						var bind = {},
							query = "EXEC dbo.USP_GetUserTempLocation $UserId";
						bind.UserId = UserId;
						Promise.all(promises).then(function (values) {
							sequelize.query(query, {
								bind: bind
							}).then(function (results) {
								var data2 = results[0];
								if (data2.length < 1) {
									resolve({
										success: false
									});
								} else {
									elasticClient.indices.create({
										index: 'filteredlocations'
									}, function (err, resp, status) {
										if (err) {
											console.log(err);
										} else {
											console.log("create", resp);
										}
										var locationIds
										if (data2[0].LocationInCSV) {
											locationIds = data2[0].LocationInCSV.split(',');
										}

										elasticClient.search()

										elasticClient.index({
											index: 'filteredlocations',
											id: data[0].UserId,
											type: 'locationIds',
											body: {
												"LocationId": locationIds
											}
										}, function (err, resp, status) {
											console.log(resp);
											tags.LocationIds = [];
											resolve({
												success: true,
												data: {
													user: data[0],
													roles: roles,
													modules: modules,
													tags: tags
												}
											});
										});
									});
								}
							});
						});
					} else {
						resolve({
							success: true,
							data: {
								user: data[0],
								roles: roles,
								modules: modules,
								tags: tags
							}
						});
					}
				}
			}).catch(function (err) {
				reject(err);
			});
		});
	},
	getUserDetil: function (request) {
		var bind = {},
			result = {},
			query = "SELECT UserName, PasswordHash FROM Token LEFT OUTER JOIN Security_User ON Token.UserId = Security_User.UserId WHERE TokenId = $tokenId";
		bind.tokenId = request.query.tokenId;

		return new Promise(function (resolve, reject) {
			sequelize.query(query, {
				bind: bind
			}).then(function (results) {
				var data = results[0];
				if (data.length < 1) {
					resolve({
						success: false
					});
				} else {
					resolve({
						success: true,
						data: results[0]
					});
				}
			}).catch(function (err) {
				reject(err);
			});
		});
	},

	getSqlData: function (queries) {
		var result = {};
		return new Promise(function (resolve, reject) {
			sequelize.query(queries.sql, {
				bind: queries.bind
			}).then(function (results) {
				var data = results[0];
				if (data.length < 1) {
					resolve({
						success: false
					});
				} else {
					queries.comboTypes.forEach(function (element) {
						result[element] = data.filter(data => data.ComboType == element || data.ComboType == undefined);
					}, this);

					resolve({
						success: true,
						data: result
					});
				}
			}).catch(function (err) {
				reject(err);
			});
		});
	},

	getCombos: function (comboTypes, clientId, userId, limitLocation, limitCountry, reply) {
		var bind = {},
			bindSales = {},
			result = {},
			query = "EXEC dbo.GetDashboardComboData $clientId, $userId",
			querySalesHierarchy = "EXEC dbo.getSalesHierarchyForDashboard $clientId, $userId, $limitLocation, $limitCountry";
		// querySalesHierarchy = "EXEC dbo.getSalesHierarchy $clientId, $userId, $limitLocation";
		bind.clientId = clientId,
			bindSales.clientId = clientId,
			//bindSales.userId = userId,
			bindSales.limitLocation = Number(limitLocation);
		bindSales.limitCountry = Number(limitCountry);
		if (Number(limitLocation) == 1 || Number(limitCountry) == 1) {
			bind.userId = userId;
		} else {
			bind.userId = null;
		}
		if (Number(limitLocation) == 1 || Number(limitCountry) == 1) {
			bindSales.userId = userId;
		} else {
			bindSales.userId = null;
		}

		if (clientId == 0) {
			bind.clientId = null
		}

		var queries = [{
			"sql": query,
			"bind": bind,
			"comboTypes": comboTypes
		}, {
			"sql": querySalesHierarchy,
			"bind": bindSales,
			"comboTypes": ["SalesHierarchy"]
		}]

		var promises = [];

		for (var i = 0, len = queries.length; i < len; i++) {
			var query = queries[i];
			promises.push(this.getSqlData(queries[i]));
		}


		Promise.all(promises).then(function (values) {
			var data = {};
			for (var i = 0, len = values.length; i < len; i++) {
				var value = values[i];
				Object.assign(data, value.data)
			}
			return reply({
				success: true,
				data: data
			});
		}, function (err) {
			console.trace(err.message);
			return reply(Boom.badRequest(err.message));
		});
	},

	getCombosVisit: function (comboTypes, clientId) {
		var data = {},
			globalCombos = this.globalCombos;

		var getCombo = function (comboType, index, done) {
			if (comboType == 'Location') {
				var bind = {},
					query = "SELECT DISTINCT ISNULL(L.Code, 'NULL') + '-' + ISNULL(L.Name, 'NULL') AS DisplayValue, L.LocationId AS LookupId FROM dbo.Location AS L WITH(NOLOCK)	LEFT JOIN dbo.Asset AS A WITH(NOLOCK) ON A.LocationId = L.LocationId	WHERE L.IsDeleted = 0 AND A.IsDeleted = 0 AND A.IsSmartAsset = 1 AND L.clientId =" + clientId;
			} else {
				var bind = {},
					query = "SELECT LookupId, DisplayValue FROM dbo.vw" + comboType + "LookupList";

				if (typeof clientId === 'number' && clientId !== 0 && globalCombos.indexOf(comboType) === -1) {
					query += comboType == "Location" ? ' WHERE CustomValue = $clientId And IsSmartAsset = 1' : ' WHERE ClientId = $clientId And IsSmartAsset = 1';
					bind.clientId = clientId;
				}

				query += ' ORDER BY DisplayValue';
			}

			sequelize.query(query, {
				type: sequelize.QueryTypes.SELECT,
				bind: bind
			}).then(function (listData) {
				data[comboType] = listData;
				done();
			}).catch(function (err) {
				data[comboType] = err;
				done();
			});
		};

		return new Promise(function (resolve, reject) {
			util.doSynchronousLoop(comboTypes, getCombo, function () {
				resolve(data);
			});
		});
	},

	getCombosTimeZone: function (comboTypes, clientId) {
		var data = {},
			globalCombos = this.globalCombos;

		var getCombo = function (comboType, index, done) {

			var bind = {},
				query = "select TimeZoneId,StdTimeDiff,GenericAbbreviation from timeZone";

			// if (typeof clientId === 'number' && clientId !== 0 && globalCombos.indexOf(comboType) === -1) {
			// 	query += comboType == "Location" ? ' WHERE CustomValue = $clientId' : ' WHERE ClientId = $clientId';
			// 	bind.clientId = clientId;
			// }

			//query += ' ORDER BY DisplayValue';

			sequelize.query(query, {
				type: sequelize.QueryTypes.SELECT,
				bind: bind
			}).then(function (listData) {
				data[comboType] = listData;
				done();
			}).catch(function (err) {
				data[comboType] = err;
				done();
			});
		};

		return new Promise(function (resolve, reject) {
			util.doSynchronousLoop(comboTypes, getCombo, function () {
				resolve(data);
			});
		});
	},

	updateAlertStatus: function (alertId, statusId) {
		var bind = {},
			query = "UPDATE Alert SET StatusId = $statusId WHERE AlertId = $alertId";
		bind.alertId = alertId;
		bind.statusId = statusId;

		return new Promise(function (resolve, reject) {
			sequelize.query(query, {
				bind: bind
			}).then(function (results) {
				if (results) {
					resolve({
						success: true
					});
				}
			}).catch(function (err) {
				reject(err);
			});
		});
	},

	preferenceState: function (request, reply) {
		var bind = {},
			params = request.payload,
			action = params.action,
			query = "";
		quaryNew = '';
		bind.GridId = 'DashboardFilter',
			bind.UserId = request.auth.credentials.user.UserId,
			bind.Param1 = '1%',
			bind.PrefName = params.PrefName,
			bind.IsDefault = params.IsDefault,
			bind.PrefDesc = params.PrefDFesc,
			bind.PrefValue = params.PrefValue,
			bind.ColumnInfo = params.PrefValue,
			bind.PrefId = params.PrefId,
			bind.Version = params.Version;

		switch (action) {
			case 'list':
				query = "exec [dbo].getGridPreference $PrefId, $UserId";
				break;
			case 'load':
				query = "SELECT * FROM vwGridPreferenceList WHERE ((GridId = $GridId AND ([CreatedByUserId] = -1 OR [CreatedByUserId] = $UserId) AND ([CreatedByUserId] <> -1))) ORDER BY CreatedByUserId DESC"
				break;
			case 'save':
				query = "exec [dbo].addGridPreference $GridId, $IsDefault, $PrefDesc, $PrefName, $PrefValue, $GridId, $GridId, $ColumnInfo , $UserId , 0, 0x0000000000F7D865";
				break;
			case 'update':
				//query = "exec [dbo].updateGridPreference $PrefId, $GridId, $IsDefault, $PrefDesc, $PrefName, $PrefValue, $GridId, $GridId, $ColumnInfo, $UserId , Convert(varchar(20), $Version), 0";
				query = "UPDATE [dbo].[GridPreference] SET [GridId] = $GridId, [IsDefault] = $IsDefault, [PrefDesc] = $PrefDesc, [PrefName] = $PrefName, [PrefValue] = $PrefValue, [GridTitle] = ISNULL($GridId, GridTitle),[Controller] = ISNULL($GridId, Controller),[ColumnInfo] = ISNULL($ColumnInfo, ColumnInfo),[ModifiedByUserId] = $UserId,[ModifiedOn] = GETUTCDATE() WHERE [GridPreferenceId] = $PrefId AND [Version] = Convert(varbinary(max), $Version, 1) ";
				if (params.IsDefault) {
					quaryNew = "UPDATE [GridPreference] SET [IsDefault] = 0 WHERE [GridId] Like $GridId AND [GridPreferenceId] <> $PrefId AND [IsDeleted] = 0"
				}
				break;
			case 'delete':
				query = "exec [dbo].softDeleteGridPreference $PrefId, NULL, $UserId, 0";
				break;
			default:
				query = "SELECT * FROM vwGridPreferenceList WHERE ((GridId = $GridId AND IsDefault LIKE $Param1 AND  ([CreatedByUserId] = -1 OR [CreatedByUserId] = $UserId))) ORDER BY CreatedByUserId DESC ";
				break;
		}

		var queries = [query];
		if (quaryNew) {
			queries.push(quaryNew);
		}

		var results = [];


		return new Promise(function (resolve, reject) {
			util.doSynchronousLoop(queries, function (query, index, done) {
				sequelize.query(query, {
					bind: bind
				}).then(function (result) {
					if (result) {
						results.push(result[0])
						done();
					}
				}).catch(function (err) {
					done();
					reject(err);

				});
			}, function () {
				resolve({
					success: true,
					data: results[0]
				});

			});
		});
	}

};