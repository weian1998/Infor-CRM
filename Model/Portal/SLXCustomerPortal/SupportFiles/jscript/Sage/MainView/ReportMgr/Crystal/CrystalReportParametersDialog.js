/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/text!./templates/CrystalReportParametersDialog.html',
    'dojo/i18n!./nls/CrystalReportParametersDialog',
    'Sage/Reporting/Enumerations',
    'Sage/MainView/ReportMgr/Common/_WizardDialogBase',
    'Sage/MainView/ReportMgr/Crystal/BooleanParameterEditor',
    'Sage/MainView/ReportMgr/Crystal/DateParameterEditor',
    'Sage/MainView/ReportMgr/Crystal/SimpleParameterEditor',
    'Sage/MainView/ReportMgr/Crystal/MultiSelectParameterEditor',
    'Sage/Utility'
],
function (
    declare,
    dojoArray,
    template,
    nlsResources,
    enumerations,
    _WizardDialogBase,
    BooleanParameterEditor,
    DateParameterEditor,
    SimpleParameterEditor,
    MultiSelectParameterEditor,
    utility
) {
    var __widgetTemplate = utility.makeTemplateFromString(template.replace('\n', ''));
    var crystalReportParametersDialog = declare('Sage.MainView.ReportMgr.Crystal.CrystalReportParametersDialog', [_WizardDialogBase], {
        id: 'dlgCrystalReportParameters',
        widgetTemplate: __widgetTemplate,
        mode: null,
        _nlsResources: nlsResources,
        _helpIconTopic: 'RptscheduleWiz',
        _parameterWidgets: null,
        _parameters: null,
        _currentStep: enumerations.CrystalReportWizardStep.Parameters,
        /**
        * CrystalReportParametersDialog class constructor.
        * @constructor
        */
        constructor: function (options, argMode) {
            this.mode = argMode;
            this._initializeWizardOptions(options);
            this._parameterWidgets = [];
            //Load the parameters either from the parameters collection passed as argument or from the report metadata.
            this._parameters = (options.parameters && options.parameters.length > 0) ? options.parameters : options.reportMetadata.parameters;
        },
        destroy: function () {
            dojoArray.forEach(this._parameterWidgets, function (widget, i) {
                dojo.publish("entity/report/parameters/control/destroy", [widget, this]);
                if (widget) {
                    widget.destroyRecursive();
                }
            });
            this._dialog.destroyRecursive();
            this.inherited(arguments);
        },
        /**
        * This is a last method in the initialization process. 
        * It is called after all the child widgets are rendered so it's good for a container widget to finish it's post rendering here. 
        * This is where the container widgets could for example set sizes of their children relative to it's own size.
        */
        startup: function () {
            this.inherited(arguments);
            this._loadPromptParameters();
        },
        isValid: function () {
            var valid = true;
            dojoArray.forEach(this._parameterWidgets, function (widget, i) {
                valid = valid && widget.isValid();
            });
            return valid;
        },
        _loadPromptParameters: function () {
            var self = this;
            dojoArray.forEach(this._parameters, function (parameter, i) {
                //'PM-' parameters are not supposed to be shown to the user. 
                //They are used internally by the report.
                if (!parameter.name.toUpperCase().startsWith('PM-')) {
                    var parameterWidget = self._getParameterEditor(parameter);
                    if (parameterWidget) {
                        parameterWidget.paramId = i;
                        parameterWidget.mode = self.mode;
                        // NOTE: placeAt() will call the widget's startup method in some scenarios.
                        parameterWidget.placeAt(self.paramsContainerDiv);
                        // NOTE: The widget's startup method should check if it has already started (e.g. when placeAt() causes a startup) and exit the startup method if it has.
                        parameterWidget.startup();
                        self._parameterWidgets.push(parameterWidget);
                    } else {
                        console.error("This report uses parameters that are not currently supported.");
                    }
                }
            });
        },
        _getDialogTitle: function () {
            return this._nlsResources.txtDialogTitle + " [" + this._reportMetadata.displayName + "]";
        },
        _getWizardStepResult: function () {
            var parameters = [];
            dojoArray.forEach(this._parameterWidgets, function (widget, i) {
                parameters.push(widget.get('value'));
            });
            var result = {
                parameters: parameters
            };
            return result;
        },
        _getParameterEditor: function (parameter) {
            switch (parameter.parameterValueKind) {
                case enumerations.SlxParameterValueKind.BooleanParameter:
                    return new BooleanParameterEditor(parameter);
                case enumerations.SlxParameterValueKind.StringParameter:
                case enumerations.SlxParameterValueKind.NumberParameter:
                case enumerations.SlxParameterValueKind.CurrencyParameter:
                    if (parameter.allowMultiValue) {
                        return new MultiSelectParameterEditor(parameter);
                    }
                    else {
                        return new SimpleParameterEditor(parameter);
                    }
                    break;//Needed to avoid JSHint validation error
                case enumerations.SlxParameterValueKind.DateParameter:
                case enumerations.SlxParameterValueKind.DateTimeParameter:
                    return new DateParameterEditor(parameter);
                case enumerations.SlxParameterValueKind.TimeParameter:
                    console.error("Unknown parameter type: " + parameter.parameterValueKind + "/" + parameter.valueRangeKind);
                    break;//Needed to avoid JSHint validation error
                default:
                    console.error("Unknown parameter type. valueKind:" + parameter.parameterValueKind + "/rangeKind:" + parameter.valueRangeKind + "/multiValue:" + parameter.allowMultiValue);
                    return null;
            }
            return null;
        }
    });
    return crystalReportParametersDialog;
});