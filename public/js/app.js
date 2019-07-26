String.format = function () {
	var s = arguments[0];
	for (var i = 0; i < arguments.length - 1; i++) {
		var reg = new RegExp("\\{" + i + "\\}", "gm");
		s = s.replace(reg, arguments[i + 1]);
	}

	return s;
}

function loadItems(hash) {
	window.location.hash = hash;
};


function VarifySSoRedirection() {

	if (window.location.hostname == "cch-dashboard.ebest-iot.com") {
		window.location.href =
			"https://sso.cchellenic.com/adfs/ls/?wa=wsignin1.0&wtrealm=https://cch-dashboard.ebest-iot.com/login1";
	} else if (window.location.hostname == "dashboard-qa.ebest-iot.com") {
		window.location.href =
			"https://sso.cchellenic.com/adfs/ls/?wa=wsignin1.0&wtrealm=https://cch-dashboard-qa.ebest-iot.com/login1"
	} else {
		if (!LZString.decompressFromUTF16(localStorage.data)) {
			window.location.href = "login.html";
		} else {
			if (!LZString.decompressFromUTF16(localStorage.lastUrl)) {
				window.location.href = "default.html#CoolerPerformance";
			} else {
				window.location.href = "default.html" + LZString.decompressFromUTF16(localStorage.lastUrl);
			}

		}
	}
};


function isSSOEnabled() {


	if (window.location.hostname == "cch-dashboard.ebest-iot.com") {
		if (localStorage.SSO == "true") {
			window.location.href =
				"https://sso.cchellenic.com/adfs/ls/?wa=wsignin1.0&wtrealm=https://cch-dashboard.ebest-iot.com/login1";
		} else {
			$('#coockieUser').html(getCookie("username"));

			if (getCookie("username") != "") {
				$('#myModalSession').modal('show');
			} else {
				onLogout('login.html');
			}

		}

	} else {
		$('#myModalSession').modal('show');
	}

};


function onLogout(href) {
	saveUserDetails(JSON.parse(LZString.decompressFromUTF16(localStorage.data)), '', 'Logout');
	if (localStorage.SSO == "true") {
		localStorage.clear();
		var cookies = document.cookie.split(";");

		for (var i = 0; i < cookies.length; i++) {
			var cookie = cookies[i];
			var eqPos = cookie.indexOf("=");
			var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
			document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
		}
		window.location.href = "https://sso.cchellenic.com/adfs/ls/?wa=wsignout1.0";
		//window.href = "https://sso.cchellenic.com/adfs/ls/?wa=wsignout1.0";
	} else {
		localStorage.clear();
		$.ajax({
			url: coolerDashboard.common.nodeUrl("logout"),
			type: 'POST',
			success: function (result) {
				window.location.href = href;
				//localStorage.clear();
			},
			failure: function () {}
		});
	}
};


function setup_widgets_desktop_extended() {

	$('#widget-grid').jarvisWidgets({

		grid: 'article',
		widgets: '.jarviswidget',
		localStorage: LZString.compressToUTF16(localStorageJarvisWidgets),
		deleteSettingsKey: '#deletesettingskey-options',
		settingsKeyLabel: 'Reset settings?',
		deletePositionKey: '#deletepositionkey-options',
		positionKeyLabel: 'Reset position?',
		sortable: sortableJarvisWidgets,
		buttonsHidden: false,
		// toggle button
		toggleButton: true,
		toggleClass: 'fa fa-minus | fa fa-plus',
		toggleSpeed: 200,
		onToggle: function () {},
		// delete btn
		// deleteButton: true,
		// deleteMsg: 'Warning: This action cannot be undone!',
		// deleteClass: 'fa fa-times',
		// deleteSpeed: 200,
		// onDelete: function () {},
		// edit btn
		// editButton: true,
		// editPlaceholder: '.jarviswidget-editbox',
		// editClass: 'fa fa-cog | fa fa-save',
		// editSpeed: 200,
		// onEdit: function () {},
		// color button
		// colorButton: true,
		// full screen
		fullscreenButton: true,
		fullscreenClass: 'fa fa-expand | fa fa-compress',
		fullscreenDiff: 3,
		onFullscreen: function (event) {
			if ($(this).attr('data-original-title') == "Fullscreen") {
				$(this).attr('data-original-title', 'Exit Fullscreen');
			} else {
				$(this).attr('data-original-title', 'Fullscreen');
			}

			setTimeout(function () {
				fireRefreshEventOnWindow();
			}, 20);
		},
		// custom btn
		// customButton: false,
		// customClass: 'folder-10 | next-10',
		// customStart: function () {
		//     alert('Hello you, this is a custom button...');
		// },
		// customEnd: function () {
		//     alert('bye, till next time...');
		// },
		// order
		buttonOrder: '%refresh% %custom% %edit% %toggle% %fullscreen% %delete%',
		opacity: 1.0,
		dragHandle: '> header',
		placeholderClass: 'jarviswidget-placeholder',
		indicator: true,
		indicatorTime: 600,
		ajax: true,
		timestampPlaceholder: '.jarviswidget-timestamp',
		timestampFormat: 'Last update: %m%/%d%/%y% %h%:%i%:%s%',
		refreshButton: true,
		refreshButtonClass: 'fa fa-refresh',
		labelError: 'Sorry but there was a error:',
		labelUpdated: 'Last Update:',
		labelRefresh: 'Refresh',
		labelDelete: 'Delete widget:',
		afterLoad: function () {},
		rtl: false, // best not to toggle this!
		onChange: function () {

		},
		onSave: function () {

		},
		ajaxnav: $.navAsAjax // declears how the localstorage should be saved (HTML or AJAX Version)

	});

}

