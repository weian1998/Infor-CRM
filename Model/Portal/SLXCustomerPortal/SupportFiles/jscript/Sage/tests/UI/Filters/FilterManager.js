define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Filters.FilterManager", require.toUrl("./FilterManager.html"), 30000);
    }
});