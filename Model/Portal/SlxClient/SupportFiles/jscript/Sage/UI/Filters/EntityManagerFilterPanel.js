/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dijit/_Widget',
    'dijit/_Container',
    'Sage/_Templated',
    'Sage/Services/_ServiceMixin',
    'Sage/_ConfigurationProvider',
    'Sage/UI/Filters/EntityManagerCheckBoxFilter',
    'Sage/UI/Filters/LookupFilter',
    'Sage/UI/Filters/EntityManagerEditFilters',
    'dojo/_base/declare',
    'dojo/i18n',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/query',
    'dojo/on',
    'dojo/i18n!./nls/FilterPanel',
    'dojo/has',
    'dojo/_base/sniff',
    'dojo/ready',
    'dojo/json',
    'dojo/DeferredList',
    'dojo/_base/Deferred',
    'dojo/string',
    'Sage/Services/UserOptions'

], function (
    _Widget,
    _Container,
    _Templated,
    _ServiceMixin,
    _ConfigurationProvider,
    EntityManagerCheckBoxFilter,
    LookupFilter,
    EntityManagerEditFilters,
    declare,
    i18n,
    array,
    lang,
    query,
    on,
    nls,
    has,
    sniff,
    ready,
    json,
    DeferredList,
    Deferred,
    dString
) {
    var filterPanel = declare('Sage.UI.Filters.EntityManagerFilterPanel', [_Widget, _Container, _ServiceMixin, _Templated], {
        serviceMap: {
            'groupContextService': 'ClientGroupContext',
            'metaDataService': {
                type: 'sdata',
                name: 'metadata'
            }
        },
        knownFilterTypes: {
            'checkedList': EntityManagerCheckBoxFilter,
            'comboWithArgument': LookupFilter
        },
        widgetsInTemplate: false,
        widgetTemplate: new Simplate([
            '<div class="filter-panel" data-dojo-attach-point="containerNode">',
                '<div class="filter-edit"><a href="#" data-dojo-attach-point="clearAllFiltersNode">{%= $.clearText %}</a> | <a href="#" data-dojo-attach-point="editFiltersNode">{%= $.editText %}</a></div>',
                '<div class="filter-summary" data-dojo-attach-point="filterSummaryNode">{%= $.noneText %}</div>', // TODO
            '</div>'
        ]),
        _filterGroup: null,
        _filterSubscriptions: null,
        _configuration: null,
        _configurationConnects: null,
        _configurationProvider: null,
        _configurationProviderType: null,
        _appliedSet: null,
        configurationProvider: null,
        configurationProviderType: null,
        autoConfigure: true,
        store: null,
        filterGroup: 'default',
        filterManager: null,
        _appliedFilters: null,
        _isApplyingConfig: false,
        _isFirstLoad: true,
        // filter editor
        _editFilters: null,
        _editFiltersHandle: null,
        _isFetchingData: false,
        constructor: function () {
            var filterStore = Sage.Utility.getValue(window, 'Sage.UI.DataStore.Filters');
            if (filterStore && filterStore[this.filterGroup]) {
                this._appliedSet = filterStore[this.filterGroup].applied;
            }

            if (nls) {
                this.editText = nls.editText;
                this.noneText = nls.noneText;
                this.clearText = nls.clearText;
            }

            this._appliedFilters = [];
            dojo.subscribe('/group/context/changed', lang.hitch(this, function () {
                // When filters get loaded for a new group, we need to treat this
                // as though it's a first load, so checkbox filters will get checked
                this._isApplyingConfig = false;
                this._isFetchingData = false;
                this._isFirstLoad = true;
            }));
            lang.mixin(this, nls);
        },
        postCreate: function () {
            this.inherited(arguments);
            this.startup();
        },
        startup: function () {
            this.inherited(arguments);
            if (!this._configurationProvider && this._configurationProviderType) {
                this.set('configurationProvider', new this._configurationProviderType());
            }
            if (this.autoConfigure) {
                this.requestConfiguration();
            }
        },
        uninitialize: function () {
            this.inherited(arguments);

            if (this._editFilters) {
                this._editFilters.destroy();
                this._editFiltersHandle.remove();
            }

            if (this._configurationProvider) {
                this._configurationProvider.destroy();
            }
        },
        _setFilterGroupAttr: function (value) {
            if (this._filterSubscriptions) {
                dojo.forEach(this._filterSubscriptions, function (subscription) {
                    this.unsubscribe(subscription);
                }, this);
            }

            this._filterGroup = value;
            this._filterSubscriptions = [];
            this._filterSubscriptions.push(
            this.subscribe(dString.substitute("/ui/filters/${0}/apply", [this._filterGroup]), lang.hitch(this, this._onApply)));
            this._filterSubscriptions.push(
            this.subscribe(dString.substitute("/ui/filters/${0}/change", [this._filterGroup]), lang.hitch(this, this._onChange)));
            this.subscribe(dString.substitute("/ui/filters/${0}/destroyFilters", [this._filterGroup]), lang.hitch(this, function () {
                this.destroyDescendants();
                this.filterSummaryNode.innerHTML = this.noneText;
            }));
        },
        _getFilterGroupAttr: function () {
            return this._filterGroup;
        },
        _onChange: function (definition, name, value, source) {
            var updated = false,
            appliedFilter,
            lookupFilter = false;
            if ((definition.details.lookupFilter) || (definition.details.userLookupFilter)) {
                lookupFilter = true;
                if (value) {
                    if (value.hasOwnProperty("value")) {
                        if ((value.value === null) || (value.value === '')) {
                            updated = true;
                        }
                    }
                }
            }
            array.forEach(this._appliedFilters, function (filter, i) {
                // If we have an existing filter in the collection,
                // update its selected items.
                
                if (filter && (filter.displayName === definition.filterName || filter.displayName === definition.displayName)) {
                    appliedFilter = this._appliedFilters[i];
                    var hasItem = true;
                    if (!lookupFilter) {
                        hasItem = array.some(appliedFilter.items, function (item) {
                            return item === name;
                        });
                    }
                    if (hasItem) {
                        if (lookupFilter) {
                            if (value) {
                                if ((value.value === null) || (value.value === '')) {
                                    //clear items
                                    appliedFilter.items = [];
                                    this._appliedFilters.splice(i, 1);
                                }
                            }
                        }
                        else {
                            array.forEach(appliedFilter.items, function (item, x) {
                                if (item === name) {
                                    appliedFilter.items.splice(x, 1);
                                }
                            }, this);
                        }
                    } else {
                        appliedFilter.items.push(name);
                    }
                    updated = true;
                }
            }, this);

            // Did we update the existing filter?
            if (!updated) {
                this._appliedFilters.push({ 'filterName': definition.filterName, 'displayName': definition.$descriptor || definition.displayName, items: [name] });
            }
            this._updateFilterSummary();
        },
        _updateFilterSummary: function () {
            var displayItems = [];
            array.forEach(array.filter(this._appliedFilters,
                function (filter) {
                    return (typeof filter.displayName !== 'undefined' && filter.displayName !== '') && (filter.items && filter.items.length > 0);
                }),
                function (filter) {
                    displayItems.push(filter.displayName + " (" + filter.items.length + ")");
                },
                this
            );

            if (displayItems.length === 0) {
                this.filterSummaryNode.innerHTML = this.noneText;
            } else {
                this.filterSummaryNode.innerHTML = displayItems.join(', ');
            }
        },
        _onApply: function (applied, definitionSet, source) {
            var key,
            items,
            itemProp,
            definition;

            //Lets check an make sure that the appliedInfo belongs to the curent group.
            //If not Ignore and return.
            if (source && this._configuration && this._configuration.groupId) {
                var context = source.getContext();
                if (context.CurrentGroupID.toUpperCase() !== this._configuration.groupId.toUpperCase()) {
                    return;
                }
            }

            this._appliedFilters = [];
            this._appliedSet = applied;
            for (key in this._appliedSet) {
                if (this._appliedSet.hasOwnProperty(key)) {
                    // definitionSet object shares the same prop as applied
                    definition = definitionSet[key];
                    items = this._appliedSet[key];
                    if (definition.details.lookupFilter || definition.details.userLookupFilter) {
                        if (items.hasOwnProperty("value")) {
                            this._onChange(definition, definition.filterName, items.value);
                        }
                    }
                    else {
                        // Iterate the filter items that are selected for this set,
                        // pass it to _onChange so we can update our summary.
                        for (itemProp in items) {
                            if (items.hasOwnProperty(itemProp)) {
                                this._onChange(definition, itemProp);
                            }
                        }
                    }
                }
            }
            if ((this._configuration)) {
                this.requestData();
            }
        },
        _handleConfigurationChange: function () {
            this.requestConfiguration();
        },
        _setConfigurationProviderAttr: function (configurationProvider) {
            if (this._configurationConnects) {
                dojo.forEach(this._configurationConnects, function (connection) {
                    this.disconnect(connection);
                }, this);
            }

            if (this._configurationProvider && this._configurationProvider !== configurationProvider) {
                this._configurationProvider.destroy();
            }

            this._configurationProvider = configurationProvider;
            this._configurationConnects = [];

            if (this._configurationProvider) {
                this._configurationConnects.push(this.connect(this._configurationProvider, 'onConfigurationChange', this._handleConfigurationChange));
                this._configurationProvider.set('owner', this);

                // only request configuration here if the widget has been fully created, otherwise
                // it will be handled by postCreate.
                if (this._created) {
                    if (this.autoConfigure) {
                        this.requestConfiguration();
                    }
                }
            }
        },
        _getConfigurationProviderAttr: function () {
            return this._configurationProvider;
        },
        _setConfigurationProviderTypeAttr: function (value) {
            this._configurationProviderType = value;
        },
        _getConfigurationProviderTypeAttr: function () {
            return this._configurationProviderType;
        },
        requestConfiguration: function () {
            if (this._configurationProvider && !this._isApplyingConfig) {
                this._isApplyingConfig = true;
                this._configurationProvider.requestConfiguration({
                    success: lang.hitch(this, this._applyConfiguration)
                });
            }
        },
        _applyConfiguration: function (configuration) {
            this._configuration = configuration;
            this.store = configuration.store;
            this.filterManager = configuration.getFilterManager();

            if (this._editFilters) {
                this._editFilters.destroy();
                this._editFiltersHandle.remove();
            }

            this._editFilters = new EntityManagerEditFilters({
                store: this.store,
                filterPanel: this
            });

            this._editFiltersHandle = on(this.editFiltersNode, 'click', lang.hitch(this, function () {
                this._editFilters.showDialog();
            }));

            on(this.clearAllFiltersNode, 'click', lang.hitch(this, this._clearAllFilters));
            //Need to clear the Previous filters.

            this._appliedSet = {};
            this._appliedFilters = [];
            this._updateFilterSummary();

            this.requestData(function () {
                var service = Sage.Services.getService("ClientGroupContext");
                service.publishFiltersApplied();
            });
            this._ensureApplyFilterWasPublished();
        },
        _ensureApplyFilterWasPublished: function () {
            // Hack: If we missed the filters/apply event, we will force the group context service to fire it.
            // This problem is in ListPanel as well.
            var service, context;
            service = Sage.Services.getService('ClientGroupContext');
            context = service && service.getContext();
            if (context && context.AppliedFilterInfo) {
                service.publishFiltersApplied(context.AppliedFilterInfo);
            }
        },
        _clearAllFilters: function () {
            // De-select all selected filters.
            var q = query('li.filter-selected', this.containerNode),
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

            q = query('.filter-lookup-input input', this.containerNode);
            array.forEach(q, function (node) {
                if (node.value) {
                    node.value = '';

                    if (has('ie') < 9) {
                        // IE
                        node.fireEvent('onkeydown');
                    } else {
                        evt = document.createEvent('KeyboardEvent');
                        if (evt.initKeyEvent) {
                            evt.initKeyEvent('keydown', true, true,
                            null, false, false, false, false, 13, 0);
                        } else {
                            evt.initKeyboardEvent('keydown', true, true,
                            null, 13, null, null, 1, null);
                        }
                        node.dispatchEvent(evt);
                    }
                }
            });
        },
        refreshFilters: function (keepSelected) {
            this._refreshing = true;
            if (keepSelected !== true) {
                this._clearAllFilters();
            }
            this.requestConfiguration();
        },
        requestData: function (onRequestComplete) {

            var svc = Sage.Services.getService('RoleSecurityService');
            if (svc) {
                if (svc.hasAccess('Administration/EntityManager/Entities/View')) {
                    //this._service = sDataServiceRegistry.getSDataService('metadata');
                }
                else {
                    return;
                }
            }

            if (this._isFetchingData) {
                return;
            }

            this._isFetchingData = true;
            this.destroyDescendants();

            var cacheKey, service, context, cacheData, data;

            service = Sage.Services.getService("ClientGroupContext");
            context = service && service.getContext();
            cacheKey = dString.substitute("METADATA_FILTERS_${0}_${1}", [context.CurrentEntity, context.CurrentGroupID]);

            cacheData = sessionStorage.getItem(cacheKey);
            if (cacheData) {
                data = json.parse(cacheData);
                this._iterateFetchedItems(data);
                if (onRequestComplete) {
                    onRequestComplete();
                }
            } else {
                var entityNameFilter = [{
                    "$key": "DisplayName",
                    "displayName": this.filterDisplayName,
                    "filterName": "Display Name",
                    "propertyName": "$descriptor",
                    "$descriptor": this.filterDisplayName,
                    "filterType": "comboWithArgument",
                    "details": {
                        "userLookupFilter": {
                            "operators": [
                              "Contains",
                              "EndsWith",
                              "StartsWith",
                              "Equal",
                              "NotEqual"
                            ]
                        }
                    }
                }, {
                    "$key": "EntityName",
                    "displayName": this.filterName,
                    "filterName": "Entity Name",
                    "propertyName": "name",
                    "$descriptor": this.filterName,
                    "filterType": "comboWithArgument",
                    "details": {
                        "userLookupFilter": {
                            "operators": [
                              "Contains",
                              "EndsWith",
                              "StartsWith",
                              "Equal",
                              "NotEqual"
                            ]
                        }
                    }
                },
               {
                   "$key": "ModifiedDate",
                   "displayName": this.filterModifiedDate,
                   "filterName": "ModifiedDate",
                   "propertyName": "$updated",
                   "$descriptor": this.filterModifiedDate,
                   "filterType": "checkedList",
                   "propertyDataTypeId": "1f08f2eb-87c8-443b-a7c2-a51f590923f5",
                   "details": {
                       "rangeFilter": {
                           "characters": 0,
                           "ranges": [
                             { "displayName": "Today", "lower": ":todaystart", "rangeName": "Today", "upper": ":todayend" },
                             { "displayName": "This Week", "lower": ":thisweekstart", "rangeName": "ThisWeek", "upper": ":thisweekend" },
                             { "displayName": "This Month", "lower": ":thismonthstart", "rangeName": "ThisMonth", "upper": ":thismonthend" },
                             { "displayName": "This Quarter", "lower": ":thisquarterstart", "rangeName": "ThisQuarter", "upper": ":thisquarterend" },
                             { "displayName": "This Year", "lower": ":thisyearstart", "rangeName": "ThisYear", "upper": ":thisyearend" },
                             { "displayName": "Last Week", "lower": ":lastweekstart", "rangeName": "LastWeek", "upper": ":lastweekend" },
                             { "displayName": "Last Month", "lower": ":lastmonthstart", "rangeName": "LastMonth", "upper": ":lastmonthend" },
                             { "displayName": "Last Quarter", "lower": ":lastquarterstart", "rangeName": "LastQuarter", "upper": ":lastquarterend" },
                             { "displayName": "Last Year", "lower": ":lastyearstart", "rangeName": "LastYear", "upper": ":lastyearend" },
                             { "displayName": "Week to Date", "lower": ":thisweekstart", "rangeName": "WeektoDate", "upper": ":todayend" },
                             { "displayName": "Month to Date", "lower": ":thismonthstart", "rangeName": "MonthtoDate", "upper": ":todayend" },
                             { "displayName": "Quarter to Date", "lower": ":thisquarterstart", "rangeName": "QtrtoDate", "upper": ":todayend" },
                             { "displayName": "Year to Date", "lower": ":thisyearstart", "rangeName": "YeartoDate", "upper": ":todayend" },
                             { "displayName": "Older", "lower": null, "rangeName": "Older", "upper": ":beforelastyearend" }
                           ]
                       }
                   }
               },
               {
                   "$key": "HasMeasure",
                   "displayName": this.filterHasMetric,
                   "filterName": "HasMeasure",
                   "propertyName": "filters.filterType",
                   "$descriptor": this.filterHasMetric,
                   "filterType": "checkedList",
                   "propertyDataTypeId": "ccc0f01d-7ba5-408e-8526-a3f942354b3a",
                   "details": {
                       "distinctFilter": {
                           "characters": 0
                       }
                   }
               },
               {
                   "$key": "HasFilter",
                   "displayName": this.filterHasFilter,
                   "filterName": "HasFilter",
                   "propertyName": "filters.filterType",
                   "$descriptor": this.filterHasFilter,
                   "filterType": "checkedList",
                   "propertyDataTypeId": "ccc0f01d-7ba5-408e-8526-a3f942354b3a",
                   "details": {
                       "distinctFilter": {
                           "characters": 0
                       }
                   }
               }
                ];
                this._onFetchComplete(cacheKey, onRequestComplete, entityNameFilter);
                //var optionsSvc = Sage.Services.getService('UserOptions');
                //this._indirectSelection = 'false';
                //if (optionsSvc && optionsSvc.get) {
                //    optionsSvc.get('FiltersDefinition', 'EntityManager', lang.hitch(this, function (data) {
                //        entityNameFilter = JSON.parse(data && data.value);
                //        this._onFetchComplete(cacheKey, onRequestComplete, entityNameFilter);
                //    }), null, this, false);
                //}
            }
        },
        onRequestDataFailure: function (response) {
        },
        _onFetchError: function () {
            this._isFetchingData = false;
        },
        _onFetchItem: function (entry) {
            var data = this._configuration._hiddenFilters || {},
            service = Sage.Services.getService("ClientGroupContext"),
            context = service && service.getContext(),
            prop = context.CurrentEntity + '_' + entry.filterName,
            hidden = false,
            type = entry.filterType,
            expanded = false,
            deferred = new Deferred(),
            deferredAdded = false;

            if (data[prop]) {
                hidden = data[prop].hidden;
                expanded = data[prop].expanded;
            }

            if (this.knownFilterTypes[type]) {
                // Load filter if nothing is in storage for it,
                // or a user set to visible.
                if (hidden === false || typeof hidden === 'undefined' || hidden === null) {
                    this.addChild(new this.knownFilterTypes[type]({
                        configurationProvider: this._configurationProvider,
                        filter: entry,
                        store: this._configuration.createStoreForFilter(entry),
                        appliedValues: this._appliedSet && this._appliedSet[entry.$key],
                        parent: this,
                        groupId: context.CurrentGroupID,
                        expanded: expanded,
                        deferred: deferred
                    }));
                    deferredAdded = true;
                }
            }
            // If no children were added, resolve the deferred,
            //  as no additional requests were made
            if (!deferredAdded) {
                deferred.resolve();
            }
            return deferred;
        },
        _onFetchComplete: function (cacheKey, onReqestCompleteCallBack, items) {
            sessionStorage.setItem(cacheKey, json.stringify(items));
            this._iterateFetchedItems(items);
            if (onReqestCompleteCallBack) {
                onReqestCompleteCallBack();
            }
        },
        _iterateFetchedItems: function (items) {
            if (!items || !items.length) {
                return;
            }

            var i, length, deferreds;
            length = items.length;
            deferreds = [];

            for (i = 0; i < length; i++) {
                deferreds[i] = this._onFetchItem(items[i]);
            }
            deferreds = new DeferredList(deferreds);
            deferreds.then(lang.hitch(this, function () {
                this._isFetchingData = false;
                this._isApplyingConfig = false;
                if (this._isFirstLoad) {
                    this._isFirstLoad = false;
                    this.requestData(function () {
                        var service = Sage.Services.getService("ClientGroupContext");
                        service.publishFiltersApplied();
                    });
                }
            }));
        }
    });

    return filterPanel;
});