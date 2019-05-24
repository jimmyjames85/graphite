'use strict';

System.register(['lodash', './api_service', './time_service', './templating_service'], function (_export, _context) {
    "use strict";

    var _, ApiService, TimeService, TemplatingService, _createClass, MetricsService, metricsCache;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    return {
        setters: [function (_lodash) {
            _ = _lodash.default;
        }, function (_api_service) {
            ApiService = _api_service.default;
        }, function (_time_service) {
            TimeService = _time_service.default;
        }, function (_templating_service) {
            TemplatingService = _templating_service.default;
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

            MetricsService = function () {
                function MetricsService() {
                    _classCallCheck(this, MetricsService);
                }

                _createClass(MetricsService, null, [{
                    key: 'findMetrics',
                    value: function findMetrics(backend) {
                        if (metricsCache.isValid()) {
                            return backend.backendSrv.$q.when(metricsCache.data);
                        } else if (metricsCache.isLoading()) {
                            return metricsCache.promise;
                        } else {
                            return metricsCache.load(ApiService.send(backend, {
                                url: 'api/data/metrics?light=true'
                            }).then(function (result) {
                                var plottableMetricTypes = ['%', 'byte', 'date', 'int', 'number', 'relativeTime'];

                                return Object.values(result.data).map(function (metric) {
                                    return _.assign(metric, {
                                        isNumeric: plottableMetricTypes.indexOf(metric.type) >= 0
                                    });
                                }).sort(function (a, b) {
                                    return a.id.localeCompare(b.id);
                                });
                            }).then(function (data) {
                                metricsCache.setData(data);

                                return data;
                            }));
                        }
                    }
                }, {
                    key: 'findSegmentations',
                    value: function findSegmentations(backend, metric) {
                        if (metric) {
                            return ApiService.send(backend, {
                                url: 'api/data/metrics/' + metric + '/segmentationMetrics'
                            }).then(function (result) {
                                if (result.data.segmentationMetrics) {
                                    return result.data.segmentationMetrics.sort(function (a, b) {
                                        return a.localeCompare(b);
                                    });
                                } else {
                                    return [];
                                }
                            });
                        } else {
                            return backend.backendSrv.$q.when([]);
                        }
                    }
                }, {
                    key: 'queryMetrics',
                    value: function queryMetrics(backend, templateSrv, query, options) {
                        var queryOptions = void 0;
                        if ((queryOptions = TemplatingService.validateLabelValuesQuery(query)) !== null) {
                            //
                            // return list of label values
                            //
                            var evaluateUserTime = void 0;
                            if (options.userTime === null) {
                                evaluateUserTime = TimeService.queryTimelines(backend).then(function (_ref) {
                                    var timelines = _ref.timelines;

                                    if (timelines.agents.filter(function (t) {
                                        return t.from !== null && t.to !== null;
                                    }).length > 0) {
                                        return {
                                            from: (timelines.agents[0].to - timelines.agents[0].sampling) / 1000000,
                                            to: timelines.agents[0].to / 1000000,
                                            sampling: timelines.agents[0].sampling / 1000000
                                        };
                                    } else {
                                        return backend.backendSrv.$q.reject('Unable to query metrics (data not available)');
                                    }
                                });
                            } else {
                                evaluateUserTime = backend.backendSrv.$q.resolve(options.userTime);
                            }

                            return evaluateUserTime.then(function (userTime) {
                                return TimeService.validateTimeWindow(backend, userTime);
                            }).then(function (requestTime) {
                                return ApiService.send(backend, {
                                    method: 'POST',
                                    url: 'api/data/entity/metadata',
                                    data: {
                                        time: {
                                            from: requestTime.from * 1000000,
                                            to: requestTime.to * 1000000
                                        },
                                        metrics: [queryOptions.labelName],
                                        filter: TemplatingService.resolveQueryVariables(queryOptions.filter, templateSrv),
                                        paging: { from: queryOptions.from, to: queryOptions.to }
                                    }
                                });
                            }).then(function (result) {
                                return result.data.data.map(function (d) {
                                    return d[queryOptions.labelName];
                                });
                            });
                        } else if ((queryOptions = TemplatingService.validateLabelNamesQuery(query)) !== null) {
                            //
                            // return list of label names
                            //
                            return this.findMetrics(backend).then(function (result) {
                                return result
                                // filter out all tags/labels/other string metrics
                                .filter(function (metric) {
                                    return metric.isNumeric === false && queryOptions.regex.test(metric.id);
                                }).map(function (metric) {
                                    return metric.id;
                                });
                            });
                        } else if ((queryOptions = TemplatingService.validateMetricsQuery(query)) !== null) {
                            //
                            // return list of metric names
                            //
                            return this.findMetrics(backend).then(function (result) {
                                return result
                                // filter out all non tags/labels/other string metrics
                                .filter(function (metric) {
                                    return metric.isNumeric && queryOptions.regex.test(metric.id);
                                }).map(function (metric) {
                                    return metric.id;
                                });
                            });
                        } else {
                            return backend.backendSrv.$q.when([]);
                        }
                    }
                }]);

                return MetricsService;
            }();

            _export('default', MetricsService);

            metricsCache = {
                timestamp: null,
                data: null,
                promise: null,
                load: function load(promise) {
                    this.promise = promise;
                    return promise;
                },
                setData: function setData(data) {
                    this.timestamp = Date.now();
                    this.data = data;
                    this.promise = null;
                },
                isLoading: function isLoading() {
                    return this.isValid() === false && this.promise !== null;
                },
                isValid: function isValid() {
                    return this.timestamp !== null && this.timestamp >= Date.now() - 60000;
                }
            };
        }
    };
});
//# sourceMappingURL=metrics_service.js.map
