"use strict";
var ListBaseController = require('./listBaseController'),
  SmartDevicePingModel = require('../models').SmartDevicePing;

class SmartDevicePing extends ListBaseController {
  get modelType() {
    return SmartDevicePingModel;
  }
};

module.exports = SmartDevicePing;
