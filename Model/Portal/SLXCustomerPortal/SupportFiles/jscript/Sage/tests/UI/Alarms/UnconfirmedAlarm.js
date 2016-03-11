define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Alarms.UnconfirmedAlarm", require.toUrl("./UnconfirmedAlarm.html"), 30000);
    }
});