/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
    'Sage/Groups/GroupLookup',
    'Sage/UI/Columns/Boolean',
    'Sage/UI/Columns/DateTime',
    'Sage/UI/Columns/Numeric',
    'Sage/UI/Columns/OwnerType',
    'Sage/UI/Columns/Phone',
    'Sage/UI/Columns/UserType',
    'Sage/UI/Columns/Currency',
    'Sage/UI/Columns/SlxLink',
    'dojo/_base/array',
    'dojo/string'
],
function (GroupLookup,
        booleanColumn,
        dateTimeColumn,
        numericColumn,
        ownerTypeColumn,
        phoneColumn,
        userTypeColumn,
        Currency,
        slxLinkColumn,
        dojoArray,
        dString
        ) {
    Sage.namespace('Utility.Groups');
    dojo.mixin(Sage.Utility.Groups, {
        showMainLookupFor: function (family, page) {
            var lookupManagerService = Sage.Services.getService('GroupLookupManager');
            if (lookupManagerService) {
                if (typeof family === "undefined") {
                    lookupManagerService.showLookup();
                } else {
                    lookupManagerService.showLookup({ family: family, returnTo: page || false });
                }
            }
        },
        getGridStructure: function (layout, hideWebLink) {
                var structureData = {};
                var structure = [];
                var select = [];
         

                var groupContextService = Sage.Services.getService("ClientGroupContext"), context;

                if (groupContextService) {
                    context = groupContextService.getContext();
                }

                if (layout.length > 0) {
                    //For each field in the group layout, create a grid column.
                    dojoArray.forEach(layout, function (item, i) {
                        select.push(item['alias']);

                        if (item['visible']) {
                            if (item['webLink'] && !hideWebLink) {
                                var dataPath = item['dataPath'],
                                    entity = dataPath.lastIndexOf("!") > -1 ? dataPath.substring(0, dataPath.lastIndexOf("!")).substring(dataPath.lastIndexOf(".") + 1) : dataPath.substring(0, dataPath.lastIndexOf(":")),
                                    keyField = entity + 'ID';

                                //take into account the often denormalized field "ACCOUNT" that lives on several entities... (Contact, etc.)
                                if (item['alias'] === 'ACCOUNT' || item['alias'].match(/A\d+_ACCOUNT/ig)) {
                                    entity = 'ACCOUNT';
                                    keyField = 'ACCOUNTID';
                                }
                                if ((context) && (entity === context.CurrentTable)) {
                                    entity = context.CurrentEntity;
                                    keyField = context.CurrentTableKeyField;
                                }
                                if (item.alias.lastIndexOf('_') === 2) {
                                    var list = item.alias.split('_');
                                    keyField = dString.substitute('${0}_${1}', [list[0], keyField]);
                                }
                                select.push(keyField);

                                structure.push({
                                    field: item['alias'],
                                    property: item['propertyPath'],
                                    name: item['caption'],
                                    type: slxLinkColumn,
                                    pageName: entity,
                                    idField: keyField,
                                    width: item['width'] + 'px'
                                });
                            }
                            else {
                                // hack section
                                if (item['alias'].match(/^email$/i)) {
                                    item['format'] = 'Email';
                                }
                                if (item['fieldType'] === 'DateTime') {
                                    item['format'] = 'DateTime';
                                }
                                // end hack section

                                switch (item['format']) {
                                    case 'Owner':
                                        var ownerName = item['alias'] + 'NAME' ;                                  
                                        select.push(ownerName);
                                        structure.push({
                                            field: ownerName,
                                            styles: 'text-align: ' + item['align'] + ';',
                                            name: item['caption'],
                                            width: item['width'] + 'px'
                                        });
                                        break;
                                    case 'User':
                                        var userName = item['alias'] + 'NAME' ;                                   
                                        select.push(userName);
                                        structure.push({
                                            field: userName,
                                            styles: 'text-align: ' + item['align'] + ';',
                                            name: item['caption'],
                                            width: item['width'] + 'px'
                                        });
                                        break;
                                    case 'DateTime':
                                        structure.push({
                                            field: item['alias'],
                                            property: item['propertyPath'],
                                            name: item['caption'],
                                            type: dateTimeColumn,
                                            styles: 'text-align: ' + item['align'] + ';',
                                            datePattern: item['formatString'],
                                            dateTimeType: item['dateTimeType'],
                                            width: item['width'] + 'px'
                                        });
                                        break;
                                    case 'Percent':
                                        structure.push({
                                            field: item['alias'],
                                            property: item['propertyPath'],
                                            name: item['caption'],
                                            type: numericColumn,
                                            styles: 'text-align: ' + item['align'] + ';',
                                            constraints: {
                                                places: Sage.Utility.getPrecision(item['formatString']),
                                                round: -1
                                            },
                                            fercent: true,
                                            formatType: 'Percent',
                                            width: item['width'] + 'px',
                                            isWholeNumberPercent: false
                                        });
                                        break;
                                    case 'Currency':
                                        structure.push({
                                            field: item['alias'],
                                            property: item['caption'],
                                            name: item['caption'],
                                            type: Currency,
                                            styles: 'text-align: ' + item['align'] + ';',
                                            width: item['width'] + 'px'
                                        });
                                        break;
                                    case 'Fixed':
                                        structure.push({
                                            field: item['alias'],
                                            property: item['propertyPath'],
                                            name: item['caption'],
                                            type: numericColumn,
                                            styles: 'text-align: ' + item['align'] + ';',
                                            constraints: {
                                                places: Sage.Utility.getPrecision(item['formatString']),
                                                round: -1
                                            },
                                            // a fake percent
                                            fercent: true,
                                            formatType: item['formatString'][
                                            item['formatString'].length - 1] === '%' ? 'Percent' : 'Number',
                                            width: item['width'] + 'px',
                                            isWholeNumberPercent: item['format'] === 'Percent' ? false : true
                                        });
                                        break;
                                    case 'Boolean':
                                        structure.push({
                                            field: item['alias'],
                                            property: item['propertyPath'],
                                            name: item['caption'],
                                            type: booleanColumn,
                                            styles: 'text-align: ' + item['align'] + ';',
                                            formatString: item['formatString'],
                                            width: item['width'] + 'px'
                                        });
                                        break;
                                    case 'Email':
                                        structure.push({
                                            field: item['alias'],
                                            property: item['propertyPath'],
                                            name: item['caption'],
                                            styles: 'text-align: ' + item['align'] + ';',
                                            formatter: function (val) {
                                                if (!val) {
                                                    return '';
                                                }

                                                return dojo.string.substitute(
                                                '<a href=mailto:${0}>${0}</a>',
                                                [Sage.Utility.htmlEncode(val)]);
                                            },
                                            width: item['width'] + 'px'
                                        });
                                        break;
                                    case 'OwnerType':
                                        structure.push({
                                            field: item['alias'],
                                            property: item['propertyPath'],
                                            name: item['caption'],
                                            type: ownerTypeColumn,
                                            styles: 'text-align: ' + item['align'] + ';',
                                            width: item['width'] + 'px'
                                        });
                                        break;

                                    case 'Phone':
                                        structure.push({
                                            field: item['alias'],
                                            property: item['propertyPath'],
                                            name: item['caption'],
                                            type: phoneColumn,
                                            styles: 'text-align: ' + item['align'] + ';',
                                            width: item['width'] + 'px'
                                        });
                                        break;

                                    case 'PickList Item':
                                        var pickName = item['alias'] + 'TEXT';                                   
                                        select.push(pickName);
                                        structure.push({
                                            field: pickName,
                                            styles: 'text-align: ' + item['align'] + ';',
                                            property: item['propertyPath'],
                                            name: item['caption'],
                                            width: item['width'] + 'px'
                                        });
                                        break;
                                    case 'User Type':
                                        structure.push({
                                            field: item['alias'],
                                            property: item['propertyPath'],
                                            name: item['caption'],
                                            type: userTypeColumn,
                                            styles: 'text-align: ' + item['align'] + ';',
                                            width: item['width'] + 'px'
                                        });
                                        break;
                                    default:
                                        structure.push({
                                            field: item['alias'],
                                            name: item['caption'],
                                            width: item['width'] + "px"
                                        });
                                        break;
                                }

                            }
                        }
                    });
                }

                //The special "keyAlias" column must always be present.
                structure.push({
                    field: this.keyAlias,
                    hidden: true,
                    width: '0px',
                    name: ''
                });

                structureData["structure"] = structure;
                structureData["select"] = select;

                return structureData;
            }

    });
    
    return Sage.Utility.Groups;
});