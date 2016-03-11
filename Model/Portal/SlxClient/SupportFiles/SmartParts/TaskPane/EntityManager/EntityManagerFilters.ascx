<%@ Control Language="C#" AutoEventWireup="true" CodeFile="EntityManagerFilters.cs" Inherits="SmartParts_TaskPane_EntityManagerFilters" %>

<div dojoType="Sage.UI.Filters.EntityManagerFilterPanel" id="PrimaryFilters" configurationProviderType="Sage.MainView.EntityMgr.EntityFilterConfigurationProvider"></div>

<script type="text/javascript">
    define("Sage/UI/DataStore/Filters", [
            "Sage/UI/Filters/EntityManagerFilterPanel",
            "Sage/MainView/EntityMgr/EntityFilterConfigurationProvider",
            "dojo/ready",
            "dojo/_base/connect",
            "dijit/registry"
    ],
        function (EntityManagerFilterPanel, EntityFilterConfigurationProvider, ready, connect, registry) {
            ready(function () {
                connect.subscribe('/listView/refresh', function () {
                    var filterPanel = registry.byId("PrimaryFilters");
                    if (filterPanel) {
                        filterPanel.refreshFilters(true); //True means keep selections
                    }
                });
            });

            return {};
        });
</script>  