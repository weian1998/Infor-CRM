/*
 * Copyright (c) 1997-2013, SalesLogix, NA., LLC. All rights reserved.
 */
define('spec/Views/ExchangeRateLookup.spec', [
       'dojo/json',
       'dojo/store/Memory',
       'dojo/text!spec/feeds/feed.json',
       'Mobile/SalesLogix/Views/ExchangeRateLookup'
], function(
    json,
    MemoryStore,
    feed,
    ExchangeRateLookup
) {
    var data = json.parse(feed);

    describe('Mobile.SalesLogix.Views.ExchangeRateLookup', function() {
        var _app = window.App;
        beforeEach(function() {
            window.App = {
                supportsTouch: function() {
                }
            };
        });

        afterEach(function() {
            window.App = _app;
        });

        it('should be true', function() {
            var widget = new ExchangeRateLookup();
        });
    });
});

