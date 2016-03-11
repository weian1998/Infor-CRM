/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/i18n!./nls/ReportManagerTasksTasklet',
    'Sage/TaskPane/_BaseTaskPaneTasklet',
    'Sage/TaskPane/TaskPaneItem',
    'dojo/_base/array',
    'dojo/string',
    'dijit/_Widget',
    'Sage/_Templated'
],
function (
    declare,
    nlsResources,
    _BaseTaskPaneTasklet,
    TaskPaneItem,
    dojoArray,
    dojoString,
    _Widget,
    _Templated
    ) {
    var reportManagerTasksTasklet = declare('Sage.TaskPane.ReportManagerTasksTasklet', [_BaseTaskPaneTasklet, _Widget, _Templated], {
        nlsResources: nlsResources,
        taskItems: [],
        widgetsInTemplate: true,
        widgetTemplate: new Simplate([
             '<div dojoAttachPoint="taskletContainerNode" class="task-pane-item-common-tasklist">',
                 '<span id="selectionCount" class="task-pane-item-common-selectionText">0</span>&nbsp;<span id="selectionText">' + nlsResources.txtRecordsSelected + '</span><br>',
                 '<a id="clearSelection" href="#" class="task-pane-item-common-clearselection" dojoAttachEvent="click:_clearSelection">' + nlsResources.txtClear + '</a><br>',
                 '<hr>',
                 '<div dojoAttachPoint="divTaskItems">',
                    '{% for (var i = 0; i < $.taskItems.length; i++) { ',
                        'var task = $.taskItems[i]; %}',
                        '<div data-dojo-type="Sage.TaskPane.TaskPaneItem" linkText="{%= task.displayName %}" securedAction="{%= task.securedAction %}" action="javascript: {%= task.clientAction %}"></div>',
                        '<br />',
                    '{% } %}',
                '</div>',
            '</div>'
        ]),
        /**
        * ReportManagerTasksTasklet constructor.
        * @constructor
        **/
        constructor: function () {
            this.taskItems = this._getTaskItems();
            dojo.subscribe('/group/context/changed', this, this._onGroupContextChanged);
            //allows the schedules tab in reports manager to just update the tasks and not the filters
            dojo.subscribe('/group/context/changedTask', this, this._onGroupContextChanged); 
            dojo.subscribe('/sage/ui/list/selectionChanged', function (listPanel) {
                var countSpan = dojo.byId('selectionCount');
                if (countSpan) {
                    countSpan.innerHTML = listPanel.getTotalSelectionCount();
                }
            });
        },
        /**
        * Returns a collection of task items for the current group.
        **/
        _getTaskItems: function () {
            var taskItems = [];
            var currentGroupId = this._getCurrentGroupId();
            switch (currentGroupId) {
                case "reports":
                    taskItems = this._getReportsTasks();
                    break;
                case "schedules":
                    taskItems = this._getSchedulesTasks();
                    break;
                case "history":
                    taskItems = this._getHistoryTasks();
                    break;
            }
            return taskItems;
        },
        /**
        * Clears the Report Manager tasks panel, populates the task items for the current group.
        **/
        _onGroupContextChanged: function () {
            //console.log("_onGroupContextChanged");
            var self = this;
            dojo.empty(self.divTaskItems);
            var taskItems = this._getTaskItems();
            if (taskItems) {
                dojoArray.forEach(taskItems, function (taskItem, i) {
                    dojo.place(dojoString.substitute('<div dojotype="Sage.TaskPane.TaskPaneItem" class="task-pane-item-common-tasklist" linkText="${0}" securedAction="${1}" action="javascript: ${2}"></div><br />', [taskItem.displayName, taskItem.securedAction, taskItem.clientAction]), self.divTaskItems);
                });
            }
            dojo.parser.parse(self.taskletContainerNode); //This is required so the dojo parser will process the dojotype="Sage.TaskPane.TaskPaneItem"
        },
        /**
        * Clears the current record selection in the listview.
        **/
        _clearSelection: function () {
            var listPanel = dijit.byId('list');
            if (listPanel) {
                listPanel._listGrid.selection.clear();
            }
        },
        /**
        * Returns the current group id.
        **/
        _getCurrentGroupId: function () {
            var svc = Sage.Services.getService('ClientGroupContext');
            var context = svc.getContext();
            return context.CurrentGroupID;
        },
        /**
        * Returns the list of tasks for reports.
        **/
        _getReportsTasks: function () {
            var taskItems = [
                {
                    taskId: 'taskRunReport',
                    type: "Link",
                    displayName: this.nlsResources.taskRunReport_Caption,
                    clientAction: 'Sage.MainView.ReportMgr.ReportManagerActions.runReport();',
                    securedAction: 'Entities/ReportManager/RunReport'
                },
                {
                    taskId: 'taskScheduleReport',
                    type: "Link",
                    displayName: this.nlsResources.taskScheduleReport_Caption,
                    clientAction: 'Sage.MainView.ReportMgr.ReportManagerActions.scheduleReport();',
                    securedAction: 'Entities/ReportManager/ScheduleReport'
                }/*,
                {
                    taskId: 'taskDeleteReport',
                    type: "Link",
                    displayName: this.nlsResources.taskDeleteReport_Caption,
                    clientAction: 'Sage.MainView.ReportMgr.ReportManagerActions.deleteReport();',
                    securedAction: 'Entities/ReportManager/DeleteReport'
                }*/
            ];
            return taskItems;
        },
        /**
        * Returns the list of tasks for schedules.
        **/
        _getSchedulesTasks: function () {
            var taskItems = [
                {
                    taskId: 'taskEditSchedule',
                    type: "Link",
                    displayName: this.nlsResources.taskEditSchedule_Caption,
                    clientAction: 'Sage.MainView.ReportMgr.ReportManagerActions.editSchedule();',
                    securedAction: 'Entities/ReportManager/EditSchedule'
                },
                {
                    taskId: 'taskDeleteSchedule',
                    type: "Link",
                    displayName: this.nlsResources.taskDeleteSchedule_Caption,
                    clientAction: 'Sage.MainView.ReportMgr.ReportManagerActions.deleteSchedule();',
                    securedAction: 'Entities/ReportManager/DeleteSchedule'
                }
            ];
            return taskItems;
        },
        /**
        * Returns the list of tasks for history.
        **/
        _getHistoryTasks: function () {
            var taskItems = [
                {
                    taskId: 'taskDeleteHistory',
                    type: "Link",
                    displayName: this.nlsResources.taskDeleteHistory_Caption,
                    clientAction: 'Sage.MainView.ReportMgr.ReportManagerActions.deleteHistory();',
                    securedAction: 'Entities/ReportManager/DeleteHistory'
                }
            ];
            return taskItems;
        }

    });
    return reportManagerTasksTasklet;
});