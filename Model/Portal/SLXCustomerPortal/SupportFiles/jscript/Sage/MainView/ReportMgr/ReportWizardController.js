/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/UI/Dialogs',
    'dojo/json',
    'dojo/_base/array',
    'dojo/i18n!./nls/ReportWizardController',
    'Sage/Reporting/Enumerations',
    'Sage/Utility',
    'Sage/MainView/ReportMgr/Crystal/CrystalReportWizardController'
],
function (
    Dialogs,
    dojoJson,
    dojoArray,
    nlsResources,
    enumerations,
    utility,
    CrystalReportWizardController
) {
    Sage.namespace('Sage.MainView.ReportMgr.ReportWizardController');
    dojo.mixin(Sage.MainView.ReportMgr.ReportWizardController, {
        /**
        * Initiates the report wizard.
        * @param {Object} options - Options for the function.
        * @param {string} options.reportId - The id of the report to be executed. Example: 'p6UJ9A0003V8'.
        * @param {string} options.triggerId - The id of the schedule to be edited. Example: 'fb66f331‐0a42‐4209‐a8b9‐d4acbce0da69'.
        * @param {string} options.reportDisplayName - The display name of the report to be executed. Used for setting the title of the loading dialog. Example: 'Account Details'.
        * @param {Object} [options.reportOptions] - Report-specific options. These vary depending on the report type. See the corresponding wizard controller for more info.
        */
        startWizard: function (options) {
            if (!options) {
                return;
            }
            if (options.reportId) {
                //We are launching a new execution
                this._getReportMetadata(options.reportId, options.reportOptions, options.reportDisplayName);
            }
            else {
                if (options.triggerId) {
                    //We are editing an existing schedule
                    this._getReportSchedule(options.triggerId);
                }
                else {
                    //Nothing to do.
                    return;
                }
            }
        },
        /*
        * Async load of report schedule.
        */
        _getReportSchedule: function (triggerId) {
            var self = this;
            this._showLoadingIndicator(nlsResources.txtLoadingScheduleDetails);
            var options = {
                triggerId: triggerId,
                success: function (entry) {
                    self._closeLoadingIndicator();
                    self._triggerReceived(entry);
                },
                failure: function (xhr, sdata) {
                    self._closeLoadingIndicator();
                    utility.ErrorHandler.handleHttpError(xhr, sdata);
                }
            };
            var reportingService = Sage.Services.getService('ReportingService');
            reportingService.getSchedule(options);
        },
        _triggerReceived: function (trigger) {
            //Report info
            var pluginFamily = this._getParameterValue(trigger.parameters, "PluginFamily");
            var pluginName = this._getParameterValue(trigger.parameters, "PluginName");

            //Condition options
            var conditions = this._getParameterValue(trigger.parameters, "ReportConditions");
            conditions = conditions ? "[" + conditions + "]" : "[]"; //This is required as the serialized string is not a proper array, even if it represents a collection of objects.
            conditions = dojoJson.parse(conditions);
            var conditionsConnector = this._getParameterValue(trigger.parameters, "ConditionsConnector");

            //Convert dates from string to actual javascript date objects
            dojoArray.forEach(conditions, function (condition, j) {
                if (condition.dataType === enumerations.FieldDataTypes.DateTime) {
                    //Deserialize
                    if (utility.Convert.isDateString(condition.value)) {
                        condition.value = utility.Convert.toDateFromString(condition.value);
                    }
                    if (utility.Convert.isDateString(condition.fromRange)) {
                        condition.fromRange = utility.Convert.toDateFromString(condition.fromRange);
                    }
                    if (utility.Convert.isDateString(condition.toRange)) {
                        condition.toRange = utility.Convert.toDateFromString(condition.toRange);
                    }
                }
            });

            //Parameter options
            var reportParameters = this._getParameterValue(trigger.parameters, "ReportParameters");
            reportParameters = reportParameters ? "[" + reportParameters + "]" : "[]"; //This is required as the serialized string is not a proper array, even if it represents a collection of objects.
            reportParameters = dojoJson.parse(reportParameters);

            //Export options
            var runAsUserId = this._getParameterValue(trigger.parameters, "RunAsUserId");
            var outputFormat = this._getParameterValue(trigger.parameters, "OutputFormat");

            //Schedule options
            var scheduleName = this._getParameterValue(trigger.parameters, "ScheduleName");

            //Launch wizard
            if (pluginName && pluginFamily) {
                var reportingService = Sage.Services.getService('ReportingService');
                var reportId = reportingService.getReportId(pluginFamily + ":" + pluginName);
                if (reportId) {
                    var reportOptions = {
                        scheduleOptions: {
                            executionType: enumerations.ExecutionType.Scheduled,
                            trigger: trigger
                        },
                        exportOptions: {
                            outputFormat: outputFormat,
                            runAsUserId: runAsUserId
                        },
                        conditionOptions: {
                            conditions: conditions,
                            conditionsConnector: conditionsConnector
                        },
                        parameterOptions: {
                            parameters: reportParameters
                        }
                    };
                    console.dir(reportOptions);
                    this._getReportMetadata(reportId, reportOptions);
                }
                else {
                    Dialogs.showError(nlsResources.txtCannotDetermineReportId);
                }
            } else {
                Dialogs.showError(nlsResources.txtCannotDetermineReportNameOrFamily);
            }
        },
        /**
        * Async load of Report details.
        */
        _getReportMetadata: function (reportId, reportOptions, reportDisplayName) {
            var self = this;
            var loadingIndicatorTitle = reportDisplayName ? nlsResources.txtLoading + reportDisplayName : nlsResources.txtLoadingReport;
            this._showLoadingIndicator(loadingIndicatorTitle);
            var options = {
                reportId: reportId,
                success: function (entry) {
                    self._reportMetadataReceived(entry, reportOptions);
                },
                failure: function (xhr, sdata) {
                    self._closeLoadingIndicator();
                    utility.ErrorHandler.handleHttpError(xhr, sdata);
                }
            };
            var reportingService = Sage.Services.getService('ReportingService');
            reportingService.getReportMetadata(options);
        },
        _reportMetadataReceived: function (reportMetadata, reportOptions) {
            //Convert ISO dates to actual date objects.
            //The below is required because the reports 
            //sdata feed returns ISO instead of JSON dates.
            dojoArray.forEach(reportMetadata.reportFilters, function (preset, i) {
                dojoArray.forEach(preset.filterConditions, function (condition, j) {
                    if (condition.dataType === enumerations.FieldDataTypes.DateTime) {
                        //Deserialize
                        if (utility.Convert.isDateString(condition.value)) {
                            condition.value = utility.Convert.toDateFromString(condition.value);
                        }
                        if (utility.Convert.isDateString(condition.fromRange)) {
                            condition.fromRange = utility.Convert.toDateFromString(condition.fromRange);
                        }
                        if (utility.Convert.isDateString(condition.toRange)) {
                            condition.toRange = utility.Convert.toDateFromString(condition.toRange);
                        }
                    }
                });
            });

            //If currentValues is null, initialize it to an empty collection to avoid runtime errors.
            dojoArray.forEach(reportMetadata.parameters, function (parameter, i) {
                if (!parameter.currentValues) {
                    parameter.currentValues = [];
                }
                if (reportOptions.parameterOptions) {
                    //always want to load the defaultValues from the meta data to ensure we have the latest data
                    reportOptions.parameterOptions.parameters[i].defaultValues = parameter.defaultValues;
                }
            });

            this._closeLoadingIndicator();
            var controller = this._getControllerInstance(reportMetadata, reportOptions);
            controller.startWizard();
        },
        _getControllerInstance: function (reportMetadata, reportOptions) {
            switch (reportMetadata.reportType) {
                case enumerations.ReportTypes.CrystalReport:
                    return new CrystalReportWizardController(reportMetadata, reportOptions);
            }
        },
        _showLoadingIndicator: function (title) {
            var progressDialog = dijit.byId('dlgReportLoading');
            if (progressDialog) {
                progressDialog.destroyRecursive();
            }
            progressDialog = new dijit.Dialog({
                id: 'progressDialog',
                title: title,
                style: 'width: 300px; height: 100px',
                closable: false
            });
            var progressBar = new dijit.ProgressBar({
                id: 'reportLoadingProgressBar',
                style: 'margin-top: 10px; margin-bottom: 20px',
                indeterminate: true
            });
            progressDialog.containerNode.appendChild(progressBar.domNode);
            progressDialog.show();
            dojo.style(progressDialog.closeButtonNode, 'display', 'none'); //Hide the "x" button that closes the dialog
            progressDialog.onCancel = function () { }; //Prevent the user from closing the dialog hitting ESC key
        },
        _closeLoadingIndicator: function () {
            var dlg = dijit.byId("progressDialog");
            if (dlg) {
                dlg.hide();
                dlg.destroyRecursive();
            }
        },
        _getParameterValue: function (parameters, parameterName) {
            var parameterValue = null;
            dojoArray.some(parameters, function (parameter, j) {
                if (parameter.name === parameterName) {
                    parameterValue = parameter.value;
                    return true;
                }
            });
            return parameterValue;
        }
    });
    return Sage.MainView.ReportMgr.ReportWizardController;
});