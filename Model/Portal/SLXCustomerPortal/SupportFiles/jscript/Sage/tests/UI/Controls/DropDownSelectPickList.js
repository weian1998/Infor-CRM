define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.DropDownSelectPickList", require.toUrl("./DropDownSelectPickList.html"), 30000);
    }
});