'use strict';

System.register(['./dashboards_service', './css/config-editor.css!'], function (_export, _context) {
    "use strict";

    var DashboardsService, _createClass, CLOUD_URL, DEFAULT_ONPREM_URL, SysdigConfigCtrl;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    return {
        setters: [function (_dashboards_service) {
            DashboardsService = _dashboards_service.default;
        }, function (_cssConfigEditorCss) {}],
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

            CLOUD_URL = 'https://app.sysdigcloud.com';
            DEFAULT_ONPREM_URL = 'https://your-sysdig.local';

            _export('SysdigConfigCtrl', SysdigConfigCtrl = function () {
                /** @ngInject */
                function SysdigConfigCtrl($q, backendSrv) {
                    _classCallCheck(this, SysdigConfigCtrl);

                    this.planOptions = [{ id: 'cloud', text: 'Basic/Pro Cloud' }, { id: 'onprem', text: 'Pro Software' }];

                    this.dashboardSets = [{
                        id: 'DEFAULT',
                        title: 'Default dashboards',
                        importStatus: 'none',
                        importMessage: null
                    }, { id: 'PRIVATE', title: 'My dashboards', importStatus: 'none', importMessage: null }, { id: 'SHARED', title: 'Shared dashboards', importStatus: 'none', importMessage: null }];

                    this.current.access = 'proxy';

                    var isUrlNotEmpty = this.current.url && /^\s*$/.test(this.current.url) === false;
                    this.current.url = isUrlNotEmpty ? this.current.url : CLOUD_URL;
                    this.isOnprem = this.current.url !== CLOUD_URL;
                    this.plan = this.isOnprem ? this.planOptions[1] : this.planOptions[0];

                    this.q = $q;
                    this.backendSrv = backendSrv;
                }

                _createClass(SysdigConfigCtrl, [{
                    key: 'getBackendConfiguration',
                    value: function getBackendConfiguration() {
                        return {
                            backendSrv: this.backendSrv,
                            withCredentials: this.current.withCredentials,
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Sysdig-Product': 'SDC',
                                Authorization: 'Bearer ' + this.current.jsonData.apiToken
                            },
                            apiToken: this.current.jsonData.apiToken,
                            url: '/api/datasources/proxy/' + this.current.id
                        };
                    }
                }, {
                    key: 'changePlan',
                    value: function changePlan() {
                        this.isOnprem = this.plan.id === 'onprem';

                        if (this.isOnprem && this.current.url === CLOUD_URL) {
                            this.current.url = DEFAULT_ONPREM_URL;
                        }
                    }
                }, {
                    key: 'isDashboardsImportDisabled',
                    value: function isDashboardsImportDisabled() {
                        return this.current.id === undefined || this.current.jsonData.apiToken === undefined;
                    }
                }, {
                    key: 'importDashboards',
                    value: function importDashboards(dashboardSetId) {
                        this.testing = null;

                        var dashboardSet = this.dashboardSets.filter(function (set) {
                            return set.id === dashboardSetId;
                        })[0];
                        dashboardSet.importStatus = 'executing';
                        dashboardSet.importMessage = null;

                        DashboardsService.importFromSysdig(this.getBackendConfiguration(), this.current.name, dashboardSetId).then(function () {
                            dashboardSet.importStatus = 'success';
                        }).catch(function (error) {
                            dashboardSet.importStatus = 'error';
                            dashboardSet.importMessage = error;
                        });
                    }
                }, {
                    key: 'deleteDashboards',
                    value: function deleteDashboards() {
                        DashboardsService.delete(this.backendSrv);
                    }
                }]);

                return SysdigConfigCtrl;
            }());

            _export('SysdigConfigCtrl', SysdigConfigCtrl);

            SysdigConfigCtrl.templateUrl = 'partials/config.html';
        }
    };
});
//# sourceMappingURL=config_ctrl.js.map
