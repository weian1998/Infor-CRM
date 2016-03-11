define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Alarms.AlarmCountDown", require.toUrl("./AlarmCountDown.html"), 30000);
    }
});