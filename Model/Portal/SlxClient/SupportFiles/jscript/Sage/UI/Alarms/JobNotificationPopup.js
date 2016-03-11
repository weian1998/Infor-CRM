/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/_Widget',
    'Sage/UI/EditableGrid',
    'Sage/Utility',
    'dojo/string',
    'dojo/i18n!./nls/JobNotificationPopup',
    'dojo/_base/declare',
    'Sage/Utility/Jobs'
],
function (
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    _Widget,
    editableGrid,
    utility,
    dString,
    notificationPopupStrings,
    declare,
    jobUtility
) {
    var widget = declare('Sage.UI.Alarms.JobNotificationPopup', [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
        _notificationCount: -1,
        _dataRequested: false,
        widgetsInTemplate: true,
        isOpen: false,
        grid: '',
        templateString: [
            '<div class="alarm-popup notification-popup">',
                '<div class="alarm-title notification-title">',
                    '<span class="alarm-main-title">&nbsp;${notificationPopupStrings.title}</span>',
                    '<span class="alarm-title-tools notification-title-tools">',
                        '<span dojoType="Sage.UI.ImageButton" imageClass="icon_Help_16x16" title="${notificationPopupStrings.helpText}" dojoAttachEvent="onClick:_showHelp" ></span>',
                    '</span>',
                '</div>',
                '<div data-dojo-type="dijit.layout.StackContainer" dojoAttachPoint="_panelContainer" class="alarm-body" >',
                    '<div data-dojo-type="dijit.layout.BorderContainer" id="jobNotifications_Grid" dojoAttachPoint="jobNotifications_Grid" style="width:100%;height:100%;"></div>',
                '</div>',
            '</div>'
        ].join(''),
        constructor: function () {
            this.notificationPopupStrings = notificationPopupStrings;
            var jobService = Sage.Services.getService('JobService');
            var sdataService = jobService.getSchedulingSDataService();
            this._service = sdataService;
        },
        onOpen: function () {
            this.isOpen = true;
            //because we live inside a popup, we need to call resize() on the stack container to make it show a child...
            this._panelContainer.resize();
            if (!this._dataRequested) {
                this._loadNotifications();
            } else {
                this.grid.refresh();
            }
        },
        _onNotificationRequestComplete: function () {
            var count = this.context.query.scope.rowCount;
        },
        _loadNotifications: function () {
            var options = {
                readOnly: true,
                columns: this._getColumnLayout(),
                tools: [],
                storeOptions: {
                    service: this._service,
                    resourceKind: 'executions',
                    include: ['$descriptors'],
                    select: ['$key', 'job', 'trigger', 'progress', 'elapsed', 'status', 'result'],
                    sort: [{ attribute: 'status', descending: true}],
                    onComplete: this._onNotificationRequestComplete
                },
                contextualCondition: function () {
                    //return dString.substitute("(user eq '${0}')", [utility.getClientContextByKey('userID')]);
                },
                id: this.id + 'executions',
                tabId: 'jobExecutions',
                gridNodeId: this.jobNotifications_Grid.id,
                singleClickEdit: true,
                dblClickAction: this._onDblClick,
                rowsPerPage: 20
            };
            var grid = new editableGrid(options);
            var gridContainer = dijit.byId(grid.gridNodeId);
            gridContainer.addChild(grid);
            window.setTimeout(function () { grid.startup(); gridContainer.resize(); }, 1);
            this.grid = grid;
            grid.startup();
            this._dataRequested = true;
        },
        //TODO
        _onDblClick: function () {
        },
        _getColumnLayout: function () {
            function formatProgress(progress) {
                if (!progress || typeof progress !== "number") {
                    progress = 0;
                }
                var progressBar = new dijit.ProgressBar({
                    indeterminate: false,
                    maximum: 100,
                    value: progress
                });
                return progressBar;
            }

            var columns = [
                { width: 10, field: '$key', name: ' ', sortable: false, hidden: true },
                { width: 10, field: 'job', name: this.notificationPopupStrings.colNameJobName || 'Type', sortable: true, formatter: jobUtility.formatJobDescription },
                { width: 8, field: 'progress', name: this.notificationPopupStrings.colNameProgress || 'Progress', formatter: formatProgress, sortable: false },
                { width: 6, field: 'status', name: this.notificationPopupStrings.colNameStatus || 'Status', sortable: true },
                { width: 24, field: '_item', name: this.notificationPopupStrings.colExecutionResult || 'Result', formatter: jobUtility.formatJobResult, sortable: false }];
            return columns;
        },
        onClose: function () {
            this.isOpen = false;
        },
        startup: function () {
            this.inherited(arguments);
        },
        _showHelp: function () {
            utility.openHelp('jobNotifications');
        }
    });
    return widget;
});
