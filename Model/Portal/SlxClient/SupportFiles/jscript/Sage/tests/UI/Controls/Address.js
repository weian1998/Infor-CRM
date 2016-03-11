define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.Address", require.toUrl("./Address.html"), 30000);
    }
});