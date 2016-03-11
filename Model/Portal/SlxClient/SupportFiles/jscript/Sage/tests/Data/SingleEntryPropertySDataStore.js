define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.Data.SingleEntryPropertySDataStore", require.toUrl("./SingleEntryPropertySDataStore.html"), 30000);
    }
});