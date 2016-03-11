/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/Services/_ServiceMixin',
    'Sage/_ConfigurationProvider',
    'Sage/MainView/ReportMgr/ReportManagerGroupContextService',
    'dijit/registry',
    'dojo/_base/declare',
    'Sage/Utility/Filters',
    'dojo/_base/lang',
    'dojo/json'
],
function (
    _ServiceMixin,
    _ConfigurationProvider,
    ReportManagerGroupContextService,
    registry,
    declare,
    filtersUtility,
    lang,
    json
) {
    var filterConfigurationProvider = declare('Sage.MainView.ReportMgr.FilterConfigurationProvider', [_ConfigurationProvider, _ServiceMixin], {
        _configuration: null,
        _hasLayoutConfiguration: false,
        _hasFilterHiddenConfiguration: false,
        _currentUserId: false,
        serviceMap: {
            'groupContextService': 'ClientGroupContext',
            'metaDataService': { type: 'sdata', name: 'metadata' },
            'systemDataService': { type: 'sdata', name: 'system' }
        },
        constructor: function (options) {
            this.inherited(arguments);
            if (this.groupContextService.declaredClass !== 'Sage.MainView.ReportMgr.ReportManagerGroupContextService') {
                Sage.Services.removeService('ClientGroupContext');
                this.groupContextService = new ReportManagerGroupContextService();
                Sage.Services.addService('ClientGroupContext', this.groupContextService);
            }
            this._subscribes.push(dojo.subscribe('/group/context/changed', this, this._onGroupContextChanged));
        },
        requestConfiguration: function (options) {
            this._configuration = {};
            this._hasLayoutConfiguration = false;
            this._hasFilterHiddenConfiguration = false;
            this._onRequestConfigurationSuccess(options, null);
            this._getHiddenFilters(options);
        },
        onConfigurationChange: function () {
        },
        getFilterFormatter: function (filter) {
            if (filter) {
                if (filter.filterName === 'ExecutionType') {
                }
            }
            return false;
        },
        _onGroupContextChanged: function () {
            this.onConfigurationChange();
        },
        _createConfiguration: function (entry, options) {
            var currentListConfig = this.groupContextService.getCurrentListConfig();
            if (this.groupContextService._currentContext.isNonEntityBased) {
                this._configuration = currentListConfig.getNonEntityBasedFilterConfig(options);
            } else {
                //get non entity based filter configuration
                this._configuration = currentListConfig.getFilterConfig(this.metaDataService, entry, options);
            }
            
            if (!this._configuration) {
                this._configuration = {};
            }
            this._configuration.getFilterManager = function () {
                var listPanel = registry.byId('list');
                return listPanel && listPanel.get('filterManager');
            };
            this._hasLayoutConfiguration = true;
        },
        _onRequestConfigurationSuccess: function (options, entry) {
            this._createConfiguration(entry, options);
            this._callOptionsSuccess(options);
        },
        _onRequestConfigurationFailure: function (options, response) {
            if (options.failure) {
                options.failure.call(options.scope || this, response, options, this);
            }
        },
        _getHiddenFilters: function (options) {
            var key = this._getHiddenFiltersKey();
            if (key) {
                filtersUtility.getHiddenFilters(key,
                    lang.hitch(this, this._onHiddenFiltersFetchComplete, options || {}),
                    function (err) {
                        console.error(err);
                    }
                );
            }
        },
        _getHiddenFiltersKey: function () {
            var key = filtersUtility.getHiddenFiltersKey();
            return key;
        },
        _onHiddenFiltersFetchComplete: function (options, result) {
            if (result && result.response && result.response.value) {
                this._configuration._hiddenFilters = json.parse(result.response.value);
                // Getting a key without data will return "[]"
                if (this._configuration._hiddenFilters && this._configuration._hiddenFilters.constructor === Array) {
                    this._configuration._hiddenFilters = {};
                }
            }
            this._configuration._hiddenFiltersKey = this._getHiddenFiltersKey();
            this._hasFilterHiddenConfiguration = true;
            this._callOptionsSuccess(options);
        },
        _callOptionsSuccess: function (options) {
            if (!this._hasLayoutConfiguration || !this._hasFilterHiddenConfiguration) {
                return;
            }
            if (options.success) {
                options.success.call(options.scope || this, this._configuration, options, this);
                this._hasLayoutConfiguration = false;
                this._hasFilterHiddenConfiguration = false;
            }
        }
    });
    return filterConfigurationProvider;
});