/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dijit/_Widget',
    'Sage/_Templated',
    'Sage/Utility',
    'dojo/string',
    'dojo/_base/declare',
    'dojo/i18n!./nls/AddEditFiltersDialog',
    'dojo/dom-style',
    'Sage/UI/Dialogs',
    'dojo/query',
    'dojo/dom-class'
],
function (
    _Widget,
    _Templated,
    utility,
    dString,
    declare,
    nlsResources,
    dojoStyle,
    dialogue,
    query,
    domClass
) {
    var widget = declare('Sage.MainView.EntityMgr.AddEditEntityFilter._DetailsAddEditDialogBase', [_Widget, _Templated], {

        widgetTemplate: new Simplate('<div>Not implemented</div>'),
        _nlsResources: nlsResources,
        Dialog: dialogue,
        Query: query,
        DomClass: domClass,
        filterUtility: false,
        hasProperties: false,
        isMetric: false,
        editing: false,
        details: false,
        embedded: false,
        entityName: '',

        constructor: function () {
            var obj = arguments;
            if(obj[0])
            {
                var first = obj[0];

                if (first.filterUtility)
                {
                    this.filterUtility = first.filterUtility;
                }
                if (first.isMetric) {
                    this.isMetric = first.isMetric;
                }
                if (first.details) {
                    this.details = first.details;
                    this.editing = first.details && true;
                }
                if (first.hasProperties) {
                    this.hasProperties = first.hasProperties;
                }
            }
        },
        
        postCreate: function () {
        },

        startup: function () {
            this.inherited(arguments);
        },

        // ---------------------------------------------------------------
        // This method is to be overwritten by mixin classes
        //  It is used in the saving process.
        //----------------------------------------------------------------
        getDetails: function () {
        },

        // ---------------------------------------------------------------
        // This method is to be overwritten by mixin classes
        //  It is used in to validate the form controls process.
        //----------------------------------------------------------------
        isValid: function () {
            return true; // do special validation done at the moment.
        }

    });
    return widget;
});