define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Dashboard.DashboardTabController", require.toUrl("./DashboardTabController.html"), 30000);
    }
});