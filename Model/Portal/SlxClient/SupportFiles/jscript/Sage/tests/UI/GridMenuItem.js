define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.GridMenuItem", require.toUrl("./GridMenuItem.html"), 30000);
    }
});