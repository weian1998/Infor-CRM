/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define, sessionStorage */
define([
    'dojox/grid/DataGrid',
    'Sage/Data/SDataStore',
    'Sage/Data/SDataServiceRegistry',
    'dojo/string',
    'Sage/Groups/GroupContextService',
    'dojo/_base/declare',
    'dijit/_Widget',
    'dojo/_base/lang',
    'Sage/UI/Filters/FilterManager',
    'dojo/_base/array',
    'Sage/Utility/_LocalStorageMixin',
    'dojo/topic',
    'dojo/_base/xhr',
    'dojo/_base/array',
    'dojo/dom-style',
    'dojo/dom-construct',
    'Sage/MainView/Options/OptionsDialog',
    'dojo/query',
    'dojo/dom-class',
    'dojo/dom-attr',
    'dojo/aspect',
    'dojo/json',
    'dojo/i18n!./nls/GroupListTasklet',
    'dojo/dom-geometry',
    'Sage/Utility/Groups'
],
function (DataGrid,
        SDataStore,
        sDataServiceRegistry,
        dString,
        GroupContextService,
        declare,
        _Widget,
        lang,
        FilterManager,
        array,
        _LocalStorageMixin,
        topic,
        dojoXhr,
        dojoArray,
        domStyle,
        domConstruct,
        OptionsDialog,
        dojoQuery,
        dojoDomClass,
        dojoDomAttr,
        aspect,
        json,
        i18nStrings,
        domGeo,
        groupsUtility
) {

    var groupListTasklet = declare('Sage.Groups.GroupListTasklet', [_Widget, _LocalStorageMixin], {

        _contextSetHandle: null,
        _groupChangedHandle: null,
        gridLoadedHandler: null,
        gridOnSelectedHandle: null,
        groupContextService: null,
        context: null,

        grid: null,
        store: null,
        query: '',
        service: null,
        id: 'GroupListTasklet',
        keyAlias: '',
        columnDisplayName: '',
        allowOnSelectToFire: true, // flag so we can skip the _onSelected event if needed

        STORE_KEY_STORE_QUERY: '_STORE_QUERY_', // + groupId

        //Extended Group List new properties below:
        fieldCount: 0,
        mode: 'Standard', //Either 'Standard' or 'Extended'
        hideExtendedGroupListOnSelection: true,
        showExtendedGroupListOnLookup: false,
        gridLoadedLookupResultsHandler: null,
        extendedGroupListTaskPaneWidth: 400,
        changingGroup: false,
        SESSION_STORE_GROUP_LAYOUT_KEY: 'EGL_GROUP_LAYOUT_', // + groupId
        SESSION_STORE_USER_OPTIONS_KEY: 'EGL_USER_OPTION_', // + category + '_' + name;
        LOCAL_STORE_EGL_NAMESPACE: 'EGL',
        LOCAL_STORE_EGL_MODE_KEY: 'MODE_',// + entity family
        performingLookup: false, //flag to know whether a lookup is being performed
        previousGroupId: null, //This flag is used when a lookup is performed, since when the group is changed from a regular group to looup results, the changed event is triggered twice
        standardWidth: 200,
        _gridSelect: null,
        _gridStructure: null,
        shouldRecreateGrid: false, // flag set for recreating grid on EGL column options change.

        subscribesTo: {
            //NRADDATZ: Commented out this subscription, since this logic is now handled on Sage.Groups.GroupLookup
            //groupLookupSuccess: "/group/lookup/success",
            adhocGroupRemoved: "/group/adhoc/removed",
            groupNavFirst: "/group/nav/first",
            groupNavPrevious: "/group/nav/previous",
            groupNavNext: "/group/nav/next",
            groupNavLast: "/group/nav/last",
            userOptionsChanged: 'userOptions/changed' //Extended Group List
        },

        constructor: function (options) {
            //summary:
            //      Clientside script to instantiate the detail view's grouplist.  Should only be called by
            //      SmartParts\TaskPane\GroupList\GroupListTasklet.ascx
            //options: object
            //      options for this list, needs a keyAlias, columnDisplayName, id
            //returns:
            //      constructs the list
            this.inherited(arguments);
            lang.mixin(this, options);
            lang.mixin(this, i18nStrings);

            this.groupContextService = Sage.Services.getService("ClientGroupContext");
            this.context = this.groupContextService.getContext();

            //Extended Group List:
            topic.subscribe(this.subscribesTo.userOptionsChanged, lang.hitch(this, this._onUserOptionsChanged));
            this._loadUserOptions();
            this._createToolbarButtons();
            this._connectToCommonTasksToggleEvent();
            this.counter = 0;
            this._loadMode();
            //EGL End

            if (this.context.CurrentFamily === null) {
                this._contextSetHandle = dojo.connect(this.groupContextService, 'onContextSet', this, '_createList');
            } else {
                this.toggleMode(this.mode);
            }

            // Events
            this._groupChangedHandle = dojo.connect(this.groupContextService, 'onCurrentGroupChanged', this, '_groupChanged');

            //NRADDATZ: Commented out this subscription, since this logic is now handled on Sage.Groups.GroupLookup
            //topic.subscribe(this.subscribesTo.groupLookupSuccess, lang.hitch(this, this._onLookupSuccess)); NICO
            topic.subscribe(this.subscribesTo.groupNavFirst, lang.hitch(this, this._onGroupNavFirst));
            topic.subscribe(this.subscribesTo.groupNavPrevious, lang.hitch(this, this._onGroupNavPrevious));
            topic.subscribe(this.subscribesTo.groupNavNext, lang.hitch(this, this._onGroupNavNext));
            topic.subscribe(this.subscribesTo.groupNavLast, lang.hitch(this, this._onGroupNavLast));
            topic.subscribe(this.subscribesTo.adhocGroupRemoved, lang.hitch(this, this._onRecordRemoved));
        },
        _onGroupNavFirst: function (args) {
            this.selectGridRow(0);
        },
        _onGroupNavLast: function (args) {
            this.selectGridRow(args.count - 1);
        },
        _onGroupNavPrevious: function (args) {
            // grid is 0 based, groups are 1 based
            var position = args.position - 1;
            this.selectGridRow(position - 1);
        },
        _onGroupNavNext: function (args) {
            // grid is 0 based, groups are 1 based
            var position = args.position - 1;
            this.selectGridRow(position + 1);
        },
        _onRecordRemoved: function (args) {
            var index,
                newIndex;

            index = this.grid.selection.selectedIndex;
            if (index === 0) {
                newIndex = index + 1;
            } else {
                newIndex = index - 1;
            }

            this.selectGridRow(newIndex);
            this._onSelected(newIndex);

            // If we were on the first row, stay there, otherwise jump back one
            this._onRecordRemovedRefresh(index === 0 ? index : newIndex);
        },
        _onRecordRemovedRefresh: function (index) {
            if (this.grid) {
                this.gridRefreshedHandler = dojo.connect(this.grid, '_onFetchComplete', this, function () {
                    this.selectGridRow(index);
                });

                try {
                    this.grid.setStore(this.get('store'));
                } catch (err) { }
            }
        },
        _groupChanged: function () {
            //NRADDATZ: When performing a lookup, this event is triggered twice for some reason.
            //This is why we use the counter variable and the performingLookup flag
            this.counter++;
            if (this.performingLookup && this.counter < 2 && this.previousGroupId !== 'LOOKUPRESULTS') {
                return;
            }

            //Set the changingGroup flag, to avoid multiple execution of events
            this.changingGroup = true;
            if (this.grid && !this.shouldNotUpdate) {
                try {
                    if (this.mode === 'Extended') {
                        //If we're currently in Extended mode, and the group has changed, we need to recreate the grid
                        //so that the group layout is refreshed based on the current group.
                        this.toggleMode('Extended');
                        this.gridLoadedHandler = dojo.connect(this.grid, '_onFetchComplete', this, '_groupChangedAndLoaded');
                    }
                    else {
                        //We are in Standard mode.                        
                        var context = this.groupContextService.getContext();
                        if (context['CurrentGroupID'] === 'LOOKUPRESULTS' && this.showExtendedGroupListOnLookup) {
                            //If the current group is lookup results, and the option to show extended group list is enabled, toggle extended.
                            this.toggleMode('Extended');
                            this.gridLoadedHandler = dojo.connect(this.grid, '_onFetchComplete', this, '_groupChangedAndLoaded');
                        }
                        else {
                            //Just refresh the grid
                            this.gridLoadedHandler = dojo.connect(this.grid, '_onFetchComplete', this, '_groupChangedAndLoaded');
                            this.grid.setStore(this.get('store'));
                        }
                    }
                } catch (err) { }
            }
        },
        _groupChangedAndLoaded: function () {
            //The groupChangedAndLoaded event is triggered twice, hence this check.
            if (this.grid.rowCount === 0) {
                return;
            }

            //If we are on extended mode and the current group is lookup results we don't select row zero
            if (!(this._getGroupID() === 'LOOKUPRESULTS' && this.mode === 'Extended')) {
                this.selectGridRow(0);
                this._onSelected(0);
            }

            if (this.gridLoadedHandler) {
                dojo.disconnect(this.gridLoadedHandler);
            }

            //Clear EGL flags
            this.changingGroup = false;
            this.counter = 0;
            this.performingLookup = false;
        },

        _getStoreQueryKey: function () {
            var id = this.STORE_KEY_STORE_QUERY + this._getGroupID();
            return id;
        },
        _getGroupNS: function () {
            var ns = Sage.Groups.GroupManager.LOCALSTORE_NAMESPACE + '-' + this._getGroupID();
            return ns;
        },
        _getGroupID: function () {
            this.context = this.groupContextService.getContext();
            var results = -1;
            if (this.context) {
                results = this.context.CurrentGroupID;
            }
            return results;
        },
        _getStoreAttr: function () {
            this.context = this.groupContextService.getContext();
            this.context.CurrentFamily = this.context.CurrentFamily.toUpperCase();
            var resourcePredicate = "'" + this.context.CurrentGroupID + "'";

            if (this.context['CurrentGroupID'] === 'LOOKUPRESULTS') {
                // If this is a non-English site, the query will fail to pull from 'Lookup Results' group
                this.context['CurrentName'] = 'Lookup Results';
            }

            var temp = this.getFromLocalStorage(this._getStoreQueryKey(), this._getGroupNS()),
                defaults = {
                    resourceKind: 'groups',
                    service: this.service,
                    queryName: 'execute',
                    resourcePredicate: resourcePredicate,
                    select: this._getSelect()
                };

            if (temp && temp.store && temp.query) {
                // Mixing in will give a type error in the grid
                defaults.select = temp.store.select;
                defaults.resourcePredicate = temp.store.resourcePredicate;
                this.query = temp.query;
                if (this.query) {
                    defaults.where = this.query;
                }
            }

            this.store = new SDataStore(defaults);
            return this.store;
        },
        refreshGrid: function () {
            this.context = this.groupContextService.getContext();
            var position = this.context.CurrentEntityPosition - 1;
            this.selectGridRow(position);
            if (this.gridRefreshedHandler) {
                dojo.disconnect(this.gridRefreshedHandler);
            }
        },
        selectGridRow: function (position) {
            this.allowOnSelectToFire = false;
            if (this.grid.rowCount > 0) {
                this.grid.scrollToRow(position);
                this.grid.selection.clear();
                this.grid.selection.select(position);
                this.grid.onSelected(position);
            } else {
                Sage.Link.toListView();
            }
            this.allowOnSelectToFire = true;
        },
        uninitialize: function () {
            try {
                if (this.grid && this.grid.destroy) {
                    this.grid.destroy();
                }
                if (this.gridOnSelectedHandle) {
                    this.gridOnSelectedHandle.remove();
                }
            } catch (err) {
            }

            this.inherited(arguments);
        },
        _createList: function () {
            var self = this,
                gridId = this.id + "_grid",
                grid;

            this.service = sDataServiceRegistry.getSDataService('system');

            if (this.grid) {
                this.grid.setStore(this.get('store'));
            } else {
                //NRADDATZ: Dynamic grid structure and height, required for extended group list.
                var structure = this._getGridStructure();
                var height = this._getHeight();
                grid = new DataGrid({
                    store: this.get('store'),
                    id: gridId,
                    structure: structure,
                    showTitle: false,
                    autoWidth: false,
                    rowSelector: false,
                    selectionMode: 'single',
                    width: '100%',
                    height: height + 'px',
                    //Extended Group List: When the grid is resorted, select item in position 0.
                    onHeaderCellClick: function (e) {
                        self.sorting = true; //Set the sorting flag
                        self.gridRefreshedOnSortHandler = dojo.connect(grid, '_onFetchComplete', self, '_onGridSorted');
                        this.setSortIndex(e.cell.index);
                        this.onHeaderClick(e);
                    }
                });

                grid.rowsPerPage = 100;

                dojo.byId(this.id + '_node').appendChild(grid.domNode);
                if (!this.changingGroup) {
                    this.gridRefreshedHandler = dojo.connect(grid, '_onFetchComplete', this, 'refreshGrid');
                }
                grid.startup();
                this.grid = grid;
            }

            this.gridOnSelectedHandle = this.grid.on('selected', lang.hitch(this, this._onSelected));
        },
        _onSelected: function (index) {
            if (!this.allowOnSelectToFire) {
                /* selectGridRow sets this to false, so we can select the row without navigating to the entity */
                return;
            }

            var cec,
                preventity,
                selected;

            if (Sage.Services.hasService("ClientEntityContext")) {
                cec = Sage.Services.getService("ClientEntityContext");
                preventity = cec.getContext().EntityId;
                selected = this.grid.selection.getFirstSelected();
                if (selected) {
                    cec.navigateSLXGroupEntity(selected[this.keyAlias], preventity, index + 1);
                }
            }
            //NRADDATZ: If we are currently displaying the extended group list, and the option to
            //hide extended group list on selection is enabled, we switch to standard view.
            if (this.hideExtendedGroupListOnSelection && (this.mode === 'Extended') && !this.sorting && !this.changingGroup) {
                this.toggleMode('Standard');
            }
            //NRADDATZ: If the onselected was fired due to the grid being sorted, we clear the flag
            this.sorting = false;
        },

        /**
        * Creates the toolbar buttons related to the Extended Group List.
        */
        _createToolbarButtons: function () {
            var toolsDiv = dojoQuery(".task-pane-header-tools");

            var optionsButton = dString.substitute('<a href="javascript:void(0)" title=""><div class="Global_Images icon16x16 icon_options_16x16" id="ExtendedGroupList_options" title="${0}" style="cursor: pointer;"></div></a>', [this.GroupListOptionsTitle]);
            //Options button            
            domConstruct.place(optionsButton, toolsDiv[0], 1);
            dojo.connect(dojo.byId("ExtendedGroupList_options"), "onclick", function (evt) {
                var dialog = dijit.byId('dlgOptions');
                if (!dialog) {
                    dialog = new OptionsDialog();
                }
                dialog.startup();
                dialog.show();
            });

            //Extended Group List toggle            
            var groupListTasklet = this;
            var expandIcon = dString.substitute('<a href="javascript:void(0)" title="" id="xxxx"><div class="Global_Images icon16x16 icon_Toggle_Maximize_16x16" title="${0}" id="ExtendedGroupList_toggle" style="cursor: pointer;"></div></a>', [this.maximizeTitle]);
            domConstruct.place(expandIcon, toolsDiv[0], 3);
            dojo.connect(dojo.byId("ExtendedGroupList_toggle"), "onclick", function (evt) {
                groupListTasklet.toggleMode();
            });
        },

        /**
        * Asynchronously loads user options related to the group list behavior.
        */
        _loadUserOptions: function () {
            var svc = Sage.Services.getService("UserOptions");
            if (svc) {
                //ExtendedGroupList_FieldCount
                var cacheKey = this.SESSION_STORE_USER_OPTIONS_KEY + 'ExtendedGroupList_FieldCount';
                var value = this._getFromSessionStorage(cacheKey);
                if (value !== null && typeof value !== 'undefined') {
                    this.fieldCount = value;
                }
                else {
                    svc.get('FieldCount', 'ExtendedGroupList', lang.hitch(this, function (option) {
                        if (option && option.value) {
                            this.fieldCount = parseInt(option.value);
                            this._addToSessionStorage(cacheKey, this.fieldCount);
                        }
                    }), null, null, true);
                }

                //ExtendedGroupList_HideOnSelection
                cacheKey = this.SESSION_STORE_USER_OPTIONS_KEY + 'ExtendedGroupList_HideOnSelection';
                value = this._getFromSessionStorage(cacheKey);
                if (value !== null && typeof value !== 'undefined') {
                    this.hideExtendedGroupListOnSelection = value;
                }
                else {
                    svc.get('HideOnSelection', 'ExtendedGroupList', lang.hitch(this, function (option) {
                        if (option) {
                            this.hideExtendedGroupListOnSelection = (option.value === 'T') ? true : false;
                            this._addToSessionStorage(cacheKey, this.hideExtendedGroupListOnSelection);
                        }
                    }), null, null, true);
                }

                //ExtendedGroupList_ShowOnLookup
                cacheKey = this.SESSION_STORE_USER_OPTIONS_KEY + 'ExtendedGroupList_ShowOnLookup';
                value = this._getFromSessionStorage(cacheKey);
                if (value !== null && typeof value !== 'undefined') {
                    this.showExtendedGroupListOnLookup = value;
                }
                else {
                    svc.get('ShowOnLookup', 'ExtendedGroupList', lang.hitch(this, function (option) {
                        if (option) {
                            this.showExtendedGroupListOnLookup = (option.value === 'T') ? true : false;
                            this._addToSessionStorage(cacheKey, this.showExtendedGroupListOnLookup);
                        }
                    }), null, null, true);
                }
            }
        },
        /**
        * Updates the user options when a change is published.
        */
        _onUserOptionsChanged: function (options) {
            this.shouldRecreateGrid = false;
            if (this.fieldCount !== options.extendedGroupList.fieldCount) {
                this.shouldRecreateGrid = true;
            }
            //ExtendedGroupList_FieldCount            
            this.fieldCount = options.extendedGroupList.fieldCount;
            var cacheKey = this.SESSION_STORE_USER_OPTIONS_KEY + 'ExtendedGroupList_FieldCount';
            this._addToSessionStorage(cacheKey, this.fieldCount);

            //ExtendedGroupList_HideOnSelection            
            this.hideExtendedGroupListOnSelection = options.extendedGroupList.hideOnSelection;
            cacheKey = this.SESSION_STORE_USER_OPTIONS_KEY + 'ExtendedGroupList_HideOnSelection';
            this._addToSessionStorage(cacheKey, this.hideExtendedGroupListOnSelection);

            //ExtendedGroupList_ShowOnLookup
            this.showExtendedGroupListOnLookup = options.extendedGroupList.showOnLookup;
            cacheKey = this.SESSION_STORE_USER_OPTIONS_KEY + 'ExtendedGroupList_ShowOnLookup';
            this._addToSessionStorage(cacheKey, this.showExtendedGroupListOnLookup);

            if (this.mode === 'Extended' && this.shouldRecreateGrid) {
                this.toggleMode('Extended');
            }
        },
        _getCurrentFamily: function () {
            var clientGroupContext = Sage.Services.getService("ClientGroupContext");
            var context = clientGroupContext && clientGroupContext.getContext();
            var family = context && context.CurrentFamily;
            return family;
        },
        /**
        * Returns the layout for the current group.
        * @return {Array}
        */
        _getCurrentGroupLayout: function () {
            var family = this._getCurrentFamily();

            //TODO: refactor the group layout logic to make use of the GroupLayoutSingleton.
            //As it is now, the whole logic assumes a synchronous call to get the layout, but the GroupLayoutSingleton logic is asynchronous.
            var cacheKey = this.SESSION_STORE_GROUP_LAYOUT_KEY + this._getGroupID();
            if (this._getGroupID() === 'LOOKUPRESULTS') {
                //Since the LOOKUPRESULTS group id is the same for all entities, we append the current family to distinguish between different entities.
                cacheKey = cacheKey + "_" + family;
            }

            var layout = this._getFromSessionStorage(cacheKey);
            if (!layout) {
                //TODO: Implement the below with a proper sdata client library call
                var url = "slxdata.ashx/slx/system/-/groups('" + this._getGroupID() + "')?select=layout/dateTimeType,layout/alias,layout/caption,layout/width,layout/fieldType,layout/format,layout/formatString,layout/propertyPath,layout/visible,layout/webLink,layout/dataPath&format=json";

                //Make a synchronous call to get the group
                dojoXhr('GET', {
                    url: url,
                    handleAs: "json",
                    sync: true,
                    preventCache: true //Required to prevent IE from caching the request
                }).then(function (data) {
                    layout = data.layout;
                });
                this._addToSessionStorage(cacheKey, layout);
            }

            var fieldCount = this.fieldCount > 0 ? this.fieldCount : 20; //If the field count is 0, that means get all columns, we assume an arbitrary max count of 20 columns
            if (layout.length > fieldCount) {
                layout = layout.splice(0, fieldCount);
            }
            return layout;
        },

        /**
        * Returns the list of fields to be selected in the sdata call.
        * @return {Array}
        */
        _getSelect: function () {
            var layout = this._getCurrentGroupLayout();
            var select = [this.keyAlias, this.columnDisplayName];

            if (this.mode === 'Extended') {
                if (!this._gridSelect) {
                    var gridStructureData = groupsUtility.getGridStructure(layout, true);
                    this._gridStructure = gridStructureData.structure;
                    this._gridSelect = gridStructureData.select;
                }

                this._gridSelect.forEach(function (item, index) {
                    select.push(item);
                });
            }
            return select;
        },
        /**
        * Adds data to session storage.
        */
        _addToSessionStorage: function (cacheKey, data) {
            sessionStorage.setItem(cacheKey, json.stringify(data));
        },
        /**
        * Gets data from session storage.
        */
        _getFromSessionStorage: function (cacheKey) {
            var cacheData = sessionStorage.getItem(cacheKey);
            var data;
            if (cacheData !== null && typeof cacheData !== 'undefined') {
                data = json.parse(cacheData);
            }
            return data;
        },
        _getModeFromLocalStorage: function () {
            var cacheKey = this.LOCAL_STORE_EGL_MODE_KEY + this._getGroupID();
            var mode = this.getFromLocalStorage(cacheKey(), this.LOCAL_STORE_EGL_NAMESPACE);
            return mode;
        },
        /**
        * Returs the group list grid structure.
        * @return {Array}
        */
        _getGridStructure: function () {
            var self = this;
            var structure = [];
            if (this.mode === 'Standard') {
                //Standard mode.
                //The standard group list has only one visible field and the special keyAlias set to 0 pixel width.

                structure.push({
                    field: "_item",
                    headerClasses: "displaynone",
                    width: '100%',
                    formatter: function (item) {
                        return (item && item.hasOwnProperty(self.columnDisplayName) ? item[self.columnDisplayName] : dojo.string.substitute("(${0})", [item[self.keyAlias]]));
                    }
                });

                structure.push({
                    field: this.keyAlias,
                    hidden: true,
                    headerClasses: "displaynone",
                    width: '0px'
                });
            }
            else {
                //Extended mode
                var layout = this._getCurrentGroupLayout();

                if (!this._gridStructure || this.shouldRecreateGrid || this.changingGroup) {
                    var gridStructureData = groupsUtility.getGridStructure(layout, true);
                    this._gridStructure = gridStructureData.structure;
                    this._gridSelect = gridStructureData.select;
                }
                structure = this._gridStructure;
            }

            return structure;
        },
        /**
        * Calculates the best possible height for the group list grid.
        * @return {Number}
        */
        _getHeight: function () {
            var commonTasksHeight = dojo.marginBox(dojo.byId("TaskPane_item_CommonTasksTasklet")).h;
            var taskPaneHeight = dojo.marginBox(dojo.byId("TaskPane")).h;
            var gridHeight = taskPaneHeight - commonTasksHeight - 110;

            //Border case: If the calculated height is less than 230 pixels, we default to 230.
            if (gridHeight < 230) {
                gridHeight = 230;
            }
            return gridHeight;
        },
        /**
        * Toggles between Standard and Extended group list.
        * @param {string=null} mode Mode to toggle to. If not specified, the grouplist switches automatically.
        * @return {undefined}
        * @public
        */
        toggleMode: function (mode) {
            var taskPane = dijit.byId("TaskPane");
            if (this.mode === 'Standard') {
                this.standardWidth = domGeo.getMarginBox(taskPane.domNode).w;
            }
            this.uninitialize();
            this.grid = null;
            this.mode = mode ? mode : (this.mode === 'Standard') ? 'Extended' : 'Standard'; //If no mode is specified, we just change from the current mode to the other.
            this._resizeTaskPane();
            this._createList();
            this._setExtendedGroupListToggleIcon();
            this._saveMode();
        },
        /**
        * Sets the extended group list toggle icon, based on the current mode.
        * @return {undefined}
        * @private
        */
        _setExtendedGroupListToggleIcon: function () {
            //Change toggle icon depending on the current group list mode
            if (this.mode === 'Extended') {
                dojoDomClass.remove('ExtendedGroupList_toggle', 'icon_Toggle_Maximize_16x16');
                dojoDomClass.add('ExtendedGroupList_toggle', 'icon_Toggle_Minimize_16x16');
                dojoDomAttr.set('ExtendedGroupList_toggle', 'title', this.minimizeTitle);
            }
            else {
                dojoDomClass.remove('ExtendedGroupList_toggle', 'icon_Toggle_Minimize_16x16');
                dojoDomClass.add('ExtendedGroupList_toggle', 'icon_Toggle_Maximize_16x16');
                dojoDomAttr.set('ExtendedGroupList_toggle', 'title', this.maximizeTitle);
            }
        },
        /**
        * Resizes the taskpane depending on the current mode.
        * @return {undefined}
        * @private
        */
        _resizeTaskPane: function () {
            var taskPane = dijit.byId("TaskPane");
            var currentWidth = domStyle.get(taskPane.domNode, "width");
            //Resize taskpane.
            if (this.mode === 'Extended') {
                //If the group list mode is 'Extended', the taskpane width is resized to show more information.
                //Note we only resize if the current width is less than the default EGL task pane width
                if (currentWidth < this.extendedGroupListTaskPaneWidth) {
                    var width = this.extendedGroupListTaskPaneWidth + "px";
                    domStyle.set(taskPane.domNode, "width", width);
                    dijit.byId("innerBorder").resize();
                }
            }
            else {
                //If the group list mode is 'Standard', the taskpane width is set to its default value.
                domGeo.setMarginBox(taskPane.domNode, { w: this.standardWidth });
                dijit.byId("innerBorder").resize();
            }

            //Collapse or expand common tasks.
            if (this.mode === 'Extended') {
                dijit.byId('TaskPane_item_CommonTasksTasklet').set('open', false);
            }
            else {
                dijit.byId('TaskPane_item_CommonTasksTasklet').set('open', true);
            }
        },
        _connectToCommonTasksToggleEvent: function () {
            var groupList = this;
            var commonTasksTasklet = dijit.byId('TaskPane_item_CommonTasksTasklet');
            if (commonTasksTasklet) {
                dojo.connect(commonTasksTasklet, "toggle", function () {
                    var gridNode = dojo.byId('GroupList_grid');
                    //The timeout is to allow the common tasks pane to collapse/expand before we recalculate grid height
                    setTimeout(function () {
                        var height = groupList._getHeight() + "px";
                        domStyle.set(gridNode, "height", height);
                        groupList.grid.resize();
                        groupList.grid.update();
                    }, 250);
                });
            }
        },
        /**
        * If the grid refresh was fired due to sorting, force the system to reposition to row 0.
        * This is required so that the record displayed in detail and group list are in sync.
        * @private
        * @return {undefined}
        */
        _onGridSorted: function () {
            this.selectGridRow(0);
            this._onSelected(0);
            if (this.gridRefreshedOnSortHandler) {
                dojo.disconnect(this.gridRefreshedOnSortHandler);
            }
        },
        _loadMode: function () {
            var family = this._getCurrentFamily();
            var cacheKey = this.LOCAL_STORE_EGL_MODE_KEY + family;
            var value = this.getFromLocalStorage(cacheKey, this.LOCAL_STORE_EGL_NAMESPACE);
            if (value !== null && typeof value !== 'undefined') {
                this.mode = value;
            }
            else {
                this.mode = 'Standard';
            }
        },
        _saveMode: function () {
            var family = this._getCurrentFamily();
            var cacheKey = this.LOCAL_STORE_EGL_MODE_KEY + family;
            this.saveToLocalStorage(cacheKey, this.mode, this.LOCAL_STORE_EGL_NAMESPACE);
        }
    });
    return groupListTasklet;
});