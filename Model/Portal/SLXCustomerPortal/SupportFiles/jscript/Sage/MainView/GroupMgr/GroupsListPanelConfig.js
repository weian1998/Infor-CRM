/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define, sessionStorage */
define([
        'Sage/MainView/_BaseListPanelConfig',
        'Sage/MainView/GroupMgr/GroupsSDataSummaryFormatterScope',
        'dojo/_base/declare',
        'dojo/i18n!./nls/GroupsListPanelConfig',
        'Sage/Data/SDataServiceRegistry',
        'Sage/UI/Columns/Boolean',
        'Sage/UI/Columns/DateTime',
        'Sage/UI/Columns/Numeric',
        'Sage/UI/Columns/SlxUser',
        'dojo/_base/lang',
        'Sage/MainView/GroupMgr/GroupManagerActions',
        'Sage/MainView/GroupMgr/GroupManagerFormatter',
        'Sage/Utility/_LocalStorageMixin',
        'dojo/i18n!./templates/nls/GroupsListSummary',
        'dojo/i18n!./templates/nls/GroupDetailSummary'
    ],
    function(
        _BaseListPanelConfig,
        GroupsSDataSummaryFormatterScope,
        declare,
        nlsResources,
        SDataServiceRegistry,
        booleanColumn,
        dateTimeColumn,
        numericColumn,
        slxUserColumn,
        dojoLang,
        GroupManagerActions,
        GroupManagerFormatter
    ) {
        var GroupsListPanelConfig = declare('Sage.MainView.GroupMgr.GroupsListPanelConfig', [_BaseListPanelConfig], {
            keyField: "$key",
            _listId: 'all_groups',
            _resourceKind: 'groups',
            _contextMenu: 'GroupManagerListContextMenu',
            _currentListContextSubMenu: 'GroupsListContextMenu',
            constructor: function() {
                this.inherited(arguments);
                dojoLang.mixin(this, nlsResources);
                this.detailStateKey = 'GroupMgrShowDetail';
                this._service = SDataServiceRegistry.getSDataService('system');
                this._structure = this._getStructure();
                this._select = this._getSelect();
                this._where = this._getWhere();
                this._sort = this._getSort();
                this._include = this._getInclude();
                this._store = this._getStore();
                this.list = this._getListConfig();
                this.detail = this._getDetailConfig();
                this.toolBar = this._getToolBars();
                this.list.selectionMode = 'multiple';

                GroupManagerActions.initShowHideDetail(this);
            },
            _getShowDetail: function () {
                if (this.detailStateKey) {
                    var value = sessionStorage.getItem(this.detailStateKey);
                    if (value === null) {
                        return 'true';
                    }
                    return value;
                }
                return 'true';
            },
            _getStructure: function() {
                return [
                    { field: 'family', name: nlsResources.Family, width: '50px', formatter: GroupManagerFormatter.formatProperCase },
                    { field: 'name', name: nlsResources.Name, width: '100px' },
                    { field: 'displayName', name: nlsResources.DisplayName, width: '100px' },
                    { field: 'isAdHoc', name: nlsResources.AdHoc, width: '30px', type: booleanColumn },
                    { field: 'createDate', name: nlsResources.CreateDate, width: '75px', type: dateTimeColumn },
                    { field: 'modifyDate', name: nlsResources.ModifyDate, width: '75px', type: dateTimeColumn },
                    { field: 'releasedDate', name: nlsResources.SharedDate, width: '75px', type: dateTimeColumn },
                    { field: 'userId', name: nlsResources.Owner, width: '50px', formatter: GroupManagerFormatter.formatOwnerName },
                    { field: 'groupAuthor', name: nlsResources.Author, width: '50px' },
                    { field: 'company', name: nlsResources.Company, width: '50px' },
                    { field: 'companyVersion', name: nlsResources.Version, width: '50px', type: numericColumn },
                    { field: 'isDeveloperVersion', name: nlsResources.Dev, width: '30px', type: booleanColumn },
                    { field: 'released', name: nlsResources.Rel, width: '30px', type: booleanColumn }
                ];
            },
            _getSelect: function() {
                return ['isDeveloperVersion', 'released', 'family', 'name', 'displayName', 'createDate', 'modifyDate', 'releasedDate', 'groupAuthor', 'company', 'companyVersion', 'userId', 'maintable', 'dataCode', 'isAdHoc', 'basedOn', 'entityName'];
            },
            _getWhere: function() {
                return '';
            },
            _getSort: function() {
                var sort = [{ attribute: 'isDeveloperVersion', descending: true }, { attribute: 'family', descending: false }, { attribute: 'displayName', descending: false }, { attribute: 'name', descending: false }];
                return sort;
            },
            _getInclude: function() {
                var includes = [];
                return includes;
            },
            _getSummaryListRequestConfig: function() {
                var requestConfig = {
                    resourceKind: this._resourceKind,
                    serviceName: 'system',
                    keyField: '$key',
                    select: ['legacyType', 'displayName', 'mainTable', 'createUser', 'createDate', 'modifyUser', 'modifyDate', 'releasedDate', 'name'],
                    include: [],
                    sort: this._getSort(),
                    useBatchRequest: false
                };
                return requestConfig;
            },
            _getFormatterScope: function() {
                var requestConfig = this._getSummaryListRequestConfig();
                var formatScope = new GroupsSDataSummaryFormatterScope({
                    templateLocation: 'MainView/GroupMgr/templates/GroupsListSummary.html',
                    resetDataManager: true,
                    requestConfiguration: requestConfig,
                    serviceName: 'system'
                });
                return formatScope;
            },
            _getSummaryDetailRequestConfig: function() {
                var requestConfig = {
                    resourceKind: this._resourceKind,
                    serviceName: 'system',
                    keyField: '$key',
                    select: ['isDeveloperVersion', 'released', 'family', 'displayName', 'createDate', 'createUser', 'modifyDate', 'modifyUser', 'releasedDate', 'groupAuthor',
                        'company', 'companyVersion', 'userId', 'legacyType', 'mainTable', 'dataCode', 'keyField', 'entityName', 'isHidden', 'isAdHoc', 'description', 'installationDate'],
                    include: [],
                    useBatchRequest: false
                };
                return requestConfig;
            },
            _getDetailConfig: function() {
                var formatScope = this._getFormatterScope();
                var requestConfig = this._getSummaryDetailRequestConfig();
                var detailConfig = {
                    resourceKind: this._resourceKind,
                    requestConfiguration: requestConfig,
                    templateLocation: 'MainView/GroupMgr/templates/GroupDetailSummary.html',
                    serviceName: 'system'
                };
                return detailConfig;
            },
            _getToolBars: function() {
                var toolBars = { items: [] };
                return toolBars;
            }
        });
        return GroupsListPanelConfig;
    });