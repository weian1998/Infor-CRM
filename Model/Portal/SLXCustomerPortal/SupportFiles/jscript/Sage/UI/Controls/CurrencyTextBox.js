/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dijit/form/CurrencyTextBox',
    'dojo/currency',
    'Sage/Utility',
    'dojo/_base/declare',
    'dojo/_base/lang'
],
function (currencyTextBox, currency, utility, declare, lang) {
    var widget = declare("Sage.UI.Controls.CurrencyTextBox", [currencyTextBox], {
        shouldPublishMarkDirty: true,
        //.Net control behavior
        autoPostBack: false,
        hotKey: '',
        attributeMap: {
            hotKey: { node: 'textbox', type: 'attribute', attribute: 'accessKey' }
        },
        onBlur: function () {
            var currencyDecimalSeperator = Sys.CultureInfo.CurrentCulture.numberFormat.CurrencyDecimalSeparator;
            this.textbox.value = utility.maximizeDecimalDigit(this.textbox.value, this.constraints.places, currencyDecimalSeperator);
        },
        _sageUICurrencyTextBox_IsValid: function () {
            if (this.constraints.places > -1) {
                var txtVal = utility.restrictDecimalDigit(this.textbox.value, this.constraints.places);
                this.textbox.value = lang.trim(txtVal.replace(Sys.CultureInfo.CurrentCulture.numberFormat.CurrencySymbol, ""));
                // There are cases where dijit didn't localize a language, so the currency symbol might not be correct. Example is en-za which has a currency code of ZAR.
                // The dijit currency text box will render the currency symbol as ZAR which is NOT correct. Sys.CultureInfo has the correct currency symbol, which is just "R". 
                // So the above code would just remove the "R" from "ZAR" leaving the control in an invalid state.
                // We will attempt to strip out the currency code as well, as a backup when this does happen.
                this.textbox.value = lang.trim(txtVal.replace(this.constraints.currency, ""));
            }
            this.inherited(arguments);
        },
        postCreate: function () {
            this.connect(this, 'isValid', this._sageUICurrencyTextBox_IsValid);
            this.connect(this, 'onChange', this.onChanged);
            this.connect(this, 'onBlur', this.onBlur);
            this.inherited(arguments);
        },
        onChanged: function (e) {
            if (this.shouldPublishMarkDirty) {
                dojo.publish("Sage/events/markDirty");
            }
            if (this.autoPostBack) {
                if (Sys) {
                    Sys.WebForms.PageRequestManager.getInstance()._doPostBack(this.id, null);
                }
            }
        },
        setAttribute: function (attr, val) {
            /* Hide deprecated warnings, due to the parser and _WidgetBase assuming focusNode is a dom node and not a widget */
            this.set(attr, val);
        }
    });

    return widget;
});