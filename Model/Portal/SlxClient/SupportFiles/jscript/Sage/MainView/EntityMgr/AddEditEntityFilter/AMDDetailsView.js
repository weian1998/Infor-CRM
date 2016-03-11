/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/MainView/EntityMgr/AddEditEntityFilter/_DetailsAddEditDialogBase',
    'dojo/_base/declare',
    'dojo/text!./templates/AMDDetailsView.html',
    'dojo/i18n!./nls/AddEditFiltersDialog',
    'Sage/UI/FilteringSelect'
],
function (
    _DetailsAddEditDialogBase,
    declare,
    template,
    nlsResources,
    crmDropdown
) {
    var widget = declare('Sage.MainView.EntityMgr.AddEditEntityFilter.AMDDetailsView', [_DetailsAddEditDialogBase], {

        widgetTemplate: new Simplate(eval(template)),
        _nlsResources: nlsResources,
        widgetsInTemplate: true,

        aggregationDropDown: false,
        _idForAggregtDropDown: 'aggregationDpItems',
        constructor: function (obj)
        {
            if (!this.embedded)
            {
                this.hasProperties = true;
                this.isMetric = true;
            }
            if (dijit.byId(this._idForAggregtDropDown)) {
                this.destroy(dijit.byId(this._idForAggregtDropDown));
            }
        },

        destroy: function (context) {
            context.destroy();
        },

        postCreate: function () {

            this._createAggregateController();

            this.startup();
        },
        _populateDefaultAggregate: function () {
            //insert a characters text box
            var defValue = '';
            if (this.details) {
                if (this.details.metricFilter && this.details.metricFilter.aggregation) { // load to edit an existing metric
                    defValue = this.details.metricFilter.aggregation;
                }
                if (this.details.dateDiffMetricFilter && this.details.dateDiffMetricFilter.aggregation) { // carry over from an edit of a date difference metric
                    defValue = this.details.dateDiffMetricFilter.aggregation;
                }
                if (this.details.aggregation) { // load from within a date difference metric
                    defValue = this.details.aggregation;
                }
            }
            if (this.aggregation) { // load from within a date difference metric
                defValue = this.aggregation;
            }

            var obj = {
                context: this,
                idValue: defValue
            };
            dojo.subscribe('Sage/EntityManager/FilterUtilityDone', obj, function () {
                // set the item.
                dijit.byId(this.context._idForAggregtDropDown).item = this.context.filterUtility.grabItemOfAggregationGivenId(this.idValue);
                // make that item's name value visible.
                dijit.byId(this.context._idForAggregtDropDown).focusNode.value = dijit.byId(this.context._idForAggregtDropDown).item.name || "";
            });
            return defValue;
        },
        _createAggregateController: function()
        {
            this.lblEntityFiltersDetailsAggregation.innerHTML = this.filterUtility.colonizeLabels(this._nlsResources.lblAggregation);

            this.aggregationDropDown = new crmDropdown(
                {
                    id: this._idForAggregtDropDown,
                    name: 'aggregations',
                    value: this._populateDefaultAggregate(),
                    store: this.filterUtility.aggregation,
                    searchAttr: 'name',
                    fetchProperties: { sort: [{ attribute: "name", descending: false }] }
                }, this._idForAggregtDropDown
                );

            dojo.place(this.aggregationDropDown.domNode, this.dpEntityFiltersDetailsAggregation, 'only');
        },

        /**
        * This is a last method in the initialization process. 
        * It is called after all the child widgets are rendered so it's good for a container widget to finish it's post rendering here. 
        * This is where the container widgets could for example set sizes of their children relative to it's own size.
        */
        startup: function () {
            this.inherited(arguments);
        },
        getDetails: function (JustValue) {

            var aggregateValueToSave = this.aggregationDropDown.displayedValue;
            if (this.aggregationDropDown.item && this.aggregationDropDown.item.id)
            {
                aggregateValueToSave = this.aggregationDropDown.item.id;
            }


            if(JustValue)
            {
                return aggregateValueToSave;
            }
            else{
                var metricFilter = { metricFilter: { aggregation: aggregateValueToSave } };
                return metricFilter;
            }
        },
        isValid: function () {
            var val = this.aggregationDropDown.isValid(true);
            if (!val) {
                this.aggregationDropDown.set("state", "Error");
            }
            else {
                this.aggregationDropDown.set("state", "");
            }
            return val;
        }
    });
    return widget;
});