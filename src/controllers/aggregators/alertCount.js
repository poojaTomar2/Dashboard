var util = require('../util'),
fs = require('fs');

const alertCountQuery = fs.readFileSync(__dirname + '/alertCountJoin.json', 'utf-8'),
consts = require("../consts"),
alertPriorityMappings = consts.alertPriorityMappings;

const alertProperties = {
Alert_Open: 'N/A',
Alert_Highest_AlertId: 'N/A',
Alert_Highest_AlertTypeId: 'N/A',
Alert_Highest_PriorityId: 'N/A',
Alert_Highest_AlertAt: null,
Alert_Open_Low: 'N/A',
Alert_Open_Medium: 'N/A',
Alert_Open_High: 'N/A',
Alert_Open_All_Type:[]
};

module.exports = util.createJoinPropertyFn({
index: 'cooler-iot-alert',
query: alertCountQuery,
mergeDataFn: function (config, response) {
    var idMapper = config.idMapper, data = config.data;
    var aggregations = response.aggregations.Keys.buckets;
    // HighestAlertType - AlertId, AlertTypeId, AlertAt
    // OpenAlerts - HighPriority, MediumPriority, LowPriority
    var joinData = {};
    aggregations.forEach(function (agg, index) {
        var key = agg.key;
        var record = {};
        var highestOpenAlert = agg.HighestAlertType.hits.hits[0];
        record.Alert_Open = agg.doc_count;
        record.Alert_Highest_AlertId = Number(highestOpenAlert._id);
        record.Alert_Highest_AlertTypeId = highestOpenAlert._source.AlertTypeId;
        record.Alert_Highest_AlertAt = highestOpenAlert._source.AlertAt;
        record.Alert_Highest_PriorityId = highestOpenAlert._source.PriorityId;

        var openAlertsRecords = agg.OpenAlertByType.hits.hits;

        openAlertTypeIds = [];
        openAlertsRecords.forEach(function (record) {
            openAlertTypeIds.push(record._source.AlertTypeId);
        });
        record.Alert_Open_All_Type = openAlertTypeIds;

        var priorityWise = agg.Priority.buckets;
        priorityWise.forEach(function (priorityRecord) {
            record["Alert_Open_" + alertPriorityMappings[priorityRecord.key]] = priorityRecord.doc_count;
        });
        joinData[key.toString()] = record;
    });
    data.forEach(function (record, index) {
        var id = idMapper(record, index);
        Object.assign(record, alertProperties, joinData[id]);
    });
}
});