/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/UI/Dialogs',
    'dojo/i18n!./nls/_BaseTaskPaneTasklet',
    'dojo/_base/declare'
],
function (Dialogs, i18nStrings, declare) {
    var _baseTaskPaneTasklet = declare('Sage.TaskPane._BaseTaskPaneTasklet', null, {
        currentEntityId: '',
        currentEntityTableName: '',
        currentEntityType: '',
        contextService: null,
        selectedRecordActionCallback: '',
        selectionContainer: '_hfSelections',

        constructor: function (args) {
            dojo.mixin(this, args);
            dojo.mixin(this, i18nStrings);
        },
        getSelectionInfo: function () {
            try {
                var selectionInfo = Sage.Utility.getSelectionInfo();
                if (!selectionInfo) {
                    //To support entity detail mode 
                    //Set the current entityId and form a selectionInfo object with current entity
                    this.getCurrentEntity();
                    if (this.currentEntityId) {
                        selectionInfo = {};
                        selectionInfo.key = this.currentEntityId;
                        selectionInfo.mode = "selection";
                        selectionInfo.ranges = [];
                        selectionInfo.recordCount = 1;
                        selectionInfo.selectedIds = [];
                        selectionInfo.selectedIds.push(this.currentEntityId);
                        selectionInfo.selectionCount = 1;
                        selectionInfo.selections = [];

                        var obj = {};
                        obj.id = this.currentEntityId;
                        obj.rn = 0;

                        selectionInfo.selections.push(obj);
                    }
                }
                return selectionInfo;
            }
            catch (e) {
                Dialogs.alert(this.errorNoData);
                return null;
            }
        },
        //Allows the selected records to be processed before the code-behind action called from javascript.  In the case
        //of CopyProfile, the ItemCommand server-side event is also called when the user clicks on the CopyProfile link.  That is 
        //where the CopyProfile dialog is prepared and launched.
        prepareSelectedRecords: function (callback) {
            //store the passed-in callback method in a variable so that it can be accessed by other methods.
            //this was done because ExtJs only has an asynchronous confirm dialog so we needed a way to
            //have a callback method (from the confirm prompt) call another callback method.  The confirm
            //dialog callback only takes a single parameter that is the user's button selection on the dialog.
            this.selectedRecordActionCallback = callback;
            var self = this;
            try {
                this.selectionInfo = this.getSelectionInfo();
            }
            catch (e) {
                Dialogs.showInfo(this.errorNoData);
            }

            if (this.selectionInfo.selectionCount === 0 && this.selectionInfo.recordCount > 0) {
                var dialogBody = dojo.string.substitute(this.noRecordsSelectedProcessAll, [this.selectionInfo.recordCount]);
                Dialogs.raiseQueryDialog(
                    this.salesLogixPageTitle,
                    dialogBody,
                    function (result) {
                        self.storeAllSelectionsOrCancel(result, self.selectionInfo);
                    },
                    this.yesButtonText,
                    this.noButtonText
                );
            }
            else {
                if (this.selectionInfo.recordCount > 0) {
                    this.saveSelections(this.selectedRecordActionCallback, this.selectionInfo);
                } else {
                    Dialogs.showInfo(this.errorNoData);
                }
            }
        },
        storeAllSelectionsOrCancel: function (agree, selectionInfo) {
            if (agree) {
                selectionInfo.mode = "selectAll";
                this.saveSelections(this.selectedRecordActionCallback, selectionInfo);
            }
            else {
                var selections = dojo.byId([this.clientId, this.selectionContainer].join(''));
                if (selections) {
                    selections.value = "cancel";
                }
            }
        },
        saveSelections: function (callback, selectionInfo) {
            if (selectionInfo !== null) {
                var svc = Sage.Services.getService("SelectionContextService");
                svc.setSelectionContext(selectionInfo.key, selectionInfo, callback);
                var selections = dojo.byId([this.clientId, this.selectionContainer].join(''));
                if (selections) {
                    selections.value = selectionInfo.key;
                }
            }
        },
        verifySelection: function (selectionInfo) {
            if (selectionInfo !== null) {
                return (selectionInfo.selectionCount !== 0);
            }
            return false;
        },
        verifySingleSelection: function (selectionInfo) {
            if (selectionInfo !== null) {
                return (selectionInfo.selectionCount === 1);
            }
            return false;
        },
        getCurrentEntity: function () {
            if (Sage.Services.hasService("ClientEntityContext")) {
                this.contextService = Sage.Services.getService("ClientEntityContext");
                this.context = this.contextService.getContext();
                this.currentEntityId = this.context.EntityId;
                this.currentEntityType = this.context.EntityType;
                this.currentEntityTableName = this.context.EntityTableName;
                var entity = this.currentEntityType.split("Sage.Entity.Interfaces.I");
                if (entity) {
                    this.currentEntityPrettyName = entity[1];
                }
            }
        },
        setSelectionCount: function () {
            try {
                var panel = dijit.byId('list');
                if (panel) {
                    dojo.byId("selectionCount").text(panel.getTotalSelectionCount());
                }
            }
            catch (e) {
            }
        },
        getSelectionCount: function () {
            return Sage.Services.getService("ClientGroupContext").getContext().CurrentGroupCount;
        },
        getCurrentGroupId: function() {
            var grpContextSvc = Sage.Services.getService('ClientGroupContext');
            if (grpContextSvc) {
                var contextService = grpContextSvc.getContext();
                return contextService.CurrentGroupID;
            }
            return '';
        },
        getCurrentGroupName: function () {
            var grpContextSvc = Sage.Services.getService('ClientGroupContext');
            if (grpContextSvc) {
                var contextService = grpContextSvc.getContext();
                return contextService.CurrentDisplayName;
            }
            return '';
        },
        getDefaultGroupId: function () {
            var grpContextSvc = Sage.Services.getService('ClientGroupContext');
            if (grpContextSvc) {
                var contextService = grpContextSvc.getContext();
                return contextService.DefaultGroupID;
            }
            return '';
        }
    });
    return _baseTaskPaneTasklet;
});
