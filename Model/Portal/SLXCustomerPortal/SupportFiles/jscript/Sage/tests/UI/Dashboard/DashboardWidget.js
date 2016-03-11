define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Dashboard.DashboardWidget", require.toUrl("./DashboardWidget.html"), 30000);
    }
});