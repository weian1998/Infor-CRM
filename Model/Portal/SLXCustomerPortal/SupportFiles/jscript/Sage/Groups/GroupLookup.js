/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
        'dijit/_Widget',
        'Sage/_Templated',
        'dijit/Dialog',
        'Sage/UI/ConditionManager',
        'Sage/Data/SDataServiceRegistry',
        'Sage/Groups/GroupContextService',
        'dojo/_base/lang',
        'dojo/_base/declare',
        'Sage/UI/Controls/_DialogHelpIconMixin',
        'dojo/_base/array',
        'dojo/topic',
        'dojo/aspect',
        'Sage/Data/GroupLayoutSingleton',
        'Sage/Utility',
        'dojo/_base/xhr',
        'Sage/UI/Dialogs',
        'dojo/i18n!./nls/GroupLookup'
],
function (
        _Widget,
        _Templated,
        Dialog,
        ConditionManager,
        sDataServiceRegistry,
        GroupContextService,
        lang,
        declare,
        _DialogHelpIconMixin,
        array,
        topic,
        aspect,
        GroupLayoutSingleton,
        Utility,
        dojoXhr,
        dialogs,
        nlsResources
    ) {
    var lookupDialog = declare('Sage.Groups.GroupLookupDialog', [_Widget, _Templated], {
        widgetsInTemplate: true,
        conditionMgr: false,
        title: '',
        widgetTemplate: new Simplate([
            '<div>',
                '<div data-dojo-type="dijit.Dialog" id="groupLookupDialog" title="&nbsp;" dojoAttachPoint="dlg" >',
                '</div>',
            '</div>'
        ]),
        constructor: function (o) {
        },
        show: function () {
            if (this.conditionMgr) {
                var userOptions = Sage.Services.getService('UserOptions');
                if (userOptions) {
                    userOptions.get('defaultLookupCondition', 'DefaultLookupCondition', lang.hitch(this, function (option) {
                        this.conditionMgr.setFirstConditionValue('', option.value, '');
                    }));
                }

                // mixin help icon
                lang.mixin(this.dlg, new _DialogHelpIconMixin());
                this.dlg.createHelpIconByTopic('lookup');

                this.dlg.show();
            }
        },
        hide: function () {
            this.dlg.hide();
        },
        _setConditionMgrAttr: function (conditionMgr) {
            this.conditionMgr = conditionMgr;
            dojo.place(this.conditionMgr.domNode, this.dlg.containerNode, 'only');
        },
        _setTitleAttr: function (title) {
            this.title = title;
            this.dlg.set('title', title);
        }
    });

    var groupLookup = declare('Sage.Groups.GroupLookup', null, {
        conditions: [],
        _layouts: {},
        _currentLayoutFamily: false,
        service: false,
        _dlgWindow: false,
        _conditionMgr: false,
        _doSearchConnection: false,
        _onSearchNavTo: false,
        _stayInDetailView: false, //Extended Group List
        id: 'GroupLookup',
        constructor: function () {
            this.isInitialized = false;
            //Extended Group List
            this._loadUserOptions();
            topic.subscribe('userOptions/changed', lang.hitch(this, this._onUserOptionsChanged));
        },
        //public API
        //show the lookup dialog
        showLookup: function (opts) {
            if (typeof opts === 'undefined') {
                var cSvc = Sage.Services.getService("ClientGroupContext");
                this._currentLayoutFamily = cSvc.getContext().CurrentFamily;
                opts = { family: this._currentLayoutFamily };
            }
            this._onSearchNavTo = (opts.returnTo) ? opts.returnTo : false;
            if (!this._layouts.hasOwnProperty(opts.family)) {
                this._currentLayoutFamily = opts.family;
                //get the layout for this family...
                this._requestLayout({
                    family: opts.family,
                    success: this._showInitializedLookup
                });
                return;
            }

            if (this._currentLayoutFamily !== opts.family) {
                this._currentLayoutFamily = opts.family;
            }

            this._resetConditionManager();
            this._showInitializedLookup();
        },
        _showInitializedLookup: function () {
            var svc = Sage.Services.getService('ClientEntityContext'),
                context = svc && svc.getContext(),
                displayName = context && context.DisplayName,
                tableNameFromContext = context && context.EntityTableName,
                tableNameFromLayout = this._layouts[this._currentLayoutFamily]['mainTable'],
                entityName = this._layouts[this._currentLayoutFamily]['entityName'];

            if (!this._dlgWindow) {
                this._dlgWindow = new lookupDialog({ conditionMgr: this._conditionMgr });
            }
            if (!this._dlgWindow.conditionMgr) {
                this._dlgWindow.set('conditionMgr', this._conditionMgr);
            }

            if (tableNameFromContext !== tableNameFromLayout) {
                displayName = entityName;
            }

            this._dlgWindow.set('title', displayName);
            this._dlgWindow.show();
        },

        //connected to the Search button click handler for lookup dialog
        doLookup: function (args) {
            var groupContextService = Sage.Services.getService("ClientGroupContext");
            var context = groupContextService.getContext();
            var groupListTasklet = dijit.byId('GroupList');
            if (groupListTasklet) {
                groupListTasklet.previousGroupId = context.CurrentGroupID;
            }

            this._ensureService();
            this._dlgWindow.hide();
            var request = new Sage.SData.Client.SDataServiceOperationRequest(this.service);
            request.setOperationName('setGroupLookupConditions');
            request.execute({
                request: {
                    family: this._currentLayoutFamily,
                    conditions: this.getConditionsString(),
                    includeConditionsFrom: ''  // can put another group ID here to include conditions from that group...
                }
            }, {
                success: function (response) {
                    var shouldStayInDetailView = this._shouldStayInDetailView();
                    var currentViewMode = Utility.getModeId();

                    //NRADDATZ: If the lookup results group has no records, we just display a message, and conclude the operation.
                    if (this._getGroupCount() === 0) {
                        dialogs.showInfo(nlsResources.txtNoRecordsFound);
                        return;
                    }

                    var navTo = this._onSearchNavTo + "?modeid=list&gid=LOOKUPRESULTS",
                        path = document.location.toString().toLowerCase(),
                        comp = this._onSearchNavTo && this._onSearchNavTo.toLowerCase();

                    if (context.CurrentFamily && this._currentLayoutFamily && context.CurrentFamily.toUpperCase() === this._currentLayoutFamily.toUpperCase()) {
                        aspect.after(groupContextService, 'onCurrentGroupChanged', lang.hitch(this, function () {
                            //NRADDATZ Feb 2014: For some reason, onCurrentGroupChanged is being triggered twice
                            //which in turn triggers aspect.after twice as well. Not sure what's going on here.
                            topic.publish("/group/lookup/success", { 'conditions': this.getConditionsString() });
                            if (!shouldStayInDetailView && currentViewMode === 'detail') {
                                //NRADDATZ: This call used to be initiated from GroupListTasklet._onLookupSuccess
                                //there was no apparent reason for that, so I moved the call here to simplify the code.
                                Sage.Link.toListView();
                            }
                        }));

                        if (groupListTasklet && !shouldStayInDetailView) {
                            groupListTasklet.shouldNotUpdate = true;
                        }

                        //Flag to let the group list tasklet know that a lookup is being performed.
                        //It is used to avoid double triggering of the groupChanged event.
                        if (groupListTasklet) {
                            groupListTasklet.performingLookup = true;
                        }

                        //NRADDATZ Feb 2014: This call causes ClientGroupContext onCurrentGroupChanged to be executed twice 
                        //even though if I manually run it from chrome's console that is not the case.                        
                        groupContextService.setCurrentGroup('LOOKUPRESULTS');

                    }

                    if (this._onSearchNavTo) {
                        if (path.indexOf(comp) === -1) {
                            document.location = navTo;
                            return;
                        }
                    }

                },
                scope: this
            });
        },
        // do we need this?
        resetLookup: function (data) {

        },
        //returns json string of the "conditions"
        getConditionsString: function () {
            return this._conditionMgr.getConditionsJSON();
        },
        _ensureService: function () {
            if (!this.service) {
                this.service = sDataServiceRegistry.getSDataService('system');
            }
        },
        //'private' internal helper methods
        _requestLayout: function (options) {
            this._ensureService();
            if (!options.family) {
                var grpContextSvc = Sage.Services.getService('ClientGroupContext');
                options.family = grpContextSvc.getContext().CurrentFamily || 'ACCOUNT';
            }
            var predicate = dojo.string.substitute('name eq \'Lookup Results\' and upper(family) eq \'${0}\'', [options.family.toUpperCase()]),
                onSuccess = lang.hitch(this, this._onReadSuccess, options),
                singleton = new GroupLayoutSingleton();
            singleton.getGroupLayout(predicate, onSuccess, null, 'LOOKUPRESULTS');
        },
        _onReadSuccess: function (options, data) {
            this._layouts[options.family] = data;
            this._currentLayoutFamily = options.family;
            this._resetConditionManager();

            if (typeof options.success === 'function') {
                options.success.call(options.scope || this, data);
            }
        },
        _resetConditionManager: function () {
            if (!this._currentLayoutFamily) {
                return;
            }

            if (this._conditionMgr) {
                this._conditionMgr.destroy(false);
                this._conditionMgr = null;
            }

            var fields = array.filter(this._layouts[this._currentLayoutFamily]['layout'], function (field) {
                return field.caption && field.caption !== '' && field.visible;
            });

            // The format field is used by the condition manager to determine the type.
            // If it is set to None, attempt to use the fieldType property instead.
            // Unfortunately we can't switch to fieldType for User/DateTime, etc.
            fields = array.map(fields, function (field) {
                if (field.format && field.format === 'None') {
                    field.format = field.fieldType;
                }

                return field;
            });

            this._conditionMgr = new ConditionManager({
                fields: fields,
                fieldNameProperty: 'alias',
                fieldDisplayNameProperty: 'caption', // 'displayName',
                fieldTypeProperty: 'format',
                id: this.id + '-ConditionManager'
            });

            if (this._dlgWindow) {
                this._dlgWindow.set('conditionMgr', this._conditionMgr);
            }

            this._doSearchConnection = dojo.connect(this._conditionMgr, "onDoSearch", this, "doLookup");
        },
        destroy: function () {
            if (this._doSearchConnection) {
                dojo.disconnect(this._doSearchConnection);
                this._doSearchConnection = false;
            }
            this.inherited(arguments);
        },

        /**
        * Updates the user options when a change is published.
        * @return {undefined}
        * @private
        */
        _onUserOptionsChanged: function (options) {
            this._stayInDetailView = options.groupLookup.stayInDetailView;
        },

        /**
       * Loads user options.
       * @return {undefined}
       * @private
       */
        _loadUserOptions: function () {
            var svc = Sage.Services.getService("UserOptions");
            if (svc) {
                svc.get('StayInDetailView', 'GroupLookup', lang.hitch(this, function (option) {
                    if (option && option.value) {
                        this._stayInDetailView = (option.value === 'T') ? true : false;
                    }
                }), null, null, true);
            }
        },

        /**
        * If the current view mode is detail, checks user options to determine whether the system
        * should stay on detail mode when a lookup is performed.
        * @return {Boolean}
        * @private
        */
        _shouldStayInDetailView: function () {
            var currentViewMode = Utility.getModeId();
            return (currentViewMode === 'detail' && this._stayInDetailView);
        },

        /**
        * Returns the count of records on the lookup results group.
        * @return {Boolean}
        * @private
        */
        _getGroupCount: function () {
            var family = this._currentLayoutFamily;
            var groupCount = 0;

            if (family) {

                //Note we set a count of 0 records, since we are only concerned with the $totalResults of the group, not the individual records
                var url = "slxdata.ashx/slx/system/-/groups(name eq 'Lookup Results' and upper(family) eq '" + family + "')/$queries/execute?count=0&format=json";

                //TODO: The code below should probably be converted to a proper sdata call using the sdata client library.            
                //Make a synchronous call to get the lookup group record count
                dojoXhr('GET', {
                    url: url,
                    handleAs: "json",
                    sync: true,
                    preventCache: true //Required to prevent IE from caching the request
                }).then(function (data) {
                    groupCount = data.$totalResults;
                });
            }

            return groupCount;

        }
    });

    Sage.Services.addService('GroupLookupManager', new Sage.Groups.GroupLookup());
    return groupLookup;
});
