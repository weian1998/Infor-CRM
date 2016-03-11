define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.ImageButton", require.toUrl("./ImageButton.html"), 30000);
    }
});