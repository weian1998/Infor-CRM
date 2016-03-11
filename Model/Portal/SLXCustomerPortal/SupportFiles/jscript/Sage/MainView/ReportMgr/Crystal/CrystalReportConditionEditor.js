/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/string',
    'dojo/_base/array',
    'dojo/topic',
    'dojo/i18n!./nls/CrystalReportConditionEditor',
    'dojo/text!./templates/CrystalReportConditionEditor.html',
    'dijit/_Widget',
    'Sage/_Templated',
    'dojo/_base/lang',
    'Sage/UI/Controls/_DialogHelpIconMixin',
    'Sage/UI/Controls/Lookup',
    'Sage/UI/Dialogs',
    'Sage/Data/SDataServiceRegistry',
    'dojo/data/ItemFileWriteStore',
    'Sage/Reporting/Enumerations',
    'Sage/MainView/ReportMgr/ReportManagerUtility',
    'Sage/MainView/ReportMgr/Crystal/CrystalReportsUtility',
    'dijit/form/Select',
    'dijit/form/CheckBox'
],
function (
    declare,
    dojoString,
    dojoArray,
    topic,
    nlsResources,
    template,
    _Widget,
    _Templated,
    dojoLang,
    _DialogHelpIconMixin,
    Lookup,
    Dialogs,
    SDataServiceRegistry,
    ItemFileWriteStore,
    Enumerations,
    ReportManagerUtility,
    CrystalReportsUtility
    ) {
    /**
    * Declare the CrystalReportConditionEditor class.
    * @constructor
    */
    var crystalReportConditionEditor = declare('Sage.MainView.ReportMgr.CrystalReportConditionEditor', [_Widget, _Templated], {
        id: 'dlgCrystalReportConditionEditor',
        _dialog: false,
        _reportMetadata: null,
        widgetTemplate: new Simplate(eval(template)),
        _nlsResources: nlsResources,
        widgetsInTemplate: true,
        _entity: null,
        _mode: 'new',
        /**
        * CrystalReportConditionEditor class constructor.
        * @constructor
        * @param {Object} entity - Condition to be edited.
        * @param {Object} report - Report metadata object.
        */
        constructor: function (entity, reportMetadata) {
            this._entity = entity;
            this._reportMetadata = reportMetadata;
            if (entity) {
                this._mode = 'edit';
            }
        },
        /**
        * Displays the Dialog.
        */
        show: function () {
            this._dialog.show();

            if (!this._dialog.helpIcon) {
                dojoLang.mixin(this._dialog, new _DialogHelpIconMixin());
                this._dialog.createHelpIconByTopic('reportconditions');
            }

        },
        destroy: function () {
            this.lkpUser.destroy();
            this.lkpGroup.destroy();
            this.inherited(arguments);
        },
        //*******************************************************************************
        //EVENTS
        //*******************************************************************************
        /**
        * Function called when the dialog is shown.
        **/
        _dialog_OnShow: function () {
            ////console.log("_dialog_OnShow");
            this._initializeControls();
        },
        /**
        * Function called when the dialog is closed. Destroys the object recursively.
        */
        _closeDialog: function () {
            var self = this;
            self._dialog.hide();
            self.destroyRecursive();
            //setTimeout(function () {  }, 1000);
        },
        /**
        * Saves changes.
        */
        _cmdOK_OnClick: function () {
            if (this._isValid()) {
                this._save();
            }
        },
        /**
        * Closes the Dialog.
        */
        _cmdCancel_OnClick: function () {
            this._closeDialog();
        },
        /**
        * Closes Dialog.
        */
        _dialog_OnCancel: function () {
            this._closeDialog();
        },
        _cmbConditionType_OnChange: function () {
            this._setControlsVisibility();
        },
        _cmbDateRange_OnChange: function () {
            this._setDateRangeControlsVisibility();
        },
        _cmbTables_OnChange: function () {
            this._initializeFieldsDropdown();
        },
        _cmbFields_OnChange: function () {
            this._initializeOperatorsDropdown();
        },
        _cmbOperators_OnChange: function () {
            this._setQueryControlsVisibility();
        },
        _chkCurrentUser_OnChange: function () {
            if (this.chkCurrentUser.checked) {
                this.lkpUser.set('selectedObject', null);
            }
            ReportManagerUtility.setDomNodeVisible(this.trUser, !this.chkCurrentUser.checked);
        },
        //*******************************************************************************
        //INTERNAL FUNCTIONS
        //*******************************************************************************
        /**
        * Validates the condition values.
        **/
        _isValid: function () {
            switch (this.cmbConditionType.value) {
                case String(Enumerations.ReportConditionType.Group):
                    if (!this.lkpGroup.get('selectedObject')) {
                        Dialogs.showError(dojoString.substitute(this._nlsResources.txtInvalidParameterMessage, [this._nlsResources.cmbGroup_Caption]), this._nlsResources.txtInvalidParameterTitle);
                        return false;
                    }
                    break;
                case String(Enumerations.ReportConditionType.DateRange):
                    if (this.cmbDateRange.value === "DateRange") {
                        if (this.dtFromDate.focusNode.value === "") {
                            Dialogs.showError(dojoString.substitute(this._nlsResources.txtInvalidParameterMessage, [this._nlsResources.dtFromDate_Caption]), this._nlsResources.txtInvalidParameterTitle);
                            return false;
                        }
                        if (this.dtToDate.focusNode.value === "") {
                            Dialogs.showError(dojoString.substitute(this._nlsResources.txtInvalidParameterMessage, [this._nlsResources.dtToDate_Caption]), this._nlsResources.txtInvalidParameterTitle);
                            return false;
                        }
                    }
                    break;
                case String(Enumerations.ReportConditionType.User):
                    if (!this.chkCurrentUser.checked && !this.lkpUser.get('selectedObject')) {
                        Dialogs.showError(dojoString.substitute(this._nlsResources.txtInvalidParameterMessage, [this._nlsResources.lkpUser_Caption]), this._nlsResources.txtInvalidParameterTitle);
                    }
                    break;
                case String(Enumerations.ReportConditionType.Query):
                    if (!this.cmbTables.value || this.cmbTables.value === "") {
                        Dialogs.showError(dojoString.substitute(this._nlsResources.txtInvalidParameterMessage, [this._nlsResources.cmbTable_Caption]), this._nlsResources.txtInvalidParameterTitle);
                        return false;
                    }
                    if (!this.cmbFields.value || this.cmbFields.value === "") {
                        Dialogs.showError(dojoString.substitute(this._nlsResources.txtInvalidParameterMessage, [this._nlsResources.cmbField_Caption]), this._nlsResources.txtInvalidParameterTitle);
                        return false;
                    }
                    if (!this.cmbOperators.value || this.cmbOperators.value === "") {
                        Dialogs.showError(dojoString.substitute(this._nlsResources.txtInvalidParameterMessage, [this._nlsResources.cmbOperator_Caption]), this._nlsResources.txtInvalidParameterTitle);
                        return false;
                    }
                    var operator = this.cmbOperators.value;
                    var fieldDataType = this._getFieldDataType();
                    switch (fieldDataType) {
                        case Enumerations.FieldDataTypes.Numeric:
                            if (operator == Enumerations.ReportConditionOperator.IsInTheRange) {
                                if (!this.txtNumericValue1.focusNode.textbox.value || this.txtNumericValue1.focusNode.textbox.value === "") {
                                    Dialogs.showError(dojoString.substitute(this._nlsResources.txtInvalidParameterMessage, [this._nlsResources.txtNumericValueFrom_Caption]), this._nlsResources.txtInvalidParameterTitle);
                                    return false;
                                }
                                if (!this.txtNumericValue2.focusNode.textbox.value || this.txtNumericValue2.focusNode.textbox.value === "") {
                                    Dialogs.showError(dojoString.substitute(this._nlsResources.txtInvalidParameterMessage, [this._nlsResources.txtNumericValueTo_Caption]), this._nlsResources.txtInvalidParameterTitle);
                                    return false;
                                }
                            }
                            else {
                                if (!this.txtNumericValue1.focusNode.textbox.value || this.txtNumericValue1.focusNode.textbox.value === "") {
                                    Dialogs.showError(dojoString.substitute(this._nlsResources.txtInvalidParameterMessage, [this._nlsResources.txtValue_Caption]), this._nlsResources.txtInvalidParameterTitle);
                                    return false;
                                }
                            }
                            break;
                        case Enumerations.FieldDataTypes.DateTime:
                            if (operator == Enumerations.ReportConditionOperator.IsInTheRange) {
                                if (this.dtDateValue1.focusNode.value === "") {
                                    Dialogs.showError(dojoString.substitute(this._nlsResources.txtInvalidParameterMessage, [this._nlsResources.dtFromDate_Caption]), this._nlsResources.txtInvalidParameterTitle);
                                    return false;
                                }
                                if (this.dtDateValue2.focusNode.value === "") {
                                    Dialogs.showError(dojoString.substitute(this._nlsResources.txtInvalidParameterMessage, [this._nlsResources.dtToDate_Caption]), this._nlsResources.txtInvalidParameterTitle);
                                    return false;
                                }
                            }
                            else {
                                if (this.dtDateValue1.focusNode.value === "") {
                                    Dialogs.showError(dojoString.substitute(this._nlsResources.txtInvalidParameterMessage, [this._nlsResources.dtFromDate_Caption]), this._nlsResources.txtInvalidParameterTitle);
                                    return false;
                                }
                            }
                            break;
                        case Enumerations.FieldDataTypes.String:
                            if (!this.txtStringValue1.value || this.txtStringValue1.value === "") {
                                Dialogs.showError(dojoString.substitute(this._nlsResources.txtInvalidParameterMessage, [this._nlsResources.txtValue_Caption]), this._nlsResources.txtInvalidParameterTitle);
                                return false;
                            }
                            break;
                        default:
                            console.error("Unsupported field type: " + fieldDataType);
                    }
                    break;
            }
            return true;
        },
        /**
        * Shows/Hides controls based on the condition type.
        **/
        _setControlsVisibility: function () {

            ReportManagerUtility.setDomNodeVisible(this.trUser, false);
            ReportManagerUtility.setDomNodeVisible(this.trCurrentUser, false);
            ReportManagerUtility.setDomNodeVisible(this.trGroup, false);
            ReportManagerUtility.setDomNodeVisible(this.trDateRange, false);
            ReportManagerUtility.setDomNodeVisible(this.trFromDate, false);
            ReportManagerUtility.setDomNodeVisible(this.trToDate, false);
            ReportManagerUtility.setDomNodeVisible(this.trTable, false);
            ReportManagerUtility.setDomNodeVisible(this.trField, false);
            ReportManagerUtility.setDomNodeVisible(this.trOperator, false);
            ReportManagerUtility.setDomNodeVisible(this.trValue, false);

            if (this.cmbConditionType) {

                switch (this.cmbConditionType.value) {
                    case Enumerations.ReportConditionType.Group:
                        ReportManagerUtility.setDomNodeVisible(this.trGroup, true);
                        break;
                    case Enumerations.ReportConditionType.DateRange:
                        ReportManagerUtility.setDomNodeVisible(this.trDateRange, true);
                        ReportManagerUtility.setDomNodeVisible(this.trFromDate, true);
                        ReportManagerUtility.setDomNodeVisible(this.trToDate, true);
                        break;
                    case Enumerations.ReportConditionType.User:
                        ReportManagerUtility.setDomNodeVisible(this.trUser, true);
                        ReportManagerUtility.setDomNodeVisible(this.trCurrentUser, true);
                        break;
                    case Enumerations.ReportConditionType.Query:
                        ReportManagerUtility.setDomNodeVisible(this.trTable, true);
                        ReportManagerUtility.setDomNodeVisible(this.trField, true);
                        ReportManagerUtility.setDomNodeVisible(this.trOperator, true);
                        ReportManagerUtility.setDomNodeVisible(this.trValue, true);
                        break;
                }
            }
            this._setQueryControlsVisibility();
        },
        /**
        * Shows/Hides controls based on the date range condition type.
        **/
        _setDateRangeControlsVisibility: function () {
            if (this.cmbDateRange) {
                switch (this.cmbDateRange.value) {
                    case "DateRange":
                        ReportManagerUtility.setDomNodeVisible(this.trFromDate, true);
                        ReportManagerUtility.setDomNodeVisible(this.trToDate, true);
                        break;
                    default:
                        ReportManagerUtility.setDomNodeVisible(this.trFromDate, false);
                        ReportManagerUtility.setDomNodeVisible(this.trToDate, false);
                        break;
                }
            }
        },
        /**
        * Creates controls, sets default values, etc.
        **/
        _initializeControls: function () {
            this._initializeConditionTypeDropdown();
            this._createUserLookup();
            this._createGroupLookup();
            this._setControlsVisibility();
            this._initializeTablesDropdown();
            this._setValues();
        },
        _setValues: function () {
            if (this._entity) {
                this.cmbConditionType.attr('value', this._entity.conditionType);
                //Set UI values according to the entity
                switch (this.cmbConditionType.value) {
                    case Enumerations.ReportConditionType.Group:
                        var group = this._entity.value ? ReportManagerUtility.getGroup(this._entity.value) : null;
                        this.lkpGroup.set('selectedObject', group);
                        break;
                    case Enumerations.ReportConditionType.DateRange:
                        this.cmbDateRange.attr('value', this._entity.value);
                        if (this.cmbDateRange.value === "DateRange") {
                            this.dtFromDate.set('value', this._entity.fromRange);
                            this.dtToDate.set('value', this._entity.toRange);
                        }
                        break;
                    case Enumerations.ReportConditionType.User:
                        if (this._entity.tag.toUpperCase() === ':USERID') {
                            this.chkCurrentUser.set('checked', true);
                        }
                        else {
                            var user = this._entity.value ? ReportManagerUtility.getUser(this._entity.tag) : null;
                            this.lkpUser.set('selectedObject', user);
                        }

                        break;
                    case Enumerations.ReportConditionType.Query:
                        this.cmbTables.attr('value', this._entity.table); // this triggers the loading of fields, which in turn triggers loading of operators
                        //this.cmbFields.attr('value', this._entity.field);
                        //this.cmbOperators.attr('value', this._entity.operator);
                        //var fieldDataType = this._getFieldDataType();
                        var operator = this._entity.operator;
                        switch (this._entity.dataType) {
                            case Enumerations.FieldDataTypes.Numeric:
                                if (operator == Enumerations.ReportConditionOperator.IsInTheRange) {
                                    this.txtNumericValue1.focusNode.textbox.value = this._entity.fromRange;//todo: check implementation of setvalue in the future
                                    this.txtNumericValue2.focusNode.textbox.value = this._entity.toRange;//todo: check implementation of setvalue in the future
                                }
                                else {
                                    this.txtNumericValue1.focusNode.textbox.value = this._entity.value;//todo: check implementation of setvalue in the future
                                }
                                break;
                            case Enumerations.FieldDataTypes.DateTime:
                                if (operator == Enumerations.ReportConditionOperator.IsInTheRange) {
                                    this.dtDateValue1.set('value', this._entity.fromRange);
                                    this.dtDateValue2.set('value', this._entity.toRange);
                                }
                                else {
                                    this.dtDateValue1.set('value', this._entity.value);
                                }
                                break;
                            case Enumerations.FieldDataTypes.String:
                                this.txtStringValue1.set('value', this._entity.value);
                                break;
                            default:
                                console.error("Unsupported field type: " + this._entity.dataType);
                        }
                        break;
                    default:
                        console.error("Unsupported condition type: " + this.cmbConditionType.value);
                }
            }
        },
        _initializeConditionTypeDropdown: function () {
            var conditionTypes = CrystalReportsUtility.getConditionTypes(this._reportMetadata);
            var data = {
                identifier: "conditionType",
                label: "caption",
                items: conditionTypes
            };
            var store = new ItemFileWriteStore({ data: data });
            this.cmbConditionType.setStore(store);
            this.cmbConditionType.startup();
        },
        /**
        * Creates the user lookup.
        **/
        _createUserLookup: function () {
            var lookupConfig = {
                id: '_lkpConditionUser',
                structure: [
                    {
                        cells:
                            [
                                {
                                    name: nlsResources.txtName,
                                    field: 'UserInfo.UserName',
                                    sortable: true,
                                    width: "400px",
                                    editable: false,
                                    propertyType: "System.String",
                                    excludeFromFilters: false,
                                    defaultValue: ""
                                }
                            ]
                    }
                ],
                gridOptions: {
                    contextualCondition: function () {
                        return 'Type ne 5 and Type ne 8 and Type ne 6';
                    },
                    contextualShow: '',
                    selectionMode: 'single'
                },
                storeOptions: {
                    resourceKind: 'users',
                    include: ['UserInfo'],
                    sort: [{ attribute: 'UserInfo.UserName' }]
                },
                isModal: true,
                preFilters: [],
                returnPrimaryKey: true,
                dialogTitle: nlsResources.txtSelectUser,
                dialogButtonText: nlsResources.txtOK
            };
            this.lkpUser = new Lookup({
                id: 'lkpConditionUser',
                readonly: false,
                config: lookupConfig
            });
            //dojo.connect(this.lkpUser, 'onChange', this, '_userChanged');
            dojo.place(this.lkpUser.domNode, this.contentPaneLkpUser.domNode, 'only');
        },
        /**
        * Creates the group lookup.
        **/
        _createGroupLookup: function () {
            var familyCondition = dojoString.substitute("upper(family) eq '${0}' or upper(family) eq '${1}'", [this._reportMetadata.family.toUpperCase(), this._reportMetadata.mainTable.toUpperCase()]);
            var groupLookupConfig = {
                id: '_lkpConditionGroup',
                structure: [
                    {
                        cells:
                            [
                                {
                                    name: nlsResources.txtName,
                                    field: 'displayName',
                                    sortable: true,
                                    width: "400px",
                                    editable: false,
                                    propertyType: "System.String",
                                    excludeFromFilters: false,
                                    defaultValue: ""
                                }
                            ]
                    }
                ],
                gridOptions: {
                    contextualCondition: function () {
                        return familyCondition;
                    },
                    contextualShow: '',
                    selectionMode: 'single'
                },
                storeOptions: {
                    resourceKind: 'groups',
                    include: [],
                    select: ['displayName', 'name', 'family'],
                    sort: [{ attribute: 'displayName', descending: false }],
                    service: SDataServiceRegistry.getSDataService('system', false, true, false)
                },
                isModal: true,
                preFilters: [],
                returnPrimaryKey: true,
                dialogTitle: nlsResources.txtSelectGroup,
                dialogButtonText: nlsResources.txtOK
            };
            this.lkpGroup = new Lookup({
                id: 'lkpConditionGroup',
                readonly: false,
                config: groupLookupConfig
            });
            //dojo.connect(this.lkpGroup, 'onChange', this, '_groupChanged');
            dojo.place(this.lkpGroup.domNode, this.contentPaneLkpGroup.domNode, 'only');
        },
        _getTableMetadata: function (tableAlias) {
            var tableMetadata = null;
            if (this._reportMetadata.tables) {
                dojoArray.some(this._reportMetadata.tables, function (entry, i) {
                    if (entry.alias === tableAlias) {
                        tableMetadata = entry;
                        return true;
                    }
                });
            }
            return tableMetadata;
        },
        _getFieldMetadata: function (tableAlias, fieldName) {
            var tableMetadata = this._getTableMetadata(tableAlias);
            var fieldMetadata = null;
            if (tableMetadata) {
                if (tableMetadata.fields) {
                    dojoArray.some(tableMetadata.fields, function (entry, i) {
                        if (entry.name == fieldName) {
                            fieldMetadata = entry;
                            return true;
                        }
                    });
                }
            }
            return fieldMetadata;
        },
        _getFieldDataType: function () {
            var tableAlias = this.cmbTables.value;
            var fieldName = this.cmbFields.value;
            var fieldMetadata = this._getFieldMetadata(tableAlias, fieldName);
            var fieldDataType = fieldMetadata && fieldMetadata.dataType ? fieldMetadata.dataType : null;
            return fieldDataType;
        },
        /**
        * Creates a DataStore for the tables dropdown.
        */
        _initializeTablesDropdown: function () {
            //console.log("_initializeTablesDropdown");
            //Needed to create a new "items" collection instead of using the existing this._reportMetadata.reportTables
            //Not sure why, but the datastore would not work properly when binding the store directly to this._reportMetadata.reportTables
            var items = [];
            if (this._reportMetadata.tables) {
                dojoArray.forEach(this._reportMetadata.tables, function (entry, i) {
                    items.push({ alias: entry.alias, displayName: entry.displayName });
                });
            }
            var data = {
                identifier: "alias",
                label: "displayName",
                items: items
            };
            var store = new ItemFileWriteStore({ data: data });
            this.cmbTables.setStore(store);
            this.cmbTables.startup();
        },
        /**
        * Creates a DataStore for the fields dropdown.
        */
        _initializeFieldsDropdown: function () {
            //console.log("_initializeFieldsDropdown");
            var tableAlias = this.cmbTables.value;
            var tableMetadata = this._getTableMetadata(tableAlias);
            var reportFields = tableMetadata && tableMetadata.fields ? tableMetadata.fields : [];
            //Needed to create a new "items" collection instead of using the existing tableMetadata.fields
            //Not sure why, but the datastore would not work properly when binding the store directly to tableMetadata.fields
            var items = [];
            dojoArray.forEach(reportFields, function (entry, i) {
                items.push({ name: entry.name, displayName: entry.displayName });
            });
            var data = {
                identifier: "name",
                label: "displayName",
                items: items
            };
            var store = new ItemFileWriteStore({ data: data });
            this.cmbFields.setStore(store);
            this.cmbFields.startup();

            if (this._entity) {
                this.cmbFields.attr('value', this._entity.field);
            }
        },
        /**
        * Creates a DataStore for the operators dropdown.
        */
        _initializeOperatorsDropdown: function () {
            //console.log("_initializeOperatorsDropdown");
            var fieldType = this._getFieldDataType();
            var operators = ReportManagerUtility.getOperators(fieldType);
            var data = {
                identifier: "operator",
                label: "caption",
                items: operators
            };
            var store = new ItemFileWriteStore({ data: data });
            this.cmbOperators.setStore(store);
            this.cmbOperators.startup();

            if (this._entity) {
                this.cmbOperators.attr('value', this._entity.operator);
            }
        },
        _save: function () {

            if (!this._entity) {
                this._entity = {
                    conditionType: this.cmbConditionType.value,
                    tableName: null,
                    fieldName: null,
                    operator: null,
                    value: null,
                    fromValue: null,
                    toValue: null,
                    dataType: null,
                    tag: null
                };
            }

            //Clear values from the entity
            this._entity.conditionType = this.cmbConditionType.value;
            this._entity.table = null;
            this._entity.field = null;
            this._entity.operator = null;
            this._entity.value = null;
            this._entity.fromRange = null;
            this._entity.toRange = null;
            this._entity.dataType = null;
            this._entity.tag = null;

            //Set entity values according to the UI
            switch (this.cmbConditionType.value) {
                case Enumerations.ReportConditionType.Group:
                    var group = this.lkpGroup.get('selectedObject');
                    this._entity.value = group.family + ":" + group.name;
                    this._entity.tag = group.$key;
                    this._entity.operator = String(Enumerations.ReportConditionOperator.Is);
                    this._entity.dataType = Enumerations.FieldDataTypes.String;
                    break;
                case Enumerations.ReportConditionType.DateRange:
                    this._entity.dataType = Enumerations.FieldDataTypes.DateTime;
                    if (this.cmbDateRange.value === "DateRange") {
                        this._entity.operator = String(Enumerations.ReportConditionOperator.IsInTheRange);
                        this._entity.value = null;
                        this._entity.fromRange = this.dtFromDate.get('value');
                        this._entity.toRange = this.dtToDate.get('value');
                    }
                    else {
                        this._entity.operator = String(Enumerations.ReportConditionOperator.Is);
                        this._entity.value = this.cmbDateRange.value;
                    }
                    break;
                case Enumerations.ReportConditionType.User:
                    if (this.chkCurrentUser.checked) {
                        this._entity.value = nlsResources.chkCurrentUser_Caption;
                        this._entity.tag = ':UserID';
                    }
                    else {
                        var user = this.lkpUser.get('selectedObject');
                        this._entity.value = user.$descriptor;
                        this._entity.tag = user.$key;
                    }
                    this._entity.operator = String(Enumerations.ReportConditionOperator.Is);
                    this._entity.dataType = Enumerations.FieldDataTypes.String;
                    break;
                case Enumerations.ReportConditionType.Query:
                    var operator = this.cmbOperators.value;
                    this._entity.table = this.cmbTables.value;
                    this._entity.field = this.cmbFields.value;
                    this._entity.operator = operator;
                    var fieldDataType = this._getFieldDataType();
                    this._entity.dataType = fieldDataType;
                    switch (fieldDataType) {
                        case Enumerations.FieldDataTypes.Numeric:
                            if (operator == Enumerations.ReportConditionOperator.IsInTheRange) {
                                this._entity.fromRange = parseInt(this.txtNumericValue1.focusNode.textbox.value);//todo: check future implementation of get('value')
                                this._entity.toRange = parseInt(this.txtNumericValue2.focusNode.textbox.value);//todo: check future implementation of get('value')
                            }
                            else {
                                this._entity.value = parseInt(this.txtNumericValue1.focusNode.textbox.value);//todo: check future implementation of get('value')
                            }
                            break;
                        case Enumerations.FieldDataTypes.DateTime:
                            if (operator == Enumerations.ReportConditionOperator.IsInTheRange) {
                                this._entity.fromRange = this.dtDateValue1.get('value');
                                this._entity.toRange = this.dtDateValue2.get('value');
                            }
                            else {
                                this._entity.value = this.dtDateValue1.get('value');
                            }
                            break;
                        case Enumerations.FieldDataTypes.String:
                            this._entity.value = this.txtStringValue1.get('value');
                            break;
                        default:
                            console.error("Unsupported field type: " + fieldDataType);
                    }
                    break;
                default:
                    console.error("Unsupported condition type: " + this.cmbConditionType.value);
            }
            if (this._mode === 'new') {
                topic.publish("/reportManager/reportWizard/createCondition", this._entity);
            }
            else {
                topic.publish("/reportManager/reportWizard/updateCondition", this._entity);
            }
            this._closeDialog();
        },
        _setQueryControlsVisibility: function () {
            ReportManagerUtility.setDomNodeVisible(this.trStringValue1, false);
            ReportManagerUtility.setDomNodeVisible(this.trStringValue2, false);
            ReportManagerUtility.setDomNodeVisible(this.trNumericValue1, false);
            ReportManagerUtility.setDomNodeVisible(this.trNumericValue2, false);
            ReportManagerUtility.setDomNodeVisible(this.trDateValue1, false);
            ReportManagerUtility.setDomNodeVisible(this.trDateValue2, false);
            if (this.cmbConditionType.value !== Enumerations.ReportConditionType.Query) {
                return;
            }
            var fieldDataType = this._getFieldDataType();
            var operator = this.cmbOperators.value;
            switch (fieldDataType) {
                case Enumerations.FieldDataTypes.Numeric:
                    this.lblNumericValue1.innerHTML = this._nlsResources.txtValue_Caption + ":";
                    ReportManagerUtility.setDomNodeVisible(this.trNumericValue1, true);
                    if (operator == Enumerations.ReportConditionOperator.IsInTheRange) {
                        this.lblNumericValue1.innerHTML = this._nlsResources.txtNumericValueFrom_Caption + ":";
                        ReportManagerUtility.setDomNodeVisible(this.trNumericValue2, true);
                    }
                    break;
                case Enumerations.FieldDataTypes.DateTime:
                    ReportManagerUtility.setDomNodeVisible(this.trDateValue1, true);
                    if (operator == Enumerations.ReportConditionOperator.IsInTheRange) {
                        ReportManagerUtility.setDomNodeVisible(this.trDateValue2, true);
                    }
                    break;
                case Enumerations.FieldDataTypes.String:
                    ReportManagerUtility.setDomNodeVisible(this.trStringValue1, true);
                    break;
                default:
                    this._initializeFieldsDropdown();
                    this._initializeOperatorsDropdown();
                    ReportManagerUtility.setDomNodeVisible(this.trStringValue1, true);
            }
        }
    });
    return crystalReportConditionEditor;
});