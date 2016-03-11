/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/Data/SDataServiceRegistry',
    'Sage/Data/SDataStore',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'Sage/MainView/EntityMgr/EntityDetailTabManager'
],
function (sDataServiceRegistry, SDataStore, declare, lang, EntityDetailTabManager) {
    var reportsSDataDetailRequestQueue = declare('Sage.MainView.EntityMgr.ReportsSDataDetailRequestQueue', null, {
        select: [],
        resourceKind: '',
        fetching: false,
        include: [],
        service: null,
        detailTabManager: null,
        constructor: function (options) {
            lang.mixin(this, options);
            this.requestHash = {};
            this.fetching = false;
            this.service = Sage.Data.SDataServiceRegistry.getSDataService('metadata');
        },
        add: function (entityid, context) {
            var currentContext = this.requestHash[entityid];
            if ((currentContext) && (currentContext.id !== context.id)) {
                if (!currentContext.duplicates) {
                    currentContext.duplicates = [];
                }
                var found = false;
                for (var i = 0; i < currentContext.duplicates.length; i++) {
                    if (currentContext.duplicates[i].context.id === context.id) {
                        found = true;
                    }
                }
                if (!found) {
                    currentContext.duplicates.push({ id: context.id, context: context });
                }

            } else {
                this.requestHash[entityid] = context;
            }
        },
        send: function (callback, manager) {
            this.fetching = true;
            var context = this;
            var request = new Sage.SData.Client.SDataSingleResourceRequest(this.service);
            request.setResourceKind(this.resourceKind);
            for (var id in this.requestHash) {
                request.setResourceSelector("'" + id + "'");
            }
            request.setQueryArg('include', this.include.join(','));
            request.read({
                success: lang.hitch(manager, callback, context),
                failure: lang.hitch(this, this.requestFailed, context)
            });
        },
        requestFailed: function (a, b, c) {
            console.error('Request failed %o %o %o', a, b, c);
        }
    });

    var reportsSDataSummaryViewDataManager = declare('Sage.MainView.EntityMgr.EntitySDataDetailViewDataManager', null, {
        keyField: "$key",
        entity:null,
        constructor: function () {
            this.queue = new reportsSDataDetailRequestQueue();
            this.requestTimeout = false;
        },
        requestDataNoWait: function (entityid, widget, requestConfiguration) {
            if (this.entity === entityid) {
                var tabContent = dijit.byId('tabContainer');
                if (tabContent) {
                    tabContent.resize();
                }
                return;
            }
            this.entity = entityid;
            var tempQueue = new reportsSDataDetailRequestQueue();
            if (requestConfiguration.keyField) {
                this.keyField = requestConfiguration.keyField;
            }
            tempQueue.select = requestConfiguration.select;
            tempQueue.resourceKind = requestConfiguration.resourceKind;
            tempQueue.serviceName = requestConfiguration.serviceName;
            tempQueue.include = requestConfiguration.include;
            tempQueue.useBatchRequest = requestConfiguration.useBatchRequest;
            if (requestConfiguration.expandRecurrences !== null) {
                tempQueue.expandRecurrences = requestConfiguration.expandRecurrences;
            }
            tempQueue.add(entityid, widget);
            tempQueue.send(this.receiveData, this);
        },
        receiveData: function (context, data) {

            // If it already exists, then destroy it.
            if (this.detailTabManager) {
                this.detailTabManager.destroyRecursive();
            }
            // create a new Tab Manager
            var currentContext = dijit.byId('Sage_UI_SummaryDetailPane_0');
            this.detailTabManager = new EntityDetailTabManager(data);
            dojo.place(this.detailTabManager.domNode, currentContext.domNode, "only");
            //this.detailTabManager.startup();
            var tabContent = dijit.byId('tabContainer');
            if (tabContent) {
                tabContent.startup();
                tabContent.resize(); tabContent.resize();

            }
        }
    });
    return reportsSDataSummaryViewDataManager;
});