var responsiveHelper_dt_basic = undefined;
var breakpointDefinition = {
    tablet: 1024,
    phone: 480
};

var loginUserDetails = JSON.parse(LZString.decompressFromUTF16(localStorage.data));
var userName = loginUserDetails.data.tags.UserName;
var userId = loginUserDetails.data.user.UserId;
var params = {
    userId: userId
}

$('#IRStatusGrid thead tr td').each(function () {
    var title = $(this).text();
    if (title != "") {
        $(this).html('<input type="text" class="form-control" placeholder="Search ' + title.replace(/\s/g, '') + '" />');
        attachFilterListener(this.id);
    }
});

$('#IRStatusGrid')
    .dataTable({
        ajax: {
            url: coolerDashboard.common.nodeUrl('getIRStatus', params),
            method: 'POST',
            data: function (data, settings) {
                var searchFilters = $(".filterable");
                for (var i = 0, len = searchFilters.length; i < len; i++) {
                    var searchElement = searchFilters[i];
                    if (searchElement.dataset.grid == "IRStatusGrid") {
                        var value = $(searchElement.childNodes[0]).val();
                        if (value) {
                            data['search_' + searchElement.dataset.column] = value;
                        }
                    }
                }
            }
        },
        order: [2, "DESC"],
        "columnDefs": [{
            "orderable": false,
            "targets": 0
        }],
        processing: true,
        serverSide: true,
        "deferLoading": 0,
        select: true,
        columns: [{
            "className": '',
            "orderable": false,
            "data": null,
            "defaultContent": '',
            width: 10
        }, {
            data: 'Name',
            "orderable": true
        }, {
            data: 'Code',
            "orderable": true
        }, {
            data: 'Status',
            "orderable": false,
            render: function (data, type, row) {
                if (row.PrimaryEmail) {
                    return 'Onboarded'
                } else {
                    return 'Not Onboarded'
                }

            }
        }, {
            data: 'PrimaryEmail',
            "orderable": false,
        }],
        "sScrollX": true,
        "sDom": "" + "t" +
            "<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
        "autoWidth": true,
        "preDrawCallback": function () {
            // Initialize the responsive datatables helper once.
            if (!responsiveHelper_dt_basic) {
                responsiveHelper_dt_basic = new ResponsiveDatatablesHelper($(
                    '#IRStatusGrid'), breakpointDefinition);
            }
            $('#outletDetailsSpin').spin(coolerDashboard.common.smallSpin);
        },
        "rowCallback": function (nRow) {
            responsiveHelper_dt_basic.createExpandIcon(nRow);
        },
        "drawCallback": function (oSettings) {
            responsiveHelper_dt_basic.respond();
        },
        "fnDrawCallback": function (oSettings) {
            $('#outletDetailsSpin').spin(false);
        }
    });

function attachFilterListener(elementId) {
    $('#' + elementId + ' input').typeWatch({
        captureLength: 1,
        callback: function (value) {
            var parentElement = this.parentElement;
            var grid = parentElement.dataset.grid;
            $('#' + grid).DataTable().ajax.reload();
        }
    });
}

getIRStatusDetail();

function getIRStatusDetail() {
    $("#IRStatusGrid").DataTable().ajax.reload();
    coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');

    coolerDashboard.gridUtils.ajaxIndicatorStop();
}