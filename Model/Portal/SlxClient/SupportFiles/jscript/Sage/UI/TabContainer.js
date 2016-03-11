/*globals define */
define([
    'dijit/layout/TabContainer',
    'dojo/_base/declare',
    'dojo/_base/array',
    './TabController'
], function (TabContainer, declare, array, TabController) {

    return declare("Sage.UI.TabContainer", [TabContainer], {
        _menuItems: {},
        useMenu: false,
        useSlider: true,
        controllerWidget: TabController, // The instance of TabContainer will have a member called tablist, that is a reference to this controller instance
        addTabMenuItem: function(tabId, menuItem) {
            var entry;
            if (!this._menuItems[tabId]) {
                this._menuItems[tabId] = [];
            }

            entry = this._menuItems[tabId];
            entry.push(menuItem);
        },
        getTabMenuItems: function(tabId) {
            return this._menuItems[tabId];
        },
        destroyDescendants: function() {
            this.inherited(arguments);
            var tabId, items;

            for (tabId in this._menuItems) {
                if (this._menuItems.hasOwnProperty(tabId)) {
                    items = this._menuItems[tabId];
                    array.forEach(items, function(item) {
                        item.destroy();
                    });

                    items = null;
                }
            }

            this._menuItems = {};
        }
    });
});

