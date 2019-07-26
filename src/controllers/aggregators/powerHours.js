var util = require('../util'),
    fs = require('fs');
var moment = require('moment-timezone');

const powerHoursQuery = fs.readFileSync(__dirname + '/powerHoursDayWise.json', 'utf-8');

const powerHoursProperties = {
    PowerOnHrs_TodayCount: 'N/A',
    PowerOnHrs_7dayCount: 'N/A',
    PowerOnHrs_30dayCount: 'N/A'
};

module.exports = util.createJoinPropertyFn({

    index: 'cooler-iot-asseteventdatasummary',
    query: powerHoursQuery,
    mergeDataFn: function (config, response) {
        var idMapper = config.idMapper,
            data = config.data;
        var aggregations = response.aggregations.Keys.buckets;
        var joinData = {};
        var todayHours = moment.utc().format('YYYY-MM-DD HH:mm:ss');
        var res = todayHours.slice(11, 13);
        var changenumber = parseInt(res);
        var time = data.length > 0 ? data[0].TimeZoneName : '';
        var restimezone;
        if (time != undefined) {
            var restimezone = parseInt(time.substring(4, 7));
        }
        if (isNaN(restimezone)) {
            var finaltodaytime = changenumber;
        } else {
            var finaltodaytime = changenumber + restimezone;
        }
        //var todayHours = moment().diff(moment().startOf('day'), 'hours');
        aggregations.forEach(function (agg, index) {
            var counts = agg.PowerDuration.buckets;
            if (counts.today.PowerOffDuration.value == 0) {
                joinData[agg.key] = {
                    PowerOnHrs_30dayCount: 720 - moment.duration(counts["30days"].PowerOffDuration.value, 'second').asHours() > 0 ? 720 - moment.duration(counts["30days"].PowerOffDuration.value, 'second').asHours() : 0,
                    PowerOnHrs_7dayCount: 168 - moment.duration(counts["7days"].PowerOffDuration.value, 'second').asHours() > 0 ? 168 - moment.duration(counts["7days"].PowerOffDuration.value, 'second').asHours() : 0,
                    PowerOnHrs_TodayCount: 0
                };
            } else {
                joinData[agg.key] = {
                    PowerOnHrs_30dayCount: 720 - moment.duration(counts["30days"].PowerOffDuration.value, 'second').asHours() > 0 ? 720 - moment.duration(counts["30days"].PowerOffDuration.value, 'second').asHours() : 0,
                    PowerOnHrs_7dayCount: 168 - moment.duration(counts["7days"].PowerOffDuration.value, 'second').asHours() > 0 ? 168 - moment.duration(counts["7days"].PowerOffDuration.value, 'second').asHours() : 0,
                    PowerOnHrs_TodayCount: finaltodaytime - moment.duration(counts.today.PowerOffDuration.value, 'second').asHours() > 0 ? finaltodaytime - moment.duration(counts.today.PowerOffDuration.value, 'second').asHours() : 0
                };
            }
        });
        data.forEach(function (record, index) {
            var id = idMapper(record, index);
            Object.assign(record, powerHoursProperties, joinData[id]);
        });
    }
});