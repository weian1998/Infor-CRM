/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'Sage/Utility'
], function(declare, slxUtility) {
    var widget = declare('Sage.UI.Columns.Owner', dojox.grid.cells.Cell, {
        formatter: function (value, idx) {
            if (value) {
                var owner = slxUtility.getOwnerName(value);
                if (owner !== value) return slxUtility.htmlEncode(owner);
                // The Plugin table can include either a UserId or a SecCodeId for the Plugin.UserId value.
                var user = slxUtility.getUserName(value);
                return user ? slxUtility.htmlEncode(user) : value;
            }
            return value;
        }
    });
    return widget;
});
