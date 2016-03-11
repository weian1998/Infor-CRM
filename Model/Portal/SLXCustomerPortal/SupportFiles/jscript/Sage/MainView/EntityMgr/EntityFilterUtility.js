/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
        'Sage/Data/BaseSDataStore',
        'Sage/Utility',
        'dojo/_base/declare',
        'dojo/store/Memory',
        'Sage/Data/SDataServiceRegistry',
        'dojo/string',
        'dgrid/editor',
        "dojo/_base/array",
        'dojo/i18n!./nls/_BaseEntityDetailContent',

         // Details section, dependent on filter type selected
        'Sage/MainView/EntityMgr/AddEditEntityFilter/DistinctDetailsView',
        'Sage/MainView/EntityMgr/AddEditEntityFilter/RangeDetailsView',
        'Sage/MainView/EntityMgr/AddEditEntityFilter/AMDDetailsView',
        'Sage/MainView/EntityMgr/AddEditEntityFilter/ADDMDDetailsView',
        'Sage/MainView/EntityMgr/AddEditEntityFilter/UserLookupDetailsView',
        'dojo/date',
        'dojo/dom-class'
],
function (BaseSDataStore, Utility, declare, memory, sdataReg, dojString, editor, arrayUtil, nlsResource,

    // Details section, dependent on filter type selected
    distinctDetailsView,
    rangeDetailsView,
    aMDDetailsView,
    aDDMDDetailsView,
    userLookupDetailsView,
    dojoDate,
    domClass
) {
    var widget = declare('Sage.MainView.EntityMgr.EntityFilterUtility', null, {

        //filter and metric types list
        filterTypeDataLoad: false,
        //aggregation List
        aggregation: false,
        //user lookup operation
        operation: false,
        // properties of entity associated with the filter
        propertyNameDataLoad: false,
        propertyIdDataLoad: false,
        // range filter's grid column information
        rangeFilterGridCol: false,
        specialCharacters: false,

        service: false,
        _nlsResource: false,
        specialDates: [
            ':today',
            ':todaystart',
            ':todayend',
            ':yesterday',
            ':yesterdaystart',
            ':yesterdayend',
            ':tomorrow',
            ':tomorrowstart',
            ':tomorrowend',
            ':thisweekstart',
            ':thisweekend',
            ':thismonthstart',
            ':thismonthend',
            ':thisyearstart',
            ':thisyearend',
            ':thisquarterstart',
            ':thisquarterend',
            ':nextweekstart',
            ':nextweekend',
            ':nextmonthstart',
            ':nextmonthend',
            ':nextyearstart',
            ':nextyearend',
            ':nextquarterstart',
            ':nextquarterend',
            ':lastweekstart',
            ':lastweekend',
            ':lastmonthstart',
            ':lastmonthend',
            ':lastyearstart',
            ':lastyearend',
            ':lastquarterstart',
            ':lastquarterend' ],
        constructor: function () {

            this.service = Sage.Data.SDataServiceRegistry.getSDataService('metadata');

            this.propertyIdDataLoad = new memory();
            this.propertyNameDataLoad = new memory();
            this.filterTypeDataLoad = new memory();
            this.aggregation = new memory();
            this.operation = new memory();
            this.rangeFilterGridCol = new memory();
            this.specialCharacters = new memory();

            this._nlsResource = nlsResource;
        },

        /*
        *   Grabs a list of properties for a given entity
        */
        getPropertiesAssociatedWithFilters: function (entity) {
            this._grabEntityProperties(this, entity, 0, 100);
        },

        /*
        -----------------------------------------------------------------------------------------------------------------------
           Start Helper methods for getPropertiesAssociatedWithFilters
        */
        _grabEntityProperties: function (content, entity, start, count) {
            var defaultPageSize = 100;
            count = count || 100;
            start = start || 0;

            var where = 'isIncluded ne False';

            var request = new Sage.SData.Client.SDataResourceCollectionRequest(this.service);
            request.setResourceKind('entities(' + "'" + entity.name + "'" + ')/properties');
            request.setQueryArg('startIndex', start);
            request.setQueryArg('count', count);
            request.setQueryArg('where', where);

            var key = request.read({
                success: function (data) {

                    var entityFields = data.$resources;

                    for (var i = 0; i <= entityFields.length - 1; i++) {
                        content.propertyNameDataLoad.add(
                            {
                                id: entityFields[i].propertyName,
                                name: entityFields[i].propertyName,
                                type: Sage.Utility.Filters.resolveDataType(entityFields[i].dataTypeId)
                            });
                        content.propertyIdDataLoad.add(
                            {
                                id: entityFields[i].id,
                                name: entityFields[i].propertyName,
                                type: Sage.Utility.Filters.resolveDataType(entityFields[i].dataTypeId)
                            });
                    }
                    var totalResults = data.$totalResults;
                    var newStart = start + count; // to get new start value take start + count
                    var valuesLeft = totalResults - newStart; // how many more records still need to get
                    if (valuesLeft > 0) // we need to get more records if greater than 0, if less than 0, there may be an issue.
                    {
                        if (valuesLeft >= 100) // Limit get to 100 records at a time
                        {
                            content.grabEntityProperties(content, false, newStart, 100);
                        }
                        else // unless there is less, then just grab the rest.
                        {
                            content.grabEntityProperties(content, false, newStart, valuesLeft);
                        }
                    }
                },
                failure: function (data) {
                    var apple = data;
                }
            });
        },
        /*
           End Helper methods for getPropertiesAssociatedWithFilters
       -----------------------------------------------------------------------------------------------------------------------
       */

        getSpecialValues: function () {
            var arr = Object.getOwnPropertyNames(this.specialDates);
            if (typeof (arr) === 'undefined' || (typeof (arr.length) !== 'undefined' && arr.length === 0)) {
                return this.specialDates;
            }
            for (var i = 0; i < arr.length; i++) {
                if (!this.specialCharacters.get(arr[i])) {
                    this.specialCharacters.add({ name: arr[i], id: arr[i], property: arr[i] });
                }
            }
        },

        /*
        *   Grabs schema information like aggregations, operations, and filter types.
        */
        getSchemasInformationFromSData: function () {
            var request = new Sage.SData.Client.SDataResourceCollectionRequest(this.service);
            request.setResourceKind('$schema');
            request.setQueryArg('format', 'xml');
            var self = this;
            request.read({ success: function (data) { self._gSIFSSuccess(data); } });
        },
        /*
        -----------------------------------------------------------------------------------------------------------------------
           Start Helper methods for getSchemasInformationFromSData
        */
        _gSIFSSuccess: function (data) {
            var entityFields = data;

            var context = this;
            arrayUtil.forEach(data["xs:schema"]["xs:simpleType"], function (curr) {
                // list of aggregation
                if (curr['@name'] == "OrmAnalyticsMetricAggregation--enum") {
                    context._populateAggregationList(curr["xs:restriction"]["xs:enumeration"]);
                }
                // list of operations
                if (curr['@name'] == "ComparisonValidatorOperator--enum") {
                    context._populateOperationList(curr["xs:restriction"]["xs:enumeration"]);
                }
            });

            arrayUtil.forEach(data["xs:schema"]["xs:complexType"], function (curr) {
                // list of filter types
                if (curr['@name'] == "details--choice") {
                    context._populateFilterTypesList(curr["xs:choice"]["xs:element"]);
                }
                // list of range columns
                if (curr['@name'] == "range--type") {
                    context._createRangefilterCols(curr["xs:all"]["xs:element"]);
                }
            });

            dojo.publish('Sage/EntityManager/FilterUtilityDone');
        },

        _populateFilterTypesList: function (xmlList) {

            for (var i = 0; i < xmlList.length; i++) {
                var item = xmlList[i];
                var nm = item["@name"];

                this.filterTypeDataLoad.add(this._initialformatDetails(nm));
            }
        },

        _populateAggregationList: function (xmlList) {

            for (var i = 0; i < xmlList.length; i++) {
                var item = xmlList[i];
                this.aggregation.add({ id: item["@value"], name: this._nlsResource[item["@value"]] });
            }
        },

        _populateOperationList: function (xmlList) {

            for (var i = 0; i < xmlList.length; i++) {
                var item = xmlList[i];
                this.operation.add({ id: item["@value"], name: this._nlsResource[item["@value"]] });
            }

            this.operation.add({ id: "Contains", name: this._nlsResource["Contains"] });
            this.operation.add({ id: "StartsWith", name: this._nlsResource["StartsWith"] });
            this.operation.add({ id: "EndsWith", name: this._nlsResource["EndsWith"] });
        },
        // creates a class similar to Sage...Textbox, but defaults as not publishing changes as 'markDirty'
        _createCustomTextBox: function () {
            var custText = declare("Sage.MainView.EntityMgr.AddEditEntityFilter.customTxtBx", Sage.UI.Controls.TextBox, {
                shouldPublishMarkDirty: false,
            });
            return custText;
        },
        // creates a class similar to Sage...Textbox, but defaults as not publishing changes as 'markDirty' and marks the textbox as required
        _createCustomValidationTextBox: function () {
            var custText = declare("Sage.MainView.EntityMgr.AddEditEntityFilter.customValTxtBx", Sage.UI.Controls.TextBox, {
                shouldPublishMarkDirty: false,
                required: true,
                placeHolder: this._nlsResource.defaultRangeRowValue
            });
            return custText;
        },
        _createRangefilterCols: function (xmlList) {
            for (var i = 0; i < xmlList.length; i++) {
                var item = xmlList[i];
                var edit = false;
                if (item["@name"] == "rangeName") {
                    edit = editor({
                        label: this._nlsResource[item["@name"]],
                        field: item["@name"],
                        editOn: "", // forces the control to stay in view.
                        autoSave: item["@name"] != "rangeId",
                        editable: item["@name"] != "rangeId",
                        hidden: (item["@name"] == "rangeId" || item["@name"] == "customSql"),
                        unhidable: item["@name"] != "displayName",
                        id: "AA" + item["@name"],
                    }, this._createCustomValidationTextBox());
                }
                else {
                    edit = editor({
                        label: this._nlsResource[item["@name"]],
                        field: item["@name"],
                        editOn: "", // forces the control to stay in view.
                        autoSave: item["@name"] != "rangeId",
                        editable: item["@name"] != "rangeId",
                        hidden: (item["@name"] == "rangeId" || item["@name"] == "customSql"),
                        unhidable: item["@name"] != "displayName",
                        id: item["@name"],
                    }, this._createCustomTextBox());
                }
                this.rangeFilterGridCol.add(edit);
            }
        },
        /*
           End Helper methods for getSchemasInformationFromSData
       -----------------------------------------------------------------------------------------------------------------------
       */

        /*
        *   Localized/Reader friendly name of the filter. 
        */
        _initialformatDetails: function (details) {
            var name = "";
            var type = "";
            switch (details) {
                case "distinctFilter":
                    {
                        name = this._nlsResource.FilterGridDetailsDistinctFilter;// "distinct";
                        type = "filter";
                        break;
                    }
                case "dateDiffMetricFilter":
                    {
                        name = this._nlsResource.FilterGridDetailsDateDiffMetricFilter; //"date difference metric";
                        type = "metric";
                        break;
                    }
                case "rangeFilter":
                    {
                        name = this._nlsResource.FilterGridDetailsRangeFilter; //"range";
                        type = "filter";
                        break;
                    }
                case "metricFilter":
                    {
                        name = this._nlsResource.FilterGridDetailsMetricFilter; //"metric";
                        type = "metric";
                        break;
                    }
                case "userLookupFilter":
                    {
                        name = this._nlsResource.FilterGridDetailsLookupFilter; //"user lookup";
                        type = "filter";
                        break;
                    }
                case "lookupFilter":
                    {
                        name = this._nlsResource.FilterGridDetailsLookupFilter; //"lookup";
                        type = "filter";
                        break;
                    }
                default: {
                    name = this._nlsResource.FilterGridDetailsCustom; //"custom";
                    type = "filter";
                    break;
                }
            }
            return { id: details, name: name, type: type };
        },

        /*
        *   Localized/Reader friendly name of the filter.
        *    BUT ALSO chooses a detail's view based on the filter type in other contexts.
        */
        formatDetails: function (details, includeObject, entityName) {
            if (typeof (details) !== 'undefined') {
                if (typeof (details.distinctFilter) !== 'undefined') {
                    return {
                        detailsKey: 'distinctFilter',
                        detailsObject: includeObject ? new distinctDetailsView({ filterUtility: this, details: details, entityName: entityName }) : false,
                        detailsLocalizedName: this._nlsResource.FilterGridDetailsDistinctFilter,// "distinct";
                    };
                }
                if (typeof (details.dateDiffMetricFilter) !== 'undefined') {
                    return {
                        detailsKey: 'dateDiffMetricFilter',
                        detailsObject: includeObject ? new aDDMDDetailsView({ filterUtility: this, details: details, entityName: entityName }) : false,
                        detailsLocalizedName: this._nlsResource.FilterGridDetailsDateDiffMetricFilter,// "date difference metric";
                    };
                }
                if (typeof (details.rangeFilter) !== 'undefined') {
                    return {
                        detailsKey: 'rangeFilter',
                        detailsObject: includeObject ? new rangeDetailsView({ filterUtility: this, details: details, entityName: entityName }) : false,
                        detailsLocalizedName: this._nlsResource.FilterGridDetailsRangeFilter,// "range";
                    };
                }
                if (typeof (details.metricFilter) !== 'undefined') {
                    return {
                        detailsKey: 'metricFilter',
                        detailsObject: includeObject ? new aMDDetailsView({ filterUtility: this, details: details, entityName: entityName }) : false,
                        detailsLocalizedName: this._nlsResource.FilterGridDetailsMetricFilter,// "metric";
                    };
                }
                if (typeof (details.userLookupFilter) !== 'undefined') {
                    return {
                        detailsKey: 'userLookupFilter',
                        detailsObject: includeObject ? new userLookupDetailsView({ filterUtility: this, details: details, entityName: entityName }) : false,
                        detailsLocalizedName: this._nlsResource.FilterGridDetailsLookupFilter,// "user lookup";
                    };
                }
                if (typeof (details.lookupFilter) !== 'undefined') {
                    return {
                        detailsKey: 'lookupFilter',
                        detailsObject: includeObject ? new userLookupDetailsView({ filterUtility: this, details: details, entityName: entityName }) : false,
                        detailsLocalizedName: this._nlsResource.FilterGridDetailsLookupFilter,// "lookup";
                    };
                }
                return {
                    detailsKey: 'custom',
                    detailsObject: false,
                    detailsLocalizedName: this._nlsResource.FilterGridDetailsCustom,// "custom";
                };
            }
            return false;
        },

        /*
        * determines the details section of the add/edit filter (by default it will be distinct).
        */
        getDetailsSection: function (context, firstload) {

            var selectedID = context._title == this._nlsResource.FilterGridDetailsMetricFilter ? 'metricFilter' : 'distinctFilter';

            var editMode = false;
            if (context._EditData) {
                editMode = true;
            }

            if (firstload && editMode && context._EditData.details) {
                return this.formatDetails(context._EditData.details, true, context.entityName);
            }

            if (context.typeDropDowns && context.typeDropDowns.item && context.typeDropDowns.item.id) {
                selectedID = context.typeDropDowns.item.id;
            }

            var passingValue = false;
            if (editMode) {
                passingValue = context._EditData.details;
            }
            switch (selectedID) {
                case "dateDiffMetricFilter":
                    {
                        return {
                            detailsKey: 'dateDiffMetricFilter',
                            detailsObject: new aDDMDDetailsView({ filterUtility: this, details: passingValue, entityName: context.entityName }),
                            detailsLocalizedName: this._nlsResource.FilterGridDetailsDateDiffMetricFilter,// "date difference metric";
                        };
                    }
                case "metricFilter":
                    {
                        return {
                            detailsKey: 'metricFilter',
                            detailsObject: new aMDDetailsView({ filterUtility: this, details: passingValue, entityName: context.entityName }),
                            detailsLocalizedName: this._nlsResource.FilterGridDetailsMetricFilter,// "metric";
                        };
                    }
                case "distinctFilter":
                    {
                        return {
                            detailsKey: 'distinctFilter',
                            detailsObject: new distinctDetailsView({ filterUtility: this, details: passingValue, entityName: context.entityName }),
                            detailsLocalizedName: this._nlsResource.FilterGridDetailsDistinctFilter,// "distinct";
                        };
                    }
                case "rangeFilter":
                    {
                        return {
                            detailsKey: 'rangeFilter',
                            detailsObject: new rangeDetailsView({ filterUtility: this, details: passingValue, entityName: context.entityName }),
                            detailsLocalizedName: this._nlsResource.FilterGridDetailsRangeFilter,// "range";
                        };
                    }
                case "userLookupFilter":
                    {
                        return {
                            detailsKey: 'userLookupFilter',
                            detailsObject: new userLookupDetailsView({ filterUtility: this, details: passingValue, entityName: context.entityName }),
                            detailsLocalizedName: this._nlsResource.FilterGridDetailsLookupFilter,// "user lookup";
                        };
                    }
                default:
                    {
                        return false;
                    }
            }

        },
        colonizeLabels: function (labelString) {
            return dojString.substitute('${0}:', [labelString]);
        },

        grabReaderFriendlyVersionOfAggregationGivenId: function (id) {
            for (var i = 0; i < this.aggregation.data.length; i++) {
                if (this.aggregation.data[i].id == id) {
                    return this.aggregation.data[i].name;
                }
            }
            return "";
        },
        grabItemOfAggregationGivenId: function (id) {
            for (var i = 0; i < this.aggregation.data.length; i++) {
                if (this.aggregation.data[i].id == id) {
                    return this.aggregation.data[i];
                }
            }
            return "";
        },
        grabIdOfAggregationGivenName: function (name) {
            for (var i = 0; i < this.aggregation.data.length; i++) {
                if (this.aggregation.data[i].name == name) {
                    return this.aggregation.data[i].id;
                }
            }
            return "";
        },
        fixToolbarIcons: function (toolBarNode) {
            var results = dojo.query("span.dijitButtonNode.imageButtonNode", toolBarNode);
            for (var i = 0; i < results.length; i++) {
                domClass.remove(results[i], 'dijitButtonNode imageButtonNode'); // remove the unwanted hover over discoloring and re-positioning.
                results[i].style.cursor = 'pointer'; // one of the above classes had the cursor to pointer rule, we still want it, so restore it.
            }
        }
    });
    return widget;
});