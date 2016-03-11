define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.CheckBox", require.toUrl("./CheckBox.html"), 30000);
    }
});