/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */

define([
        'Sage/MainView/ActivityMgr/ActivityListPanelConfig',
        'Sage/UI/Columns/SlxLink',
        'dojo/_base/declare',
        'dojo/_base/lang',
        'dojo/i18n!./nls/ActivityListPanelConfig'        
],

function (
   ActivityListPanelConfig,
   ColumnsLink, 
   declare,
   lang,
   nlsResources
) {
    var activityListPanelConfig = declare('Sage.Extensions.Activity.ListPanelOverrides.ActivityListPanelConfig', [ActivityListPanelConfig], {

        constructor: function () {

            lang.mixin(this, nlsResources);

           // debugger;
            //Add new select values that will be returned to the list panel             
            this._select.push('Activity/AttendeeCount');            

             //Add new structure configurations that will add new columns to the list panel.              
            this._structure.push({
                   field: 'Activity.AttendeeCount',
                   name: this.colNameAssociationCount,  //nls resources that are pulled in the define method above.
                   width: '90px'
            });

            /*
            //Add Attendee count to Detail Panel
            this.detail.requestConfiguration.select.push('Activity/Details/AttendeeCount');
            //TODO: We should create the new dom node and inject into the template
            this.detail.templateLocation = "Extensions/Activity/ListPanelOverrides/templates/UserActivityDetailSummary.html";

            //Add Attendee count to Summary Panel
            this.summary.formatterScope.requestConfiguration.select.push('Activity/Details/AttendeeCount');
            this.summary.formatterScope.templateLocation = "Extensions/Activity/ListPanelOverrides/templates/UserActivityListSummary.html";
            */

        }
    });

    return activityListPanelConfig;

});
