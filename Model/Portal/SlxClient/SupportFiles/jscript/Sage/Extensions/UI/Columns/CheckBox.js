/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/query'
],
function (declare, lang, query) {
    var widget = declare("Sage.Extensions.UI.Columns.CheckBox", dojox.grid.cells.Bool, {
        //Formatter used for the editiable = false state.       
        checkBoxIds: null,        
        constructor: function (inCell) {
            //if they only provide options, we use them as the values...
            this.checkBoxIds = [];
        },
        formatEditing: function (inDatum, inRowIndex) {
            var chkBoxName = 'chk_' + this.field + '_' + inRowIndex;
            if (!this.checkBoxIds[chkBoxName]) {
                this.checkBoxIds.push(chkBoxName);
            }
            var key = "";
            var gridItem = this.grid.getItem(inRowIndex);
            if (gridItem) {
                key = gridItem.EntityId;
            }
            var chkBoxId = 'chk_' + this.field + '_' + key;
            var checkbox = (inDatum === true || inDatum === 1) ? '<input type="checkbox" class="attendeeGridIsPrimary" id="' + chkBoxId + '" name="' + chkBoxName + '" checked="checked" />'
               : '<input type="checkbox" class="attendeeGridIsPrimary" id="' + chkBoxId + '" name="' + chkBoxName + '" />';
            return checkbox;
        },
        doclick: function (e) {
            if (e.target.tagName == 'INPUT') {

                var item = e.grid.getItem(e.rowIndex);
                if (e.target.checked) {
                    item.checked = true;                    
                } else {
                    item.checked = false;                    
                }
                if (this.checkBoxClicked && typeof this.checkBoxClicked === 'function') {
                    this.checkBoxClicked.call(this, item);
                }
                //dojo.publish('/entity/activityAttendee/primaryClicked', [item, this]);

               // this.resetCheckBoxes(e.rowIndex);
                this.resetRows(e.grid, e.rowIndex, this.field, item);
                if (e.grid.mode == "insert") {
                    this.applyStaticValue(e.rowIndex);
                }
              /*  if (e.grid.mode != "insert") {
                    e.grid.saveChanges();
                    e.grid.refresh();
                }*/
            }
        },
      
        resetRows: function (grid, rowIndex, inAttrName, currentItem) {
          
            var count = grid.rowCount;
            var chkBoxId;
            for (var i = 0; i < count; i++) {
                var item = grid.getItem(i);
                if (item && item.EntityId !== currentItem.EntityId) {
                    chkBoxId = 'chk_' + this.field + '_' + item.EntityId;
                    dojo.byId(chkBoxId).checked = false;
                    grid.store.setValue(item, inAttrName, false);
                } else if (item && item.EntityId === currentItem.EntityId) {
                    chkBoxId = 'chk_' + this.field + '_' + item.EntityId;
                    if (grid.mode == "insert") {
                        grid.store.setValue(item, inAttrName, true);
                    } else if (grid.mode !== "insert" && item.IsPrimary) {
                        grid.store.setValue(item, inAttrName, false);
                    } else if (grid.mode !== "insert" && !item.IsPrimary) {
                        grid.store.setValue(item, inAttrName, true);
                    }
                }
            }
            
        },
        resetCheckBoxes: function (index) {
            for (var i = 0; i < this.checkBoxIds.length;i++) {
                console.debug(this.checkBoxIds[i]);
                if (index != i) {
                    dojo.byId(this.checkBoxIds[i]).checked = false;
                }
            }
            query(".attendeeGridIsPrimary").forEach(function (node, index, arr) {
                console.debug(node.innerHTML);
            });

        }

    });

    return widget;
});
