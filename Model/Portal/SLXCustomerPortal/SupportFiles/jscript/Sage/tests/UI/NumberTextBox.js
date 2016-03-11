define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.NumberTextBox", require.toUrl("./NumberTextBox.html"), 30000);
    }
});