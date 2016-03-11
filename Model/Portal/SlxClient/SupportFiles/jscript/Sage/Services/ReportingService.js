/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/string',
    'dojo/i18n!./nls/ReportingService',
    'Sage/Utility/Jobs',
    'Sage/Reporting/Enumerations',
    'dojo/json',
    'dojo/_base/array',
    'Sage/MainView/ReportMgr/ReportWizardController',
    'Sage/MainView/ReportMgr/Crystal/CrystalReportsUtility',
    'Sage/UI/Dialogs'
],
function (
    declare,
    dojoString,
    nlsResources,
    jobs,
    enumerations,
    dojoJson,
    dojoArray,
    ReportWizardController,
    crystalReportsUtility,
    dialogs
) {
    /**
    * Declare the ReportingService class.
    * @constructor
    */
    var reportingService = declare('Sage.Services.ReportingService', null, {

        /**
        * Initiates the report wizard.
        * @param {Object} options - Options for the function.
        * @param {string} options.reportId - The id of the report to be executed. Example: 'p6UJ9A0003V8'.
        * @param {string} options.triggerId - The id of the schedule to be edited. Example: 'fb66f331‐0a42‐4209‐a8b9‐d4acbce0da69'.
        * @param {Object} [options.reportOptions] - Report-specific options. These vary depending on the report type. See the corresponding wizard controller for more info.
        */
        startWizard: function (options) {
            ReportWizardController.startWizard(options);
        },

        /**
        * Triggers a Reporting job for immediate execution.
        * @param {Object} options - Options for the function.
        * @param {string} options.reportType - The type of report to be run.
        * @param {Array} [options.parameters] - An array containing parameters to be passed to the Report execution.
        * @param {function} [options.success] - An optional callback function to be executed on success.
        * @param {function} [options.failure] - An optional callback function to be executed on failure.
        */
        runReport: function (options) {
            options.key = this._getJobId(options.reportType);
            /*var jobService = Sage.Services.getService('JobService');
            jobService.triggerJob(options);*/
            jobs.triggerJobAndDisplayProgressDialog(options);
        },
        /**
        * Schedules a recurring Report execution.
        * @param {Object} options - Options for the function.
        * @param {string} options.reportType - The type of report to be run.
        * @param {string} [options.cronExpression] - A cron expression for scheduling the Report.
        * @param {Array} [options.parameters] - An array containing parameters to be passed to the Report execution.
        * @param {function} [options.success] - An optional callback function to be executed on success.
        * @param {function} [options.failure] - An optional callback function to be executed on failure.
        */
        scheduleReport: function (options) {
            options.key = this._getJobId(options.reportType);
            var jobService = Sage.Services.getService('JobService');
            jobService.scheduleJob(options);
        },
        /**
        * Gets the Report Schedule definition via an async call to the server.
        * @param {Object} options - Options for the function.
        * @param {string} options.triggerId - The id of the schedule.
        * @param {function} [options.success] - An optional callback function to be executed on success.
        * @param {function} [options.failure] - An optional callback function to be executed on failure.
        */
        getSchedule: function (options) {
            var jobService = Sage.Services.getService('JobService');
            jobService.getTrigger(options);
        },
        /**
        * Updates the Report Schedule definition via an async call to the server.
        * @param {Object} options - Options for the function.
        * @param {string} options.triggerId - The id of the schedule.
        * @param {function} [options.success] - An optional callback function to be executed on success.
        * @param {function} [options.failure] - An optional callback function to be executed on failure.
        */
        updateSchedule: function (options) {
            var jobService = Sage.Services.getService('JobService');
            jobService.updateTrigger(options);
        },
        /**
        * Gets the Report definition via an async call to the server.
        * @param {Object} options - Options for the function.
        * @param {string} options.reportId - The id of the report. The function supports both standard ids (i.e: 'p6UJ9A0003V3') as well as name:family notation (i.e:'Account:Account Detail').
        * @param {function} [options.success] - An optional callback function to be executed on success.
        * @param {function} [options.failure] - An optional callback function to be executed on failure.
        */
        getReportMetadata: function (options) {
            if (!options || typeof options.reportId !== "string") {
                console.error("getReportMetadata: Missing parameters");
                return;
            }
            var family, pluginId, name, request;

            if (options.reportId.indexOf(":") !== -1) {
                family = options.reportId.split(":")[0];
                name = options.reportId.split(":")[1];
            }
            else {
                pluginId = options.reportId;
            }
            //Get system service
            var service = Sage.Data.SDataServiceRegistry.getSDataService('system');
            //Report name and family have been provided. Retrieve report metadata using a SDataResourceCollectionRequest.
            if (family && name) {
                request = new Sage.SData.Client.SDataResourceCollectionRequest(service);
                request.setResourceKind('reports');
                request.setQueryArg('where', 'family eq \'' + family + '\' and name eq \'' + name + '\'');
                request.setQueryArg('count', '1');
                request.read({
                    success: function (result) {
                        if (result && result.$resources && result.$resources.length === 1) {
                            if (options.success) {
                                options.success(result.$resources[0]);
                            }
                        }
                    },
                    failure: function (xhr, sdata) {
                        var errorMsg = "ReportingService.getReportMetadata: " + dojoString.substitute(nlsResources.txtUnexpectedError, [xhr.status, xhr.statusText]);
                        console.error(errorMsg);
                        if (options.failure) {
                            options.failure(xhr, sdata);
                        }
                    }
                });
                return;
            }
            else {
                //Report pluginId has been provided. Retrieve report metadata using a SDataSingleResourceRequest.
                //Prepare request
                request = new Sage.SData.Client.SDataSingleResourceRequest(service);
                request.setResourceKind('reports');
                request.setResourceSelector("'" + pluginId + "'");
                //Execute async call
                request.read({
                    success: function (result) {
                        if (options.success) {
                            options.success(result);
                        }
                    },
                    failure: function (xhr, sdata) {
                        var errorMsg = "ReportingService.getReport: " + dojoString.substitute(nlsResources.txtUnexpectedError, [xhr.status, xhr.statusText]);
                        console.error(errorMsg);
                        if (options.failure) {
                            options.failure(xhr, sdata);
                        }
                    }
                });
            }
        },
        /**
        * Returns the Job Id required to run a report of specified type.        
        * @param {string} reportType - The type of report to be run.
        */
        _getJobId: function (reportType) {
            switch (reportType) {
                case enumerations.ReportTypes.CrystalReport:
                    return "Saleslogix.Reporting.Jobs.CrystalReportsJob";
                default:
                    throw dojoString.substitute(nlsResources.txtUnsupportedReportType, [reportType]);
            }
        },

        //************************************************************************************************************************
        //BEGIN SUPPORT FOR LEGACY REPORTINGSERVICE FUNCTIONS (SLX 8.0)
        //************************************************************************************************************************
        defaultDetailReports: null, //Field that holds an object containing the default detail reports as defined in either USEROPTIONSDEF or USEROPTIONS.
        defaultReport: null, //Field that holds a default report in the form Family:Name. This field is not populated by default and can be set using Service.setDefaultReport(value). This field should only be used when setting a report value for a main table other than Account, Contact, Opportunity, Defect, Ticket, or SalesOrder. This report information will not be stored in the Service.defaultDetailReports field. 
        reportJob: null,
        //-------------------------
        //Show Reports
        //-------------------------

        /**
        * Shows the specified report, filtering by a collection of entity ids.
        * Ported from legacy reporting service functions.
        * @param {string} reportNameOrId - The report name or plugin id. Example: 'Contact:Contact Details'. Example 2: 'p6UJ9A0000SI'
        * @param {string} tableName - The table name. Example: 'CONTACT'.
        * @param {Array||string} entityIds - A single entityId, a comma-delimited list of entityId values, or an array of entityId values.        
        */
        showReport: function (reportNameOrId, tableName, entityIds) {
            if (!this.isValidString(reportNameOrId)) {
                dialogs.showError(this.getDisplayError(nlsResources.invalidReportPluginError));
                return;
            }
            if (!this.isValidString(tableName)) {
                dialogs.showError(this.getDisplayError(nlsResources.invalidTableNameError));
                return;
            }
            if (!this.isValidString(entityIds) && !(entityIds instanceof Array)) {
                dialogs.showError(this.getDisplayError(nlsResources.invalidEntityError));
                return;
            }
            this.showReportViewer(reportNameOrId, tableName, entityIds);
        },

        /**
        * Shows the default report for the current entity as defined in the defaultDetailReports field. 
        */
        showDefaultReport: function () {
            //Updated by NRADDATZ to use new 8.1 reporting feature
            var reportId = this.getCurrentReport();
            if (this.isValidString(reportId)) {
                //Get condition to filter by current entity id
                var condition = crystalReportsUtility.getCurrentEntityCondition();
                var options = {
                    reportId: reportId,
                    reportOptions: {
                        wizardOptions: {
                            hiddenSteps: [enumerations.CrystalReportWizardStep.Conditions, enumerations.CrystalReportWizardStep.ExportOptions]
                        },
                        scheduleOptions: {
                            executionType: enumerations.ExecutionType.OnDemand
                        },
                        exportOptions: {
                            outputFormat: enumerations.ReportExportFormat.Pdf
                        },
                        conditionOptions: {
                            conditions: [condition],
                            conditionsConnector: enumerations.ReportConditionConnector.And
                        }
                    }
                };
                this.startWizard(options);
            }
            else {
                dialogs.showError(this.getDisplayError(nlsResources.noDefaultReportError));
            }
        },
        /**
        * Shows the report associated with the reportId parameter.
        * @param {string} reportId - The plugin id of the report. Example: 'p6UJ9A0000SI'
        */
        showReportById: function (reportId) {
            this.showReportViewerInContext(reportId);
        },
        /**
        * Shows the report associated with reportName parameter. 
        * @param {string} reportNameOrId - The report name or plugin id. Example: 'Contact:Contact Details'. Example 2: 'p6UJ9A0000SI'
        */
        showReportByName: function (reportNameOrId) {
            this.showReportViewerInContext(reportNameOrId);
        },
        /**
        * Shows the report for the current entity.
        * @param {string} reportNameOrId - The report name or plugin id. Example: 'Contact:Contact Details'. Example 2: 'p6UJ9A0000SI'
        */
        showReportViewerInContext: function (reportNameOrId) {
            if (!this.isValidString(reportNameOrId)) {
                dialogs.showError(this.getDisplayError(nlsResources.invalidReportPluginError));
                return;
            }
            var oContext = this.getCurrentContext();
            if (typeof console !== "undefined") {
                console.debug("showReportViewerInContext(%o): oContext = %o", reportNameOrId, oContext);
            }
            this.showReportViewer(reportNameOrId, oContext.tablename, oContext.entityid);
        },

        /**
        * Shows the specified report, filtering by a collection of entity ids.
        * Ported from legacy reporting service functions.
        * @param {string} reportNameOrId - The report name or plugin id. Example: 'Contact:Contact Details'. Example 2: 'p6UJ9A0000SI'
        * @param {string} tableName - The table name. Example: 'CONTACT'.
        * @param {Array||string} entityIds - A single entityId, a comma-delimited list of entityId values, or an array of entityId values.        
        */
        showReportViewer: function (reportNameOrId, tableName, entityIds) {
            if (!this.isValidString(reportNameOrId)) {
                dialogs.showError(this.getDisplayError(nlsResources.invalidReportPluginError));
                return;
            }
            if (!this.isValidString(tableName)) {
                dialogs.showError(this.getDisplayError(nlsResources.invalidTableNameError));
                return;
            }
            if (!this.isValidString(entityIds) && !(entityIds instanceof Array)) {
                dialogs.showError(this.getDisplayError(nlsResources.invalidEntityError));
                return;
            }
            this.setReportJob(reportNameOrId, tableName, entityIds);
            this._showReport();
        },

        /**
        * Sets the reportJob field using the supplied parameters.
        * Ported from legacy reporting service functions.
        * @param {string} reportId - The report name or plugin id. Example: 'Contact:Contact Details'. Example 2: 'p6UJ9A0000SI'
        * @param {string} tableName - The table name. Example: 'CONTACT'.
        * @param {Array||string} entityIds - A single entityId, a comma-delimited list of entityId values, or an array of entityId values.        
        */
        setReportJob: function (reportId, tableName, entityIds) {

            if (typeof reportId !== "string") {
                console.error("setReportJob: Invalid parameter 'reportId'.");
                return;
            }
            if (typeof tableName !== "string") {
                console.error("setReportJob: Invalid parameter 'tableName'.");
                return;
            }
            if ((typeof entityIds !== "string") && !(entityIds instanceof Array)) {
                console.error("setReportJob: Invalid parameter 'entityIds'.");
                return;
            }
            var recordSelectionFormula = this._getRecordSelectionFormula(tableName, entityIds);
            this.reportJob = this.newReportJob();
            this.reportJob.pluginid = reportId;
            this.reportJob.rsf = recordSelectionFormula;

        },

        /**
        * Returns a crystal reports record selection formula.        
        * @param {string} tableName - The table name. Example: 'CONTACT'.
        * @param {Array} entityIds - An array of entity ids.
        * @return {string} - A string containing the record selection formula. Example: ({CONTACT.CONTACTID} = "XYZ"). Example 2: ({CONTACT.CONTACTID} in ["ABC","XYZ"])
        */
        _getRecordSelectionFormula: function (tableName, entityIds) {

            //If entityIds is string, convert to array
            if (this.isValidString(entityIds)) {
                if (entityIds.indexOf(',') !== -1) {
                    //comma delimited list of ids, convert to array
                    entityIds = entityIds.split(',');
                }
                else {
                    //a single id, encapsulate it on an array
                    entityIds = [entityIds];
                }
            }

            if (entityIds.length === 0) {
                console.error("showReport: At least one entity id must be passed as argument.");
                return;
            }

            if (typeof tableName !== "string") {
                console.error("_getRecordSelectionFormula: Invalid parameter 'tableName'.");
                return;
            }
            if (!(entityIds instanceof Array)) {
                console.error("_getRecordSelectionFormula: Invalid parameter 'entityIds'.");
                return;
            }
            var identityFieldName = tableName.toUpperCase() + '.' + tableName.toUpperCase() + 'ID'; //note we assume the id field is of the form tablename + ID
            var recordSelectionFormula;
            if (entityIds.length === 1) {
                recordSelectionFormula = '({' + identityFieldName + '} = "' + entityIds[0] + '")';
            }
            else {
                var formattedIds = [];
                dojoArray.forEach(entityIds, function (entityId, i) {
                    entityId = '"' + entityId + '"';
                    formattedIds.push(entityId);
                });
                recordSelectionFormula = '({' + identityFieldName + '} in [' + formattedIds.join(',') + '])';
            }
            return recordSelectionFormula;

        },

        /**
        * Gets a reportJob object with default values.
        * @return {Object} - An object of the form {pluginid:'', rsf:'', sortdirections:'', sortfields:''}
        */
        newReportJob: function () {
            var result = {
                pluginid: "",
                rsf: "",
                sortdirections: "",
                sortfields: ""
            };
            return result;
        },

        /**
        * Shows the report associated with the reportJob parameter. The reportJob can be created using the Service.newReportJob() method.
        * @param {Object} reportJob - A reportJob object.  
        */
        showReportEx: function (reportJob) {
            this.reportJob = reportJob;
            this._showReport();
        },

        /**
        * Shows the report associated with the current reportJob.  
        */
        _showReport: function () {
            //TODO: pending support for sortdirections and sortfields
            //this.reportJob.sortdirections,
            //this.reportJob.sortfields,
            var reportId = this.getReportId(this.reportJob.pluginid);
            var options = {
                reportId: reportId,
                reportOptions: {
                    wizardOptions: {
                        hiddenSteps: [enumerations.CrystalReportWizardStep.Conditions, enumerations.CrystalReportWizardStep.ExportOptions]
                    },
                    scheduleOptions: {
                        executionType: enumerations.ExecutionType.OnDemand
                    },
                    exportOptions: {
                        outputFormat: enumerations.ReportExportFormat.Pdf
                    },
                    conditionOptions: {
                        conditionsConnector: enumerations.ReportConditionConnector.And,
                        recordSelectionFormula: this.reportJob.rsf
                    }
                }
            };
            this.startWizard(options);

        },

        //-------------------------
        //Default Detail Reports
        //-------------------------
        /*SalesLogix defines default detail reports for the Account, Contact, Opportunity, Defect, Ticket, and 
        SalesOrder entities. The default detail reports are stored as a JSON string in the 
        USEROPTIONDEF/USEROPTIONS table (CATEGORY = 'Reporting'; NAME = 'DefaultDetailReports'). The 
        default detail reports are loaded automatically by the Sage.Reporting.Service and are stored in the 
        Sage.Reporting.Service.defaultDetailReports field as a JavaScript object. Currently no user interface 
        exists to manage this user option; however, the user option can be saved using the method 
        Sage.Reporting.Service.saveDefaultReports(onSuccess, onError).*/

        /**
        * Returns the current report associated with the current main table in the form Family:Name. 
        */
        getCurrentReport: function () {
            var oContext = this.getCurrentContext();
            if (oContext.tablename === "" || oContext.entityid === "") return null;
            switch (oContext.tablename) {
                case "ACCOUNT":
                    return this.getAccountReport();
                case "CONTACT":
                    return this.getContactReport();
                case "OPPORTUNITY":
                    return this.getOpportunityReport();
                case "DEFECT":
                    return this.getDefectReport();
                case "SALESORDER":
                    return this.getSalesOrderReport();
                case "TICKET":
                    return this.getTicketReport();
                default:
                    return this.getDefaultReport();
            }
        },
        /**
        * Returns the default report if one has been defined by calling setDefaultReport(value).
        */
        getDefaultReport: function () {
            return this.defaultReport;
        },
        /**
        * Sets the default report associated with the value (e.g. Family:Name) parameter.
        * This method can be used to set report information for a main table that does not 
        * already have an associated report stored with the Service.defaultDetailReports field. 
        */
        setDefaultReport: function (value) {
            this.defaultReport = value;
        },
        /**
        * Gets the report associated with the main table parameter. 
        */
        getReport: function (maintable) {
            this._initReports();
            var result = null;
            if (this.isValidString(maintable) && dojo.isObject(this.defaultDetailReports)) {
                dojo.some(this.defaultDetailReports, function (report) {
                    if (report.maintable.toUpperCase() == maintable.toUpperCase()) {
                        var sReport = dojoString.substitute("${0}:${1}", [report.family, report.name]);
                        result = sReport;
                        return true;
                    } else {
                        return false;
                    }
                });
            }
            return result;
        },
        /**
        * Sets the report associated with the value (e.g. Family:Name) and maintable parameters on the 
        * defaultDetailReports field. If the defaultDetailReports field does not already 
        * have a report associated with the maintable one is added using the supplied 
        * parameters; otherwise, the report information is replaced. 
        */
        setReport: function (value, maintable) {
            var report = this.parseReport(value);
            if (report !== null) {
                var sMainTable = maintable || report.family.toUpperCase();
                this.setReportEx(sMainTable, report.family, report.name);
            }
        },
        /**
        * Sets the report associated with the maintable, family, and name parameters 
        * on the defaultDetailReports field. If the defaultDetailReports field does not already 
        * have a report associated with the maintable one is added using the supplied parameters; 
        * otherwise, the report information is replaced.
        */
        setReportEx: function (maintable, family, name) {
            this._initReports();
            if (this.isValidString(maintable) && this.isValidString(family) && this.isValidString(name) && dojo.isObject(this.defaultDetailReports)) {
                var bFound = dojo.some(this.defaultDetailReports, function (report) {
                    if (report.maintable.toUpperCase() == maintable.toUpperCase()) {
                        report.family = family;
                        report.name = name;
                        return true;
                    } else {
                        return false;
                    }
                });
                if (!bFound) {
                    // Not found?                    
                    var oReport = { "maintable": maintable, "family": family, "name": name };
                    this.defaultDetailReports.push(oReport);
                }
            }
        },
        /**
        * Gets the default detail report associated with the ACCOUNT table 
        * in the defaultDetailReports field in the form Family:Name.
        */
        getAccountReport: function () {
            return this.getReport("ACCOUNT");
        },
        /**
        * Sets the default detail report associated with the ACCOUNT table 
        * on the defaultDetailReports field. The value should be in the form Family:Name.
        */
        setAccountReport: function (value) {
            this.setReport(value, "ACCOUNT");
        },
        /**
        * Gets the default detail report associated with the CONTACT table 
        * in the defaultDetailReports field in the form Family:Name.
        */
        getContactReport: function () {
            return this.getReport("CONTACT");
        },
        /**
        * Sets the default detail report associated with the CONTACT table 
        * on the defaultDetailReports field. The value should be in the form Family:Name.
        */
        setContactReport: function (value) {
            this.setReport(value, "CONTACT");
        },
        /**
        * Gets the default detail report associated with the OPPORTUNITY table 
        * in the defaultDetailReports field in the form Family:Name.
        */
        getOpportunityReport: function () {
            return this.getReport("OPPORTUNITY");
        },
        /**
        * Sets the default detail report associated with the OPPORTUNITY table 
        * on the defaultDetailReports field. The value should be in the form Family:Name.
        */
        setOpportunityReport: function (value) {
            this.setReport(value, "OPPORTUNITY");
        },
        /**
        * Gets the default detail report associated with the DEFECT table 
        * in the defaultDetailReports field in the form Family:Name.
        */
        getDefectReport: function () {
            return this.getReport("DEFECT");
        },
        /**
        * Sets the default detail report associated with the DEFECT table 
        * on the defaultDetailReports field. The value should be in the form Family:Name.
        */
        setDefectReport: function (value) {
            this.setReport(value, "DEFECT");
        },
        /**
        * Gets the default detail report associated with the SALESORDER table 
        * in the defaultDetailReports field in the form Family:Name.
        */
        getSalesOrderReport: function () {
            return this.getReport("SALESORDER");
        },
        /**
        * Sets the default detail report associated with the SALESORDER table 
        * on the defaultDetailReports field. The value should be in the form Family:Name.
        */
        setSalesOrderReport: function (value) {
            this.setReport(value, "SALESORDER");
        },
        /**
        * Gets the default detail report associated with the TICKET table 
        * in the defaultDetailReports field in the form Family:Name.
        */
        getTicketReport: function () {
            return this.getReport("TICKET");
        },
        /**
        * Sets the default detail report associated with the TICKET table 
        * on the defaultDetailReports field. The value should be in the form Family:Name.
        */
        setTicketReport: function (value) {
            this.setReport(value, "TICKET");
        },
        /**
        * Saves the Service.defaultDetailReports field as a JSON string 
        * stored in the USEROPTIONS table with a Category of 'Reporting' 
        * and a Name of 'DefaultDetailReports'. Any previous call to 
        * set*Report() is subsequently persisted. The onSuccess and onError 
        * callbacks return the response. 
        */
        saveDefaultReports: function (onSuccess, onError) {
            if (dojo.isObject(this.defaultDetailReports)) {
                var oUserOptions = Sage.Services.getService("UserOptions");
                if (oUserOptions) {
                    var fnSuccess = function (response) {
                        if (typeof onSuccess === "function") {
                            onSuccess(response);
                        }
                    };
                    var fnError = function (response) {
                        if (typeof console !== "undefined") {
                            console.error("saveDefaultReports: %o", response);
                        }
                        if (typeof onError === "function") {
                            onError(response);
                        }
                    };
                    var oDefaultReports = { "defaultDetailReports": this.defaultDetailReports };
                    var sDefaultReports = dojo.toJson(oDefaultReports);
                    if (typeof console !== "undefined") {
                        console.debug("sDefaultReports: %o", sDefaultReports);
                    }
                    oUserOptions.set("DefaultDetailReports", "Reporting", sDefaultReports, fnSuccess, fnError);
                }
            }
        },
        //-------------------------
        //Misc Functions
        //-------------------------
        /**
        * Gets the report associated with the value parameter. If the value parameter
        * is in the form Family:Name the reportId is returned if found; if the value 
        * is already a pluginId, the same value is returned.
        */
        getReportId: function (value) {
            var result = null;
            if (this.isValidString(value)) {
                /* Do we have a FAMILY:NAME value? */
                if (value.indexOf(":") != -1) {
                    dojo.xhrGet({
                        url: "SLXReportsHelper.ashx?method=GetReportId&report=" + encodeURIComponent(value),
                        handleAs: "text",
                        preventCache: true,
                        sync: true,
                        load: function (data, ioargs) {
                            result = data;
                        },
                        error: function (response, ioargs) {
                            if (typeof console !== "undefined") {
                                console.error(ioargs);
                            }
                        }
                    });
                } else {
                    /* Does it look like we already have a plugin ID? */
                    if (value.length == 12) {
                        result = value;
                    }
                }
            }
            return result;
        },
        //-------------------------
        //Internal Functions
        //-------------------------
        getCurrentContext: function () {
            var result = { "tablename": "", "entityid": "" };
            if (Sage.Services.hasService("ClientEntityContext")) {
                var oService = Sage.Services.getService("ClientEntityContext");
                if (!oService) return result;
                var oContext = oService.getContext();
                /* NOTE: The EntityTableName property is [not] always defined for ClientEntityContext (depends on context). */
                if (!oContext || typeof oContext.EntityTableName === "undefined") return result;
                result.tablename = oContext.EntityTableName.toUpperCase();
                result.entityid = oContext.EntityId;
            }
            return result;
        },
        /**
        * Parses the value (e.g. Family:Name) parameter into an object with the following format: 
        * {family: "", name: ""} 
        */
        parseReport: function (value) {
            if (this.isValidString(value)) {
                var arrValues = value.split(":");
                if (dojo.isArray(arrValues) && arrValues.length == 2) {
                    return { "family": arrValues[0], "name": arrValues[1] };
                }
            }
            return null;
        },
        isValidString: function (s) {
            return (s && (typeof s === "string"));
        },
        _initReports: function () {
            if (this.defaultDetailReports === null) {
                var self = this;
                dojo.xhrGet({
                    url: "slxdata.ashx/slx/crm/-/useroptions/Reporting/DefaultDetailReports",
                    handleAs: "json",
                    preventCache: true,
                    sync: true,
                    load: function (option, ioargs) {
                        if (dojo.isObject(option) && typeof option.optionValue !== "undefined" && option.optionValue !== "") {
                            var obj = dojo.fromJson(option.optionValue);
                            if (obj && typeof obj.defaultDetailReports !== "undefined" && dojo.isArray(obj.defaultDetailReports)) {
                                dojo.mixin(self, obj);
                            }
                        }
                    },
                    error: function (response, ioargs) {
                        if (typeof console !== "undefined") {
                            console.debug("Error in _initReports()"); //DNL
                            console.error(ioargs);
                            console.debug("The built-in default reports will be used."); //DNL
                        }
                    }
                });
            }
            if (this.defaultDetailReports === null) {
                this.defaultDetailReports = [
                    {
                        "maintable": "ACCOUNT",
                        "family": "Account",
                        "name": "Account Detail"
                    },
                    {
                        "maintable": "CONTACT",
                        "family": "Contact",
                        "name": "Contact Detail"
                    },
                    {
                        "maintable": "OPPORTUNITY",
                        "family": "Opportunity",
                        "name": "Opportunity Detail"
                    },
                    {
                        "maintable": "DEFECT",
                        "family": "Defect",
                        "name": "Support Defect"
                    },
                    {
                        "maintable": "TICKET",
                        "family": "Ticket",
                        "name": "Support Ticket"
                    },
                    {
                        "maintable": "SALESORDER",
                        "family": "Sales Order",
                        "name": "Sales Order Detail"
                    }
                ];
            }
        },

        getDisplayError: function (msg) {
            return dojoString.substitute("${0} ${1}", [nlsResources.reportCannotBeShownError, msg]);
        }

    }); // end dojo declare
    /*
    * Make an instance of this service available to the Sage.Services.getService method.
    */
    if (!Sage.Services.hasService('ReportingService')) {
        Sage.Services.addService('ReportingService', new Sage.Services.ReportingService());
    }
    return reportingService;
});
