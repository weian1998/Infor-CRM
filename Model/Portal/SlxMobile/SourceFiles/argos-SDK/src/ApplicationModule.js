/* Copyright (c) 2010, Sage Software, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @class argos.ApplicationModule
 * ApplicationModule is intended to be extended in the resulting application so that it
 * references all the views, toolbars and customizations and registers them to App.
 *
 * You may think of ApplicationModule as "loader" or initializer.
 * @alternateClassName ApplicationModule
 * @requires argos.Application
 */
define('argos/ApplicationModule', [
    'dojo/_base/array',
    'dojo/_base/connect',
    'dojo/_base/declare',
    'dojo/_base/lang',
    './Application',
    './Views/ConfigureQuickActions'
], function(
    array,
    connect,
    declare,
    lang,
    Application,
    ConfigureQuickActions
) {

    var __class = declare('argos.ApplicationModule', null, {
        /**
         * @property {Array}
         * Array of dojo.connect bound to ApplicationModule
         */
        _connects: null,
        /**
         * @property {Array}
         * Array of dojo.subscribe bound to ApplicationModule
         */
        _subscribes: null,
        /**
         * @property {Object}
         * The {@link App App} instance for the application
         */
        application: null,
        /**
         * Mixes in the passed options object into itself
         * @param {Object} options Properties to be mixed in
         */
        constructor: function(options) {
            this._connects = [];
            this._subscribes = [];

            lang.mixin(this, options);
        },
        /**
         * Destroy loops and disconnects all `_connect`s and unsubscribes all `_subscribe`s.
         * Also calls {@link #uninitialize uninitialize}
         */
        destroy: function() {
            array.forEach(this._connects, function(handle) {
                connect.disconnect(handle);
            });

            array.forEach(this._subscribes, function(handle) {
                connect.unsubscribe(handle);
            });

            this.uninitialize();
        },
        /**
         * Performs any additional destruction requirements
         */
        uninitialize: function() {

        },
        /**
         * Saves the passed application instance and calls:
         *
         * 1. {@link #loadCustomizations loadCustomizations}
         * 1. {@link #loadToolbars loadToolbars}
         * 1. {@link #loadViews loadViews}
         *
         * @param {Object} application
         */
        init: function(application) {
            this.application = application;

            this.loadAppStatPromises();
            this.loadCustomizations();
            this.loadToolbars();
            this.loadViews();
        },
        /**
        * @template
        * This function should be overriden in the app and be used to register all app state promises.
        */
        loadAppStatPromises: function() {
        },
        /**
         * @template
         * This function should be overriden in the app and be used to register all customizations.
         */
        loadCustomizations: function() {
        },
        /**
         * @template
         * This function should be overriden in the app and be used to register all views.
         */
        loadViews: function() {
            this.registerView(new ConfigureQuickActions());
        },
        /**
         * @template
         * This function should be overriden in the app and be used to register all toolbars.
         */
        loadToolbars: function() {
        },
        /**
         * Passes the view instance to {@link App#registerView App.registerView}.
         * @param {Object} view View instance to register
         * @param {DOMNode} domNode Optional. DOM node to place the view in.
         */
        registerView: function(view, domNode) {
            if (this.application) {
                this.application.registerView(view, domNode);
            }
        },
        /**
         * Passes the toolbar instance to {@link App#registerToolbar App.registerToolbar}.
         * @param {String} name Unique name of the toolbar to register.
         * @param {Object} toolbar Toolbar instance to register.
         * @param {DOMNode} domNode Optional. DOM node to place the view in.
         */
        registerToolbar: function(name, toolbar, domNode) {
            if (this.application) {
                this.application.registerToolbar(name, toolbar, domNode);
            }
        },
        /**
         * Passes the customization instance to {@link App#registerCustomization App.registerCustomization}.
         * @param {String} set The customization set name, or type. Examples: `list`, `detail/tools`, `list/hashTagQueries`
         * @param {String} id The View id the customization will be applied to
         * @param {Object} spec The customization object containing at least `at` and `type`.
         */
        registerCustomization: function(set, id, spec) {
            if (this.application) {
                this.application.registerCustomization(set, id, spec);
            }
        },
        /**
         * Registers a promise that will resolve when initAppState is invoked.
         * @param {Promise|Function} promise A promise or a function that returns a promise
         */
        registerAppStatePromise: function(promise) {
            if (this.application) {
                this.application.registerAppStatePromise(promise);
            }
        }
    });

    lang.setObject('Sage.Platform.Mobile.ApplicationModule', __class);
    return __class;
});
