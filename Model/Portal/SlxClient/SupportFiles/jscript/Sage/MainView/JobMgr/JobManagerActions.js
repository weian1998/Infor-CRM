/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'Sage/MainView/JobMgr/RunJobDialog',
    'Sage/UI/Dialogs',
    'dojo/i18n!./nls/JobManagerActions',
    'dojo/string',
    'Sage/Utility',
    'Sage/Utility/Jobs'
],
function (declare, RunJobDialog, dialogs, nlsStrings, dojoString, utility, jobUtility) {
    Sage.namespace('Sage.MainView.JobMgr.JobManagerActions');
    dojo.mixin(Sage.MainView.JobMgr.JobManagerActions, {
        /**
        * Return the key of the currently selected record in the listview.
        * @returns {string} - The key of the currently selected record in the listview.
        */
        _getSelectedId: function () {
            var selectionInfo = utility.getSelectionInfo();
            if (selectionInfo) {
                if (selectionInfo.selectedIds.length === 1) {
                    return selectionInfo.selectedIds[0];
                }
            }
            return null;
        },
        /**
        * Displays the Run Job Dialog. If the current group is not "Job Definitions" 
        * or if no record is selected in the listview, a message is displayed to the user, 
        * and the action is aborted.
        */
        showRunJobDialog: function (isNew) {
            var key = this._getSelectedId();
            if (!key) {
                dialogs.showInfo(nlsStrings.error_NoRecordSelected);
            } else {
                var currentGroupId = jobUtility.getCurrentGroupId();
                var runJobDialog = dijit.byId("dlgRunJob");
                if (!runJobDialog) {
                    runJobDialog = new RunJobDialog();
                }
                var triggerId = currentGroupId === 'schedules' ? key : null;
                var options = { key: key, currentGroupId: currentGroupId, isNew: isNew, triggerId: triggerId };
                runJobDialog.show(options);
            }
        },
        /**
        * Displays the Run Job Dialog. If the current group is not "Job Definitions" 
        * or if no record is selected in the listview, a message is displayed to the user, 
        * and the action is aborted.
        */
        deleteScheduledJob: function () {
            var key = this._getSelectedId();
            if (!key) {
                dialogs.showInfo(nlsStrings.error_NoRecordSelected);
            } else {
                dialogs.raiseQueryDialog(
                    'Infor CRM',
                    nlsStrings.confirm_ScheduleDeletion,
                    function (result) {
                        if (result) {
                            var currentGroupId = jobUtility.getCurrentGroupId();
                            var jobService = Sage.Services.getService('JobService');
                            if (jobService.deleteScheduledJob(key)) {
                                jobUtility.refreshList(currentGroupId);
                            }
                        }
                    },
                    nlsStrings.txtYes,
                    nlsStrings.txtNo
                );
            }
        },
        /**
        * Displays the Cancel Execution Dialog. If the current group is not "Executions" 
        * or if no record is selected in the listview, a message is displayed to the user, 
        * and the action is aborted.
        */
        showCancelExecutionDialog: function () {
            var key = this._getSelectedId();
            if (!key) {
                dialogs.showInfo(nlsStrings.error_NoRecordSelected);
            } else {
                var options = {
                    key: key,
                    executionId: key,
                    success: function (data) {
                        if (data && data.status === nlsStrings.jobStatusComplete) {
                            dialogs.showInfo(nlsStrings.completedJobMessage);
                        } else {
                            var queryDialogOptions = {
                                title: nlsStrings.txtInterruptExecutionTitle,
                                query: dojoString.substitute(nlsStrings.txtInterruptExecutionConfirmationMessage, ['']), //TODO: we could show the job name or execution id here
                                callbackFn: function (result) {
                                    if (result === true) {
                                        var interuptOptions = {
                                            key: key,
                                            success: function (result) {
                                                dialogs.showInfo(nlsStrings.txtInterruptExecutionMessage, nlsStrings.txtInterruptExecutionTitle);
                                            },
                                            failure: function (xhr) {
                                            }
                                        };
                                        jobService.interruptExecution(interuptOptions);
                                    }
                                },
                                yesText: nlsStrings.txtYes,
                                noText: nlsStrings.txtNo,
                                icon: "warningIcon"
                            };
                            dialogs.raiseQueryDialogExt(queryDialogOptions);
                        }
                    },
                    failure: function (xhr) {
                        //job may already have been removed
                        return true;
                    }
                };
                var jobService = Sage.Services.getService('JobService');
                jobService.getExecution(options);
            }
        }
    });
    return Sage.MainView.JobMgr.JobManagerActions;
});