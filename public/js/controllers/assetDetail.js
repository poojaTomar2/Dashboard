var gmapAsset;
var validLatLong = {
	Latitude: 90,
	Longitude: 180
};
var seletedAssetData = {};
var markers = [];
var markersRoute = [];
var directionsDisplay;
var geocoder;
var movementFilter = '{}';
var validateLatLog = function (latitude, longitude) {
	return latitude >= -validLatLong.Latitude && latitude <= validLatLong.Latitude && longitude >= -validLatLong.Longitude && longitude <= validLatLong.Longitude;
};
var outer = {};

var LightAssetDataCount = 0;
var TemperatureAssetDataCount = 0;
var DoorAssetDataCount = 0;
var PowerAssetDataCount = 0;
var CompressAssetDataCount = 0;
var FanAssetDataCount = 0;
var EvaporatorTemperatureAssetDataCount = 0;
var activeAssetDetailViewTab = 'assets1';
var currentUrl = window.location.href;

function getAssetDetailActiveTab(tabId) {
	activeAssetDetailViewTab = tabId;
}

function infoGuideAssetsDetailView(sectionId) {
	window.open('#InfoGuide#index=' + sectionId);
}

if (currentUrl.indexOf('LocationMap#salesHierarchy') > 0) {
	$('#bodyId').addClass('no-menu');
	$("#userInfo").remove();
} else if (currentUrl.indexOf('irsignup') > 0 || currentUrl.indexOf('outletDetailsIR') > 0) {
	$('#bodyId').addClass('no-menu');
} else {
	$('#bodyId').removeClass('no-menu');
}

var loadChart = function (chartFilter) {
	LightAssetDataCount = 0;
	TemperatureAssetDataCount = 0;
	DoorAssetDataCount = 0;
	PowerAssetDataCount = 0;
	CompressAssetDataCount = 0;
	FanAssetDataCount = 0;
	EvaporatorTemperatureAssetDataCount = 0;


	$.ajax({
		url: coolerDashboard.common.nodeUrl('assetChart', chartFilter),
		method: 'POST',
		success: function (data, request) {

			var rows = data.buckets;
			for (var i = 0, len = rows.length; i < len; i++) {
				rows[i].date = Number(new Date(rows[i].dateTime));
			}

			data.buckets = _.sortBy(data.buckets, "date").reverse();

			var seriesData = highChartsHelper.convertToSeries({
				seriesConfig: [{
						name: 'Avg Light',
						yAxis: 0,
						data: function (record) {
							if (record.avgLight)
								LightAssetDataCount++;
							return [record.date, record.avgLight ? record.avgLight : null];
						},
						tooltip: {
							pointFormat: "Avg Light: {point.y:.2f}"
						},
						visible: false
					}, {
						name: 'Avg Temperature',
						yAxis: 1,
						data: function (record) {
							if (record.avgTemperature)
								TemperatureAssetDataCount++;
							return [record.date, record.avgTemperature ? record.avgTemperature : null];
						},
						tooltip: {
							pointFormat: "Avg Temperature: {point.y:.2f}"
						},
						visible: false
					},
					{
						name: 'Door Opens',
						type: 'column',
						yAxis: 2,
						data: function (record) {
							if (record.doorRecords)
								DoorAssetDataCount++;
							return [record.date, record.doorRecords ? record.doorRecords : null];
						},
						tooltip: {
							pointFormat: "Door Count: {point.y:.0f}"
						},
						visible: true
					}, {
						name: 'Power On',
						type: 'line',
						yAxis: 3,
						data: function (record) {
							if (record.power)
								PowerAssetDataCount++;
							return [record.date, record.power ? record.power : null];
						},
						tooltip: {
							pointFormat: "Power On (Hrs): {point.y:.2f}"
						},
						visible: false
					}, {
						name: 'Compressor Run Hours',
						type: 'line',
						yAxis: 4,
						data: function (record) {
							if (record.compressorDuration)
								CompressAssetDataCount++;
							return [record.date, record.compressorDuration ? record.compressorDuration : null];
						},
						tooltip: {
							pointFormat: "Compressor Run Hours (Hrs): {point.y:.2f}"
						},
						visible: false
					}, {
						name: 'Evaporator Fan Run Hours',
						type: 'line',
						yAxis: 5,
						data: function (record) {
							if (record.fanDuration)
								FanAssetDataCount++;
							return [record.date, record.fanDuration ? record.fanDuration : null];
						},
						tooltip: {
							pointFormat: "Evaporator Fan Run Hours (Hrs): {point.y:.2f}"
						},
						visible: false

					}, {
						name: 'Evaporator Avg Temperature',
						yAxis: 6,
						data: function (record) {
							if (record.evaporatorTemperature)
								EvaporatorTemperatureAssetDataCount++;
							return [record.date, record.evaporatorTemperature ? record.evaporatorTemperature : null];
						},
						tooltip: {
							pointFormat: "Evaporator Avg Temperature: {point.y:.2f}"
						},
						visible: false

					}

				],

				data: data.buckets
			});

			seriesData.xAxis = {
				tickInterval: 24 * 3600 * 1000,
				type: "datetime",
				dateTimeLabelFormats: {
					month: '%e. %b',
					year: '%b'
				},
				rotation: -45
			};

			$('#temperatureLight').highcharts({
				title: {
					text: ''
				},
				yAxis: [{
					min: 0,
					showEmpty: false,
					//opposite: true,
					title: {
						text: 'Light'
					}
				}, {
					min: 0,
					showEmpty: false,
					//opposite: true,
					title: {
						text: 'Temperature'
					}
				}, {
					min: 0,
					showEmpty: false,
					title: {
						text: 'Door Count'
					}
				}, {
					min: 0,
					showEmpty: false,
					opposite: true,
					title: {
						text: 'Power On'
					}
				}, {
					min: 0,
					showEmpty: false,
					opposite: true,
					title: {
						text: 'Compressor Run Hours'
					}
				}, {
					min: 0,
					showEmpty: false,
					opposite: true,
					title: {
						text: 'Fan Run Hours'
					}
				}, {
					min: 0,
					showEmpty: false,
					//opposite: true,
					title: {
						text: 'Evaporator Avg Temperature'
					}
				}, {
					min: 0,
					showEmpty: false,
					opposite: true,
					title: {
						text: 'Compressor Run Hours'
					}
				}, {
					min: 0,
					showEmpty: false,
					opposite: true,
					title: {
						text: 'Fan Run Hours'
					}
				}],

				plotOptions: {
					column: {
						groupPadding: 1,
						pointWidth: 20
					}
				},
				lang: {
					noData: "No data found to display",
					thousandsSep: ','
				},
				xAxis: seriesData.xAxis,
				series: seriesData.series,
				tooltip: {
					pointFormat: "{point.y:.2f}"
				}
			});
			var chartAsset = $('#temperatureLight').highcharts();

			for (var i = 0; i < 7; i++) {
				chartAsset.series[i].setVisible(false, false);
			}

			if (LightAssetDataCount > 0) {
				chartAsset.series[0].setVisible(true, false)
			} else if (TemperatureAssetDataCount > 0) {
				chartAsset.series[1].setVisible(true, false)
			} else if (DoorAssetDataCount > 0) {
				chartAsset.series[2].setVisible(true, false)
			} else if (PowerAssetDataCount > 0) {
				chartAsset.series[3].setVisible(true, false)
			} else if (CompressAssetDataCount > 0) {
				chartAsset.series[4].setVisible(true, false)
			} else if (FanAssetDataCount > 0) {
				chartAsset.series[5].setVisible(true, false)
			} else if (EvaporatorTemperatureAssetDataCount > 0) {
				chartAsset.series[6].setVisible(true, false)
			}

			chartAsset.redraw();
		},
		failure: function (response, opts) {}
	});
}

