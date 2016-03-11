/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    'dojo/string',
    'dojo/i18n!./nls/RunJobDialog',
    'dojo/text!./templates/RunJobDialog.html',
    'Sage/UI/JobSchedulingWidget',
    'dijit/_Widget',
    'Sage/_Templated',
    'dojo/_base/lang',
    'Sage/UI/Controls/_DialogHelpIconMixin',
    'dojo/data/ItemFileWriteStore',
    'dojox/grid/DataGrid',
    'Sage/Utility/Jobs',
    'Sage/Utility',
    'Sage/UI/Dialogs'
],
function (declare, dojoString, i18nStrings, template, jobSchedulingWidget, _Widget, _Templated, dojoLang, dialogHelpIconMixin, itemFileWriteStore, dataGrid, jobUtility, slxUtility, dialogs) {
    /**
    * Declare the RunJobDialog class.
    * @constructor
    */
    var runJobDialog = declare('Sage.MainView.JobMgr.RunJobDialog', [_Widget, _Templated], {
        id: 'dlgRunJob',
        _dialog: false,
        _configMgr: false,
        _key: null,
        _trigger: null,
        _currentGroupId: null,
        widgetTemplate: new Simplate(eval(template)),
        nlsResources: i18nStrings,
        widgetsInTemplate: true,
        /**
        * Displays the Run Job Dialog.
        * @param {object}
        */
        show: function (options) {
            this._key = options.key;
            this._currentGroupId = options.currentGroupId;
            if (options.triggerId) {
                this._getTriggerRequest(options.triggerId);
                this.cmbScheduleType.set('value', 'scheduled');
                this.cmbScheduleType.set('disabled', true);
            }
            this._setVisible(this.jobSchedulingWidget.divJobSchedulingWidget, false);
            this.jobSchedulingWidget.initialize({ trigger: this._trigger });
            this._dialog.show();

            if (!this._dialog.helpIcon) {
                dojoLang.mixin(this._dialog, new dialogHelpIconMixin());
                this._dialog.createHelpIconByTopic('runjob');
            }
        },
        _getTriggerRequest: function (key) {
            var jobService = Sage.Services.getService('JobService');
            var request = new Sage.SData.Client.SDataSingleResourceRequest(jobService.getSchedulingSDataService());
            request.setResourceKind(dojoString.substitute("triggers('${0}')", [key]));
            var self = this;
            request.read({
                async: false,
                success: function (result) {
                    self._trigger = result;
                }
            });
        },
        /**
        * Sets the Job Name control value based on the Job Definition selected by the user.
        * Initiates the async load of Job parameters.
        **/
        _dialog_OnShow: function () {
            var self = this;
            self.txtJobName.set('value', self._key);
            window.setTimeout(function () { self._getAndDisplayJobDetails(); }, 250);
        },
        /**
        * Depending on the chosen schedule type (either "Run Now" or "Scheduled Execution"), 
        * either triggers a Job for immediate execution, or schedules a recurring trigger.
        */
        _triggerJob: function () {
            var scheduleOptions = this.jobSchedulingWidget.getJobSchedulingOptions();
            if (this.cmbScheduleType.value === 'scheduled') {
                if (!this.jobSchedulingWidget.validateSchedule(false, false)) {
                    return;
                }
            }
            var parameters = [];
            var isNew = (!this._trigger);

            if (this.grdJobParameters && this.grdJobParameters.store) {
                dojo.forEach(this.grdJobParameters.store._getItemsArray(), function (item) {
                    if (item && item.name && item.name.length) {
                        var value = !isNew ? item.value.length > 0 ? item.value[0] : '' : item.defaultValue.length > 0 ? item.defaultValue[0] : '';
                        parameters.push({ name: item.name[0], value: value });
                    }
                });
            }

            var startTime = null;
            if (scheduleOptions.startTime && (scheduleOptions.startTime instanceof Date)) {
                startTime = slxUtility.Convert.toJsonStringFromDate(scheduleOptions.startTime);
            }

            var endTime = null;
            if (scheduleOptions.endTime && (scheduleOptions.endTime instanceof Date)) {
                endTime = slxUtility.Convert.toJsonStringFromDate(scheduleOptions.endTime);
            }
            var currentGroupId = this._currentGroupId;
            var options = {
                closable: true,
                key: this._key,
                descriptor: this.txtTriggerDescription.get('value'),
                frequency: this.cmbScheduleType.value === 'scheduled' ? scheduleOptions.frequency : null,
                startTime: startTime,
                endTime: endTime,
                user: { $key: this._getCurrentUserId() },
                parameters: parameters,
                infoMessage: '',
                cronExpression: scheduleOptions.cronExpression,
                title: this.txtTriggerDescription.get('value') || this.txtJobName.get('value'),
                success: function (result) {
                    jobUtility.refreshList(currentGroupId);
                },
                failure: function (result) {
                }
            };

            if (this.cmbScheduleType.value === 'scheduled') {
                if (isNew) {
                    this._scheduleJob(options);
                } else {
                    this._updateTrigger(options);
                }
            }
            else {
                //Triggers a Job for immediate execution
                jobUtility.triggerJobAndDisplayProgressDialog(options);
            }
            this._closeDialog();
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
        /**
        * Schedules a recurring Trigger.
        * @param {Object} options - The options for the scheduled execution.
        */
        _scheduleJob: function (options) {
            var jobService = Sage.Services.getService('JobService');
            jobService.scheduleJob(options);
        },
        /**
        * Updates a recurring trigger.
        * @param {Object} options - The options for the scheduled trigger.
        */
        _updateTrigger: function (options) {
            var jobService = Sage.Services.getService('JobService');
            jobService.updateTrigger(options);
        },
        /**
        * Shows/Hides user interface controls depending on the schedule type (either "Run Now" or "Scheduled Execution").
        * @param {Object} options - The options for the scheduled execution.
        */
        _cmbScheduleType_OnChange: function () {
            if (this.cmbScheduleType) {
                var visible = (this.cmbScheduleType.value === 'scheduled');
                this._setVisible(this.jobSchedulingWidget.divJobSchedulingWidget, visible);
            }
        },
        /**
        * Shows/Hides a user interface controls.
        * @param {Object} property - The object to be shown/hidden.
        * @param {Boolean} visible - Whether the object is visible or not.
        */
        _setVisible: function (property, visible) {
            if (property && visible) {
                dojo.removeClass(property, 'display-none');
            }
            else if (property) {
                dojo.addClass(property, 'display-none');
            }
        },
        /**
        * Function called when the dialog is closed. Destroys the object recursively.
        */
        _closeDialog: function () {
            var self = this;
            this.jobSchedulingWidget.destroyWidget();
            self._dialog.hide();
            setTimeout(function () { self.destroyRecursive(); }, 1000);
        },
        /**
        * Validates required Job options. If a required value is missing, displays a message to the user.
        * @returns {Boolean} - True if all required options have been filled in. False otherwise.
        */
        _validateJobOptions: function () {
            if (typeof this._key !== 'string' || this._key === '') {
                dialogs.showError(dojoString.substitute(this.nlsResources.txtInvalidParameterMessage, [this.nlsResources.txtJobName_Caption]), this.nlsResources.txtInvalidParameterTitle);
                return false;
            }
            if (this.cmbScheduleType.value === 'scheduled') {
                if (this.jobSchedulingWidget.cboFrequency.get('value') === '') {
                    dialogs.showError(dojoString.substitute(this.nlsResources.txtInvalidParameterMessage, [this.nlsResources.cbofrequency_Caption]), this.nlsResources.txtInvalidParameterTitle);
                    return false;
                }
            }
            return true;
        },
        /**
        * Initiates the triggering/scheduling process.
        */
        _cmdOK_OnClick: function () {
            if (this._validateJobOptions()) {
                this._triggerJob();
            }
        },
        /**
        * Closes the Run Job Dialog.
        */
        _cmdCancel_OnClick: function () {
            this._closeDialog();
        },
        /**
        * Closes the Run Job Dialog.
        */
        _dialog_OnCancel: function () {
            this._closeDialog();
        },
        /**
        * Async load of Job details.
        */
        _getAndDisplayJobDetails: function () {
            var self = this;
            var svc = Sage.Services.getService('JobService');
            var key = this._key;
            var resourceKind = 'jobs';
            if (this._trigger) {
                //in edit mode
                resourceKind = 'triggers';
                key = this._trigger.$key;
            }
            var options = {
                key: key,
                resourceKind: resourceKind,
                success: function (result) {
                    if (result.job) {
                        self.txtJobName.set('value', result.job.$descriptor || result.job.$key);
                    }
                    self.txtTriggerDescription.set('value', result.$descriptor || result.$key);
                    self._setJobParametersGridStore(result.parameters);
                }
            };
            svc.getJobDefinition(options);
        },
        /**
        * Creates a DataStore for the parameters grid.
        * @param {Array} parameters - An array of parameters supported by the current Job Definition.
        */
        _setJobParametersGridStore: function (parameters) {
            var params = [];
            if (this._trigger) {
                var jobParameters = this._getJobParameters();
                var self = this;
                dojo.forEach(parameters, function (item) {
                    var description = self._getParameterDescription(jobParameters, item.name);
                    params.push({ name: item.name, value: item.value, description: description });
                });
            } else {
                params = parameters;
            }
            var data = {
                identifier: 'name',
                items: params
            };
            this._setParameterValueColumnBinding(this._trigger ? 'value' : 'defaultValue');
            var store = new itemFileWriteStore({ data: data });
            this.grdJobParameters.setStore(store);
        },
        _getParameterDescription: function (jobParameters, parameterName) {
            var description = '';
            dojo.forEach(jobParameters, function (item) {
                if (item.name === parameterName) {
                    description = item.description;
                }
            });
            return description;
        },
        _getJobParameters: function () {
            var job = null;
            var jobService = Sage.Services.getService('JobService');
            var request = new Sage.SData.Client.SDataSingleResourceRequest(jobService.getSchedulingSDataService());
            request.setResourceKind(dojoString.substitute("jobs('${0}')", [this._trigger.job.$key]));
            request.setQueryArg('select', 'parameters/*');
            request.read({
                async: false,
                success: function (result) {
                    job = result;
                }
            });
            return job ? job.parameters : job;
        },
        _setParameterValueColumnBinding: function (bindingField) {
            var self = this;
            dojo.forEach(this.grdJobParameters.layout.cells, function (item, index) {
                if (item.id === 'parameterValue') {
                    self.grdJobParameters.layout.cells[index].field = bindingField;
                }
            });
        }
    });
    return runJobDialog;
});