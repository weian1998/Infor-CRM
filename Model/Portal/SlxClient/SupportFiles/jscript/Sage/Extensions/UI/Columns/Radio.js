/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/_base/lang'
],
function (declare, lang) {
    var widget = declare("Sage.Extensions.UI.Columns.Radio", dojox.grid.cells.Bool, {
        //Formatter used for the editiable = false state.       

        formatEditing: function (inDatum, inRowIndex) {
            var radioName = this.radioType == 'group' ? 'rdo_' + this.field : 'rdo_' + this.field + '_' + inRowIndex;
            var checked = inDatum ? "checked" : "";
            return '<input type="radio" ' + checked + ' name="' + radioName + '"  style="width: auto" />';
        },
        doclick: function (e) {
            if (e.target.tagName == 'INPUT') {               
                this.resetRows(e.grid, e.rowIndex, this.field);                
                this.applyStaticValue(e.rowIndex);                
            }
        },
        resetRows: function (grid, rowIndex, inAttrName) {
            this.currentRow = rowIndex;
            var self = this;
            grid.store.fetch({               
                onComplete: function (items) {
                    dojo.forEach(items, function (item, index) {
                        if (index != self.currentRow) {
                            grid.store.setValue(item, inAttrName, false);
                        }
                    });                    
                }               
            });

        }
    });

    return widget;
});
