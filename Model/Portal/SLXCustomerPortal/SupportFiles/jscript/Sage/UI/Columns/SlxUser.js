/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
        'dijit/_Widget',
        'dijit/form/FilteringSelect',
        'dojo/_base/declare',
        'Sage/Utility'
], function (_Widget, FilteringSelect, declare, slxUtility) {
    var widget = declare("Sage.UI.Columns.SlxUser", dojox.grid.cells.Cell, {
        // summary: 
        //  User name display based on user id.
        //  Read-only at the moment.
        format: function (inRowIndex, inItem) {
            if (inItem) {
                var userId = inItem[this.field];
                // XXX this is using a synchronous retrieve
                // we should be able to return a deferred object from this function (see http://dojotoolkit.org/reference-guide/dojox/grid/DataGrid.html)

                //nraddatz 2013-09-26: Defect 13093163
                //Added null validation below.
                var name = userId ? slxUtility.getUserName(userId) : "";
                return slxUtility.htmlEncode(name);
            }
        }
    });
    return widget;
});
