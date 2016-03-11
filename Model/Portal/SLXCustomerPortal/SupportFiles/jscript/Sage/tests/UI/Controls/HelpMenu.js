define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.HelpMenu", require.toUrl("./HelpMenu.html"), 30000);
    }
});