/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/MainView/ActivityMgr/BaseListPanelConfig',
    'Sage/Utility',
    'Sage/Utility/Activity',
    'Sage/UI/SDataSummaryFormatterScope',
    'Sage/Data/BaseSDataStore',
    'Sage/UI/Columns/DateTime',
    'Sage/Data/SDataServiceRegistry',
    'dojo/_base/declare',
    'dojo/_base/connect',
    'dojo/i18n!./nls/ActivityListPanelConfig',
    'dojo/i18n!./templates/nls/AllOpenListSummary',
    'dojo/i18n!./templates/nls/AllOpenDetailSummary'
],
function (
    baseListPanelConfig,
    sageUtility,
    utilityActivity,
    sDataSummaryFormatterScope,
    baseSDataStore,
    columnsDateTime,
    sDataServiceRegistry,
    declare,
    connect,
    nlsResources
) {
    var allOpenListPanelConfig = declare('Sage.MainView.ActivityMgr.AllOpenListPanelConfig', [baseListPanelConfig], {
        constructor: function () {
            this._nlsResources = nlsResources;
            this._listId = 'allOpen';
            this._resourceKind = 'activities';
            this.entityName = 'Activity';
            this._contextMenu = 'ActivityListContextMenu';
            this._scheduleContextMenu = 'ScheduleContextMenu';
            this._service = sDataServiceRegistry.getSDataService('system');
            this._structure = this._getStructure();
            this._select = this._getSelect();
            this._include = this._getInclude();
            this._sort = this._getSort();
            this._where = this._getWhere();
            this._store = this._getStore();
            this.list = this._getListConfig();
            this.list.selectionMode = "single";
            this.summary = this._getSummaryConfig();
            this.detail = this._getDetailConfig();
            this.toolBar = this._getToolBars();
            connect.subscribe('/entity/activity/change', this._onListRefresh);
            connect.subscribe('/entity/activity/delete', this._onListRefresh);
            connect.subscribe('/entity/activity/create', this._onListRefresh);
        },
        _onListRefresh: function (event) {
            var activityService = Sage.Services.getService('ActivityService');
            activityService.refreshList('allopen');
        },
        _getSelect: function() {
            return [
                '$key',
                'Attachment',
                'Timeless',
                'Recurring',
                'RecurIterations',
                'Alarm',
                'Type',
                'StartDate',
                'Duration',
                'ContactName',
                'ContactId',
                'LeadName',
                'LeadId',
                'AccountName',
                'AccountId',
                'Description',
                'Priority',
                'Leader',
                'RecurrenceState',
                'AttendeeCount'
            ];
        },
        _getInclude: function () {
            return ["$descriptors"];
        },
        _getSort: function () {
            return [{ attribute: 'StartDate', descending: true }];
        },
        _getWhere: function () {
            return '(Type ne "atLiterature" )';
        },
        _getStructure: function () {
            var colNameAttachment = "<div class='Global_Images icon16x16 icon_attach_to_16' title='" + this._nlsResources.colNameAttachment + "' />";
            var colNameRecurring = "<div class='Global_Images icon16x16 icon_recurring' title='" + this._nlsResources.colNameRecurring + "' />";
            var colNameAlarm = "<img style='width: 16px; height: 16px' src='images/icons/Alarm_16x16.gif' title='" + this._nlsResources.colNameAlarm + "' alt='" + this._nlsResources.colNameAlarm + "' />";
            var colNameType = this._nlsResources.colNameType || 'Type';
            var colNameStartDate = this._nlsResources.colNameStartDate || 'Start Date';
            var colNameDuration = this._nlsResources.colNameDuration || 'Duration';
            var colNameAccount = this._nlsResources.colNameAccount || 'Account';
            var colNameRegarding = this._nlsResources.colNameRegarding || 'Regarding';
            var colNamePriority = this._nlsResources.colNamePriority || 'Priority';
            var colNameUserId = this._nlsResources.colNameUserId || 'Leader';
            var colNameTypeName = this._nlsResources.colNameTypeName || 'Type';
            var colNameContactName = this._nlsResources.colNameContactName || 'Name';
            var colNameAssociationCount = this._nlsResources.colNameAssociationCount || 'Participant Count';

            return [
                { field: 'Alarm', name: colNameAlarm, type: utilityActivity.activityAlarmCell, width: '20px' },
                { field: 'Attachment', name: colNameAttachment, type: utilityActivity.activityAttachCell, width: '20px' },
                { field: 'Recurring', name: colNameRecurring, type: utilityActivity.activityRecurringCell, width: '20px' },
                { field: 'Type', name: colNameType, type: utilityActivity.activityTypeCell, width: '90px' },
                { field: 'StartDate', name: colNameStartDate, type: columnsDateTime, timelessField: 'Timeless', width: '100px' },
                { field: 'Duration', name: colNameDuration, type: utilityActivity.activityDurationCell, width: '40px' },
                { field: 'ContactId', name: colNameTypeName, type: utilityActivity.activityNameTypeCell, width: '40px' },
                { field: 'ContactName', name: colNameContactName, type: utilityActivity.activityNameCell, width: '200px' },
                { field: 'AccountName', name: colNameAccount, type: utilityActivity.activityAccountCell, width: '200px' },
                { field: 'Description', name: colNameRegarding, width: '100px' },
                { field: 'Priority', name: colNamePriority, width: '40px' },
                { field: 'Leader', name: colNameUserId, type: utilityActivity.activityLeaderCell, width: '200px' },
                { field: 'AttendeeCount',name: colNameAssociationCount,width: '90px' }
            ];
        },
        _getDetailConfig: function () {
            return {
                resourceKind: this._resourceKind,
                requestConfiguration: this._getSummaryDetailRequestConfig(),
                templateLocation: 'MainView/ActivityMgr/templates/AllOpenDetailSummary.html'
            };
        },
        _getSummaryListRequestConfig: function() {
            return {
                resourceKind: this._resourceKind,
                serviceName: 'system',
                keyField: '$key',
                select: [
                    '$key',
                    'Attachment',
                    'Timeless',
                    'Recurring',
                    'RecurIterations',
                    'Alarm',
                    'Type',
                    'StartDate',
                    'Duration',
                    'ContactName',
                    'ContactId',
                    'LeadName',
                    'LeadId',
                    'AccountName',
                    'AccountId',
                    'Description',
                    'Priority',
                    'Leader/$descriptor',
                    'Location',
                    'TicketId',
                    'TicketNumber',
                    'OpportunityId',
                    'OpportunityName',
                    'Notes',
                    'RecurrenceState',
                    'PhoneNumber',
                    'AttendeeCount'
                ],
                include: ['$descriptors'],
                useBatchRequest: true
            };
        },
        _getSummaryDetailRequestConfig: function() {
            return {
                resourceKind: this._resourceKind,
                serviceName: 'system',
                keyField: '$key',
                select: [
                    '$key',
                    'Attachment',
                    'Timeless',
                    'Recurring',
                    'RecurIterations',
                    'Alarm',
                    'Type',
                    'StartDate',
                    'Duration',
                    'ContactName',
                    'ContactId',
                    'LeadName',
                    'LeadId',
                    'AccountName',
                    'AccountId',
                    'Description',
                    'Priority',
                    'Leader/$descriptor',
                    'Location',
                    'TicketId',
                    'TicketNumber',
                    'OpportunityId',
                    'OpportunityName',
                    'LongNotes',
                    'RecurrenceState',
                    'PhoneNumber',
                    'AttendeeCount'
                ],
                include: ['$descriptors'],
                useBatchRequest: true
            };
        },
        _getFormatterScope: function() {
            return new sDataSummaryFormatterScope({
                templateLocation: 'MainView/ActivityMgr/templates/AllOpenListSummary.html',
                resetDataManager: true,
                requestConfiguration: this._getSummaryListRequestConfig()
            });
        },
        _getToolBars: function () {
            return { items: [] };
        },
        getTimelessProperty: function (propertyName) {
            return "Timeless";
        }
    });
    return allOpenListPanelConfig;
});