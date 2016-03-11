/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
       'dijit/MenuBar',
       'Sage/UI/MenuItem',
       'Sage/UI/PopupMenuBarItem',
       'Sage/UI/PopupMenuItem',
       'dijit/Menu',
       'Sage/UI/MenuBarItem',
       'dijit/MenuSeparator',
       'dojo/_base/declare',
       'dojo/has'
],
function (MenuBar, MenuItem, PopupMenuBarItem, PopupMenuItem, Menu, MenuBarItem, MenuSeparator, declare, has) {
    var widget = declare('Sage.UI.MenuBar', [MenuBar], {
        postMixInProperties: function () {
            // create a single store from all data sorces needed
            this.store = Sage.UI.DataStore.MenuBar || {};
            this.inherited(arguments);
        },
        postCreate: function () {
            this.inherited(arguments);
            var len = this.store.items ? this.store.items.length : 0;
            for (var i = 0; i < len; i++) {
                var menuConfig = this.store.items[i];
                var mid = (menuConfig.id !== '') ? menuConfig.id : this.id + '_' + i;
                var config = {
                    label: menuConfig.text || '...',
                    icon: menuConfig.img || this._blankGif,
                    id: mid,
                    title: menuConfig.tooltip || menuConfig.text || '',
                    ref: menuConfig.href || menuConfig.navurl || '',
                    imageClass: menuConfig.imageClass || ''
                };
                if (menuConfig.items && menuConfig.items.length > 0) {
                    var menu = new Menu({});
                    this._addItemsToMenu(menuConfig.items, menu, mid);
                    config['popup'] = menu;
                    this.addChild(new PopupMenuBarItem(config));
                } else {
                    //some don't have children, they are just buttons...
                    config['onClick'] = dojo.hitch(config, function () {
                        if (this.ref !== '') {
                            window.location.href = this.ref;
                        }
                    });
                    this.addChild(new MenuBarItem(config));
                }
            }
        },
        _addItemsToMenu: function (items, menu, idContainer) {
            idContainer = idContainer || '';
            var len = items.length;
            for (var i = 0; i < len; i++) {
                var item = items[i];
                if (item.isspacer || item.text === '-') {
                    menu.addChild(new MenuSeparator({}));
                } else {

                    var config = {
                        label: item.text || '...',
                        icon: item.img || this._blankGif,
                        title: item.tooltip || item.text || '',
                        ref: item.href || '',
                        imageClass: item.imageClass || ''
                    };
                    if (item.id !== '') {
                        config['id'] = idContainer + '_' + item.id;
                    }
                    // TODO: This is a work-around for 
                    // https://social.msdn.microsoft.com/Forums/ie/en-US/99665041-557a-4c5f-81d8-a24230ecd67f/ie10-dispatchevent-calls-wrong-listeners 
                    // until we come up with a better way to distinguish between javascript links and legitimate href items. 
                    // More info/context here: http://dojo-toolkit.33424.n3.nabble.com/Weird-TabContainer-Tabs-Title-behavior-IE9-Dojo-1-8-1-td3992531.html
                    // Can't put javascript: links through href handler in IE10 without breaking tab containers. This is breaking
                    // Activities and History dialog tabs.
                    var javascriptLinkRegex = /javascript:/g;
                    if ((has('ie') === 10) && javascriptLinkRegex.test(item.href))
                    {
                        config['ref'] = item.href.replace(javascriptLinkRegex, '');
                        config['onClick'] = function () {
                            eval(this.ref);
                        };
                    }
                    else if (item.href !== '') {
                        config['onClick'] = function () {
                            if (this.ref !== '') {
                                try {
                                    window.location.href = this.ref;
                                } catch (e) { }
                            }
                        };
                    }
                    if (item.submenu.length > 0) {
                        //recursively add submenus as appropriate...
                        var popup = new Menu({});
                        this._addItemsToMenu(item.submenu, popup, item.id || '');
                        config['popup'] = popup;
                        menu.addChild(new PopupMenuItem(config));
                    } else {
                        menu.addChild(new MenuItem(config));
                    }
                }
            }
        }
    });

    return widget;
});
