/// <reference path="ConditionManager.js" />
/// <reference path="ConditionManager.js" />
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'Sage/UI/TransferBoxWidgetEnumerations',
    'dijit/_Widget',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dgrid/OnDemandList',
    'dgrid/Selection',
    'dgrid/Keyboard',
    "dojo/dom-construct",
    'dojo/text!./templates/TransferBoxWidget.html',
    'dojo/i18n!./nls/TransferBoxWidget',
    'dojo/dom-style',
    'put-selector/put'
],
function (declare, dojoArray, enumerations, _Widget, _TemplatedMixin, _WidgetsInTemplateMixin, OnDemandList, Selection,
    Keyboard, domConstruct, transferBoxTemplate, transferBoxStrings, domStyle, put) {
    var transferBoxWidget = declare('Sage.UI.TransferBoxWidget', [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: transferBoxTemplate,
        "class": 'transferBoxWidget',
        widgetsInTemplate: true,
        sortAttribute: '',
        sortDescending: false,
        allowFiltering: true,
        allowClearAll: true,
        useFilterTypeAhead: true, //when this option is select the filter button is hidden
        selectionMode: enumerations.SelectionMode.Extended,
        hideTransferBoxOnSingleSelectMode: true,
        postMixInProperties: function () {
            dojo.mixin(this, transferBoxStrings);
        },
        postCreate: function () {
            this.inherited(arguments);
            this._setVisibilityState();
            this._declareLists();
        },
        addSelectedItem: function (id) {
            var row = this.from.row(id);
            if (row.data) {
                row.data.__selected = true;
                this.store.put(row.data);
            }
            else {
                console.log("row not found");
            }
        },
        addNewItem: function (item, validate) {
            var bFound = false;
            if (!item.id) {
                item.id = this._generateUniqueId();
            }
            if (validate) {
                var self = this;
                //make sure this item has already been added at one point or another then removed
                this.store.query({ id: item.id }).forEach(function (item) {
                    bFound = true;
                    if (!item.__selected) {
                        item.__selected = true;
                        self.store.put(item);
                    }
                    return;
                });
            }
            if (!bFound) {
                this.store.add(item);
                if (item.__selected) {
                    this.addSelectedItem(item.id);
                }
            }
        },
        getSelectedValues: function () {
            var selections = [];
            this.store.query({ __selected: true }).forEach(function (item) {
                selections.push(item);
            });
            return selections;
        },
        _setVisibilityState: function () {
            this.addButton.set('disabled', true);
            this.removeButton.set('disabled', true);
            if (!this.allowFiltering) {
                dojo.addClass(this.searchFilterDiv, 'display-none');
            } else {
                if (this.useFilterTypeAhead) {
                    dojo.connect(this.searchFilter.focusNode, 'onkeyup', this, '_onKeyUp', true);
                    domStyle.set(this.filterButton.domNode, 'display', 'none');
                }
            }
            if (this.hideTransferBoxOnSingleSelectMode && this.selectionMode === enumerations.SelectionMode.Single) {
                dojo.addClass(this.transferButtons, 'display-none');
                dojo.addClass(this.toNode, 'display-none');
                dojo.addClass(this.availableValues, 'display-none');
                dojo.addClass(this.selectedValues, 'display-none');
                this.colFromNode.setAttribute('colspan', '3');
            }

            if (!this.allowClearAll) {
                domStyle.set(this.removeAllButton.domNode, 'display', 'none');
            }
        },
        _declareLists: function () {
            var tbList = declare([OnDemandList, Selection, Keyboard]);
            var from = this.from = new tbList({
                store: this.store,
                query: function (item) {
                    return !item.__selected;
                },
                //queryOptions: {
                //    sort: [{ attribute: this.sortAttribute }]
                //},
                sort: [{ attribute: this.sortAttribute, descending: this.sortDescending }],
                selectionMode: this.selectionMode,
                //keepScrollPosition: true,
                loadingMessage: this.loadingText,
                noDataMessage: this.noResultsText,
                renderRow: this._renderItem,
            }, this.fromNode);

            this.from.startup();
            //this.from.set("sort", [{ attribute: this.sortAttribute, descending: this.sortDescending }]);
            this._selectionToDisable(from, this.addButton);

            var to = this.to = new tbList({
                store: this.store,
                query: function (item) {
                    return item.__selected;
                },
                sort: [{ attribute: this.sortAttribute, descending: this.sortDescending }],
                renderRow: this._renderItem
            }, this.toNode);
            this._selectionToDisable(to, this.removeButton);
        },
        _renderItem: function (item) {
            return put("div", item.displayValue ? item.displayValue : "");
        },
        _selectionToDisable: function (list, button) {
            var selected = 0;
            list.on("dgrid-select", function (e) {
                selected += e.rows.length;
                button.set("disabled", !selected);
            });
            list.on("dgrid-deselect", function (e) {
                selected -= e.rows.length;
                button.set("disabled", !selected);
            });
        },
        _onFilterClick: function () {
            this.from.set('query', {
                //similar to contains condition case insensitive search
                displayValue: new RegExp(this.prepForRegex(), "i"),
                __selected: false
            });
        },
        _onKeyUp: function () {
            this._onFilterClick();
        },
        _onAddClick: function () {
            for (var id in this.from.selection) {
                this.addSelectedItem(id);
            }
        },
        _onAddAllClick: function () {
            var self = this;
            this.store.query({ displayValue: new RegExp(this.prepForRegex(), "i") }).forEach(function (item) {
                item.__selected = true;
                self.store.put(item);
            });
        },
        _onRemoveClick: function () {
            for (var id in this.to.selection) {
                var row = this.to.row(id);
                if (row.data && row.data.__selected) {
                    row.data.__selected = false;
                    this.store.put(row.data);
                }
            }
        },
        _onRemoveAllClick: function () {
            var self = this;
            this.store.query({ __selected: true }).forEach(function (item) {
                item.__selected = false;
                self.store.put(item);
            });
        },
        _generateUniqueId: function () {
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
            });
            return uuid;
        },
        prepForRegex: function () {
            var strValue = this.searchFilter.get("value");
            //clean up searchfilter input to allow for regex special characters to be searched for as regular characters
            strValue = strValue.replace(new RegExp("%|\\[|[*]|_|[.]|[(]|[)]|[^]|[$]|[\\]|[?]|[+]|[|]", "g"), "\\$&");
            return strValue;
        }
    });
    return transferBoxWidget;
});
