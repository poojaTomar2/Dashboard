var sql = require('mssql'),
	log4js = require('log4js'),
	config = require('../config'),
	mappings = require('./elasticMapping'),
	elasticsearch = require('elasticsearch');
var timerMinutes = config.timerMinutes;
var elasticClient = require('../models').elasticClient;

var logger = log4js.getLogger();
var log = console.log;
var dir = console.dir;
var app = {

	toIndex: null,

	currentIndex: -1,

	mappings: null,

	activeInfo: null,

	activeMappings: null,

	typeMapped: false,

	recordBuffer: [],

	bufferSize: 1000,

	indexCount: 0,

	minId: 0,

	lastId: 0,

	init: function (mappings) {
		var toIndex = [];
		for (var o in mappings) {
			toIndex.push(o);
		}
		this.mappings = mappings;
		this.toIndex = toIndex;
		this.currentIndex = -1;

		this.onNext = this.onNext.bind(this);
		this.startIndex = this.startIndex.bind(this);
		this.onSqlRecordset = this.onSqlRecordset.bind(this);
		this.onSqlRow = this.onSqlRow.bind(this);
		this.onSqlError = this.onSqlError.bind(this);
		this.runQuery = this.runQuery.bind(this);
		//this.onMappingUpdate = this.onMappingUpdate.bind(this);
		this.indexBuffer = this.indexBuffer.bind(this);
		this.onIndexDone = this.onIndexDone.bind(this);
	},

	onNext: function () {
		var currentIndex = this.currentIndex + 1;
		this.currentIndex = currentIndex;
		if (currentIndex === this.toIndex.length) {
			log('Indexing completed');
			sql.close();

			setTimeout(function () {
				app.init(mappings);
				log('Connecting...');
				sql.connect(config.sql).then(function (test) {
					app.onNext();
					console.log('Indexing scheduled');
				}).catch(function (err) {
					log(err);
				});
			}, timerMinutes * 60 * 1000);
			return;
		}
		setTimeout(this.startIndex, 0);
	},

	startIndex: function () {
		var indexName = this.toIndex[this.currentIndex];
		log('Indexing..' + indexName);

		var info = this.mappings[indexName];
		info.type = info.type || indexName;
		this.activeInfo = info;
		this.activeMappings = info.mappings;
		this.typeMapped = false;
		this.indexCount = 0;
		this.lastId = 0;
		this.firstId = 0;
		// todo: check if index creation fails
		if (!this.activeInfo.monthWise) {
			elasticClient.indices.create({
				index: this.activeInfo.indexName
			}, this.runQuery);
		} else {
			this.runQuery()
		}
	},

	runQuery: function (param) {
		if (param && param.statusCode) {
			if (param.statusCode != 400) {
				setTimeout(this.onNext, 0);
				return;
			}
		}
		var info = this.activeInfo;
		var request = new sql.Request();
		this.recordBuffer = [];
		request.on('recordset', this.onSqlRecordset)
		request.on('row', this.onSqlRow);
		request.on('error', this.onSqlError);
		request.on('done', this.indexBuffer);

		this.minId = this.lastId;

		var query = info.query;
		if (query.indexOf(' WHERE ') === -1 || info.where) {
			query += ' WHERE ';
		} else {
			query += ' AND ';
		}

		query += info.idProperty + ' IN ' + '(SELECT TOP ' + this.bufferSize + ' RecordId FROM dbo.ToIndexRecords WHERE TableId = ' + info.tableId + ' ORDER BY RecordId)';
		query += ' ORDER BY ' + info.idProperty;
		request.query(query);
	},

	onSqlRecordset: function (response) {
		if (this.typeMapped) {
			return;
		}
		var activeMappings = this.activeMappings;
		if (typeof activeMappings !== 'object' || activeMappings === null) {
			activeMappings = {};
			for (var o in response) {
				if (response[o].type) {
					activeMappings[o] = this.mapType(response[o]);
				}
			}
		}
		var body = {};
		body[this.activeInfo.type] = {
			properties: activeMappings
		};
		if (this.activeInfo.parent) {
			body[this.activeInfo.type]._parent = {
				"type": this.activeInfo.parentType
			};
		}

		if (!this.activeInfo.monthWise) {
			elasticClient.indices.putMapping({
				index: this.activeInfo.indexName,
				type: this.activeInfo.type,
				body: body
			}, this.onMappingUpdate)
		} else {
			this.activeInfo.mappingBody = body
		}
	},

	onMappingUpdate: function (err, response) {
		// todo: check for error
		if (err) {
			dir(err);
		}
		this.typeMapped = true;
	},

	mapType: function (config) {
		//Create Mapping for elastic
		switch (config.type.declaration) {
			case 'int':
				return {
					type: 'integer'
				};
			case 'bigint':
				return {
					type: 'long'
				};
			case 'smallint':
			case 'tinyint':
				return {
					type: 'short'
				};
			case "numeric":
				return {
					type: 'double'
				};
			case "decimal":
				return {
					type: 'double'
				};
			case "float":
				return {
					type: 'float'
				};
			case 'varchar':
			case 'nvarchar':
			case 'text':
			case 'ntext':
				return {
					type: 'text'
				};
			case 'smalldatetime':
			case 'datetime':
				return {
					type: 'date'
				};
			case 'bit':
				return {
					type: 'boolean'
				};
			case 'binary':
				return {
					"properties": {
						"data": {
							"type": "long"
						},
						"type": {
							"type": "text"
						}
					}
				};
			default:
				return {
					type: 'text'
				};
				//throw "Undefined declaration: " + config.type.declaration;
		}
	},

	onSqlRow: function (row) {
		this.recordBuffer.push(row);
		if (this.firstId == 0) {
			this.firstId = row[this.activeInfo.idProperty];
		}
		this.lastId = row[this.activeInfo.idProperty];
	},

	deleteIndex: function () {
		//Delete Record for ToRecordTable
		var request = new sql.Request();
		request.on('done', function (affected) {
			log("Deleted Total Record from ToIndexRecord : " + affected);
			return;
		});
		var query = "DELETE FROM dbo.ToIndexRecords WHERE [TableId] = " + this.activeInfo.tableId + " AND RecordId BETWEEN " + this.firstId + " AND " + this.lastId + "";
		request.query(query);
	},
	indexBuffer: function () {
		// no records found - so move on to next index source
		if (this.recordBuffer.length === 0) {
			setTimeout(this.onNext, 0);
			return;
		}
		var body = [],
			info = this.activeInfo,
			buffer = this.recordBuffer;

		this.indexCount += buffer.length;
		log('...' + this.indexCount);
		var queries = [];
		var indexName, previousIndexName;
		var indexNameArr = [];
		for (var i = 0, len = buffer.length; i < len; i++) {
			var record = buffer[i];
			indexName = info.indexName;
			if (info.monthWise) {
				indexName = indexName + '-' + record[info.monthProperty].getFullYear() + '-' + (record[info.monthProperty].getMonth() + 1 > 9 ? record[info.monthProperty].getMonth() + 1 : '0' + (record[info.monthProperty].getMonth() + 1))

				if (info.monthWise) {
					elasticClient.indices.putAlias({
						index: indexName,
						name: info.indexName
					}, function (err, response) {

					});
				}
				if (previousIndexName != indexName) {
					previousIndexName = indexName;
					queries.push({
						key: indexName,
						mappings: {
							index: indexName,
							type: info.type,
							body: info.mappingBody
						},
						alias: {
							index: indexName,
							name: info.indexName
						},
						search: {
							index: indexName
						}
					});
				}
			}

			if (info.parent) {
				body.push({
					index: {
						_index: indexName,
						_type: info.type,
						_id: record[info.idProperty],
						_parent: record[info.parentIdProperty]
					}
				});
			} else {
				body.push({
					index: {
						_index: indexName,
						_type: info.type,
						_id: record[info.idProperty]
					}
				});
			}

			body.push(record);
		}

		var promises = [];
		var promisesMapping = [];
		var promisesAlias = [];
		var me = this;

		if (info.monthWise) {
			for (var j = 0, len = queries.length; j < len; j++) {
				promises.push(this.onIndexCreate(queries[j]));
			}
			var data = [];
			Promise.all(promises).then(function (values) {
				for (var k = 0, len = values.length; k < len; k++) {
					var value = values[k];
					promisesMapping.push(me.onIndexPutMapping(value.config));
				}

				Promise.all(promisesMapping).then(function (values) {
					for (var l = 0, len = values.length; l < len; l++) {
						var value = values[l];
						promisesAlias.push(me.onIndexPutAlias(value.config));
					}
					Promise.all(promisesAlias).then(function (values) {
						for (var m = 0, len = values.length; m < len; m++) {}
						elasticClient.bulk({
							body: body
						}, me.onIndexDone)
					})
				})

			});
		} else {
			elasticClient.bulk({
				body: body
			}, this.onIndexDone)
		}
	},

	onIndexCreate: function (config) {
		return new Promise(function (resolve, reject) {
			//console.log("StartTime of "+JSON.stringify(config.search)+"" + new Date());
			elasticClient.indices.create(config.search).then(function (resp) {
				//console.log("endTime of "+JSON.stringify(config.search)+"" + new Date());
				resolve({
					response: resp,
					config: config
				});
			}, function (err) {
				//console.log(err);
				resolve({
					response: err,
					config: config
				});
			});
		});
	},

	onIndexPutMapping: function (config) {
		return new Promise(function (resolve, reject) {
			//console.log("StartTime of "+JSON.stringify(config.search)+"" + new Date());
			elasticClient.indices.putMapping(config.mappings).then(function (resp) {
				//console.log("endTime of "+JSON.stringify(config.search)+"" + new Date());
				resolve({
					response: resp,
					config: config
				});
			}, function (err) {
				//console.log(err);
				resolve({
					response: err,
					config: config
				});
			});
		});
	},

	onIndexPutAlias: function (config) {
		return new Promise(function (resolve, reject) {
			//console.log("StartTime of "+JSON.stringify(config.search)+"" + new Date());
			elasticClient.indices.putAlias(config.alias).then(function (resp) {
				//console.log("endTime of "+JSON.stringify(config.search)+"" + new Date());
				resolve({
					response: resp,
					config: config
				});
			}, function (err) {
				//console.log(err);
				resolve({
					response: err,
					config: config
				});
			});
		});
	},

	getElasticData: function (config) {

	},

	onIndexDone: function (err, response) {
		if (err) {
			log(err);
			setTimeout(this.runQuery, 0);
			return;
		}
		var info = this.activeInfo;
		this.deleteIndex();
		if (info.afterIndex) {
			var args = {
				minId: this.minId,
				lastId: this.lastId,
				recordBuffer: this.recordBuffer,
				sql: sql
			};
			info.afterIndex(args).then(this.runQuery).catch(function (err) {
				log(err);
			});
		} else {
			setTimeout(this.runQuery, 0);
		}
	},

	onSqlError: function (err) {
		log(err);
		setTimeout(this.onNext, 0);
	}
}

function Index() {};
Index.prototype = (function (request, reply) {
	return {
		createIndex: function (request, reply) {
			app.init(mappings);
			log('Connecting...');
			sql.connect(config.sql).then(function (test) {
				app.onNext();
				console.log('Indexing scheduled');
			}).catch(function (err) {
				log(err);
			});

			reply('Indexing Started');
		}
	}
})();
var index = new Index();
module.exports = index;