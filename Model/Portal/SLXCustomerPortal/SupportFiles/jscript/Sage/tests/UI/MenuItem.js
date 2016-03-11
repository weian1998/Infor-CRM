define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.MenuItem", require.toUrl("./MenuItem.html"), 30000);
    }
});