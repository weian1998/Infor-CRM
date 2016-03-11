/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dijit/_Widget',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/text!./templates/ParameterRangeWidget.html',
    'Sage/MainView/ReportMgr/ReportManagerUtility',
    'dojo/i18n!./nls/_ParameterEditorBase',
    'Sage/MainView/ReportMgr/Crystal/CrystalReportsUtility',
    'dojo/string',
    'dojo/currency',
    'Sage/UI/Controls/Currency',
    'Sage/UI/Controls/TextBox',
    'Sage/Reporting/Enumerations',
    'Sage/Utility'
],
function (declare, dojoArray, _Widget, _TemplatedMixin, _WidgetsInTemplateMixin, parameterRangeTemplate, reportManagerUtility,
    baseStrings, crystalReportsUtility, dojoString, dojoCurrency, slxCurrency, slxTextBox, enumerations, utility) {
    var parameterRangeWidget = declare('Sage.MainView.ReportMgr.Crystal.ParameterRangeWidget', [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: parameterRangeTemplate,
        paramInitialIds: null,
        paramValues: null,
        defaultValues: null,
        paramInitialValues: null,
        parameterPageId: null,
        isNumeric: false,
        isCurrency: false,
        txtStartCustomValue: null,
        txtEndCustomValue: null,
        customStartValueField: null,
        customEndValueField: null,
        parameterValueKind: enumerations.SlxParameterValueKind.StringParameter,
        allowCustomValues: false,
        hasParamValues: false,
        isAttachedToTransbox: false,
        postMixInProperties: function () {
            dojo.mixin(this, baseStrings);
        },
        postCreate: function () {
            this.inherited(arguments);
            this.chkIncludeFromRange.set('checked', true);
            this.chkIncludeToRange.set('checked', true);
            this._initializeStartRangeValues();
        },
        verifyRequiredAssignments: function () {
            var startValue = this._getValue(this._SafelyGetStartValue(), this.cboStartRangeValues.item);
            var endValue = this._getValue(this._SafelyGetEndValue(), this.cboEndRangeValues.item);
            if (this.chkNoUpperValue.checked) {
                if (startValue.displayValue) {
                    this._removeErrorMessages();
                    return true;
                } else {
                    this.cboStartRangeValues.focus();
                    dojo.removeClass(this.hasParamValues ? this.errorStartRange : this.errorStartCustomValue, 'display-none');
                    dojo.addClass(this.hasParamValues ? this.errorEndRange : this.errorEndCustomValue, 'display-none');
                }
                return false;
            }
            if (this.chkNoLowerValue.checked) {
                if (endValue.displayValue) {
                    this._removeErrorMessages();
                    return true;
                } else {
                    this.cboEndRangeValues.focus();
                    dojo.addClass(this.hasParamValues ? this.errorStartRange : this.errorStartCustomValue, 'display-none');
                    dojo.removeClass(this.hasParamValues ? this.errorEndRange : this.errorEndCustomValue, 'display-none');
                }
                return false;
            }
            if (!startValue.displayValue || !endValue.displayValue) {
                this._setRangeErrorMessageVisibility(startValue.displayValue, endValue.displayValue);
                return false;
            }

            else {
                dojo.addClass(this.hasParamValues ? this.errorStartRange : this.errorStartCustomValue, 'display-none');
                dojo.addClass(this.hasParamValues ? this.errorEndRange : this.errorEndCustomValue, 'display-none');
                return true;
            }
        },
        /*
            propagates error messages found in the sub-controls up to the widget level to be displayed during validation.
            
            @returns {string} a blank string("") if no messages were found, if a message is found then that is returned.
        */
        validateBasedOnSubContainers: function () {
            if (this.isCurrency) {
                if (this.customEndValueField._supportingWidgets[0] && this.customEndValueField._supportingWidgets[0].state === "Error") {
                    return this.customEndValueField._supportingWidgets[0].message;
                }
                if (this.customStartValueField._supportingWidgets[0] && this.customStartValueField._supportingWidgets[0].state === "Error") {
                    return this.customStartValueField._supportingWidgets[0].message;
                }
            }
            return "";
        },
        validateRangeWithinBoundaries: function () {
            //no need to validate anything if there is no upper and lower value
            if (!this.chkNoUpperValue.checked && !this.chkNoLowerValue.checked) {
                var startValue = this._getValue(this._SafelyGetStartValue(), this.cboStartRangeValues.item);
                var endValue = this._getValue(this._SafelyGetEndValue(), this.cboEndRangeValues.item);

                switch (this.parameterValueKind) {
                    case enumerations.SlxParameterValueKind.NumberParameter:
                        {
                            if (parseInt(startValue.value) > parseInt(endValue.value)) {
                                dojo.removeClass(this.hasParamValues ? this.errorEndRange : this.errorEndCustomValue, 'display-none');
                                return false;
                            }
                            break;
                        }
                    case enumerations.SlxParameterValueKind.CurrencyParameter:
                        {
                            if (parseFloat(startValue.value) > parseFloat(endValue.value)) {
                                dojo.removeClass(this.hasParamValues ? this.errorEndRange : this.errorEndCustomValue, 'display-none');
                                return false;
                            }
                            break;
                        }
                    default:
                        {
                            if (startValue.value.toUpperCase() > endValue.value.toUpperCase()) {
                                dojo.removeClass(this.hasParamValues ? this.errorEndRange : this.errorEndCustomValue, 'display-none');
                                return false;
                            }
                            break;
                        }
                }
            }
            return true;
        },
        getRangeValue: function () {
            var startValue = this._getValue(dojo.attr(this.txtStartCustomValue, 'value'), this.cboStartRangeValues.item);
            var endValue = this._getValue(dojo.attr(this.txtEndCustomValue, 'value'), this.cboEndRangeValues.item);
            var range = [];
            if (!this.chkNoLowerValue.get('checked') && !this.chkNoUpperValue.get('checked')) {
                range = { startValue: startValue.value, endValue: endValue.value, displayValue: dojoString.substitute("[${0} .. ${1}]", [startValue.displayValue, endValue.displayValue]) };
            } else if (this.chkNoLowerValue.get('checked')) {
                range = { startValue: null, endValue: endValue.value, displayValue: dojoString.substitute("( .. ${0}]", [endValue.displayValue]) };
            } else {
                range = { startValue: startValue.value, endValue: null, displayValue: dojoString.substitute("[${0} .. )", [startValue.displayValue]) };
            }
            range.noLowerValue = this.chkNoLowerValue.checked;
            range.noUpperValue = this.chkNoUpperValue.checked;
            range.includeFromRange = this.chkIncludeFromRange.checked;
            range.includeToRange = this.chkIncludeToRange.checked;
            return range;
        },
        _SafelyGetStartValue: function () {
            var val = '';

            // If this field is null, then try to set it again.
            if (!this.txtStartCustomValue) {
                this.txtStartCustomValue = crystalReportsUtility.getCustomParameterInputField(dojoString.substitute("startControl_${id}", { id: this.parameterPageId }), this.isCurrency, this.customStartValueField);
            }

            // make sure there is a value
            if (this.txtStartCustomValue && this.txtStartCustomValue.value) {
                val = dojo.attr(this.txtStartCustomValue, 'value');
            }
            return val;
        },
        _SafelyGetEndValue: function () {
            var val = '';

            // If this field is null, then try to set it again.
            if (!this.txtEndCustomValue) {
                this.txtEndCustomValue = crystalReportsUtility.getCustomParameterInputField(dojoString.substitute("endControl_${id}", { id: this.parameterPageId }), this.isCurrency, this.customEndValueField);
            }

            // make sure there is a value
            if (this.txtEndCustomValue && this.txtEndCustomValue.value) {
                val = dojo.attr(this.txtEndCustomValue, 'value');
            }

            return val;
        },
        _initializeStartRangeValues: function () {
            this.isCurrency = (this.parameterValueKind === enumerations.SlxParameterValueKind.CurrencyParameter);
            this.isNumeric = (this.parameterValueKind === enumerations.SlxParameterValueKind.NumberParameter);
            reportManagerUtility.setDomNodeVisible(this.rowStartEndCustomValue, this.allowCustomValues);
            //no need to display or initialize the combo boxes if no values exist
            this.hasParamValues = this.paramValues.length > 0;

            //create the custom fields and attach all events that need to associate with them.
            var inputId = dojoString.substitute("startControl_${id}", { id: this.parameterPageId });
            this.customStartValueField = crystalReportsUtility.createCustomParameterInputControl(inputId, this.startCustomValueContainer, this);
            this.txtStartCustomValue = crystalReportsUtility.getCustomParameterInputField(inputId, this.isCurrency, this.customStartValueField);

            inputId = dojoString.substitute("endControl_${id}", { id: this.parameterPageId });
            this.customEndValueField = crystalReportsUtility.createCustomParameterInputControl(inputId, this.endCustomValueContainer, this);
            this.txtEndCustomValue = crystalReportsUtility.getCustomParameterInputField(inputId, this.isCurrency, this.customEndValueField);


            if (this.hasParamValues) {
                crystalReportsUtility.initializeComboBoxValues(this.paramValues, this.isAttachedToTransbox ? "" : crystalReportsUtility.getRangeInitialValue(this.paramInitialValues, true), this.cboStartRangeValues);

                dojo.connect(this.cboStartRangeValues, 'onBlur', this, '_startRangeValue_OnChange', true);
                if (this.isCurrency) {
                    dojo.connect(this.customStartValueField._supportingWidgets[0], 'onChange', this, '_txtStartCustomValue_OnChange', true);
                }
                else {
                    dojo.connect(this.customStartValueField.domNode, 'onChange', this, '_txtStartCustomValue_OnChange', true);
                }

                crystalReportsUtility.initializeComboBoxValues(this.paramValues, this.isAttachedToTransbox ? "" : crystalReportsUtility.getRangeInitialValue(this.paramInitialValues, false), this.cboEndRangeValues);

                dojo.connect(this.cboEndRangeValues, 'onBlur', this, '_endRangeValue_OnChange', true);
                if (this.isCurrency) {
                    dojo.connect(this.customEndValueField._supportingWidgets[0], 'onChange', this, '_txtEndCustomValue_OnChange', true);
                }
                else {
                    dojo.connect(this.customEndValueField.domNode, 'onChange', this, '_txtEndCustomValue_OnChange', true);
                }
            }
            reportManagerUtility.setDomNodeVisible(this.rowStartEndRangeValues, this.hasParamValues);
            reportManagerUtility.setDomNodeVisible(this.rowStartEndRangeLabels, this.hasParamValues);
            reportManagerUtility.setDomNodeVisible(this.rowStartEndOrValue, this.allowCustomValues && this.hasParamValues);

            //subscribe to the parameter control destroy call that will be made in CrystalReportParametersDialog during the destroy phase.
            dojo.subscribe("entity/report/parameters/control/destroy", function (data) {
                if (data) {
                    if (data.id.indexOf("Range") > -1) {
                        data._destroyObject();
                    } else if (data.parameterRangeWidget) {
                        data.parameterRangeWidget._destroyObject();
                    }
                }
            });

            this._assignDefaultRangeValues();
        },
        _assignDefaultRangeValues: function () {
            if (this.paramInitialValues.length === 1) {
                if (this.paramInitialValues[0].value) {
                    var currentValue = this.paramInitialValues[0];
                    if (currentValue.value.lowerBoundType) {

                        //From date
                        this.chkIncludeFromRange.set('checked', (currentValue.value.lowerBoundType === enumerations.SlxRangeBoundType.BoundInclusive));
                        this.chkNoLowerValue.set('checked', (currentValue.value.beginValue === null));
                        //To date
                        this.chkIncludeToRange.set('checked', (currentValue.value.upperBoundType === enumerations.SlxRangeBoundType.BoundInclusive));
                        this.chkNoUpperValue.set('checked', (currentValue.value.endValue === null));
                    }
                }
            }
        },
        _onKeyPress: function (e) {
            if (!utility.restrictToNumberOnKeyPress(e, 'number')) {
                dojo.stopEvent(e);
            }
        },
        _chkNoLowerValue_OnCheck: function (isChecked) {
            this.chkIncludeFromRange.setAttribute("disabled", isChecked);
            this.cboStartRangeValues.setAttribute("disabled", isChecked);
            this.txtStartCustomValue.setAttribute("disabled", isChecked);
            this.chkNoUpperValue.setAttribute("disabled", isChecked);
        },
        _chkNoUpperValue_OnCheck: function (isChecked) {
            this.chkIncludeToRange.setAttribute("disabled", isChecked);
            this.cboEndRangeValues.setAttribute("disabled", isChecked);
            this.txtEndCustomValue.setAttribute("disabled", isChecked);
            this.chkNoLowerValue.setAttribute("disabled", isChecked);
        },
        _startRangeValue_OnChange: function () {
            var item = this.cboStartRangeValues.item;
            if (item && item.value !== "") {
                dojo.attr(this.txtStartCustomValue, 'value', "");
                dojo.attr(this.customStartValueField, 'displayedValue', "");
            }
        },
        _txtStartCustomValue_OnChange: function () {
            if (dojo.attr(this.txtStartCustomValue, 'value') !== "") {
                this.cboStartRangeValues.set('displayedValue', '');
            }
        },
        _endRangeValue_OnChange: function () {
            var item = this.cboEndRangeValues.item;
            if (item && item.value !== "") {
                dojo.attr(this.txtEndCustomValue, 'value', "");
                dojo.attr(this.customEndValueField, 'displayedValue', "");
            }
        },
        _txtEndCustomValue_OnChange: function () {
            if (dojo.attr(this.txtEndCustomValue, 'value') !== "") {
                this.cboEndRangeValues.set('displayedValue', '');
            }
        },
        _getValue: function (customValue, selectedItem) {
            var result = { displayValue: customValue, value: customValue };
            if (customValue === "") {
                if (selectedItem && selectedItem.value !== "") {
                    result = { value: selectedItem.value, displayValue: selectedItem.description };
                }
            }
            return result;
        },
        _getOriginalParameterValue: function (_id) {
            var originalValue = null;
            dojoArray.some(this.defaultValues, function (entry, i) {
                if (entry._id == _id) {
                    originalValue = dojo.clone(entry);
                    return true;
                }
            });
            return originalValue;
        },
        _setRangeErrorMessageVisibility: function (startValue, endValue) {
            if (!startValue && !endValue) {
                dojo.removeClass(this.hasParamValues ? this.errorStartRange : this.errorStartCustomValue, 'display-none');
                dojo.removeClass(this.hasParamValues ? this.errorEndRange : this.errorEndCustomValue, 'display-none');
                this.cboStartRangeValues.focus();
            } else if (!startValue) {
                dojo.addClass(this.hasParamValues ? this.errorEndRange : this.errorEndCustomValue, 'display-none');
                dojo.removeClass(this.hasParamValues ? this.errorStartRange : this.errorStartCustomValue, 'display-none');
                this.cboStartRangeValues.focus();
            } else {
                dojo.addClass(this.hasParamValues ? this.errorStartRange : this.errorStartCustomValue, 'display-none');
                dojo.removeClass(this.hasParamValues ? this.errorEndRange : this.errorEndCustomValue, 'display-none');
                this.cboEndRangeValues.focus();
            }
        },
        _removeErrorMessages: function () {
            dojo.addClass(this.errorStartRange, 'display-none');
            dojo.addClass(this.errorEndRange, 'display-none');
            dojo.addClass(this.errorStartCustomValue, 'display-none');
            dojo.addClass(this.errorEndCustomValue, 'display-none');
        },
        _destroyObject: function () {
            this.customEndValueField.destroyRecursive();
            this.customStartValueField.destroyRecursive();
        }
    });
    return parameterRangeWidget;
});