define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.SummaryDetailPane", require.toUrl("./SummaryDetailPane.html"), 30000);
    }
});