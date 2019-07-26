var elasticsearch = require('elasticsearch');
var config = require('../config');
var util = require('../util');

var models = util.loadFiles({
  directory: __dirname,
  ignoredFiles: ['index.js', 'elasticListBase.js']
})

var elasticClient = new elasticsearch.Client(config.elastic);

for(var o in models) {
  models[o].prototype.client = elasticClient;
}

models.elasticClient = elasticClient;

module.exports = models;
