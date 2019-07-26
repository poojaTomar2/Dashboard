"use strict";
var ListBaseController = require('./listBaseController'),
	ImberaAlertModel = require('../models').ImberaAlert,
	reducers = require('./reducers'),
	aggregators = require('./aggregators');

class ImberaAlert extends ListBaseController {
	get modelType() {
		return ImberaAlertModel;
	}
};



ImberaAlert.prototype.reducers = [
  { property: "LocationId", reducer: reducers.outlet }
];

module.exports = ImberaAlert;
