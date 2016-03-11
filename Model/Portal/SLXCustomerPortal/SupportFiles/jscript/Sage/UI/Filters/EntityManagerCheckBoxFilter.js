/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
       'dijit/_Widget',
       'dijit/_Contained',
       'dojo/NodeList-traverse',
       'Sage/_Templated',
       'Sage/Services/_ServiceMixin',
       'Sage/_ActionMixin',
       'dojo/string',
       'dojo/on',
       'dojo/_base/lang',
       'dojo/dom-construct',
       './EditFilterItems',
       'dojo/_base/array',
       'dojo/query',
       'dojo/dom-attr',
       'dojo/i18n!./nls/CheckBoxFilter',
       'Sage/Utility',
       'Sage/Utility/Filters',
       'dojo/json',
       'dijit/registry',
       'dojo/_base/declare',
       'dojo/_base/Deferred',
       'dojo/dom-class',
       'dojo/_base/connect',
       "dojo/request",
        "Sage/UI/Filters/FilterManager",
        'Sage/Data/SDataServiceRegistry',
        'dojo/date',
        'dojox/storage/LocalStorageProvider'
],
function (
        _Widget,
        _Contained,
        NodeList,
        _Templated,
        _ServiceMixin,
        _ActionMixin,
        dString,
        on,
        lang,
        domConstruct,
        EditFilterItems,
        array,
        query,
        domAttr,
        nls,
        Utility,
        FiltersUtility,
        json,
        registry,
        declare,
        Deferred,
        domClass,
        connect,
        request,
        FilterManager,
        SDataServiceRegistry,
        dojoDate,
        LocalStorageProvider
) {
    var widget = declare('Sage.UI.Filters.EntityManagerCheckBoxFilter', [_Widget, _Contained, _ServiceMixin, _ActionMixin, _Templated], {
        attributeMap: {
            'content': { node: 'listNode', type: 'innerHTML' }
        },
        serviceMap: {
            'groupContextService': 'ClientGroupContext',
            'systemDataService': { type: 'sdata', name: 'system' }
        },
        actionsFrom: 'click',
        widgetsInTemplate: false,
        widgetTemplate: new Simplate([
            '<div class="filter-type-checkbox filter-collapsed">',
                '<h3 data-action="toggleExpand" data-dojo-attach-point="filterNameNode">{%: $.filter.$descriptor || $.filter.filterName %}',
                '</h3>',
                '<ul class="filter-loading-indicator"><li><span>{%: $.loadingText %}</span></li></ul>',
                '<a href="#" class="filter-clear" data-dojo-attach-point="clearLinkNode">{%: $.clearText %}</a>',
                '<span class="filter-sep" data-dojo-attach-point="linkSep"></span>',
                '<a href="#" class="filter-edit-items" data-dojo-attach-point="moreLinkNode"></a>',
                '<ul class="filter-list" data-dojo-attach-point="listNode"></ul>',
            '</div>'
        ]),
        itemTemplate: new Simplate([
            '<li data-action="toggleSelect" class="{%= $.selected ? "filter-selected" : "" %}" data-name="{%= $.name %}" data-selected="{%= !!$.selected %}" ',
            'role="checkbox" aria-checked="{%= !!$.selected %}">',
            '<div>',
            '<span class="p-selection">&nbsp;</span>',
            '<span class="p-label">{%: $$._formatLabelText($.$descriptor, $.name) %}</span>',
            '{% if ($.value > -1) { %}',
            '&nbsp;<span class="p-spacer">(</span>',
            '<span class="p-count">{%: $.value %}</span>',
            '<span class="p-spacer"> {%: $.ofText %} </span>',
            '<span class="p-total">{%: $.value %}</span>',
            '<span class="p-spacer">)</span>',
            '{% } %}',
            '</div>',
            '</li>'
        ]),
        _activeFilterCount: 0,
        _loaded: false,
        _selected: null,
        _ranges: null,
        _filterGroup: null,
        _filterSubscriptions: null,
        appliedValues: null,
        parent: null,
        _originalActiveFilter: '',

        nullName: 'SLX_NULL',
        emptyName: 'SLX_EMPTY',

        filterGroup: 'default',
        filter: null,
        store: null,
        editFilterItems: null,
        editFilterItemsHandle: null,
        output: null,
        entries: [],
        expanded: false,
        FILTER_UPDATE_DELAY: 1000,
        lazyUpdateCounts: null,
        numModDateFiltersCnt: 14,

        // Paging
        count: 1000,
        loading: true,
        groupId: '',
        constructor: function () {
            this.inherited(arguments);
            this.output = [];
            this.entries = [];
            lang.mixin(this, nls);
        },
        postMixInProperties: function () {
            this.inherited(arguments);

            this._selected = {};

            var rangeFilter = this._isRangeFilter();
            if (rangeFilter) {
                this.store.request.setQueryArg('orderby', '');
                this.compileRanges(rangeFilter.ranges);
            }

            if (this.expanded) {
                this.expanded = false; // toggleExpand will flip this
                setTimeout(lang.hitch(this, this._toggleExpand), 500);
            } else if (this.appliedValues) {
                setTimeout(lang.hitch(this, this._loadItems), 500);
            }
            else {
                this.resolveDeferred();
            }

            if (this.store && this.store.request && this.store.request.getQueryArg) {
                this._originalActiveFilter = this.store.request.getQueryArg('_activeFilter');
            }
        },
        postCreate: function () {
            this.inherited(arguments);

            var hasFormatter = false;
            if (this.configurationProvider.getFilterFormatter) {
                var formatter = this.configurationProvider.getFilterFormatter(this.filter);
                if (formatter) {
                    hasFormatter = true;
                }
            }

            if (!this._isDistinctFilter() || hasFormatter) {
                domConstruct.destroy(this.moreLinkNode);
                domConstruct.destroy(this.linkSep);
            } else {
                this.editFilterItemsHandle = on(this.moreLinkNode, 'click', lang.hitch(this, this._moreLinkClicked));
            }

            on(this.clearLinkNode, 'click', lang.hitch(this, this._clearLinkClicked));

            var id = this.filter.$key + '_editFilterItems',
                editor = registry.byId(id);
            this.editFilterItems = editor || new EditFilterItems({
                id: id,
                store: this.store,
                filter: this.filter,
                filterPanel: this.parent,
                parent: this
            });
        },
        _clearLinkClicked: function () {
            // De-select selected filters.
            var q = query('li.filter-selected', this.listNode),
                evt;
            array.forEach(q, function (node) {
                if (node.click) {
                    node.click();
                } else {
                    evt = document.createEvent('MouseEvents');
                    evt.initMouseEvent('click', true, true, window,
                        0, 0, 0, 0, 0, false, false, false, false, 0, null);
                    node.dispatchEvent(evt);
                }
            });
        },
        _moreLinkClicked: function (e) {

            if (this._originalActiveFilter) {
                this.editFilterItems.baseFilter = this._originalActiveFilter;
            }

            this.editFilterItems.showDialog();
            e.cancelBubble = true;
        },
        uninitialize: function () {
            this.inherited(arguments);

            if (this.editFilterItems) {
                this.editFilterItems.destroy(false);

            }

            if (this.editFilterItemsHandle) {
                this.editFilterItemsHandle.remove();
            }
        },
        _setFilterGroupAttr: function (value) {
            if (this._filterSubscriptions) {
                array.forEach(this._filterSubscriptions, function (subscription) {
                    this.unsubscribe(subscription);
                }, this);
            }

            this._filterGroup = value;
            this._filterSubscriptions = []; // we do not listen to reload, as reload will destroy this widget
            this._filterSubscriptions.push(
                this.subscribe(dString.substitute("/ui/filters/${0}/change", [this._filterGroup]), this._onChange),
                this.subscribe(dString.substitute("/ui/filters/${0}/clear", [this._filterGroup]), this._onClear),
                this.subscribe(dString.substitute("/ui/filters/${0}/refresh", [this._filterGroup]), lang.hitch(this, this._onRefresh)));
        },
        _onRefresh: function (applied, definitionSet, filterManager) {
            this.appliedValues = applied;
            this.updateCounts();
        },
        _updateActiveFilters: function () {
            var filterManager = this._getFilterManager(),
                queryParts = [],
                q = false;

            if (filterManager) {
                q = filterManager.createQuery();
            }

            if (!this.expanded) {
                return;
            }

            if (q === false) {
                q = '';
            } else {
                queryParts.push(q);
            }

            if (this._originalActiveFilter) {
                queryParts.push(this._originalActiveFilter);
            }

            q = queryParts.length > 1 ? queryParts.join(' AND ') : queryParts.join('');

            return q;
            //this.store.request.setQueryArg('_activeFilter', q);
        },
        refresh: function () {
            // Force a refresh if we have already loaded
            if (this._loaded) {
                array.forEach(query('*', this.listNode), function (item) {
                    domConstruct.destroy(item);
                });

                this.requestData();
            }
        },
        _onChange: function (definition, name, value, source) {
            // todo: save value if we are not expanded
            name = this._transformFilterItemName(name);
            if (source !== this && definition.$key === this.filter.$key) {
                query(dString.substitute('> [data-name="${0}"]', [name]), this.listNode).forEach(function (el) {
                    domAttr.set(el, 'data-selected', (!!value).toString());
                    domClass.toggle(el, 'filter-selected', !!value);
                });
            }
        },
        _onClear: function (definition, source) {
            if (source !== this && (!definition || definition.$key === this.filter.$key)) {
                query('> [data-selected="true"]', this.listNode).forEach(function (el) {
                    domAttr.set(el, 'data-selected', 'false');
                    domClass.toggle(el, 'filter-selected', false);
                });
            }
        },
        _getFilterGroupAttr: function () {
            return this._filterGroup;
        },
        _formatLabelText: function (value, name) {
            if (name === this.nullName) {
                return this.nullText;
            } else if (name === this.emptyName) {
                return this.emptyText;
            }

            if (this.configurationProvider) {
                if (this.configurationProvider.getFilterFormatter) {
                    var formatter = this.configurationProvider.getFilterFormatter(this.filter);
                    if (formatter) {
                        return formatter(value);
                    }
                }
            }

            return value;
        },
        _isDistinctFilter: function () {
            return this.filter &&
                   this.filter.details &&
                   this.filter.details.distinctFilter;
        },
        _isRangeFilter: function () {
            return this.filter &&
                   this.filter.details &&
                   this.filter.details.rangeFilter;
        },
        compileRanges: function (ranges) {
            var i = 0;
            this._ranges = {};
            for (i = 0; i < ranges.length; i++) {
                this._ranges[this._transformFilterItemName(ranges[i].rangeName)] = ranges[i];
            }
        },
        _saveExpandState: function () {
            var data = this.parent._configuration._hiddenFilters || {},
                key = this.parent._configuration._hiddenFiltersKey,
                service = Sage.Services.getService("ClientGroupContext"),
                context = service && service.getContext(),
                prop = context.CurrentEntity + '_' + this.filter.filterName;

            // Create it if necessary
            if (!data[prop]) {
                data[prop] = {
                    expanded: false,
                    hidden: false
                };
            }

            data[prop].expanded = this.expanded;
            FiltersUtility.setHiddenFilters(key, json.stringify(data));
        },
        toggleExpand: function (params, evt, el) {
            // toggleExpand is called when the user clicks the filter to expand it
            this._toggleExpand();
            this._saveExpandState();
        },
        _toggleExpand: function () {
            // toggle expanded state without saving state
            this.expanded = !this.expanded;

            if (this.domNode) {
                domClass.toggle(this.domNode, 'filter-collapsed');
            }

            this._loadItems();
        },
        _loadItems: function () {
            if (!this._loaded) {
                this._loaded = true;
                this.requestData();

                if (this.appliedValues)
                    this.updateCounts();
            } else {
                this.updateCounts();
            }
        },
        toggleSelect: function (params, evt, el) {
            var selected = /^true$/i.test(params.selected),
                name = params.name,
                value = !selected && (this._isRangeFilter() ? this._ranges[name] : name);
            this.onSelectionChange(this.filter, name, value, this);
            domAttr.set(el, 'data-selected', (!selected).toString());
            domAttr.set(el, 'aria-checked', (!selected).toString());
            domClass.toggle(el, 'filter-selected', !selected);
        },
        onSelectionChange: function (definition, name, value, source) {
            connect.publish(dString.substitute("/ui/filters/${0}/change", [this._filterGroup]), [definition, name, value, source]);
        },
        updateCounts: function () {
            if (!this.lazyUpdateCounts) {
                this.lazyUpdateCounts = Utility.debounce(lang.hitch(this, function () {
                    if (this.expanded) {
                        query('li[data-name] div span.p-count', this.listNode).forEach(function (node) {
                            node.innerHTML = '0';
                        });

                        var where = this._updateActiveFilters();
                        //this._updateActiveFilters();
                        ///////////////////////////////////////////
                        var service = SDataServiceRegistry.getSDataService('metadata');
                        var request = new Sage.SData.Client.SDataResourcePropertyRequest(service);
                        request.setResourceKind('entities')
                        .setQueryArg('select', 'filters/filterType')
                        .setQueryArg('where', where)
                        .setQueryArg('format', 'json').setQueryArg('Count', '500');

                        request.readFeed({
                            success: function (response) {
                                this._onSuccessCount(response);
                            },
                            error: function (error) {
                                if (error) {
                                    console.error(error);
                                }
                            },
                            scope: this,
                            async: true
                        });
                        ////////////////////////////////////////////////////
                        //this._doUpdateCounts();

                    }
                }), this.FILTER_UPDATE_DELAY);
            }

            this.lazyUpdateCounts();
        },
        //_doUpdateCounts: function () {
        //    this.store.fetch({
        //        onComplete: lang.hitch(this, this._updateCountsInPlace),
        //        count: this.count,
        //        onItem:false
        //    });
        //},
        requestData: function () {
            if (this.loading) {
                if (this.domNode) {
                    domClass.add(this.domNode, 'filter-loading');
                    this.set('content', '');
                }
            }
            var filterType = this.filter.$key;

            var service = SDataServiceRegistry.getSDataService('metadata');
            if (filterType == "ModifiedDate") {
                var modDate = this._getFromLocalStorage('modifiedDateTotalFilterCount');
                if (modDate !== null) {
                    if (modDate.length == this.numModDateFiltersCnt) {
                        var modifiedDateTotalFilterCount = [
                              { "name": "Today", "$descriptor": this.filteroptionToday, value: modDate[0].value },
                              { "name": "ThisWeek", "$descriptor": this.filteroptionThisWeek, value: modDate[1].value },
                              { "name": "ThisMonth", "$descriptor": this.filteroptionThisMonth, value: modDate[2].value },
                              { "name": "ThisQuarter", "$descriptor": this.filteroptionThisQuarter, value: modDate[3].value },
                              { "name": "ThisYear", "$descriptor": this.filteroptionThisYear, value: modDate[4].value },
                              { "name": "LastWeek", "$descriptor": this.filteroptionLastWeek, value: modDate[5].value },
                              { "name": "LastMonth", "$descriptor": this.filteroptionLastMonth, value: modDate[6].value },
                              { "name": "LastQuarter", "$descriptor": this.filteroptionLastQuarter, value: modDate[7].value },
                              { "name": "LastYear", "$descriptor": this.filteroptionLastYear, value: modDate[8].value },
                              { "name": "WeektoDate", "$descriptor": this.filteroptionWeektoStart, value: modDate[9].value },
                              { "name": "MonthtoDate", "$descriptor": this.filteroptionMonthtoStart, value: modDate[10].value },
                              { "name": "QtrtoDate", "$descriptor": this.filteroptionQtrtoStart, value: modDate[11].value },
                              { "name": "YeartoDate", "$descriptor": this.filteroptionYeartoStart, value: modDate[12].value },
                              { "name": "Older", "$descriptor": this.filteroptionOlder, value: modDate[13].value }
                        ];

                        this._processFetchResult(modifiedDateTotalFilterCount);
                        this._updateCountsInPlace(modifiedDateTotalFilterCount);
                        this.resolveDeferred();
                        return;
                    }
                }
                else {

                    request = new Sage.SData.Client.SDataResourcePropertyRequest(service);
                    request.setResourceKind('entities')
                    .setQueryArg('select', '$updated').setQueryArg('format', 'json').setQueryArg('Count', '500');

                    request.readFeed({
                        success: function (response) {
                            this._onSuccessModifiedDate(response);
                        },
                        error: function (error) {
                            if (error) {
                                console.error(error);
                            }
                        },
                        scope: this,
                        async: true
                    });
                }
            }
            else if (filterType == "HasMeasure") {
                var totalMetricCount = this._getFromLocalStorage('totalMetricCount');
                if (totalMetricCount !== null) {
                    var HasMetric = [{ "name": "analyticsMetric", "$descriptor": this.filterHasMetric, "value": totalMetricCount.totalMetricCount }];
                    this._processFetchResult(HasMetric);
                    query("div span.p-count", query("li[data-name=\"analyticsMetric\"]")[0]).forEach(function (span) {
                        span.innerHTML = totalMetricCount.totalMetricCount;
                    });
                    this._finishedLoading();
                    this.resolveDeferred();
                    return;
                }
                else {
                    request = new Sage.SData.Client.SDataResourcePropertyRequest(service);
                    request.setResourceKind('entities')
                    .setQueryArg('where', 'filters.filterType eq "analyticsMetric"')
                    .setQueryArg('format', 'json').setQueryArg('Count', '500');

                    request.readFeed({
                        success: function (response) {
                            this._onSuccessHasMeasure(response);
                        },
                        error: function (error) {
                            if (error) {
                                console.error(error);
                            }
                        },
                        scope: this,
                        async: true
                    });
                }
            }
            else if (filterType == "HasFilter") {
                var totalFilterCount = this._getFromLocalStorage('totalFilterCount');
                if (totalFilterCount !== null) {
                    var HasFilter = [{ "name": "analyticsMetric", "$descriptor": this.filterHasFilter, "value": totalFilterCount.totalFilterCount }];
                    this._processFetchResult(HasFilter);
                    query("div span.p-count", query("li[data-name=\"analyticsMetric\"]")[1]).forEach(function (span) {
                        span.innerHTML = totalFilterCount.totalFilterCount;
                    });
                    this._finishedLoading();
                    this.resolveDeferred();
                    return;
                }
                else {
                    request = new Sage.SData.Client.SDataResourcePropertyRequest(service);
                    request.setResourceKind('entities')
                    .setQueryArg('where', 'filters.filterType ne "analyticsMetric"')
                    .setQueryArg('format', 'json').setQueryArg('Count', '500');

                    request.readFeed({
                        success: function (response) {
                            this._onSuccessHasFilter(response);
                        },
                        error: function (error) {
                            if (error) {
                                console.error(error);
                            }
                        },
                        scope: this,
                        async: true
                    });
                }
            }

        },

        _onSuccessCount: function (response) {

            var todayVal = 0, thisWeek = 0, thisMonth = 0, thisQu = 0, thisYear = 0, lastWeek = 0, lastMon = 0, lastQu = 0, lastYear = 0, older = 0;
            var weektoDt = 0, monthtoDt = 0, qtrtoDt = 0, yrtoDt = 0;
            var entities = response.$resources;
            var regExp = /\(([^)]+)\)/;
            var i;

            var todaystart = new Date(this.specialDates[':todaystart'](new Date(Date.now())));
            var todayend = new Date(this.specialDates[':todayend'](new Date(Date.now())));
            var thisweekstart = new Date(this.specialDates[':thisweekstart'](new Date(Date.now())));
            var thisweekend = new Date(this.specialDates[':thisweekend'](new Date(Date.now())));
            var thismonthstart = new Date(this.specialDates[':thismonthstart'](new Date(Date.now())));
            var thismonthend = new Date(this.specialDates[':thismonthend'](new Date(Date.now())));
            var thisquarterstart = new Date(this.specialDates[':thisquarterstart'](new Date(Date.now())));
            var thisquarterend = new Date(this.specialDates[':thisquarterend'](new Date(Date.now())));
            var thisyearstart = new Date(this.specialDates[':thisyearstart'](new Date(Date.now())));
            var thisyearend = new Date(this.specialDates[':thisyearend'](new Date(Date.now())));
            var lastweekstart = new Date(this.specialDates[':lastweekstart'](new Date(Date.now())));
            var lastweekend = new Date(this.specialDates[':lastweekend'](new Date(Date.now())));
            var lastmonthstart = new Date(this.specialDates[':lastmonthstart'](new Date(Date.now())));
            var lastmonthend = new Date(this.specialDates[':lastmonthend'](new Date(Date.now())));
            var lastquarterstart = new Date(this.specialDates[':lastquarterstart'](new Date(Date.now())));
            var lastquarterend = new Date(this.specialDates[':lastquarterend'](new Date(Date.now())));
            var lastyearstart = new Date(this.specialDates[':lastyearstart'](new Date(Date.now())));
            var lastyearend = new Date(this.specialDates[':lastyearend'](new Date(Date.now())));

            for (i = 0; i <= entities.length - 1; i++) {
                var milliSecs = regExp.exec(entities[i].$updated);
                var dateValue = new Date(parseInt(milliSecs[1]));

                if (dateValue >= todaystart && dateValue <= todayend)
                    todayVal++;
                if (dateValue >= thisweekstart && dateValue <= thisweekend)
                    thisWeek++;
                if (dateValue >= thismonthstart && dateValue <= thismonthend)
                    thisMonth++;
                if (dateValue >= thisquarterstart && dateValue <= thisquarterend)
                    thisQu++;
                if (dateValue >= thisyearstart && dateValue <= thisyearend)
                    thisYear++;
                if (dateValue >= lastweekstart && dateValue <= lastweekend)
                    lastWeek++;
                if (dateValue >= lastmonthstart && dateValue <= lastmonthend)
                    lastMon++;
                if (dateValue >= lastquarterstart && dateValue <= lastquarterend)
                    lastQu++;
                if (dateValue >= lastyearstart && dateValue <= lastyearend)
                    lastYear++;
                if (dateValue >= thisweekstart && dateValue <= todayend)
                    weektoDt++;
                if (dateValue >= thismonthstart && dateValue <= todayend)
                    monthtoDt++;
                if (dateValue >= thisquarterstart && dateValue <= todayend)
                    qtrtoDt++;
                if (dateValue >= thisyearstart && dateValue <= todayend)
                    yrtoDt++;
                if (dateValue < lastyearend)
                    older++;
            }

            /////////////////////////////////
            var metricCount = 0, filterCount = 0;
            var metricFound = false, filterFound = false;
            for (i = 0; i < entities.length; i++) {
                if (entities[i].filters && entities[i].filters.$resources) {
                    metricFound = false;
                    filterFound = false;
                    var filters = entities[i].filters.$resources;
                    for (var j = 0; j < filters.length; j++) {
                        if (filters[j].filterType.indexOf("analyticsMetric") > -1) {
                            metricFound = true;
                            break;
                        }
                    }
                    for (var k = 0; k < filters.length; k++) {
                        if (filters[k].filterType.indexOf("analyticsMetric") <= -1) {
                            filterFound = true;
                            break;
                        }
                    }
                    if (metricFound)
                        ++metricCount;
                    if (filterFound)
                        ++filterCount;
                }
            }
            /////////////////////////////////

            var entityNameFilter = [
                          { "name": "Today", "$descriptor": this.filteroptionToday, value: todayVal },
                          { "name": "ThisWeek", "$descriptor": this.filteroptionThisWeek, value: thisWeek },
                          { "name": "ThisMonth", "$descriptor": this.filteroptionThisMonth, value: thisMonth },
                          { "name": "ThisQuarter", "$descriptor": this.filteroptionThisQuarter, value: thisQu },
                          { "name": "ThisYear", "$descriptor": this.filteroptionThisYear, value: thisYear },
                          { "name": "LastWeek", "$descriptor": this.filteroptionLastWeek, value: lastWeek },
                          { "name": "LastMonth", "$descriptor": this.filteroptionLastMonth, value: lastMon },
                          { "name": "LastQuarter", "$descriptor": this.filteroptionLastQuarter, value: lastQu },
                          { "name": "LastYear", "$descriptor": this.filteroptionLastYear, value: lastYear },
                          { "name": "WeektoDate", "$descriptor": this.filteroptionWeektoStart, value: weektoDt },
                          { "name": "MonthtoDate", "$descriptor": this.filteroptionMonthtoStart, value: monthtoDt },
                          { "name": "QtrtoDate", "$descriptor": this.filteroptionQtrtoStart, value: qtrtoDt },
                          { "name": "YeartoDate", "$descriptor": this.filteroptionYeartoStart, value: yrtoDt },
                          { "name": "Older", "$descriptor": this.filteroptionOlder, value: older }
            ];
            var analyticsMetric = "analyticsMetric";
            query("div span.p-count", query("li[data-name=\"" + analyticsMetric + "\"]")[0]).forEach(function (span) {
                span.innerHTML = metricCount;
            });
            query("div span.p-count", query("li[data-name=\"" + analyticsMetric + "\"]")[1]).forEach(function (span) {
                span.innerHTML = filterCount;
            });
            this._updateCountsInPlace(entityNameFilter);
        },
        _onSuccessHasFilter: function (response) {

            var entities = response.$resources;
            var entityNameFilter = [{ "name": "analyticsMetric", "$descriptor": this.filterHasFilter, "value": entities.length }];
            this._processFetchResult(entityNameFilter);
            //this._updateCountsInPlace(items);
            var analyticsMetric = "analyticsMetric";
            query("div span.p-count", query("li[data-name=\"analyticsMetric\"]")[1]).forEach(function (span) {
                span.innerHTML = entities.length;
            });
            this._finishedLoading();
            this.resolveDeferred();

            this._saveToLocalStorage('totalFilterCount', { totalFilterCount: entities.length });
            //this._onFetchComplete(entityNameFilter);
        },
        _onSuccessHasMeasure: function (response) {
            var entities = response.$resources;
            var entityNameFilter = [{ "name": "analyticsMetric", "$descriptor": this.filterHasMetric, "value": entities.length }];
            this._processFetchResult(entityNameFilter);
            var analyticsMetric = "analyticsMetric";
            query("div span.p-count", query("li[data-name=\"analyticsMetric\"]")[0]).forEach(function (span) {
                span.innerHTML = entities.length;
            });
            this._finishedLoading();
            this.resolveDeferred();
            //this._onFetchComplete(entityNameFilter);
            this._saveToLocalStorage('totalMetricCount', { totalMetricCount: entities.length });

        },
        _onSuccessModifiedDate: function (response) {
            var todayVal = 0, thisWeek = 0, thisMonth = 0, thisQu = 0, thisYear = 0, lastWeek = 0, lastMon = 0, lastQu = 0, lastYear = 0, older = 0;
            var weektoDt = 0, monthtoDt = 0, qtrtoDt = 0, yrtoDt = 0;
            //var f = new FilterManager();
            var entities = response.$resources;
            var regExp = /\(([^)]+)\)/;

            var todaystart = new Date(this.specialDates[':todaystart'](new Date(Date.now())));
            var todayend = new Date(this.specialDates[':todayend'](new Date(Date.now())));
            var thisweekstart = new Date(this.specialDates[':thisweekstart'](new Date(Date.now())));
            var thisweekend = new Date(this.specialDates[':thisweekend'](new Date(Date.now())));
            var thismonthstart = new Date(this.specialDates[':thismonthstart'](new Date(Date.now())));
            var thismonthend = new Date(this.specialDates[':thismonthend'](new Date(Date.now())));
            var thisquarterstart = new Date(this.specialDates[':thisquarterstart'](new Date(Date.now())));
            var thisquarterend = new Date(this.specialDates[':thisquarterend'](new Date(Date.now())));
            var thisyearstart = new Date(this.specialDates[':thisyearstart'](new Date(Date.now())));
            var thisyearend = new Date(this.specialDates[':thisyearend'](new Date(Date.now())));
            var lastweekstart = new Date(this.specialDates[':lastweekstart'](new Date(Date.now())));
            var lastweekend = new Date(this.specialDates[':lastweekend'](new Date(Date.now())));
            var lastmonthstart = new Date(this.specialDates[':lastmonthstart'](new Date(Date.now())));
            var lastmonthend = new Date(this.specialDates[':lastmonthend'](new Date(Date.now())));
            var lastquarterstart = new Date(this.specialDates[':lastquarterstart'](new Date(Date.now())));
            var lastquarterend = new Date(this.specialDates[':lastquarterend'](new Date(Date.now())));
            var lastyearstart = new Date(this.specialDates[':lastyearstart'](new Date(Date.now())));
            var lastyearend = new Date(this.specialDates[':lastyearend'](new Date(Date.now())));

            for (var i = 0; i <= entities.length - 1; i++) {
                var milliSecs = regExp.exec(entities[i].$updated);
                var dateValue = new Date(parseInt(milliSecs[1]));

                if (dateValue >= todaystart && dateValue <= todayend)
                    todayVal++;
                if (dateValue >= thisweekstart && dateValue <= thisweekend)
                    thisWeek++;
                if (dateValue >= thismonthstart && dateValue <= thismonthend)
                    thisMonth++;
                if (dateValue >= thisquarterstart && dateValue <= thisquarterend)
                    thisQu++;
                if (dateValue >= thisyearstart && dateValue <= thisyearend)
                    thisYear++;
                if (dateValue >= lastweekstart && dateValue <= lastweekend)
                    lastWeek++;
                if (dateValue >= lastmonthstart && dateValue <= lastmonthend)
                    lastMon++;
                if (dateValue >= lastquarterstart && dateValue <= lastquarterend)
                    lastQu++;
                if (dateValue >= lastyearstart && dateValue <= lastyearend)
                    lastYear++;
                if (dateValue >= thisweekstart && dateValue <= todayend)
                    weektoDt++;
                if (dateValue >= thismonthstart && dateValue <= todayend)
                    monthtoDt++;
                if (dateValue >= thisquarterstart && dateValue <= todayend)
                    qtrtoDt++;
                if (dateValue >= thisyearstart && dateValue <= todayend)
                    yrtoDt++;
                if (dateValue < lastyearend)
                    older++;
            }

            var entityNameFilter = [
                          { "name": "Today", "$descriptor": this.filteroptionToday, value: todayVal },
                          { "name": "ThisWeek", "$descriptor": this.filteroptionThisWeek, value: thisWeek },
                          { "name": "ThisMonth", "$descriptor": this.filteroptionThisMonth, value: thisMonth },
                          { "name": "ThisQuarter", "$descriptor": this.filteroptionThisQuarter, value: thisQu },
                          { "name": "ThisYear", "$descriptor": this.filteroptionThisYear, value: thisYear },
                          { "name": "LastWeek", "$descriptor": this.filteroptionLastWeek, value: lastWeek },
                          { "name": "LastMonth", "$descriptor": this.filteroptionLastMonth, value: lastMon },
                          { "name": "LastQuarter", "$descriptor": this.filteroptionLastQuarter, value: lastQu },
                          { "name": "LastYear", "$descriptor": this.filteroptionLastYear, value: lastYear },
                          { "name": "WeektoDate", "$descriptor": this.filteroptionWeektoStart, value: weektoDt },
                          { "name": "MonthtoDate", "$descriptor": this.filteroptionMonthtoStart, value: monthtoDt },
                          { "name": "QtrtoDate", "$descriptor": this.filteroptionQtrtoStart, value: qtrtoDt },
                          { "name": "YeartoDate", "$descriptor": this.filteroptionYeartoStart, value: yrtoDt },
                          { "name": "Older", "$descriptor": this.filteroptionOlder, value: older }
            ];

            //this._onFetchComplete(entityNameFilter);
            this._processFetchResult(entityNameFilter);
            this._updateCountsInPlace(entityNameFilter);
            this.resolveDeferred();

            this._saveToLocalStorage('modifiedDateTotalFilterCount', entityNameFilter);
        },

        _onFetchComplete: function (items, requestObject) {
            this._processFetchResult(items, requestObject);
            this._updateCountsInPlace(items);
            this.resolveDeferred();
        },
        _onFetchError: function (error, requestObject) {
            if (this.domNode) {
                domClass.remove(this.domNode, 'filter-loading');
            }
            this.resolveDeferred();
        },
        isFilterItemHidden: function (filterItem) {
            var data = this.parent._configuration._hiddenFilters || {},
                service = Sage.Services.getService("ClientGroupContext"),
                context = service && service.getContext(),
                prop = context.CurrentEntity + '_' + this.filter.filterName,
                hidden = false;

            if (data[prop]) {
                hidden = array.some(data[prop].items, function (item) {
                    return item === filterItem;
                });
            }

            return hidden;
        },
        _updateCountsInPlace: function (items, requestObject) {
            var i = 0,
                entry = null,
                len = items.length;

            for (i = 0; i < len; i++) {
                entry = items[i];
                entry.name = this._transformFilterItemName(entry.name);
                query("li[data-name=\"" + entry.name + "\"]", this.listNode).forEach(function (node) {
                    query("div span.p-count", node).forEach(function (span) {
                        span.innerHTML = entry.value;
                    });
                });
            }

            this._finishedLoading();
        },
        _processFetchResult: function (items, requestObject) {
            var i = 0,
                entry = null,
                hidden = false,
                len = items.length,
                selected = false;

            for (i = 0; i < len; i++) {
                entry = items[i];
                entry.name = this._transformFilterItemName(entry.name);
                hidden = this.isFilterItemHidden(entry.name);
                if (hidden === false || this._isRangeFilter()) {
                    selected = this.appliedValues && this.appliedValues[this.filter.$key] && !!this.appliedValues[this.filter.$key][entry.name];
                    entry.selected = selected || (this.appliedValues && !!this.appliedValues[entry.name]);
                    entry.ofText = this.ofText;

                    this.output.push(this.itemTemplate.apply(entry, this));
                    this.entries.push(entry);
                }
            }

            this._fixMissingItems();
            if (this.domNode) {
                this.set('content', this.output.join(''));
            }
            this._clearOutputEntries();
            //this._updateCountsInPlace(items);
        },
        _transformFilterItemName: function (name) {
            var results = name;
            if (name === null) {
                results = this.nullName;
            } else if (name === '') {
                results = this.emptyName;
            }

            return results ? results.trim() : results;
        },
        _fixMissingItems: function () {
            /*
            We could end up in a situation where we have applied a filter,
            and then edited the item. This would cause the distinct checkboxes
            to not show up, thus allowing the user to never clear it. Find these
            and add them to the filter items list so the user can uncheck it.
            */
            var tempEntry,
                prop,
                val,
                exists = true;

            for (prop in this.appliedValues) {
                if (this.appliedValues.hasOwnProperty(prop)) {
                    val = this.appliedValues[prop];
                    exists = array.some(this.entries, function (entry) {
                        return entry.name === prop;
                    });

                    if (!exists) {
                        tempEntry = {
                            name: '',
                            $descriptor: '',
                            selected: true,
                            value: 0
                        };

                        tempEntry.name = prop;
                        tempEntry.$descriptor = val;
                        tempEntry.ofText = this.ofText;

                        if (typeof tempEntry.$descriptor === 'string') {
                            this.output.push(this.itemTemplate.apply(tempEntry, this));
                            this.entries.push(tempEntry);
                        }
                    }
                }
            }
        },
        _clearOutputEntries: function () {
            this.output = [];
            this.entries = [];
        },
        _finishedLoading: function () {
            this.loading = false;
            this.store.request.setQueryArg('_activeFilter', this._originalActiveFilter || '');
            if (this.domNode) {
                domClass.remove(this.domNode, 'filter-loading');
            }
        },
        _getFilterManager: function () {
            var filterManager = this.parent.filterManager;
            if (!filterManager) {
                if (this.parent._configuration.getFilterManager) {
                    filterManager = this.parent._configuration.getFilterManager();
                }
            }
            //Add to make sure the check box filter is part of the current view.            
            var service = Sage.Services.getService("ClientGroupContext");
            var context = service && service.getContext();
            if (this.groupId != context.CurrentGroupID) {
                filterManager = null;
            }
            return filterManager;
        },
        resolveDeferred: function () {
            if (this.deferred) {
                // resolve() doesn't have a return, so deferred is set to null
                //  (ensures this doesn't get hit when it's already resolved)
                this.deferred = this.deferred.resolve();
            }
        },
        _saveToLocalStorage: function (key, value) {
            var localStore = new LocalStorageProvider();
            localStore.initialize();
            localStore.put(key, value, function (status, key, message) {
                if (status === localStore.FAILED) {
                    console.error('Failed writing key: ' + key + ' in local storage. Message: ' + message);
                }
            });  //Add Name space param.
        },
        _getFromLocalStorage: function (key, value) {
            var localStore = new LocalStorageProvider();
            localStore.initialize();
            return localStore.get(key, value); // returns null if key does not exist. 
        },
        /* static object */
        specialDates: {
            // today and todaystart are the same
            ':today': function (today) {
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':todaystart': function (today) {
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':todayend': function (today) {
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            // yesterday and yesterdaystart are the same
            ':yesterday': function (today) {
                today.setDate(today.getDate() - 1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':yesterdaystart': function (today) {
                today.setDate(today.getDate() - 1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':yesterdayend': function (today) {
                today.setDate(today.getDate() - 1);
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            // tomorrow and tomorrowstart are the same
            ':tomorrow': function (today) {
                today.setDate(today.getDate() + 1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':tomorrowstart': function (today) {
                today.setDate(today.getDate() + 1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':tomorrowend': function (today) {
                today.setDate(today.getDate() + 1);
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':thisweekstart': function (today) {
                today.setDate(today.getDate() - today.getDay());
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':thisweekend': function (today) {
                today.setDate(today.getDate() + (6 - today.getDay()));
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':thismonthstart': function (today) {
                today.setDate(1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':thismonthend': function (today) {
                today.setDate(dojoDate.getDaysInMonth(today));
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':thisyearstart': function (today) {
                today.setDate(1);
                today.setMonth(0);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':thisyearend': function (today) {
                today.setDate(31);
                today.setMonth(11);
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':thisquarterstart': function (today) {
                // 1 | jan (0), feb (1), march (2)
                // 2 | april (3), may (4), june (5)
                // 3 | july (6), august (7), sept (8)
                // 4 | oct (9), nov (10), dec (11)
                var month = today.getMonth(),
                    mod = month % 3;
                today.setMonth(month - mod);
                today.setDate(1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':thisquarterend': function (today) {
                var month = today.getMonth(),
                    mod = 2 - (month % 3);
                today.setMonth(month + mod);
                today.setDate(dojoDate.getDaysInMonth(today));
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':nextweekstart': function (today) {
                today.setDate(today.getDate() + (7 - today.getDay()));
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':nextweekend': function (today) {
                today.setDate(today.getDate() + (7 - today.getDay()) + 6);
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':nextmonthstart': function (today) {
                today.setMonth(today.getMonth() + 1);
                today.setDate(1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':nextmonthend': function (today) {
                today.setMonth(today.getMonth() + 1);
                today.setDate(1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':nextyearstart': function (today) {
                today.setFullYear(today.getFullYear() + 1);
                today.setMonth(0);
                today.setDate(1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':nextyearend': function (today) {
                today.setFullYear(today.getFullYear() + 1);
                today.setMonth(11);
                today.setDate(31);
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':nextquarterstart': function (today) {
                var month = today.getMonth(),
                    mod = 2 - (month % 3);
                today.setMonth(month + mod + 1);
                today.setDate(1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':nextquarterend': function (today) {
                var month = today.getMonth(),
                    mod = 2 - (month % 3);
                today.setMonth(month + mod + 3);
                today.setDate(dojoDate.getDaysInMonth(today));
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':lastweekstart': function (today) {
                today.setDate(today.getDate() - today.getDay() - 7);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':lastweekend': function (today) {
                today.setDate(today.getDate() - today.getDay() - 1);
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':lastmonthstart': function (today) {
                today.setMonth(today.getMonth() - 1);
                today.setDate(1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':lastmonthend': function (today) {
                today.setMonth(today.getMonth() - 1);
                today.setDate(dojoDate.getDaysInMonth(today));
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':lastyearstart': function (today) {
                today.setFullYear(today.getFullYear() - 1);
                today.setMonth(0);
                today.setDate(1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':lastyearend': function (today) {
                today.setFullYear(today.getFullYear() - 1);
                today.setMonth(11);
                today.setDate(31);
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':lastquarterstart': function (today) {
                var month = today.getMonth(),
                    mod = month % 3;
                today.setMonth(month - mod - 3);
                today.setDate(1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':lastquarterend': function (today) {
                var month = today.getMonth(),
                    mod = month % 3;
                today.setMonth(month - mod - 1);
                today.setDate(dojoDate.getDaysInMonth(today));
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            }
        }
    });

    return widget;
});