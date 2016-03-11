/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */

define([
    'Sage/MainView/ActivityMgr/AttendeeLookup/ContactLookupConfig',
    'Sage/MainView/ActivityMgr/AttendeeLookup/LeadLookupConfig',
    'dojo/_base/declare'
],

function (
    ContactLookupConfig,
    LeadLookupConfig,
    declare
) {

    var lookupService = declare('Sage.MainView.ActivityMgr.AttendeeLookup.LookupService', null, {
        _lookupConfigs:null,
        constructor: function () {

           
        },
        _initLookupConfigs: function () {

            this._lookupConfigs = [{
                lookupName: 'Contact',
                lookupDisplayName: 'Contact',
                configProviderType: ContactLookupConfig,
                instance:false
            },{
                lookupName: 'Lead',
                lookupDisplayName: 'Lead Loookup',
                configProviderType: LeadLookupConfig,
                instance: false
            }];
        },
        getLookupConfigs: function () {

            if (this._lookupConfigs) {
                return this._lookupConfigs;
            }
            this._initLookupConfigs();
            return this._lookupConfigs;
        },
        getLookupConfig: function (lookupName) {
            var lookupConfigs = this.getLookupConfigs();
            for (var i = 0; i < lookupConfigs.length; i++) {
                if (lookupConfigs[i].lookupName.toUpperCase() === lookupName.toUpperCase()) {
                    return lookupConfigs[i];
                }
            }
            return null;
        },
        AddLookupConfig: function (lookupConfig) {
            var config = this.getLookupConfig(lookupConfig.lookupName);
            if (config) {
                config.configuration = lookupConfig;
            }
            else {
                var newConfiguration = {
                    lookupName: lookupConfig.lookupName,
                    lookupDisplayName: lookupConfig.lookupDisplayName,
                    configProviderType: lookupConfig,
                    instance: false
                };
                var lookupConfigs = this.getLookupConfigs();
                lookupConfigs.push(newConfiguration);
            }
        },
        RemoveLookupConfig: function (lookupName) {
            
        },
        getLookupConfigInstance: function (lookupName) {
            var lookupConfig = this.getLookupConfig(lookupName);
            if (lookupConfig) {
                if (!lookupConfig.instance) {
                    lookupConfig.instance = new lookupConfig.configProviderType();
                    return lookupConfig.instance;
                } else {
                    lookupConfig.instance.rebuild();
                    return lookupConfig.instance;
                }
            }
        },
        getLookupInstance: function (lookupName, uiid) {
            var lookupConfigInstance = this.getLookupConfigInstance(lookupName);
            var lookupInstance = null;
            if (lookupConfigInstance) {
                lookupInstance = lookupConfigInstance.getLookupInstance(uiid);
            }
            return lookupInstance;
        }
    }); // end dojo declare

   
    if (!Sage.Services.hasService('LookupService')) {
        Sage.Services.addService('LookupService', new lookupService());

    } else {
        var srvc = Sage.Services.getService('LookupService');
        if (actSvc.declaredClass !== 'Sage.MainView.ActivityMgr.AttendeeLookup.LookupService') {
            Sage.Services.removeService('LookupService');
            Sage.Services.addService('LookupService', new lookupService()());
        }
    }
    return lookupService();
})
