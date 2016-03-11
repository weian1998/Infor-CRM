/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
        'Sage/MainView/EntityMgr/AddEditEntityFilter/_DetailsAddEditDialogBase',
        'dojo/_base/declare',
        'dojo/text!./templates/ADDMDDetailsView.html',
        'dojo/i18n!./nls/AddEditFiltersDialog',
        'Sage/UI/ComboBox',
        'Sage/MainView/EntityMgr/AddEditEntityFilter/AMDDetailsView',
        'dojo/dom-style',
        'dojo/store/JsonRest',
        'dijit/Tree',
        'Sage/MainView/EntityMgr/PropertyStore',
        "dijit/TooltipDialog",
        "dijit/form/Button"
],
    function (
        _DetailsAddEditDialogBase,
        declare,
        template,
        nlsResources,
        crmDropDowns,
        aggregate,
        domStyle,
        JsonRest,
        Tree,
        PropertyStore, TooltipDialog, Button
    ) {
        var widget = declare('Sage.MainView.EntityMgr.AddEditEntityFilter.ADDMDDetailsView', [_DetailsAddEditDialogBase], {
            widgetTemplate: new Simplate(eval(template)),
            _nlsResources: nlsResources,
            widgetsInTemplate: true,

            aggregation: false,
            from: false,
            to: false,
            myTooltipDialogFrom: null,
            myTooltipDialogTo: null,
            treeFrom: null,
            treeTo: null,

            constructor: function (obj) {
                this.hasProperties = false;
                this.isMetric = true;
                this.entityName = obj.entityName;

            },
            postCreate: function () {

                this._createAggregation();
                this._createFromFS();
                this._createToFS();

                this.startup();
            },
            _createFromFS: function () {

                var self = this;
                this.treeFrom = new Tree({
                    model: new PropertyStore(this.entityName, true).store,
                    showRoot: false,
                    style: { overflow: "auto", height: "250px", width: "auto" },
                    onClick: function (item) {
                        self.propertyDpButtonFrom.set('value', item.property);
                        dijit.popup.close();
                    }
                });

                this.lblMetricRangeFrom.innerHTML = this.filterUtility.colonizeLabels(this._nlsResources.lblFrom);
                var defFrom = '';
                if (this.details.dateDiffMetricFilter && this.details.dateDiffMetricFilter.fromPropertyName) {
                    defFrom = this.details.dateDiffMetricFilter.fromPropertyName;
                }


                this.propertyDpButtonFrom.set('value', defFrom);
            },
            _showDDFrom: function () {
                var ele = dojo.query(".propertyDpButtonFrom");
                var width = domStyle.getComputedStyle(ele[ele.length - 1]).width;
                this.myTooltipDialogFrom = new TooltipDialog({
                    style: "width:" + width + ";",
                    content: this.treeFrom
                });
                dojo.addClass(this.myTooltipDialogFrom.domNode, 'propertyDialog');
                dijit.popup.open({
                    popup: this.myTooltipDialogFrom,
                    around: ele[ele.length - 1]
                });

            },
            _showDDTo: function () {
                var ele = dojo.query(".propertyDpButtonTo");
                var width = domStyle.getComputedStyle(ele[ele.length - 1]).width;
                this.myTooltipDialogTo = new TooltipDialog({
                    style: "width:" + width + ";",
                    content: this.treeTo
                });
                dojo.addClass(this.myTooltipDialogTo.domNode, 'propertyDialog');
                dijit.popup.open({
                    popup: this.myTooltipDialogTo,
                    around: ele[ele.length - 1]
                });

            },
            _createToFS: function () {
                var self = this;
                this.treeTo = new Tree({
                    model: new PropertyStore(this.entityName, true).store,
                    showRoot: false,
                    style: { overflow: "auto", height: "250px", width: "auto" },
                    onClick: function (item) {
                        self.propertyDpButtonTo.set('value', item.property);
                        dijit.popup.close();
                    }
                });
                this.lblMetricRangeTo.innerHTML = this.filterUtility.colonizeLabels(this._nlsResources.lblTo);
                var defTo = '';
                if (this.details.dateDiffMetricFilter && this.details.dateDiffMetricFilter.toPropertyName) {
                    defTo = this.details.dateDiffMetricFilter.toPropertyName;
                }
                this.propertyDpButtonTo.set('value', defTo);
            },
            _createAggregation: function () {
                this.aggregation = new aggregate(
                {
                    embedded: true,
                    isMetric: true,
                    hasProperty: this.hasProperty,
                    details: this.details,
                    filterUtility: this.filterUtility
                });
                dojo.place(this.aggregation.domNode, this.aggregate, 'only');
            },


            /**
        * This is a last method in the initialization process. 
        * It is called after all the child widgets are rendered so it's good for a container widget to finish it's post rendering here. 
        * This is where the container widgets could for example set sizes of their children relative to it's own size.
        */
            startup: function () {
                this.inherited(arguments);
            },
            getDetails: function () {
                var dateDiffMetricFilter = { dateDiffMetricFilter: { aggregation: this.aggregation.getDetails(true), fromPropertyName: this.propertyDpButtonFrom.value, toPropertyName: this.propertyDpButtonTo.value } };
                return dateDiffMetricFilter;
            },
            isValid: function () {
                var subSection = this.aggregation.isValid();
                if (subSection === true) {
                    
                    var val = this.propertyDpButtonFrom.isValid(true);
                    this.propertyDpButtonFrom.onChange();

                    val = val && this.propertyDpButtonTo.isValid(true);
                    this.propertyDpButtonTo.onChange();

                    return val;
                } else {
                    return subSection;
                }
            }
        });
        return widget;
    });