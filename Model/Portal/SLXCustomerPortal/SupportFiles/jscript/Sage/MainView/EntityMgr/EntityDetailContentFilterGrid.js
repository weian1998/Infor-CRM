/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dijit/_Widget',
    'Sage/_Templated',
    'Sage/UI/EditableGrid',
    'Sage/Utility',
    'dojo/string',
    'dojo/_base/declare',
    'dojo/text!./templates/DetailTabContentGrid.html',
    'Sage/UI/Columns/DateTime',
    'Sage/UI/Columns/Boolean',
    'dojo/i18n!./nls/_BaseEntityDetailContent',
    'dojo/dom-style',
    'Sage/MainView/EntityMgr/AddEditEntityFilter/AddEditFiltersDialog',
    'dgrid/Grid',
    'dgrid/Selection',
    'dgrid/OnDemandGrid',
    'dgrid/Keyboard',
    'dojo/store/Memory',
    'dgrid/extensions/ColumnHider',
    'dgrid/editor',
    'Sage/UI/ImageButton',
    'Sage/Data/SDataServiceRegistry',
    "dojo/_base/array",
    'Sage/UI/Dialogs',
    'dojo/dom-class'
],
function (
    _Widget,
    _Templated,
    editableGrid,
    utility,
    dString,
    declare,
    template,
    crmDateTime,
    crmBoolean,
    nlsResource,
    dojoStyle,
    addEditDialog,
    dGrid,
    selection,
    onDemandGrid,
    keyboard,
    memory,
    columnHider,
    editor,
    crmImageButton,
    SDataServiceRegistry,
    arrayUtil,
    Dialogs,
    domClass
) {
    var widget = declare('Sage.MainView.EntityMgr.EntityDetailContentFilterGrid', [_Widget, _Templated], {
        _dataRequested: false,
        widgetsInTemplate: true,
        isOpen: false,
        entityName: '',
        grid: null,
        dataStore: null,
        widgetTemplate: new Simplate(eval(template)),
        service: null,
        filterUtility: null,
        content: false,
        _where: false,
        containerid: false,
        entityDisplayName: false,

        constructor: function (obj) {
            this.service = Sage.Data.SDataServiceRegistry.getSDataService('metadata', false, true, false); // prevent caching of the grids


            //destroy
            if (obj && obj.id) {
                this.containerid = obj.id;

                if (dijit.byId(obj.id)) {
                    if (dijit.byId(obj.id).destroy) {
                        dijit.byId(obj.id).destroy(true);
                    }
                }
            }
        },
        setUtility: function (fUtility) {
            this.filterUtility = fUtility;
        },
        onOpen: function (tabId, contentName, entity) {
            this.isOpen = true;
            this.entityName = entity.name;
            this.entityDisplayName = entity.$descriptor;

            this._createToolbar();
            this._createDetailsGrid();
        },

        // when working with the grid actions this gets the currently highlighted row in the grid.
        getSelectedItem: function () {
            for (var i = 0; i < this.grid.store.data.length; i++) {
                var ele = this.grid.selection[this.grid.store.data[i]['$key']];
                if (ele) {
                    return this.grid.store.data[i];
                }
            }

            Dialogs.showWarning(nlsResource.lblWarning, "Infor CRM");
            return null;
        },

        _createToolbar: function () {
            var toolbarAvailable = false;
            if (dojo.byId(this.dojoAttachPoint + this.id + '_' + this.entityName + '_helpFilter')) {
                toolbarAvailable = true;
            }
            if (toolbarAvailable === false)
            {
                var svc = Sage.Services.getService('RoleSecurityService');

                var toolsOptions = [], option;
                if (svc) {
                    if (svc.hasAccess('Administration/EntityManager/Filters/Add')) {
                        var add = new crmImageButton({
                            icon: '~/ImageResource.axd?scope=global&type=Global_Images&key=plus_16x16',
                            tooltip: this.id.search('metric') < 0 ? nlsResource.FilterGridAdd : nlsResource.MetricGridAdd,
                            onClick: dojo.partial(this.addFilter, this),
                            id: this.dojoAttachPoint + this.id + '_' + this.entityName + '_addFilter',
                            scope: this
                        });
                        dojo.place(add.domNode, this.filterGridToolbarContainer, '1');
                    }
                    if (svc.hasAccess('Administration/EntityManager/Filters/Edit')) {
                        toolsOptions.push(option);
                        var edit = new crmImageButton({
                            icon: '~/ImageResource.axd?scope=global&type=Global_Images&key=Edit_Item_16x16',
                            tooltip: this.id.search('metric') < 0 ? nlsResource.FilterGridEdit : nlsResource.MetricGridEdit,
                            onClick: dojo.partial(this.editFilter, this),
                            id: this.dojoAttachPoint + this.id + '_' + this.entityName + '_editFilter',
                            scope: this
                        });
                        dojo.place(edit.domNode, this.filterGridToolbarContainer, '1');
                    }
                    if (svc.hasAccess('Administration/EntityManager/Filters/Delete')) {
                        var remove = new crmImageButton({
                            icon: '~/ImageResource.axd?scope=global&type=Global_Images&key=Delete_16x16',
                            tooltip: this.id.search('metric') < 0 ? nlsResource.FilterGridRemove : nlsResource.MetricGridRemove,
                            onClick: dojo.partial(this.removeFilter, this),
                            id: this.dojoAttachPoint + this.id + '_' + this.entityName + '_removeFilter',
                        });
                        dojo.place(remove.domNode, this.filterGridToolbarContainer, '1');
                    }
                }

                var help = new crmImageButton({
                    icon: '~/ImageResource.axd?scope=global&type=Global_Images&key=Help_16x16',
                    tooltip: nlsResource.GridHelp,
                    onClick: this._showHelp,
                    id: this.dojoAttachPoint + this.id + '_' + this.entityName + '_helpFilter',
                });
                dojo.place(help.domNode, this.filterGridToolbarContainer, '1');

                this.filterGridToolbarContainerLabel.innerHTML = (this.id.search('metric') < 0 ? nlsResource.filtersFor : nlsResource.metricsFor) + " " + this.entityDisplayName;
            }
        },

        _createDetailsGrid: function (refresh, context) {
            var self = context || this;
            var request = new Sage.SData.Client.SDataResourcePropertyRequest(self.service)
               .setResourceKind('entities(' + "'" + self.entityName + "'" + ')/filters')
                .setQueryArg("_expandSpecialRanges", "false")
               .setQueryArg('where', dojo.string.substitute('${0}', [self._where]))
               .setQueryArg('select', '$key,filterName,displayName,propertyName,filterType,analyticsAvailable,$updated,details')
               .setQueryArg('format', 'json').setQueryArg('Count', '200');

            request.readFeed({
                success: function (response) {
                    if (refresh) {
                        self.grid.set('store', dojo.data.ObjectStore(dojo.store.Memory({ idProperty: '$key', data: response.$resources })));
                    }
                    else {
                        self._loadDetailsGrid(dojo.data.ObjectStore(dojo.store.Memory({ idProperty: '$key', data: response.$resources })));
                    }
                },
                error: function (error) {
                    if (error) {
                        console.error(error);
                    }
                },
                scope: this,
                async: true
            });
        },
        _createCustomchkBox: function () {
            var custText = declare("Sage.MainView.EntityMgr.AddEditEntityFilter.chkBox", Sage.UI.Controls.CheckBox, {
                shouldPublishMarkDirty: false,
                readonly: true,
                disabled: true,
                constructor: function () {
                },
                postCreate: function () {
                    if (this.hotKey !== '') {
                        this.focusNode.accessKey = this.hotKey;
                    }

                    this.connect(this, 'onChange', this.onChanged);

                },
                _onClick: function () { }
            });
            return custText;
        },
        _loadDetailsGrid: function (templates) {
            var layout = [
                {
                    field: '$key',
                    label: 'Id',
                    editable: false,
                    hidden: true,
                    unhidable: true
                },
                {
                    field: 'displayName',
                    label: nlsResource.FilterGridColumnDisplay,
                    editable: false,
                    hidden: false,
                    unhidable: true
                },
               {
                   field: 'filterName',
                   label: this.id.search('metric') >= 0 ? nlsResource.MetricGridColumnMetric : nlsResource.FilterGridColumnFilter,
                   editable: false,
                   hidden: false,
                   unhidable: false
               },
               {
                   field: 'propertyName',
                   label: nlsResource.FilterGridColumnProperty,
                   editable: false,
                   hidden: false,
                   unhidable: true
               },
               editor({
                   field: 'analyticsAvailable',
                   label: nlsResource.FilterGridColumnIsMetric,
                   editable: false,
                   hidden: false,
                   unhidable: true
               }, this._createCustomchkBox()),
               {
                   field: '$updated',
                   label: nlsResource.FilterGridColumnLastUpdated,
                   formatter: function (date) {
                       if (typeof (date) !== 'undefined') {
                           var d = utility.Convert.toDateFromString(date, true);
                           // if there is no milliSecs then default to current time.
                           if (typeof (d) !== 'undefined') {
                               return dojo.date.locale.format(d, { selector: 'date/time', fullYear: true });
                           }
                       }
                       return dojo.date.locale.format(new Date(), { selector: 'date/time', fullYear: true });

                   },
                   editable: false,
                   hidden: false,
                   unhidable: true
               },
               {
                   field: 'details',
                   label: nlsResource.FilterGridColumnDetails,
                   context: this,
                   formatter: function (details) {
                       return this.context.filterUtility.formatDetails(details).detailsLocalizedName;
                   },
                   editable: false,
                   hidden: false,
                   unhidable: true
               }
            ];

            var grid = new (declare([onDemandGrid, keyboard, selection, editor, columnHider]))({
                columns: layout,
                store: templates,
                selectionMode: "single",
                allowSelectAll: false,
                cellNavigation: false,
                queryOptions: {
                    sort: [{ attribute: "displayName" }]
                }
            }, this.entityFilter_Grid);

            grid.startup();

            this.grid = grid;
            dojo.connect(dijit.byId('list_listGrid'), "resize", dojo.partial(this.GridResize, grid));
            this.grid.updateSortArrow([{ attribute: "displayName", descending: false }], true);

            var content = this;
            window.setTimeout(function () { // after everything is set 
                // correct the incorrect icon stylings by removing the problem classes.
                content.filterUtility.fixToolbarIcons(content.filterGridToolbarContainer);
            });
			this.setGridCount(this);
        },
        setGridCount: function(context) {
            if (context.recordCountLabel) {
                context.recordCountLabel.innerHTML = dojo.string.substitute(nlsResource.totalRecordCountLabel, [context.grid.store.data.length]);
            }
        },


        GridResize: function (grid) {
            var tabContent = dijit.byId('tabContainer');
            tabContent.resize();
            grid.resize();

        },
        // controls the add action for the grid
        addFilter: function (context) {
            // instanciate the add/edit popup
            // hand over control to the popup
            // refresh the grid
            var box = new addEditDialog(context.entityName, context._getDialogTitleMarker(), context.filterUtility);
            context._displayAddEditDialogue(box, context);
        },

        // controls the edit action for the grid
        editFilter: function (context) {
            // should be about the same as the add, just populate add/edit widget with data from the currently selected grid
            var selectedGridRow = context.getSelectedItem();
            if (selectedGridRow) {
                var box = new addEditDialog(context.entityName, context._getDialogTitleMarker(), context.filterUtility, selectedGridRow);
                context._displayAddEditDialogue(box, context);
            }
        },
        //recieves the created dialog object from the add and edit functions, and calls show, and sets up the proper connection to the dialogue's closure.
        _displayAddEditDialogue: function (dialogBoxObj, context) {
            dialogBoxObj._Wstore = this.grid.store;
            dialogBoxObj.service = this.service;
            dialogBoxObj.show();
            dojo.connect(dialogBoxObj._dialog, "hide", dojo.partial(context.onReset, context));
        },
        onReset: function (context) {
            dijit.popup.close();
            context.grid.refresh();
            context._createDetailsGrid(true, context);

            context.setGridCount(context);
        },
        // untranslated singular version of the tab title. Used to be passed to the add/edit dialog
        _getDialogTitleMarker: function () {
            return this.id.search('metric') < 0 ? 'Filter' : 'Metric';
        },

        //controls the delte action for the grid
        removeFilter: function (context) {
            var self = this;
            var opts = {
                title: 'Infor CRM',
                query: dojo.string.substitute(nlsResource.confirmDeleteFmtTxt, [1]),
                callbackFn: function (result) {
                    if (result === true) {
                        // saw that the grid has this by default so try it out.
                        var item = context.getSelectedItem();
                        if (item) {
                            var resourceRequest = new Sage.SData.Client.SDataSingleResourceRequest(context.service).setResourceKind('entities(' + "'" + context.entityName + "'" + ')/filters');
                            resourceRequest.setResourceSelector("'" + item['$key'] + "'");
                            resourceRequest['delete']({}, {
                                scope: context,
                                ignoreETag: true,
                                success: function () {
                                    var item = this.getSelectedItem();
                                    this.grid.store.remove(item['$key']);
                                    this.grid.refresh();
                                },
                                failure: function (xhr, sdata) {
                                    // Handle failure
                                }
                            });
                        }
                    }

                },
                yesText: nlsResource.lblOkButton, //OK
                noText: nlsResource.lblCancelButton //Cancel
            };
            Dialogs.raiseQueryDialogExt(opts);

        },
        _onDblClick: function () {
        },
       
        onClose: function () {
            this.isOpen = false;
        },
        startup: function () {
            this.inherited(arguments);
        },


        _showHelp: function () {
                if (this.id.search('metric') < 0) {
                    utility.openHelp('FiltersInDetailGrid', 'MCWebHelp');
                }
                else {
                    utility.openHelp('MetricsInDetailGrid', 'MCWebHelp');
                }
        },
    });
    return widget;
});