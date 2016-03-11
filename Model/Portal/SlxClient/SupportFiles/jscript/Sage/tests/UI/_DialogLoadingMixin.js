define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI._DialogLoadingMixin", require.toUrl("./_DialogLoadingMixin.html"), 30000);
    }
});