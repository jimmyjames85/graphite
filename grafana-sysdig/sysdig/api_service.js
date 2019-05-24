'use strict';

System.register([], function (_export, _context) {
    "use strict";

    var _createClass, ApiService;

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

            ApiService = function () {
                function ApiService() {
                    _classCallCheck(this, ApiService);
                }

                _createClass(ApiService, null, [{
                    key: 'send',
                    value: function send(backend, options) {
                        var headers = {
                            'Content-Type': 'application/json',
                            'X-Sysdig-Product': 'SDC',
                            Authorization: 'Bearer ' + backend.apiToken
                        };

                        return backend.backendSrv.datasourceRequest(Object.assign({}, options, {
                            headers: headers,
                            url: backend.url + '/' + options.url,
                            method: options.method || 'GET'
                        }));
                    }
                }]);

                return ApiService;
            }();

            _export('default', ApiService);
        }
    };
});
//# sourceMappingURL=api_service.js.map
