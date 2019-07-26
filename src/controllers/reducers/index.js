"use strict";
var util = require('../../util');

var reducers = util.loadFiles({
  directory: __dirname,
  ignoredFiles: ['index.js', 'reducer.js'],
  extensions: [".js"],
  upperCase: false
});

module.exports = reducers;
