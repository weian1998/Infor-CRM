/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/_ConfigurationProvider',
    'Sage/Services/JobService',
    'Sage/Data/SDataServiceRegistry',
    'Sage/Data/SDataStore',
    'dijit/Menu',
    'dijit/PopupMenuItem',
    'dijit/MenuSeparator',
    'Sage/UI/MenuItem',
    'dojo/i18n!./nls/BaseListPanelConfig',
    'dijit/registry',
    'dojo/_base/declare'
],
function (
   _ConfigurationProvider,
   JobService,
   sDataServiceRegistry,
   SDataStore,
   Menu,
   PopupMenuItem,
   MenuSeparator,
   MenuItem,
   nlsResources,
   registry,
   declare
   ) {
    var baseListPanelConfig = declare('Sage.MainView.JobMgr.BaseListPanelConfig', [_ConfigurationProvider], {
        list: false,
        detail: false,
        summary: false,
        toolBar: false,
        _listId: false,
        _store: false,
        _sDataService: false,
        _where: false,
        _sort: false,
        _select: false,
        _include: false,
        _structure: false,
        _currentUserId: false,
        _resourceKind: false,
        _nlsResources: false,
        _securedAction: '',
        keyField: "$key",
        hasCompositeKey: false,
        _menuItems: null,
        _contextMenu: false,
        _summaryformaterScope: false,
        entityName: false,
        rebuildMenus: true,
        rebuildOnRefresh: false,
        constructor: function () {
            var jobService = Sage.Services.getService('JobService');
            this._sDataService = jobService.getSchedulingSDataService();
            this._nlsResources = nlsResources;
            var clientContextSvc = Sage.Services.getService('ClientContextService');
            if (clientContextSvc) {
                if (clientContextSvc.containsKey("userID")) {
                    this._currentUserId = clientContextSvc.getValue("userID");
                }
            }
            this._include = this._getInclude();
            this._menuItems = [];
        },
        rebuild: function () {
            this._where = this._getWhere();
            this._structure = this._getStructure();
            this.list = this._getListConfig();
            this.summary = this._getSummaryConfig();
            this.detail = this._getDetailConfig();
            this.toolBar = this._getToolBars();
        },
        _getListConfig: function () {
            if (!this._store) {
                this._store = this._getStore();
            } else {
                this._store.where = this._where;
            }
            var listConfig = {
                id: this._listId,
                structure: this._structure,
                store: this._store,
                selectedRegionContextMenuItems: this._getListContextMenuItems(),
                onSelectedRegionContextMenu: this._onListContext,
                selectionMode: 'single'
            };
            return listConfig;
        },
        _getStore: function () {
            var store = new SDataStore({
                id: this._listId,
                service: this._sDataService,
                resourceKind: this._resourceKind,
                include: this._include,
                select: this._select,
                sort: this._sort,
                where: this._where
            });
            return store;
        },
        _getSelect: function () {
            var select = [];
            return select;
        },
        _getInclude: function () {
            var includes = [];
            return includes;
        },
        _getSort: function () {
            var sort = [];
            return sort;
        },
        _getWhere: function () {
            var where = '';
            return where;
        },
        _getStructure: function () {
            var structure = [];
            return structure;
        },
        _getSummaryConfig: function () {
            var store = new SDataStore({
                id: this._listId,
                service: this._sDataService,
                resourceKind: this._resourceKind,
                include: [],
                select: ['$key'],
                where: this._where
            });
            var structure = [
                {
                    field: '$key',
                    formatter: 'formatSummary',
                    width: '100%',
                    name: 'Summary View'
                }
            ];
            var formatScope = this._getFormatterScope();
            var summaryConfig = {
                structure: structure,
                layout: 'layout',
                store: store,
                rowHeight: 170,
                rowsPerPage: 10,
                formatterScope: formatScope
            };
            return summaryConfig;
        },
        _getFormatterScope: function () {
            return false;
        },
        _getDetailConfig: function () {
            return false;
        },
        _getToolBars: function () {
            var toolBars = { items: [] };
            return toolBars;
        },
        _getListContextMenuItems: function () {
            if (!this._contextMenu) {
                return;
            }
            if (this._menuItems.length > 0) {
                return this._menuItems;
            }
            if (!Sage.UI.DataStore.ContextMenus) {
                return [];
            }

            if (!Sage.UI.DataStore.ContextMenus.listContextMenu) {
                return [];
            }
            if (this._menuItems.length > 0) {
                this._menuItems[0].destroyDescendants();
            }
            this._menuItems = [];
            var menuConfig = Sage.UI.DataStore.ContextMenus.listContextMenu.items;
            var len = menuConfig.length;

            for (var i = 0; i < len; i++) {
                var mDef = menuConfig[i];
                if (mDef.id === this._currentListContextSubMenu) {
                    this._buildChildMenu(mDef.submenu, null);
                }
            }
            return this._menuItems;
        },
        _getGridMenu: function () {
            var container = dijit.byId('_listContextmenu');
            return container;
        },
        _buildChildMenu: function (parentMenuDef, parentMenu) {
            var len = parentMenuDef.length;
            for (var i = 0; i < len; i++) {
                var mDef = parentMenuDef[i];
                if (mDef.submenu.length > 0) {
                    var subMenu = new Menu();
                    this._buildChildMenu(mDef.submenu, subMenu);
                    var popsubMenu = new PopupMenuItem({
                        label: mDef.text,
                        popup: subMenu
                    });
                    if (parentMenu) {
                        parentMenu.addChild(popsubMenu);
                    }
                    else {
                        this._menuItems.push(popsubMenu);
                    }
                }
                else {
                    var menuItem = null;
                    if ((mDef.text === '-') || (mDef.text === ' ') || (mDef.isspacer)) {
                        menuItem = new MenuSeparator();
                    } else {
                        var href = mDef.href;
                        if (href.indexOf('javascript:') < 0) {
                            href = dojo.string.substitute("javascript:${0}()", [href]);
                        }
                        menuItem = new MenuItem({
                            label: mDef.text || '...',
                            icon: mDef.img,
                            title: mDef.tooltip || '',
                            ref: href,
                            onClick: function () {
                                if (this.ref !== '') {
                                    try {
                                        window.location.href = this.ref;
                                    } catch (e) { }
                                }
                            }
                        });
                    }
                    if (parentMenu) {
                        parentMenu.addChild(menuItem);
                    }
                    else {
                        this._menuItems.push(menuItem);
                    }
                }
            }
        },
        _onListContext: function () {
        },
        getFilterConfig: function (metaDataService, entry, options) {
            console.log("getFilterConfig");
            var systemService = this._sDataService;
            var metaService = metaDataService;
            var entityName = this.entityName;
            var resourceKind = this._resourceKind;
            var where = this._where;
            var configuration = {};
            var request = new Sage.SData.Client.SDataResourcePropertyRequest(metaService);
            request.setResourceKind('executions');
            request.setResourceSelector('"' + entityName + '"');
            request.setResourceProperty('filters');
            request.setQueryArg('where', 'filterType ne "analyticsMetric"');
            request.setQueryArg('count', 20);
            configuration['groupId'] = this._listId;
            configuration['store'] = new SDataStore({
                executeReadWith: 'readFeed',
                request: request
            });
            var request2 = new Sage.SData.Client.SDataResourcePropertyRequest(systemService);
            request2.setResourceKind(resourceKind);
            request2.setResourceProperty('$queries/executeMetric');

            // TODO: filter is undefined here, what was the intent here?
            /* jshint ignore:start */
            request2.setQueryArg('_filterName', filter['filterName']);
            /* jshint ignore:end */

            request2.setQueryArg('orderby', 'displayName');
            request2.setQueryArg('_activeFilter', where);
            configuration['createStoreForFilter'] = function (filter) {
                return filter && filter['filterName'] ? new SDataStore({ executeReadWith: 'readFeed', request: request2 }) : null;
            };
            configuration['getFilterManager'] = function () {
                var listPanel = registry.byId('list');
                return listPanel && listPanel.get('filterManager');
            };
            return configuration;
        }
    });
    return baseListPanelConfig;
});
