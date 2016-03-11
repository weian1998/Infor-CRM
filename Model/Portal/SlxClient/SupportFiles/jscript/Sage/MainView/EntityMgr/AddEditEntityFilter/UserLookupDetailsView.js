/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/MainView/EntityMgr/AddEditEntityFilter/_DetailsAddEditDialogBase',
    'dojo/_base/declare',
    'dojo/text!./templates/UserLookupDetailsView.html',
    'dojo/i18n!./nls/AddEditFiltersDialog',
    'dgrid/Grid',
    'dgrid/Selection',
    'dgrid/OnDemandGrid',
    'dgrid/Keyboard',
    'dojo/store/Memory',
    'dgrid/extensions/ColumnHider',
    'dgrid/editor',
    'Sage/UI/Controls/CheckBox'
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
    crmCheckBox
) {
    var widget = declare('Sage.MainView.EntityMgr.AddEditEntityFilter.UserLookupDetailsView', [_DetailsAddEditDialogBase], {

        widgetTemplate: new Simplate(eval(template)),
        _nlsResources: nlsResources,

        constructor: function () {
            this.hasProperties = true;
            this.isMetric = false;
        },

        postCreate: function () {
            this.labelSection.innerHTML = this._nlsResources.lblOperators;
            this._createOperationsGrid();
            this.startup();
        },
        _createCustomCheckBox: function () {
            var custCheckBox = declare("Sage.MainView.EntityMgr.AddEditEntityFilter.customChkBx", Sage.UI.Controls.CheckBox, {
                shouldPublishMarkDirty: false,
                constructor: function () {
                },
                postCreate: function () {
                    if (this.hotKey !== '') {
                        this.focusNode.accessKey = this.hotKey;
                    }

                    this.connect(this, 'onChange', this.onChanged);

                },
            });
            return custCheckBox;
        },
        _createDataForList: function () {
            var list = this.filterUtility.operation.data;
            var datastore = new memory();

            for (var i = 0; i < list.length; i++) {
                var isChecked = false;
                if (this.details && this.details.userLookupFilter && this.details.userLookupFilter.operators && list[i].id) {
                    isChecked = this.details.userLookupFilter.operators.indexOf(list[i].id) >= 0;
                }
                datastore.add({ id: list[i].id, data: isChecked, label: list[i].name });
            }
            return datastore;
        },
        _createOperationsGrid: function () {

            var datastore = this._createDataForList();

            var grid = new (declare([onDemandGrid, keyboard, selection, editor]))({
                columns: [editor({
                    label: "",
                    field: "data",
                    autoSave: true,
                    editable: true,
                    id: "col1",

                }, this._createCustomCheckBox()),
                {
                    label: "",
                    field: "label",
                    autoSave: true,
                    editable: false,
                    id: "col2",
                }
                ],
                showHeader: false,
                store: datastore,
                selectionMode: 'extended',
                allowSelectAll: true,
                cellNavigation: false
            }, this.operatorsListContainer); // attach to a DOM id

            this.Query("div.dgrid-scroller", grid.domNode).style("overflow-y", "auto"); // fix for dgrid overlapping first row with column headers.

            this.rangeGridsObj = grid;
            var self = this;
            grid.startup();
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
            var list = this.rangeGridsObj.store.data;
            var datasource = [];
            for (var i = 0; i < list.length; i++) {
                if (list[i].data) {
                    datasource.push(list[i].id);
                }
            }
            return { userLookupFilter: { operators: datasource } };
        }
    });
    return widget;
});