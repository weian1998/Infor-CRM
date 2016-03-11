using System;
using System.Linq;
using System.Web.UI;
using Sage.Entity.Interfaces;
using Sage.Platform;
using Sage.Platform.Application;
using Sage.Platform.Application.UI;
using Sage.Platform.SData;
using Sage.Platform.WebPortal.Services;
using Sage.Platform.WebPortal.SmartParts;
using Sage.SalesLogix.BusinessRules;
using Sage.Platform.WebPortal;
using Sage.Platform.Security;

/// <summary>
/// Summary description for ContactTasksTasklet
/// </summary>
public partial class ContactTasksTasklet : UserControl, ISmartPartInfoProvider
{

    [ServiceDependency]
    public IRoleSecurityService RoleSecurityService { get; set; }

    /// <summary>
    /// Gets or sets an instance of the Refresh Service.
    /// </summary>
    /// <value>The refresh service.</value>
    [ServiceDependency]
    public IPanelRefreshService RefreshService { set; get; }

    protected void Page_Load(object sender, EventArgs e)
    {
    }

    /// <summary>
    /// Gets the smart part info.
    /// </summary>
    /// <param name="smartPartInfoType">Type of the smart part info.</param>
    /// <returns></returns>
    public ISmartPartInfo GetSmartPartInfo(Type smartPartInfoType)
    {
        ToolsSmartPartInfo tinfo = new ToolsSmartPartInfo();
        return tinfo;
    }
}