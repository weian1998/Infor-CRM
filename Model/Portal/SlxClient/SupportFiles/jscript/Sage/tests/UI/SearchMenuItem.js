define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.SearchMenuItem", require.toUrl("./SearchMenuItem.html"), 30000);
    }
});