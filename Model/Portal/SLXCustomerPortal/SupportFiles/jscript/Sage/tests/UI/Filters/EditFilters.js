define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Filters.EditFilters", require.toUrl("./EditFilters.html"), 30000);
    }
});