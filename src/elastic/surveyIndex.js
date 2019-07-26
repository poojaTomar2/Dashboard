var sql = require('mssql');
var log4js = require('log4js');
var config = require('../config');
var elasticsearch = require('elasticsearch');

var elasticClient = new elasticsearch.Client(config.elasticSearch);

var logger = log4js.getLogger();

var app = {
	createIndex: function () {
		
		elasticClient.indices.create({
			index: 'cooler-iot-planogram'
		}, this.onIndexCreateProduct.bind(this));
		
		elasticClient.indices.create({
			index: 'surveys'
		}, this.onIndexCreateSurveyDetail.bind(this));
	},

	onIndexCreateSurveyDetail: function (err, resp, respCode) {
		elasticClient.indices.putMapping({
			index: "surveys",
			type: "surveydetail",
			body: {
				surveydetail: {
					_timestamp: {
						enabled: true
					},
					_parent: {
						"type": "survey"
					},
					properties: {
						Point: {
							"type": "double"
						},
						Latitude: {
							"type": "double"
						},
						Longitude: {
							"type": "double"
						}
					}
				}
			}
		}, this.onIndexCreateOpportunity.bind(this));
	},

	onIndexCreateOpportunity: function (err, resp, respCode) {
		elasticClient.indices.putMapping({
			index: "surveys",
			type: "opportunity",
			body: {
				opportunity: {
					_timestamp: {
						enabled: true
					},
					_parent: {
						"type": "survey"
					},
					properties: {
					}
				}
			}
		}, this.onIndexCreateSurvey.bind(this));
	},

	onIndexCreateSurvey: function (err, resp, respCode) {
		elasticClient.indices.putMapping({
			index: "surveys",
			type: "survey",
			body: {
				survey: {
					_timestamp: {
						enabled: true
					},
					properties: {
						Latitude: {
							"type": "double"
						},
						Longitude: {
							"type": "double"
						}
					}
				}
			}
		},
		//function (err, resp, respcode) {
		//	console.log(err, resp, respcode);
		//}
		this.onPutMapping.bind(this)
		);
	},
	
	onIndexCreateProduct: function (err, resp, respCode) {
		elasticClient.indices.create({
			index: 'cooler-iot-product'
		}, this.onPlanogramMapping.bind(this));
	},
	
	onPlanogramMapping: function (err, resp, respCode) {
		elasticClient.indices.putMapping({
			index: "cooler-iot-planogram",
			type: "planogram",
			body: {
				record: {
					_timestamp: {
						enabled: true
					},
					properties: {
					}
				}
			}
		}, this.onProductMapping.bind(this));
	},
	
	onProductMapping: function (err, resp, respCode) {
		elasticClient.indices.putMapping({
			index: "cooler-iot-product",
			type: "product",
			body: {
				record: {
					_timestamp: {
						enabled: true
					},
					properties: {
					}
				}
			}
		}, this.onSqlConnect.bind(this));
	},
	onPutMapping: function () {
		sql.connect(config.sql, this.onSqlConnection.bind(this));
	},

	onSqlConnect: function () {
		sql.connect(config.sql, this.onSql.bind(this));
	},
	
	onSql: function () {
		if (this.err) {
			logger.error(err);
			return;
		}
		this.insertPlanogram();
	},
	
	  insertPlanogram: function(){
		var request = new sql.Request();

		// query to the database and get the records
		request.query('SELECT dbo.Planogram.*, dbo.AssetType.AssetType, \
                         dbo.Client.ClientName, CreateUsers.Username AS CreatedBy, ModifiedUsers.Username AS ModifiedBy \
						 FROM dbo.Planogram LEFT OUTER JOIN \
                         dbo.AssetType ON dbo.Planogram.AssetTypeId = dbo.AssetType.AssetTypeId LEFT OUTER JOIN \
                         dbo.Security_User AS CreateUsers ON CreateUsers.UserId = dbo.Planogram.CreatedByUserId LEFT OUTER JOIN \
                         dbo.Security_User AS ModifiedUsers ON ModifiedUsers.UserId = dbo.Planogram.ModifiedByUserId LEFT OUTER JOIN \
                         dbo.Client ON dbo.Planogram.ClientId = dbo.Client.ClientId \
						', function (err, recordset) {

			if (err) console.log(err)

			// send records as a response
			console.log(recordset);
			for (var i = 0, len = recordset.length; i < len; i++) {
				var record = recordset[i];
				console.log(record);
				elasticClient.index({
					index: 'cooler-iot-planogram',
					type: 'Planogram',
					id: record.PlanogramId,
					body: record
				});
			}
		});
		this.insertProduct();
	},
	
	insertProduct: function(){
		var request = new sql.Request();

		// query to the database and get the records
		request.query('SELECT dbo.Product.*, dbo.Country.Country, dbo.State.State, dbo.Manufacturer.ManufacturerName AS Manufacturer, \
                         dbo.Distributor.DistributorName, dbo.Brand.BrandName, dbo.Brand.BrandId, dbo.Distributor.DistributorId, dbo.PackagingType.PackagingTypeId, dbo.PackagingType.PackagingTypeName AS PackagingType, \
                         dbo.MeasurementUnit.MeasurementUnitTypeId, dbo.MeasurementUnit.MeasurementUnit, dbo.Manufacturer.IsForeign, dbo.Brand.ManufacturerId, \
                         TagsList.Tags, CreatedUsers.Username AS CreatedByUser, ModifiedUsers.Username AS ModifiedByUser, dbo.Client.ClientName\
						 FROM (SELECT AssociationId, Tags\
                         FROM  dbo.vwTagCSVList\
                         WHERE (AssociationTypeId = 8)) AS TagsList RIGHT OUTER JOIN\
                         dbo.Product LEFT OUTER JOIN\
                         dbo.Security_User AS ModifiedUsers ON dbo.Product.ModifiedByUserId = ModifiedUsers.UserId LEFT OUTER JOIN\
                         dbo.Security_User AS CreatedUsers ON dbo.Product.CreatedByUserId = CreatedUsers.UserId LEFT OUTER JOIN\
                         dbo.Brand ON dbo.Product.BrandId = dbo.Brand.BrandId LEFT OUTER JOIN\
                         dbo.Distributor ON dbo.Product.DistributorId = dbo.Distributor.DistributorId LEFT OUTER JOIN\
                         dbo.PackagingType ON dbo.Product.PackagingTypeId = dbo.PackagingType.PackagingTypeId LEFT OUTER JOIN\
                         dbo.MeasurementUnit ON dbo.Product.MeasurementUnitTypeId = dbo.MeasurementUnit.MeasurementUnitTypeId LEFT OUTER JOIN\
                         dbo.State ON dbo.Product.StateId = dbo.State.StateId LEFT OUTER JOIN\
                         dbo.Country ON dbo.Product.CountryId = dbo.Country.CountryId LEFT OUTER JOIN\
                         dbo.Manufacturer ON dbo.Brand.ManufacturerId = dbo.Manufacturer.ManufacturerId ON TagsList.AssociationId = dbo.Product.ProductId LEFT OUTER JOIN\
                         dbo.Client ON dbo.Product.ClientId = dbo.Client.ClientId\
						 ', function (err, recordset) {

			if (err) console.log(err)

			// send records as a response
			console.log(recordset);
			for (var i = 0, len = recordset.length; i < len; i++) {
				var record = recordset[i];
				console.log(record);
				elasticClient.index({
					index: 'cooler-iot-product',
					type: 'Product',
					id: record.ProductId,
					body: record
				});
			}
		});
	},
	
	onSqlConnection: function (err) {
		if (this.err) {
			logger.error(err);
			return;
		}
		this.insertSurvey();
	},

	insertSurvey: function () {
		var request = new sql.Request();

		// query to the database and get the records
		request.query('SELECT * FROM Survey WHERE Survey.IsDeleted = 0', function (err, recordset) {

			if (err) console.log(err)

			// send records as a response
			console.log(recordset);
			for (var i = 0, len = recordset.length; i < len; i++) {
				var record = recordset[i];
				console.log(record);
				elasticClient.index({
					index: 'surveys',
					type: 'survey',
					id: record.SurveyId,
					body: record
				});
			}
		});
		this.insertSurveyDetail();
	},

	insertSurveyDetail: function () {
		var request = new sql.Request();

		// query to the database and get the records
		request.query('SELECT SurveyDetail.SurveyId, SurveyDetailId, SurveyDetail.SurveyQuestionId, Tag, Response, Point, ResponseYesNo,Question, Survey.SurveyTypeId, \
			QuestionNumber,QuestionCategoryId,SurveyQuestion.SurveyTagId,Survey.LocationId,Survey.Latitude,Survey.Longitude,SurveyDateTime, \
			TotalPoints, IsLatestSurveyed, ClientId, Name, Text, SurveyDetail.Photo, ImageCount, CASE WHEN Tag = \'Cooler Purity %\' THEN \'True\' ELSE \'False\' END AS IsPurityQuestion, \
			CASE WHEN Tag = \'Cooler Purity %\' AND ISNUMERIC(replace(Response,\'%\',\'\')) = 1 THEN ROUND(replace(Response,\'%\',\'\'), 0) ELSE 0 END PurityPercentage FROM SurveyDetail \
							LEFT OUTER JOIN SurveyQuestion ON SurveyQuestion.SurveyQuestionId = SurveyDetail.SurveyQuestionId \
							LEFT OUTER JOIN SurveyTag ON SurveyTag.SurveyTagId = SurveyQuestion.SurveyTagId \
							LEFT OUTER JOIN Survey ON Survey.SurveyId = SurveyDetail.SurveyId \
							LEFT OUTER JOIN Location ON Survey.LocationId = Location.LocationId \
							WHERE SurveyDetail.IsDeleted = 0 AND Survey.IsDeleted = 0 AND SurveyTag.IsDeleted = 0 AND Location.IsDeleted =0\
', function (err, recordset) {

	if (err) console.log(err)

	// send records as a response
	//console.log(recordset);
	for (var i = 0, len = recordset.length; i < len; i++) {
		var record = recordset[i];
		console.log(record);
		var surveyDateTime = record.SurveyDateTime;
		elasticClient.index({
			index: 'surveys',
			type: 'surveydetail',
			parent: record.SurveyId,
			id: surveyDateTime.valueOf() - record.SurveyDetailId,
			body: record
		});
	}
});
		this.insertOpportunity();
	},

	insertOpportunity: function () {
		var request = new sql.Request();

		// query to the database and get the records
		request.query('SELECT Opportunity.* FROM Opportunity LEFT OUTER JOIN Location ON Location.LocationId = Opportunity.LocationId WHERE Opportunity.IsDeleted = 0 \
		AND Location.IsDeleted = 0', function (err, recordset) {

			if (err) console.log(err)

			// send records as a response
			console.log(recordset);
			for (var i = 0, len = recordset.length; i < len; i++) {
				var record = recordset[i];
				console.log(record);
				elasticClient.index({
					index: 'surveys',
					type: 'opportunity',
					parent: record.SurveyId,
					id: record.OpportunityId,
					body: record
				});
			}
		});
	}
};

sql.on('error', function (err) {
	logger.error(err);
});


function Index() { };
Index.prototype = (function () {
	return {
		createIndex: function () {
			app.createIndex();
		}
	}
})();
var index = new Index();
module.exports = index;