/*globals Sage, dojo, define */
define([
    'dojo/_base/declare',
     'Sage/UI/SLXPreviewGrid/Filter/DateRange'
],
function (declare, DateRange) {

    var ActivityDateRange = declare("Sage.UI.SLXPreviewGrid.Filter.ActivityDateRange", [DateRange], {
        getQuery: function () {
            var query = this.inherited(arguments);
            return query.replace(/Timeless/g, 'Activity.Timeless');
        }

    });
    return ActivityDateRange;

});
