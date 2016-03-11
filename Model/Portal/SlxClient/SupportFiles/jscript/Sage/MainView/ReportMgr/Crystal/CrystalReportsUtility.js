/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/date/locale',
    'dojo/i18n!./nls/CrystalReportsUtility',
    'Sage/UI/Controls/Currency',
    'Sage/UI/Controls/TextBox',
    'dojo/string',
    'Sage/Reporting/Enumerations',
    'Sage/MainView/ReportMgr/ReportManagerUtility',
    'dojo/_base/array',
    'dojo/store/Memory'
],
function (
    locale,
    nlsResources,
    slxCurrency,
    slxTextBox,
    dojoString,
    enumerations,
    ReportManagerUtility,
    dojoArray,
    Memory
) {
    Sage.namespace('Sage.MainView.ReportMgr.Crystal.CrystalReportsUtility');
    dojo.mixin(Sage.MainView.ReportMgr.Crystal.CrystalReportsUtility, {
        _nlsResources: nlsResources,
        getConditionTypes: function (report) {
            var conditionTypes = [];
            if (report) {
                if (report.useDateFilter) {
                    conditionTypes.push({
                        conditionType: enumerations.ReportConditionType.DateRange,
                        caption: enumerations.getReportConditionTypeCaption(enumerations.ReportConditionType.DateRange)
                    });
                }
                if (report.useGroupFilter) {
                    conditionTypes.push({
                        conditionType: enumerations.ReportConditionType.Group,
                        caption: enumerations.getReportConditionTypeCaption(enumerations.ReportConditionType.Group)
                    });
                }
                conditionTypes.push({
                    conditionType: enumerations.ReportConditionType.Query,
                    caption: enumerations.getReportConditionTypeCaption(enumerations.ReportConditionType.Query)
                });
                if (report.useUserFilter) {
                    conditionTypes.push({
                        conditionType: enumerations.ReportConditionType.User,
                        caption: enumerations.getReportConditionTypeCaption(enumerations.ReportConditionType.User)
                    });
                }
            }
            return conditionTypes;
        },
        getCurrentEntityCondition: function () {
            var condition = null;
            var entityContext = ReportManagerUtility.getCurrentEntityContext();
            if (entityContext && entityContext.EntityTableName && entityContext.EntityId) {
                //Note that it is assumed that the keyfield has the form tablenameid. 
                //This holds true for most regular entities such as account, contact, opportunity, etc.
                var keyField = entityContext.EntityTableName.toUpperCase() + "ID";
                condition = {
                    conditionType: enumerations.ReportConditionType.Query,
                    table: entityContext.EntityTableName.toUpperCase(),
                    field: keyField,
                    operator: enumerations.ReportConditionOperator.Is,
                    value: entityContext.EntityId,
                    fromRange: null,
                    toRange: null,
                    dataType: enumerations.FieldDataTypes.String,
                    tag: null
                };
            }
            return condition;
        },
        /*
            Creates the custom inputs for the report parameters. Currency requires a separate control.

            @param {String} inputId - will become the id for the control.
            @param {Object} customValueContainer - the container that will hold the control.
            @param {Object} pWidget - the report parameter widget that holds the container.
        */
        createCustomParameterInputControl: function (inputId, customValueContainer, pWidget) {
            var customValueField = null;
            if (pWidget.isCurrency) {
                customValueField = new slxCurrency({
                    style: 'width:95%',
                    id: inputId,
                    constraints: { currency: '' },
                    value: ""
                });

            }
            else {
                customValueField = new slxTextBox({
                    style: 'width:90%',
                    id: inputId
                });
            }

            dojo.place(customValueField.domNode, customValueContainer, 'only');

            if (pWidget.isNumeric) {
                pWidget.connect(customValueField, 'onKeyPress', pWidget._onKeyPress, true);
            }
            return customValueField;
        },
        /*
            Gets the input from the input container.
            - intended to be used in conjuncture with the createCustomParameterInputControl method.
                 -- the customValueField is to be what createCustomParameterInputControl returns.
                 -- the inputId is to be the same as the one provided to createCustomParameterInputControl.

            @param {String} inputId - the id of the input we are trying to get
            @param {boolean} isCurrency - wheither we are dealing with currency or not
            @param {Object} customValueField - the input container we want to search in for an input.
        */
        getCustomParameterInputField: function (/*String*/inputId,/*boolean*/isCurrency,/*CustomParameterInputControl*/customValueField) {
            var result = null;
            if (isCurrency) {
                inputId = dojoString.substitute("${id}_CurrencyTextBox", { id: inputId });
            }

            var strQry = dojoString.substitute("input#${id}.dijitReset.dijitInputInner", { id: inputId });

            if (customValueField) {
                result = dojo.query(strQry, customValueField.domNode);
            }
            else {
                result = dojo.query(strQry);
            }

            if (result.length > 0) {
                return result[0];
            }
            return null;
        },
        getCurrentUserCondition: function () {
            var condition = {
                conditionType: enumerations.ReportConditionType.User,
                table: null,
                field: null,
                operator: enumerations.ReportConditionOperator.Is,
                value: nlsResources.txtCurrentUser,
                fromRange: null,
                toRange: null,
                dataType: enumerations.FieldDataTypes.String,
                tag: ':UserID'
            };
            return condition;
        },
        getDateOnlyFormattedDate: function (dateValue) {
            return locale.format(dateValue, { selector: 'date', fullYear: true });
        },
        initializeComboBoxValues: function (values, initialValue, comboBox) {
            var dataStore = new Memory({
                identifier: "id",
                name: 'description',
                value: 'value',
                data: values
            });
            comboBox.set('store', dataStore);
            comboBox.set('searchAttr', 'description');
            comboBox.set('value', '_id');
            comboBox.set('maxHeight', '150');
            comboBox.set('required', false);

            if (initialValue !== "") {
                dojoArray.some(values, function (entry, i) {
                    if (entry.value == initialValue) {
                        comboBox.set('displayedValue', entry.description);
                        return true;
                    }
                });
            } else {
                comboBox.set('displayedValue', '');
            }
        },
        getRangeInitialValue: function (initialValues, startValue) {
            var value = "";
            if (initialValues && initialValues.length > 0) {
                var initialValue = initialValues[0];
                if (initialValue.parameterClass === enumerations.SlxParameterValueRangeKind.Discrete) {
                    value = initialValue.value;
                } else {
                    if (startValue) {
                        value = initialValue.value.beginValue;
                    } else {
                        value = initialValue.value.endValue;
                    }
                }
            }
            return value;
        }
    });
    return Sage.MainView.ReportMgr.Crystal.CrystalReportsUtility;
});