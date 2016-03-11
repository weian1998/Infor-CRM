/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
       'dojo/data/ItemFileWriteStore',
       'dojox/widget/Portlet',
       'Sage/UI/Controls/_DialogHelpIconMixin',
       'dojo/_base/declare',
       'dojo/i18n!./Dashboard/nls/WidgetDefinition',
       'dojo/dom-style',
       'dojo/on',
       'dojo/_base/lang',
       'dojo/string',
       'Sage/Data/BaseSDataStore',
       'Sage/Data/SDataServiceRegistry'
],
function (itemFileReadStore, portlet, _DialogHelpIconMixin, declare, widgetDefinition, domStyle, on, lang, dojoString, BaseSDataStore, SDataServiceRegistry) {
    var widget = declare('Sage.UI.WidgetEditor', [dojox.widget.PortletDialogSettings], {
        _grpUrl: {
            replace: 'where',
            start: 0,
            count: 100,
            domain: 'system',
            kind: "groups",
            include: null,
            service: Sage.Data.SDataServiceRegistry.getSDataService('system'),
            entityName: null,
            where: "upper(family) eq upper('${0}')",
            select: 'name,displayName',
            orderBy: 'name',
            format: 'json',
            store: null
        },
        _dimUrl: {
            replace: 'kind',
            start: 0,
            count: 100,
            domain: 'metadata',
            kind: "entities('${0}')/filters",
            include: null,
            service: Sage.Data.SDataServiceRegistry.getSDataService('metadata'),
            entityName: null,
            where: "analyticsAvailable and filterType ne 'analyticsMetric'",
            select: 'filterName,displayName,analyticsDescription',
            format: 'json',
            orderBy: 'filterName',
            store: null
        },
        _metUrl: {
            replace: 'kind',
            start: 0,
            count: 100,
            domain: 'metadata',
            kind: "entities('${0}')/filters",
            include: null,
            service: Sage.Data.SDataServiceRegistry.getSDataService('metadata'),
            entityName: null,
            where: "analyticsAvailable and filterType eq 'analyticsMetric'",
            select: 'filterName,displayName,analyticsDescription',
            format: 'json',
            orderBy: 'filterName',
            store: null
        },
        _entityUrl: {
            replace: null,
            start: 0,
            count: 100,
            domain: 'metadata',
            kind: "entities",
            include: "filters",
            service: Sage.Data.SDataServiceRegistry.getSDataService('metadata'),
            entityName: null,
            where: "filters.analyticsAvailable eq true and filters.filterType eq 'analyticsMetric'",
            select: 'name,displayName,tableName', // we are using tableName because groups works off of that.
            format: 'json',
            orderBy: 'name',
            store: null
        },

        // bit of a hack, but more efficient than querying the store for it
        _addEnt: function (str) {
            return 'Sage.Entity.Interfaces.I' + str;
        },
        _remEnt: function (str) {
            return str.replace('Sage.Entity.Interfaces.I', '');
        },
        // remove '&' if it is the last character 
        _remAmp: function (str) {
            return str[str.length - 1] === '&' ? str.slice(0, -1) : str;
        },
        _pushEnt: function (val) {
            this._entStr = dojoString.substitute('entity=${0}&', [encodeURIComponent(val)]);
        },
        _pushGrp: function (val) {
            this._grpStr = dojoString.substitute('groupname=${0}&', [encodeURIComponent(val)]);
        },
        _pushDim: function (val) {
            this._dimStr = dojoString.substitute('dimension=${0}&', [encodeURIComponent(val)]);
        },
        _pushMet: function (val) {
            this._metStr = dojoString.substitute('metric=${0}&', [encodeURIComponent(val)]);
        },
        _pushLim: function (val) {
            this._limStr = dojoString.substitute('limit=${0}&', [encodeURIComponent(val)]);
        },
        _pushOth: function (val) {
            this._othStr = dojoString.substitute('combineother=${0}', [encodeURIComponent(val)]);
        },
        _checkHydrate: function () {
            var opts = this.portlet.widgetOptions;

            if (opts.groupname && this._grpField) {
                if (this._originalGroup) {
                    opts.groupname = this._originalGroup;
                }
                var groupField = this._grpField;
                groupField.store.fetch({
                    query: { name: opts.groupname },
                    onComplete: function (i, r) {
                        if (i.length > 0) {
                            groupField.set('value', groupField.store.getValue(i[0], '$descriptor'));
                        }
                    },
                    queryOptions: { deep: true }
                });
                this._originalGroup = opts.groupname;
            }
            if (opts.dimension && this._dimField) {
                if (this._originalDimension) {
                    opts.dimension = this._originalDimension;
                }
                var df = this._dimField;
                df.store.fetch({
                    query: { filterName: opts.dimension },
                    onComplete: function (i, r) {
                        if (i.length > 0) {
                            var dimStart = df.store.getValue(i[0], '$descriptor');
                            df.set('value', dimStart);
                        }
                    },
                    queryOptions: { deep: true }
                });
                this._originalDimension = opts.dimension;
            }
            if (opts.metric && this._metField) {
                if (this._originalMetric) {
                    opts.metric = this._originalMetric;
                }
                var mf = this._metField;
                mf.store.fetch({
                    query: { filterName: opts.metric },
                    onComplete: function (i, r) {
                        if (i.length > 0) {
                            var metStart = mf.store.getValue(i[0], '$descriptor');
                            mf.set('value', metStart);
                        }
                    },
                    queryOptions: { deep: true }
                });
                this._originalMetric = opts.metric;
            }
            this._hydrateChecked = true;
        },
        // TODO perhaps implement this as a hash. this is not a data intensive 
        // period in the page cycle though, so it may not matter
        _setFields: function (child) {
            switch (child.id) {
                case this.portlet.id + '_ttlField':
                    this._ttlField = child;
                    break;
                case this.portlet.id + '_subField':
                    this._subField = child;
                    break;
                case this.portlet.id + '_entCombo':
                    this._entField = child;
                    on.once(this._entField._buttonNode, 'click', lang.hitch(this, function () {

                        var entityFieldLoading = dojo.byId(this.portlet.id + '_loading');
                        domStyle.set(entityFieldLoading, 'display', 'block');

                        this._entField.set('store', this._entityUrl.store);
                        if (this._entityUrl.store._arrayOfAllItems.length > 0) {
                            domStyle.set(entityFieldLoading, 'display', 'none');
                            // Ensure the drop-down opens now
                            // and add focus so clicking away closes it, too
                            this._entField.loadAndOpenDropDown();
                            this._entField.focus();
                        }

                    }));
                    break;
                case this.portlet.id + '_grpCombo':
                    this._grpField = child;
                    break;
                case this.portlet.id + '_dimCombo':
                    this._dimField = child;
                    break;
                case this.portlet.id + '_metCombo':
                    this._metField = child;
                    break;
                case this.portlet.id + '_goalField':
                    this._goalField = child;
                    break;
                case this.portlet.id + '_xField':
                    this._xField = child;
                    break;
                case this.portlet.id + '_yField':
                    this._yField = child;
                    break;
                case this.portlet.id + '_numberMaximum':
                    this._numberMaximum = child;
                    this._numberMaximum.constraints.min = 1; // ensure this is positive
                    break;
                case this.portlet.id + '_rdoOthY':
                    this._rdoOthY = child;
                    break;
                case this.portlet.id + '_rdoOthN':
                    this._rdoOthN = child;
                    break;
                case this.portlet.id + '_rdoLegY':
                    this._rdoLegY = child;
                    break;
                case this.portlet.id + '_rdoLegN':
                    this._rdoLegN = child;
                    break;
                case this.portlet.id + '_rdoLabY':
                    this._rdoLabY = child;
                    break;
                case this.portlet.id + '_rdoLabN':
                    this._rdoLabN = child;
                    break;
                case this.portlet.id + '_rdoTruY':
                    this._rdoTruY = child;
                    break;
                case this.portlet.id + '_rdoTruN':
                    this._rdoTruN = child;
                    break;
                case this.portlet.id + '_truncField':
                    this._truncField = child;
                    this._truncField.constraints.min = 1; // ensure this is positive
                    break;
                case this.portlet.id + '_btnOK':
                    this._btnOK = child;
                    break;
                case this.portlet.id + '_btnCancel':
                    this._btnCancel = child;
                    this._btnCancel.set('style', 'margin-left:10px;');
                    break;
                default:
                    //Add custom dijits to the widget editor
                    this[child.id] = child;

                    if (!this.customOptions) {
                        this.customOptions = [];
                    }

                    var splitValue = child.id.split(this.portlet.id);
                    if (splitValue.length == 2) {
                        if (splitValue[1].indexOf('_') === 0) {
                            splitValue[1] = splitValue[1].substring(1);
                        }

                        this.customOptions.push({ id: child.id, option: splitValue[1] });
                    }

                    break;
            }
        },
        _validateOOTBRequired: function () {
            // Ent/Grp/Dim/Met require a lookup if change event 
            // not fired
            var retVal = true;
            if (this._entField && !this._entField.isValid()) {
                this._entField.set('state', 'Error');
                retVal = false;
            }
            if (this._grpField && !this._grpField.isValid()) {
                this._grpField.set('state', 'Error');
                retVal = false;
            }
            if (this._dimField && !this._dimField.isValid()) {
                this._dimField.set('state', 'Error');
                retVal = false;
            }
            if (this._metField && !this._metField.isValid()) {
                this._metField.set('state', 'Error');
                retVal = false;
            }
            return retVal;
        },
        _getTableNameOfEntity: function (arg) {
            var tableName = null;
            var name = null;
            var displayName = null;

            if (typeof (this._entField.item) !== "undefined" && this._entField.item !== null) {

                tableName = this._entField.item.tableName[0]; // if we have a selected item we will use that as the raw
                name = this._entField.item.name[0];
                displayName = this._entField.item.displayName[0];

                return { name: name, tableName: tableName, displayName: displayName };
            }
            else {
                if (typeof (this._entField.store) !== "undefined" && this._entityUrl.store._itemsByIdentity) {
                    // when the page first loads there is no selected item, but we may be able to get the raw value
                    // from our datastore using the arg passed in to the toggle method.
                    if (arg.length > 0 && this._entityUrl.store._itemsByIdentity[arg]) {

                        tableName = this._entityUrl.store._itemsByIdentity[arg].tableName[0];
                        name = this._entityUrl.store._itemsByIdentity[arg].name[0];
                        displayName = this._entityUrl.store._itemsByIdentity[arg].displayName[0];

                        return { name: name, tableName: tableName, displayName: displayName };
                    }
                } // since we have to deal with different languages

                var i;
                for (i = 0; i < this._entityUrl.store._arrayOfAllItems.length; i++) {

                    var currEntity = this._entityUrl.store._arrayOfAllItems[i];

                    if (currEntity['$descriptor'][0] === arg) {

                        tableName = currEntity['tableName'][0];
                        name = currEntity['name'][0];
                        displayName = currEntity['displayName'][0];

                        return { name: name, tableName: tableName, displayName: displayName };
                    }
                }
            }


            return { name: name, tableName: tableName, displayName: displayName };
        },
        _updateGroupsDimensionsMetricsStores: function (arg) {

            var opts = this.portlet.widgetOptions;

            arg = opts.resource ? opts.resource : arg;

            var selected = this._getTableNameOfEntity(this._remEnt(arg));
            // This is important because it ends up setting the language for the other dropdowns
            var fullEntityName = this._entField.item ? this._entField.item.$descriptor[0] : this._addEnt(selected.displayName);

            if (selected !== null) {

                var entityName = selected.name;
                this._pushEnt(entityName);

                opts.entity = fullEntityName;   //entity name as displayed
                opts.resource = entityName;     // entity's table name

                if (this._grpField) {
                    this._grpUrl.entityName = selected.tableName;
                    this._populate(this._grpUrl);
                    this._grpField.store.urlPreventCache = true;
                    this._grpField.set('builder', this._grpUrl);
                    this._grpField.set('store', this._grpUrl.store);
                    this._grpField.set('value', '');
                }
                if (this._dimField) {
                    this._dimUrl.entityName = selected.name;
                    this._populate(this._dimUrl);
                    this._dimField.set('builder', this._dimUrl);
                    this._dimField.set('store', this._dimUrl.store);
                    this._dimField.set('value', '');
                }
                if (this._metField) {
                    this._metUrl.entityName = selected.name;
                    this._populate(this._metUrl);
                    this._metField.set('builder', this._metUrl);
                    this._metField.set('store', this._metUrl.store);
                    this._metField.set('value', '');
                }
                this._checkHydrate();
            }
        },
        toggle: function () {

            console.log("page load");

            var that = this;
            var dashboardPage = dijit.byId(that.portlet._parentId);
            var i, len;
            if (dashboardPage.permission) {
                // which fields do I have?
                if (!this._childWidgets) {
                    this._childWidgets = this.getChildren();
                    // cycle through and assign names for manipulation
                    // as we will have a limited number of types predefined
                    for (i = 0, len = this._childWidgets.length; i < len; i++) {
                        this._setFields(this._childWidgets[i]);
                    }
                }
                // Shows and hides the Dialog box.
                if (!this.dialog) {
                    dojo.require("dijit.Dialog");
                    this.dialog = new dijit.Dialog({ title: this.title });
                    this.dialog.containerNode.style.height = this.dimensions[1] + "px";
                    if (!this.dialog.helpIcon) {
                        dojo.mixin(this.dialog, new _DialogHelpIconMixin());
                        this.dialog.createHelpIconByTopic('Using_Widgets');
                    }

                    dojo.body().appendChild(this.dialog.domNode);
                    // Move this widget inside the dialog
                    this.dialog.containerNode.appendChild(this.domNode);
                    dojo.style(this.dialog.domNode, {
                        "width": this.dimensions[0] + "px",
                        "height": (this.dimensions[1] + 50) + "px"
                    });
                    dojo.style(this.domNode, "display", "");
                }
                // CLOSE the dialog
                if (this.dialog.open) {
                    // reset hydrate_check
                    this._hydrateChecked = false;
                    this.dialog.hide();
                } else {
                    // OPEN the dialog
                    // NOTE parentCell = this.portlet
                    var opts = this.portlet.widgetOptions;
                    this.dialog.show(this.domNode);
                    // hydrate title
                    if (opts.title && this._ttlField) {
                        var resourceTitleString = opts.title.replace(/'/g, '_').replace(/ /g, '_');
                        this._ttlField.set('value', widgetDefinition[resourceTitleString] || opts.title);
                    }
                    // Do I have an entity field?
                    if (this._entField) {

                        this._populate(this._entityUrl);
                        this._entField.store.urlPreventCache = true;
                        this._entField.set('builder', this._entityUrl);
                        this._entField.set('store', this._entityUrl.store);
                        this._entField.set('value', '');

                        // Do not assume all four fields.  But if they are all there,
                        // their events will be chained to one another.
                        // set the change listeners
                        if (this._entField && !this._entChange) {
                            this._entChange = dojo.connect(this._entField, "onChange", this, this._updateGroupsDimensionsMetricsStores);
                        }
                    } // end ent/grp/dim/met
                    // hydrate subtitle
                    if (this._subField) {
                        if (opts.subtitle) {
                            this._subField.set('value',
                            opts.subtitle);
                        }
                        else {
                            this._subField.set('value', '');
                        }
                    }
                    // hydrate axes
                    if (this._xField) {
                        if (opts.xAxisName) {
                            this._xField.set('value',
                            opts.xAxisName);
                        }
                        else {
                            this._xField.set('value', '');
                        }
                    }
                    if (this._yField) {
                        if (opts.yAxisName) {
                            this._yField.set('value',
                            opts.yAxisName);
                        }
                        else {
                            this._yField.set('value', '');
                        }
                    }
                    if (this._numberMaximum) {
                        if (opts.numberMaximum) {
                            this._numberMaximum.set('value',
                                opts.numberMaximum);
                        }
                        else {
                            this._numberMaximum.set('value', '10');
                        }
                    }
                    // hydrate goal
                    if (this._goalField) {
                        if (opts.goal) {
                            this._goalField.set('value',
                            opts.goal);
                        }
                        else {
                            this._goalField.set('value', '');
                        }
                    }
                    // do I have a radio Other?
                    if (this._rdoOthY) {
                        if (!opts.combineother) {
                            this._rdoOthN.set('checked', true);
                        } else {
                            if (opts.combineother === 'true') {
                                this._rdoOthY.set('checked', true);
                            } else {
                                this._rdoOthN.set('checked', true);
                            }
                        }
                    }
                    // do I have a radio Legend?
                    if (this._rdoLegY) {
                        if (!opts.showLegend) {
                            this._rdoLegN.set('checked', true);
                        } else {
                            if (opts.showLegend === 'true') {
                                this._rdoLegY.set('checked', true);
                            } else {
                                this._rdoLegN.set('checked', true);
                            }
                        }
                    }
                    // do I have a radio Labels?
                    if (this._rdoLabY) {
                        if (!opts.showLabels) {
                            this._rdoLabN.set('checked', true);
                        } else {
                            if (opts.showLabels === 'true') {
                                this._rdoLabY.set('checked', true);
                            } else {
                                this._rdoLabN.set('checked', true);
                            }
                        }
                    }
                    // do I have a radio truncate?
                    if (this._rdoTruY) {
                        if (!opts.truncLabels) {
                            this._rdoTruN.set('checked', true);
                        } else {
                            if (opts.truncLabels === 'true') {
                                this._rdoTruY.set('checked', true);
                            } else {
                                this._rdoTruN.set('checked', true);
                            }
                        }
                    }
                    // hydrate trunc number
                    if (this._truncField) {
                        if (opts.truncNum) {
                            this._truncField.set('value',
                            opts.truncNum);
                        }
                        else {
                            this._truncField.set('value', '');
                        }
                    }
                    // hydrate custom options
                    if (this.customOptions) {
                        for (i = 0; i < this.customOptions.length; i++) {
                            // TO-DO: check control type, as setting of the Value could be different
                            //        if this isn't a TextBox-style control
                            var optionName = this.customOptions[i].option,
                                optionId = this.customOptions[i].id;
                            if (opts[optionName]) {
                                this[optionId].set('value', opts[optionName]);
                            }
                        }
                    }

                    //Run any 'API' init methods.             
                    for (i = 0; i < this._childWidgets.length; i++) {
                        if (this._childWidgets[i]._myEditRowInit) {
                            this._childWidgets[i]._myEditRowInit(opts);
                        }
                    }

                    //OK and Cancel buttons
                    if (!this._cancelClick) {
                        this._cancelClick = dojo.connect(this._btnCancel, 'onClick',
                            this, function () {
                                //Run any 'API' cancel methods.             
                                for (i = 0; i < this._childWidgets.length; i++) {
                                    if (this._childWidgets[i]._myEditRowCancel) {
                                        this._childWidgets[i]._myEditRowCancel(opts);
                                    }
                                }
                                //Close dialog.
                                this.toggle();
                                // If you are cancelling the initial configuration of the widget we are going 
                                // to clean it up for you.  We don't want non-configured widgets hanging around.
                                if (this.portlet.isNew) {
                                    this.portlet.onClose();
                                    this.portlet.destroy();
                                }
                            });
                    }
                    if (!this._okClick) {
                        this._okClick = dojo.connect(this._btnOK, 'onClick',
                            this, function () {
                                var _uri = ['slxdata.ashx/slx/crm/-/analytics?'];
                                // assume a title field
                                if (this._ttlField) {
                                    if (!this._ttlField.isValid()) { return false; }
                                    var nTitle = this._ttlField.get('value');
                                    var resourceTitleString = opts.title.replace(/'/g, '_').replace(/ /g, '_');

                                    if (nTitle) {
                                        this.portlet.set('title', nTitle);

                                        if (nTitle != widgetDefinition[resourceTitleString]) {
                                            opts.title = nTitle;
                                        }
                                    }
                                }
                                if (this._subField) {
                                    var sub = this._subField.get('value');
                                    if (sub) {
                                        opts.subtitle = sub;
                                    }
                                    else {
                                        opts.subtitle = '';
                                    }
                                    if (!this._subField.isValid()) { return false; }
                                }
                                if (this._xField) {
                                    var xa = this._xField.get('value');
                                    if (xa) {
                                        opts.xAxisName = xa;
                                    }
                                    else {
                                        opts.xAxisName = '';
                                    }
                                    if (!this._xField.isValid()) { return false; }
                                }
                                if (this._yField) {
                                    var ya = this._yField.get('value');
                                    if (ya) {
                                        opts.yAxisName = ya;
                                    }
                                    else {
                                        opts.yAxisName = '';
                                    }
                                    if (!this._yField.isValid()) { return false; }
                                }
                                if (this._numberMaximum) {
                                    var maximum = this._numberMaximum.get('value');
                                    if (maximum) {
                                        opts.numberMaximum = maximum;
                                    }
                                    else {
                                        opts.numberMaximum = '5';
                                    }
                                    this._pushLim(opts.numberMaximum);
                                    if (!this._numberMaximum.isValid()) { return false; }
                                }
                                if (this._goalField) {
                                    var gl = this._goalField.get('value');
                                    if (gl) {
                                        opts.goal = gl;
                                    }
                                    else {
                                        opts.goal = '';
                                    }
                                    if (!this._goalField.isValid()) { return false; }
                                }
                                if (this._rdoLabY) {
                                    var labChkY = this._rdoLabY.get('value');
                                    if (labChkY) {
                                        opts.showLabels = 'true';
                                    } else {
                                        opts.showLabels = 'false';
                                    }
                                }
                                if (this._rdoTruY) {
                                    var truChkY = this._rdoTruY.get('value');
                                    if (truChkY) {
                                        opts.truncLabels = 'true';
                                    } else {
                                        opts.truncLabels = 'false';
                                    }
                                }
                                if (this._rdoOthY) {
                                    var othChkY = this._rdoOthY.get('value');
                                    if (othChkY) {
                                        opts.combineother = 'true';
                                        this._pushOth('true');
                                    } else {
                                        opts.combineother = 'false';
                                        this._pushOth('false');
                                    }
                                }
                                if (this._rdoLegY) {
                                    var legChkY = this._rdoLegY.get('value');
                                    if (legChkY) {
                                        opts.showLegend = 'true';
                                    } else {
                                        opts.showLegend = 'false';
                                    }
                                }
                                if (this._truncField) {
                                    var num = this._truncField.get('value');
                                    if (num) {
                                        opts.truncNum = num;
                                    }
                                    if (!this._truncField.isValid()) { return false; }
                                }

                                if (!this._validateOOTBRequired()) { return false; }

                                if (this._grpField) {
                                    if (!this._grpStr) {
                                        this._grpField.store.fetch({
                                            query: { $descriptor: this._grpField.get('value') },
                                            onComplete: function (i, r) {
                                                that._pushGrp(that._grpField.store.getValue(
                                                    i[0], 'name'));
                                            },
                                            queryOptions: { deep: true }
                                        });
                                    }
                                }
                                if (this._dimField) {
                                    if (!this._dimStr) {
                                        this._dimField.store.fetch({
                                            query: { $descriptor: this._dimField.get('value') },
                                            onComplete: function (i, r) {
                                                that._pushDim(that._dimField.store.getValue(
                                                    i[0], 'filterName'));
                                            },
                                            queryOptions: { deep: true }
                                        });
                                    }
                                }
                                if (this._metField) {
                                    if (!this._metStr) {
                                        this._metField.store.fetch({
                                            query: { $descriptor: this._metField.get('value') },
                                            onComplete: function (i, r) {
                                                that._pushMet(that._metField.store.getValue(
                                                    i[0], 'filterName'));
                                            },
                                            queryOptions: { deep: true }
                                        });
                                    }
                                }

                                if (this.customOptions) {
                                    for (i = 0; i < this.customOptions.length; i++) {
                                        var optionName = this.customOptions[i].option,
                                            optionId = this.customOptions[i].id;
                                        opts[optionName] = this[optionId].value;
                                    }
                                }

                                //Run any 'API' save methods.             
                                for (i = 0; i < this._childWidgets.length; i++) {
                                    if (this._childWidgets[i]._myEditRowSave) {
                                        this._childWidgets[i]._myEditRowSave(opts);
                                    }
                                }

                                if (this._dimStr) { _uri.push(this._dimStr); } // Dimension 
                                if (this._metStr) { _uri.push(this._metStr); } // Metric
                                if (this._entStr) { _uri.push(this._entStr); } // Entity
                                if (this._grpStr) { _uri.push(this._grpStr); } // Group
                                if (this._limStr) { _uri.push(this._limStr); }
                                if (this._othStr) { _uri.push(this._othStr); }
                                opts.datasource = this._remAmp(_uri.join(''));
                                //console.log(this._remAmp(_uri.join('')));
                                dojo.publish('/ui/dashboard/pageSave', [this.portlet._page]);
                                // Editor values have been posted. 
                                // Now the portlet is no longer new.
                                if (this.portlet.isNew) {
                                    this.portlet.isNew = false;
                                }
                                this.portlet.refresh(true);
                                // close the editor
                                this.toggle();
                            });
                    }
                }
            }
            else {
                dashboardPage._raisePermissionInvalidMessage();
            }
        },
        toggleContinued: function () {
            var that = this;
            var opts = this.portlet.widgetOptions;
            if (this._grpField && !this._grpChange) {
                this._grpChange = dojo.connect(this._grpField,
                    "onChange", this, function (arg) {
                        if (!this._grpField.isValid()) {
                            return false;
                        }
                        var store = this._grpField.store;
                        store.fetch({
                            query: { $descriptor: arg },
                            onComplete: function (i, r) {
                                var gn = store.getValue(
                                    i[0], 'name');
                                that._pushGrp(gn);
                                opts.groupname = gn;
                            },
                            queryOptions: { deep: true }
                        });
                    });
            }
            if (this._dimField && !this._dimChange) {
                this._dimChange = dojo.connect(this._dimField,
                    "onChange", this, function (arg) {
                        if (!this._dimField.isValid()) {
                            return false;
                        }
                        var store = this._dimField.store;
                        store.fetch({
                            query: { $descriptor: arg },
                            onComplete: function (i, r) {
                                var n = store.getValue(
                                    i[0], 'filterName');
                                that._pushDim(n);
                                opts.dimension = n;
                            },
                            queryOptions: { deep: true }
                        });
                    });
            }
            if (this._metField && !this._metChange) {
                this._metChange = dojo.connect(this._metField,
                    "onChange", this, function (arg) {
                        if (!this._metField.isValid()) {
                            return false;
                        }
                        var store = this._metField.store;
                        store.fetch({
                            query: { $descriptor: arg },
                            onComplete: function (i, r) {
                                var m = store.getValue(
                                    i[0], 'filterName');
                                that._pushMet(m);
                                opts.metric = m;
                            },
                            queryOptions: { deep: true }
                        });
                    });
            }
            // hydrate the ent field if defined
            if (opts.entity) {
                if (this._originalEntity) {
                    if (this._originalEntity === opts.entity) {
                        this._checkHydrate();
                    }
                    else {
                        this._entField.set('value',
                            this._remEnt(this._originalEntity));
                    }
                }
                else {
                    this._entField.set('value',
                        this._remEnt(opts.entity));
                    this._originalEntity = opts.entity;
                }
            }
        },
        _populate: function (value, start, count) {
            value.store = new itemFileReadStore({ data: { identifier: '$key', items: [] } });

            var request = new Sage.SData.Client.SDataResourceCollectionRequest(value.service);

            var kind = value.kind;
            if (value.replace === 'kind') {
                kind = dojoString.substitute(value.kind, [value.entityName]);
            }
            request.setResourceKind(kind);

            if (typeof (value.start) !== 'undefined') {
                value.start = start || value.start;
                request.setQueryArg('startIndex', value.start);
            }
            else {
                value.start = start || 0;
                request.setQueryArg('startIndex', value.start);
            }
            if (typeof (value.count) !== 'undefined') {
                value.count = count || value.count;
                request.setQueryArg('count', value.count);
            }
            else {
                value.count = count || 0;
                request.setQueryArg('count', value.count);
            }
            if (typeof (value.where) !== 'undefined') {

                var where = value.where;
                if (value.replace === 'where') {
                    where = dojoString.substitute(value.where, [value.entityName]);
                }

                request.setQueryArg('where', where);
            }
            if (typeof (value.select) !== 'undefined') {
                request.setQueryArg('select', value.select);
            }
            if (typeof (value.orderBy) !== 'undefined') {
                request.setQueryArg('orderBy', value.orderBy);
            }
            if (typeof (value.format) !== 'undefined') {
                request.setQueryArg('format', value.format);
            }

            var content = this;

            var key = request.read({

                success: function (data) {

                    var entityFields = data.$resources;

                    for (var i = 0; i <= entityFields.length - 1; i++) {
                        if (value.store._itemsByIdentity === null || !value.store._itemsByIdentity[entityFields[i].$key]) {
                            value.store.newItem(entityFields[i]);
                        }
                    }

                    var totalResults = data.$totalResults;
                    var newStart = value.start + value.count; // to get new start value take start + count
                    var valuesLeft = totalResults - newStart; // how many more records still need to get

                    if (valuesLeft > 0) { // we need to get more records if greater than 0, if less than 0, there may be an issue.
                        if (valuesLeft >= value.count) { // Limit get to 100 records at a time
                            content._populate(content, newStart, value.count);
                        }
                        else { // unless there is less, then just grab the rest.
                            content._populate(content, newStart, valuesLeft);
                        }
                    }
                    else {
                        content._checkHydrate(); //rehydrate.
                        if (value.entityName === null) {
                            // if a loading message is being displayed hide it, because the data is assumed to be loaded at this point.
                            var entityFieldLoading = dojo.byId(content.portlet.id + '_loading');
                            if (entityFieldLoading) {
                                domStyle.set(entityFieldLoading, 'display', 'none');
                            }
                            content.toggleContinued();
                        }
                    }
                },

                failure: function (data) {
                    console.warn('request has errored %o', request);
                }
            });
        }
    });

    return widget;
});
