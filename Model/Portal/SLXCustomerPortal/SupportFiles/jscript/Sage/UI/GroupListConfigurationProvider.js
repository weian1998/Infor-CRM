/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
        'Sage/_ConfigurationProvider',
        'Sage/Data/GroupLayoutSingleton',
        'Sage/Services/_ServiceMixin',
        'Sage/Utility/_LocalStorageMixin',
        'Sage/UI/Columns/SlxLink',
        'Sage/UI/Columns/Boolean',
        'Sage/UI/Columns/DateTime',
        'Sage/UI/Columns/Numeric',
        'Sage/UI/Columns/OwnerType',
        'Sage/UI/Columns/Phone',
        'Sage/UI/Columns/UserType',
        'Sage/UI/Columns/Currency',
        'Sage/Data/SDataStore',
        'Sage/UI/SummaryFormatterScope',
        'dijit/MenuSeparator',
        'dijit/Menu',
        'Sage/UI/PopupMenuItem',
        'Sage/UI/MenuItem',
        'dojo/_base/lang',
        'dojo/_base/declare',
        'dojo/i18n',
        'Sage/Utility/Groups'
],
function (
    _ConfigurationProvider,
    GroupLayoutSingleton,
    _ServiceMixin,
    _LocalStorageMixin,
    slxLinkColumn,
    booleanColumn,
    dateTimeColumn,
    numericColumn,
    ownerTypeColumn,
    phoneColumn,
    userTypeColumn,
    Currency,
    SDataStore,
    summaryFormatterScope,
    menuSeparator,
    dijitMenu,
    PopupMenuItem,
    sageMenuItem,
    lang,
    declare,
    i18n,
    groupsUtility) {
    var groupListConfigProvider = declare('Sage.UI.GroupListConfigurationProvider', [_ConfigurationProvider, _ServiceMixin, _LocalStorageMixin], {
        serviceMap: {
            'groupContextService': 'ClientGroupContext'
        },
        service: null,
        _hasAdHocList: false,
        ROWS_PER_PAGE: 100,
        _currentConfiguration: false,

        constructor: function (options) {
            this._adHocOnlyMenuItems = [];
            this._menuItems = [];
            this._subscribes.push(dojo.subscribe('/group/context/changed', this, this._onGroupContextChanged));
        },
        _onGroupContextChanged: function () {
            this.onConfigurationChange();
        },
        requestConfiguration: function (options) {
            var singleton = new GroupLayoutSingleton(),
                onSuccess = lang.hitch(this, this._onRequestConfigurationSuccess, options || {}),
                onFail = lang.hitch(this, this._onRequestConfigurationFailure, options || {}),
                group = this.getCurrentGroup();
            singleton.getGroupLayout(this.formatPredicate(group), onSuccess, onFail, group.$key);
        },
        _onRequestConfigurationSuccess: function (options, entry) {
            if (options.success) {
                options.success.call(options.scope || this, this._createConfiguration(entry), options, this);
            }
        },
        _onRequestConfigurationFailure: function (options, response) {
            if (options.failure) {
                options.failure.call(options.scope || this, response, options, this);
            }
        },
        _createConfigurationForList: function (entry) {
            // todo: fix to store layout somewhere
            var layout = entry.layout,
                select = [],
                structure = [],
                groupContextService = Sage.Services.getService("ClientGroupContext"),
                context,
                i;

            if (groupContextService) {
                context = groupContextService.getContext();
            }

            if (entry['keyField']) {
                select.push(entry['keyField']);
            }

            var gridStructureData = groupsUtility.getGridStructure(layout);
            structure = gridStructureData.structure;
            select = gridStructureData.select;
            
            var store = new SDataStore({
                service: this.service,
                resourceKind: 'groups',
                resourcePredicate: this.formatPredicate(entry),
                queryName: 'execute',
                select: select,
                include: [],
                count: this.ROWS_PER_PAGE
            });

            var tableAliases = {};
            for (i = 0; i < entry['tableAliases'].length; i++)
                tableAliases[entry['tableAliases'][i]['tableName'].toUpperCase()] = entry['tableAliases'][i]['alias'];

            return {
                structure: [{
                    defaultCell: { defaultValue: '' },
                    cells: [
                        structure
                    ]
                }],
                store: store,
                rowsPerPage: this.ROWS_PER_PAGE,
                layout: entry['layout'],
                tableAliases: tableAliases,
                selectedRegionContextMenuItems: this._getListContextMenuItems(),
                onSelectedRegionContextMenu: this._onListContext,
                onNavigateToDefaultItem: lang.hitch(entry, function (item /* Datestore item that was acted on */) {
                    if (item) {
                        var keyField = this['keyField'],
                            entityName = this['entityName'],
                            id = item[keyField];

                        if (id) {
                            Sage.Link.entityDetail(entityName, id);
                        }
                    }
                }),
                id: entry['$key']
            };
        },
        _getCurrentGroupID: function () {
            var groupContextService = Sage.Services.getService("ClientGroupContext"),
                context,
                results;

            if (groupContextService) {
                context = groupContextService.getContext();
                results = context.CurrentGroupID;
            }

            return results;
        },
        _onListContext: function (e) {
            var groupContextSvc = Sage.Services.getService('ClientGroupContext');
            var context = groupContextSvc.getContext();
            for (var i = 0; i < this._adHocOnlyMenuItems.length; i++) {
                this._adHocOnlyMenuItems[i].set('disabled', !context.isAdhoc);
            }
            this._ensureAdHocListMenu();
        },
        _getListContextMenuItems: function () {
            var menuItem,
                groupId = this._getCurrentGroupID();
            if (this._menuItems.length > 0) {
                return this._menuItems;
            }
            if (!Sage.UI.DataStore.ContextMenus || !Sage.UI.DataStore.ContextMenus.listContextMenu) {
                return [];
            }
            this._menuItems = [];
            this._adHocOnlyMenuItems = [];
            var menuConfig = Sage.UI.DataStore.ContextMenus.listContextMenu.items;
            var len = menuConfig.length;
            for (var i = 0; i < len; i++) {
                var mDef = menuConfig[i];
                if (mDef.displayName === '') {
                    this._menuItems.push(new menuSeparator());
                } else {
                    var href = mDef.href;
                    if (href.indexOf('javascript:') < 0) {
                        href = dojo.string.substitute("javascript:${0}()", [href]);
                    }
                    if (href.indexOf('addSelectionsToGroup') > 0) {
                        menuItem = this._createAddToAdHocMenuItem(mDef);

                        if (menuItem.arrowWrapper) {
                            dojo.style(menuItem.arrowWrapper, "visibility", "");
                        }
                    } else {
                        menuItem = new sageMenuItem({
                            id: groupId + '_' + i,
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
                    this._menuItems.push(menuItem);
                    if (href.indexOf('removeSelectionsFromGroup') > 0) {
                        this._adHocOnlyMenuItems.push(menuItem);
                    }
                }
            }
            return this._menuItems;
        },
        _createAddToAdHocMenuItem: function (menuDef) {
            this._adHocMenu = new dijitMenu();
            this._adHocMenu.addChild(new sageMenuItem({
                label: 'loading...'
            }));
            this._adHocMenuHref = menuDef.href;
            var menuItem = new PopupMenuItem({
                label: menuDef.text || '...',
                icon: menuDef.img,
                title: menuDef.tooltip || '',
                popup: this._adHocMenu
            });
            return menuItem;
        },
        _ensureAdHocListMenu: function () {
            if (this._hasAdHocList) {
                return;
            }
            this._hasAdHocList = true;
            var svc = Sage.Services.getService('ClientGroupContext');
            svc.getAdHocGroupList(function (list) {
                this._adHocMenu.destroyDescendants();
                for (var i = 0; i < list.length; i++) {
                    var grp = list[i];
                    this._adHocMenu.addChild(new sageMenuItem({
                        label: grp['$descriptor'] || grp['name'],
                        icon: '',
                        title: grp['$descriptor'] || grp['name'],
                        ref: dojo.string.substitute(this._adHocMenuHref, { 'groupId': grp['$key'] }),
                        onClick: function () {
                            if (this.ref !== '') {
                                try {
                                    window.location.href = this.ref;
                                } catch (e) { }
                            }
                        }
                    }));
                }
            }, this);
        },
        _createConfigurationForSummary: function (entry) {
            if (!this.summaryOptions) {
                return false;
            }
            if (!entry) {
                entry = this._currentConfiguration;
            }
            var store = new SDataStore({
                service: this.service,
                resourceKind: 'groups',
                resourcePredicate: this.formatPredicate(entry),
                queryName: 'execute',
                select: [entry['keyField']],
                include: []
            }),
                structure = [
                    {
                        field: entry['keyField'],
                        formatter: 'formatSummary',
                        width: '100%',
                        name: 'Summary View',
                        canResize: function () { return false; }
                    }
                ],
                moduleNameParts = ['Sage'],
                templateLocation = this.summaryOptions['templateLocation'],
                templateParts = templateLocation && templateLocation.split('/'),
                i,
                path;

            for (i = 0; i < templateParts.length - 1; i++) {
                moduleNameParts.push(templateParts[i]);
            }
            path = 'dojo/i18n!' + moduleNameParts.join('/') + '/nls/' + templateParts[templateParts.length - 1].replace('.html', '');

            require([path],
                lang.hitch(this, function (nls) {
                    lang.mixin(this, nls);
                })
            );
            return {
                structure: structure,
                layout: entry['layout'],
                store: store,
                rowHeight: 200,
                rowsPerPage: 50,
                formatterScope: new summaryFormatterScope({
                    requestConfiguration: {
                        mashupName: this.summaryOptions['mashupName'] || 'SummaryViewQueries',
                        queryName: this.summaryOptions['queryName'] || ''
                    },
                    templateLocation: this.summaryOptions['templateLocation'] || ''
                })
            };
        },
        _createConfigurationForDetail: function (entry) {
            if (this.detailConfiguration) {
                return {
                    requestConfiguration: {
                        mashupName: this.detailConfiguration['mashupName'] || 'SummaryViewQueries',
                        queryName: this.detailConfiguration['queryName'] || ''
                    },
                    templateLocation: this.detailConfiguration['templateLocation']
                };
            }
            return false;
        },
        _createConfiguration: function (entry) {
            this._currentConfiguration = entry;

            var state = this.getFromLocalStorage('LISTPANEL_VIEWSTATE', this._getViewNS());

            return {
                list: this._createConfigurationForList(entry),
                summary: (state == 'summary') ? this._createConfigurationForSummary(entry) : false,
                detail: this._createConfigurationForDetail(entry)
            };
        },
        formatPredicate: function (group) {
            if (group.$key === 'LOOKUPRESULTS') {
                group.family = group.family && group.family.toUpperCase();
                group.name = 'Lookup Results';
                return dojo.string.substitute("name eq '${name}' and upper(family) eq '${family}'", group);
            }

            return "'" + group.$key + "'";
        },
        getCurrentGroup: function () {
            var service = Sage.Services.getService('ClientGroupContext'),
                context = service && service.getContext(),
                results = { name: 'My Accounts', family: 'Account', $key: '' };
            if (context) {
                results = {
                    name: context.CurrentName,
                    family: context.CurrentFamily,
                    $key: context.CurrentGroupID
                };
            }

            return results;
        },
        _getViewNS: function () {
            var ns = Sage.Groups.GroupManager.LOCALSTORE_NAMESPACE + '-' + this._getMainViewName();
            return ns;
        },
        _getMainViewName: function () {
            if (this._mainViewName) {
                return this._mainViewName;
            }
            //if not defined then use the group context.
            var service = Sage.Services.getService("ClientGroupContext"),
                results = -1,
                context = null;
            if (service) {
                context = service.getContext();
                if (context) {
                    results = context.CurrentEntity;
                }
            }
            return results;
        }
    });
    return groupListConfigProvider;
});