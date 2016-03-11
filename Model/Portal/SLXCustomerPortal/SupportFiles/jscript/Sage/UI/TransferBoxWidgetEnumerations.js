/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare'
],
function (declare) {
    Sage.namespace('Sage.UI.TransferBoxWidgetEnumerations');
    dojo.mixin(Sage.UI.TransferBoxWidgetEnumerations, {
        SearchConditions: {
            EqualTo: 'EqualTo',
            Contains: 'Contains',
            StartingWith: 'StartingWith'
        },
        SelectionMode:
        {
            Extended: 'extended',
            Multiple: 'multiple',
            Single: 'single',
            None: 'none'
        }
    });
    return Sage.UI.TransferBoxWidgetEnumerations;
});