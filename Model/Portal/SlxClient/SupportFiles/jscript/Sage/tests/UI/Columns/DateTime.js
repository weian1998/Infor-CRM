define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Columns.DateTime", require.toUrl("./DateTime.html"), 30000);
    }
});