define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Filters.CheckBoxFilter", require.toUrl("./CheckBoxFilter.html"), 30000);
    }
});