<%@ Control Language="C#" AutoEventWireup="true" CodeFile="ICCustomerPayments.ascx.cs" Inherits="SmartParts_Account_CustomerPayments" %>
<%@ Register Assembly="Sage.SalesLogix.Web.Controls" Namespace="Sage.SalesLogix.Web.Controls" TagPrefix="SalesLogix" %>
<%@ Register Assembly="Sage.Platform.WebPortal" Namespace="Sage.Platform.WebPortal.SmartParts" TagPrefix="SalesLogix" %>

<SalesLogix:SmartPartToolsContainer runat="server" ID="ICPayments_RTools" ToolbarLocation="right">
    <SalesLogix:PageLink ID="lnkICPaymentsHelp" runat="server" LinkType="HelpFileName" ToolTip="<%$ resources: Portal, Help_ToolTip %>" Target="MCWebHelp"
        NavigateUrl="Account_Payments_Tab" ImageUrl="~/ImageResource.axd?scope=global&type=Global_Images&key=Help_16x16">
    </SalesLogix:PageLink>
</SalesLogix:SmartPartToolsContainer>

<div id="sdgrdPayments_Grid" runat="server" style="width:100%;height:100%;"></div>