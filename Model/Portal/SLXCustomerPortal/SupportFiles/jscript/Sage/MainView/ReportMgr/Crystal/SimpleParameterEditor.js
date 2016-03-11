/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'Sage/MainView/ReportMgr/Crystal/ParameterHeaderWidget',
    'dojo/text!./templates/SimpleParameterEditor.html',
    'Sage/MainView/ReportMgr/Crystal/_ParameterEditorBase',
    'Sage/MainView/ReportMgr/ReportManagerUtility',
    'Sage/MainView/ReportMgr/Crystal/CrystalReportsUtility',
    'Sage/Utility',
    'Sage/Reporting/Enumerations',
    'dojo/string',
    'dojo/number',
    'dojo/currency',
    'Sage/UI/Controls/Currency',
    'Sage/UI/Controls/TextBox',
    'Sage/MainView/ReportMgr/Crystal/ParameterRangeWidget'
],
function (
    declare,
    dojoArray,
    ParameterHeaderWidget,
    template,
    _ParameterEditorBase,
    reportManagerUtility,
    crystalReportsUtility,
    utility,
    enumerations,
    dojoString,
    dojoNumber,
    dojoCurrency,
    slxCurrency,
    slxTextBox,
    ParameterRangeWidget
) {
    var __widgetTemplate = utility.makeTemplateFromString(template);
    /**
    * Declare the SimpleParameterEditor class.
    * @constructor
    */
    var simpleParameterEditor = declare('Sage.MainView.ReportMgr.Crystal.SimpleParameterEditor', [_ParameterEditorBase], {
        widgetTemplate: __widgetTemplate,
        isNumeric: false,
        isCurrency: false,
        txtCustomValue: null,
        parameterRangeWidget: null,
        _setValueAttr: function (value) {
            this._set("value", value);
        },
        _getValueAttr: function () {
            this._promptParameter.currentValues = [];
            var option;
            if (this._paramRangeType) {
                var range = this.parameterRangeWidget.getRangeValue();
                option = { range: range, displayValue: range.displayValue, value: range.startValue ? range.startValue : range.endValue };
                this._promptParameter.currentValues.push(this._getParameterValue(option));
            } else {
                var currentValue = this._getCurrentValue();
                if (currentValue) {
                    var parameterValue = this._getParameterValue(currentValue);
                    this._promptParameter.currentValues.push(parameterValue);
                }
            }
            return this._promptParameter;
        },
        /**
        * SimpleParameterEditor class constructor.
        * @constructor
        * @param {Object} promptParameter - Parameter to be edited
        */
        constructor: function (promptParameter) {
            //Note that the base class constructor is automatically called prior to this.
            //Add initialization of internal properties here.
        },
        /**
        * This is a last method in the initialization process. 
        * It is called after all the child widgets are rendered so it's good for a container widget to finish it's post rendering here. 
        * This is where the container widgets could for example set sizes of their children relative to it's own size.
        */
        startup: function () {
            if (this._started) return;

            this.inherited(arguments);
            reportManagerUtility.setDomNodeVisible(this.divValidationMessage, false);
            this.isNumeric = (this.parameterValueKind === enumerations.SlxParameterValueKind.NumberParameter);
            this.isCurrency = (this.parameterValueKind === enumerations.SlxParameterValueKind.CurrencyParameter);
            var parameterHeaderWidget = new ParameterHeaderWidget({
                promptText: this._promptParameter.promptText,
                parameterFieldName: this._promptParameter.parameterFieldName
            }).placeAt(this.paramsHeaderContainer);

            if (this._paramRangeType) {
                this.parameterRangeWidget = new ParameterRangeWidget({
                    paramInitialIds: this._initialIds,
                    paramInitialValues: this._initialValues,
                    paramValues: this._values,
                    defaultValues: this._promptParameter.defaultValues,
                    parameterValueKind: this._promptParameter.parameterValueKind,
                    allowCustomValues: this._allowCustomValues,
                    parameterPageId: this.paramId,
                    isAttachedToTransbox: false
                }, "parameterRangeWidget");
                this.parameterRangeWidget.placeAt(this.parameterRangeWidgetContainer);
                reportManagerUtility.setDomNodeVisible(this.rowParameterRange, true);
            } else {
                if (this._values.length > 0) {
                    reportManagerUtility.setDomNodeVisible(this.rowSingleValue, true);
                    crystalReportsUtility.initializeComboBoxValues(this._values, crystalReportsUtility.getRangeInitialValue(this._initialValues, false), this.cmbValues);
                    this.connect(this.cmbValues, 'onBlur', this._onComboBoxChange, true);
                }
                reportManagerUtility.setDomNodeVisible(this.rowCustomValues, this._values.length === 0 || this._allowCustomValues);


                //create the custom field and attach all events that need to associate with it.
                var inputId = dojoString.substitute("customControl_${id}", { id: this.paramId });
                this.customValueField = crystalReportsUtility.createCustomParameterInputControl(inputId, this.customValueContainer, this);
                this.txtCustomValue = crystalReportsUtility.getCustomParameterInputField(inputId, this.isCurrency, this.customValueField);
                if (this.isCurrency) {
                    dojo.attr(this.customValueField, 'style', "width:105% !important;");
                }
                else {
                    dojo.attr(this.customValueField, 'style', "width:110% !important;");
                }

                this.connect(this.customValueField, 'onBlur', this._onCustomChange, true);

                //subscribe to the parameter control destroy call that will be made in CrystalReportParametersDialog during the destroy phase.
                this.subscribe("entity/report/parameters/control/destroy", function (data) {
                    if (data) {
                        if (data.id.indexOf("Simple") > -1) {
                            data._destroyObject();
                        }
                    }
                });
            }

            reportManagerUtility.setDomNodeVisible(this.rowOrEnterValue, (this._allowCustomValues && this._values.length > 0 && !this._paramRangeType));

            this._initializeMessages();
        },
        _onKeyPress: function (e) {
            if (!utility.restrictToNumberOnKeyPress(e, 'number')) {
                dojo.stopEvent(e);
            }
        },
        _onCustomChange: function () {
            if (dojo.attr(this.txtCustomValue, 'value') !== "") {
                this.cmbValues.set('displayedValue', '');
            }
        },
        _onComboBoxChange: function () {
            var item = this.cmbValues.item;
            if (item && item.value !== "") {
                dojo.attr(this.txtCustomValue, 'value', "");
                dojo.attr(this.customValueField, 'displayedValue', "");
            }
        },
        isValid: function () {
            var msg = "";
            if (!this._promptParameter.isOptionalPrompt && !this._promptParameter.allowNullValue) {
                if (this._paramRangeType) {
                    if (!this.parameterRangeWidget.verifyRequiredAssignments()) {
                        msg = this.txtPleaseSpecifyValue;
                    } else if (!this.parameterRangeWidget.validateRangeWithinBoundaries()) {
                        msg = this.txtFromMustBeLessThanOrEqualToTo;
                    }
                } else {
                    var currentValue = this._getCurrentValue();
                    if (currentValue === null) {
                        msg = this.txtPleaseSpecifyValue;
                    }
                    else {
                        var value = this.isNumeric ? currentValue : currentValue.length;
                        msg = this.getMinMaxValidationMessage(value);

                        if (msg.length === 0 && this.isCurrency) {
                            msg = this.customValueField._supportingWidgets[0].message;
                        }
                    }
                }
            }
            this._showValidationMessage(msg);
            return msg === "";
        },
        _initializeMessages: function () {
            var minMaxMessage = this.getMinMaxInitializationMessage();
            this.spanMinMaxMessage.innerHTML = utility.htmlEncode(minMaxMessage);
            reportManagerUtility.setDomNodeVisible(this.divMinMaxMessage, (minMaxMessage !== ""));
        },
        _showValidationMessage: function (msg) {
            this.spanValidationMessage.innerHTML = utility.htmlEncode(msg);
            reportManagerUtility.setDomNodeVisible(this.divValidationMessage, (msg !== ""));
            reportManagerUtility.setDomNodeVisible(this.errorEndRange, (msg !== ""));
            reportManagerUtility.setDomNodeVisible(this.errorCustomValue, (msg !== ""));
            if (msg !== "" && !this._paramRangeType) {
                if (this._values.length > 0) {
                    this.cmbValues.focus();
                } else {
                    this.txtCustomValue.focus();
                }
            }
        },
        _getCurrentValue: function () {
            var value = null;
            var display = null;
            if (dojo.attr(this.txtCustomValue, 'value') !== "") {
                if (this.isNumeric) {
                    value = dojoNumber.parse(dojo.attr(this.txtCustomValue, 'value'));
                }
                else if (this.isCurrency) {
                    value = this.txtCustomField._supportingWidgets[0].value;
                    display = this.txtCustomField._supportingWidgets[0].displayedValue;
                }
                else {
                    value = dojo.attr(this.txtCustomValue, 'value');
                }

                return { value: value, displayValue: display ? display : value };
            } else {
                var selectedItem = this.cmbValues.item;
                if (selectedItem && selectedItem.value !== "") {
                    if (this.isNumeric) {
                        value = dojoNumber.parse(selectedItem.value);
                    }
                    else {
                        value = selectedItem.value;
                    }
                    //value = this.isNumeric ? dojoNumber.parse(selectedItem.value) : (this.isCurrency ? parseFloat(selectedItem.value.replace(Sys.CultureInfo.CurrentCulture.numberFormat.CurrencySymbol, '')) : selectedItem.value);
                    return { value: value, displayValue: selectedItem.description };
                }
            }
            return value;
        },
        _getParameterValue: function (option) {
            var parameter;
            if (option.range) {
                parameter = {
                    className: enumerations.ParameterClassName.RangeValue,
                    description: option.displayValue,
                    rangeValue: {
                        beginValue: option.range.startValue, //dojoNumber.parse(option.range.startValue.replace(/\D/g, '')),
                        beginValueType: this.beginValueType,
                        endValue: option.range.endValue, //.parse(option.range.endValue.replace(/\D/g, '')),
                        endValueType: this.endValueType,
                        lowerBoundType: option.range.noLowerValue ? enumerations.SlxRangeBoundType.NoBound : option.range.includeFromRange ? enumerations.SlxRangeBoundType.BoundInclusive : enumerations.SlxRangeBoundType.BoundExclusive,
                        upperBoundType: option.range.noUpperValue ? enumerations.SlxRangeBoundType.NoBound : option.range.includeToRange ? enumerations.SlxRangeBoundType.BoundInclusive : enumerations.SlxRangeBoundType.BoundExclusive
                    }
                };
            } else {
                parameter = {
                    className: "CrystalReports.ParameterFieldDiscreteValue",
                    computedText: this.isNumeric ? null : '\"' + option.value + '\"',
                    description: option.displayValue, //this.isNumeric ? null : option.value,
                    discreteValue: {
                        actualValue: option.value,
                        actualValueType: this.actualValueType,
                        value: option.value,
                        valueType: this.valueType
                    }
                };
            }
            return parameter;
        },
        _destroyObject: function () {
            if (this.customValueField) {
                this.customValueField.destroyRecursive();
            }
            if (this.parameterRangeWidget) {
                dojo.publish("entity/report/parameters/control/destroy", [this.parameterRangeWidget, this]);
            }
        }
    });
    return simpleParameterEditor;
});