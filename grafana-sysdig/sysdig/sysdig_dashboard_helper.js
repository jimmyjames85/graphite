'use strict';

System.register([], function (_export, _context) {
    "use strict";

    var _get, _createClass, SysdigDashboardHelper, SysdigDashboardHelperV1, SysdigDashboardHelperV2, GRAFANA_COLUMN_COUNT, SYSDIG_COLUMN_COUNT, BaseBuilder, TimeSeriesBuilder, TimeSeriesAreaBuilder, HistogramBuilder, BarChartBuilder, NumberBuilder, TableBuilder, TextBuilder, DefaultBuilder;

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

    function _toConsumableArray(arr) {
        if (Array.isArray(arr)) {
            for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

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

    function getGrafanaVersion() {
        return grafanaBootData && grafanaBootData.settings && grafanaBootData.settings.buildInfo && grafanaBootData.settings.buildInfo.version ? grafanaBootData.settings.buildInfo.version : 'n.a.';
    }

    return {
        setters: [],
        execute: function () {
            _get = function get(object, property, receiver) {
                if (object === null) object = Function.prototype;
                var desc = Object.getOwnPropertyDescriptor(object, property);

                if (desc === undefined) {
                    var parent = Object.getPrototypeOf(object);

                    if (parent === null) {
                        return undefined;
                    } else {
                        return get(parent, property, receiver);
                    }
                } else if ("value" in desc) {
                    return desc.value;
                } else {
                    var getter = desc.get;

                    if (getter === undefined) {
                        return undefined;
                    }

                    return getter.call(receiver);
                }
            };

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

            SysdigDashboardHelper = function () {
                function SysdigDashboardHelper() {
                    _classCallCheck(this, SysdigDashboardHelper);
                }

                _createClass(SysdigDashboardHelper, null, [{
                    key: 'convertToGrafana',
                    value: function convertToGrafana(version, sysdigDashboard, options) {
                        return SysdigDashboardHelper.getHelper(version).convertToGrafana(sysdigDashboard, options);
                    }
                }, {
                    key: 'filterDashboardBySetId',
                    value: function filterDashboardBySetId(version, setId, dashboard) {
                        return SysdigDashboardHelper.getHelper(version).filterDashboardBySetId(setId, dashboard);
                    }
                }, {
                    key: 'getHelper',
                    value: function getHelper(version) {
                        if (version === 'v1') {
                            return SysdigDashboardHelperV1;
                        } else if (version === 'v2') {
                            return SysdigDashboardHelperV2;
                        } else {
                            throw {
                                name: 'Invalid parameter',
                                message: 'Invalid dashboard version ' + version
                            };
                        }
                    }
                }]);

                return SysdigDashboardHelper;
            }();

            _export('default', SysdigDashboardHelper);

            SysdigDashboardHelperV1 = function () {
                function SysdigDashboardHelperV1() {
                    _classCallCheck(this, SysdigDashboardHelperV1);
                }

                _createClass(SysdigDashboardHelperV1, null, [{
                    key: 'convertToGrafana',
                    value: function convertToGrafana(sysdigDashboard, options) {
                        var _this = this;

                        var panels = (sysdigDashboard.items || sysdigDashboard.widgets).map(function (panel, index) {
                            var builder = _this.getPanelBuilder(panel);
                            return builder.build(_this.getParsers(), sysdigDashboard, options, panel, index);
                        }).filter(function (r) {
                            return r !== null;
                        });

                        var isRowMandatory = getGrafanaVersion().indexOf('4.') === 0;
                        var dashboardPanelsConfiguration = void 0;
                        if (isRowMandatory) {
                            // convert grid layout to row spans
                            panels.forEach(function (panel) {
                                panel.span = panel.gridPos.w / 2;
                            });

                            // define rows
                            dashboardPanelsConfiguration = {
                                rows: panels.reduce(function (acc, panel) {
                                    if (acc.length === 0) {
                                        return [{
                                            panels: [panel]
                                        }];
                                    } else if (acc[acc.length - 1].panels[0].gridPos.x < panel.gridPos.x) {
                                        acc[acc.length - 1].panels.push(panel);
                                    } else {
                                        acc.push({
                                            panels: [panel]
                                        });
                                    }

                                    return acc;
                                }, [])
                            };

                            // remove grid layout
                            panels.forEach(function (panel) {
                                delete panel.gridPos;
                            });
                        } else {
                            dashboardPanelsConfiguration = { panels: panels };
                        }

                        var categoryTags = void 0;
                        if (sysdigDashboard.category) {
                            categoryTags = sysdigDashboard.category.split('.').reduce(function (acc, part) {
                                if (acc === null) {
                                    return [part];
                                } else {
                                    return [].concat(_toConsumableArray(acc), [acc[acc.length - 1] + '.' + part]);
                                }
                            }, null).map(function (categoryId) {
                                var category = options.categories.find(function (category) {
                                    return category.id === categoryId;
                                });

                                if (category) {
                                    return category.name;
                                } else {
                                    return null;
                                }
                            }).filter(function (category) {
                                return category !== null;
                            });
                        } else {
                            categoryTags = [];
                        }

                        return Object.assign({
                            schemaVersion: 6,
                            version: 0,
                            title: sysdigDashboard.name,
                            tags: [].concat(_toConsumableArray(options.tags || []), _toConsumableArray(categoryTags)),
                            timezone: 'browser',
                            time: {
                                // default Sysdig: last 1 hour
                                from: 'now-1h',
                                to: 'now'
                            },
                            graphTooltip: 1 // shared crosshair
                        }, dashboardPanelsConfiguration);
                    }
                }, {
                    key: 'getPanelBuilder',
                    value: function getPanelBuilder(panel) {
                        switch (panel.showAs) {
                            case 'timeSeries':
                                return TimeSeriesBuilder;

                            case 'timeSeriesArea':
                                return TimeSeriesAreaBuilder;

                            case 'histogram':
                                return HistogramBuilder;

                            case 'top':
                                return BarChartBuilder;

                            case 'summary':
                                return NumberBuilder;

                            case 'table':
                                return TableBuilder;

                            case 'text':
                                return TextBuilder;

                            default:
                                console.warn(panel.showAs + ' panels cannot be exported to Grafana');
                                return DefaultBuilder;
                        }
                    }
                }, {
                    key: 'filterDashboardBySetId',
                    value: function filterDashboardBySetId(setId, dashboard) {
                        switch (setId) {
                            case 'PRIVATE':
                                return dashboard.isShared === false;
                            case 'SHARED':
                                return dashboard.isShared === true;
                        }
                    }
                }, {
                    key: 'getParsers',
                    value: function getParsers() {
                        return {
                            parseMetric: this.parseMetric
                        };
                    }
                }, {
                    key: 'parseMetric',
                    value: function parseMetric(metric) {
                        return Object.assign({}, metric, {
                            id: metric.metricId.replace(/%25/g, '.'),
                            timeAggregation: metric.timeAggregation || metric.aggregation
                        });
                    }
                }]);

                return SysdigDashboardHelperV1;
            }();

            SysdigDashboardHelperV2 = function (_SysdigDashboardHelpe) {
                _inherits(SysdigDashboardHelperV2, _SysdigDashboardHelpe);

                function SysdigDashboardHelperV2() {
                    _classCallCheck(this, SysdigDashboardHelperV2);

                    return _possibleConstructorReturn(this, (SysdigDashboardHelperV2.__proto__ || Object.getPrototypeOf(SysdigDashboardHelperV2)).apply(this, arguments));
                }

                _createClass(SysdigDashboardHelperV2, null, [{
                    key: 'filterDashboardBySetId',
                    value: function filterDashboardBySetId(setId, dashboard) {
                        switch (setId) {
                            case 'PRIVATE':
                                return dashboard.shared === false;
                            case 'SHARED':
                                return dashboard.shared === true;
                        }
                    }
                }, {
                    key: 'parseMetric',
                    value: function parseMetric(metric) {
                        return Object.assign({}, metric, {
                            id: metric.id.replace(/%25/g, '.'),
                            timeAggregation: metric.timeAggregation || metric.aggregation
                        });
                    }
                }]);

                return SysdigDashboardHelperV2;
            }(SysdigDashboardHelperV1);

            GRAFANA_COLUMN_COUNT = 24;
            SYSDIG_COLUMN_COUNT = 12;

            BaseBuilder = function () {
                function BaseBuilder() {
                    _classCallCheck(this, BaseBuilder);
                }

                _createClass(BaseBuilder, null, [{
                    key: 'getPanelType',
                    value: function getPanelType() {
                        return null;
                    }
                }, {
                    key: 'isSingleDataPoint',
                    value: function isSingleDataPoint() {
                        return false;
                    }
                }, {
                    key: 'isTabularFormat',
                    value: function isTabularFormat() {
                        return false;
                    }
                }, {
                    key: 'getTargetGridLayout',
                    value: function getTargetGridLayout(sysdigDashboard, sysdigPanel) {
                        var layout = void 0;
                        if (sysdigDashboard.items) {
                            var index = (sysdigDashboard.items || sysdigDashboard.widgets).indexOf(sysdigPanel);
                            layout = sysdigDashboard.layout[index];
                        } else {
                            layout = sysdigPanel.gridConfiguration;
                        }

                        // keep w/h ratio similar to Sysdig by reducing height by 80%
                        return {
                            h: Math.ceil(layout.size_y / SYSDIG_COLUMN_COUNT * GRAFANA_COLUMN_COUNT * 0.8),
                            w: layout.size_x / SYSDIG_COLUMN_COUNT * GRAFANA_COLUMN_COUNT,
                            x: (layout.col - 1) / SYSDIG_COLUMN_COUNT * GRAFANA_COLUMN_COUNT,
                            y: Math.floor((layout.row - 1) / SYSDIG_COLUMN_COUNT * GRAFANA_COLUMN_COUNT * 0.8)
                        };
                    }
                }, {
                    key: 'getTargetFilter',
                    value: function getTargetFilter(sysdigDashboard, sysdigPanel) {
                        return sysdigPanel.scope || sysdigDashboard.filterExpression;
                    }
                }, {
                    key: 'getBasePanelConfiguration',
                    value: function getBasePanelConfiguration(sysdigDashboard, options, sysdigPanel, index) {
                        return {
                            type: this.getPanelType(),
                            datasource: options.datasourceName,
                            id: index,
                            title: sysdigPanel.name,
                            gridPos: this.getTargetGridLayout(sysdigDashboard, sysdigPanel)
                        };
                    }
                }, {
                    key: 'getValueFormat',
                    value: function getValueFormat(valueMetric, metrics) {
                        var metricConfiguration = _.find(metrics, function (m) {
                            return m.id === valueMetric.id;
                        });

                        if (metricConfiguration === undefined) {
                            // metric not found, return default format
                            return 'short';
                        } else {
                            // NOTE: For unit mapping, refer to public/app/core/utils/kbn.ts
                            var isRate = valueMetric.aggregation === 'timeAvg';
                            switch (metricConfiguration.type) {
                                case 'string':
                                case 'providerServiceEnum':
                                case 'bool':
                                    return 'none';

                                case 'int':
                                case 'number':
                                case 'double':
                                    return 'short';

                                case 'byte':
                                    if (isRate) {
                                        return 'Bps';
                                    } else {
                                        return 'bytes';
                                    }

                                case 'relativeTime':
                                    return 'ns';

                                case '%':
                                case 'ratio':
                                    return 'percent';

                                case 'date':
                                case 'dateTime':
                                case 'absoluteTime':
                                    return 'dateTimeAsIso';

                                default:
                                    return 'short';
                            }
                        }
                    }
                }]);

                return BaseBuilder;
            }();

            TimeSeriesBuilder = function (_BaseBuilder) {
                _inherits(TimeSeriesBuilder, _BaseBuilder);

                function TimeSeriesBuilder() {
                    _classCallCheck(this, TimeSeriesBuilder);

                    return _possibleConstructorReturn(this, (TimeSeriesBuilder.__proto__ || Object.getPrototypeOf(TimeSeriesBuilder)).apply(this, arguments));
                }

                _createClass(TimeSeriesBuilder, null, [{
                    key: 'getPanelType',
                    value: function getPanelType() {
                        return 'graph';
                    }
                }, {
                    key: 'build',
                    value: function build(parsers, sysdigDashboard, options, sysdigPanel, index) {
                        return Object.assign({}, this.getBasePanelConfiguration(sysdigDashboard, options, sysdigPanel, index), {
                            targets: this.buildTargets(parsers, sysdigDashboard, sysdigPanel),
                            legend: {
                                show: false // retain Sysdig layout
                            },
                            yaxes: this.buildPanelYAxes(parsers, sysdigDashboard, sysdigPanel, options)
                        });
                    }
                }, {
                    key: 'getValues',
                    value: function getValues(parsers, sysdigDashboard, sysdigPanel) {
                        var values = sysdigPanel.metrics.map(parsers.parseMetric).filter(function (metric) {
                            return metric.id !== 'timestamp' && metric.timeAggregation !== undefined;
                        });
                        if (values.length === 0) {
                            console.warn('Expected at least one value metric');
                        }

                        return values;
                    }
                }, {
                    key: 'getKeys',
                    value: function getKeys(parsers, sysdigDashboard, sysdigPanel) {
                        var keys = sysdigPanel.metrics.map(parsers.parseMetric).filter(function (metric) {
                            return metric.id !== 'timestamp' && metric.timeAggregation === undefined;
                        });
                        if (keys.length > 1) {
                            console.warn('Expected at most one key metric');
                        }

                        return keys;
                    }
                }, {
                    key: 'buildTargets',
                    value: function buildTargets(parsers, sysdigDashboard, sysdigPanel) {
                        var _this4 = this;

                        var values = this.getValues(parsers, sysdigDashboard, sysdigPanel);
                        var keys = this.getKeys(parsers, sysdigDashboard, sysdigPanel);

                        return values.map(function (value, i) {
                            return {
                                refId: i.toString(),
                                isSingleDataPoint: _this4.isSingleDataPoint(),
                                isTabularFormat: _this4.isTabularFormat(),
                                target: value.id,
                                timeAggregation: value.timeAggregation,
                                groupAggregation: value.groupAggregation,
                                segmentBy: keys.length > 0 ? keys.map(function (key) {
                                    return key.id;
                                }) : null,
                                filter: _this4.getTargetFilter(sysdigDashboard, sysdigPanel),
                                sortDirection: _this4.getTargetSortDirection(sysdigPanel),
                                pageLimit: _this4.getTargetPageLimit(sysdigPanel)
                            };
                        });
                    }
                }, {
                    key: 'getTargetSortDirection',
                    value: function getTargetSortDirection(sysdigPanel) {
                        var normalizedDisplayOptions = Object.assign({
                            valueLimit: {
                                direction: null,
                                count: null
                            }
                        }, sysdigPanel.customDisplayOptions);

                        return normalizedDisplayOptions.valueLimit.direction || null;
                    }
                }, {
                    key: 'parseValueLimitCount',
                    value: function parseValueLimitCount(sysdigPanel) {
                        return sysdigPanel.customDisplayOptions && sysdigPanel.customDisplayOptions.valueLimit && Number.parseInt(sysdigPanel.customDisplayOptions.valueLimit.count, 10) ? Number.parseInt(sysdigPanel.customDisplayOptions.valueLimit.count, 10) : 10;
                    }
                }, {
                    key: 'getTargetPageLimit',
                    value: function getTargetPageLimit(sysdigPanel) {
                        return this.parseValueLimitCount(sysdigPanel);
                    }
                }, {
                    key: 'buildPanelYAxes',
                    value: function buildPanelYAxes(parsers, sysdigDashboard, sysdigPanel, options) {
                        var normalizedDisplayOptions = Object.assign({}, sysdigPanel.customDisplayOptions);

                        var yAxisLogBase = void 0;
                        if (normalizedDisplayOptions.yAxisScale) {
                            switch (normalizedDisplayOptions.yAxisScale) {
                                case 'logarithmic2':
                                    yAxisLogBase = 2;
                                    break;
                                case 'logarithmic10':
                                    yAxisLogBase = 10;
                                    break;
                                case 'logarithmic32':
                                    yAxisLogBase = 32;
                                    break;
                                case 'logarithmic1024':
                                    yAxisLogBase = 1024;
                                    break;
                                default:
                                    yAxisLogBase = 1;
                                    break;
                            }
                        } else {
                            yAxisLogBase = 1;
                        }

                        var baseAxisConfig = {
                            label: null,
                            logBase: 1,
                            min: null,
                            max: null,
                            show: false
                        };

                        var values = this.getValues(parsers, sysdigDashboard, sysdigPanel);

                        return [
                        // left axis
                        _.assign({}, baseAxisConfig, {
                            format: this.getValueFormat(values[0], options.metrics),
                            show: true,
                            min: normalizedDisplayOptions.yAxisLeftDomain ? normalizedDisplayOptions.yAxisLeftDomain.from : null,
                            max: normalizedDisplayOptions.yAxisLeftDomain ? normalizedDisplayOptions.yAxisLeftDomain.to : null,
                            logBase: yAxisLogBase
                        }),
                        // right axis
                        _.assign({}, baseAxisConfig)];
                    }
                }]);

                return TimeSeriesBuilder;
            }(BaseBuilder);

            TimeSeriesAreaBuilder = function (_TimeSeriesBuilder) {
                _inherits(TimeSeriesAreaBuilder, _TimeSeriesBuilder);

                function TimeSeriesAreaBuilder() {
                    _classCallCheck(this, TimeSeriesAreaBuilder);

                    return _possibleConstructorReturn(this, (TimeSeriesAreaBuilder.__proto__ || Object.getPrototypeOf(TimeSeriesAreaBuilder)).apply(this, arguments));
                }

                _createClass(TimeSeriesAreaBuilder, null, [{
                    key: 'build',
                    value: function build() {
                        var _get2;

                        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                            args[_key] = arguments[_key];
                        }

                        return Object.assign({}, (_get2 = _get(TimeSeriesAreaBuilder.__proto__ || Object.getPrototypeOf(TimeSeriesAreaBuilder), 'build', this)).call.apply(_get2, [this].concat(args)), {
                            stack: true,
                            fill: 7 // similar opacity used by Sysdig Monitor
                        });
                    }
                }]);

                return TimeSeriesAreaBuilder;
            }(TimeSeriesBuilder);

            HistogramBuilder = function (_TimeSeriesBuilder2) {
                _inherits(HistogramBuilder, _TimeSeriesBuilder2);

                function HistogramBuilder() {
                    _classCallCheck(this, HistogramBuilder);

                    return _possibleConstructorReturn(this, (HistogramBuilder.__proto__ || Object.getPrototypeOf(HistogramBuilder)).apply(this, arguments));
                }

                _createClass(HistogramBuilder, null, [{
                    key: 'isSingleDataPoint',
                    value: function isSingleDataPoint() {
                        return true;
                    }
                }, {
                    key: 'getValueFormat',
                    value: function getValueFormat() {
                        // the axis will count items in each bucket
                        return 'short';
                    }
                }, {
                    key: 'build',
                    value: function build(parsers, sysdigDashboard, options, sysdigPanel, index) {
                        return Object.assign({}, _get(HistogramBuilder.__proto__ || Object.getPrototypeOf(HistogramBuilder), 'build', this).call(this, parsers, sysdigDashboard, options, sysdigPanel, index), {
                            bars: true,
                            lines: false,
                            xaxis: {
                                buckets: sysdigPanel.customDisplayOptions ? sysdigPanel.customDisplayOptions.histogram.numberOfBuckets : 10,
                                mode: 'histogram'
                            }
                        });
                    }
                }, {
                    key: 'getTargetPageLimit',
                    value: function getTargetPageLimit(sysdigPanel) {
                        // apply a "premium" x10 to limit the effect of data pagination to bucket values
                        // Grafana will get all the entities and will define buckets on top of that
                        // However, if pagination limits the number of entries exported via API, bucket values
                        // will not be correct.
                        return this.parseValueLimitCount(sysdigPanel) * 10;
                    }
                }]);

                return HistogramBuilder;
            }(TimeSeriesBuilder);

            BarChartBuilder = function (_TimeSeriesBuilder3) {
                _inherits(BarChartBuilder, _TimeSeriesBuilder3);

                function BarChartBuilder() {
                    _classCallCheck(this, BarChartBuilder);

                    return _possibleConstructorReturn(this, (BarChartBuilder.__proto__ || Object.getPrototypeOf(BarChartBuilder)).apply(this, arguments));
                }

                _createClass(BarChartBuilder, null, [{
                    key: 'isSingleDataPoint',
                    value: function isSingleDataPoint() {
                        return true;
                    }
                }, {
                    key: 'build',
                    value: function build(parsers, sysdigDashboard, options, sysdigPanel, index) {
                        return Object.assign({}, _get(BarChartBuilder.__proto__ || Object.getPrototypeOf(BarChartBuilder), 'build', this).call(this, parsers, sysdigDashboard, options, sysdigPanel, index), {
                            bars: true,
                            lines: false,
                            xaxis: {
                                mode: 'series',
                                values: ['total']
                            }
                        });
                    }
                }]);

                return BarChartBuilder;
            }(TimeSeriesBuilder);

            NumberBuilder = function (_BaseBuilder2) {
                _inherits(NumberBuilder, _BaseBuilder2);

                function NumberBuilder() {
                    _classCallCheck(this, NumberBuilder);

                    return _possibleConstructorReturn(this, (NumberBuilder.__proto__ || Object.getPrototypeOf(NumberBuilder)).apply(this, arguments));
                }

                _createClass(NumberBuilder, null, [{
                    key: 'getPanelType',
                    value: function getPanelType() {
                        return 'singlestat';
                    }
                }, {
                    key: 'isSingleDataPoint',
                    value: function isSingleDataPoint() {
                        return true;
                    }
                }, {
                    key: 'build',
                    value: function build(parsers, sysdigDashboard, options, sysdigPanel, index) {
                        var value = this.getValue(parsers, sysdigDashboard, sysdigPanel);

                        if (value) {
                            // TODO set proper format
                            var format = this.getValueFormat(value, options.metrics);

                            return Object.assign({}, this.getBasePanelConfiguration(sysdigDashboard, options, sysdigPanel, index), {
                                targets: this.buildTargets(parsers, sysdigDashboard, sysdigPanel),
                                format: format
                            });
                        } else {
                            console.warn('number panel configuration not valid (missing value)');
                            return this.getBasePanelConfiguration(sysdigDashboard, options, sysdigPanel, index, 'singlestat');
                        }
                    }
                }, {
                    key: 'getValue',
                    value: function getValue(parsers, sysdigDashboard, sysdigPanel) {
                        var values = sysdigPanel.metrics.map(parsers.parseMetric).filter(function (metric) {
                            return metric.id !== 'timestamp' && metric.timeAggregation !== undefined;
                        }).map(parsers.parseMetric);
                        if (values.length !== 1) {
                            console.warn('Expected exactly one value metric');
                        }

                        return values[0];
                    }
                }, {
                    key: 'buildTargets',
                    value: function buildTargets(parsers, sysdigDashboard, sysdigPanel) {
                        var value = this.getValue(parsers, sysdigDashboard, sysdigPanel);

                        return [{
                            refId: '0',
                            isSingleDataPoint: this.isSingleDataPoint(),
                            isTabularFormat: this.isTabularFormat(),
                            segmentBy: null,
                            filter: this.getTargetFilter(sysdigDashboard, sysdigPanel),
                            target: value.id,
                            timeAggregation: value.timeAggregation,
                            groupAggregation: value.groupAggregation
                        }];
                    }
                }]);

                return NumberBuilder;
            }(BaseBuilder);

            TableBuilder = function (_TimeSeriesBuilder4) {
                _inherits(TableBuilder, _TimeSeriesBuilder4);

                function TableBuilder() {
                    _classCallCheck(this, TableBuilder);

                    return _possibleConstructorReturn(this, (TableBuilder.__proto__ || Object.getPrototypeOf(TableBuilder)).apply(this, arguments));
                }

                _createClass(TableBuilder, null, [{
                    key: 'getPanelType',
                    value: function getPanelType() {
                        return 'table';
                    }
                }, {
                    key: 'isSingleDataPoint',
                    value: function isSingleDataPoint() {
                        return true;
                    }
                }, {
                    key: 'isTabularFormat',
                    value: function isTabularFormat() {
                        return true;
                    }
                }, {
                    key: 'build',
                    value: function build(parsers, sysdigDashboard, options, sysdigPanel, index) {
                        var _this10 = this;

                        return Object.assign({}, _get(TableBuilder.__proto__ || Object.getPrototypeOf(TableBuilder), 'build', this).call(this, parsers, sysdigDashboard, options, sysdigPanel, index), {
                            transform: 'timeseries_aggregations',
                            sort: {
                                col: 1,
                                desc: true
                            },
                            styles: [].concat(_toConsumableArray(sysdigPanel.metrics.map(parsers.parseMetric).map(function (metric) {
                                var format = _this10.getValueFormat(metric, options.metrics);
                                if (format === 'none') {
                                    return {
                                        pattern: metric.id,
                                        type: 'string'
                                    };
                                } else {
                                    return {
                                        pattern: metric.id,
                                        type: 'number',
                                        unit: format,
                                        decimals: 2
                                    };
                                }
                            })), [{
                                pattern: '/.*/',
                                type: 'string'
                            }])
                        });
                    }
                }, {
                    key: 'buildTargets',
                    value: function buildTargets(parsers, sysdigDashboard, sysdigPanel) {
                        var _this11 = this;

                        var keys = this.getKeys(parsers, sysdigDashboard, sysdigPanel);
                        var filterMetrics = function filterMetrics(metric) {
                            return metric.timeAggregation !== undefined;
                        };

                        return sysdigPanel.metrics.map(parsers.parseMetric).filter(filterMetrics).map(function (value, i) {
                            return {
                                refId: i.toString(),
                                isSingleDataPoint: _this11.isSingleDataPoint(),
                                isTabularFormat: _this11.isTabularFormat(),
                                target: value.id,
                                timeAggregation: value.timeAggregation || 'concat',
                                groupAggregation: value.groupAggregation || 'concat',
                                segmentBy: keys.length > 0 ? keys.map(function (key) {
                                    return key.id;
                                }) : null,
                                filter: _this11.getTargetFilter(sysdigDashboard, sysdigPanel),
                                sortDirection: _this11.getTargetSortDirection(sysdigPanel),
                                pageLimit: _this11.getTargetPageLimit(sysdigPanel)
                            };
                        });
                    }
                }, {
                    key: 'getKeys',
                    value: function getKeys(parsers, sysdigDashboard, sysdigPanel) {
                        return sysdigPanel.metrics.map(parsers.parseMetric).filter(function (metric) {
                            return metric.timeAggregation === undefined;
                        });
                    }
                }]);

                return TableBuilder;
            }(TimeSeriesBuilder);

            TextBuilder = function (_BaseBuilder3) {
                _inherits(TextBuilder, _BaseBuilder3);

                function TextBuilder() {
                    _classCallCheck(this, TextBuilder);

                    return _possibleConstructorReturn(this, (TextBuilder.__proto__ || Object.getPrototypeOf(TextBuilder)).apply(this, arguments));
                }

                _createClass(TextBuilder, null, [{
                    key: 'getPanelType',
                    value: function getPanelType() {
                        return 'text';
                    }
                }, {
                    key: 'build',
                    value: function build(parsers, sysdigDashboard, options, sysdigPanel, index) {
                        return Object.assign({}, this.getBasePanelConfiguration(sysdigDashboard, options, sysdigPanel, index), {
                            mode: 'markdown',
                            content: this.getContent(sysdigPanel),
                            transparent: sysdigPanel.hasTransparentBackground === true
                        });
                    }
                }, {
                    key: 'getContent',
                    value: function getContent(sysdigPanel) {
                        return sysdigPanel.markdownSource;
                    }
                }]);

                return TextBuilder;
            }(BaseBuilder);

            DefaultBuilder = function (_BaseBuilder4) {
                _inherits(DefaultBuilder, _BaseBuilder4);

                function DefaultBuilder() {
                    _classCallCheck(this, DefaultBuilder);

                    return _possibleConstructorReturn(this, (DefaultBuilder.__proto__ || Object.getPrototypeOf(DefaultBuilder)).apply(this, arguments));
                }

                _createClass(DefaultBuilder, null, [{
                    key: 'build',
                    value: function build(parsers, sysdigDashboard, options, sysdigPanel, index) {
                        return Object.assign({}, this.getBasePanelConfiguration(sysdigDashboard, options, sysdigPanel, index), {
                            mode: 'html',
                            content: this.getContent(sysdigPanel)
                        });
                    }
                }, {
                    key: 'getPanelType',
                    value: function getPanelType() {
                        return 'text';
                    }
                }, {
                    key: 'getContent',
                    value: function getContent(sysdigPanel) {
                        var panelType = void 0;
                        switch (sysdigPanel.showAs) {
                            case 'timeSeriesArea':
                                panelType = 'Area';
                                break;
                            case 'top':
                                panelType = 'Top list';
                                break;
                            case 'histogram':
                                panelType = 'Histogram';
                                break;
                            case 'map':
                                panelType = 'Topology';
                                break;
                            case 'summary':
                                panelType = 'Number';
                                break;
                            case 'table':
                                panelType = 'Table';
                                break;
                            default:
                                panelType = sysdigPanel.showAs;
                                break;
                        }

                        return '<div class="text-center muted"><strong>' + panelType + '</strong> cannot be exported from Sysdig Monitor to Grafana.</div>';
                    }
                }]);

                return DefaultBuilder;
            }(BaseBuilder);
        }
    };
});
//# sourceMappingURL=sysdig_dashboard_helper.js.map
