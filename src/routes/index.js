"use strict";
var taskController = require('../elastic/taskController.js');
var dashboardWidget = require('../elastic/dashboardWidget.js');
var surveyIndex = require('../elastic/elasticIndexCreate.js');
var list = require('../elastic/sqlList.js');
var Boom = require('boom');
var controllers = require('../controllers');
var kpiDashBoard = require('../elastic/kpiDashBoard.js');
var kpiDashBoardCoolerTracking = require('../elastic/kpiDashBoardCoolerTracking.js'); //define cooler tracking elastic file
var kpiDashBoardOperational = require('../elastic/kpiDashBoardOperational.js');
var kpiDashBoardHealth = require('../elastic/kpiDashBoardHealth.js');
var salesDashBoard = require('../elastic/salesDashBoard.js');
var salesVisitDashBoard = require('../elastic/salesRepVisit.js');
var customerTierDashBoard = require('../elastic/customerTier.js');
var salesCorelationDashBoard = require('../elastic/salesCorelation.js');
var salesCorelationAlert = require('../elastic/salesCorelationAlert.js');
var salesCorelationDoor = require('../elastic/salesCorelationDoor.js');
var salesCorelationPower = require('../elastic/salesCorelationPower.js');
var salesCorelationVisit = require('../elastic/salesCorelationVisit.js');
var tradeChannelDashBoard = require('../elastic/tradeChannel.js');
var kpiDashBoardPower = require('../elastic/kpiDashboardPower.js');
var imberaAlarmDashboard = require('../elastic/imberaAlarmDashboard.js');
var BatteryLevelData = require('../elastic/BatteryLevelData.js');
var parseString = require('xml2js').parseString;
//var qs = require('qs');
var crypto = require('crypto'),
	algorithm = 'aes-256-ctr',
	password = 'd6F3Efeq';

const uuid = require('uuid');

var createRouteHandler = function (controller, method) {
	return function (request, reply) {
		var instance = new controller();
		return instance[method](request, reply);
	};
};

function encrypt(text) {
	var cipher = crypto.createCipher(algorithm, password)
	var crypted = cipher.update(text, 'utf8', 'hex')
	crypted += cipher.final('hex');
	return crypted;
}

function decrypt(text) {
	var decipher = crypto.createDecipher(algorithm, password)
	var dec = decipher.update(text, 'hex', 'utf8')
	dec += decipher.final('utf8');
	return dec;
}


var routes = [];
for (var o in controllers) {
	var controller = controllers[o];
	var instance = new controller();
	var apiEndPoints = instance.apiEndPoints;
	for (var i = 0, len = apiEndPoints.length; i < len; i++) {
		var apiEndPoint = apiEndPoints[i];
		routes.push({
			method: ['GET', 'POST'],
			path: '/' + o.substr(0, 1).toLowerCase() + o.substr(1) + '/' + apiEndPoint + '/{options?}',
			config: {
				tags: ['api'],
				handler: createRouteHandler(controller, apiEndPoint)
			}
		});
	}
}

