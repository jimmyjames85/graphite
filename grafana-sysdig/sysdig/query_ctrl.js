'use strict';

System.register(['app/plugins/sdk', './css/query-editor.css!'], function (_export, _context) {
    "use strict";

    var QueryCtrl, _createClass, SysdigDatasourceQueryCtrl;

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

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    return {
        setters: [function (_appPluginsSdk) {
            QueryCtrl = _appPluginsSdk.QueryCtrl;
        }, function (_cssQueryEditorCss) {}],
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

            _export('SysdigDatasourceQueryCtrl', SysdigDatasourceQueryCtrl = function (_QueryCtrl) {
                _inherits(SysdigDatasourceQueryCtrl, _QueryCtrl);

                function SysdigDatasourceQueryCtrl($scope, $injector) {
                    _classCallCheck(this, SysdigDatasourceQueryCtrl);

                    var _this = _possibleConstructorReturn(this, (SysdigDatasourceQueryCtrl.__proto__ || Object.getPrototypeOf(SysdigDatasourceQueryCtrl)).call(this, $scope, $injector));

                    _this.scope = $scope;
                    _this.target.target = _this.target.target || 'net.bytes.total';
                    _this.target.timeAggregation = _this.target.timeAggregation || 'timeAvg';
                    _this.target.groupAggregation = _this.target.groupAggregation || 'avg';

                    if (_this.target.segmentBy) {
                        if (Array.isArray(_this.target.segmentBy) === false) {
                            _this.target.segmentBy = [_this.target.segmentBy];
                        }
                    } else {
                        _this.target.segmentBy = [];
                    }

                    _this.target.sortDirection = _this.target.sortDirection || 'desc';
                    _this.target.pageLimit = _this.target.pageLimit || 10;

                    // enforce tabular format to be applied when the panel type is a table
                    _this.target.isTabularFormat = _this.panel.type === 'table';

                    _this.segmentByItems = _this.calculateSegmentByItems();
                    return _this;
                }

                _createClass(SysdigDatasourceQueryCtrl, [{
                    key: 'isFirstTarget',
                    value: function isFirstTarget() {
                        return this.panel.targets.indexOf(this.target) === 0;
                    }
                }, {
                    key: 'getMetricOptions',
                    value: function getMetricOptions() {
                        var parseMetric = void 0;
                        var options = {
                            areLabelsIncluded: this.panel.type === 'table'
                        };

                        if (this.panel.type !== 'table') {
                            parseMetric = function parseMetric(m) {
                                return { text: m.id, value: m.id };
                            };
                        } else {
                            parseMetric = function parseMetric(m) {
                                if (m.isNumeric) {
                                    return { text: '(#) ' + m.id, value: m.id };
                                } else {
                                    return { text: '(A) ' + m.id, value: m.id };
                                }
                            };
                        }

                        return this.datasource.metricFindQuery(null, options).then(function (data) {
                            return data.map(parseMetric);
                        });
                    }
                }, {
                    key: 'getAggregationOptions',
                    value: function getAggregationOptions() {
                        var _this2 = this;

                        var options = {
                            areLabelsIncluded: this.panel.type === 'table'
                        };

                        return this.datasource.metricFindQuery(null, options).then(function (data) {
                            return data.filter(function (m) {
                                return m.id === _this2.target.target;
                            })[0];
                        });
                    }
                }, {
                    key: 'getTimeAggregationOptions',
                    value: function getTimeAggregationOptions() {
                        var options = [{ value: 'avg', text: 'Average' }, { value: 'timeAvg', text: 'Rate' }, { value: 'sum', text: 'Sum' }, { value: 'min', text: 'Min' }, { value: 'max', text: 'Max' }, { value: 'count', text: 'Count' }, { value: 'concat', text: 'Concat' }, { value: 'distinct', text: 'Distinct' }];

                        return this.getAggregationOptions().then(function (m) {
                            if (m) {
                                return options.filter(function (d) {
                                    return m.aggregations.indexOf(d.value) >= 0;
                                });
                            } else {
                                return [];
                            }
                        });
                    }
                }, {
                    key: 'getGroupAggregationOptions',
                    value: function getGroupAggregationOptions() {
                        var options = [{ value: 'avg', text: 'Average' }, { value: 'sum', text: 'Sum' }, { value: 'min', text: 'Min' }, { value: 'max', text: 'Max' }, { value: 'count', text: 'Count' }, { value: 'concat', text: 'Concat' }, { value: 'distinct', text: 'Distinct' }];

                        return this.getAggregationOptions().then(function (m) {
                            if (m) {
                                return options.filter(function (d) {
                                    return m.groupAggregations.indexOf(d.value) >= 0;
                                });
                            } else {
                                return [];
                            }
                        });
                    }
                }, {
                    key: 'getSortDirectionOptions',
                    value: function getSortDirectionOptions() {
                        return [{ value: 'desc', text: 'Top' }, { value: 'asc', text: 'Bottom' }];
                    }
                }, {
                    key: 'getSegmentByOptions',
                    value: function getSegmentByOptions() {
                        return this.datasource.findSegmentBy(this.target.target).then(function (data) {
                            return [{ text: 'no segmentation', value: null }].concat(_toConsumableArray(data.map(function (k) {
                                return { text: k, value: k };
                            })));
                        });
                    }
                }, {
                    key: 'removeSegmentBy',
                    value: function removeSegmentBy(item) {
                        var index = this.segmentByItems.indexOf(item);

                        // remove segmentation from list
                        this.target.segmentBy = [].concat(_toConsumableArray(this.target.segmentBy.slice(0, index)), _toConsumableArray(this.target.segmentBy.slice(index + 1)));

                        // update UI list
                        this.segmentByItems = this.calculateSegmentByItems();

                        // update data
                        this.panelCtrl.refresh();
                    }
                }, {
                    key: 'addSegmentBy',
                    value: function addSegmentBy(item) {
                        var index = this.segmentByItems.indexOf(item);

                        // add new item after the one where + has been clicked
                        this.segmentByItems = [].concat(_toConsumableArray(this.segmentByItems.slice(0, index + 1)), [{
                            isFirst: false,
                            canAdd: true,
                            segmentBy: null
                        }], _toConsumableArray(this.segmentByItems.slice(index + 1)));

                        // don't update the UI: the change is temporary until the user picks a segmentation
                    }
                }, {
                    key: 'onChangeParameter',
                    value: function onChangeParameter() {
                        this.panelCtrl.refresh();

                        this.target.segmentBy = this.segmentByItems.filter(function (item) {
                            return item.segmentBy !== null;
                        }).map(function (item) {
                            return item.segmentBy;
                        });

                        this.segmentByItems = this.calculateSegmentByItems();
                    }
                }, {
                    key: 'calculateSegmentByItems',
                    value: function calculateSegmentByItems() {
                        var _this3 = this;

                        if (this.panel.type !== 'table' || this.isFirstTarget()) {
                            if (this.target.segmentBy.length === 0) {
                                return [{
                                    isFirst: true,
                                    canAdd: false,
                                    segmentBy: null
                                }];
                            } else {
                                return this.target.segmentBy.map(function (segmentBy, i) {
                                    return {
                                        isFirst: i === 0,
                                        canAdd: i === _this3.target.segmentBy.length - 1,
                                        segmentBy: segmentBy
                                    };
                                });
                            }
                        } else {
                            return [];
                        }
                    }
                }, {
                    key: 'toggleEditorMode',
                    value: function toggleEditorMode() {
                        // noop
                    }
                }]);

                return SysdigDatasourceQueryCtrl;
            }(QueryCtrl));

            _export('SysdigDatasourceQueryCtrl', SysdigDatasourceQueryCtrl);

            SysdigDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
        }
    };
});
//# sourceMappingURL=query_ctrl.js.map
