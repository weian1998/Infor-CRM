define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Alarms.AlarmPopup", require.toUrl("./AlarmPopup.html"), 30000);
    }
});