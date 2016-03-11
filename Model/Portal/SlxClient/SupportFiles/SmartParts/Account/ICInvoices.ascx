<%@ Control Language="C#" AutoEventWireup="true" CodeFile="ICInvoices.ascx.cs" Inherits="ICInvoices" %>
<%@ Register Assembly="Sage.SalesLogix.Web.Controls" Namespace="Sage.SalesLogix.Web.Controls" TagPrefix="SalesLogix" %>
<%@ Register Assembly="Sage.Platform.WebPortal" Namespace="Sage.Platform.WebPortal.SmartParts" TagPrefix="SalesLogix" %>

<SalesLogix:SmartPartToolsContainer runat="server" ID="ICInvoices_RTools" ToolbarLocation="right">
    <SalesLogix:PageLink ID="lnkICInvoicesHelp" runat="server" LinkType="HelpFileName" ToolTip="<%$ resources: Portal, Help_ToolTip %>" Target="MCWebHelp"
        NavigateUrl="Account_Invoices_Tab" ImageUrl="~/ImageResource.axd?scope=global&type=Global_Images&key=Help_16x16">
    </SalesLogix:PageLink>
</SalesLogix:SmartPartToolsContainer>

<div id="sdgrdInvoices_Grid" runat="server" style="width:100%;height:100%;"></div>