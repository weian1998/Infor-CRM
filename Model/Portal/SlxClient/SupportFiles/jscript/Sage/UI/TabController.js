/*globals define */

/**
 * @class Sage.UI.TabController
 */
define([
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/declare',
    'dojo/query',
    'dijit/layout/ScrollingTabController',
    'dijit/registry',
    'dijit/Menu',
    'dojo/dom-class',
    'dojo/text!./templates/ScrollingTabController.html',
    'dojo/aspect',
    'dijit/popup'
], function (lang, array, declare, query, ScrollingTabController, registry, Menu, domClass, scrollingTabControllerTemplate, aspect, popup) {
    var TabController = declare('Sage.UI.TabController', [ScrollingTabController], {
        templateString: scrollingTabControllerTemplate,
        closeButton: false,
        tabMenu: null,
        postCreate: function() {
            this.inherited(arguments);

            var baseMenuId, baseMenu;

            baseMenuId = this.id + '_Menu';
            baseMenu = registry.byId(baseMenuId);

            // Attempt to find the default base close menu and destroy it.
            if (baseMenu) {
                baseMenu.destroy();
            }

            this.tabMenu = new Menu({
                id: this.id + "_Menu",
                ownerDocument: this.ownerDocument,
                dir: this.dir,
                lang: this.lang,
                textDir: this.textDir,
                targetNodeIds: [this.domNode],
                selector: function(node){
                    return domClass.contains(node, "dijitClosable") && !domClass.contains(node, "dijitTabDisabled");
                }
            });

            this.own(
                this.tabMenu,
                aspect.before(popup, 'open', lang.hitch(this, this.onTabMenuOpen)),
                this.tabMenu.on('close', lang.hitch(this, this.onTabMenuClose))
            );

            this.own(
                this.on('mouseDown', lang.hitch(this, this.onTabMouseDown))
            );
        },
        onTabMouseDown: function(evt) {
            var node, widget;
            node = query('[role="tab"]', evt.target)[0] || evt.target;
            widget = registry.byId(node.id);
            this.menuOpenedOn = widget;
        },
        /**
         * Fired when the user right clicks a tab and the menu is opened. This method will get any menu items for that
         * tab id and render them in that menu.
         */
        onTabMenuOpen: function() {
            var tabPane, page, menuItems;

            tabPane = this.getParent();

            // Attempt to get the tab page container associated with the tab that was clicked, hint: it might not be the selected tab.
            // tabPane.menuOpenedOn is set onMouseDown in the tab container.
            page = (this.menuOpenedOn && this.menuOpenedOn.page) || (tabPane && tabPane.selectedChildWidget);

            if (tabPane && page) {
                menuItems = tabPane.getTabMenuItems(page.id);
                array.forEach(menuItems, function(menuItem) {
                    this.tabMenu.addChild(menuItem);
                }, this);
            }
        },
        /**
         * Fires when the tab menu is clicked or the user clicks somewhere on the page. This method will destroy any children menu items for
         * the current tab id that was clicked.
         */
        onTabMenuClose: function() {
            var menuItems;

            menuItems = this.tabMenu.getChildren();
            array.forEach(menuItems, function(menuItem) {
                this.tabMenu.removeChild(menuItem);
            }, this);
        }
    });

    return TabController;
});








