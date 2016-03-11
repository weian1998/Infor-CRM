/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
        'Sage/UI/SummaryContainer',
        'dojo/i18n',
        'Sage/UI/SummaryFormatterScope',
        'Sage/MainView/GroupMgr/GroupsSDataDetailViewDataManager',
        'Sage/UI/Controls/SummaryAggregate',
        'dojo/_base/declare'
    ],
    function(summaryContainer, i18n, SummaryFormatterScope, GroupsSDataDetailViewDataManager, SummaryAggregate, declare) {
        var GroupsSDataSummaryFormatterScope = declare('Sage.MainView.GroupMgr.GroupsSDataSummaryFormatterScope', [SummaryFormatterScope], {
            constructor: function (args) {
                this.inherited(arguments);
                dojo.mixin(this, args);
                this.widgets = [];
                this.preFetchResources();
                this._setupDataManager();
            },
            _setupDataManager: function() {
                this.dataManager = new GroupsSDataDetailViewDataManager(this.requestConfiguration);
                if (Sage.Services.hasService('SummaryViewDataManager')) {
                    Sage.Services.removeService('SummaryViewDataManager');
                }
                Sage.Services.addService('SummaryViewDataManager', this.dataManager);
            }
        });
        return GroupsSDataSummaryFormatterScope;
    });