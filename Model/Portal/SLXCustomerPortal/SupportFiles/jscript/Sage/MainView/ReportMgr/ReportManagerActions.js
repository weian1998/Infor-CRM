/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'Sage/UI/Dialogs',
    'dojo/i18n!./nls/ReportManagerActions',
    'dojo/string',
    'Sage/MainView/ReportMgr/ReportWizardController',
    'Sage/Reporting/Enumerations',
    'Sage/Utility/Jobs',
    'Sage/Data/SDataServiceRegistry'
],
function (
    declare,
    dialogs,
    nlsResources,
    dojoString,
    reportWizardController,
    enumerations,
    jobUtility,
    sDataServiceRegistry
) {
    Sage.namespace('Sage.MainView.ReportMgr.ReportManagerActions');
    dojo.mixin(Sage.MainView.ReportMgr.ReportManagerActions, {
        runReport: function () {
            this._runReport(enumerations.ExecutionType.OnDemand);
        },
        deleteReport: function () {
            var key = this._getSelectedId();
            if (!key) {
                dialogs.showInfo(nlsResources.txtSelectRecord);
            } else {
                var self = this;
                dialogs.raiseQueryDialog(
                    'Infor CRM',
                    dojoString.substitute(nlsResources.confirm_Deletion, [nlsResources.confirm_Report]),
                    function (result) {
                        if (result) {
                            var currentGroupId = jobUtility.getCurrentGroupId();
                            if (self._deleteReport(key)) {
                                jobUtility.refreshList(currentGroupId);
                            }
                        }
                    },
                    nlsResources.txtYes,
                    nlsResources.txtNo
                );
            }
        },
        scheduleReport: function () {
            this._runReport(enumerations.ExecutionType.Scheduled);
        },
        /**
        * Displays the Report Wizard. If no record is selected in the listview, 
        * a message is displayed to the user, and the action is aborted.
        */
        editSchedule: function () {
            var key = this._getSelectedId();
            if (!key) {
                dialogs.showInfo(nlsResources.txtSelectRecord);
            } else {
                var options = {
                    triggerId: key
                };
                reportWizardController.startWizard(options);
            }
        },
        deleteSchedule: function () {
            var key = this._getSelectedId();
            if (!key) {
                dialogs.showInfo(nlsResources.txtSelectRecord);
            } else {
                dialogs.raiseQueryDialog(
                    'Infor CRM',
                    dojoString.substitute(nlsResources.confirm_Deletion, [nlsResources.confirm_Schedule]),
                    function (result) {
                        if (result) {
                            var currentGroupId = jobUtility.getCurrentGroupId();
                            var jobService = Sage.Services.getService('JobService');
                            var def = new dojo.Deferred();
                            if (jobService.deleteScheduledJob(key, def)) {
                                def.then(function () {
                                    jobUtility.refreshList(currentGroupId);
                                }, function (error) {
                                    console.error("errback: %o", error);
                                });
                            }
                        }
                    },
                    nlsResources.txtYes,
                    nlsResources.txtNo
                );
            }
        },
        deleteHistory: function () {
            var selectionInfo = Sage.Utility.getSelectionInfo();
            if (selectionInfo.selectedIds.length <= 0) {
                dialogs.showInfo(nlsResources.txtInvalidSelectionCount);
            } else {
                var self = this;
                dialogs.raiseQueryDialog(
                    'Infor CRM',
                    dojoString.substitute(nlsResources.confirm_Deletion, [nlsResources.confirm_ReportHistory]),
                    function (result) {
                        if (result) {
                            self._deleteHistory();
                        }
                    },
                    nlsResources.txtYes,
                    nlsResources.txtNo
                );
            }
        },
        /**
        * Return the key of the currently selected record in the listview.
        * @returns {string} - The key of the currently selected record in the listview.
        */
        _getSelectedId: function () {
            var selectionInfo = Sage.Utility.getSelectionInfo();
            if (selectionInfo) {
                if (selectionInfo.selectedIds.length === 1) {
                    return selectionInfo.selectedIds[0];
                }
            }
            return null;
        },
        _runReport: function (executionType) {
            var key = this._getSelectedId();
            if (!key) {
                dialogs.showInfo(nlsResources.txtSelectRecord);
            } else {
                var listView = dijit.byId('list');
                var reportDisplayName = listView.get('list').selection.getFirstSelected().displayName;
                var options = {
                    reportId: key,
                    reportDisplayName: reportDisplayName,
                    reportOptions: {
                        wizardOptions: {},
                        scheduleOptions: {
                            executionType: executionType
                        },
                        exportOptions: {},
                        conditions: [],
                        parameterValues: []
                    }
                };
                reportWizardController.startWizard(options);
            }
        },
        /**
        * Return the id of the current group in the listview.
        * @returns {string} - The id of the current group in the listview.
        */
        _getCurrentGroupId: function () {
            var svc = Sage.Services.getService('ClientGroupContext');
            var context = svc.getContext();
            return context.CurrentGroupID;
        },
        _deleteReport: function (key) {
            var service = sDataServiceRegistry.getSDataService('system', false, true, false);
            var request = new Sage.SData.Client.SDataApplicationRequest(service);
            request.setResourceKind(dojoString.substitute("reports('${0}')", [key]));
            var sUrl = request.uri;
            dojo.xhrDelete({
                handleAs: 'json',
                url: sUrl,
                error: function (xhr) {
                    dialogs.showError(dojoString.substitute(nlsResources.txtErrorDeleteReport, [xhr.status]));
                    return false;
                }
            });
            return true;
        },
        _getCurrentUserId: function () {
            var currentUserId = null;
            var clientContextSvc = Sage.Services.getService('ClientContextService');
            if (clientContextSvc) {
                if (clientContextSvc.containsKey("userID")) {
                    currentUserId = clientContextSvc.getValue("userID");
                }
            }
            return currentUserId;
        },
        _deleteHistory: function () {
            var selectionInfo = Sage.Utility.getSelectionInfo();
            var parameters = [
                { "name": "EntityName", "value": "ReportHistory" },
                { "name": "SelectedIds", "value": (selectionInfo.selectionCount > 0) ? selectionInfo.selectedIds.join(',') || '' : '' }
            ];
            var currentGroupId = jobUtility.getCurrentGroupId();
            var options = {
                closable: true,
                key: 'Sage.SalesLogix.BusinessRules.Jobs.DeleteEntityJob',
                descriptor: nlsResources.txtDeleteHistory,
                user: { $key: this._getCurrentUserId() },
                parameters: parameters,
                infoMessage: nlsResources.txtDeleteHistory,
                title: nlsResources.txtDeleteTitle,
                complete: function (result) {
                    jobUtility.refreshList(currentGroupId);
                },
                failure: function (result) {
                    console.log(result);
                    dialogs.showError(dojo.string.substitute(nlsResources.deleteJobError, [result.statusText]));
                }
            };
            jobUtility.triggerJobAndDisplayProgressDialog(options);
        }
    });
    return Sage.MainView.ReportMgr.ReportManagerActions;
});