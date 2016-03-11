define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.ToolBarLabel", require.toUrl("./ToolBarLabel.html"), 30000);
    }
});