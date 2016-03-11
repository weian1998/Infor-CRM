/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
        'dojo/string',
        'dijit/_Widget',
        'dijit/_TemplatedMixin',
        'dijit/_WidgetsInTemplateMixin',
        'dijit/Dialog',
        'dijit/form/Button',
        'dijit/form/CheckBox',
        'dojo/_base/declare',
        'dojo/i18n',
        'dojo/_base/array',
        'dojo/_base/lang',
        'dojo/dom-construct',
        'dijit/registry',
        'Sage/UI/Controls/_DialogHelpIconMixin',
        'Sage/Utility/Filters',
        'dojo/json',
        'dojo/text!./templates/EditFilters.html',
        'dojo/i18n!./nls/EditFilters',
        'Sage/Services/UserOptions'
], function (
        dString,
        _Widget,
        _TemplatedMixin,
        _WidgetsInTemplateMixin,
        Dialog,
        Button,
        CheckBox,
        declare,
        i18n,
        array,
        lang,
        domConstruct,
        registry,
        DialogHelpIconMixin,
        FiltersUtility,
        json,
        template) {
    return declare('Sage.UI.Filters.EntityManagerEditFilters', [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        widgetsInTemplate: true,

        id: 'editFilters',
        store: null,
        filterPanel: null,
        checkBoxes: null,

        // i18n
        selectAllText: 'Select All',
        dialogTitle: 'Edit Filters',
        okText: 'OK',
        cancelText: 'Cancel',

        constructor: function () {
            var resource = i18n.getLocalization('Sage.UI.Filters', 'EditFilters');
            this.inherited(arguments);
            this.checkBoxes = [];

            if (resource) {
                this.selectAllText = resource.selectAllText;
                this.okText = resource.okText;
                this.cancelText = resource.cancelText;
                this.dialogTitle = resource.dialogTitle;
            }
        },
        postCreate: function () {
            this.inherited(arguments);
            this.checkAll.on('click', lang.hitch(this, this._onCheckAllClick));
        },
        _onCheckAllClick: function () {
            if (this.checkAll.checked) {
                this._onSelectAllClick();
            } else {
                this._onClearAllClick();
            }
        },
        showDialog: function () {
            this.requestData();
            lang.mixin(this.dialogNode, new DialogHelpIconMixin());
            this.dialogNode.createHelpIconByTopic('editFilters');
            this.dialogNode.show();
        },
        hideDialog: function () {
            this.dialogNode.hide();
        },
        uninitialize: function () {
            this._destroyContent();
            this.checkAll.destroy(false);
            this.buttonCancel.destroy(false);
            this.buttonOK.destroy(false);
            this.dialogNode.destroy(false);
            this.checkBoxes = null;

            this.inherited(arguments);
        },
        requestData: function () {
            this._destroyContent();

            var cacheKey, service, context, cacheData, data;

            service = Sage.Services.getService("ClientGroupContext");
            context = service && service.getContext();
            cacheKey = dString.substitute("METADATA_FILTERS_${0}_${1}", [context.CurrentEntity, context.CurrentGroupID]);

            cacheData = sessionStorage.getItem(cacheKey);
            if (cacheData) {
                data = json.parse(cacheData);
                for (var i = 0; i < data.length; i++) {
                    this._onFetchItem(data[i]);
                }
            } else {
                var entityNameFilter = [{
                    "$key": "DisplayName",
                    "displayName": "Display Name",
                    "filterName": "Display Name",
                    "propertyName": "$descriptor",
                    "$descriptor": "Display Name",
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
                    "displayName": "Name",
                    "filterName": "Entity Name",
                    "propertyName": "name",
                    "$descriptor": "Name",
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
                   "displayName": "Modified Date",
                   "filterName": "ModifiedDate",
                   "propertyName": "$updated",
                   "$descriptor": "Modified Date",
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
                   "displayName": "Measure",
                   "filterName": "HasMeasure",
                   "propertyName": "filters.filterType",
                   "$descriptor": "Has Metric",
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
                   "displayName": "Filter",
                   "filterName": "HasFilter",
                   "propertyName": "filters.filterType",
                   "$descriptor": "Has Filter",
                   "filterType": "checkedList",
                   "propertyDataTypeId": "ccc0f01d-7ba5-408e-8526-a3f942354b3a",
                   "details": {
                       "distinctFilter": {
                           "characters": 0
                       }
                   }
               }
                ];
                sessionStorage.setItem(cacheKey, json.stringify(entityNameFilter));
                
                //var optionsSvc = Sage.Services.getService('UserOptions');
                //this._indirectSelection = 'false';
                //if (optionsSvc && optionsSvc.get) {
                //    optionsSvc.get('FiltersDefinition', 'EntityManager', lang.hitch(this, function (data) {
                //        entityNameFilter = JSON.parse(data && data.value);
                //        for (var i = 0; i < entityNameFilter.length; i++) {
                //            this._onFetchItem(entityNameFilter[i]);
                //        }
                //        sessionStorage.setItem(cacheKey, json.stringify(entityNameFilter));
                //        this._onFetchComplete();
                //    }), null, this, false);
                //}
            }
            this._onFetchComplete();
        },
        _onClearAllClick: function () {
            array.forEach(this.checkBoxes, function (checkBox) {
                checkBox.set('checked', false);
            });
        },
        _onSelectAllClick: function () {
            array.forEach(this.checkBoxes, function (checkBox) {
                checkBox.set('checked', true);
            });
        },
        _onCancelClick: function () {
            this.dialogNode.hide();
        },
        _onOKClick: function () {
            this.dialogNode.hide();

            var data = this.filterPanel._configuration._hiddenFilters,
                key = this.filterPanel._configuration._hiddenFiltersKey,
                service = Sage.Services.getService("ClientGroupContext"),
                context = service && service.getContext();

            array.forEach(this.checkBoxes, function (checkBox) {
                var prop;

                prop = context.CurrentEntity + '_' + checkBox.get('label');
                if (data[prop]) {
                    // Update existing
                    data[prop].hidden = !checkBox.get('checked');
                } else {
                    // Create new
                    data[prop] = {
                        expanded: false,
                        hidden: !checkBox.get('checked'),
                        items: []
                    };
                }
            });

            FiltersUtility.setHiddenFilters(key, json.stringify(data));
            this.filterPanel.refreshFilters(false);
        },
        _destroyContent: function () {
            if (!this.contentNode) {
                return;
            }
            array.forEach(registry.findWidgets(this.contentNode), function (widget) {
                widget.destroy(false);
            });

            this.checkBoxes = [];
            this.contentNode.innerHTML = '';
        },
        _onFetchError: function () {
        },
        _onFetchItem: function (entry) {
            var type = entry.filterType,
                filterName = entry.filterName,
                displayName = entry.displayName || entry.filterName,
                id = filterName + '_check',
                checkBox = new CheckBox({ 'id': id, 'label': filterName });// CheckBox label appears to be broken..

            domConstruct.place(checkBox.domNode, this.contentNode, 'last');
            domConstruct.create('br', {}, checkBox.domNode, 'after');
            domConstruct.create('label', { 'for': id, innerHTML: displayName }, checkBox.domNode, 'after');
            checkBox.on('click', lang.hitch(this, this._onCheckClick));
            this.checkBoxes.push(checkBox);
        },
        _onCheckClick: function (e) {
            if (e.target && e.target.checked === false) {
                this.checkAll.set('checked', false);
            }
        },
        _onFetchComplete: function () {
            this.startup();
            this.setupCheckState();
        },
        setupCheckState: function () {
            var data = this.filterPanel._configuration._hiddenFilters || {},
                key = FiltersUtility.getHiddenFiltersKey(),
                service = Sage.Services.getService("ClientGroupContext"),
                context = service && service.getContext(),
                hasHiddenItems = false;

            this.checkAll.set('checked', true);
            this._onSelectAllClick();

            array.forEach(this.checkBoxes, function (checkBox) {
                var prop;

                prop = context.CurrentEntity + '_' + checkBox.get('label');
                if (data[prop]) {
                    if (data[prop].hidden) {
                        checkBox.set('checked', false);
                        hasHiddenItems = true;
                    } else {
                        checkBox.set('checked', true);
                    }
                }
            });

            this.checkAll.set('checked', !hasHiddenItems);
        }
    });
});