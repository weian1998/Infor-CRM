define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.DependencyLookup", require.toUrl("./DependencyLookup.html"), 30000);
    }
});