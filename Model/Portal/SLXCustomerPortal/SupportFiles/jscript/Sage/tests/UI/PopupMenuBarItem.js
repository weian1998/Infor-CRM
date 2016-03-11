define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.PopupMenuBarItem", require.toUrl("./PopupMenuBarItem.html"), 30000);
    }
});