<%@ Page Language="C#" MasterPageFile="~/Masters/Login.master" AutoEventWireup="true" Culture="auto" UICulture="auto" EnableEventValidation="false"%>
<%@ Import Namespace="Sage.Platform.Diagnostics" %>
<%@ Import Namespace="Sage.SalesLogix.BusinessRules" %>
<%@ Import Namespace="Sage.SalesLogix.Web" %>
<%@ Import Namespace="System.Threading" %>
<%@ Import Namespace="System.Globalization" %>
<%@ Register Assembly="Sage.SalesLogix.Web.Controls" Namespace="Sage.SalesLogix.Web.Controls" TagPrefix="SalesLogix" %>
<%@ Register Assembly="Sage.SalesLogix.Web.Controls" Namespace="Sage.SalesLogix.Web.Controls.ScriptResourceProvider" TagPrefix="SalesLogix" %>

<asp:Content ID="Content1" runat="server" ContentPlaceHolderID="ContentPlaceHolderArea" >
 <script type="text/javascript">
     require(["dojo/ready", "dojo/_base/array", "dojo/has", "dojo/dom", "dojo/dom-style", "dojo/_base/sniff", "dojo/dom-class", "dojo/on", 'Sage/BrowserSupport', 'dojo/i18n!Sage/UI/nls/Login'], function (ready, array, has, dom, domStyle, _sniff, domClass, on, browserSupport, loginStrings) {
         ready(function () {

             var osInfo = browserSupport().getOSInfo();
             initGears();

             if (slx && slx.com) {
                 domStyle.set(dom.byId('EnhancementsNotInstalled'), 'display', 'none');
                 domStyle.set(dom.byId('EnhancementsInstalled'), 'display', '');
             }
             if (osInfo.OSName !== "Windows") {
                 domStyle.set(dom.byId('EnhancementsNotSupported'), 'display', '');
                 domStyle.set(dom.byId('EnhancementsNotInstalled'), 'display', 'none');
                 domStyle.set(dom.byId('EnhancementsInstalled'), 'display', 'none');
             }

             var showForgotMyUserName = '<%=AllowForgotUserName()%>';
             var showForgotMyPassword = '<%=AllowForgotPassword()%>';

             domStyle.set(dom.byId('divForgotMyUserName'), 'display', showForgotMyUserName.toUpperCase() == "TRUE" ? '' : 'none');
             domStyle.set(dom.byId('divForgotMyPassword'), 'display', showForgotMyPassword.toUpperCase() == "TRUE" ? '' : 'none');

             sessionStorage.clear();
             function showUnsupportedMessage(browserLabel, browserVersion, unsupportedText) {
                 domStyle.set(dom.byId('browserUnsupportedDiv'), 'display', 'block');
                 dom.byId('currentBrowserText').innerHTML = loginStrings.currentBrowserText + " " + browserLabel + " " + browserVersion;
                 dom.byId('currentBrowserUnsupportedText').innerHTML = unsupportedText;
             }
             function browserCompatibilityCheck(browserVersion, browserSupportInfo) {

                 var isSupported, isNotOptimal, isNotFullyFunctional, latestVersion, isLastestVersion;
                 if (browserVersion) {

                     if (browserSupportInfo.supportedlVersion.length === 0) {
                         isSupported = false;
                     } else {
                         latestVersion = browserSupportInfo.supportedlVersion[browserSupportInfo.supportedlVersion.length - 1];
                         if (array.indexOf(browserSupportInfo.supportedlVersion, browserVersion) > -1) {
                             isSupported = true;
                         } else {
                             if (browserVersion > latestVersion) {
                                 isSupported = true;
                             } else {
                                 isSupported = false;
                             }
                         }
                         if (browserVersion > latestVersion) {
                             isLastestVersion = true;
                         }
                     }

                     if (browserSupportInfo.notOptimalVersion.length > 0) {
                         if ((array.indexOf(browserSupportInfo.notOptimalVersion, browserVersion) > -1) || (browserSupportInfo.notOptimalVersion[0] === -1)) {
                             isNotOptimal = true;
                         }
                     }

                     if (browserSupportInfo.notFullyFunctional.length > 0) {
                         if ((array.indexOf(browserSupportInfo.notFullyFunctional, browserVersion) > -1) || (browserSupportInfo.notFullyFunctional[0] === -1)) {
                             isNotFullyFunctional = true;
                         }

                     }

                     if (isSupported) {
                         if (isNotOptimal) {
                             // Outdated browser.
                             showUnsupportedMessage(browserSupportInfo.browserLabel, browserVersion, loginStrings.outdatedBrowserText);
                         }
                         if (isNotFullyFunctional) {
                             // not fully supported. 
                             // Commenting this out since curently FF Chrome and Safari are not fully functinal for any version.
                             //showUnsupportedMessage(browserSupportInfo.browserLabel, browserVersion, loginStrings.partiallySupportedBrowserText);

                         }
                     } else {
                         // The entire browser isn't officially supported
                         showUnsupportedMessage(browserSupportInfo.browserLabel, browserVersion, loginStrings.unsupportedBrowserText);
                     }
                 }
             };

             dom.byId('implementationGuideText').innerHTML = loginStrings.implementationGuideText;
             dom.byId('learnMoreClick').innerHTML = loginStrings.learnMoreText;
             dom.byId('btnToggleLearnMore').value = loginStrings.closeText;
             dom.byId('unsupportedMessageText').innerHTML = loginStrings.unsupportedMessageText;
             browserCompatibilityCheck(has('ie'), browserSupport().getBrowserCompatibilityInfo('ie'));
             browserCompatibilityCheck(has('ff'), browserSupport().getBrowserCompatibilityInfo('ff'));
             browserCompatibilityCheck(has('chrome'), browserSupport().getBrowserCompatibilityInfo('chrome'));
             browserCompatibilityCheck(has('opera'), browserSupport().getBrowserCompatibilityInfo('opera'));
             browserCompatibilityCheck(has('safari'), browserSupport().getBrowserCompatibilityInfo('safari'));
                         
         });
     });
     function toggleLearnMore() {
         var divToToggle = document.getElementById('browserUnsupportedMoreInfoDiv');
         if (divToToggle.style.display != "block") {
             divToToggle.style.display = "block";
             return;
         }
         divToToggle.style.display = 'none';
     };

     function onLanguageSelectChange() {
         var langSelectDropdown = document.getElementsByClassName('dropdown');
         if (langSelectDropdown.value !== '<%= System.Globalization.CultureInfo.CurrentCulture.Name %>') {
             __doPostBack(langSelectDropdown, langSelectDropdown.value);
         }
     };
            </script>
