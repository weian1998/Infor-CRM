/*
 * Copyright (c) 1997-2013, SalesLogix, NA., LLC. All rights reserved.
 */

/**
 * @class crm.Views.User.List
 *
 * @extends argos.List
 */
define('crm/Views/User/List', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/string',
    'argos/List'
], function(
    declare,
    lang,
    string,
    List
) {

    var __class = declare('crm.Views.User.List', [List], {
        //Templates
        itemTemplate: new Simplate([
            '<h3>{%: $.UserInfo.LastName %}, {%: $.UserInfo.FirstName %}</h3>',
            '<h4>{%: $.UserInfo.Title %}</h4>'
        ]),

        //Localization
        titleText: 'Users',

        //View Properties
        id: 'user_list',
        queryOrderBy: 'UserInfo.LastName asc, UserInfo.FirstName asc',

        // Excluded types for the queryWhere
        // Type:
        // 3 - WebViewer
        // 5 - Retired
        // 6 - Template
        // 7 - AddOn
        queryWhere: 'Enabled eq true and (Type ne 3 AND Type ne 5 AND Type ne 6 AND Type ne 7)',
        querySelect: [
            'UserInfo/FirstName',
            'UserInfo/LastName',
            'UserInfo/Title',
            'UserInfo/UserName'
        ],
        resourceKind: 'users',

        formatSearchQuery: function(searchQuery) {
            return string.substitute('upper(UserInfo.UserName) like "%${0}%"', [this.escapeSearchQuery(searchQuery.toUpperCase())]);
        }
    });

    lang.setObject('Mobile.SalesLogix.Views.User.List', __class);
    return __class;
});

