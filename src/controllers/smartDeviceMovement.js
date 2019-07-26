"use strict";
var ListBaseController = require('./listBaseController'),
  SmartDeviceMovementModel = require('../models').SmartDeviceMovement,
  geolib = require('geolib');


class SmartDeviceMovement extends ListBaseController {
  get modelType() {
    return SmartDeviceMovementModel;
  }

};

module.exports = SmartDeviceMovement;
