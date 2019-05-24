'use strict';

System.register(['./api_service', './metrics_service', './sysdig_dashboard_helper'], function (_export, _context) {
    "use strict";

    var ApiService, MetricsService, SysdigDashboardHelper, _createClass, DashboardsService;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function fetchDefaultDashboards(backend) {
        return (
            // First try latest endpoint version
            ApiService.send(backend, {
                url: 'api/v2/defaultDashboards?excludeMissing=true'
            })
            // Return v2 dashboards
            .then(function (result) {
                if (result.data.defaultDashboards) {
                    return {
                        defaultDashboards: result.data.defaultDashboards,
                        version: 'v2'
                    };
                } else {
                    //
                    // dev version of v2 detected, fallback to v1
                    // (api/v2/defaultDashboards returns an array and not and object with defaultDashboards array)
                    // NOTE: This is useful until onprem version X and SaaS version Y need to be supported
                    //
                    return backend.backendSrv.$q.reject('Dashboards API v2 not available');
                }
            }).catch(function () {
                return (
                    // Then try older endpoint version
                    ApiService.send(backend, {
                        url: 'api/defaultDashboards?excludeMissing=true'
                    })
                    // Return v1 dashboards
                    .then(function (result) {
                        return {
                            defaultDashboards: result.data.defaultDashboards,
                            version: 'v1'
                        };
                    })
                );
            })
        );
    }

    function fetchDashboards(backend) {
        return (
            // First try latest endpoint version
            ApiService.send(backend, {
                url: 'api/v2/dashboards'
            })
            // Return v2 dashboards
            .then(function (result) {
                if (Array.isArray(result.data.dashboards) && result.data.dashboards.length > 0) {
                    return {
                        dashboards: result.data.dashboards,
                        version: 'v2'
                    };
                } else {
                    //
                    // probable dev version of v2 detected, fallback to v1
                    // (api/v2/dashboards was not documented or used, it's supposed to be empty -- NOTE: could lead to false positive in case there are no dashboards to import)
                    // NOTE: This is useful until onprem version X and SaaS version Y need to be supported
                    //
                    return backend.backendSrv.$q.reject('Dashboards API v2 not available');
                }
            }).catch(function () {
                return (
                    // Then try older endpoint version
                    ApiService.send(backend, {
                        url: 'ui/dashboards'
                    })
                    // Return v1 dashboards
                    .then(function (result) {
                        return {
                            dashboards: result.data.dashboards,
                            version: 'v1'
                        };
                    })
                );
            })
        );
    }

    function removeDashboards(backendSrv, dashboards) {
        if (dashboards.length > 0) {
            return removeNextDashboard(backendSrv, dashboards[0], dashboards.slice(1));
        } else {
            return backendSrv.$q.resolve();
        }
    }

    function removeNextDashboard(backendSrv, dashboard, nextDashboards) {
        return backendSrv.deleteDashboard(dashboard.uid).then(function () {
            return removeDashboards(backendSrv, nextDashboards);
        }).catch(function (error) {
            console.error('Error deleting dashboard', dashboard.uid, error);
            removeDashboards(backendSrv, nextDashboards);
        });
    }
    return {
        setters: [function (_api_service) {
            ApiService = _api_service.default;
        }, function (_metrics_service) {
            MetricsService = _metrics_service.default;
        }, function (_sysdig_dashboard_helper) {
            SysdigDashboardHelper = _sysdig_dashboard_helper.default;
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

            DashboardsService = function () {
                function DashboardsService() {
                    _classCallCheck(this, DashboardsService);
                }

                _createClass(DashboardsService, null, [{
                    key: 'importFromSysdig',
                    value: function importFromSysdig(backend, datasourceName, dashboardSetId) {
                        console.info('Sysdig dashboards import: Starting...');

                        if (dashboardSetId === 'DEFAULT') {
                            var tags = ['Sysdig', 'Default dashboard'];
                            return backend.backendSrv.$q.all([fetchDefaultDashboards(backend), ApiService.send(backend, {
                                url: 'data/drilldownViewsCategories.json'
                            })]).then(function (results) {
                                var applicableDashboards = results[0].defaultDashboards;

                                var usedCategories = results[1].data.drilldownViewsCategories.filter(function (category) {
                                    return applicableDashboards.find(function (dashboard) {
                                        return dashboard.category === category.id;
                                    }) !== undefined;
                                });

                                return {
                                    categories: usedCategories,
                                    defaultDashboards: applicableDashboards,
                                    version: results[0].version
                                };
                            }).then(function (results) {
                                var convertedDashboards = results.defaultDashboards.map(convertDashboard.bind(null, datasourceName, results.version, results.categories, tags)).filter(function (dashboard) {
                                    return dashboard !== null;
                                });

                                var options = {
                                    overwrite: true
                                };

                                return saveDashboards(backend.backendSrv, convertedDashboards, options);
                            }).then(function (result) {
                                console.info('Sysdig dashboards import: Completed');

                                return result;
                            }).catch(function (error) {
                                console.info('Sysdig dashboards import: Failed', error);

                                return backend.backendSrv.$q.reject(error);
                            });
                        } else {
                            var _tags = void 0;
                            switch (dashboardSetId) {
                                case 'PRIVATE':
                                    _tags = ['Sysdig', 'Private dashboard'];
                                    break;
                                case 'SHARED':
                                    _tags = ['Sysdig', 'Shared dashboard'];
                                    break;
                                default:
                                    throw {
                                        name: 'Invalid argument',
                                        message: 'Invalid dashboard set ID (\'' + dashboardSetId + '\')'
                                    };
                            }

                            return fetchDashboards(backend).then(function (result) {
                                var convertedDashboards = result.dashboards.filter(SysdigDashboardHelper.filterDashboardBySetId.bind(null, result.version, dashboardSetId)).map(convertDashboard.bind(null, datasourceName, result.version, [], _tags)).filter(function (dashboard) {
                                    return dashboard !== null;
                                });

                                var options = {
                                    overwrite: true
                                };

                                return saveDashboards(backend.backendSrv, convertedDashboards, options);
                            }).then(function (result) {
                                console.info('Sysdig dashboards import: Completed');

                                return result;
                            }).catch(function (error) {
                                console.info('Sysdig dashboards import: Failed', error);

                                return backend.backendSrv.$q.reject(error);
                            });
                        }

                        function convertDashboard(datasourceName, version, categories, tags, dashboard) {
                            try {
                                return SysdigDashboardHelper.convertToGrafana(version, dashboard, {
                                    datasourceName: datasourceName,
                                    categories: categories,
                                    tags: tags
                                });
                            } catch (error) {
                                console.error('An error occurred during the dashboard conversion', error, arguments);
                                return null;
                            }
                        }

                        function saveDashboards(backendSrv, dashboards, options) {
                            if (dashboards.length > 0) {
                                var dashboard = dashboards[0];
                                return backendSrv.saveDashboard(dashboard, options).then(function () {
                                    console.log('Sysdig dashboards import: Imported \'' + dashboard.title + '\'');

                                    return saveDashboards(backendSrv, dashboards.slice(1), options);
                                });
                            } else {
                                return backendSrv.$q.when({});
                            }
                        }
                    }
                }, {
                    key: 'delete',
                    value: function _delete(backendSrv) {
                        backendSrv.search({
                            type: 'dash-db',
                            tags: ['Sysdig', 'sysdig']
                        }).then(filterSysdigDashboards).then(function (dashboards) {
                            console.log('Sysdig dashboards: Delete ' + dashboards.length + ' dashboards...');

                            removeDashboards(backendSrv, dashboards);
                        });

                        function filterSysdigDashboards(dashboards) {
                            // NOTE: Up to Grafana v6.1, search over 2 tags doesn't work, the list will include dashboards without tags as well
                            // Current workaround is to filter based on tags returned by each dashboard configuration
                            return dashboards.filter(function (dashboard) {
                                return dashboard.tags && (dashboard.tags.indexOf('sysdig') >= 0 || dashboard.tags.indexOf('Sysdig') >= 0);
                            });
                        }
                    }
                }]);

                return DashboardsService;
            }();

            _export('default', DashboardsService);
        }
    };
});
//# sourceMappingURL=dashboards_service.js.map
