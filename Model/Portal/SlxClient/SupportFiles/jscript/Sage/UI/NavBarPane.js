/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
        'dijit/layout/_LayoutWidget',
        'Sage/_Templated',
        'Sage/UI/MenuItem',
        'dijit/Menu',
        'dojo/_base/declare',
        'dojo/has'
],
function (_LayoutWidget, _Templated, MenuItem, DijitMenu, declare, has) {
    var navBarPane = declare('Sage.UI.NavBarPane', [_LayoutWidget, _Templated], {
        textImageRelationMap: {
            // ImageAboveText
            0: new Simplate([
                '<div class="Global_Images icon32x32 {%: $.imageClass %}"></div>',
                '<br />',
                '<span>{%: $.text %}</span>'
            ]),
            // TextAboveImage
            1: new Simplate([
                '<span>{%: $.text %}</span>',
                '<br />',
                '<div class="Global_Images icon32x32 {%: $.imageClass %}"></div>'
            ]),
            // ImageBeforeText
            2: new Simplate([
                '<div class="Global_Images icon32x32 {%: $.imageClass %}"></div>',
                '<span>{%: $.text %}</span>'
            ]),           
            
            // TextBeforeImage
            3: new Simplate([
                '<span>{%: $.text %}</span>',
                '<div class="Global_Images icon32x32 {%: $.imageClass %}"></div>'
            ]),
            // ImageBeforeText legacy (No Sprite)
            4: new Simplate([
               '<img src="{%: $.img %}" alt="" />',
               '<span>{%: $.text %}</span>'
            ]),
        },
        attributeMap: {
            'listContent': { node: 'listNode', type: 'innerHTML' }
        },
        widgetTemplate: new Simplate([
            '<div class="nav-bar-pane">',
            '<ul dojoAttachPoint="listNode,containerNode"></ul>',
            '</div>'
        ]),
        itemTemplate: new Simplate([
            '<li id="{%: $.id %}" class="{%: $.className %}" aria-haspopup="{%: $.haspopup %}">',
            '<a href="{%: $.href %}">',
            '{%= $.innerTemplate.apply($) %}',
            '</a>',
            '</li>'
        ]),
        title: null,
        items: null,
        _requiredContextMenus: null,
        _contextMenus: null,
        constructor: function() {
            this._requiredContextMenus = [];
            this._contextMenus = [];
        },
        postCreate: function() {
            this.inherited(arguments);

            this._processItemCollection(this.items);
        },
        startup: function() {
            this.inherited(arguments);

            this._processContextMenus(this._requiredContextMenus);
        },
        destroy: function(preserveDom) {
            this.inherited(arguments);

            dojo.forEach(this._contextMenus, function(item) {
                item.destroy(preserveDom);
            });
        },
        _processItemCollection: function(items) {
            var output = [];

            dojo.forEach(items, function(item) {
                item.id = item.id || Sage.guid('NavItem');
                if(window.location.href.indexOf(item.href) !== -1) {
                    item.className = 'nav-bar-item-current-page';
                }
                else {
                    item.className = 'nav-bar-item';
                }

                if (item.contextmenu) {
                    this._requiredContextMenus.push({id: item.id, name: item.contextmenu});
                    item.haspopup = "true";
                } else {
                    item.haspopup = "false";
                }
                if (item.imageClass === "") {
                    //To support custom modules like Analytics Dashboard 
                    item.innerTemplate = this.textImageRelationMap[4];
                } else {
                    item.innerTemplate = this.textImageRelationMap[item.textImageRelation];
                }                
                output.push(this.itemTemplate.apply(item, this));
            }, this);

            this.set('listContent', output.join(''));
        },
        _processContextMenus: function(menus) {
            var i,
                j,
                menu,
                contextMenu,
                item,
                definition,
                items;
                
            for (i = 0; i < menus.length; i++)
            {
                menu = menus[i];
                definition = Sage.UI.DataStore.ContextMenus && Sage.UI.DataStore.ContextMenus[menu.name];
                items = definition && definition.items;

                if (items && items.length > 0)
                {
                    contextMenu = new DijitMenu({
                        targetNodeIds: [menu.id]
                    });
                    
                    for (j = 0; j < items.length; j++)
                    {
                        item = items[j];

                        contextMenu.addChild(new MenuItem({
                            id: contextMenu.id + '_' + item.id,
                            label: item.text || '...',
                            title: item.tooltip || '...',
                            img: item.img || this._blankGif,
                            ref: item.href,
                            onClick: this._onContextMenuClick
                        }));
                    }

                    this._contextMenus.push(contextMenu);
                }
            }
        },
        _onContextMenuClick: function() {
            if (this.ref !== '')
            {
                // TODO: This is a work-around for 
                // https://social.msdn.microsoft.com/Forums/ie/en-US/99665041-557a-4c5f-81d8-a24230ecd67f/ie10-dispatchevent-calls-wrong-listeners 
                // until we come up with a better way to distinguish between javascript links and legitimate href items. 
                // More info/context here: http://dojo-toolkit.33424.n3.nabble.com/Weird-TabContainer-Tabs-Title-behavior-IE9-Dojo-1-8-1-td3992531.html
                // Can't put javascript: links through href handler in IE10 without breaking tab containers. This is breaking
                // Activities and History dialog tabs.
                var javascriptLinkRegex = /javascript:/g;
                if ((has('ie') === 10) && javascriptLinkRegex.test(this.ref)) {
                    var tempJsRef = this.ref.replace(javascriptLinkRegex, '');
                    eval(tempJsRef);
                }
                else {
                    try {
                        window.location.href = this.ref;
                    }
                    catch (e) { }
                }
            }
        }
    });
    
    return navBarPane;
});
