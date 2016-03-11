/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/UI/SummaryContainer',
    'dojo/i18n',
    'Sage/UI/SummaryFormatterScope',
    'Sage/MainView/ReportMgr/SchedulesSDataDetailViewDataManager',
    'Sage/UI/Controls/SummaryAggregate',
    'dojo/_base/declare'
],
function (summaryContainer, i18n, SummaryFormatterScope, SchedulesSDataDetailViewDataManager, SummaryAggregate, declare) {
    var schedulesSDataSummaryFormatterScope = declare('Sage.MainView.ReportMgr.SchedulesSDataSummaryFormatterScope', [SummaryFormatterScope], {
        constructor: function (args) {
            dojo.mixin(this, args);
            this.widgets = [];
            this.preFetchResources();
            this._setupDataManager();
        },
        _setupDataManager: function () {
            this.dataManager = new SchedulesSDataDetailViewDataManager(this.requestConfiguration);
            if (Sage.Services.hasService('SummaryViewDataManager')) {
                Sage.Services.removeService('SummaryViewDataManager');
            }
            Sage.Services.addService('SummaryViewDataManager', this.dataManager);
        }
    });
    return schedulesSDataSummaryFormatterScope;
});