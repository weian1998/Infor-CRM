define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Columns.Boolean", require.toUrl("./Boolean.html"), 30000);
    }
});