
$("#filterFormKPI").load('views/common/filter.html');

function sendAjax(firstLoad) {
	$.ajax({
		url: './js/ajax/coolerStatus.json',
		failure: function (response, opts) {
		},
		scope: this
	});
}