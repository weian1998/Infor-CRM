define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Filters.EditFilterItems", require.toUrl("./EditFilterItems.html"), 30000);
    }
});