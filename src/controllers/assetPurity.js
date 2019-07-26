"use strict";
var ListBaseController = require('./listBaseController'),
 AssetPurityModel = require('../models').AssetPurity;

class AssetPurity extends ListBaseController {
	get modelType() {
		return AssetPurityModel;
	}
};

module.exports = AssetPurity;