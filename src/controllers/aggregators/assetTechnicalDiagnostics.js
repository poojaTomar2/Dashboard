var util = require('../util'),
    fs = require('fs');
var moment = require('moment');

const compressorStartQuery = fs.readFileSync(__dirname + '/assetTechnicalDiagnostics.json', 'utf-8');

const compressorStartProperties = {
    CompressorStart: 'N/A',
    CompressorRunHours: 'N/A',
    EvaporatorFanStart: 'N/A',
    EvaporatorFanRunHours: 'N/A',
    HeaterStart: 'N/A',
    HeaterRunHours: 'N/A',
    LightStart: 'N/A',
    LightRunHours: 'N/A'
};

module.exports = util.createJoinPropertyFn({
    index: 'cooler-iot-asseteventdatasummary',
    query: compressorStartQuery,
    mergeDataFn: function (config, response) {
        var idMapper = config.idMapper,
            data = config.data, //.slice(0);
            data1 = data.slice(0);
        var aggregations = response.aggregations.CompressorData.time_buckets.buckets;
        var joinData = {};
        var aggData = [];
        aggregations.forEach(function (agg, index) {
            var index1 = -1;
            joinData[agg.key_as_string] = {
                CompressorStart: agg.CompressorDuration.doc_count,
                CompressorRunHours: moment.duration(agg.CompressorDuration.CompressorDuration.value, 'second').asHours().toFixed(3),
                EvaporatorFanStart: agg.FanDuration.doc_count,
                EvaporatorFanRunHours: moment.duration(agg.FanDuration.FanDuration.value, 'second').asHours().toFixed(3),
                HeaterStart: agg.HeaterDuration.doc_count,
                HeaterRunHours: moment.duration(agg.HeaterDuration.HeaterDuration.value, 'second').asHours().toFixed(3),
                LightStart: agg.LightDuration.doc_count,
                LightRunHours: moment.duration(agg.LightDuration.LightDuration.value, 'second').asHours().toFixed(3)
            };

        });

        data.forEach(function (record, index) {
            Object.assign(record, compressorStartProperties, joinData[record.EventDate]);
        });
    }
});