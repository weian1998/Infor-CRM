define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.SpeedSearch", require.toUrl("./SpeedSearch.html"), 30000);
    }
});