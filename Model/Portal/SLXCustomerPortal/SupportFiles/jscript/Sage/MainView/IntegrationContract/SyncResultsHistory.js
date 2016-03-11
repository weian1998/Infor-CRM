/*globals dojo, define, Sage, dijit, Simplate, $ */
define([
    'dojo/_base/declare',
    'dojo/i18n!./nls/SyncResultsHistory',
    'dijit/_Widget',
    'Sage/UI/SLXPreviewGrid',
    'Sage/UI/Columns/DateTime',
    'Sage/UI/DateTextBox',
    'Sage/UI/Controls/_DialogHelpIconMixin',
    'dojo/_base/lang',
    'Sage/Utility/Workspace'
],

function (declare, i18nStrings, _Widget, SLXPreviewGrid, SlxDateTimeColumn, dateTextBox, dHelpIcon, lang, workspaceUtil) {
    var syncResultsHistory = declare('Sage.MainView.IntegrationContract.SyncResultsHistory', [_Widget], {
        workspace: '',
        tabId: '',
        grid: '',
        globalSyncId: '',
        constructor: function () {
            dojo.mixin(this, i18nStrings);
        },
        loadSyncResults: function () {
            var self = this;
            var options = {
                readOnly: true,
                rowsPerPage: 20,
                slxContext: { workspace: this.workspace, tabId: this.tabId },
                columns: [
                    { width: 10, field: 'Stamp', type: SlxDateTimeColumn, formatType: 'date/time', name: this.grdSyncHistory_StampDate, sortable: true, style: 'text-align:left;width:auto;', editable: false },
                    { width: 10, field: 'HttpStatus', name: this.grdSyncHistory_Status, sortable: true, style: 'text-align:left;width:auto;', editable: false },
                    { width: 10, field: 'ErrorMessage', name: this.grdSyncHistory_SyncNote, sortable: true, style: 'text-align:left;width:auto;', editable: false, hidden: function () { return true; } }
                ],
                storeOptions: {
                    resourceKind: 'syncResults',
                    include: [],
                    select: [],
                },
                contextualCondition: function () { return dojo.string.substitute("$uuid eq '${0}'", [self.globalSyncId]); },
                tools: []
            };
            var historyGrid = new SLXPreviewGrid.Grid(options, this.placeHolder);
            historyGrid.startup();
            var tabContent = workspaceUtil.getDetailTabWorkspaceContainer();
            tabContent.resize(); tabContent.resize();
            this.grid = historyGrid;
        }
    });
    return syncResultsHistory;
});