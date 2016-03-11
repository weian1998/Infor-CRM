/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/Groups/BaseGroupContextService',
    'dojo/string',
    'Sage/Data/SDataServiceRegistry',
    'dojo/_base/lang',
    'Sage/MainView/JobMgr/ExecutionsListPanelConfig',
    'Sage/MainView/JobMgr/JobDefinitionsListPanelConfig',
    'Sage/MainView/JobMgr/SchedulesListPanelConfig',
    'dojox/storage/LocalStorageProvider',
    'dojo/_base/declare',
    'dojo/i18n!./nls/JobManagerGroupContextService'
],
function (
    BaseGroupContextService,
    dojoString,
    sDataServiceRegistry,
    lang,
    executionsListPanelConfig,
    jobDefinitionsListPanelConfig,
    schedulesListPanelConfig,
    localStorageProvider,
    declare,
    i18nStrings
) {
    var jobManagerGroupContextService = declare('Sage.MainView.JobMgr.JobManagerGroupContextService', BaseGroupContextService, {
        _currentContext: null,
        _currentTabId: false,
        _currentTabDescription: false,
        _currentUserId: false,
        _currentKeyField: '$key',
        _currentListConfiguration: false,
        groupConfigTypes: [
            {
                key: 'executions',
                descriptor: i18nStrings.executionsTabDisplayName,
                keyField: "$key",
                configProviderType: executionsListPanelConfig
            },
            {
                key: 'jobDefinitions',
                descriptor: i18nStrings.jobDefinitionsTabDisplayName,
                keyField: "$key",
                configProviderType: jobDefinitionsListPanelConfig
            },
            {
                key: 'schedules',
                descriptor: i18nStrings.schedulesTabDisplayName,
                keyField: "$key",
                configProviderType: schedulesListPanelConfig
            }
        ],
        _configsHash: false,
        _LOCALSTORE_NAMESPACE: 'JobManagerView',
        _STORE_KEY_LASTAB: '_LASTTAB',
        _tabNameCache: {},
        constructor: function () {
            this.inherited(arguments);
            this._currentContext = {};
            dojo.mixin(this._currentContext, this._emptyContext);
            this._currentContext.CurrentTableKeyField = "$key";
            this._currentContext.AppliedFilterInfo = {};
            this._currentContext.CurrentFamily = null;
            this._currentContext.notGroupBased = true;
            var defaultTabId = this._getDefaultTabId();
            this.setContext(defaultTabId, 'default');
            this.unsubscribeConnects();
            this._subscribes = [];
            this._subscribes.push(
                dojo.subscribe(dojoString.substitute("/ui/filters/default/refresh"), this, this._onDefaultFilterRefresh)
            );
            this._onDefaultFilterLoad();
        },
        buildCurrentEntityContext: function () {
            var groupId = this._currentContext.CurrentGroupID;
            if (!groupId) {
                return;
            }
            if (this._currentListConfiguration) {
                this._currentContext.CurrentEntity = this._currentListConfiguration.entityName;
                this._currentContext.CurrentTableKeyField = this.getKeyField(groupId);
                if (!this._currentContext.CurrentName) {
                    this._currentContext.CurrentName = this.getGroupName(groupId);
                }
            }
        },
        _ensureConfigsHash: function () {
            if (!this._configsHash) {
                var hash = {};
                for (var i = 0; i < this.groupConfigTypes.length; i++) {
                    var cfg = this.groupConfigTypes[i];
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
                this.onTabConfigCreated(currConfig.instance);
            } else {
                currConfig.instance.rebuild();
            }
            this._currentListConfiguration = currConfig.instance;

            //Get SData Service for Scheduling endpoint, set service for ExecutionsListPanelConfig
            var jobService = Sage.Services.getService('JobService');
            var sdataService = jobService.getSchedulingSDataService();
            this._currentListConfiguration.list.service = sdataService;
            return;
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
            var self = this;
            dojo.publish('/group/context/changed', [options, this]);
            //clear out the filter manager  
            this._clearFilterManager();
            this._onDefaultFilterLoad(function () {
                var context = self.getContext();
                self._saveToLocalStorage(self._STORE_KEY_LASTAB, context.CurrentGroupID);
            });
        },
        _clearFilterManager: function () {
            var applied = {};
            var definitionSet = {};
            dojo.publish('/ui/filters/default/apply', [applied, definitionSet, this]);
        },
        getContext: function () {
            if (this._currentContext.CurrentGroupID === null) {
                this.requestContext();
            }
            this.buildCurrentEntityContext();
            return this._currentContext;
        },
        requestContext: function () {
            if (this._isRetrievingContext === true) {
                return;
            }
        },
        setContext: function (id, name) {
            this._currentContext.CurrentGroupID = id;
            this._currentContext.CurrentName = name;
            this._setListConfig();
            this.buildCurrentEntityContext();
            this._isRetrievingContext = false;
            this.onContextSet(this._currentContext);
        },
        isContextRequired: function () {
            return !(Sage && Sage.Groups && Sage.Groups._groupContext);
        },
        setCurrentGroup: function (id, name, keyField) {
            if (this._currentContext.CurrentGroupID === id) {
                return;
            }
            if (!name || !keyField) {
                this._currentContext.CurrentGroupID = id;
                this._currentContext.CurrentName = false;
                this.buildCurrentEntityContext(); //this sets the keyField and name
                name = this._currentContext.CurrentName;
            } else {
                this._currentContext.CurrentTableKeyField = keyField;
            }
            this.setContext(id, name);
            this.onCurrentGroupChanged({ current: this._currentContext });
        },
        _onDefaultFilterLoad: function (onSuccessCallBack) {
            //The code below does not work for the Job Manager

            /*
            var context = this.getContext(),
            service = SDataServiceRegistry.getSDataService('system'),
            request,
            entry = {
            '$name': 'getEntityFilters',
            'request': {
            'entityName': context.CurrentEntity,
            'key': context.CurrentGroupID
            }
            };
            request = new Sage.SData.Client.SDataServiceOperationRequest(service)
            .setOperationName('getEntityFilters');

            request.execute(entry, {
            success: lang.hitch(this, function (result) {
            try {
            if (result.response.appliedFilterInfo) {
            this._currentContext.AppliedFilterInfo.applied = result.response.appliedFilterInfo.applied;
            this._currentContext.AppliedFilterInfo.definitionSet = result.response.appliedFilterInfo.definitionSet;
            if (onSuccessCallBack) {
            onSuccessCallBack();
            }
            }
            } catch (err) {
            console.error(err);
            }
            }),
            failure: function (result) {
            console.error(result);
            },
            async: false
            });*/
        },
        _onDefaultFilterRefresh: function (applied, definitionSet, filterManager) {
            var context = this.getContext(),
                service = sDataServiceRegistry.getSDataService('system'),
                entry = {
                    '$name': 'applyFilterToEntity',
                    'request': {
                        'entityName': context.CurrentEntity,
                        'filter': dojo.toJson(filterManager.createValueSet()),
                        'key': context.CurrentGroupID
                    }
                },
                request = new Sage.SData.Client.SDataServiceOperationRequest(service)
                    .setOperationName('applyFilterToEntity');
            request.execute(entry, {});
        },
        getStaticTabs: function () {
            return this.groupConfigTypes;
        },
        _saveToLocalStorage: function (key, value, namespace) {
            this._saveToSessionStorage(key, value, namespace);
            return;
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
            var defaultTabId = 'executions';
            var urlTab = this._getUrlTabId();
            if (urlTab) {
                urlTab = this._validateTabId(urlTab);
                if (urlTab) {
                    return urlTab;
                }
            }

            var lastTab = this._getFromLocalStorage(this._STORE_KEY_LASTAB);
            if (lastTab) {
                defaultTabId = lastTab;
            }
            //double check to make sure we really do have a config for this tab...
            if (!this._configsHash) {
                for (var i = 0; i < this.groupConfigTypes; i++) {
                    if (defaultTabId === this.groupConfigTypes[i]['key']) {
                        return defaultTabId;
                    }
                }
            }
            return defaultTabId;
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
                for (var i = 0; i < this.groupConfigTypes.length; i++) {
                    var cfg = this.groupConfigTypes[i];
                    if (cfg.key.toUpperCase() === tabId.toUpperCase()) {
                        return cfg.key;
                    }
                }
            }
            return null;
        },
        onTabConfigCreated: function (tabConfig) {
        }
    });
    if (!Sage.Services.hasService('ClientGroupContext')) {
        Sage.Services.addService('ClientGroupContext', new jobManagerGroupContextService());

    } else {
        var clientGroupContextService = Sage.Services.getService('ClientGroupContext');
        if (clientGroupContextService.declaredClass !== 'Sage.MainView.JobMgr.JobManagerGroupContextService') {
            clientGroupContextService.unsubscribeConnects();
            Sage.Services.removeService('ClientGroupContext');
            Sage.Services.addService('ClientGroupContext', new jobManagerGroupContextService());
        }
    }
    return jobManagerGroupContextService;
});