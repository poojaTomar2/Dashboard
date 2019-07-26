"use strict";
var util = require('../util');

var controllers = util.loadFiles({
  directory: __dirname,
  ignoredFiles: ['index.js', 'listBaseController.js', 'util.js', 'consts.js'],
  extensions: [".js"]
});

module.exports = controllers;
