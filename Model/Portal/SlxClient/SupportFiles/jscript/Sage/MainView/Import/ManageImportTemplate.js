/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/string',
    'Sage/MainView/Import/_WizardDialogBase',
    'dojo/text!./templates/ManageImportTemplate.html',
    'dojo/i18n!./nls/ManageImportTemplate',
    'Sage/Utility',
    'Sage/UI/Dialogs',
    'Sage/MainView/Import/ImportManagerUtility',
    'dgrid/Selection',
    'dgrid/OnDemandGrid',
    'dgrid/Keyboard',
    'dojo/store/Memory',
    'dgrid/extensions/ColumnHider',
    'dgrid/editor',
    'Sage/Data/SDataServiceRegistry'
],
function (
    declare,
    dLang,
    dString,
    wizardDialogBase,
    template,
    nlsResources,
    utility,
    dialogs,
    importManagerUtility,
    selection,
    onDemandGrid,
    keyboard,
    memory,
    columnHider,
    editor,
    sDataServiceRegistry
) {
    var widgetTemplate = utility.makeTemplateFromString(template);
    var manageImportTemplate = declare('Sage.MainView.Import.ManageImportTemplate', [wizardDialogBase], {
        id: 'dlgManageImportTemplate',
        widgetTemplate: widgetTemplate,
        _nlsResources: nlsResources,
        templatesGrd: '',
        constructor: function () {
            this.inherited(arguments);
        },
        startup: function () {
            this._requestImportTemplates();
        },
        _requestImportTemplates: function () {
            var requestOptions = {
                onSuccess: dojo.hitch(this, function (templates) {
                    importManagerUtility.setDomNodeVisible(this.divLoadingMessage, false);
                    this._loadImportTemplates(templates);
                })
            };
            importManagerUtility.requestImportTemplates(requestOptions);
        },
        _loadImportTemplates: function (templates) {
            this.templatesGrd = new (declare([onDemandGrid, keyboard, selection, editor, columnHider]))({
                className: ".dgrid-autoheight .dgrid-no-data",
                store: new memory({ data: templates, idProperty: "$key" }),
                columns: {
                    Delete: {
                        label: ' ',
                        field: 'deletelink',
                        renderCell: dLang.hitch(this, function (object, value, node) {
                            var link = document.createElement('a');
                            link.style.cursor = "pointer";
                            var linkText = document.createTextNode(nlsResources.colDelete);
                            link.appendChild(linkText);
                            link.title = nlsResources.colDelete;
                            link.onclick = dLang.hitch(this, function () {
                                this._removeImportTemplate(object.$key);
                                this._deleteImportTemplate(object.$key);
                            });
                            node.appendChild(link);
                        }),
                        sortable: false
                    },
                    TemplateName: nlsResources.colDescription,
                    EntityName: nlsResources.colEntityName,
                    CreateUser: {
                        label: nlsResources.colCreatedBy,
                        get: function (data) {
                            var user = importManagerUtility.getUserName(data.CreateUser);
                            if (user) {
                                return user.$descriptor;
                            }
                            return "";
                        }
                    },
                    CreateDate: {
                        label: nlsResources.colCreatedDate,
                        get: function (data) {
                            return importManagerUtility.formatDate(data.CreateDate);
                        }
                    },
                    ModifyUser: {
                        label: nlsResources.colModifiedBy,
                        get: function (data) {
                            if (data.ModifyUser !== null) {
                                var user = importManagerUtility.getUserName(data.ModifyUser);
                                if (user) {
                                    return user.$descriptor;
                                }
                            }
                            return "";
                        }
                    },
                    ModifyDate: {
                        label: nlsResources.colModifiedDate,
                        get: function(data) {
                            return importManagerUtility.formatDate(data.ModifyDate);
                        }
                    }
                },
                loadingMessage: this.gridLoading_Caption,
                noDataMessage: this.gridNoResults_Caption
            }, this.templatesGrid);
            this.templatesGrd.startup();
        },
        _removeImportTemplate: function (templateId) {
            if (this.templatesGrd) {
                this.templatesGrd.store.remove(templateId);
                this.templatesGrd.refresh();
            }
        },
        _deleteImportTemplate: function (templateId) {
            var request = new Sage.SData.Client.SDataSingleResourceRequest(sDataServiceRegistry.getSDataService('dynamic'));
            request.setResourceKind("importTemplates");
            request.setResourceSelector(dString.substitute("'${0}'", [templateId]));
            request['delete']({}, {
                scope: this,
                failure: function (error) {
                    dialogs.showError(dString.substitute(nlsResources.errorDeletingTemplate, [error]));
                }
            });
        },
        _btnSave_OnClick: function () {
            if (this._isValid()) {
                this.importOptions.templateName = this.txtTemplateDescription.get("value");
                this.saveImportJobTemplate(this.getTemplateConfigurationOptions(true));
                this._dialog.hide();
            }
        },
        _isValid: function () {
            var msg = "";
            dojo.addClass(this.errorInvalidDescription, "display-none");
            if (this.txtTemplateDescription.value === "") {
                msg = nlsResources.errorNoTemplateDescription;
                dojo.removeClass(this.errorInvalidDescription, "display-none");
                this.spanValidationMessage.innerHTML = utility.htmlEncode(msg);
            }
            importManagerUtility.setDomNodeVisible(this.divValidationMessage, (msg !== ""));
            return msg === "";
        },
        _btnCancel_OnClick: function () {
            this._dialog.hide();
        }
    });
    return manageImportTemplate;
});