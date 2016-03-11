/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/Groups/BaseGroupContextService',
    'dojo/string',
    'Sage/Data/SDataServiceRegistry',
    'dojo/_base/lang',
    'Sage/MainView/EntityMgr/EntityListPanelConfig',
    'dojo/_base/declare',
    'dojo/i18n!./nls/EntityManagerGroupContextService',
    'Sage/Services/UserOptions'
],
function (
    BaseGroupContextService,
    dojoString,
    SDataServiceRegistry,
    lang,
    EntityListPanelConfig,
    declare,
    nlsResources
) {
        var entityManagerGroupContextService = declare('Sage.MainView.EntityMgr.EntityManagerGroupContextService', BaseGroupContextService, {
            _currentContext: null,
            _currentTabId: false,
            _currentTabDescription: false,
            _currentListConfiguration: false,
            defaultTabId: 'entity',
            staticTabsConfiguration: [
                {
                    key: 'entity',
                    descriptor: 'Entities',//nlsResources.entityTabDisplayName,
                    keyField: "$key",
                    configProviderType: EntityListPanelConfig,
                    entityName: 'Entities',
                    isNonEntityBased: true
                }
            ],
            _configsHash: false,
            _LOCALSTORE_NAMESPACE: 'EntityManagerView',
            _STORE_KEY_LASTAB: '_LASTTAB',
            _ENTITY_FILTERS_KEY: '_ENTITYFILTERS',
            _tabNameCache: {},
            constructor: function () {
                this.inherited(arguments);
                this._currentContext = {};
                dojo.mixin(this._currentContext, this._emptyContext);
                lang.mixin(this, nlsResources);
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
            getStaticTabs: function () {
                return this.staticTabsConfiguration;
            },
            setCurrentGroup: function (id, name, keyField) {
                if (this._currentContext.CurrentGroupID === id) {
                    return;
                }
                this._currentContext.CurrentTableKeyField = keyField ? keyField : this.getKeyField(id);
                this.setContext(id, name ? name : this.getGroupName(id));
                this.onCurrentGroupChanged({ current: this._currentContext });
            },
            getContext: function () {
                return this._currentContext;
            },
            _ensureConfigsHash: function () {
                if (!this._configsHash) {
                    var hash = {};
                    for (var i = 0; i < this.staticTabsConfiguration.length; i++) {
                        var cfg = this.staticTabsConfiguration[i];
                        hash[cfg.key] = lang.mixin(cfg, { instance: false });
                    }
                    this.configsHash = hash;
                }
            },
            _setListConfig: function () {
                this._ensureConfigsHash();
                var tabId = this._currentContext.CurrentGroupID;
                var currConfig = (this.configsHash.hasOwnProperty(tabId)) ? this.configsHash[tabId] : this.configsHash['groups'];
                if (!currConfig.instance) {
                    currConfig.instance = new currConfig.configProviderType();
                } else {
                    currConfig.instance.rebuild();
                }
                this._currentListConfiguration = currConfig.instance;
                this._currentListConfiguration.isNonEntityBased = currConfig.isNonEntityBased;
                this._currentListConfiguration.entityName = currConfig.entityName;
            },
            getCurrentListConfig: function () {
                this._setListConfig();
                return this._currentListConfiguration;
            },
            getKeyField: function (tabid) {
                this._ensureConfigsHash();
                var keyField = '$key';
                if (this.configsHash[tabid]) {
                    keyField = this.configsHash[tabid]['keyField'] || '$key';
                }
                return keyField;
            },
            getGroupName: function (tabid) {
                this._ensureConfigsHash();
                var name = 'default';
                if (this.configsHash[tabid]) {
                    name = this.configsHash[tabid]['descriptor'] || 'default';
                }
                return name;
            },
            onCurrentGroupChanged: function (options) {
                //We need to clear out the filter manager
                this._clearFilterManager();
                var self = this;
                this._onDefaultFilterLoad(function () {
                    dojo.publish('/group/context/changed', [options, self]);
                    self._saveToLocalStorage(self._STORE_KEY_LASTAB, self.getContext().CurrentGroupID);
                });
            },
            _clearFilterManager: function () {
                dojo.publish('/ui/filters/default/apply', [{}, {}, this]);
            },
            setContext: function (id, name) {
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
            isContextRequired: function () {
                return !(Sage && Sage.Groups && Sage.Groups._groupContext);
            },
            //loads any currently applied filters
            _onDefaultFilterLoad: function (onSuccessCallBack) {
                this._requestFilters(onSuccessCallBack);
            },
            _requestFilters: function (onSuccessCallBack) {

                var definitionSet = [
                    {
                        "id": "DisplayName",
                        "propertyName": "$descriptor",
                        "$descriptor": "DisplayName",
                        "propertyDataTypeId": "ccc0f01d-7ba5-408e-8526-a3f942354b3a",
                        "displayName": this.filterDisplayName,
                        "filterName": "DisplayName",
                        "filterType": "lookupFilter",
                        "characters": 0
                    }, {
                    "id": "EntityName",
                    "propertyName": "name",
                    "$descriptor": "EntityName",
                    "propertyDataTypeId": "ccc0f01d-7ba5-408e-8526-a3f942354b3a",
                    "displayName": this.filterName,
                    "filterName": "EntityName",
                    "filterType": "lookupFilter",
                    "characters": 0
                }, {
                    "id": "ModifiedDate",
                    "displayName": this.filterModifiedDate,
                    "filterName": "ModifiedDate",
                    "propertyName": "$updated",
                    "$descriptor": "ModifiedDate",
                    "filterType": "rangeFilter",
                    "propertyDataTypeId" : "1f08f2eb-87c8-443b-a7c2-a51f590923f5",
                    "characters": 0
                }, {
                    "id": "HasMeasure",
                    "displayName": this.filterHasMetric,
                    "filterName": "HasMeasure",
                    "propertyName": "filters.filterType",
                    "$descriptor": "HasMeasure",
                    "filterType": "checkedList",
                    "propertyDataTypeId": "ccc0f01d-7ba5-408e-8526-a3f942354b3a",
                    "characters": 0
                }, {
                    "id": "HasFilter",
                    "displayName": this.filterHasFilter,
                    "filterName": "HasFilter",
                    "propertyName": "filters.filterType",
                    "$descriptor": "HasFilter",
                    "filterType": "checkedList",
                    "propertyDataTypeId": "ccc0f01d-7ba5-408e-8526-a3f942354b3a",
                    "characters": 0
                }];
                var optionsSvc = Sage.Services.getService('UserOptions');
                this._indirectSelection = 'false';
                if (optionsSvc && optionsSvc.get) {
                    optionsSvc.get('FilterSearchCriteria', 'EntityManager', lang.hitch(this, function (data) {
                        if (data && data.value) {
                            this._currentContext.AppliedFilterInfo.applied = JSON.parse(data && data.value);
                        }
						this._currentContext.AppliedFilterInfo.definitionSet = definitionSet;
                    }), null, this, false);
                }
            },
            _onDefaultFilterRefresh: function (applied, definitionSet, filterManager) {
                var filter = dojo.toJson(filterManager.createEntityManagerValueSet());
                var optionsSvc = Sage.Services.getService('UserOptions');
                if (optionsSvc) {
                    optionsSvc.set('FilterSearchCriteria', 'EntityManager', filter, null, null, this);
                    }
                },
            _saveToLocalStorage: function (key, value, namespace) {
                this._saveToSessionStorage(key, value, namespace);
            },
            _getFromLocalStorage: function (key, namespace) {
                return this._getFromSessionStorage(key, namespace);
            },
            _getFromSessionStorage: function (key, namespace) {
                if (!namespace) {
                    namespace = this._LOCALSTORE_NAMESPACE;
                }
                var storeKey = namespace + "_" + key;
                return sessionStorage.getItem(storeKey);
            },
            _saveToSessionStorage: function (key, value, namespace) {
                if (!namespace) {
                    namespace = this._LOCALSTORE_NAMESPACE;
                }
                var storeKey = namespace + "_" + key;
                sessionStorage.setItem(storeKey, value);
            },
            _getDefaultTabId: function () {
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
            _getUrlTabId: function () {
                var tabId = false,
                    regexS = "[\\?&]tabId=([^%#]*)",
                    regex = new RegExp(regexS),
                    results = regex.exec(window.location.href);

                if (results !== null) {
                    tabId = results[1];
                }
                return tabId;
            },
            _validateTabId: function (tabId) {
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
        Sage.Services.addService('ClientGroupContext', new entityManagerGroupContextService());
    } else {
        var clientGroupContextService = Sage.Services.getService('ClientGroupContext');
        if (clientGroupContextService.declaredClass !== 'Sage.MainView.EntityMgr.EntityManagerGroupContextService') {
            clientGroupContextService.unsubscribeConnects();
            Sage.Services.removeService('ClientGroupContext');
            Sage.Services.addService('ClientGroupContext', new entityManagerGroupContextService());
        }
    }
    return entityManagerGroupContextService;
});