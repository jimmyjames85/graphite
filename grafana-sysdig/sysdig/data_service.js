'use strict';

System.register(['lodash', './api_service', './time_service', './formatter_service'], function (_export, _context) {
    "use strict";

    var _, ApiService, TimeService, FormatterService, _createClass, fetchQueue, DataService;

    function _toConsumableArray(arr) {
        if (Array.isArray(arr)) {
            for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
                arr2[i] = arr[i];
            }

            return arr2;
        } else {
            return Array.from(arr);
        }
    }

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function getBatchId(userTime) {
        return userTime.from + ' - ' + userTime.to + ' - ' + userTime.sampling;
    }

    function getRequests(options, requestTime) {
        return options.targets.map(function (target) {
            return getRequest(target, requestTime);
        });
    }

    function getRequest(target, requestTime) {
        if (requestTime) {
            return {
                format: {
                    type: 'data'
                },
                time: getTime(),
                metrics: getMetrics(),
                sort: getSort(),
                paging: getPaging(),
                scope: target.filter,
                group: {
                    aggregations: {
                        v0: target.timeAggregation
                    },
                    groupAggregations: {
                        v0: target.groupAggregation
                    },
                    by: getGroupBy(),
                    configuration: {
                        groups: []
                    }
                }
            };
        } else {
            return null;
        }

        function getTime() {
            return {
                from: requestTime.from * 1000000,
                to: requestTime.to * 1000000,
                sampling: (target.isSingleDataPoint ? requestTime.to - requestTime.from : requestTime.sampling) * 1000000
            };
        }
        function getMetrics() {
            if (target.isSingleDataPoint) {
                var metrics = {
                    v0: target.target
                };

                if (target.segmentBy) {
                    target.segmentBy.forEach(function (segmentBy, i) {
                        metrics['k' + i] = segmentBy;
                    });
                }

                return metrics;
            } else {
                var _metrics = {
                    k0: 'timestamp',
                    v0: target.target
                };

                if (target.segmentBy) {
                    target.segmentBy.forEach(function (segmentBy, i) {
                        _metrics['k' + (i + 1)] = segmentBy;
                    });
                }

                return _metrics;
            }
        }

        function getSort() {
            var sortDirection = target.sortDirection || 'desc';

            var sort = void 0;

            if (target.isTabularFormat === false) {
                sort = [{ v0: sortDirection }, { k0: sortDirection }];

                if (target.segmentBy) {
                    sort.push({ k1: sortDirection });
                }
            } else {
                // sort table by first label, let Grafana to sort the final table then
                sort = [{ k0: sortDirection }];
            }

            return sort;
        }

        function getPaging() {
            return {
                from: 0,
                to: (target.pageLimit || 10) - 1
            };
        }

        function getGroupBy() {
            if (target.isSingleDataPoint) {
                var groupBy = [];

                if (target.segmentBy) {
                    target.segmentBy.forEach(function (segmentBy, i) {
                        groupBy.push({
                            metric: 'k' + i
                        });
                    });
                }

                return groupBy;
            } else {
                var _groupBy = [{
                    metric: 'k0',
                    value: requestTime.sampling * 1000000
                }];

                if (target.segmentBy) {
                    target.segmentBy.forEach(function (segmentBy, i) {
                        _groupBy.push({
                            metric: 'k' + (i + 1)
                        });
                    });
                }

                return _groupBy;
            }
        }
    }

    function parseResponses(options, response) {
        var isTabularFormat = options.targets[0].isTabularFormat;
        var isSingleTarget = options.targets.length === 1;
        var data = options.targets.map(function (target, i) {
            var isSingleDataPoint = target.isSingleDataPoint;

            if (response[i].data) {
                var map = response[i].data.reduce(function (acc, d) {
                    var keys = response[i].group.by.map(function (group) {
                        return group['metric'];
                    })
                    // assume timestamp is always the first one, ie. k0
                    .slice(isSingleDataPoint ? 0 : 1);

                    var t = void 0;
                    if (target.segmentBy) {
                        var segmentNames = keys.map(function (segment) {
                            return FormatterService.formatLabelValue(d[segment]);
                        }).join(' - ');

                        if (isTabularFormat || isSingleTarget) {
                            t = segmentNames;
                        } else {
                            t = FormatterService.formatLabelValue(target.target) + ' (' + segmentNames + ')';
                        }
                    } else {
                        t = FormatterService.formatLabelValue(target.target);
                    }

                    if (acc[t] === undefined) {
                        acc[t] = {
                            target: t,
                            datapoints: []
                        };
                    }

                    if (isTabularFormat) {
                        acc[t].datapoints.push([].concat(_toConsumableArray(keys.map(function (key) {
                            return d[key];
                        })), [d.v0, response[i].time.from]));
                    } else if (isSingleDataPoint) {
                        acc[t].datapoints.push([d.v0, response[i].time.from]);
                    } else {
                        acc[t].datapoints.push([d.v0, d.k0 / 1000]);
                    }

                    return acc;
                }, {});

                if (isSingleDataPoint) {
                    return Object.values(map).sort(function (a, b) {
                        if (a.datapoints[0][0] === b.datapoints[0][0]) {
                            return a.target.localeCompare(b.target);
                        } else {
                            if (target.sortDirection === 'desc') {
                                return b.datapoints[0][0] - a.datapoints[0][0];
                            } else {
                                return a.datapoints[0][0] - b.datapoints[0][0];
                            }
                        }
                    });
                } else {
                    return Object.values(map).sort(function (a, b) {
                        return a.target.localeCompare(b.target);
                    });
                }
            } else {
                return {
                    target: target.target,
                    error: response[i].errors[0]
                };
            }
        });

        if (isTabularFormat && data.length > 0) {
            var failures = data.filter(function (d) {
                return d.error;
            });
            if (failures.length > 0) {
                return { data: failures };
            }

            var targetsDataset = data[0];
            var segments = options.targets[0].segmentBy;
            var metrics = options.targets.map(function (target) {
                return target.target;
            });

            var tabularDataset = Object.assign({}, targetsDataset, {
                type: 'table',
                columns: [].concat(_toConsumableArray(segments.map(function (segmentBy) {
                    return { text: segmentBy };
                })), _toConsumableArray(metrics.map(function (metric) {
                    return { text: metric };
                }))),
                rows: targetsDataset.map(function (referenceRow, i) {
                    var referenceData = referenceRow.datapoints[0];

                    return [].concat(_toConsumableArray(referenceData.slice(0, segments.length)), [referenceData[segments.length]], _toConsumableArray(data.slice(1).map(function (d) {
                        if (d[i].target === referenceRow.target) {
                            return d[i].datapoints[0][segments.length];
                        } else {
                            // datasets could have different sets of segments; currently, no merge is performed
                            return null;
                        }
                    })));
                })
            });

            return {
                data: [Object.assign({}, data[0], tabularDataset)]
            };
        } else {
            return {
                data: _.flatten(data)
            };
        }
    }
    return {
        setters: [function (_lodash) {
            _ = _lodash.default;
        }, function (_api_service) {
            ApiService = _api_service.default;
        }, function (_time_service) {
            TimeService = _time_service.default;
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

            fetchQueue = void 0;

            DataService = function () {
                function DataService() {
                    _classCallCheck(this, DataService);
                }

                _createClass(DataService, null, [{
                    key: 'fetch',
                    value: function fetch(backend, query, userTime) {
                        var queue = this.setupTokenRequestQueue(backend.apiToken);
                        var batch = this.setupDataBatchQueue(queue, backend, userTime);

                        var promise = backend.backendSrv.$q.defer();
                        batch.requests.push({
                            query: query,
                            promise: promise
                        });

                        //
                        // Debounce fetch so that all panels' requests can be batched together
                        // Note that this function will be called synchronously once per panel
                        //
                        var scheduleFetchFn = _.debounce(this.scheduleFetch.bind(this), 0);
                        scheduleFetchFn();

                        return promise.promise;
                    }
                }, {
                    key: 'setupDataBatchQueue',
                    value: function setupDataBatchQueue(queue, backend, userTime) {
                        var batchId = getBatchId(userTime);

                        if (queue[batchId] === undefined) {
                            queue[batchId] = {
                                backend: backend,
                                userTime: userTime,
                                requests: []
                            };
                        }

                        return queue[batchId];
                    }
                }, {
                    key: 'scheduleFetch',
                    value: function scheduleFetch() {
                        var _this = this;

                        var queues = Object.values(fetchQueue);

                        // clear queue, requests will be now processed
                        fetchQueue = {};

                        queues.forEach(function (queue) {
                            Object.values(queue).forEach(function (batch) {
                                return _this.fetchBatch(batch);
                            });
                        });
                    }
                }, {
                    key: 'fetchBatch',
                    value: function fetchBatch(batch) {
                        var q = batch.backend.backendSrv.$q;

                        TimeService.validateTimeWindow(batch.backend, batch.userTime).then(function (requestTime) {
                            //
                            // get list of data requests to batch
                            //
                            var apiRequests = batch.requests.reduce(function (acc, item) {
                                return [].concat(_toConsumableArray(acc), _toConsumableArray(getRequests(item.query, requestTime)));
                            }, []);

                            //
                            // break list into 20-request chunks
                            //
                            var maxRequestCountPerChunk = 20;
                            var chunks = apiRequests.reduce(function (acc, request) {
                                if (acc.length === 0 || acc[acc.length - 1].length === maxRequestCountPerChunk) {
                                    acc.push([request]);
                                } else {
                                    acc[acc.length - 1].push(request);
                                }

                                return acc;
                            }, []);

                            if (requestTime) {
                                //
                                // send all batch requests
                                //
                                return q.all(chunks.map(function (chunk) {
                                    return ApiService.send(batch.backend, {
                                        url: 'api/data/batch',
                                        data: { requests: chunk },
                                        method: 'POST'
                                    });
                                }));
                            } else {
                                //
                                // pretend the backend returned all empty datasets
                                //
                                return chunks.map(function (chunk) {
                                    return {
                                        data: {
                                            responses: chunk.map(function () {
                                                return { data: [] };
                                            })
                                        }
                                    };
                                });
                            }
                        }).then(function (chunks) {
                            //
                            // flatten responses
                            //
                            var responses = chunks.reduce(function (acc, chunk) {
                                return [].concat(_toConsumableArray(acc), _toConsumableArray(chunk.data.responses));
                            }, []);

                            //
                            // process and resolve each query with its response(s)
                            //
                            batch.requests.forEach(function (item) {
                                var targetResponseCount = item.query.targets.length;
                                var targetResponses = responses.slice(0, targetResponseCount);

                                var parseResult = parseResponses(item.query, targetResponses);
                                var failedResults = parseResult.data.filter(function (d) {
                                    return d.error;
                                });
                                if (parseResult.data.length > 0 && failedResults.length === parseResult.data.length) {
                                    var error = failedResults[0].error;
                                    item.promise.reject({
                                        message: error.reason + ' (' + error.message + ')'
                                    });
                                } else {
                                    item.promise.resolve(parseResult);
                                }

                                responses = responses.slice(targetResponseCount);
                            });
                        }, function (error) {
                            // time window not available
                            batch.requests.forEach(function (request) {
                                request.promise.reject(error);
                            });
                        });

                        //
                        // TODO
                        //
                        // 1. Handle 200 OK with error response
                        // {
                        //   "responses" : [ {
                        //     "errors" : [ {
                        //       "reason" : "Metric not found",
                        //       "message" : "'sysdigcloud-backend.events_dropped_total' is not a Sysdig Cloud metric",
                        //       "field" : "metrics",
                        //       "rejectedValue" : [ {
                        //         "groupAggregation" : null,
                        //         "alias" : "k0",
                        //         "aggregations" : {
                        //           "time" : null,
                        //           "group" : null
                        //         },
                        //         "timeAggregation" : null,
                        //         "metric" : "timestamp"
                        //       }, {
                        //         "groupAggregation" : "concat",
                        //         "alias" : "v0",
                        //         "aggregations" : {
                        //           "time" : "concat",
                        //           "group" : "concat"
                        //         },
                        //         "timeAggregation" : "concat",
                        //         "metric" : "sysdigcloud-backend.events_dropped_total"
                        //       } ]
                        //     } ]
                        //   } ]
                        // }
                        //
                        // 2. Handle error like 500 Internal Server Error
                        //
                    }
                }, {
                    key: 'setupTokenRequestQueue',
                    value: function setupTokenRequestQueue(apiToken) {
                        if (fetchQueue === undefined) {
                            fetchQueue = {};
                        }

                        if (fetchQueue[apiToken] === undefined) {
                            fetchQueue[apiToken] = {};
                        }

                        return fetchQueue[apiToken];
                    }
                }]);

                return DataService;
            }();

            _export('default', DataService);
        }
    };
});
//# sourceMappingURL=data_service.js.map
