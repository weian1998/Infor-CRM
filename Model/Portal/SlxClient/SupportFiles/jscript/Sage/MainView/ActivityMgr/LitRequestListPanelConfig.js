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
    'dojo/i18n!./nls/LitRequestListPanelConfig',
    'dojo/i18n!./templates/nls/LitRequestSummary'
],
function (
    baseListPanelConfig,
    sageUtility,
    UtilityActivity,
    summaryFormatterScope,
    baseSDataStore,
    columnsDateTime,
    declare,
    connect,
    string,
    dCells,
    nlsResources
) {
    var litRequestListPanelConfig = declare('Sage.MainView.ActivityMgr.LitRequestListPanelConfig', [baseListPanelConfig], {
        constructor: function() {
            this._nlsResources = nlsResources;
            this._listId = 'literature';
            this._resourceKind = 'litRequests';
            this.entityName = 'LitRequest';
            this._contextMenu = 'LitRequestListContextMenu';
            this._securedAction = 'Activities\View\LitratureRequests';
            this._structure = this._getStructure();
            this._select = this._getSelect();
            this._sort = this._getSort();
            this._where = this._getWhere();
            this._store = this._getStore();
            this.list = this._getListConfig();
            this.summary = this._getSummaryConfig();
            this.toolBar = this._getToolBars();
            connect.subscribe('/entity/litRequest/change', this._onListRefresh);
        },
        _onListRefresh: function(event) {
            var activityService = Sage.Services.getService('ActivityService');
            activityService.refreshList('literature');
        },
        _getSelect: function() {
            return [
                '$key',
                'ContactName',
                'Contact/$key',
                'Description',
                'FillDate',
                'FillStatus',
                'Options',
                'Priority',
                'RequestDate',
                'SendDate',
                'SendVia',
                'TotalCost',
                'FillUser/UserInfo/UserName',
                'RequestUser/UserInfo/UserName',
                'Contact/AccountName',
                'Contact/Address/PostalCode',
                'Contact/Account/AccountId',
                'ReqestUser/$key'
            ];
        },
        _getSort: function() {
            return [{ attribute: 'RequestDate', descending: true }];
        },
        _getWhere: function() {
            var completeStatus = this._nlsResources.litFillStatusComplete || 'Completed';
            return (this._currentUserId) ? string.substitute('(RequestUser.Id eq "${0}") and (FillStatus ne "${1}"  or FillStatus eq null )', [this._currentUserId, completeStatus]) : '';
        },
        _getStructure: function() {
            var colNameView = this._nlsResources.colNameView || 'View';
            var colNameContact = this._nlsResources.colNameContact || 'Contact';
            var colNameDescription = this._nlsResources.colNameDescription || 'Description';
            var colNameFillStatus = this._nlsResources.colNameFillStatus || 'Status';
            var colNamePriority = this._nlsResources.colNamePriority || 'Priority';
            var colNameReqestDate = this._nlsResources.colNameReqestDate || 'Request Date';
            var colNameSendDate = this._nlsResources.colNameSendDate || 'Send Date';
            var colNameSendVia = this._nlsResources.colNameSendVia || 'Send Via';
            var colNameTotalCost = this._nlsResources.colNameTotalCost || 'Total Cost';
            var colNameRequestUser = this._nlsResources.colNameReqestUser || 'Request User';
            var colNameAccount = this._nlsResources.colNameAccount || 'Account';
            var colNamePostalCode = this._nlsResources.colNamePostalCode || 'Postal Code';

            declare("Sage.MainView.ActivityMgr.LitRequestListPanelConfig.LitViewCell", dCells.Cell, {
                format: function(inRowIndex, inItem) {
                    var key = sageUtility.getValue(inItem, "$key");
                    return '<a href="LitRequest.aspx?entityid=' + key + '&modeid=Detail" >' + colNameView + '</a>';
                }
            });

            declare("Sage.MainView.ActivityMgr.LitRequestListPanelConfig.LitContactCell", dCells.Cell, {
                format: function(inRowIndex, inItem) {
                    var contactId = Sage.Utility.getValue(inItem, 'Contact.$key');
                    var contactName = Sage.Utility.getValue(inItem, 'ContactName');
                    return '<a href="Contact.aspx?entityid=' + contactId + '&modeid=Detail" >' + contactName + '</a>';
                }
            });

            declare("Sage.MainView.ActivityMgr.LitRequestListPanelConfig.LitAccountCell", dCells.Cell, {
                format: function(inRowIndex, inItem) {
                    var accountId = Sage.Utility.getValue(inItem, 'Contact.Account.$key');
                    var accountName = Sage.Utility.getValue(inItem, 'Contact.AccountName');
                    return '<a href="Account.aspx?entityid=' + accountId + '&modeid=Detail" >' + accountName + '</a>';
                }
            });
            return [
                { field: '$key', name: ' ', type: Sage.MainView.ActivityMgr.LitRequestListPanelConfig.LitViewCell, width: '60px' },
                { field: 'RequestDate', name: colNameReqestDate, type: columnsDateTime, dateOnly: true, width: '90px' },
                { field: 'Priority', name: colNamePriority, width: '60px' },
                { field: 'Description', name: colNameDescription, width: '200px' },
                { field: 'ContactName', name: colNameContact, type: Sage.MainView.ActivityMgr.LitRequestListPanelConfig.LitContactCell, width: '200px' },
                { field: 'Contact.AccountName', name: colNameAccount, type: Sage.MainView.ActivityMgr.LitRequestListPanelConfig.LitAccountCell, width: '200px' },
                { field: 'SendDate', name: colNameSendDate, type: columnsDateTime, dateOnly: true, width: '90px' },
                { field: 'SendVia', name: colNameSendVia, width: '60px' },
                { field: 'TotalCost', name: colNameTotalCost, width: '60px' },
                { field: 'FillStatus', name: colNameFillStatus, width: '60px' },
                { field: 'RequestUser.UserInfo.UserName', name: colNameRequestUser, width: '90px' },
                { field: 'Contact.Address.PostalCode', name: colNamePostalCode, width: '60px' }
            ];
        },
        _getDetailConfig: function() {
            return {
                resourceKind: this._resourceKind,
                requestConfiguration: {
                    mashupName: 'ActivityManager',
                    queryName: 'LitRequestSummary_query'
                },
                templateLocation: 'MainView/ActivityMgr/templates/LitRequestSummary.html',
                postProcessCallBack: false
            };
        },
        _getFormatterScope: function() {
            return new summaryFormatterScope({
                requestConfiguration: {
                    mashupName: 'ActivityManager',
                    queryName: 'LitRequestSummary_query'
                },
                templateLocation: 'MainView/ActivityMgr/templates/LitRequestSummary.html'
            });
        },
        _getToolBars: function() {
            return { items: [] };
        }
    });
    return litRequestListPanelConfig;
});