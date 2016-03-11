define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI._DetailPanelConfigurationProvider", require.toUrl("./_DetailPanelConfigurationProvider.html"), 30000);
    }
});