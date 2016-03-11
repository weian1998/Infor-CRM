/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
        'Sage/Groups/BaseGroupContextService',
        'dojo/string',
        'Sage/Data/SDataServiceRegistry',
        'dojo/_base/lang',
        'Sage/MainView/GroupMgr/GroupsListPanelConfig',
        'Sage/MainView/GroupMgr/ReleasesListPanelConfig',
        'Sage/MainView/GroupMgr/StatisticsListPanelConfig',
        'dojo/_base/declare',
        'dojo/i18n!./nls/GroupManagerGroupContextService',
        'Sage/Services/RoleSecurityService'
    ],
    function(
        BaseGroupContextService,
        dojoString,
        SDataServiceRegistry,
        lang,
        GroupsListPanelConfig,
        ReleasesListPanelConfig,
        StatisticsListPanelConfig,
        declare,
        nlsResources
    ) {
        var groupManagerGroupContextService = declare('Sage.MainView.GroupMgr.GroupManagerGroupContextService', BaseGroupContextService, {
            _currentContext: null,
            _currentTabId: false,
            _currentTabDescription: false,
            _currentListConfiguration: false,
            defaultTabId: 'all_groups',
            staticTabsConfiguration: [],
            _configsHash: false,
            _LOCALSTORE_NAMESPACE: 'GroupManagerView',
            _STORE_KEY_LASTAB: '_GroupManagerLASTTAB',
            _Group_FILTERS_KEY: '_GroupManagerFILTERS',
            _tabNameCache: {},
            constructor: function() {
                this.inherited(arguments);

                var svc = Sage.Services.getService('RoleSecurityService');
                if (svc) {
                    if (svc.hasAccess('Administration/GroupManager/View')) {
                        this._addConfig(0);
                        this._addConfig(1);
                        this._addConfig(2);
                    } else {
                        if (svc.hasAccess('Administration/GroupManager/Groups/View')) {
                            this._addConfig(0);
                        }
                        if (svc.hasAccess('Administration/GroupManager/Shared/View')) {
                            this._addConfig(1);
                        }
                        if (svc.hasAccess('Administration/GroupManager/UsageStatistics/View')) {
                            this._addConfig(2);
                        }
                    }
                } else {
                    this._addConfig(0);
                    this._addConfig(1);
                    this._addConfig(2);
                }

                this._currentContext = {};
                dojo.mixin(this._currentContext, this._emptyContext);
                this._currentContext.CurrentTableKeyField = "$key";
                this._currentContext.AppliedFilterInfo = {};
                this._currentContext.CurrentFamily = null;
                this._currentContext.notGroupBased = true;
                this.setContext(this._getDefaultTabId(), 'default');
                this.unsubscribeConnects();
                this._subscribes = [];
                this._subscribes.push(
                    dojo.subscribe(dojoString.substitute("/ui/filters/default/refresh"), this, this._onDefaultFilterRefresh)
                );
                this._onDefaultFilterLoad();
            },
            getStaticTabs: function() {
                return this.staticTabsConfiguration;
            },
            setCurrentGroup: function(id, name, keyField) {
                if (this._currentContext.CurrentGroupID === id) {
                    return;
                }
                this._currentContext.CurrentTableKeyField = keyField ? keyField : this.getKeyField(id);
                this.setContext(id, name ? name : this.getGroupName(id));
                this.onCurrentGroupChanged({ current: this._currentContext });
            },
            getContext: function() {
                return this._currentContext;
            },
            _addConfig: function(id) {
                switch (id) {
                    case 0:
                        this.staticTabsConfiguration.push(
                        {
                            key: 'all_groups',
                            descriptor: nlsResources.AllGroups,
                            keyField: "$key",
                            configProviderType: GroupsListPanelConfig,
                            entityName: 'groups',
                            isNonEntityBased: true
                        });
                        break;
                    case 1:
                        this.staticTabsConfiguration.push(
                        {
                            key: 'releases',
                            descriptor: nlsResources.Shares,
                            keyField: "$key",
                            configProviderType: ReleasesListPanelConfig,
                            entityName: 'groupReleasesView',
                            isNonEntityBased: false
                        });
                        break;
                    case 2:
                        this.staticTabsConfiguration.push(
                        {
                            key: 'statistics',
                            descriptor: nlsResources.UsageStatistics,
                            keyField: "$key",
                            configProviderType: StatisticsListPanelConfig,
                            entityName: 'groupStatisticsView',
                            isNonEntityBased: false
                        });
                        break;
                }
            },
            _ensureConfigsHash: function() {
                if (!this._configsHash) {
                    var hash = {};
                    for (var i = 0; i < this.staticTabsConfiguration.length; i++) {
                        var cfg = this.staticTabsConfiguration[i];
                        hash[cfg.key] = lang.mixin(cfg, { instance: false });
                    }
                    this.configsHash = hash;
                }
            },
            _setListConfig: function() {
                this._ensureConfigsHash();
                var tabId = this._currentContext.CurrentGroupID;
                var currConfig = (this.configsHash.hasOwnProperty(tabId)) ? this.configsHash[tabId] : this.configsHash['groups'];
                if (typeof currConfig === 'undefined' || !currConfig) return;
                if (!currConfig.instance) {
                    currConfig.instance = new currConfig.configProviderType();
                } else {
                    currConfig.instance.rebuild();
                }
                this._currentListConfiguration = currConfig.instance;
                this._currentListConfiguration.isNonEntityBased = currConfig.isNonEntityBased;
                this._currentListConfiguration.entityName = currConfig.entityName;
            },
            getCurrentListConfig: function() {
                this._setListConfig();
                return this._currentListConfiguration;
            },
            getKeyField: function(tabid) {
                this._ensureConfigsHash();
                var keyField = '$key';
                if (this.configsHash[tabid]) {
                    keyField = this.configsHash[tabid]['keyField'] || '$key';
                }
                return keyField;
            },
            getGroupName: function(tabid) {
                this._ensureConfigsHash();
                var name = 'default';
                if (this.configsHash[tabid]) {
                    name = this.configsHash[tabid]['descriptor'] || 'default';
                }
                return name;
            },
            onCurrentGroupChanged: function(options) {
                //We need to clear out the filter manager
                this._clearFilterManager();
                var self = this;
                this._onDefaultFilterLoad(function() {
                    dojo.publish('/group/context/changed', [options, self]);
                    self._saveToLocalStorage(self._STORE_KEY_LASTAB, self.getContext().CurrentGroupID);
                });
            },
            _clearFilterManager: function() {
                dojo.publish('/ui/filters/default/apply', [{}, {}, this]);
            },
            setContext: function(id, name) {
                this._currentContext.CurrentGroupID = id;
                this._currentContext.CurrentName = name;
                this._currentContext.AppliedFilterInfo = {};
                this._currentContext.filtersForEntity = "";
                this._setListConfig();
                this._currentContext.CurrentEntity = this._currentListConfiguration.entityName;
                this._currentContext.isNonEntityBased = this._currentListConfiguration.isNonEntityBased;
                this._isRetrievingContext = false;
                this.onContextSet(this._currentContext);
            },
            isContextRequired: function() {
                return !(Sage && Sage.Groups && Sage.Groups._groupContext);
            },
            //loads any currently applied filters
            _onDefaultFilterLoad: function(onSuccessCallBack) {
                this._requestGroupFilters(onSuccessCallBack);
            },
            //first we request the Group filters, which is cached then added to the getEntityFilters feed so that it can be properly parsed for applied filters
            _requestGroupFilters: function(onSuccessCallBack) {
                var context = this.getContext();
                var self = this;
                var service = SDataServiceRegistry.getSDataService('system');
                var request = new Sage.SData.Client.SDataResourcePropertyRequest(service);
                request.setResourceKind('groups');
                request.setResourceProperty('$queries/filters');
                request.setQueryArg('count', 20);
                request.readFeed({
                    success: function(filters) {
                        if (filters) {
                            context.filtersForEntity = dojo.toJson(filters.$resources);
                            self._requestFilters(onSuccessCallBack);
                        }
                    },
                    error: function(error) {
                        if (error) {
                            console.error(error);
                        }
                    },
                    scope: this,
                    async: false
                });
            },
            _requestFilters: function(onSuccessCallBack) {
                var context = this.getContext();
                var service = SDataServiceRegistry.getSDataService('system');
                var entry = {
                    '$name': 'getEntityFilters',
                    'request': {
                        'entityName': context.CurrentEntity,
                        'key': context.CurrentGroupID,
                        'isNonEntityBased': context.isNonEntityBased,
                        'filtersForEntity': context.filtersForEntity
                    }
                };
                var request = new Sage.SData.Client.SDataServiceOperationRequest(service);
                request.setOperationName('getEntityFilters');
                request.execute(entry, {
                    success: lang.hitch(this, function(result) {
                        try {
                            if (result.response.appliedFilterInfo) {
                                this._currentContext.AppliedFilterInfo.applied = result.response.appliedFilterInfo.applied;
                                this._currentContext.AppliedFilterInfo.definitionSet = result.response.appliedFilterInfo.definitionSet;
                            }
                            if (onSuccessCallBack) {
                                onSuccessCallBack();
                            }
                        } catch (err) {
                            console.error(err);
                        }
                    }),
                    failure: function(result) {
                        console.error(result);
                    },
                    async: false
                });
            },
            _onDefaultFilterRefresh: function(applied, definitionSet, filterManager) {
                var context = this.getContext();
                var service = SDataServiceRegistry.getSDataService('system'),
                    entry = {
                        '$name': 'applyFilterToEntity',
                        'request': {
                            'entityName': context.CurrentEntity,
                            'filter': dojo.toJson(filterManager.createValueSet()),
                            'key': context.CurrentGroupID,
                            'isNonEntityBased': context.isNonEntityBased,
                            'filtersForEntity': context.filtersForEntity
                        }
                    },
                    request = new Sage.SData.Client.SDataServiceOperationRequest(service).setOperationName('applyFilterToEntity');
                request.execute(entry, {});
            },
            _saveToLocalStorage: function(key, value, namespace) {
                this._saveToSessionStorage(key, value, namespace);
            },
            _getFromLocalStorage: function(key, namespace) {
                return this._getFromSessionStorage(key, namespace);
            },
            _getFromSessionStorage: function(key, namespace) {
                if (!namespace) {
                    namespace = this._LOCALSTORE_NAMESPACE;
                }
                var storeKey = namespace + "_" + key;
                return sessionStorage.getItem(storeKey);
            },
            _saveToSessionStorage: function(key, value, namespace) {
                if (!namespace) {
                    namespace = this._LOCALSTORE_NAMESPACE;
                }
                var storeKey = namespace + "_" + key;
                sessionStorage.setItem(storeKey, value);
            },
            _getDefaultTabId: function() {
                var urlTab = this._getUrlTabId();
                if (urlTab) {
                    urlTab = this._validateTabId(urlTab);
                    if (urlTab) {
                        return urlTab;
                    }
                }
                var lastTab = this._getFromLocalStorage(this._STORE_KEY_LASTAB);
                if (lastTab) {
                    this.defaultTabId = lastTab;
                } else {
                }
                //double check to make sure we really do have a config for this tab...
                if (!this._configsHash) {
                    for (var i = 0; i < this.staticTabsConfiguration; i++) {
                        if (this.defaultTabId === this.staticTabsConfiguration[i]['key']) {
                            return this.defaultTabId;
                        }
                    }
                }
                return this.defaultTabId;
            },
            _getUrlTabId: function() {
                var tabId = false,
                    regexS = "[\\?&]tabId=([^%#]*)",
                    regex = new RegExp(regexS),
                    results = regex.exec(window.location.href);

                if (results !== null) {
                    tabId = results[1];
                }
                return tabId;
            },
            _validateTabId: function(tabId) {
                if (tabId) {
                    for (var i = 0; i < this.staticTabsConfiguration.length; i++) {
                        var cfg = this.staticTabsConfiguration[i];
                        if (cfg.key.toUpperCase() === tabId.toUpperCase()) {
                            return cfg.key;
                        }
                    }
                }
                return null;
            }
        });
        if (!Sage.Services.hasService('ClientGroupContext')) {
            Sage.Services.addService('ClientGroupContext', new groupManagerGroupContextService());
        } else {
            var clientGroupContextService = Sage.Services.getService('ClientGroupContext');
            if (clientGroupContextService.declaredClass !== 'Sage.MainView.GroupMgr.GroupManagerGroupContextService') {
                clientGroupContextService.unsubscribeConnects();
                Sage.Services.removeService('ClientGroupContext');
                Sage.Services.addService('ClientGroupContext', new groupManagerGroupContextService());
            }
        }
        return groupManagerGroupContextService;
    });