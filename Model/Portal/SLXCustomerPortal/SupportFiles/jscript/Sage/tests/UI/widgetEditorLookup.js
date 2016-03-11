define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.widgetEditorLookup", require.toUrl("./widgetEditorLookup.html"), 30000);
    }
});