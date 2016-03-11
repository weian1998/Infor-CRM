/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/i18n!./nls/LeadTasksTasklet',
    'Sage/TaskPane/_BaseTaskPaneTasklet',
    'Sage/TaskPane/TaskPaneContent',
    'Sage/MainView/Lead/UpdateLeads',
    'Sage/UI/Dialogs',
    'dojo/_base/declare'
],
function (i18nStrings, _BaseTaskPaneTasklet, TaskPaneContent, UpdateLeads, Dialogs, declare) {
    var leadTasksTasklet = declare('Sage.TaskPane.LeadTasksTasklet', [_BaseTaskPaneTasklet, TaskPaneContent], {
        taskItems: [],
        constructor: function () {
            dojo.mixin(this, i18nStrings);
            this.taskItems = [
                {
                    taskId: 'UpdateLeads',
                    type: "Link",
                    displayName: this.updateLeadsTitle,
                    clientAction: 'leadTasksActions.updateLeads();',
                    securedAction: 'Entities/Lead/MultiUpdate'
                },
                {
                    taskId: 'DeleteLeads', type: "Link", displayName: this.deleteLeadsTitle, clientAction: 'commonTaskActions.bulkDeleteJob();',
                    securedAction: 'Entities/Lead/MultiDelete'
                }
            ];
        },
        updateLeads: function () {
            this.prepareSelectedRecords(this.updateLeadsActionItem(this.getSelectionInfo()));
        },
        updateLeadsActionItem: function (selectionInfo) {
            return function () {
                var updateDialog = dijit.byId("dlgUpdateMultipleLeads");
                if (!updateDialog) {
                    updateDialog = new UpdateLeads(selectionInfo);
                } else {
                    updateDialog.setSelectionInfo(selectionInfo);
                }
                updateDialog.show();
            };
        },
        deleteLeads: function () {
            this.prepareSelectedRecords(this.confirmBulkDeleteJob(this, this.getSelectionInfo()));
        }
    });
    return leadTasksTasklet;
});
