/* Copyright (c) 2010, Sage Software, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @class argos.Calendar
 * @alternateClassName Calendar
 */
define('argos/Calendar', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/string',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/dom-style',
    'argos/View',
    'moment'
], function(
    declare,
    lang,
    string,
    domAttr,
    domClass,
    domConstruct,
    domStyle,
    View,
    moment
) {
    var pad,
        uCase,
        __class;

    pad = function(n) {
        return n < 10 ? '0' + n : n;
    };

    uCase = function(str) {
        return str.charAt(0).toUpperCase() + str.substring(1);
    };

    __class = declare('argos.Calendar', [View], {
        // Localization
        titleText: 'Calendar',
        amText: 'AM',
        pmText: 'PM',

        id: 'generic_calendar',
        contentNode: null,
        calendarNode: null,
        timeNode: null,
        meridiemNode: null,
        monthsShortText: [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec'
        ],
        months: null,
        dateFormat: moment().lang()._longDateFormat.L,
        timeFormatText: 'h:mm A',
        is24hrTimeFormat: moment().lang()._longDateFormat.LT.match(/H\:/),
        date: false,
        showTimePicker: false,
        timeless: false,
        selectorTemplate:  '<select id="${0}-field" data-dojo-attach-point="${0}Node"></select>',
        incrementTemplate: '<button data-action="increment${0}" class="button">+</button>',
        decrementTemplate: '<button data-action="decrement${0}" class="button">-</button>',
        widgetTemplate: new Simplate([
            '<div id="{%= $.id %}" title="{%: $.titleText %}" class="panel {%= $.cls %}">',
                '<div class="panel-content" id="datetime-picker">',
                    '<div class="calendar-content">',
                    '<table id="datetime-picker-date" data-dojo-attach-point="datePickControl">',
                        '<caption>&nbsp;</caption>',
                        '<tr class="plus">',
                            '<td>{%= $.localizeViewTemplate("incrementTemplate", 0) %}</td>',
                            '<td>{%= $.localizeViewTemplate("incrementTemplate", 1) %}</td>',
                            '<td>{%= $.localizeViewTemplate("incrementTemplate", 2) %}</td>',
                        '</tr>',
                        '<tr class="datetime-selects">',
                            '<td>{%= $.localizeViewTemplate("selectorTemplate", 0) %}</td>',
                            '<td>{%= $.localizeViewTemplate("selectorTemplate", 1) %}</td>',
                            '<td>{%= $.localizeViewTemplate("selectorTemplate", 2) %}</td>',
                        '</tr>',
                        '<tr class="minus">',
                            '<td>{%= $.localizeViewTemplate("decrementTemplate", 0) %}</td>',
                            '<td>{%= $.localizeViewTemplate("decrementTemplate", 1) %}</td>',
                            '<td>{%= $.localizeViewTemplate("decrementTemplate", 2) %}</td>',
                        '</tr>',
                    '</table>',
                    '</div>',
                    '<div class="time-content" data-dojo-attach-point="timeNode">',
                        '<table id="datetime-picker-time" data-dojo-attach-point="timePickControl">',
                            '<caption>&nbsp;</caption>',
                            '<tr class="plus">',
                                '<td>{%= $.localizeViewTemplate("incrementTemplate", 3) %}</td>',
                                '<td>{%= $.localizeViewTemplate("incrementTemplate", 4) %}</td>',
                                '<td rowspan="3">',
                                    '<div class="toggle toggle-vertical meridiem-field" data-action="toggleMeridiem" data-dojo-attach-point="meridiemNode">',
                                        '<span class="thumb vertical"></span>',
                                        '<span class="toggleOn">{%= $.amText %}</span>',
                                        '<span class="toggleOff">{%= $.pmText %}</span>',
                                    '</div>',
                                '</td>',
                            '</tr>',
                            '<tr class="datetime-selects">',
                                '<td>{%= $.localizeViewTemplate("selectorTemplate", 3) %}</td>',
                                '<td>{%= $.localizeViewTemplate("selectorTemplate", 4) %}</td>',
                            '</tr>',
                            '<tr class="minus">',
                                '<td>{%= $.localizeViewTemplate("decrementTemplate", 3) %}</td>',
                                '<td>{%= $.localizeViewTemplate("decrementTemplate", 4) %}</td>',
                            '</tr>',
                        '</table>',
                    '</div>',
                    '<div style="clear:both"></div>',
                '</div>',
            '</div>'
        ]),

        dayNode: null,
        monthNode: null,
        yearNode: null,
        hourNode: null,
        minuteNode: null,
        datePickControl: null,
        timePickControl: null,

        daysInMonth: function() {
            var date = moment();
            date.date(1);
            date.year(this.year);
            date.month(this.month);
            return date.daysInMonth();
        },
        init: function() {
            this.inherited(arguments);
            this.months = this.monthsShortText;
            this.dateFormat = moment().lang()._longDateFormat.L;
            this.is24hrTimeFormat = moment().lang()._longDateFormat.LT.match(/H\:/);
            this.connect(this.dayNode,    'onchange', this.validate);
            this.connect(this.monthNode,  'onchange', this.validate);
            this.connect(this.yearNode,   'onchange', this.validate);
            this.connect(this.hourNode,   'onchange', this.validate);
            this.connect(this.minuteNode, 'onchange', this.validate);
        },

        validate: function() {
            var daysInMonth, isPM, hours, minutes;

            this.year = parseInt(this.yearNode.value, 10);
            this.month = parseInt(this.monthNode.value, 10);
            daysInMonth = this.daysInMonth();

            // adjust dayNode selector from changes to monthNode or leap/non-leap year
            if (this.dayNode.options.length !== daysInMonth) {
                this.populateSelector(this.dayNode, this.dayNode.selectedIndex + 1, 1, this.daysInMonth());
            }

            this.date = moment(new Date(this.year, this.month, this.dayNode.value));
            hours = parseInt(this.hourNode.value, 10);
            minutes = parseInt(this.minuteNode.value, 10);
            isPM = this.is24hrTimeFormat ? 11 < hours : domAttr.get(this.meridiemNode, 'toggled') !== true;
            hours = isPM ? (hours % 12) + 12 : (hours % 12);

            if (!this._isTimeless()) {
                this.date.hours(hours);
                this.date.minutes(minutes);
            }

            this.updateDatetimeCaption();
        },
        toggleMeridiem: function(params) {
            var el = params.$source,
                toggledValue = el && (domAttr.get(el, 'toggled') !== true);

            if (el) {
                domClass.toggle(el, 'toggleStateOn');
                domAttr.set(el, 'toggled', toggledValue);
            }

            this.updateDatetimeCaption();
        },
        populateSelector: function(el, val, min, max) {
            var i,
                opt;

            if (val > max) {
                val = max;
            }

            el.options.length = 0;

            for (i = min; i <= max; i++) {
                opt = domConstruct.create('option', {
                    innerHTML: (this.monthNode === el) ? uCase(this.months[i]) : pad(i),
                    value: i,
                    selected: (i === val)
                });

                el.options[el.options.length] = opt;
            }
        },
        localizeViewTemplate: function() {
            var whichTemplate = arguments[0],
                formatIndex = arguments[1],
                fields = { y:'year', Y:'year', M:'month', d:'day', D:'day', h:'hour', H:'hour', m:'minute' },
                whichField,
                whichFormat;

            whichField = fields[ (3 > formatIndex)
                ? this.dateFormat.split(/[^a-z]/i)[formatIndex].charAt(0)
                : this.timeFormatText.split(/[^a-z]/i)[formatIndex - 3].charAt(0)
                ];

            whichFormat = ('selectorTemplate' === whichTemplate)
                ? whichField
                : uCase(whichField);

            return string.substitute(this[whichTemplate], [whichFormat]);
        },
        show: function(options) {
            this.inherited(arguments);
            options = options || this.options;

            this.titleText = options.label ? options.label : this.titleText;

            this.showTimePicker = this.options && this.options.showTimePicker;

            this.date  = moment((this.options && this.options.date) || moment());
            this.year  = this.date.year();
            this.month = this.date.month();

            if (this._isTimeless()) {
                this.date.add({minutes: this.date.zone()});
            }

            var today = moment();

            this.populateSelector(this.yearNode, this.year,
                    (this.year < today.year() - 10) ? this.year : today.year() - 10, // min 10 years in past - arbitrary min
                    (10 + today.year()) // max 10 years into future - arbitrary limit
            );

            this.populateSelector(this.monthNode, this.month, 0, 11);
            this.populateSelector(this.dayNode, this.date.date(), 1, this.daysInMonth());
            this.populateSelector(this.hourNode,
                this.date.hours() > 12 && !this.is24hrTimeFormat
                    ? this.date.hours() - 12
                    : (this.date.hours() || 12),
                this.is24hrTimeFormat ? 0 : 1,
                this.is24hrTimeFormat ? 23 : 12
            );

            this.populateSelector(this.minuteNode, this.date.minutes(), 0, 59);

            if (this.date.hours() < 12) {
                domAttr.set(this.meridiemNode, 'toggled', true);
                domClass.add(this.meridiemNode, 'toggleStateOn');
            } else {
                domAttr.set(this.meridiemNode, 'toggled', false);
                domClass.remove(this.meridiemNode, 'toggleStateOn');
            }


            this.updateDatetimeCaption();

            if (this.showTimePicker) {
                domClass.remove(this.timeNode, 'time-content-hidden');
                // hide meridiem toggle when using 24hr time format:
                if (this.is24hrTimeFormat) {
                    domStyle.set(this.meridiemNode.parentNode, 'display', 'none');
                } else if (12 > this.date.hours()) {
                    // ensure initial toggle state reflects actual time
                    domClass.add(this.meridiemNode, 'toggleStateOn');
                } else {
                    domClass.remove(this.meridiemNode, 'toggleStateOn');
                }
            } else {
                domClass.add(this.timeNode, 'time-content-hidden');
            }
        },

        decrementYear: function() {
            this.decrement(this.yearNode);
        },
        decrementMonth: function() {
            this.decrement(this.monthNode);
        },
        decrementDay: function() {
            this.decrement(this.dayNode);
        },
        decrementHour: function() {
            this.decrement(this.hourNode);
            if (11 === this.hourNode.value % 12) {
                this.toggleMeridiem({$source:this.meridiemNode});
            }
        },
        decrementMinute: function() {
            this.decrement(this.minuteNode, 15);
        },
        decrement: function(el, inc) { // all fields are <select> elements
            inc = inc || 1;

            if (0 <= (el.selectedIndex - inc)) {
                el.selectedIndex = inc * Math.floor((el.selectedIndex - 1) / inc);
            } else {
                if (el === this.yearNode) {
                    return false;
                }

                if (el === this.dayNode) {
                    this.decrementMonth();
                }

                if (el === this.monthNode) {
                    this.decrementYear();
                }

                if (el === this.minuteNode) {
                    this.decrementHour();
                }

                el.selectedIndex = el.options.length - inc;
            }

            this.validate(null, el);
        },

        incrementYear: function() {
            this.increment(this.yearNode);
        },
        incrementMonth: function() {
            this.increment(this.monthNode);
        },
        incrementDay: function() {
            this.increment(this.dayNode);
        },
        incrementHour: function() {
            this.increment(this.hourNode);

            if (this.hourNode.selectedIndex === (this.hourNode.options.length - 1)) {
                this.toggleMeridiem({$source:this.meridiemNode});
            }
        },
        incrementMinute: function() {
            this.increment(this.minuteNode, 15);
        },
        increment: function(el, inc) {
            inc = inc || 1;

            if (el.options.length > (el.selectedIndex + inc)) {
                el.selectedIndex += inc;
            } else {
                if (el === this.yearNode) {
                    return false;
                }

                if (el === this.dayNode) {
                    this.incrementMonth();
                }

                if (el === this.monthNode) {
                    this.incrementYear();
                }

                if (el === this.minuteNode) {
                    this.incrementHour();
                }

                el.selectedIndex = 0;
            }

            this.validate(null, el);
        },
        _isTimeless: function() {
            return (this.options && this.options.timeless) || this.timeless;
        },
        updateDatetimeCaption: function() {
            var t = moment(this.getDateTime());

            if (this._isTimeless()) {
                t.utc();
            }

            this.datePickControl.caption.innerHTML = t.format('dddd'); // weekday text
            if (this.showTimePicker) {
                this.timePickControl.caption.innerHTML = t.format(this.timeFormatText);
            }
        },
        getDateTime: function() {
            var result, hours, isPM, minutes;

            result = moment(this.date);
            if (!this._isTimeless()) {
                hours = parseInt(this.hourNode.value, 10);
                minutes = parseInt(this.minuteNode.value, 10);
                isPM = this.is24hrTimeFormat ? (11 < hours) : domAttr.get(this.meridiemNode, 'toggled') !== true;

                hours = isPM
                    ? (hours % 12) + 12
                    : (hours % 12);

                result.hours(hours);
                result.minutes(minutes);
            }

            return result.toDate();
        }
    });

    lang.setObject('Sage.Platform.Mobile.Calendar', __class);
    return __class;
});
