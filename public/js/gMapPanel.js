$(function () {
	gMapPanel = {};
	latlngbounds = new google.maps.LatLngBounds();
	gMapPanel.mapMarkers = [],
		gMapPanel.heatmapPoint = [],
		gMapPanel.heatmapPoint2 = [],
		gMapPanel.createMap = function () {

			var chicago = new google.maps.LatLng(41.850033, -87.6500523);
			var mapDiv = document.getElementById('map-canvas');
			var mapOptions = {
				zoom: 12,
				center: this.center || chicago,
				/* Disabling default UI widgets */
				disableDefaultUI: false,
				minZoom: 2,
				maxZoom: 16,
				styles: mapStyles
			}
			this.gmap = new google.maps.Map(mapDiv, mapOptions);
			//this.gmap.setZoom(12);
			this.getLocation();
			var heatmap = new google.maps.visualization.HeatmapLayer({
				data: this.getPoints(),
				map: this.gmap,
				maxIntensity: 20
			});
			this.heatmap = heatmap;

			var heatmap2 = new google.maps.visualization.HeatmapLayer({
				data: this.getPoints2(),
				map: this.gmap,
				maxIntensity: 10
			});
			this.heatmap2 = heatmap2;
			//gmap.fireEvent('mapready', this, this.gmap);
		},

		gMapPanel.addHeatMapData = function (item) {
			var latlong = new google.maps.LatLng(item.Latitude, item.Longitude);
			var weight = item.total * item.total;
			for (var i = 0; i < 3; i++) {
				this.heatmapPoint.push({
					location: latlong,
					weight: weight
				});
			}
		},

		gMapPanel.addHeatMapData2 = function (item) {
			var latlong = new google.maps.LatLng(item.Latitude, item.Longitude);
			var weight = item.total;
			this.heatmapPoint2.push({
				location: latlong,
				weight: weight
			});
		},

		gMapPanel.getLocation = function () {
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(this.showPosition);
			}
		}
	gMapPanel.showPosition = function (position) {
		var lat = position.coords.latitude;
		var lng = position.coords.longitude;
		gMapPanel.gmap.setCenter(new google.maps.LatLng(lat, lng));
	}

	gMapPanel.mapGetCenter = function (responseObj, heatMapSecound) {
			this.heatmap.setMap(null) //This will hide the heatmap layer
			this.heatmap.getData().j = []; //This is what actually sets the coordinates array to zero.
			this.heatmap.setMap(this.gmap) //Now when you toggle back the map, the heatlayer is gone and you can create a new one.
			this.heatmapPoint = [];
			var item;
			var point;
			if (responseObj) {
				for (var i = 0; i < responseObj.length; i++) {
					item = responseObj[i];
					if (heatMapSecound) {
						this.addHeatMapData2(item);
					} else {
						this.addHeatMapData(item);
					}
					point = new google.maps.LatLng(parseFloat(responseObj[i].Latitude), parseFloat(responseObj[i].Longitude));
					latlngbounds.extend(point);
				}
			}
			var gradient1 = [
				'rgba(0, 255, 255, 0)',
				'rgba(0, 255, 255, 1)',
				'rgba(0, 191, 255, 1)',
				'rgba(0, 127, 255, 1)',
				'rgba(0, 63, 255, 1)',
				'rgba(0, 0, 255, 1)',
				'rgba(0, 0, 223, 1)',
				'rgba(0, 0, 191, 1)',
				'rgba(0, 0, 159, 1)',
				'rgba(0, 0, 127, 1)',
				'rgba(63, 0, 91, 1)',
				'rgba(127, 0, 63, 1)',
				'rgba(191, 0, 31, 1)',
				'rgba(255, 0, 0, 1)'
			]
			// Red - negative
			var gradient2 = [
				'rgba(255, 255, 0, 0)',
				'rgba(255, 255, 0, 1)',
				'rgba(255, 225, 0, 1)',
				'rgba(255, 200, 0, 1)',
				'rgba(255, 175, 0, 1)',
				'rgba(255, 160, 0, 1)',
				'rgba(255, 145, 0, 1)',
				'rgba(255, 125, 0, 1)',
				'rgba(255, 110, 0, 1)',
				'rgba(255, 100, 0, 1)',
				'rgba(255, 75, 0, 1)',
				'rgba(255, 50, 0, 1)',
				'rgba(255, 25, 0, 1)',
				'rgba(255, 0, 0, 1)'
			]
			this.gmap.setCenter(latlngbounds.getCenter());
			this.gmap.fitBounds(latlngbounds);
			this.gmap.setZoom(gMapPanel.gmap.getZoom());

			if (heatMapSecound) {
				this.heatmap2.setData(gMapPanel.getPoints2());
				//this.heatmap2.set('radius', 20);
				this.heatmap2.set('gradient', gradient2);
			} else {
				var gradient3 = [
					'rgba(255, 255, 0, 0)',
					'rgba(255, 255, 0, 1)',
					'rgba(255, 225, 0, 1)',
					'rgba(0, 0, 255, 1)',
					'rgba(0, 0, 225, 1)',
					'rgba(255, 0, 0, 1)',
					'rgba(225, 0, 0, 1)'
				]
				this.heatmap.setData(gMapPanel.getPoints());
				this.heatmap.set('radius', 20);
				this.heatmap.set('gradient', gradient3);
			}
		},


		gMapPanel.redraw = function () {
			var map = this.gmap;
			if (map) {
				google.maps.event.trigger(map, 'resize');
			}
		},

		gMapPanel.getPoints = function () {
			return this.heatmapPoint;
		}

	gMapPanel.getPoints2 = function () {
		return this.heatmapPoint2;
	}
	gMapPanel.createMap();
});