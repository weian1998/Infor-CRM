using System;
using System.Linq;
using System.Threading;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Globalization;
using Sage.Platform.Application.UI;
using Sage.SalesLogix.Web;
using Sage.Platform.WebPortal.SmartParts;

public partial class UserProfileOptionsPage : UserControl, ISmartPartInfoProvider
{
    private const string languageCookieId = "SLXLanguageSetting";

    protected void Page_Load(object sender, EventArgs e)
    {
        var langSelectCookie = Request.Cookies[languageCookieId];

        if (EnabledLanguageList.Languages != null)
        {
            if (ddlLanguageSelect.Items.Count == 0)
            {
                foreach (EnabledLanguage language in EnabledLanguageList.Languages)
                {
                    ddlLanguageSelect.Items.Add(new ListItem(language.DisplayText, language.CultureCode));
                }
            }

            if (langSelectCookie != null)
            {
                ddlLanguageSelect.SelectedIndex = ddlLanguageSelect.Items.IndexOf(ddlLanguageSelect.Items.FindByValue(langSelectCookie.Value));
            }
            else
            {
                var currentThreadCulture = Thread.CurrentThread.CurrentUICulture.Name;
                if (CultureCodeIsInLanguageList(currentThreadCulture))
                {
                    var culture = ddlLanguageSelect.Items.FindByValue(currentThreadCulture);
                    if (culture == null)
                    {
                        var browserLanguage = ddlLanguageSelect.Items.Cast<ListItem>().FirstOrDefault(x => x.Value.StartsWith(Thread.CurrentThread.CurrentUICulture.Name, StringComparison.InvariantCultureIgnoreCase));
                        if (browserLanguage != null)
                        {
                            ddlLanguageSelect.Items.FindByValue(browserLanguage.Value).Selected = true;
                        }
                        else
                        {
                            ddlLanguageSelect.Items.FindByValue("en-us").Selected = true;
                        }
                    }
                }
            }
        }
    } // end Page_Load

    /// <summary>
    /// Gets the smart part info.
    /// </summary>
    /// <param name="smartPartInfoType">Type of the smart part info.</param>
    /// <returns></returns>
    public ISmartPartInfo GetSmartPartInfo(Type smartPartInfoType)
    {
        ToolsSmartPartInfo tinfo = new ToolsSmartPartInfo();
        tinfo.Description = GetLocalResourceObject("PageDescription.Text").ToString();
        tinfo.Title = GetLocalResourceObject("PageDescription.Title").ToString();

        foreach (Control c in userProfile_RTools.Controls)
        {
            tinfo.RightTools.Add(c);
        }
        return tinfo;
    }

    protected void btnSave_Click(object sender, ImageClickEventArgs e)
    {
        var selectedLanguage = ddlLanguageSelect.SelectedValue;

        if (CultureCodeIsInLanguageList(selectedLanguage) && !String.Equals(selectedLanguage, Thread.CurrentThread.CurrentCulture.Name, StringComparison.InvariantCultureIgnoreCase))
        {
            var newThreadCulture = CultureInfo.CreateSpecificCulture(selectedLanguage);
            Thread.CurrentThread.CurrentCulture = newThreadCulture;
            Thread.CurrentThread.CurrentUICulture = newThreadCulture;

            var newCookie = new HttpCookie(languageCookieId) { Value = selectedLanguage };
            Response.Cookies.Add(newCookie);
            Request.Cookies.Remove(languageCookieId);

            Response.Redirect(Request.RawUrl);
        }
    }

    private bool CultureCodeIsInLanguageList(string cultureCode)
    {
        return EnabledLanguageList.Languages.Exists(x => x.CultureCode.StartsWith(cultureCode, StringComparison.InvariantCultureIgnoreCase));
    }

}