/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
        'dojo/_base/declare',
        'dojo/i18n!./nls/GroupManagerTasksTasklet',
        'Sage/TaskPane/_BaseTaskPaneTasklet',
        'Sage/TaskPane/TaskPaneItem',
        'dojo/_base/array',
        'dojo/string',
        'dijit/_Widget',
        'Sage/_Templated'
    ],
    function(
        declare,
        nlsResources,
        _BaseTaskPaneTasklet,
        TaskPaneItem,
        dojoArray,
        dojoString,
        _Widget,
        _Templated
    ) {
        var GroupManagerTasksTasklet = declare('Sage.TaskPane.GroupManagerTasksTasklet', [_BaseTaskPaneTasklet, _Widget, _Templated], {
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
        * GroupManagerTasksTasklet constructor.
        * @constructor
        **/
            constructor: function() {
                this.taskItems = this._getTaskItems();
                dojo.subscribe('/group/context/changed', this, this._onGroupContextChanged);
                dojo.subscribe('/group/context/changedTask', this, this._onGroupContextChanged);
                dojo.subscribe('/sage/ui/list/selectionChanged', function(listPanel) {
                    var countSpan = dojo.byId('selectionCount');
                    if (countSpan) {
                        countSpan.innerHTML = listPanel.getTotalSelectionCount();
                    }
                });

            },
            /**
        * Returns a collection of task items for the current group.
        **/
            _getTaskItems: function() {
                var taskItems = [];
                var currentGroupId = this._getCurrentGroupId();
                switch (currentGroupId) {
                case 'all_groups':
                    taskItems = this._getGroupsTasks();
                    break;
                case 'releases':
                    taskItems = this._getReleasesTasks();
                    break;
                case 'statistics':
                    taskItems = this._getStatisticsTasks();
                    break;
                }
                return taskItems;
            },
            /**
        * Clears the Group Manager tasks panel, populates the task items for the current group.
        **/
            _onGroupContextChanged: function() {
                //console.log("_onGroupContextChanged");
                var self = this;
                dojo.empty(self.divTaskItems);
                var taskItems = this._getTaskItems();
                if (taskItems) {
                    dojoArray.forEach(taskItems, function(taskItem, i) {
                        dojo.place(dojoString.substitute('<div dojotype="Sage.TaskPane.TaskPaneItem" class="task-pane-item-common-tasklist" linkText="${0}" securedAction="${1}" action="javascript: ${2}"></div><br />', [taskItem.displayName, taskItem.securedAction, taskItem.clientAction]), self.divTaskItems);
                    });
                }
                dojo.parser.parse(self.taskletContainerNode); //This is required so the dojo parser will process the dojotype="Sage.TaskPane.TaskPaneItem"
            },
            /**
        * Clears the current record selection in the listview.
        **/
            _clearSelection: function() {
                var listPanel = dijit.byId('list');
                if (listPanel) {
                    listPanel._listGrid.selection.clear();
                }
            },
            /**
        * Returns the current group id.
        **/
            _getCurrentGroupId: function() {
                var svc = Sage.Services.getService('ClientGroupContext');
                var context = svc.getContext();
                return context.CurrentGroupID;
            },
            /**
        * Returns the list of tasks for Groups.
        **/
            _getGroupsTasks: function() {
                var taskItems = [
                    {
                        taskId: 'taskViewGroup',
                        type: 'Link',
                        displayName: nlsResources.txtView,
                        clientAction: 'Sage.MainView.GroupMgr.GroupManagerActions.viewGroup();',
                        securedAction: 'Administration/GroupManager/Groups/View'
                    },
                    {
                        taskId: 'taskEditGroup',
                        type: 'Link',
                        displayName: nlsResources.txtEdit,
                        clientAction: 'Sage.MainView.GroupMgr.GroupManagerActions.editGroup();',
                        securedAction: 'Administration/GroupManager/Groups/Edit'
                    },
                    {
                        taskId: 'taskDeleteGroup',
                        type: 'Link',
                        displayName: nlsResources.txtDelete,
                        clientAction: 'Sage.MainView.GroupMgr.GroupManagerActions.deleteGroup();',
                        securedAction: 'Administration/GroupManager/Groups/Delete'
                    },
                    {
                        taskId: 'taskShareGroup',
                        type: 'Link',
                        displayName: nlsResources.txtShare,
                        clientAction: 'Sage.MainView.GroupMgr.GroupManagerActions.shareGroup();',
                        securedAction: 'Administration/GroupManager/Groups/Share'
                    },
                    {
                        taskId: 'taskAssignOwner',
                        type: 'Link',
                        displayName: nlsResources.txtAssignOwner,
                        clientAction: 'Sage.MainView.GroupMgr.GroupManagerActions.assignGroupOwner();',
                        securedAction: 'Administration/GroupManager/Groups/AssignOwner'
                    }
                ];
                return taskItems;
            },
            /**
        * Returns the list of tasks for Releases.
        **/
            _getReleasesTasks: function() {
                var taskItems = [
                    {
                        taskId: 'taskDeleteReleases',
                        type: 'Link',
                        displayName: nlsResources.txtDelete,
                        clientAction: 'Sage.MainView.GroupMgr.GroupManagerActions.deleteReleases();',
                        securedAction: 'Administration/GroupManager/Shared/Delete'
                    }
                ];
                return taskItems;
            },
            /**
        * Returns the list of tasks for Statistics.
        **/
            _getStatisticsTasks: function() {
                var taskItems = [
                    {
                        taskId: 'taskDeleteStatistics',
                        type: 'Link',
                        displayName: nlsResources.txtResetStatistics,
                        clientAction: 'Sage.MainView.GroupMgr.GroupManagerActions.deleteStatistics();',
                        securedAction: 'Administration/GroupManager/UsageStatistics/Delete'
                    }
                ];
                return taskItems;
            }

            });
        return GroupManagerTasksTasklet;
    });