/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/i18n!./nls/CrystalReportsFormatter',
    'Sage/Reporting/Enumerations',
    'Sage/MainView/ReportMgr/ReportManagerUtility',
    'dojo/date/locale',
    'dojo/string'
],
function (
    declare,
    nlsResources,
    Enumerations,
    ReportManagerUtility,
    dateLocale,
    dojoString
) {
    Sage.namespace('Sage.MainView.ReportMgr.Crystal.CrystalReportsFormatter');
    dojo.mixin(Sage.MainView.ReportMgr.Crystal.CrystalReportsFormatter, {
        formatConditionType: function (value) {
            //console.log("formatConditionType");
            return Enumerations.getReportConditionTypeCaption(value);
        },
        formatOperator: function (value) {
            //console.log("formatOperator");
            return Enumerations.getReportConditionOperatorCaption(value);
        },
        formatEditCondition: function (value, rowIndex, cell) {
            //console.log("formatEditCondition");
            return "<a href=javascript:dijit.byId('dlgCrystalReportConditions')._editCondition(" + rowIndex + ")>" + nlsResources.txtEdit + "</a>";
        },
        formatDeleteCondition: function (item) {
            return "<a href=javascript:dijit.byId('dlgCrystalReportConditions')._deleteCondition(" + item._id + ")>" + nlsResources.txtDelete + "</a>";
        },
        formatConditionValue: function (item) {
            var rangeValue = null;
            var startDate = null;
            var endDate = null;
            switch (String(item.conditionType)) {
                case String(Enumerations.ReportConditionType.Group):
                    var group = ReportManagerUtility.getGroup(item.tag);
                    var descriptor = group ? group.$descriptor : "";
                    return descriptor;
                case String(Enumerations.ReportConditionType.DateRange):
                    if (item.operator === Enumerations.ReportConditionOperator.IsInTheRange) {
                        startDate = dateLocale.format(item.fromRange, { selector: 'datetime', fullYear: true });
                        endDate = dateLocale.format(item.toRange, { selector: 'datetime', fullYear: true });
                        rangeValue = dojoString.substitute(nlsResources.txtRangeValue, [startDate, endDate]);
                        return rangeValue;
                    }
                    else {
                        return item.value;
                    }
                    break;//Needed to avoid JSHint validation error
                case String(Enumerations.ReportConditionType.User):
                    return item.value;
                case String(Enumerations.ReportConditionType.Query):
                    var operator = item.operator;
                    switch (item.dataType) {
                        case Enumerations.FieldDataTypes.Numeric:
                            if (operator == Enumerations.ReportConditionOperator.IsInTheRange) {
                                rangeValue = dojoString.substitute(nlsResources.txtRangeValue, [item.fromRange, item.toRange]);
                                return rangeValue;
                            }
                            else {
                                return item.value;
                            }
                            break;//Needed to avoid JSHint validation error
                        case Enumerations.FieldDataTypes.DateTime:
                            if (operator == Enumerations.ReportConditionOperator.IsInTheRange) {
                                startDate = dateLocale.format(item.fromRange, { selector: 'datetime', fullYear: true });
                                endDate = dateLocale.format(item.toRange, { selector: 'datetime', fullYear: true });
                                rangeValue = dojoString.substitute(nlsResources.txtRangeValue, [startDate, endDate]);
                                return rangeValue;
                            }
                            else {
                                var formattedDate = dateLocale.format(item.value, { selector: 'datetime', fullYear: true });
                                return formattedDate;
                            }
                            break;//Needed to avoid JSHint validation error
                        case Enumerations.FieldDataTypes.String:
                            return item.value;
                        default:
                            console.error("Unsupported field type: " + item.dataType);
                    }
                    break;
                default:
                    console.error("Unsupported condition type: " + item.conditionType);
            }
        }
    });
    return Sage.MainView.ReportMgr.Crystal.CrystalReportsFormatter;
});