define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Dialogs", require.toUrl("./Dialogs.html"), 30000);
    }
});