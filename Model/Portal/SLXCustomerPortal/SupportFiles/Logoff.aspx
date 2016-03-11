<%@ Page Title="SalesLogix Logoff" Language="C#" MasterPageFile="~/Masters/Login.master" Inherits="Sage.SalesLogix.Web.LoginPageBase" EnableSessionState="false" %>
<%@ MasterType VirtualPath="~/Masters/Login.master" %>
<%@ Import Namespace="System.Globalization" %>
<%@ Import Namespace="System.Threading" %>

<script runat="server">

    protected override void OnPreRender(EventArgs e)
    {
        Master.ConfigureLoginPageLink(loginLink);
    }

    protected void Page_Load(object sender, EventArgs e)
    {
        loginLink.Focus();
    }

</script>

<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolderArea" Runat="Server">
    <div class="inforLogo"></div>
    <p class="inforApplicationName">Infor CRM</p>
    <div id="SignOffContainer">
        <div id="LogoffTitle"><%= GetLocalResourceObject("LogoffTitle") %></div>
        <div id="LogoffMessage"><%= GetLocalResourceObject("LogoffMessage") %></div>
        <div id="LogoffFormButtonPanel"><a href="~/Login.aspx" id="loginLink" class="inforHyperlink" runat="server"></a></div>
    </div>
</asp:Content>