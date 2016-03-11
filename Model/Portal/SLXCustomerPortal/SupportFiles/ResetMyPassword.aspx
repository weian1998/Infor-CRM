<%@ Page Title="SalesLogix Logoff" Language="C#" MasterPageFile="~/Masters/Login.master" Inherits="Sage.SalesLogix.Web.LoginPageBase"  %>
<%@ MasterType VirtualPath="~/Masters/Login.master" %>
<%@ Import Namespace="Sage.SalesLogix.Web" %>
<%@ Assembly Name="System.Web.Extensions, Version=3.5.0.0, Culture=neutral, PublicKeyToken=31BF3856AD364E35" %>

<script runat="server">
    private const string ResetMyPasswordError = "ResetMyPasswordError";
    
    protected override void OnPreRender(EventArgs e)
    {
        base.OnPreRender(e);

        Master.ConfigureLoginPageLink(loginLink);
        
        DisplayError();
    }

    private void DisplayError()
    {
        if (FailureText.Text.Length > 1)
        {
            FailureText.Text += @"<br/><br/>";
        }

        string errorMessage = string.Empty;
        object errorCodeObj = Sage.Platform.Application.ApplicationContext.Current.State[ResetMyPasswordError];
        if (errorCodeObj != null)
        {
            Sage.Platform.Application.ApplicationContext.Current.State.Remove(ResetMyPasswordError);

            string errorCode = errorCodeObj.ToString();
            if (!String.IsNullOrWhiteSpace(errorCode))
            {
                errorMessage = GetResourceString(errorCode);
                if (string.IsNullOrWhiteSpace(errorMessage))
                {
                    errorMessage = errorCode;
                }
            }
        }
        FailureText.Text = errorMessage + @"<br/><br/>";
    }
        
    protected void Page_Load(object sender, EventArgs e)
    {
        Password1.Focus();
    }

    protected void btnResetPassword_Click(object sender, EventArgs e)
    {
        UserMessage.Text = string.Empty;
        try
        {
            string userName = Request.QueryString["UserName"];
            string token = Request.QueryString["Token"];

            var provider = Membership.Provider as ISLXMembershipProvider;
            if (provider == null)
            {
                Sage.Platform.Application.ApplicationContext.Current.State[ResetMyPasswordError] = GetResourceString("ERROR_ResetFailed");
            }
            else
            {
                HttpContext.Current.Items.Add("changingPwd", true);
                if (provider.ResetPassword(userName, Password1.Text, Password2.Text, token, ResetMyPasswordError))
                {
                    UserMessage.Text = GetResourceString("ResetSuccess");
                    Password1.Text = "";
                    Password2.Text = "";
                }
            }
        }
        catch 
        {
            Sage.Platform.Application.ApplicationContext.Current.State[ResetMyPasswordError] = GetResourceString("ERROR_ResetFailed");
        }
    }

    private string GetResourceString(string resourceCode)
    {
        object resourceObj = GetLocalResourceObject(resourceCode);
        return resourceObj != null ? resourceObj.ToString() : string.Empty;
    }

</script>

<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolderArea" Runat="Server">
    <div class="inforLogo"></div>
    <p class="inforApplicationName">Infor CRM</p>
    <div>
        <asp:TextBox ID="Password1" runat="server" type="password" class="inforTextbox" placeholder="<%$ resources: Password1 %>" ClientIDMode="static"></asp:TextBox>
        <br/>
        <asp:TextBox ID="Password2" runat="server" type="password" class="inforTextbox" placeholder="<%$ resources: Password2 %>" ClientIDMode="static"></asp:TextBox>
        <br/>

        <asp:Button ID="btnResetPassword" runat="server" Enabled="true" CssClass="inforFormButton default inforSignInButton" Text="<%$ resources: Submit %>" ClientIDMode="static" OnClick="btnResetPassword_Click"  />
        <div class="failureTextStyle">
		    <asp:Literal ID="FailureText" runat="server" EnableViewState="False" ></asp:Literal>
	    </div>
        <div>
            <asp:Label ID="UserMessage" CssClass="inforMessage" runat="server" Text="<%$ resources: ResetInstruction %>"></asp:Label>
        </div>

    </div>
   
    <div id="SignOffContainer">
		<div id="LogoffFormButtonPanel"><a class="inforHyperlink" href="~/Login.aspx" id="loginLink" runat="server"></a></div>
    </div>

</asp:Content>