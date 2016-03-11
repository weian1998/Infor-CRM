define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.SummaryFormatterScope", require.toUrl("./SummaryFormatterScope.html"), 30000);
    }
});