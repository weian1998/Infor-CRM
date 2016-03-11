/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
        'dijit/layout/AccordionContainer',
        'dijit/layout/_LayoutWidget',
        'Sage/UI/NavBarPane',
        'Sage/Layout/_SplitterEnhancedMixin',
        'dojo/dom',
        'dojo/on',
        'dojo/dom-style',
        'dojo/dom-class',
        'dojo/cookie',
        'dojo/_base/declare',
        'dojo/dom-geometry',
        'dojo/_base/array', // array.forEach array.map
        'dojo/aspect'
],
// ReSharper disable InconsistentNaming
function (AccordionContainer, _LayoutWidget, NavBarPane,
    _SplitterEnhancedMixin, dom, on, domStyle, domClass, cookie, declare, domGeometry, array, aspect) {
    // ReSharper restore InconsistentNaming
    var navBar = declare('Sage.UI.NavBar', [AccordionContainer, _LayoutWidget, _SplitterEnhancedMixin], {
        persist: true,
        navPin: 'navPinID',
        navIcon: 'navIconID',
        animRotate: 'rotate90',
        postCreate: function () {
            this.inherited(arguments);
            var items = Sage.UI.DataStore.NavBar && Sage.UI.DataStore.NavBar.items;
            if (items) {
                this._processNavCollection(items);
            }
        },
        _processNavCollection: function (items) {
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                this.addChild(new NavBarPane({
                    title: item.text,
                    items: item.items
                }));
            }
        },
        startup: function () {
            var that = this;
            this.inherited(arguments);
            this.domNode.style.overflow = 'hidden';
            var navPinned = true;
            var navContainer = this.getParent().id;
            domStyle.set(navContainer, 'display', 'block');

            // Resize all widgets layout when nav pane is pinned
            aspect.after(_LayoutWidget.prototype, 'startup', function (response) {
                var parent = this.getParent && this.getParent();
                this.connect(dom.byId(that.navPin), 'click', function () {
                    parent.resize();
                });
            });

            // Hide container if nav pane is not pinned. This needs to be done when layout resize is triggered
            // otherwise viewport will consider position of nav bar on dom and resize all widgets accordingly
            aspect.before(_LayoutWidget.prototype, 'resize', function (response) {
                // Ensure container hide is not triggered when accordion pane resizes
                if (!(this.getParent() !== null
                        && this.getParent().hasOwnProperty('parent')
                        && this.getParent().parent.id === that.id)
                        && !navPinned) {
                    that._hideContainer(navContainer);
                    domClass.remove(navContainer, 'show');
                }
            });

            // If cookie is set append visibility style to head
            if (cookie(that.navPin) === '0') {
                navPinned = false;
                that._hideContainer(navContainer);
                that._hideContainer(navContainer + '_splitter');
                domClass.add(dom.byId(that.navPin), that.animRotate);
                domStyle.set(that.navIcon, 'display', 'inline-block');
            } else {
                domClass.add(navContainer, 'showSolid');
                domClass.add(dom.byId(that.id), 'show');
                domStyle.set(navContainer + '_splitter', 'display', 'block');
            }

            // Set width if user had it customized 
            if (parseInt(cookie(that.navPin + '_width')) > 0) {
                domStyle.set(navContainer, 'width', cookie(that.navPin + '_width'));
            }

            // Pin navvigation to page on click. Set cookie to keep nav open 
            // for next page load.
            on(dom.byId(that.navPin), 'click', function (e) {
                if (navPinned) {
                    domClass.remove(navContainer, 'showSolid');
                    domClass.add(dom.byId(that.navPin), that.animRotate);
                    domStyle.set(navContainer + '_splitter', 'display', 'none');
                    navPinned = false;
                    domStyle.set(that.navIcon, 'display', 'inline-block');
                    cookie(that.navPin, '0');
                } else {
                    cookie(that.navPin, '1');
                    domClass.add(navContainer, 'showSolid');
                    domClass.remove(dom.byId(that.navPin), that.animRotate);
                    domStyle.set(navContainer + '_splitter', 'display', 'block');
                    domStyle.set(that.navIcon, 'display', 'none');
                    navPinned = true;
                }
            });

            // Click on icon to flyout nav pane
            on(dom.byId(navContainer + '_splitter'), 'click', function (e) {
                cookie((that.navPin + '_width'), domStyle.getComputedStyle(dom.byId(navContainer)).width);
            });

            // Click on icon to flyout nav pane
            on(dom.byId(that.navIcon), 'click', function (e) {
                e.stopPropagation();

                // If navigation pane is already pinned - no action required
                if (navPinned) {
                    return;
                }

                that._toggleNavContainer(navContainer, navPinned);
            });

            // Avoid closing nav pane on click. Nav inherits click event from document.
            on(dom.byId(navContainer), 'click', function (e) {
                e.stopPropagation();
            });

            // In case nav pane is unpinnned and open - close it
            on(document, 'click', function (e) {
                if (!navPinned && (domStyle.getComputedStyle(dom.byId(navContainer)).display != 'none')) {
                    that._toggleNavContainer(navContainer, !navPinned);
                }
            });
        },
        // override default accordion layout in AccordionContainer.js
        layout: function () {
            var openPane = this.selectedChildWidget;

            if (!openPane) {
                return;
            }

            // space taken up by title, plus wrapper div (with border/margin) for open pane
            var wrapperDomNode = openPane._wrapperWidget.domNode,
				wrapperDomNodeMargin = domGeometry.getMarginExtents(wrapperDomNode),
				wrapperDomNodePadBorder = domGeometry.getPadBorderExtents(wrapperDomNode),
				wrapperContainerNode = openPane._wrapperWidget.containerNode,
				wrapperContainerNodeMargin = domGeometry.getMarginExtents(wrapperContainerNode),
				wrapperContainerNodePadBorder = domGeometry.getPadBorderExtents(wrapperContainerNode),
				mySize = this._contentBox;

            // get cumulative height of all the unselected title bars
            var totalCollapsedHeight = 0;
            array.forEach(this.getChildren(), function (child) {
                if (child != openPane) {
                    var childHeight = parseInt(domStyle.getComputedStyle(child.getParent().domNode.children[0]).height),
                     childMarginBottom = parseInt(domStyle.getComputedStyle(child.getParent().domNode).marginBottom),
                     childMarginTop = parseInt(domStyle.getComputedStyle(child.getParent().domNode).marginTop),
                     childBorderTop = parseInt(domStyle.getComputedStyle(child.getParent().domNode).borderTopWidth),
                     childBorderBottom = parseInt(domStyle.getComputedStyle(child.getParent().domNode).borderBottomWidth);

                    if (!isNaN(childHeight)) {
                        totalCollapsedHeight += childHeight;
                    }
                    if (!isNaN(childMarginBottom)) {
                        totalCollapsedHeight += childMarginBottom;
                    }
                    if (!isNaN(childMarginTop)) {
                        totalCollapsedHeight += childMarginTop;
                    }
                    if (!isNaN(childBorderTop)) {
                        totalCollapsedHeight += childBorderTop;
                    }
                    if (!isNaN(childBorderBottom)) {
                        totalCollapsedHeight += childBorderBottom;
                    }
                }
            });

            // Get the first child in Nav container which is navLogo
            // calculate its height for sizing open nav pane.
            // This assumes the logo is always placed at top
            var node = this.getParent().domNode.children[0],
            cs = domStyle.getComputedStyle(node),
            me = domGeometry.getMarginExtents(node, cs),
            be = domGeometry.getBorderExtents(node, cs),
            logoHeight = me.b + me.t + parseInt(cs.height) + parseInt(cs.paddingTop) + parseInt(cs.paddingBottom) + be.h;

            this._verticalSpace = window.innerHeight - wrapperDomNodeMargin.h
            - wrapperDomNodePadBorder.h - wrapperContainerNodeMargin.h - wrapperContainerNodePadBorder.h
            - logoHeight - totalCollapsedHeight - 51;

            // Vertically position Nav pane to accomodate logo
            domStyle.set(this.domNode, 'top', (logoHeight + 'px'));

            // Memo size to make displayed child
            this._containerContentBox = {
                h: this._verticalSpace,
                w: this._contentBox.w - wrapperDomNodeMargin.w - wrapperDomNodePadBorder.w
					- wrapperContainerNodeMargin.w - wrapperContainerNodePadBorder.w
            };

            if (openPane) {
                openPane.resize(this._containerContentBox);
            }
        },
        // Toggle nav container's visibility
        // @param {string} elem - Element id whose display needs to toggled
        // @param {bool} visible - flag to toggle in or out
        _toggleNavContainer: function (elem, visible) {

            var that = this;
            var node = dom.byId(elem);
            var navContainer = this.getParent().id;
            // To fade in nav container - it must be set to display block initially
            if (visible) {
                domClass.remove(node, 'show');
                domClass.remove(dom.byId(that.id), 'show');
                setTimeout(function () {
                    that._hideContainer(navContainer);
                }, 500);
            } else {
                domStyle.set(navContainer, 'display', 'block');
                setTimeout(function () {
                    domClass.add(dom.byId(that.id), 'show');
                    domClass.add(node, 'show');
                }, 10);
            }
        },
        // Hide display for a container's visibility
        // @param {string} elem - Element id whose display needs to toggled
        _hideContainer: function (elem) {
            domStyle.set(elem, 'display', 'none');
            domStyle.set(elem, 'opacity', '0');
        }
    });
    return navBar;
});
