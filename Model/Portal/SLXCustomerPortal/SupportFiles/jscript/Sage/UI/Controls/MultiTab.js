/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
        'dojo/_base/declare',
        'dojo/dom',
        'dojo/ready',
        'dojo/aspect',
        'dijit/layout/TabContainer',
        'dijit/registry'
],
function (declare, dom, ready, aspect, TabContainer, registry) {
    //summary
    // Override of dijit layout TabContainer.
    var multiTab = declare('Sage.UI.Controls.MultiTab', [TabContainer], {
        region: 'center',
        tabStrip: false,
        hiddenFieldId: '',
        destroyRecursive: function () {
            if (this.tablist) {
                this.tablist.destroy();
            }
            this.inherited(arguments);
        },
        postCreate: function () {
            var parentContainerId = this.domNode.parentNode.id,
               parentContainer = registry.byId(parentContainerId),
               that = this;
            
            parentContainer.resize();
            setTimeout(function() {
                parentContainer.resize();
                if(that.selectedChildWidget) {
                    that._showChild(that.selectedChildWidget);
                }
            }, 50);

        },
        startup: function() {
            this.hiddenFieldId = this.id + '_tabstate';
            var hiddenFieldDom = dom.byId(this.hiddenFieldId);
            if (hiddenFieldDom.value !== '') {
                registry.byId(this.id).selectChild(registry.byId(hiddenFieldDom.value));
            }
            this.inherited(arguments);
        }
    });


    return multiTab;
});