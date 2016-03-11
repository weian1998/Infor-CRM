define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Dashboard.Dashboard", require.toUrl("./Dashboard.html"), 30000);
    }
});