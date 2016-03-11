<%@ Page Title="SalesLogix Logoff" Language="C#" MasterPageFile="~/Masters/Login.master" Inherits="Sage.SalesLogix.Web.LoginPageBase" EnableSessionState="false" %>
<%@ MasterType VirtualPath="~/Masters/Login.master" %>
<%@ Import Namespace="Sage.SalesLogix.Web" %>

<script runat="server">
    private const string ForgotMyPasswordError = "ForgotMyPasswordError";
    
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
        object errorCodeObj = Sage.Platform.Application.ApplicationContext.Current.State[ForgotMyPasswordError];
        if (errorCodeObj != null)
        {
            Sage.Platform.Application.ApplicationContext.Current.State.Remove(ForgotMyPasswordError);

            string errorCode = errorCodeObj.ToString();
            if (!String.IsNullOrWhiteSpace(errorCode))
            {
                if (errorCode == "ERROR_UserName_NotFound" || errorCode == "ERROR_EmailAddressNotFound")
                {
                    DisplayMessage(errorCode);
                }
                else
                {
                    errorMessage = GetResourceString(errorCode);
                    if (string.IsNullOrWhiteSpace(errorMessage))
                    {
                        errorMessage = errorCode;
                    }
                }
            }
        }
        FailureText.Text = errorMessage + @"<br/><br/>";
    }
        
    protected void Page_Load(object sender, EventArgs e)
    {
        UserName.Focus();
    }

    private void DisplayMessage(string msgCode)
    {
        string msg = GetResourceString(msgCode);
        msg = msg.Replace("{0}", UserName.Text);
        UserMessage.Text = msg;
    }

    protected void btnSendPasswordReset_Click(object sender, EventArgs e)
    {
        try
        {
            UserMessage.Text = string.Empty;

            string path = Request.Url.AbsoluteUri;
            path = path.Replace("ForgotMyPassword.aspx", "");
            var provider = Membership.Provider as ISLXMembershipProvider;
            if (provider != null)
            {
                if (provider.ForgotMyPassword(UserName.Text, path, ForgotMyPasswordError))
                {
                    DisplayMessage("EmailSent");
                }
            }
            else
            {
                Sage.Platform.Application.ApplicationContext.Current.State[ForgotMyPasswordError] = GetResourceString("ERROR_EmailSendFailed");
            }
        }
        catch 
        {
            Sage.Platform.Application.ApplicationContext.Current.State[ForgotMyPasswordError] = GetResourceString("ERROR_EmailSendFailed");
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
        <asp:TextBox ID="UserName" runat="server" class="inforTextbox" placeholder="<%$ resources: UserName %>" ClientIDMode="static"></asp:TextBox>
        <br/>
        <asp:Button ID="btnSendPasswordReset" runat="server" Enabled="true" CssClass="inforFormButton default inforSignInButton" Text="<%$ resources: Submit %>" ClientIDMode="static" OnClick="btnSendPasswordReset_Click"  />
        <div class="failureTextStyle">
		    <asp:Literal ID="FailureText" runat="server" EnableViewState="False" ></asp:Literal>
	    </div>
        <asp:Label ID="UserMessage" CssClass="inforMessage" runat="server" Text="<%$ resources: EnterUserName %>"></asp:Label>

    </div>
    <div id="SignOffContainer">
		<div id="LogoffFormButtonPanel"><a class="inforHyperlink" href="~/Login.aspx" id="loginLink" runat="server"></a></div>
  </div>

</asp:Content>