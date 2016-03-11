define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Filters.FilterPanel", require.toUrl("./FilterPanel.html"), 30000);
    }
});