module.exports = [{
		method: ['POST', 'GET'],
		path: '/login',
		config: {
			tags: ['api'],
			auth: {
				mode: 'try'
			},
			plugins: {
				'hapi-auth-cookie': {
					redirectTo: false
				}
			},
			handler: function (request, reply) {
				var params = Object.assign({}, request.query, request.payload);


				if (!params.username && !params.password) {
					return reply('rediract').redirect('login.html');
				}

				list.validateUser(params.username, params.password, params.encrypt).then(function (response) {
					if (response.success) {
						const sid = uuid.v1();
						var data = response.data;
						data.sid = encrypt(sid);

						request.server.app.cache.set(sid, {
							data: response.data
						}, 0, (err) => {
							if (err) {
								console.log(err);
								return reply(Boom.badImplementation('Error setting session value'));
							}
							request.cookieAuth.set({
								sid: sid
							});
							return reply(response);
						});
					} else {
						return reply({
							success: false,
							error: "Username or password is incorrect"
						});
					}
				}).catch(function (err) {
					console.log(err);
					return reply(Boom.badImplementation(err.message));
				});
			}
		}
	},
	{
		method: ['POST', 'GET'],
		path: '/validuser',
		config: {
			tags: ['api'],
			auth: {
				mode: 'try'
			},
			plugins: {
				'hapi-auth-cookie': {
					redirectTo: false
				}
			},
			handler: function (request, reply) {
				var params = Object.assign({}, request.query, request.payload);
				list.validateUserSso(decrypt(params.username), null, params.encrypt).then(function (response) {
					if (response.success) {
						const sid = uuid.v1();
						var data = response.data;
						data.sid = encrypt(sid);
						request.server.app.cache.set(sid, {
							data: response.data
						}, 0, (err) => {
							if (err) {
								console.log(err);
								return reply(Boom.badImplementation('Error setting session value'));
							}
							request.cookieAuth.set({
								sid: sid
							});
							return reply(response);
						});
					} else {
						return reply({
							success: false,
							error: "Username or password is incorrect"
						});
					}
				}).catch(function (err) {
					console.log(err);
					return reply(Boom.badImplementation(err.message));
				});
			}
		}
	},
	{
		method: ['POST', 'GET'],
		path: '/validuserSSO',
		config: {
			tags: ['api'],
			auth: {
				mode: 'try'
			},
			plugins: {
				'hapi-auth-cookie': {
					redirectTo: false
				}
			},
			handler: function (request, reply) {
				var params = Object.assign({}, request.query, request.payload);
				list.validateUserSso(params.username, null, params.encrypt).then(function (response) {
					if (response.success) {
						const sid = uuid.v1();
						var data = response.data;
						data.sid = encrypt(sid);
						request.server.app.cache.set(sid, {
							data: response.data
						}, 0, (err) => {
							if (err) {
								console.log(err);
								return reply(Boom.badImplementation('Error setting session value'));
							}
							request.cookieAuth.set({
								sid: sid
							});
							return reply(response);
						});
					} else {
						return reply({
							success: false,
							error: "Username or password is incorrect"
						});
					}
				}).catch(function (err) {
					console.log(err);
					return reply(Boom.badImplementation(err.message));
				});
			}
		}
	},
	{
		method: ['POST', 'GET'],
		path: '/login1',
		config: {
			tags: ['api'],
			auth: {
				mode: 'try'
			},
			plugins: {
				'hapi-auth-cookie': {
					redirectTo: false
				}
			},
			handler: function (request, reply) {

				var params = Object.assign({}, request.query, request.payload);

				if (!params.wresult)
					return false;

				var xml = params.wresult;

				parseString(xml, function (err, result) {

					console.dir(result);

					//var User = result['t:RequestSecurityTokenResponse']['t:RequestedSecurityToken'][0]['Assertion'][0]['Subject'][0]['NameID'][0];

					// var User = result['t:RequestSecurityTokenResponse']['t:RequestedSecurityToken'][0].Assertion[0].AttributeStatement[0].Attribute[0].AttributeValue[0];
					var userDetails = result['t:RequestSecurityTokenResponse']['t:RequestedSecurityToken'][0]['saml:Assertion'][0]['saml:AttributeStatement'][0]['saml:Attribute'];
					// var index = userDetails.findIndex(p => p.AttributeName == "windowsaccountname");
					for (var index = 0; index < userDetails.length; index++) {
						var element = userDetails[index];
						if (element.$.AttributeName == "windowsaccountname") {
							var User = userDetails[index]['saml:AttributeValue'][1];
						}
					}

					//if (request.headers['x-forwarded-proto'] !== 'https') {
					//	return reply(User).state("ssouser", encrypt(User)).redirect('default.html?ssouser=' + encrypt(User));
					//} else {
					if (User && User.indexOf('\\') > 0) {
						var formatUser = User.split('\\')[1];
						User = formatUser;
					}
					var host = request.headers.host;
					//return reply(User).state("ssouser", encrypt(User)).redirect('default.html?ssouser=' + encrypt(User));
					return reply(User).redirect('https://' + host + '/default.html?ssouser=' + encrypt(User));
					//}
				}.bind(this));
			}
		}
	},
	{
		method: ['POST', 'GET'],
		path: '/logout',
		config: {
			tags: ['api'],
			auth: false,
			handler: function (request, reply) {
				request.cookieAuth.clear();
				return reply({
					success: true
				});
			}
		}
	}, {
		method: 'GET',
		path: '/search/{options?}',
		config: {
			tags: ['api'],
			handler: taskController.getRecord
		}
	}, {
		method: 'GET',
		path: '/surveyIndex/{options?}',
		config: {
			tags: ['api'],
			auth: {
				mode: 'try'
			},
			plugins: {
				'hapi-auth-cookie': {
					redirectTo: false
				}
			},
			handler: surveyIndex.createIndex
		}
	}, {
		method: ['GET', 'POST'],
		path: '/chart/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return taskController.getChartData(request, reply);
			}
		}
	}, {
		method: ['GET', 'POST'],
		path: '/assetChart/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return taskController.getAssetChartData(request, reply);
			}
		}
	}

	, {
		method: ['POST', 'GET'],
		path: '/dashboard/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return taskController.getDashboardData(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getMovementGPS/{options?}',
		config: {
			tags: ['api'],
			handler: taskController.getMovementGPS
		}
	}, {
		method: 'GET',
		path: '/combos',
		config: {
			tags: ['api'],
			description: 'Returns list suitable for dropdown list (combo boxes)',
			handler: function (request, reply) {
				var comboTypes = [
					'LocationClassification',
					'LocationType',
					'SalesRep',
					'Country',
					'AlertType',
					'AssetType',
					'City',
					'ManufacturerAsset',
					'AlertStatus',
					'SmartDeviceType',
					'ManufacturerSmartDevice',
					'SubTradeChannelType',
					'TeleSellingTerritory',
					'AssetTypeCapacity'
				];
				var clientId = request.auth.credentials.user.ScopeId;
				var userId = request.auth.credentials.user.UserId;
				var limitLocation = request.auth.credentials.tags.LimitLocation;
				var limitCountry = request.auth.credentials.tags.LimitCountry;
				if (!limitLocation == "1") {
					userId = null
				}
				var data = list.getCombos(comboTypes, clientId, userId, limitLocation, limitCountry, reply);
				// function (data) {
				//handler: function (request, reply) {
				// if (data.success) {
				// 	var sid = decrypt(request.auth.credentials.sid);
				// 	var savedata = request.auth.credentials;
				// 	savedata.combodata = data.data;
				// 	request.server.app.cache.set(sid, {
				// 		data: savedata
				// 	}, 0, (err) => {
				// 		if (err) {
				// 			console.log(err);
				// 			return reply(Boom.badImplementation('Error getting combo value'));
				// 		}
				// 		return reply(data);
				// 	});
				// 	//}
				// } else {
				// 	return reply(data);
				// }

			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getUserByToken',
		config: {
			tags: ['api'],
			auth: {
				mode: 'try'
			},
			plugins: {
				'hapi-auth-cookie': {
					redirectTo: false
				}
			},
			description: 'Return username and password for user by token',
			handler: function (request, reply) {
				var data = list.getUserDetil(request).then(function (data) {
					return reply(data);
				}).catch(function (err) {
					return reply(Boom.badImplementation(err.message));
				});
			}
		}
	}, {
		method: 'GET',
		path: '/combosVisit',
		config: {
			tags: ['api'],
			description: 'Returns list suitable for dropdown list (combo boxes)',
			handler: function (request, reply) {
				var comboTypes = [
					'Location',
					'SalesRep'
				];
				var clientId = request.auth.credentials.user.ScopeId;
				var data = list.getCombosVisit(comboTypes, clientId).then(function (data) {
					return reply(data);
				}).catch(function (err) {
					return reply(Boom.badImplementation(err.message));
				});
			}
		}
	}, {
		method: 'GET',
		path: '/combosTimeZone',
		config: {
			tags: ['api'],
			description: 'Returns list suitable for dropdown list (combo boxes)',
			handler: function (request, reply) {
				var comboTypes = [
					'TimeZones',
				];
				var clientId = request.auth.credentials.user.ScopeId;
				var data = list.getCombosTimeZone(comboTypes, clientId).then(function (data) {
					return reply(data);
				}).catch(function (err) {
					return reply(Boom.badImplementation(err.message));
				});
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getIOTWidget/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return taskController.getIOTWidgetData(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getKPIWidget/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoard.getKPIWidgetData(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getKpiWidgetDataForCommercialView/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoard.getKpiWidgetDataForCommercialView(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getKpiWidgetDataForOperationalView/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoardOperational.getKpiWidgetDataForOperationalView(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getLocationNamedeSalesCorrelation/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoardOperational.getLocationNamedeSalesCorrelation(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getKpiWidgetDataForCoolerPerformance/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoard.getKpiWidgetDataForCoolerPerformance(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getOutletIRInfo/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return taskController.getOutletIRInfo(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getOutletRedirectionIRInfo/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return taskController.getOutletRedirectionIRInfo(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getAssetIRInfo/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return taskController.getAssetIRInfo(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getAssetPurityIRInfo/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return taskController.getAssetPurityIRInfo(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getOutletGridIRInfo/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return taskController.getOutletGridIRInfo(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getLocationsFirstLoadCoolerPerformance/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoard.getLocationsFirstLoadCoolerPerformance(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getCPIdata/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoard.getCPIdata(request, reply);
			}
		}
	},
	{
		method: ['POST', 'GET'],
		path: '/getMapAssetForLastDataDownload/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoard.getMapAssetForLastDataDownload(request, reply);
			}
		}
	},
	{
		method: ['POST', 'GET'],
		path: '/getMapAssetForDataDownload/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoard.getMapAssetForDataDownload(request, reply);
			}
		}
	},
	{
		method: ['POST', 'GET'],
		path: '/getMapAssetForCoolerTrackingAlwaysOn/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoard.getMapAssetForCoolerTrackingAlwaysOn(request, reply);
			}
		}
	},
	{
		method: ['POST', 'GET'],
		path: '/getMapLocationForOperationalIssues/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoard.getMapLocationForOperationalIssues(request, reply);
			}
		}
	},
	{
		method: ['POST', 'GET'],
		path: '/getMapLocationForDoorSwing/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoard.getMapLocationForDoorSwing(request, reply);
			}
		}
	},
	//for cooler tracking
	{
		method: ['POST', 'GET'],
		path: '/getKpiWidgetDataForCoolerTracking/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoardCoolerTracking.getKpiWidgetDataForCoolerTracking(request, reply);
			}
		}
	},
	//for temperature chart in cooler tracking
	{
		method: ['POST', 'GET'],
		path: '/getKpiWidgetDataForCoolerTrackingTemperatureChart/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoardCoolerTracking.getKpiWidgetDataForCoolerTrackingTemperatureChart(request, reply);
			}
		}
	},
	//for door open chart in cooler tracking
	{
		method: ['POST', 'GET'],
		path: '/getKpiWidgetDataForCoolerTrackingDoorOpen/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoardCoolerTracking.getKpiWidgetDataForCoolerTrackingDoorOpen(request, reply);
			}
		}
	},
	//for Power status in cooler tracking
	{
		method: ['POST', 'GET'],
		path: '/getKpiWidgetDataForCoolerTrackingPowerStatus/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoardCoolerTracking.getKpiWidgetDataForCoolerTrackingPowerStatus(request, reply);
			}
		}
	},
	//for cooler status in cooler tracking
	{
		method: ['POST', 'GET'],
		path: '/getKpiWidgetDataForCoolerTrackingCoolerVoltage/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoardCoolerTracking.getKpiWidgetDataForCoolerTrackingCoolerVoltage(request, reply);
			}
		}
	},
	//for alarm type in cooler tracking
	{
		method: ['POST', 'GET'],
		path: '/getKpiWidgetDataForCoolerTrackingAlarmType/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoardCoolerTracking.getKpiWidgetDataForCoolerTrackingAlarmType(request, reply);
			}
		}
	},
	//for cooler missing and wrong location
	{
		method: ['POST', 'GET'],
		path: '/getKpiWidgetDataForCoolerTrackingCoolerMissingWrong/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoardCoolerTracking.getKpiWidgetDataForCoolerTrackingCoolerMissingWrong(request, reply);
			}
		}
	},
	//for CSI in cooler tracking
	{
		method: ['POST', 'GET'],
		path: '/getKpiWidgetDataForCoolerTrackingCSI/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoardCoolerTracking.getKpiWidgetDataForCoolerTrackingCSI(request, reply);
			}
		}
	},
	// {
	// 	method: ['POST', 'GET'],
	// 	path: '/getKpiWidgetDataForCoolerPerformanceLastDataDownload/{options?}',
	// 	config: {
	// 		tags: ['api'],
	// 		handler: function (request, reply) {
	// 			return kpiDashBoard.getKpiWidgetDataForCoolerPerformanceLastDataDownload(request, reply);
	// 		}
	// 	}
	// },
	//for cooler tracking chart in cooler performance screen
	// {
	// 	method: ['POST', 'GET'],
	// 	path: '/getKpiWidgetDataForCoolerPerformanceCoolerTrackingChart/{options?}',
	// 	config: {
	// 		tags: ['api'],
	// 		handler: function (request, reply) {
	// 			return kpiDashBoard.getKpiWidgetDataForCoolerPerformanceCoolerTrackingChart(request, reply);
	// 		}
	// 	}
	// },
	// {
	// 	method: ['POST', 'GET'],
	// 	path: '/getKpiWidgetDataForCoolerPerformanceCPI/{options?}',
	// 	config: {
	// 		tags: ['api'],
	// 		handler: function (request, reply) {
	// 			return kpiDashBoard.getKpiWidgetDataForCoolerPerformanceCPI(request, reply);
	// 		}
	// 	}
	// },
	{
		method: ['POST', 'GET'],
		path: '/getAppliedReducerInfo/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return taskController.getAppliedReducerInfo(request, reply);
			}
		}
	},

	//for cooler tracking
	{
		method: ['POST', 'GET'],
		path: '/getKpiWidgetDataForCoolerTrackingLastDataDownload/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoardCoolerTracking.getKpiWidgetDataForCoolerTrackingLastDataDownload(request, reply);
			}
		}
	},
	// {
	// 	method: ['POST', 'GET'],
	// 	path: '/getKpiWidgetDataForCoolerPerformanceOperationalIssue/{options?}',
	// 	config: {
	// 		tags: ['api'],
	// 		handler: function (request, reply) {
	// 			return kpiDashBoard.getKpiWidgetDataForCoolerPerformanceOperationalIssue(request, reply);
	// 		}
	// 	}
	// },
	{
		method: ['POST', 'GET'],
		path: '/getKpiWidgetDataForCoolerPerformanceLastMonth/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoard.getKpiWidgetDataForCoolerPerformanceLastMonth(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getSalesWidget/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return salesDashBoard.getSalesWidgetData(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getSalesCorrelation/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return salesCorelationDashBoard.getSalesCorrelationWidgetData(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getSalesCorrelationAlert/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return salesCorelationAlert.getSalesCorrelationWidgetData(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getSalesCorrelationDoor/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return salesCorelationDoor.getSalesCorrelationWidgetData(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getSalesCorrelationPower/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return salesCorelationPower.getSalesCorrelationWidgetData(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getSalesCorrelationVisit/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return salesCorelationVisit.getSalesCorrelationWidgetData(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getBatteryLevelData/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return BatteryLevelData.getBatteryLevelData(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getFallenMagnetData/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return BatteryLevelData.getFallenMagnetData(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getSalesVisitWidget/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return salesVisitDashBoard.getSalesVisitWidgetData(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getPowerData/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoardPower.getKPIWidgetData(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getHealthData/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return kpiDashBoardHealth.getKPIWidgetData(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getCustomerTierWidgetData/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return customerTierDashBoard.getCustomerTierWidgetData(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getTradeChannelWidgetData/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return tradeChannelDashBoard.getTradeChannelWidgetData(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/outletOverviewData/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return taskController.getOutletOverviewData(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getSurveyWidget/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return taskController.getSurveyWidgetData(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getCoolerStatusData/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return taskController.getCoolerStatusData(request, reply);
			}
		}
	}, {
		method: 'GET',
		path: '/updateAlertStatus/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				var params = request.query;
				var alertId = params.AlertId;
				var statusId = params.StatusId;
				if (!(alertId && statusId)) {
					return reply(Boom.preconditionRequired('Must send alertId and statusId'));
				}
				var data = list.updateAlertStatus(alertId, statusId).then(function (data) {
					return reply(data);
				}).catch(function (err) {
					return reply(Boom.badImplementation(err.message));
				});
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getSalesWidgetSalesRep/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return salesDashBoard.getSalesWidgetSalesRep(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/loadHeaderInfo/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return taskController.loadHeaderInfo(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/loadLastDataInfo/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return taskController.loadLastDataInfo(request, reply);
			}
		}
	}

	, {
		method: ['POST', 'GET'],
		path: '/getImberaWidgetData/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return imberaAlarmDashboard.getImberaWidgetData(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/getLocationWidgetData/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return taskController.getLocationWidgetData(request, reply);
			}
		}
	},
	{
		method: 'POST',
		path: '/preferenceState/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				var data = list.preferenceState(request, reply).then(function (data) {
					return reply(data);
				}).catch(function (err) {
					return reply(Boom.badImplementation(err.message));
				});
			}
		}
	},
	{
		method: 'POST',
		path: '/saveLayout/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return taskController.saveLayout(request, reply);
			}
		}
	}, {
		method: 'POST',
		path: '/exportData/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return taskController.exportData(request, reply);
			}
		}
	},
	{
		method: ['GET', 'POST'],
		path: '/facingDetail/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return taskController.getFacingDetail(request, reply);
			}
		}
	},
	{
		method: ['GET', 'POST'],
		path: '/getUserLayout/{options?}',
		config: {
			tags: ['api'],
			handler: function (request, reply) {
				return taskController.getUserLayout(request, reply);
			}
		}
	},
	{
		method: 'POST',
		path: '/saveUserDetails/{options?}',
		config: {
			tags: ['api'],
			auth: false,
			handler: function (request, reply) {
				return taskController.saveUserDetails(request, reply);
			}
		}
	},
	{
		method: ['POST', 'GET'],
		path: '/irsignup/{options?}',
		config: {
			tags: ['api'],
			auth: {
				mode: 'try'
			},
			plugins: {
				'hapi-auth-cookie': {
					redirectTo: false
				}
			},
			description: 'Add IR signup',
			handler: function (request, reply) {
				return taskController.saveIRUserDetails(request, reply);
			}
		}
	},
	{
		method: ['POST', 'GET'],
		path: '/getirsignupstatus/{options?}',
		config: {
			tags: ['api'],
			auth: {
				mode: 'try'
			},
			plugins: {
				'hapi-auth-cookie': {
					redirectTo: false
				}
			},
			description: 'Get IR signup detail',
			handler: function (request, reply) {
				return taskController.getIRsignupStatus(request, reply);
			}
		}
	},
	{
		method: ['POST', 'GET'],
		path: '/getIRStatus/{options?}',
		config: {
			tags: ['api'],
			auth: {
				mode: 'try'
			},
			plugins: {
				'hapi-auth-cookie': {
					redirectTo: false
				}
			},
			description: 'Return Outlet IR Status list',
			handler: function (request, reply) {
				return taskController.getIRStatusDetails(request, reply);
			}
		}
	},
	{
		method: ['POST', 'GET'],
		path: '/getirsignupdetail/{options?}',
		config: {
			tags: ['api'],
			auth: {
				mode: 'try'
			},
			plugins: {
				'hapi-auth-cookie': {
					redirectTo: false
				}
			},
			description: 'Return Outlet IR Status Detail',
			handler: function (request, reply) {
				return taskController.getOutletIRStatusDetail(request, reply);
			}
		}
	}, {
		method: ['POST', 'GET'],
		path: '/updateirsignupdetail/{options?}',
		config: {
			tags: ['api'],
			auth: {
				mode: 'try'
			},
			plugins: {
				'hapi-auth-cookie': {
					redirectTo: false
				}
			},
			description: 'Update Outlet IR Status Detail',
			handler: function (request, reply) {
				return taskController.updateOutletIRStatusDetail(request, reply);
			}
		}
	},
	// {
	// 	method: ['GET', 'POST'],
	// 	path: '/setFilterCombo/{options?}',
	// 	config: {
	// 		tags: ['api'],
	// 		handler: function (request, reply) {
	// 			var sid = decrypt(request.auth.credentials.sid);
	// 			var params = qs.parse(request.payload);
	// 			//var params = Object.assign({}, request.query, request.payload);
	// 			var savedata = request.auth.credentials;
	// 			savedata.combodata = params;
	// 			request.server.app.cache.set(sid, {
	// 				data: savedata
	// 			}, 0, (err) => {
	// 				if (err) {
	// 					console.log(err);
	// 					return reply(Boom.badImplementation('Error setting combo value'));
	// 				}
	// 				return reply({
	// 					success: true
	// 				});
	// 			});
	// 		}
	// 	}
	// },
	// {
	// 	method: ['GET', 'POST'],
	// 	path: '/getFilterCombo/{options?}',
	// 	config: {
	// 		tags: ['api'],
	// 		handler: function (request, reply) {
	// 			var sid = decrypt(request.auth.credentials.sid);
	// 			//var savedata = request.auth.credentials;
	// 			//savedata.combodata = 'this is combo data';
	// 			request.server.app.cache.get(sid, (err, cached) => {
	// 				if (err) {
	// 					return reply(err, false);
	// 				}
	// 				if (!cached) {
	// 					return reply(null, false);
	// 				}
	// 				return reply({
	// 					success: true,
	// 					data: cached.data.combodata
	// 				});
	// 			});
	// 		}
	// 	}
	// }


].concat(routes);