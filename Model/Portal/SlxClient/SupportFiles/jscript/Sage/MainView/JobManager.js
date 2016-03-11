/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define, JobManagerGroupContextService */
define([
    'Sage/UI/SDataMainViewConfigurationProvider',
    'Sage/UI/ListPanel',
    'Sage/Utility',
    'Sage/MainView/JobMgr/JobManagerGroupContextService',
    'Sage/MainView/JobMgr/FilterConfigurationProvider',
    'dojo/_base/declare',
    'Sage/MainView/JobMgr/JobManagerActions'
],
function(
    SDataMainViewConfigurationProvider,
    listPanel,
    sageUtility,
    jobManagerGroupContextService,
    filterConfigurationProvider,
    declare
) {
    var jobManager = declare('Sage.MainView.JobManager', SDataMainViewConfigurationProvider, {
        _currentTabId: false,
        _currentTabDescription: false,
        _currentKeyField: '$key',
        _groupContextService: false,
        _tabNameCache: {},
        _mainViewName: 'JobManager',
        store: false,
        constructor: function(options) {
            var grpContextSvc = Sage.Services.getService('ClientGroupContext');
            if (!grpContextSvc || grpContextSvc.declaredClass !== 'Sage.MainView.JobMgr.JobManagerGroupContextService') {
                Sage.Services.removeService('ClientGroupContext');
                grpContextSvc = new JobManagerGroupContextService();
                Sage.Services.addService('ClientGroupContext', grpContextSvc);
            }

            var ctx = grpContextSvc.getContext();
            this._currentTabId = ctx.CurrentGroupID;
            this._currentTabDescription = ctx.CurrentName;

            this.titlePaneConfiguration = {
                tabs: this._getTabsConfig(),
                menu: this._getMenuConfig(),
                titleFmtString: '${0}'
            };
            dojo.subscribe('/group/context/changed', this, '_onCurrentGroupChanged');
        },
        _setListPanelConfig: function() {
            var grpContextSvc = Sage.Services.getService('ClientGroupContext');
            if (grpContextSvc) {
                this.listPanelConfiguration = grpContextSvc.getCurrentListConfig();
                this.store = this.listPanelConfiguration.list.store;
                this.service = this.listPanelConfiguration.list.store.service;
            }
        },
        _getListPanelConfig: function() {
            this._setListPanelConfig();
            return this.listPanelConfiguration;
        },
        requestConfiguration: function(options) {
            if (options.success) {
                options.success.call(options.scope || this, this._getListPanelConfig(), this);
            }
        },
        requestTitlePaneConfiguration: function(options) {
            if (options.success) {
                options.success.call(options.scope || this, this.titlePaneConfiguration, this);
            }
        },
        _setUIForNewTab: function(tabId, tabDescription) {
            this._currentTabId = tabId;
            this._currentTabDescription = tabDescription;
        },
        _onCurrentGroupChanged: function(args) {
            var context = args['current'];
            if (!context) {
                var groupContextSvc = Sage.Services.getService('ClientGroupContext');
                context = groupContextSvc.getContext();
            }

            if (dijit.byId('GroupTabs').selectedChildWidget.id !== context.CurrentGroupID) {
                dijit.byId('GroupTabs').selectChild(context.CurrentGroupID);
            }
        },
        _onTabSelected: function(tab) {
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
        _getTabsConfig: function() {
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
        //Do not remove
        _getStaticTabs: function() {
            var grpContextSvc = Sage.Services.getService('ClientGroupContext');
            var staticTabs = grpContextSvc.getStaticTabs();
            return staticTabs;
        },
        //Do not remove
        _getMenuConfig: function() {
            return false;
        }
    });
    return jobManager;
});
