define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.UI.Controls.CopyToClipboard", require.toUrl("./CopyToClipboard.html"), 30000);
    }
});