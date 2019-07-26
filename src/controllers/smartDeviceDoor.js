"use strict";
var ListBaseController = require('./listBaseController'),
  SmartDeviceDoorModel = require('../models').SmartDeviceDoor;

class SmartDeviceDoor extends ListBaseController {
  get modelType() {
    return SmartDeviceDoorModel;
  }
};

module.exports = SmartDeviceDoor;
