define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.EditableGrid", require.toUrl("./EditableGrid.html"), 30000);
    }
});