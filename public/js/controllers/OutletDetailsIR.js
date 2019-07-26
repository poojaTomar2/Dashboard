var responsiveHelper_dt_basic = undefined;
var breakpointDefinition = {
    tablet: 1024,
    phone: 480
};
var rdCustomerId;
var currentUrl = window.location.href;
var hash = window.location.hash;
var locationCode = hash.split('/')[1];

var today = new Date();
var year = today.getFullYear();
var month = today.getMonth();
var endMonth = today.getMonth() + 1;
var currentDate = today.getDate();

if (currentDate <= 14) {
    var firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    var lastDay = new Date(year + '/' + endMonth + '/' + 14);
} else {
    var firstDay = new Date(year + '/' + endMonth + '/' + 15);
    var lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
}

var showDateFormat = moment(firstDay).format('DD MMM, YYYY') + '-' + moment(lastDay).format('DD MMM, YYYY')
$('.timeFilterNameIR')[0].innerHTML = showDateFormat;
var startDate = moment(firstDay).format('YYYY-MM-DD[T00:00:00]');
var endDate = moment(lastDay).format('YYYY-MM-DD[T23:59:59]');

var outletIRFilter = {
    'locationCode': locationCode,
    'startDate': startDate,
    'endDate': endDate,
    'ClientId': JSON.parse(LZString.decompressFromUTF16(localStorage.data)).data.tags.ClientId
};
var gridUtils = coolerDashboard.gridUtils;

if (currentUrl.indexOf('LocationMap#salesHierarchy') > 0) {
    $('#bodyId').addClass('no-menu');
    $("#userInfo").remove();
} else if (currentUrl.indexOf('irsignup') > 0 || currentUrl.indexOf('outletDetailsIR') > 0) {
    $('#bodyId').addClass('no-menu');
} else {
    $('#bodyId').removeClass('no-menu');
}

gridUtils.addChildGridHandlerForIR({
    gridId: '#outletInfoGrid',
    renderer: function (d) {
        return gridUtils.createDetailTableForIRAsset({
            items: [{
                label: 'Address',
                value: ''
            }]
        });
    }
});

// $(document).on('click', 'td span', function () {

//     var spanId = $(this).attr('id');
//     var assetPurityId = spanId.substr(spanId.indexOf('-') + 1);
//     var gridFilterAssetPurityData = {
//         'AssetPurityId': assetPurityId,
//         'rdCustomerId': rdCustomerId
//     }
//     var IdReplace = spanId.replace(/spanId/g, '');
//     var IdHide = IdReplace.split('-');
//     var tdId = '#rowClass' + IdHide[0];
//     $('#rowClass' + IdHide[0]).toggleClass("hidden");

//     // if ($('#' + spanId).hasClass('glyphicon glyphicon-plus greenColorPlus')) {
//     //     $('#' + spanId).removeClass('glyphicon glyphicon-plus greenColorPlus');
//     //     $('#' + spanId).addClass('glyphicon glyphicon-minus redColorMinus');
//     // } else {
//     //     $('#' + spanId).removeClass('glyphicon glyphicon-minus redColorMinus');
//     //     $('#' + spanId).addClass('glyphicon glyphicon-plus greenColorPlus');
//     // }

//     coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
//     $.ajax({
//         url: coolerDashboard.common.nodeUrl('getAssetPurityIRInfo', gridFilterAssetPurityData),
//         type: 'GET',
//         success: function (result, data) {
//             result = result.data.summary;
//             // createGridForAseetPurityImages(result, tdId);
//             createModalPopupForAvailableProducts(result.assetPurityAvailableProduts);
//             createModalPopupForMissingProducts(result.assetPurityMissingProducts);
//             coolerDashboard.gridUtils.ajaxIndicatorStop();
//         },
//         failure: function () {
//             console.log('Error: Some error occured. Please try later.');
//             coolerDashboard.gridUtils.ajaxIndicatorStop();
//         }
//     });

// });

