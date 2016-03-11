<%@ Control Language="C#" AutoEventWireup="true" CodeFile="AuthorizeService.ascx.cs" Inherits="AuthorizeService" %>
<%@ Register Assembly="Sage.SalesLogix.Web.Controls" Namespace="Sage.SalesLogix.Web.Controls" TagPrefix="SalesLogix" %>

<div style="display:none">
    <asp:Panel ID="AuthorizeService_RTools" runat="server">
        <SalesLogix:PageLink ID="lnkAuthorizeServiceHelp" runat="server" LinkType="HelpFileName" ToolTip="<%$ resources: Portal, Help_ToolTip %>" Target="MCWebHelp"
            NavigateUrl="AuthorizeService" ImageUrl="~/ImageResource.axd?scope=global&type=Global_Images&key=Help_16x16">
        </SalesLogix:PageLink>
    </asp:Panel>
</div>

<table border="0" cellpadding="1" cellspacing="0" class="formtable">
    <col width="14%" />
    <col width="14%" />
    <tr>
        <td colspan="2">
            <div class="twocollbl alignleft">
                <asp:Label ID="txtUserName_lbl" AssociatedControlID="txtUserName" runat="server" Text="<%$ resources: txtUserName.Caption %>"></asp:Label>
            </div>
            <div class="twocoltextcontrol">
                <asp:TextBox runat="server" ID="txtUserName" dojoType="Sage.UI.Controls.TextBox" />
            </div>
        </td>
    </tr>
    <tr>
        <td colspan="2">
            <div class="twocollbl alignleft">
                <asp:Label ID="txtAutheticationId_lbl" AssociatedControlID="txtAutheticationId" runat="server" Text="<%$ resources: txtAutheticationId.Caption %>"></asp:Label>
            </div>
            <div class="twocoltextcontrol">
                <asp:TextBox runat="server" ID="txtAutheticationId" dojoType="Sage.UI.Controls.TextBox" />
            </div>
        </td>
    </tr>
    <tr>
        <td></td>
        <td>
            <asp:Panel runat="server" ID="ctrlstButtons" CssClass="qfActionContainer">
                <asp:Button runat="server" ID="btnOK" Text="<%$ resources: btnOK.Caption %>" CssClass="slxbutton" />
                <asp:Button runat="server" ID="btnCancel" Text="<%$ resources: btnCancel.Caption %>" CssClass="slxbutton" />
            </asp:Panel>
        </td>
    </tr>
</table>