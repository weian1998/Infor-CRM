define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.GroupListConfigurationProvider", require.toUrl("./GroupListConfigurationProvider.html"), 30000);
    }
});