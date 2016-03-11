/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/_Widget',
    'dijit/form/Select',
    'dijit/form/Button',
    'Sage/UI/ImageButton',
    'dojo/text!./templates/JobSchedulingWidget.html',
    'dojo/i18n!./nls/JobSchedulingWidget',
    'dojo/_base/declare',
    'dojo/string',
    'Sage/UI/Dialogs',
    'Sage/UI/Controls/DateTimePicker'
],
function (templatedMixin, widgetsInTemplateMixin, widget, select, button, imageButton, jobSchedulingTemplate, jobSchedulingStrings, declare, dojoString, dialogs) {
    var jobSchedulingWidget = declare('Sage.UI.JobSchedulingWidget', [widget, templatedMixin, widgetsInTemplateMixin], {
        cronExpression: '',
        displayStartEndTime: true,
        minuteOptions: ['1', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'],
        pastHourOptions: ['0', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'],
        hourOptions: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'],
        cronFields: { seconds: 0, minutes: '*', hours: '*', days: '*', weeks: '*', months: '*', years: '*' },
        cronExpressionVisible: true,
        _initialized: false,
        widgetsInTemplate: true,
        templateString: jobSchedulingTemplate,
        postMixInProperties: function () {
            dojo.mixin(this, jobSchedulingStrings);
        },
        initialize: function (options) {
            dojo.mixin(this, options);
            if (this.trigger) {
                this.cronExpression = this.trigger.cronExpression;
            } else {
                this.cronExpressionVisible = false;
            }

            this.txtCronExpression.set('value', this.cronExpression);
            this._parseCronExpression();
            this.cboFrequency.set('value', this._getFrequencyType());
            this._loadScheduleDetails();
            this._initializeControlState();
            //currently not supported remove it from the list for now
            this.cboFrequency.removeOption('yearly');
        },
        _initializeListOptions: function (control, selectedValue, listOptions) {
            var options = [];
            this._clearComboBox(control);
            dojo.forEach(listOptions, function (listOption) {
                var option = { selected: false, label: listOption, value: listOption };
                if (selectedValue === listOption) {
                    option.selected = true;
                }
                options.push(option);
            });
            control.addOption(options);
        },
        _parseCronExpression: function () {
            if (this.cronExpression) {
                //valid cron expression contains 6 or 7 fields, the 7th field (years) is optional, each field is seperated by a space
                var parts = this.cronExpression.split(' ');
                if (parts.length === 6 || parts.length === 7) {
                    this.cronFields.seconds = parts[0];
                    this.cronFields.minutes = parts[1];
                    this.cronFields.hours = parts[2];
                    this.cronFields.days = parts[3];
                    this.cronFields.weeks = parts[4];
                    this.cronFields.months = parts[5];
                    this.cronFields.years = parts.length === 6 ? parts[6] : '*';
                }
            }
        },
        _getFrequencyType: function () {
            var frequency = 'daily';
            if (!this.cronExpression) {
                return frequency;
            }

            var invalidChars = [];
            //this should represent either a weekly, monthly or yearly type...at least from our UI perspective
            if (this.cronFields.days === '?') {
                if (this.cronFields.months === 'MON-FRI') {
                    this.cronExpressionVisible = false;
                    return 'weekday';
                } else if (this.cronFields.months.indexOf('#') !== -1) {
                    invalidChars = ['/'];
                    //if this is a yearly type the weekly field should be a whole number
                    if (!isNaN(this.cronFields.weeks)) {
                        //this is a yearly type not support in the UI
                        this.cronExpressionVisible = true;
                    } else if (this._isValid(this.cronFields.days, invalidChars)) {
                        frequency = 'monthly';
                        this.cronExpressionVisible = false;
                    }
                } else if (this._isWeeklyType()) {
                    this.cronExpressionVisible = false;
                    return 'weekly';
                }
            }
            if (this.cronFields.months === '?' && (this.cronFields.days === '1/1' || this.cronFields.days === '*')) {
                if (!isNaN(this.cronFields.hours)) {
                    this.cronExpressionVisible = false;
                    return 'daily';
                } else {
                    var part = this.cronFields.hours.split('/');
                    if (part.length > 1) {
                        this.cronExpressionVisible = false;
                        return 'hourly';
                    } else {
                        part = this.cronFields.minutes.split('/');
                        if (part.length > 1) {
                            this.cronExpressionVisible = false;
                            return 'minutes';
                        }
                    }
                }
            }
            return frequency;
        },
        /**
        * Returns a boolean indicating whether or not the cron expression is formated in a way that the UI understands.
        * @returns {Boolean} - weekly frequency type if expression is in format of i.e. field 5 (MON or 2), currently UI does not support multiple days.
        */
        _isWeeklyType: function () {
            var invalidChars = [',', '-', '*', '?', '/', 'L', '#'];
            if (this._isValid(this.cronFields.months, invalidChars)) {
                return true;
            } else {
                return false;
            }
        },
        _loadScheduleDetails: function () {
            if (this.cronExpression) {
                this._loadCronScheduleDetails();
            } else {
                this._loadFromPropScheduleDetails();
            }
        },
        /**
        * Loads the UI based on the trigger details and frequency type.
        */
        _loadFromPropScheduleDetails: function () {
            this.cronExpressionVisible = false;
            if (this.trigger) {
            }
        },
        /**
        * Loads the UI based on the cron expression and frequency type.
        */
        _loadCronScheduleDetails: function () {
            var part;
            switch (this.cboFrequency.get('value')) {
                case 'minutes':
                    part = this.cronFields.minutes.split('/');
                    this._initializeListOptions(this.cboMinutesHours, part[1], this.minuteOptions);
                    break;
                case 'hourly':
                    part = this.cronFields.hours.split('/');
                    this._initializeListOptions(this.cboMinutesHours, part[1], this.hourOptions);
                    this.cboMinutesHours.set('value', part[1]);
                    this._initializeListOptions(this.cboMinutesPastHour, this.cronFields.minutes, this.pastHourOptions);
                    this.cboMinutesPastHour.set('value', this.cronFields.minutes);
                    break;
                case 'weekly':
                    this.cboDay.set('value', this._convertDayToStr(this.cronFields.months));
                    break;
                case 'monthly':
                    part = this.cronFields.months.split('#');
                    this.cboDay.set('value', this._convertDayToStr(part[0]));
                    this.cboMonthDay.set('value', part[1]);
                    break;
            }
        },
        /**
        * Converts the day if specified as a numeric value into the string equivalent.
        * @returns {String} - The string value equivalent of the day
        */
        _convertDayToStr: function (day) {
            if (!isNaN(day)) {
                switch (day) {
                    case 1:
                        return 'SUN';
                    case 3:
                        return 'TUE';
                    case 4:
                        return 'WED';
                    case 5:
                        return 'THU';
                    case 6:
                        return 'FRI';
                    case 7:
                        return 'SAT';
                    default:
                        return 'MON';
                }
            } else {
                return day;
            }
        },
        _convertDayToInt: function (day) {
            switch (day) {
                case 'SUN':
                    return 0;
                case 'MON':
                    return 1;
                case 'TUE':
                    return 2;
                case 'WED':
                    return 3;
                case 'THU':
                    return 4;
                case 'FRI':
                    return 5;
                case 'SAT':
                    return 6;
            }
        },
        /**
        * Parses a field of the cron expression based on what the UI currently supports.
        * @returns {Boolean} - True if the cron expression field is formatted in a way the UI can parse
        */
        _isValidExpression: function () {
            var invalidChars = [];
            switch (this.cboFrequency.get('value')) {
                case 'minutes':
                    invalidChars = [',', '-'];
                    return this._isValid(this.cronFields.minutes, invalidChars);
                case 'hourly':
                    invalidChars = [',', '-'];
                    return this._isValid(this.cronFields.hours, invalidChars);
                case 'daily':
                case 'weekly':
                    return true;
                case 'monthly':
                    invalidChars = [',', '-', '?', '/', 'L'];
                    return this._isValid(this.cronFields.months, invalidChars);
                default:
                    return false;
            }
        },
        _isValid: function (expression, invalidChars) {
            var result = true;
            dojo.every(invalidChars, function (character) {
                if (expression.indexOf(character) !== -1) {
                    result = false;
                }
            });
            return result;
        },
        _assignDateValues: function () {
            switch (this.cboFrequency.get('value')) {
                case 'daily':
                case 'weekday':
                case 'weekly':
                case 'monthly':
                case 'yearly':
                    var currentDate = new Date();
                    var invalidChars = [',', '-', '*'];
                    var minutes = this._getTimePart(this.cronFields.minutes, invalidChars);
                    if (this._isNumber(minutes)) {
                        currentDate.setMinutes(minutes);
                    }
                    var hours = this._getTimePart(this.cronFields.hours, invalidChars);
                    if (this._isNumber(hours)) {
                        currentDate.setHours(this.cronFields.hours);
                    }
                    if (this.trigger && this._isNumber(minutes) && this._isNumber(hours)) {
                        this.dtRunAtTime.set('value', currentDate);
                    }
                    break;
            }
            if (this.trigger) {
                if (this.trigger.startTimeUtc) {
                    this.dtRunFromDate.set('value', new Date(parseInt(this.trigger.startTimeUtc.substr(6))));
                }
                if (this.trigger.endTimeUtc) {
                    this.dtRunToDate.set('value', new Date(parseInt(this.trigger.endTimeUtc.substr(6))));
                }
            }
        },
        /**
        * Parses the minute or hour field of the cron expression, which can then be represent in a date value.
        * @returns {Int} - Value of the cron expression field representing the minute/hour portion.
        */
        _getTimePart: function (timePart, invalidChars) {
            var result = 'invalid';
            if (this._isNumber(timePart)) {
                result = parseInt(timePart);
            } else {
                if (this._isValid(timePart, invalidChars)) {
                    var part = timePart.split('/');
                    if (part.length > 1) {
                        result = part[1];
                    }
                }
            }
            return result;
        },
        _isNumber: function (value) {
            var reg = new RegExp('^[0-9]+$');
            return !!reg.test(value);
        },
        /**
        * Initializes the visibility state of the widget based on the frequency type of the trigger.
        */
        _initializeControlState: function () {
            var frequency = this.cboFrequency.get('value').valueOf();
            this._setVisibility(this.divMinutesHours, frequency === 'minutes' || frequency === 'hourly');
            this._setVisibility(this.lblOnText, frequency === 'weekly');
            this._setVisibility(this.lblOnTheText, frequency === 'monthly');
            this._setVisibility(this.divMonthDay, frequency === 'monthly');
            this._setVisibility(this.divDay, frequency === 'weekly' || frequency === 'monthly');
            this._setVisibility(this.lblAtText, frequency !== 'minutes');
            this._setVisibility(this.divRunAtTime, frequency !== 'minutes' && frequency !== 'hourly');
            this._setVisibility(this.lblMinutesPastHour, frequency === 'hourly');
            this._setVisibility(this.divMinutesPastHour, frequency === 'hourly');
            this._setVisibility(this.rowCronExpression, this.cronExpressionVisible);
        },
        /**
        * OnChange event of the frequency control. Resets the widgets UI based on the selected value.
        */
        _onFrequencyChange: function () {
            var frequency = this.cboFrequency.get('value').valueOf();
            if (frequency === 'minutes') {
                if (this.initialized) {
                    this._initializeListOptions(this.cboMinutesHours, '5', this.minuteOptions);
                }
            } else if (frequency === 'hourly') {
                if (this.initialized) {
                    this._initializeListOptions(this.cboMinutesHours, '1', this.hourOptions);
                }
                if (this.cboMinutesPastHour.options.length === 0) {
                    this._initializeListOptions(this.cboMinutesPastHour, '0', this.pastHourOptions);
                }
            }
            if (!this.initialized) {
                this.initialized = true;
                this._assignDateValues();
            }
            this._initializeControlState();
        },
        /**
        * Removes the items from the options collection of the combo box.
        */
        _clearComboBox: function (property) {
            var options = property.options.length;
            for (var i = 0; i < options; i++) {
                //removeOption causes list to reload, always delete the first item in the list
                property.removeOption(0);
            }
        },
        /**
        * Shows/Hides a user interface controls.
        * @param {Object} property - The object to be shown/hidden.
        * @param {Boolean} visible - Whether the object is visible or not.
        */
        _setVisibility: function (property, visible) {
            if (property && visible) {
                dojo.removeClass(property, 'display-none');
            } else if (property) {
                dojo.addClass(property, 'display-none');
            }
        },
        _buildCronExpression: function () {
            return dojoString.substitute('${0} ${1} ${2} ${3} ${4} ${5} ${6}', [this._getFormatedSeconds(), this._getFormatedMinutes(), this._getFormatedHours(),
                this._getFormatedDaysOfMonth(), this._getFormatedMonths(), this._getFormatedDaysOfWeek(), this._getFormatedYears()]);
        },
        /**
        * Returns a integer containing the 'seconds' portion of the cron expression as represented in field 1 of the expression.
        * @returns {Integer} - seconds portion of the cron expression not currently supported in the UI, return default value of 0.
        */
        _getFormatedSeconds: function () {
            return 0;
        },
        /**
        * Returns a string containing the 'minutes' portion of the cron expression as represented in field 2 of the expression.
        * @returns {String} - minutes portion of the cron expression.
        */
        _getFormatedMinutes: function () {
            //the first option in this field will likely represent 0 (cronmaker default) which is the number of minutes after the current start time the job
            //will begin, our UI currently doesn't support this option so we will always assume 0
            //indicates 0
            switch (this.cboFrequency.get('value')) {
                case 'minutes':
                    return dojoString.substitute('0/${0}', [this.cboMinutesHours.get('value')]);
                case 'hourly':
                    return this.cboMinutesPastHour.get('value');
                case 'daily':
                case 'weekly':
                case 'monthly':
                case 'yearly':
                    return this._getTimePortion(true);
                default:
                    return '*';
            }
        },
        /**
        * Returns a string containing the 'hours' portion of the cron expression as represented in field 3 of the expression.
        * @returns {String} - hours portion of the cron expression.
        */
        _getFormatedHours: function () {
            switch (this.cboFrequency.get('value')) {
                case 'minutes':
                    return '*';
                case 'hourly':
                    return dojoString.substitute('0/${0}', [this.cboMinutesHours.get('value')]);
                default:
                    // 'daily': case 'weekly': case 'monthly': case 'yearly':
                    return this._getTimePortion(false);
            }
        },
        _getTimePortion: function (minPortion) {
            if (minPortion) {
                var minutes = this.dtRunAtTime.getTimeValue();
                return minutes.getMinutes();
            } else {
                var hour = this.dtRunAtTime.getTimeValue();
                return hour.getHours();
            }
        },
        /**
        * Returns a string containing the 'days of month' portion of the cron expression as represented in field 4 of the expression.
        * @returns {String} - days of month portion of the cron expression.
        */
        _getFormatedDaysOfMonth: function () {
            switch (this.cboFrequency.get('value')) {
                case 'minutes':
                case 'hourly':
                case 'daily':
                    //this could also likely be formatted as 1/1 (cronmaker.com default), for simplicity we will just include '*'.
                    return '*';
                case 'weekday':
                case 'weekly':
                case 'monthly':
                case 'yearly':
                    return '?';
                default:
                    return '*';
            }
        },
        /**
        * Returns a string containing the 'months' portion of the cron expression as represented in field 5 of the expression.
        * @returns {String} - months portion of the cron expression.
        */
        _getFormatedMonths: function () {
            //UI currently doesn't support this option, just return the default option
            return '*';
        },
        /**
        * Returns a string containing the 'days of week' portion of the cron expression as represented in field 6 of the expression.
        * @returns {String} - days of week portion of the cron expression.
        */
        _getFormatedDaysOfWeek: function () {
            switch (this.cboFrequency.get('value')) {
                case 'minutes':
                case 'daily':
                case 'hourly':
                    return '?';
                case 'weekday':
                    return 'MON-FRI';
                case 'weekly':
                    return this.cboDay.get('value');
                case 'monthly':
                case 'yearly':
                    return dojoString.substitute('${0}#${1}', [this.cboDay.get('value'), this.cboMonthDay.get('value')]);
                default:
                    return '*';
            }
        },
        /**
        * Returns a string containing the 'years' portion of the cron expression as represented in field 7 of the expression. This is an
        * optional field within the expression, which we currently don't support in our UI
        * @returns {String} - years portion of the cron expression, return default value '*', which represents every year.
        */
        _getFormatedYears: function () {
            return '*';
        },
        _isSameDate: function (fromDate, toDate) {
            return fromDate.getFullYear() === toDate.getFullYear() && fromDate.getMonth() === toDate.getMonth() && fromDate.getDate() === toDate.getDate();
        },
        _getDaysDateDiff: function (date1, date2) {
            var oneDay = 1000 * 60 * 60 * 24;
            var difference = Math.abs(date1.getTime() - date2.getTime());
            return Math.round(difference / oneDay);
        },
        /**
        * Return an object containing Job execution options.
        * @returns {Object} - Job execution options.
        */
        getJobSchedulingOptions: function () {
            var options = {
                startTime: this.dtRunFromDate.focusNode.value === '' ? null : this.dtRunFromDate.getValue(),
                endTime: this.dtRunToDate.focusNode.value === '' ? null : this.dtRunToDate.getValue(),
                cronExpression: this._buildCronExpression()
            };
            return options;
        },
        validateSchedule: function (requireStartDate, requireEndDate) {
            var fromDate = this.dtRunFromDate.focusNode.value === '' ? null : this.dtRunFromDate.getValue();
            var toDate = this.dtRunToDate.focusNode.value === '' ? null : this.dtRunToDate.getValue();
            var onDay = null;
            if (requireStartDate && !fromDate || (requireEndDate && !fromDate || requireEndDate && !toDate)) {
                if (!fromDate) {
                    dialogs.showError(this.txtInvalidStartDate, this.txtInvalidScheduleTitle);
                } else {
                    dialogs.showError(this.txtInvalidEndDate, this.txtInvalidScheduleTitle);
                }
                return false;
            }

            //if there is no requirement on the start/end date then no need to do any validation
            if (!fromDate && !toDate) {
                return true;
            }

            //first make sure that the end time is not prior to the start time
            if (fromDate && toDate && fromDate >= toDate || !fromDate && toDate) {
                dialogs.showError(this.txtInvalidDatesMessage, this.txtInvalidScheduleTitle);
                return false;
            }
            //if there is no toDate then validation is not required
            if (!toDate) {
                return true;
            }
            fromDate = new Date(fromDate);
            toDate = new Date(toDate);
            switch (this.cboFrequency.get('value')) {
                case 'minutes':
                    if (fromDate.setMinutes(fromDate.getMinutes() + parseInt(this.cboMinutesHours.get('value'))) >= toDate) {
                        dialogs.showError(this.txtInvalidScheduleTime, this.txtInvalidScheduleTitle);
                        return false;
                    }
                    return true;
                case 'hourly':
                    if (fromDate.setHours(fromDate.getHours() + parseInt(this.cboMinutesHours.get('value'))) >= toDate) {
                        dialogs.showError(this.txtInvalidScheduleTime, this.txtInvalidScheduleTitle);
                        return false;
                    }
                    return true;
                case 'daily': case 'weekday':
                    if (this._isSameDate(fromDate, toDate)) {
                        dialogs.showError(this.txtInvalidScheduleTime, this.txtInvalidScheduleTitle);
                        return false;
                    }
                    return true;
                case 'weekly':
                    if (this._isSameDate(fromDate, toDate)) {
                        dialogs.showError(this.txtInvalidScheduleTime, this.txtInvalidScheduleTitle);
                        return false;
                    } else if (toDate.getDate() - fromDate.getDate() < 7) {
                        onDay = this._convertDayToInt(this.cboDay.get('value'));
                        var nextOccurrence = fromDate;
                        nextOccurrence.setDate(nextOccurrence.getDate() + (nextOccurrence.getDay() + onDay));
                        if (nextOccurrence > toDate) {
                            dialogs.showError(this.txtInvalidScheduleTime, this.txtInvalidScheduleTitle);
                            return false;
                        }
                    }
                    return true;
                case 'monthly':
                    if (this._isSameDate(fromDate, toDate)) {
                        dialogs.showError(this.txtInvalidScheduleTime, this.txtInvalidScheduleTitle);
                        return false;
                    } else if (this._getDaysDateDiff(toDate, fromDate) < 31) {
                        var monthDay = parseInt(this.cboMonthDay.get('value'));
                        onDay = this._convertDayToInt(this.cboDay.get('value'));
                        var fromMonthNextOccurrence = this._moveToNthOccurrence(fromDate, monthDay, onDay, '', '');
                        var toMonthNextOccurrence = this._moveToNthOccurrence(toDate, monthDay, onDay, '', '');
                        if (fromMonthNextOccurrence <= fromDate) {
                            //next occurrence has to be prior to the end date but after the start date
                            if (toMonthNextOccurrence <= fromMonthNextOccurrence || toMonthNextOccurrence >= toDate) {
                                dialogs.showError(this.txtInvalidScheduleTime, this.txtInvalidScheduleTitle);
                                return false;
                            }
                        }
                        //dialogs.showError(this.txtInvalidScheduleTime, this.txtInvalidScheduleTitle);
                    }
                    return true;
            }
            return false;
        },
        _moveToNthOccurrence: function (currentDate, index, day, month, year) {
            var date = new Date(currentDate);
            // Set to first day of month
            date.setDate(1);
            // If supplied - set the month
            if (month !== '' && month !== undefined) {
                date.setMonth(month);
            } else {
                month = date.getMonth();
            }
            // If supplied - set the year
            if (year !== '' && year !== undefined) {
                date.setFullYear(year);
            } else {
                year = date.getFullYear();
            }
            while (date.getDay() != day) {
                date.setDate(date.getDate() + 1);
            }
            switch (index) {
                case 2:
                    date.setDate(date.getDate() + 7);
                    break;
                case 3:
                    date.setDate(date.getDate() + 14);
                    break;
                case 4:
                    date.setDate(date.getDate() + 21);
                    break;
                case 5:
                    date.setDate(date.getDate() + 28);
                    if (date.getMonth() !== month) {
                        date = null;
                    }
                    break;
            }
            return date;
        },
        destroyWidget: function () {
            this.destroyRecursive();
        }
    });
    return jobSchedulingWidget;
});
