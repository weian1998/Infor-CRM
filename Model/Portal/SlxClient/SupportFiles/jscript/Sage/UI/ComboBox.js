/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
       'dijit/form/ComboBox',
       'dojo/currency',
       'dojo/_base/declare'
],
function (comboBox, currency, declare) {
    var widget = declare("Sage.UI.ComboBox", [comboBox], {
        _hClickBody: false,
        maxHeight: dojo.isIE ? 160 : 170,
        shouldPublishMarkDirty: true,
        //.Net control behavior
        autoPostBack: false,
        _onKeyPress: function (e) {
            //ToDo: Enable option to allow free text
            //ToDo: Fix tab out option to auto complete on elements that do not allow free text.
            // if (option to allow free text (i.e. picklist) === false) {
            //if (e.constructor.DOM_VK_DOWN !== e.charOrCode && e.constructor.DOM_VK_IP !== e.charOrCode) {
            dojo.stopEvent(e);
            //}
            // }
        },
        postCreate: function () {
            this.connect(this, 'onChange', this.onChanged);
            this.inherited(arguments);
        },
        onChanged: function (e) {
            if (this.shouldPublishMarkDirty) {
                dojo.publish("Sage/events/markDirty");
            }
            if (this.autoPostBack) {
                __doPostBack(this.id, '');
            }
        }
    });

    return widget;
});
