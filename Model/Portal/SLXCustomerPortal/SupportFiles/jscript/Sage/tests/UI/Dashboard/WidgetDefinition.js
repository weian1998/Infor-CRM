define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Dashboard.WidgetDefinition", require.toUrl("./WidgetDefinition.html"), 30000);
    }
});