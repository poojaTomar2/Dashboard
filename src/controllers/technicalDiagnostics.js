"use strict";
var ListBaseController = require('./listBaseController'),
	TechnicalDiagnosticsModel = require('../models').TechnicalDiagnostics,
	aggregators = require('./aggregators'),
	client = require('../models').elasticClient;

class TechnicalDiagnostics extends ListBaseController {
	get modelType() {
		return TechnicalDiagnosticsModel;
	}
	customizeListResults(request, reply, result, options) {
		aggregators.assetTechnicalDiagnostics({
				client: options.model.client,
				data: result.records,
				parentProperty: function (record) {
					return (record.AssetId);
				},
				childProperty: "AssetId"
			})
			.then(function () {

				var healthCount = JSON.parse(JSON.stringify(require('./aggregators/healthCountDayWise.json')));
				var assetIds = [];
				result.records.forEach(function (record, index) {
					assetIds.push(Number(record.AssetId));

				})
				healthCount.query.bool.filter.push({
					"terms": {
						"AssetId": assetIds
					}
				});
				var tags = reply.request.auth.credentials.tags;
				healthCount.aggs.HealthData.aggs.TempAndLightIssue.filter.bool.must_not.push({
					"range": {
						"AverageTemperature": {
							"gte": tags.TemperatureMin,
							"lte": tags.TemperatureMax
						}
					}
				});
				healthCount.aggs.HealthData.aggs.TempIssue.filter.bool.must_not.push({
					"range": {
						"AverageTemperature": {
							"gte": tags.TemperatureMin,
							"lte": tags.TemperatureMax
						}
					}
				});
				healthCount.aggs.HealthData.aggs.HightTemperature.filter.bool.filter.push({
					"range": {
						"AverageTemperature": {
							"gt": tags.TemperatureMax
						}
					}
				});

				var data = result.records;
				client.search({
					index: 'cooler-iot-asseteventdatasummary',
					body: healthCount
				}).then(function (response) {
					var aggregations = response.aggregations.HealthData.buckets;

					var joinData = {};
					aggregations.forEach(function (agg, index) {
						var key = agg.key_as_string;
						joinData[key] = {
							"TotalHealthRecord": agg.AssetCount.value,
							//"LowLight": agg.LowLight.AssetCount.value,
							"HightTemperature": agg.HightTemperature.AssetCount.value,
							"TempAndLightIssue": agg.TempAndLightIssue.AssetCount.value,
							"TempIssue": agg.TempIssue.AssetCount.value
							//"LightIssue": agg.LightIssue.AssetCount.value
						};
					});
					data.forEach(function (record, index) {
						if (joinData[record.EventDate]) {
							record.TotalHealthRecord = joinData[record.EventDate].TotalHealthRecord;
							//record.LowLight = joinData[record.EventDate].LowLight;
							record.HightTemperature = joinData[record.EventDate].HightTemperature;
							record.TempAndLightIssue = joinData[record.EventDate].TempAndLightIssue;
							record.TempIssue = joinData[record.EventDate].TempIssue;
							//record.LightIssue = joinData[record.EventDate].LightIssue;
						} else {
							record.TotalHealthRecord = 'N/A';
							//record.LowLight = 'N/A';
							record.HightTemperature = 'N/A';
							record.TempAndLightIssue = 'N/A';
							record.TempIssue = 'N/A';
							//record.LightIssue = 'N/A';
						}
					});
					return reply({
						success: true,
						recordsTotal: result.recordCount,
						recordsFiltered: result.recordCount,
						data: result.records
					});
				});
			})
	}
}

module.exports = TechnicalDiagnostics;