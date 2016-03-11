define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.Data.SingleEntrySDataStore", require.toUrl("./SingleEntrySDataStore.html"), 30000);
    }
});