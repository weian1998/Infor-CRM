define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.Currency", require.toUrl("./Currency.html"), 30000);
    }
});