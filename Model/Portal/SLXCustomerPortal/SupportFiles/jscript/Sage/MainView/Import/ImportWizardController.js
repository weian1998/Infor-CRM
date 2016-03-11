/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/string',
    'dojo/_base/array',
    'Sage/MainView/Import/_WizardDialogBase',
    'Sage/MainView/Import/ImportManagerUtility',
    'Sage/MainView/Import/SelectFile',
    'Sage/MainView/Import/DefineDelimiter',
    'Sage/MainView/Import/MapFields',
    'Sage/MainView/Import/ManageImportOptions',
    'Sage/MainView/Import/AddActions',
    'Sage/MainView/Import/Review',
    'dojo/topic'
],
function (
    declare,
    dojoString,
    dojoArray,
    wizardDialogBase,
    importManagerUtility,
    selectFile,
    defineDelimiter,
    mapFields,
    manageImportOptions,
    addActions,
    review,
    topic
) {
    var importWizard = declare('Sage.MainView.Import.ImportWizardController', [wizardDialogBase], {
        wizardOptions: null,
        /**
        * @param {Array} [options.wizardOptions] - Collection of ImportWizardStep as defined for the import wizard
        * @param {Array} [options.wizardOptions.hiddenSteps] - A collection of hidden steps. Allows customizing the flow of the import wizard. 
            Must be a collection of valid ImportWizardStep value.
        * @param {Array} [importOptions] - Collection of attributes required to run an import job
            isInitialized - Flag indicating that the uploaded file import options have been initialized.
            importEntity - The name of the entity for which this job is based on.
            attachmentId - The attachment id of the uploaded file.
            importTemplateId - The import template id used to load the import options.
            sourceModel - The source model for the uploaded file.
            sourceColumns - The source columns for the uploaded file.
            groupSettings - The group settings contains either an existing ad hoc group id or a name to be used to create a new ad hoc group. 
                            The ad hoc group is then used to associate new records to.
            defaultOwnerId - The owner id to association the primary import entity to.
            matchOptions - Collection of entities which are enabled to be matched on. This is driven by enabling/disabling an entities 'Can Match'
                            attribute in the application architect. If an entity is enabled those properties of the entity which are marked
                            as 'Can Match' will be available for matching.
            targetList - Contains a list of available properties which are marked as 'Can Import' as defined in the application architect for each
                         entity and its related properties.
            mappings - The list of source and target mappings as identified in the UI or as 'default mappings', which are then used to import the data.
        */
        constructor: function (entity, entityType) {
            this._initializeImportOptions(entity, entityType);
            this.wizardOptions = this.wizardOptions ? this.wizardOptions : this._getDefaultWizardOptions();
            this.subscriptions.push(topic.subscribe("/importController/importWizard/nextStep", dojo.hitch(this, function (currentStep) { this._nextStep(currentStep); })));
            this.subscriptions.push(topic.subscribe("/importController/importWizard/previousStep", dojo.hitch(this, function (currentStep) { this._previousStep(currentStep); })));
            this.subscriptions.push(topic.subscribe("/importController/importWizard/cancel", dojo.hitch(this, function () { this._cancel(); })));
        },
        startWizard: function () {
            this._goToStep(importManagerUtility.importWizardStep.SelectFile, null);
        },
        _initializeImportOptions: function (entity, entityType) {
            this.importOptions.isInitialized = false;
            this.importOptions.importEntity = entity;
            this.importOptions.importEntityType = entityType;
            this.importOptions.attachmentId = null;
            this.importOptions.importTemplateId = null;
            this.importOptions.sourceModel = null;
            this.importOptions.sourceColumns = null;
            this._assignDefaultAdHocGroupName();
            this.importOptions.metaDataObject = null;
            this.importOptions.defaultOwnerId = null;
            this.importOptions.matchOptions = null;
            this.importOptions.targetList = null;
            this.importOptions.engineOptions = null;
            this.importOptions.mappings = null;
        },
        _assignDefaultAdHocGroupName: function () {
            this.importOptions.groupSettings = {};
            this.importOptions.groupSettings.id = null;
            this.importOptions.groupSettings.name = null;
            var clientContextSvc = Sage.Services.getService('ClientContextService');
            
            if (clientContextSvc) {
                var user = clientContextSvc.containsKey("userPrettyName") ? clientContextSvc.getValue("userPrettyName") : "";
                var dateFormat = clientContextSvc.containsKey("userDateFmtStr") ? clientContextSvc.getValue("userDateFmtStr") : "yyyy_MM_dd_hhmm";
                var dateStamp = dojo.date.locale.format(new Date(), { datePattern: dojoString.substitute("${0} h:mm:ss", [dateFormat]) });
                this.importOptions.groupSettings.name = dojoString.substitute(this.defaultAdHoc_Caption, [dateStamp, user]);
            }
        },
        //----------------------------------------
        //Subscription listeners
        //----------------------------------------
        _nextStep: function (currentStep) {
            var nextStep = this._getNextStep(currentStep);
            this._goToStep(nextStep);
        },
        _previousStep: function (currentStep) {
            var previousStep = this._getPreviousStep(currentStep);
            this._goToStep(previousStep);
        },
        _cancel: function () {
            //Give some time for dialogs to finish hide animation before initiating destroy process.
            //See http://mail.dojotoolkit.org/pipermail/dojo-interest/2010-February/043090.html
            setTimeout(dojo.hitch(this, function () { this._destroyObjects(); }), dijit.defaultDuration + 100);
        },
        _getDefaultWizardOptions: function () {
            return {
                hiddenSteps: [importManagerUtility.importWizardStep.AddActions]
            };
        },
        //----------------------------------------
        //Wizard workflow
        //----------------------------------------
        _isStepVisible: function (step) {
            var visible = true;
            //If we have a custom list of hidden steps, check whether this step is hidden
            if (this.wizardOptions && this.wizardOptions.hiddenSteps) {
                dojoArray.some(this.wizardOptions.hiddenSteps, function (hiddenStep, i) {
                    if (step === hiddenStep) {
                        visible = false;
                        return true; //this is to break dojo.some
                    }
                });
            }
            if (!visible) {
                //We don't need to keep on processing
                return false;
            }
            return true;
        },
        _getNextStep: function (currentStep) {
            for (var step in importManagerUtility.importWizardStep) {
                var stepValue = importManagerUtility.importWizardStep[step];
                if (stepValue > currentStep && this._isStepVisible(stepValue)) {
                    return stepValue;
                }
            }
            return null;
        },
        _getPreviousStep: function (currentStep) {
            var stepsInReverseOrder = [];
            for (var step in importManagerUtility.importWizardStep) {
                stepsInReverseOrder.unshift(importManagerUtility.importWizardStep[step]);
            }
            var previousStep = null;
            dojoArray.some(stepsInReverseOrder, dojo.hitch(this, function (stepValue) {
                if (stepValue < currentStep && this._isStepVisible(stepValue)) {
                    previousStep = stepValue;
                    return true;
                }
            }));
            return previousStep;
        },
        _goToStep: function (step) {
            var nextStep = this._getNextStep(step);
            var isLastStep = (nextStep === null || nextStep === importManagerUtility.importWizardStep.Review);
            var previousStep = this._getPreviousStep(step);
            var isFirstStep = (previousStep === null || previousStep === importManagerUtility.importWizardStep.ImportFile);
            var options =  { isLastStep: isLastStep, isFirstStep: isFirstStep, currentStep: null };
            var dialog;
            switch (step) {
                case importManagerUtility.importWizardStep.SelectFile:
                    dialog = dijit.byId("dlgSelectFile");
                    if (!dialog) {
                        options.currentStep = importManagerUtility.importWizardStep.SelectFile;
                        dialog = new selectFile(options);
                        dialog.startup();
                    }
                    dialog.show();
                    break;
                case importManagerUtility.importWizardStep.DefineDelimiter:
                    dialog = dijit.byId("dlgDefineDelimiter");
                    if (!dialog) {
                        options.currentStep = importManagerUtility.importWizardStep.DefineDelimiter;
                        dialog = new defineDelimiter(options);
                    }
                    dialog.show();
                    break;
                case importManagerUtility.importWizardStep.MapFields:
                    dialog = dijit.byId("dlgMapFields");
                    if (!dialog) {
                        options.currentStep = importManagerUtility.importWizardStep.MapFields;
                        dialog = new mapFields(options);
                        dialog.startup();
                    }
                    dialog.show();
                    break;
                case importManagerUtility.importWizardStep.ManageImportOptions:
                    dialog = dijit.byId("dlgManageImportOptions");
                    if (!dialog) {
                        options.currentStep = importManagerUtility.importWizardStep.ManageImportOptions;
                        dialog = new manageImportOptions(options);
                        dialog.startup();
                    }
                    dialog.show();
                    break;
                case importManagerUtility.importWizardStep.AddActions:
                    dialog = dijit.byId("dlgAddActions");
                    if (!dialog) {
                        options.currentStep = importManagerUtility.importWizardStep.AddActions;
                        dialog = new addActions(options);
                        dialog.startup();
                    }
                    dialog.show();
                    break;
                case importManagerUtility.importWizardStep.Review:
                    dialog = dijit.byId("dlgReview");
                    if (!dialog) {
                        options.currentStep = importManagerUtility.importWizardStep.Review;
                        dialog = new review(options);
                    }
                    dialog.show();
                    break;
            }
        }
    });
    return importWizard;
});