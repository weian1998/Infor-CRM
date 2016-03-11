/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/MainView/EntityMgr/AddEditEntityFilter/_DetailsAddEditDialogBase',
    'dojo/_base/declare',
    'dojo/text!./templates/RangeDetailsView.html',
    'dojo/i18n!./nls/AddEditFiltersDialog',
    'dgrid/Grid',
    'dgrid/Selection',
    'dgrid/OnDemandGrid',
    'dgrid/Keyboard',
    'dojo/store/Memory',
    'dgrid/extensions/ColumnHider',
    'dgrid/editor',
    "dgrid/selector",
    'Sage/UI/Controls/TextBox',
    'Sage/UI/ImageButton',
    "dojo/dom-class",
    'Sage/MainView/EntityMgr/AddEditEntityFilter/DistinctDetailsView'
],
function (
    _DetailsAddEditDialogBase,
    declare,
    template,
    nlsResources,
    dGrid,
    selection,
    onDemandGrid,
    keyboard,
    memory,
    columnHider,
    editor,
    selector,
    crmTextBox,
    crmImageButton,
    domClass,
    distinct
) {
    var widget = declare('Sage.MainView.EntityMgr.AddEditEntityFilter.RangeDetailsView', [_DetailsAddEditDialogBase], {

        widgetTemplate: new Simplate(eval(template)),
        _nlsResources: nlsResources,
        widgetsInTemplate: true,

        character: false,
        rangeGridsObj: false,

        lastSelectedRange: false,

        addBtnId: 'rangeGrid_addBtn',
        rmvBtnId: 'rangeGrid_removeBtn',

        tmpRwId: 0,

        constructor: function (obj) {
            this.hasProperties = true;
            this.isMetric = false;
            if (dijit.byId(this.addBtnId)) {
                dijit.byId(this.addBtnId).destroy();
            }
            if (dijit.byId(this.rmvBtnId)) {
                dijit.byId(this.rmvBtnId).destroy();
            }
        },

        postCreate: function () {
            this.labelSection.innerHTML = this._nlsResources.lblRange;
            this._createCharacter();
            this._createToolbar();
            this._createRangeGrid();

            this.startup();
        },
        _createToolbar: function () {
            var add = new crmImageButton({
                icon: '~/ImageResource.axd?scope=global&type=Global_Images&key=plus_16x16',
                tooltip: this._nlsResources.lblAdd,
                onClick: dojo.partial(this._addItemToGrid, this),
                id: this.addBtnId
            });
            dojo.place(add.domNode, this.rangeGridToolbarContainer, '1');

            var remove = new crmImageButton({
                icon: '~/ImageResource.axd?scope=global&type=Global_Images&key=Delete_16x16',
                tooltip: this._nlsResources.lblRemove,
                onClick: dojo.partial(this._removeItemFromGrid, this),
                id: this.rmvBtnId
            });
            dojo.place(remove.domNode, this.rangeGridToolbarContainer, '2');
        },
        _addItemToGrid: function (context) {

            context.rangeGridsObj.store.add(
                {
                    rangeId: context.tmpRwId,
                    rangeName: '',
                    upper: '',
                    lower: '',
                    displayName: null,
                    customSQL: null
                });
            context.tmpRwId++;
            context.rangeGridsObj.refresh();
            context.setGridCount(context);
        },
        _removeItemFromGrid: function (context) {
            if (typeof (context.rangeGridsObj.selection) === 'undefined') {
                context.Dialog.showWarning(context._nlsResources.SelectAnItem, "Infor CRM");
                return;
            }
            var somethingRemoved = false;
            for (var i = 0; i < context.rangeGridsObj.store.data.length; i++) {

                var container = context.rangeGridsObj.store.data[i];

                var deleted = false;
                var id;
                var selectedItem;
                if (typeof (container.id) !== 'undefined') {
                    id = container.id;
                    selectedItem = context.rangeGridsObj.selection[id];
                    if (typeof (selectedItem) !== 'undefined') {
                        if (context.rangeGridsObj.store.remove(id)) {
                            somethingRemoved = true;
                            console.log(id + ': was removed');
                            i--;//reset to the previous index sinve we are removing an item
                            deleted = true;
                        }
                    }
                }

                if (!deleted && typeof (container.rangeId) !== 'undefined') {
                    id = container.rangeId;
                    selectedItem = context.rangeGridsObj.selection[id];
                    if (typeof (selectedItem) !== 'undefined') {
                        if (context.rangeGridsObj.store.remove(id)) {
                            somethingRemoved = true;
                            console.log(id + ': was removed');
                            i--;//reset to the previous index sinve we are removing an item
                        }
                    }
                }
            }
            if (somethingRemoved) {
                context.rangeGridsObj.refresh();
            }
            else {
                context.Dialog.showWarning(context._nlsResources.SelectAnItem, "Infor CRM");
            }
            context.setGridCount(context);
        },
        _createRangeGrid: function () {
            var dataStore = dojo.data.ObjectStore(dojo.store.Memory({ data: [] }));
            if (this.details && this.details.rangeFilter && this.details.rangeFilter.ranges) {
                dataStore = dojo.data.ObjectStore(dojo.store.Memory({ idProperty: 'rangeId', data: this.details.rangeFilter.ranges }));
            }

            var cols = this.filterUtility.rangeFilterGridCol.data.sort(function (a, b) {
                var nameA = a['id'],
                    nameB = b['id'];

                return (nameA < nameB)
                    ? -1
                    : (nameA > nameB)
                        ? 1
                        : 0;
            });
            var grid = new (declare([onDemandGrid, keyboard, selection, editor, columnHider]))({
                columns: cols,
                store: dataStore,
                selectionMode: 'extended',
                allowSelectAll: false,
                cellNavigation: false,
                fetchProperties: { sort: [{ attribute: "AArangeName", descending: false }] }
            }, this.rangeGridContainer); // attach to a DOM id

            grid.startup();
            var content = this;
            window.setTimeout(function () { // after everything is set
                var obj = dojo.query("div.dgrid-header.dgrid-header-row", grid.domNode);
                var num = grid._columns[0].headerNode.parentNode.clientHeight; // if we cannot get the dgrid header row, then us the header cell's parent's information.
                if (typeof (obj) !== 'undefined' && typeof (obj[0]) !== 'undefined' && typeof (obj[0].clientHeight) !== 'undefined')
                {
                    num = obj[0].clientHeight;
                }

                dojo.query("div.dgrid-scroller", grid.domNode).style("margin-top", num + "px"); // fix for dgrid overlapping first row with column headers.

                content.filterUtility.fixToolbarIcons(content.rangeGridToolbarContainer);

                grid.startup();
            });
            
            this.rangeGridsObj = grid;

            this.setGridCount(this);
        },
        _createCharacter: function () {
            this.character = new distinct(
            {
                embedded: true,
                isMetric: false,
                hasProperty: this.hasProperty,
                details: this.details,
                filterUtility: this.filterUtility
            });
            dojo.place(this.character.domNode, this.characterContainer, 'only');
        },
        /**
        * This is a last method in the initialization process. 
        * It is called after all the child widgets are rendered so it's good for a container widget to finish it's post rendering here. 
        * This is where the container widgets could for example set sizes of their children relative to it's own size.
        */
        startup: function () {
            this.inherited(arguments);
        },
        getDetails: function () {
            var rangeFilter = {
                rangeFilter: {
                    characters: this.character.getDetails(true),
                    ranges: []
                }
            };
            var store = this.rangeGridsObj.store.data;
            for (var i = 0; i < store.length; i++) {
                var range = {
                    range: store[i]
                };
                range.range.rangeId = this._stripoutNonRangeIds(range);
                rangeFilter.rangeFilter.ranges.push(range.range);
            }



            return rangeFilter;
        },
        setGridCount: function(context) {
            if (context.recordCountLabel) {
                context.recordCountLabel.innerHTML = dojo.string.substitute(context._nlsResources.totalRecordCountLabel, [context.rangeGridsObj.store.data.length]);
            }
        },
        _stripoutNonRangeIds: function (obj) {
            // an id in this instance is 5 "chunks" of alphanumerics separated by a hyphen/dash.
            var idRegex = "[A-Z|0-9|a-z]+[-][A-Z|0-9|a-z]+[-][A-Z|0-9|a-z]+[-][A-Z|0-9|a-z]+[-][A-Z|0-9|a-z]+";
            var matches = idRegex.match(obj.range.rangeId, 'g');
            if (matches) {
                if (dojo.isArray(matches)) {
                    if (matches[0].length == obj.range.rangeId.length) {
                        return obj.range.rangeId;
                    }
                }
            }
            return "";
        },
        isValid: function () {
            var list = dojo.query("td.dgrid-cell.dgrid-cell-padding.dgrid-column-AArangeName", this.rangeGridsObj.bodyNode);
            var Lowerlist = dojo.query("td.dgrid-cell.dgrid-cell-padding.dgrid-column-lower", this.rangeGridsObj.bodyNode);
            var Upperlist = dojo.query("td.dgrid-cell.dgrid-cell-padding.dgrid-column-upper", this.rangeGridsObj.bodyNode);

            var subSection = this.character.isValid();

            var bool = true;
            for (var i = 0; i < list.length; i++) {
                list[i].widget.isValid(true);
                list[i].widget.onChanged();

                var validWid = list[i].widget.state !== 'Error' && !(list[i].widget.state === 'Incomplete' && list[i].widget.required);

                if (!validWid) {
                    list[i].widget.set('state', 'Error');
                }

                if (Lowerlist[i].widget.value > Upperlist[i].widget.value) {

                    Lowerlist[i].widget.set('message', this._nlsResources.LowerMustBeLessThanUpper);
                    Upperlist[i].widget.set('message', this._nlsResources.LowerMustBeLessThanUpper);

                    Lowerlist[i].widget.set('state', 'Error');
                    Upperlist[i].widget.set('state', 'Error');
                    validWid = false;
                }

                bool = bool && validWid;
            }
            return bool && subSection;
        }
    });
    return widget;
});