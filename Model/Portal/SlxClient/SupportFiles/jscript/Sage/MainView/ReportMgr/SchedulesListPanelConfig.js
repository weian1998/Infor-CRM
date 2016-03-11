/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/MainView/_BaseListPanelConfig',
    'Sage/MainView/ReportMgr/SchedulesSDataSummaryFormatterScope',
    'dojo/_base/declare',
    'dojo/i18n!./nls/SchedulesListPanelConfig',
    'Sage/Utility/Jobs',
    'Sage/UI/Columns/DateTime',
    'dojo/_base/lang',
    'dojo/i18n!./templates/nls/SchedulesListSummary',
    'dojo/i18n!./templates/nls/ScheduleDetailSummary'
],
function (
    _BaseListPanelConfig,
    SchedulesSDataSummaryFormatterScope,
    declare,
    nlsResources,
    jobUtility,
    slxDateTimeColumn,
    dojoLang
) {
    var schedulesListPanelConfig = declare('Sage.MainView.ReportMgr.SchedulesListPanelConfig', [_BaseListPanelConfig], {
        _listId: 'Schedules',
        _resourceKind: 'triggers',
        _contextMenu: 'ReportManagerListContextMenu',
        _currentListContextSubMenu: 'ReportSchedulesListContextMenu',
        constructor: function () {
            dojoLang.mixin(this, nlsResources);
            //Get SData Service for Scheduling endpoint, set service for ExecutionsListPanelConfig
            var jobService = Sage.Services.getService('JobService');
            this._service = jobService.getSchedulingSDataService();

            //Set up query parameters
            this._structure = this._getStructure();
            this._select = this._getSelect();
            this._sort = this._getSort();
            this._where = this._getWhere();
            this._include = this._getInclude();
            this._store = this._getStore();
            this.list = this._getListConfig();
            this.detail = this._getDetailConfig();
            this.toolBar = this._getToolBars();
            this.list.selectionMode = 'single';
        },
        _getStructure: function () {
            return [
                { field: 'job', name: this.colJobName, width: '100px', formatter: jobUtility.formatJobDescription },
                { field: '$descriptor', name: this.colNameDescription, width: '100px' },
                { field: 'user', name: this.colNameRunAsUser, width: '100px', formatter: jobUtility.formatUser },
                { field: 'startTimeUtc', type: slxDateTimeColumn, name: this.colNameStartTimeUtc, width: '100px' },
                { field: 'endTimeUtc', type: slxDateTimeColumn, name: this.colNameEndTimeUtc, width: '100px' },
                { field: 'priority', name: this.colNamePriority, width: '100px' },
                { field: 'status', name: this.colNameStatus, width: '100px' },
                { field: 'timesTriggered', name: this.colNameExecutionCount, width: '100px' }
            ];
        },
        _getSelect: function () {
            return ['$key', 'job', 'user', 'startTimeUtc', 'endTimeUtc', 'repeatCount', 'repeatInterval', 'priority', 'status', 'timesTriggered'];
        },
        _getInclude: function () {
            var includes = ['$descriptors,$key'];
            return includes;
        },
        _getWhere: function () {
            return "jobId like 'Saleslogix.Reporting%'";
        },
        _getSort: function () {
            var sort = [{ attribute: 'job'}];
            return sort;
        },
        _getSummaryListRequestConfig: function () {
            var requestConfig = {
                resourceKind: this._resourceKind,
                serviceName: 'scheduling',
                keyField: '$key',
                select: this._getSelect(),
                include: this._getInclude(),
                useBatchRequest: false,
                sort: this._getSort()
            };
            return requestConfig;
        },
        _getFormatterScope: function () {
            var requestConfig = this._getSummaryListRequestConfig();
            return new SchedulesSDataSummaryFormatterScope({
                templateLocation: 'MainView/ReportMgr/templates/SchedulesListSummary.html',
                resetDataManager: true,
                requestConfiguration: requestConfig
            });
        },
        _getSummaryDetailRequestConfig: function () {
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
        _getDetailConfig: function () {
            var formatScope = this._getFormatterScope();
            return {
                resourceKind: this._resourceKind,
                requestConfiguration: this._getSummaryDetailRequestConfig(),
                templateLocation: 'MainView/ReportMgr/templates/ScheduleDetailSummary.html'
            };
        },
        _getToolBars: function () {
            var toolBars = { items: [] };
            return toolBars;
        }
    });
    return schedulesListPanelConfig;
});