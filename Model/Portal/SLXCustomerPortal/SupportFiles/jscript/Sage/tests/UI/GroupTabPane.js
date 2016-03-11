define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.GroupTabPane", require.toUrl("./GroupTabPane.html"), 30000);
    }
});