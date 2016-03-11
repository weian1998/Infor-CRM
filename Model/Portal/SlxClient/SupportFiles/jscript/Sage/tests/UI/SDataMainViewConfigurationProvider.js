define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.SDataMainViewConfigurationProvider", require.toUrl("./SDataMainViewConfigurationProvider.html"), 30000);
    }
});