define(['dojo/ready', 'dojo/_base/declare', 'dojo/aspect', 'dojo/_base/lang',
    'Sage/MainView/ActivityMgr/ActivityEditor', 'Sage/MainView/ActivityMgr/HistoryEditor', 'Sage/Services/ActivityService', 'Sage/UI/Controls/Lookup'],
function (ready, declare, aspect, lang,
    ActivityEditor, HistoryEditor, ActivityService, Lookup) {

    // create SalesOrder lookup (same function for activity & history editor)
    function createGroupLookup(lookupId) {
        var lookupConfig = {
            isModal: true,
            id: lookupId + '_config',
            displayMode: 'Dialog',
            structure: [{ cells: [
                    { field: 'Name', name: 'Name' },
                    { field: 'Family', name: 'Type' }
                ]
            }],
            gridOptions: {
                contextualCondition: '',
                contextualShow: '',
                selectionMode: 'single'
            },
            storeOptions: {
                resourceKind: 'GroupReleasesView',
                sort: [{ attribute: 'Name'}]
            },
            preFilters: [

            ],
            //seedProperty: 'Account.Id',
            dialogTitle: 'Group',
            dialogButtonText: 'OK'
        };
        var lueGroup = new Lookup({
            id: lookupId,  // This ID is required or Sage will not properly register the widgets
            allowClearingResult: true,
            label: 'Group',
            readonly: true,
            config: lookupConfig
        });
        lueGroup.textbox.required = false;

        this.eventConnections.push(dojo.connect(lueGroup, 'onChange', dojo.hitch(this, function (sel) {
            if (this._isBinding) { return; }

            // here we add the selected Groupid to the form's data
            var act = this._activityData || this._historyData;
            if (sel) {
                act.GroupId = sel.$key;
                act.GroupName = sel.$descriptor;
                // here we could add handling to automatically set or clear the account when they select a new sales order
            } else {
                act.GroupId = null;
                act.GroupName = null;
            }
        })));

        return lueGroup;
    }

    // helper to add lookups within a div, the reason is that the stylesheet for the activity dialog will resize immediate 
    // descendants (with class textcontrol) of the td to 90%, by adding the div we prevent that from happening
    function addLookups(container, lookups) {
        for (var i = 0; i < lookups.length; i++) {
            var lup = lookups[i];
            var div = new dijit.layout.ContentPane({ "class": "remove-padding lookup-container", label: lup.label });
            dojo.place(lup.domNode, div.domNode, "only");
            container.addChild(div);
        }
        // force restart
        container._initialized = false;
        container._started = false;
        container.startup();
    }

    // binding for the Group lookup (this is shared between activity & history editors)
    function manualBind() {
        this._isBinding = true;
        var act = this._activityData || this._historyData;
        this.my_lueGroup.set('selectedObject', act.GroupId ? { $key: act.GroupId, $descriptor: act.GroupName} : null);
        this._isBinding = false;
    }

    // create custom lookups for Group
    function createActivityLookups() {
        if (this.my_lueGroup)
            return;
        this.my_lueGroup = createGroupLookup.call(this, 'activitySssGroup_Lookup');

        addLookups(this.contactContainer, [this.my_lueGroup]);
    }

    // retrieve default context for the sales order and pass it to the callback.
    // return true if context could be obtained, false otherwise
    function getDefaultContext(scope, callback) {
        var ctxSvc = Sage.Services.getService('ClientEntityContext');
        if (!ctxSvc) return false;
        var ctx = ctxSvc.getContext();
        if (!ctx) return false;
        if (ctx.EntityType == "Sage.Entity.Interfaces.IGroup") {
            // ... maybe get the account / contact for the sales order, too?
            callback(scope, { GroupId: ctx.EntityId, GroupName: ctx.Name });
            return true;
        }
        return false;
    }

    // this is where our custom code will go  
    function initializeActivityEditor() {
        aspect.after(ActivityEditor.prototype, "_ensureLookupsCreated", createActivityLookups);
        aspect.after(ActivityEditor.prototype, "_manualBind", manualBind);

        aspect.around(ActivityService.prototype, "getActivityEntityContext", function (originalMethod) {
            return function (scope, callback) {
                return getDefaultContext(scope, callback) || originalMethod.call(this, scope, callback);
            }
        });
        aspect.around(ActivityService.prototype, "completeNewActivity", function (originalMethod) {
            return function (type, args) {
                var activityService = this;
                var showEditor = function (scope, ctx) {
                    if (ctx) {
                        lang.mixin(args, ctx);
                    }
                    originalMethod.call(activityService, type, args);
                }
                if (!getDefaultContext(activityService, showEditor))
                    showEditor();
            }
        });
    }

    return function () {
        // This is invoked when the file is initially loaded - here we'll plug our custom code
        // into the activity editor
        initializeActivityEditor();
    }
});