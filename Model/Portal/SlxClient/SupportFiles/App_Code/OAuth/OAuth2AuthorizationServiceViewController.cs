using System;
using System.Linq;
using System.Web;
using System.Text;
using Sage.Entity.Interfaces;
using Sage.Common.Syndication.Json;
using System.Net;
using System.Collections.Specialized;
using Sage.Platform.Application;
using System.IO;
using log4net;

/// <summary>
/// Summary description for OAuth2AuthorizationServiceViewController
/// </summary>
public class OAuth2AuthorizationServiceViewController : AuthorizationServiceViewControllerBase
{
    private const String Oauth2RequestStateSessionkey = "OAuth2RequestState";
    private readonly ILog _log = LogManager.GetLogger(typeof(OAuth2AuthorizationServiceViewController));

    public OAuth2AuthorizationServiceViewController(IOAuthProvider provider)
        : base(provider)
    {
    }

    protected override string GetAuthorizationUrl(string callbackUrl)
    {
        string baseUrl = provider.Host + provider.UserApprovalUrl;
        string UrlData = provider.UserApprovalData;
        string scopes = string.Empty;

        if (provider.OAuthProviderScopes.Count > 0)
        {
            scopes = string.Join(" ", provider.OAuthProviderScopes.Select(item => item.Scope).ToArray());
            scopes = HttpUtility.UrlEncode(scopes);
        }

        UrlData = UrlData.Replace("{SCOPES}", scopes);
        UrlData = UrlData.Replace("{CLIENTID}", provider.ClientId);
        UrlData = UrlData.Replace("{REDIRECT_URI}", HttpUtility.UrlEncode(callbackUrl));
        if (UrlData.Contains("{STATE}"))
        {
            String state = Guid.NewGuid().ToString();
            HttpContext.Current.Session[Oauth2RequestStateSessionkey] = state;
            UrlData = UrlData.Replace("{STATE}", state);
        }
        baseUrl += UrlData;
        return baseUrl;
    }

    protected override void HandleCallbackRequest(NameValueCollection request, String callbackUrl)
    {
        // the code below was never tested
        if (request["error"] != null)
        {
            throw new Exception("OAuth provider returned an error: " + request["error"]);
        }
        String state = request["state"];
        if (state != null && state != (String)HttpContext.Current.Session[Oauth2RequestStateSessionkey])
        {
            throw new Exception("Invalid OAuth State - did not match the one passed to provider");
        }
        String accessToken = request["code"];
        // usually either RequiresAccessToken, or RequiresRefreshToken, will be set.
        if (provider.RequiresRefreshToken.GetValueOrDefault())
        {
            string refreshToken = GetAccessToken(accessToken, provider.Host + provider.RefreshTokenUrl, provider.RefreshTokenData, callbackUrl).refresh_token;
            SaveAccessToken(null, refreshToken, null);
        }
        else if (provider.RequiresAccessToken.GetValueOrDefault())
        {
            TokenResponse token = GetAccessToken(accessToken, provider.Host + provider.AccessTokenUrl, provider.AccessTokenData, callbackUrl);
            accessToken = token.access_token;
            SaveAccessToken(null, accessToken, null, (token.expires_in == 0) ? (DateTime?)null : DateTime.UtcNow.AddSeconds(token.expires_in));
        }
        else
        {
            throw new ValidationException("Either Refresh Token or Access Token url must be provided");
        }
    }

    protected override void HandleOobRequest(string userName, string authorizationToken)
    {
        if (!string.IsNullOrEmpty(authorizationToken))
        {
            if (provider.RequiresRefreshToken.HasValue && provider.RequiresRefreshToken.Value)
            {
                string refreshToken = GetAccessToken(authorizationToken, provider.Host + provider.RefreshTokenUrl, provider.RefreshTokenData, null).refresh_token;
                authorizationToken = refreshToken;
            }
            SaveAccessToken(userName, authorizationToken, null);
        }
        else
        {
            throw new ValidationException("Authorization Token was not provided");
        }
    }

    /// <summary>
    /// Retrieve access or refresh token
    /// </summary>
    /// <param name="accessCode"></param>
    /// <param name="url"></param>
    /// <param name="urlData"></param>
    /// <param name="callbackUrl">Original callback URL (used for verification by some provider)</param>
    /// <returns></returns>
    private TokenResponse GetAccessToken(string accessCode, String url, String urlData, String callbackUrl)
    {
        urlData = urlData.Replace("{REDIRECT_URI}", HttpUtility.UrlEncode(callbackUrl));
        urlData = urlData.Replace("{TOKEN}", HttpUtility.UrlEncode(accessCode));
        urlData = urlData.Replace("{CLIENTID}", provider.ClientId);
        urlData = urlData.Replace("{CLIENTSECRET}", provider.Secret);
        // I don't think we need that one - if the provider requires refresh token, we'll be using the refresh URL instead
        //if (provider.RequiresRefreshToken.GetValueOrDefault())
        //    urlData += "&access_type=offline";
        try
        {
            var client = new WebClient();
            client.Headers.Add("Content-Type", "application/x-www-form-urlencoded");
            // TODO: support for "GET" method
            byte[] response = client.UploadData(url, Encoding.ASCII.GetBytes(urlData));
            TokenResponse tResponse = JsonConvert.DeserializeObject<TokenResponse>(Encoding.ASCII.GetString(response));

            if (tResponse.error != null)
                throw new Exception(tResponse.error);
            return tResponse;
        }
        catch (Exception ex)
        {
            if (ex is WebException)
            {
                using (var sr = new StreamReader(((WebException)ex).Response.GetResponseStream()))
                {
                    String responseString = sr.ReadToEnd();
                    if (!String.IsNullOrEmpty(responseString))
                    {
                        _log.Warn("Error Response from OAuth provider: " + responseString);
                    }
                }
            }
            throw new ValidationException(String.Format("Unable to retrieve authorization token: {0}", ex.Message));
        }
    }


    /// <summary>
    /// Retrieve refresh token.
    /// </summary>
    /// <param name="token"></param>
    /// <returns></returns>
    protected string GetRefreshToken(string token)
    {
        return GetAccessToken(token, provider.RefreshTokenUrl, provider.RefreshTokenData, null).refresh_token;
    }

    private class TokenResponse
    {
        public string error { get; set; }
        public string refresh_token { get; set; }
        public string access_token { get; set; }
        public long expires_in { get; set; }
    }
}