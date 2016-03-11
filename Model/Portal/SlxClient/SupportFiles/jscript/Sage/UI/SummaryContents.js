/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define, require */
define([
        'dijit/_Widget',
        'Sage/_Templated',
        'dojo/_base/lang',
        'dojo/_base/declare'
],
function (_Widget, _Templated, lang, declare) {
    var summaryContents = declare('Sage.UI.SummaryContents', [_Widget, _Templated], {
        widgetsInTemplate: true,
        templateLocation: '', // 'SummaryTemplates/Account.html',
        templateString: '', // dojo . cache('Sage', 'SummaryTemplates/Account.html'),
        widgetTemplate: '',
        constructor: function (config) {
            this.inherited(arguments);
            var moduleNameParts = ['Sage'];
            var templateParts = config.templateLocation.split('/');
            for (var i = 0; i < templateParts.length - 1; i++) {
                moduleNameParts.push(templateParts[i]);
            }
            var path = 'dojo/i18n!' + moduleNameParts.join('/') + '/nls/' + templateParts[templateParts.length - 1].replace('.html', '');
            require([path],
                lang.hitch(this, function (nls) {
                    lang.mixin(this, nls);
                })
            );
            var location = config.templateLocation || this.templateLocation;
            // If dojo.config.isDebug is true...refresh the template for debugging purposes.
            if (dojo.config.isDebug) {
                location = location + '?_t=' + new Date().valueOf();
            }
            // Dynamic caching need to be obscured from the builder by using the dojo['cache'] calling method
            this.templateString = dojo['cache']('Sage', location);
            var template = eval(this.templateString);
            this.widgetTemplate = new Simplate(template);
        }
    });

    return summaryContents;
});

