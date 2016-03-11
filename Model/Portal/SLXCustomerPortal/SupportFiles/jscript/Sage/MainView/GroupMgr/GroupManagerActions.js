/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
        'dojo/_base/declare',
        'dojo/_base/lang',
        'Sage/UI/Dialogs',
        'dojo/i18n!./nls/GroupManagerActions',
        'dojo/string',
        'dojo/_base/Deferred',
        'Sage/Groups/GroupManager',
        'Sage/Utility/Jobs',
        'Sage/UI/SDataLookup',
        'Sage/Data/SDataServiceRegistry',
        'Sage/Services/RoleSecurityService'
    ],
    function(
        declare,
        lang,
        dialogs,
        nlsResources,
        dojoString,
        deferred,
        groupManager,
        jobUtility,
        lookup,
        sDataServiceRegistry
    ) {
        Sage.namespace('Sage.MainView.GroupMgr.GroupManagerActions');
        dojo.mixin(Sage.MainView.GroupMgr.GroupManagerActions, {
            _currentUserId: false,
            DeleteKind: { Group: 0, Release: 1, Statistics: 2 },
            _batchDelete: function (serviceName, resourceKind, resourceSelectorPrefix, selectionInfo, deferredObject) {
                var service = sDataServiceRegistry.getSDataService(serviceName, false, true, false);
                var batchRequest = new Sage.SData.Client.SDataBatchRequest(service);
                batchRequest.setResourceKind(resourceKind);
                batchRequest.setQueryArg('_allowBasedOn', 'T');
                batchRequest.using(function() {
                    for (var i = 0; i < selectionInfo.selections.length; i++) {
                        var request = new Sage.SData.Client.SDataSingleResourceRequest(service);
                        request.setResourceKind(resourceKind);
                        request.setResourceSelector(dojoString.substitute("${0}'${1}'", [resourceSelectorPrefix || '', selectionInfo.selections[i].id]));
                        request['delete']({}, { scope: this, ignoreETag: true });
                    }
                });
                batchRequest.commit({
                    scope: this,
                    ignoreETag: true,
                    success: function(data) {
                        if (deferredObject) {
                            deferredObject.callback(data);
                        }
                    },
                    failure: function(xhr, sdata) {
                        if (deferredObject) {
                            deferredObject.errback(xhr, sdata);
                        }
                    }
                });
            },
            _canModifyGroup: function(selectionInfo) {
                if (selectionInfo && selectionInfo.selectionCount >= 1) {
                    var selection = selectionInfo.selections[0];
                    if (selection.entity) {
                        if (selection.entity.basedOn && selection.entity.basedOn !== '') {
                            dialogs.showInfo(nlsResources.InvalidSelectedGroup);
                            return false;
                        }
                        if (selection.entity.isDeveloperVersion === false) {
                            dialogs.showInfo(nlsResources.NotDeveloperGroup);
                            return false;
                        }
                        var userId = this._getCurrentUserId();
                        if (userId && userId.toUpperCase() !== 'ADMIN' && selection.entity.userId && userId !== selection.entity.userId.toUpperCase()) {
                            dialogs.showInfo(nlsResources.NotGroupOwner);
                            return false;
                        }
                        return true;
                    }
                }
                return false;
            },
            _delete: function(deleteKind) {
                var panel = dijit.byId('list');
                if (panel) {
                    var selectionInfo = panel.getSelectionInfo(true);
                    if (selectionInfo && selectionInfo.selectionCount >= 1) {
                        var serviceName, resourceKind, resourceSelectorPrefix, txtActionKind, txtConfirmKind;
                        switch (deleteKind) {
                        case this.DeleteKind.Group:
                            if (!this._canModifyGroup(selectionInfo)) {
                                return;
                            }
                            serviceName = 'system';
                            resourceKind = 'groups';
                            resourceSelectorPrefix = null;
                            txtActionKind = nlsResources.Delete;
                            txtConfirmKind = nlsResources.SelectedGroups;
                            break;
                        case this.DeleteKind.Release:
                            serviceName = 'system';
                            resourceKind = 'groups';
                            resourceSelectorPrefix = null;
                            txtActionKind = nlsResources.Delete;
                            txtConfirmKind = nlsResources.SelectedReleases;
                            break;
                        case this.DeleteKind.Statistics:
                            serviceName = 'dynamic';
                            resourceKind = 'groupStatistics';
                            resourceSelectorPrefix = 'PluginId eq ';
                            txtActionKind = nlsResources.Reset;
                            txtConfirmKind = nlsResources.SelectedStatistics;
                            break;
                        default:
                            return;
                        }
                        var self = this;
                        dialogs.raiseQueryDialog(
                            'Infor CRM',
                            dojoString.substitute(nlsResources.ConfirmDeletionMsg, [txtActionKind, txtConfirmKind]),
                            function(result) {
                                if (result) {
                                    var def = new deferred();
                                    self._batchDelete(serviceName, resourceKind, resourceSelectorPrefix, selectionInfo, def);
                                    def.then(
                                        function (data) {
                                            console.debug('_batchDelete result: %o', data);
                                            if (panel) {
                                                panel.refreshView('groups');
                                            }
                                        },
                                        function(xhr, sdata) {
                                            console.error('_batchDelete failed: xhr=%o; sdata=%o', xhr, sdata);
                                        }
                                    );
                                }
                            },
                            nlsResources.Yes,
                            nlsResources.No
                        );
                    } else {
                        dialogs.showInfo(nlsResources.SelectRecordMsg);
                    }
                }
            },
            _getSelectedId: function() {
                var selectionInfo = Sage.Utility.getSelectionInfo();
                if (selectionInfo) {
                    if (selectionInfo.selectedIds.length === 1) {
                        return selectionInfo.selectedIds[0];
                    }
                }
                return null;
            },
            _getCurrentGroupId: function() {
                var svc = Sage.Services.getService('ClientGroupContext');
                var context = svc.getContext();
                return context.CurrentGroupID;
            },
            _getCurrentUserId: function() {
                if (this._currentUserId) {
                    return this._currentUserId;
                }
                var clientContextSvc = Sage.Services.getService('ClientContextService');
                if (clientContextSvc && clientContextSvc.containsKey("userID")) {
                    var userId = clientContextSvc.getValue("userID");
                    if (userId) {
                        this._currentUserId = userId.trim();
                    }
                }
                return this._currentUserId;
            },
            _assignOwner: function (userId, selectionInfo) {
                var service = sDataServiceRegistry.getSDataService('system');
                var request = new Sage.SData.Client.SDataServiceOperationRequest(service);                
                var operation = 'assignOwner';

                request.setResourceKind('groups');
                request.setOperationName(operation);

                var entry = {
                    '$name': operation,
                    request: {
                        userId: userId,
                        groupIds: selectionInfo.selectedIds
                    }
                };

                request.execute(entry, {
                    success: function (data) {
                        var panel = dijit.byId('list');
                        if (panel) {
                            panel.refreshView('groups');
                        }
                    },
                    failure: function (xhr, sdata) {
                        console.error(xhr);
                    },
                    scope: this
                });
            },
            assignGroupOwner: function() {
                var panel = dijit.byId('list');
                if (panel) {
                    var selectionInfo = panel.getSelectionInfo(true);
                    if (selectionInfo && selectionInfo.selectionCount >= 1) {
                        if (!this._canModifyGroup(selectionInfo)) {
                            return;
                        }
                        var selection = selectionInfo.selections[0];
                        if (selection.entity) {
                            var userLookup;
                            var lookupConfig = {
                                id: 'UserLookup',
                                structure: [
                                    {
                                        cells:
                                        [
                                            {
                                                name: nlsResources.FirstName,
                                                field: 'UserInfo.FirstName',
                                                sortable: true,
                                                width: '150px',
                                                editable: false,
                                                propertyType: 'System.String',
                                                excludeFromFilters: false,
                                                defaultValue: ''
                                            },
                                            {
                                                name: nlsResources.LastName,
                                                field: 'UserInfo.LastName',
                                                sortable: true,
                                                width: '150px',
                                                editable: false,
                                                propertyType: 'System.String',
                                                excludeFromFilters: false,
                                                defaultValue: ''
                                            },
                                            {
                                                name: nlsResources.UserName,
                                                field: 'UserName',
                                                sortable: true,
                                                width: '75px',
                                                editable: false,
                                                propertyType: 'System.String',
                                                excludeFromFilters: false,
                                                defaultValue: ''
                                            },
                                            {
                                                name: nlsResources.Type,
                                                field: 'Type',
                                                sortable: true,
                                                width: '100px',
                                                editable: false,
                                                propertyType: 'System.String',
                                                excludeFromFilters: false,
                                                defaultValue: ''
                                            }
                                        ]
                                    }
                                ],
                                gridOptions: {
                                    contextualCondition: function () {
                                        // Filter out: 5=Retired and 6=Template.
                                        return 'Type ne 5 and Type ne 6';
                                    },
                                    contextualShow: '',
                                    selectionMode: 'single'
                                },
                                storeOptions: {
                                    resourceKind: 'users',
                                    include: ['UserInfo'],
                                    sort: [{ attribute: 'UserInfo.UserName' }]
                                },
                                isModal: true,
                                preFilters: [],
                                returnPrimaryKey: true,
                                dialogTitle: nlsResources.SelectOwner,
                                dialogButtonText: nlsResources.OK
                            };
                            var self = this;
                            var fnOnSelect = function(items) {
                                userLookup.destroy();
                                if (dojo.isArray(items)) {
                                    self._assignOwner(items[0].$key, selectionInfo);
                                }
                            };
                            var fnOnCancel = function() {
                                userLookup.destroy();
                            };
                            userLookup = dijit.byId('UserLookup');
                            if (userLookup) {
                                userLookup.destroyRecursive();
                            }
                            userLookup = new lookup(lookupConfig);
                            userLookup.onDoubleClick = function(e) {
                                dojo.stopEvent(e);
                                var btnOk = dijit.byId('UserLookup-GridSelectButton');
                                if (btnOk) {
                                    btnOk.onClick();
                                }
                            };
                            userLookup.doSelected = function(items) {
                                dojo.disconnect(hOnHide);
                                fnOnSelect(items);
                                if (dojo.isObject(userLookup.lookupDialog) && dojo.isFunction(userLookup.lookupDialog.hide)) {
                                    userLookup.lookupDialog.hide();
                                }
                                userLookup.destroy();
                            };
                            userLookup.showLookup();
                            var hOnHide = dojo.connect(userLookup.lookupDialog, 'onHide', function() {
                                dojo.disconnect(hOnHide);
                                fnOnCancel();
                                userLookup.destroy();
                            });
                        }
                    } else {
                        dialogs.showInfo(nlsResources.SelectRecordMsg);
                    }
                }
            },
            deleteGroup: function () {
                this._delete(this.DeleteKind.Group);
            },
            deleteReleases: function() {
                this._delete(this.DeleteKind.Release);
            },
            deleteStatistics: function() {
                this._delete(this.DeleteKind.Statistics);
            },
            disableStatistics: function() {
                dialogs.showInfo('Not implemented.');
            },
            editGroup: function() {
                var panel = dijit.byId('list');
                if (panel) {
                    var selectionInfo = panel.getSelectionInfo(true);
                    if (selectionInfo && selectionInfo.selectionCount == 1) {
                        if (!this._canModifyGroup(selectionInfo)) {
                            return;
                        }
                        var url = dojoString.substitute('QueryBuilderMain.aspx?gid=${groupid}&mode=${family}', { groupid: selectionInfo.selections[0].id, family: selectionInfo.selections[0].entity.family });
                        var width = Sage.Groups.GroupManager.QB_WIDTH;
                        var height = Sage.Groups.GroupManager.QB_HEIGHT;
                        window.open(url, 'EditGroup', dojoString.substitute('resizable=yes,centerscreen=yes,width=${width},height=${height},status=no,toolbar=no,scrollbars=yes', { width: width, height: height }));
                    } else {
                        dialogs.showInfo(nlsResources.SelectRecordMsgSingle);
                    }
                }
            },
            exportToExcel: function() {
                dialogs.showInfo('Not implemented.');
            },
            exportToPdf: function() {
                dialogs.showInfo('Not implemented.');
            },
            initShowHideDetail: function(owner) {
                var listpanel = dijit.byId('list');
                if (listpanel) {
                    var connection = dojo.connect(listpanel._listGrid, '_onFetchComplete', listpanel, lang.hitch(listpanel, function () {
                        dojo.disconnect(connection);
                        var showDetail = owner._getShowDetail();
                        if (showDetail === 'true') {
                            if (!listpanel.detailVisible) {
                                listpanel.toggleDetail();
                            }
                            listpanel._onSelectedInList(0);
                        } else {
                            if (listpanel.detailVisible) {
                                listpanel.toggleDetail();
                            }
                        }
                    }));
                }
            },
            shareGroup: function() {
                var panel = dijit.byId('list');
                if (panel) {
                    var selectionInfo = panel.getSelectionInfo(true);
                    if (selectionInfo && selectionInfo.selectionCount == 1) {
                        if (!this._canModifyGroup(selectionInfo)) {
                            return;
                        }
                        var url = dojoString.substitute('ShareGroup.aspx?gid=${groupid}', { groupid: selectionInfo.selections[0].id });
                        window.open(url, 'ShareGroup', "resizable=yes,centerscreen=yes,width=500,height=450,status=no,toolbar=no,scrollbars=yes");
                    } else {
                        dialogs.showInfo(nlsResources.SelectRecordMsgSingle);
                    }
                }
            },
            viewGroup: function() {
                var panel = dijit.byId('list');
                if (panel) {
                    var selectionInfo = panel.getSelectionInfo(true);
                    if (selectionInfo && selectionInfo.selectionCount == 1) {
                        window.location.href = dojoString.substitute('${mainTable}.aspx?gid=${groupid}&mode=list', { mainTable: selectionInfo.selections[0].entity.entityName, groupid: selectionInfo.selections[0].id });
                    } else {
                        dialogs.showInfo(nlsResources.SelectRecordMsgSingle);
                    }
                }
            }
        });
        return Sage.MainView.GroupMgr.GroupManagerActions;
    });