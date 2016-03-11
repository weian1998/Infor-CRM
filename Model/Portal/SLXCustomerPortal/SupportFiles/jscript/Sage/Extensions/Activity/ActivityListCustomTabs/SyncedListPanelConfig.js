/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */

define([
        'Sage/MainView/ActivityMgr/AllOpenListPanelConfig',
        'Sage/UI/Columns/DateTime',
        'dojo/_base/declare',
        'dojo/i18n!./nls/SyncedListPanelConfig'
],

function (
   AllOpenListPanelConfig,
   DateTime,
   declare,
   nlsResources
) {
    var syncedListPanelConfig = declare('Sage.Extensions.Activity.SyncedListPanelConfig', [AllOpenListPanelConfig], {
        constructor: function () {
            this._listId = 'allSynced';
            this.addToConfigurationLayout();
        },
        addToConfigurationLayout: function () {
            //Add new structure configurations that will add new columns to the list panel.
            this._select.push('AttendeeCount');
            //this._select.push('Details/LastSyncDate');

            //Add new structure configurations that will add new columns to the list panel.
            this._structure.push({
                field: 'AttendeeCount',
                name: nlsResources.colCreateSource,
                width: '100px'
            });
        /*   this._structure.push({
                field: 'Details.LastSyncDate',
                name: nlsResources.colLastSyncDate,
                type: DateTime,
                width: '100px'
            });*/
        },
        _getWhere: function () {
            return '(Type ne "atLiterature" )';// and (GlobalSyncId ne null)';
        },
    });
    return syncedListPanelConfig;
});