$('#outletInfoGrid').on('click', 'td.details-control', function () {
    var className = document.getElementsByClassName("selected shown")[0] || document.getElementsByClassName("odd shown")[0];
    if (className && rdCustomerId) {
        coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
        var table = $('#outletInfoGrid').DataTable();
        var dt = outletInfoGridTable.DataTable();
        var rowIndex = dt.row(this)[0][0];
        if (rowIndex < 0) {
            return;
        }
        var data = dt.data();
        var rowData = data[rowIndex];
        var assetId = rowData.AssetId;
        var gridFilterData = {
            'AssetId': assetId,
            'rdCustomerId': rdCustomerId,
            'startDate': startDate,
            'endDate': endDate
        }

        $.ajax({
            url: coolerDashboard.common.nodeUrl('getAssetIRInfo', gridFilterData),
            type: 'GET',
            success: function (result, data) {
                result = result.data.summary;
                if (result) {
                    gridUtils.addChildGridHandlerForIRExpand({
                        gridId: '#outletInfoGrid',
                        renderer: function (d) {
                            return gridUtils.createDetailTableForIRAsset({
                                items: [{
                                    label: 'Address',
                                    value: result
                                }]
                            });
                        }
                    });
                }

                coolerDashboard.gridUtils.ajaxIndicatorStop();
            },
            failure: function () {
                console.log('Error: Some error occured. Please try later.');
                coolerDashboard.gridUtils.ajaxIndicatorStop();
            }
        });
    }

});
// var locationGridCount;
var outletInfoGridTable = $('#outletInfoGrid')
    .dataTable({
        ajax: {
            url: coolerDashboard.common.nodeUrl('getOutletGridIRInfo', outletIRFilter),
            method: 'POST',
            data: function (data, settings) {
                // locationGridCount = 0;
            }
        },
        order: [
            [2, "asc"]
        ],
        processing: true,
        serverSide: true,
        "paging": false,
        "bFilter": false,
        "bInfo": false,
        "bSort": false,
        "deferLoading": 0,
        select: true,
        columns: [{
                "className": 'details-control',
                "orderable": false,
                "data": null,
                "defaultContent": '',
                width: 10
            }, {
                data: 'AssetType',
                "orderable": false,
                render: function (data, type, row) {
                    return row.AssetType ? row.AssetType : 'N/A';
                }
            }, {
                data: 'SerialNumber',
                "orderable": false,
                "className": 'alert-icons alert-icons-location',
                render: function (data, type, row) {
                    return row.SerialNumber ? row.SerialNumber : 'N/A';
                }
            }, {
                data: 'TechnicalIdentificationNumber',
                "orderable": false,
                render: function (data, type, row) {
                    return row.TechnicalIdentificationNumber ? row.TechnicalIdentificationNumber : 'N/A';
                }
            }, {
                data: 'NumberOfProduct',
                "orderable": false,
                render: function (data, type, row) {
                    return row.NumberOfProduct ? row.NumberOfProduct : 'N/A';
                }
            }, {
                data: 'CoolerType',
                "orderable": false,
                render: function (data, type, row) {
                    return row.CoolerType ? row.CoolerType : 'N/A';
                }
            },
            {
                data: 'TotalEarnedMoney',
                "orderable": false,
                render: function (data, type, row) {
                    return '€ ' + row.TotalEarnedMoney + ' / € ' + row.TotalMoney;
                }
            }, {
                data: 'AssortmentEarnedMoney',
                "orderable": false,
                render: function (data, type, row) {
                    return '€ ' + row.AssortmentEarnedMoney + ' / € ' + row.AssortmentTotalMoney;
                }
            }, {
                data: 'OccupancyEarnedMoney',
                "orderable": false,
                render: function (data, type, row) {
                    return '€ ' + row.OccupancyEarnedMoney + ' / € ' + row.OccupancyTotalMoney;
                }
            }
        ],
        // "sScrollX": true,
        "sDom": "" + "t" +
            "<'dt-toolbar-footer'<'col-sm-12 col-lg-4 col-xs-12 hidden-xs'i><'col-sm-6 col-lg-4 col-xs-6 hidden-xs well-sm'l><'col-xs-12 col-sm-6 col-lg-4'p>>",
        "autoWidth": true,
        "preDrawCallback": function () {
            // Initialize the responsive datatables helper once.
            if (!responsiveHelper_dt_basic) {
                responsiveHelper_dt_basic = new ResponsiveDatatablesHelper($('#outletInfoGrid'), breakpointDefinition);
            }
        },
        "rowCallback": function (nRow) {
            // locationGridCount = locationGridCount + 1;
            // if (locationGridCount == 1) {
            //     console.log(nRow);
            //     // coolerDashboard.gridUtils.ajaxIndicatorStop();
            // }
            responsiveHelper_dt_basic.createExpandIcon(nRow);
        },
        "drawCallback": function (oSettings) {
            // if (locationGridCount == 0 && oSettings.aoData.length == 0) {
            //     coolerDashboard.gridUtils.ajaxIndicatorStop();
            // }
            responsiveHelper_dt_basic.respond();
        }
    });

