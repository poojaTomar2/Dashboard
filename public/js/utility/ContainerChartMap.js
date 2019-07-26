var infoWindow = new google.maps.InfoWindow({
	content: ""
});
var Markers = [];
var MarkerLocation = [];
var map;
var markerCluster;
var latlngbounds;
var filterValues = {};
var jsonFilter = JSON.stringify({
	"start": 0,
	"limit": 10
});
var content = {
	inforWindowContent: '<div class="row"> ' +
		'<div class="col-sm-12"><h4>{{name}}</h3></div>' +
		'</div> ' +
		'<div class="row"> ' +
		'<div class="col-sm-12">{{street}} {{city}} {{country}}</div>' +
		'</div> '
}
clearMarkers = function (markers) {
		if (markers) {
			for (var i = 0; i < markers.length; i++) {
				markers[i].setMap(null);
			}
		}
		markers = [];

	},
	addMarkers = function (markers) {
		if (markers.isArray()) {
			for (var i = 0; i < markers.length; i++) {
				if (typeof markers[i].geoCodeAddr == 'string') {
					//
				} else {
					var mkr_point = new google.maps.LatLng(markers[i].lat, markers[i].lng);
					this.addMarker(mkr_point, markers[i].marker, false, markers[i].setCenter, markers[i].listeners);
				}
			}
		}

	};

