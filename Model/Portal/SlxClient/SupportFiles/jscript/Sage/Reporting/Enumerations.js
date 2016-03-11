/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/i18n!./nls/Enumerations'
],
function (declare, nlsResources) {
    Sage.namespace('Sage.Reporting.Enumerations');
    dojo.mixin(Sage.Reporting.Enumerations, {
        nlsResources: nlsResources,
        ConditionPreset: {
            CurrentEntity: 'CurrentEntity',
            CurrentGroup: 'CurrentGroup',
            CurrentUser: 'CurrentUser',
            AllRecords: 'AllRecords',
            Custom: 'Custom',
            Preset: 'Preset'
        },
        ReportConditionConnector: {
            And: 'And',
            Or: 'Or'
        },
        FieldDataTypes: {
            String: "String",
            Numeric: "Numeric",
            DateTime: "DateTime"
        },
        DateRange: {
            ThisWeek: 'ThisWeek',
            ThisMonth: 'ThisMonth',
            ThisQuarter: 'ThisQuarter',
            ThisYear: 'ThisYear',
            LastWeek: 'LastWeek',
            LastMonth: 'LastMonth',
            LastQuarter: 'LastQuarter',
            LastYear: 'LastYear',
            MonthToDate: 'MonthToDate',
            QuarterToDate: 'QuarterToDate',
            YearToDate: 'QuarterToDate'
        },
        ReportExportFormat:
        {
            NoFormat: 'NoFormat',
            Pdf: 'Pdf',
            Excel: 'Excel',
            ExcelDataOnly: 'ExcelDataOnly',
            Csv: 'Csv',
            Word: 'Word',
            Xml: 'Xml'
        },
        //------------------------------
        //Report Types
        //------------------------------
        ReportTypes: {
            CrystalReport: 'Crystal',
            ExportToFileReportType: 'ExportToFile'
        },
        getReportTypeCaption: function (reportType) {
            switch (reportType) {
                case this.ReportTypes.CrystalReport:
                    return nlsResources.txtCrystalReport;
                case this.ReportTypes.ExportToFileReportType:
                    return nlsResources.txtExportToFileReportType;
                default:
                    console.error("Unsupported report type : " + reportType);
            }
            return nlsResources.txtUnknownReportType;
        },
        //------------------------------
        //Condition Type
        //------------------------------
        ReportConditionType: {
            Group: 'Group',
            DateRange: 'DateRange',
            User: 'User',
            Query: 'Query'
        },
        getReportConditionTypeCaption: function (reportConditionType) {
            switch (String(reportConditionType)) {
                case String(this.ReportConditionType.Group):
                    return nlsResources.txtGroup;
                case String(this.ReportConditionType.DateRange):
                    return nlsResources.txtDateRange;
                case String(this.ReportConditionType.User):
                    return nlsResources.txtUser;
                case String(this.ReportConditionType.Query):
                    return nlsResources.txtQuery;
                default:
                    console.error("Unsupported condition type : " + reportConditionType);
            }
            return "";
        },
        //------------------------------
        //Condition Operator
        //------------------------------
        ReportConditionOperator: {
            IsGreaterThan: 'IsGreaterThan',
            IsLessThan: 'IsLessThan',
            IsInTheRange: 'IsInTheRange',
            IsAfter: 'IsAfter',
            IsBefore: 'IsBefore',
            Contains: 'Contains',
            StartsWith: 'StartsWith',
            EndsWith: 'EndsWith',
            Is: 'Is',
            IsNot: 'IsNot'
        },
        getReportConditionOperatorCaption: function (reportConditionOperator) {
            switch (String(reportConditionOperator)) {
                case String(this.ReportConditionOperator.IsGreaterThan):
                    return nlsResources.txtIsGreaterThan;
                case String(this.ReportConditionOperator.IsLessThan):
                    return nlsResources.txtIsLessThan;
                case String(this.ReportConditionOperator.IsInTheRange):
                    return nlsResources.txtIsInTheRange;
                case String(this.ReportConditionOperator.IsAfter):
                    return nlsResources.txtIsAfter;
                case String(this.ReportConditionOperator.IsBefore):
                    return nlsResources.txtIsBefore;
                case String(this.ReportConditionOperator.Contains):
                    return nlsResources.txtContains;
                case String(this.ReportConditionOperator.StartsWith):
                    return nlsResources.txtStartsWith;
                case String(this.ReportConditionOperator.EndsWith):
                    return nlsResources.txtEndsWith;
                case String(this.ReportConditionOperator.Is):
                    return nlsResources.txtIs;
                case String(this.ReportConditionOperator.IsNot):
                    return nlsResources.txtIsNot;
                default:
                    console.error("Unsupported condition operator : " + reportConditionOperator);
            }
            return "";
        },
        //------------------------------
        //Execution Type
        //------------------------------
        ExecutionType: {
            OnDemand: 0,
            Scheduled: 1
        },
        getExecutionTypeCaption: function (value) {
            switch (value) {
                case this.ExecutionType.OnDemand:
                    return nlsResources.txtOnDemand;
                case this.ExecutionType.Scheduled:
                    return nlsResources.txtScheduled;
                default:
                    console.error("Unsupported execution type: " + value);
            }
            return '';
        },
        //------------------------------
        //Report Wizard Workflow
        //------------------------------
        //Note that the step value (0,1,2,3) reflects the default order of the wizard steps.
        CrystalReportWizardStep: {
            Init: 0,
            Conditions: 1,
            Parameters: 2,
            ExportOptions: 3,
            Finish: 4
        },
        //------------------------------
        //Crystal Reports Parameters
        //------------------------------        
        SlxParameterValueKind: {
            NumberParameter: 'NumberParameter',
            CurrencyParameter: 'CurrencyParameter',
            BooleanParameter: 'BooleanParameter',
            DateParameter: 'DateParameter',
            StringParameter: 'StringParameter',
            DateTimeParameter: 'DateTimeParameter',
            TimeParameter: 'TimeParameter',
            UserParameter: 'UserParameter'
        },
        SlxDefaultValueDisplayType: {
            Description: 'Description',
            DescriptionAndValue: 'DescriptionAndValue'
        },
        SlxParameterValueRangeKind:
        {
            Range: 'Range',
            Discrete: 'Discrete',
            DiscreteAndRange: 'DiscreteAndRange'
        },
        SlxRangeBoundType: {
            NoBound: 'NoBound',
            BoundExclusive: 'BoundExclusive',
            BoundInclusive: 'BoundInclusive'
        },
        ParameterClassName: {
            DiscreteValue: "CrystalReports.ParameterFieldDiscreteValue",
            RangeValue: "CrystalReports.ParameterFieldRangeValue"
        }
    });
    return Sage.Reporting.Enumerations;
});