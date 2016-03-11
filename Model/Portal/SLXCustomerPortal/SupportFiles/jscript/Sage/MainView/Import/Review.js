/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/string',
    'dojo/topic',
    'Sage/MainView/Import/_WizardDialogBase',
    'dojo/text!./templates/Review.html',
    'dojo/i18n!./nls/Review',
    'Sage/MainView/Import/ImportManagerUtility',
    'Sage/MainView/Import/ManageImportTemplate',
    'Sage/Utility',
    'Sage/Utility/Jobs',
    'Sage/UI/Dialogs'
],
function (
    declare,
    dojoArray,
    dojoLang,
    dString,
    topic,
    wizardDialogBase,
    template,
    nlsResources,
    importManagerUtility,
    manageImportTemplate,
    utility,
    jobs,
    dialogs
) {
    var widgetTemplate = utility.makeTemplateFromString(template);
    var review = declare('Sage.MainView.Import.Review', [wizardDialogBase], {
        id: "dlgReview",
        templateDialogId: 'dlgManageImportTemplate',
        widgetTemplate: widgetTemplate,
        _nlsResources: nlsResources,
        _currentStep: importManagerUtility.importWizardStep.Review,
        constructor: function () {
            this.inherited(arguments);
        },
        show: function () {
            this._initializeTemplateList();
            this.previewFileName.textContent = dString.substitute(nlsResources.previewFileName_Caption, [this.importOptions.fileName]);
            this.previewImportDataMode.textContent = dString.substitute(nlsResources.previewImportDataMode, [this.importOptions.previewDataMode]);
            this.previewRecordCount.textContent = dString.substitute(nlsResources.previewRecordCount_Caption, [this.importOptions.totalRecordCount]);
            this.previewAdHocGroup.textContent = dString.substitute(nlsResources.previewAdHocGroup_Caption, [this.importOptions.previewAdHocGroup]);
            this.btnSaveTemplate.setDisabled(this.importOptions.importTemplateId === null);
            this.subscriptions.push(topic.subscribe("/importController/importWizard/savedImportTemplate", dojo.hitch(this, function () { this._initializeTemplateList(); })));
            this.inherited(arguments);
        },
        _initializeTemplateList: function () {
            var requestOptions = {
                where: dString.substitute('EntityName eq \'${0}\'', [this.importOptions.importEntity]),
                onSuccess: dojo.hitch(this, function (templates) {
                    if (this.importTemplates && this.templates_Container) {
                        this.templates_Container.removeChild(this.importTemplates);
                    }
                    this.importTemplates = this._initializeTemplates(templates);
                    this.importTemplates.placeAt(this.templates_Container);
                    this.btnSaveTemplate.setAttribute("Disabled", this.importOptions.isSystemTemplate);
                })
            };
            importManagerUtility.requestImportTemplates(requestOptions);
        },
        _btnSaveTemplate_OnClick: function () {
            this.saveImportJobTemplate(this.getTemplateConfigurationOptions());
        },
        _btnSaveAsTemplate_OnClick: function () {
            var templateDialogId = dijit.byId("dlgManageImportTemplate");
            if (templateDialogId) {
                templateDialogId.destroyRecursive();
            }
            templateDialogId = new manageImportTemplate();
            templateDialogId.startup();
            templateDialogId.show();
        },
        _btnFinish_OnClick: function () {
            this._createOwnerMapping();
            this._startImportJob();
            this._dialog.hide();
            this.finishWizard();
        },
        _createOwnerMapping: function () {
            if (this.importOptions.defaultOwnerId) {
                var target = this.importOptions.targetList.get("Owner");
                if (target) {
                    this.importOptions.mappings.push({
                        source: { name: "", value: "", displayName: "" },
                        target: this.getTargetProperty(target, "Owner", "Id", this.importOptions.defaultOwnerId)
                    });
                }
            }
        },
        _startImportJob: function () {
            var options = {
                descriptor: dString.substitute("${0} import: ${1}", [this.importOptions.importEntity, this.importOptions.attachmentName]),
                closable: true,
                title: dString.substitute(nlsResources.txtJobTitle_Caption, [this.importOptions.importEntity]),
                key: "Sage.SalesLogix.BusinessRules.Jobs.ImportJob",
                parameters: [
                    { "name": "ImportConfiguration", "value": Sys.Serialization.JavaScriptSerializer.serialize(this.getConfigurationOptions()) }
                ],
                failure: function (error) {
                    dialogs.showError(dString.substitute(nlsResources.errorJobFailed, [error.responseText]));
                },
                ensureZeroFilters: true
            };
            jobs.triggerJobAndDisplayProgressDialog(options);
        }
    });
    return review;
});