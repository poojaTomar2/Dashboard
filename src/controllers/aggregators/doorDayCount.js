var util = require('../util'),
    fs = require('fs');

const doorCountQuery = fs.readFileSync(__dirname + '/doorDayCount.json', 'utf-8');

const doorProperties = {
    DoorCount: 'N/A',
    Door_Days: 'N/A',
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
            joinData[agg.key] = {
                DoorCount: agg.DoorCount.value,
                Door_Days: agg.DayCount.buckets.length
            };
        });
        data.forEach(function (record, index) {
            var id = idMapper(record, index);
            Object.assign(record, doorProperties, joinData[id]);
        });
    }
});