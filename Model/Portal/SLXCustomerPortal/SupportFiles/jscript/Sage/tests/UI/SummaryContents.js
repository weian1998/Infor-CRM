define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.SummaryContents", require.toUrl("./SummaryContents.html"), 30000);
    }
});