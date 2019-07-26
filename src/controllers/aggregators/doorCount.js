var util = require('../util'),
    fs = require('fs');

const doorCountQuery = fs.readFileSync(__dirname + '/doorCountJoin.json', 'utf-8');

const doorProperties = {
    Door_TodayCount: 'N/A',
    Door_7dayCount: 'N/A',
    Door_30dayCount: 'N/A',
    Door_Latest: null
};

module.exports = util.createJoinPropertyFn({
    index: 'cooler-iot-asseteventdatasummary',
    query: doorCountQuery,
    mergeDataFn: function (config, response) {
        var idMapper = config.idMapper,
            data = config.data;
        var aggregations = response.aggregations.Keys.buckets;
        var joinData = {};
        aggregations.forEach(function (agg, index) {
            var counts = agg.doorCounts.buckets;
            joinData[agg.key] = {
                Door_30dayCount: counts["30days"].DoorCount.value,
                Door_7dayCount: counts["7days"].DoorCount.value,
                Door_TodayCount: counts.today.DoorCount.value,
                Door_Latest: agg.latest.hits.hits[0]._source.EventTime
            };
        });
        data.forEach(function (record, index) {
            var id = idMapper(record, index);
            Object.assign(record, doorProperties, joinData[id]);
        });
    }
});