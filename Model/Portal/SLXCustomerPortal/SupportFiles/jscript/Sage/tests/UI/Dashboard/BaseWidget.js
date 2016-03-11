define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Dashboard.BaseWidget", require.toUrl("./BaseWidget.html"), 30000);
    }
});