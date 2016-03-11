define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.SummaryContainer", require.toUrl("./SummaryContainer.html"), 30000);
    }
});