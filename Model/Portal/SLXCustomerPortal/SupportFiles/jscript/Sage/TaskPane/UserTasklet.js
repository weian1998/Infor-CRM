/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dojo/i18n!./nls/UserTasklet',
    'Sage/TaskPane/_BaseTaskPaneTasklet',
    'Sage/TaskPane/TaskPaneContent',
    'Sage/Utility',
    'dojo/_base/declare',
    'Sage/TaskPane/User/ContactUserAssociationEditor',
     'Sage/Data/SingleEntrySDataStore',
     'Sage/UI/Dialogs'
],
function (i18nStrings, _BaseTaskPaneTasklet, TaskPaneContent, Utility, declare, ContactUserAssociationEditor, SingleEntrySDataStore, Dialogs) {
    var userTasklet = declare('Sage.TaskPane.UserTasklet', [_BaseTaskPaneTasklet, TaskPaneContent], {
        addToRoleTitle: 'Add to Role',
        resetUsersTitle: 'Reset Users',
        taskItems: [],
        constructor: function () {
            dojo.mixin(this, i18nStrings);
            this.taskItems = [
                { taskId: 'AddToRole', type: "Link", displayName: this.addToRoleTitle, clientAction: 'userTaskletActions.addUsersToRole();',
                    securedAction: 'Entities/User/Add'
                },
                { taskId: 'ResetUsers', type: "Link", displayName: this.resetUsersTitle, clientAction: 'userTaskletActions.resetUsers();',
                    securedAction: 'Entities/User/Add'
                },
                { taskId: 'Associate Contact', type: "Link", displayName: this.associateContactTitle, clientAction: 'userTaskletActions.associateContact();',
                    securedAction: 'Entities/User/AssociateUser'
                },            
                { taskId: 'Disassociate Contact', type: "Link", displayName: this.disAssociateContactTitle, clientAction: 'userTaskletActions.disAssociateContact();',
                    securedAction: 'Entities/User/DisAssociateUser'
                }
            ];
        },
        resetUsers: function () {
            if (Utility.getModeId() === "detail") {
                this.onResetUsersClick();
            }
            else {
                this.prepareSelectedRecords(this.resetUsersAction(this));
            }
        },
        addUsersToRole: function () {
            if (Utility.getModeId() === "detail") {
                this.onAddUserClick();
            }
            else {
                this.prepareSelectedRecords(this.actionItem(this));
            }
        },
        actionItem: function (self) {
            return function () {
                self.onAddUserClick();
            };
        },
        resetUsersAction: function (self) {
            return function () {
                self.onResetUsersClick();
            };
        },
        onAddUserClick: function () {
            var addUser = dojo.byId([this.clientId, '_tskAddUserToRole'].join(''));
            if (addUser) {
                addUser.click();
            }
        },
        onResetUsersClick: function () {
            var resetUser = dojo.byId([this.clientId, '_tskResetUsers'].join(''));
            if (resetUser) {
                resetUser.click();
            }
        },

        //MAA Changes

        associateContact: function (action) {
            var self = this;
            if (!action) { action = 'associate'; }
            this._selectionInfo = this.getSelectionInfo();          
            if (this._selectionInfo.selectionCount === 0) {
                    Sage.UI.Dialogs.showError(this.singleSelectionErrorMessage);
            }else if(this._selectionInfo.selectionCount > 1) {
                Sage.UI.Dialogs.showError(this.multipleSelectionErrorMessage);
            } else {
                var selObj = { "selectionInfo": this._selectionInfo, "action": action };

                this._setupStore();
                this._contactUserStore.fetch({
                    predicate: "UserId eq '" + this._selectionInfo.selectedIds[0] + "'",
                    onComplete: function (contactData) {
                        Sage.UI.Dialogs.showError(self.associationExistsMessage);
                    },
                    onError: function () {
                        self.prepareSelectedRecords(this.associateContactActionItem(selObj));
                    },
                    scope: this
                });
            }
        },
        _setupStore: function () {
            if (!this._contactUserStore) {
                this._contactUserStore = new SingleEntrySDataStore({
                    include: [],
                    resourceKind: 'contactUsers',
                    service: Sage.Data.SDataServiceRegistry.getSDataService('dynamic')
                });
            }
        },
        associateContactActionItem: function (selectionInfo, action) {
            return function () {
                var updateDialog = dijit.byId("dlgContactUserAssociation");
                if (!updateDialog) {
                    updateDialog = new ContactUserAssociationEditor(selectionInfo, action);
                } else {
                    updateDialog.setSelectionInfo(selectionInfo, action);
                }
                updateDialog.show();
            };
        },
        disAssociateContact: function () {
            this._selectionInfo = this.getSelectionInfo();
            if (this._selectionInfo.selectionCount === 0) {
                Sage.UI.Dialogs.showError(this.noSelectionErrorMessage);
            } else {
                this.prepareSelectedRecords(this.confirmDisassociate(this));
            }           
        },
        confirmDisassociate: function (self) {
            return function () {

                var confirmMessage = self.confirmDisAssociate;
                if (self._selectionInfo.selectionCount > 1) {
                    confirmMessage = self.confirmDisAssociateMultiple;
                }
                Dialogs.raiseQueryDialog(
                    self.disAssociateDialogTitle,
                    dojo.string.substitute(confirmMessage, [self._selectionInfo.selectionCount]),
                    function (result) {
                        self.disAssociateActionItem(result, self);
                    },
                    self.okButtonText,
                    self.cancelButtonText
                );
            };
        },
        disAssociateActionItem: function (result, self) {
            if (result) {
                self.getSelectionInfo();
                var contactIds = this.selectionInfo.selectedIds.join();
                this._removeContactUsers(contactIds, self._successfulContactUserDelete, self);
            }
        },
        _removeContactUsers: function (userIds, callback, scope) {
            var service = Sage.Data.SDataServiceRegistry.getSDataService('dynamic');
            var request = new Sage.SData.Client.SDataServiceOperationRequest(service)
                .setResourceKind('ContactUsers')
                .setOperationName('RemoveContactUserAssociations');
            var entry = {
                "$name": "RemoveContactUserAssociations",
                "request": {
                    "ContactUserId": null,
                    "contactIds": null,
                    "userIds": userIds
                }
            };
            request.execute(entry, {
                success: function () {
                    console.log("success");
                },
                failure: function () {
                    console.log("Error removing the Contact-User association");
                },
                scope: scope || this
            });
        }

    });
    return userTasklet;
});
