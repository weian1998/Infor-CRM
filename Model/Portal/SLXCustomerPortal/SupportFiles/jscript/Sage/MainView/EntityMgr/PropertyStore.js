/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/Utility',
    'dojo/string',
    'dojo/_base/declare',
    'dojo/store/Memory',
    'Sage/Data/BaseSDataStore',
	'Sage/Data/SDataServiceRegistry',
    'dojo/store/JsonRest',
    'dojo/json',
     'dojo/_base/Deferred',
    'dojo/DeferredList',
    'dojo/request',
    'dojo/query',
    'dijit/registry'
],
function (
    utility,
    dString,
    declare,
    memory,
    BaseSDataStore,
	SDataServiceRegistry,
    JsonRest,
    json,
    Deferred,
    DeferredList,
    request,
    query,
    registry
) {

    var PropertyStoreModel = declare('Sage.MainView.EntityMgr.PropertyStore', null, {
        constructor: function (id, dateTimePropOnly, addin) {
            this.store.selectedEntity = id;
            this.store.dateTimePropOnly = dateTimePropOnly;
            this.store.addins = addin;
        },
        store: new JsonRest({
            target: "",
            selectedEntity: '',
            dateTimePropOnly: false,
            addins: false,
            getChildren: function (object, onComplete) {
                var items = new memory();
                var entity, property;
                var dateTimePropOnly = this.dateTimePropOnly;
                var dateTimeTypeGuid = '1f08f2eb-87c8-443b-a7c2-a51f590923f5';

                if (object.name == 'rootNode') {
                    entity = this.selectedEntity;
                    property = '';
                }
                else {
                    entity = object.relatedEntity;
                    property = object.property + '.';
                }

                var wait = [], deferred;
                deferred = new Deferred();

                ///////////////////////////////////////////////////
                // Request 1
                var promise1 = request(new Sage.SData.Client.SDataSingleResourceRequest(Sage.Data.SDataServiceRegistry.getSDataService('metadata'))
                    .setResourceKind('entities')
                    .setResourceSelector('"' + entity + '"')
                    .setQueryArg('select', 'properties/*').setQueryArg('format', 'json').setQueryArg('Count', '200')).then(function (response) {
                        var result = json.parse(response);
                        var entityFields = result.properties.$resources;
                        for (var i = 0; i <= entityFields.length - 1; i++) {
                            if (entityFields[i].isIncluded === true) {
                                if (dateTimePropOnly) {
                                    if (entityFields[i].dataTypeId === dateTimeTypeGuid) {
                                        items.add({ id: entityFields[i].id, name: entityFields[i].propertyName, property: property + entityFields[i].propertyName });
                                    }
                                }
                                else {
                                    items.add({ id: entityFields[i].id, name: entityFields[i].propertyName, property: property + entityFields[i].propertyName });
                                }
                            }
                        }
                    });

                // Request 2
                var whereString = dString.substitute(
                            '(parentEntity.name eq "${0}") or (childEntity.name eq "${0}")', [entity]
                        );
                if (dateTimePropOnly){
                    whereString = dString.substitute(
                            '(parentEntity.name eq "${0}" and cardinality eq "M:1") or (childEntity.name eq "${0}" and cardinality eq "1:M")', [entity]
                        );
                }
                var promise2 = request(new Sage.SData.Client.SDataResourceCollectionRequest(Sage.Data.SDataServiceRegistry.getSDataService('metadata'))
                    .setResourceKind('relationships')
                    .setQueryArg('where', whereString
                        ).setQueryArg('format', 'json').setQueryArg('Count', '200')).then(function (response) {
                            var result = json.parse(response);
                            var entityFields = result.$resources;
                            for (var i = 0; i <= entityFields.length - 1; i++) {
                                if (entity == entityFields[i]['parentEntity']['$key'] && entityFields[i]['parentProperty']['isIncluded']) {
                                    items.add({
                                        name: entityFields[i]['parentProperty']['propertyName'],
                                        id: entityFields[i]['parentProperty']['id'],
                                        relatedEntity: entityFields[i]['childEntity']['$key'],
                                        "children": "test",
                                        property: property + entityFields[i]['parentProperty']['propertyName']
                                    });
                                }
                                else if (entity == entityFields[i]['childEntity']['$key'] && entityFields[i]['childProperty']['isIncluded']) {
                                    items.add({
                                        name: entityFields[i]['childProperty']['propertyName'],
                                        id: entityFields[i]['childProperty']['id'],
                                        "children": "test",
                                        property: property + entityFields[i]['childProperty']['propertyName'],
                                        relatedEntity: entityFields[i]['parentEntity']['$key']
                                    });
                                }
                            }
                        });

                // Request 3
                var promise3 = request(new Sage.SData.Client.SDataSingleResourceRequest(Sage.Data.SDataServiceRegistry.getSDataService('metadata'))
                    .setResourceKind('entities')
                    .setQueryArg('where',
                        dString.substitute(
                            'extendedEntity.name eq "${0}"', [entity]
                        ))
                    .setQueryArg('select', 'extendedEntityPropertyName').setQueryArg('format', 'json').setQueryArg('Count', '200')).then(function (response) {
                        var result = json.parse(response);
                        var entityFields = result.$resources;
                        for (var i = 0; i <= entityFields.length - 1; i++) {
                            items.add({
                                name: entityFields[i].$key,
                                id: entityFields[i].$key,
                                "children": "test",
                                property: property + entityFields[i].$key,
                                relatedEntity: entityFields[i].$key
                            });
                        }
                    });
                
                var list = new DeferredList([promise1, promise2, promise3]);
                list.then(function (result) {

                    var sortOn = 'name';
                    items.data.sort(function (a, b) {
                        var nameA = a[sortOn],
                            nameB = b[sortOn];

                        return (nameA < nameB)
                            ? -1
                            : (nameA > nameB)
                                ? 1
                                : 0;
                    });
                    onComplete(items.data);
                });
            },
            getRoot: function (onItem) {
                var data =
                       {
                           "name": "rootNode",
                           "id": "root"
                       };
                onItem(data);
            },
            mayHaveChildren: function (item) {
                return "children" in item;
            },
            getLabel: function (object) {
                return object.name;
            },
        })
            
    });
    return PropertyStoreModel;
});

