define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.DurationSelect", require.toUrl("./DurationSelect.html"), 30000);
    }
});