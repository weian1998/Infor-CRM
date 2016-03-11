/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
/* Extension/Activity Gloabal Utility. */
define([

],
function (

) {
    Sage.namespace('Sage.Extensions.Activity.Utility');
    Sage.Extensions.Activity.Utility = {
        addNote: function () {
            alert('Hello from Activity Ext Utility addNote method');
            this._getActivityService().addNote();
        },
        doCustom: function () {
            alert('Hello from Ext Utility  Utility doCustom method');
            this._getActivityService().scheduleActivity({});
        },
        editAssociation: function (entityId, EntityType) {
           // alert('Hello from Ext Utility  editAssociation method');
            this._getActivityService().editAssociation(entityId, EntityType);
        },
        _getActivityService: function () {
            var svc = Sage.Services.getService('ActivityService');
            return svc;
        },
        getCurrentActivityId: function () {
            var contextservice = Sage.Services.getService('ClientEntityContext');
            var eContext = contextservice.getContext();
            var entityId = null;
            if (eContext && eContext.EntityTableName == 'ACTIVITY') {
                entityId = eContext.EntityId;
            }
            return entityId;
        },
    };
    return Sage.Extensions.Activity.Utility;

});