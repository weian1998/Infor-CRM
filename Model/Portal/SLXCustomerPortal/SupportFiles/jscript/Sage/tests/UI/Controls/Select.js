define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.Select", require.toUrl("./Select.html"), 30000);
    }
});
