<%@ Control Language="C#" AutoEventWireup="true" CodeFile="ICSalesOrders.ascx.cs" Inherits="ICSalesOrders" %>
<%@ Register Assembly="Sage.SalesLogix.Web.Controls" Namespace="Sage.SalesLogix.Web.Controls" TagPrefix="SalesLogix" %>
<%@ Register Assembly="Sage.Platform.WebPortal" Namespace="Sage.Platform.WebPortal.SmartParts" TagPrefix="SalesLogix" %>

<SalesLogix:SmartPartToolsContainer runat="server" ID="ICSalesOrders_RTools" ToolbarLocation="right">
    <asp:ImageButton runat="server" ID="cmdAddERPSalesOrder" OnClientClick="javascript: salesOrderRTDV.executeErpInsertView()" 
        ToolTip="<%$ resources: cmdAddSalesOrder.ToolTip %>" ImageUrl="~/images/icons/plus_16x16.gif" />
    <SalesLogix:PageLink ID="lnkICSalesOrdersHelp" runat="server" LinkType="HelpFileName" ToolTip="<%$ resources: Portal, Help_ToolTip %>" Target="MCWebHelp"
        NavigateUrl="Account_Accounting_Sales_Orders" ImageUrl="~/ImageResource.axd?scope=global&type=Global_Images&key=Help_16x16">
    </SalesLogix:PageLink>
</SalesLogix:SmartPartToolsContainer>

<div id="sdgrdSalesOrders_Grid" runat="server" style="width:100%;height:100%;"></div>