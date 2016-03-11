define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI._TitlePaneConfigProvider", require.toUrl("./_TitlePaneConfigProvider.html"), 30000);
    }
});