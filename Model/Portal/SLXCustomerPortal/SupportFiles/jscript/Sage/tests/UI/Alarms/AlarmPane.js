define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Alarms.AlarmPane", require.toUrl("./AlarmPane.html"), 30000);
    }
});