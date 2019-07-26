"use strict";
var util = require('../../util');

var aggregators = util.loadFiles({
  directory: __dirname,
  ignoredFiles: ['index.js'],
  extensions: [".js"],
  upperCase: false
});

module.exports = aggregators;
