"use strict";
var consts = require("./../consts");
var elasticClient = require('./../../models').elasticClient;
var moment = require('moment');
var idcontext;
class Reducer {

    constructor(config) {
        Object.assign(this, config);

        var filterProperties = this.filterProperties;
        for (var i = 0, len = filterProperties.length; i < len; i++) {
            var filterProperty = filterProperties[i];
            if (typeof filterProperty === 'string') {
                filterProperty = {
                    propertyName: filterProperty,
                    paramName: filterProperty
                };
                filterProperties[i] = filterProperty;
            }
        }
    }

    /* filterProperties */

    /* field */

    /* extraParams */

    listResultProcessor(field, resp, callBack, searchParams) {
        var ids = [],
            total = resp.hits.total,
            days = searchParams.days || searchParams.daysLight || searchParams.daysPower || searchParams.daysMovement || searchParams.daysDoor;
        // if (total > 0) {
        if (searchParams.customQuery) {
            var range = [];
            if (Array.isArray(searchParams.DoorCount)) {
                searchParams.DoorCount.forEach(function (ranges) {
                    var assetIds;
                    if (ranges.indexOf('*') >= 0) {
                        var rangeGte = Number(ranges.split('*')[0]);
                        var rangeLte = Number(ranges.split('*')[1]);
                        rangeGte = rangeGte * days;
                        rangeLte = rangeLte * days;
                        if (rangeLte && rangeGte) {
                            assetIds = resp.aggregations.AssetIds.buckets.filter(data => (data.DoorCount.value < rangeGte) && (data.DoorCount.value > rangeLte));
                        } else if (rangeLte) {
                            assetIds = resp.aggregations.AssetIds.buckets.filter(data => (data.DoorCount.value >= rangeLte));
                        } else if (rangeGte) {
                            assetIds = resp.aggregations.AssetIds.buckets.filter(data => (data.DoorCount.value <= rangeGte));
                        }
                    }
                    assetIds.forEach(function (asset) {
                        ids.push(asset.key);
                    });

                })
            } else if (searchParams.DoorCount) {
                var range = [];
                var assetIds;
                if (searchParams.DoorCount.indexOf('*') >= 0) {
                    var rangeGte = Number(searchParams.DoorCount.split('*')[0]);
                    var rangeLte = Number(searchParams.DoorCount.split('*')[1]);
                    rangeGte = rangeGte * days;
                    rangeLte = rangeLte * days;
                    if (rangeLte && rangeGte) {
                        assetIds = resp.aggregations.AssetIds.buckets.filter(data => (data.DoorCount.value < rangeGte) && (data.DoorCount.value > rangeLte));
                    } else if (rangeLte) {
                        assetIds = resp.aggregations.AssetIds.buckets.filter(data => (data.DoorCount.value >= rangeLte));
                    } else if (rangeGte) {
                        assetIds = resp.aggregations.AssetIds.buckets.filter(data => (data.DoorCount.value <= rangeGte));
                    }

                }

                assetIds.forEach(function (asset) {
                    ids.push(asset.key);
                });

            }
            if (Array.isArray(searchParams.TempBand)) {
                searchParams.TempBand.forEach(function (ranges) {
                    var assetIds;
                    if (ranges.indexOf('*') >= 0) {
                        range = Number(ranges.split('*')[0]);
                        range = 4 * 60 * days;
                        assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.HealthInterval.value >= range);
                    }
                    assetIds.forEach(function (asset) {
                        ids.push(asset.key);
                    });

                })
            } else if (searchParams.TempBand) {
                var range = [];
                var assetIds;
                if (searchParams.TempBand.indexOf('*') >= 0) {
                    range = 4 * 60 * days;
                    assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.HealthInterval.value >= range);
                }
                assetIds.forEach(function (asset) {
                    ids.push(asset.key);
                });

            }
            if (searchParams.LightStatus) {
                range = 4 * 60 * days;
                assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.HealthInterval.value >= range);
                assetIds.forEach(function (asset) {
                    ids.push(asset.key);
                });
            }
            if (Array.isArray(searchParams.PowerBand)) {
                searchParams.PowerBand.forEach(function (ranges) {
                    var assetIds;
                    range = Number(ranges);
                    range = range * 60 * days;
                    assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.PowerOffDuration.value >= range);
                    assetIds.forEach(function (asset) {
                        ids.push(asset.key);
                    });

                })
            } else if (searchParams.PowerBand) {
                var assetIds;
                range = Number(searchParams.PowerBand);
                range = range * 60 * 60 * days;
                assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.PowerOffDuration.value >= range);
                assetIds.forEach(function (asset) {
                    ids.push(asset.key);
                });

            }

            // Telemetry Temparature
            if (searchParams.TemperatureTele) {
                if (Array.isArray(searchParams.TemperatureTele)) {

                    searchParams.TemperatureTele.forEach(function (ranges) {
                        var assetIds = [];

                        if (ranges && ranges.length > 0) {

                            if (ranges == '2') {
                                assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.Temperature.value >= 0 && data.Temperature.value < 5);
                            } else if (ranges == '3') {
                                assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.Temperature.value >= 5 && data.Temperature.value < 10);
                            } else if (ranges == '4') {
                                assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.Temperature.value >= 10 && data.Temperature.value < 15);
                            } else if (ranges == '1') {
                                assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.Temperature.value < 0);
                            } else if (ranges == '5') {
                                assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.Temperature.value >= 15);
                            } else if (ranges == '6') {

                                if (searchParams.NoDataAssetIds) {
                                    searchParams.NoDataAssetIds.forEach(function (value) {
                                        var flag = resp.aggregations.AssetIds.buckets.filter(function (val) {
                                            return val.key == value
                                        });
                                        if (flag.length == 0) {
                                            assetIds.push(value);
                                        }
                                    });
                                }
                            }
                        }
                        assetIds.forEach(function (asset) {
                            ids.push(asset.key);
                        });

                    })
                } else if (searchParams.TemperatureTele) {
                    var range = [];
                    var assetIds = [];
                    var range = searchParams.TemperatureTele;

                    if (range && range.length > 0) {

                        if (range == '2') {
                            assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.Temperature.value >= 0 && data.Temperature.value < 5);
                        } else if (range == '3') {
                            assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.Temperature.value >= 5 && data.Temperature.value < 10);
                        } else if (range == '4') {
                            assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.Temperature.value >= 10 && data.Temperature.value < 15);
                        } else if (range == '1') {
                            assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.Temperature.value < 0);
                        } else if (range == '5') {
                            assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.Temperature.value >= 15);
                        } else if (range == '6') {

                            if (searchParams.NoDataAssetIds) {
                                searchParams.NoDataAssetIds.forEach(function (value) {
                                    var flag = resp.aggregations.AssetIds.buckets.filter(function (val) {
                                        return val.key == value
                                    });
                                    if (flag.length == 0) {
                                        ids.push(value);
                                    }
                                });
                            }
                        }

                    }
                    assetIds.forEach(function (asset) {
                        ids.push(asset.key);
                    });

                }
            }

            //fallen Magnet Chart
            if (searchParams.MagnetFallenChartCTF) {
                if (Array.isArray(searchParams.MagnetFallenChartCTF)) {
                    searchParams.MagnetFallenChartCTF.forEach(function (ranges) {
                        if (resp.aggregations) {
                            if (ranges == "1") {
                                resp.aggregations.FallenMagnet.top_tags.buckets.forEach(function (bucket) {
                                    if (bucket.top_hit.hits.hits[0]._source.FallenMaganet < 14) {
                                        ids.push(bucket.top_hit.hits.hits[0]._source.AssetId);
                                    }
                                });
                            }

                            if (ranges == "2") {
                                resp.aggregations.FallenMagnet.top_tags.buckets.forEach(function (bucket) {
                                    if (bucket.top_hit.hits.hits[0]._source.FallenMaganet >= 14) {
                                        ids.push(bucket.top_hit.hits.hits[0]._source.AssetId);
                                    }
                                });
                            }
                        }
                    })
                } else if (searchParams.MagnetFallenChartCTF) {
                    if (resp.aggregations) {
                        if (searchParams.MagnetFallenChartCTF == "1") {
                            resp.aggregations.FallenMagnet.top_tags.buckets.forEach(function (bucket) {
                                if (bucket.top_hit.hits.hits[0]._source.FallenMaganet < 14) {
                                    ids.push(bucket.top_hit.hits.hits[0]._source.AssetId);
                                }
                            });
                        }

                        if (searchParams.MagnetFallenChartCTF == "2") {
                            resp.aggregations.FallenMagnet.top_tags.buckets.forEach(function (bucket) {
                                if (bucket.top_hit.hits.hits[0]._source.FallenMaganet >= 14) {
                                    ids.push(bucket.top_hit.hits.hits[0]._source.AssetId);
                                }
                            });
                        }
                    }
                }
            }

            //fallen Magnet Spread
            if (searchParams.MagnetFallenSpreadCTF) {
                if (Array.isArray(searchParams.MagnetFallenSpreadCTF)) {
                    searchParams.MagnetFallenSpreadCTF.forEach(function (ranges) {
                        if (resp.aggregations) {
                            if (ranges == "1") {
                                resp.aggregations.FallenMagnetSpread.top_tags.buckets.forEach(function (bucket) {
                                    if (bucket.top_hit.hits.hits[0]._source.FallenMaganet >= 15 && bucket.top_hit.hits.hits[0]._source.FallenMaganet < 30) {
                                        ids.push(bucket.top_hit.hits.hits[0]._source.AssetId);
                                    }
                                });
                            }

                            if (ranges == "2") {
                                resp.aggregations.FallenMagnetSpread.top_tags.buckets.forEach(function (bucket) {
                                    if (bucket.top_hit.hits.hits[0]._source.FallenMaganet >= 30 && bucket.top_hit.hits.hits[0]._source.FallenMaganet < 60) {
                                        ids.push(bucket.top_hit.hits.hits[0]._source.AssetId);
                                    }
                                });
                            }

                            if (ranges == "3") {
                                resp.aggregations.FallenMagnetSpread.top_tags.buckets.forEach(function (bucket) {
                                    if (bucket.top_hit.hits.hits[0]._source.FallenMaganet >= 60 && bucket.top_hit.hits.hits[0]._source.FallenMaganet <= 90) {
                                        ids.push(bucket.top_hit.hits.hits[0]._source.AssetId);
                                    }
                                });
                            }
                        }
                    });
                } else if (searchParams.MagnetFallenSpreadCTF) {
                    if (resp.aggregations) {
                        if (searchParams.MagnetFallenSpreadCTF == "1") {
                            resp.aggregations.FallenMagnetSpread.top_tags.buckets.forEach(function (bucket) {
                                if (bucket.top_hit.hits.hits[0]._source.FallenMaganet >= 15 && bucket.top_hit.hits.hits[0]._source.FallenMaganet < 30) {
                                    ids.push(bucket.top_hit.hits.hits[0]._source.AssetId);
                                }
                            });
                        }

                        if (searchParams.MagnetFallenSpreadCTF == "2") {
                            resp.aggregations.FallenMagnetSpread.top_tags.buckets.forEach(function (bucket) {
                                if (bucket.top_hit.hits.hits[0]._source.FallenMaganet >= 30 && bucket.top_hit.hits.hits[0]._source.FallenMaganet < 60) {
                                    ids.push(bucket.top_hit.hits.hits[0]._source.AssetId);
                                }
                            });
                        }

                        if (searchParams.MagnetFallenSpreadCTF == "3") {
                            resp.aggregations.FallenMagnetSpread.top_tags.buckets.forEach(function (bucket) {
                                if (bucket.top_hit.hits.hits[0]._source.FallenMaganet >= 60 && bucket.top_hit.hits.hits[0]._source.FallenMaganet <= 90) {
                                    ids.push(bucket.top_hit.hits.hits[0]._source.AssetId);
                                }
                            });
                        }
                    }
                }
            }

            // Telemetry evaporator Temparature
            if (searchParams.EvaporatorTemperatureTele) {
                if (Array.isArray(searchParams.EvaporatorTemperatureTele)) {

                    searchParams.EvaporatorTemperatureTele.forEach(function (ranges) {
                        var assetIds = [];

                        if (ranges && ranges.length > 0) {

                            if (ranges == '2') {
                                assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.EvTemperature.value >= 0 && data.EvTemperature.value < 5);
                            } else if (ranges == '3') {
                                assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.EvTemperature.value >= 5 && data.EvTemperature.value < 10);
                            } else if (ranges == '4') {
                                assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.EvTemperature.value >= 10 && data.EvTemperature.value < 15);
                            } else if (ranges == '1') {
                                assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.EvTemperature.value < 0);
                            } else if (ranges == '5') {
                                assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.EvTemperature.value >= 15);
                            } else if (ranges == '6') {

                                if (searchParams.NoDataAssetIds) {
                                    searchParams.NoDataAssetIds.forEach(function (value) {
                                        var flag = resp.aggregations.AssetIds.buckets.filter(function (val) {
                                            return val.key == value
                                        });
                                        if (flag.length == 0) {
                                            assetIds.push(value);
                                        }
                                    });
                                }
                            }
                        }
                        assetIds.forEach(function (asset) {
                            ids.push(asset.key);
                        });

                    })
                } else if (searchParams.EvaporatorTemperatureTele) {
                    var range = [];
                    var assetIds = [];
                    var range = searchParams.EvaporatorTemperatureTele;

                    if (range && range.length > 0) {

                        if (range == '2') {
                            assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.EvTemperature.value >= 0 && data.EvTemperature.value < 5);
                        } else if (range == '3') {
                            assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.EvTemperature.value >= 5 && data.EvTemperature.value < 10);
                        } else if (range == '4') {
                            assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.EvTemperature.value >= 10 && data.EvTemperature.value < 15);
                        } else if (range == '1') {
                            assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.EvTemperature.value < 0);
                        } else if (range == '5') {
                            assetIds = resp.aggregations.AssetIds.buckets.filter(data => data.EvTemperature.value >= 15);
                        } else if (range == '6') {

                            if (searchParams.NoDataAssetIds) {
                                searchParams.NoDataAssetIds.forEach(function (value) {
                                    var flag = resp.aggregations.AssetIds.buckets.filter(function (val) {
                                        return val.key == value
                                    });
                                    if (flag.length == 0) {
                                        ids.push(value);
                                    }
                                });
                            }
                        }

                    }
                    assetIds.forEach(function (asset) {
                        ids.push(asset.key);
                    });

                }
            }

            // Telemetry LightStatus(smarttag)
            if (searchParams.DeviceLightStatus) {

                if (Array.isArray(searchParams.DeviceLightStatus)) {
                    searchParams.DeviceLightStatus.forEach(function (ranges) {
                        var range = ranges;
                        var noDataAssets = [];
                        if (range && range.length > 0) {
                            resp.aggregations.AssetBucket.top_tags.buckets.forEach(function (assetBucket) {
                                var light = assetBucket.top_hit.hits.hits[0]._source.IsLightOff;
                                if (light == true && range == 2) {
                                    ids.push(assetBucket.top_hit.hits.hits[0]._source.AssetId);
                                } else if (light == false && range == 1) {
                                    ids.push(assetBucket.top_hit.hits.hits[0]._source.AssetId);
                                } else if (range == "nodata") {
                                    noDataAssets.push(assetBucket.top_hit.hits.hits[0]._source.AssetId);
                                }
                            });

                            if (noDataAssets.length > 0) {
                                if (searchParams.NoDataAssetIds) {
                                    searchParams.NoDataAssetIds.forEach(function (value) {
                                        var flag = noDataAssets.filter(function (val) {
                                            return val == value
                                        });
                                        if (flag.length == 0) {
                                            ids.push(value);
                                        }
                                    });
                                }
                            }
                        }
                    });
                } else if (searchParams.DeviceLightStatus) {

                    var range = searchParams.DeviceLightStatus;
                    var noDataAssets = [];
                    if (range && range.length > 0) {
                        resp.aggregations.AssetBucket.top_tags.buckets.forEach(function (assetBucket) {
                            var light = assetBucket.top_hit.hits.hits[0]._source.IsLightOff;
                            if (light == true && range == 2) {
                                ids.push(assetBucket.top_hit.hits.hits[0]._source.AssetId);
                            } else if (light == false && range == 1) {
                                ids.push(assetBucket.top_hit.hits.hits[0]._source.AssetId);
                            } else if (range == "nodata") {
                                noDataAssets.push(assetBucket.top_hit.hits.hits[0]._source.AssetId);
                            }
                        });

                        if (noDataAssets.length > 0) {
                            if (searchParams.NoDataAssetIds) {
                                searchParams.NoDataAssetIds.forEach(function (value) {
                                    var flag = noDataAssets.filter(function (val) {
                                        return val == value
                                    });
                                    if (flag.length == 0) {
                                        ids.push(value);
                                    }
                                });
                            }
                        }
                    }
                }
            }

            // Telemetry DeviceDoorStatus 
            if (searchParams.DeviceDoorStatus) {
                var doorOpens;
                if (resp.aggregations) {
                    var noDataAssets = [];
                    resp.aggregations.assets.buckets.forEach(function (bucket) {
                        doorOpens = bucket.DoorCount.value;
                        if (Array.isArray(searchParams.DeviceDoorStatus)) {
                            searchParams.DeviceDoorStatus.forEach(function (DoorStatus) {
                                if (doorOpens <= 25 && DoorStatus == "1") {
                                    ids.push(bucket.key);
                                } else if (doorOpens >= 26 && doorOpens <= 50 && DoorStatus == "2") {
                                    ids.push(bucket.key);
                                } else if (doorOpens >= 51 && doorOpens <= 75 && DoorStatus == "3") {
                                    ids.push(bucket.key);
                                } else if (doorOpens >= 76 && doorOpens <= 100 && DoorStatus == "4") {
                                    ids.push(bucket.key);
                                } else if (doorOpens >= 101 && doorOpens <= 125 && DoorStatus == "5") {
                                    ids.push(bucket.key);
                                } else if (doorOpens > 125 && DoorStatus == "6") {
                                    ids.push(bucket.key);
                                } else if (DoorStatus == "7") {
                                    noDataAssets.push(bucket.key);
                                }
                            });
                        } else {
                            var DoorStatus = searchParams.DeviceDoorStatus;
                            if (doorOpens <= 25 && DoorStatus == "1") {
                                ids.push(bucket.key);
                            } else if (doorOpens >= 26 && doorOpens <= 50 && DoorStatus == "2") {
                                ids.push(bucket.key);
                            } else if (doorOpens >= 51 && doorOpens <= 75 && DoorStatus == "3") {
                                ids.push(bucket.key);
                            } else if (doorOpens >= 76 && doorOpens <= 100 && DoorStatus == "4") {
                                ids.push(bucket.key);
                            } else if (doorOpens >= 101 && doorOpens <= 125 && DoorStatus == "5") {
                                ids.push(bucket.key);
                            } else if (doorOpens > 125 && DoorStatus == "6") {
                                ids.push(bucket.key);
                            } else if (DoorStatus == "7") {
                                noDataAssets.push(bucket.key);
                            }
                        }
                    });

                    if (noDataAssets.length > 0) {
                        if (searchParams.NoDataAssetIds) {
                            searchParams.NoDataAssetIds.forEach(function (value) {
                                var flag = noDataAssets.filter(function (val) {
                                    return val == value
                                });
                                if (flag.length == 0) {
                                    ids.push(value);
                                }
                            });
                        }
                    }
                }
            }

            // Telemetry Power Off  No Interruptions
            if (searchParams.AssetInterruption) {
                if (resp.aggregations) {
                    resp.aggregations.AssetIds.buckets.forEach(function (assetBucket) {
                        ids.push(assetBucket.key);
                    });
                }
            }
            // Telemetry Power Off 
            if (searchParams.telemetryPowerStatus) {
                var noDataAssets = [];
                if (Array.isArray(searchParams.telemetryPowerStatus)) {
                    var assetIds;
                    searchParams.telemetryPowerStatus.forEach(function (band) {
                        if (resp.aggregations) {
                            var powerdatainter = resp.aggregations.PowerData;
                            resp.aggregations.PowerData.buckets.forEach(function (assetBucket) {
                                var powerOffDuration = (assetBucket.PowerOffDuration.value / 3600) / days;
                                if (powerOffDuration < 1 && band == "1") {
                                    ids.push(assetBucket.key);
                                } else if (powerOffDuration >= 1 && powerOffDuration < 4 && band == "2") {
                                    ids.push(assetBucket.key);
                                } else if (powerOffDuration >= 4 && powerOffDuration < 8 && band == "3") {
                                    ids.push(assetBucket.key);
                                } else if (powerOffDuration >= 8 && powerOffDuration < 12 && band == "4") {
                                    ids.push(assetBucket.key);
                                } else if (powerOffDuration >= 12 && powerOffDuration < 16 && band == "5") {
                                    ids.push(assetBucket.key);
                                } else if (powerOffDuration >= 16 && band == "6") {
                                    ids.push(assetBucket.key);
                                }
                            });
                            if (band == "7") {
                                // noDataAssets.push(assetBucket.key);
                                if (searchParams.NoDataAssetIds) {
                                    if (searchParams.AssetidInterruptions) {
                                        if (searchParams.AssetidInterruptions.length > powerdatainter.buckets.length) {
                                            for (var p = 0; p < powerdatainter.buckets.length; p++) {
                                                searchParams.AssetidInterruptions.push(powerdatainter.buckets[p].key);
                                            }

                                            for (var w = 0; w < searchParams.AssetidInterruptions.length; w++) // check length of common words 
                                            {
                                                for (var q = 0; q < searchParams.NoDataAssetIds.length; q++) // check length of earlier string
                                                {
                                                    if (searchParams.AssetidInterruptions[w] == searchParams.NoDataAssetIds[q]) //change in upper case
                                                    {
                                                        var index = searchParams.NoDataAssetIds.indexOf(searchParams.NoDataAssetIds[q]);
                                                        if (index > -1) // remove common words from string
                                                        {
                                                            searchParams.NoDataAssetIds.splice(index, 1); // design new string without common words
                                                        }
                                                    }
                                                }
                                            }
                                        } else {
                                            for (var w = 0; w < powerdatainter.buckets.length; w++) // check length of common words 
                                            {
                                                for (var q = 0; q < searchParams.AssetidInterruptions.length; q++) // check length of earlier string
                                                {
                                                    if (powerdatainter.buckets[w].key == searchParams.AssetidInterruptions[q]) //change in upper case
                                                    {
                                                        var index = searchParams.AssetidInterruptions.indexOf(searchParams.AssetidInterruptions[q]);
                                                        if (index > -1) // remove common words from string
                                                        {
                                                            searchParams.AssetidInterruptions.splice(index, 1); // design new string without common words
                                                        }
                                                    }
                                                }
                                            }
                                            for (var w = 0; w < powerdatainter.buckets.length; w++) // check length of common words 
                                            {
                                                for (var q = 0; q < searchParams.NoDataAssetIds.length; q++) // check length of earlier string
                                                {
                                                    if (powerdatainter.buckets[w].key == searchParams.NoDataAssetIds[q]) //change in upper case
                                                    {
                                                        var index = searchParams.NoDataAssetIds.indexOf(searchParams.NoDataAssetIds[q]);
                                                        if (index > -1) // remove common words from string
                                                        {
                                                            searchParams.NoDataAssetIds.splice(index, 1); // design new string without common words
                                                        }
                                                    }
                                                }
                                            }
                                            for (var w = 0; w < searchParams.AssetidInterruptions.length; w++) // check length of common words 
                                            {
                                                for (var q = 0; q < searchParams.NoDataAssetIds.length; q++) // check length of earlier string
                                                {
                                                    if (searchParams.AssetidInterruptions[w] == searchParams.NoDataAssetIds[q]) //change in upper case
                                                    {
                                                        var index = searchParams.NoDataAssetIds.indexOf(searchParams.NoDataAssetIds[q]);
                                                        if (index > -1) // remove common words from string
                                                        {
                                                            searchParams.NoDataAssetIds.splice(index, 1); // design new string without common words
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                    }
                                    searchParams.NoDataAssetIds.forEach(function (value) {
                                        var flag = noDataAssets.filter(function (val) {
                                            return val === value
                                        });
                                        if (flag.length == 0) {
                                            ids.push(value);
                                        }
                                    });
                                }
                            } else if (band == "8") {
                                if (searchParams.AssetidInterruptions) {
                                    // for (var p = 0; p < powerdatainter.buckets.length; p++) {
                                    //     searchParams.AssetidInterruptions.push(powerdatainter.buckets[p].key);
                                    // }
                                    for (var w = 0; w < powerdatainter.buckets.length; w++) // check length of common words 
                                    {
                                        for (var q = 0; q < searchParams.AssetidInterruptions.length; q++) // check length of earlier string
                                        {
                                            if (powerdatainter.buckets[w].key == searchParams.AssetidInterruptions[q]) //change in upper case
                                            {
                                                var index = searchParams.AssetidInterruptions.indexOf(searchParams.AssetidInterruptions[q]);
                                                if (index > -1) // remove common words from string
                                                {
                                                    searchParams.AssetidInterruptions.splice(index, 1); // design new string without common words
                                                }
                                            }
                                        }
                                    }
                                    for (var w = 0; w < searchParams.AssetidInterruptions.length; w++) {
                                        ids.push(searchParams.AssetidInterruptions[w]);
                                    }
                                }
                            }
                        }
                    });
                } else if (searchParams.telemetryPowerStatus) {
                    var days = searchParams.daysPower;
                    var band = searchParams.telemetryPowerStatus;
                    if (resp.aggregations) {
                        var powerdatainter = resp.aggregations.PowerData;
                        resp.aggregations.PowerData.buckets.forEach(function (assetBucket) {
                            var powerOffDuration = (assetBucket.PowerOffDuration.value / 3600) / days;
                            if (powerOffDuration < 1 && band == "1") {
                                ids.push(assetBucket.key);
                            } else if (powerOffDuration >= 1 && powerOffDuration < 4 && band == "2") {
                                ids.push(assetBucket.key);
                            } else if (powerOffDuration >= 4 && powerOffDuration < 8 && band == "3") {
                                ids.push(assetBucket.key);
                            } else if (powerOffDuration >= 8 && powerOffDuration < 12 && band == "4") {
                                ids.push(assetBucket.key);
                            } else if (powerOffDuration >= 12 && powerOffDuration < 16 && band == "5") {
                                ids.push(assetBucket.key);
                            } else if (powerOffDuration >= 16 && band == "6") {
                                ids.push(assetBucket.key);
                            }
                        });
                        if (band == "7") {
                            // noDataAssets.push(assetBucket.key);
                            if (searchParams.NoDataAssetIds) {
                                if (searchParams.AssetidInterruptions) {
                                    if (searchParams.AssetidInterruptions.length > powerdatainter.buckets.length) {
                                        for (var p = 0; p < powerdatainter.buckets.length; p++) {
                                            searchParams.AssetidInterruptions.push(powerdatainter.buckets[p].key);
                                        }

                                        for (var w = 0; w < searchParams.AssetidInterruptions.length; w++) // check length of common words 
                                        {
                                            for (var q = 0; q < searchParams.NoDataAssetIds.length; q++) // check length of earlier string
                                            {
                                                if (searchParams.AssetidInterruptions[w] == searchParams.NoDataAssetIds[q]) //change in upper case
                                                {
                                                    var index = searchParams.NoDataAssetIds.indexOf(searchParams.NoDataAssetIds[q]);
                                                    if (index > -1) // remove common words from string
                                                    {
                                                        searchParams.NoDataAssetIds.splice(index, 1); // design new string without common words
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        for (var w = 0; w < powerdatainter.buckets.length; w++) // check length of common words 
                                        {
                                            for (var q = 0; q < searchParams.AssetidInterruptions.length; q++) // check length of earlier string
                                            {
                                                if (powerdatainter.buckets[w].key == searchParams.AssetidInterruptions[q]) //change in upper case
                                                {
                                                    var index = searchParams.AssetidInterruptions.indexOf(searchParams.AssetidInterruptions[q]);
                                                    if (index > -1) // remove common words from string
                                                    {
                                                        searchParams.AssetidInterruptions.splice(index, 1); // design new string without common words
                                                    }
                                                }
                                            }
                                        }
                                        for (var w = 0; w < powerdatainter.buckets.length; w++) // check length of common words 
                                        {
                                            for (var q = 0; q < searchParams.NoDataAssetIds.length; q++) // check length of earlier string
                                            {
                                                if (powerdatainter.buckets[w].key == searchParams.NoDataAssetIds[q]) //change in upper case
                                                {
                                                    var index = searchParams.NoDataAssetIds.indexOf(searchParams.NoDataAssetIds[q]);
                                                    if (index > -1) // remove common words from string
                                                    {
                                                        searchParams.NoDataAssetIds.splice(index, 1); // design new string without common words
                                                    }
                                                }
                                            }
                                        }
                                        for (var w = 0; w < searchParams.AssetidInterruptions.length; w++) // check length of common words 
                                        {
                                            for (var q = 0; q < searchParams.NoDataAssetIds.length; q++) // check length of earlier string
                                            {
                                                if (searchParams.AssetidInterruptions[w] == searchParams.NoDataAssetIds[q]) //change in upper case
                                                {
                                                    var index = searchParams.NoDataAssetIds.indexOf(searchParams.NoDataAssetIds[q]);
                                                    if (index > -1) // remove common words from string
                                                    {
                                                        searchParams.NoDataAssetIds.splice(index, 1); // design new string without common words
                                                    }
                                                }
                                            }
                                        }
                                    }

                                }
                                searchParams.NoDataAssetIds.forEach(function (value) {
                                    var flag = noDataAssets.filter(function (val) {
                                        return val === value
                                    });
                                    if (flag.length == 0) {
                                        ids.push(value);
                                    }
                                });
                            }
                        } else if (band == "8") {
                            if (searchParams.AssetidInterruptions) {
                                // for (var p = 0; p < powerdatainter.buckets.length; p++) {
                                //     searchParams.AssetidInterruptions.push(powerdatainter.buckets[p].key);
                                // }
                                for (var w = 0; w < powerdatainter.buckets.length; w++) // check length of common words 
                                {
                                    for (var q = 0; q < searchParams.AssetidInterruptions.length; q++) // check length of earlier string
                                    {
                                        if (powerdatainter.buckets[w].key == searchParams.AssetidInterruptions[q]) //change in upper case
                                        {
                                            var index = searchParams.AssetidInterruptions.indexOf(searchParams.AssetidInterruptions[q]);
                                            if (index > -1) // remove common words from string
                                            {
                                                searchParams.AssetidInterruptions.splice(index, 1); // design new string without common words
                                            }
                                        }
                                    }
                                }
                                for (var w = 0; w < searchParams.AssetidInterruptions.length; w++) {
                                    ids.push(searchParams.AssetidInterruptions[w]);
                                }
                            }
                        }
                    }
                }
            }

            //Technical Diagnostics Compressor 
            if (searchParams.CompressorBand) {
                var Duration;
                if (resp.aggregations) {
                    var noDataAssets = [];
                    resp.aggregations.CompressorData.buckets.forEach(function (bucket) {
                        Duration = (bucket.CompressorDuration.CompressorDuration.value / 3600) / (days);;
                        if (Array.isArray(searchParams.CompressorBand)) {
                            searchParams.CompressorBand.forEach(function (band) {
                                if (Duration < 1 && band == "1") {
                                    ids.push(bucket.key);
                                } else if (Duration >= 1 && Duration < 4 && band == "2") {
                                    ids.push(bucket.key);
                                } else if (Duration >= 4 && Duration < 8 && band == "3") {
                                    ids.push(bucket.key);
                                } else if (Duration >= 8 && Duration < 12 && band == "4") {
                                    ids.push(bucket.key);
                                } else if (Duration >= 12 && Duration < 16 && band == "5") {
                                    ids.push(bucket.key);
                                } else if (Duration >= 16 && band == "6") {
                                    ids.push(bucket.key);
                                } else if (band == "7") {
                                    noDataAssets.push(bucket.key);
                                }
                            });
                        } else {
                            var band = searchParams.CompressorBand;
                            if (Duration < 1 && band == "1") {
                                ids.push(bucket.key);
                            } else if (Duration >= 1 && Duration < 4 && band == "2") {
                                ids.push(bucket.key);
                            } else if (Duration >= 4 && Duration < 8 && band == "3") {
                                ids.push(bucket.key);
                            } else if (Duration >= 8 && Duration < 12 && band == "4") {
                                ids.push(bucket.key);
                            } else if (Duration >= 12 && Duration < 16 && band == "5") {
                                ids.push(bucket.key);
                            } else if (Duration >= 16 && band == "6") {
                                ids.push(bucket.key);
                            } else if (band == "7") {
                                noDataAssets.push(bucket.key);
                            }
                        }
                    });

                    if (noDataAssets.length > 0) {
                        if (searchParams.NoDataAssetIds) {
                            searchParams.NoDataAssetIds.forEach(function (value) {
                                var flag = noDataAssets.filter(function (val) {
                                    return val == value
                                });
                                if (flag.length == 0) {
                                    ids.push(value);
                                }
                            });
                        }
                    }
                }
            }

            //Technical Diagnostics Fan 
            if (searchParams.FanBand) {
                var Duration;
                if (resp.aggregations) {
                    var noDataAssets = [];
                    resp.aggregations.FanData.buckets.forEach(function (bucket) {
                        Duration = (bucket.FanDuration.FanDuration.value / 3600) / (days);
                        if (Array.isArray(searchParams.FanBand)) {
                            searchParams.FanBand.forEach(function (band) {
                                if (Duration < 1 && band == "1") {
                                    ids.push(bucket.key);
                                } else if (Duration >= 1 && Duration < 4 && band == "2") {
                                    ids.push(bucket.key);
                                } else if (Duration >= 4 && Duration < 8 && band == "3") {
                                    ids.push(bucket.key);
                                } else if (Duration >= 8 && Duration < 12 && band == "4") {
                                    ids.push(bucket.key);
                                } else if (Duration >= 12 && Duration < 16 && band == "5") {
                                    ids.push(bucket.key);
                                } else if (Duration >= 16 && band == "6") {
                                    ids.push(bucket.key);
                                } else if (band == "7") {
                                    noDataAssets.push(bucket.key);
                                }
                            });
                        } else {
                            var band = searchParams.FanBand;
                            if (Duration < 1 && band == "1") {
                                ids.push(bucket.key);
                            } else if (Duration >= 1 && Duration < 4 && band == "2") {
                                ids.push(bucket.key);
                            } else if (Duration >= 4 && Duration < 8 && band == "3") {
                                ids.push(bucket.key);
                            } else if (Duration >= 8 && Duration < 12 && band == "4") {
                                ids.push(bucket.key);
                            } else if (Duration >= 12 && Duration < 16 && band == "5") {
                                ids.push(bucket.key);
                            } else if (Duration >= 16 && band == "6") {
                                ids.push(bucket.key);
                            } else if (band == "7") {
                                noDataAssets.push(bucket.key);
                            }
                        }
                    });

                    if (noDataAssets.length > 0) {
                        if (searchParams.NoDataAssetIds) {
                            searchParams.NoDataAssetIds.forEach(function (value) {
                                var flag = noDataAssets.filter(function (val) {
                                    return val == value
                                });
                                if (flag.length == 0) {
                                    ids.push(value);
                                }
                            });
                        }
                    }
                }
            }

            if (searchParams.TempLightIssue) {
                var Duration;

                if (resp.aggregations) {

                    resp.aggregations.TempLightIssue.top_tags.buckets.forEach(function (data) {
                        var asset = data;
                        data.top_hit.hits.hits.forEach(function (topdata) {

                            if (Array.isArray(searchParams.TempLightIssue)) {
                                searchParams.TempLightIssue.forEach(function (band) {

                                    // Temperature and Light OK
                                    if (topdata._source.IsLightIssue == false && topdata._source.IsTemperatureIssue == false && band == "4") {
                                        ids.push(asset.key);
                                    }
                                    // Light Malfunction
                                    if (topdata._source.IsLightIssue == true && topdata._source.IsTemperatureIssue == false && band == "3") {
                                        ids.push(asset.key);
                                    }
                                    //Temperature Issue
                                    if (topdata._source.IsLightIssue == false && topdata._source.IsTemperatureIssue == true && band == "2") {
                                        ids.push(asset.key);
                                    }
                                    //Temperature And Light Issue 1
                                    if (topdata._source.IsLightIssue == true && topdata._source.IsTemperatureIssue == true && band == "1") {
                                        ids.push(asset.key);
                                    }
                                });

                            } else {
                                var band = searchParams.TempLightIssue;

                                if (topdata._source.IsLightIssue == false && topdata._source.IsTemperatureIssue == false && band == "4") {
                                    ids.push(asset.key);
                                }
                                // Light Malfunction
                                if (topdata._source.IsLightIssue == true && topdata._source.IsTemperatureIssue == false && band == "3") {
                                    ids.push(asset.key);
                                }
                                //Temperature Issue
                                if (topdata._source.IsLightIssue == false && topdata._source.IsTemperatureIssue == true && band == "2") {
                                    ids.push(asset.key);
                                }
                                //Temperature And Light Issue 1
                                if (topdata._source.IsLightIssue == true && topdata._source.IsTemperatureIssue == true && band == "1") {
                                    ids.push(asset.key);
                                }
                            }


                        });
                    });
                }

            }

            //battery report data
            if (searchParams.batteryReprtData) {
                if (resp.aggregations) {
                    var DataAggs = resp.aggregations;
                    if (searchParams.batteryReprtData.indexOf('1') != -1) {

                        DataAggs.Battery0to25.Battery0to25.buckets.forEach(function (element) {
                            var Key = element.key;
                            ids.push(Key);
                        });
                    }

                    if (searchParams.batteryReprtData.indexOf('2') != -1) {
                        DataAggs.Battery25to50.Battery25to50.buckets.forEach(function (element) {
                            var Key = element.key;
                            ids.push(Key);
                        });

                    }

                    if (searchParams.batteryReprtData.indexOf('3') != -1) {
                        DataAggs.Battery50to75.Battery50to75.buckets.forEach(function (element) {
                            var Key = element.key;
                            ids.push(Key);
                        });
                    }

                    if (searchParams.batteryReprtData.indexOf('4') != -1) {
                        DataAggs.Battery75to100.Battery75to100.buckets.forEach(function (element) {
                            var Key = element.key;
                            ids.push(Key);
                        });
                    }
                }
            }

            //Execute command report
            if (searchParams.ExcecuteCommandReport) {
                if (resp.aggregations) {
                    var DataAggs = resp.aggregations;
                    var noDataAssets = [];
                    if (searchParams.ExcecuteCommandReport.indexOf('1') != -1) {

                        DataAggs.Assets.buckets.forEach(function (element) {
                            var Key = element.key;
                            ids.push(Key);
                        });
                    }

                    if (searchParams.ExcecuteCommandReport.indexOf('2') != -1) {

                        DataAggs.Assets.buckets.forEach(function (element) {
                            var Key = element.key;
                            noDataAssets.push(Key);
                        });
                        if (searchParams.NoDataAssetIds) {
                            searchParams.NoDataAssetIds.forEach(function (value) {
                                var flag = noDataAssets.filter(function (val) {
                                    return val == value
                                });
                                if (flag.length == 0) {
                                    ids.push(value);
                                }
                            });
                        }
                    }
                }
            }

            //Execute command Spread
            if (searchParams.ExcecuteCommandSpread) {
                if (Array.isArray(searchParams.ExcecuteCommandSpread)) {
                    searchParams.ExcecuteCommandSpread.forEach(function (band) {
                        if (resp.aggregations) {

                            var last15Days = resp.aggregations.Last15Days.AssetIds.buckets;
                            if (band == "1") {
                                last15Days.forEach(function (bucket) {
                                    ids.push(bucket.key);
                                });
                            }

                            var last30Days = resp.aggregations.Last30Days.AssetIds.buckets;
                            last30Days = last30Days.filter(function (y) {
                                return last15Days.findIndex(x => x.key == y.key) < 0
                            });

                            if (band == "2") {
                                last30Days.forEach(function (bucket) {
                                    ids.push(bucket.key);
                                });
                            }

                            var last60Days = resp.aggregations.Last60Days.AssetIds.buckets;
                            last60Days = last60Days.filter(function (y) {
                                return (last15Days.findIndex(x => x.key == y.key) < 0) && (last30Days.findIndex(x => x.key == y.key) < 0)
                            });

                            if (band == "3") {
                                last60Days.forEach(function (bucket) {
                                    ids.push(bucket.key);
                                });
                            }

                            if (band == "4") {

                                // var moreThen60Days = resp.aggregations.MoreThen60Days.AssetIds.buckets;
                                // searchParams.NoDataAssetIds.forEach(function (value) {
                                //     var flag = moreThen60Days.filter(function (val) {
                                //         return val.key == value
                                //     });
                                //     if (flag.length == 0) {
                                //         ids.push(value);
                                //     }
                                // });
                                resp.aggregations.MoreThen60Days.AssetIds.buckets.forEach(function (data) {
                                    ids.push(data.key);
                                });
                            }
                        }
                    });
                } else {
                    if (resp.aggregations) {

                        var last15Days = resp.aggregations.Last15Days.AssetIds.buckets;
                        if (searchParams.ExcecuteCommandSpread == "1") {
                            last15Days.forEach(function (bucket) {
                                ids.push(bucket.key);
                            });
                        }

                        var last30Days = resp.aggregations.Last30Days.AssetIds.buckets;
                        last30Days = last30Days.filter(function (y) {
                            return last15Days.findIndex(x => x.key == y.key) < 0
                        });

                        if (searchParams.ExcecuteCommandSpread == "2") {
                            last30Days.forEach(function (bucket) {
                                ids.push(bucket.key);
                            });
                        }

                        var last60Days = resp.aggregations.Last60Days.AssetIds.buckets;
                        last60Days = last60Days.filter(function (y) {
                            return (last15Days.findIndex(x => x.key == y.key) < 0) && (last30Days.findIndex(x => x.key == y.key) < 0)
                        });

                        if (searchParams.ExcecuteCommandSpread == "3") {
                            last60Days.forEach(function (bucket) {
                                ids.push(bucket.key);
                            });
                        }

                        if (searchParams.ExcecuteCommandSpread == "4") {

                            // var moreThen60Days = resp.aggregations.MoreThen60Days.AssetIds.buckets;
                            // searchParams.NoDataAssetIds.forEach(function (value) {
                            //     var flag = moreThen60Days.filter(function (val) {
                            //         return val.key == value
                            //     });
                            //     if (flag.length == 0) {
                            //         ids.push(value);
                            //     }
                            // });
                            resp.aggregations.MoreThen60Days.AssetIds.buckets.forEach(function (data) {
                                ids.push(data.key);
                            });
                        }
                    }
                }
            }

            // KPI > Operational Issue filter 
            if (searchParams.OperationalIssuesHealth) {
                if (Array.isArray(searchParams.OperationalIssuesHealth)) {

                    searchParams.OperationalIssuesHealth.forEach(function (band) {
                        if (band == "1" || band == "2") {
                            if (resp.aggregations.TempLightIssueCount) {
                                resp.aggregations.TempLightIssueCount.LightIssue.AssetBucket.buckets.forEach(function (assetBucket) {
                                    var lightDuration = (assetBucket.HealthInterval.value / 60) / days;
                                    if (lightDuration >= 8 && lightDuration < 12 && band == "1") {
                                        ids.push(assetBucket.key);
                                    } else if (lightDuration >= 12 && lightDuration <= 24 && band == "2") {
                                        ids.push(assetBucket.key);
                                    }
                                });
                            }
                        }

                        if (band == "3" || band == "4") {
                            if (resp.aggregations.TempLightIssueCount) {
                                resp.aggregations.TempLightIssueCount.TemperatureIssue.AssetBucket.buckets.forEach(function (assetBucket) {
                                    var temperatureDuration = (assetBucket.HealthInterval.value / 60) / days;
                                    if (temperatureDuration >= 8 && temperatureDuration < 12 && band == "3") {
                                        ids.push(assetBucket.key);
                                    } else if (temperatureDuration >= 12 && temperatureDuration <= 24 && band == "4") {
                                        ids.push(assetBucket.key);
                                    }
                                });
                            }
                        }

                        if (band == "5" || band == "6") {
                            if (resp.aggregations.PowerData) {
                                resp.aggregations.PowerData.buckets.forEach(function (assetBucket) {
                                    var powerDuration = (assetBucket.PowerOffDuration.value / 3600) / days;
                                    if (powerDuration >= 8 && powerDuration < 12 && band == "5") {
                                        ids.push(assetBucket.key);
                                    } else if (powerDuration >= 12 && powerDuration <= 24 && band == "6") {
                                        ids.push(assetBucket.key);
                                    }
                                });
                            }
                        }
                    });
                } else {
                    var band = searchParams.OperationalIssuesHealth;

                    if (band == "1" || band == "2") {
                        if (resp.aggregations.TempLightIssueCount) {
                            resp.aggregations.TempLightIssueCount.LightIssue.AssetBucket.buckets.forEach(function (assetBucket) {
                                var lightDuration = (assetBucket.HealthInterval.value / 60) / days;
                                if (lightDuration >= 8 && lightDuration < 12 && band == "1") {
                                    ids.push(assetBucket.key);
                                } else if (lightDuration >= 12 && lightDuration <= 24 && band == "2") {
                                    ids.push(assetBucket.key);
                                }
                            });
                        }
                    }

                    if (band == "3" || band == "4") {
                        if (resp.aggregations.TempLightIssueCount) {
                            resp.aggregations.TempLightIssueCount.TemperatureIssue.AssetBucket.buckets.forEach(function (assetBucket) {
                                var temperatureDuration = (assetBucket.HealthInterval.value / 60) / days;
                                if (temperatureDuration >= 8 && temperatureDuration < 12 && band == "3") {
                                    ids.push(assetBucket.key);
                                } else if (temperatureDuration >= 12 && temperatureDuration <= 24 && band == "4") {
                                    ids.push(assetBucket.key);
                                }
                            });
                        }
                    }

                    if (band == "5" || band == "6") {
                        if (resp.aggregations.PowerData) {
                            resp.aggregations.PowerData.buckets.forEach(function (assetBucket) {
                                var powerDuration = (assetBucket.PowerOffDuration.value / 3600) / days;
                                if (powerDuration >= 8 && powerDuration < 12 && band == "5") {
                                    ids.push(assetBucket.key);
                                } else if (powerDuration >= 12 && powerDuration <= 24 && band == "6") {
                                    ids.push(assetBucket.key);
                                }
                            });
                        }
                    }

                }
            }

            // KPI Operation Issue > Power Off
            if (searchParams.OperationalIssuesPower) {
                if (Array.isArray(searchParams.OperationalIssuesPower)) {

                    searchParams.OperationalIssuesPower.forEach(function (band) {

                        if (band == "5" || band == "6") {
                            if (resp.aggregations.PowerData) {
                                resp.aggregations.PowerData.buckets.forEach(function (assetBucket) {
                                    var powerDuration = (assetBucket.PowerOffDuration.value / 3600) / days;
                                    if (powerDuration >= 8 && powerDuration < 12 && band == "5") {
                                        ids.push(assetBucket.key);
                                    } else if (powerDuration >= 12 && powerDuration <= 24 && band == "6") {
                                        ids.push(assetBucket.key);
                                    }
                                });
                            }
                        }
                    });
                } else {
                    var band = searchParams.OperationalIssuesPower;
                    if (band == "5" || band == "6") {
                        if (resp.aggregations.PowerData) {
                            resp.aggregations.PowerData.buckets.forEach(function (assetBucket) {
                                var powerDuration = (assetBucket.PowerOffDuration.value / 3600) / days;
                                if (powerDuration >= 8 && powerDuration < 12 && band == "5") {
                                    ids.push(assetBucket.key);
                                } else if (powerDuration >= 12 && powerDuration <= 24 && band == "6") {
                                    ids.push(assetBucket.key);
                                }
                            });
                        }
                    }

                }
            }

            // KPI > Door Swings Vs Target
            if (searchParams.doorTarget) {
                if (resp.aggregations) {

                    return {
                        data: resp.aggregations.AssetIds.buckets,
                        days: days
                    }
                }
            }

            if (searchParams.salesTarget) {
                if (resp.aggregations) {
                    return resp.aggregations.locations.buckets;
                }
            }
            // Kpi Cooler Performance Index 
            if (searchParams.CoolerPerformanceIndex) {
                var band = searchParams.CoolerPerformanceIndex;

                var assetDays = 0;
                var doorCount = 0;
                if (band.indexOf("1") != -1) {
                    resp.aggregations.DoorAsset.buckets.forEach(function (doorData) {
                        ids.push(doorData.key);
                        //assetDays = doorData.DoorCountDays.buckets.length;
                        //doorCount += doorData.DoorCount.value / assetDays;
                    });
                    //doorOpenRate = (doorCount / resp.aggregations.AssetCount.value);
                }
                if (band.indexOf("2") != -1) {
                    resp.aggregations.ids.buckets.forEach(function (bucket) {
                        ids.push(bucket.key);
                    });
                }
            }

            if (searchParams.AssetTypeCapacity) {
                resp.aggregations.tops.hits.hits.forEach(function (bucket) {
                    ids.push(bucket);
                });
            }

            if (searchParams.AssetTypeCapacityThresholdCountry) {
                resp.aggregations.tops.hits.hits.forEach(function (bucket) {
                    ids.push(bucket);
                });
            }
            //========================door swing vs target==============================//
            if (searchParams.DoorSwingsVsTarget) {
                var doorTarget = 0;
                var doorActual = 0;
                var band = searchParams.DoorSwingsVsTarget;
                if (resp.aggregations.LocationDoorSwingsVsTarget) {
                    resp.aggregations.LocationDoorSwingsVsTarget.top_tags.buckets.forEach(function (locationData) {
                        var locationId = locationData.key;
                        var doorActual = 0;
                        var SalesOrganisation;
                        var doortarget = locationData.DoorOpenTarget.DoorOpenTarget.buckets;
                        if (doortarget.length == 0) {
                            doortarget = 0;
                        } else {
                            doortarget = doortarget[0].key;
                        }
                        locationData.SalesOrganization.SalesOrganization.buckets.forEach(function (organisationid) {
                            SalesOrganisation = organisationid.key;
                        });
                        var doorValue;
                        if (searchParams.doorTargetAssets) {
                            doorValue = searchParams.doorTargetAssets.data.filter(data => data.key == locationId);
                        }

                        if (doorValue && doorValue.length > 0) {
                            doorActual = doorValue[0].DoorCount.value;
                        }
                        var AssetType = locationData.AssetTypeCapacity.AssetTypeCapacityId.buckets;
                        var doorthreshold = 0;
                        var doortargetthreshold = 0;
                        var finalthreshold = 0;
                        var doornumberthreshold = 0;
                        var PercentageValue;
                        if (locationData) {
                            var doccount = 0;
                            for (var i = 0; i < AssetType.length; i++) {
                                var CapacityNumber = AssetType[i].key;
                                doccount = AssetType[i].doc_count + doccount;
                                var range = searchParams.AssetTypeCapacityDataThreshold.filter(data => data._source.AssetTypeCapacityId == CapacityNumber && data._source.SalesHierarchyId == SalesOrganisation);
                                if (range && range.length > 0) {
                                    doorthreshold = range[0]._source.Last30DayDoorThresold * searchParams.doorTargetAssets.days
                                } else {
                                    doortargetthreshold = doortarget * searchParams.doorTargetAssets.days
                                }
                                if (doorthreshold == 0) {
                                    doorthreshold = doortargetthreshold
                                }
                                doorthreshold = doorthreshold * AssetType[i].doc_count;
                                doornumberthreshold = doornumberthreshold + doorthreshold;
                            }
                            if (doornumberthreshold != 0) {
                                doornumberthreshold = doornumberthreshold / doccount;
                            }
                        }
                        finalthreshold = doornumberthreshold;
                        PercentageValue = (doorActual / doornumberthreshold) * 100;
                        if (doorActual == 0 && band.indexOf('5') != -1) {
                            ids.push(locationId);
                        } else {
                            if (PercentageValue >= 100 && band.indexOf('1') != -1) {
                                ids.push(locationId);
                            } else if (PercentageValue >= 90 && PercentageValue < 100 && band.indexOf('2') != -1) {
                                ids.push(locationId);
                            } else if (PercentageValue >= 50 && PercentageValue < 90 && band.indexOf('3') != -1) {
                                ids.push(locationId);
                            } else if (PercentageValue > 0 && PercentageValue < 50 && band.indexOf('4') != -1) {
                                ids.push(locationId);
                            } else if (PercentageValue == 0 && band.indexOf('5') != -1) {
                                ids.push(locationId);
                            }
                        }
                    });
                }
            }

            if (searchParams.DoorOpenVsSales) {
                var band = searchParams.DoorOpenVsSales;
                if (searchParams.doorTargetAssets || searchParams.salesTargetAssets) {
                    var doorTarget = 0;
                    var salesTarget = 0;
                    var doorActual = 0;
                    var salesActual = 0;
                    var salesIssue = true;
                    var doorIssue = true;
                    var days = searchParams.doorTargetAssets.days;
                    var locationDataMap = [];
                    resp.aggregations.LocationDoorOpenVsSales.top_tags.buckets.forEach(function (locationData) {
                        var locationId = locationData.key;
                        //var locationDetail = locationData.LocationDetail.hits.hits[0]._source;
                        doorTarget = 0;
                        salesTarget = 0;
                        salesActual = 0;
                        doorActual = 0;
                        doorTarget = locationData.DoorOpenTarget.value;
                        salesTarget = locationData.SalesTarget.value;
                        var doorValue;
                        if (searchParams.doorTargetAssets) {
                            doorValue = searchParams.doorTargetAssets.data.filter(data => data.key == locationId);
                        }
                        var salesValue;
                        if (searchParams.salesTargetAssets) {
                            salesValue = searchParams.salesTargetAssets.filter(data => data.key == locationId);
                        }

                        if (doorValue && doorValue.length > 0) {
                            doorActual = doorValue[0].DoorCount.value;
                        }

                        if (salesValue && salesValue.length > 0) {
                            salesActual = salesValue[0].SalesVolume.value;
                        }

                        // var range;
                        // var capcity = locationData.Capacity.value || locationData.CapacityAvg.value;
                        // range = assetTypeCapacityHits.filter(data => capcity >= data._source.MinCapacity && capcity <= data._source.MaxCapacity && data._source.Range.indexOf('Door') > 0);
                        // if (range && range.length > 0) {
                        //     range = range[0]._source.Range;
                        // }
                        // //salesTarget = salesTarget * days;
                        // if (range && range.length > 0) {
                        //     var salesDay = Number((salesActual / days).toFixed(1));
                        //     var doorDay = Number((doorActual / days).toFixed(1));
                        //     if (salesDay || doorDay) {
                        //         finalData.doorVsSalesChart.push({
                        //             "LocationId": locationId,
                        //             "Range": range,
                        //             "Sales": salesDay,
                        //             "Door": doorDay,
                        //             "LocationCode": locationDetail.LocationCode,
                        //             "Name": locationDetail.Location
                        //         });
                        //     }
                        // }

                        doorTarget = doorTarget * days;
                        salesTarget = salesTarget * days;

                        salesIssue = salesTarget === 0 ? true : salesActual < salesTarget ? true : false;
                        doorIssue = doorTarget === 0 ? true : doorActual < doorTarget ? true : false;

                        if (!(salesTarget == 0 && doorTarget == 0)) {

                            var loc = locationDataMap.filter(data => data.Id == locationId);
                            if (salesIssue && !doorIssue && band.indexOf('3') != -1) {
                                ids.push(locationId);
                                // finalData.dooorSales[0].y++;
                                // finalData.dooorSales[0].x++;
                                // if (loc && loc.length > 0) {
                                //     loc[0].Utilization = "Low Sales & High Door Utilization";
                                // } else {
                                //     locationDataMap.push({
                                //         Id: locationId,
                                //         Utilization: "Low Sales & High Door Utilization",
                                //         LocationGeo: {
                                //             "lat": locationData.Lat.bounds.top_left.lat,
                                //             "lon": locationData.Lat.bounds.top_left.lon
                                //         }
                                //     })
                                // }
                            } else if (!salesIssue && !doorIssue && band.indexOf('4') != -1) {
                                ids.push(locationId);
                                // finalData.dooorSales[1].y++;
                                // finalData.dooorSales[1].x++;
                                //  if (loc && loc.length > 0) {
                                //     loc[0].Utilization = "High Sales & High Door Utilization";
                                // } else {
                                //     locationDataMap.push({
                                //         Id: locationId,
                                //         Utilization: "High Sales & High Door Utilization",
                                //         LocationGeo: {
                                //             "lat": locationData.Lat.bounds.top_left.lat,
                                //             "lon": locationData.Lat.bounds.top_left.lon
                                //         }
                                //     })
                                // }
                            } else if (!salesIssue && doorIssue && band.indexOf('2') != -1) {
                                ids.push(locationId);
                                // finalData.dooorSales[2].y++;
                                // finalData.dooorSales[2].x++;
                                // if (loc && loc.length > 0) {
                                //     loc[0].Utilization = "High Sales & Low Door Utilization";
                                // } else {
                                //     locationDataMap.push({
                                //         Id: locationId,
                                //         Utilization: "High Sales & Low Door Utilization",
                                //         LocationGeo: {
                                //             "lat": locationData.Lat.bounds.top_left.lat,
                                //             "lon": locationData.Lat.bounds.top_left.lon
                                //         }
                                //     })
                                // }
                            } else if (salesIssue && doorIssue && band.indexOf('1') != -1) {
                                ids.push(locationId);
                                // finalData.dooorSales[3].y++;
                                // finalData.dooorSales[3].x++;
                                // if (loc && loc.length > 0) {
                                //     loc[0].Utilization = "Low Sales & Low Door Utilization";
                                // } else {
                                //     locationDataMap.push({
                                //         Id: locationId,
                                //         Utilization: "Low Sales & Low Door Utilization",
                                //         LocationGeo: {
                                //             "lat": locationData.Lat.bounds.top_left.lat,
                                //             "lon": locationData.Lat.bounds.top_left.lon
                                //         }
                                //     })
                                // }
                            }
                        }
                    });

                    // var salesLowDoorLow = 0;
                    // var salesLowDoorHigh = 0;
                    // var salesHighDoorHigh = 0;
                    // var salesHighDoorLow = 0;

                    // var arrSalesLowDoorLow = locationDataMap.filter(data => data.Utilization == "Low Sales & Low Door Utilization");
                    // if (arrSalesLowDoorLow.length > 0) {
                    //     salesLowDoorLow = arrSalesLowDoorLow.length;
                    // } else {
                    //     salesLowDoorLow = 0;
                    // }

                    // var arrSalesLowDoorHigh = locationDataMap.filter(data => data.Utilization == "Low Sales & High Door Utilization");
                    // if (arrSalesLowDoorHigh.length > 0) {
                    //     salesLowDoorHigh = arrSalesLowDoorHigh.length;
                    // } else {
                    //     salesLowDoorHigh = 0;
                    // }

                    // var arrSalesHighDoorHigh = locationDataMap.filter(data => data.Utilization == "High Sales & High Door Utilization");
                    // if (arrSalesHighDoorHigh.length > 0) {
                    //     salesHighDoorHigh = arrSalesHighDoorHigh.length;
                    // } else {
                    //     salesHighDoorHigh = 0;
                    // }

                    // var arrsalesHighDoorLow = locationDataMap.filter(data => data.Utilization == "High Sales & Low Door Utilization");
                    // if (arrsalesHighDoorLow.length > 0) {
                    //     salesHighDoorLow = arrsalesHighDoorLow.length;
                    // } else {
                    //     salesHighDoorLow = 0;
                    // }
                }
            }
            // CoolerHealthLowUti
            var AssetId = [];
            if (searchParams.CoolerHealthLowUti) {
                if (searchParams.CoolerHealthLowUti.indexOf("3") != -1) {
                    resp.aggregations.assets.buckets.forEach(function (bucket) {
                        var doorOpens = bucket.DoorCount.value;
                        if (doorOpens <= consts.Threshold.LowUtilization * days) {
                            ids.push(bucket.key);
                        }
                    });
                }
            }
            //CoolerHealthMissing
            if (searchParams.CoolerHealthMissing) {
                if (searchParams.CoolerHealthMissing.indexOf("4") != -1) {
                    resp.aggregations.AssetCount.AssetIds.buckets.forEach(function (bucket) {
                        ids.push(bucket.key);
                    });
                }
            }
            // kpi > cooler helath
            if (searchParams.CoolerHealthTele) {

                // Cooler Health > Cooler Above 7 C (temp)
                if (Array.isArray(searchParams.CoolerHealthTele)) {
                    searchParams.CoolerHealthTele.forEach(function (band) {
                        if (band == "1") {
                            resp.aggregations.TempAbove7.buckets.forEach(function (bucket) {
                                ids.push(bucket.key);
                            });
                        }

                        if (band == "2") {
                            resp.aggregations.CoolersWithLowLight.buckets.forEach(function (bucket) {
                                ids.push(bucket.key);
                            });
                        }

                        // if (band == "3") {
                        //     resp.aggregations.AssetIds.buckets.forEach(function (bucket) {
                        //         ids.push(bucket.key);
                        //     });
                        // }
                    });
                } else {
                    var band = searchParams.CoolerHealthTele;
                    if (band == "1") {
                        resp.aggregations.TempAbove7.buckets.forEach(function (bucket) {
                            if (bucket.TempAbove7.TempAbove7.value == 1)
                                ids.push(bucket.key);

                        });
                    }

                    if (band == "2") {
                        resp.aggregations.CoolersWithLowLight.buckets.forEach(function (bucket) {
                            if (bucket.CoolersWithLowLight.CoolersWithLowLight.value == 1)
                                ids.push(bucket.key);
                        });
                    }

                    if (band == "3") {
                        resp.aggregations.assets.buckets.forEach(function (bucket) {
                            var doorOpens = bucket.DoorCount.value;
                            if (doorOpens <= 10 * days) {
                                ids.push(bucket.key);
                            }
                        });
                    }
                }
            }
            //Data > Data Downloaded 
            if (searchParams.DataDownloaded) {
                if (resp.aggregations) {
                    if (Array.isArray(searchParams.DataDownloaded)) {
                        searchParams.DataDownloaded.forEach(function (band) {
                            if (band == "1") {
                                resp.aggregations.ids.buckets.forEach(function (bucket) {
                                    ids.push(bucket.key);
                                });

                            }

                            if (band == "2") {
                                if (searchParams.NewAssetId) {
                                    searchParams.NewAssetId.forEach(function (value) {
                                        var flag = resp.aggregations.ids.buckets.filter(function (val) {
                                            return val.key == value
                                        });
                                        if (flag.length == 0) {
                                            ids.push(value);
                                        }
                                    });
                                } else {
                                    searchParams.NoDataAssetIds.forEach(function (value) {
                                        var flag = resp.aggregations.ids.buckets.filter(function (val) {
                                            return val.key == value
                                        });
                                        if (flag.length == 0) {
                                            ids.push(value);
                                        }
                                    });
                                }
                            }
                        });
                    } else {
                        if (searchParams.DataDownloaded == "1") {
                            resp.aggregations.ids.buckets.forEach(function (bucket) {
                                ids.push(bucket.key);
                            });

                        }

                        if (searchParams.DataDownloaded == "2") {
                            if (searchParams.NewAssetId) {
                                searchParams.NewAssetId.forEach(function (value) {
                                    var flag = resp.aggregations.ids.buckets.filter(function (val) {
                                        return val.key == value
                                    });
                                    if (flag.length == 0) {
                                        ids.push(value);
                                    }
                                });
                            } else {
                                searchParams.NoDataAssetIds.forEach(function (value) {
                                    var flag = resp.aggregations.ids.buckets.filter(function (val) {
                                        return val.key == value
                                    });
                                    if (flag.length == 0) {
                                        ids.push(value);
                                    }
                                });
                            }
                        }
                    }
                }
            }

            if (searchParams.LastDataDownloaded) {
                if (resp.aggregations) {

                    var DataAggs = resp.aggregations;
                    if (Array.isArray(searchParams.LastDataDownloaded)) {
                        searchParams.LastDataDownloaded.forEach(function (band) {
                            if (band == "4") {
                                DataAggs.Last30Days.Last30Days.buckets.forEach(function (bucket) {
                                    ids.push(bucket.key);
                                });
                            }

                            if (band == "3") {
                                DataAggs.Last60Days.Last60Days.buckets.forEach(function (bucket) {
                                    ids.push(bucket.key);
                                });
                            }

                            if (band == "2") {
                                DataAggs.Last90Days.Last90Days.buckets.forEach(function (bucket) {
                                    ids.push(bucket.key);
                                });
                            }

                            if (band == "1") {
                                var ovell = [];
                                DataAggs.Last30Days.Last30Days.buckets.forEach(function (value) {
                                    ovell.push(value);
                                });
                                DataAggs.Last60Days.Last60Days.buckets.forEach(function (value) {
                                    ovell.push(value);
                                });
                                DataAggs.Last90Days.Last90Days.buckets.forEach(function (value) {
                                    ovell.push(value);
                                });
                                //var moreThen90Days = resp.aggregations.MoreThen90Days.MoreThen90Days.buckets;

                                searchParams.NoDataAssetIds.forEach(function (value) {
                                    var flag = ovell.filter(function (val) {
                                        return val.key == value
                                    });
                                    if (flag.length == 0) {
                                        ids.push(value);
                                    }
                                });
                            }
                        })
                    } else {
                        if (searchParams.LastDataDownloaded == "4") {
                            DataAggs.Last30Days.Last30Days.buckets.forEach(function (bucket) {
                                ids.push(bucket.key);
                            });
                        }

                        if (searchParams.LastDataDownloaded == "3") {
                            DataAggs.Last60Days.Last60Days.buckets.forEach(function (bucket) {
                                ids.push(bucket.key);
                            });
                        }

                        if (searchParams.LastDataDownloaded == "2") {
                            DataAggs.Last90Days.Last90Days.buckets.forEach(function (bucket) {
                                ids.push(bucket.key);
                            });
                        }

                        if (searchParams.LastDataDownloaded == "1") {
                            var ovell = [];
                            DataAggs.Last30Days.Last30Days.buckets.forEach(function (value) {
                                ovell.push(value);
                            });
                            DataAggs.Last60Days.Last60Days.buckets.forEach(function (value) {
                                ovell.push(value);
                            });
                            DataAggs.Last90Days.Last90Days.buckets.forEach(function (value) {
                                ovell.push(value);
                            });
                            //var moreThen90Days = resp.aggregations.MoreThen90Days.MoreThen90Days.buckets;

                            searchParams.NoDataAssetIds.forEach(function (value) {
                                var flag = ovell.filter(function (val) {
                                    return val.key == value
                                });
                                if (flag.length == 0) {
                                    ids.push(value);
                                }
                            });
                        }
                    }
                }
            }
            //=============for Data Download by Outlet=======================//
            if (searchParams.DataDownloadOutlet) {
                if (resp.aggregations) {
                    var locationDays = 0,
                        AllhealthCount = [];
                    var band = searchParams.DataDownloadOutlet;
                    var startDate = moment(searchParams.startDate).format('YYYY-MM-DD[T00:00:00]');
                    var endDate = moment(searchParams.endDate).format('YYYY-MM-DD[T23:59:59]');
                    var duration = moment.duration(moment(endDate).diff(moment(startDate))).asDays();
                    resp.aggregations.Locations.buckets.forEach(function (data) {
                        AllhealthCount.push(data.key);
                        locationDays = data.HealthDays.buckets.length;
                        if (Array.isArray(searchParams.DataDownloadOutlet)) {
                            searchParams.DataDownloadOutlet.forEach(function (band2) {
                                if (locationDays == Math.round(duration) && band2 == "1") {
                                    ids.push(data.key);
                                } else if (locationDays != Math.round(duration) && band2 == "2") {
                                    ids.push(data.key);
                                }
                            });
                        } else {
                            if (locationDays == Math.round(duration) && band == "1") {
                                ids.push(data.key);
                            } else if (locationDays != Math.round(duration) && band == "2") {
                                ids.push(data.key);
                            }
                        }
                    });
                    if (band == "3") {
                        for (var w = 0; w < searchParams.LocationId.length; w++) // check length of common words 
                        {
                            var loc = AllhealthCount.filter(data => data == searchParams.LocationId[w]);
                            if (loc.length == 0) {
                                ids.push(searchParams.LocationId[w]);
                            }
                        }
                    }
                }
            }

            if (searchParams.coolerTrackingProximity) {
                var DataAggs = resp.aggregations;
                if (searchParams.coolerTrackingProximity.indexOf('1') != -1) {
                    DataAggs.ProximityNotVisited.Assets.buckets.forEach(function (element) {
                        var Key = element.key;
                        ids.push(Key);
                    });
                }

                if (searchParams.coolerTrackingProximity.indexOf('4') != -1) {
                    DataAggs.ProximityLocationConfirmed.Assets.buckets.forEach(function (element) {
                        var Key = element.key;
                        ids.push(Key);
                    });
                }
            }

            if (searchParams.coolerTracking) {
                // var dbAggs = data.db.aggregations;
                //var totalAssets = dbAggs.AssetCount.doc_count;
                var DataAggs = resp.aggregations;


                if (searchParams.coolerTracking.indexOf('1') != -1) {

                    DataAggs.AlwaysNotTransmitting.Assets.buckets.forEach(function (element) {
                        var Key = element.key;
                        ids.push(Key);
                    });
                }

                if (searchParams.coolerTracking.indexOf('2') != -1) {
                    DataAggs.AlwaysWrongLocation.Assets.buckets.forEach(function (element) {
                        var Key = element.key;
                        ids.push(Key);
                    });

                }

                if (searchParams.coolerTracking.indexOf('3') != -1) {
                    DataAggs.AlwaysLocationAsExpected.Assets.buckets.forEach(function (element) {
                        var Key = element.key;
                        ids.push(Key);
                    });
                }

            }

        } else if (searchParams.fromMovementScreen) {
            if (resp.aggregations) {
                var DataAggs = resp.aggregations;
                if (searchParams.DisplacementFilter.indexOf('0') != -1) {

                    DataAggs.DisplacementInKmLT0P5.DisplacementInKmLT0P5.buckets.forEach(function (element) {
                        var Key = element.key;
                        ids.push(Key);
                    });
                }

                if (searchParams.DisplacementFilter.indexOf('1') != -1) {
                    DataAggs.DisplacementInKmGTIsEqToP5AndLTIsEqTo1.DisplacementInKmGTIsEqToP5AndLTIsEqTo1.buckets.forEach(function (element) {
                        var Key = element.key;
                        ids.push(Key);
                    });

                }

                if (searchParams.DisplacementFilter.indexOf('2') != -1) {
                    DataAggs.DisplacementInKmGTIsEqTo1.DisplacementInKmGTIsEqTo1.buckets.forEach(function (element) {
                        var Key = element.key;
                        ids.push(Key);
                    });
                }
            }
        } else if (searchParams.fromMovementScreenHistoric) {
            var assetIds = [];
            resp.aggregations.ids.buckets.forEach(function (data) {
                ids.push(data.key);
            });
        } else {
            //alert filters
            // if (searchParams.StatusId || searchParams.PriorityId || searchParams.AlertTypeId) {
            //     if (resp.aggregations) {
            //         resp.aggregations.PriorityCount.AssetId.AssetId.buckets.forEach(function (assetBucket) {
            //             ids.push(assetBucket.key);
            //         });
            //     }
            // } else {
            if (field) {
                var aggs = resp.aggregations.ids.buckets;
                ids = aggs.map(function (row) {
                    return row.key
                });
            } else {
                var hits = resp.hits.hits;
                ids = hits.map(function (hit) {
                    return hit._id;
                });
            }
            //  }
        }
        //}
        if (field == "AssetId") {
            //var id = request.auth.credentials.sid;
            return new Promise(function (resolve) {
                elasticClient.index({
                    index: 'cooler-iot-ctfassets',
                    id: idcontext,
                    type: 'assets',
                    body: {
                        "AssetId": ids
                    }
                }, function (err, resp, status) {
                    return resolve(ids);

                });
            });

        } else if (field == "LocationId") {
            return new Promise(function (resolve) {
                elasticClient.index({
                    index: 'cooler-iot-ctflocations',
                    id: idcontext,
                    type: 'locations',
                    body: {
                        "LocationId": ids
                    }
                }, function (err, resp, status) {
                    return resolve(ids);

                });
            });
        } else {
            return ids;
        }

    }

    /**
     * Creates a function for join
     * @param {Object} context - Context from which to read security info
     * @param {Object} params - List of search parameters
     * @param {String} field - Field to aggregate. Defaults to _id
     * @param {Boolean} remove - Whether to remove these properties from params. Defaults to true
     * @return {Function} new function
     */

    reduce(context, params, field, remove) {
        idcontext = context.auth.credentials.sid;
        remove = remove !== false;
        var ModelType = this.modelType,
            filterProperties = this.filterProperties,
            field = field || this.field,
            searchBody;
        var model = new ModelType();

        //var field = this.field;

        if (field) {
            searchBody = {
                size: 0,
                aggs: {
                    "ids": {
                        "terms": {
                            "field": field,
                            "size": 200000
                        }
                    }
                }
            };
        } else {
            searchBody = {
                //fields: [],
                size: 500000
            };
        }

        var listResultProcessor = this.listResultProcessor.bind(this, field),
            extraParams = this.extraParams;

        return new Promise(function (resolve, reject) {

            var validParams = Object.assign({}, extraParams),
                isRelevant = false;
            filterProperties.forEach(function (filterProperty) {
                let paramName = filterProperty.paramName,
                    propertyName = filterProperty.propertyName;
                if (params.hasOwnProperty(paramName) || params.hasOwnProperty("search_" + paramName) || params.hasOwnProperty(paramName + "[]")) {
                    if (params["search_" + paramName]) {
                        validParams["search_" + paramName] = params["search_" + paramName];
                    } else {
                        validParams[paramName.replace(paramName, propertyName)] = params[paramName] || params[paramName + "[]"] || params["search_" + paramName];
                    }
                    if (filterProperty.keepValue !== true && filterProperty.optional !== true) {
                        params[paramName] = undefined;
                    }
                    if (!isRelevant && filterProperty.optional !== true) {
                        isRelevant = true;
                    }
                }
            });

            // If no need to filter based on Ids, return null
            if (!isRelevant) {
                return resolve(null);
            }
            model.list(context, validParams, searchBody, listResultProcessor).then(function (result) {

                console.log("--------------------------------Reducer log --------------------------------");
                console.log(JSON.stringify(searchBody));

                return resolve(result);
            }).catch(function (err) {
                console.log(err);
                return reject(err);
            });
        });
    }
};

module.exports = Reducer;