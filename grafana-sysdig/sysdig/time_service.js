'use strict';

System.register(['./api_service'], function (_export, _context) {
    "use strict";

    var ApiService, _createClass, DataService;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function getRequestTime(timelines, alignments, userTime) {
        console.assert(userTime && userTime.from && userTime.to, 'Argument userTime is missing');
        if (!(userTime && userTime.from && userTime.to)) {
            return null;
        }

        var fromUs = userTime.from * 1000000;
        var toUs = userTime.to * 1000000;
        var timespan = toUs - fromUs;

        //
        // Use alignments that allow the required timespan
        //
        var validAlignments = alignments.filter(function (a) {
            return timespan <= a.max * 1000000;
        });

        if (validAlignments.length === 0) {
            return null;
        }

        //
        // Set min sampling
        //
        var minSampling = validAlignments[0].sampling * 1000000;

        //
        // Filter timelines so that sampling is valid, and the requested time window is partially or
        // entirely overlapping with a given timeline
        //
        var validTimelines = timelines.agents.filter(function (t) {
            return t.from !== null && t.to !== null && minSampling <= t.sampling && (fromUs <= t.from && toUs >= t.from || fromUs >= t.from && toUs <= t.to || fromUs <= t.to && toUs >= t.to);
        });

        if (validTimelines.length === 0) {
            return null;
        }

        //
        // Align time window with required alignment
        //
        var alignTo = validAlignments[0].alignTo * 1000000;
        var alignedFrom = Math.trunc(Math.trunc(fromUs / alignTo) * alignTo / 1000000);
        var alignedTo = Math.trunc(Math.trunc(toUs / alignTo) * alignTo / 1000000);

        //
        // Adjust time window according to timeline (might miss first or last portion)
        //
        var requestTime = {
            from: Math.max(alignedFrom, validTimelines[0].from / 1000000),
            to: Math.min(alignedTo, validTimelines[0].to / 1000000)
        };

        if (userTime.sampling) {
            requestTime.sampling = Math.trunc(minSampling / 1000000);
        }

        return requestTime;
    }
    return {
        setters: [function (_api_service) {
            ApiService = _api_service.default;
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

            DataService = function () {
                function DataService() {
                    _classCallCheck(this, DataService);
                }

                _createClass(DataService, null, [{
                    key: 'validateTimeWindow',
                    value: function validateTimeWindow(backend, userTime) {
                        var q = backend.backendSrv.$q;

                        return q.all([ApiService.send(backend, {
                            url: 'api/history/timelines'
                        }), ApiService.send(backend, {
                            url: 'api/v2/history/timelines/alignments'
                        })]).then(function (responses) {
                            var requestTime = getRequestTime(responses[0].data, responses[1].data, userTime);

                            if (requestTime) {
                                return requestTime;
                            } else {
                                return q.reject('Unable to validate request time');
                            }
                        });
                    }
                }, {
                    key: 'queryTimelines',
                    value: function queryTimelines(backend) {
                        var q = backend.backendSrv.$q;

                        return q.all([ApiService.send(backend, {
                            url: 'api/history/timelines'
                        }), ApiService.send(backend, {
                            url: 'api/v2/history/timelines/alignments'
                        })]).then(function (responses) {
                            return {
                                timelines: responses[0].data,
                                alignments: responses[1].data
                            };
                        });
                    }
                }]);

                return DataService;
            }();

            _export('default', DataService);
        }
    };
});
//# sourceMappingURL=time_service.js.map