var fireRefreshEventOnWindow = function () {
	var evt = document.createEvent("HTMLEvents");
	evt.initEvent('resize', true, false);
	window.dispatchEvent(evt);
};

$(function () {

	$(function () {
		if (localStorage.getItem('data')) {
			$("#username_menu").html(JSON.parse(LZString.decompressFromUTF16(localStorage.getItem('data'))));
		}
		$("#copyRight").html('Copyright © ' + new Date().getFullYear() + ' Insigma Inc. All rights reserved.');

	});

	$(window).on('load', function () {
		// On every hash change the render function is called with the new hash.
		// This is how the navigation of our app happens.
		render(decodeURI(window.location.hash));
	});
	$(window).on('hashchange', function () {
		// On every hash change the render function is called with the new hash.
		// This is how the navigation of our app happens.
		render(decodeURI(window.location.hash));
	});

	function querySt(Key) {
		var url = window.location.href;
		KeysValues = url.split(/[\?&]+/);
		for (i = 0; i < KeysValues.length; i++) {
			KeyValue = KeysValues[i].split("=");
			if (KeyValue[0] == Key) {
				return KeyValue[1];
			}
		}
	}

	function render(url) {

		IsPerferencePageChange = true; //variable assign to check perference page change or not
		if (checklogintime == true) {
			IsPerferencePageChange = false;
		}
		checklogintime = false;
		var user = querySt('ssouser');
		// if (!localStorage.getItem('redirectUrl')) {
		// 	localStorage.setItem('redirectUrl', window.location.hash);
		// }
		if (user && user.length > 0) {
			//var userName = getCookie("username"); //$.cookie("userName");
			var userdata = document.cookie;
			var params = {
				username: user,
				//password: $("#password").val(),
				encrypt: true
			}
			$.post('/validuser', params).done(function (data) {

				if (data.success) {
					//$('#myModalSession').modal('hide');
					setCookie("username", userName, 1);
					delete localStorage.comboData;
					delete localStorage.comboDataVisit;
					delete localStorage.defaultPreference;
					localStorage.setItem('data', LZString.compressToUTF16(JSON.stringify(data)));
					localStorage.setItem('SSO', true);
					var showDashboardMenu = false;
					var showDashboardDetailedViewMenu = false;
					var showDashboardVisitReport = false;
					//location.reload();
					var redirectlink = LZString.decompressFromUTF16(localStorage.getItem('redirectUrl'));
					if (redirectlink && redirectlink != '#') {
						history.replaceState({}, document.title, ".");
						localStorage.lastUrl = LZString.compressToUTF16('default.html' + redirectlink);
						// LZString.decompressFromUTF16(localStorage.lastUrl) = 'default.html' + redirectlink;
						window.location.href = 'default.html' + redirectlink;
					} else {
						window.location.href = 'default.html#Commercial';
					}
				} else {
					alert('Email address/Username or Password is incorrect.');
				}
			}).fail(function (data) {
				alert('Oops! some server error occured. Please try again.');
			});
		} else if (url && !LZString.decompressFromUTF16(localStorage.data)) {
			//onLogout('index.html');
			if (!LZString.decompressFromUTF16(localStorage.getItem('redirectUrl')) && url.indexOf('LocationMap#salesHierarchy') == -1 && url.indexOf('irsignup') == -1 && url.indexOf('outletDetailsIR') == -1) {
				localStorage.setItem('redirectUrl', LZString.compressToUTF16(window.location.hash));
				// $.cookie("previousUrl", window.location.href, {
				// 	path: "/"
				// });
				//document.cookie = "previousUrl=" + window.location.href;
			}

		}
		// This function decides what type of page to show 
		// depending on the current url hash value.

		// Get the keyword from the url.
		if (url.indexOf('irsignup') > 0) {
			var temp = 'irsignup';
		} else {
			var temp = url.split('/')[0];
			temp = temp.split('#')[1];
		}

		var screenList = [
			//{ hashName: 'containers', view: 'views/CommercialChart.html' },
			// { hashName: 'Commercial', view: 'views/Commercial.html', module: 'DashboardCommercial'},
			{
				hashName: 'CustomerDashboard',
				view: 'views/CustomerDashboard.html',
				module: 'DashboardCustomerTier'
			},
			// { hashName: 'SalesRepVisit', view: 'views/SalesRepVisitDashboard.html', module: 'DashboardSalesVisit' },
			{
				hashName: 'Alarm',
				view: 'views/AlarmDashboard.html',
				module: 'DashboardAlarms'
			},
			//{ hashName: 'Technical', view: 'views/TechnicalService.html' },
			{
				hashName: 'SalesCorrelation',
				view: 'views/Operational.html',
				module: 'DashboardSalesCorrelation'
			},
			//for coolertarcking screen
			{
				hashName: 'CoolerTracking',
				view: 'views/CoolerTracking.html',
				module: 'DashboardCoolerTracking'
			},
			{
				hashName: 'CoolerTelemetryView',
				view: 'views/CoolerTelemetryView.html',
				module: 'DashboardCoolerTelemetry'
			},
			{
				hashName: 'Report',
				view: 'views/Report.html',
				module: 'DashboardReport'
			},
			{
				hashName: 'FallenMagnet',
				view: 'views/FallenMagnet.html',
				module: 'DashboardFallenMagnet'
			},
			{
				hashName: 'Survey',
				view: 'views/containerpage.html',
				module: 'DashboardSurvey'
			},
			//{ hashName: 'dashboardMain', view: 'views/Dashboard.html' },
			{
				hashName: 'location',
				view: 'views/Location.html',
				module: 'DashboardDetailedView'
			},
			{
				hashName: 'assetDetails',
				view: 'views/AssetDetails.html',
				module: 'DashboardDetailedView'
			},
			//{ hashName: 'IOTChart', view: 'views/IOTChart.html' },
			{
				hashName: 'Visit',
				view: 'views/Visit.html',
				module: 'DashboardVisitReport'
			},
			{
				hashName: 'filter',
				view: 'views/common/Filter.html'
			},
			{
				hashName: 'TradeChannel',
				view: 'views/TradeChannel.html',
				module: 'DashboardTradeChannel'
			},
			{
				hashName: 'outletDetails',
				view: 'views/OutletDetail.html',
				module: 'DashboardDetailedView'
			},
			{
				hashName: 'purity',
				view: 'views/purity.html',
				module: 'DashboardDetailedView'
			},
			{
				hashName: 'Alert',
				view: 'views/AlertDashboard.html',
				module: 'DashboardAlerts'
			},
			{
				hashName: 'PlanogramAnalysis',
				view: 'views/Purity.html',
				module: 'PlanogramAnalysis'
			},
			{
				hashName: 'CoolerPerformance',
				view: 'views/CoolerPerformance.html',
				module: 'DashboardCommercial'
			},
			{
				hashName: 'Operational',
				view: 'views/Operational.html',
				module: 'DashboardCommercial'
			},
			{
				hashName: 'NoDataFound',
				view: 'views/ErrorNoData.html'
				//module: 'DashboardCommercial'
			},
			{
				hashName: 'WelcomePage',
				view: 'views/WelcomePage.html',
				module: 'DashboardWelcome'
			},
			{
				hashName: 'InfoGuide',
				view: 'views/InfoGuide.html',
				module: 'DashboardInfo'
			},
			{
				hashName: 'irsignup',
				view: 'views/IRSignup.html',
				module: 'DashboardIRSignup'
			},
			{
				hashName: 'OutletIRStatus',
				view: 'views/OutletIRStatus.html',
				module: 'DashboardOutletIRStatus'
			},
			{
				hashName: 'outletDetailsIR',
				view: 'views/OutletDetailsIR.html',
				module: 'DashboardOutletDetailsIR'
			},
			{
				hashName: 'NoAccess',
				view: 'views/NoAccess.html',
				module: 'DashboardNoAccess'
			},
			{
				hashName: 'Blank',
				view: 'blank.html'
			}
		];
		// Hide whatever page is currently shown.
		var view;
		for (var i = 0; len = screenList.length, i < len; i++) {
			if ((screenList[i].hashName) == temp) {
				if (coolerDashboard.common.hasPermission(screenList[i].module)) {
					view = screenList[i].view;
				} else if (screenList[i].hashName == "NoDataFound") {
					view = screenList[i].view;
				} else {
					if (LZString.decompressFromUTF16(localStorage.data)) {
						window.location.hash = 'NoAccess';
					} else {
						if (window.location.hostname == "cch-dashboard.ebest-iot.com") {
							window.location.href =
								"https://sso.cchellenic.com/adfs/ls/?wa=wsignin1.0&wtrealm=https://cch-dashboard.ebest-iot.com/login1";
						} else if (window.location.hostname == "cch-dashboard-qa.ebest-iot.com") {
							window.location.href =
								"https://sso.cchellenic.com/adfs/ls/?wa=wsignin1.0&wtrealm=https://cch-dashboard-qa.ebest-iot.com/login1";
						} else {
							$('#myModalSession2').modal('show');
							setTimeout(function () {
								$('#email1').focus();
							}, 1000);
						}

					}
				}
				break;
			}
		}
		if (view && view.length > 0) {
			$('nav a').parents('li, ul').removeClass('active');
			$('nav a').parents('li, ul').parents('li, ul').removeClass('active');
			$('nav a[href= "' + url.split('/')[0] + '"]').parent('li , ul').addClass('active');
			$('nav a[href= "' + url.split('/')[0] + '"]').parent('li , ul').parent('li , ul').parent('li , ul').addClass('active');
			$('nav a[href= "' + url.split('/')[0] + '"]').parent('li').parent('ul').css({
				"display": "block"
			});
			$("#main").load(view);
		}

		if (url.indexOf('irsignup') > -1 || url.indexOf('outletDetailsIR') > -1) {
			setCookie("IrSSO", url, 1);
		}
		if (url.indexOf('LocationMap#salesHierarchy') == -1 && url.indexOf('irsignup') == -1 && url.indexOf('outletDetailsIR') == -1) {
			localStorage.lastUrl = LZString.compressToUTF16(url);
		}
	}

});

