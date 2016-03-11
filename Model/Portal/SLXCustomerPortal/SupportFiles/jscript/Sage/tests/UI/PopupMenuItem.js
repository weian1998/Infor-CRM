define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.PopupMenuItem", require.toUrl("./PopupMenuItem.html"), 30000);
    }
});