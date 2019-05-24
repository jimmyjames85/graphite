'use strict';

System.register(['./datasource', './query_ctrl', './config_ctrl'], function (_export, _context) {
    "use strict";

    var SysdigDatasource, SysdigDatasourceQueryCtrl, SysdigConfigCtrl, GenericQueryOptionsCtrl, GenericAnnotationsQueryCtrl;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    return {
        setters: [function (_datasource) {
            SysdigDatasource = _datasource.SysdigDatasource;
        }, function (_query_ctrl) {
            SysdigDatasourceQueryCtrl = _query_ctrl.SysdigDatasourceQueryCtrl;
        }, function (_config_ctrl) {
            SysdigConfigCtrl = _config_ctrl.SysdigConfigCtrl;
        }],
        execute: function () {
            _export('QueryOptionsCtrl', GenericQueryOptionsCtrl = function GenericQueryOptionsCtrl() {
                _classCallCheck(this, GenericQueryOptionsCtrl);
            });

            GenericQueryOptionsCtrl.templateUrl = 'partials/query.options.html';

            _export('AnnotationsQueryCtrl', GenericAnnotationsQueryCtrl = function GenericAnnotationsQueryCtrl() {
                _classCallCheck(this, GenericAnnotationsQueryCtrl);
            });

            GenericAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';

            _export('Datasource', SysdigDatasource);

            _export('QueryCtrl', SysdigDatasourceQueryCtrl);

            _export('ConfigCtrl', SysdigConfigCtrl);

            _export('QueryOptionsCtrl', GenericQueryOptionsCtrl);

            _export('AnnotationsQueryCtrl', GenericAnnotationsQueryCtrl);
        }
    };
});
//# sourceMappingURL=module.js.map
