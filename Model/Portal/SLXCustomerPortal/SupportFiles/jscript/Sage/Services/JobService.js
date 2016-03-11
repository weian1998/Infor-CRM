/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/Utility',
    'Sage/UI/Dialogs',
    'dojo/_base/declare',
    'dojo/string',
    'dojo/i18n!./nls/JobService'
],
function (utility, dialogs, declare, dojoString, nlsStrings) {
    /**
    * Declare the JobService class.
    * @constructor
    */
    var jobService = declare('Sage.Services.JobService', null, {
        /**
        * Return an SDataService object configured for the 'scheduling' endpoint.
        * @returns {Object} - Sage.SData.Client.SDataService object.
        */
        getSchedulingSDataService: function () {
            var svc = new Sage.SData.Client.SDataService({
                serverName: window.location.hostname,
                virtualDirectory: Sage.Utility.getVirtualDirectoryName() + '/slxdata.ashx',
                applicationName: '$app',
                contractName: 'scheduling',
                port: window.location.port && window.location.port !== 80 ? window.location.port : false,
                protocol: /https/i.test(window.location.protocol) ? 'https' : false,
                json: true
            });
            return svc;
        },
        /**
        * Gets the Job or Trigger definition based on options.resourceKind via an async call to the server.
        * Equivalent to GET /$app/scheduling/-/jobs('key')?format=json
        * @param {Object} options - Options for the function.
        * @param {string} options.key - The id of the job. Example: 'Sage.SalesLogix.BusinessRules.Jobs.UpdateEntityJob'.
        * @param {function} [options.success] - An optional callback function to be executed on success.
        * @param {function} [options.failure] - An optional callback function to be executed on failure.
        */
        getJobDefinition: function (options) {
            if (!options) {
                dialogs.showError(dojoString.substitute(nlsStrings.txtInvalidParameter, ["options"]), "Job Service");
                return;
            }

            if (typeof options.key !== "string") {
                dialogs.showError(dojoString.substitute(nlsStrings.txtInvalidParameter, ["options.key"]), "Job Service");
                return;
            }

            //Get SData service
            var svc = this.getSchedulingSDataService();

            //Prepare request
            var request = new Sage.SData.Client.SDataSingleResourceRequest(svc);
            request.setQueryArg('include', '$descriptors');
            request.setResourceKind(dojoString.substitute("${0}('${1}')", [options.resourceKind, options.key]));

            //Execute async call
            request.read({
                success: function (result) {
                    if (options.success) {
                        options.success(result);
                    }
                },
                failure: function (xhr, sdata) {
                    var errorMsg = "getJobDefinition: " + dojoString.substitute(nlsStrings.txtUnexpectedError, [xhr.status, xhr.statusText]);
                    console.log(errorMsg);
                    if (options.failure) {
                        options.failure(xhr, sdata);
                    }
                }
            });
        },
        /**
        * Gets Execution via an async call to the server.
        * Equivalent to GET /$app/scheduling/‐/executions(triggerId eq 'triggerId')?format=json
        * @param {Object} options - Options for the function.
        * @param {string} options.triggerId - The triggerId of the execution. Example: 'fb66f331‐0a42‐4209‐a8b9‐d4acbce0da69'.
        * @param {string} options.executionId - The executionId of the execution. Example: '"NON_CLUSTERED635201180885272788'.
        * @param {function} [options.success] - An optional callback function to be executed on success.
        * @param {function} [options.failure] - An optional callback function to be executed on failure.
        */
        getExecution: function (options) {
            if (!options) {
                dialogs.showError(dojoString.substitute(nlsStrings.txtInvalidParameter, ['options']), 'Job Service');
                return;
            }

            if ((typeof options.triggerId !== 'string') && (typeof options.executionId !== 'string')) {
                dialogs.showError(dojoString.substitute(nlsStrings.txtInvalidParameter, ['options.triggerId or options.executionId']), 'Job Service');
                return;
            }

            //Get service
            var svc = this.getSchedulingSDataService();
            var request = new Sage.SData.Client.SDataSingleResourceRequest(svc);

            if (typeof options.triggerId === 'string') {
                request.setResourceKind('executions');
                request.setQueryArg('include', '$descriptors');
                request.setQueryArg("where", dojoString.substitute("triggerId eq '${0}'", [options.triggerId]));
            }
            if (typeof options.executionId === 'string') {
                request.setResourceKind(dojoString.substitute("executions(\'${0}\')", [options.executionId]));
            }

            //Execute async call
            request.read({
                success: function (result) {
                    if (options.success) {
                        options.success(result);
                    }
                },
                failure: function (xhr, sdata) {
                    var errorMsg = 'getExecution: ' + dojoString.substitute(nlsStrings.txtUnexpectedError, [xhr.status, xhr.statusText]);
                    console.error(errorMsg);
                    if (options.failure) {
                        options.failure(xhr, sdata);
                    }
                }
            });
        },
        /**
        * Signals the Execution to be interrupted via an async call to the server.
        * Equivalent to POST /sdata/$app/scheduling/‐/executions('key')/$service/interrupt?format=json
        * @param {Object} options - Options for the function.
        * @param {string} options.key - The id of the execution. Example: 'NON_CLUSTERED634533395037763955'.
        * @param {function} [options.success] - An optional callback function to be executed on success.
        * @param {function} [options.failure] - An optional callback function to be executed on failure.
        */
        interruptExecution: function (options) {
            if (!options) {
                dialogs.showError(dojoString.substitute(nlsStrings.txtInvalidParameter, ['options']), 'Job Service');
                return;
            }

            if (typeof options.key !== 'string') {
                dialogs.showError(dojoString.substitute(nlsStrings.txtInvalidParameter, ['options.key']), 'Job Service');
                return;
            }

            //Get SData service
            var schedulingService = this.getSchedulingSDataService();

            //Prepare request
            var request = new Sage.SData.Client.SDataServiceOperationRequest(schedulingService);
            request.setApplicationName('$app');
            request.setOperationName('interrupt');
            request.setResourceKind("executions('" + options.key + "')");

            //Prepare payload
            var entry = {};

            //Execute async call
            request.execute(entry, {
                success: function (result) {
                    if (options.success) {
                        options.success(result);
                    }
                },
                failure: function (xhr, sdata) {
                    var errorMsg = dojoString.substitute(nlsStrings.txtTriggerJobError, [options.key, xhr.status, xhr.statusText]);
                    console.error(errorMsg);
                    if (options.failure) {
                        options.failure(xhr, sdata);
                    }
                }
            });
        },
        /**
        * Schedules a recurring Trigger.
        * @param {Object} options - Options for the function.
        * @param {string} options.key - The id of the job to be executed. Example: 'Sage.SalesLogix.BusinessRules.Jobs.UpdateEntityJob'.
        * @param {Date | number} [options.startTime=null] - The start date. If numeric, it assumed to be the primitive value of a Date object.
        * @param {Date | number} [options.endTime=null] - The end date. If numeric, it assumed to be the primitive value of a Date object.
        * @param {Array} [options.parameters] - An array containing parameters to be passed to the Job execution.
        * @param {function} [options.success] - An optional callback function to be executed on success.
        * @param {function} [options.failure] - An optional callback function to be executed on failure.
        */
        scheduleJob: function (options) {
            if (!options) {
                dialogs.showError(dojoString.substitute(nlsStrings.txtInvalidParameter, ["options"]), 'Job Service');
                return;
            }
            if (typeof options.key !== 'string') {
                dialogs.showError(dojoString.substitute(nlsStrings.txtInvalidParameter, ['options.key']), 'Job Service');
                return;
            }
            var schedulingService = this.getSchedulingSDataService();

            //Prepare payload
            var entry = {
                $descriptor: options.descriptor ? options.descriptor : '',
                job: { $key: options.key },
                startTimeUtc: options.startTime,
                endTimeUtc: options.endTime,
                parameters: options.parameters,
                //user: { $key: options.user },
                cronExpression: options.cronExpression
            };

            //Prepare the request
            var request = new Sage.SData.Client.SDataApplicationRequest(schedulingService);
            request.setResourceKind('triggers');

            //This is a hack, replace the "execute" function on the fly, so that it calls executeServiceOperation
            //This was the only way I found to be able to execute a post exactly as the scheduling endpoint expects
            request.execute = function (entry, options) {
                return request.service.executeServiceOperation(request, entry, options);
            },

            //Execute async call
            request.execute(entry, {
                success: function (result) {
                    if (options.success) {
                        options.success(result);
                    }
                },
                failure: function (xhr, sdata) {
                    var errorMsg = dojoString.substitute(nlsStrings.txtScheduleJobError, [options.key, xhr.status, xhr.statusText]);
                    console.error(errorMsg);

                    if (options.failure) {
                        options.failure(xhr, sdata);
                    }
                }
            }); // jshint ignore:line
        },
        /**
        * Gets the details of a Trigger.
        * @param {Object} options - Options for the function.
        * @param {string} options.triggerId - The triggerId. Example: 'fb66f331‐0a42‐4209‐a8b9‐d4acbce0da69'.   
        * @param {function} [options.success] - An optional callback function to be executed on success.
        * @param {function} [options.failure] - An optional callback function to be executed on failure.
        */
        getTrigger: function (options) {

            if (!options) {
                dialogs.showError(dojoString.substitute(nlsStrings.txtInvalidParameter, ['options']), 'Job Service');
                return;
            }

            if ((typeof options.triggerId !== 'string')) {
                dialogs.showError(dojoString.substitute(nlsStrings.txtInvalidParameter, ['options.triggerId']), 'Job Service');
                return;
            }

            var schedulingService = this.getSchedulingSDataService();
            var request = new Sage.SData.Client.SDataSingleResourceRequest(schedulingService);
            request.setResourceKind(dojoString.substitute("triggers('${0}')", [options.triggerId]));

            //Execute async call
            request.read({
                success: function (result) {
                    if (options.success) {
                        options.success(result);
                    }
                },
                failure: function (xhr, sdata) {
                    var errorMsg = 'getExecution: ' + dojoString.substitute(nlsStrings.txtUnexpectedError, [xhr.status, xhr.statusText]);
                    console.error(errorMsg);
                    if (options.failure) {
                        options.failure(xhr, sdata);
                    }
                }
            });

        },

        /**
        * Updates a scheduled trigger.
        * @param {Object} options - Options for the function.
        * @param {string} options.key - The id of the trigger to be updated.
        * @param {Date | number} [options.startTime=null] - The start date. If numeric, it assumed to be the primitive value of a Date object.
        * @param {Date | number} [options.endTime=null] - The end date. If numeric, it assumed to be the primitive value of a Date object.
        * @param {Array} [options.parameters] - An array containing parameters to be passed to the scheduled trigger.
        * @param {function} [options.success] - An optional callback function to be executed on success.
        * @param {function} [options.failure] - An optional callback function to be executed on failure.
        */
        updateTrigger: function (options) {
            if (!options) {
                dialogs.showError(dojoString.substitute(nlsStrings.txtInvalidParameter, ["options"]), 'Job Service');
                return;
            }
            if (typeof options.key !== 'string') {
                dialogs.showError(dojoString.substitute(nlsStrings.txtInvalidParameter, ['options.key']), 'Job Service');
                return;
            }
            var schedulingService = this.getSchedulingSDataService();

            //Prepare payload
            var entry = {
                $descriptor: options.descriptor,
                job: { $key: options.key },
                startTimeUtc: options.startTime,
                endTimeUtc: options.endTime,
                parameters: options.parameters,
                //user: { $key: options.user },
                cronExpression: options.cronExpression
            };

            var request = new Sage.SData.Client.SDataSingleResourceRequest(schedulingService);
            request.setResourceKind('triggers');
            request.setResourceSelector(dojoString.substitute("'${0}'", [options.key]));

            request.update(entry, {
                success: function (result) {
                    if (options.success) {
                        options.success(result);
                    }
                },
                failure: function (xhr, sdata) {
                    var errorMsg = dojoString.substitute(nlsStrings.txtScheduleJobError, [options.key, xhr.status, xhr.statusText]);
                    console.log(errorMsg);

                    if (options.failure) {
                        options.failure(xhr, sdata);
                    }
                }
            });
        },
        deleteScheduledJob: function (key, def) {
            if (!key) {
                return false;
            }

            var defer = (typeof def === "object" && def !== null);

            var schedulingService = this.getSchedulingSDataService();
            var request = new Sage.SData.Client.SDataApplicationRequest(schedulingService);
            request.setApplicationName('$app');
            request.setQueryArg('format', 'json');
            request.setQueryArg('hasErrorHandler', 'true');
            request.setResourceKind(dojoString.substitute("triggers('${0}')", [key]));

            dojo.xhrDelete({
                handleAs: 'json',
                url: request.uri.toString(),
                preventCache: true,
                load: function(data) {
                    if (defer) {
                        def.callback(data);
                    }
                },
                error: function(error, ioargs) {
                    utility.ErrorHandler.handleHttpError(error, ioargs);
                    if (defer) {
                        def.errback(error);
                    }
                }
            });
           
            return true;
        },
        /**
        * Triggers a Job for immediate execution.
        * @param {Object} options - Options for the function.
        * @param {string} options.key - The id of the job to be executed. Example: 'Sage.SalesLogix.BusinessRules.Jobs.UpdateEntityJob'.
        * @param {Array} [options.parameters] - An array containing parameters to be passed to the Job execution.
        * @param {function} [options.success] - An optional callback function to be executed on success.
        * @param {function} [options.failure] - An optional callback function to be executed on failure.
        */
        triggerJob: function (options) {
            if (!options) {
                dialogs.showError(dojoString.substitute(nlsStrings.txtInvalidParameter, ['options']), 'Job Service');
                return;
            }
            if (typeof options.key !== 'string') {
                dialogs.showError(dojoString.substitute(nlsStrings.txtInvalidParameter, ['options.key']), 'Job Service');
                return;
            }

            //Get SData service
            var schedulingService = this.getSchedulingSDataService();

            //Prepare payload
            var entry = {
                name: options.key,
                request: {
                    parameters: options.parameters ? options.parameters : []
                }
            };

            //Prepare request
            var request = new Sage.SData.Client.SDataServiceOperationRequest(schedulingService);
            request.setApplicationName('$app');
            request.setOperationName('trigger');
            request.setResourceKind("jobs('" + options.key + "')");

            //Execute async call
            request.execute(entry, {
                success: function (result) {
                    if (options.success) {
                        options.success(result);
                    }
                },
                failure: function (xhr, sdata) {
                    var errorMsg = dojoString.substitute(nlsStrings.txtTriggerJobError, [options.key, xhr.status, xhr.statusText]);
                    console.error(errorMsg);
                    if (options.failure) {
                        options.failure(xhr, sdata);
                    }
                }
            });
        }
    }); // end dojo declare
    /*
    * Make an instance of this service available to the Sage.Services.getService method.
    */
    if (!Sage.Services.hasService('JobService')) {
        Sage.Services.addService('JobService', new Sage.Services.JobService());
    }
    return jobService;
});
