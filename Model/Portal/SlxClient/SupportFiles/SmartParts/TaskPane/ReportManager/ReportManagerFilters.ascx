<%@ Control Language="C#" AutoEventWireup="true" CodeFile="ReportManagerFilters.cs" Inherits="SmartParts_TaskPane_ReportManagerFilters" %>

<div dojoType="Sage.UI.Filters.FilterPanel" id="PrimaryFilters" configurationProviderType="Sage.MainView.ReportMgr.FilterConfigurationProvider"></div>

<script type="text/javascript">
    define("Sage/UI/DataStore/Filters", [
            "Sage/UI/Filters/FilterPanel",
            "Sage/MainView/ReportMgr/FilterConfigurationProvider",
            "dojo/ready",
            "dojo/_base/connect",
            "dijit/registry"
        ],
        function (FilterPanel, FilterConfigurationProvider, ready, connect, registry) {
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