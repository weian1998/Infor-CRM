/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/i18n!./nls/JobManagerTasksTasklet',
    'dojo/_base/declare',
    'Sage/TaskPane/_BaseTaskPaneTasklet',
    'Sage/TaskPane/TaskPaneContent',
    'Sage/TaskPane/TaskPaneItem',
    'dojo/_base/array',
    'dojo/string'
],
function(i18nStrings, declare, _BaseTaskPaneTasklet, TaskPaneContent, TaskPaneItem, dojoArray, dojoString) {
    var jobManagerTasksTasklet = declare('Sage.TaskPane.JobManagerTasksTasklet', [_BaseTaskPaneTasklet, TaskPaneContent], {
        taskItems: [],
        constructor: function() {
            dojo.mixin(this, i18nStrings);
            this.taskItems = this._getTaskletItems();
            dojo.subscribe('/group/context/changed', this, this._onGroupContextChanged);
        },
        /**
        * Returns a collection of tasklet items for the current group.
        **/
        _getTaskletItems: function() {
            var currentGroupId = this._getCurrentGroupId();
            switch (currentGroupId) {
                case "jobDefinitions":
                    return this._getDefinationsTasks();
                case "schedules":
                    return this._getSchedulesTasks();
                default:
                    return this._getExecutionsTasks();
            }
        },
        _getCurrentGroupId: function() {
            var svc = Sage.Services.getService('ClientGroupContext');
            var context = svc.getContext();
            return context.CurrentGroupID;
        },
        _getExecutionsTasks: function() {
            var taskItems = [
                {
                    taskId: 'taskCancelExecution',
                    type: "Link",
                    displayName: this.taskCancelJob_Caption,
                    clientAction: 'Sage.MainView.JobMgr.JobManagerActions.showCancelExecutionDialog();',
                    securedAction: 'Entities/JobManager/CancelJob'
                }
            ];
            return taskItems;
        },
        _getDefinationsTasks: function() {
            var taskItems = [
                {
                    taskId: 'taskRunJob',
                    type: "Link",
                    displayName: this.taskRunJob_Caption,
                    clientAction: 'Sage.MainView.JobMgr.JobManagerActions.showRunJobDialog(true);',
                    securedAction: 'Entities/JobManager/RunJob'
                }
            ];
            return taskItems;
        },
        _getSchedulesTasks: function() {
            var taskItems = [
                {
                    taskId: 'taskRunJob',
                    type: "Link",
                    displayName: this.taskEditTrigger_Caption,
                    clientAction: 'Sage.MainView.JobMgr.JobManagerActions.showRunJobDialog(false);',
                    securedAction: 'Entities/JobManager/RunJob'
                },
                {
                    taskId: 'taskDeleteScheduledJob',
                    type: "Link",
                    displayName: this.taskDeleteScheduledJob_Caption,
                    clientAction: 'Sage.MainView.JobMgr.JobManagerActions.deleteScheduledJob();',
                    securedAction: 'Entities/JobManager/DeleteScheduledJob'
                }
            ];
            return taskItems;
        },
        /**
        * Refreshes the job manager's task pane and reloads the tasklet items based on the selected group tab.
        **/
        _onGroupContextChanged: function() {
            var self = this;
            dojo.empty("JobManagerTasks");
            var taskItems = this._getTaskletItems();
            if (taskItems) {
                dojoArray.forEach(taskItems, function(taskItem, i) {
                    dojo.place(dojoString.substitute('<div dojotype="Sage.TaskPane.TaskPaneItem" class="task-pane-item-common-tasklist" linkText="${0}" securedAction="${1}" action="javascript: ${2}"></div><br />',
                        [taskItem.displayName, taskItem.securedAction, taskItem.clientAction]),
                        self.taskletContainerNode);
                });
            }
            dojo.parser.parse(self.taskletContainerNode);
        },
    });
    return jobManagerTasksTasklet;
});