"use strict";

var Boom = require('boom'),
  util = require('../util');

var columnPrefix = /^columns\[/;
var columnProperties = {
  'data': '[data]',
  'name': '[name]',
  'searchable': '[searchable]',
  'orderable': '[orderable]',
  'searchValue': '[search][value]',
  'searchRegex': '[search][regex]'
};

class ListBaseController {
  constructor(config) {
    Object.assign(this, config);
  }

  createModel() {
    var modelType = this.modelType;
    return new modelType();
  }

  list(request, reply) {
    var model = this.createModel();
    var params = Object.assign({}, request.query, request.payload);
    params.limit = isNaN(params.limit) ? (isNaN(params.length) ? 10 : Number(params.length)) : Number(params.limit);
    params.start = isNaN(params.start) ? 0 : Number(params.start);

    delete params.length;

    params.searchRegex = params['search[value]'];
    delete params['search[value]'];
    delete params['search[regex]'];
    delete params['draw'];

    var i = 0;
    var columns = [];
    while (1 == 1) {
      var prefix = 'columns[' + i + ']';
      if (!params.hasOwnProperty(prefix + '[data]')) {
        break;
      }
      var column = {};
      for (var propertyName in columnProperties) {
        var propName = prefix + columnProperties[propertyName];
        column[propertyName] = params[propName];
        delete params[propName];
      }
      columns.push(column);
      i++;
    }

    var order = [];
    var i = 0;
    while (1 == 1) {
      var prefix = 'order[' + i + ']';
      if (!params.hasOwnProperty(prefix + '[column]')) {
        break;
      }
      var fieldIndex = Number(params[prefix + '[column]']),
        dir = params[prefix + '[dir]'];
      if (columns.length > 0 && columns[fieldIndex].orderable === 'true') {
        var orderBy = {
          field: columns[fieldIndex].data,
          dir: dir,
          column: columns[fieldIndex]
        };
        order.push(orderBy);
      }
      delete params[prefix + '[column]'];
      delete params[prefix + '[dir]'];
      i++;
    }

    params.sort = order;

    var me = this,
      reducers = this.reducers || [],
      canContinue = true;

    if (!params.isFromGrid || params.isFromGrid == false) {
      util.doSynchronousLoop(reducers, function (reducerInfo, index, done) {
        reducerInfo.reducer(request, params, reducerInfo.childProperty).then(function (ids) {
          if (!canContinue) {
            return;
          }
          if (Array.isArray(ids)) {
            if (ids.length === 0) {
              canContinue = true;
              params[reducerInfo.property + "[]"] = [0];
            } else {
              params[reducerInfo.property + "[]"] = ids;
            }
          }
          done();
        }).catch(function (err) {
          console.log(err);
          reply(Boom.badImplementation('Error loading data'));
          // todo: better handling
          throw err;
        });
      }, function () {
        if (!canContinue) {
          return me.customizeListResults(request, reply, {
            recordCount: 0,
            recordsFiltered: 0,
            records: []
          }, {
            params: params,
            model: model
          });
        } else {
          model.list(request, params).then(function (result) {
            return me.customizeListResults(request, reply, result, {
              params: params,
              model: model
            });
          }).catch(function (err) {
            console.log(err);
            return reply(Boom.badImplementation(err.message));
          });
        }
      });
    } else {
      util.applyReducers(request, params, null, reducers, function (assetIds, locationIds) {

        if (me.modelType.name == "Outlet")
          params["_id"] = locationIds;
        else
          params["LocationId"] = locationIds;

        params["AssetId[]"] = assetIds;

        //canContinue = true;
        model.list(request, params).then(function (result) {
          if (params.exportData == 'AFSRAsset') {
            return me.customizeListResultsAssetExport(request, reply, result, {
              params: params,
              model: model
            });
          } else {
            return me.customizeListResults(request, reply, result, {
              params: params,
              model: model
            });
          }
        }).catch(function (err) {
          console.log(err);
          return reply(Boom.badImplementation(err.message));
        });
      });
    }
    // util.doSynchronousLoop(reducers, function (reducerInfo, index, done) {
    //   reducerInfo.reducer(request, params, reducerInfo.childProperty).then(function (ids) {
    //     if(!canContinue) {
    //       return;
    //     }
    //     if (Array.isArray(ids)) {
    //       if(ids.length === 0) {
    //       	canContinue = true;
    //       	params[reducerInfo.property + "[]"] = [0];
    //       } else {
    //         params[reducerInfo.property + "[]"] = ids;
    //       }
    //     }
    //     done();
    //   }).catch(function (err) {
    //     console.log(err);
    //     reply(Boom.badImplementation('Error loading data'));
    //     // todo: better handling
    //     throw err;
    //   });

    // util.applyReducers(request, params, null, reducers, function (assetIds, locationIds) {
    //   params["AssetId[]"] = assetIds;
    //   params["LocationId[]"] = locationIds;
    //   //canContinue = true;
    //   model.list(request, params).then(function (result) {
    //     return me.customizeListResults(request, reply, result, {
    //       params: params,
    //       model: model
    //     });
    //   }).catch(function (err) {
    //     console.log(err);
    //     return reply(Boom.badImplementation(err.message));
    //   });
    // });

    // }, function () {
    //   if (!canContinue) {
    //     return me.customizeListResults(request, reply, {
    //       recordCount: 0,
    //       recordsFiltered: 0,
    //       records: []
    //     }, {
    //       params: params,
    //       model: model
    //     });
    //   } else {
    //     model.list(request, params).then(function (result) {
    //       return me.customizeListResults(request, reply, result, {
    //         params: params,
    //         model: model
    //       });
    //     }).catch(function (err) {
    //       console.log(err);
    //       return reply(Boom.badImplementation(err.message));
    //     });
    //   }
    // });
  }

  /*
    request: HAPI request
    reply: HAPI reply
    result: List result
    options: {
      params: Parameters
      model: Model
    }
  */
  customizeListResults(requet, reply, result, options) {
    return reply({
      success: true,
      recordsTotal: result.recordCount,
      recordsFiltered: result.recordCount,
      data: result.records
    });
  }

  get apiEndPoints() {
    return [
      'list'
    ];
  }
};

module.exports = ListBaseController;