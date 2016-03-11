define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.Data.GroupLayoutSingleton", require.toUrl("./GroupLayoutSingleton.html"), 30000);
    }
});