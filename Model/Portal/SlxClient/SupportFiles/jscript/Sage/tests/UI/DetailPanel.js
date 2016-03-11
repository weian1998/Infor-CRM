define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.DetailPanel", require.toUrl("./DetailPanel.html"), 30000);
    }
});