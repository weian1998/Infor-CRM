define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.TextBox", require.toUrl("./TextBox.html"), 30000);
    }
});