function initialize(filters) {
	//pageSetUp();
	var mapDiv = document.getElementById('map-location');
	var chicago = new google.maps.LatLng(41.850033, -87.6500523);
	var mapOptions = {
		zoom: 12,
		center: this.center || chicago,
		minZoom: 2,
		maxZoom: 18,
		styles: mapStyles
	}
	gmapAsset = new google.maps.Map(mapDiv, mapOptions);
	var markers = [];
	var coolerMap = gmapAsset;
	var origin = new google.maps.LatLng(41.850033, -87.6500523);
	var map = coolerMap;
	var locFilter = {
		'start': 0,
		'limit': 10000
	};
	if (filters) {
		if (filters.Displacement_To || filters.Displacement_From || filters["Displacement_To[]"] || filters["Displacement_From[]"]) {
			filters["startDateMovement"] = filters.startDate;
			filters["endDateMovement"] = filters.endDate;
			filters["fromMovementScreen"] = true;
			if (filters.dayOfWeek || filters["dayOfWeek[]"]) {
				filters["dayOfWeekMovement"] = filters.dayOfWeek || filters["dayOfWeek[]"];
			}
			if (filters.yearWeek || filters["yearWeek[]"]) {
				params["yearWeekMovement"] = filters.yearWeek || filters["yearWeek[]"];
			}
			if (filters.quarter || filters["quarter[]"]) {
				filters["quarterMovement"] = filters.quarter || filters["quarter[]"];
			}
			if (filters.month || filters["month[]"]) {
				filters["monthMovement"] = filters.month || filters["month[]"];
			}
		}

		if (filters.DoorCount || filters["DoorCount[]"]) {
			filters["startDateDoor"] = filters.startDate;
			filters["endDateDoor"] = filters.endDate;
			filters["fromDoorScreen"] = true;
			filters["customQueryDoor"] = true;
			if (filters.dayOfWeek || filters["dayOfWeek[]"]) {
				filters["dayOfWeekDoor"] = filters.dayOfWeek || filters["dayOfWeek[]"];
			}
			if (filters.yearWeek || filters["yearWeek[]"]) {
				params["yearWeekDoor"] = filters.yearWeek || filters["yearWeek[]"];
			}
			if (filters.quarter || filters["quarter[]"]) {
				filters["quarterDoor"] = filters.quarter || filters["quarter[]"];
			}
			if (filters.month || filters["month[]"]) {
				filters["monthDoor"] = filters.month || filters["month[]"];
			}
		}

		if (filters.TempBand || filters["TempBand[]"]) {
			filters["startDateHealth"] = filters.startDate;
			filters["endDateHealth"] = filters.endDate;
			filters["fromHealthScreen"] = true;
			filters["customQueryHealth"] = true;
			if (filters.dayOfWeek || filters["dayOfWeek[]"]) {
				filters["dayOfWeekHealth"] = filters.dayOfWeek || filters["dayOfWeek[]"];
			}
			if (filters.yearWeek || filters["yearWeek[]"]) {
				params["yearWeekHealth"] = filters.yearWeek || filters["yearWeek[]"];
			}
			if (filters.quarter || filters["quarter[]"]) {
				filters["quarterHealth"] = filters.quarter || filters["quarter[]"];
			}
			if (filters.month || filters["month[]"]) {
				filters["monthHealth"] = filters.month || filters["month[]"];
			}
		}

		if (filters.LightStatus || filters["LightStatus[]"]) {
			filters["startDateLight"] = filters.startDate;
			filters["endDateLight"] = filters.endDate;
			filters["fromLightScreen"] = true;
			filters["LightStatusBand"] = filters.LightStatus || filters["LightStatus[]"];
			filters["customQueryLight"] = true;
			if (filters.dayOfWeek || filters["dayOfWeek[]"]) {
				filters["dayOfWeekLight"] = filters.dayOfWeek || filters["dayOfWeek[]"];
			}
			if (filters.yearWeek || filters["yearWeek[]"]) {
				params["yearWeekLight"] = filters.yearWeek || filters["yearWeek[]"];
			}
			if (filters.quarter || filters["quarter[]"]) {
				filters["quarterLight"] = filters.quarter || filters["quarter[]"];
			}
			if (filters.month || filters["month[]"]) {
				filters["monthLight"] = filters.month || filters["month[]"];
			}
		}

		if (filters.PowerStatus || filters["PowerStatus[]"]) {
			filters["startDatePower"] = filters.startDate;
			filters["endDatePower"] = filters.endDate;
			filters["fromPowerScreen"] = true;
			filters["PowerBand"] = filters.PowerStatus || filters["PowerStatus[]"];
			filters["customQueryPower"] = true;
			if (filters.dayOfWeek || filters["dayOfWeek[]"]) {
				filters["dayOfWeekPower"] = filters.dayOfWeek || filters["dayOfWeek[]"];
			}
			if (filters.yearWeek || filters["yearWeek[]"]) {
				params["yearWeekPower"] = filters.yearWeek || filters["yearWeek[]"];
			}
			if (filters.quarter || filters["quarter[]"]) {
				filters["quarterPower"] = filters.quarter || filters["quarter[]"];
			}
			if (filters.month || filters["month[]"]) {
				filters["monthPower"] = filters.month || filters["month[]"];
			}
		}
		$.extend(locFilter, filters);
		//Object.assign(locFilter, filters);
	}
	var locJsonFilter = locFilter;
	this.locJsonFilter = locJsonFilter;
	this.locJsonFilter["AssetId"] = [];
	this.locJsonFilter["LocationId"] = [];
	this.locJsonFilter["isFromGrid"] = true;
	$('#mapLocationSpainner').spin(coolerDashboard.common.smallSpin);
	// coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
	$.ajax({
		url: coolerDashboard.common.nodeUrl('outlet/list', this.locJsonFilter),
		type: 'GET',
		success: function (result, data) {
			// coolerDashboard.gridUtils.ajaxIndicatorStop();
			$('#mapLocationSpainner').spin(false);
			clearMarkers(markers);
			var resp = result.data;
			var infoWindow = new google.maps.InfoWindow({
				maxWidth: 500
			});
			var oms = new OverlappingMarkerSpiderfier(map, {
				keepSpiderfied: true,
				nearbyDistance: 15,
				circleSpiralSwitchover: 0,
				legWeight: 2
			});
			var icons = ["img/icons/cooler-icon_in_range_@1x.png", "img/coolermap/Health.png", "img/coolermap/Purity.png", "img/coolermap/moment.png", "img/coolermap/Power.png"];
			var latLngBounds = new google.maps.LatLngBounds();

			if (resp.length == 0) {
				$('#noresultdialog').dialog('open');
			}
			for (var i = 0, len = resp.length; i < len; i++) {
				var rec = resp[i];
				var url = i < 100 ? icons[0] : i > 100 && i < 500 ? icons[1] : i < 1000 && i > 500 ? icons[2] : i < 1500 && i > 1000 ? icons[3] : icons[4];
				var latitude = rec.LocationGeo.lat || (rec.NearestLocationGeo ? rec.NearestLocationGeo.lat : rec.LocationGeo.lat);
				var longitude = rec.LocationGeo.lon || (rec.NearestLocationGeo ? rec.NearestLocationGeo.lon : rec.LocationGeo.lon),
					position = new google.maps.LatLng(latitude, longitude);
				latLngBounds.extend(position);
				marker = new google.maps.Marker({
					position: position,
					lat: latitude,
					lng: longitude,
					marker: '',
					icon: {
						url: rec["Alert_Highest_PriorityId"] == 0 || isNaN(rec["Alert_Highest_PriorityId"]) ? coolerDashboard.renderers.priorityIconColor[100] : coolerDashboard.renderers.priorityIconColor[rec["Alert_Highest_PriorityId"]],
						size: new google.maps.Size(50, 50),
						anchor: new google.maps.Point(6, 6)
					},
					map: map
				});
				//var iw = new google.maps.InfoWindow();
				oms.addMarker(marker);
				if (rec) {
					coolerDashboard.common.attachMarkerListener(infoWindow, marker, rec, map);
				}
				markers.push(marker);
				map.setCenter(new google.maps.LatLng(markers[0].lat, markers[0].lng));
			}
			if (!this.markerCluster) {
				var markerCluster = new MarkerClusterer(map, markers, {
					zoomOnClick: true,
					maxZoom: 12,
					averageCenter: true,
					imagePath: 'img/map/m'
				});
				this.markerCluster = markerCluster;
			} else {
				this.markerCluster.addMarkers(markers);
			}
			map.fitBounds(latLngBounds);

			if (localStorage.comboData) {
				coolerDashboard.common.addSelectData($('.alertTypeCombo'), JSON.parse(LZString.decompressFromUTF16(localStorage.comboData)).data.AlertType, '');
			}
		},
		failure: function () {
			//coolerDashboard.gridUtils.ajaxIndicatorStop();
			$('#mapLocationSpainner').spin(false);
			alert('Error: Some error occured. Please try later.');
		}
	});
}