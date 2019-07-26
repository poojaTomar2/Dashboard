var util = require('../util'),
    fs = require('fs');
var moment = require('moment');

const compressorStartQuery = fs.readFileSync(__dirname + '/compressorStartCountJoin.json', 'utf-8');

const compressorStartProperties = {
    CompressorStart_TodayCount: 'N/A',
    CompressorStart_7dayCount: 'N/A',
    CompressorStart_30dayCount: 'N/A',
    CompressorRunHrs_TodayCount: 'N/A',
    CompressorRunHrs_7dayCount: 'N/A',
    CompressorRunHrs_30dayCount: 'N/A',
    FanStart_TodayCount: 'N/A',
    FanStart_7dayCount: 'N/A',
    FanStart_30dayCount: 'N/A',
    FanRunHrs_TodayCount: 'N/A',
    FanRunHrs_7dayCount: 'N/A',
    FanRunHrs_30dayCount: 'N/A'
};

module.exports = util.createJoinPropertyFn({
    index: 'cooler-iot-asseteventdatasummary',
    query: compressorStartQuery,
    mergeDataFn: function (config, response) {
        var idMapper = config.idMapper,
            data = config.data;
        var aggregations = response.aggregations.Keys.buckets;
        var joinData = {};
        aggregations.forEach(function (agg, index) {
            var counts = agg.EventTypeCounts.buckets;
            joinData[agg.key] = {

                CompressorStart_TodayCount: counts.today.CompressorDuration.doc_count,
                CompressorStart_7dayCount: counts["7days"].CompressorDuration.doc_count,
                CompressorStart_30dayCount: counts["30days"].CompressorDuration.doc_count,
                CompressorRunHrs_TodayCount: moment.duration(counts.today.CompressorDuration.CompressorDuration.value, 'second').asHours(),
                CompressorRunHrs_7dayCount: moment.duration(counts["7days"].CompressorDuration.CompressorDuration.value, 'second').asHours(),
                CompressorRunHrs_30dayCount: moment.duration(counts["30days"].CompressorDuration.CompressorDuration.value, 'second').asHours(),
                FanStart_TodayCount: counts.today.FanDuration.doc_count,
                FanStart_7dayCount: counts["7days"].FanDuration.doc_count,
                FanStart_30dayCount: counts["30days"].FanDuration.doc_count,
                FanRunHrs_TodayCount: moment.duration(counts.today.FanDuration.FanDuration.value, 'second').asHours(),
                FanRunHrs_7dayCount: moment.duration(counts["7days"].FanDuration.FanDuration.value, 'second').asHours(),
                FanRunHrs_30dayCount: moment.duration(counts["30days"].FanDuration.FanDuration.value, 'second').asHours(),

            };
        });
        data.forEach(function (record, index) {
            var id = idMapper(record, index);
            Object.assign(record, compressorStartProperties, joinData[id]);
        });
    }
});