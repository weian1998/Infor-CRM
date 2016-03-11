/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define('Sage/MainView/ActivityMgr/ActivityEditorAttendeesTab', [
        'dojo',
        'dijit/_Widget',
        'Sage/_Templated',
        'dojo/_base/declare',
        'Sage/Data/SDataServiceRegistry',
        'Sage/Data/SingleEntrySDataStore',
        'Sage/Data/WritableSDataStore',
        'Sage/Utility',
        'Sage/Utility/Activity',
        'Sage/UI/SLXPreviewGrid',
        'Sage/UI/EditableGrid',
          'dijit/layout/ContentPane',
        'dojo/_base/lang',
        'dojo/DeferredList',
        'dojo/on',
        'dojo/_base/array',
        'dojo/topic',
        'dojo/string',
        'dojo/_base/Deferred',
        'Sage/MainView/ActivityMgr/AttendeeLookup/SpeedSearchLookup',
        'Sage/UI/Controls/SingleSelectPickList',
        'dojo/i18n!./nls/ActivityEditorAttendeesTab',
        'dojox/grid/cells/_base',
        'Sage/Extensions/UI/Columns/Radio',
        'Sage/Extensions/UI/Columns/CheckBox',
        'Sage/Extensions/UI/Columns/PickListSelect',
        'Sage/MainView/ActivityMgr/AttendeeLookup/LookupService'
],
    function (dojo, _Widget, _Templated, declare, sDataServiceRegistry, SingleEntrySDataStore, WritableSDataStore, utility, activityUtility, SlxPreviewGrid, EditableGrid,
        ContentPane, lang, DeferredList, on, array, topic, dstring, Deferred, SpeedSearchLookup, SingleSelectPickList, nlsStrings, AlwaysEdit, radio, checkBox,
        PickListSelect, lkupServie) {
        //The ActivityEditorAttendeesTab is a customization displaying how to add a tab to the activity dialog
        //  with a datagrid for adding and editing a collection of related entities.
        //The code to add it is below the declaration.
        var assocaitionsTab = declare('Sage.MainView.ActivityMgr.ActivityEditorAttendeesTab', [_Widget, _Templated], {
            actEditor: null,
            lup_Contact: null,
            lup_Lead: null,
            self: null,
            widgetsInTemplate: true,
            currentPrimaryEntityId: null,
            userContactAttendees: [],
            editorMode: null,
            _activityId: null,
            _addedAttendees: null,
            _uncheckItem: null,
            _initialPrimaryContact: false,
            _gridStarted: false,
            _timeZones: [],
            constructor: function (options) {
                lang.mixin(this, options);
                lang.mixin(this, nlsStrings);
                var self = this;
                if (this._timeZones.length == 0) {
                    Sage.Utility.getTimeZones(function (result) {
                        self._timeZones = result;
                    });
                }
            },
            //the template for the tab content is simply a placeholder for the grid created in code
            widgetTemplate: new Simplate([
                '<div>',
                    '<div id="{%= $.id %}_attendeesGridPlaceholder" dojoAttachPoint="_attendeesGridPlaceholder" style="width:100%;height:100%"></div>',
                '</div>'
            ]),
            userContactList: [],
            //keep an internal list of new _attendee items as they are added
            _newItems: [],
            //this is called once by the code that adds the tab to the activity editor.
            //build the grid and connect event listeners for important events.
            startup: function (readOnly) {
                //console.log("_attendeesTab startup");
                this._newItems = [];
                this._addedAttendees = [];
                //if we cannot find the editor, we really cannot do much, don't create the grid
                if (!this.actEditor) {
                    return;
                }
                this._activityId = utility.getCurrentEntityId();
                this._buildGrid(readOnly);

                //listen for when activities are saved so we can ensure the correct relationships and save the agenda
                dojo.subscribe('/entity/activity/create', this, this._activitySaved);
                dojo.subscribe('/entity/activity/change', this, this._activitySaved);

                //dojo.subscribe('/entity/activityAttendee/primaryClicked', this, this.primaryClicked);

                this.createLookups();
                this.self = this;
                var self = this;
            },
            primaryClicked: function (entity) {
                // console.log("primaryClicked -> Name :" + entity.Name + ",oldValue :" + entity.IsPrimary + ",NewValue:" + entity.checked);

                entity['attendeeTab'] = true;
                entity['PrimaryChecked'] = entity.checked;

                if (entity.checked) {
                    this._uncheckItem = entity;
                }

                if (!entity["AccountId"] && entity["EntityType"] == "Contact") {
                    activityUtility._getContactData(entity["EntityId"], function (contactData) {
                        if (contactData["Account"] && contactData["Account"]["$key"]) {
                            entity["AccountId"] = contactData["Account"]["$key"];
                        }
                        dojo.publish('/entity/activityAttendee/primaryChanged', [entity, this]);
                    }, this);
                } else if (!entity["AccountId"] && entity["EntityType"] == "Lead") {
                    activityUtility._getLeadData(entity["EntityId"], function (leadData) {
                        if (leadData["Account"] && leadData["Account"]["$key"]) {
                            entity["AccountId"] = leadData["Account"]["$key"];
                        }
                        dojo.publish('/entity/activityAttendee/primaryChanged', [entity, this]);
                    }, this);
                } else {
                    dojo.publish('/entity/activityAttendee/primaryChanged', [entity, this]);
                }
            },
            _primaryUnChecked: function (entity) {
                if (this.currentPrimaryEntityId !== entityId) {
                    console.log("new primary");
                } else {
                    console.log("");
                }
            },
            _getTimeZoneDisplayName: function (keyName) {
                var displayName = keyName;
                if (this._timeZones && this._timeZones.length > 0) {
                    var obj = this._timeZones.filter(function (val) {
                        return val.Keyname === keyName;
                    });
                    if (obj && obj[0]) {
                        displayName = obj[0].Displayname;
                    }
                }
                return displayName;
            },
            _buildGrid: function (readOnly) {
                //define the tools: an "add" button that calls our custom addItem and use the default "delete" functionality.
                var tools = [];
                tools = [
                    {
                        id: 'attendeeSpeedSearch',
                        imageClass: 'icon_plus_16x16',
                        handler: this.speedSearch,
                        tooltip: this.tooltip_speedSearch,
                        scope: this
                    },
                     {
                         id: 'attendeeAddContact',
                         imageClass: 'icon_Contact_Lookup_16x23',
                         //icon: './images/icons/Contact_Lookup_16x23.png',
                         handler: this.lookupContacts,
                         tooltip: this.tooltip_AddContact,
                         scope: this
                     },
                    {
                        id: 'attendeeeAddLead',
                        imageClass: 'icon_Lead_Lookup_16x23',
                        //icon: './images/icons/Lead_Lookup_16x23.png',
                        handler: this.lookupLeads,
                        tooltip: this.tooltip_AddLead,
                        scope: this
                    },
                    {
                        id: 'attendeeDelete',
                        imageClass: 'icon_Delete_16x16',
                        handler: this.deleteAttendees,
                        tooltip: this.tooltip_Delete,
                        scope: this
                    }
                ];

                var self1 = this;
                var onComplete = function (data, context) {
                    array.forEach(data, function (item, i) {
                        if (item["IsPrimary"]) {
                            this.currentPrimaryEntityId = item["EntityId"];
                        }
                        if (item["TimeZone"]) {
                            item["TimeZone"] = self1._getTimeZoneDisplayName(item["TimeZone"]);
                        }
                        //Rebind the edited but unsaved roles (to preserve the changed values between tab clicks)
                        if (self1._grid && self1._grid.mode !== "insert" && self1._grid.store && self1._grid.store.dirtyDataCache.isDirty) {
                            if (self1._grid.store.dirtyDataCache[item["$key"]]) {
                                item["RoleName"] = self1._grid.store.dirtyDataCache[item["$key"]]["RoleName"];
                                item["IsPrimary"] = self1._grid.store.dirtyDataCache[item["$key"]]["IsPrimary"];
                                item["IsAttendee"] = self1._grid.store.dirtyDataCache[item["$key"]]["IsAttendee"];
                            }
                        }

                    });
                };
                var onDataChange = function (entity, field, newValue) {
                    return;
                };


                declare("Sage.Extensions.Activity.primaryContactCheckBox1", dojox.grid.cells.Bool, {
                    format: function (index, inItem) {
                        var value = Sage.Utility.getValue(inItem, "IsPrimary");
                        var checkbox = '<input type="checkbox" disabled="disabled" />';
                        if (value) {
                            checkbox = '<input type="checkbox" checked="checked" disabled="disabled" />';
                        }
                        return checkbox;
                    }
                });

                declare("Sage.Extensions.Activity.isAttendeeCheckBox1", dojox.grid.cells.Bool, {
                    format: function (index, inItem) {
                        var value = Sage.Utility.getValue(inItem, "IsAttendee");
                        var checkbox = '<input type="checkbox" disabled="disabled" />';
                        if (value) {
                            checkbox = '<input type="checkbox" checked="checked" disabled="disabled" />';
                        }
                        return checkbox;
                    }
                });

                var primaryColumn = {};
                var roleColumn = {};
                var isAttendeeColumn = {};
                if (readOnly) {
                    primaryColumn = {
                        field: 'IsPrimary',
                        name: this.header_Primary,
                        width: '40px',
                        type: Sage.Extensions.Activity.primaryContactCheckBox1
                    };
                    roleColumn = {
                        field: 'RoleName',
                        name: this.header_RoleName
                    };
                    isAttendeeColumn = {
                        field: 'IsAttendee',
                        name: this.header_Attendee,
                        width: '70px',
                        type: Sage.Extensions.Activity.isAttendeeCheckBox1
                    };
                } else {
                    primaryColumn = {
                        field: 'IsPrimary',
                        name: this.header_Primary,
                        width: '40px',
                        editable: true,
                        radioType: 'group',
                        type: Sage.Extensions.UI.Columns.CheckBox,
                        checkBoxClicked: this.primaryClicked

                    };
                    roleColumn = {
                        field: 'RoleName',
                        name: this.header_RoleName,
                        pickListName: 'Attendee Role',
                        width: '130px',
                        type: Sage.Extensions.UI.Columns.PickListSelect,
                        options: ["Decison Maker", "Gate Keeper", "Other"],
                        editable: true
                    };
                    isAttendeeColumn = {
                        field: 'IsAttendee',
                        name: this.header_Attendee,
                        width: '70px',
                        editable: true,
                        radioType: 'group',
                        type: dojox.grid.cells.Bool

                    };
                }


                //define the columns:
                var columns = [
                    {
                        field: 'Name',
                        name: this.header_Name,
                        width: '150px',
                        editable: false
                    }, {
                        field: 'AccountName',
                        name: this.header_AccountName,
                        width: '150px',
                        editable: false
                    }, {
                        field: 'EntityType',
                        name: this.header_Type,
                        width: '60px',
                        editable: false
                    },
                    primaryColumn,
                    roleColumn,
                    isAttendeeColumn,
                    {
                        field: 'PhoneNumber',
                        name: this.header_Phone,
                        width: '100px',
                        editable: false
                    }, {
                        field: 'Email',
                        name: this.header_Email,
                        width: '150px',
                        editable: false
                    }, {
                        field: 'TimeZone',
                        name: this.header_TimeZone,
                        width: '150px',
                        editable: false
                    }

                ];

                var actid = activityUtility.getCurrentActivityId();
                this._activityId = this._activityId || actid;

                //set up the rest of the grid options:
                var options = {
                    columns: columns,
                    tools: tools,
                    storeOptions: {
                        service: sDataServiceRegistry.getSDataService('dynamic'),
                        resourceKind: 'activityAttendees',
                        select: ['EntityType', 'EntityId', 'IsPrimary', 'Name', 'Description', 'Notes', 'AccountId', 'AccountName'],
                        sort: [{ attribute: 'Name' }],
                        //newItemParentReferenceProperty: 'Activity',
                        onDataChange: onDataChange,
                        onComplete: onComplete,
                        clearStoreCacheOnDelete: false


                    },
                    slxContext: { 'workspace': '', tabId: '' },
                    contextualCondition: function () {
                        // console.log('contextualCondition' + 'Activity.id eq \'' + self._activityId + '\'');
                        var actId = self1._activityId;
                        if (actId && actId.length > 12) {
                            actId = actId.substr(0, 12);
                        }
                        return 'Activity.id eq \'' + actId + '\'';
                    },
                    id: this.id + '_attendees',
                    rowsPerPage: 40,
                    singleClickEdit: false,
                    enableCheckBoxSelection: false,
                    selectionMode: 'single'


                };

                if (readOnly) {
                    options.readOnly = true;
                }

                //setting it to insert mode will have it use the writableStore.  This prevents the new
                // items from being posted to the server without the relationship to Activity.  When the
                // activity is saved, we will add the relationship and save the items at that point.


                if (this.editorMode.indexOf('New') == 0 || this.editorMode === "CompleteUnscheduled") {
                    options.storeOptions['isInsertMode'] = true;
                }
                //create the grid
                var grid = new SlxPreviewGrid.Grid(options, this._attendeesGridPlaceholder);

                grid.setSortColumn('Name');
                this._grid = grid._grid;
                var self = this;

                dojo.connect(this._grid, 'onBlur', function () {
                    if (self._grid.mode != "insert" && self._grid.store.dirtyDataCache.isDirty) {
                        //alert("unsaved data");
                        //   self._grid.saveChanges();
                    }
                });


                //...and start it up
                grid.startup();

                //The "unsaved Data" message is not cleared as the "dirtyDataMsgID" is empty, overriding the method from EditableGrid.js
                this._grid.markClean = function () {
                    if (this.dirtyDataMsgID) {
                        var dirtyDataMsg = dojo.byId(this.dirtyDataMsgID);
                        if (dirtyDataMsg) {
                            dojo.style(dojo.byId(this.dirtyDataMsgID), 'display', 'none');
                        }
                    }
                    var bindingMgr = Sage.Services.getService('ClientBindingManagerService');
                    if (bindingMgr) {
                        bindingMgr.clearDirtyAjaxItem(this.id);
                    }
                };


                this._grid.markDirty = function () {
                    //Do not show the *unsaved message on top of the page
                };


                dojo.connect(this._grid, "_onFetchComplete", function () {

                    if (self._grid.mode != "insert" && self._uncheckItem) {
                        //var chkBoxId = 'chk_IsPrimary_' + self._uncheckItem.EntityId;
                        //console.log("checkbox click" + self._uncheckItem.Name);
                        //dojo.byId(chkBoxId).click();
                    }
                    //Add the primary contact to grid 
                    if (self._initialPrimaryContact && self._gridStarted) {
                        //console.log("self._addPrimaryContact");
                        self._addPrimaryContact();
                    }

                });
            },

            //Add Contact User to availability tab 
            _addMemberToAvailabilityTab: function (memberData) {
                var members = [];
                members.push(memberData);
                this.actEditor.addMembers(members);
            },

            disableGrid: function () {
                this._grid.readOnly = true;
                this._grid.refresh();
            },
            //our handler for the "add" button
            saveGridChanges: function (callback) {
                //If we are not in insert mode, we should save existing changes before creating new items.
                //This prevents loss of data.  After the data is saved, we can create the new item.
                if (this._grid.mode !== 'insert') {
                    this._grid.saveChanges(lang.hitch(this, callback));
                } else {
                    callback();
                }
            },

            //Contact and Lead look up 
            speedSearch: function () {
                var self = this;
                this._speedSearchLookup = new SpeedSearchLookup();
                this._speedSearchLookup.showLookup();

                this._speedSearchLookup.doSelected = function (items) {
                    self._processLookupResults(items);
                }
            },
            lookupContacts: function () {
                this.lup_Contact.seedProperty = 'Account.Id',
                this.lup_Contact.seedValue = this.actEditor._activityData.AccountId;
                this.lup_Contact.query.conditions = '';
                this.lup_Contact.buildSDataStoreQueryForSeeding();
                this.lup_Contact._originalQueryConditions = this.lup_Contact.query.conditions;
                this.lup_Contact.cancelText = this.lup_Contact.closeText;
                this.lup_Contact.overrideSeedValueOnSearch = true;
                this.lup_Contact.showLookup();
                var handle = dojo.connect(this.lup_Contact.lookupDialog, 'onHide', this.lup_Contact, function () {
                    dojo.disconnect(handle);
                    if (this.seedValue) {
                        this.resetGrid();
                    }
                });

            },
            lookupLeads: function () {
                this.lup_Lead.query.conditions = '';
                this.lup_Lead.buildSDataStoreQueryForSeeding();
                this.lup_Lead._originalQueryConditions = this.lup_Lead.query.conditions;
                this.lup_Lead.cancelText = this.lup_Lead.closeText;
                this.lup_Lead.showLookup();
            },
            //Callback method for Grid toolbar delete button
            deleteAttendees: function () {
                var selectedItems = this._grid.selection.getSelected();
                var self = this;
                this._grid.deleteSelected(function () {
                    if (selectedItems) {
                        for (var i = 0; i < selectedItems.length; i++) {
                            var selectedItem = selectedItems[i];

                            //Remove the Contact/Lead from General Tab if the deleted attendee is Primary
                            if (selectedItem.IsPrimary) {
                                selectedItem['attendeeTab'] = true;
                                selectedItem['PrimaryChecked'] = false;
                                dojo.publish('/entity/activityAttendee/primaryChanged', [selectedItem, this]);
                            }

                            //Remove the associated user from Availability tab 
                            if (selectedItems[i].EntityType == 'Contact') {
                                var userId = self._checkUserContactAssociation(selectedItems[i].EntityId);
                                if (userId) {
                                    var args = { "memberId": userId, "attendeesTab": true };
                                    self.actEditor._removeMember(args);
                                }
                            }

                            if (i == selectedItems.length - 1) {
                                dojo.publish('/entity/activityAttendee/delete', [null, this]);
                            }
                        }
                    }

                });

            },
            _attendeeExists: function (entityId) {
                var count = this._grid.rowCount;
                for (var i = 0; i < count; i++) {
                    var item = this._grid.getItem(i);
                    if (item.EntityId === entityId) {
                        return true;
                    }
                }
                return false;
            },
            resetPrimary: function (entityId) {
                var count = this._grid.rowCount;
                for (var i = 0; i < count; i++) {
                    var item = this._grid.getItem(i);
                    if (item.EntityId !== entityId) {
                        item.IsPrimary = false;
                    }
                }
            },

            unCheckPrimary: function (entityId) {
                if (this._grid.mode == "insert") {
                    this.resetPrimary();
                } else {
                    var count = this._grid.rowCount;
                    for (var i = 0; i < count; i++) {
                        var item = this._grid.getItem(i);
                        if (item.IsPrimary) {
                            //If edit mode, store the item to be unchecked and do the uncheck after the grid refreshes
                            this._uncheckItem = item;
                        }
                    }
                }
            },
            resetRows: function (grid, rowIndex, inAttrName, currentItem) {

                var count = grid.rowCount;
                for (var i = 0; i < count; i++) {
                    var item = grid.getItem(i);
                    if (item && item.EntityId !== currentItem.EntityId) {
                        var chkBoxId = 'chk_' + this.field + '_' + item.EntityId;
                        dojo.byId(chkBoxId).checked = false;
                        grid.store.setValue(item, inAttrName, false);
                    } else if (item && item.EntityId === currentItem.EntityId) {
                        var chkBoxId = 'chk_' + this.field + '_' + item.EntityId;
                        //dojo.byId(chkBoxId).checked = false;
                        grid.store.setValue(item, inAttrName, true);
                    }
                }

            },
            resetEntityContext: function () {
                var parentRelationshipName = this.parentRelationshipName;
                var entityId = utility.getCurrentEntityId();
                if (parentRelationshipName === 'activityId') {
                    entityId = entityId.substr(0, 12); // for reoccuring activity Ids;
                }
                var contextualCondition = function () {
                    return (parentRelationshipName || '\'A\'') + ' eq \'' + entityId + '\'';
                };
                this._previewGrid.resetContextualCondition(contextualCondition);
                this.refresh();
            },
            //Process result data retrieved from Speed Search look up and update the Grid
            _processLookupResults: function (results) {
                var attendees = [];
                var leadAttendees = [];
                for (var i = 0; i < results.length; i++) {
                    if (!this._attendeeExists(results[i].$key)) {
                        attendees.push(this._setAttendeeEntity(results[i]));
                        if (results[i].type == "Contact") {
                            this._getSlxAssociation("Contact", results[i].$key, null, function (data) {
                                if (data && data.length > 0 && data[0].UserId) {
                                    this._updateUserContactList(data[0].UserId, data[0].ContactId);
                                    this._getResourceData(utility.getClientContextByKey('userID'), data[0].UserId, this._addMemberToAvailabilityTab, this);
                                }
                            }, this);
                        }
                    }
                }
                if (attendees.length > 0) {
                    this._addAttendeesToStore(attendees);
                }

            },
            //Process result data retrieved from Contact Look up and update the Grid
            _processContactLookupResults: function (results) {
                var contactAttendees = [];
                for (var i = 0; i < results.length; i++) {
                    if (!this._attendeeExists(results[i].$key)) {
                        results[i].EntityType = 'Contact';
                        var _attendee = this._setAttendeeEntityFromContactLead("Contact", results[i]);
                        _attendee["IsAttendee"] = true;
                        contactAttendees.push(_attendee);
                        results[i].New = true;
                    }
                }
                if (contactAttendees.length > 0) {
                    this._addAttendeesToStore(contactAttendees);
                }

                for (var i = 0; i < results.length; i++) {
                    //Check if Contact is associated with User, if so, add the associated user to Availability tab
                    if (results[i].New && results[i].ContactUser && results[i].ContactUser.$resources && results[i].ContactUser.$resources.length > 0) {
                        this._updateUserContactList(results[i].ContactUser.$resources[0].UserId, results[i].$key);
                        this._getResourceData(utility.getClientContextByKey('userID'), results[i].ContactUser.$resources[0].UserId, this._addMemberToAvailabilityTab, this);
                    }
                }
            },
            //Process result data retrieved from Lead Look up and update the Grid
            _processLeadLookupResults: function (results) {
                var leadAttendees = [];
                for (var i = 0; i < results.length; i++) {
                    if (!this._attendeeExists(results[i].$key)) {
                        results[i].EntityType = 'Lead';
                        var _attendee = this._setAttendeeEntityFromContactLead("Lead", results[i]);
                        _attendee["IsAttendee"] = true;
                        leadAttendees.push(_attendee);
                    }
                }
                if (leadAttendees.length > 0) {
                    this._addAttendeesToStore(leadAttendees);
                }

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
            _setAttendeeEntity: function (results) {
                var attendeeEntity = {};
                attendeeEntity.EntityType = results.type;
                attendeeEntity.EntityId = results.$key;
                attendeeEntity.IsPrimary = false;
                attendeeEntity.Name = results.$descriptor;
                attendeeEntity.AccountName = this.getFieldValue(results.fields, 'account');
                attendeeEntity.Email = this.getFieldValue(results.fields, 'email');
                attendeeEntity.Description = "";
                attendeeEntity.Notes = "";
                attendeeEntity.TimeZone = "";
                attendeeEntity.PhoneNumber = this.getFieldValue(results.fields, 'phone');
                attendeeEntity.RoleName = "";
                attendeeEntity.general = false;
                attendeeEntity.IsAttendee = true;
                return attendeeEntity;
            },
            _setAttendeeEntityFromContactLead: function (type, results) {
                var attendeeEntity = false;
                if (results && results.$key) {
                    attendeeEntity = {};
                    attendeeEntity.EntityType = type;
                    attendeeEntity.EntityId = results.$key;
                    attendeeEntity.$key = results.$key;
                    attendeeEntity.IsPrimary = false;
                    attendeeEntity.Name = results.$descriptor;
                    attendeeEntity.$descriptor = results.$descriptor;
                    attendeeEntity.Account = results.Account;
                    attendeeEntity.AccountName = results.AccountName || results.Company;
                    if (type == "Lead") {
                        attendeeEntity.Company = results.Company;
                        attendeeEntity.LeadFullName = results.$descriptor;
                    }
                    attendeeEntity.Company = results.Company;
                    attendeeEntity.Email = results.Email;
                    attendeeEntity.Description = "";
                    attendeeEntity.Notes = "";
                    if (results.Address) {
                        attendeeEntity.TimeZone = results.Address.TimeZone;
                        if (attendeeEntity.TimeZone) {
                            attendeeEntity.TimeZone = this._getTimeZoneDisplayName(attendeeEntity.TimeZone);
                        }
                    }
                    attendeeEntity.PhoneNumber = results.WorkPhone;
                    attendeeEntity.RoleName = "";
                    attendeeEntity.general = false;

                }
                return attendeeEntity;
            },
            //Get Current user's security access to the given User Id 
            _getResourceData: function (currentUserId, accessTo, callback, scope) {
                this.accessData = false;
                if (!this._accessStore) {
                    this._accessStore = new SingleEntrySDataStore({
                        include: ['$descriptors'],
                        resourceKind: 'activityresourceviews',
                        service: sDataServiceRegistry.getSDataService('dynamic')
                    });
                }
                this._accessStore.fetch({
                    predicate: "'" + accessTo + "-" + currentUserId + "'",
                    onComplete: function (accessData) {
                        callback.call(scope, accessData);
                    },
                    onError: function () {
                        callback.call(scope, null);
                    },
                    scope: this
                });
            },

            //Check if the Contact/User is associated
            _getSlxAssociation: function (type, entityId, scopeObj, callback, scope) {
                this.accessData = false;
                if (!this._associationStore) {
                    this._associationStore = new WritableSDataStore({
                        include: ['$descriptors'],
                        resourceKind: 'contactusers',
                        select: ['UserId', 'ContactId', 'Contact/Name', 'Contact/Email', 'Contact/WorkPhone', 'Contact/AccountName', 'User/Name'],
                        service: sDataServiceRegistry.getSDataService('dynamic')

                    });
                }
                var _query = "";
                if (type == "Contact") {
                    _query = dstring.substitute('ContactId eq \'${0}\' ', [entityId]);
                } else if (type == 'User') {
                    _query = dstring.substitute('UserId eq \'${0}\' ', [entityId]);
                }
                this._associationStore.fetch({

                    query: _query,

                    //predicate: "'" + accessTo + "-" + currentUserId + "'",
                    onComplete: function (accessData) {
                        callback.call(scope, accessData, scopeObj);
                    },
                    onError: function () {
                        callback.call(scope, null);
                    },
                    scope: this
                });
            },
            //Maintain a local list of Contact User association
            _updateUserContactList: function (userId, contactId) {
                if (!this.userContactList[userId]) {
                    this.userContactList[userId] = { "UserId": userId, "ContactId": contactId };
                }
            },
            //Verify if the provided ContactIs has associated UserId
            _checkUserContactAssociation: function (contactId) {
                var userId = false;
                if (this.userContactList) {
                    for (var i in this.userContactList) {
                        if (this.userContactList[i]["ContactId"] == contactId) {
                            userId = this.userContactList[i]["UserId"];
                            break;
                        }
                    }
                }
                return userId;
            },


            /**         
            * Gets called when members are added to Availability Tab.    
            * If the member has associated Contact, add it to Attendees Tab.
            * @param {String} userIds String array of Userids    
            */
            _addContactAttendees: function (userIds) {

                var deferredArray = [];
                var len = userIds.length;
                var self = this;

                for (var i = 0; i < len; i++) {
                    deferredArray.push(this._getAssociationData(userIds[i]));
                }

                var deferredList = new DeferredList(deferredArray);

                //After checking all the userIds, add it to the store
                deferredList.then(function (result) {
                    for (var j = 0; j < result.length; j++) {
                        if (result[j][1]) {
                            self.userContactAttendees.push(result[j][1]);
                        }
                    }
                    self._addAttendeesToStore(self.userContactAttendees);
                    self.userContactAttendees = [];
                });
            },
            /**         
            * Deferred method to get the assciation data if exists.    
            * If the member has associated Contact, add it to Attendees Tab.
            * @param {String} userId    
            */
            _getAssociationData: function (userId) {
                var d = new Deferred();
                var scopeObj = { "last": false };
                //var self = this;
                this._getSlxAssociation("User", userId, scopeObj, function (data, scope) {
                    if (data && data.length > 0) {
                        var attendeeEntity = null;
                        if (data[0].Contact) {
                            this._updateUserContactList(data[0].UserId, data[0].ContactId);
                            attendeeEntity = this._setAttendeeEntityFromContactLead('Contact', data[0].Contact);
                        }
                        d.resolve(attendeeEntity);
                    }
                }, this);

                return d;
            },

            _addPrimaryContact: function (contact) {
                if (this._initialPrimaryContact) {
                    if (!this._attendeeExists(this._initialPrimaryContact["$key"])) {
                        this._addContactAttendee(this._initialPrimaryContact);
                    }
                }
                this._initialPrimaryContact = false;
            },

            /**         
            * Event listener for General Tab Contact update. 
            * @param {object} contact    
            */
            _addContactAttendee: function (contact) {
                var attendees = [];
                var attendee = null;
                if (contact) {
                    this.resetPrimary(contact['$key']);

                    if (this._grid.mode !== "insert") {
                        //    this._grid.saveChanges();
                    }
                    if (contact.Account) {
                        contact.AccountName = contact.Account.AccountName;
                        attendee = this._setAttendeeEntityFromContactLead('Contact', contact);
                        attendee.IsPrimary = true;
                        attendee.general = true;
                        attendees.push(attendee);
                        // this.saveGridChanges(this._addAttendeesToStore(attendees, true));
                        this._addAttendeesToStore(attendees, true);
                    } else {
                        // this._removeContactAttendee();
                        activityUtility._getContactData(contact.$key, function (data) {
                            if (data) {
                                attendee = this._setAttendeeEntityFromContactLead('Contact', data);
                                attendee.IsPrimary = true;
                                attendee.general = true;
                                attendees.push(attendee);
                                //this.saveGridChanges(this._addAttendeesToStore(attendees, true));
                                this._addAttendeesToStore(attendees, true);
                            }
                        }, this);
                    }
                }
            },
            _addLeadAttendee: function (lead) {
                var attendees = [];
                var attendee = null;
                if (lead) {
                    this.resetPrimary(lead['$key']);
                    if (!lead.Email && !lead.WorkPhone) {
                        this._removeLeadAttendee();
                        activityUtility._getLeadData(lead.$key, function (data) {
                            if (data) {
                                attendee = this._setAttendeeEntityFromContactLead('Lead', data);
                                attendee.general = true;
                                attendee.IsPrimary = true;
                                attendees.push(attendee);
                                this._addAttendeesToStore(attendees, true);
                            }
                        }, this);
                    } else {
                        attendee = this._setAttendeeEntityFromContactLead('Lead', lead);
                        attendee.general = true;
                        attendee.IsPrimary = true;
                        attendees.push(attendee);
                        this._addAttendeesToStore(attendees, true);
                    }
                }
            },
            _removeAssociatedContact: function (userId) {
                if (this.userContactList[userId]) {
                    var self = this;
                    var contactId = this.userContactList[userId]["ContactId"];
                    var count = this._grid.rowCount;
                    for (var i = 0; i < count; i++) {
                        var item = this._grid.getItem(i);
                        if (item.EntityId === contactId) {

                            self._grid.store.deleteItem(item);

                            if (item.IsPrimary) {
                                item['attendeeTab'] = true;
                                item['PrimaryChecked'] = false;
                                dojo.publish('/entity/activityAttendee/primaryChanged', [item, this]);
                            }
                            break;
                        }
                    }
                }
            },

            checkStoreItem: function (entityId) {
                var self = this;
                var deferred = new Deferred();

                this._grid.store.fetch({
                    onComplete: function (items) {
                        var storeItem = false;
                        dojo.forEach(items, function (item, index) {
                            if (item && item.EntityId == entityId) {
                                storeItem = true;
                            }
                        });
                        deferred.resolve(storeItem);
                    }
                });
                return deferred;
            },

            _removeContactAttendee: function () {
                var self = this;
                this._grid.store.fetch({
                    onComplete: function (items) {
                        dojo.forEach(items, function (item, index) {
                            if (item && item.general && item.EntityType == "Contact") {
                                self._grid.store.deleteItem(item);
                            }
                        })
                    }
                });
            },
            _removeLeadAttendee: function () {
                var self = this;
                this._grid.store.fetch({
                    onComplete: function (items) {
                        dojo.forEach(items, function (item, index) {
                            if (item && item.general && item.EntityType == "Lead") {
                                self._grid.store.deleteItem(item);
                            }
                        })
                    }
                });
            },


            _addLeadAttendees: function (leadIds) {

                var grid = this._grid;
                var service = Sage.Data.SDataServiceRegistry.getSDataService('dynamic');
                var fnAdd = function () {

                    var request = new Sage.SData.Client.SDataServiceOperationRequest(service)
                       .setResourceKind('activities')
                       .setOperationName('AddLeadAttendees');
                    var actId = utility.getCurrentEntityId();;
                    var entry = {
                        "$name": "AddLeadAttendees",
                        "request": {
                            "ActivityId": actId,
                            "leadIds": leadIds.join()

                        }
                    };
                    request.execute(entry, {
                        success: function (result) {
                            grid.refresh();

                        },
                        failure: function (result) {
                            Sage.UI.Dialogs.showError(dojo.string.substitute("Error adding lead attendees", [result]));
                            grid.refresh();
                        }
                    });

                };
                if (leadIds.length > 0) {
                    grid.showLoading();
                    fnAdd();
                }
            },
            _getNewContactAttendees: function () {

                return this._newItems;

            },
            setInitialPrimaryContact: function (contact) {

                this._initialPrimaryContact = contact;
            },
            refreshGrid: function () {
                this._grid.saveChanges();
                this._grid.refresh();

            },
            _addAttendeesToStore: function (attendees, fromGeneralTab) {
                var actid = utility.getCurrentEntityId();
                var updated = false;
                var self = this;

                if (this._grid.mode === 'insert' || !actid) {
                    var newAttendees = [];
                    for (var i = 0; i < attendees.length; i++) {
                        var attendee = attendees[i];
                        if (!this._attendeeExists(attendee.EntityId)) {
                            var index = -1;
                            for (var j = 0, len = this._newItems.length; j < len; j++) {
                                if (this._newItems[j]["$key"] === attendee.EntityId) {
                                    index = j;
                                    break;
                                }
                            }
                            if (index === -1) {
                                this._newItems.push(attendee);
                            }
                            newAttendees.push(attendee);
                        }
                    }
                    //if we are inserting the activity, just let the WritableStore cache it, we'll POST it later
                    this._grid.store.addItemsToCache(this, newAttendees);

                } else {
                    //if we are not in insert mode, the grid will have a WritableSDataStore, let it save the 
                    //new item now so the refresh below will get the item.      
                    var deferredArray = [];
                    //console.log("_addAttendeesToStore call deferred :");
                    for (var i = 0; i < attendees.length; i++) {
                        var attendee = attendees[i];
                        attendee["Account"] = null;
                        if (!this._attendeeExists(attendee.EntityId)) {
                            this._newItems.push(attendee);
                            attendee.Activity = { '$key': actid };
                            deferredArray.push(this._saveGridActivityAttendee(attendee));
                        }
                    }
                    var d1 = new DeferredList(deferredArray);
                    d1.then(function (results) {
                        //console.log("_addAttendeesToStore resolved :");
                        dojo.publish('/entity/activityAttendee/add', [results.length, this]);

                        if (fromGeneralTab && attendees && attendees.length > 0) {
                            //  self.resetPrimary(attendees[0]['EntityId']);
                        }
                    });
                }
                this._grid.refresh();
            },

            _saveGridActivityAttendee: function (attendee) {
                var d = new Deferred();
                this._grid.store.saveNewEntity(attendee, function () {
                    //console.log("_saveGridActivityAttendee success :" + attendee.$key);
                    d.resolve("success");
                }, function () {
                    //console.log("_saveGridActivityAttendee failure :" + attendee.$key);
                    d.resolve("success");
                },
                this);
                return d;
            },

            _addAdhocAttendee: function () {
                this._grid.store.newItem({
                    onComplete: function (attendee) {
                        //After the datastore has created the item for us, we can set the relationship property
                        var actid = utility.getCurrentEntityId();
                        if (!actid) {
                            actid = this.actEditor._makeTempID();
                        }
                        attendee.Activity = { '$key': actid };
                        //Set a default item order for this agenda item
                        //association.ItemOrder = this._grid.rowCount + 1;
                        //Add it to our list of new agenda items
                        this._newItems.push(association);
                        if (this._grid.mode === 'insert') {
                            //if we are inserting the activity, just let the WritableStore cache it, we'll POST it later
                            this._grid.store.addToCache(this, attendee, 1);
                        } else {
                            //if we are not in insert mode, the grid will have a WritableSDataStore, let it save the 
                            //new item now so the refresh below will get the item.
                            this._grid.store.saveNewEntity(attendee);
                        }
                        //refresh the list so we see the new item.
                        this._grid.refresh();
                    },
                    scope: this
                });
            },
            //Handler for when activities are saved (new or changed)
            _activitySaved: function (activity) {
                var deferred = new Deferred();
                //console.log("_activitySaved1");

                if (this._grid.mode === 'insert') {
                    //If the grid is in insert mode, the activity was a new one so we need to set the 
                    // relationship to the new Activity Id and then POST them
                    var actid = activity['$key'];
                    var count = 0;
                    var deferredArray = [];
                    var primaryAttendee = null;
                    for (var i = 0; i < this._newItems.length; i++) {
                        count = i;
                        var itm = this._newItems[i];
                        itm["Account"] = null;
                        itm['Activity'] = { '$key': actid };

                        if (!itm["IsPrimary"]) {
                            //POST ActivityAttendee only if it is non primary
                            //Add it to deferred array to excecute
                            deferredArray.push(this._saveActivityAttendee(itm));
                        } else {
                            //UPDATE activity attendee if its primary
                            primaryAttendee = itm;
                        }
                    }

                    this._newItems = [];
                    // create a DeferredList to aggregate the state
                    //Wait until all the activity attendees getting saved, to get the correct count on the activity list view
                    var d1 = new DeferredList(deferredArray);
                    d1.then(function (results) {
                        deferred.resolve({ success: true });
                    });

                    if (primaryAttendee) {
                        //The primary Contact/Lead wil get inserted as part of Activity Insert by business rules
                        //We need to update the columns isAttendee and Rolename
                        this._updatePrimaryAttendee(primaryAttendee, actid);
                    }

                } else {
                    //Because the grid was not in insert mode, the items had the correct relationship
                    // we just need to PUT and data changes that happened.
                    this._grid.saveChanges();
                    deferred.resolve({ success: true });
                    this._newItems = [];
                    this._uncheckItem = null;
                }

                return deferred;
            },

            _updatePrimaryAttendee: function (attendee, activityId) {
                var service = Sage.Data.SDataServiceRegistry.getSDataService('dynamic');
                var request = new Sage.SData.Client.SDataServiceOperationRequest(service)
                    .setResourceKind('activities')
                    .setOperationName('UpdatePrimaryActivityAttendee');
                var entry = {
                    "$name": "UpdatePrimaryActivityAttendee",
                    "request": {
                        "ActivityId": activityId,
                        "entityId": attendee.EntityId,
                        "isAttendee": attendee.IsAttendee,
                        "roleName": attendee.RoleName
                    }
                };
                request.execute(entry, {
                    success: function (result) {

                    },
                    failure: function (ex) {
                        console.log("failed to Update Attendee");
                    },
                    scope: this
                });
            },


            //Handler for history created 
            _historySaved: function (history) {
                var deferred = new Deferred();
                //console.log("_activitySaved1");

                if (this._grid.mode === 'insert') {
                    //If the grid is in insert mode, the activity was a new one so we need to set the 
                    // relationship to the new Activity Id and then POST them
                    var histid = history['$key'];
                    var count = 0;
                    var deferredArray = [];
                    var entityId = "";
                    for (var i = 0; i < this._newItems.length; i++) {
                        count = i;
                        var itm = this._newItems[i];
                        itm["Account"] = null;
                        itm['History'] = { '$key': histid };

                        if (entityId !== itm["EntityId"]) {
                            //Add it to deferred array to excecute
                            deferredArray.push(this._saveHistoryAttendee(itm));
                            entityId = itm["EntityId"];
                        }

                    }

                    this._newItems = [];
                    // create a DeferredList to aggregate the state
                    //Wait until all the activity attendees getting saved, to get the correct count on the activity list view
                    var d1 = new DeferredList(deferredArray);
                    d1.then(function (results) {
                        deferred.resolve({ success: true });
                    });

                }

                return deferred;
            },
            _saveActivityAttendee: function (itm) {
                var d = new Deferred();
                var self = this;
                var req = new Sage.SData.Client.SDataSingleResourceRequest(sDataServiceRegistry.getSDataService('dynamic'))
                           .setResourceKind('activityAttendees')
                           .create(itm, {
                               success: function () {
                                   d.resolve("success");
                               },
                               failure: function () {
                                   console.log('item did not save');
                               },
                               scope: this
                           });
                return d;
            },
            _saveHistoryAttendee: function (itm) {
                var d = new Deferred();
                var self = this;
                var req = new Sage.SData.Client.SDataSingleResourceRequest(sDataServiceRegistry.getSDataService('dynamic'))
                           .setResourceKind('historyAttendees')
                           .create(itm, {
                               success: function () {
                                   d.resolve("success");
                               },
                               failure: function () {
                                   console.log('item did not save');
                               },
                               scope: this
                           });
                return d;
            },

            //Handler for when the activity dialog closes
            _dialogHide: function () {
                //just a little house cleaning.
                this._newItems = [];
                this._grid.store.clearCache();
                this._grid._clearData();
                this._grid.markClean();
                this._uncheckItem = null;
                this._gridStarted = false;
            },
            destroy: function () {
                this.lup_Contact.destroy();
                this.lup_Lead.destroy();
                this._gridStarted = false;
                this.inherited(arguments);
            },
            //Handler for when the tab is opened.
            _tabShow: function () {
                if (this._grid) {

                    //check to see if the activity is a new one or not so we can set the grid
                    // to be in the correct "mode".
                    var gridmode = this._grid.get('mode');
                    if (this.editorMode.indexOf('New') == 0 || !this._activityId) {
                        this._grid.set('mode', 'insert');
                    } else {
                        this._grid.set('mode', '');
                    }

                    this._grid.refresh();
                    if (this.lup_Contact) {
                        this.lup_Contact.resetGrid();
                        this.lup_Contact.destroy();

                    }

                    if (this.lup_Lead) {
                        this.lup_Lead.resetGrid();
                        this.lup_Lead.destroy();
                    }

                    this.createLookups();
                    this._gridStarted = true;


                }
            },
            createLookups: function () {
                var srvc = Sage.Services.getService('LookupService');
                if (srvc) {
                    var self = this;
                    var contactLookup = srvc.getLookupInstance("Contact", "activityContactAttendee");
                    if (contactLookup) {

                        this.lup_Contact = contactLookup;
                        this.lup_Contact.doSelected = function (items) {
                            self._processContactLookupResults(items);
                            //this.lookupDialog.hide();
                        }
                    }
                    var leadLookup = srvc.getLookupInstance("Lead", "activityLeadAttendee");
                    if (leadLookup) {
                        this.lup_Lead = leadLookup;
                        leadLookup.doSelected = function (items) {
                            self._processLeadLookupResults(items);
                            //this.lookupDialog.hide();
                        }
                    }
                }
            },
            setToReadOnly: function (readOnly) {

                var disableList = ['attendeeSpeedSearch',
                                 'attendeeAddContact',
                                 'attendeeeAddLead',
                                 'attendeeDelete'
                ];
                this._bulkSetProperty(this, disableList, 'disabled', readOnly);
            },
            _bulkSetProperty: function (ui, propsList, prop, val) {
                for (var i = 0; i < propsList.length; i++) {
                    var ctrl = dijit.byId(propsList[i]);
                    if (ctrl) {
                        ctrl.set(prop, val);
                    }
                }
            }
        });

        return assocaitionsTab;
    });
