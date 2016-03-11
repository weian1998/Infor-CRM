/*
 * Copyright (c) 1997-2013, SalesLogix, NA., LLC. All rights reserved.
 */

/**
 * @class crm.Views.Calendar.WeekView
 *
 * @extends argos.List
 * @mixins argos.List
 * @mixins argos._LegacySDataListMixin
 *
 * @requires argos.List
 * @requires argos._LegacySDataListMixin
 * @requires argos.Convert
 * @requires argos.ErrorManager
 *
 * @requires crm.Format
 *
 * @requires moment
 *
 */
define('crm/Views/Calendar/WeekView', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/query',
    'dojo/string',
    'dojo/dom-construct',
    'dojo/dom-class',
    'argos/ErrorManager',
    'argos/Convert',
    'argos/List',
    'argos/_LegacySDataListMixin',
    'crm/Format',
    'moment'
], function(
    declare,
    lang,
    query,
    string,
    domConstruct,
    domClass,
    ErrorManager,
    convert,
    List,
    _LegacySDataListMixin,
    format,
    moment
) {

    var __class = declare('crm.Views.Calendar.WeekView', [List, _LegacySDataListMixin], {
        //Localization
        titleText: 'Calendar',
        weekTitleFormatText: 'MMM D, YYYY',
        dayHeaderLeftFormatText: 'dddd',
        dayHeaderRightFormatText: 'MMM D, YYYY',
        eventDateFormatText: 'M/D/YYYY',
        startTimeFormatText: 'h:mm A',
        todayText: 'Today',
        dayText: 'Day',
        weekText: 'Week',
        monthText: 'Month',
        allDayText: 'All Day',
        eventHeaderText: 'Events',
        eventMoreText: 'View ${0} More Event(s)',
        toggleCollapseText: 'toggle collapse',
        toggleCollapseClass: 'fa fa-chevron-down',
        toggleExpandClass: 'fa fa-chevron-right',

        enablePullToRefresh: false,

        // Templates
        widgetTemplate: new Simplate([
            '<div id="{%= $.id %}" title="{%= $.titleText %}" class="overthrow {%= $.cls %}" {% if ($.resourceKind) { %}data-resource-kind="{%= $.resourceKind %}"{% } %}>',
                '<div data-dojo-attach-point="searchNode"></div>',
                '{%! $.navigationTemplate %}',
                '<div style="clear:both"></div>',
                '<div class="event-content event-hidden" data-dojo-attach-point="eventContainerNode">',
                    '<h2 data-action="toggleGroup"><button data-dojo-attach-point="collapseButton" class="{%= $$.toggleCollapseClass %}" aria-label="{%: $$.toggleCollapseText %}"></button>{%= $.eventHeaderText %}</h2>',
                    '<ul class="list-content" data-dojo-attach-point="eventContentNode"></ul>',
                    '{%! $.eventMoreTemplate %}',
                '</div>',
                '<div class="list-content" data-dojo-attach-point="contentNode"></div>',
                '{%! $.moreTemplate %}',
            '</div>'
        ]),
        navigationTemplate: new Simplate([
            '<div class="split-buttons">',
            '<button data-tool="today" data-action="getThisWeekActivities" class="button">{%: $.todayText %}</button>',
            '<button data-tool="selectdate" data-action="selectDate" class="button fa fa-calendar"><span></span></button>',
            '<button data-tool="day" data-action="navigateToDayView" class="button">{%: $.dayText %}</button>',
            '<button data-tool="week" class="button current">{%: $.weekText %}</button>',
            '<button data-tool="month" data-action="navigateToMonthView" class="button">{%: $.monthText %}</button>',
            '</div>',
            '<div class="nav-bar">',
            '<button data-tool="next" data-action="getNextWeekActivities" class="button button-next fa fa-arrow-right fa-lg"><span></span></button>',
            '<button data-tool="prev" data-action="getPrevWeekActivities" class="button button-prev fa fa-arrow-left fa-lg"><span></span></button>',
            '<h3 class="date-text" data-dojo-attach-point="dateNode"></h3>',
            '</div>'
        ]),
        groupTemplate: new Simplate([
            '<h2 data-action="activateDayHeader" class="dayHeader {%= $.headerClass %}" data-date="{%: moment($.StartDate).format(\'YYYY-MM-DD\') %}">',
            '<span class="dayHeaderLeft">{%: moment($.StartDate).format($$.dayHeaderLeftFormatText) %}</span>',
            '<span class="dayHeaderRight">{%: moment($.StartDate).format($$.dayHeaderRightFormatText) %}</span>',
            '<div style="clear:both"></div>',
            '</h2>',
            '<ul class="list-content">'
        ]),
        groupEndTemplate: new Simplate([
            '</ul>'
        ]),
        rowTemplate: new Simplate([
            '<li data-action="activateEntry" data-key="{%= $.$key %}" data-descriptor="{%: $.$descriptor %}" data-activity-type="{%: $.Type %}">',
            '<table class="calendar-entry-table"><tr>',
            '<td class="entry-table-icon">',
            '<button data-action="selectEntry" class="list-item-selector button {%= $$.activityIconByType[$.Type] %}">',
            '</button>',
            '</td>',
            '<td class="entry-table-time">{%! $$.timeTemplate %}</td>',
            '<td class="entry-table-description">{%! $$.itemTemplate %}</td>',
            '</tr></table>',
            '</li>'
        ]),
        eventRowTemplate: new Simplate([
            '<li data-action="activateEntry" data-key="{%= $.$key %}" data-descriptor="{%: $.$descriptor %}" data-activity-type="Event">',
            '<table class="calendar-entry-table"><tr>',
            '<td class="entry-table-icon">',
            '<button data-action="selectEntry" class="list-item-selector button {%= $$.eventIcon %}">',
            '</button>',
            '</td>',
            '<td class="entry-table-description">{%! $$.eventItemTemplate %}</td>',
            '</tr></table>',
            '</li>'
        ]),
        timeTemplate: new Simplate([
            '{% if ($.Timeless) { %}',
            '<span class="p-time">{%= $$.allDayText %}</span>',
            '{% } else { %}',
            '<span class="p-time">{%: crm.Format.date($.StartDate, $$.startTimeFormatText) %}</span>',
            '{% } %}'
        ]),
        itemTemplate: new Simplate([
            '<h3 class="p-description">{%: $.Description %}</h3>',
            '<h4>{%= $$.nameTemplate.apply($) %}</h4>'
        ]),
        eventItemTemplate: new Simplate([
            '<h3 class="p-description">{%: $.Description %} ({%: $.Type %})</h3>',
            '<h4>{%! $$.eventNameTemplate %}</h4>'
        ]),
        nameTemplate: new Simplate([
            '{% if ($.ContactName) { %}',
            '{%: $.ContactName %} / {%: $.AccountName %}',
            '{% } else if ($.AccountName) { %}',
            '{%: $.AccountName %}',
            '{% } else { %}',
            '{%: $.LeadName %}',
            '{% } %}'
        ]),
        eventNameTemplate: new Simplate([
            '{%: moment($.StartDate).format($$.eventDateFormatText) %}',
            '&nbsp;-&nbsp;',
            '{%: moment($.EndDate).format($$.eventDateFormatText) %}'
        ]),
        eventMoreTemplate: new Simplate([
            '<div class="list-more" data-dojo-attach-point="eventMoreNode">',
            '<button class="button" data-action="activateEventMore">',
            '<span data-dojo-attach-point="eventRemainingContentNode">{%= $$.eventMoreText %}</span>',
            '</button>',
            '</div>'
        ]),
        noDataTemplate: new Simplate([
            '<div class="no-data"><h3>{%= $.noDataText %}</h3></div>'
        ]),
        eventRemainingContentNode: null,
        eventContentNode: null,
        attributeMap: {
            listContent: {
                node: 'contentNode',
                type: 'innerHTML'
            },
            dateContent: {
                node: 'dateNode',
                type: 'innerHTML'
            },
            eventListContent: {
                node: 'eventContentNode',
                type: 'innerHTML'
            },
            eventRemainingContent: {
                node: 'eventRemainingContentNode',
                type: 'innerHTML'
            },
            remainingContent: {
                node: 'remainingContentNode',
                type: 'innerHTML'
            }
        },

        //View Properties
        id: 'calendar_weeklist',
        cls: 'list activities-for-week',
        activityDetailView: 'activity_detail',
        eventDetailView: 'event_detail',
        monthView: 'calendar_monthlist',
        datePickerView: 'generic_calendar',
        activityListView: 'calendar_daylist',
        insertView: 'activity_types_list',
        currentDate: null,
        enableSearch: false,
        expose: false,
        entryGroups: {},
        weekStartDate: null,
        weekEndDate: null,
        todayDate: null,
        continuousScrolling: false,

        queryWhere: null,
        queryOrderBy: 'StartDate desc',
        querySelect: [
            'Description',
            'StartDate',
            'Type',
            'AccountName',
            'ContactName',
            'LeadId',
            'LeadName',
            'UserId',
            'Timeless'
        ],
        eventQuerySelect: [
            'StartDate',
            'EndDate',
            'Description',
            'Type'
        ],
        activityIconByType: {
            'atToDo': 'fa fa-list-ul',
            'atPhoneCall': 'fa fa-phone',
            'atAppointment': 'fa fa-calendar-o',
            'atLiterature': 'fa fa-calendar-o',
            'atPersonal': 'fa fa-check-square-o',
            'atQuestion': 'fa fa-question',
            'atNote': 'fa fa-calendar-o',
            'atEMail': 'fa fa-envelope'
        },
        eventIcon: 'fa fa-calendar-o',

        contractName: 'system',
        pageSize: 105, // gives 15 activities per day
        eventPageSize: 5,
        resourceKind: 'activities',

        _onRefresh: function(o) {
            this.inherited(arguments);
            if (o.resourceKind === 'activities' || o.resourceKind === 'events') {
                this.refreshRequired = true;
            }
        },
        init: function() {
            this.inherited(arguments);
            this.todayDate = moment().startOf('day');
            this.currentDate = this.todayDate.clone();
        },
        toggleGroup: function(params) {
            var node,
                button;

            node = params.$source;
            if (node && node.parentNode) {
                domClass.toggle(node, 'collapsed');
                domClass.toggle(node.parentNode, 'collapsed-event');

                button = this.collapseButton;

                if (button) {
                    domClass.toggle(button, this.toggleCollapseClass);
                    domClass.toggle(button, this.toggleExpandClass);
                }
            }
        },
        activateDayHeader: function(params) {
            this.currentDate = moment(params.date, 'YYYY-MM-DD');
            this.navigateToDayView();
        },
        getThisWeekActivities: function() {
            if (!this.isInCurrentWeek(this.todayDate)) {
                this.currentDate = this.todayDate.clone();
                this.refresh();
            }
        },
        getStartDay: function(date) {
            return date.clone().startOf('week');
        },
        getEndDay: function(date) {
            return date.clone().endOf('week');
        },
        getNextWeekActivities: function() {
            this.currentDate = this.getStartDay(this.weekEndDate.clone().add({days:1}));
            this.refresh();
        },
        getPrevWeekActivities: function() {
            this.currentDate = this.getStartDay(this.weekStartDate.clone().subtract({days:1}));
            this.refresh();
        },
        setWeekQuery: function() {
            var setDate = this.currentDate || this.todayDate;
            this.weekStartDate = this.getStartDay(setDate);
            this.weekEndDate = this.getEndDay(setDate);
            this.queryWhere = string.substitute(
                [
                    'UserActivities.UserId eq "${0}" and Type ne "atLiterature" and (',
                    '(Timeless eq false and StartDate between @${1}@ and @${2}@) or ',
                    '(Timeless eq true and StartDate between @${3}@ and @${4}@))'
                ].join(''), [
                    App.context['user'] && App.context['user']['$key'],
                    convert.toIsoStringFromDate(this.weekStartDate.toDate()),
                    convert.toIsoStringFromDate(this.weekEndDate.toDate()),
                    this.weekStartDate.format('YYYY-MM-DDT00:00:00[Z]'),
                    this.weekEndDate.format('YYYY-MM-DDT23:59:59[Z]')]
            );
        },
        setWeekTitle: function() {
            var start = this.getStartDay(this.currentDate),
                end = this.getEndDay(this.currentDate);

            this.set('dateContent', string.substitute('${0}-${1}', [
                start.format(this.weekTitleFormatText),
                end.format(this.weekTitleFormatText)
                ]));
        },
        isInCurrentWeek: function(date) {
            return (date.valueOf() > this.weekStartDate.valueOf() && date.valueOf() < this.weekEndDate.valueOf());
        },
        processFeed: function(feed) {
            this.feed = feed;

            var todayNode = this.addTodayDom(),
                entryGroups = this.entryGroups,
                feedLength = feed['$resources'].length,
                entryOrder = [],
                dateCompareString = 'YYYY-MM-DD',
                o = [],
                i,
                currentEntry,
                entryOrderLength,
                entryGroup,
                currentDateCompareKey,
                currentGroup,
                startDate;

            // If we fetched a page that has no data due to un-reliable counts,
            // check if we fetched anything in the previous pages before assuming there is no data.
            if (feedLength === 0 && Object.keys(this.entries).length === 0) {
                query(this.contentNode).append(this.noDataTemplate.apply(this));
            } else if (feed['$resources']) {

                if (todayNode && !entryGroups[this.todayDate.format(dateCompareString)]) {
                    entryGroups[this.todayDate.format(dateCompareString)] = [todayNode];
                }

                for (i = 0; i < feed['$resources'].length; i++) {
                    currentEntry = feed['$resources'][i];
                    startDate = convert.toDateFromString(currentEntry.StartDate);
                    if (currentEntry.Timeless) {
                        startDate = this.dateToUTC(startDate);
                    }
                    currentEntry['StartDate'] = startDate;
                    currentEntry['isEvent'] = false;
                    this.entries[currentEntry.$key] = currentEntry;

                    currentDateCompareKey = moment(currentEntry.StartDate).format(dateCompareString);
                    currentGroup = entryGroups[currentDateCompareKey];
                    if (currentGroup) {
                        if (currentEntry.Timeless) {
                            currentGroup.splice(1, 0, this.rowTemplate.apply(currentEntry, this));
                        } else {
                            currentGroup.push(this.rowTemplate.apply(currentEntry, this));
                        }
                        continue;
                    }
                    currentGroup = [this.groupTemplate.apply(currentEntry, this)];
                    currentGroup.push(this.rowTemplate.apply(currentEntry, this));
                    entryGroups[currentDateCompareKey] = currentGroup;
                }

                for (entryGroup in entryGroups) {
                    if (entryGroups.hasOwnProperty(entryGroup)) {
                        entryOrder.push(moment(entryGroup, dateCompareString));
                    }
                }

                entryOrder.sort(function(a, b) {
                    if (a.valueOf() < b.valueOf()) {
                        return 1;
                    } else if (a.valueOf() > b.valueOf()) {
                        return -1;
                    }

                    return 0;
                });

                entryOrderLength = entryOrder.length;
                for (i = 0; i < entryOrderLength; i++) {
                    o.push(entryGroups[entryOrder[i].format(dateCompareString)].join('') + this.groupEndTemplate.apply(this));
                }

                if (o.length > 0) {
                    this.set('listContent', o.join(''));
                }
            }

            this.set('remainingContent', '');// Feed does not return reliable data, don't show remaining

            domClass.toggle(this.domNode, 'list-has-more', this.hasMoreData());
            this._loadPreviousSelections();
        },
        addTodayDom: function() {
            if (!this.isInCurrentWeek(this.todayDate)) {
                return null;
            }

            var todayEntry = {
                    StartDate: this.todayDate.toDate(),
                    headerClass: 'currentDate'
            };

            return this.groupTemplate.apply(todayEntry, this);
        },
        dateToUTC: function(date) {
            return new Date(date.getUTCFullYear(),
                date.getUTCMonth(),
                date.getUTCDate(),
                date.getUTCHours(),
                date.getUTCMinutes(),
                date.getUTCSeconds()
            );
        },
        requestEventData: function() {
            var request = this.createEventRequest();
            request.read({
                success: this.onRequestEventDataSuccess,
                failure: this.onRequestEventDataFailure,
                aborted: this.onRequestEventDataAborted,
                scope: this
            });
        },
        onRequestEventDataFailure: function(response, o) {
            alert(string.substitute(this.requestErrorText, [response, o]));
            ErrorManager.addError(response, o, this.options, 'failure');
        },
        onRequestEventDataAborted: function() {
            this.options = false; // force a refresh
        },
        onRequestEventDataSuccess: function(feed) {
            this.processEventFeed(feed);
        },
        createEventRequest: function() {
            var querySelect = this.eventQuerySelect,
                queryWhere = this.getEventQuery(),
                request = new Sage.SData.Client.SDataResourceCollectionRequest(this.getService())
                    .setCount(this.eventPageSize)
                    .setStartIndex(1)
                    .setResourceKind('events')
                    .setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.Select, this.expandExpression(querySelect).join(','))
                    .setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.Where, queryWhere);
            return request;
        },
        getEventQuery: function() {
            var startDate = this.weekStartDate,
                endDate = this.weekEndDate;
            return string.substitute(
                    [
                        'UserId eq "${0}" and (',
                            '(StartDate gt @${1}@ or EndDate gt @${1}@) and ',
                            'StartDate lt @${2}@',
                        ')'
                    ].join(''),
                    [App.context['user'] && App.context['user']['$key'],
                    startDate.format('YYYY-MM-DDT00:00:00[Z]'),
                    endDate.format('YYYY-MM-DDT23:59:59[Z]')]
                );
        },
        hideEventList: function() {
            domClass.add(this.eventContainerNode, 'event-hidden');
        },
        showEventList: function() {
            domClass.remove(this.eventContainerNode, 'event-hidden');
        },
        processEventFeed: function(feed) {
            var o = [],
                i,
                event,
                feedLength = feed['$resources'].length;

            if (feedLength === 0) {
                this.hideEventList();
                return false;
            } else {
                this.showEventList();
            }

            for (i = 0; i < feedLength; i++) {
                event = feed['$resources'][i];
                event['isEvent'] = true;
                event['StartDate'] = moment(convert.toDateFromString(event.StartDate));
                event['EndDate'] = moment(convert.toDateFromString(event.EndDate));
                this.entries[event.$key] = event;
                o.push(this.eventRowTemplate.apply(event, this));
            }

            if (feed['$totalResults'] > feedLength) {
                domClass.add(this.eventContainerNode, 'list-has-more');
                this.set('eventRemainingContent', string.substitute(this.eventMoreText, [feed['$totalResults'] - feedLength]));
            } else {
                domClass.remove(this.eventContainerNode, 'list-has-more');
                domConstruct.empty(this.eventRemainingContentNode);
            }

            this.set('eventListContent', o.join(''));
        },
        refresh: function() {
            var startDate = this.currentDate.clone();
            this.currentDate = startDate.clone();
            this.weekStartDate = this.getStartDay(startDate);
            this.weekEndDate = this.getEndDay(startDate);
            this.setWeekTitle();
            this.setWeekQuery();

            this.clear();
            this.requestData();
            this.requestEventData();
        },
        show: function(options) {
            if (options) {
                this.processShowOptions(options);
            }

            this.inherited(arguments);
        },
        processShowOptions: function(options) {
            if (options.currentDate) {
                this.currentDate = moment(options.currentDate).startOf('day') || moment().startOf('day');
                this.refreshRequired = true;
            }
        },
        activateEventMore: function() {
            var view = App.getView('event_related'),
                where = this.getEventQuery();
            if (view) {
                view.show({'where': where});
            }
        },
        clear: function() {
            this.inherited(arguments);
            this.entryGroups = {};
            this.set('eventContent', '');
            this.set('listContent', '');
        },
        selectEntry: function(params) {
            var row = query(params.$source).closest('[data-key]')[0],
                key = row ? row.getAttribute('data-key') : false;

            this.navigateToDetailView(key);
        },
        selectDate: function() {
            var options = {
                date: this.currentDate.toDate(),
                showTimePicker: false,
                timeless: false,
                tools: {
                    tbar: [{
                            id: 'complete',
                            cls: 'fa fa-check fa-fw fa-lg',
                            fn: this.selectDateSuccess,
                            scope: this
                        }, {
                            id: 'cancel',
                            cls: 'fa fa-ban fa-fw fa-lg',
                            side: 'left',
                            fn: ReUI.back,
                            scope: ReUI
                        }]
                }
            },
                view = App.getView(this.datePickerView);
            if (view) {
                view.show(options);
            }
        },
        selectDateSuccess: function() {
            var view = App.getPrimaryActiveView();
            this.currentDate = moment(view.getDateTime()).startOf('day');
            this.refresh();
            ReUI.back();
        },
        navigateToDayView: function() {
            var view = App.getView(this.activityListView),
                options = {currentDate: this.currentDate.toDate().valueOf() || moment().startOf('day').valueOf()};
            view.show(options);
        },
        navigateToMonthView: function() {
            var view = App.getView(this.monthView),
                options = {currentDate: this.currentDate.toDate().valueOf() || moment().startOf('day').valueOf()};
            view.show(options);
        },
        navigateToInsertView: function() {
            var view = App.getView(this.insertView || this.editView);

            this.options.currentDate = this.currentDate.format('YYYY-MM-DD') || Date.today();
            if (view) {
                view.show({
                    negateHistory: true,
                    returnTo: this.id,
                    insert: true,
                    currentDate: this.options.currentDate.valueOf()
                });
            }
        },
        navigateToDetailView: function(key, descriptor) {
            var entry = this.entries[key],
                detailView = (entry.isEvent) ? this.eventDetailView : this.activityDetailView,
                view = App.getView(detailView);

            descriptor = (entry.isEvent) ? descriptor : entry.Description;

            if (view) {
                view.show({
                    title: descriptor,
                    key: key
                });
            }
        }
    });

    lang.setObject('Mobile.SalesLogix.Views.Calendar.WeekView', __class);
    return __class;
});

