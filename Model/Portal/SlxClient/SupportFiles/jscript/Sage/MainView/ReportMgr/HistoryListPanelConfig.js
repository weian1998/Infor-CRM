/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/MainView/_BaseListPanelConfig',
    'Sage/UI/SDataSummaryFormatterScope',
    'dojo/_base/declare',
    'dojo/i18n!./nls/HistoryListPanelConfig',
    'Sage/Data/SDataServiceRegistry',
    'Sage/UI/Columns/DateTime',
    'dojo/_base/lang',
    'Sage/MainView/ReportMgr/ReportManagerFormatter',
    'Sage/Utility/Jobs',
    'dojo/i18n!./templates/nls/HistoryListSummary',
    'dojo/i18n!./templates/nls/HistoryDetailSummary'
],
function (
    _BaseListPanelConfig,
    SDataSummaryFormatterScope,
    declare,
    nlsResources,
    sDataServiceRegistry,
    dateTimeColumn,
    dojoLang,
    reportManagerFormatter,
    jobUtility
) {
    var historyListPanelConfig = declare('Sage.MainView.ReportMgr.HistoryListPanelConfig', [_BaseListPanelConfig], {
        keyField: "$key",
        _listId: 'History',
        _resourceKind: 'reportHistory',
        _contextMenu: 'ReportManagerListContextMenu',
        _currentListContextSubMenu: 'HistoryListContextMenu',
        entityName: 'ReportHistory',
        constructor: function () {
            dojoLang.mixin(this, nlsResources);
            this._service = sDataServiceRegistry.getSDataService('dynamic');
            //Set up query parameters
            this._structure = this._getStructure();
            this._select = this._getSelect();
            this._where = this._getWhere();
            this._include = this._getInclude();
            this._store = this._getStore();
            this.list = this._getListConfig();
            this.detail = this._getDetailConfig();
            this.toolBar = this._getToolBars();
        },
        _getStructure: function () {
            return [
                { field: 'CreateDate', name: this.colNameDate, width: '65px', type: dateTimeColumn },
                { field: 'ScheduleName', name: this.colNameReportName, width: '125px', formatter: reportManagerFormatter.formatAttachment },
                { field: 'ReportType', name: this.colNameReportType, width: '50px', formatter: reportManagerFormatter.formatReportType },
                { field: 'ExecutionType', name: this.colNameExecutionType, width: '50px', formatter: reportManagerFormatter.formatExecutionType },
                { field: 'DocumentType', name: this.colNameOutputFormat, width: '50px' },
                { field: 'RunAs', name: this.colNameRunAs, width: '50px', formatter: jobUtility.formatUser },
                { field: 'ScheduledBy', name: this.colNameScheduledBy, width: '50px', formatter: jobUtility.formatUser },
                { field: 'FileSize', name: this.colNameSize, width: '50px', formatter: reportManagerFormatter.formatFileSize }
            ];
        },
        _getSelect: function () {
            return ['CreateDate', 'ExecutionType', 'ScheduledBy', 'RunAs', 'CreateUser', 'ScheduleName', 'DocumentType', 'FileSize', 'ElapsedTimeInSeconds', 'ReportType', 'AttachId'];
        },
        _getWhere: function () {
            return '';
        },
        _getInclude: function () {
            return ['$descriptors'];
        },
        _getSummaryListRequestConfig: function () {
            var requestConfig = {
                resourceKind: this._resourceKind,
                serviceName: 'dynamic',
                keyField: '$key',
                select: this._getSelect(),
                include: this._getInclude(),
                useBatchRequest: false
            };
            return requestConfig;
        },
        _getFormatterScope: function () {
            var requestConfig = this._getSummaryListRequestConfig();
            var formatScope = new SDataSummaryFormatterScope({
                templateLocation: 'MainView/ReportMgr/templates/HistoryListSummary.html',
                resetDataManager: true,
                requestConfiguration: requestConfig
            });
            return formatScope;
        },
        _getSummaryDetailRequestConfig: function () {
            var requestConfig = {
                resourceKind: this._resourceKind,
                serviceName: 'dynamic',
                keyField: '$key',
                select: this._getSelect(),
                include: ['$descriptors'],
                useBatchRequest: false
            };
            return requestConfig;
        },
        _getDetailConfig: function () {
            var formatScope = this._getFormatterScope(); //DO NOT REMOVE THIS LINE. This sets up the formatter scope for the current listview.
            var requestConfig = this._getSummaryDetailRequestConfig();
            var detailConfig = {
                resourceKind: this._resourceKind,
                requestConfiguration: requestConfig,
                templateLocation: 'MainView/ReportMgr/templates/HistoryDetailSummary.html'
            };
            return detailConfig;
        },
        _getToolBars: function () {
            var toolBars = { items: [] };
            return toolBars;
        },
        resolveProperty: function (propertyName, dataPath /* optional */) {
            if (propertyName === 'ScheduledBy') {
                return 'ScheduledBy.Id';
            }
            return propertyName;
        }
    });
    return historyListPanelConfig;
});