define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.NavBar", require.toUrl("./NavBar.html"), 30000);
    }
});