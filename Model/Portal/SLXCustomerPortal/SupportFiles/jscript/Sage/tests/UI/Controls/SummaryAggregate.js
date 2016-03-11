define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.SummaryAggregate", require.toUrl("./SummaryAggregate.html"), 30000);
    }
});