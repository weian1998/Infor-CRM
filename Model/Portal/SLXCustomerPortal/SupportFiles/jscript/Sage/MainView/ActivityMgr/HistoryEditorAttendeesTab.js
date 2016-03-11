/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define('Sage/MainView/ActivityMgr/HistoryEditorAttendeesTab', [
        'dojo',
        'dijit/_Widget',
        'Sage/_Templated',
        'dojo/_base/declare',
        'Sage/Data/SDataServiceRegistry',
        'Sage/Utility',
        'Sage/Utility/Activity',
        'Sage/UI/SLXPreviewGrid',
        'Sage/UI/EditableGrid',
        'Sage/UI/Columns/CheckBox',      
          'dijit/layout/ContentPane',
          'dojo/_base/array',
        'dojo/_base/lang',
        'dojo/i18n!./nls/HistoryEditorAttendeesTab'

    ],
    function (dojo, _Widget, _Templated, declare, sDataServiceRegistry, utility, activityUtility, SlxPreviewGrid, EditableGrid, CheckBox, ContentPane, array, lang, nlsStrings) {
        //The HistoryEditorAttendeesTab is a customization displaying how to add a tab to the activity dialog
        //  with a datagrid for adding and editing a collection of related entities.
        //The code to add it is below the declaration.
        var attendeesTab = declare('Sage.MainView.ActivityMgr.HistoryEditorAttendeesTab', [_Widget, _Templated], {
            histEditor: null,
            lup_Contact: null,
            lup_ContactConfig: null,
            lup_Lead: null,
            lup_LeadConfig: null,
            widgetsInTemplate: true,
            _timeZones : [],
            //the template for the tab content is simply a placeholder for the grid created in code

            constructor: function () {
                lang.mixin(this, nlsStrings);
                var self = this;
                if (this._timeZones.length == 0) {
                    Sage.Utility.getTimeZones(function (result) {
                        self._timeZones = result;
                    });
                }
            },

            widgetTemplate: new Simplate([
                '<div>',
                    '<div id="{%= $.id %}_hisAttendeesGridPlaceholder" dojoAttachPoint="_histAttendeesGridPlaceholder" style="width:100%;height:100%"></div>',
                '</div>'
            ]),
            //keep an internal list of new _attendee items as they are added
            _newItems: [],
            //this is called once by the code that adds the tab to the activity editor.
            //build the grid and connect event listeners for important events.
            startup: function () {
                //console.log("_attendeesTab startup");
                this._newItems = [];
                //this.actEditor = //dijit.byId('activityEditor');
                //if we cannot find the editor, we really cannot do much, don't create the grid
                if (!this.histEditor) {
                    return;
                }
                this._buildGrid();
                //when the dialog is hidden, we should clean up the data store and list of new items
                dojo.connect(this.histEditor, 'onHide', this, this._dialogHide);
                //listen for when activities are saved so we can ensure the correct relationships and save the agenda
                dojo.subscribe('/entity/history/create', this, this._historySaved);
                dojo.subscribe('/entity/history/change', this, this._historySaved);

                // this.createLookups();

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
            _buildGrid: function () {

                var self = this;
                declare("Sage.Extensions.Activity.primaryContactCheckBox", dojox.grid.cells.Bool, {
                    format: function (index, inItem) {
                        var value = Sage.Utility.getValue(inItem, "IsPrimary");
                        var checkbox = '<input type="checkbox" disabled="disabled" />';
                        if(value){
                            checkbox ='<input type="checkbox" checked="checked" disabled="disabled" />';
                        }
                        return checkbox;
                    }
                });

                declare("Sage.Extensions.Activity.isAttendeeCheckBox", dojox.grid.cells.Bool, {
                    format: function (index, inItem) {
                        var value = Sage.Utility.getValue(inItem, "IsAttendee");
                        var checkbox = '<input type="checkbox" disabled="disabled" />';
                        if (value) {
                            checkbox = '<input type="checkbox" checked="checked" disabled="disabled" />';
                        }
                        return checkbox;
                    }
                });

                declare("Sage.Extensions.Activity.AttendeeStatus", dojox.grid.cells.Select, {
                    format: function (index, inDatum) {
                        var value = Sage.Utility.getValue(inDatum, "IsAttendee");
                        if (value) {
                            return this.inherited(arguments);                           
                        } else {
                            return '';
                        }
                    }
                });
             
              

                var onComplete = function (data, context) {
                    array.forEach(data, function (item, i) {                     
                        if (item["TimeZone"]) {
                            item["TimeZone"] = self._getTimeZoneDisplayName(item["TimeZone"]);
                        }

                    });
                };
                //define the columns:
                var columns = [
                   {
                       field: 'Name',
                       name: this.header_Name,
                       width: '180px'
                   }, {
                       field: 'AccountName',
                       name: this.header_AccountName,
                       width: '180px'
                   }, {
                       field: 'EntityType',
                       name: this.header_Type,
                       width: '60px'
                   }, {
                       field: 'IsPrimary',
                       name: this.header_Primary,
                       width: '40px',
                       type:Sage.Extensions.Activity.primaryContactCheckBox
                     
                   },
                   {
                       field: 'IsAttendee',
                       name: this.header_Attendee,
                       width: '40px',
                       type: Sage.Extensions.Activity.isAttendeeCheckBox

                   }, {
                       field: 'Status',
                       name: this.header_Status,
                       width: '100px',                     
                       type: Sage.Extensions.Activity.AttendeeStatus,//dojox.grid.cells.Select,
                       options: ["Attended", "Not Attended", "Declined"],
                       values :["T","F","D"],                     
                       editable : true
                   }, {
                       field: 'RoleName',
                       name: this.header_RoleName
                       //type: new Sage.UI.Columns.PickList({pickListName : "Meeting Regarding"})
                   }, {
                       field: 'PhoneNumber',
                       name: this.header_Phone,
                       width: '80px'
                   }, {
                       field: 'Email',
                       name: this.header_Email,
                       width: '150px'
                   }, {
                       field: 'TimeZone',
                       name: this.header_TimeZone,
                       width: '150px'

                   }
                   /*, {
                       field: 'Note',
                       name: this.header_Notes,
                       width: '240px'
                   }    */              
                ];
                //set up the rest of the grid options:
                var options = {
                    columns: columns,
                    storeOptions: {
                        service: sDataServiceRegistry.getSDataService('dynamic'),
                        resourceKind: 'historyAttendees',
                        select: ['EntityType','EntityId','IsPrimary','IsAttendee','Name','Description','Notes','Status'],
                        sort: [{ attribute: 'Name'}],
                        newItemParentReferenceProperty: 'History',
                        onComplete: onComplete
                    },
                    slxContext: { 'workspace': '', tabId: '' },
                    contextualCondition: function () {                       
                        return 'HistoryId eq \'' + utility.getCurrentEntityId() + '\' and ((SLXUserAssociationId in (\'\',null) and EntityType eq \'User\') or (EntityType in (\'Contact\',\'Lead\')))';
                    },
                    id: this.id + '_histAttendees',
                    rowsPerPage: 40
                    //  singleClickEdit: true
                };

                //setting it to insert mode will have it use the writableStore.  This prevents the new
                // items from being posted to the server without the relationship to Activity.  When the
                // activity is saved, we will add the relationship and save the items at that point.
                var actid = utility.getCurrentEntityId();
                if (!actid) {
                    options.storeOptions['isInsertMode'] = true;
                }
                //create the grid
                var grid = new SlxPreviewGrid.Grid(options, this._histAttendeesGridPlaceholder);

                grid.setSortColumn('Name');
                this._grid = grid._grid;

                dojo.connect(this._grid, 'markDirty', function () {
                    var dirtyDataMsg = dojo.byId(this.dirtyDataMsgID);
                    if (dirtyDataMsg) {
                        dojo.style(dojo.byId(this.dirtyDataMsgID), 'display', 'none');
                    }
                    var bindingMgr = Sage.Services.getService('ClientBindingManagerService');
                    if (bindingMgr) {
                        bindingMgr.clearDirtyAjaxItem(this.id);
                    }
                });
                

                //...and start it up
                grid.startup();

            },
            //our handler for the "add" button
          

          
            //Handler for when the activity dialog closes
            _dialogHide: function () {
                //just a little house cleaning.
                this._newItems = [];
                this._grid.store.clearCache();
            },

            _tabfShow: function () {
                if (this._grid && !this.gridRefreshed) {
                    this._grid.refresh();
                    this.gridRefreshed = true;
                }
            },
            //Handler for when the tab is opened.
            _tabShowdd: function () {
                if (this._grid && !this.gridRefreshed) {

                    //check to see if the activity is a new one or not so we can set the grid
                    // to be in the correct "mode".
                    var gridmode = this._grid.get('mode');
                    var actid = utility.getCurrentEntityId();
                    if ((!actid && gridmode !== 'insert') || (actid && gridmode === 'insert')) {
                        this._grid.set('mode', (!actid) ? 'insert' : '');
                    }
                    this._grid.refresh();
                    this.gridRefreshed = true;
                }
            },


            _tabShow: function () {
                if (this._grid) {

                    //check to see if the activity is a new one or not so we can set the grid
                    // to be in the correct "mode".
                    var gridmode = this._grid.get('mode');
                    var actid = utility.getCurrentEntityId();
                    if ((!actid && gridmode !== 'insert') || (actid && gridmode === 'insert')) {
                        this._grid.set('mode', (!actid) ? 'insert' : '');
                    }
                    this._grid.refresh();
                }
            },
            _historySaved: function (history) {
                this._grid.saveChanges();               
            },

            /**         
            * When a history item is created directly (notes) from History Editor, get the primary Contact/Lead and add it to HistoryAttendee
            * @param {object} history    
            */
            _addHistoryAttendee: function (history) {
               
                if (!history.ContactId && !history.LeadId) {
                    return;
                }
               
                var attendee = null;

                if(history.ContactId){
                    activityUtility._getContactData(history.ContactId, function (data) {
                        if (data) {
                            attendee = this._setHistoryAttendeeEntityFromContactLead('Contact', data);
                            attendee.History = { '$key': history.$key };
                            this._saveHistoryAttendee(attendee);
                        }
                    }, this);
                } else if (history.LeadId) {
                    activityUtility._getLeadData(history.LeadId, function (data) {
                        if (data) {
                            attendee = this._setHistoryAttendeeEntityFromContactLead('Lead', data);
                            attendee.History = { '$key': history.$key };
                            this._saveHistoryAttendee(attendee);
                        }
                    }, this);

                }
            },

            _saveHistoryAttendee : function(attendee){
                var req = new Sage.SData.Client.SDataSingleResourceRequest(sDataServiceRegistry.getSDataService('dynamic'))
                            .setResourceKind('historyAttendees')
                            .create(attendee, {
                                success: function () {
                                    //console.log("success");
                                },
                                failure: function () {
                                    console.log('historyAttendee item did not save');
                                },
                                scope: this
                            });
            },
            _setHistoryAttendeeEntityFromContactLead: function (type, results) {
                var attendeeEntity = false;
                if (results && results.$key) {
                    attendeeEntity = {};
                    attendeeEntity.EntityType = type;
                    attendeeEntity.EntityId = results.$key;
                    attendeeEntity.$key = results.$key;
                    attendeeEntity.IsPrimary = true;
                    attendeeEntity.Name = results.$descriptor;
                    attendeeEntity.$descriptor = results.$descriptor;
                    attendeeEntity.Account = null;
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
                    }                    
                    attendeeEntity.PhoneNumber = results.WorkPhone;
                    attendeeEntity.RoleName = "";
                    attendeeEntity.general = false;
                    
                }
                return attendeeEntity;
            }   
          
        });

        return attendeesTab;
    });
