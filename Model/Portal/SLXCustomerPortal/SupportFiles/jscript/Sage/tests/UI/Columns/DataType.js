define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Columns.DataType", require.toUrl("./DataType.html"), 30000);
    }
});