var addMarkers = function (markers) {
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
var mapDirection = function (request, data, mapObject, duplicate) {
	outer.duplicate = duplicate;
	if (request) {

		// marker update start from here
		if (data) {
			outer.infoWindow = new google.maps.InfoWindow({
				maxWidth: 350
			});

			var attachListener = function (marker) {
				//outer.content = content;
				var title;
				google.maps.event.addListener(marker, 'click', function () {
					//Hide existing markers
					new google.maps.event.trigger(outer.map.map, 'click');
					title = marker.title;
					title = title.replace('Address:', '<b>Address</b>:');
					title = title.replace('Latitude:', '<br/><b>Latitude</b>:');
					title = title.replace('Longitude:', '<b>Longitude</b>:');
					title = title.replace('Date Time:', '<br /><b>Date Time</b>:');
					outer.infoWindow.setContent(title);
					outer.infoWindow.open(outer.map.map, marker);
				});
			}
			outer.data = data;
		}
		// marker update end from here

		var rendererOptions = {
			map: mapObject,
			suppressMarkers: true,
			preserveViewport: true
		};
		directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
		outer.directionsDisplay = directionsDisplay;
		var directionsService = new google.maps.DirectionsService();
		directionsService.route(request, function (response, status) {

			var Outleturl = "img/icons/Store_icon.png",
				redUrl = "img/icons/red.png",
				greenUrl = "img/icons/green.png",
				yellowUrl = "img/icons/yellow.png";
			var iconUrl = isNaN(this.seletedAssetData.PriorityId) || !this.seletedAssetData.PriorityId ? coolerDashboard.renderers.priorityIconColor[100] : coolerDashboard.renderers.priorityIconColor[this.seletedAssetData.PriorityId];

			if (status == google.maps.DirectionsStatus.OK) {
				// Display the route on the map.
				directionsDisplay.setDirections(response);
				markersRoute = [];
				//http://googlemaps.googlermania.com/google_maps_api_v3/en/map_example_direction_customicon.html
				//First leg is ORIGIN and last leg is DESTINATION

				// marker update start from here
				if (outer.data) {
					var legs = response.routes[0].legs,
						lat, lng, address, start, content, end, marker;
					outer.map = this.directionsDisplay;

					var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
						labelIndex = 0,
						startEndUrl = "img/icons/start_end.png",
						waypointUrl = "img/icons/point.png";
					var installPosition = new google.maps.LatLng(this.seletedAssetData.Latitude.toFixed(4), this.seletedAssetData.Longitude.toFixed(4));
					for (var index = 0, len = legs.length; index < len; index++) {
						lat = legs[index]['start_location'].lat().toFixed(4),
							lng = legs[index]['start_location'].lng().toFixed(4),
							address = legs[index]['start_address'],
							start = new google.maps.LatLng(lat, lng);
						if (Outleturl == iconUrl) {
							address = this.seletedAssetData.Address;
						}
						content = 'Address: ' + address + ' \n' + outer.data[index].title;
						marker = new google.maps.Marker({
							position: start,
							title: content,
							label: labels[labelIndex++ % labels.length],
							map: this.directionsDisplay.map,
							icon: {
								url: index == 0 ? gpsGridSelected ? startEndUrl : iconUrl : waypointUrl,
								origin: new google.maps.Point(0, 0)
							}

						});

						attachListener(marker);
						markersRoute.push(marker);
					}
					if (!outer.duplicate) {
						//For last position / marker
						index--;
						lat = legs[index]['end_location'].lat(),
							lng = legs[index]['end_location'].lng(),
							address = legs[index]['end_address'],
							end = new google.maps.LatLng(lat, lng),
							content = 'Address: ' + address + ', \n' + outer.data[index + 1].title,
							marker = new google.maps.Marker({
								position: end,
								title: content,
								label: labels[labelIndex++ % labels.length],
								map: this.directionsDisplay.map,
								icon: {
									url: startEndUrl,
									origin: new google.maps.Point(0, 0)
								}
							});
						attachListener(marker);
						markersRoute.push(marker);
					}
				}
				// marker update end from here
			} else {
				this.markers.push(new google.maps.Marker({
					position: new google.maps.LatLng(this.seletedAssetData.Latitude, this.seletedAssetData.Longitude),
					title: this.getMarkerTitle(this.seletedAssetData),
					icon: {
						url: iconUrl
					}
				}));
				this.markers[this.markers.length - 1].setMap(this.gmapAsset)
			}
			gpsGridSelected = false;
		}, this);
	}

};

clearDirectionDisplay = function (directionsDisplay) {
	//Clearing old DIRECTIONS MARKER, Needs to be fixed correctly, right now only VISIBLE : FALSE
	//Referred: https://code.google.com/p/gmaps-api-issues/issues/detail?id=2506
	if (directionsDisplay) {
		directionsDisplay.setMap(null);
		directionsDisplay = null;
	}
};
getMarkerTitle = function (data) {
		var title = 'Latitude: ' + data.Latitude + ', Longitude: ' + data.Longitude;
		var start = new google.maps.LatLng(data.Latitude, data.Longitude);
		var installPosition = new google.maps.LatLng(Number(this.seletedAssetData.Latitude.toFixed(4)), Number(this.seletedAssetData.Longitude.toFixed(4)));
		if (data.EventTime) {
			if (!(moment(data.EventTime).format('YYYY-MM-DDTHH:mm:SS') == coolerDashboard.common.emptyDate)) {
				var dateTime = coolerDashboard.renderers.dateTime(data.EventTime);
				title += '\n Date Time: ' + dateTime;
			} else {
				title += '\n Date Time: -';
			}
		}
		return title;
	},

	clearMarkers = function () {
		if (markers) {
			for (var i = 0; i < markers.length; i++) {
				markers[i].setMap(null);
			}
		}
		if (markersRoute) {
			for (var i = 0; i < markersRoute.length; i++) {
				markersRoute[i].setMap(null);
			}
		}
		markers = [];
		markersRoute = [];
	}

function movementMap(data) {
	clearMarkers();
	clearDirectionDisplay();
	outer = {};
	var data = data.record || data,
		origin,
		destination,
		wayPoints = [],
		wayPointsInfo = [],
		isDistibution,
		distibutionDiff,
		defaultIcon = {
			// use whatever icon you want for the "dots"
			url: "img/icons/measle_blue.png",
			size: new google.maps.Size(10, 10),
			anchor: new google.maps.Point(6, 6)
		},
		storeIcon = {
			// use whatever icon you want for the "dots"
			url: "img/icons/Store_icon.png",
			anchor: new google.maps.Point(6, 6)
		},
		validData = [];
	for (var i = 0; i < data.length; i++) {
		if (validateLatLog(data[i].Latitude, data[i].Longitude)) {
			validData.push(data[i]);
		}
	}
	var latLngBounds = new google.maps.LatLngBounds();
	var dataLen = validData.length;
	var installPosition = new google.maps.LatLng(this.seletedAssetData.Latitude, this.seletedAssetData.Longitude);
	var insertLocation = true;
	if (dataLen > 0) {
		/*if movement count is greater then 10 then we assign a flag to handle it*/
		if (dataLen > 10) {
			isDistibution = true;
			distibutionDiff = Math.round((dataLen - 2) / 8);
		}
		for (var i = 0; i < dataLen; i++) {
			var currentPosition = new google.maps.LatLng(validData[i].Latitude, validData[i].Longitude);
			if (i == 0) {
				markers.push(new google.maps.Marker({
					position: currentPosition,
					title: getMarkerTitle(validData[i]),
					icon: defaultIcon
				}));
				wayPointsInfo.push({
					location: currentPosition,
					title: getMarkerTitle(data[i])
				});
				origin = currentPosition;
				if (installPosition.equals(currentPosition)) {
					insertLocation = false;
				}
				latLngBounds.extend(currentPosition);
			} else if (i == dataLen - 1) {
				markers.push(new google.maps.Marker({
					position: currentPosition,
					title: getMarkerTitle(validData[i]),
					icon: defaultIcon
				}));
				destination = currentPosition;
				wayPointsInfo.push({
					location: currentPosition,
					title: getMarkerTitle(data[i])
				});
				if (installPosition.equals(currentPosition)) {
					insertLocation = false;
				}
				latLngBounds.extend(currentPosition);
			} else {
				if (isDistibution) {
					/*Here if any case waypoint comes more then 8 then we dont ploat that on map*/
					if (i % distibutionDiff == 0 && wayPoints.length < 8) {
						wayPoints.push({
							location: currentPosition
						});
						wayPointsInfo.push({
							location: currentPosition,
							title: getMarkerTitle(data[i])
						});
					}
				} else {
					wayPoints.push({
						location: currentPosition
					});
					wayPointsInfo.push({
						location: currentPosition,
						title: getMarkerTitle(data[i])
					});
				}
				markers.push(new google.maps.Marker({
					position: currentPosition,
					title: getMarkerTitle(validData[i]),
					icon: defaultIcon
				}));

				latLngBounds.extend(currentPosition);
				if (installPosition.equals(currentPosition)) {
					insertLocation = false;
				}
			}
		}
		if (insertLocation) {
			markers.push(new google.maps.Marker({
				position: installPosition,
				title: getMarkerTitle(this.seletedAssetData),
				icon: storeIcon
			}));
			latLngBounds.extend(installPosition);
		}
		var request = {
			origin: origin,
			destination: destination ? destination : origin,
			waypoints: wayPoints,
			travelMode: google.maps.DirectionsTravelMode.DRIVING
		};
		if (directionsDisplay) {
			clearDirectionDisplay(directionsDisplay);
		}
		for (var i = 0; i < markers.length; i++) {
			markers[i].setMap(gmapAsset);
		}
		if (origin) {
			mapDirection(request, wayPointsInfo, gmapAsset, destination ? false : true);
		}
		gmapAsset.fitBounds(latLngBounds);
	}
}

function movementMapAjax(movementFilter) {
	$.ajax({
		url: coolerDashboard.common.nodeUrl('getMovementGPS', movementFilter),
		success: function (data, request) {
			movementMap(data);
		},
		failure: function (response, opts) {},
		scope: this
	});
}

function initialize(selectedAsset) {
	var chicago = new google.maps.LatLng(41.850033, -87.6500523);
	var mapDiv = document.getElementById('movementMap');
	var mapOptions = {
		zoom: 12,
		center: this.center || chicago,
		styles: mapStyles
	}
	gmapAsset = new google.maps.Map(mapDiv, mapOptions);

	var assetId;
	var assetLatitude;
	var assetLongitude;
	var assetCurrentLatitude;
	var assetCurrentLongitude;
	var displacement;
	var installationDate;
	var lastPingDate;
	if (selectedAsset) {
		assetId = selectedAsset.Id;
		assetLatitude = selectedAsset.LocationGeo.lat;
		assetLongitude = selectedAsset.LocationGeo.lon;
		assetCurrentLatitude = selectedAsset.LatestLocationGeo.lat;
		assetCurrentLongitude = selectedAsset.LatestLocationGeo.lon;
		displacement = selectedAsset.Displacement;
		installationDate = moment(selectedAsset.Installation).format();
		lastPingDate = moment(selectedAsset.LastPing).format();

		this.seletedAssetData = {
			Latitude: assetLatitude,
			Longitude: assetLongitude,
			EventTime: installationDate,
			PriorityId: selectedAsset.Alert_Highest_PriorityId,
			Address: coolerDashboard.gridUtils.joinStrings(' ', selectedAsset.Street, selectedAsset.Street2, selectedAsset.Street3, selectedAsset.State, selectedAsset.Country)
		}

	};
	var data = [];
	if (displacement > .5) {
		data.push({
			"Latitude": assetLatitude,
			"Longitude": assetLongitude,
			"EventTime": installationDate
		});
		data.push({
			"Latitude": assetCurrentLatitude,
			"Longitude": assetCurrentLongitude,
			"EventTime": lastPingDate
		});
		movementMap(data);
	} else {
		data.push({
			"Latitude": assetLatitude,
			"Longitude": assetLongitude,
			"EventTime": installationDate
		});
		movementMap(data);
	}

	var startDate = moment().startOf('day');
	var endDate = moment().endOf('day');
	//movementFilter = JSON.parse(movementFilter);
	if (!(movementFilter.startDate && movementFilter.endDate)) {
		movementFilter = {
			'assetId': assetId,
			'assetLatitude': assetLatitude,
			'assetLongitude': assetLongitude
		};
	}
	movementFilter = JSON.stringify(movementFilter);
	//movementMapAjax(movementFilter);
}

function onAssetData(selectedAsset) {
	gpsGridSelected = false;
	pageSetUp();
	initialize(selectedAsset);
	var gridUtils = coolerDashboard.gridUtils;

	var common = coolerDashboard.common,
		renderers = coolerDashboard.renderers;

	common.selectedAsset = selectedAsset;

	var assetId = selectedAsset.Id;
	if (selectedAsset.DeviceLightStatus == "Medium Brightness" || selectedAsset.DeviceLightStatus == "Full Light Brightness") {
		light = 'On'
	} else {
		light = 'Off'
	}
	var temp = selectedAsset.Temperature == null || selectedAsset.Temperature == 127 ? 0 : selectedAsset.Temperature,
		//light = selectedAsset.LightIntensity == null || selectedAsset.LightIntensity == 127 ? 0 : selectedAsset.LightIntensity == -1 ? 'N/A' : selectedAsset.LightIntensity,
		//doorCount = selectedAsset.doorOpenDuration == null ? 0 : selectedAsset.doorOpenDuration,

		power = !selectedAsset.GatewaySerialNumber ? 'N/A' : selectedAsset.IsPowerOn ? "On" : "Off";
	$('#currentTemprature')[0].innerHTML = temp + "&#8451";
	$('#currentLight')[0].innerHTML = light;
	//$('#currentDoorCount')[0].innerHTML =  doorCount;
	$('#currentPowerStatus')[0].innerHTML = power;
	var coolerDetailPanel = $('#coolerDetailContainer')[0];
	var blocks = [];



	if (selectedAsset.SmartDeviceSerialNumber) {

		if (selectedAsset.SmartDeviceTypeId == 21 || selectedAsset.SmartDeviceTypeId == 29) {
			$('.assetNoEMD').removeClass('hidden');
			$('#movementMap').height('486px');
		} else {
			$('.assetNoEMD').addClass('hidden');
			$('#movementMap').height('377px');
		}

		blocks.push(common.createBlock("Smart", true, "blue"));
		blocks.push(common.createBlock(selectedAsset.SmartDeviceType, true, "blue"));
		blocks.push(common.createBlock(selectedAsset.IsUnhealthy ? "Unhealthy" : "", selectedAsset.IsUnhealthy, "red"));
		blocks.push(common.createBlock(selectedAsset.PurityIssue == 1 ? "Impure" : "", selectedAsset.PurityIssue, "red"));
		if (selectedAsset.GatewaySerialNumber && selectedAsset.IsPowerOn === false) {
			blocks.push("<img width='25' height='25' src='img/AlertType/power.png' />");
		}
	}

	coolerDetailPanel.innerHTML = selectedAsset.SerialNumber + " " + blocks.join(" ");


	if (selectedAsset) {
		var ids = ["installPosition", "currentPosition", "AssetType", "Location", "address", "assetLastPing", "deviceSerial", "latestScanTime", "latestDoor", "doorCounts", "alertCountAsset", "powerOnHrs", "compressorStart", "compressorRunHrs", "fanStart", "fanRunHrs"]
		var assetData = selectedAsset;
		var fixedData = {};
		for (prop in assetData) {
			fixedData[prop.replace(/ /g, '')] = assetData[prop];
		}

		$('#lastRecognition')[0].innerHTML = selectedAsset.LatestProcessedPurityId == 0 ? "N/A" : coolerDashboard.renderers.dateLocalizer(selectedAsset.VerifiedOn, '');
		$('#facings')[0].innerHTML = coolerDashboard.common.facingRenderer(selectedAsset);
		$('#visionKpi')[0].innerHTML = coolerDashboard.common.visionKpiRenderer(selectedAsset);
		$('#capacity')[0].innerHTML = selectedAsset.AverageCapacity;
		for (var i = 0; len = ids.length, i < len; i++) {
			switch (ids[i]) {
				case "address":
					$('#' + ids[i])[0].innerText = gridUtils.joinStrings(' ', fixedData.Street, fixedData.Street2, fixedData.Street3, fixedData.State, fixedData.Country);
					break;
				case "installPosition":
					$('#' + ids[i])[0].innerText = renderers.geo(null, null, {
						Latitude: fixedData.LocationGeo.lat,
						Longitude: fixedData.LocationGeo.lon
					});
					break;
				case "currentPosition":
					var displacementValue = "";
					if (fixedData.LatestLocationGeo.lat !== 0 || fixedData.LatestLocationGeo.lon !== 0) {
						displacementValue = common.createBlock(fixedData.Displacement < .5 ? "Ok" : (fixedData.Displacement.toFixed(2) + "km"), !!fixedData.Displacement, fixedData.Displacement > .499 ? 'red' : 'blue')
					}
					$('#' + ids[i])[0].innerHTML = renderers.geo(null, null, {
						Latitude: fixedData.LatestLocationGeo.lat,
						Longitude: fixedData.LatestLocationGeo.lon
					}) + " " + displacementValue + " ";
					break;
				case "latestDoor":
					var value = '';
					if (!fixedData.Door_Latest || fixedData.Door_Latest == coolerDashboard.common.emptyDate) {
						value = '-';
					} else {
						value = moment(fixedData.Door_Latest).format(coolerDashboard.dateTimeFormat);
					}
					$('#' + ids[i])[0].innerText = value;
					break;
				case "alertCountAsset":
					var icons = [];
					if (fixedData) {
						var length = fixedData["Alert_Open_All_Type"].length;
						for (var j = 0; j < length; j++) {
							var icon = renderers.alertTypeIcons[fixedData["Alert_Open_All_Type"][j]];
							var titleText = renderers.alertTypeText[fixedData["Alert_Open_All_Type"][j]];
							if (icon) {
								icons.push("<div style='display:inline-block; padding:1px;'><img src='" + icon + "' title= '" + titleText + "' /></div>");
							}
						}
						icons = icons.join("");
					}
					//var alertTypeIcon = fixedData["Alert_Open_All_Type"] == 0 ? "" : '<div style="display:inline-block; padding:1px;"><img src=' + coolerDashboard.renderers.alertTypeIcons[fixedData["Alert_Highest_AlertTypeId"]] + ' /></div>';
					$("#" + ids[i])[0].innerHTML = fixedData["Alert_Open"] + '&nbsp; ' + icons;
					break;
				case "doorCounts":
					$('#' + ids[i])[0].innerHTML =
						fixedData["Door_TodayCount"] + " <span class='lighter'>today</span>, " +
						fixedData["Door_7dayCount"] + " <span class='lighter'>7d</span>, " +
						fixedData["Door_30dayCount"] + " <span class='lighter'>30d</span>";
					break;
				case "assetLastPing":
					$('#' + ids[i])[0].innerText = gridUtils.joinStrings(", ", common.dateTime(fixedData.LastPing, ""), common.dateTime(fixedData.GatewayLastPing, ""));
					break;
				case "latestScanTime":
					var assetCurrentStatusValue = common.createBlock(fixedData.AssetCurrentStatus, !!fixedData.AssetCurrentStatus, ["Wrong Location", "Missing"].indexOf(fixedData.AssetCurrentStatus) > -1 ? 'red' : 'blue');
					$('#' + ids[i])[0].innerHTML = common.dateTime(fixedData.LatestScanTime, "") + " " + assetCurrentStatusValue;
					break;
				case "deviceSerial":
					if (fixedData.SmartDeviceSerialNumber === fixedData.GatewaySerialNumber) {
						$('#' + ids[i])[0].innerText = gridUtils.joinStrings(", ", fixedData.SmartDeviceSerialNumber);
					} else {
						$('#' + ids[i])[0].innerText = gridUtils.joinStrings(", ", fixedData.SmartDeviceSerialNumber, fixedData.GatewaySerialNumber);
					}
					break;
				case "doorCounts":
					$('#' + ids[i])[0].innerHTML =
						fixedData["Door_TodayCount"] + " <span class='lighter'>today</span>, " +
						fixedData["Door_7dayCount"] + " <span class='lighter'>7d</span>, " +
						fixedData["Door_30dayCount"] + " <span class='lighter'>30d</span>";
					break;
				case "powerOnHrs":
					$('#' + ids[i])[0].innerHTML =
						(!isNaN(fixedData["PowerOnHrs_TodayCount"]) ? fixedData["PowerOnHrs_TodayCount"].toFixed(2) : fixedData["PowerOnHrs_TodayCount"]) + " <span class='lighter'>today</span>, " +
						(!isNaN(fixedData["PowerOnHrs_7dayCount"]) ? fixedData["PowerOnHrs_7dayCount"].toFixed(2) : fixedData["PowerOnHrs_7dayCount"]) + " <span class='lighter'>7d</span>, " +
						(!isNaN(fixedData["PowerOnHrs_30dayCount"]) ? fixedData["PowerOnHrs_30dayCount"].toFixed(2) : fixedData["PowerOnHrs_30dayCount"]) + " <span class='lighter'>30d</span>";
					break;
				case "compressorStart":
					$('#' + ids[i])[0].innerHTML =
						fixedData["CompressorStart_TodayCount"] + " <span class='lighter'>today</span>, " +
						fixedData["CompressorStart_7dayCount"] + " <span class='lighter'>7d</span>, " +
						fixedData["CompressorStart_30dayCount"] + " <span class='lighter'>30d</span>";
					break;
				case "compressorRunHrs":
					$('#' + ids[i])[0].innerHTML =
						(!isNaN(fixedData["CompressorRunHrs_TodayCount"]) ? fixedData["CompressorRunHrs_TodayCount"].toFixed(2) : fixedData["CompressorRunHrs_TodayCount"]) + " <span class='lighter'>today</span>, " +
						(!isNaN(fixedData["CompressorRunHrs_7dayCount"]) ? fixedData["CompressorRunHrs_7dayCount"].toFixed(2) : fixedData["CompressorRunHrs_7dayCount"]) + " <span class='lighter'>7d</span>, " +
						(!isNaN(fixedData["CompressorRunHrs_30dayCount"]) ? fixedData["CompressorRunHrs_30dayCount"].toFixed(2) : fixedData["CompressorRunHrs_30dayCount"]) + " <span class='lighter'>30d</span>";
					break;
				case "fanStart":
					$('#' + ids[i])[0].innerHTML =
						fixedData["FanStart_TodayCount"] + " <span class='lighter'>today</span>, " +
						fixedData["FanStart_7dayCount"] + " <span class='lighter'>7d</span>, " +
						fixedData["FanStart_30dayCount"] + " <span class='lighter'>30d</span>";
					break;
				case "fanRunHrs":
					$('#' + ids[i])[0].innerHTML =
						fixedData["FanRunHrs_TodayCount"] + " <span class='lighter'>today</span>, " +
						fixedData["FanRunHrs_7dayCount"] + " <span class='lighter'>7d</span>, " +
						fixedData["FanRunHrs_30dayCount"] + " <span class='lighter'>30d</span>";
					break;
				default:
					$('#' + ids[i])[0].innerText = fixedData[ids[i]];
					break;
			}
		}

	}

	if (selectedAsset) {
		$('#title').html(selectedAsset.SerialNumber + ' - ' + selectedAsset.AssetType);
		$('#storeName').html('<i class="fa-fw fa fa-home"></i>' + selectedAsset.Location + "-" + selectedAsset.LocationCode);
		$('#storeName').data("LocationCode", selectedAsset.LocationCode);
	}

	var responsiveHelper_dt_Alert = undefined;
	var responsiveHelper_dt_ImberaAlert = undefined;
	var responsiveHelper_dt_Visit = undefined;
	var responsiveHelper_dt_TechnicalDiagnostics = undefined;
	var responsiveHelper_dt_Health = undefined;
	var responsiveHelper_dt_Movement = undefined;
	var responsiveHelper_dt_Door = undefined;
	var responsiveHelper_dt_Ping = undefined;
	var responsiveHelper_dt_GPS = undefined;
	var responsiveHelper_dt_AssetPlanogram = undefined;
	var responsiveHelper_dt_AssetPurity = undefined;

	var breakpointDefinition = {
		tablet: 1024,
		phone: 480
	};

	var baseParams = {
		AssetId: assetId
	};

	gpsGridParams = {
		AssetId: assetId,
		//MovementTypeId: 78,
		Latitude: 0,
		Latitude_operator: "!="
	};
	var movementGridParams = {
		AssetId: assetId,
		//MovementTypeId: 78,
		//MovementTypeId_operator: "!=",
		SumOfMovementDuration: 4,
		SumOfMovementDuration_operator: ">"
	};
	var visitGridParams = {
		AssetId: assetId,
		VisitId: -1,
		VisitId_operator: "!="
	};

	$("#assetGPSStatusCheck").click(function () {
		var gpsTable = $('#gpsGrid').DataTable();
		if (this.checked) {
			delete gpsGridParams.Latitude_operator;
			delete gpsGridParams.Latitude;
		} else {
			gpsGridParams.Latitude_operator = "!=";
			gpsGridParams.Latitude = 0;
		}
		var url = 'smartDeviceMovement/list?' + $.param(gpsGridParams);
		gpsTable.ajax.url(url).load();
	});

	var oTable = $('#alertGrid')
		.dataTable({
			ajax: {
				url: coolerDashboard.common.nodeUrl('alert/list', baseParams),
				method: 'POST',
				data: function (data, settings) {
					data.ClosedOn = '0001-01-01T00:00:00';
					data["openAlert"] = true;
					return data;
				}
			},
			order: [
				[3, "asc"]
			],
			processing: true,
			serverSide: true,
			columns: [{
				data: 'AlertTypeId',
				render: renderers.alertTypeIcon,
				"className": 'alert-icons',
				"orderable": false,
				width: 80
			}, {
				data: 'AlertType'
			}, {
				data: 'AlertText'
			}, {
				data: 'Status'
			}, {
				data: 'AlertAt',
				render: coolerDashboard.common.dateTime
			}, {
				data: 'ClosedOn',
				render: coolerDashboard.common.dateTime
			}, {
				data: 'AlertAge',
				render: renderers.alertAge
			}],
			"sDom": "" + "t" + "<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
			"autoWidth": true,
			"preDrawCallback": function () {
				// Initialize the responsive datatables helper once.
				if (!responsiveHelper_dt_Alert) {
					responsiveHelper_dt_Alert = new ResponsiveDatatablesHelper($('#alertGrid'), breakpointDefinition);
				}
			},
			"rowCallback": function (nRow) {
				responsiveHelper_dt_Alert.createExpandIcon(nRow);
			},
			"drawCallback": function (oSettings) {
				responsiveHelper_dt_Alert.respond();
			}

		});

	var oTable = $('#imberaAlertGrid')
		.dataTable({
			ajax: {
				url: coolerDashboard.common.nodeUrl('imberaAlert/list', baseParams),
				method: 'POST',
				data: function (data, settings) {
					if (!$('#assetImberaAlertStatusCheck')[0].checked) {
						data.IsAlertOpen = 'true';
					}
					return data;
				}
			},
			order: [
				[3, "asc"]
			],
			processing: true,
			serverSide: true,
			columns: [{
				data: 'AlarmType',
				orderable: false
			}, {
				data: 'StartEventTime',
				render: coolerDashboard.common.dateTime
			}, {
				data: 'EndEventTime',
				render: function (data, type, row) {
					var dateTime = data != '0001-01-01T00:00:00' ? data : row.AssetPingDateTime && row.AssetPingDateTime != '0001-01-01T00:00:00' ? row.AssetPingDateTime : moment.utc().format(coolerDashboard.dateTimeFormat);
					return coolerDashboard.common.dateTime(dateTime);
				}
			}, {
				data: 'Duration',
				render: renderers.alertAgeImbera
			}],
			"sDom": "" + "t" + "<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
			"autoWidth": true,
			"preDrawCallback": function () {
				// Initialize the responsive datatables helper once.
				if (!responsiveHelper_dt_ImberaAlert) {
					responsiveHelper_dt_ImberaAlert = new ResponsiveDatatablesHelper($('#imberaAlertGrid'), breakpointDefinition);
				}
			},
			"rowCallback": function (nRow) {
				responsiveHelper_dt_ImberaAlert.createExpandIcon(nRow);
			},
			"drawCallback": function (oSettings) {
				responsiveHelper_dt_ImberaAlert.respond();
			}

		});

	var oTable = $('#visitGrid')
		.dataTable({
			ajax: {
				url: coolerDashboard.common.nodeUrl('assetVisitHistory/list', visitGridParams),
				method: 'POST'
			},
			order: [
				[0, "desc"]
			],
			processing: true,
			serverSide: true,
			columns: [{
				data: 'VisitDateTime',
				render: function (data, type, row) {
					return coolerDashboard.common.dateTime(row.Visit_Start_Time);

				}
			}, {
				data: 'VisitBy'
			}, {
				data: 'Visit_Start_Time',
				render: function (data, type, row) {
					return coolerDashboard.common.dateDiff(coolerDashboard.common.parseDate(row.VisitDateTime), coolerDashboard.common.parseDate(row.Visit_Start_Time))
				}
			}, {
				data: 'Status',
				render: function (data, type, row) {
					if (!data) {
						return;
					}
					var status = coolerDashboard.common.createBlock(data, !!data, ["Wrong Location", "Missing"].indexOf(data) > -1 ? 'red' : 'blue');
					return status;
				}
			}, {
				data: 'Notes'
			}, {
				data: 'Latitude',
				className: 'dt-body-right',
				render: function (v) {
					return v ? v.toFixed(5) : "-";
				}
			}, {
				data: 'Longitude',
				className: 'dt-body-right',
				render: function (v) {
					return v ? v.toFixed(5) : "-";
				}
			}, {
				data: 'Distance',
				width: 160,
				"orderable": false,
				render: function (data, type, row) {
					return data && !isNaN(data) && data !== "" ? data.toFixed(2) + " KM" : "";
				}
			}],
			"sDom": "" + "t" + "<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
			"autoWidth": true,
			"preDrawCallback": function () {
				// Initialize the responsive datatables helper once.
				if (!responsiveHelper_dt_Visit) {
					responsiveHelper_dt_Visit = new ResponsiveDatatablesHelper($('#visitGrid'), breakpointDefinition);
				}
			},
			"rowCallback": function (nRow) {
				responsiveHelper_dt_Visit.createExpandIcon(nRow);
			},
			"drawCallback": function (oSettings) {
				responsiveHelper_dt_Visit.respond();
			}

		});

	var healthTable = $('#techGrid')
		.dataTable({
			ajax: {
				url: coolerDashboard.common.nodeUrl('technicalDiagnostics/list', baseParams),
				method: 'POST'
			},
			order: [
				[0, "desc"]
			],
			processing: true,
			serverSide: true,
			select: true,
			columns: [{
					data: 'EventDate',
					render: function (data, type, row) {
						return coolerDashboard.common.dateWithFormat(data, '-', 'date')
					},
					width: 60
					// "orderable": false
				}, {
					data: 'MinCompressorTempratureForDay',
					width: 60,
					className: 'dt-body-right text-right',
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					"orderable": false
				}, {
					data: 'MaxCompressorTempratureForDay',
					width: 60,
					className: 'dt-body-right text-right',
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					"orderable": false
				}, {
					data: 'MedianCompressorTempratureForDay',
					width: 60,
					className: 'dt-body-right text-right',
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					"orderable": false
				},
				{
					data: 'MinEvaporatorTempratureForDay',
					width: 60,
					className: 'dt-body-right text-right',
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					"orderable": false
				}, {
					data: 'MaxEvaporatorTempratureForDay',
					width: 60,
					className: 'dt-body-right text-right',
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					"orderable": false
				},
				{
					data: 'MedianEvaporatorTempratureForDay',
					width: 60,
					className: 'dt-body-right text-right',
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					"orderable": false
				},
				{
					data: 'MinAmbientTempratureForDay',
					width: 60,
					className: 'dt-body-right text-right',
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					"orderable": false
				}, {
					data: 'MaxAmbientTempratureForDay',
					width: 60,
					className: 'dt-body-right text-right',
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					"orderable": false
				},
				{
					data: 'MedianAmbientTempratureForDay',
					width: 60,
					className: 'dt-body-right text-right',
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					"orderable": false
				},
				{
					data: 'CompressorStart',
					width: 60,
					className: 'dt-body-right text-right',
					"orderable": false
				},
				{
					data: 'CompressorRunHours',
					width: 60,
					className: 'dt-body-right text-right',
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					"orderable": false
				},
				{
					data: 'EvaporatorFanStart',
					width: 60,
					className: 'dt-body-right text-right',
					"orderable": false
				},
				{
					data: 'EvaporatorFanRunHours',
					width: 60,
					className: 'dt-body-right text-right',
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					"orderable": false
				},
				{
					data: 'HeaterStart',
					width: 60,
					className: 'dt-body-right text-right',
					"orderable": false
				},
				{
					data: 'HeaterRunHours',
					width: 60,
					className: 'dt-body-right text-right',
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					"orderable": false
				},
				{
					data: 'LightStart',
					width: 60,
					className: 'dt-body-right text-right',
					"orderable": false
				},
				{
					data: 'LightRunHours',
					width: 60,
					className: 'dt-body-right text-right',
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					"orderable": false
				}
			],
			"sDom": "" + "t" + "<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
			"autoWidth": true,
			"preDrawCallback": function () {
				// Initialize the responsive datatables helper once.
				if (!responsiveHelper_dt_TechnicalDiagnostics) {
					responsiveHelper_dt_TechnicalDiagnostics = new ResponsiveDatatablesHelper($('#techGrid'), breakpointDefinition);
				}
			},
			"rowCallback": function (nRow) {
				responsiveHelper_dt_TechnicalDiagnostics.createExpandIcon(nRow);
			},
			"drawCallback": function (oSettings) {
				responsiveHelper_dt_TechnicalDiagnostics.respond();
			}
		});



	var healthTable = $('#healthGrid')
		.dataTable({
			ajax: {
				url: coolerDashboard.common.nodeUrl('smartDeviceHealth/list', baseParams),
				method: 'POST'
			},
			order: [
				[0, "desc"]
			],
			processing: true,
			serverSide: true,
			select: true,
			columns: [{
					data: 'EventDate',
					render: function (data, type, row) {
						return coolerDashboard.common.dateWithFormat(data, '-', 'date')
					},
					width: 60
				}, {
					data: 'MinTempratureForDay',
					width: 60,
					className: 'dt-body-right text-right',
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					"orderable": false
				}, {
					data: 'MaxTempratureForDay',
					width: 60,
					className: 'dt-body-right text-right',
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					"orderable": false
				}, {
					data: 'MedianTempratureForDay',
					width: 60,
					className: 'dt-body-right text-right',
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					"orderable": false
				}, {
					data: 'LightOnHours',
					width: 60,
					className: 'dt-body-right text-right',
					"orderable": false
				}, {
					data: 'DoorCount',
					width: 60,
					className: 'dt-body-right text-right',
					"orderable": false
				},
				{
					data: 'MinCompressorTempratureForDay',
					width: 60,
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					className: 'dt-body-right text-right',
					"orderable": false
				}, {
					data: 'MaxCompressorTempratureForDay',
					width: 60,
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					className: 'dt-body-right text-right',
					"orderable": false
				}, {
					data: 'MedianCompressorTempratureForDay',
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					className: 'dt-body-right text-right',
					width: 60,
					"orderable": false
				},
				{
					data: 'MinEvaporatorTempratureForDay',
					width: 60,
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					className: 'dt-body-right text-right',
					"orderable": false
				}, {
					data: 'MaxEvaporatorTempratureForDay',
					className: 'dt-body-right text-right',
					width: 60,
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					"orderable": false
				}, {
					data: 'MedianEvaporatorTempratureForDay',
					width: 60,
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					className: 'dt-body-right text-right',
					"orderable": false
				},
				{
					data: 'MinAmbientTempratureForDay',
					width: 60,
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					className: 'dt-body-right text-right',
					"orderable": false
				}, {
					data: 'MaxAmbientTempratureForDay',
					width: 60,
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					className: 'dt-body-right text-right',
					"orderable": false
				},
				{
					data: 'MedianAmbientTempratureForDay',
					width: 60,
					className: 'dt-body-right text-right',
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					"orderable": false
				},
				{
					data: 'CompressorStart',
					width: 60,
					className: 'dt-body-right text-right',
					"orderable": false
				},
				{
					data: 'CompressorRunHours',
					width: 60,
					className: 'dt-body-right text-right',
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					"orderable": false
				},
				{
					data: 'EvaporatorFanStart',
					width: 60,
					className: 'dt-body-right text-right',
					"orderable": false
				},

				{
					data: 'EvaporatorFanRunHours',
					width: 60,
					className: 'dt-body-right text-right',
					render: function (data, type, full) {
						return parseFloat(data).toFixed(2);
					},
					"orderable": false
				}
			],
			"sDom": "" + "t" + "<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
			"autoWidth": true,
			"preDrawCallback": function () {
				// Initialize the responsive datatables helper once.
				if (!responsiveHelper_dt_Health) {
					responsiveHelper_dt_Health = new ResponsiveDatatablesHelper($('#healthGrid'), breakpointDefinition);
				}
			},
			"rowCallback": function (nRow) {
				responsiveHelper_dt_Health.createExpandIcon(nRow);
			},
			"drawCallback": function (oSettings) {
				responsiveHelper_dt_Health.respond();
			}

		});

	var movementTable = $('#movementGrid')
		.dataTable({
			ajax: {
				url: coolerDashboard.common.nodeUrl('smartDeviceMovement/list', movementGridParams),
				data: function (data, settings) {
					//data.MovementTypeId = [170, 171, 82];
					return data;
				},
				method: 'POST'
			},
			order: [
				[0, "desc"]
			],
			processing: true,
			serverSide: true,
			select: true,
			columns: [{
				data: 'EventDate',
				render: coolerDashboard.common.dateTime
			}, {
				data: 'GatewaySerialNumber',
				orderable: false
			}, {
				data: 'MovementTypeId',
				render: coolerDashboard.renderers.movementType
			}, {
				data: 'SumOfMovementDuration',
				width: 60,
				className: 'dt-body-right',
			}],
			"sDom": "" + "t" + "<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
			"autoWidth": true,
			"preDrawCallback": function () {
				// Initialize the responsive datatables helper once.
				if (!responsiveHelper_dt_Movement) {
					responsiveHelper_dt_Movement = new ResponsiveDatatablesHelper($('#movementGrid'), breakpointDefinition);
				}
			},
			"rowCallback": function (nRow) {
				responsiveHelper_dt_Movement.createExpandIcon(nRow);
			},
			"drawCallback": function (oSettings) {
				responsiveHelper_dt_Movement.respond();
			}

		});

	var gpsTable = $('#gpsGrid')
		.dataTable({
			ajax: {
				url: coolerDashboard.common.nodeUrl('smartDeviceMovement/list', gpsGridParams),
				method: 'POST'
			},
			order: [
				[0, "desc"]
			],
			processing: true,
			serverSide: true,
			select: true,
			columns: [{
					data: 'EventDate',
					render: coolerDashboard.common.dateTime
				}, {
					data: 'GatewaySerialNumber',
					orderable: false
				}, {
					data: 'DisplacementInKm',
					width: 60,
					render: function (data, type, row) {
						return !isNaN(data) && data !== "" ? data.toFixed(2) + " KM" : "N/A";
					},
					className: 'dt-body-right',
				}, {
					data: 'Latitude',
					render: renderers.geo,
					className: 'inline-link',
					"orderable": false
				},
				{
					data: 'LocationCode'
				}
			],
			"sDom": "" + "t" + "<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
			"autoWidth": true,
			"preDrawCallback": function () {
				// Initialize the responsive datatables helper once.
				if (!responsiveHelper_dt_GPS) {
					responsiveHelper_dt_GPS = new ResponsiveDatatablesHelper($('#gpsGrid'), breakpointDefinition);
				}
			},
			"rowCallback": function (nRow) {
				responsiveHelper_dt_GPS.createExpandIcon(nRow);
			},
			"drawCallback": function (oSettings) {
				responsiveHelper_dt_GPS.respond();
			}

		});

	var doorTable = $('#doorGrid')
		.dataTable({
			ajax: {
				url: coolerDashboard.common.nodeUrl('smartDeviceDoor/list', baseParams),
				method: 'POST'
			},
			order: [
				[0, "desc"]
			],
			processing: true,
			serverSide: true,
			select: true,
			columns: [{
					data: 'EventDate',
					render: function (data, type, row) {
						return coolerDashboard.common.dateWithFormat(data, '-', 'date')
					}
				}, {
					data: 'TotalDoorOpen',
					className: 'dt-body-right text-right',
					"orderable": false
				},
				//  {
				// 	data: 'AssetCapacity',
				// 	className: 'dt-body-right',
				// 	"orderable": false
				// },
				{
					data: 'DoorDurationLessThen10',
					className: 'dt-body-right text-right',
					"orderable": false
				}, {
					data: 'DoorDurationBW10AND60',
					className: 'dt-body-right text-right',
					"orderable": false
				}, {
					data: 'DoorDurationBW60AND300',
					className: 'dt-body-right text-right',
					"orderable": false
				}, {
					data: 'DoorDurationMoreThen300',
					className: 'dt-body-right text-right',
					"orderable": false
				}
			],
			"sDom": "" + "t" + "<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
			"autoWidth": true,
			"preDrawCallback": function () {
				// Initialize the responsive datatables helper once.
				if (!responsiveHelper_dt_Door) {
					responsiveHelper_dt_Door = new ResponsiveDatatablesHelper($('#doorGrid'), breakpointDefinition);
				}
			},
			"rowCallback": function (nRow) {
				responsiveHelper_dt_Door.createExpandIcon(nRow);
			},
			"drawCallback": function (oSettings) {
				responsiveHelper_dt_Door.respond();
			}

		});

	$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
		var target = $(e.target).attr("href") // activated tab
		var text = $('#assetDetailScreenTabPanel').children().find('a[href= ' + target + ']').prop('innerText');
		$(".breadcrumb").html("<li> Detailed view </li><li>" + text + "</li>");
	});

	var planogramTable = $('#assetPlanogramGrid')
		.dataTable({
			ajax: {
				url: coolerDashboard.common.nodeUrl('assetPurityDayWise/list?AssetId=' + assetId + '', {
					forAsset: true
				}),
				method: 'POST',
				dataSrc: function (json) {
					var toReturn = [];

					if (json.data && json.data[0]) {
						toReturn = json.data[0].AssetDetails[0].PurityDetails;
					}

					return toReturn;
				}
			},
			processing: true,
			serverSide: true,
			columns: [{
				"className": 'details-control',
				"orderable": false,
				"data": '',
				"defaultContent": '',
				width: 15,
				visible: false
			}, {
				data: 'PurityDateTime',
				"orderable": false,
				render: function (data, type, row) {
					return coolerDashboard.common.dateWithFormat(data, '-', 'date')
				}
			}, {
				data: 'RelogramFacingSKU',
				"orderable": false,
				render: function (data, type, row) {
					if (row.PlanogramFacings != 0) {
						var EmptyFacingColor = row.RelogramFacingSKU < 15 ? "#00964C" : "red";
						return "<div><span class='ProductsCountText' style='background:" + EmptyFacingColor + "'>" + row.RelogramFacingSKU + " /  " + row.PlanogramFacings + "</span></div>";
					} else {
						return 'N/A';
					}
				},
				width: 100
			}, {
				data: 'TotalSkuOOS',
				"orderable": false,
				width: 90
			}, {
				data: 'TotalSSDProductsSKU',
				"orderable": false,
				width: 100,
				render: function (data, type, row) {
					return data || row["isPurityAvailable"] ? data : 'N/A';
				}
			}, {
				data: 'TotalNCBProductsSKU',
				"orderable": false,
				width: 100,
				render: function (data, type, row) {
					return data || row["isPurityAvailable"] ? data : 'N/A';
				}
			}, {
				data: 'TotalSSDProducts',
				"orderable": false,
				width: 100
			}, {
				data: 'TotalNCBProducts',
				"orderable": false,
				width: 100
			}, {
				data: 'Coca-cola-Facings',
				"orderable": false,
				render: function (data, type, row) {
					var records = row["Coca-cola-Facings"];
					var cocaColaFacingsPercentage = (row.CocaColaFacings * 100) / (row.PlanogramFacings);
					if (row.PlanogramFacings != 0) {
						return "<div><span class='ProductsCountText' style='background: #00964C'>" + row.CocaColaFacings + " /  " + cocaColaFacingsPercentage.toFixed(0) + "%</span></div>";
					} else {
						return '';
					}
				}
			}, {
				data: 'TotalForiegnFacing',
				render: function (data, type, row) {
					var foriegnFacingsPercentage = (row.ForeignProduct * 100) / (row.PlanogramFacings);
					var foriegnFacingColor = foriegnFacingsPercentage == 0 ? "#00964C" : foriegnFacingsPercentage >= 50 ? "orange" : "red";
					if (row.PlanogramFacings != 0) {
						return "<div><span class='ProductsCountText' style='background:" + foriegnFacingColor + "'>" + row.ForeignProduct + " /  " + foriegnFacingsPercentage.toFixed(0) + "%</span></div>";
					} else {
						return '';
					}
				},
				orderable: false

			}, {
				data: 'EmptyFacing',
				width: 150,
				render: function (data, type, row) {
					if (row.PlanogramFacings != 0) {
						var emptyFacingsPercentage = (row.EmptyFacings * 100) / (row.PlanogramFacings);
						var EmptyFacingColor = emptyFacingsPercentage == 0 ? "#00964C" : emptyFacingsPercentage >= 50 ? "orange" : "red";
						return "<div><span class='ProductsCountText' style='background:" + EmptyFacingColor + "'>" + row.EmptyFacings + " /  " + emptyFacingsPercentage.toFixed(0) + "%</span></div>";
					} else {
						return '';
					}
				},
				orderable: false
			}, {
				data: 'NumberOfComplaintFacing',
				width: 170,
				"orderable": false,
				render: function (data, type, row) {
					var complaintFacingPercentage = (row.NonCompliantFacingCount * 100) / (row.PlanogramFacings);
					var color = complaintFacingPercentage == 0 ? "#00964C" : complaintFacingPercentage >= 50 ? "orange" : "red";
					if (row.PlanogramFacings != 0) {
						return "<div><span class='ProductsCountText' style='background:" + color + "'>" + row.NonCompliantFacingCount + " /  " + complaintFacingPercentage.toFixed(0) + "%</span></div>";
					} else {
						return '';
					}
				}
			}, {
				data: 'PurityPercentage',
				"orderable": false,
				width: 90,
				render: function (data, type, row) {
					if (row.PlanogramFacings != 0) {
						return row.PurityPercentage;
					} else {
						return 0;
					}
				}
			}],
			"sDom": "" + "t" + "<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
			"autoWidth": true,
			"preDrawCallback": function () {
				// Initialize the responsive datatables helper once.
				if (!responsiveHelper_dt_AssetPlanogram) {
					responsiveHelper_dt_AssetPlanogram = new ResponsiveDatatablesHelper($('#assetPlanogramGrid'), breakpointDefinition);
				}
			},
			"rowCallback": function (nRow) {
				responsiveHelper_dt_AssetPlanogram.createExpandIcon(nRow);
			},
			"drawCallback": function (oSettings) {
				responsiveHelper_dt_AssetPlanogram.respond();
			}

		});

	gridUtils.addChildGridHandler({
		gridId: '#assetPlanogramGrid',
		renderer: function (d) {
			return gridUtils.createDetailTableForPlanogram({
				items: [{
					label: '',
					value: d
				}]
			});
		}
	});

	var planogramTable = $('#purityGrid')
		.dataTable({
			ajax: {
				url: coolerDashboard.common.nodeUrl('assetPurity/list', baseParams),
				method: 'POST'
			},
			processing: true,
			serverSide: true,
			columns: [{
				data: 'Date',
				"orderable": false,
				render: function (data, type, row) {
					return coolerDashboard.common.dateWithFormat(data, '-', 'date')
				},
				width: 40,
			}, {
				data: '',
				"orderable": false,
				render: coolerDashboard.common.purityImageRenderer
			}],
			"sDom": "" + "t" + "<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
			"autoWidth": true,
			"preDrawCallback": function () {
				// Initialize the responsive datatables helper once.
				if (!responsiveHelper_dt_AssetPurity) {
					responsiveHelper_dt_AssetPurity = new ResponsiveDatatablesHelper($('#purityGrid'), breakpointDefinition);
				}
			},
			"rowCallback": function (nRow) {
				responsiveHelper_dt_AssetPurity.createExpandIcon(nRow);
			},
			"drawCallback": function (oSettings) {
				responsiveHelper_dt_AssetPurity.respond();
			}

		});


	var start = moment().subtract(7, 'days');
	var end = moment();


	function cb(start, end) {
		$('#reportrange span').html(start.format(coolerDashboard.dateFormat) + ' - ' + end.format(coolerDashboard.dateFormat));
		startDate = start;
		endDate = end;
		loadChart({
			'startDate': startDate.format('YYYY-MM-DD[T00:00:00]'),
			'endDate': endDate.format('YYYY-MM-DD[T23:59:59]'),
			'assetId': assetId,
			'interval': "day"
		});
	}

	$('#reportrangeAsset').daterangepicker({
		startDate: start,
		endDate: end,
		changeYear: true,
		"autoApply": false,
		"maxDate": moment(),
		"showDropdowns": true,
		"showISOWeekNumbers": true,
		ranges: {
			'Today': [moment(), moment()],
			'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
			'Last 7 Days': [moment().subtract(6, 'days'), moment()],
			'Last 30 Days': [moment().subtract(29, 'days'), moment()],
			'Last 90 Days': [moment().subtract(89, 'days'), moment()],
			'This Month': [moment().startOf('month'), moment().endOf('month')],
			'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
		}
	}, cb);
	cb(start, end);

	$.ajax({
		url: coolerDashboard.common.nodeUrl('assetChart'),
		method: 'POST',
		data: {
			'startDate': moment().startOf('day').format('YYYY-MM-DD[T00:00:00]'),
			'assetId': assetId,
			'interval': "hour"
		},
		success: function (data, request) {
			var record = data.buckets;
			var length = record.length;
			var temperature = [];
			var light = [];
			var door = [];
			var doorCount = 0;

			for (var i = 0; i < length; i++) {

				temperature.push(Number(record[i].avgTemperature ? record[i].avgTemperature.toFixed(2) : 0));
				light.push(Number(record[i].avgLight ? record[i].avgLight.toFixed(2) : 0));
				door.push(record[i].doorRecords);
				doorCount += record[i].doorRecords;
			}
			if (length == 0) {
				for (var i = 0; i < 24; i++) {
					temperature.push(0);
					light.push(0);
					door.push(0);
				}
			}
			$('#doorAsset').sparkline(door, {
				type: 'bar',
				tooltipFormat: '{{value}} Door Opens at {{offset}}:00 hrs'
			});
			$('#temperatureAsset').sparkline(temperature, {
				type: 'line',
				fillColor: 'transparent',
				height: '33px',
				tooltipFormat: 'Temp {{y}} at {{x}}:00 hrs',
				width: "70px"
			});
			$('#lightAsset').sparkline(light, {
				type: 'line',
				fillColor: 'transparent',
				tooltipFormat: 'Light {{y}} at {{x}}:00 hrs',
				height: '33px',
				width: "70px"
			});
			$('#currentDoorCount')[0].innerHTML = doorCount;
		},
		failure: function (response, opts) {}
	});

	$("#movementApply").click(function (event) {
		event.preventDefault();
		var myForm = $("#movementForm");
		var data = myForm.serializeArray();
		var startDate, endDate;
		var length = data.length;
		var key = '';
		var value = 0;
		for (var i = 0; i < length; i++) {
			key = data[i].name;
			value = data[i].value;
			switch (key) {
				case 'movementFrom':
					startDate = moment(value);
					break;
				case 'movementTo':
					endDate = moment(value);
					break;
				default:
					break;
			}
		}
		if (startDate.isValid() && endDate.isValid()) {
			var assetData = selectedAsset;
			var assetId = assetData.Id;
			var assetLatitude = assetData.LocationGeo.lat;
			var assetLongitude = assetData.LocationGeo.lon;
			movementFilter = {
				'startDate': startDate.format(),
				'endDate': endDate.format(),
				'assetId': assetId,
				'assetLatitude': assetLatitude,
				'assetLongitude': assetLongitude
			};
			movementMapAjax(movementFilter);
		} else {
			$.bigBox({
				title: 'Message',
				content: 'Select "Movement From" and "Movement To".',
				color: "#C46A69",
				icon: "fa fa-warning shake animated",
				//number: '',
				timeout: 7000
			});
			initialize(selectedAsset);
		}
	});
	$("#assetalertStatusCheck").click(function () {
		var alertTable = $('#alertGrid').DataTable();
		var url = alertTable.ajax.url();
		alertTable.ajax.url(url).load();
	});
	$("#assetImberaAlertStatusCheck").click(function () {
		var imberaAlertTable = $('#imberaAlertGrid').DataTable();
		var url = imberaAlertTable.ajax.url();
		imberaAlertTable.ajax.url(url).load();
	});

	$('#gpsGrid').on('click', 'tbody td.inline-link', function (e) {
		var dt = gpsTable.DataTable();
		var rowIndex = dt.row(this)[0][0];
		if (rowIndex < 0) {
			return;
		}
		var data = dt.data();
		var rowData = data[rowIndex];
		var assetId = rowData.Id;
		var startDate = moment(rowData.StartTime);
		var endDate = startDate;
		if (startDate.isValid() && endDate.isValid()) {
			var assetId = rowData.AssetId;
			var assetLatitude = rowData.Latitude;
			var assetLongitude = rowData.Longitude;
			movementFilter = {
				'startDate': startDate.format(),
				'endDate': endDate.format(),
				'assetId': assetId,
				'assetLatitude': assetLatitude,
				'assetLongitude': assetLongitude
			};
			gpsGridSelected = true;
			movementMapAjax(movementFilter);
		}
		//window.location.hash = 'assetDetails/' + assetId;
	});
}