if (locationCode) {
    coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
    $.ajax({
        url: coolerDashboard.common.nodeUrl('getOutletRedirectionIRInfo', outletIRFilter),
        type: 'GET',
        success: function (result, data) {
            result = result.data;
            if (result == 'Out') {
                $.smallBox({
                    title: 'Session Expire',
                    content: 'Login In Again',
                    color: "#FF0000",
                    timeout: 3000
                });
                setTimeout(function () {
                    onLogout('login.html');
                }, 2000);
            } else {
                if (result.length > 0) {
                    if (result[0].AccountStatus == 4200) {
                        getIRResultForOutlet();
                        coolerDashboard.gridUtils.ajaxIndicatorStop();
                    } else {
                        coolerDashboard.gridUtils.ajaxIndicatorStop();
                        window.location.hash = 'outletDetails/' + locationCode + '/irsignup';
                    }
                } else {
                    coolerDashboard.gridUtils.ajaxIndicatorStop();
                    window.location.hash = 'outletDetails/' + locationCode + '/irsignup';
                }
            }
        },
        failure: function () {
            console.log('Error: Some error occured. Please try later.');
            coolerDashboard.gridUtils.ajaxIndicatorStop();
        }
    });
}

function getIRResultForOutlet() {
    coolerDashboard.gridUtils.ajaxIndicatorStart('Loading Data.. Please Wait..');
    $("#outletInfoGrid").DataTable().ajax.reload();

    $.ajax({
        url: coolerDashboard.common.nodeUrl('getOutletIRInfo', outletIRFilter),
        type: 'GET',
        success: function (result, data) {
            result = result.data.summary;
            var outletDetailsInfo = result && result.outletDetailsInfo && result.outletDetailsInfo[0] ? result.outletDetailsInfo[0] : [];
            var outletDetailsImageInfo = result && result.outletDetailsImageInfo && result.outletDetailsImageInfo ? result.outletDetailsImageInfo : [];
            var outletDetailsSubImageInfo = result && result.outletDetailsSubImageInfo && result.outletDetailsSubImageInfo ? result.outletDetailsSubImageInfo : [];
            var locationNameIR = outletDetailsInfo.LocationName ? outletDetailsInfo.LocationName : 'N/A';
            var locationCodeIR = outletDetailsInfo.LocationCode ? outletDetailsInfo.LocationCode : 'N/A';

            var locationTypeNameIR = outletDetailsInfo.LocationTypeName ? outletDetailsInfo.LocationTypeName : 'N/A';
            var locationTypeCodeIR = outletDetailsInfo.LocationTypeCode ? outletDetailsInfo.LocationTypeCode : 'N/A';
            var classificationNameIR = outletDetailsInfo.ClassificationName ? outletDetailsInfo.ClassificationName : 'N/A';
            var classificationCodeIR = outletDetailsInfo.ClassificationCode ? outletDetailsInfo.ClassificationCode : 'N/A';

            var subTradeChannelTypeNameIR = outletDetailsInfo.SubTradeChannelTypeName ? outletDetailsInfo.SubTradeChannelTypeName : 'N/A';

            $('#storeName').html('<i class="fa-fw fa fa-home"></i>' + locationNameIR + "-" + locationCodeIR);
            // $('#storeName').data("LocationCode", outletDetailsInfo.LocationCode);
            $('#Location')[0].innerText = locationNameIR;
            var addressIR = gridUtils.joinStrings(' ', outletDetailsInfo.Street, outletDetailsInfo.Street2, outletDetailsInfo.Street3, outletDetailsInfo.State, outletDetailsInfo.Country);
            $('#address')[0].innerText = addressIR ? addressIR : 'N/A';
            $('#locationType')[0].innerText = locationTypeNameIR + ' (' + locationTypeCodeIR + ')';
            $('#classification')[0].innerText = classificationNameIR + ' (' + classificationCodeIR + ')';
            $('#subTradeChannel')[0].innerText = outletDetailsInfo.SubTradeChannelTypeName ? outletDetailsInfo.SubTradeChannelTypeName : 'N/A';
            $('#cplName')[0].innerText = outletDetailsInfo.CPLName ? outletDetailsInfo.CPLName : 'N/A';
            var outletRDName = outletDetailsInfo.RDName ? outletDetailsInfo.RDName : 'N/A';
            var outletRDCode = outletDetailsInfo.RDCode ? outletDetailsInfo.RDCode : 'N/A';
            $('#rdName')[0].innerText = outletRDName + ' (' + outletRDCode + ')';
            $('#IsKeyLocation')[0].innerText = outletDetailsInfo.IsKeyLocation == 1 ? 'Yes' : 'No';
            $('#BestTotal')[0].innerText = '€ ' + outletDetailsInfo.BestTotalEarnedMoney + ' Out Of € ' + outletDetailsInfo.BestTotalMoney;
            $('#BestAssortment')[0].innerText = '€ ' + outletDetailsInfo.LocationBasedBestAssortmentEarnedMoney + ' Out Of € ' + outletDetailsInfo.AssortmentTotalMoney;
            $('#BestOccupancy')[0].innerText = '€ ' + outletDetailsInfo.LocationBasedBestOccupancyEarnedMoney + ' Out Of € ' + outletDetailsInfo.BestOccupancyTotalMoney;
            var coolerDetailPanel = $('#coolerDetailContainer')[0];
            coolerDetailPanel.innerHTML = locationCodeIR;
            rdCustomerId = outletDetailsInfo.RDCustomerId;
            createGridForImages(outletDetailsImageInfo);
            coolerDashboard.gridUtils.ajaxIndicatorStop();

        },
        failure: function () {
            console.log('Error: Some error occured. Please try later.');
            coolerDashboard.gridUtils.ajaxIndicatorStop();
        }
    });
}

