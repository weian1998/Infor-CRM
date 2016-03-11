/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/string',
    'dojo/on',
    'dojo/_base/array',
    'dojo/store/Memory',
    'Sage/MainView/Import/_WizardDialogBase',
    'dojo/text!./templates/DefineDelimiter.html',
    'dojo/i18n!./nls/DefineDelimiter',
    'Sage/MainView/Import/ImportManagerUtility',
    'Sage/Utility',
    'Sage/UI/Dialogs',
    'dgrid/Grid',
    'dgrid/Selection',
    'dgrid/extensions/ColumnHider'
],
function (
    declare,
    dString,
    dOn,
    dArray,
    dMemory,
    wizardDialogBase,
    template,
    nlsResources,
    importManagerUtility,
    utility,
    dialogs,
    dGrid,
    selection,
    columnHider
) {
    var widgetTemplate = utility.makeTemplateFromString(template);
    var defineDelimiter = declare('Sage.MainView.Import.DefineDelimiter', [wizardDialogBase], {
        id: "dlgDefineDelimiter",
        previewGrid: null,
        widgetTemplate: widgetTemplate,
        _nlsResources: nlsResources,
        _currentStep: importManagerUtility.importWizardStep.DefineDelimiter,
        constructor: function () {
            this.inherited(arguments);
        },
        show: function () {
            if (this.importOptions.refreshDelimiterPage) {
                this.btnNext.setDisabled(true);
                importManagerUtility.setDomNodeVisible(this.divLoadingMessage, true);
                this._requestPreviewData();
                dOn(this.cmbQualifiers, "change", dojo.hitch(this, this._requestPreviewData));
                this.importOptions.refreshDelimiterPage = false;
            }
            this.inherited(arguments);
        },
        isValid: function () {
            return true;
        },
        _requestPreviewData: function() {
            this._updateImportOptions();
            var fileOptions = {
                importEntity: this.importOptions.importEntity,
                importEntityType: this.importOptions.importEntityType,
                attachmentId: this.importOptions.attachmentId,
                importTemplateId: this.importOptions.importTemplateId,
                delimiter: this.importOptions.sourceModel ? this.importOptions.sourceModel.Options.delimiter.value : null,
                qualifier: this.importOptions.sourceModel ? this.importOptions.sourceModel.Options.qualifier.value : null,
                firstRowFieldNames: this.importOptions.firstRowFieldNames,
                numberRecordBack: "5",
                isInitialized: this.importOptions.isInitialized,
                sourceModel: this.importOptions.sourceModel,
                sourceColumns: this.importOptions.sourceColumns,
                defaultOwnerId: this.importOptions.defaultOwnerId,
                groupSettings: this.importOptions.groupSettings,
                metaDataObject: this.importOptions.metaDataObject,
                targetColumns: this.importOptions.targetList ? this.importOptions.targetList.data : this.importOptions.targetList,
                matchOptions: this.importOptions.matchOptions,
                engineOptions: this.importOptions.engineOptions,
                defaultAdHocGroupName: this.importOptions.groupSettings.name
            };

            var requestOptions = {
                entry: {
                    "$name": "ReadImportData",
                    "request": {
                        "ImportHistoryId": null,
                        "importOptions": Sys.Serialization.JavaScriptSerializer.serialize(fileOptions)
                    }
                },
                businessRuleMethod: "ReadImportData",
                onSuccess: dojo.hitch(this, function(options) {
                    this.importOptions.defaultOwnerId = options.defaultOwnerId;
                    this.importOptions.groupSettings = options.groupSettings ? options.groupSettings : {};
                    this.importOptions.isInitialized = true;
                    this.importOptions.metaDataObject = options.metaDataObject;
                    this.importOptions.mappings = options.mappings;
                    this.importOptions.sourceColumns = JSON.parse(JSON.stringify(options.sourceColumns)); //make a clone the array
                    this.importOptions.sourceModel = options.sourceModel;
                    this.importOptions.targetList = new dMemory({ data: options.targetColumns, idProperty: "name" });
                    this.importOptions.matchOptions = options.matchOptions;
                    this.importOptions.totalRecordCount = options.totalRecordCount;
                    this.importOptions.engineOptions = options.engineOptions;
                    this.lblPreviewData.textContent = dString.substitute(nlsResources.txtPreview, [options.totalRecordCount, options.sourceColumns.length]);
                    this._loadDefaults(options.sourceModel.Options);
                    importManagerUtility.setDomNodeVisible(this.divLoadingMessage, false);
                    this._loadPreviewData(options);
                    this.btnNext.setDisabled(false);
                }),
                onFailure: function(result) {
                    dialogs.showError(dString.substitute(nlsResources.errorRequestFileOptions, [result]));
                }
            };
            importManagerUtility.importRuleRequest(requestOptions, "importHistory");
        },
        _loadDefaults: function (fileOptions) {
            this.cmbQualifiers.attr('value', fileOptions.qualifier.value, false);
            switch (fileOptions.delimiter.value) {
                case ",":
                    this.rdoCommaOption.set("checked", true);
                    break;
                case "\t":
                    this.rdoTabOption.set("checked", true);
                    break;
                case ";":
                    this.rdoSemiColonOption.set("checked", true);
                    break;
                case " ":
                    this.rdoSpaceOption.set("checked", true);
                    break;
                default:
                    this.rdoOtherOption.set("checked", true);
            }
        },
        _loadPreviewData: function (fileOptions) {
            var columns = {};
            dArray.forEach(fileOptions.sourceColumns, function (column, i) {
                columns[i] = column.displayName;
            });

            var grd = new (declare([dGrid, selection, columnHider]))({
                className: 'dgrid-autoheight dgrid-loading',
                columns: columns,
                loadingMessage: this.gridLoading_Caption,
                selectionMode: "single"
            });
            grd.renderArray(fileOptions.records);
            if (this.previewGrid) {
                this.previewGrid_Container.removeChild(this.previewGrid);
                this.previewGrid.destroy();
            }
            this.previewGrid_Container.addChild(grd);
            this.previewGrid = grd;
        },
        _rdoOption_OnClick: function (args) {
            this.txtOtherOption.attr("disabled", !this.rdoOtherOption.checked);
            if (this.rdoOtherOption.checked && this.txtOtherOption.value === "") {
                return;
            }
            this.importOptions.sourceModel.Options.delimiter.value = args.currentTarget.getAttribute('value');
            this._requestPreviewData();
        },
        _txtOtherOption_OnChange: function () {
            if (this.txtOtherOption.value !== "") {
                this.importOptions.sourceModel.Options.delimiter.value = this.txtOtherOption.get('value');
                this._requestPreviewData();
            }
        },
        _txtQualifier_OnChange: function () {
            this._requestPreviewData();
        },
        _chkFirstRowFieldNames_OnChange: function () {
            this._requestPreviewData();
        },
        _updateImportOptions: function () {
            if (this.cmbQualifiers.value !== "None") {
                this.importOptions.sourceModel.Options.qualifier.value = this.cmbQualifiers.value;
            }
            this.importOptions.firstRowFieldNames = this.chkFirstRowFieldNames.checked.toString();
        }
    });
    return defineDelimiter;
});