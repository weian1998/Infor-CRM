/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/topic',
    'dojo/store/Memory',
    'dojo/data/ObjectStore',
    'dojo/data/ItemFileWriteStore',
    'dojo/text!./templates/CrystalReportConditionsDialog.html',
    'dojo/i18n!./nls/CrystalReportConditionsDialog',
    'Sage/Reporting/Enumerations',
    'Sage/MainView/ReportMgr/ReportManagerUtility',
    'Sage/MainView/ReportMgr/Crystal/CrystalReportsUtility',
    'Sage/MainView/ReportMgr/Crystal/CrystalReportConditionEditor',
    'Sage/MainView/ReportMgr/Common/_WizardDialogBase',
    'Sage/MainView/ReportMgr/Crystal/CrystalReportsFormatter',
    'dijit/Dialog',
    'dijit/form/Form',
    'Sage/Utility'
],
function (
    declare,
    dojoArray,
    topic,
    Memory,
    ObjectStore,
    ItemFileWriteStore,
    template,
    nlsResources,
    Enumerations,
    ReportManagerUtility,
    CrystalReportsUtility,
    CrystalReportConditionEditor,
    _WizardDialogBase,
    CrystalReportsFormatter,
    Dialog,
    Form,
    Utility
) {

    var __widgetTemplate = Utility.makeTemplateFromString(template);

    var crystalReportConditionsDialog = declare('Sage.MainView.ReportMgr.Crystal.CrystalReportConditionsDialog', [_WizardDialogBase], {
        id: 'dlgCrystalReportConditions',
        widgetTemplate: __widgetTemplate,
        _nlsResources: nlsResources,
        _helpIconTopic: 'RptscheduleWiz',
        _subscriptions: null,
        _reportFilters: null,
        _conditionOptions: null,
        _conditionsCollection: null, //used internally
        _currentStep: Enumerations.CrystalReportWizardStep.Conditions,
        /**
        * CrystalReportConditionsDialog class constructor.
        * @constructor
        */
        constructor: function (options) {
            this._subscriptions = [];
            this._conditionsCollection = [];
            this._initializeWizardOptions(options);
            this._conditionOptions = options.conditionOptions;
            if (!this._conditionOptions.conditionsConnector) {
                this._conditionOptions.conditionsConnector = Enumerations.ReportConditionConnector.And;
            }

            //Populate conditions passed as parameter
            var self = this;
            if (this._conditionOptions.conditions) {
                dojoArray.forEach(this._conditionOptions.conditions, function (condition, i) {
                    self._addNewCondition(condition);
                });
            }

            //Clone the original reportFilters collection, as we will add items for current user, current entity, current group presets
            this._reportFilters = dojo.clone(this._reportMetadata.reportFilters);

            this._subscriptions.push(topic.subscribe("/reportManager/reportWizard/createCondition", function (condition) { self._addNewCondition(condition); }));
            this._subscriptions.push(topic.subscribe("/reportManager/reportWizard/updateCondition", function (condition) { self._updateCondition(condition); }));
        },
        destroy: function () {
            //console.log("CrystalReportConditionsDialog destroy");
            this.grdCrystalConditions.destroy();
            //Disconnect subscriptions
            dojoArray.forEach(this._subscriptions, function (handle, i) {
                handle.remove();
            });
            this._dialog.destroyRecursive();
            //Let the base class do its thing
            this.inherited(arguments);
        },
        /**
        * This is a last method in the initialization process. 
        * It is called after all the child widgets are rendered so it's good for a container widget to finish it's post rendering here. 
        * This is where the container widgets could for example set sizes of their children relative to it's own size.
        */
        startup: function () {

            this.inherited(arguments);
            this._initializeConditionsGrid();
            this._initializeConditionPresets();

            //If the conditions collection is already populated at the time of startup,
            //select the "custom" conditions preset, which in turn shows the conditions grid.
            if (this._conditionOptions.conditions.length > 0) {
                this.cmbConditionPresets.attr('value', Enumerations.ConditionPreset.Custom);
            }

            //Set default connector
            if (this._conditionOptions.conditionsConnector) {
                this.cmbConnector.attr('value', this._conditionOptions.conditionsConnector);
            }
        },

        //------------------------------------------------
        //Events.
        //------------------------------------------------

        _btnAddCondition_Click: function () {
            var conditionEditor = new CrystalReportConditionEditor(null, this._reportMetadata);
            conditionEditor.show();
        },

        _cmbConditionPresets_OnChange: function (value) {
            var selectedPreset = this._getSelectedPreset();
            this._setConditionsVisibility(selectedPreset);
            this._showPreset(selectedPreset);
        },

        //------------------------------------------------
        //Subscription listeners
        //------------------------------------------------

        _addNewCondition: function (condition) {
            console.log("_addNewCondition");
            console.dir(condition);
            condition._id = this._getConditionId(); //the _id property is required as dojo datastores need a unique identifier            
            this._conditionsCollection.push(condition);
            this._refreshConditionsGrid();
        },

        _updateCondition: function (condition) {
            //console.log("_updateCondition");
            var self = this;
            //Find condition in _conditionsCollection array, update the object
            dojoArray.some(this._conditionsCollection, function (entry, i) {
                if (entry._id === condition._id) {
                    self._conditionsCollection[i] = condition;
                    return true;
                }
            });
            this._refreshConditionsGrid();
        },

        //------------------------------------------------
        //Initialization functions.
        //------------------------------------------------

        _initializeConditionPresets: function () {

            //console.log("CrystalReportConditionsDialog._initializeConditionPresets");
            var items = [
                {
                    value: Enumerations.ConditionPreset.AllRecords,
                    caption: nlsResources.txtAllRecords,
                    tag: Enumerations.ConditionPreset.AllRecords
                },
                {
                    value: Enumerations.ConditionPreset.Custom,
                    caption: nlsResources.txtSpecificConditions,
                    tag: Enumerations.ConditionPreset.Custom
                }
            ];

            var conditionPreset = null;

            //Current user condition
            var condition = CrystalReportsUtility.getCurrentUserCondition();
            if (condition && this._reportMetadata.useUserFilter) {
                conditionPreset = {
                    name: nlsResources.txtCurrentUser,
                    id: Enumerations.ConditionPreset.CurrentUser,
                    filterConditions: [condition]
                };
                this._reportFilters.unshift(conditionPreset);//insert at the beginning
            }

            //Current entity condition
            condition = CrystalReportsUtility.getCurrentEntityCondition();
            if (condition) {
                var entityContext = ReportManagerUtility.getCurrentEntityContext();
                conditionPreset = {
                    name: "[" + entityContext.Description + "]",
                    id: Enumerations.ConditionPreset.CurrentEntity,
                    filterConditions: [condition]
                };
                this._reportFilters.unshift(conditionPreset);//insert at the beginning
            }

            //Prepare items array
            dojoArray.forEach(this._reportFilters, function (conditionPreset, i) {
                items.push(
                    {
                        value: conditionPreset.id,
                        caption: conditionPreset.name,
                        tag: Enumerations.ConditionPreset.Preset
                    }
                );
            });
            var data = {
                identifier: 'value',
                label: 'caption',
                items: items
            };
            var store = new ItemFileWriteStore({ data: data });
            this.cmbConditionPresets.setStore(store);
            this.cmbConditionPresets.startup();
        },

        _initializeConditionsGrid: function () {
            //console.log("CrystalReportConditionsDialog._initializeConditionsGrid");
            var data = {
                identifier: "_id",
                items: this._conditionsCollection
            };
            var store = new ObjectStore({ objectStore: new Memory({ data: data }) });
            this.grdCrystalConditions.setStore(store);
        },


        //------------------------------------------------
        //Internal functions.
        //------------------------------------------------

        _getDialogTitle: function () {
            return this._nlsResources.txtDialogTitle + " [" + this._reportMetadata.displayName + "]";
        },

        _getWizardStepResult: function () {
            this._conditionOptions.conditions = this._getConditions();
            this._conditionOptions.conditionsConnector = this.cmbConnector.value;
            return this._conditionOptions;
        },

        _setConditionsVisibility: function (selectedPreset) {
            ReportManagerUtility.setDomNodeVisible(this.trConnector, false);
            ReportManagerUtility.setDomNodeVisible(this.tbConditions.domNode, false);
            ReportManagerUtility.setDomNodeVisible(this.grdCrystalConditions.domNode, false);
            switch (selectedPreset.tag) {
                case Enumerations.ConditionPreset.Preset:
                case Enumerations.ConditionPreset.Custom:
                    ReportManagerUtility.setDomNodeVisible(this.trConnector, true);
                    ReportManagerUtility.setDomNodeVisible(this.tbConditions.domNode, true);
                    ReportManagerUtility.setDomNodeVisible(this.grdCrystalConditions.domNode, true);
                    this.grdCrystalConditions.resize();
                    break;
            }
        },

        //------------------------------------------------
        //Presets (AKA ReportFilters) management
        //------------------------------------------------
        _getSelectedPreset: function () {
            var item = this.cmbConditionPresets.store._getItemByIdentity(this.cmbConditionPresets.value);
            var selectedPreset = {
                value: item ? this.cmbConditionPresets.store.getValue(item, "value") : null,
                tag: item ? this.cmbConditionPresets.store.getValue(item, "tag") : null
            };
            return selectedPreset;
        },

        /**
        * Looks for the specified preset in the report metadata, and loads its conditions in the UI.
        */
        _showPreset: function (selectedPreset) {

            //console.dir(selectedPreset);

            switch (selectedPreset.tag) {
                case Enumerations.ConditionPreset.Preset:
                    var self = this;
                    //Look for the selected preset
                    dojoArray.some(this._reportFilters, function (conditionsPreset, i) {
                        if (conditionsPreset.id === selectedPreset.value) {
                            //Once the preset has been found, load its conditions and set the connector
                            self._conditionsCollection = [];
                            dojoArray.forEach(conditionsPreset.filterConditions, function (condition, i) {
                                self._addNewCondition(condition);
                            });
                            if (conditionsPreset.conditionsConnector) {
                                self._conditionOptions.conditionsConnector = conditionsPreset.conditionsConnector;
                                self.cmbConnector.attr('value', self._conditionOptions.conditionsConnector);
                            }
                            return true;
                        }
                    });
                    break;//Needed to avoid JSHint validation error
                case Enumerations.ConditionPreset.CurrentRecord:
                    break;//Needed to avoid JSHint validation error
                case Enumerations.ConditionPreset.CurrentGroup:
                    break;//Needed to avoid JSHint validation error
                case Enumerations.ConditionPreset.Custom:
                    break;//Needed to avoid JSHint validation error
                default:
                    break;
            }
        },


        //------------------------------------------------
        //Conditions management
        //------------------------------------------------
        /**
        * Returns the collection of conditions as configured by the user.
        */
        _getConditions: function () {
            var selectedPreset = this._getSelectedPreset();
            var conditions = [];
            switch (selectedPreset.tag) {
                case Enumerations.ConditionPreset.Custom:
                case Enumerations.ConditionPreset.Preset:
                    for (var i = 0; i < this._conditionsCollection.length; i++) {
                        var clonedCondition = dojo.clone(this._conditionsCollection[i]);
                        delete clonedCondition._id; //Remove the _id property, since it is only used for the dojo datastore, but is not required for the server call
                        conditions.push(clonedCondition);
                    }
                    break;
            }
            return conditions;
        },
        _getConditionId: function () {
            var maxId = 0;
            for (var i = 0; i < this._conditionsCollection.length; i++) {
                if (maxId < this._conditionsCollection[i]._id) {
                    maxId = this._conditionsCollection[i]._id;
                }
            }
            return maxId + 1;
        },
        _refreshConditionsGrid: function () {
            if (this.grdCrystalConditions) {
                this.grdCrystalConditions.store.close();
                this._initializeConditionsGrid();
            }
        },
        _editCondition: function (rowIndex) {
            var condition = this.grdCrystalConditions.getItem(rowIndex);
            var conditionEditor = new CrystalReportConditionEditor(condition, this._reportMetadata);
            conditionEditor.show();
        },
        _deleteCondition: function (id) {
            var index = -1;
            //Find condition in _conditions array
            dojoArray.some(this._conditionsCollection, function (condition, i) {
                if (condition._id === id) {
                    index = i;
                    return true;
                }
            });
            //Remove condition from _conditions array
            if (index !== -1) {
                this._conditionsCollection.splice(index, 1);
            }
            this._refreshConditionsGrid();
        }
    });
    return crystalReportConditionsDialog;
});