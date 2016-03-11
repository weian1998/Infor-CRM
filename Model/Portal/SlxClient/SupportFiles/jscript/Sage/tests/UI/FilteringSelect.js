define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.FilteringSelect", require.toUrl("./FilteringSelect.html"), 30000);
    }
});