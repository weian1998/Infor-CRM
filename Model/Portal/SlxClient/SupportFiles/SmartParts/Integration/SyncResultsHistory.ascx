<%@ Control Language="C#" AutoEventWireup="true" CodeFile="SyncResultsHistory.ascx.cs" Inherits="SyncResultsHistory" %>
<%@ Register Assembly="Sage.SalesLogix.Web.Controls" Namespace="Sage.SalesLogix.Web.Controls" TagPrefix="SalesLogix" %>

<div style="display:none">
    <asp:Panel ID="SyncResultsHistory_RTools" runat="server">
        <SalesLogix:PageLink ID="lnkSyncResultsHistoryHelp" runat="server" LinkType="HelpFileName"
            ToolTip="<%$ resources: Portal, Help_ToolTip %>" Target="Help" NavigateUrl="Sync_Results_History"
            ImageUrl="~/ImageResource.axd?scope=global&type=Global_Images&key=Help_16x16">
        </SalesLogix:PageLink>
    </asp:Panel>
</div>

<div id="sdgrdSyncHistory_Grid" runat="server" style="width:100%;height:100%;"></div>