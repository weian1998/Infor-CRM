/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dijit/_Widget',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/text!./templates/ParameterHeaderWidget.html',
    'Sage/Utility'
],
function (
    declare,
    _Widget,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    template,
    utility
) {
    /**
    * Declare the ParameterHeaderWidget class.
    * @constructor
    */
    var parameterHeaderWidget = declare('Sage.MainView.ReportMgr.Crystal.ParameterHeaderWidget', [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        promptText: '',
        parameterFieldName: '',
        /**
        * ParameterHeaderWidget class constructor.
        * @constructor
        * @param {Object} promptParameter - Parameter to be edited
        */
        constructor: function () {
        },
        postCreate: function () {
            this.inherited(arguments);
        }
    });
    return parameterHeaderWidget;
});