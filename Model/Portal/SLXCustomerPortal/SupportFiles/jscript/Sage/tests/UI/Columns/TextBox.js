define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Columns.TextBox", require.toUrl("./TextBox.html"), 30000);
    }
});