<SalesLogix:ScriptResourceProvider runat="server" ID="LoginStrings" >
	<Keys>
		<SalesLogix:ResourceKeyName Key="EnhancementsInstalled" />
        <SalesLogix:ResourceKeyName Key="EnhancementsInstall" />
        <SalesLogix:ResourceKeyName Key="EnhancementsNotSupported" />
	</Keys>
</SalesLogix:ScriptResourceProvider>
    <div id="browserUnsupportedDiv" style='display:none' class="failureTextStyle">
        <div>
            <span id="unsupportedMessageText"></span><br />
            <a id="learnMoreClick" class="inforHyperlink" onclick="toggleLearnMore();"></a>
        </div>
    </div>
    <div id="browserUnsupportedMoreInfoDiv" style='display:none;' class="failureTextStyle">
     <div>
        <span id="currentBrowserText"></span><br />
        <span id="currentBrowserUnsupportedText"></span><br />
        <a id="implementationGuideText" href="http://docs.infor.com/crm/8.2/en-us/Web%20Client%20Compatibility.htm" target="_blank" class="inforHyperlink"></a><br />
        <input type="button" class="inforFormButton default inforSignInButton" onclick="toggleLearnMore();" id="btnToggleLearnMore" />
     </div>
    </div>
	<div class="inforLogo"></div>
    <p class="inforApplicationName">Infor CRM</p>
    <asp:Login ID="slxLogin" runat="server" align="center" DestinationPageUrl="Default.aspx" FailureText="<%$ resources: SignInError %>" OnPreRender="PreRender">
		<LayoutTemplate>
            <asp:TextBox ID="UserName" runat="server" class="inforTextbox" placeholder="<%$ resources: UserName %>" ClientIDMode="static"></asp:TextBox>
				                    <asp:CustomValidator ID="UserNameRequired" ValidateEmptyText="True" OnServerValidate="ValidateUserName" ClientValidationFunction="" runat="server"
                                        ControlToValidate="UserName" ErrorMessage="<%$ resources: UserNameRequired %>" ToolTip="<%$ resources: UserNameRequired %>"
                                 ValidationGroup="slxLogin" Text="<%$ resources: asterisk %>" Display="none"></asp:CustomValidator>
            <br/>
            <asp:TextBox ID="Password" runat="server" CssClass="inforTextbox"  placeholder="<%$ resources: Password %>" TextMode="Password" AutoComplete="off" ClientIDMode="static"></asp:TextBox>
            <br/>
            <div class="failureTextStyle">
			                <asp:Literal ID="FailureText" runat="server" EnableViewState="False" ></asp:Literal>
			            </div>
            <asp:DropDownList id="ddlLanguageSelect" runat="server" class="dropdown" onchange="onLanguageSelectChange();" ClientIDMode="static"></asp:DropDownList>
            <br /><br />
            <asp:Button ID="btnLogin" runat="server" Enabled="true" CommandName="Login" CssClass="inforFormButton default inforSignInButton" Text="<%$ resources: LogOn %>" ClientIDMode="static" ValidationGroup="slxLogin" />
            <br/>
            <input type="checkbox" ID="chkRememberMe" runat="server" class="inforCheckbox" checked="false" ClientIDMode="static"/>
            <asp:Label AssociatedControlID="chkRememberMe" runat="server" CssClass="inforCheckboxLabel noColon label" Text="<%$ resources: RememberMe %>"></asp:Label>
            <br/>
            <div id="divForgotMyUserName" style="display:none;">
                <br/>
                <asp:HyperLink CssClass="inforHyperlink" NavigateUrl="~/ForgotMyUserName.aspx" ID="forgotMyUserNameLink" Text="<%$ resources: ForgotUserName %>" runat="server"></asp:HyperLink>
                <br/>
             </div>
            <div id="divForgotMyPassword" style="display:none;">
                <br/>
                <asp:HyperLink CssClass="inforHyperlink" NavigateUrl="~/ForgotMyPassword.aspx" ID="forgotMyPassword" Text="<%$ resources: ForgotPassword %>" runat="server"></asp:HyperLink>
                <br/>
			</div>
            <br/>
            <input type="button" ID="EnhancementsNotInstalled" runat="server" onclick=" slx_installDesktopFeatures(); " 
                        class="inforFormButton default inforSignInButton" value="<%$ resources: EnhancementsInstall %>" ClientIDMode="static"/>
            <input type="button" ID="EnhancementsInstalled" runat="server" style="display: none;" onclick=" slx_installDesktopFeatures(); " 
                        class="inforFormButton default inforSignInButton disabled" value="<%$ resources: EnhancementsInstalled %>" ClientIDMode="static" />
            
            <input type="button" ID="EnhancementsNotSupported" runat="server" style="display: none;" 
                        class="inforFormButton default inforSignInButton disabled" value="<%$ resources: EnhancementsNotSupported %>" ClientIDMode="static"/>
            <br />
            <span>
			                <SalesLogix:PageLink runat="server" ID="findoutmorelink" LinkType="HelpFileName" NavigateUrl="desktopintegration"
                                     Text="<%$ resources: FindOutMore %>" CssClass="inforHyperlink" Target="MCWebHelp" >
			                </SalesLogix:PageLink>
			            </span>
            <br/>
            <br/>
                <div id="VersionSection">
                    <asp:Label ID="VersionLabel" runat="server" Text="Version"></asp:Label>
                    <div class="info">
                        <div>
                            <asp:Label ID="Copyright" runat="server" Text="<%$ resources: Copyright %>"></asp:Label>
                        </div>
                        <div>
                            <asp:Label ID="Sage" runat="server" Text="<%$ resources: SageSoftwareInc %>"></asp:Label>
                        </div>
                        <div>
                            <asp:Label ID="Rights" runat="server" Text="<%$ resources: AllRightsReserved %>"></asp:Label>
                        </div>
                    </div>
                </div>
            <br/>
            <div ID="debugLabel" class="debugMode" runat="server" Visible="False">ASP.NET Debug Mode is ON.  For optimized performance, we suggest you turn this off.</div>
            <br/>
        </LayoutTemplate>
    </asp:Login>
