<%@ WebHandler Language="C#" Class="FeedProxy" %>

using System;
using System.Web;
using System.Xml;
using System.Linq;
using System.Net;
using System.ServiceModel.Syndication;
using System.Text.RegularExpressions;

/// <summary>
/// Used to query the RSS / Atom data from dashboard widgets.
/// </summary>
public class FeedProxy : IHttpHandler
{
    // most sites will only display 10 items anyway, but just in case we will limit it to avoid overloading the widget
    const int ENTRIES_TO_DISPLAY = 10;
    
    public void ProcessRequest(HttpContext context)
    {
        String feedUrl = context.Request["FeedUrl"];
        String feedUsername = context.Request["FeedUsername"];
        String feedPassword = context.Request["FeedPassword"];

        context.Response.ContentType = "application/json";
        try
        {
            if (!Regex.IsMatch(feedUrl, "^https?://.+"))
                throw new Exception("The feed address is not valid.");
            XmlReaderSettings settings = new XmlReaderSettings();
            if (feedUsername != null && feedPassword != null)
            {
                settings.XmlResolver = new XmlUrlResolver { Credentials = new NetworkCredential(feedUsername, feedPassword) };
            }
            XmlReader reader = XmlReader.Create(feedUrl, settings);
            SyndicationFeed feed = SyndicationFeed.Load(reader);

            var feedData = new
            {
                FeedData = feed.Items.Take(ENTRIES_TO_DISPLAY).Select(x => new
                    {
                        Title = x.Title.Text,
                        Summary = x.Summary != null ? x.Summary.Text : "",
                        Url = x.Links.Count > 0 ? x.Links[0].Uri.ToString() : ""
                    })
            };
            context.Response.Write(Sage.Common.Syndication.Json.JsonConvert.SerializeObject(feedData));
        }
        catch (WebException webException)
        {
            var exceptionType = string.Empty;

            switch (webException.Status)
            {
                case WebExceptionStatus.NameResolutionFailure:
                    exceptionType = "generic";
                    break;
                default:
                    exceptionType = "authFail";
                    break;
            }
            context.Response.Write(Sage.Common.Syndication.Json.JsonConvert.SerializeObject(new { Error = exceptionType }));
        }
        catch (Exception)
        {
            context.Response.Write(Sage.Common.Syndication.Json.JsonConvert.SerializeObject(new { Error = "generic" }));
        }
    }

    public bool IsReusable
    {
        get
        {
            return false;
        }
    }

}