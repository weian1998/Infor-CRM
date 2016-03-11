define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.LogOffButton", require.toUrl("./LogOffButton.html"), 30000);
    }
});