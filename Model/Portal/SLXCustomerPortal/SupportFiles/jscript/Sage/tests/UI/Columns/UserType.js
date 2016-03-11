define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Columns.UserType", require.toUrl("./UserType.html"), 30000);
    }
});