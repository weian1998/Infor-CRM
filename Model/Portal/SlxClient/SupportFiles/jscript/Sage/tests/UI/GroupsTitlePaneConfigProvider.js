define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.GroupsTitlePaneConfigProvider", require.toUrl("./GroupsTitlePaneConfigProvider.html"), 30000);
    }
});