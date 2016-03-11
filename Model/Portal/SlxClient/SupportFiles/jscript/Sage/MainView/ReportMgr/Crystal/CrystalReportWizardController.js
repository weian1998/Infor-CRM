/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/i18n!./nls/CrystalReportWizardController',
    'Sage/Reporting/Enumerations',
    'Sage/MainView/ReportMgr/Crystal/CrystalReportParametersDialog',
    'Sage/MainView/ReportMgr/Crystal/CrystalReportConditionsDialog',
    'Sage/MainView/ReportMgr/Common/ExportOptionsDialog',
    'Sage/MainView/ReportMgr/ReportManagerUtility',
    'Sage/UI/Dialogs',
    'dojo/topic',
    'dojo/string'
],
function (
    declare,
    dojoArray,
    dojoLang,
    nlsResources,
    enumerations,
    CrystalReportParametersDialog,
    CrystalReportConditionsDialog,
    ExportOptionsDialog,
    reportManagerUtility,
    dialogs,
    topic,
    dString
) {
    //TODO: refactor common code to a suitable base class
    var crystalReportWizardController = declare('Sage.MainView.ReportMgr.CrystalReportWizardController', null, {
        _reportMetadata: null,
        wizardOptions: null,
        conditionOptions: null,
        parameterOptions: null,
        scheduleOptions: null,
        exportOptions: null,
        _mode: null,
        _nlsResources: nlsResources,
        _subscriptions: [],
        _dialogIds: ["dlgCrystalReportConditions", "dlgCrystalReportParameters", "dlgExportOptions"], //This collection is used in _destroyObjects
        /**
        * Constructor.
        * @constructor
        * @param {Object} reportMetadata - Metadata of the report to be executed.
        * @param {Object} options - Options for the constructor.        
                
        * @param {Object} [options.wizardOptions] - Options for the wizard.
        * @param {Array} [options.wizardOptions.hiddenSteps] - A collection of hidden steps. Allows customizing the flow of the wizard. Must be a collection of valid Sage.Reporting.Enumerations.CrystalReportWizardStep value.
        
        * @param {Object} [options.conditionOptions] - Condition options.
        * @param {Array} [options.conditionOptions.conditions] - Conditions to be applied to the report. Allows programmatically creating filter confitions to be applied to the record selection.
        * @param {string} [options.conditionOptions.conditionsConnector=Sage.Reporting.Enumerations.ReportConditionConnector.And] - Conditions connector. Must be a valid Sage.Reporting.Enumerations.ReportConditionConnector value.        
        * @param {string} [options.conditionOptions.recordSelectionFormula] - Allows applying a Crystal report record selection formula.        

        * @param {Object} [options.parameterOptions] - Parameter options.
        * @param {Array} [options.parameterOptions.parameters] - Parameter values. Allows programmatically setting the answer to prompt parameters.

        * @param {Object} [options.scheduleOptions] - Schedule options. Allows programmatic control on scheduling options.
        * @param {string} [options.scheduleOptions.executionType=Sage.Reporting.Enumerations.ExecutionType.OnDemand] - The type of execution. If present, must be a valid Sage.Reporting.Enumerations.ExecutionType value.
        * @param {Object} [options.scheduleOptions.trigger=null] - The trigger to be edited.
        * @param {Object} [options.exportOptions] - Export options. Allows programmatic control on export options.
        */
        constructor: function (reportMetadata, options) {
            if (!reportMetadata) {
                return;
            }
            this._reportMetadata = reportMetadata;
            //If reportFilters is null, set an empty collection to avoid runtime errors.
            if (!this._reportMetadata.reportFilters) {
                this._reportMetadata.reportFilters = [];
            }

            //Options
            this.wizardOptions = options.wizardOptions ? options.wizardOptions : this._getDefaultWizardOptions();
            this.conditionOptions = options.conditionOptions ? options.conditionOptions : this._getDefaultConditionOptions();
            this.parameterOptions = options.parameterOptions ? options.parameterOptions : this._getDefaultParameterOptions();
            this.scheduleOptions = options.scheduleOptions ? options.scheduleOptions : this._getDefaultScheduleOptions();
            this.exportOptions = options.exportOptions ? options.exportOptions : this._getDefaultExportOptions();

            var self = this;
            this._subscriptions.push(topic.subscribe("/reportManager/reportWizard/nextStep", function (currentStep, result) { self._nextStep(currentStep, result); }));
            this._subscriptions.push(topic.subscribe("/reportManager/reportWizard/previousStep", function (currentStep, result) { self._previousStep(currentStep, result); }));
            this._subscriptions.push(topic.subscribe("/reportManager/reportWizard/cancel", function (currentStep, result) { self._cancel(); }));

            this._mode = "new";
            if (this.scheduleOptions && this.scheduleOptions.trigger) {
                this._mode = "edit"; //We're editing an existing schedule.
            }
        },
        startWizard: function () {
            var errors = [];
            if (this._hasDynamicParameterErrors(errors)) {
                var error = dString.substitute(nlsResources.txtInvalidReportWithDynamicParameters, [this._reportMetadata.family, this._reportMetadata.name, errors.join(' ').trim()]);
                dialogs.showError(error, this._nlsResources.txtError);
                return;
            }
            var firstStep = this._getNextStep(enumerations.CrystalReportWizardStep.Init);
            this._goToStep(firstStep, null);
        },
        //----------------------------------------
        //Subscription listeners
        //----------------------------------------
        _nextStep: function (currentStep, result) {
            //Process current step results
            this._processCurrentStep(currentStep, result);
            //Determine next step
            var nextStep = this._getNextStep(currentStep);
            //Go to next step
            this._goToStep(nextStep);
        },
        _previousStep: function (currentStep, result) {
            //Process current step results
            this._processCurrentStep(currentStep, result);
            //Determine previous step
            var previousStep = this._getPreviousStep(currentStep);
            this._goToStep(previousStep);
        },
        _cancel: function () {
            var self = this;
            //Give some time for dialogs to finish hide animation before initiating destroy process.
            //See http://mail.dojotoolkit.org/pipermail/dojo-interest/2010-February/043090.html
            setTimeout(function () { self._destroyObjects(); }, dijit.defaultDuration + 100);
        },
        _getDefaultWizardOptions: function () {
            return {
                hiddenSteps: []
            };
        },
        _getDefaultConditionOptions: function () {
            return {
                conditions: [],
                conditionsConnector: enumerations.ReportConditionConnector.And
            };
        },
        _getDefaultParameterOptions: function () {
            return {
                parameters: []
            };
        },
        _getDefaultScheduleOptions: function () {
            return {
                executionType: enumerations.ExecutionType.OnDemand,
                trigger: null
                /*cronExpression: null,
                startTimeUtc: null,
                endTimeUtc: null,
                scheduleName: null,
                scheduleDescription: null*/
            };
        },
        _getDefaultExportOptions: function () {
            return {
                outputFormat: enumerations.ReportExportFormat.Pdf,
                runAsUserId: null
            };
        },
        //----------------------------------------
        //Wizard workflow
        //----------------------------------------
        _hasDynamicParameterErrors: function (errors) {
            dojoArray.forEach(this._reportMetadata.parameters, function(parameter, i) {
                if (parameter.isDynamic && !parameter.isOptionalPrompt) {
                    if (parameter.clientMustQueryDynamicData === true) {
                        errors.push(dString.substitute(nlsResources.txtInvalidDynamicParameterDatasource, { p: parameter }));
                    } else if (parameter.isInvalidDynamicParameter === true) {
                        if (dojoLang.isString(parameter.invalidDynamicParameterReason) && parameter.invalidDynamicParameterReason !== "") {
                            errors.push(dString.substitute(nlsResources.txtInvalidDynamicParameterReason, { p: parameter }));
                        } else {
                            errors.push(dString.substitute(nlsResources.txtInvalidDynamicParameterUnknownReason, { p: parameter }));
                        }
                    }
                }
            });
            return errors.length > 0;
        },
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

            //Check for step-specific considerations
            switch (step) {
                case enumerations.CrystalReportWizardStep.Parameters:
                    //If the report has no parameters, don't show that step
                    return !!(this._reportMetadata.parameters && this._reportMetadata.parameters.length > 0);
                case enumerations.CrystalReportWizardStep.Conditions:
                    return true;
                case enumerations.CrystalReportWizardStep.ExportOptions:
                    return true;
                default:
                    return true;
            }
        },
        _processCurrentStep: function (currentStep, result) {
            console.dir(result);
            //Process current step results
            switch (currentStep) {
                case enumerations.CrystalReportWizardStep.Conditions:
                    this.conditionOptions = result;
                    break;
                case enumerations.CrystalReportWizardStep.Parameters:
                    this.parameterOptions = result;
                    break;
                case enumerations.CrystalReportWizardStep.ExportOptions:
                    this.exportOptions = result.exportOptions;
                    this.scheduleOptions = result.scheduleOptions;
                    break;
            }
        },
        _getNextStep: function (currentStep) {
            for (var step in enumerations.CrystalReportWizardStep) {
                var stepValue = enumerations.CrystalReportWizardStep[step];
                if (stepValue > currentStep && this._isStepVisible(stepValue)) {
                    return stepValue;
                }
            }
            return null;
        },
        _getPreviousStep: function (currentStep) {
            var stepsInReverseOrder = [];
            for (var step in enumerations.CrystalReportWizardStep) {
                var stepValue = enumerations.CrystalReportWizardStep[step];
                stepsInReverseOrder.unshift(stepValue);
            }
            var self = this;
            var previousStep = null;
            dojoArray.some(stepsInReverseOrder, function (stepValue, i) {
                if (stepValue < currentStep && self._isStepVisible(stepValue)) {
                    previousStep = stepValue;
                    return true;
                }
            });
            return previousStep;
        },
        _goToStep: function (step) {
            var nextStep = this._getNextStep(step);
            var isLastStep = (nextStep === null || nextStep === enumerations.CrystalReportWizardStep.Finish);
            var previousStep = this._getPreviousStep(step);
            var isFirstStep = (previousStep === null || previousStep === enumerations.CrystalReportWizardStep.Init);
            var dialog;
            var options;
            switch (step) {
                case enumerations.CrystalReportWizardStep.Conditions:
                    dialog = dijit.byId("dlgCrystalReportConditions");
                    if (dialog) {
                        dialog.show();
                    } else {
                        options = {
                            reportMetadata: this._reportMetadata,
                            conditionOptions: this.conditionOptions,
                            isLastStep: isLastStep,
                            isFirstStep: isFirstStep
                        };
                        dialog = new CrystalReportConditionsDialog(options);
                        dialog.startup();
                        dialog.show();
                    }
                    break;
                case enumerations.CrystalReportWizardStep.Parameters:
                    dialog = dijit.byId("dlgCrystalReportParameters");
                    if (dialog) {
                        dialog.show();
                    } else {
                        options = {
                            reportMetadata: this._reportMetadata,
                            parameters: this.parameterOptions.parameters,
                            isLastStep: isLastStep,
                            isFirstStep: isFirstStep
                        };
                        dialog = new CrystalReportParametersDialog(options, this._mode);
                        dialog.startup();
                        dialog.show();
                    }
                    break;
                case enumerations.CrystalReportWizardStep.ExportOptions:
                    dialog = dijit.byId("dlgExportOptions");
                    if (dialog) {
                        dialog.show();
                    } else {
                        options = {
                            reportMetadata: this._reportMetadata,
                            isLastStep: isLastStep,
                            isFirstStep: isFirstStep,
                            scheduleOptions: this.scheduleOptions,
                            exportOptions: this.exportOptions
                        };
                        dialog = new ExportOptionsDialog(options);
                        dialog.startup();
                        dialog.show();
                    }
                    break;
                case enumerations.CrystalReportWizardStep.Finish:
                    this._finishWizard();
                    break;
            }
        },
        _finishWizard: function () {
            this._destroyObjects();
            switch (this._mode) {
                case "new":
                    switch (this.scheduleOptions.executionType) {
                        case enumerations.ExecutionType.Scheduled:
                            this._scheduleReport();
                            break;
                        case enumerations.ExecutionType.OnDemand:
                            this._runReport();
                            break;
                    }
                    break;
                case "edit":
                    this._updateSchedule();
                    break;
            }
        },
        _destroyObjects: function () {
            //Destroy hidden dialogs
            dojoArray.forEach(this._dialogIds, function (dialogId, i) {
                var dialog = dijit.byId(dialogId);
                if (dialog) {
                    dialog.destroyRecursive();
                }
            });
            //Remove suscriptions
            dojoArray.forEach(this._subscriptions, function (handle, i) {
                handle.remove();
            });
        },
        /**
        * Return an object with a collection of parameters used by the reporting job.
        * @returns {Object} - Report parameters.
        */
        _getJobParameters: function () {
            var parameters = [];

            //Report
            parameters.push({ name: "PluginFamily", value: this._reportMetadata.family });
            parameters.push({ name: "PluginName", value: this._reportMetadata.name });
            parameters.push({ name: "TemplateName", value: this._reportMetadata.displayName }); //This is required so we can show the display name of the report on the schedules listview

            //Conditions
            parameters.push({ name: "ReportConditions", value: this.conditionOptions.conditions });
            parameters.push({ name: "ConditionsConnector", value: this.conditionOptions.conditionsConnector });
            if (this.conditionOptions.recordSelectionFormula) {
                parameters.push({ name: "RecordSelectionFormula", value: this.conditionOptions.recordSelectionFormula });
            }

            //Prompts, clean up unused parameter options to reduce the size of the request
            dojoArray.forEach(this.parameterOptions.parameters, function (parameter) {
                if (parameter) {
                    parameter.defaultValues = null;
                    parameter.values = null;
                }
            });
            parameters.push({ name: "ReportParameters", value: this.parameterOptions.parameters });

            //Export options
            var scheduleName = this.exportOptions.description ? this.exportOptions.description : this._reportMetadata.displayName;
            parameters.push({ name: "ScheduleName", value: scheduleName });
            parameters.push({ name: "OutputFormat", value: this.exportOptions.outputFormat });
            if (this.exportOptions.runAsUserId) {
                parameters.push({ name: "RunAsUserId", value: this.exportOptions.runAsUserId });
            }

            return parameters;
        },
        /**
        * Return an object containing Job execution options.
        * @returns {Object} - Job execution options.
        */
        _getJobOptions: function () {
            var parameters = this._getJobParameters();
            var displayName = (dojo.isString(this.exportOptions.description) && (this.exportOptions.description !== '')) ? this.exportOptions.description : this._reportMetadata.displayName;
            var dateStamp = dojo.date.locale.format(new Date(), { selector: "date", datePattern: "yyyy_MM_dd_hhmm" });
            var user = '';
            var usr;
            if (typeof this.exportOptions.runAsUserId === 'string') {
                usr = reportManagerUtility.getUser(this.exportOptions.runAsUserId);
                if (usr) {
                    user = usr.UserName;
                }
            }
            else {
                usr = reportManagerUtility.getUser(reportManagerUtility.getCurrentUser().userID);
                if (usr) {
                    user = usr.UserName;
                }
            }

            var description = dString.substitute("${0}_${1}_${2}", [displayName, user, dateStamp]);
            var options = {
                descriptor: description,
                closable: true,
                reportType: enumerations.ReportTypes.CrystalReport,
                parameters: parameters,
                title: displayName,
                success: function (result) {
                },
                failure: function (result) {
                }
            };
            return options;
        },
        /**
        * Schedules a recurring Report.        
        */
        _scheduleReport: function () {
            var options = this._getJobOptions();
            options.cronExpression = this.scheduleOptions.cronExpression;
            options.descriptor = this.scheduleOptions.scheduleDescription;
            options.startTime = this.scheduleOptions.startTime;
            options.endTime = this.scheduleOptions.endTime;
            options.success = function () {
                dialogs.showInfo(nlsResources.txtReportSuccessfullyScheduled, nlsResources.dlgScheduleReport_Title);
            };
            var reportingService = Sage.Services.getService('ReportingService');
            reportingService.scheduleReport(options);
        },
        /**
        * Executes an on-demand report.        
        */
        _runReport: function () {
            var options = this._getJobOptions();
            var reportingService = Sage.Services.getService('ReportingService');
            reportingService.runReport(options);
        },
        _updateSchedule: function () {
            var options = this._getJobOptions();
            options.cronExpression = this.scheduleOptions.cronExpression;
            options.descriptor = this.scheduleOptions.scheduleDescription;
            options.startTime = this.scheduleOptions.startTime;
            options.endTime = this.scheduleOptions.endTime;
            options.success = function () {
                reportManagerUtility.refreshList('schedules');
                dialogs.showInfo(nlsResources.txtScheduleSuccessfullyUpdated, nlsResources.dlgScheduleReport_Title);
            };
            options.closable = true;
            options.key = this.scheduleOptions.trigger.$key;
            options.descriptor = this.scheduleOptions.scheduleDescription;
            var reportingService = Sage.Services.getService('ReportingService');
            reportingService.updateSchedule(options);
        }
    });
    return crystalReportWizardController;
});