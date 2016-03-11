define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.ConditionManager", require.toUrl("./ConditionManager.html"), 30000);
    }
});