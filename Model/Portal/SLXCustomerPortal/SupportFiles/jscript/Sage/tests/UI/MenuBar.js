define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.MenuBar", require.toUrl("./MenuBar.html"), 30000);
    }
});