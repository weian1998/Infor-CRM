/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define(["doh", "require"], function(doh, require){
    if(doh.isBrowser){
        doh.register("Sage.tests.Workspaces.Dialog", require.toUrl("./DialogTest.html"), 30000);
    }
});