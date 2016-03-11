using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Text;
using System.Web.UI;
using Sage.Entity.Interfaces;
using Sage.Platform;
using Sage.Common.Syndication.Json;
using System.Security.Cryptography;
using System.Net;
using System.Text.RegularExpressions;
using Sage.Platform.Application;
using System.Collections.Specialized;

/// <summary>
/// Summary description for OAuth1AuthorizationServiceViewController
/// </summary>
public class OAuth1AuthorizationServiceViewController : AuthorizationServiceViewControllerBase
{
    private const String OAUTH1_REQUEST_TOKEN_SESSIONKEY = "OAuth1RequestToken";
    private const String OAUTH1_REQUEST_TOKEN_SECRET_SESSIONKEY = "OAuth1RequestTokenSecret";

    public OAuth1AuthorizationServiceViewController(IOAuthProvider provider)
        : base(provider)
    {
    }

    /// <summary>
    /// Retrieve the URL that the client should redirect the user to to perform the OAuth authorization
    /// </summary>
    /// <param name="provider"></param>
    /// <returns></returns>
    protected override string  GetAuthorizationUrl(String callbackUrl)
    {        
        OAuthBase auth = new OAuthBase();
        String requestUrl = provider.Host + provider.RequestTokenUrl;
        Uri url = new Uri(requestUrl);
        String requestParams = "";
        String signature = auth.GenerateSignature(url, provider.ClientId, provider.Secret, null, null, provider.RequestTokenMethod ?? "POST",
            auth.GenerateTimeStamp(), auth.GenerateTimeStamp() + auth.GenerateNonce(), out requestUrl, out requestParams, 
            new OAuthBase.QueryParameter(OAuthBase.OAuthCallbackKey, auth.UrlEncode(callbackUrl)));
        requestParams += "&oauth_signature=" + HttpUtility.UrlEncode(signature);
        WebClient webClient = new WebClient();
        byte[] response;
        if (provider.RequestTokenMethod == "POST" || provider.RequestTokenMethod == null)
        {
            response = webClient.UploadData(url, Encoding.ASCII.GetBytes(requestParams));
        }
        else
        {
            response = webClient.DownloadData(url + "?" + requestParams);
        }
        Match m = Regex.Match(Encoding.ASCII.GetString(response), "oauth_token=(.*?)&oauth_token_secret=(.*?)&oauth_callback_confirmed=true");
        String requestToken = m.Groups[1].Value;
        String requestTokenSecret = m.Groups[2].Value;
        // we need a way to save the request token & secret, so that we can use it to get the access token later (when they enter the pin)
        // just stick it in the session for now
        HttpContext.Current.Session[OAUTH1_REQUEST_TOKEN_SESSIONKEY] = requestToken;
        HttpContext.Current.Session[OAUTH1_REQUEST_TOKEN_SECRET_SESSIONKEY] = requestTokenSecret;

        return provider.Host + provider.UserApprovalUrl + "?oauth_token=" + HttpUtility.UrlEncode(requestToken);
    }

    /// <summary>
    /// Callback flow (this is preferred for OAuth1 but may not be possible depending on what the server will allow)
    /// </summary>
    /// <param name="request"></param>
    protected override void HandleCallbackRequest(NameValueCollection request, String callbackUrl)
    {
        String token = request["oauth_token"];
        String verifier = request["oauth_verifier"];

        if (token != (String)HttpContext.Current.Session[OAUTH1_REQUEST_TOKEN_SESSIONKEY])
        {
            throw new Exception("Provided token does not match the one that was generated earlier");
        }
        String accessToken, accessTokenSecret, username;
        GetAccessToken(token, (String)HttpContext.Current.Session[OAUTH1_REQUEST_TOKEN_SECRET_SESSIONKEY], verifier, out accessToken, out accessTokenSecret, out username);
        // note there is no refresh token concept in OAuth 1, we just save the token and token secret.
        // some providers will expire the access token, not sure how to handle that.  Twitter does not expire it
        SaveAccessToken(username, accessToken, accessTokenSecret);
    }

    /// <summary>
    /// OOB (pin-based OAuth) flow - this is more straightforward but will require the user to copy/paste
    /// </summary>
    /// <param name="username"></param>
    /// <param name="verifier"></param>
    protected override void HandleOobRequest(string username, string verifier)
    {
        String accessToken, accessTokenSecret, usernameFromServer;
        GetAccessToken((String)HttpContext.Current.Session[OAUTH1_REQUEST_TOKEN_SESSIONKEY], (String)HttpContext.Current.Session[OAUTH1_REQUEST_TOKEN_SECRET_SESSIONKEY],
            verifier, out accessToken, out accessTokenSecret, out usernameFromServer);
        if (!String.IsNullOrEmpty(usernameFromServer))
            username = usernameFromServer;
        // note there is no refresh token concept in OAuth 1, we just save the token and token secret.
        // some providers will expire the access token, not sure how to handle that.  Twitter does not expire it
        SaveAccessToken(username, accessToken, accessTokenSecret);
    }

    private void GetAccessToken(string requestToken, string requestTokenSecret, string verifier, out string accessToken, out string accessTokenSecret, out string username)
    {
        Uri url = new Uri(provider.Host + provider.AccessTokenUrl);
        OAuthBase auth = new OAuthBase();
        String requestUrl, requestParams;
        String signature = auth.GenerateSignature(url, provider.ClientId, provider.Secret, requestToken, requestTokenSecret, provider.RequestTokenMethod ?? "POST",
            auth.GenerateTimeStamp(), auth.GenerateTimeStamp() + auth.GenerateNonce(), out requestUrl, out requestParams,
            new OAuthBase.QueryParameter("oauth_verifier", auth.UrlEncode(verifier)));
        WebClient webClient = new WebClient();
        byte[] response = webClient.UploadData(url, Encoding.ASCII.GetBytes(requestParams + "&oauth_signature=" + HttpUtility.UrlEncode(signature)));
        String[] tokenParts = Encoding.ASCII.GetString(response).Split('&');
        if (tokenParts.Length < 2)
        {
            throw new Exception("Unexpected response to access token request: " + Encoding.ASCII.GetString(response));
        }
        accessToken = null;
        accessTokenSecret = null;
        username = null;
        foreach (String tokenPart in tokenParts)
        {
            String[] pieces = tokenPart.Split('=');
            if (pieces.Length != 2)
            {
                throw new Exception("Unable to parse HTTP response: " + tokenPart); // should not happen
            }
            switch (pieces[0])
            {
                case OAuthBase.OAuthTokenKey:
                    accessToken = pieces[1];
                    break;
                case OAuthBase.OAuthTokenSecretKey:
                    accessTokenSecret = pieces[1];
                    break;
                case "screen_name": case "user_name":
                    // Twitter provides the user name back with this call, though it's not part of the standard.
                    // we'll capture it if it's provided and leave it null if not (it's not really required for anything anyway)
                    username = pieces[1];
                    break;
                default:
                    // ignore other values
                    break;                    
            }
        }
    }
}