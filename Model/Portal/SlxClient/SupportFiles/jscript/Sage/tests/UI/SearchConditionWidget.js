define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.SearchConditionWidget", require.toUrl("./SearchConditionWidget.html"), 30000);
    }
});