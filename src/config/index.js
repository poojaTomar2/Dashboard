var path = require('path'),
	rootPath = path.normalize(__dirname + '/..'),
	env = 'qaAzure' || 'development';

var config = {
	development: {
		env: env,
		root: rootPath,
		app: {
			name: 'hinodejbyraj'
		},
		port: process.env.PORT || 3000,
		server: {
			host: 'localhost',
			port: 3000
		},
		elastic: {
			host: 'http://admin:=v5HjQayT(A]Z4G@40.117.250.52:5008',
			requestTimeout: 500000
		},
		sql: {
			user: 'cooleriotadmin',
			password: 'TpgLZ9Qw95',
			server: 'cooleriotserver.database.windows.net',
			database: 'cooleriot',
			stream: true,
			dialectOptions: {
				encrypt: true,
				useUTC: false,
				timeout: 50,
				requestTimeout: 120000
			},
			options: {
				encrypt: true,
				useUTC: false
			}
		},
		redis: {
			host: 'ebest-iot.redis.cache.windows.net',
			password: 'XQYdXDz26WEMcCf0sWvct1kPg3bKUwUlworfBCfo3jw='
		},
		timerMinutes: 5,
		email: {
			host: 'mail.cooleriot.com',
			port: 25,
			secure: false, // true for 465, false for other ports
			auth: {
				user: 'noreply@cooleriot.com', // generated ethereal user
				pass: 'BawJxvCgCQl7TevZotyz' // generated ethereal password
			}
		},
		mailFrom: 'noreply@cooleriot.com', // sender address
		mailTo: 'puroo.jain@in.insigmainc.com,mahesh.tavethiya@in.insigmainc.com,deepak.kumar@in.insigmainc.com,mahesh', // list of receivers
		mailSubject: 'Dashboard Production Azure Error', // Subject line
		sendErrorMail: true
	},

	qaAzure: {
		env: env,
		root: rootPath,
		app: {
			name: 'hinodejbyraj'
		},
		port: process.env.PORT || 3000,
		server: {
			host: 'localhost',
			port: 3000
		},
		elastic: {
			"host": "http://23.101.132.56:5252/",
			requestTimeout: 500000
		},
		sql: {
			user: 'cooleriotadmin',
			password: 'TpgLZ9Qw95',
			server: 'cooleriot-dev.database.windows.net',
			database: 'cooleriot_latest_qa',
			stream: true,
			dialectOptions: {
				encrypt: true, // True for Azure SQL and False for normal SQL
				useUTC: false,
				timeout: 50,
				requestTimeout: 120000
			},
			options: {
				encrypt: true,
				useUTC: false
			}
		},
		redis: {
			host: 'ebest-iot.redis.cache.windows.net',
			password: 'XQYdXDz26WEMcCf0sWvct1kPg3bKUwUlworfBCfo3jw='
		},
		timerMinutes: 5,
		email: {

			host: 'mail.cooleriot.com',
			port: 25,
			secure: false, // true for 465, false for other ports
			auth: {
				user: 'noreply@cooleriot.com', // generated ethereal user
				pass: 'BawJxvCgCQl7TevZotyz' // generated ethereal password
			}
		},
		mailFrom: 'noreply@cooleriot.com', // sender address
		mailTo: 'tanvi.bakshi@in.insigmainc.com', // list of receivers
		mailSubject: ' Dashboard QA Azure Error', // Subject line
		sendErrorMail: true
	},

	production: {
		root: rootPath,
		app: {
			name: 'hinodejbyraj'
		},
		port: process.env.PORT,
		server: {
			host: 'localhost',
			port: 3000
		},
		elastic: {
			host: 'http://admin:=v5HjQayT(A]Z4G@13.92.39.229:9645',
			requestTimeout: 20000
		},
		sql: {
			user: 'cooleriotadmin',
			password: 'TpgLZ9Qw95',
			server: 'cooleriotserver.database.windows.net',
			database: 'cooleriot',
			stream: true,
			dialectOptions: {
				encrypt: true, // True for Azure SQL and False for normal SQL
				useUTC: false
			},
			options: {
				encrypt: true,
				useUTC: false
			}
		},
		redis: {
			host: 'ebest-iot.redis.cache.windows.net',
			password: 'XQYdXDz26WEMcCf0sWvct1kPg3bKUwUlworfBCfo3jw='
		},
		timerMinutes: 5,
		email: {
			host: 'mail.cooleriot.com',
			port: 25,
			secure: false, // true for 465, false for other ports
			auth: {
				user: 'noreply@cooleriot.com', // generated ethereal user
				pass: 'BawJxvCgCQl7TevZotyz' // generated ethereal password
			}
		},
		mailFrom: 'noreply@cooleriot.com', // sender address
		mailTo: 'tanvi.bakshi@in.insigmainc.com', // list of receivers
		mailSubject: '  Dashboard Production Azure Error', // Subject line
		sendErrorMail: true
	}
};

module.exports = config[env];