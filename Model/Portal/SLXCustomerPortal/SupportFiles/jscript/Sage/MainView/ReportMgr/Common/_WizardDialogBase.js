/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/topic',
    'dojo/_base/lang',
    'dijit/_Widget',
    'Sage/_Templated',
    'Sage/MainView/ReportMgr/ReportManagerUtility',
    'Sage/Reporting/Enumerations',
    'dojo/i18n!./nls/_WizardDialogBase',
    'Sage/UI/Controls/_DialogHelpIconMixin'
],
function (
    declare,
    topic,
    dojoLang,
    _Widget,
    _Templated,
    reportManagerUtility,
    enumerations,
    nlsResources,
    _DialogHelpIconMixin
) {
    var wizardDialogBase = declare('Sage.MainView.ReportMgr.Common._WizardDialogBase', [_Widget, _Templated], {
        _dialog: null,
        _currentStep: null,
        _isFirstStep: false,
        _isLastStep: false,
        _reportMetadata: null,
        _btnPlusIconPath: 'images/icons/plus_16x16.gif',
        widgetsInTemplate: true,
        show: function () {
            this._dialog.show();
            if (this._helpIconTopic) {
                if (!this._dialog.helpIcon) {
                    dojoLang.mixin(this._dialog, new _DialogHelpIconMixin());
                    this._dialog.createHelpIconByTopic(this._helpIconTopic);
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
        //------------------------------------------------
        //Events.
        //------------------------------------------------
        /**
        * Triggered when the user clicks on the "x" button to close the dialog.
        */
        _dialog_OnCancel: function () {
            this._checkCurrentStep();
            this._dialog.hide();
            topic.publish("/reportManager/reportWizard/cancel", null);
        },
        _cmdBack_OnClick: function () {
            this._checkCurrentStep();
            var result = this._getWizardStepResult();
            this._dialog.hide();
            topic.publish("/reportManager/reportWizard/previousStep", this._currentStep, result);
        },
        _cmdNext_OnClick: function () {
            //Do not remove validation below. Required for triggering validation of the current wizard dialog page.
            if (this.isValid()) {
                this._checkCurrentStep();
                var result = this._getWizardStepResult();
                this._dialog.hide();
                topic.publish("/reportManager/reportWizard/nextStep", this._currentStep, result);
            }
        },
        _cmdCancel_OnClick: function () {
            this._checkCurrentStep();
            this._dialog.hide();
            topic.publish("/reportManager/reportWizard/cancel", null);
        },
        //------------------------------------------------
        //Internal functions.
        //------------------------------------------------
        _initializeWizardOptions: function (options) {
            if (options) {
                this._isFirstStep = options.isFirstStep;
                this._isLastStep = options.isLastStep;
                this._reportMetadata = options.reportMetadata;
            }
        },
        _initializeWizardButtons: function () {
            if (this._isFirstStep) {
                reportManagerUtility.setDomNodeVisible(this.cmdBack.domNode, false);
            }
            if (this._isLastStep) {
                this.cmdNext.setLabel(nlsResources.txtFinish);
            }
        },
        _getWizardStepResult: function () {
            console.error("_getWizardStepResult must be implemented.");
            return null;
        },
        _checkCurrentStep: function () {
            if (this._currentStep === null) {
                console.error("_currentStep has not been defined");
            }
        }
    });
    return wizardDialogBase;
});