/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
        'Sage/UI/Controls/Lookup',
        'dojo/_base/declare'
],
function (
    Lookup,
    declare
   ) {
    var baseLookupConfig = declare('Sage.MainView.ActivityMgr.AttendeeLookup.BaseLookupConfig',null, {
        lookupName: 'LookupName',
        lookupDisplayName: 'Lookup Display Name',
        lookupType: Lookup,
        entityName:'entityName',
        id: false,     
        cells: [],
        defaultCell: {
            'sortable': true,
            'width': '150px',
            'editable': false,
            'propertyType': 'System.String',
            'excludeFromFilters': false,
            'useAsResult': false,
            'picklistName': null,
            'defaultValue': ''
        },
        gridOptions: {
            contextualCondition: '',
            contextualShow: '',
            selectionMode: 'single'
        },
        storeOptions: {
            resourceKind: 'someEntity',
            sort: [{ attribute: 'SortField'}]
        },
        displayMode: 0,
        isModal: true,
        seedProperty: '',
        seedValue: '',
        overrideSeedValueOnSearch: true,
        initialLookup: true,
        preFilters: [],
        query: {},
        dialogTitle: 'Lookup',
        dialogButtonText: 'Ok',
        allowClearingResult: true,
        readonly: true,
        showEntityInfoToolTip: false,
        _nlsResources: {},
        constructor: function () {
            
           
        },
        rebuild: function () {
            this._lookup = null;
        },
        getLookupInstance: function (uiid) {
            var config = this.getConfig(uiid);
            var lookup = new this.lookupType(config);
            return lookup;
        },
        addCell: function (cell, atIndex) {

        },
        removeCell: function (cellName) {

        },
        getCells: function () {
            return this.cells;
        },
        getConfig: function (uiid) {

            var baseConfig = {
                id: this.id + "_base_" + uiid,
                structure: [
                    {
                        defaultCell: this.defaultCell,
                        cells: this.cells,
                    }],
                gridOptions: this.gridOptions, 
                storeOptions: this.storeOptions, 
                isModal: this.isModal,
                displayMode: this.displayMode,
                initialLookup: this.initialLookup,
                preFilters: this.preFilters,
                returnPrimaryKey: this.returnPrimaryKey,
                dialogTitle: this.dialogTitle,
                dialogButtonText: this.dialogButtonText,
                doSelected: function () { alert("overide the doSelect method")}
            };

            var config = {
                id: this.id + "_" + uiid,
                allowClearingResult: this.allowClearingResult,
                readonly: this.readonly,
                showEntityInfoToolTip: this.showEntityInfoToolTip,
                config: baseConfig
            }

            return config;
        }
       
    });
    return baseLookupConfig;
});