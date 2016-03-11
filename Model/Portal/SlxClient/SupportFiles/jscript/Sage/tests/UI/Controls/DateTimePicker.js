define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.DateTimePicker", require.toUrl("./DateTimePicker.html"), 30000);
    }
});