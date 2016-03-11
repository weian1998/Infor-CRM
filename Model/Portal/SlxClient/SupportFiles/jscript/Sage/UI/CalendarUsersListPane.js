/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
        'Sage/Data/SDataServiceRegistry',
         'Sage/Data/WritableSDataStore',
         'Sage/UI/EditCalendarUsers',
        'Sage/Utility',
        'dojo/_base/lang',
        'dojo/_base/array',
        'dojo/i18n',
        'dojo/on',
        'dojo/parser',
        'dojo/dom',
        'dojo/query',
        'dojo/_base/lang',
        'dojo/_base/declare',
        'dojo/dom-construct',
        'dojo/i18n!./nls/CalendarUsersListPane',
        'dojo/data/ItemFileWriteStore',
        'dojox/grid/enhanced/plugins/IndirectSelection',
        'dojox/grid/EnhancedGrid',
        'dojox/grid/enhanced/plugins/Pagination'
        

], function (sDataServiceRegistry, writableSDataStore, EditCalendarUsers, sUtility, dojoLang, array, i18n, on, parser, dom, dojoQuery, lang, declare, domConstruct, resource) {
        var calendarUsersListPane = declare('Sage.UI.CalendarUsersListPane', null, {
            Id: null,
            _store: null,
            _grid: null,
            _colors: {},
            _selectedUsers: {},
            _maxUserCount: 4,
            _checkedUsersCount: 0,
            _initialLoad: false,
            _storeItems: [],
            _maxUserCountReached: false,
            _userOptions: {},
            editCalendarUsers: null,
            _favoriteUsersList: [],
            editCalendarUsersHandle: null,
            _userCalendarFavoriteId: null,
            _usersListUpdatedFromDialog: false,
            _selectedUsersListUpdatedFromDialog: false,
            _LOCALSTORE_NAMESPACE: "SalesLogix-Calendar",
            _currentUserId : null,
                  
            constructor: function (options) {                
                this.Id = options.Id;
                this.EditCalUsersNodeId = options.EditUsersNode;
                this._userOptions = options.options;
                this._usersListUpdatedFromDialog = false;
                this._selectedUsersListUpdatedFromDialog = false;
                this._currentUserId = Sage.Utility.getClientContextByKey('userID');
                //Predefine these colors and assign to users, when selecting
                this._colors = [{
                    "usercolor": "user2",
                    "set": false
                }, {
                    "usercolor": "user3",
                    "set": false
                },
                {
                    "usercolor": "user4",
                    "set": false
                },
                {
                    "usercolor": "user5",
                    "set": false
                }];               
                lang.mixin(this, resource);
                this._initializeList();

                var self = this;

                var linkNode = domConstruct.toDom('<div align="right"><a id="editUserLink" href="#" class="filter-edit-items">' + this.editUsersLinkText + '</a></div>');
                domConstruct.place(linkNode, dojo.byId("grid"), 'before');


                //var editLink = '<div align="right"><a id="editUserLink" href="#" class="filter-edit-items">' + this.editUsersLinkText + '</a></div>';
            
                //domConstruct.place(editLink, this.EditCalUsersNodeId, 'last');
                //parser.parse(this.EditCalUsersNodeId);
              
               this.editCalendarUsers = new EditCalendarUsers({
                    id: "EditCalendarUsers1",                
                    parent: this
               });

               on(dom.byId("editUserLink"), "click", function (e) {
                   self.editCalendarUsers.showDialog(self._favoriteUsersList, self._userCalendarFavoriteId);
                   e.cancelBubble = true;
               });

            },          
            refresh: function () {               
                var currentUserId = Sage.Utility.getClientContextByKey('userID');               
                var query = { conditions: dojo.string.substitute('AccessId eq \'${0}\'', [dojoLang.trim(currentUserId)]) };
                dijit.byId('grid').setQuery(query);             
            },          
            _where: function () {
                var currentUserId = Sage.Utility.getClientContextByKey('userID');
                return dojo.string.substitute('AccessId eq \'${0}\'', [dojoLang.trim(currentUserId)]);                
            },
            _getSort: function () {
                var sort = [
                        { attribute: 'Name' }
                    ];
                return sort;
            },
            _getUserColor: function (userId) {
                var color = "";
                if (this._selectedUsers[userId]) {
                    color = this._selectedUsers[userId].usercolor;
                }
                return color;
            },

            _initializeList: function () {
                var headerUserName = this.header_user || 'User';
                var maxUsersErrorMessage = this.maxUsersErrorMessage || 'Sorry, you cannot view more than ${0} calendars (including your own) at one time.  Clear one of the currently-selected calendars and try again.';

                maxUsersErrorMessage = dojo.string.substitute(maxUsersErrorMessage, [this._maxUserCount]);
                var self = this;
                
                var onComplete = function (data, context) {
                    self._storeItems = [];
                    self._favoriteUsersList = [];
                    array.forEach(data, function (item, i) {                       
                        dojoLang.mixin(item, { usercolor: "", username: item['Name'], userId: item['ResourceId'], ResourceId: dojoLang.trim(item['ResourceId']) });
                        self._favoriteUsersList.push(item['ResourceId']);
                        self._storeItems.push(item);
                        if(!self._userCalendarFavoriteId)
                            self._userCalendarFavoriteId = item['$key'];
                    });
                    if (self._favoriteUsersList.length === 0) {
                        self._favoriteUsersList.push(Sage.Utility.getClientContextByKey('userID'));
                    }
                };

                var store = this._store = new Sage.Data.WritableSDataStore({
                    service: sDataServiceRegistry.getSDataService('dynamic'),
                    resourceKind: 'calendarfavoriteusersviews',                  
                    select: ['$key', 'Name','UserId','ResourceId','Selected'],
                    include: [],
                    sort: [{ attribute: 'Selected desc'}],
                    query: { conditions: this._where() },
                    onComplete: onComplete
                });

                var structure = [                  
                    {
                        field: 'ResourceId',
                        width: '20px',
                        name: ' ',
                        formatter: function (value) {                          
                            return "<div class='userStyles " + self._getUserColor(value) + "'></div>";
                        }
                    },
                    {
                        field: 'Name',
                        width: '100%',
                        name: headerUserName
                    }
                    
                ];

                var grid = this._grid = new dojox.grid.EnhancedGrid({
                    id: 'grid',
                    store: store,
                    structure: structure,
                    layout: 'layout',
                    noDataMessage: "<span class='dojoxGridNoData'>" + this.noUsersMessage + "</span>",
                    keepSelection: true,
                    plugins: { indirectSelection: { headerSelector: false, width: "20px", styles: "text-align: center;"} }

                },
                dojo.byId(this.Id));



                dojo.connect(grid.selection, 'onSelected', function (rowIndex) {
                                       
                    if (!self._initialLoad) {                      
                        if (self._checkedUsersCount < self._maxUserCount) {
                            var item = grid.getItem(rowIndex);
                            self._checkedUsersCount++;
                            var selectedItemUserId = item['ResourceId'].substr(0, 12);
                            var selectedItemUserColor = "";

                            if (self._selectedUsers[selectedItemUserId]) {
                                //item['usercolor'] = self._selectedUsers[item["userId"]]["usercolor"];
                            } else {
                                if (selectedItemUserId === dojoLang.trim(sUtility.getClientContextByKey('userID'))) {
                                    selectedItemUserColor = "user1";
                                } else {
                                    if (!selectedItemUserColor || selectedItemUserColor === "") {
                                        for (var j = 0; j < self._colors.length; j++) {
                                            if (!self._colors[j]['set']) {
                                                selectedItemUserColor = self._colors[j]['usercolor'];

                                                self._colors[j]['set'] = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                                var userObj = {};
                                userObj["userId"] = selectedItemUserId;
                                userObj["usercolor"] = selectedItemUserColor;
                                self._selectedUsers[selectedItemUserId] = userObj;
                                var newUserObj = dojoLang.clone(userObj);

                                //Save the selected user to useroptions
                                self._saveUserOption();
                                //self._store.setValue(item, 'usercolor', userObj["usercolor"]);
                                grid.update();

                                //Refresh schduler and timeless activities list
                                dojo.publish('/sage/ui/calendarUser/selectionChanged/add', [newUserObj, null]);
                            }


                        } else {
                            self._maxUserCountReached = true;
                            grid.rowSelectCell.toggleRow(rowIndex, false);
                            Sage.UI.Dialogs.showError(maxUsersErrorMessage);
                        }
                    } else {
                        if (self._checkedUsersCount < self._maxUserCount) {
                            //  self._checkedUsersCount++;
                        }
                    }

                });
                dojo.connect(grid.selection, 'onDeselected', function (rowIndex) {

                    if (!self._initialLoad) {

                        if (self._maxUserCountReached) {
                            self._maxUserCountReached = false;
                            return;
                        }
                        var item = grid.getItem(rowIndex);
                        var inSelected = false;
                        var selectedItemUserId = item['ResourceId'].substr(0, 12);
                        var selectedItemUserColor = self._selectedUsers[selectedItemUserId].usercolor;
                        if (self._selectedUsers[selectedItemUserId]) {
                            inSelected = true;
                        }
                        if (inSelected) {

                            for (var j = 0; j < self._colors.length; j++) {
                                if (self._colors[j]['usercolor'] === selectedItemUserColor) {
                                    self._colors[j]['set'] = false;
                                    break;
                                }
                            }
                            delete self._selectedUsers[selectedItemUserId];
                            self._checkedUsersCount--;
                            //Update the useroptions value
                            self._saveUserOption();
                            grid.update();
                            var userObj = {};
                            userObj["userId"] = selectedItemUserId;
                            //Refresh schduler and timeless activities list
                            dojo.publish('/sage/ui/calendarUser/selectionChanged/remove', [userObj, this]);
                        }
                    }

                });

                dojo.connect(grid, "_onFetchComplete", function () {
                    self._initialLoad = true;
                    var usersChanged = false;
                    var calendarUsersToAccess = [];
                    var tempSelectedUsers = dojoLang.clone(self._selectedUsers);
                    var rowCount = self._grid.rowCount > self._grid.rowsPerPage ? self._grid.rowsPerPage : self._grid.rowCount;

                    for (var i = 0; i < rowCount; i++) {
                        var item = self._storeItems[i];
                        var userId = item['ResourceId'].substr(0, 12);
                        //self._grid.rowSelectCell.toggleRow(i, false);
                        if (self._selectedUsers[userId]) {
                        //if (item['Selected']) {
                            calendarUsersToAccess.push(userId);
                            if (!self._grid.selection.selected[i]) {
                                if (self._checkedUsersCount < self._maxUserCount) {
                                    self._grid.rowSelectCell.toggleRow(i, true);
                                    self._checkedUsersCount++;
                                }
                            }
                        } else {
                           self._grid.rowSelectCell.toggleRow(i, false);
                            //self._checkedUsersCount--;
                        }
                    }
                  

                    //Validate the selected users list based on the calendar security
                    for (var j in tempSelectedUsers) {
                        var uId = dojoLang.trim(tempSelectedUsers[j]["userId"].toString());
                        var userColor = dojoLang.trim(tempSelectedUsers[j]["usercolor"].toString());
                        if (array.indexOf(calendarUsersToAccess, uId) < 0) {
                            delete self._selectedUsers[uId];
                            //Make the deleted user's color available for to assign
                            for (var k = 0; k < self._colors.length; k++) {
                                if (self._colors[k]['usercolor'] === userColor) {
                                    self._colors[k]['set'] = false;
                                    break;
                                }
                            }
                            usersChanged = true;
                        }
                    }

                    if (usersChanged) {
                        //Update the useroptions value
                        self._saveUserOption();
                    }
                    
                    self._initialLoad = false;

                    if (self._selectedUsers && !self._isEmpty(self._selectedUsers)) {
                        var newObj = dojoLang.clone(self._selectedUsers);
                        //Do not load calendar again when grid refreshes after the list edited from dialog
                        if (!self._usersListUpdatedFromDialog) {                           
                            dojo.publish('/sage/ui/calendarUserList/loaded', [newObj, null]);
                        } else if (self._usersListUpdatedFromDialog && self._selectedUsersListUpdatedFromDialog) {
                            //This will refresh both timeless and timless history grids
                            dojo.publish('/sage/ui/calendarUserList/updated', [newObj, null]);
                        }

                        self._grid.update();
                    } else if (!self._usersListUpdatedFromDialog) {
                        dojo.publish('/sage/ui/calendarUserList/loadedNavigationCalendar', [self._userOptions['weekstart'], this]);
                    }


                });

                //Disable column sorting for color legend column
                self._grid.canSort = function (col) {
                    return false;
                   // if (Math.abs(col) == 2) { return false; } else { return true; }
                };
                if (this._userOptions["rememberusers"]) {
                    this._loadCalendarUserListOptions();
                } else {
                    //If the user option "Remember Selected Users" is set to NO, get the selection from sessionStorage
                    var data = {};
                    var key = "calendarUsers-" + this._currentUserId;
                    data["value"] = this._getFromSessionStorage(key,this._LOCALSTORE_NAMESPACE);

                    this._receivedCalendarUserListOptions(data);
                }

            },
            _isEmpty : function (obj) {
                for(var prop in obj) {
                    if(obj.hasOwnProperty(prop))
                        return false;
                }
                return true;
            },
            _loadCalendarUserListOptions: function () {
                var optionsSvc = Sage.Services.getService('UserOptions');
                if (optionsSvc) {
                    optionsSvc.get('CalendarUsers', 'Calendar', this._receivedCalendarUserListOptions, null, this);
                }
            },
            _receivedCalendarUserListOptions: function (data) {
               
                if (data !== null) {
                    if (data) {
                        var userListOption = data['value'];
                        //By Default, the current user will be added to the list with default color set to "user1"
                        var currentUserId = sUtility.getClientContextByKey('userID');
                        currentUserId = dojoLang.trim(currentUserId);
                        if (userListOption === null || userListOption === "") {
                            userListOption = currentUserId + "|" + "user1";
                        } else if (userListOption.indexOf(currentUserId) < 0) {
                            userListOption += "," + currentUserId + "|" + "user1";
                        }
                        dojo.cookie('selectedCalendarUsers', userListOption);
                        this._setSelectedUsers(userListOption);
                    }
                }
                if (this._selectedUsers) {
                    this._grid.startup();
                }
            },
            refreshCalendarUsers: function (updatedFavoriteList) {
                var tempUserid = "";
                var updated = false;
                var self = this;
                for (var i in this._selectedUsers) {
                    tempUserid = this._selectedUsers[i]["userId"].toString();
                    //if (array.indexOf(updatedFavoriteList, tempUserid) < 0) {
                    if (!sUtility.isItemInArray(updatedFavoriteList, tempUserid)) {
                        var selectedItemUserColor = this._selectedUsers[tempUserid].usercolor;
                        for (var j = 0; j < this._colors.length; j++) {
                            if (this._colors[j]['usercolor'] === selectedItemUserColor) {
                                this._colors[j]['set'] = false;
                                break;
                            }
                        }
                        this._checkedUsersCount--;

                        var userObj = {};
                        userObj["userId"] = tempUserid;

                        //Update the scheduler 
                        dojo.publish('/sage/ui/calendarUser/selectionChanged/remove', [userObj, this]);

                        delete this._selectedUsers[i];
                        updated = true;                        
                    }
                }
                this._usersListUpdatedFromDialog = true;                
                if (updated) {
                    //If there is a change in selected users list, save the selected users first and refresh the grid
                    this._selectedUsersListUpdatedFromDialog = true; 
                    this._saveUserOption(this.refresh);
                } else {
                    this._selectedUsersListUpdatedFromDialog = false;                    
                    setTimeout(function () {
                        self.refresh();
                    }, "10");
                    
                }
            },
            _saveUserOption: function (callback) {
                
                    var userIds = "";
                    if (this._selectedUsers) {
                        for (var i in this._selectedUsers) {
                            if (userIds !== "") userIds += ",";
                            userIds += dojoLang.trim(this._selectedUsers[i]["userId"].toString());
                            userIds += "|";
                            if (this._selectedUsers[i]["usercolor"])
                                userIds += this._selectedUsers[i]["usercolor"].toString();
                        }

                        if (this._userOptions["rememberusers"]) {
                            var optionsSvc = Sage.Services.getService('UserOptions');
                            if (optionsSvc) {
                                optionsSvc.set('CalendarUsers', 'Calendar', userIds, callback, null, this);
                            }
                        } else {
                            //If the user option "Remember Selected Users" is set to NO, save the selection to sessionStorage
                            var key = "calendarUsers-" + this._currentUserId;
                            this._saveToSessionStorage(key, userIds, this._LOCALSTORE_NAMESPACE);
                        }
                    }

                    
                
            },
            _setSelectedUsers: function (userListOption) {
                if (userListOption !== null) {
                    var userOptions = userListOption.split(",");
                    var userItem;
                    var userId, userColor;
                    for (var i = 0; i < userOptions.length; i++) {
                        userItem = userOptions[i];
                        if (userItem) {
                            userId = userItem.split("|")[0];
                            userColor = userItem.split("|")[1];

                            if (!userColor) {
                                for (var j = 0; j < this._colors.length; j++) {
                                    if (!this._colors[j]['set']) {
                                        userColor = this._colors[j]['usercolor'];
                                        this._colors[j]['set'] = true;
                                        break;
                                    }
                                }
                            } else {
                                for (var k = 0; k < this._colors.length; k++) {
                                    if (this._colors[k]['usercolor'] === userColor) {
                                        this._colors[k]['set'] = true;
                                        break;
                                    }
                                }
                            }
                            var userObj = {};
                            userObj["userId"] = userId;
                            userObj["usercolor"] = userColor;
                            this._selectedUsers[userId] = userObj;
                        }

                    }

                }
            },
            _getFromSessionStorage: function (key, namespace) {
                if (!namespace) {
                    namespace = this._LOCALSTORE_NAMESPACE;
                }
                var storeKey = namespace + "_" + key;
                return sessionStorage.getItem(storeKey);
            },
            _saveToSessionStorage: function (key, value, namespace) {
                if (!namespace) {
                    namespace = this._LOCALSTORE_NAMESPACE;
                }
                var storeKey = namespace + "_" + key;
                sessionStorage.setItem(storeKey, value);
            }
        });
        return calendarUsersListPane;
    });

