define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.Email", require.toUrl("./Email.html"), 30000);
    }
});