function setCookie(cname, cvalue, exdays) {
	var d = new Date();
	//d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
	d.setTime(d.getTime() + (60 * 60 * 1000));
	var expires = "expires=" + d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

function redirectIRSignup() {
	var hashUrl = window.location.hash;
	var IRlocationCode = hashUrl.split('/')[1];
	window.open('#outletDetails/' + IRlocationCode + '/irsignup/');
}

function saveUserDetails(userDetail, userName, actionType) {
	var userId = 0;
	var firstName = '';
	var lastName = '';
	var role = '';
	var isLoggedIn = 'LoginFailed';
	if (userDetail && userDetail.success) {
		role = userDetail.data && userDetail.data.roles && userDetail.data.roles.length > 0 && userDetail.data.roles[0].Role ? userDetail.data.roles[0].Role : '';
		userId = userDetail.data.user.UserId;
		firstName = userDetail.data.tags.FirstName;
		lastName = userDetail.data.tags.LastName;
		isLoggedIn = 'Success';
		userName = userName ? userName : userDetail.data.tags.UserName;
	} else {
		firstName = userName;
	}

	var params = {
		UserId: userId,
		FirstName: firstName,
		LastName: lastName,
		Role: role,
		IsLoggedIn: isLoggedIn,
		ActionType: actionType,
		UserName: userName
	}
	$.ajax({
		url: coolerDashboard.common.nodeUrl('saveUserDetails'),
		type: 'POST',
		data: params,
		success: function () {},
		failure: function (response, opts) {
			coolerDashboard.gridUtils.ajaxIndicatorStop();
		},
		scope: this
	});

}