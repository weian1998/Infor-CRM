define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.WidgetEditor", require.toUrl("./WidgetEditor.html"), 30000);
    }
});