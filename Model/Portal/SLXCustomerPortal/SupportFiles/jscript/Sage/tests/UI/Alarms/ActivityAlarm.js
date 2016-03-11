define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Alarms.ActivityAlarm", require.toUrl("./ActivityAlarm.html"), 30000);
    }
});