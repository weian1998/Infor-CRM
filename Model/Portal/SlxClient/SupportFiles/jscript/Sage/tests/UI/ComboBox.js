define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.ComboBox", require.toUrl("./ComboBox.html"), 30000);
    }
});