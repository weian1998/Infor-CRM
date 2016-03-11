define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.ListPanel", require.toUrl("./ListPanel.html"), 30000);
    }
});