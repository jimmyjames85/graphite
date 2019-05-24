'use strict';

System.register([], function (_export, _context) {
    "use strict";

    var _createClass, FormatterService;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    return {
        setters: [],
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

            FormatterService = function () {
                function FormatterService() {
                    _classCallCheck(this, FormatterService);
                }

                _createClass(FormatterService, null, [{
                    key: 'formatLabelValue',
                    value: function formatLabelValue(labelValue) {
                        return labelValue || FormatterService.NULL_TEXT;
                    }
                }]);

                return FormatterService;
            }();

            _export('default', FormatterService);

            FormatterService.NULL_TEXT = 'n/a';
        }
    };
});
//# sourceMappingURL=formatter_service.js.map
