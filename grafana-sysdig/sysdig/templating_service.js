'use strict';

System.register(['./formatter_service'], function (_export, _context) {
    "use strict";

    var FormatterService, _createClass, TemplatingService;

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

    function parseFunction(value, functionName) {
        if (value) {
            var functionPattern = functionName + '\\((?:(.*))\\)';
            var regex = value.match('^' + functionPattern + '$');
            if (regex) {
                var options = regex[1];

                return { options: options };
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    function parseOptions(value, functionName) {
        switch (functionName) {
            case 'label_values':
                {
                    var parseConfiguration = {
                        namelessOption: {
                            name: 'labelName',
                            pattern: '([A-Za-z][A-Za-z0-9]*(?:[\\._\\-:][a-zA-Z0-9]+)*)'
                        },
                        namedOptions: [{
                            name: 'filter',
                            patterns: ['"([^"]+)"', '\'([^\']+)\''],
                            validate: function validate(value) {
                                return value.trim();
                            },
                            defaultValue: null
                        }, {
                            name: 'from',
                            pattern: '(\\d+)',
                            validate: function validate(value) {
                                return Number(value);
                            },
                            defaultValue: 0
                        }, {
                            name: 'to',
                            pattern: '(\\d+)',
                            validate: function validate(value) {
                                return Number(value);
                            },
                            defaultValue: undefined
                        }, {
                            name: 'limit',
                            pattern: '(\\d+)',
                            validate: function validate(value) {
                                return Number(value);
                            },
                            defaultValue: 99
                        }],
                        validate: function validate(options) {
                            // to overrides limit
                            if (options.to !== undefined && options.limit !== undefined) {
                                delete options.limit;
                            }

                            // to is always derived from from + limit
                            if (options.limit !== undefined) {
                                options.to = options.from + options.limit;
                                delete options.limit;
                            }

                            // ensure both from+to are always set
                            if (options.from !== undefined && options.to === undefined) {
                                options.to = options.from + 99;
                            } else if (options.to !== undefined && options.from === undefined) {
                                options.from = options.to - 99;
                            }

                            // don't let download too much data, but not even too few
                            if (options.from !== undefined && options.to !== undefined) {
                                options.from = Math.max(options.from, 0);

                                options.to = Math.min(options.to, options.from + 1000);
                                options.to = Math.max(options.to, options.from + 1);
                            }

                            return options;
                        }
                    };

                    var functionMatch = value.match('^' + parseConfiguration.namelessOption.pattern + '(?:\\s*,\\s*(.+))?$');

                    if (functionMatch) {
                        var parsedOptions = {};
                        parsedOptions[parseConfiguration.namelessOption.name] = functionMatch[1];

                        var namedOptions = functionMatch[2];
                        var namedOptionsPattern = parseConfiguration.namedOptions.reduce(function (acc, option) {
                            if (option.patterns) {
                                return [].concat(_toConsumableArray(acc), _toConsumableArray(option.patterns.map(function (pattern) {
                                    return {
                                        name: option.name,
                                        pattern: pattern
                                    };
                                })));
                            } else {
                                return [].concat(_toConsumableArray(acc), [option]);
                            }
                        }, []).map(function (option) {
                            return '(?:(' + option.name + ')=' + option.pattern + ')';
                        }).join('|');
                        var namedOptionsRegex = RegExp(namedOptionsPattern, 'g');
                        var namedOptionsValidators = parseConfiguration.namedOptions.reduce(function (acc, d) {
                            acc[d.name] = d.validate;
                            return acc;
                        }, {});

                        var matches = void 0;
                        while ((matches = namedOptionsRegex.exec(namedOptions)) !== null) {
                            for (var i = 1; i < matches.length; i = i + 2) {
                                if (matches[i]) {
                                    parsedOptions[matches[i]] = namedOptionsValidators[matches[i]](matches[i + 1]);
                                }
                            }
                        }

                        parseConfiguration.namedOptions.forEach(function (option) {
                            if (parsedOptions[option.name] === undefined) {
                                parsedOptions[option.name] = option.defaultValue;
                            }
                        });

                        var validatedOptions = parseConfiguration.validate(parsedOptions);

                        return validatedOptions;
                    } else {
                        return null;
                    }
                }

            default:
                console.assert(false, 'Options are not supported for any variable function other than "label_values"');
                return null;
        }
    }

    function formatValue(value) {
        return parseLabelValue(value);
    }

    function formatQuotedValue(value) {
        var parsed = parseLabelValue(value);

        // encapsulate value within double-quotes to make the output valid with both strings and null values
        // also, null values must be returned as "null" strings
        return parsed ? '"' + parsed + '"' : '' + parsed;
    }

    function parseLabelValue(labelValue) {
        return labelValue === FormatterService.NULL_TEXT ? null : labelValue;
    }
    return {
        setters: [function (_formatter_service) {
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

            TemplatingService = function () {
                function TemplatingService() {
                    _classCallCheck(this, TemplatingService);
                }

                _createClass(TemplatingService, null, [{
                    key: 'validateLabelValuesQuery',
                    value: function validateLabelValuesQuery(query) {
                        var parsed = parseFunction(query, 'label_values');
                        if (parsed) {
                            return parseOptions(parsed.options, 'label_values');
                        } else {
                            return null;
                        }
                    }
                }, {
                    key: 'validateLabelNamesQuery',
                    value: function validateLabelNamesQuery(query) {
                        var parsed = parseFunction(query, 'label_names');
                        if (parsed) {
                            return { pattern: parsed.options, regex: new RegExp(parsed.options) };
                        } else {
                            return null;
                        }
                    }
                }, {
                    key: 'validateMetricsQuery',
                    value: function validateMetricsQuery(query) {
                        var parsed = parseFunction(query, 'metrics');
                        if (parsed) {
                            return { pattern: parsed.options, regex: new RegExp(parsed.options) };
                        } else {
                            return null;
                        }
                    }
                }, {
                    key: 'resolveQueryVariables',
                    value: function resolveQueryVariables(query, templateSrv) {
                        if (query) {
                            return this.replace(templateSrv, query, null);
                        } else {
                            return null;
                        }
                    }
                }, {
                    key: 'replaceSingleMatch',
                    value: function replaceSingleMatch(templateSrv, input, scopedVars) {
                        return templateSrv.replace(input, scopedVars);
                    }
                }, {
                    key: 'replace',
                    value: function replace(templateSrv, input, scopedVars) {
                        var _this = this;

                        return templateSrv.replace(input, scopedVars, function () {
                            return _this.formatTemplateValue.apply(_this, arguments);
                        });
                    }
                }, {
                    key: 'formatTemplateValue',
                    value: function formatTemplateValue(value, variable) {
                        var format = this.validateLabelValuesQuery(variable.query) ? formatQuotedValue : formatValue;

                        if (typeof value === 'string') {
                            //
                            // single selection
                            //
                            return format(value);
                        } else {
                            //
                            // "all"
                            //
                            return value.map(format).join(', ');
                        }
                    }
                }]);

                return TemplatingService;
            }();

            _export('default', TemplatingService);
        }
    };
});
//# sourceMappingURL=templating_service.js.map
