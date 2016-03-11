/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
        'Sage/Services/_ServiceMixin',
        'Sage/_ConfigurationProvider',
        'Sage/MainView/GroupMgr/GroupManagerGroupContextService',
        'Sage/MainView/GroupMgr/GroupManagerFormatter',
        'dijit/registry',
        'dojo/_base/declare',
        'Sage/Utility/Filters',
        'dojo/_base/lang',
        'dojo/json'
    ],
    function(
        _ServiceMixin,
        _ConfigurationProvider,
        GroupManagerGroupContextService,
        formatter,
        registry,
        declare,
        filtersUtility,
        lang,
        json
    ) {
        var filterConfigurationProvider = declare('Sage.MainView.GroupMgr.FilterConfigurationProvider', [_ConfigurationProvider, _ServiceMixin], {
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
                if (this.groupContextService.declaredClass !== 'Sage.MainView.GroupMgr.GroupManagerGroupContextService') {
                    Sage.Services.removeService('ClientGroupContext');
                    this.groupContextService = new GroupManagerGroupContextService();
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
            onConfigurationChange: function() {
            },
            getFilterFormatter: function (filter) {
                if (filter) {
                    if (filter.filterName === 'Owner' && filter.$key === '4493728e-4874-49ce-8b92-fa73eb0ce19e') {
                        return formatter.formatOwnerName;
                    }
                    if ((filter.filterName === 'Dev' && (filter.$key === '88834cef-0de9-4eeb-b3e1-a88df70a9801' || filter.$key === '1771b223-501f-4002-99f4-bba7ea0fb381')) ||
                    (filter.filterName === 'Released' && filter.$key === 'd5b8084e-8758-4921-999a-018b7283becb') ||
                    (filter.filterName === 'Adhoc' && filter.$key === '89c6c3b2-7c94-45d8-a5e2-35931d70d236') ||
                    (filter.filterName === 'Shared' && filter.$key === 'e6d6c56c-b861-4b52-9b70-9446d0a2f483')) {
                        return formatter.formatBoolean;
                    }
                }
                return false;
            },
            _onGroupContextChanged: function() {
                this.onConfigurationChange();
            },
            _createConfiguration: function(entry, options) {
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
                this._configuration.getFilterManager = function() {
                    var listPanel = registry.byId('list');
                    return listPanel && listPanel.get('filterManager');
                };
                this._hasLayoutConfiguration = true;
            },
            _onRequestConfigurationSuccess: function(options, entry) {
                this._createConfiguration(entry, options);
                this._callOptionsSuccess(options);
            },
            _onRequestConfigurationFailure: function(options, response) {
                if (options.failure) {
                    options.failure.call(options.scope || this, response, options, this);
                }
            },
            _getHiddenFilters: function(options) {
                var key = this._getHiddenFiltersKey();
                if (key) {
                    filtersUtility.getHiddenFilters(key,
                        lang.hitch(this, this._onHiddenFiltersFetchComplete, options || {}),
                        function(err) {
                            console.error(err);
                        }
                    );
                }
            },
            _getHiddenFiltersKey: function() {
                var key = filtersUtility.getHiddenFiltersKey();
                return key;
            },
            _onHiddenFiltersFetchComplete: function(options, result) {
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
            _callOptionsSuccess: function(options) {
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