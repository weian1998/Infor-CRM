define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.GridContainer", require.toUrl("./GridContainer.html"), 30000);
    }
});