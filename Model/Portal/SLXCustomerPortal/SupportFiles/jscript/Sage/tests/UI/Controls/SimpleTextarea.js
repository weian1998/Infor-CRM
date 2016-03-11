define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.SimpleTextarea", require.toUrl("./SimpleTextarea.html"), 30000);
    }
});