/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
       'dijit/form/Select',
       'dojo/_base/declare',
       'dojo/has',
       'dojo/_base/sniff',
       'dojo/_base/connect',
       'dojo/dom-style',
       'dojo/query',
       'dojo/on',
       'dojo/_base/lang'
],
function (Select, declare, has, _sniff, connect, domStyle, query, on, lang) {
    var widget = declare('Sage.UI.Controls.Select', [Select], {
        _hClickBody: false,
        shouldPublishMarkDirty: true,
        autoPostBack: false,
        maxHeight: has('ie') ? 146 : 155,
        constructor: function() {
            this.own(on(document.body, 'click', lang.hitch(this, this.ensureClosed)));
        },
        ensureClosed: function() {
            if (this.dropDown && this.dropDown.isShowingNow) {
                this.dropDown.onCancel();
            }
        },
        postCreate: function () {
            this.own(on(this, 'change', lang.hitch(this, this.onChanged)));
            this.inherited(arguments);
        },
        destroy: function () {
            this.inherited(arguments);
        },
        _setDisplay: function(newDisplay) {
            this.inherited(arguments);
            this.trimDisplayValue();
        },
        onChanged: function (newValue) {
            if (this.shouldPublishMarkDirty) {
                connect.publish('Sage/events/markDirty');
            }
            if (this.autoPostBack) {
                __doPostBack(this.id, '');
            }
        },
        // Cut the excess characters and add '...' to the end of the display value
        //  if the length causes the control to extend beyond its container
        trimDisplayValue: function() {
            var nodes, i, len, node, controlWidth;
            controlWidth = this.focusNode.style.width;

            if (!controlWidth) {
                return;
            }
            nodes = query('span', this.containerNode);
            len = nodes && nodes.length;
            for(i = 0; i < len; i++) {
                node = nodes[i];
                domStyle.set(node, {
                    'width': controlWidth,
                    'text-overflow': 'ellipsis',
                    'overflow': 'hidden'
                });
            }
        }
    });

    return widget;
});

