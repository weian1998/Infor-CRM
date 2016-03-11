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
    'dojo/i18n!./nls/EventListPanelConfig',
    'dojo/i18n!./templates/nls/EventSummary'
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
    var eventListPanelConfig = declare('Sage.MainView.ActivityMgr.EventListPanelConfig', [baseListPanelConfig], {
        constructor: function () {
            this._nlsResources = nlsResources;
            this._listId = 'events';
            this._resourceKind = 'events';
            this.entityName = 'Event';
            this._contextMenu = 'EventListContextMenu';
            this._securedAction = 'Activities\View\Events';
            this._structure = this._getStructure();
            this._select = this._getSelect();
            this._sort = this._getSort();
            this._where = this._getWhere();
            this._store = this._getStore();
            this.list = this._getListConfig();
            this.detail = this._getDetailConfig();
            this.summary = this._getSummaryConfig();
            this.toolBar = this._getToolBars();
            connect.subscribe('/entity/event/create', this._onListRefresh);
            connect.subscribe('/entity/event/change', this._onListRefresh);
            connect.subscribe('/entity/event/delete', this._onListRefresh);
        },
        _onListRefresh: function (event) {
            var activityService = Sage.Services.getService('ActivityService');
            activityService.refreshList('events');
        },
        _getSelect: function() {
            return [
                '$key',
                'Type',
                'StartDate',
                'EndDate',
                'Location',
                'Description',
                'User/UserInfo/UserName',
                'User/UserAccessToOtherCal/OthersAccessToUserCal/Id'
            ];
        },
        _getSort: function () {
            return [{ attribute: 'StartDate', descending: true }];
        },
        _getWhere: function () {
            return (this._currentUserId) ? dString.substitute('(User.UserAccessToOtherCal.OthersAccessToUserCal.Id eq "${0}")', [this._currentUserId]) : '';
        },
        _getStructure: function() {
            var colNameType = this._nlsResources.colNameType || 'Type';
            var colNameStartDate = this._nlsResources.colNameStartDate || 'Start Date';
            var colNameEndDate = this._nlsResources.colNameEndDate || 'End Date';
            var colNameDescription = this._nlsResources.colNameDescription || 'Description';
            var colNameUser = this._nlsResources.colNameUser || 'User';
            var colNameLocation = this._nlsResources.colNameLocation || 'Location';

            declare("Sage.MainView.ActivityMgr.EventListPanelConfig.EditEventCell", dCells.Cell, {
                format: function(inRowIndex, inItem) {
                    var key = Sage.Utility.getValue(inItem, "$key");
                    var html = "<a href='javascript:Sage.Link.editEvent(\"" + key + "\")' >" + "Edit" + "</a>";
                    return html;
                }
            });

            declare("Sage.MainView.ActivityMgr.EventListPanelConfig.EventTypeCell", dCells.Cell, {
                format: function(inRowIndex, inItem) {
                    var key = Sage.Utility.getValue(inItem, "$key");
                    var type = Sage.Utility.getValue(inItem, "Type");
                    var html = "<a href='javascript:Sage.Link.editEvent(\"" + key + "\")' >" + type + "</a>";
                    return html;
                }
            });

            return [
                { field: 'Type', name: colNameType, type: Sage.MainView.ActivityMgr.EventListPanelConfig.EventTypeCell, width: '100px' },
                { field: 'StartDate', name: colNameStartDate, type: columnsDateTime, dateOnly: true, utc: false, width: '100px' },
                { field: 'EndDate', name: colNameEndDate, type: columnsDateTime, dateOnly: true, utc: false, width: '100px' },
                { field: 'User.UserInfo.UserName', name: colNameUser, width: '120px' },
                { field: 'Location', name: colNameLocation, width: '200px' },
                { field: 'Description', name: colNameDescription, width: '300px' }
            ];
        },
        _getDetailConfig: function () {
            var formatScope = this._getFormatterScope();
            return {
                resourceKind: this._resourceKind,
                requestConfiguration: {
                    mashupName: 'ActivityManager',
                    queryName: 'EventSummary_query'
                },
                templateLocation: 'MainView/ActivityMgr/templates/EventSummary.html',
                postProcessCallBack: false
            };
        },
        _getFormatterScope: function () {
            return new summaryFormatterScope({
                requestConfiguration: {
                    mashupName: 'ActivityManager',
                    queryName: 'EventSummary_query'
                },
                templateLocation: 'MainView/ActivityMgr/templates/EventSummary.html'
            });
        },
        _getToolBars: function () {
            return { items: [] };
        }
    });
    return eventListPanelConfig;
});