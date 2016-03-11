define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Dashboard.DashboardPage", require.toUrl("./DashboardPage.html"), 30000);
    }
});