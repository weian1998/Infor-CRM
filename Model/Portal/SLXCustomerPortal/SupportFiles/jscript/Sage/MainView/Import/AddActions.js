/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'Sage/MainView/Import/_WizardDialogBase',
    'dojo/text!./templates/AddActions.html',
    'dojo/i18n!./nls/AddActions',
    'Sage/MainView/Import/ImportManagerUtility',
    'Sage/Utility'
],
function (
    declare,
    dojoArray,
    dojoLang,
    _WizardDialogBase,
    template,
    nlsResources,
    importManagerUtility,
    utility
) {
    var __widgetTemplate = utility.makeTemplateFromString(template);
    var addActions = declare('Sage.MainView.Import.AddActions', [_WizardDialogBase], {
        id: "dlgAddActions",
        widgetTemplate: __widgetTemplate,
        _nlsResources: nlsResources,
        _currentStep: importManagerUtility.importWizardStep.AddActions,
        constructor: function () {
            this.inherited(arguments);
        },
        startup: function () {
            this.inherited(arguments);
        }
        //destroy: function () {
        //    this.inherited(arguments);
        //},
    });
    return addActions;
});