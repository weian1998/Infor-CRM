define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Alarms.AlertPane", require.toUrl("./AlertPane.html"), 30000);
    }
});