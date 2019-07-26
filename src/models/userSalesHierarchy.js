"use strict";

var ElasticListBase = require('./elasticListBase');

class UserSalesHierarchy extends ElasticListBase {
  customizeQuery(body, params) {
    var bool = body.query.bool;
		bool.filter.push({
			"term": {
				"IsDeleted": false
			}
		});
    var check = body.query.bool.filter;
    var index = -1;
    var assetIndex = -1;
    check.forEach(function (data) {
      index++;
      var asset = JSON.stringify(data);
      if (asset.indexOf("CountryId") >= 0) {
        assetIndex = index;
      }
    });
    if (assetIndex != -1) {
      body.query.bool.filter.splice(assetIndex, 1)
    }
    console.log("salesrepsalesrepsalesrepsalesrep");
    //console.log(JSON.stringify(body));
  }
};

Object.assign(UserSalesHierarchy.prototype, {
  index: 'cooler-iot-usersaleshierarchy',
  type: 'UserSalesHierarchy',
  propertyDefs: ElasticListBase.assignPropertyDefs([
    "UserId",
    "UserSalesHierarchyId",
    "RoleId"
  ])
});

module.exports = UserSalesHierarchy;