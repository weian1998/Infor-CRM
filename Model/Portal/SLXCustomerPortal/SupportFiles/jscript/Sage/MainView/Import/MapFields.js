/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/string',
    'dojo/store/Memory',
    'dojo/store/Observable',
    'Sage/MainView/Import/_WizardDialogBase',
    'dojo/text!./templates/MapFields.html',
    'dojo/i18n!./nls/MapFields',
    'Sage/MainView/Import/ImportManagerUtility',
    'Sage/Utility',
    'Sage/UI/Dialogs',
    'dgrid/OnDemandGrid',
    'dgrid/Keyboard',
    'dgrid/Selection',
    'dgrid/editor',
    'dgrid/extensions/ColumnHider',
    'dijit/form/FilteringSelect'
],
function (
    declare,
    dArray,
    dString,
    dMemory,
    dObservable,
    wizardDialogBase,
    template,
    nlsResources,
    importManagerUtility,
    utility,
    dialogs,
    onDemandGrid,
    keyboard,
    selection,
    editor,
    columnHider,
    filteringSelect
) {
    var widgetTemplate = utility.makeTemplateFromString(template);
    var mapFields = declare('Sage.MainView.Import.MapFields', [wizardDialogBase], {
        id: "dlgMapFields",
        widgetTemplate: widgetTemplate,
        _nlsResources: nlsResources,
        _currentStep: importManagerUtility.importWizardStep.MapFields,
        _grid: '',
        _mappingCount: 0,
        constructor: function () {
            this.inherited(arguments);
        },
        startup: function () {
            this._requestMappings();
        },
        show: function () {
            this._setRequiredMappingsMsg();
            this.inherited(arguments);
        },
        btnMapped_OnClick: function () {
            this._setEntityColumnState(false, "entityDisplayName");
            this._grid.set({
                query: function(item) {
                    return item.targetProperty !== "";
                }
            });
        },
        btnAll_OnClick: function () {
            this._setEntityColumnState(false, "entityDisplayName");
            this._grid.set({ query: {} });
            this._grid.columns.entityDisplayName.hidden = false;
        },
        isValid: function () {
            var msg = "";
            this._generateMappings();
            if (!this._generateMatchMappings()) {
                msg = nlsResources.errorRequiredMappings;
                this.spanValidationMessage.innerHTML = utility.htmlEncode(msg);
            }
            importManagerUtility.setDomNodeVisible(this.divValidationMessage, (msg !== ""));
            return msg === "";
        },
        _requestMappings: function () {
            var requestOptions = {
                entry: {
                    "$name": "GetImportMappings",
                    "request": {
                        "ImportHistoryId": null,
                        "importOptions": Sys.Serialization.JavaScriptSerializer.serialize(this.getConfigurationOptions())
                    }
                },
                businessRuleMethod: "GetImportMappings",
                onSuccess: dojo.hitch(this, function (mappings) {
                    this._mappingCount = this._getMappingCount(mappings.defaultMappings);
                    this._updateCaptions();
                    this._loadMappingsData(mappings);
                    this._resolveDefaultMappings();
                    this._setRequiredMappingsMsg();
                }),
                onFailure: function (result) {
                    dialogs.showError(dString.substitute(nlsResources.errorRequestMappings, [result]));
                }
            };
            importManagerUtility.importRuleRequest(requestOptions, "importHistory");
        },
        _getMappingCount: function(mappings) {
            var result = mappings.filter(
                dojo.hitch(this, function (mapping) {
                    return mapping.target.fieldType.indexOf(this.lookupTypeField) === -1;
                })
            );
            return mappings ? result.length : 0;
        },
        _loadMappingsData: function (mappings) {
            var data = [];
            var targetList = new dMemory({ data: this._removeRelationshipProperties(), idProperty: "name" });
            this.importOptions.defaultMappings = mappings.defaultMappings;

            dArray.forEach(this.importOptions.sourceColumns, function(source, i) {
                data.push({ id: i, sourceProperty: source.displayName, targetProperty: "", entityDisplayName: "", });
            });

            this._grid = new (declare([onDemandGrid, keyboard, selection, editor, columnHider]))({
                store: new dObservable(new dMemory({ data: data, idProperty: "sourceProperty" })),
                sort: "id",
                columns: {
                    id: { field: "id", hidden: true, unhidable: true },
                    sourceProperty: nlsResources.colImportField_Caption,
                    targetProperty: editor(
                    {
                        selectedValue: "FirstName",
                        label: nlsResources.colInforField_Caption,
                        field: "targetProperty",
                        autoSave: true,
                        autoSelect: true,
                        editorArgs: {
                            store: targetList,
                            maxHeight: 150,
                            required: false,
                            searchAttr: "displayName",
                            labelAttr: "displayName"
                        }
                    }, filteringSelect),
                    entityDisplayName: { label: nlsResources.colType_Caption, hidden: true }
                }
            }, this.mappingsGrid);
            this._grid.on("dgrid-datachange", dojo.hitch(this, function (evt) {
                var cell = this._grid.cell(evt);
                if (cell.column.field === "targetProperty") {
                    if (evt.value === "") {
                        this._mappingCount--;
                    } else {
                        this._mappingCount++;
                    }
                    var target = this.importOptions.targetList.get(evt.value);
                    var selectedRow = this._grid.cell(evt);
                    var key = selectedRow.row.data.sourceProperty;
                    var record = this._grid.store.get(key);
                    record.entityDisplayName = target.entityDisplayName;
                    record.targetProperty = target.name;
                    target = dojo.byId(cell.element.children[0].id);
                    this._grid.store.put(record);
                    target.setAttribute('value', evt.value);
                    this._updateCaptions();
                    this._setRequiredMappingsMsg();
                }
            }));
            //dAspect.after(this._grid, "renderRow", function (row, args) {
            //    if (args) {
            //        row.className = "red";
            //    }
            //    return row;
            //});
            this._grid.set({ query: { targetProperty: "" } });
            this._grid.startup();
        },
        _setRequiredMappingsMsg: function () {
            var requiredFields = "";
            if (this._grid.store) {
                dArray.forEach(this.importOptions.selectedMatchOptions, dojo.hitch(this, function (matchOption) {
                    if (matchOption.property !== "") {
                        var target = this.importOptions.importEntity;
                        target = target !== matchOption.entity ? dString.substitute("${0}.${1}", [matchOption.entity, matchOption.property]) : matchOption.property;
                        var row = this._grid.store.query({ targetProperty: target });
                        if (!row[0]) {
                            if (requiredFields === "") {
                                requiredFields = matchOption.displayValue;
                            } else {
                                requiredFields += dString.substitute(", ${0}", [matchOption.displayValue]);
                            }
                        }
                    }
                }));
            }
            this.lblRequiredFields.textContent = dString.substitute(nlsResources.txtRequired_Caption, [requiredFields]);
            importManagerUtility.setDomNodeVisible(this.divRequiredFields, (requiredFields !== ""));
        },
        _getMapping: function (property) {
            var mapping = null;
            dArray.some(this.importOptions.mappings, function (map) {
                if (map.target.name === property) {
                    mapping = map;
                    return true;
                }
                return false;
            });
            return mapping;
        },
        btnUnMapped_OnClick: function () {
            this._setEntityColumnState(true, "entityDisplayName");
            this._grid.set({ query: { targetProperty: "" } });
        },
        _updateCaptions: function () {
            this.lblMatchedFields.textContent = dString.substitute(nlsResources.txtHeader_Caption, [this._mappingCount, this.importOptions.sourceColumns.length]);
            this.btnMapped.setAttribute("label", dString.substitute(nlsResources.btnMapped_Caption, [this._mappingCount]));
            this.btnUnMapped.setAttribute("label", dString.substitute(nlsResources.btnUnMapped_Caption, [this.importOptions.sourceColumns.length - this._mappingCount]));
            this.btnAll.setAttribute("label", dString.substitute(nlsResources.btnAll_Caption, [this.importOptions.sourceColumns.length]));
        },
        _removeRelationshipProperties: function () {
            var targets = [];
            dArray.forEach(this.importOptions.targetList.data, dojo.hitch(this, function (target) {
                if (target.fieldType.indexOf(this.lookupTypeField) === -1) {
                    targets.push(target);
                }
            }));
            return targets;
        },
        _setEntityColumnState: function (hidden, column) {
            this._grid.columns.entityDisplayName.hidden = hidden;
            this._grid._columnHiderCheckboxes.entityDisplayName.checked = !hidden;
            if (hidden) {
                this._grid.styleColumn(column, "display: none;");
            } else {
                this._grid.styleColumn(column, "display: table-cell;");
            }
        },
        _resolveDefaultMappings: function () {
            dArray.forEach(this.importOptions.defaultMappings, dojo.hitch(this, function (map) {
                var row = this._grid.store.get(map.source.name);
                if (row) {
                    var target = this.importOptions.targetList.get(map.target.name);
                    if (target && (target.fieldType.indexOf(this.lookupTypeField) === -1)) {
                        row.targetProperty = target.name;
                        row.dataType = target.dataType;
                        row.entityDisplayName = target.entityDisplayName;
                    }
                }
            }));
            this._grid.refresh();
        },
        _generateMappings: function () {
            if (this._grid && this._grid.store) {
                var maps = [];
                dArray.forEach(this._grid.store.data, dojo.hitch(this, function (data) {
                    if (data.targetProperty !== "") {
                        maps.push({
                            source: { name: data.sourceProperty, value: data.sourceProperty, displayName: "" },
                            target: this.getTargetProperty(this.importOptions.targetList.get(data.targetProperty), data.targetProperty)
                        });
                    }
                }));
                this.importOptions.mappings = maps;
            }
        },
        _generateMatchMappings: function () {
            var valid = true;
            dArray.forEach(this.importOptions.selectedMatchOptions, dojo.hitch(this, function (matchOption) {
                if (matchOption.property !== "") {
                    var target = this.importOptions.importEntity;
                    target = target !== matchOption.entity ? dString.substitute("${0}.${1}", [matchOption.entity, matchOption.property]) : matchOption.property;
                    var row = this._grid.store.query({ targetProperty: target });
                    if (row[0]) {
                        var map = this._getMapping(matchOption.entity);
                        if (map) {
                            map.target.searchProperty = matchOption.property;
                        } else {
                            this.importOptions.mappings.push({
                                source: { name: row[0].sourceProperty, value: row[0].sourceProperty, displayName: "" },
                                target: this.getTargetProperty(this.importOptions.targetList.get(matchOption.entity), matchOption.entity, matchOption.property)
                            });
                        }
                    } else {
                        valid = false;
                    }
                } else {
                    //remove the mapping
                    dArray.some(this.importOptions.mappings, dojo.hitch(this, function (mapping, i) {
                        if (mapping.target.name === matchOption.entity) {
                            this.importOptions.mappings.splice(i, 1);
                            return true;
                        }
                        return false;
                    }));
                }
            }));
            return valid;
        }
    });
    return mapFields;
});