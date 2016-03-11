define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.OrientableMenuBar", require.toUrl("./OrientableMenuBar.html"), 30000);
    }
});