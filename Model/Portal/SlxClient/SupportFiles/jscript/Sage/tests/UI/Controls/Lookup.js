define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.Lookup", require.toUrl("./Lookup.html"), 30000);
    }
});