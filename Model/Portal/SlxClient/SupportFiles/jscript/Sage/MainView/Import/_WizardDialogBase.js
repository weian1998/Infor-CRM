/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/topic',
    'dojo/_base/lang',
    'dojo/store/Memory',
    'dijit/_Widget',
    'Sage/_Templated',
    'Sage/MainView/Import/ImportManagerUtility',
    'dojo/i18n!./nls/_WizardDialogBase',
    'Sage/UI/Controls/_DialogHelpIconMixin',
    'dijit/form/FilteringSelect'
],
function (
    declare,
    dojoArray,
    topic,
    dojoLang,
    memory,
    widget,
    templated,
    importManagerUtility,
    nlsResources,
    dialogHelpIconMixin,
    filteringSelect
) {
    var wizardDialogBase = declare('Sage.MainView.Import._WizardDialogBase', [widget, templated], {
        _dialog: null,
        _currentStep: null,
        _isFirstStep: false,
        _isLastStep: false,
        _helpIconTopic: "ImportingRecords",
        widgetsInTemplate: true,
        subscriptions: [],
        importOptions: [],
        lookupTypeField: "LookupField",
        _dialogIds: ["dlgSelectFile", "dlgDefineDelimiter", "dlgMapFields", "dlgManageImportOptions", "dlgAddActions", "dlgReview", "dlgManageImportTemplate"], //This collection is used in _destroyObjects
        constructor: function () {
            this.subscriptions = [];
            dojo.mixin(this, nlsResources);
        },
        show: function () {
            this._dialog.show();
            if (this._helpIconTopic) {
                if (!this._dialog.helpIcon) {
                    dojoLang.mixin(this._dialog, new dialogHelpIconMixin());
                    this._dialog.createHelpIconByTopic(this._helpIconTopic);
                    this._dialog.helpIcon.tabIndex = "-1";
                }
            }
        },
        /**
        * This is a last method in the initialization process. 
        * It is called after all the child widgets are rendered so it's good for a container widget to finish it's post rendering here. 
        * This is where the container widgets could for example set sizes of their children relative to it's own size.
        */
        startup: function () {
            this.inherited(arguments);
            this._initializeWizardButtons();
        },
        /**
        * Default implementation of isValid function. Do not remove, required by classes that inherit from _WizardDialogBase.
        */
        isValid: function () {
            return true;
        },
        _initializeTemplates: function (data) {
            var templates = new filteringSelect({
                store: new memory({ data: data, idProperty: "$key" }),
                maxHeight: 150,
                searchAttr: "$descriptor",
                labelAttr: "$descriptor",
                placeHolder: this.selectOption_Caption,
                required: false
            });
            if (this.importOptions.importTemplateId) {
                templates.attr('value', this.importOptions.importTemplateId);
            }
            return templates;
        },
        getConfigurationOptions: function () {
            return this._commonConfigurationOptions();
        },
        getTemplateConfigurationOptions: function (isNew) {
            var options = this._commonConfigurationOptions();
            if (!isNew) {
                options.importTemplateId = this.importOptions.importTemplateId;
            }
            options.templateName = this.importOptions.templateName;
            options.isNew = isNew;
            return options;
        },
        _commonConfigurationOptions: function () {
            return {
                importEntity: this.importOptions.importEntity,
                importEntityType: this.importOptions.importEntityType,
                defaultOwnerId: this.importOptions.defaultOwnerId,
                mappings: this.importOptions.mappings,
                groupSettings: this.importOptions.groupSettings,
                metaDataObject: this.importOptions.metaDataObject,
                sourceModel: this.importOptions.sourceModel,
                sourceColumns: this.importOptions.sourceColumns,
                targetColumns: this.importOptions.targetList ? this.importOptions.targetList.data : this.importOptions.targetList,
                matchOptions: this.importOptions.matchOptions,
                engineOptions: this.importOptions.engineOptions,
                importTemplateId: this.importOptions.importTemplateId,
                attachmentId: this.importOptions.attachmentId
            };
        },
        getTargetProperty: function(targetItem, targetProperty, searchProperty, searchValue) {
            var target = {
                dataType: targetItem.dataType,
                displayName: targetItem.displayName,
                value: targetItem.value,
                name: targetProperty,
                required: targetItem.required,
                fieldType: targetItem.fieldType,
                entityDisplayName: targetItem.entityDisplayName,
                maxLength: targetItem.maxLength
            };
            if (targetItem.fieldType.indexOf(this.lookupTypeField) > 0) {
                target.entityName = targetItem.entityName;
                target.searchProperty = searchProperty ? searchProperty : null;
                target.searchValue = searchValue ? searchValue : null;
                target.entityDisplayName = targetItem.entityDisplayName;
            }
            return target;
        },
        saveImportJobTemplate: function (importOptions) {
            var requestOptions = {
                importTemplateId: importOptions.importTemplateId,
                entry: {
                    "$name": "SaveImportJobTemplate",
                    "request": {
                        "ImportTemplateId": importOptions.importTemplateId,
                        "templateOptions": Sys.Serialization.JavaScriptSerializer.serialize(importOptions)
                    }
                },
                businessRuleMethod: "SaveImportJobTemplate",
                onSuccess: dojo.hitch(this, function (importTemplateId) {
                    if (importOptions.isNew) {
                        this.importOptions.importTemplateId = importTemplateId;
                        topic.publish("/importController/importWizard/savedImportTemplate", importTemplateId);
                    }
                }),
                onFailure: function (result) {
                    if (importOptions.onFailure) {
                        importOptions.onFailure(result);
                    }
                    console.log(result);
                }
            };
            importManagerUtility.importRuleRequest(requestOptions, "importTemplates");
        },
        //------------------------------------------------
        //Events.
        //------------------------------------------------
        /**
        * Triggered when the user clicks on the "x" button to close the dialog.
        */
        _dialog_OnCancel: function () {
            this._btnCancel_OnClick();
        },
        _btnBack_OnClick: function () {
            this._checkCurrentStep();
            this._dialog.hide();
            topic.publish("/importController/importWizard/previousStep", this._currentStep);
        },
        _btnNext_OnClick: function () {
            //Do not remove validation below. Required for triggering validation of the current wizard dialog page.
            if (this.isValid()) {
                this._checkCurrentStep();
                this._dialog.hide();
                topic.publish("/importController/importWizard/nextStep", this._currentStep);
            }
        },
        _btnCancel_OnClick: function () {
            this._checkCurrentStep();
            this._dialog.hide();
            topic.publish("/importController/importWizard/cancel", null);
        },
        _initializeWizardButtons: function () {
            if (this._isFirstStep) {
                importManagerUtility.setDomNodeVisible(this.btnBack.domNode, false);
            }
            if (this._isLastStep) {
                this.btnNext.setLabel(nlsResources.txtFinish);
            }
        },
        _checkCurrentStep: function () {
            if (this._currentStep === null) {
                console.error("_currentStep has not been defined");
            }
        },
        finishWizard: function () {
            this._destroyObjects();
        },
        _destroyObjects: function () {
            //Destroy hidden dialogs
            dojoArray.forEach(this._dialogIds, function (dialogId) {
                var dialog = dijit.byId(dialogId);
                if (dialog) {
                    dialog.destroyRecursive();
                }
            });
            //Remove suscriptions
            dojoArray.forEach(this.subscriptions, function (handle) {
                handle.remove();
            });
        }
    });
    return wizardDialogBase;
});