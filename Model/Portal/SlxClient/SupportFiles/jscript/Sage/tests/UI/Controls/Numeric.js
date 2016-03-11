define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.Numeric", require.toUrl("./Numeric.html"), 30000);
    }
});