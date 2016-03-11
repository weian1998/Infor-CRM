<%@ Page Language="C#" MasterPageFile="~/Masters/Login.master" AutoEventWireup="true" Culture="auto" UICulture="auto" EnableEventValidation="false"%>
<%@ Import Namespace="Sage.Platform.Diagnostics" %>
<%@ Import Namespace="Sage.Platform.Orm"%>
<%@ Import Namespace="NHibernate"%>
<%@ Import Namespace="Sage.Entity.Interfaces"%>
<%@ Import Namespace="Sage.SalesLogix.Web" %>
<%@ Import Namespace="System.Threading" %>
<%@ Import Namespace="System.Globalization" %>
<asp:Content ID="Content1" runat="server" ContentPlaceHolderID="ContentPlaceHolderArea" >

    <script type="text/javascript">
        require(["dojo/ready", "dojo/_base/array", "dojo/has", "dojo/dom", "dojo/dom-style", "dojo/_base/sniff", "dojo/dom-class", "dojo/on", 'Sage/BrowserSupport', 'dojo/i18n!Sage/UI/nls/Login'], function (ready, array, has, dom, domStyle, _sniff, domClass, on, browserSupport, loginStrings) {
            ready(function () {

                var showForgotMyUserName = '<%=ConfigurationManager.AppSettings["saleslogix.web.forgotUserNameFeature"]%>';
                var showForgotMyPassword = '<%=ConfigurationManager.AppSettings["saleslogix.web.forgotPasswordFeature"]%>';

                domStyle.set(dom.byId('divForgotMyUserName'), 'display', showForgotMyUserName.toUpperCase() == "TRUE" ? '' : 'none');
                domStyle.set(dom.byId('divForgotMyPassword'), 'display', showForgotMyPassword.toUpperCase() == "TRUE" ? '' : 'none');


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
    <asp:Login ID="slxLogin" runat="server" align="center" DestinationPageUrl="Ticket.aspx" FailureText="<%$ resources: SignInError %>" OnPreRender="PreRender">

        <LayoutTemplate>
            <asp:TextBox ID="UserName" runat="server" class="inforTextbox" placeholder="<%$ resources: UserName %>" ClientIDMode="static"></asp:TextBox>
            <asp:RequiredFieldValidator ID="UserNameRequired" ValidateEmptyText="True" OnServerValidate="ValidateUserName" ClientValidationFunction="" runat="server"
                                        ControlToValidate="UserName" ErrorMessage="<%$ resources: UserNameRequired %>" ToolTip="<%$ resources: UserNameRequired %>"
                                        ValidationGroup="slxLogin" Text="<%$ resources: asterisk %>" Display="none"></asp:RequiredFieldValidator>
            <br/>

            <asp:TextBox ID="Password" runat="server" CssClass="inforTextbox"  placeholder="<%$ resources: Password %>" TextMode="Password" AutoComplete="off" ClientIDMode="static"></asp:TextBox>
            <br/>
            <div class="failureTextStyle">
                <asp:Literal ID="FailureText" runat="server" EnableViewState="False"></asp:Literal>
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
           
        </LayoutTemplate>
    </asp:Login>
</asp:Content>
                          
                            
<script type="text/C#" runat="server">
    private const string ddlLanguageRequestFormId = "ctl00$ContentPlaceHolderArea$slxLogin$ddlLanguageSelect";
    private const string ddlLanguageId = "ddlLanguageSelect";
    private const string languageCookieId = "SLXLanguageSetting";
    private const int daysToKeepCookies = 14;
    private const string rememberMeCookieId = "SLXRememberMe";
    private const string userNameCookieId = "SLXUserName";


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

        if (selectedLanguage != null)
        {
            UICulture = selectedLanguage;
            Culture = selectedLanguage;

            Thread.CurrentThread.CurrentCulture = CultureInfo.CreateSpecificCulture(selectedLanguage);
            Thread.CurrentThread.CurrentUICulture = new CultureInfo(selectedLanguage);
        }
        base.InitializeCulture();
    }
    protected void Page_Load(object sender, EventArgs e)
    {
        var rememberMe = (HtmlInputCheckBox) slxLogin.Controls[0].FindControl("chkRememberMe");
        var userName = (TextBox) slxLogin.Controls[0].FindControl("UserName");
        DropDownList languageSelect = (DropDownList)slxLogin.Controls[0].FindControl(ddlLanguageId);

        if (languageSelect.Items.Count == 0 && EnabledLanguageList.Languages != null)
        {
            foreach (EnabledLanguage language in EnabledLanguageList.Languages)
            {
                languageSelect.Items.Add(new ListItem(language.DisplayText, language.CultureCode));
            }
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

        SetVersion();
        userName.Focus();
    }


    protected new void PreRender(object sender, EventArgs e)
    {
        var FailureText = (Literal) slxLogin.FindControl("FailureText");
        object msg = Sage.Platform.Application.ApplicationContext.Current.State["AuthError"];
        if (msg != null)
        {
            Sage.Platform.Application.ApplicationContext.Current.State.Remove("AuthError");
            FailureText.Text = msg.ToString();
        }
        if (FailureText.Text.Length > 1)
        {
            FailureText.Text += "<br/><br/>";
        }
    }

    private void SetVersion()
    {
        Version version = typeof (SLXMembershipProvider).Assembly.GetName().Version;
        var lblVersion = (Label) slxLogin.FindControl("VersionLabel");
        lblVersion.Text = Server.HtmlEncode(String.Format("{0} {1}", GetLocalResourceObject("VersionLabelResource1.Text"), version));
    }

    /// <summary>
    ///     Handles the Click event of the GetPasswordHint control.
    /// </summary>
    /// <param name="sender">The source of the event.</param>
    /// <param name="e">The <see cref="System.EventArgs" /> instance containing the event data.</param>
    protected void GetPasswordHint_Click(object sender, EventArgs e)
    {
        var userName = (TextBox) slxLogin.Controls[0].FindControl("UserName");
        var HintText = (Literal) slxLogin.FindControl("FailureText");

        if (String.IsNullOrEmpty(userName.Text))
        {
            HintText.Text = Server.HtmlEncode(GetLocalResourceObject("PasswordHintUserNameRequired").ToString());
        }
        else
        {
            IList<IContact> contacts = null;
            using (ISession session = new SessionScopeWrapper())
            {
                contacts = session.QueryOver<IContact>()
                    .Where(x => x.WebUserName == userName.Text)
                    .List();
            }
            if ((contacts != null) && (contacts.Count > 0))
            {
                HintText.Text = string.Format("<span style=\"color:green;\">{0}</span>", Server.HtmlEncode(contacts[0].WebPasswordHint));
            }
        }
        HintText.Visible = true;
    }

</script>