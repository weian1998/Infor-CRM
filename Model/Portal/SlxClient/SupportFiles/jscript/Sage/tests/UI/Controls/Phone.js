define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.Phone", require.toUrl("./Phone.html"), 30000);
    }
});