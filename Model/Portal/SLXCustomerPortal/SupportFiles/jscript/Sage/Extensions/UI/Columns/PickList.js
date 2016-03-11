/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/_base/declare',
    "dijit/form/ComboBox",
     "Sage/UI/Controls/PickList",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/dom-attr",
    "dojo/data/ItemFileReadStore"
],
function (declare, ComboBox,PickList, array, lang, domAttr, ItemFileReadStore) {
    var ExtComboBox = declare("Sage.Extensions.UI.Columns.PickList", dojox.grid.cells._Widget, {
        widgetClass: ComboBox,
        storeData: null,
        pickList: null,
        storageMode: 'id', //Default for column picklist
        displayMode: 'AsText', //Default for column picklist formatting
        constructor: function (args) {
            this.inherited(arguments);
            if (this.storageMode === 'id' && this.displayMode === 'AsText') {
                if (this.pickListName && this.storeData === null) {
                    this._loadPickList();
                }
            }
        },
        getWidgetProps: function (inDatum) {
            var items = [];
            array.forEach(this.options, function (o) {
                items.push({ name: o, value: o });
            });
            var store = new ItemFileReadStore({ data: this.storeData });
           // var store = new ItemFileReadStore({ data: { identifier: "name", items: items } });
            return lang.mixin({}, this.widgetProps || {}, {
                value: inDatum,
                store: store
            });
        },
        formatter: function (val, index) {
           // if (this.storageMode === 'id') {
           //     val = this.getStoreTextById(val);
           // }
            return val;
        },
        getStoreTextById: function (val) {
            var result = val;
            if (this.storeData) {
                //If the value is not found as an id in the list, return the value back.
                dojo.forEach(this.storeData.items, function (item, index, array) {
                    console.log(item.id + ' === ' + val);
                    if (item.id === val) {
                        result = item.name;
                    }
                }, this);
            }

            return result;
        },
        getValue: function () {
            var e = this.widget;
            // make sure to apply the displayed value
            e.set('displayedValue', e.get('displayedValue'));
            return e.get('value');
        },
        _loadPickList: function () {
            var deferred = new dojo.Deferred();
            var config = {
                pickListName: this.pickListName, // Required
                // storeOptions: {}, // Optional
                // dataStore: {}, // Optional
                canEditText: false,
                itemMustExist: true,
                maxLength: -1,
                storeMode: this.storageMode, // text, id, code
                sort: false,
                displayMode: this.displayMode
            };
            this.pickList = new PickList(config);
            this.pickList.getPickListData(deferred);
            deferred.then(dojo.hitch(this, this._loadData), function (e) {
                console.error(e); // errback
            });

        },
        _loadData: function (data) {
            var items = [];
            for (var i = 0; i < data.items.$resources.length; i++) {
                var item = data.items.$resources[i];
                items.push({
                    id: item.$key,
                    value: item.code,
                    name: item.text
                });
            }
            this.storeData = {
                identifier: 'id',
                label: 'text',
                items: items
            };
        }
    });
    ExtComboBox.markupFactory = function (node, cell) {
        dojox.grid.cells._Widget.markupFactory(node, cell);
        var options = lang.trim(domAttr.get(node, "options") || "");
        if (options) {
            var o = options.split(',');
            if (o[0] != options) {
                cell.options = o;
            }
        }
    };

    return ExtComboBox;
});
