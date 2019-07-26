var util = require('../util'),
    fs = require('fs');

const detailQuery = fs.readFileSync(__dirname + '/visitDetail.json', 'utf-8');

const visitDetailProperties = {
    details: []
};

module.exports = util.createJoinPropertyFn({
    index: 'cooler-iot-assetvisithistory',
    query: detailQuery,
    mergeDataFn: function (config, response) {
        var idMapper = config.idMapper,
            data = config.data;
        var records = response.hits.hits;
        var joinData = {};
        records.forEach(function (record, index) {
            var recordData = record._source;
            if (!joinData[recordData.VisitId]) {
                joinData[recordData.VisitId] = {
                    details: []
                };
            }
            joinData[recordData.VisitId].details.push({
                SerialNumber: recordData.AssetSerialNumber,
                Status: recordData.Status,
                AssetId: recordData.AssetId,
                Distance: 0,
                lat: recordData.Latitude,
                lon: recordData.Longitude
            })

        });
        data.forEach(function (record, index) {
            var id = idMapper(record, index);
            Object.assign(record, visitDetailProperties, joinData[id]);
        });
    }
});