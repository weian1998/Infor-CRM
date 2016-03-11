/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */

define('Sage/MainView/ActivityMgr/AttendeeLookup/SpeedSearchLookup',
    [
        'dojo/_base/html',
        'dojox/grid/DataGrid',
        'Sage/Data/SDataServiceRegistry',
        'Sage/UI/SLXPreviewGrid',
        'Sage/UI/EditableGrid',
        'dijit/Dialog',
         'dijit/_Widget',
         'Sage/_Templated',
         'dojo/_base/lang',
         'dojo/string',
         'dojo/_base/array',
         'dijit/registry',
        'dojo/text!./templates/SpeedSearchLookup.html',
         'dojo/_base/declare',
         'Sage/Data/ServiceOperationSDataStore',
         'dojo/i18n!./nls/SpeedSearchLookup'
    ],
function (html, DataGrid, sDataServiceRegistry, SlxPreviewGrid, editableGrid, Dialog, _Widget, _Templated, dojoLang, string, array, registry, template, declare, ServiceOperationSDataStore, nlsStrings) {
    var widget = declare('Sage.MainView.ActivityMgr.AttendeeLookup.SpeedSearchLookup', [_Widget, _Templated], {
        //widgetTemplate: new Simplate(eval(template)),
        id: 'speedSearchLookup',
        btnIcon: 'images/icons/plus_16x16.gif',
        btnToolTip: 'Lookup',
        dialogTitle: 'Contact/Lead Look up',

        closeText: 'Close',
        loadingText: 'Loading...',
        // noDataText: 'No records returned',
        _initialized: false,
        _started: false,
        dialogButtonText: 'Search',
        widgetsInTemplate: true,
        widgetTemplate: new Simplate(eval(template)),
        srchBtnCaption: 'Search',
        _store: null,
        _grid: null,
        //end i18n strings.
        currentPage: 0,
        pageSize: 100,
        indexes: [
           { indexName: 'Contact', indexType: 1, isSecure: true },
           { indexName: 'Lead', indexType: 1, isSecure: true }

        ],
        types: ['Contact', 'Lead'],
        iconPathsByType: {
            'Account': 'content/images/icons/Company_24.png',
            'Activity': 'content/images/icons/To_Do_24x24.png',
            'Contact': 'content/images/icons/Contacts_24x24.png',
            'History': 'content/images/icons/journal_24.png',
            'Lead': 'content/images/icons/Leads_24x24.png',
            'Opportunity': 'content/images/icons/opportunity_24.png',
            'Ticket': 'content/images/icons/Ticket_24x24.png'
        },
        constructor: function () {
            //   this._initializeList();
            dojoLang.mixin(this, nlsStrings);

        },
        postMixInProperties: function () {
            // Set the widgetTemplate here so we can select the appropriate template for the selected display mode.
        },

        startup: function () {
            this._buildGrid();
            var self = this;
        },
        extractTypeFromItem: function (item) {
            for (var i = 0; i < this.types.length; i++) {
                if (item.source.indexOf(this.types[i]) !== -1) {
                    return this.types[i];
                }
            }

            return null;
        },
        extractDescriptorFromItem: function (item, type) {
            var descriptor = '';

            switch (type) {
                case 'Contact':
                    descriptor = string.substitute('${lastname}, ${firstname}', this.getFieldValues(item.fields, ['firstname', 'lastname']));
                    break;
                case 'Lead':
                    descriptor = string.substitute('${lastname}, ${firstname}', this.getFieldValues(item.fields, ['firstname', 'lastname']));
                    break;
                    /*  case 'Opportunity':
                          descriptor = this.getFieldValue(item.fields, 'subject');
                          break;
                      case 'History':
                          descriptor = string.substitute('${subject} (${date_created})', this.getFieldValues(item.fields, ['subject', 'date_created']));
                          break;
                      case 'Ticket':
                          descriptor = item.uiDisplayName;
                          break;*/
            }
            return descriptor;
        },

        extractKeyFromItem: function (item) {
            // Extract the entityId from the display name, which is the last 12 characters
            var displayName, len;
            displayName = item.displayName;
            if (!displayName) {
                return '';
            }

            len = displayName.length;
            return displayName.substring(len - 12);
        },
        getFieldValue: function (fields, name) {
            for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                if (field.fieldName == name) {
                    return field.fieldValue;
                }
            }

            return '';
        },
        getFieldValues: function (fields, names) {
            var results = {};

            // Assign each field in the results to an empty string,
            // so that dojo's string substitute won't blow up on undefined.
            array.forEach(names, function (name) {
                results[name] = '';
            });

            array.forEach(fields, function (field) {
                array.forEach(names, function (name, i) {
                    if (field.fieldName === name) {
                        results[name] = field.fieldValue;
                    }
                });
            });

            return results;
        },
        showLookup: function (mixinProperties) {
            this._dialog.set('title', this.dialogTitle);
            this.eventDefaultValues = mixinProperties || {};
            this._dialog.show();
            if (!this._initialized) {
                this._initializeList();
            }
            this._dialog.set('refocus', false);
            this.connect(this._dialog, 'onHide', this.destroy);

            // Create help icon
            // if (!this._dialog.helpIcon) {
            //   dojoLang.mixin(this._dialog, new _DialogHelpIconMixin());
            //   this._dialog.createHelpIconByTopic('addevent');
            // }
        },
        processFeed: function (feed) {
            if (!this.feed) {
                this.set('listContent', '');
            }

            this.feed = feed = feed.response;

            if (feed.totalCount === 0) {
                this.set('listContent', this.noDataTemplate.apply(this));
            } else if (feed.items) {
                var o = [];

                for (var i = 0; i < feed.items.length; i++) {
                    var entry = feed.items[i];

                    entry.type = this.extractTypeFromItem(entry);
                    entry.$descriptor = entry.$descriptor || this.extractDescriptorFromItem(entry, entry.type);
                    entry.$key = this.extractKeyFromItem(entry);

                    this.entries[entry.$key] = entry;

                    o.push(this.rowTemplate.apply(entry, this));
                }

                if (o.length > 0) {
                    domConstruct.place(o.join(''), this.contentNode, 'last');
                }
            }

            if (typeof feed.totalCount !== 'undefined') {
                var remaining = this.feed.totalCount - ((this.currentPage + 1) * this.pageSize);
                this.set('remainingContent', string.substitute(this.remainingText, [remaining]));
            }

            domClass.toggle(this.domNode, 'list-has-more', this.hasMoreData());
        },
        _onComplete: function (feed, context) {

            array.forEach(feed, function (entry, i) {
                entry.type = self.extractTypeFromItem(entry);
                entry.$descriptor = entry.$descriptor || self.extractDescriptorFromItem(entry, entry.type);
                entry.$key = self.extractKeyFromIt;
                entry.account = self.extractKeyFromIt
                self._storeItems.push(entry);
            });

        },
        _initializeList: function () {
            this._started = false;
            //define the columns:
            var columns = [
                {
                    field: '$descriptor',
                    name: this.colName,
                    width: '20%'
                }, {
                    field: 'type',
                    name: this.colType,
                    width: '10%'
                }, {
                    field: 'accountName',
                    name: this.colAccount,
                    width: '30%'
                }, {
                    field: 'title',
                    name: this.colTitle,
                    width: '10%'
                }, {
                    field: 'email',
                    name: this.colEmail,
                    width: '30%'
                }, {
                    field: 'phone',
                    name: this.colWorkPhone,
                    width: '30%'
                }
            ];

            var self = this;

            var entry = {
                request: {
                    docTextItem: -1,
                    searchText: '',
                    searchType: 1,
                    noiseFile: 'PMINoise.dat',
                    includeStemming: false,
                    includeThesaurus: false,
                    includePhonic: false,
                    useFrequentFilter: false,
                    indexes: this.indexes,
                    whichPage: this.currentPage,
                    itemsPerPage: this.pageSize,
                    filters: null
                },
                response: null
            };

            var onComplete = function (feed, context) {
                this._initialized = true;
                array.forEach(feed, function (entry, i) {
                    entry.type = self.extractTypeFromItem(entry);
                    entry.$descriptor = entry.$descriptor || self.extractDescriptorFromItem(entry, entry.type);
                    entry.$key = self.extractKeyFromItem(entry);
                    entry.accountName = self.getFieldValue(entry.fields, 'account');
                    entry.title = self.getFieldValue(entry.fields, 'title');
                    entry.email = self.getFieldValue(entry.fields, 'email');
                    entry.phone = self.getFieldValue(entry.fields, 'phone');
                });
            };

            var _store = this._store = new ServiceOperationSDataStore({
                service: sDataServiceRegistry.getSDataService('system'),
                contractName: 'system',
                operationName: 'executeSearch',
                entry: entry,
                onProcess: onComplete
            });

            if (!this._grid) {
                var grid = this._grid = new dojox.grid.EnhancedGrid({
                    id: 'speedSearchGrid',
                    store: _store,
                    structure: columns,
                    layout: 'layout',
                    noDataMessage: '<span class="dojoxGridNoData">' + this.noDataText + '</span>', //'<span class='dojoxGridNoData'>No users</span>',
                    rowsPerPage: 100
                },
                dojo.byId(this._speedSearchGrid));
            }
            this._grid.canSort = function (col) {
                return false;
            };
            dojo.connect(this._grid, 'onDblClick', this, this.onDoubleClick);

            this._in = true;

        },

        onDoubleClick: function (event) {
            this.getGridSelections();
        },

        uninitialize: function () {
            if (!this.contentNode) {
                return;
            }
            array.forEach(this.mainHandles, function (handle) {
                handle.remove();
            });

            this._destroyContent();

            this.inherited(arguments);
        },

        _destroyContent: function () {
            if (!this.contentNode) {
                return;
            }

            array.forEach(registry.findWidgets(this.contentNode), function (widget) {
                widget.destroy(false);
            });
            array.forEach(this.handles, function (handle) {
                handle.remove();
            });
            this.handles = [];
            this.contentNode.innerHTML = '';
        },
        initDialog: function () {

        },
        _onKey: function (/*Event*/evt) {
            //summary:
            // An override to the Dialog _onKey that allows the Lookup control to function as a modeless dialog.  
            // Future implementations will see this feature as a mixin class available to any dialog class.
            // modality: modal, modeless
            // (modality === 'modeless') ? dijit.byId('dijit_DialogUnderlay_0').hide(); 
            // OR
            //  dojo.destroy(self.id + '-Dialog_underlay');        
            var self = this,
                args = arguments;
            dojo.query('*', this.domNode).forEach(function (node, index, arr) {
                if (node === evt.target) {
                    //We are inside the dialog. Call the inherited.
                    self.inherited(args);
                }
            });
        },
        getGridSelections: function () {
            var items = this._grid.selection.getSelected();
            this._grid.selection.deselectAll();
            this.doSelected(items);
        },
        doSelected: function (items) {
            //do nothing, this is here as a placeholder for consumers to add custom handling for this event.
        },
        _cancelClick: function () {
            this.hide();
        },
        hide: function () {
            this._dialog.hide();
            this._started = false;
        },
        _doSearch: function () {
            if (this._valueBox.value) {
                this._store.entry.request.searchText = this._valueBox.value;
                if (!this._started) {
                    this._started = true;
                    this._grid.startup();
                } else {
                    dijit.byId("speedSearchGrid").setQuery();
                    this._grid.store = this._store;
                    //this._speedSearchGrid.resize();
                    this._grid.update();
                }
            }
        },

        _onKeyPress: function (evt) {
            if (evt.keyCode == 13 || evt.keyCode == 10) {
                // event.stop(evt);
                this._valueBox.blur();
                this._doSearch();
            }
        },
        destroy: function () {
            var dialog = dijit.byId([this.id, '-Dialog'].join(''));

            if (this.btnIcon) {
                dojo.destroy(this.btnIcon);
            }

            dojo.disconnect(this._doSearchConnection);
            dojo.unsubscribe(this._addCondHandle);
            dojo.unsubscribe(this._removeCondHandle);

            if (this.conditionMgr) {
                this.conditionMgr.destroy(false);
            }

            if (dialog) {
                dialog.uninitialize();
            }
            dialog.destroyRecursive();
            this.inherited(arguments);
        }
    });
    return widget;

});
