define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Filters.GroupFilterConfigurationProvider", require.toUrl("./GroupFilterConfigurationProvider.html"), 30000);
    }
});