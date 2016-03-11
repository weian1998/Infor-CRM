define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.ToggleButton", require.toUrl("./ToggleButton.html"), 30000);
    }
});