define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.DateTextBox", require.toUrl("./DateTextBox.html"), 30000);
    }
});