/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/_ConfigurationProvider',
    'Sage/Data/SDataStore',
    'dijit/Menu',
    'dijit/PopupMenuItem',
    'dijit/MenuSeparator',
    'Sage/UI/MenuItem',
    'dijit/registry',
    'dojo/_base/declare',
    'dojo/string',
    'Sage/Data/SDataServiceRegistry'
],
function (
    _ConfigurationProvider,
    SDataStore,
    Menu,
    PopupMenuItem,
    MenuSeparator,
    MenuItem,
    registry,
    declare,
    dojoString,
    SDataServiceRegistry
) {
    var _baseListPanelConfig = declare('Sage.MainView._BaseListPanelConfig', [_ConfigurationProvider], {
        list: false,
        detail: false,
        summary: false,
        toolBar: false,
        _listId: false,
        _store: false,
        _service: false,
        _where: false,
        _sort: false,
        _select: false,
        _include: false,
        _structure: false,
        _currentUserId: false,
        _resourceKind: false,
        _securedAction: '',
        keyField: "$key",
        hasCompositeKey: false,
        _menuItems: null,
        _contextMenu: false,
        _summaryformaterScope: false,
        entityName: false,
        rebuildMenus: true,
        rebuildOnRefresh: false,
        detailStateKey: false,
        constructor: function () {
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
        _onListRefresh: function (event) {
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
                onSelectedRegionContextMenu: this._onListContext
            };
            return listConfig;
        },
        _getStore: function () {
            var store = new SDataStore({
                id: this._listId,
                service: this._service,
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
                service: this._service,
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
        getNonEntityBasedFilterConfig: function (options) {
            var self = this;
            var configuration = {
                groupId: this._listId,
                store: new SDataStore({
                    executeReadWith: 'readFeed',
                    request: new Sage.SData.Client.SDataResourcePropertyRequest(SDataServiceRegistry.getSDataService('system'))
                        .setResourceKind(self._resourceKind)
                        .setResourceProperty('$queries/filters')
                        .setQueryArg('count', 20)
                }),
                createStoreForFilter: function (filter) {
                    return filter && filter['filterName']
                        ? new SDataStore({
                            executeReadWith: 'readFeed',
                            request: new Sage.SData.Client.SDataResourcePropertyRequest(self._service)
                                .setResourceKind(self._resourceKind)
                                .setResourceProperty('$queries/executeMetric')
                                .setQueryArg('_filterName', filter['filterName'])
                                .setQueryArg('orderby', 'displayName')
                                .setQueryArg('_activeFilter', self._where || '')
                        })
                        : null;
                },
                getFilterManager: function () {
                    var listPanel = registry.byId('list');
                    return listPanel && listPanel.get('filterManager');
                }
            };
            return configuration;
        },
        getFilterConfig: function (metaDataService, entry, options) {
            var self = this;
            var configuration = {
                groupId: this._listId,
                store: new SDataStore({
                    executeReadWith: 'readFeed',
                    request: new Sage.SData.Client.SDataResourcePropertyRequest(metaDataService)
                        .setResourceKind('entities')
                        .setResourceSelector(dojoString.substitute('"${0}"', [self.entityName]))
                        .setResourceProperty('filters')
                        .setQueryArg('where', 'filterType ne "analyticsMetric"')
                        .setQueryArg('count', 20)
                }),
                
                createStoreForFilter: function (filter) {
                    return filter && filter['filterName']
                        ? new SDataStore({
                            executeReadWith: 'readFeed',
                            request: new Sage.SData.Client.SDataResourcePropertyRequest(self._service)
                                .setResourceKind(self._resourceKind)
                                .setResourceProperty('$queries/executeMetric')
                                .setQueryArg('_filterName', filter['filterName'])
                                .setQueryArg('orderby', 'displayName')
                                .setQueryArg('_activeFilter', self._where || '')
                        })
                        : null;
                },
                getFilterManager: function () {
                    var listPanel = registry.byId('list');
                    return listPanel && listPanel.get('filterManager');
                }
            };
            return configuration;
        }
    });
    return _baseListPanelConfig;
});