function getAssetData() {

	$('#liVisitAsset').addClass('hidden');
	// if (coolerDashboard.common.hasPermission('DashboardVisit')) {
	// 	$('#liVisitAsset').removeClass('hidden');
	// }

	var hash = window.location.hash;
	var serialNumber = hash.split('/')[1];
	var assetFilter = {
		'start': 0,
		'limit': 10,
		'search_SerialNumber': serialNumber
	};

	$(".inline-link-assetDetail").click(function () {
		var locationCode = $('#storeName').data('LocationCode');
		locationCode = locationCode.toLowerCase();
		//window.location.hash = 'outletDetails/' + locationCode;
		window.open(window.location.pathname + '#outletDetails/' + locationCode);
	});

	$.ajax({
		url: coolerDashboard.common.nodeUrl('asset/list', assetFilter),
		type: 'GET',
		success: function (result, data) {
			if (result.data.length > 0) {
				var hash = window.location.hash;
				var assetData = result.data[0];
				var serialNumber = hash.split('/')[1];
				for (var i = 0; i < result.data.length; i++) {
					var assetDetail = result.data[i];
					if (assetDetail.SerialNumber.toLowerCase() == serialNumber) {
						assetData = result.data[i];
					}
				}
				onAssetData(assetData);
			}
		},
		failure: function () {
			alert('Error: Some error occured. Please try later.');
		}
	});

	$('#movementFrom').datepicker({
		dateFormat: 'yy-mm-dd',
		prevText: '<i class="fa fa-chevron-left"></i>',
		nextText: '<i class="fa fa-chevron-right"></i>',
		onSelect: function (selectedDate) {
			$('#movementTo').datepicker('option', 'minDate', selectedDate);
		}
	});

	$('#movementTo').datepicker({
		dateFormat: 'yy-mm-dd',
		prevText: '<i class="fa fa-chevron-left"></i>',
		nextText: '<i class="fa fa-chevron-right"></i>',
		onSelect: function (selectedDate) {
			$('#movementFrom').datepicker('option', 'maxDate', selectedDate);
		}
	});
}
getAssetData();