function createGridForImages(records) {
    var recordLength = records.length;
    var rows = [];
    rows.push("<tr>");
    for (var i = 0; i < recordLength; i++) {
        var record = records[i];
        if (record) {
            if (record.DisplayValue == 'Gold') {
                var DisplayValue = 'G';
                var displayColorClass = 'goldCircle';
            } else if (record.DisplayValue == 'Silver') {
                var DisplayValue = 'S';
                var displayColorClass = 'silverCircle';
            } else {
                var DisplayValue = 'O';
                var displayColorClass = 'otherCircle';
            }
            var productImage = coolerDashboard.getUrl('/products/thumbnails/' + record.ProductId + '.png');
            var productImageDataNotAvailable = '/img/noimage.png';
            rows.push("<td><div id = 'topContainer'><div class=" + displayColorClass + ">" + DisplayValue + "</div><img src='" + productImage + "' onerror=this.src='" + productImageDataNotAvailable + "' style='width: auto; max-width:100px; height: auto; max-height:100px' /><div style='font-size: 12px;'>" + record.Product + "</div><div></td>");

            // rows.push("<td class=" + displayColorClass + ">" + DisplayValue + "</td>");
            // rows.push("<td class='ProductsImage'><img src='" + productImage + "' style='width: 35px; height: auto;'/></td>");
            // rows.push("<td style='font-size: 12px;'>" + record.Product + "</td>");

            // rows.push("<td>" + record.Product + "</td>");
            // rows.push("<td>" + record.DisplayValue + "</td>");
            // rows.push("<td></td>");
        }
    }
    rows.push("</tr>");
    if (rows.join('') == "<tr></tr>") {
        var imageData = '</br><div>No Data Is To Be Displayed</div>';
    } else {
        var imageData = '<table class="table table-striped table-hover table-condensed">' +
            // '<th>' +
            '<tr>' +
            // '<th>Targeted Portfolio</th>' +
            // '<th>Name</th>' +
            // '<th>DisplayValue</th>' +
            // '<th></th>' +
            '</tr>' +
            // '</th>' +
            '<tbody>' +
            rows.join('') +
            '</tbody>' +
            '</table>';
    }

    $('#outletDetailsImage')[0].innerHTML = imageData;
}

