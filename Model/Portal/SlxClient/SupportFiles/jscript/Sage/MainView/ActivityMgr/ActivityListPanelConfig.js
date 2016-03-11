/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */

define([
    'dojo/i18n',
    'Sage/MainView/ActivityMgr/BaseListPanelConfig',
    'Sage/Utility/Activity',
    'Sage/UI/SummaryFormatterScope',
    'Sage/UI/SDataSummaryFormatterScope',
    'Sage/Data/BaseSDataStore',
    'Sage/Data/SDataStore',
    'Sage/UI/Columns/DateTime',
    'Sage/Data/SDataServiceRegistry',
    'dojo/_base/declare',
    'dojo/_base/connect',
    'dojo/string',
    'dojo/i18n!./nls/ActivityListPanelConfig',
    'dojo/i18n!./templates/nls/UserActivityDetailSummary',
    'dojo/i18n!./templates/nls/UserActivityListSummary'
],
function (
   i18N,
   baseListPanelConfig,
   utilityActivity,
   summaryFormatterScope,
   sDataSummaryFormatterScope,
   baseSDataStore,
   sDataStore,
   columnsDateTime,
   sDataServiceRegistry,
   declare,
   connect,
   dString,
   nlsResources
) {
    var activityListPanelConfig = declare('Sage.MainView.ActivityMgr.ActivityListPanelConfig', [baseListPanelConfig], {

        constructor: function () {
            this._nlsResources = nlsResources;
            this._listId = 'Activities';
            this._resourceKind = 'userActivities';
            this.entityName = 'UserActivity';
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
            this.summary = this._getSummaryConfig();
            this.detail = this._getDetailConfig();
            this.toolBar = this._getToolBars();
            this.keyField = "$key";
            this.hasCompositeKey = true;
            connect.subscribe('/entity/activity/change', this._onListRefresh);
            connect.subscribe('/entity/activity/delete', this._onListRefresh);
            connect.subscribe('/entity/activity/create', this._onListRefresh);
            connect.subscribe('/entity/userActivity/change', this._onListRefresh);
            connect.subscribe('/entity/userActivity/delete', this._onListRefresh);
            connect.subscribe('/entity/userActivity/create', this._onListRefresh);
            connect.subscribe('/entity/activity/confirm', this._onListRefresh);
            connect.subscribe('/entity/activity/decline', this._onListRefresh);
            connect.subscribe('/entity/userNotification/delete', this._onListRefresh);
            connect.subscribe('/entity/activityAttendees/updated', this._onListRefresh);
        },
        _onListRefresh: function (event) {
            var activityService = Sage.Services.getService('ActivityService');
            activityService.refreshList('activities');
        },
        _getSelect: function() {
            return [
                'Activity/Attachment',
                'Activity/Timeless',
                'Activity/Recurring',
                'Activity/RecurIterations',
                'Activity/Alarm',
                'Activity/Type',
                'Activity/StartDate',
                'Activity/Duration',
                'Activity/ContactName',
                'Activity/ContactId',
                'Activity/LeadName',
                'Activity/LeadId',
                'Activity/AccountName',
                'Activity/AccountId',
                'Activity/Description',
                'Activity/Priority',
                'Activity/Leader',
                'UserId',
                'AlarmTime',
                'Alarm',
                'Status',
                'Activity/AttendeeCount'
            ];
        },
        _getInclude: function () {
            return ["Activity", "$descriptors"];
        },
        _getSort: function () {
            return [{ attribute: 'Activity.StartDate', descending: true }];
        },
        _getWhere: function () {
            return (this._currentUserId) ? dString.substitute('(User.Id eq "${0}") and (Status ne "asDeclned" ) and (Activity.Type ne "atLiterature" ) ', [this._currentUserId]) : '';
        },
        _getStructure: function () {
            var colNameAttachment = "<div class='Global_Images icon16x16 icon_attach_to_16' title='" + this._nlsResources.colNameAttachment + "' />";
            var colNameRecurring = "<div class='Global_Images icon16x16 icon_recurring' title='" + this._nlsResources.colNameRecurring + "' />";
            var colNameAlarm = "<img src='images/icons/Alarm_16x16.gif' title='" + this._nlsResources.colNameAlarm + "' alt='" + this._nlsResources.colNameAlarm + "' />";
            var colNameStatus = "<div class='Global_Images icon16x16 icon_unconfirmedActivity16x16' title='" + this._nlsResources.colNameUnConfirmStatus + "' />";
            var colNameType = this._nlsResources.colNameType || 'Activity Type';
            var colNameStartDate = this._nlsResources.colNameStartDate || 'Start Date';
            var colNameDuration = this._nlsResources.colNameDuration || 'Duration';
            var colNameAccount = this._nlsResources.colNameAccount || 'Account/Company';
            var colNameRegarding = this._nlsResources.colNameRegarding || 'Regarding';
            var colNamePriority = this._nlsResources.colNamePriority || 'Priority';
            var colNameUserId = this._nlsResources.colNameUserId || 'Leader';
            var colNameTypeName = this._nlsResources.colNameTypeName || 'Type';
            var colNameContactName = this._nlsResources.colNameContactName || 'Name';
            var colNameAssociationCount = this._nlsResources.colNameAssociationCount || 'Participant Count';

            return [
                { field: 'Status', name: colNameStatus, type: utilityActivity.activityConfirmStatusCell, width: '20px' },
                { field: 'Alarm', name: colNameAlarm, type: utilityActivity.activityAlarmCell, width: '20px' },
                { field: 'Activity.Attachment', name: colNameAttachment, type: utilityActivity.activityAttachCell, width: '20px' },
                { field: 'Activity.Recurring', name: colNameRecurring, type: utilityActivity.activityRecurringCell, width: '20px' },
                { field: 'Activity.Type', name: colNameType, type: utilityActivity.activityTypeCell, width: '90px' },
                { field: 'Activity.StartDate', name: colNameStartDate, type: columnsDateTime, timelessField: 'Activity.Timeless', width: '100px' },
                { field: 'Activity.Duration', name: colNameDuration, type: utilityActivity.activityDurationCell, width: '40px' },
                { field: 'Activity.ContactId', name: colNameTypeName, type: utilityActivity.activityNameTypeCell, width: '40px' },
                { field: 'Activity.ContactName', name: colNameContactName, type: utilityActivity.activityNameCell, width: '200px' },
                { field: 'Activity.AccountName', name: colNameAccount, type: utilityActivity.activityAccountCell, width: '200px' },
                { field: 'Activity.Description', name: colNameRegarding, width: '100px' },
                { field: 'Activity.Priority', name: colNamePriority, width: '40px' },
                { field: 'Activity.Leader', name: colNameUserId, type: utilityActivity.activityLeaderCell, width: '200px' },
                { field: 'Activity.AttendeeCount', name: colNameAssociationCount, width: '90px' }
            ];
        },
        _getSummaryConfig: function () {
            var store = new sDataStore({
                id: this._listId,
                service: this._service,
                resourceKind: this._resourceKind,
                include: ['Activity','$descriptors'],
                select: ['$key'],
                expandRecurrences: false,
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
            return {
                structure: structure,
                layout: 'layout',
                store: store,
                rowHeight: 170,
                rowsPerPage: 10,
                formatterScope: formatScope
            };
        },
        _getDetailConfig: function () {
            var formatScope = this._getFormatterScope();
            return {
                resourceKind: this._resourceKind,
                requestConfiguration: this._getSummaryDetailRequestConfig(),
                templateLocation: 'MainView/ActivityMgr/templates/UserActivityDetailSummary.html'
            };
        },
        _getSummaryListRequestConfig: function() {
            return {
                resourceKind: this._resourceKind,
                serviceName: 'system',
                keyField: '$key',
                select: [
                    '$key',
                    'Alarm',
                    'Status',
                    'User',
                    'Activity/Attachment',
                    'Activity/Timeless',
                    'Activity/Recurring',
                    'Activity/RecurIterations',
                    'Activity/Type',
                    'Activity/StartDate',
                    'Activity/Duration',
                    'Activity/ContactName',
                    'Activity/ContactId',
                    'Activity/LeadName',
                    'Activity/LeadId',
                    'Activity/AccountName',
                    'Activity/AccountId',
                    'Activity/Description',
                    'Activity/Priority',
                    'Activity/Leader',
                    'Activity/Location',
                    'Activity/TicketId',
                    'Activity/TicketNumber',
                    'Activity/OpportunityId',
                    'Activity/OpportunityName',
                    'Activity/Notes',
                    'Activity/PhoneNumber',
                    'Activity/AttendeeCount'
                ],
                include: ['Activity', '$descriptors'],
                useBatchRequest: true,
                expandRecurrences: false
            };
        },
        _getSummaryDetailRequestConfig: function() {
            return {
                resourceKind: this._resourceKind,
                serviceName: 'system',
                keyField: '$key',
                select: [
                    '$key',
                    'Alarm',
                    'Status',
                    'User',
                    'Activity/Attachment',
                    'Activity/Timeless',
                    'Activity/Recurring',
                    'Activity/RecurIterations',
                    'Activity/Type',
                    'Activity/StartDate',
                    'Activity/Duration',
                    'Activity/ContactName',
                    'Activity/ContactId',
                    'Activity/LeadName',
                    'Activity/LeadId',
                    'Activity/AccountName',
                    'Activity/AccountId',
                    'Activity/Description',
                    'Activity/Priority',
                    'Activity/Leader',
                    'Activity/Location',
                    'Activity/TicketId',
                    'Activity/TicketNumber',
                    'Activity/OpportunityId',
                    'Activity/OpportunityName',
                    'Activity/LongNotes',
                    'Activity/PhoneNumber',
                    'Activity/AttendeeCount'
                ],
                include: ['Activity', '$descriptors'],
                useBatchRequest: true,
                expandRecurrences: false
            };
        },
        _getFormatterScope: function () {
            return new sDataSummaryFormatterScope({
                templateLocation: 'MainView/ActivityMgr/templates/UserActivityListSummary.html',
                resetDataManager: true,
                requestConfiguration: this._getSummaryListRequestConfig()
            });
        },
        _getToolBars: function () {
            return { items: [] };
        },
        getTimelessProperty: function (propertyName) {
            return "Activity.Timeless";
        }
    });
    return activityListPanelConfig;
});