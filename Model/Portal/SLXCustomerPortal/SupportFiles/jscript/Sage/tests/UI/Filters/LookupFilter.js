define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Filters.LookupFilter", require.toUrl("./LookupFilter.html"), 30000);
    }
});