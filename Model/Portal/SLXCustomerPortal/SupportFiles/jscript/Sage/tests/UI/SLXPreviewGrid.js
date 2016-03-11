define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.SLXPreviewGrid", require.toUrl("./SLXPreviewGrid.html"), 30000);
    }
});