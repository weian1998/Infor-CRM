define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.PickList", require.toUrl("./PickList.html"), 30000);
    }
});