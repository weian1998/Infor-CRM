/*
 * Copyright (c) 1997-2013, SalesLogix, NA., LLC. All rights reserved.
 */

/**
 * @class crm.Views.Calendar.DayView
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
 * @requires moment
 *
 */
define('crm/Views/Calendar/DayView', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/string',
    'dojo/query',
    'dojo/dom-class',
    'dojo/dom-construct',
    'argos/ErrorManager',
    'argos/Convert',
    'argos/List',
    'argos/_LegacySDataListMixin',
    'moment'
], function(
    declare,
    lang,
    string,
    query,
    domClass,
    domConstruct,
    ErrorManager,
    convert,
    List,
    _LegacySDataListMixin,
    moment
) {

    var __class = declare('crm.Views.Calendar.DayView', [List, _LegacySDataListMixin], {
        // Localization
        titleText: 'Calendar',
        eventDateFormatText: 'M/D/YYYY',
        dateHeaderFormatText: 'dddd, M/D/YYYY',
        startTimeFormatText: 'h:mm A',
        todayText: 'Today',
        dayText: 'Day',
        weekText: 'Week',
        monthText: 'Month',
        allDayText: 'All-Day',
        eventHeaderText: 'Events',
        activityHeaderText: 'Activities',
        eventMoreText: 'View More Event(s)',
        toggleCollapseText: 'toggle collapse',
        enablePullToRefresh: false,
        toggleCollapseClass: 'fa fa-chevron-down',
        toggleExpandClass: 'fa fa-chevron-right',

        // Templates
        widgetTemplate: new Simplate([
            '<div id="{%= $.id %}" title="{%= $.titleText %}" class="overthrow list {%= $.cls %}" {% if ($.resourceKind) { %}data-resource-kind="{%= $.resourceKind %}"{% } %}>',
                '<div data-dojo-attach-point="searchNode"></div>',
                '{%! $.navigationTemplate %}',
                '<div style="clear:both"></div>',
                '<div class="event-content event-hidden" data-dojo-attach-point="eventContainerNode">',
                '<h2 data-action="toggleGroup"><button data-dojo-attach-point="collapseButton" class="{%= $$.toggleCollapseClass %}" aria-label="{%: $$.toggleCollapseText %}"></button>{%= $.eventHeaderText %}</h2>',
                '<ul class="list-content" data-dojo-attach-point="eventContentNode"></ul>',
                '{%! $.eventMoreTemplate %}',
                '</div>',
                '<h2>{%= $.activityHeaderText %}</h2>',
                '<ul class="list-content" data-dojo-attach-point="contentNode"></ul>',
                '{%! $.moreTemplate %}',
            '</div>'
        ]),
        rowTemplate: new Simplate([
            '<li data-action="activateEntry" data-key="{%= $.$key %}" data-descriptor="{%: $.Description %}" data-activity-type="{%: $.Type %}">',
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
            '{%: crm.Format.date($.StartDate, $$.eventDateFormatText) %}',
            '&nbsp;-&nbsp;',
            '{%: crm.Format.date($.EndDate, $$.eventDateFormatText) %}'
        ]),
        navigationTemplate: new Simplate([
            '<div class="split-buttons">',
            '<button data-tool="today" data-action="getToday" class="button">{%: $.todayText %}</button>',
            '<button data-tool="selectdate" data-action="selectDate" class="button fa fa-calendar"><span></span></button>',
            '<button data-tool="day" class="button current">{%: $.dayText %}</button>',
            '<button data-tool="week" data-action="navigateToWeekView" class="button">{%: $.weekText %}</button>',
            '<button data-tool="month" data-action="navigateToMonthView" class="button">{%: $.monthText %}</button>',
            '</div>',
            '<div class="nav-bar">',
            '<button data-tool="next" data-action="getNextDay" class="button button-next fa fa-arrow-right fa-lg"><span></span></button>',
            '<button data-tool="prev" data-action="getPrevDay" class="button button-prev fa fa-arrow-left fa-lg"><span></span></button>',
            '<h3 class="date-text" data-dojo-attach-point="dateNode"></h3>',
            '</div>'
        ]),
        eventMoreTemplate: new Simplate([
            '<div class="list-more" data-dojo-attach-point="eventMoreNode">',
            '<button class="button" data-action="activateEventMore">',
            '<span data-dojo-attach-point="eventRemainingContentNode">{%= $.eventMoreText %}</span>',
            '</button>',
            '</div>'
        ]),
        attributeMap: {
            listContent: {
                node: 'contentNode',
                type: 'innerHTML'
            },
            eventListContent: {
                node: 'eventContentNode',
                type: 'innerHTML'
            },
            dateContent: {
                node: 'dateNode',
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
        id: 'calendar_daylist',
        cls: 'activities-for-day',
        iconClass: 'fa fa-calendar fa-lg',

        datePickerView: 'generic_calendar',
        monthView: 'calendar_monthlist',
        weekView: 'calendar_weeklist',
        activityDetailView: 'activity_detail',
        eventDetailView: 'event_detail',
        insertView: 'activity_types_list',
        enableSearch: false,
        currentDate: null,
        contractName: 'system',
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
            'Timeless',
            'Recurring'
        ],
        eventFeed: null,
        eventPageSize: 3,
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
            'atLiterature': 'fa fa-book',
            'atPersonal': 'fa fa-check-square-o',
            'atQuestion': 'fa fa-question-circle',
            'atNote': 'fa fa-file-text-o',
            'atEMail': 'fa fa-envelope'
        },
        eventIcon: 'fa fa-calendar-o',
        resourceKind: 'activities',
        pageSize: 1000,

        continuousScrolling: false,

        _onRefresh: function(o) {
            this.inherited(arguments);
            if (o.resourceKind === 'activities' || o.resourceKind === 'events') {
                this.refreshRequired = true;
            }
        },
        init: function() {
            this.inherited(arguments);
            this.currentDate = moment().startOf('day');
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
        refresh: function() {
            this.clear();

            this.options = this.options || {};
            this.options['where'] = this.formatQueryForActivities();
            this.feed = null;
            this.eventFeed = null;
            this.set('dateContent', this.currentDate.format(this.dateHeaderFormatText));

            this.requestData();
            this.requestEventData();
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
            var eventSelect = this.eventQuerySelect,
                eventWhere = this.getEventQuery(),
                request = new Sage.SData.Client.SDataResourceCollectionRequest(this.getService())
                    .setCount(this.eventPageSize)
                    .setStartIndex(1)
                    .setResourceKind('events')
                    .setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.Select, this.expandExpression(eventSelect).join(','))
                    .setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.Where, eventWhere);
            return request;
        },
        getEventQuery: function() {
            return string.substitute(
                [
                    'UserId eq "${0}" and (',
                    '(StartDate gt @${1}@ or EndDate gt @${1}@) and ',
                    'StartDate lt @${2}@',
                    ')'
                ].join(''),
                [
                    App.context['user'] && App.context['user']['$key'],
                    convert.toIsoStringFromDate(this.currentDate.clone().startOf('day').toDate()),
                    convert.toIsoStringFromDate(this.currentDate.clone().endOf('day').toDate())
                ]
            );
        },
        activateEventMore: function() {
            var view = App.getView('event_related'),
                where = this.getEventQuery();
            if (view) {
                view.show({'where': where});
            }
        },
        hideEventList: function() {
            domClass.add(this.eventContainerNode, 'event-hidden');
        },
        showEventList: function() {
            domClass.remove(this.eventContainerNode, 'event-hidden');
        },
        processEventFeed: function(feed) {
            var r = feed['$resources'],
                feedLength = r.length,
                i,
                row,
                o = [];
            this.eventFeed = feed;

            if (feedLength === 0) {
                this.hideEventList();
                return false;
            } else {
                this.showEventList();
            }

            for (i = 0; i < feedLength; i++) {
                row = r[i];
                row.isEvent = true;
                this.entries[row.$key] = row;
                o.push(this.eventRowTemplate.apply(row, this));
            }

            if (feed['$totalResults'] > feedLength) {
                domClass.add(this.eventContainerNode, 'list-has-more');
                this.set('eventRemainingContent', this.eventMoreText);
            } else {
                domClass.remove(this.eventContainerNode, 'list-has-more');
                this.set('eventRemainingContent', '');
            }

            this.set('eventListContent', o.join(''));
        },
        processFeed: function(feed) {
            var r = feed['$resources'],
                feedLength = r.length,
                i,
                row,
                o = [];

            this.feed = feed;
            for (i = 0; i < feedLength; i++) {
                row = r[i];
                row.isEvent = false;
                this.entries[row.$key] = row;
                o.push(this.rowTemplate.apply(row, this));
            }

            // If we fetched a page that has no data due to un-reliable counts,
            // check if we fetched anything in the previous pages before assuming there is no data.
            if (feedLength === 0 && Object.keys(this.entries).length === 0) {
                this.set('listContent', this.noDataTemplate.apply(this));
                return false;
            }

            if (o.length > 0) {
                domConstruct.place(o.join(''), this.contentNode, 'last');
            }

            this.set('remainingContent', '');// Feed does not return reliable data, don't show remaining

            domClass.toggle(this.domNode, 'list-has-more', this.hasMoreData());// This could be wrong, handle it on the next processFeed if so

            if (this.options.allowEmptySelection) {
                domClass.add(this.domNode, 'list-has-empty-opt');
            }

            this._loadPreviousSelections();
        },
        show: function(options) {
            if (options) {
                this.processShowOptions(options);
            }

            options = options || {};
            options['where'] = this.formatQueryForActivities();

            this.set('dateContent', this.currentDate.format(this.dateHeaderFormatText));
            this.inherited(arguments, [options]);
        },
        processShowOptions: function(options) {
            if (options.currentDate) {
                this.currentDate = moment(options.currentDate).startOf('day') || moment().startOf('day');
                this.refreshRequired = true;
            }
        },
        isLoading: function() {
            return domClass.contains(this.domNode, 'list-loading');
        },
        getNextDay: function() {
            if (this.isLoading()) {
                return;
            }

            this.currentDate.add({days: 1});
            this.refresh();
        },
        getToday: function() {
            if (this.isLoading()) {
                return;
            }

            if (this.currentDate === moment().startOf('day')) {
                return;
            }

            this.currentDate = moment().startOf('day');
            this.refresh();
        },
        getPrevDay: function() {
            if (this.isLoading()) {
                return;
            }

            this.currentDate.subtract({days: 1});
            this.refresh();
        },
        formatQueryForActivities: function() {
            var queryWhere,
                startDate,
                endDate;

            queryWhere = [
                'UserActivities.UserId eq "${0}" and Type ne "atLiterature" and (',
                '(Timeless eq false and StartDate between @${1}@ and @${2}@) or ',
                '(Timeless eq true and StartDate between @${3}@ and @${4}@))'
            ].join('');

            startDate = this.currentDate.clone().startOf('day').toDate();
            endDate = this.currentDate.clone().endOf('day').toDate();

            return string.substitute(
                queryWhere,
                [App.context['user'] && App.context['user']['$key'],
                convert.toIsoStringFromDate(startDate),
                convert.toIsoStringFromDate(endDate),
                this.currentDate.format('YYYY-MM-DDT00:00:00[Z]'),
                this.currentDate.format('YYYY-MM-DDT23:59:59[Z]')]
            );
        },
        selectEntry: function(params) {
            var row = query(params.$source).closest('[data-key]')[0],
                key = row ? row.getAttribute('data-key') : false;

            this.navigateToDetailView(key);
        },
        selectDate: function() {
            var options = {
                date: this.currentDate,
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
                            side: 'left',
                            cls: 'fa fa-ban fa-fw fa-lg',
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
        navigateToWeekView: function() {
            var view = App.getView(this.weekView),
                navDate = this.currentDate ? this.currentDate : moment().startOf('day'),
                options = {currentDate: navDate.valueOf()};
            view.show(options);
        },
        navigateToMonthView: function() {
            var view = App.getView(this.monthView),
                navDate = this.currentDate ? this.currentDate : moment().startOf('day'),
                options = {currentDate: navDate.valueOf()};
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

    lang.setObject('Mobile.SalesLogix.Views.Calendar.DayView', __class);
    return __class;
});

