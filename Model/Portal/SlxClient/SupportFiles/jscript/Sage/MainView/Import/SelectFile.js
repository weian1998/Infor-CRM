/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/_base/connect',
    'dojo/number',
    'dojo/string',
    'Sage/MainView/Import/_WizardDialogBase',
    'dojo/text!./templates/SelectFile.html',
    'dojo/i18n!./nls/SelectFile',
    'Sage/MainView/Import/ImportManagerUtility',
    'Sage/Utility',
    'Sage/Utility/File/Attachment'
],
function (
    declare,
    connect,
    dNumber,
    dString,
    wizardDialogBase,
    template,
    nlsResources,
    importManagerUtility,
    utility,
    attachmentUtility
) {
    var widgetTemplate = utility.makeTemplateFromString(template);
    var selectFile = declare('Sage.MainView.Import.SelectFile', [wizardDialogBase], {
        id: "dlgSelectFile",
        widgetTemplate: widgetTemplate,
        _nlsResources: nlsResources,
        _currentStep: importManagerUtility.importWizardStep.SelectFile,
        _fileInputOnChange: null,
        constructor: function () {
            this.inherited(arguments);
        },
        startup: function () {
            this._initializeFileUploadControl();
            this._initializeTemplateList();
            this.inherited(arguments);
        },
        isValid: function () {
            var msg = '';
            dojo.addClass(this.errorNoUploadFile, 'display-none');
            if (!this.importOptions.attachmentId) {
                msg = nlsResources.errorNoUploadFile;
                dojo.removeClass(this.errorNoUploadFile, 'display-none');
                this.spanValidationMessage.innerHTML = utility.htmlEncode(msg);
            }
            importManagerUtility.setDomNodeVisible(this.divValidationMessage, (msg !== ""));
            if (msg === '') {
                this._updateImportOptions();
                return true;
            }
            return false;
        },
        destroy: function () {
            this.importTemplates.destroyRecursive();
            this.inherited(arguments);
        },
        _initializeFileUploadControl: function() {
            this._fileInputOnChange = dojo.hitch(this, connect.connect(this.fileInputBtn, 'onchange', this, this._handleFiles));
            this.subscriptions.push(dojo.subscribe('/entity/attachment/create', this, this._onNewFileUpload));
        },
        _initializeTemplateList: function() {
            var requestOptions = {
                where: dString.substitute('EntityName eq \'${0}\'', [this.importOptions.importEntity]),
                onSuccess: dojo.hitch(this, function (templates) {
                    this.importTemplates = this._initializeTemplates(templates);
                    this.importTemplates.placeAt(this.templates_Container);
                })
            };
            importManagerUtility.requestImportTemplates(requestOptions);
        },
        _btnUploadFile_OnClick: function () {
            this.fileInputBtn.click();
        },
        _handleFiles: function (e) {
            this._createAttachments(this.fileInputBtn.files);
        },
        _createAttachments: function (files) {
            if (files.length > 0) {
                this.importOptions.isInitialized = false; //make sure importOptions is reinitialized in case this is a different uploaded file
                this.lblFileUpload.textContent = dString.substitute(nlsResources.txtFileContents_Caption, [files[0].name, dNumber.round(files[0].size / 1024, 0)]);
                this.txtFakeUploadFile.set('value', files[0].name);
                attachmentUtility.createAttachmentSilent(files[0], {});
            }
        },
        _onNewFileUpload: function (attachment) {
            this.importOptions.attachmentId = attachment.$key;
            this.importOptions.attachmentName = attachment.$descriptor;
            this.importOptions.fileName = attachment.fileName;
            this.importOptions.refreshDelimiterPage = true;
            this.importOptions.refreshMapFieldsPage = true;
            this.isValid();
        },
        _updateImportOptions: function () {
            if (!this.importOptions.refreshDelimiterPage) {
                this.importOptions.refreshDelimiterPage = this.importTemplates.value !== this.importOptions.importTemplateId;
            }
            var refresh = !!this.importOptions.refreshMapFiledsPage || this.importTemplates.value !== this.importOptions.importTemplateId;
            if (refresh) {
                var dialog = dijit.byId("dlgMapFields");
                if (dialog) {
                    dialog.destroyRecursive();
                }
                this.importOptions.refreshMapFieldsPage = false;
            }
            this.importOptions.refreshMapFieldsPage = this.importTemplates.value !== this.importOptions.importTemplateId;
            this.importOptions.importTemplateId = this.importTemplates.value !== "" ? this.importTemplates.value : null;
            this.importOptions.isSystemTemplate = !!(this.importTemplates.item && this.importTemplates.item.IsSystemTemplate);
        }
    });
    return selectFile;
});