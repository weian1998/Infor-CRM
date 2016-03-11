define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.PickListAsText", require.toUrl("./PickListAsText.html"), 30000);
    }
});