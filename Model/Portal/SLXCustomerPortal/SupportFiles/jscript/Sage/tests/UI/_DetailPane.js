define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI._DetailPane", require.toUrl("./_DetailPane.html"), 30000);
    }
});