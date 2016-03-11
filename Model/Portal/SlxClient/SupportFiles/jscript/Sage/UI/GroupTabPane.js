/*globals define */
define([
    'dojo/_base/declare',
    'Sage/UI/TabController',
    'Sage/UI/TabContainer'
], function (declare, TabController, TabContainer) {

    return declare("Sage.UI.GroupTabPane", [TabContainer], {
        useMenu: false,
        useSlider: true,
    });
});

