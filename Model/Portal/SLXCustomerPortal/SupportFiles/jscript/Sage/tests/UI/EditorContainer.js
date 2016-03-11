define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.EditorContainer", require.toUrl("./EditorContainer.html"), 30000);
    }
});