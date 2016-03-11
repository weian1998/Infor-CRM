/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
        'dijit/_Widget',
        'dijit/_TemplatedMixin',
        'dijit/_WidgetsInTemplateMixin',
        'Sage/Data/SDataServiceRegistry',
        'Sage/Data/WritableSDataStore',
        'dijit/Dialog',
        'dijit/form/Button',
        'Sage/UI/ImageButton',
        'dijit/form/CheckBox',
        'dijit/form/TextBox',
        'dojo/_base/declare',
        'dojo/_base/array',
        'dojo/_base/lang',
        'dojo/dom-construct',       
        'dijit/registry',
        'Sage/UI/Controls/_DialogHelpIconMixin',
        'dojo/json',
        'dojo/parser',
        'dojo/text!./templates/EditCalendarUsers.html',
        'dojo/i18n!./nls/EditCalendarUsers',
        'Sage/Utility'
], function (
        _Widget,
        _TemplatedMixin,
        _WidgetsInTemplateMixin,
        sDataServiceRegistry, 
        writableSDataStore,
        Dialog,
        Button,
        ImageButton,
        CheckBox,
        TextBox,
        declare,
        array,
        lang,
        domConstruct,       
        registry,
        DialogHelpIconMixin,
        json,
        parser,
        template,
        resource,
        utility
) {
    return declare('Sage.UI.EditCalendarUsers', [_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        widgetsInTemplate: true,

        id: 'editFilterItems',
        store: null, 
        checkBoxes: null,
        allItems: null, // Keep this list even after searches, etc.       
        parent: null,
        formatter: null,
        favoriteUserIds: [],
        maxSelectCount: 25,
        selectedCount : 0,
        currentUserId:null,   
        count: 1000,
        loading: false,
        handles: null,
        mainHandles: null,
        safeCheck: true,
        open:false,

        checkBoxTemplate: new Simplate([
            '<input id="{%: $.id %}" ',
            'name="{%: $.name %}" ',
            'data-dojo-type="dijit.form.CheckBox" ',
           // 'data-dojo-props="label:\'{%: $.name %}\'" ', \\ removed this because of names such as O'Hare with a single quote. Defect 14096021
            '{%: $.disabled %}',
            'class="editFilterCheckBox" />',
            '<label for="{%: $.id %}" {%: $.disabledStyle %}>{%: $.itemName %}</label><br />'
        ]),

        constructor: function (options) {
            this.inherited(arguments);
            this.checkBoxes = [];
            this.allItems = [];
            this.handles = [];
            this.mainHandles = []; 
            lang.mixin(this, resource);

           
           
            this.initialize();
        },
        initialize: function () {
            this.maxUsersErrorMessage = dojo.string.substitute(this.maxUsersErrorMessage, [this.maxSelectCount]);
            this.currentUserId = Sage.Utility.getClientContextByKey('userID');
            var request = new Sage.SData.Client.SDataResourceCollectionRequest(sDataServiceRegistry.getSDataService('dynamic'));
            request.setResourceKind('activityresourceviews');
             
            this.store = new writableSDataStore({
                service: sDataServiceRegistry.getSDataService('dynamic'),
                resourceKind: 'activityresourceviews',
                select: ['$key', 'ResourceId', 'Name'],
                include: [],
                sort: [{ attribute: 'Name' }]                               
            });

        },
        _where: function (searchValue) {
            var currentUserId = Sage.Utility.getClientContextByKey('userID');
            var whereQuery = "";
            if (lang.trim(currentUserId) === 'ADMIN') {
                whereQuery =  dojo.string.substitute('(AccessId eq \'${0}\' OR AccessId eq \'${1}\' OR AccessId eq \'EVERYONE\') AND Type eq \'User\'', [currentUserId, lang.trim(currentUserId)]);
            } else {
                whereQuery =  dojo.string.substitute('(AccessId eq \'${0}\' OR AccessId eq \'EVERYONE\') AND Type eq \'User\'', [lang.trim(currentUserId)]);
            }
            if (searchValue) {
                searchValue = searchValue.replace(/'/g, "''"); //Defect - 14096018
                whereQuery += dojo.string.substitute(' AND Name like \'%${0}%\'', [lang.trim(searchValue)]);
            } 
            return whereQuery;
        },
        postCreate: function () {
            this.inherited(arguments);            
            this.mainHandles.push(this.textFind.on('keyDown', lang.hitch(this, this._onFindMouseDown)));           
        },     
        showDialog: function (favoriteUsers, favUserCalendarId) {            
            this.favariteUserCalendarId = favUserCalendarId;
            this.favoriteUserIds = favoriteUsers;
            this.requestData();
            lang.mixin(this.dialogNode, new DialogHelpIconMixin());
            //this.dialogNode.createHelpIconByTopic('editFilterItems');
            this.dialogNode.titleNode.innerHTML = this.dialogTitle;
            this.dialogNode.show();
            this.open = true;
        },
        hideDialog: function () {           
            this.dialogNode.hide();
        }, 
        _onClearClick: function () {
            this.textFind.set('value', '');
            this._onFindClick();
        },
        _onCancelClick: function () {
            this.textFind.set('value', '');          
            this.dialogNode.hide();
            this.allItems = [];           
        },
        _onOKClick: function () {
            this.textFind.set('value', '');           
            this._addFavoriteUsers(this.allItems, this._refreshParent, this);            
            this.dialogNode.hide();
            this.allItems = [];            
        },
        _refreshParent: function (scope) {           
            if (scope.parent) {               
                scope.parent.refreshCalendarUsers(scope.allItems);
            }
        },
        _addFavoriteUsers: function (userIds, callback, scope) {           
            var service = Sage.Data.SDataServiceRegistry.getSDataService('dynamic');           
            var request = new Sage.SData.Client.SDataServiceOperationRequest(service)
                .setResourceKind('UserCalendarFavorites')
                .setOperationName('UpdateUserCalendarFavorites');           
            var entry = {
                "$name": "UpdateUserCalendarFavorites",
                "request": {
                    "UserCalendarFavoriteId": this.favariteUserCalendarId,
                    "userId" : this.currentUserId,
                    "favUserIds": userIds.join()

                }
            };
            request.execute(entry, {
                success: callback(scope),
                failure: function () {
                    console.log("failure");
                    callback(scope);
                },
                scope: scope || this
            });            
        },

        uninitialize: function () {
            if (!this.contentNode) {
                return;
            }            
            array.forEach(this.mainHandles, function (handle) {
                handle.remove();
            });

            this._destroyContent();
            this.checkBoxes = null;
            this.allItems = null;           
            this.buttonCancel.destroy(false);
            this.buttonOK.destroy(false);
            this.buttonFind.destroy(false);
            this.textFind.destroy(false);
            this.dialogNode.destroy(false);
            this.inherited(arguments);
        },
        requestData: function (searchText) {
            if (!this.loading) {
                this._destroyContent();
                this.checkBoxes = [];
            } 
            this.loading = true;
            var condition = "";
            if (searchText) {
                condition = this._where(searchText);
            } else {
                condition = this._where();
            }

            this.store.fetch({
                onError: lang.hitch(this, this._onFetchError),
                onComplete: lang.hitch(this, this._onFetchComplete),
                query: { conditions: condition },
                count: this.count,
                scope: this
            });
        },
        _onFindMouseDown: function (event) {
            if (event.keyCode === 13) {
                this._onFindClick();
            }
        },
        _onFindClick: function () {
            if (!this.loading) {
                var searchText = this.textFind.get('value');
                if (searchText) {
                    this.requestData(searchText);                   
                } else {                  
                    this.requestData();
                }                
            }
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
            this.checkBoxes = [];
            this.contentNode.innerHTML = '';
        },
        _onFetchError: function () {
        },
        _onCheckClick: function (e) {
           
            var self = this.self,
                checkBox = this.checkBox,
                name = checkBox && checkBox.get('id'),
                index;

            if (checkBox.checked) {
                // Checked means we want a "visible" item.
                // allItems keeps a list of NOT visible, remove.
                index = array.indexOf(self.allItems, name);
                if (index == -1) {
                    if (self.selectedCount < self.maxSelectCount) {
                        self.selectedCount++;
                        self.allItems.push(name);
                    } else {
                        Sage.UI.Dialogs.showError(self.maxUsersErrorMessage);
                        checkBox.set('checked', false);
                    }                  
                }
            } else {
                index = array.indexOf(self.allItems, name);
                self.allItems.splice(index, 1);
                self.selectedCount--;
                
            }
        },
     
        _onFetchComplete: function (items) {
            var entry,
                itemName,
                id,
                checkBox = null,
                templateItems = [],
                i,
                len = items.length,
                name,
                labelValue,
                disabled,
                disabledStyle;

            this.selectedCount = 0;

            for (i = 0; i < len; i++) {
                entry = items[i];
                disabled = "";
                disabledStyle = "";
                name = entry.Name || "";
                id = entry.ResourceId;
               
                if(id == this.currentUserId){
                    disabled = "disabled = 'true'";
                    //disabledStyle = "style ='{color: #C8C9DE}'";
                }
                                
                //name = name.replace("'", "\\'");  \\ removed this because of names such as O'Hare with a single quote. Defect 14096021
                templateItems.push(this.checkBoxTemplate.apply({
                    id: id,
                    name: name,
                    itemName: name,
                    disabled: disabled,
                    disabledStyle: disabledStyle
                }));
                
            }
            this.contentNode.innerHTML = '';
            checkBox = domConstruct.toDom(templateItems.join(''));
            domConstruct.place(checkBox, this.contentNode, 'last');

            this._finishedLoading();
        },
        _finishedLoading: function () {          

            this._parseCheckBoxes();
            this.setupCheckState();

            this.loading = false;
        },
        _parseCheckBoxes: function () {
            if(!this.contentNode) {
                return;
            }
            var widgets;
            parser.parse(this.contentNode);

            widgets = registry.findWidgets(this.contentNode);
            array.forEach(widgets, function (checkBox) {
                checkBox.on('click', lang.hitch({ checkBox: checkBox, self: this }, this._onCheckClick));
                this.checkBoxes.push(checkBox);
            }, this);
        },
        setupCheckState: function () {
            var cUserId = this.currentUserId;
            if (!utility.isItemInArray(this.favoriteUserIds, cUserId)) {
                this.favoriteUserIds.push(cUserId);
            }

            array.forEach(this.checkBoxes, function (checkBox) {
                var dataIndex,
                       cachedIndex,
                       label = checkBox.get('id');
                dataIndex = array.indexOf(this.favoriteUserIds, label);
               
                //if (dataIndex > -1) {
                if(utility.isItemInArray(this.favoriteUserIds, label)){
                    checkBox.set('checked', true);
                    this.selectedCount++;
                   // if (cachedIndex === -1 && firstLoad) {
                    this.allItems.push(label);
                   // }
                } else {
                    checkBox.set('checked', false);
                }

            },this);
         
        }
    });
});
