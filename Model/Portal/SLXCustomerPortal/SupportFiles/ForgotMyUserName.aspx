<%@ Page Title="SalesLogix Logoff" Language="C#" MasterPageFile="~/Masters/Login.master" Inherits="Sage.SalesLogix.Web.LoginPageBase" EnableSessionState="false" %>
<%@ MasterType VirtualPath="~/Masters/Login.master" %>
<%@ Import Namespace="Sage.SalesLogix.Web" %>

<script runat="server">
    private const string ForgotMyUserNameError = "ForgotMyUserNameError";
    
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
        object errorCodeObj = Sage.Platform.Application.ApplicationContext.Current.State[ForgotMyUserNameError];
        
        if (errorCodeObj != null)
        {
            Sage.Platform.Application.ApplicationContext.Current.State.Remove(ForgotMyUserNameError);

            string errorCode = errorCodeObj.ToString();
            if (!String.IsNullOrWhiteSpace(errorCode))
            {
                if (errorCode == "ERROR_EmailAddressNotFound")
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
        UserEmail.Focus();
    }

    private void DisplayMessage(string msgCode)
    {
        string msg = GetResourceString(msgCode);
        msg = msg.Replace("{0}", UserEmail.Text);
        UserMessage.Text = msg;
    }

    protected void btnSendUserName_Click(object sender, EventArgs e)
    {
        try
        {
            UserMessage.Text = string.Empty;

            var provider = Membership.Provider as ISLXMembershipProvider;
            if (provider != null)
            {
                if (provider.ForgotMyUserName(UserEmail.Text, ForgotMyUserNameError))
                {
                    DisplayMessage("EmailSent");
                }
            }
            else
            {
                Sage.Platform.Application.ApplicationContext.Current.State[ForgotMyUserNameError] = GetResourceString("ERROR_EmailSendFailed");
            }
        }
        catch 
        {
            Sage.Platform.Application.ApplicationContext.Current.State[ForgotMyUserNameError] = GetResourceString("ERROR_UnknownError");
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
        <asp:TextBox ID="UserEmail" runat="server" class="inforTextbox" placeholder="<%$ resources: EmailAddress %>" ClientIDMode="static"></asp:TextBox>
        <br/>
        <asp:Button ID="btnSendUserName" runat="server" Enabled="true" CssClass="inforFormButton default inforSignInButton" Text="<%$ resources: Submit %>" ClientIDMode="static" OnClick="btnSendUserName_Click"  />
        <div class="failureTextStyle">
		    <asp:Literal ID="FailureText" runat="server" EnableViewState="False" ></asp:Literal>
	    </div>
        <div>
            <asp:Label ID="UserMessage" CssClass="inforMessage" runat="server" Text="<%$ resources: EnterEmail %>"></asp:Label>
        </div>

    </div>
    <div id="SignOffContainer">
		<div id="LogoffFormButtonPanel"><a class="inforHyperlink" href="~/Login.aspx" id="loginLink" runat="server"></a></div>
    </div>

</asp:Content>