"use strict";
var Hapi = require('hapi');
var config = require('./config');
var routes = require('./routes');
var HapiSwagger = require('hapi-swagger');
var Pack = require('../package');
var util = require('./util');

var serverConfig = config.server;

var virtualPath = serverConfig.virtualPath || '';

const options = {
	info: {
		'title': Pack.description + ' API Documentation',
		'version': Pack.version,
	}
};

var server = server = new Hapi.Server({
	connections: {
		state: {
			ignoreErrors: 'true' // may also be 'ignore' or 'log'
		}
	},
	cache: [
		Object.assign({
			engine: require('catbox-redis'),
			partition: 'cooler_iot_cache'
		}, config.redis)
	]
});
server.connection({
	server: serverConfig.server,
	port: process.env.PORT || serverConfig.port
});

// Add all the routes within the routes folder

server.register([
	require('inert'),
	require('vision'),
	require('hapi-auth-cookie'),
	{
		'register': HapiSwagger,
		'options': options
	}
], (err) => {

	if (err) {
		throw err;
	}

	const cache = server.cache({
		segment: 'sessions',
		expiresIn: (60 * 60 * 1000) * 72
	});
	server.app.cache = cache;

	server.auth.strategy('session', 'cookie', true, {
		password: 'durlabh-computers-created-this-cooler',
		cookie: 'sid-example',
		isSecure: false,
		validateFunc: function (request, session, callback) {

			cache.get(session.sid, (err, cached) => {

				if (err) {
					return callback(err, false);
				}

				if (!cached) {
					return callback(null, false);
				}

				return callback(null, true, cached.data);
			});
		}
	});

	server.route({
		method: 'GET',
		path: virtualPath + '/{param*}',
		config: {
			auth: {
				mode: 'try'
			},
			plugins: {
				'hapi-auth-cookie': {
					redirectTo: false
				}
			},
			handler: {
				directory: {
					path: 'public'
				}
			}
		}
	});

	process.on('uncaughtException', (err) => {
		util.mailSent(err.message + ' ' + (err.trace + ' ' + err.stack + ' ' + err));
	});

	server.on('internalError', function (request, err) {
		util.mailSent(err.message + ' ' + (err.trace + ' ' + err.stack + ' ' + err));
		console.log(err.data.stack);
	});

	process.on('unhandledRejection', err => {
		util.mailSent(err.message + ' ' + err.trace + ' ' + err.stack + ' ' + err);
	});

	server.on('request-error', function (request, err) {
		util.mailSent(err.message + ' ' + (err.trace + ' ' + err.stack + ' ' + err));
	});


	for (var route in routes) {
		var routeDetail = routes[route];
		for (var i = 0, len = routeDetail.length; i < len; i++) {
			routeDetail[i].path = virtualPath + routeDetail[i].path;
		}
		server.route(routeDetail);
	}


});

module.exports = server;
// Start the server
server.start((err) => {
	if (err) {
		throw err;
	}
	console.log('Server running at:', server.info.uri);
});