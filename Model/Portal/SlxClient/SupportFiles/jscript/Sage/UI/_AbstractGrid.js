/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dijit/_Widget',
    'dojo/string',
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/dom-style',
    'dojo/_base/lang',

    'dojo/text!./templates/_AbstractGrid.html',

    'Sage/UI/Columns/DateTime',
    'Sage/UI/Columns/Boolean',
    'Sage/UI/ImageButton',
    'dojo/i18n!./nls/_AbstractGrid',
    'Sage/Data/SDataServiceRegistry',
    'Sage/UI/Dialogs',
    'Sage/_Templated',
    'Sage/Utility',
    'Sage/UI/SDataLookup',

    'dgrid/Grid',
    'dgrid/Selection',
    'dgrid/OnDemandGrid',
    'dgrid/Keyboard',
    'dojo/store/Memory',
    'dgrid/extensions/ColumnHider',
    'dgrid/editor'
],
function (
   _Widget,
    dString,
    declare,
    arrayUtil,
    dstyle,
    dojolang,

    template,

    crmDateTime,
    crmBoolean,
    crmImageButton,
    nlsResource,
    SDataServiceRegistry,
    Dialogs,
    _Templated,
    Utility,
    SDataLookup,

    dGrid,
    dSelection,
    OnDemandGrid,
    dKeyboard,
    Memory,
    dColumnHider,
    dEditor
) {
    var widget = declare('Sage.UI._AbstractGrid', [_Widget,_Templated], {
        widgetsInTemplate: true,
        dataStore: null,
        grid: false,
        columns: false,

        show_ToolBar: true,
        help_keyword: false,
        help_location: false,
        tools: [],

        widgetTemplate: new Simplate(eval(template)),
       
        constructor: function () {
            this.columns = new Memory();
        },
       
        /*Functions that Work with data:*/

        // populate the grid's data store
        loadGridData: function () {

        },

        // add single item to the grid
        addItem: function (ItemToAdd) {

        },
        // edit single item in the grid
        editItem: function (EditedItem) {

        },
        // remove single item from the grid
        removeItem: function (IdOfItemToRemove) {

        },

        saveChanges: function () { },
        cancelChanges: function () { },

        /*Functions that work with structure:*/

        // creates the grid structure. While the data is required, if the columns' array has been previously populated
        // then the columns argument is not needed. If the columns value is propvided anyways, then it will overwrite the 
        // previously popultated columns array.
        createGrid: function (data, columns) {
            if (columns) {
                this.setColumn(columns);
            }

            var grid = new (declare([OnDemandGrid, dKeyboard, dSelection, dEditor, dColumnHider]))({
                columns: this.columns,
                store: data,
                selectionMode: "single",
                allowSelectAll: false,
                cellNavigation: false
            }, this.abstractGrid_grid);

            grid.startup();
           
            this.grid = grid;
        },

        // Returns the first selected row from the grid.
        getSelectedItem: function () {
            for (var i = 0; i < this.grid.store.data.length; i++) {
                var ele = this.grid.selection[this.grid.store.data[i]['$key']];
                if (ele) {
                    return this.grid.store.data[i];
                }
            }

            alert(nlsResource.noSelectionsText);
            return null;
        },

        //create toolbar from tools variable
        createToolbar: function () {
            var roleService = Sage.Services.getService("RoleSecurityService");
            for (var i = 0; i < this.tools.length; i++) {
                var tool = this.tools[i];
                if (tool.appliedSecurity && tool.appliedSecurity !== '') {
                    if ((roleService) && (!roleService.hasAccess(tool.appliedSecurity))) {
                        continue;
                    }
                }
            var btn = false;
            if (typeof tool === 'string') {
                switch (tool) {
                    case 'add':
                        btn = new crmImageButton({
                            icon: '~/ImageResource.axd?scope=global&type=Global_Images&key=plus_16x16',
                            tooltip: this.addText,
                            id: this.id + '_addBtn',
                            onClick: dojolang.hitch(this, function () { this.addItem(); })
                        });
                        break;
                    case 'delete':
                        btn = new crmImageButton({
                            icon: '~/ImageResource.axd?scope=global&type=Global_Images&key=Delete_16x16',
                            tooltip: this.deleteText,
                            id: this.id + '_delBtn',
                            onClick: dojolang.hitch(this, function () { this.removeItem(); })
                        });
                        break;
                    case 'save':
                        btn = new crmImageButton({
                            imageClass: 'icon_Save_16x16',
                            tooltip: this.saveText,
                            id: this.id + '_saveBtn',
                            onClick: dojolang.hitch(this, function () { this.saveChanges(); })
                        });
                        break;
                    case 'cancel':
                        btn = new crmImageButton({
                            imageClass: 'icon_Reset_16x16',
                            tooltip: this.cancelText,
                            id: this.id + '_cancelBtn',
                            onClick: dojolang.hitch(this, function () { this.cancelChanges(); })
                        });
                        break;
                    case 'edit':
                        btn = new crmImageButton({
                            icon: '~/ImageResource.axd?scope=global&type=Global_Images&key=Edit_Item_16x16',
                            tooltip: this.id.search('metric') < 0 ? nlsResource.FilterGridEdit : nlsResource.MetricGridEdit,
                            onClick: dojo.partial(this.editItem, this),
                            id: this.dojoAttachPoint + this.id + '_' + this.entityName + '_editFilter'
                        });
                }
            } else {
                if ((tool.type) && (tool.type === 'Sage.UI.SDataLookup')) {
                    var conf = tool.controlConfig || tool;
                    btn = new SDataLookup(conf);
                    this.lookupControl = btn;
                } else {
                    btn = new crmImageButton({
                        icon: tool.icon || '',
                        imageClass: tool.imageClass || '',
                        id: tool.id,
                        onClick: dojolang.hitch(tool.scope || this, tool.handler),
                        tooltip: tool.alternateText || tool.tooltip
                    });
                }
            }
            if (btn) {
                this.abstractGrid_toolBar.addChild(btn);
                btn = false;
            }
        }

            this.abstractGrid_toolBar.startup();
    },


        addToolBarItem: function(item)
        {
            if (item.domNode) {
                dojo.place(item.domNode, this.abstractGrid_toolBar);
            }
            else {
                dojo.place(item, this.abstractGrid_toolBar);
            }
        },

        addColumn: function(col){
            this.columns.add(col);
        },

        setColumns: function (cols) {
            this.columns = cols;
        },

        // displays the help page when the help icon is selected
        _showHelp: function (hk,hl) {
            Utility.openHelp(hk, hl);
        },
        
        startup: function () {
            this.inherited(arguments);
        },
       
    });
    return widget;
});