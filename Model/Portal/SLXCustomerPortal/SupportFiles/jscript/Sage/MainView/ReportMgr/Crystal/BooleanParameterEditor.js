/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/text!./templates/BooleanParameterEditor.html',
    'Sage/MainView/ReportMgr/Crystal/ParameterHeaderWidget',
    'Sage/MainView/ReportMgr/Crystal/_ParameterEditorBase',
    'Sage/MainView/ReportMgr/ReportManagerUtility',
    'Sage/MainView/ReportMgr/Crystal/CrystalReportsUtility',
    'Sage/Utility'
],
function (
    declare,
    template,
    ParameterHeaderWidget,
    _ParameterEditorBase,
    reportManagerUtility,
    crystalReportsUtility,
    utility
) {
    var __widgetTemplate = utility.makeTemplateFromString(template);
    /**
    * Declare the BooleanParameterEditor class.
    * @constructor
    */
    var booleanParameterEditor = declare('Sage.MainView.ReportMgr.Crystal.BooleanParameterEditor', [_ParameterEditorBase], {
        widgetTemplate: __widgetTemplate,
        value: null,
        _setValueAttr: function (value) {
            this._set("value", value);
        },
        _getValueAttr: function () {
            var currentValue = this._getCurrentValue();
            if (currentValue) {
                this._promptParameter.currentValues = [currentValue];
            }
            return this._promptParameter;
        },
        /**
        * BooleanParameterEditor class constructor.
        * @constructor
        * @param {Object} promptParameter - Parameter to be edited
        */
        constructor: function (promptParameter) {
            //Note that the base class constructor is automatically called prior to this.
            //Add initialization of internal properties here
        },
        /**
        * This is a last method in the initialization process. 
        * It is called after all the child widgets are rendered so it's good for a container widget to finish it's post rendering here. 
        * This is where the container widgets could for example set sizes of their children relative to it's own size.
        */
        startup: function () {
            if (this._started) return;

            this.inherited(arguments);
            var parameterHeaderWidget = new ParameterHeaderWidget({
                promptText: this._promptParameter.promptText,
                parameterFieldName: this._promptParameter.parameterFieldName
            }).placeAt(this.paramsHeaderContainer);
            crystalReportsUtility.initializeComboBoxValues(this._values, crystalReportsUtility.getRangeInitialValue(this._initialValues, false), this.cmbValues);
            reportManagerUtility.setDomNodeVisible(this.divValidationMessage, false);
        },
        isValid: function () {
            var valid = true;
            var msg = "";
            var currentValue = this._getCurrentValue();
            if (currentValue === null) {
                msg = this.txtPleaseSpecifyValue;
                dojo.removeClass(this.errorInvalidOption, 'display-none');
                this.cmbValues.focus();
                valid = false;
            } else {
                dojo.addClass(this.errorInvalidOption, 'display-none');
            }
            this._showValidationMessage(msg);
            return valid;
        },
        _showValidationMessage: function (msg) {
            this.spanValidationMessage.innerHTML = Sage.Utility.htmlEncode(msg);
            reportManagerUtility.setDomNodeVisible(this.divValidationMessage, (msg !== ""));
        },
        _getCurrentValue: function () {
            var item = this.cmbValues.item;
            if (item && item.value !== "") {
                return this.getOriginalParameterValue(item._id);
            }
            return null;
        }
    });
    return booleanParameterEditor;
});