function createGridForAseetPurityImages(records, tdId) {
    var recordLength = records.length;
    var rows = [];
    rows.push("<tr>");
    for (var i = 0; i < recordLength; i++) {
        var record = records[i];
        if (record) {
            var skuCount = record.SKUCoun ? record.SKUCoun : 0;
            if (record.DisplayValue == 'Gold') {
                var DisplayValue = skuCount;
                var displayColorClass = 'goldCircle';
            } else if (record.DisplayValue == 'Silver') {
                var DisplayValue = skuCount;
                var displayColorClass = 'silverCircle';
            } else {
                var DisplayValue = skuCount;
                var displayColorClass = 'otherCircle';
            }
            var productImage = coolerDashboard.getUrl('/products/thumbnails/' + record.ProductId + '.png');
            rows.push("<td style='padding:10px !important'><div class=" + displayColorClass + ">" + DisplayValue + "</div><div class='ProductsImage'><div><img src='" + productImage + "' style='width: 35px; height: auto;' /><div style='font-size: 12px;'>" + record.Product + "</div></div></div></td>");
            // rows.push("<td>" + record.Product + "</td>");
            // rows.push("<td>" + record.DisplayValue + "</td>");
            // rows.push("<td></td>");
        }
    }
    rows.push("</tr>");
    if (rows.join('') == "") {
        var imageDataAssetPurity = '<div align="middle"><h6>No Data Is To Be Displayed<h6></div>';
    } else {
        var imageDataAssetPurity =
            // '<th>Images</th>' +
            '<tbody>' +
            rows.join('') +
            '</tbody>';

    }

    $(tdId)[0].innerHTML = imageDataAssetPurity;
}

function createModalPopupForAvailableProducts(records) {
    var recordLength = records.length;
    var rows = [];
    rows.push("<tr>");
    for (var i = 0; i < recordLength; i++) {
        var record = records[i];
        if (record) {
            var skuCount = record.SKUCount ? record.SKUCount : 0;
            if (record.DisplayValue == 'Gold') {
                var DisplayValue = skuCount;
                var displayColorClass = 'goldCircle';
            } else if (record.DisplayValue == 'Silver') {
                var DisplayValue = skuCount;
                var displayColorClass = 'silverCircle';
            } else {
                var DisplayValue = skuCount;
                var displayColorClass = 'otherCircle';
            }
            var productImage = coolerDashboard.getUrl('/products/thumbnails/' + record.ProductId + '.png');
            rows.push("<td style='padding:10px !important'><div class=" + displayColorClass + ">" + DisplayValue + "</div><div class='ProductsImage'><div><img src='" + productImage + "' style='width: 35px; height: auto;' /><div style='font-size: 12px;'>" + record.Product + "</div></div></div></td>");
        }
    }
    rows.push("</tr>");
    if (rows.join('') == "<tr></tr>") {
        var imageDataAssetPurity = '<div align="middle"><h6>No Data Is To Be Displayed<h6></div>';
    } else {
        var imageDataAssetPurity = '<table class="table table-striped table-hover table-condensed">' +
            '<tr>' +
            // '<th>Available Product</th>' +
            '</tr>' +
            '<tbody>' +
            rows.join('') +
            '</tbody>' +
            '</table>';
    }
    $('#myModalSessionIR').modal('show');
    $('#imageAvailableProducts')[0].innerHTML = imageDataAssetPurity;
}

function createModalPopupForMissingProducts(recordsData) {
    var recordLengthData = recordsData.length;
    var rowsData = [];
    rowsData.push("<tr>");
    for (var i = 0; i < recordLengthData; i++) {
        var recordData = recordsData[i];
        if (recordData) {
            var skuCount = recordData.SKUCount ? recordData.SKUCount : 0;
            if (recordData.DisplayValue == 'Gold') {
                var DisplayValue = skuCount;
                var displayColorClass = 'goldCircle';
            } else if (recordData.DisplayValue == 'Silver') {
                var DisplayValue = skuCount;
                var displayColorClass = 'silverCircle';
            } else {
                var DisplayValue = skuCount;
                var displayColorClass = 'otherCircle';
            }
            var productImageData = coolerDashboard.getUrl('/products/thumbnails/' + recordData.ProductId + '.png');
            rowsData.push("<td style='padding:10px !important'><div class=" + displayColorClass + ">" + DisplayValue + "</div><div class='ProductsImage'><div><img src='" + productImageData + "' style='width: 35px; height: auto;' /><div style='font-size: 12px;'>" + recordData.Product + "</div></div></div></td>");
        }
    }
    rowsData.push("</tr>");
    if (rowsData.join('') == "<tr></tr>") {
        var imageDataMissingProducts = '<div align="middle"><h6>No Data Is To Be Displayed<h6></div>';
    } else {
        var imageDataMissingProducts = '<table class="table table-striped table-hover table-condensed">' +
            '<tr>' +
            // '<th>Available Product</th>' +
            '</tr>' +
            '<tbody>' +
            rowsData.join('') +
            '</tbody>' +
            '</table>';
    }
    $('#imageMissingProducts')[0].innerHTML = imageDataMissingProducts;
}