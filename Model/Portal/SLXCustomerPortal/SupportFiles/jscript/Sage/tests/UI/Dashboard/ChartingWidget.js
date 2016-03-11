define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Dashboard.ChartingWidget", require.toUrl("./ChartingWidget.html"), 30000);
    }
});