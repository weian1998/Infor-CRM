define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.Store.SData", require.toUrl("./SData.html"), 30000);
    }
});