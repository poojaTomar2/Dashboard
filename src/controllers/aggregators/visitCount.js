var util = require('../util'),
    fs = require('fs');

const visitCountQuery = fs.readFileSync(__dirname + '/visitCountJoin.json', 'utf-8');

const visitProperties = {

	Visit_First_Name: null,
	Visit_Last_Name: null,
	Visit_Start_Time: null
};

const visitDateProperties = {

	Visit_Highest_VisitDate: null
};

module.exports = util.createJoinPropertyFn({
	index: 'cooler-iot-visit',
	query: visitCountQuery,
	mergeDataFn: function (config, response) {
		var idMapper = config.idMapper, data = config.data;
		var aggregations = response.aggregations.Keys.buckets;
		var joinData = {};
		var joinDataVisitBy = {};
		aggregations.forEach(function (agg, index) {
			var key = agg.key;
			var record = {};
			var highestVisit = agg.LatestVisit.hits.hits[0];
			record.Visit_Highest_VisitDate = highestVisit._source.Date;
			
			joinData[key.toString()] = record;
		});
		
		 var records = response.hits.hits;
		 records.forEach(function (record, index) {
            var recordData = record._source;
           	var record = {};
			record.Visit_First_Name = recordData.FirstName;
			record.Visit_Last_Name = recordData.LastName;
			record.Visit_StartTime = recordData.LastName;
			record.Visit_Start_Time = recordData.StartTime
			joinDataVisitBy[recordData.Id] = record;
            
        });
		data.forEach(function (record, index) {
			var id = idMapper(record, index);
			Object.assign(record, visitDateProperties, joinData[id]);
			Object.assign(record, visitProperties, joinDataVisitBy[id]);
		});
	}
});