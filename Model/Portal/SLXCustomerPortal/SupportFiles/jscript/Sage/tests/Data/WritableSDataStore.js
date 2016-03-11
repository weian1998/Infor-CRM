define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.Data.WritableSDataStore", require.toUrl("./WritableSDataStore.html"), 30000);
    }
});