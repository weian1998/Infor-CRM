/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/Utility',
    'dojo/date/locale',
    'dojo/number',
    'dojo/string',
    'dojo/_base/array',
    'dojo/i18n!./nls/ReportManagerFormatter',
    'Sage/Reporting/Enumerations'
],
function (
    slxUtility,
    locale,
    dojoNumber,
    dojoString,
    dojoArray,
    nlsResources,
    enumerations
) {
    Sage.namespace('Sage.MainView.ReportMgr.ReportManagerFormatter');
    dojo.mixin(Sage.MainView.ReportMgr.ReportManagerFormatter, {
        _isNumeric: function (value) {
            return !isNaN(parseFloat(value)) && isFinite(value);
        },
        formatDate: function (value) {
            if (slxUtility.Convert.isDateString(value)) {
                var date = slxUtility.Convert.toDateFromString(value);
                return locale.format(date, { selector: 'datetime', fullYear: true });
            }
            return "";
        },
        formatFileSize: function (value) {
            var self = Sage.MainView.ReportMgr.ReportManagerFormatter;
            if (value && self._isNumeric(value)) {
                return dojoNumber.round(value / 1024, 0) + " KB";
            }
            return "";
        },
        formatElapsedTime: function (value) {
            var self = Sage.MainView.ReportMgr.ReportManagerFormatter;
            if (value && self._isNumeric(value)) {
                var days = Math.floor(value / (24 * 3600));
                var hours = Math.floor((value - (days * 24 * 3600)) / 3600);
                var minutes = Math.floor((value - (hours * 3600)) / 60);
                var seconds = value - (days * 24 * 3600) - (hours * 3600) - (minutes * 60);
                return dojoString.pad(hours, 2) + ":" + dojoString.pad(minutes, 2) + ":" + dojoString.pad(seconds, 2);
            }
            return "";
        },
        formatBoolean: function (value) {
            return slxUtility.isTrue(value) ? nlsResources.txtTrue : nlsResources.txtFalse;
        },
        _getParameterValue: function (parameters, name) {
            var value = "";
            if (parameters) {
                dojoArray.some(parameters, function (entry, i) {
                    if (entry.name === name) {
                        value = entry.value;
                        return true;
                    }
                });
            }
            return value;
        },
        formatGetUserById: function (item) {
            if (!item) {
                return '';
            } else {
                return slxUtility.getUserName(item);
            }
        },
        getParameterRunAsUser: function (parameters) {
            if (parameters) {
                var userId = Sage.MainView.ReportMgr.ReportManagerFormatter._getParameterValue(parameters, "RunAsUserId");
                return slxUtility.getUserName(userId);
            }
            return '';
        },
        formatScheduleName: function (item) {
            return Sage.MainView.ReportMgr.ReportManagerFormatter._getParameterValue(item.parameters, "ScheduleName");
        },
        formatScheduleDescription: function (item) {
            return Sage.MainView.ReportMgr.ReportManagerFormatter._getParameterValue(item.parameters, "Description");
        },
        formatPluginName: function (item) {
            return Sage.MainView.ReportMgr.ReportManagerFormatter._getParameterValue(item.parameters, "PluginName");
        },
        formatTemplateName: function (parameters) {
            return Sage.MainView.ReportMgr.ReportManagerFormatter._getParameterValue(parameters, "TemplateName");
        },
        formatOutputFormat: function (item) {
            return Sage.MainView.ReportMgr.ReportManagerFormatter._getParameterValue(item.parameters, "OutputFormat");
        },
        formatScheduleUser: function (user) {
            if (user && user.$descriptor) {
                return user.$descriptor;
            }
            return '';
        },
        formatCronExpression: function (item) {
            return item.cronExpression; //TODO: to be implemented
        },
        formatAttachment: function (value, rowIndex, cell) {
            var item = this.grid.getItem(rowIndex);
            return dojoString.substitute('<a href="javascript: Sage.Utility.File.Attachment.getAttachment(\'${0}\');" title="${1}">${1}</a>', [item.AttachId, item.ScheduleName]);
        },
        formatExecutionType: function (value, rowIndex, cell) {
            return enumerations.getExecutionTypeCaption(value);
        },
        formatReportType: function (value) {
            return enumerations.getReportTypeCaption(value);
        },
        formatProperCase: function (value) {
            if (typeof value === "string") {
                return value.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
            }
            else {
                return '';
            }
        }
    });
    return Sage.MainView.ReportMgr.ReportManagerFormatter;
});