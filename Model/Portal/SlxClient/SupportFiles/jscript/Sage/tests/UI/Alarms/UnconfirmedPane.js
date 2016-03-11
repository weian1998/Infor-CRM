define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Alarms.UnconfirmedPane", require.toUrl("./UnconfirmedPane.html"), 30000);
    }
});