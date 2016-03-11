define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Alarms.AlarmButton", require.toUrl("./AlarmButton.html"), 30000);
    }
});