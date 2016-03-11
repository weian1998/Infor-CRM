define([
    'dojo/_base/declare',
    'dijit/registry'
],
    function (declare, registry) {
        var workspaceUtil = declare('Sage.Utility.Workspace', [], {
    });
        workspaceUtil.getDetailTabWorkspaceContainer = function() {
            var tabNode = registry.byId('tabContent');
            var localTc = (tabNode) ? tabNode : registry.byId("mainContentDetails");
            return localTc;
        };
        return workspaceUtil;
    });