/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/MainView/JobMgr/BaseListPanelConfig',
    'Sage/MainView/JobMgr/SDataSummaryFormatterScope',
    'dojo/_base/declare',
    'dojo/i18n!./nls/SchedulesListPanelConfig',
    'dojo/_base/lang',
    'Sage/Utility/Jobs',
    'dojo/i18n!./templates/nls/SchedulesListSummary',
    'dojo/i18n!./templates/nls/ScheduleDetailSummary'
],
function (
    baseListPanelConfig,
    sDataSummaryFormatterScope,
    declare,
    nlsResources,
    dojoLang,
    jobUtility
) {
    var schedulesListPanelConfig = declare('Sage.MainView.JobMgr.SchedulesListPanelConfig', [baseListPanelConfig], {
        constructor: function () {
            dojoLang.mixin(this, nlsResources);
            this._listId = 'Schedules';
            this._resourceKind = 'triggers';
            this._contextMenu = 'JobManagerListContextMenu';
            this._currentListContextSubMenu = 'SchedulesListContextMenu';

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
            this.keyField = "$key";
        },
        _getStructure: function () {
            return [
                { field: '$descriptor', name: this.colNameTriggerName, width: '100px' },
                { field: 'job', name: this.colNameJobName, width: '100px', formatter: jobUtility.formatJobDescription },
                { field: 'user', name: this.colNameUser, width: '100px', formatter: jobUtility.formatUser },
                { field: 'startTimeUtc', name: this.colNameStartTimeUtc, width: '100px', formatter: jobUtility.formatDate },
                { field: 'endTimeUtc', name: this.colNameEndTimeUtc, width: '100px', formatter: jobUtility.formatDate },
                { field: 'priority', name: this.colNamePriority, width: '100px' },
                { field: 'status', name: this.colNameStatus, width: '100px' },
                { field: 'timesTriggered', name: this.colNameTimesTriggered, width: '100px' }
            ];
        },
        _getSelect: function () {
            var select = ['$key', 'job', 'user', 'startTimeUtc', 'endTimeUtc', 'repeatCount', 'repeatInterval', 'priority', 'status', 'timesTriggered'];
            return select;
        },
        _getWhere: function () {
            return '';
        },
        _getSort: function () {
            var sort = [{ attribute: 'job'}];
            return sort;
        },
        _getInclude: function () {
            var includes = ['$descriptors,$key'];
            return includes;
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
            var formatScope = new sDataSummaryFormatterScope({
                templateLocation: 'MainView/JobMgr/templates/SchedulesListSummary.html',
                resetDataManager: true,
                requestConfiguration: requestConfig
            });
            return formatScope;
        },
        _getSummaryDetailRequestConfig: function () {
            var requestConfig = {
                resourceKind: this._resourceKind,
                serviceName: 'scheduling',
                keyField: '$key',
                select: ['$key', 'description', 'job', 'user'],
                include: ['$descriptors'],
                useBatchRequest: false
            };
            return requestConfig;
        },
        _getDetailConfig: function () {
            var formatScope = this._getFormatterScope();
            var requestConfig = this._getSummaryDetailRequestConfig();
            var detailConfig = {
                resourceKind: this._resourceKind,
                requestConfiguration: requestConfig,
                templateLocation: 'MainView/JobMgr/templates/ScheduleDetailSummary.html'
            };
            return detailConfig;
        },
        _getToolBars: function () {
            var toolBars = { items: [] };
            return toolBars;
        }
    });
    return schedulesListPanelConfig;
});