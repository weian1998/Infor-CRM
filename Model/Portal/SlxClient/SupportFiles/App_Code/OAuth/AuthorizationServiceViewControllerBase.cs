using System;
using System.Web;
using System.Web.UI;
using Sage.Entity.Interfaces;
using Sage.Platform;
using Sage.Common.Syndication.Json;
using System.Security.Cryptography;
using System.Net;
using System.Collections.Specialized;
using Sage.Platform.WebPortal;

/// <summary>
/// Summary description for IAuthorizationServiceViewController
/// </summary>
public abstract class AuthorizationServiceViewControllerBase
{
    protected IOAuthProvider provider;

    protected AuthorizationServiceViewControllerBase(IOAuthProvider provider)
    {
        this.provider = provider;
    }

    /// <summary>
    /// Retrieve controller instance appropriate for the designated provider.
    /// </summary>
    /// <param name="providerId"></param>
    /// <returns></returns>
    public static AuthorizationServiceViewControllerBase GetAuthorizationServiceViewController(String providerId)
    {
        IOAuthProvider provider = EntityFactory.GetById<IOAuthProvider>(providerId);
        if (provider.OAuthVersion == "1.0")
        {
            return new OAuth1AuthorizationServiceViewController(provider);
        }
        // default to OAuth 2
        return new OAuth2AuthorizationServiceViewController(provider);
    }

    public static void HandleDialogOpening(String providerId, Page page)
    {
        var controller = GetAuthorizationServiceViewController(providerId);
        HttpContext ctx = HttpContext.Current;
        String callbackUrl = GetCallbackUrl(providerId, HttpContext.Current.Request.Url);
        String authUrl = controller.GetAuthorizationUrl(callbackUrl);
        if (controller.provider.SupportsCallback ?? false)
        {
            ctx.Response.Redirect(authUrl);
        }
        else
        {
            ScriptManager.RegisterStartupScript(page, typeof(Page), "showprovider",
                String.Format("window.open('{0}', '_blank', 'toolbar=0;location=0;menubar=0;width=200px;height=200px;');", PortalUtil.JavaScriptEncode(authUrl, true)),
                true);
        }
    }

    public static void HandleCallback()
    {
        HttpContext ctx = HttpContext.Current;
        String providerId = ctx.Request.QueryString["providerId"];
        if (providerId == null)
            throw new Exception("ProviderId not specified");
        var controller = GetAuthorizationServiceViewController(providerId);
        controller.HandleCallbackRequest(ctx.Request.QueryString, GetCallbackUrl(providerId, ctx.Request.Url));
    }

    private static String GetCallbackUrl(String providerId, Uri requestUri)
    {
        return String.Format("{0}{1}/UserOptions.aspx?oauthCallback=true&providerId={2}", requestUri.GetLeftPart(UriPartial.Authority), HttpRuntime.AppDomainAppVirtualPath, providerId);
    }

    /// <summary>
    /// Handle OK (for OOB requests)
    /// </summary>
    /// <param name="authorizationToken"></param>
    /// <param name="userName"></param>
    /// <param name="providerId"></param>
    public static void HandleOkClick(string authorizationToken, string userName, string providerId)
    {
        var controller = GetAuthorizationServiceViewController(providerId);
        controller.HandleOobRequest(userName, authorizationToken);
    }

    /// <summary>
    /// Retrieve the authorization URL.
    /// For OAuth1 this includes a request token and signature.
    /// </summary>
    protected abstract string GetAuthorizationUrl(String callbackUrl);

    /// <summary>
    /// Handle an OAuth callback
    /// </summary>
    /// <param name="request"></param>
    /// <param name="callbackUrl">Redirect Uri (the same that was passed to the original GetAuthorizationUrl call).  Some providers use that value to verify the request is valid.</param>
    protected abstract void HandleCallbackRequest(NameValueCollection request, String callbackUrl);

    /// <summary>
    /// Handle the OOB OAuth flow (here the user will provide their username and the value of the token verifier they copied from the site)
    /// </summary>
    /// <param name="username"></param>
    /// <param name="verifier"></param>
    protected abstract void HandleOobRequest(String username, String verifier);

    /// <summary>
    /// Persists the access token to the database.
    /// </summary>
    /// <param name="userName">Optional - user name associated with the login (typically this is not needed since we already have the access token)</param>
    /// <param name="accessToken">Access token - if the provider requires a refresh token, then this will be assumed to be the refresh token instead</param>
    /// <param name="accessTokenSecret">Access token secret in case one is needed</param>
    /// <param name="expirationDate">Optional, expiration date for the token</param>
    protected void SaveAccessToken(String userName, String accessToken, String accessTokenSecret, DateTime? expirationDate = null)
    {
        IUser user = Sage.SalesLogix.BusinessRules.BusinessRuleHelper.GetCurrentUser();

        IUserOAuthToken userToken = null;

        var repos = EntityFactory.GetRepository<IUserOAuthToken>();
        var query = (Sage.Platform.Repository.IQueryable)repos;
        var crit = query.CreateCriteria();
        var ef = query.GetExpressionFactory();
        crit.Add(ef.Eq("User.Id", user.Id.ToString().Trim()));
        crit.Add(ef.Eq("OAuthProvider.Id", provider.Id.ToString()));
        var result = crit.List<IUserOAuthToken>();
        if (result.Count > 0)
        {
            userToken = result[0];
        }
        else
        {
            userToken = EntityFactory.Create<IUserOAuthToken>();
            userToken.OAuthProvider = provider;
            userToken.User = user;
        }

        if (userName != null)
            userToken.AccountLoginName = userName;
        if (expirationDate != null)
            userToken.ExpirationDate = expirationDate;


        if (provider.RequiresRefreshToken.HasValue && provider.RequiresRefreshToken.Value)
        {
            userToken.RefreshToken = accessToken;
        }
        else
        {
            userToken.AccessToken = accessToken;
            userToken.AccessTokenSecret = accessTokenSecret;
        }
        userToken.Save();
    }

    public static string GetProviderUserName(String providerId)
    {
        IUser user = Sage.SalesLogix.BusinessRules.BusinessRuleHelper.GetCurrentUser();
        var result = EntityFactory.GetRepository<IUserOAuthToken>().FindByProperty("User.Id", user.Id.ToString().Trim());
        if (result.Count > 0)
        {
            foreach (IUserOAuthToken token in result)
            {
                if (string.Compare((string)token.OAuthProvider.Id, providerId, true) == 0)
                {
                    return token.AccountLoginName;
                }
            }
        }
        return string.Empty;
    }
}