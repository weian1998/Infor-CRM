define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.MultiSelectPickList", require.toUrl("./MultiSelectPickList.html"), 30000);
    }
});