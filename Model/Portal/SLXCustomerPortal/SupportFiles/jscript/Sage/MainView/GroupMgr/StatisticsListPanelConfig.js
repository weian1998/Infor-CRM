/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define, sessionStorage */
define([
        'Sage/MainView/_BaseListPanelConfig',
        'Sage/MainView/GroupMgr/GroupsSDataSummaryFormatterScope',
        'dojo/_base/declare',
        'dojo/i18n!./nls/StatisticsListPanelConfig',
        'Sage/Data/SDataServiceRegistry',
        'Sage/UI/Columns/Boolean',
        'Sage/UI/Columns/DateTime',
        'Sage/UI/Columns/Numeric',
        'Sage/UI/Columns/Owner',
        'Sage/UI/Columns/SlxUser',
        'dojo/_base/lang',
        'Sage/MainView/GroupMgr/GroupManagerActions',
        'Sage/MainView/GroupMgr/GroupManagerFormatter',
        'dojo/i18n!./templates/nls/StatisticsListSummary',
        'dojo/i18n!./templates/nls/StatisticsDetailSummary'
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
        ownerColumn,
        slxUserColumn,
        dojoLang,
        GroupManagerActions,
        GroupManagerFormatter
    ) {
        var statisticsListPanelConfig = declare('Sage.MainView.GroupMgr.StatisticsListPanelConfig', [_BaseListPanelConfig], {
            keyField: "$key",
            _listId: 'statistics',
            _resourceKind: 'groupStatisticsView',
            _contextMenu: 'GroupManagerListContextMenu',
            _currentListContextSubMenu: 'SharesListContextMenu',
            constructor: function() {
                this.inherited(arguments);
                dojoLang.mixin(this, nlsResources);
                this.detailStateKey = 'GroupMgrShowDetail';
                this._service = SDataServiceRegistry.getSDataService('dynamic');
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
                    { field: 'Family', name: nlsResources.Family, width: '50px', formatter: GroupManagerFormatter.formatProperCase },
                    { field: 'Name', name: nlsResources.Name, width: '100px' },
                    { field: 'DisplayName', name: nlsResources.DisplayName, width: '100px' },
                    { field: 'UserId', name: nlsResources.Owner, width: '50px', type: ownerColumn },
                    { field: 'OwnerUsageCount', name: nlsResources.OwnerUsage, width: '50px', type: numericColumn },
                    { field: 'ReleaseUsageCount', name: nlsResources.ShareUsage, width: '50px', type: numericColumn },
                    { field: 'ReleasedDate', name: nlsResources.SharedDate, width: '75px', type: dateTimeColumn },
                    { field: 'FirstUser', name: nlsResources.FirstUsedBy, width: '50px', type: slxUserColumn },
                    { field: 'FirstUseDate', name: nlsResources.FirstUsed, width: '75px', type: dateTimeColumn },
                    { field: 'LastUser', name: nlsResources.LastUsedBy, width: '50px', type: slxUserColumn },
                    { field: 'LastUseDate', name: nlsResources.LastUsed, width: '75px', type: dateTimeColumn },
                    { field: 'Development', name: nlsResources.Dev, width: '30px', type: booleanColumn },
                    { field: 'Released', name: nlsResources.Rel, width: '30px', type: booleanColumn }
                ];
            },
            _getSelect: function() {
                return [
                    'Family', 'Name', 'UserId', 'OwnerUsageCount', 'ReleaseUsageCount', 'Development', 'Released', 'ReleasedDate', 'DataCode', 'Description',
                    'DisplayName', 'FirstUser', 'FirstUseDate', 'LastUser', 'LastUseDate', 'CreateDate'
                ];
            },
            _getWhere: function() {
                return '';
            },
            _getSort: function() {
                var sort = [{ attribute: 'Development', descending: false }, { attribute: 'Family', descending: false }, { attribute: 'DisplayName', descending: false }, { attribute: 'Name', descending: false }];
                return sort;
            },
            _getInclude: function() {
                var includes = [];
                return includes;
            },
            _getSummaryListRequestConfig: function() {
                var requestConfig = {
                    resourceKind: this._resourceKind,
                    serviceName: 'dynamic',
                    keyField: '$key',
                    select: ['Family', 'Name', 'Type', 'UserId', 'OwnerUsageCount', 'ReleaseUsageCount', 'Development', 'Released', 'ReleasedDate', 'DataCode', 'Description', 'DisplayName', 'FirstUser', 'FirstUseDate', 'LastUser', 'LastUseDate', 'CreateDate'],
                    include: [],
                    sort: this._getSort(),
                    useBatchRequest: false
                };
                return requestConfig;
            },
            _getFormatterScope: function() {
                var requestConfig = this._getSummaryListRequestConfig();
                var formatScope = new GroupsSDataSummaryFormatterScope({
                    templateLocation: 'MainView/GroupMgr/templates/StatisticsListSummary.html',
                    resetDataManager: true,
                    requestConfiguration: requestConfig,
                    serviceName: 'dynamic'
                });
                return formatScope;
            },
            _getSummaryDetailRequestConfig: function() {
                var requestConfig = {
                    resourceKind: this._resourceKind,
                    serviceName: 'dynamic',
                    keyField: '$key',
                    select: ['Family', 'Name', 'Type', 'UserId', 'OwnerUsageCount', 'ReleaseUsageCount', 'Development', 'Released', 'ReleasedDate', 'DataCode', 'Description', 'DisplayName', 'FirstUser', 'FirstUseDate', 'LastUser', 'LastUseDate', 'CreateDate'],
                    include: [],
                    useBatchRequest: false
                };
                return requestConfig;
            },
            _getDetailConfig: function() {
                var formatScope = this._getFormatterScope(); //DO NOT REMOVE THIS LINE. This sets up the formatter scope for the current listview.
                var requestConfig = this._getSummaryDetailRequestConfig();
                var detailConfig = {
                    resourceKind: this._resourceKind,
                    requestConfiguration: requestConfig,
                    templateLocation: 'MainView/GroupMgr/templates/StatisticsDetailSummary.html',
                    serviceName: 'dynamic'
                };
                return detailConfig;
            },
            _getToolBars: function() {
                var toolBars = { items: [] };
                return toolBars;
            }
        });
        return statisticsListPanelConfig;
    });