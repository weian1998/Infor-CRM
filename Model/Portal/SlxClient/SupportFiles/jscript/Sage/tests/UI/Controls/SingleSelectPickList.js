define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.SingleSelectPickList", require.toUrl("./SingleSelectPickList.html"), 30000);
    }
});