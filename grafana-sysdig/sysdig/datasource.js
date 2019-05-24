'use strict';

System.register(['lodash', './data_service', './api_service', './metrics_service', './templating_service', './formatter_service'], function (_export, _context) {
    "use strict";

    var _, DataService, ApiService, MetricsService, TemplatingService, FormatterService, _createClass, SysdigDatasource;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function convertRangeToUserTime(range, intervalMs) {
        if (range) {
            var userTime = {
                from: Math.trunc(range.from.valueOf() / 1000),
                to: Math.trunc(range.to.valueOf() / 1000)
            };

            if (intervalMs) {
                userTime.sampling = Math.max(Math.trunc(intervalMs / 1000), 1);
            }

            return userTime;
        } else {
            return null;
        }
    }
    return {
        setters: [function (_lodash) {
            _ = _lodash.default;
        }, function (_data_service) {
            DataService = _data_service.default;
        }, function (_api_service) {
            ApiService = _api_service.default;
        }, function (_metrics_service) {
            MetricsService = _metrics_service.default;
        }, function (_templating_service) {
            TemplatingService = _templating_service.default;
        }, function (_formatter_service) {
            FormatterService = _formatter_service.default;
        }],
        execute: function () {
            _createClass = function () {
                function defineProperties(target, props) {
                    for (var i = 0; i < props.length; i++) {
                        var descriptor = props[i];
                        descriptor.enumerable = descriptor.enumerable || false;
                        descriptor.configurable = true;
                        if ("value" in descriptor) descriptor.writable = true;
                        Object.defineProperty(target, descriptor.key, descriptor);
                    }
                }

                return function (Constructor, protoProps, staticProps) {
                    if (protoProps) defineProperties(Constructor.prototype, protoProps);
                    if (staticProps) defineProperties(Constructor, staticProps);
                    return Constructor;
                };
            }();

            _export('SysdigDatasource', SysdigDatasource = function () {
                function SysdigDatasource(instanceSettings, $q, backendSrv, templateSrv) {
                    _classCallCheck(this, SysdigDatasource);

                    this.name = instanceSettings.name;
                    this.q = $q;
                    this.backendSrv = backendSrv;
                    this.templateSrv = templateSrv;
                    this.url = instanceSettings.url;
                    this.access = 'proxy';

                    this.apiToken = instanceSettings.jsonData ? instanceSettings.jsonData.apiToken : '';
                    this.headers = {
                        'Content-Type': 'application/json',
                        'X-Sysdig-Product': 'SDC',
                        Authorization: 'Bearer ' + this.apiToken
                    };
                }

                _createClass(SysdigDatasource, [{
                    key: 'getBackendConfiguration',
                    value: function getBackendConfiguration() {
                        return {
                            backendSrv: this.backendSrv,
                            withCredentials: this.withCredentials,
                            headers: this.headers,
                            apiToken: this.apiToken,
                            url: this.url
                        };
                    }
                }, {
                    key: 'testDatasource',
                    value: function testDatasource() {
                        return ApiService.send(this.getBackendConfiguration(), {
                            url: 'api/login'
                        }).then(function (response) {
                            if (response.status === 200) {
                                return { status: 'success', message: 'Data source is working', title: 'Success' };
                            }
                        });
                    }
                }, {
                    key: 'query',
                    value: function query(options) {
                        var query = this.buildQueryParameters(options);
                        query.targets = query.targets.filter(function (t) {
                            return !t.hide;
                        });

                        if (query.targets.length <= 0) {
                            return this.q.when({ data: [] });
                        }

                        return DataService.fetch(this.getBackendConfiguration(), query, convertRangeToUserTime(options.range, query.intervalMs));
                    }
                }, {
                    key: 'buildQueryParameters',
                    value: function buildQueryParameters(options) {
                        var _this = this;

                        //remove placeholder targets
                        options.targets = _.filter(options.targets, function (target) {
                            return target.target !== 'select metric';
                        });

                        var targets = _.map(options.targets, function (target, i, targets) {
                            if (target.target === undefined) {
                                // here's the query control panel sending the first request with empty configuration
                                return Object.assign({}, target, {
                                    target: 'net.bytes.total',
                                    timeAggregation: 'timeAvg',
                                    groupAggregation: 'avg',
                                    filter: undefined,
                                    pageLimit: 10
                                });
                            } else {
                                var isTabularFormat = targets[0].isTabularFormat;
                                var targetOptions = {
                                    segmentBy: isTabularFormat === false ? target.segmentBy : targets[0].segmentBy,
                                    filter: isTabularFormat === false ? target.filter : targets[0].filter,

                                    // pagination configuration is set for first target only
                                    pageLimit: targets[0].pageLimit,
                                    sortDirection: targets[0].sortDirection,

                                    // "single data point" configuration is set for first target only
                                    isSingleDataPoint: isTabularFormat || targets[0].isSingleDataPoint
                                };

                                if (targetOptions.segmentBy && Array.isArray(targetOptions.segmentBy) === false) {
                                    // backwards compatibility: up to v0.3 one segmentation was supported only
                                    targetOptions.segmentBy = [targetOptions.segmentBy];
                                }

                                return Object.assign({}, target, targetOptions, {
                                    target: TemplatingService.replaceSingleMatch(_this.templateSrv, target.target, options.scopedVars),
                                    segmentBy: targetOptions.segmentBy ? targetOptions.segmentBy.map(function (segmentBy) {
                                        return TemplatingService.replaceSingleMatch(_this.templateSrv, segmentBy, options.scopedVars);
                                    }) : null,
                                    filter: TemplatingService.replace(_this.templateSrv, targetOptions.filter, options.scopedVars),

                                    pageLimit: Number.parseInt(targetOptions.pageLimit) || 10
                                });
                            }
                        });

                        options.targets = targets;

                        return options;
                    }
                }, {
                    key: 'metricFindQuery',
                    value: function metricFindQuery(query, options) {
                        var _this2 = this;

                        var normOptions = Object.assign({ areLabelsIncluded: false, range: null, variable: null }, options);

                        if (query) {
                            return MetricsService.queryMetrics(this.getBackendConfiguration(), this.templateSrv, query, { userTime: convertRangeToUserTime(normOptions.range) }).then(function (result) {
                                return result.sort(_this2.getLabelValuesSorter(normOptions.variable.sort)).map(function (labelValue) {
                                    return {
                                        text: FormatterService.formatLabelValue(labelValue)
                                    };
                                });
                            });
                        } else {
                            return MetricsService.findMetrics(this.getBackendConfiguration())
                            // filter out all tags/labels/other string metrics
                            .then(function (result) {
                                if (normOptions.areLabelsIncluded) {
                                    return result;
                                } else {
                                    return result.filter(function (metric) {
                                        return metric.isNumeric;
                                    });
                                }
                            });
                        }
                    }
                }, {
                    key: 'findSegmentBy',
                    value: function findSegmentBy(target) {
                        if (target === undefined || target === 'select metric') {
                            return MetricsService.findSegmentations(this.getBackendConfiguration(), null);
                        } else {
                            return MetricsService.findSegmentations(this.getBackendConfiguration(), TemplatingService.replaceSingleMatch(this.templateSrv, target));
                        }
                    }
                }, {
                    key: 'getLabelValuesSorter',
                    value: function getLabelValuesSorter(mode) {
                        switch (mode) {
                            case 0: // disabled
                            case 1:
                                // alphabetical (asc)
                                return function (a, b) {
                                    if (a === null) return -1;else if (b === null) return 1;else return a.localeCompare(b);
                                };

                            case 3:
                                // numerical (asc)
                                return function (a, b) {
                                    if (a === null) return -1;else if (b === null) return 1;else return a - b;
                                };

                            case 2:
                                // alphabetical (desc)
                                return function (a, b) {
                                    if (a === null) return -1;else if (b === null) return 1;else return a.localeCompare(b);
                                };

                            case 4:
                                // numerical (desc)
                                return function (a, b) {
                                    if (a === null) return -1;else if (b === null) return 1;else return a - b;
                                };

                            case 5:
                                // alphabetical, case insensitive (asc)
                                return function (a, b) {
                                    if (a === null) return -1;else if (b === null) return 1;else return a.localeCompare(b);
                                };

                            case 6:
                                // alphabetical, case insensitive (desc)
                                return function (a, b) {
                                    if (a === null) return -1;else if (b === null) return 1;else return a.toLowerCase().localeCompare(b.toLowerCase());
                                };
                        }
                    }
                }, {
                    key: 'annotationQuery',
                    value: function annotationQuery() {
                        // const query = this.templateSrv.replace(options.annotation.query, {}, 'glob');
                        // const annotationQuery = {
                        //     range: options.range,
                        //     annotation: {
                        //         name: options.annotation.name,
                        //         datasource: options.annotation.datasource,
                        //         enable: options.annotation.enable,
                        //         iconColor: options.annotation.iconColor,
                        //         query: query
                        //     },
                        //     rangeRaw: options.rangeRaw
                        // };

                        // TODO Not supported yet
                        return this.q.when([]);
                    }
                }, {
                    key: 'doRequest',
                    value: function doRequest(options) {
                        return ApiService.send(this.getBackendConfiguration(), options);
                    }
                }]);

                return SysdigDatasource;
            }());

            _export('SysdigDatasource', SysdigDatasource);
        }
    };
});
//# sourceMappingURL=datasource.js.map
