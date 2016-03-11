<%@ Control Language="C#" AutoEventWireup="true" CodeFile="OAuthOptionsPage.ascx.cs" Inherits="SmartParts_Options_OAuthOptionsPage" %>
<%@ Register TagPrefix="SalesLogix" Namespace="Sage.SalesLogix.Web.Controls" Assembly="Sage.SalesLogix.Web.Controls" %>
<style>
    .outerProviderTable {
        width: 100%;
    }

    .innerProviderTable {
        background-color: lightgray;
        border-radius: 4px;
        width: 100%;
        height: 100px;
    }

    .providerGlyph {
        width: 200px;
        border-radius: 4px;
        text-align: center;
    }

    .userArea {
        border: solid 1px black;
        border-radius: 4px;
        width: 70%;
        background-color: #D0D0D0;
        border-color: #B0B0B0;
    }

    .authorizeButton {
        background-color: cadetblue;
        color: white;
        border: 1px solid;
        border-color: lightblue;
        border-radius: 5px;
        width: 100px;
        height: 28px;
    }

    .authorizeButton:hover {
        background-color: black;
        vertical-align: top;
    }

    .serviceDetailArea {
        width: 90%;
    }

    .authorizeButtonArea {
        vertical-align: top;
        width: 10%;
        margin: 0,0,0,0;
    }

    .providerName {
        font-size: large;
        font-weight: bold;
        color: darkslategray;
    }

    .accountName {
        color: lightslategray;
    }
</style>

<div style="display:none">
    <asp:Panel ID="OAuthOptions_RTools" runat="server">
        <SalesLogix:PageLink ID="lnkHelp" runat="server" LinkType="HelpFileName" ToolTip="<%$ resources:Portal, Help_ToolTip %>"
            ImageUrl="~/ImageResource.axd?scope=global&amp;type=Global_Images&amp;key=Help_16x16" Target="Help" NavigateUrl="Authorize_Services">
        </SalesLogix:PageLink>
    </asp:Panel>
</div>

<div>
    <div>
        <asp:Label runat="server" ID="lblNoProviders" Visible="False" Text="<%$ resources:noProviders_Text %>"></asp:Label>
    </div>
    <asp:ListView runat="server" ID="providerListView">
        <ItemTemplate>
<%--            <table class="outerProviderTable">
                <tr>
                    <td>--%>
                        <table class="innerProviderTable">
                            <tr>
<%--                                <td class="providerGlyph">
                                    <asp:Image runat="server" ID="imgLogo" ImageUrl='<%# GetProviderImage(Eval("ProviderKey")) %>' />
                                </td>
                                <td></td>--%>
                                <td class="userArea">
                                    <table>
                                        <tr style="white-space: nowrap">
                                            <td class="serviceDetailArea">
                                                <div class="providerName">
                                                    <asp:Label runat="server" ID="lblProvider" Text='<%# Eval("ProviderName") %>' />
                                                </div>
                                                <div class="accountName">
                                                    <asp:Label runat="server" ID="lblAccount" Text='<%# Eval("AccountName") %>' />
                                                </div>
                                            </td>
                                            <td class="authorizeButtonArea">
                                                <asp:Button CssClass="authorizeButton" ID="btnAuthorize" runat="server" Text='<%# GetAuthorizationStatus(Eval("IsAuthorized")) %>'
                                                    CommandArgument='<%# Eval("ProviderId") %>' OnClick="btnAuthorize_Click" CausesValidation="False" />
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
<%--                    </td>
                </tr>
            </table>--%>
        </ItemTemplate>
    </asp:ListView>
</div>