/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/MainView/ActivityMgr/BaseListPanelConfig',
    'Sage/Utility',
    'Sage/Utility/Activity',
    'Sage/UI/SummaryFormatterScope',
    'Sage/Data/BaseSDataStore',
    'Sage/UI/Columns/DateTime',
    'dojo/_base/declare',
    'dojo/_base/connect',
    'dojo/string',
    'dojox/grid/cells',
    'dojo/i18n!./nls/ConfirmListPanelConfig',
    'dojo/i18n!./templates/nls/ConfirmationListSummary',
    'dojo/i18n!./templates/nls/ConfirmationDetailSummary'
],
function (
    baseListPanelConfig,
    sageUtility,
    utilityActivity,
    summaryFormatterScope,
    baseSDataStore,
    columnsDateTime,
    declare,
    connect,
    dString,
    dCells,
    nlsResources
) {
    var confirmListPanelConfig = declare('Sage.MainView.ActivityMgr.ConfirmListPanelConfig', [baseListPanelConfig], {
        constructor: function () {
            this._nlsResources = nlsResources;
            this._listId = 'confirmations';
            this._resourceKind = 'UserNotifications';
            this.entityName = 'UserNotification';
            this._contextMenu = 'ConfimationListContextMenu';
            this._scheduleContextMenu = 'ScheduleContextMenu';
            this._structure = this._getStructure();
            this._select = this._getSelect();
            this._include = this._getInclude();
            this._sort = this._getSort();
            this._where = this._getWhere();
            this._store = this._getStore();
            this.list = this._getListConfig();
            this.detail = this._getDetailConfig();
            this.summary = this._getSummaryConfig();
            this.toolBar = this._getToolBars();
            connect.subscribe('/entity/userNotification/change', this._onListRefresh);
            connect.subscribe('/entity/userNotification/delete', this._onListRefresh);
        },
        _onListRefresh: function (event) {
            var activityService = Sage.Services.getService('ActivityService');
            activityService.refreshList('confirmations');
        },
        _getSelect: function () {
            return [
                '$key',
                'Type',
                'ActivityId',
                'Activity/Type',
                'Activity/StartDate',
                'Activity/Description',
                'FromUserId',
                'ToUserId',
                'FromUser/UserInfo/UserName',
                'ToUser/UserInfo/UserName'
            ];
        },
        _getInclude: function () {
            return ["UserInfo"];
        },
        _getSort: function () {
            return [{ attribute: 'Activity.StartDate', descending: true }];
        },
        _getWhere: function () {
            return (this._currentUserId) ? dString.substitute('ToUser.Id eq "${0}" ', [this._currentUserId]) : '';
        },
        _getStructure: function() {
            var colNameType = this._nlsResources.colNameType || 'Activity Type';
            var colNameStatus = this._nlsResources.colNameNotification || 'Notification';
            var colNameStartDate = this._nlsResources.colNameStartDate || 'Start Date';
            var colNameRegarding = this._nlsResources.colNameRegarding || 'Regarding';
            var colNameFromUser = this._nlsResources.colNameFromUser || 'From';
            var colNameToUser = this._nlsResources.colNameToUser || 'To User';

            var activityConfirmCell = declare("Sage.MainView.ActivityMgr.ConfirmListPanelConfig.ActivityConfirmCell", dCells.Cell, {
                format: function(inRowIndex, inItem) {
                    var key = sageUtility.getValue(inItem, "$key");
                    var type = sageUtility.getValue(inItem, "Type");
                    var statusName = utilityActivity.getConfirmStatusName(type);
                    var html = "<a href='javascript:Sage.Link.editConfirmation(\"" + key + "\")' >" + statusName + "</a>";
                    return html;
                }
            });

            var activityTypeCell = declare("Sage.MainView.ActivityMgr.ConfirmListPanelConfig.ActivityTypeCell", dCells.Cell, {
                format: function(inRowIndex, inItem) {
                    var type = this.get(inRowIndex, inItem);
                    return "<div><div class='Global_Images icon16x16 " + utilityActivity.getActivityImageClass(type, 'small') + "'></div>&nbsp" + utilityActivity.getActivityTypeName(type) + "</div>";
                }
            });

            return [
                { field: 'Type', name: colNameStatus, type: activityConfirmCell, width: '90px' },
                { field: 'Activity.Type', name: colNameType, type: activityTypeCell, width: '90px' },
                { field: 'Activity.StartDate', name: colNameStartDate, type: columnsDateTime, timelessField: 'Timeless', width: '150px' },
                { field: 'Activity.Description', name: colNameRegarding, width: '300px' },
                { field: 'FromUser.UserInfo.UserName', name: colNameFromUser, width: '100px' },
                { field: 'ToUser.UserInfo.UserName', name: colNameToUser, width: '100px' }
            ];
        },
        _getDetailConfig: function () {
            var formatScope = this._getFormatterScope();
            return {
                resourceKind: this._resourceKind,
                requestConfiguration: {
                    mashupName: 'ActivityManager',
                    queryName: 'ConfirmationDetailSummary_query'
                },
                templateLocation: 'MainView/ActivityMgr/templates/ConfirmationDetailSummary.html',
                postProcessCallBack: false
            };
        },
        _getFormatterScope: function () {
            return new summaryFormatterScope({
                requestConfiguration: {
                    mashupName: 'ActivityManager',
                    queryName: 'ConfirmationListSummary_query'
                },
                templateLocation: 'MainView/ActivityMgr/templates/ConfirmationListSummary.html'
            });
        },
        _getToolBars: function () {
            return { items: [] };
        }
    });
    return confirmListPanelConfig;
});