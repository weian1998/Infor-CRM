define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.EntityInfoToolTip", require.toUrl("./EntityInfoToolTip.html"), 30000);
    }
});