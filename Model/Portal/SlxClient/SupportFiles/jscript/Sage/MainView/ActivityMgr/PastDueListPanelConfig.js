/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/MainView/ActivityMgr/BaseListPanelConfig',
    'Sage/Utility',
    'Sage/Utility/Activity',
    'Sage/UI/SummaryFormatterScope',
     'Sage/UI/SDataSummaryFormatterScope',
    'Sage/Data/SDataStore',
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
    baseListPanelConfig,
    sageUtility,
    utilityActivity,
    summaryFormatterScope,
    sDataSummaryFormatterScope,
    sDataStore,
    baseSDataStore,
    columnsDateTime,
    sDataServiceRegistry,
    declare,
    connect,
    dString,
    nlsResources
) {
    var pastDueListPanelConfig = declare('Sage.MainView.ActivityMgr.PastDueListPanelConfig', [baseListPanelConfig], {
        constructor: function () {
            this._nlsResources = nlsResources;
            this._listId = 'pastdue';
            this._resourceKind = 'useractivities';
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
            this.toolBar = this._getToolBars();
            this.keyField = "$key";
            this.hasCompositeKey = true;
            this.rebuildOnRefresh = true,
            connect.subscribe('/entity/activity/change', this._onListRefresh);
            connect.subscribe('/entity/activity/delete', this._onListRefresh);
            connect.subscribe('/entity/activity/create', this._onListRefresh);
            connect.subscribe('/entity/userActivity/change', this._onListRefresh);
            connect.subscribe('/entity/userActivity/delete', this._onListRefresh);
            connect.subscribe('/entity/userActivity/create', this._onListRefresh);
            connect.subscribe('/entity/activity/confirm', this._onListRefresh);
            connect.subscribe('/entity/activity/decline', this._onListRefresh);
            connect.subscribe('/entity/userNotification/delete', this._onListRefresh);
        },
        _onListRefresh: function (event) {
            var activityService = Sage.Services.getService('ActivityService');
            activityService.refreshList('pastdue');
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
                'Status'
            ];
        },
        _getInclude: function () {
            return ["Activity", "$descriptors"];
        },
        _getSort: function () {
            return [];
        },
        _getWhere: function() {
            var dt = new Date();
            var dtNow = Sage.Utility.Convert.toIsoStringFromDate(dt);
            var dtTimelessDate = utilityActivity.formatTimelessEndDate(dt, 'day', -1);
            return dString.substitute('(User.Id eq \'${0}\') and ( Activity.Type ne "atLiterature" ) and ((Alarm eq \'false\') or (Alarm eq null)) and ((Activity.StartDate lt \'${1}\') and ((Activity.Timeless eq \'false\') or (Activity.Timeless eq null )) or ((Activity.StartDate lt \'${2}\') and (Activity.Timeless eq \'true\' )))', [this._currentUserId, dtNow, dtTimelessDate]);
        },
        _getStructure: function() {
            var colNameAttachment = "<div class='Global_Images icon16x16 icon_attach_to_16' title='" + this._nlsResources.colNameAttachment + "' />";
            var colNameRecurring = "<div class='Global_Images icon16x16 icon_recurring' title='" + this._nlsResources.colNameRecurring + "' />";
            var colNameStatus = "<div class='Global_Images icon16x16 icon_unconfirmedActivity16x16' title='" + this._nlsResources.colNameUnConfirmStatus + "' />";
            var colNameType = this._nlsResources.colNameType || 'Activity Type';
            var colNameStartDate = this._nlsResources.colNameStartDate || 'Start Date';
            var colNameDuration = this._nlsResources.colNameDuration || 'Duration';
            var colNameContact = this._nlsResources.colNameContact || 'Name';
            var colNameAccount = this._nlsResources.colNameAccount || 'Account/Company';
            var colNameRegarding = this._nlsResources.colNameRegarding || 'Regarding';
            var colNamePriority = this._nlsResources.colNamePriority || 'Priority';
            var colNameUserId = this._nlsResources.colNameUserId || 'Leader';
            var colNameTypeName = this._nlsResources.colNameTypeName || 'Type';

            return [
                { field: 'Status', name: colNameStatus, type: utilityActivity.activityConfirmStatusCell, width: '20px' },
                { field: 'Activity.Attachment', name: colNameAttachment, type: utilityActivity.activityAttachCell, width: '20px' },
                { field: 'Activity.Recurring', name: colNameRecurring, type: utilityActivity.activityRecurringCell, width: '20px' },
                { field: 'Activity.Type', name: colNameType, type: utilityActivity.activityTypeCell, width: '90px' },
                { field: 'Activity.StartDate', name: colNameStartDate, type: columnsDateTime, timelessField: 'Activity.Timeless', width: '100px' },
                { field: 'Activity.Duration', name: colNameDuration, type: utilityActivity.activityDurationCell, width: '40px' },
                { field: 'Activity.ContactId', name: colNameTypeName, type: utilityActivity.activityNameTypeCell, width: '40px' },
                { field: 'Activity.ContactName', name: colNameContact, type: utilityActivity.activityNameCell, width: '200px' },
                { field: 'Activity.AccountName', name: colNameAccount, type: utilityActivity.activityAccountCell, width: '200px' },
                { field: 'Activity.Description', name: colNameRegarding, width: '100px' },
                { field: 'Activity.Priority', name: colNamePriority, width: '40px' },
                { field: 'Activity.Leader', name: colNameUserId, type: utilityActivity.activityLeaderCell, width: '200px' }
            ];
        },
        _getSummaryConfig: function () {
            var store = new sDataStore({
                id: this._listId,
                service: this._service,
                resourceKind: this._resourceKind,
                include: ['Activity', '$descriptors'],
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
            return {
                structure: structure,
                layout: 'layout',
                store: store,
                rowHeight: 120,
                rowsPerPage: 10,
                formatterScope: this._getFormatterScope()
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
    return pastDueListPanelConfig;
});