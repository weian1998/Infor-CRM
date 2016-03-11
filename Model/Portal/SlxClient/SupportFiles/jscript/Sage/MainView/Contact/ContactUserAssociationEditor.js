/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
        'dojo/_base/declare',
        'dojo/i18n!./nls/ContactUserAssociationEditor',
        'Sage/Data/SingleEntrySDataStore',
        'Sage/Data/WritableSDataStore',
        'Sage/Data/SDataServiceRegistry',
        'Sage/UI/Controls/_DialogHelpIconMixin',
        'dojo/_base/lang',
        'dojo/string',
        'dijit/Dialog',
        'dijit/_Widget',
        'Sage/_Templated',
        'Sage/UI/Dialogs',
        'Sage/UI/Controls/Lookup',
        'dojo/text!./templates/ContactUserAssociationEditor.html',
        'Sage/UI/Controls/SingleSelectPickList',       
        'dijit/layout/ContentPane',
        'dojox/layout/TableContainer',
        'dijit/form/Form'
],
function (declare, i18nStrings, singleEntrySDataStore,writableSDataStore, sDataServiceRegistry, _DialogHelpIconMixin, dojoLang, dstring,dijitDialog, _Widget, _Templated, Dialogs, Lookup, template) {
    var contactUserAssociationEditor = declare('Sage.TaskPane.ContactUserAssociationEditor', [_Widget, _Templated], {
        id: "dlgContactUserAssociation",
        actionType : false,
        _dialog: false,
        _updateableProperties: false,
        selectedFieldIndex: 1,
        lup_User: false,
        _selectionInfo: false,
        widgetsInTemplate: true,
        widgetTemplate: new Simplate(eval(template)),
        constructor: function (info) {
            this._selectionInfo = info.selectionInfo.selectedIds;
            this.actionType = info.action;
            dojo.mixin(this, i18nStrings);
            if (this.actionType == "disassociate") {
           //     this.loadContactData(this._selectionInfo,this._poplulateData, this);
            }
           
        },     
        associationExists: function (failureCallback,successCallback, scopeObj, scope) {
            this._setupStore();
            var _query = dstring.substitute('UserId eq \'${0}\' ', [scopeObj.UserId]);
            this._contactUserStore.fetch({
                query: _query,
                onComplete: function (accessData) {
                    if (accessData && accessData.length > 0) {
                        successCallback.call(scope, accessData, scopeObj);
                    } else {
                        failureCallback.call(scope, scopeObj);
                    }
                },
                onError: function () {
                    failureCallback.call(scope, scopeObj);
                },
                scope: this
            });

        },
        loadContactData: function (contactId, callback, scope) {

            if (!contactId) {
                return;
            }
            this._setupStore();           
            var _query = dstring.substitute('ContactId in [\'${0}\'] ', [this._selectionInfo.join('\',\'')]);          
            this._contactUserStore.fetch({
                query: _query,
                //predicate: "'" + accessTo + "-" + currentUserId + "'",
                onComplete: function (accessData) {
                    callback.call(scope, accessData);
                },
                onError: function () {
                    callback.call(scope, null);
                },
                scope: this
            });
            this._contactUserStore.fetch({
                predicate: "'" + contactId + "'",
                onComplete: function (contactData) {
                    callback.call(scope, contactData);
                },
                onError: function () {
                    callback.call(scope, null);
                },
                scope: this
            });
        },      
        setSelectionInfo: function (info) {
            this._selectionInfo = info.selectionInfo.selectedIds;
            this.actionType = info.action;
        },
        show: function () {
            this._dialog.show();
            if (!this.lup_User) {
                this.createUserLookup();
            }
          /*  this._propertyChanged();
            if (!this._dialog.helpIcon) {
                dojoLang.mixin(this._dialog, new _DialogHelpIconMixin());
                this._dialog.createHelpIconByTopic('updateopportunities');
            }*/
        },

        createUserLookup: function () {
            this.userLookupConfig = {
                id: '_acctMgr',
                structure: [
                    {
                        defaultCell: {
                            "sortable": true,
                            "width": "150px",
                            "editable": false,
                            "propertyType": "System.String",
                            "excludeFromFilters": false,
                            "useAsResult": false,
                            "pickListName": null,
                            "defaultValue": ""
                        },
                        cells: [
                            {
                                "name": this.lookupNameColText,
                                "field": "UserInfo.UserName",
                                "sortable": true
                            }, {
                                "name": this.lookupTitleColText,
                                "field": "UserInfo.Title",
                                "sortable": true
                            }, {
                                "name": this.lookupDepartmentColText,
                                "field": "UserInfo.Department",
                                "sortable": true
                            }, {
                                "name": this.lookupRegionColText,
                                "field": "UserInfo.Region",
                                "sortable": true
                            }, {
                                "name": this.lookupTypeColText,
                                "field": "Type",
                                "propertyType": "Sage.Entity.Interfaces.UserType",
                                "sortable": true
                            }
                        ]
                    }
                ],
                gridOptions: {
                    contextualCondition: function () {
                        return 'Type ne \'5\' and Type ne \'6\' and Type ne \'7\' and Type ne \'8\''; 
                    },
                    contextualShow: '',
                    selectionMode: 'single'
                },
                storeOptions: { resourceKind: 'users', sort: [{ attribute: 'UserInfo.UserName' }] },
                isModal: true,
                initialLookup: true,              
                returnPrimaryKey: true,
                dialogTitle: this.lookupUserText,
                dialogButtonText: this.btnOK_Caption
            };
            this.lup_User = new Lookup({
                id: 'lu_User',
                config: this.userLookupConfig,
                style: 'width:100%'
            });
            dojo.place(this.lup_User.domNode, this.userLookup_Container.domNode, 'only');
        },
        _setupStore: function () {
            if (!this._contactUserStore) {             
                this._contactUserStore = new writableSDataStore({
                    include: [],
                    resourceKind: 'contactUsers',
                    service: Sage.Data.SDataServiceRegistry.getSDataService('dynamic')
                });
            }
        },     
        _okClick: function () {
            var selectedUserId = this.lup_User.selectedObject.$key;         
            if (this._selectionInfo && selectedUserId) {
                this._setupStore();
                if (this.actionType === "associate") {
                    var contactUserData = { "ContactId": this._selectionInfo[0], "UserId": selectedUserId };
                    //Check if the selected user is already associated to another contact
                    this.associationExists(this._insertAssociation, function(){
                        Sage.UI.Dialogs.showError(this.associationExistsMessage);                        
                    }, contactUserData, this);
                } else if (this.actionType === "disassociate") {
                    for (var i = 0; i < this._selectionInfo.count; i++) {
                       // var contactUserData = { "Contactid": this._selectionInfo, "Userid": selectedUserId };
                       // this._contactUserStore.deleteEntity(contactUserData, this._successfulContactUserSave, this._failedContactUserSave, this);

                    }
                }
            }
        },
        _insertAssociation: function (contactUserData, self) {
            this._contactUserStore.saveNewEntity(contactUserData, this._successfulContactUserSave, this._failedContactUserSave, this);
        },
        _successfulContactUserSave : function(data){
            this._dialog.hide();

        },
        _failedContactUserSave : function(er){
            this._dialog.hide();

        },      
        _close: function () {
            this._dialog.hide();
        }
    });
    return contactUserAssociationEditor;
});
