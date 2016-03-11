define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Columns.Checkbox", require.toUrl("./Checkbox.html"), 30000);
    }
});