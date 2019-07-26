"use strict";
var ListBaseController = require('./listBaseController'),
  SmartDeviceDoorStatusModel = require('../models').SmartDeviceDoorStatus;

class SmartDeviceDoorStatus extends ListBaseController {
  get modelType() {
    return SmartDeviceDoorStatusModel;
  }
};

module.exports = SmartDeviceDoorStatus;
