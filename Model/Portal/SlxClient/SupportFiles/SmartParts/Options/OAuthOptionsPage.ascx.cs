using System.Web.UI.WebControls;
using Sage.Platform.Application;
using Sage.Platform.Application.UI;
using System;
using System.Collections.Generic;
using System.Web.UI;
using Sage.Platform;
using Sage.Entity.Interfaces;
using Sage.Platform.WebPortal.Services;
using Sage.Platform.Security;
using Sage.SalesLogix.Security;

public partial class SmartParts_Options_OAuthOptionsPage : UserControl, ISmartPartInfoProvider
{
    [ServiceDependency]
    public IRoleSecurityService RoleSecurityService { get; set; }

    protected override void OnPreRender(EventArgs e)
    {
        // let the code process a callback URL, if we are being redirected from the OAuth provider
        if (Request.QueryString["oauthCallback"] == "true" && !IsPostBack)
        {
            AuthorizationServiceViewControllerBase.HandleCallback();
        }

        var items = new List<ProviderHelperItem>();
        var userService = ApplicationContext.Current.Services.Get<IUserService>();
        IList<IOAuthProvider> providerList = EntityFactory.GetRepository<IOAuthProvider>().FindAll();
        IList<IUserOAuthToken> tokenList = EntityFactory.GetRepository<IUserOAuthToken>()
                                                        .FindByProperty("User.Id", userService.UserId.Trim());

        foreach (IOAuthProvider provider in providerList)
        {
            if ((provider.Integration.Enabled ?? false) &&
                (!String.IsNullOrEmpty(provider.ClientId) && !String.IsNullOrEmpty(provider.Secret) &&
                 UserHasAccess(provider.ProviderKey)))
            {
                var item = new ProviderHelperItem(provider);
                foreach (IUserOAuthToken token in tokenList)
                {
                    if (token.OAuthProvider.Id == provider.Id)
                    {
                        item.AccountName = token.AccountLoginName;
                        item.IsAuthorized = true;
                    }
                }
                items.Add(item);
            }
        }
        lblNoProviders.Visible = items.Count == 0;
        providerListView.DataSource = items;
        providerListView.DataBind();
    }

    protected bool UserHasAccess(string provider)
    {
        switch (provider)
        {
            case "GoogleApps":
                return RoleSecurityService.HasAccess("Integration/Authorize/GoogleApps");
            case "GoogleDocs":
                return RoleSecurityService.HasAccess("Integration/Authorize/GoogleDocs");
            case "GoogleMail":
                return RoleSecurityService.HasAccess("Integration/Authorize/GoogleMail");
            default:
                return true;
        }
    }

    public string CreateConfirmation(string userName)
    {
        return String.Format("javascript: return confirm('{0}');", String.Format(GetLocalResourceObject("confirm_Delete").ToString(), userName));
    }

    /// <summary>
    /// Gets the smart part info.
    /// </summary>
    /// <param name="smartPartInfoType">Type of the smart part info.</param>
    /// <returns></returns>
    public ISmartPartInfo GetSmartPartInfo(Type smartPartInfoType)
    {
        var tinfo = new Sage.Platform.WebPortal.SmartParts.ToolsSmartPartInfo
        {
            Description = GetLocalResourceObject("dialog_Description").ToString(),
            Title = GetLocalResourceObject("dialog_Title").ToString()
        };
        foreach (Control c in OAuthOptions_RTools.Controls)
        {
            tinfo.RightTools.Add(c);
        }
        return tinfo;
    }

    private class ProviderHelperItem
    {
        IOAuthProvider _provider;

        public ProviderHelperItem(IOAuthProvider provider)
        {
            _provider = provider;
        }

        public string AccountName { get; set; }

        public string ProviderName
        {
            get
            {
                return _provider.ProviderName;
            }
        }

        public string ProviderKey
        {
            get
            {
                return _provider.ProviderKey;
            }
        }

        public string ProviderId
        {
            get
            {
                return (string)_provider.Id;
            }
        }

        public bool IsAuthorized { get; set; }
    }

    protected void btnAuthorize_Click(object sender, EventArgs e)
    {
        var button = sender as Button;
        string providerId = button.CommandArgument;
        if (!string.IsNullOrEmpty(providerId))
        {
            var dialogService = ApplicationContext.Current.Services.Get<IWebDialogService>();
            if (dialogService != null)
            {
                dialogService.EntityType = typeof(IUserOAuthToken);
                dialogService.SetSpecs(200, 600, "AuthorizeService", GetLocalResourceObject("authorizeServiceDialog_Title").ToString());
                dialogService.DialogParameters = new Dictionary<string, object>() { { "ProviderId", providerId } };
                dialogService.ShowDialog();
            }
        }
    }

    protected string GetAuthorizationStatus(object isAuthorized)
    {
        return (bool)isAuthorized ? GetLocalResourceObject("Authorized.Caption").ToString() : GetLocalResourceObject("Authorize.Caption").ToString();
    }

    protected string GetProviderImage(object provider)
    {
        switch (provider.ToString())
        {
            case "GoogleDocs":
                return "~/Images/Providers/google-docs.png";
            case "GoogleApps":
                return "~/Images/Providers/google-calendar.png";
            case "GoogleMail":
                return "~/Images/Providers/google-mail.png";
            case "Linked In":
                return "~/Images/Providers/LinkedIn_Logo60px.png";
            case "Twitter":
                return "~/Images/Providers/twitter48.png";
            default:
                return String.Empty;
        }
    }
}