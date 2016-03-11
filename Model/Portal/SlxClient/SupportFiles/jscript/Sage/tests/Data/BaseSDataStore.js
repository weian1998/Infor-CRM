define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.Data.BaseSDataStore", require.toUrl("./BaseSDataStore.html"), 30000);
    }
});