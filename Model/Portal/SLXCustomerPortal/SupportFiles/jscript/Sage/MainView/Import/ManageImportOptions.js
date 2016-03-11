/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/string',
    'dojo/store/Memory',
    'Sage/MainView/Import/_WizardDialogBase',
    'dojo/text!./templates/ManageImportOptions.html',
    'dojo/i18n!./nls/ManageImportOptions',
    'Sage/MainView/Import/ImportManagerUtility',
    'Sage/Utility',
    'Sage/UI/Controls/Lookup',
    'dijit/form/FilteringSelect',
    'dojox/layout/TableContainer'
],
function (
    declare,
    dArray,
    dString,
    dMemory,
    wizardDialogBase,
    template,
    nlsResources,
    importManagerUtility,
    utility,
    lookup,
    filteringSelect,
    tableContainer
) {
    var widgetTemplate = utility.makeTemplateFromString(template);
    var manageImportOptions = declare('Sage.MainView.Import.ManageDuplicates', [wizardDialogBase], {
        id: 'dlgManageImportOptions',
        widgetTemplate: widgetTemplate,
        _nlsResources: nlsResources,
        _currentStep: importManagerUtility.importWizardStep.ManageImportOptions,
        constructor: function() {
            this.inherited(arguments);
        },
        startup: function() {
            importManagerUtility.setDomNodeVisible(this.divAssociations, this.importOptions.matchOptions && this.importOptions.matchOptions.length > 0);
            this._loadMatchOptions();
            this._initializeDefaultOwner();
            this._assignDefaultValues();
        },
        show: function() {
            importManagerUtility.setDomNodeVisible(this.divValidationMessage, false);
            dArray.forEach(this.importOptions.matchOptions, function(association) {
                var error = dojo.byId(dString.substitute("${0}_ErrorTag", [association.name]));
                if (error) {
                    importManagerUtility.setDomNodeVisible(error, false);
                }
            });
            this.inherited(arguments);
        },
        isValid: function() {
            var msg = '';
            dojo.addClass(this.errorNoAddHocGroupName, 'display-none');
            if (this.rdoCreateAdHoc.checked && this.txtAdHocGroupName.value === '') {
                msg = nlsResources.errorNoAddHocGroupName;
                dojo.removeClass(this.errorNoAddHocGroupName, 'display-none');
                this.spanValidationMessage.innerHTML = utility.htmlEncode(msg);
            }
            importManagerUtility.setDomNodeVisible(this.divValidationMessage, (msg !== ""));
            this._updateImportOptions();
            return msg === "";
        },
        destroy: function() {
            this.associations_Container.destroyRecursive();
            this.lueDefaultOwner.destroy();
            this.inherited(arguments);
        },
        _loadMatchOptions: function() {
            dArray.forEach(this.importOptions.matchOptions, dojo.hitch(this, function(association) {
                this._addMatchOption(association);
            }));
        },
        _addMatchOption: function(item) {
            var layout = new tableContainer({
                showLabels: true,
                orientation: "horiz",
                style: "display:inline-block;padding-right:25px",
            });
            var associationItem = new filteringSelect({
                id: dString.substitute("${0}_Association", [item.name]),
                store: new dMemory({ data: item.properties, idProperty: "name" }),
                maxHeight: 150,
                searchAttr: "displayName",
                labelAttr: "displayName",
                placeHolder: this.selectOption_Caption,
                required: false,
                title: dString.substitute("${0} ${1}", [item.displayName, nlsResources.match_Caption])
            });
            var defaultValue = this._getDefaultValue(item);
            if (defaultValue) {
                associationItem.attr('value', defaultValue);
            }
            var errorTag = new dojo.create('span', {
                id: dString.substitute("${0}_ErrorTag", [item.name]),
                style: "color: red;padding:25px 25px;",
                innerHTML: "*",
                "class": "display-none"
            });
            layout.addChild(associationItem);
            this.associations_Container.addChild(layout);
            this.associations_Container.containerNode.appendChild(errorTag);
        },
        _getDefaultValue: function(item) {
            switch (item.name) {
                case "Account":
                    return !this.importOptions.importTemplateId && !item.selectedValue ? "AccountName" : item.selectedValue;
                case "Contact":
                    return !this.importOptions.importTemplateId && !item.selectedValue ? "Email" : item.selectedValue;
            }
            return item.selectedValue;
        },
        _initializeDefaultOwner: function() {
            this.defaultOwnerLookupConfig = {
                id: '_defaultOwner',
                structure: [
                    {
                        defaultCell: {
                            sortable: true,
                            width: '150px',
                            editable: false,
                            styles: 'text-align: left;',
                            propertyType: 'System.String',
                            excludeFromFilters: false,
                            useAsResult: false,
                            pickListName: null,
                            defaultValue: ''
                        },
                        cells: [
                            {
                                name: nlsResources.lookupDescriptionColText,
                                field: 'Description'
                            }, {
                                name: nlsResources.lookupTypeColText,
                                field: 'Type'
                            }
                        ]
                    }
                ],
                gridOptions: {
                    contextualCondition: '',
                    contextualShow: '',
                    selectionMode: 'single'
                },
                storeOptions: { resourceKind: 'ownerViews', sort: [{ attribute: 'Description' }] },
                isModal: true,
                initialLookup: true,
                preFilters: [],
                returnPrimaryKey: true,
                dialogTitle: nlsResources.lookupDefaultOwner_Caption,
                dialogButtonText: this.btnOK_Caption
            };
            this.lueDefaultOwner = new lookup({
                id: 'lu_DefaultOwner',
                config: this.defaultOwnerLookupConfig,
                allowClearingResult: true,
                style: 'width:100%'
            });
            dojo.place(this.lueDefaultOwner.domNode, this.defaultOwner_Container.domNode, 'only');
        },
        _assignDefaultValues: function() {
            importManagerUtility.getOwner(this.importOptions.defaultOwnerId, this.lueDefaultOwner);
            this.lblImportOption.textContent = nlsResources.txtOption_Insert;
            this._initializeAdHocGroups();
        },
        _initializeAdHocGroups: function () {
            if (!this.adHocGroups) {
                var svc = Sage.Services.getService('ClientGroupContext');
                svc.getAdHocGroupList(function (list) {
                    this.adHocGroups = new filteringSelect({
                        store: new dMemory({ data: list, idProperty: "$key" }),
                        maxHeight: 150,
                        searchAttr: "name",
                        labelAttr: "name",
                        required: false,
                        placeHolder: this.selectOption_Caption
                    });
                    this.adHocGroups.startup();
                    this.adHocGroups_Container.addChild(this.adHocGroups);
                    if (this.importOptions.groupSettings) {
                        if (this.importOptions.groupSettings.id) {
                            this.rdoExistingAdHoc.set("checked", true);
                            this.adHocGroups.attr('value', this.importOptions.groupSettings.id);
                        } else if (this.importOptions.groupSettings.name) {
                            this.rdoCreateAdHoc.set("checked", true);
                            this.txtAdHocGroupName.set('value', this.importOptions.groupSettings.name);
                        }
                    }
                }, this);
            }
        },
        _updateImportOptions: function () {
            //this.importOptions.engineOptions.mode.name = this.cmbImportTypes.value; //currently hard coded in the engine to support insert only
            this.importOptions.previewDataMode = this.cmbImportTypes.attr('displayedValue');
            this.importOptions.defaultOwnerId = this.lueDefaultOwner.selectedObject ? this.lueDefaultOwner.selectedObject.$key : null;
            this.importOptions.groupSettings.name = this.rdoCreateAdHoc.checked ? this.txtAdHocGroupName.value : null;
            this.importOptions.groupSettings.id = this.rdoExistingAdHoc.checked && this.adHocGroups.value ? this.adHocGroups.value : null;
            this.importOptions.previewAdHocGroup = this.rdoExistingAdHoc.checked ? this.adHocGroups.attr('displayedValue') : this.txtAdHocGroupName.value;
            this.importOptions.selectedMatchOptions = [];
            dArray.forEach(this.importOptions.matchOptions, dojo.hitch(this, function (association) {
                var option = dijit.byId(dString.substitute("${0}_Association", [association.name]));
                association.selectedValue = option ? option.value : null;
                if (option) {
                    var target = this.importOptions.importEntity;
                    var displayValue = target !== association.name ? dString.substitute("${0}.${1}", [association.name, option.displayedValue]) : option.displayedValue;
                    this.importOptions.selectedMatchOptions.push({ property: option.value, entity: association.name, displayValue: displayValue });
                }
            }));
        },
        _cmbImportTypes_OnChange: function() {
            switch (this.cmbImportTypes.value) {
                case "insert":
                    this.lblImportOption.textContent = nlsResources.txtOption_Insert;
                    break;
                case "update":
                    this.lblImportOption.textContent = nlsResources.txtOption_Update;
                    break;
                case "insertAndUpdate":
                    this.lblImportOption.textContent = nlsResources.txtOption_InsertUpdate;
                    break;
            }
        }
    });
    return manageImportOptions;
});