
/*globals Sage, dojo, define */
define([
    'dojo/_base/declare',
     'Sage/UI/SLXPreviewGrid/Filter/Lookup'
],
function (declare, lookupFilter) {

    var newLookupFilter = declare('Sage.Extensions.UI.SLXPreviewGrid.Filter.Lookup', [lookupFilter], {
        getQuery: function () {
            var obj = this._lup.get('selectedObject');            
            if (obj) {
                if (obj['Activity']) {
                    return 'Activity.' + this.field + ' eq \'' + obj['$key'] + '\'';
                } else {
                    return this.field + ' eq \'' + obj['$key'] + '\'';
                }
            }
            return '';
        }

    });

    return newLookupFilter;
});