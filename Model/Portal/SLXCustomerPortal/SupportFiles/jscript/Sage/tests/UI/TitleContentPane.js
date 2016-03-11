define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.TitleContentPane", require.toUrl("./TitleContentPane.html"), 30000);
    }
});