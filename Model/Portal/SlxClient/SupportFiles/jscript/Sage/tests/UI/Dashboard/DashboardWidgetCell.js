define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Dashboard.DashboardWidgetCell", require.toUrl("./DashboardWidgetCell.html"), 30000);
    }
});