define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.Name", require.toUrl("./Name.html"), 30000);
    }
});