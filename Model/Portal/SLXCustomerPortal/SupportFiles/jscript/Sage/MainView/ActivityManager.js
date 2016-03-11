/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/UI/SDataMainViewConfigurationProvider',
    'Sage/UI/ListPanel',
    'Sage/Utility',
    'Sage/Utility/Activity',
    'Sage/MainView/ActivityMgr/ActivityGroupContextService',
    'Sage/Services/ActivityService',
    'Sage/MainView/ActivityMgr/FilterConfigurationProvider',
    'dojo/i18n!./nls/ActivityManager',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/Deferred',
     'require',
    'Sage/Extensions/Activity/ActivityListCustomTabs/CustomTabsConfig',
    'Sage/Extensions/Activity/ListPanelOverrides/ListPanelOverridesConfig',
    'Sage/Extensions/ActivityRequirements'

],

function (
    SDataMainViewConfigurationProvider,
    ListPanel,
    SageUtility,
    UtilityActivity,
    activityGroupContextService,
    ActivityService,
    FilterConfigurationProvider,
    nlsStrings,
    declare,
    lang,
    deferred,
    require,
    customTabs,
    listPanelOverrides
) {
    var actvityManager = declare('Sage.MainView.ActivityManager', SDataMainViewConfigurationProvider, {
        _nlsResources: false,
        _currentTabId: false,
        _currentTabDescription: false,
        _currentUserId: false,
        _currentKeyField: '$key',
        _groupContextService: false,
        _tabNameCache: {},
        _mainViewName: 'ActivityManager',
        store: false,
        custTabs: {},
        custTabConfigs: null,
        configTypes: null,
        listPanelOverrides: {},
        listPanelOverrideConfigs: null,
        _custTabConfigType: {},
        constructor: function (options) {
            this._nlsResources = nlsStrings;
            this._currentUserId = 'x';
            var grpContextSvc = Sage.Services.getService('ClientGroupContext');
            if (!grpContextSvc || grpContextSvc.declaredClass !== 'Sage.MainView.ActivityMgr.ActivityGroupContextService') {
                Sage.Services.removeService('ClientGroupContext');
                grpContextSvc = new activityGroupContextService();
                Sage.Services.addService('ClientGroupContext', grpContextSvc);
            }

            var ctx = grpContextSvc.getContext();
            this._currentTabId = ctx.CurrentGroupID;
            this._currentTabDescription = ctx.CurrentName;

            var clientContextSvc = Sage.Services.getService('ClientContextService');
            if (clientContextSvc) {

                if (clientContextSvc.containsKey("userID")) {
                    this._currentUserId = clientContextSvc.getValue("userID");
                }
            }

            this.titlePaneConfiguration = {
                tabs: this._getTabsConfig(),
                menu: this._getMenuConfig(),
                titleFmtString: this._nlsResources.titleFmtString || '${0}'
            };
            dojo.subscribe('/group/context/changed', this, '_onCurrentGroupChanged');



            lang.mixin(this.custTabs, customTabs);

            lang.mixin(this.listPanelOverrides, listPanelOverrides);

            this.configTypes = grpContextSvc.groupConfigTypes;

            //List Panel Override Section                          
            if (this.listPanelOverrides && this.listPanelOverrides.overrideConfigs) {
                this.listPanelOverrideConfigs = this.listPanelOverrides.overrideConfigs;
                //Get the new configuration and override
                for (var x = 0; x < this.listPanelOverrideConfigs.length; x++) {
                    this._overrideTab(this.listPanelOverrideConfigs[x].listId, this.listPanelOverrideConfigs[x].newConfig, grpContextSvc.groupConfigTypes);
                }
            }

            //Custom tabs Section                          
            if (this.custTabs && this.custTabs.configTypes) {
                this.custTabConfigs = this.custTabs.configTypes;
                //Add the custom tabs to the list of configurations:
                for (var y = 0; y < this.custTabConfigs.length; y++) {
                    this._addCustomTab(grpContextSvc.groupConfigTypes, this.custTabConfigs[y]);
                }
            }



        },
        _setListPanelConfig: function () {
            var grpContextSvc = Sage.Services.getService('ClientGroupContext');
            if (grpContextSvc) {
                this.listPanelConfiguration = grpContextSvc.getCurrentListConfig();
                this.store = this.listPanelConfiguration.list.store;
                this.service = this.listPanelConfiguration.list.store.service;
            }
            return;
        },
        _getListPanelConfig: function () {

            this._setListPanelConfig();
            return this.listPanelConfiguration;
        },
        requestConfiguration: function (options) {
            //returns the list panel configuration through the success callback method...
            if (options.success) {
                options.success.call(options.scope || this, this._getListPanelConfig(), this);
            }
        },
        requestTitlePaneConfiguration: function (options) {
            if (options.success) {
                options.success.call(options.scope || this, this.titlePaneConfiguration, this);
            }
        },
        onConfigurationChange: function (obj) {
        },
        onTitlePaneConfigurationChange: function () {
        },
        _setUIForNewTab: function (tabId, tabDescription) {
            this._currentTabId = tabId;
            this._currentTabDescription = tabDescription;
        },
        _onCurrentGroupChanged: function (args) {
            var context = args['current'];
            if (!context) {
                var groupContextSvc = Sage.Services.getService('ClientGroupContext');
                context = groupContextSvc.getContext();
            }
            if (dijit.byId('GroupTabs').selectedChildWidget.id !== context.CurrentGroupID) {
                dijit.byId('GroupTabs').selectChild(context.CurrentGroupID);
            }
        },
        _onTabSelected: function (tab) {
            var grpContextSvc = Sage.Services.getService('ClientGroupContext');
            var id = tab.id || tab;
            var keyField = grpContextSvc.getKeyField(id);
            if (grpContextSvc) {
                var ctx = grpContextSvc.getContext();
                if (ctx.CurrentGroupID === id) {
                    return;
                }
                this._setUIForNewTab(id, tab.title);
                grpContextSvc.setCurrentGroup(id, tab.title, keyField);
            }
        },
        _getTabsConfig: function () {
            var tabsConfig = {
                store: false,
                selectedTabId: this._currentTabId,
                tabKeyProperty: 'key',
                tabNameProperty: 'descriptor',
                fetchParams: {},
                staticTabs: this._getStaticTabs(),
                onTabSelect: dojo.hitch(this, '_onTabSelected'),
                onTabClose: false,
                showTabContextMenus: false
            };
            return tabsConfig;
        },
        _getStaticTabs: function () {
            var grpContextSvc = Sage.Services.getService('ClientGroupContext');
            var staticTabs = grpContextSvc.getStaticTabs();
            return staticTabs;
        },
        _getMenuConfig: function () {
            return false;
        },
        _overrideTab: function (listId, newConfigPath, groupConfigTypes) {
            this._dynamicRequire(newConfigPath, function (newConfigProviderType) {
                for (var i = 0; i < groupConfigTypes.length; i++) {
                    if (groupConfigTypes[i].key.toUpperCase() === listId.toUpperCase()) {
                        groupConfigTypes[i].configProviderType = newConfigProviderType;
                    }
                }
            });

        },
        _addCustomTab: function (configTypes, configData) {
            this._dynamicRequire(configData.configProviderType, function (newConfigProviderType) {
                configData.configProviderType = newConfigProviderType;
                configTypes.push(configData);
            });
        },
        _dynamicRequire: function (modulePath, callback) {
            var myRequireDeferred = new deferred();
            require([modulePath],
                function (requirement) {
                    myRequireDeferred.resolve(requirement);
                }
            );
            myRequireDeferred.then(
                function (module) {
                    callback(module);
                },
                function (err) {
                    console.error('Error: _dynamicRequire :  Attempted to add an unknown module type .', err);
                }
            );
        }
    });
    return actvityManager;
});