define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.GroupMenuFmtScope", require.toUrl("./GroupMenuFmtScope.html"), 30000);
    }
});