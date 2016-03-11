define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.JsonPrintDetailPane", require.toUrl("./JsonPrintDetailPane.html"), 30000);
    }
});