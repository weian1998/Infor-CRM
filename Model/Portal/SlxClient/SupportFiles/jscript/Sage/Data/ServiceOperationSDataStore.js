﻿/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
        'Sage/Data/BaseSDataStore',
        'Sage/Utility',
        'dojo/_base/declare',
        'dojo/_base/lang'
],
function (BaseSDataStore, Utility, declare, lang) {
    var serviceOperationSDataStore = declare('Sage.Data.ServiceOperationSDataStore', BaseSDataStore, {
        //  summary:
        //      A data store implementation that allows the EditableGrid to have its data participate in .net postback and binding
        //      Configuration information is recieved from EditableGrid.
        //  description:
        //      dojo.data.api.Identity Implemented on BaseSDataStore...
        //      dojo.data.api.Read Implemented on BaseSDataStore...        
        isInsertMode: false,
        constructor: function (o) {
            lang.mixin(this, o);           
            this.features['dojo.data.api.Notification'] = true;
            this.identityAttributes = ['$cacheID'];
            this.dirtyDataCache = { isDirty: false };
            this.singleResourceRequest = null;           
        },
        entry: '',
        fetch: function (context) {
            //summary:
            //  Retrieve data from dataCarrier, dataCache and/or feed, and provide it to the grid.
            var items = {};
            items.$resources = [];

            //Read from DataCarrier/TextBox only onLoad.
            if (context.isRender && this.dataCarrierId) {
                var carrier = dojo.query(['.', this.dataCarrierId].join(''));
                if (carrier[0].value.length > 0) {
                    var carrierItems = dojo.fromJson(carrier[0].value);
                    this.addItemsToCache(context, carrierItems.$resources);
                }
            }

            // Restructure the dataCache into an array to supply to the grid.
            for (var item in this.dataCache) {
                if (this.dataCache.hasOwnProperty(item) && item !== 'query') {
                    items.$resources.push(this.dataCache[item]);
                }
            }

            this.setContext(context);
            this.verifyService();

            //Check to see if anything has been added to cache.  Either from a lookup or a .net DataCarrier.
            //if (items.$resources && items.$resources.length > 0) {
            if (this.isInsertMode) {
                var self = this;
                window.setTimeout(function () { self.onSuccess(context, items); }, 5);
                return;
            }

            var request = new Sage.SData.Client.SDataServiceOperationRequest(this.service)
               .setContractName(this.contractName)
               .setOperationName(this.operationName);


          /*  var request = new Sage.SData.Client.SDataResourceCollectionRequest(this.service)
                .setResourceKind(this.resourceKind)
                .setStartIndex(context.start + 1)
                .setCount(context.count);*/

            // TODO: How much of this query work is needed for Insert mode??
            var qry = '';
            // Check to see if a query has been added directly to the store, for binding with native dojo components, ie. ComboBox
            // TODO: Determine patterns for mixin, replacement, seed value, etc. of query, 
            if (this.query) {
                if (!context.query) {
                    context.query = {};
                }
                lang.mixin(context.query, this.query);
            }
            if (context.query) {
                if (typeof context.query === 'function') {
                    qry = context.query();
                } else if (typeof context.query === 'string') {
                    qry = context.query;
                } else if (typeof context.query === 'object') {
                    if (context.query.hasOwnProperty('fn')) {
                        qry = context.query.fn.call(context.query.scope || this);
                    }
                    if (context.query.hasOwnProperty('conditions')) {
                        if (typeof context.query.conditions === 'string') {
                            qry += (qry.length > 0) ? ' and ' + context.query.conditions : context.query.conditions;
                        }
                    }
                }
            }

            context.evaluatedQuery = qry || '';
            if (qry && qry !== '') {
                request.setQueryArg('where', qry);
            }
            if (this.select && this.select.length > 0)
                request.setQueryArg('select', this.select.join(','));
            if (this.include && this.include.length > 0)
                request.setQueryArg('include', this.include.join(','));


            request.execute(this.entry, {
                success: lang.hitch(this, this.onSuccess, context),
                failture: lang.hitch(this, this.onFailure, context)
            });


            // Make the request to get the sdata schema information for the entity.  
            // In Insert mode, the entityId will be 'Insert' and no results will be returned.
           /* var key = request.read({
                success: lang.hitch(this, this.onSuccess, context),
                failure: lang.hitch(this, this.onFailure, context)
            });*/
            var key;
            return {
                abort: lang.hitch(this, this.abortRequest, key)
            };
        },
        onSuccesssss: function (context, feed) {
            //summary:
            //  Provides the items to the grid for rendering.
            //description:       
            //  Checks if the data carrier has received the feed header.  If not, add it.            
            if (this.entry === '') {
                this.entry = feed;
            }
            if (context.onBegin) {
                context.onBegin.call(context.scope || this, feed.response.totalCount, context);
            }
            if (context.onComplete) {
                context.onComplete.call(context.scope || this, feed.response.totalCount, context);
            }
        },

        onSuccess: function (context, feed) {
            if (context.onBegin) {               
                context.onBegin.call(context.scope || this, feed.response.totalCount, context);
            }
            if (this.onProcess) this.onProcess.call(context.scope || this, feed.response.items, context);

            if (context.onComplete) context.onComplete.call(context.scope || this, feed.response.items, context);
            if (this.onComplete) {
                this.onComplete.call(context.scope || this, feed.response.items, context);
            }
            this.addToCache(context, feed);
        },
        addToCache: function (context, item, count) {
            var key;
            count = (typeof count === 'undefined') ? (Math.random() * 11) : count;
            if (this.isInsertMode) {
                //console.log(new Date().getTime());
                item.$cacheID = new Date().getTime() + count;
            }
            key = this.getIdentity(item);
            this.dataCache[key] = item;
        },
        addItemsToCache: function (context, items) {
            for (var i = 0; i < items.length; i++) {
                this.addToCache(context, items[i], i);
            }
        },
        clearCache: function () {
            //  summary:
            //      Inherits from BaseSDataStore.clearCache which clears data cache.  Calls clearDirtyDataCache as well for edit mode data.
            this.inherited(arguments);
            this.clearDirtyDataCache();
        },
        clearDirtyDataCache: function () {
            //  summary:
            //    Clears dirty data cache created from edit mode changes.  Sets isDirty flag to 'false'
            for (var key in this.dirtyDataCache) {
                if (key !== 'isDirty') {
                    delete this.dirtyDataCache[key];
                }
            }
            this.dirtyDataCache.isDirty = false;
            //this.dirtyDataCache = { isDirty: false };
        },
        isItem: function (something) {
            //  summary:
            //      Performs hasOwnProperty check on dataCache to verify if the provided item already exists.
            //  returns:
            //      'true' if dataCache has property, else 'false'
            var id = this.getIdentity(/* anything */something);
            if (id && id !== '') {
                return this.dataCache.hasOwnProperty(id);
            }
            return false;
        },
        isItemLoaded: function (/* anything */something) {
            //  summary:
            //      Performs isItem check on 'this' to verify if the provided item already exists.
            //  returns:
            //      'true' if Item exists, else 'false'
            return this.isItem(something); //boolean
        },
        loadItem: function (/* object */keywordArgs) {
            //  summary:
            //      REDUNDANT??
            if (!this.isItem(keywordArgs.item)) throw new Error('Unable to load ' + keywordArgs.item);
        },
        getValues: function (item, attributename) {
            if (this.isItem(item) && (typeof attributename === "string")) {
                return (item[attributename] || []).slice(0);
            }
            return [];
        },
        hasAttribute: function (item, attributename) {
            if (this.isItem(item) && (typeof attributename === "string")) {
                return attributename in item;
            }
            return false;
        },
        close: function () {
            this.clearCache();
        },
        //dojo.data.api.Write implementations...
        deleteItem: function (item, scope) {
            //summary:
            //  Find the item in the cache and remove it.  Grid is responsible for refreshing itself.
            var id = this.getIdentity(item);
            if (id && id !== '') {
                delete this.dataCache[id];
            }
            var options = {};
            options.scope = scope || this;
            var fnSuccess = function () {
                if (typeof this.onResponse === 'function') {
                    this.onResponse.call(this);
                }
            };
            options.success = fnSuccess;
            options.success.call(options.scope);
        },
        isDirty: function (item) {
            //item could be null - if so, it means is any item dirty...
            if (item) {
                var id = this.getIdentity(item);
                if (id && id !== '') {
                    return this.dirtyDataCache.hasOwnPropery(id);
                }
            }
            return this.dirtyDataCache.isDirty;
        },
        newItem: function (args /*, parentInfo */) {
            var request = this.createTemplateRequest();
            if (request) {
                request.read({
                    success: function (entry) {
                        if ((args) && (args.onComplete) && (typeof args.onComplete === 'function')) {
                            args.onComplete.call(args.scope || this, entry);
                        }
                    },
                    failure: this.requestTemplateFailure,
                    scope: this
                });
            }
        },
        createTemplateRequest: function () {
            //The entity to create the relationship/New record for, from the selection.        
            var request = new Sage.SData.Client.SDataTemplateResourceRequest(this.service);
            if ((this.resourceKind) && (this.resourceKind !== '')) {
                request.setResourceKind(this.resourceKind);
            }
            return request;
        },
        requestTemplateFailure: function () {
        },
        saveNewEntity: function (entity, success, failure, scope) {
            //summary:
            //  Create a new entity and add it to the dataCache.
            this.addToCache(scope, entity);
            success();
        },
        createItem: function (item, scope) {
            var options = {};
            options.scope = scope || this;
            options.scope.store = this;
            var fnSuccess = function (created) {
                if (typeof this.onResponse === 'function') {
                    this.onResponse.call(this, created);
                }
            };
            options.success = fnSuccess;
            this.addToCache(scope, item);
            options.success.call(options.scope, item);
        },
        revert: function () {
            //  summary:
            //      Clear the dirty data cache and call the onDataReset function.  
            //      The grid calls fetch again and gets the data.
            this.clearDirtyDataCache();
            this.onDataReset();
        },
        setValue: function (item, attribute, value) {
            //if (typeof console !== 'undefined') { console.log('setValue - %o %o %o', item, attribute, value) };
            var oldValue = this.getValue(item, attribute, '');
            Utility.setValue(item, attribute, value);
            this.onSet(item, attribute, oldValue, value);
            return true;
        },
        setValues: function (item, attribute, values) {
            alert('not implemented - setValues');
            //use where values is an array
        },
        unsetAttribute: function (item, attribute) {
            alert('not implemented - unsetAttribute');
            //delete all values of an attribute on the item...
        },
        dataCacheToArray: function () {
            var resources = [];
            for (var item in this.dataCache) {
                if (this.dataCache.hasOwnProperty(item) && item !== 'query') {
                    resources.push(this.dataCache[item]);
                }
            }
            return resources;
        },
        onDataChange: function () {
            //There is no dirtyDataCache tracking for Insert views.  Clear dirty data here, just in case.
            this.clearDirtyDataCache();
            var carrier = dojo.query(['.', this.dataCarrierId].join(''));
            if (carrier[0]) {
                this.entry.$resources = this.dataCacheToArray();
                carrier[0].value = JSON.stringify(this.entry);
            }
        },
        //dojo.data.api.Notification
        onSet: function (/* item */item,
        /*attribute-name-string*/attribute,
        /*object | array*/oldValue,
        /*object | array*/newValue) {
            // summary: 
            // See dojo.data.api.Notification.onSet()
            // No need to do anything. This method is here just so that the
            // client code can connect observers to it.
        },
        onNew: function (newItem, parentInfo) {
            //nothing to do here - client code connects observers to this
        },
        onDelete: function (deletedItem) {
            //nothing to do here - client code connects observers to this
        },
        onDataReset: function () {
        },
        onDataSaved: function () {
        },
        onItemSaved: function (savedItem, parentInfo) {
        },
        onItemNotSaved: function (notSavedItem, error) {
        }
    });
    return serviceOperationSDataStore;
});