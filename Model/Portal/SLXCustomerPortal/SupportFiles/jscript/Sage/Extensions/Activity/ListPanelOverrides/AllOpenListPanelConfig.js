/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */

define([
        'Sage/MainView/ActivityMgr/AllOpenListPanelConfig',        
        'dojo/_base/declare',
        'dojo/_base/lang',
        'dojo/i18n!./nls/AllOpenListPanelConfig'            
],

function (
   AllOpenListPanelConfig, 
   declare,
   lang,
   nlsResources 
) {
    var allOpenListPanelConfig = declare('Sage.Extensions.Activity.ListPanelOverrides.AllOpenListPanelConfig', [AllOpenListPanelConfig], {

        constructor: function () {
            
            lang.mixin(this, nlsResources);
            //Add new select values that will be returned to the list panel             
            this._select.push('AttendeeCount');            

             //Add new structure configurations that will add new columns to the list panel.              
            this._structure.push({
                field: 'AttendeeCount',
                name: this.colNameAssociationCount,  //nls resources that are pulled in the define method above.
                width: '90px'
            });
            /*
            //Add Attendee count to Detail Panel
            this.detail.requestConfiguration.select.push('Details/AttendeeCount');
            //TODO: We should create the new dom node and inject into the template
            this.detail.templateLocation = "Extensions/Activity/ListPanelOverrides/templates/AllOpenDetailSummary.html";

            //Add Attendee count to Summary Panel
            this.summary.formatterScope.requestConfiguration.select.push('Details/AttendeeCount');
            this.summary.formatterScope.templateLocation = "Extensions/Activity/ListPanelOverrides/templates/AllOpenListSummary.html";
            */
        }    

    });

    return allOpenListPanelConfig;

});
