define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.UniqueToListValidationTextBox", require.toUrl("./UniqueToListValidationTextBox.html"), 30000);
    }
});