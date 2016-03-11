define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.NavBarPane", require.toUrl("./NavBarPane.html"), 30000);
    }
});