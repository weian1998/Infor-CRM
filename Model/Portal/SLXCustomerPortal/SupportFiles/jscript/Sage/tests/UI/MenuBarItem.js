define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.MenuBarItem", require.toUrl("./MenuBarItem.html"), 30000);
    }
});