</asp:Content>

<script type="text/C#" runat="server">
    private const string AuthError = "AuthError";
    private const string ddlLanguageRequestFormId = "ctl00$ContentPlaceHolderArea$slxLogin$ddlLanguageSelect";
    private const string ddlLanguageId = "ddlLanguageSelect";
    private const string languageCookieId = "SLXLanguageSetting";
    private const int daysToKeepCookies = 14;
    private const string rememberMeCookieId = "SLXRememberMe";
    private const string userNameCookieId = "SLXUserName";
    private bool? isRemoteDb;
        
    protected override void OnInit(EventArgs e)
    {
        base.OnInit(e);
        EnsureChildControls();
    }

    protected override void InitializeCulture()
    {
        String selectedLanguage = null;

        // InitializeCulture runs before any controls are instantiated, so if we need the language value
        // from the control, it has to be read from the form postback info instead.
        if (Request.Form[ddlLanguageRequestFormId] != null)
        {
            selectedLanguage = Request.Form[ddlLanguageRequestFormId];
        }
        else if (Request.Cookies[languageCookieId] != null)
        {
            selectedLanguage = Request.Cookies[languageCookieId].Value;
        }

        if (String.IsNullOrWhiteSpace(selectedLanguage) || !EnabledLanguageList.Languages.Exists(x => x.CultureCode.Equals(selectedLanguage, StringComparison.InvariantCultureIgnoreCase)))
        {
            // Cookie culture was either empty, corrupt, or doesn't match a value in the ELL. If this happens, see if the ELL has a matching culture code. If it does, use that, otherwise fall back to EN-US.
            EnabledLanguage currentBrowserLanguage = EnabledLanguageList.Languages.FirstOrDefault(x => x.CultureCode.StartsWith(Thread.CurrentThread.CurrentUICulture.Name, StringComparison.InvariantCultureIgnoreCase));

            selectedLanguage = (currentBrowserLanguage != null) ? currentBrowserLanguage.CultureCode : "en-us";

            // Then rebuild the cookie.
            var newCookie = new HttpCookie(languageCookieId) { Value = selectedLanguage };
            Response.Cookies.Add(newCookie);
            Request.Cookies.Remove(languageCookieId);
        }

        UICulture = selectedLanguage;
        Culture = selectedLanguage;

        Thread.CurrentThread.CurrentCulture = CultureInfo.CreateSpecificCulture(selectedLanguage);
        Thread.CurrentThread.CurrentUICulture = new CultureInfo(selectedLanguage);

        base.InitializeCulture();
    }

    protected void Page_Load(object sender, EventArgs e)
    {
        HtmlInputCheckBox rememberMe = (HtmlInputCheckBox) slxLogin.Controls[0].FindControl("chkRememberMe");
        TextBox userName = (TextBox) slxLogin.Controls[0].FindControl("UserName");
        DropDownList languageSelect = (DropDownList)slxLogin.Controls[0].FindControl(ddlLanguageId);

        if (languageSelect.Items.Count == 0 && EnabledLanguageList.Languages != null)
        {
            foreach (EnabledLanguage language in EnabledLanguageList.Languages)
            {
                languageSelect.Items.Add(new ListItem(language.DisplayText, language.CultureCode));
            }
        }

        if (HttpContext.Current.IsDebuggingEnabled)
		{
			slxLogin.Controls[0].FindControl("debugLabel").Visible = true;
		}
		if (IsPostBack)
		{
            
            
            HttpCookie cookieRememberMe = new HttpCookie(rememberMeCookieId);
            cookieRememberMe.Value = (rememberMe.Checked ? "T" : "F");
            cookieRememberMe.Expires = DateTime.Now.AddDays(daysToKeepCookies);
            Response.Cookies.Add(cookieRememberMe);

            HttpCookie cookieLanguageSetting = new HttpCookie(languageCookieId);
            cookieLanguageSetting.Value = languageSelect.SelectedValue;
            cookieLanguageSetting.Expires = DateTime.Now.AddDays(daysToKeepCookies);
            Response.Cookies.Add(cookieLanguageSetting);

			if (rememberMe.Checked)
			{
                HttpCookie cookieUserName = new HttpCookie(userNameCookieId);
				cookieUserName.Value = Server.UrlEncode(userName.Text);
                cookieUserName.Expires = DateTime.Now.AddDays(daysToKeepCookies);
				Response.Cookies.Add(cookieUserName);
			}
		}
		else
		{
            if (Request.Cookies[rememberMeCookieId] != null)
			{
                rememberMe.Checked = (Request.Cookies[rememberMeCookieId].Value == "T");
                if ((rememberMe.Checked) && (Request.Cookies[userNameCookieId] != null))
				{
                    userName.Text = Server.UrlDecode(Request.Cookies[userNameCookieId].Value);
				}
			}
            if (Request.Cookies[languageCookieId] != null)
            {
                languageSelect.SelectedIndex = languageSelect.Items.IndexOf(languageSelect.Items.FindByValue(Request.Cookies[languageCookieId].Value));
            }
            else
            {
                var culture = languageSelect.Items.FindByValue(Thread.CurrentThread.CurrentUICulture.Name);
                if (culture == null)
                {
                    var browserLanguage = languageSelect.Items.Cast<ListItem>().FirstOrDefault(x => x.Value.StartsWith(Thread.CurrentThread.CurrentUICulture.Name, StringComparison.InvariantCultureIgnoreCase));
                    if (browserLanguage != null)
                    {
                        languageSelect.Items.FindByValue(browserLanguage.Value).Selected = true;
                    }
                    else
                    {
                        languageSelect.Items.FindByValue("en-us").Selected = true;
                    }
                }
            }
			ClearOldSession();
		}
		SetVersion();

		userName.Focus();
	}

    public string AllowForgotUserName()
    {
        bool allow = AllowSelfService && AppSettingHelper.GetSettingOrDefault<bool>(AppSettingHelper.KeyForgotUserNameFeature, false);
        return allow ? "true" : "false";
    }

    public string AllowForgotPassword()
    {
        bool allow = AllowSelfService && AppSettingHelper.GetSettingOrDefault<bool>(AppSettingHelper.KeyForgotPasswordFeature, false);
        return allow ? "true" : "false";
    }

    public bool AllowSelfService
    {
        get
        {
            if (isRemoteDb == null)
            {
                GetAllowSelfService();
            }
            return (isRemoteDb != null && !Convert.ToBoolean(isRemoteDb));
        }
    }

    private void GetAllowSelfService()
    {
        var provider = Membership.Provider as ISLXMembershipProvider;
        if (provider != null)
        {
            isRemoteDb = provider.IsRemoteDatabase();
        }
    }

    private void ClearOldSession()
    {
        string[] cookiesToDelete = { "SlxCalendar", "SlxCalendarASP" };
        foreach (string val in cookiesToDelete)
        {
            var delCookie = new HttpCookie(val);
            delCookie.Expires = DateTime.Now.AddDays(-1d);
            Response.Cookies.Add(delCookie);
            Request.Cookies.Remove(val);
        }
        if (Request.Cookies[StickySessionUtil.SlxStickySessionIdCookieName] != null)
        {
            var cookie = new HttpCookie(StickySessionUtil.SlxStickySessionIdCookieName)
            {
                Expires = DateTime.Now.AddDays(-1d),
                HttpOnly = true
            };
            Response.Cookies.Add(cookie);
            Request.Cookies.Remove(StickySessionUtil.SlxStickySessionIdCookieName);
        }
        if (FormsAuthentication.IsEnabled)
        {
            ErrorHelper.FormsAuthSignOut(Request, Response);
        }
        if (!Session.IsNewSession)
        {           
            Session.Abandon();
        }
    }

	protected new void PreRender(object sender, EventArgs e)
	{
        var FailureText = (Literal) slxLogin.FindControl("FailureText");
        if (FailureText.Text.Length > 1)
        {
            FailureText.Text += "<br/><br/>";
        }
        object msg = Sage.Platform.Application.ApplicationContext.Current.State[AuthError];
		if (msg == null)
		{
			var pageId = Sage.Platform.Application.ApplicationContext.Current.State["CurrentPageID"];
			var key = pageId + ":" + AuthError;
			msg = Sage.Platform.Application.ApplicationContext.Current.State[key];
		}
		if (msg != null)
		{
			Sage.Platform.Application.ApplicationContext.Current.State.Remove(AuthError);

            FailureText.Text = msg.ToString() + "<br/><br/>";
		}
	}

    private static void SetAuthError(string errorMsg)
    {
        if (!string.IsNullOrEmpty(errorMsg))
        {
            Sage.Platform.Application.ApplicationContext.Current.State[AuthError] = errorMsg;
        }
        else
        {
            Sage.Platform.Application.ApplicationContext.Current.State.Remove(AuthError);
        }
    }

    protected void ValidateUserName(object source, ServerValidateEventArgs args)
    {
        var oValidator = (CustomValidator) source;

        if (oValidator == null)
        {
            args.IsValid = false;
            SetAuthError(GetLocalResourceObject("InvalidUserNameValidation").ToString());
            return;
        }

        char cBadChar;
        BusinessRuleHelper.InvalidUserNameReason reason;

        if (BusinessRuleHelper.IsValidUserNameValue(args.Value, out reason, out cBadChar))
        {
            args.IsValid = true;
            SetAuthError(null);
        }
        else
        {
            args.IsValid = false;

            switch (reason)
            {
                case BusinessRuleHelper.InvalidUserNameReason.NullOrEmpty:
                case BusinessRuleHelper.InvalidUserNameReason.WhiteSpace:
                    oValidator.ErrorMessage = GetLocalResourceObject("UserNameRequired").ToString();
                    break;
                default:
                    oValidator.ErrorMessage = GetLocalResourceObject("slxLoginResource1.FailureText").ToString();
                    break;
            }

            SetAuthError(oValidator.ErrorMessage);
        }
    }

    protected void Page_Error(Object sender, EventArgs e)
    {
        var userName = (TextBox) slxLogin.Controls[0].FindControl("UserName");
        string usrnm = userName.Text;

        Exception err = Server.GetLastError();
        if (err is Sage.Platform.Application.ValidationException)
        {
            string errMsg = err.Message;
            GoToChangePassword(usrnm, errMsg);
        }
    }

    protected void GoToChangePassword(string strUserName, string errMessage)
	{
		string url = Request.Url.AbsolutePath;
		int n = url.LastIndexOf("/");
		string pwdchangeurl = url.Substring(0, n);
		HttpContext.Current.Cache.Insert("changePasswordError", errMessage, null, Cache.NoAbsoluteExpiration, new TimeSpan(0, 5, 0), CacheItemPriority.Normal, null);
		Response.Redirect(pwdchangeurl + "/ChangePassword.aspx?username=" + strUserName);
	}

	private void SetVersion()
    {
        if (!IsPostBack)
        {
            var resource = GetLocalResourceObject("VersionLabelResource1.Text");
            if (resource != null)
            {
                var control = slxLogin.FindControl("VersionLabel");
                if (control != null)
                {
                    Version version = typeof(Sage.SalesLogix.Web.SLXMembershipProvider).Assembly.GetName().Version;
                    ((Label)control).Text = String.Format("{0} {1}", resource, version);
                }
            }
        }
    }

</script>