/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'dijit/_Widget',
    'Sage/_Templated',
    'Sage/UI/EditableGrid',
    'Sage/Utility',
    'dojo/string',
    'dojo/_base/declare',
    'dojo/text!./templates/AddEditFiltersDialogMain.html',
    'Sage/UI/Columns/DateTime',
    'Sage/UI/Columns/Boolean',
    'dojo/i18n!./nls/AddEditFiltersDialog',
    'dojo/dom-style',
    'Sage/UI/Dialogs',
    'Sage/UI/FilteringSelect',
    'Sage/UI/Controls/TextBox',
    'Sage/UI/Controls/CheckBox',
    'dojo/data/ItemFileWriteStore',
    'dojo/store/Memory',
    'Sage/Data/BaseSDataStore',
	'Sage/Data/SDataServiceRegistry',
    'dojo/store/JsonRest',
    'dijit/Tree',
    'dojo/json',
    'dijit/registry',
    'dojo/_base/Deferred',
    'dojo/DeferredList',
    'dojo/_base/lang',
    'dojo/request',
    'dojo/query',
    'Sage/UI/Controls/_DialogHelpIconMixin',
    'Sage/UI/_DialogLoadingMixin',
    'Sage/MainView/EntityMgr/PropertyStore',
    'dojo/dom-class',
    'dijit/form/DropDownButton',
    'dojo/dom',
    'dijit/TooltipDialog',
    'dijit/form/Button'
],
function (
    _Widget,
    _Templated,
    editableGrid,
    utility,
    dString,
    declare,
    template,
    crmDateTime,
    crmBoolean,
    nlsResources,
    dojoStyle,
    crmDialogue,
    crmDropDowns,
    crmTextBox,
    crmCheckBox,
    itemWriter,
    memory,
    BaseSDataStore,
	SDataServiceRegistry,
    JsonRest,
    Tree,
    json,
    registry,
    Deferred,
    DeferredList,
    lang,
    request,
    query,
    _DialogHelpIconMixin,
    _DialogLoadingMixin,
    PropertyStore,
    domClass,
    DropDownButton,
    dom, TooltipDialog, Button
) {
    var widget = declare('Sage.MainView.EntityMgr.AddEditEntityFilter.AddEditFiltersDialog', [_Widget, _Templated], {
        _dialog: null,

        widgetTemplate: new Simplate(eval(template)),
        _nlsResources: nlsResources,
        widgetsInTemplate: true,

        filterNameTextBox: false,
        displayNameTextBox: false,

        analyticsCheckBox: false,
        propertiesDropDowns: false, //  Area for the Entity properties drop down
        propertyValueHolder: '',
        propertyDataLoad: false,    //  Entity properties data list   

        typeDropDowns: false,       //  Area for the filter type drop down 
        typeDataLoad: false,        //  filter type data list

        detailContent: false,       //  Area for the detail information

        _EditData: false,           //  Filter information
        entityName: false,          //  current name of the entity

        filterUtility: false,

        service: false,             //  Reference to SData
        _Wstore: false,             //  Data store for onDemandGrid
        _title: false,
        _idForTypeDropDown: 'typeDpItems',
        _idForPropertyDropDown: 'filtersDpItems',
        isMetric: false,
        myTooltipDialog: null,
        tree: null,

        constructor: function (entity, title, fUtility, data) {
            this._title = title || 'Filter';

            this.isMetric = this._title == 'Metric';
            this._title = this.isMetric ? this._nlsResources.lblMetric : this._nlsResources.lblFilter;

            this.entityName = entity;

            if (dijit.byId(this._idForTypeDropDown)) {
                this.destroy(dijit.byId(this._idForTypeDropDown));
            }
            if (dijit.byId(this._idForPropertyDropDown)) {
                this.destroy(dijit.byId(this._idForPropertyDropDown));
            }
            if (dijit.byId('propertyDp')) {
                this.destroy(dijit.byId('propertyDp'));
            }
            this._EditData = data;

            this.filterUtility = fUtility;
            dojo.connect(dijit.byId("filterDetailGridPane"), "onShow", dojo.partial(this.loadfilters, this));

        },

        destroy: function (context) {
            context.destroy();
            dijit.popup.close();
        },



        postCreate: function () {

            //create main controllers
            this._createFilterNameController();
            this._createDisplayNameController();
            this._createTypeController();
            this._createPropertyController();

            //create detail specific controllers
            this.setUpDetailsSection(this, true);

            //create buttons
            this.cmdSave.containerNode.innerHTML = this._nlsResources.lblSaveButton;
            this.cmdCancel.containerNode.innerHTML = this._nlsResources.lblCancelButton;

            // help icon
            dojo.mixin(this._dialog, new _DialogHelpIconMixin({ titleBar: this._dialog.titleBar }));
            this._dialog.createHelpIconByTopic(this.isMetric ? 'Adding_Editing_Metrics' : 'Adding_Editing_Filters');

            //loading
            dojo.mixin(this._dialog, new _DialogLoadingMixin());

            dojo.connect(this._dialog, "onCancel", dojo.partial(this._cmdCancel_OnClick, this));

            this.startup();
            query('.dijitDialog').on('click', function (e) {
                var target = e.target || e.srcElement;
                if (target.type !== 'button') {
                    dijit.popup.close();
                }
            });
            
        },
        _createFilterNameController: function () {
            this.lblFilterName.innerHTML = this.filterUtility.colonizeLabels(this.isMetric ? this._nlsResources.lblMetricName : this._nlsResources.lblFilterName);

            //insert a filter name text box
            // Validation will be to make sure not special characters or whitespaces are entered
            this.filterNameTextBox = new crmTextBox(
                {
                    shouldPublishMarkDirty: false,
                    required: true,
                    validator: this._filterNameValidator,
                    invalidMessage: this._nlsResources.InvalidFilterName
                });
            dojo.place(this.filterNameTextBox.domNode, this.filterName, 'only');

            var defValue = '';
            if (this._EditData && this._EditData.filterName) {
                defValue = this._EditData.filterName;
            }
            this.filterNameTextBox.textbox.value = defValue;
        },
        _filterNameValidator: function (value, constraints) {
            // value needs to start with a letter or underscore, but can also contain numbers
            var regex = '^([a-z]|[A-Z]|_)(\\w)*';
            var matches = value.match(regex, 'g');
            if (matches) {
                if (dojo.isArray(matches)) {
                    return matches[0].length == value.length;
                }
                else {
                    return matches[0].length == value.length;
                }
            }
            return false;
        },
        _createDisplayNameController: function () {
            this.lblDisplayName.innerHTML = this.filterUtility.colonizeLabels(this._nlsResources.lblDisplayName);

            //insert a display name text box
            // Currently no validation, but need to prevent Xsite scripting
            this.displayNameTextBox = new crmTextBox({ shouldPublishMarkDirty: false });
            dojo.place(this.displayNameTextBox.domNode, this.displayName, 'only');

            var defValue = '';
            if (this._EditData && this._EditData.displayName) {
                defValue = this._EditData.displayName;
            }
            this.displayNameTextBox.textbox.value = defValue;
        },
        _createPropertyController: function () {
            this.lblFilterDp.innerHTML = this.filterUtility.colonizeLabels(this._nlsResources.lblFilterDp);

            var self = this;
            this.tree = new Tree({
                model: new PropertyStore(this.entityName, false).store,
                showRoot: false,
                style: { overflow: "auto", height: "250px", width: "auto" },//545px
                onClick: function (item) {
                    //dojo.query(".entitySelected")[0].set('value', item.property);
                    //dom.byId("text").value = item.property;
                    self.entitySelected.set('value', item.property);
                    dijit.popup.close();
                }
            });
            var defValue = ' ';
            if (this._EditData && this._EditData.propertyName) {
                defValue = this._EditData.propertyName;
                this.entitySelected.set('value', defValue);
            }
        },


        _showDDTree: function () {
            var ele = dojo.query(".entitySelected");
            var width = dojoStyle.getComputedStyle(ele[ele.length - 1]).width;
            this.myTooltipDialog = new TooltipDialog({
                style: "width:"+width +";",
                content: this.tree
            });
            dojo.addClass(this.myTooltipDialog.domNode, 'propertyDialog');
            dijit.popup.open({
                popup: this.myTooltipDialog,
                around: ele[ele.length - 1]//; dojo.byId('text')//,
                //orient: ['above']
            });

        },
        _createTypeController: function () {
            this.lblTypeDp.innerHTML = this.filterUtility.colonizeLabels(this._nlsResources.lblTypeDp);

            var defValue = this.isMetric ? 'metricFilter' : 'distinctFilter';
            if (this._EditData && this._EditData.details) {
                defValue = this.filterUtility.formatDetails(this._EditData.details).detailsKey;
            }

            this.typeDropDowns = new crmDropDowns({
                id: this._idForTypeDropDown,
                name: 'types',
                value: defValue,
                store: this.filterUtility.filterTypeDataLoad,
                searchAttr: 'name',
                query: { type: this.isMetric ? 'metric' : 'filter' },
                fetchProperties: { sort: [{ attribute: "name", descending: false }] }
            }, this._idForTypeDropDown
            );

            if (this._EditData && this._EditData.details) {
                this.typeDropDowns.set('disabled', true);
            }

            dojo.place(this.typeDropDowns.domNode, this.typeDp, 'only');
            dojo.connect(this.typeDropDowns, 'onChange', dojo.partial(this.setUpDetailsSection, this, false));
        },
        /**
        * This is a last method in the initialization process. 
        * It is called after all the child widgets are rendered so it's good for a container widget to finish it's post rendering here. 
        * This is where the container widgets could for example set sizes of their children relative to it's own size.
        */
        startup: function () {
            this.inherited(arguments);
        },

        setUpDetailsSection: function (context, firstLoad) {
            context.detailContent = context.filterUtility.getDetailsSection(context, firstLoad).detailsObject;
            if (typeof (context.detailContent) !== 'undefined') {
                dojo.place(context.detailContent.domNode, context._TypeSpecificDetailsSection, 'only');
                
                if (context.detailContent !== false && typeof (context.detailContent) !== 'undefined' && context.detailContent.hasProperties === false) {
                   
                    domClass.add(context.entitySelected.domNode, 'dijitTextBoxDisabled');
                    context.entitySelected.set('value', '');
                    context.entitySelected.set('disabled', true);
                    context.transparentDropDown.set('disabled', true);

                }
                else {
                    if (context.entitySelected !== false && typeof (context.entitySelected) !== 'undefined') {
                        domClass.remove(context.entitySelected.domNode, 'dijitTextBoxDisabled');
                        context.entitySelected.set('disabled', false);
                    }
                    if (context.transparentDropDown !== false && typeof (context.transparentDropDown) !== 'undefined') {
                        context.transparentDropDown.set('disabled', false);
                    }
                }
            }
        },
        show: function () {
            if (this._EditData) {
                this._dialog.titleNode.innerHTML = this._nlsResources.lblEdit + " " + this._title;
            }
            else {
                this._dialog.titleNode.innerHTML = this._nlsResources.lblAdd + " " + this._title;
            }

            this._dialog.show();
            this.inherited(arguments);
        },
        _cmdSave_OnClick: function () {
            if (!this.isValid()) {
                this._dialog.hideLoading();
            }
        },
        _onSaveSuccess: function (data) {
            SDataServiceRegistry._removeFromLocalStorage(this.entityName);
            this._dialog.hideLoading();
            this._dialog.hide();
        },
        _cmdCancel_OnClick: function (context) {
            if (this._dialog) {
                this._dialog.hideLoading();
                this._dialog.hide();
            }
            else if (context._dialog) // context is passed when the 'x' button is pressed
            {
                context._dialog.hideLoading();
                context._dialog.hide();
            }
        },
        isValid: function () {
            var failed = false;
            this.divValidationMessage.innerHTML = "";

            this.addEditFiltersForm.validate();

            //filter name
            failed = !this.filterNameTextBox.isValid(true);
            this.filterNameTextBox.onChanged();
            if (!failed) {
                var context = this;
                request = new Sage.SData.Client.SDataResourceCollectionRequest(this.service);
                request.setResourceKind('entities(' + "'" + this.entityName + "'" + ')/filters');
                request.setQueryArg('startIndex', 0);
                request.setQueryArg('count', 1);
                request.setQueryArg('where', "filterName eq '" + this.filterNameTextBox.value + "'");

                context._dialog.showLoading();

                request.read({
                    success: function (data) {
                        if (typeof (data) !== 'undefined' && typeof (data.$resources) !== 'undefined' && data.$resources.length == 1) {
                            context.divValidationMessage.innerHTML = "<div>" + context.lblFilterName.innerHTML + "Is not unique for " + context.entityName + "</div>";
                            context._dialog.hideLoading();
                            return false;
                        }
                        return context._continueValidation(context);

                    },
                    failure: function (data) {
                        context._dialog.hideLoading();
                        return false;
                    }
                });
            }

            return !failed;
        },
        _continueValidation: function (context) {
            //filter name

            var failed = !context.filterNameTextBox.isValid(true);
            context.filterNameTextBox.onChanged();

            if (!context.entitySelected.disabled) {
                failed = failed || !context.entitySelected.isValid(true);
                context.entitySelected.onChange();
            }

            if (!failed) {
                var value = context.detailContent.isValid();
                if (typeof (value) !== "boolean") {
                    context.divValidationMessage.innerHTML = context.divValidationMessage.innerHTML + "<div>" + value + "</div>";
                    failed = true;
                }
                else {
                    failed = !value;
                }
            }

            if (!failed) {
                context._continueSaveEdit(context);
            }
            else {
                context._dialog.hideLoading();
            }
        },
        _continueSaveEdit: function (context) {
            //update the resource kind
            var resourceRequest = new Sage.SData.Client.SDataSingleResourceRequest(context.service).setResourceKind('entities(' + "'" + context.entityName + "'" + ')/filters');

            //if we were passed data, then we are updating an entry
            if (context._EditData) {

                // build the filter from the information in the current dialogue.
                context._EditData.filterName = context.filterNameTextBox.textbox.value; //required
                if (context.displayNameTextBox.textbox.value.length > 0) {// do not send back a display name field, and $descriptor will use filterName.
                    context._EditData.displayName = context.displayNameTextBox.textbox.value;
                }
                context._EditData.details = context.detailContent.getDetails(); //get the sdata formatted details section

                var noProperty = true;
                if (!(context._EditData.details && context._EditData.details.dateDiffMetricFilter)) {
                    context._EditData.propertyName = context.entitySelected.value;
                    noProperty = false;
                }

                var sdataPkg = context._EditData;

                if (noProperty) {
                    // the presence of a propertyName when saving a dateDiffMEtricFilter was causing server side errors.
                    delete sdataPkg.propertyName;
                }

                resourceRequest.setResourceSelector("'" + sdataPkg['$key'] + "'");
                resourceRequest['update'](sdataPkg, {
                    isSecurityManager: true,
                    scope: context,
                    ignoreETag: false,
                    success: context._onSaveSuccess,
                    failure: function (xhr, sdata) {
                        var msgObj = JSON.parse(xhr.response);
                        var errMsg = xhr.statusText + "(" + xhr.status + ")";
                        if (msgObj.length > 0 && typeof (msgObj[0].message) !== "undefined") {
                            errMsg = errMsg + ": " + msgObj[0].message;
                        }
                        // Handle failure
                        context.divValidationMessage.innerHTML = context.divValidationMessage.innerHTML + "<div>" + errMsg + "</div>";
                        context._dialog.hideLoading();
                    }
                });
            }
            else { // else this entry is new, so create a new entry

                // build the filter from the information in the current dialogue.
                var filter =
                {
                    filterName: context.filterNameTextBox.textbox.value,
                    details: context.detailContent.getDetails() //get the sdata formatted details section
                };
                
                if (context.displayNameTextBox.textbox.value.length > 0) { // do not send back a display name field, and $descriptor will use filterName.
                    filter.displayName = context.displayNameTextBox.textbox.value;
                    filter.analyticsDescription = context.displayNameTextBox.textbox.value; // user currently is not able to set this value so if they create a new filter set it to the display name.
                }

                if (!filter.details.dateDiffMetricFilter) {
                    filter.propertyName = context.entitySelected.value;
                }

                //lookup filters are not included in analytics
                if (context.detailContent.declaredClass.indexOf("LookupDetailsView") === -1) {
                    filter.analyticsAvailable = true;
                }

                resourceRequest['create'](filter, {
                    scope: context,
                    ignoreETag: true,
                    success: context._onSaveSuccess,
                    failure: function (xhr, sdata) {
                        var msgObj = JSON.parse(xhr.response);
                        var errMsg = xhr.statusText + "(" + xhr.status + ")";
                        if (msgObj.length > 0 && typeof (msgObj[0].message) !== "undefined") {
                            errMsg = errMsg + ": " + msgObj[0].message;
                        }
                        // Handle failure
                        context.divValidationMessage.innerHTML = context.divValidationMessage.innerHTML + "<div>" + errMsg + "</div>";
                        context._dialog.hideLoading();
                    }
                });
            }
        }

    });

    return widget;
});