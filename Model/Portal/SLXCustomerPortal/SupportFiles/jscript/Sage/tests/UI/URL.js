define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.URL", require.toUrl("./URL.html"), 30000);
    }
});