/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
     'Sage/MainView/ActivityMgr/AttendeeLookup/BaseLookupConfig',
     'Sage/UI/SDataLookup',
     'dojo/i18n!./nls/ContactLookupConfig',
     'dojo/_base/declare',
     'dojo/_base/lang'
],
function (
    BaseLookupConfig,
    SDataLookup,
    nlsResources,
    declare,
    lang
   ) {
    var associationLookupConfig = declare('Sage.MainView.ActivityMgr.AttendeeLookup.ContactLookupConfig', [BaseLookupConfig], {
              
        constructor: function () {
            lang.mixin(this, nlsResources);
            //this._nlsResources = nlsResources;
            this.lookupType = SDataLookup;
            this._initConfig();
         },
        _initConfig: function(){
            this.id = '_contactLookup',
            this.lookupName = 'Contact';
            this.lookupDisplayName = 'Contact Lookup';
            this.entityName = 'Contact';
            this.dialogTitle = this.dialogTitleText,
            this.cells = null;
            this.cells = this.getCells();
            this.defaultCell = {
                "sortable": true,
                "width": "150px",
                "editable": false,
                "propertyType": "System.String",
                "excludeFromFilters": false,
                "useAsResult": false,
                "pickListName": null,
                "defaultValue": ""
            };
            this.storeOptions = {
                resourceKind: 'contacts',              
                select: ['LastName', 'FirstName', 'Title', 'Type', 'Account/$key', 'Account/AccountName', 'ContactUser/Userid', 'Address/Timezone'],
                sort: [{ attribute: 'LastName' }]
            };
            this.preFilters = [];
            this.gridOptions = { };
            this.query = {};
            this.displayMode = 5;
            this.isModal = true;
            this.initialLookup = false;
            this.seedValue = 'X';
            this.seedProperty = 'Account.Id';

        },
        getCells: function () {

            if (this.cells) {
                return this.cells;
            }
            this.cells = [
            {
                name: this.colFirstName,
                field: 'FirstName'
            },{
                name: this.colLastName,
                field: 'LastName'
            }, {
                name: this.colTitle,
                field: 'Title'
            }, {
                name: this.colAccount,
                field: 'AccountName'
            }, {
                name: this.colWorkPhone,
                field: 'WorkPhone'
            }, {
                name: this.colEmail,
                field: 'Email'
            }];
            return this.cells;
        },
        doSelected:function(items){
            alert("overide the doSelect method")
        },
        getConfig: function (uiid) {

            var sDataConfig = {
                id: this.id + "_base_" + uiid,
                btnToolTip: '',
                structure: [
                    {
                        defaultCell: this.defaultCell,
                        cells: this.cells,
                    }],
                gridOptions: this.gridOptions,
                displayMode: this.displayMode,
                storeOptions: this.storeOptions, 
                isModal: this.isModal,
                initialLookup: this.initialLookup,
                preFilters: this.preFilters,
                query: this.query,
                seedValue : this.seedValue,
                seedProperty: this.seedProperty,
                overrideSeedValueOnSearch: true,
                dialogTitle: this.dialogTitle,
                dialogButtonText: this.dialogButtonText,
                doSelected: this.doSelected,
                cancelText:this.cancelText
            };           

            return sDataConfig;
         },

        getLookupInstance: function (uiid) {
            var config = this.getConfig(uiid);
            var lookup =  new this.lookupType(config);
            return lookup;
        }

    });
    return associationLookupConfig;
});