using System;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Web.UI;
using Sage.Entity.Interfaces;
using Sage.Platform;
using Sage.Platform.Application;
using Sage.Platform.Application.UI;
using Sage.Platform.Orm.Interfaces;
using Sage.Platform.WebPortal.SmartParts;

public partial class SyncResultsHistory : SmartPart
{
    [ServiceDependency]
    public IEntityContextService EntityContext { get; set; }

    protected void Page_Load(object sender, EventArgs e)
    {
        DoActivating();
    }

    private void DoActivating()
    {
        object globalSyncId = String.Empty;
        PropertyDescriptorCollection pds = TypeDescriptor.GetProperties(EntityContext.EntityType);
        foreach (PropertyDescriptor pd in pds.Cast<PropertyDescriptor>().Where(pd => pd.Name == "GlobalSyncId"))
        {
            globalSyncId = pd.GetValue(EntityContext.GetEntity());
            break;
        }
        if (globalSyncId == null)
        {
            globalSyncId = Guid.NewGuid();
        }

        var script = new StringBuilder();
        script.AppendLine(
            @"require([
                'dojo/ready',
                'Sage/MainView/IntegrationContract/SyncResultsHistory'
            ], function (ready, SyncResultsHistory) {");

        var baseScript = string.Format(
            "window.setTimeout(function() {{ window.syncResultsHistory = new SyncResultsHistory({{ 'workspace': '{0}', 'tabId': '{1}', 'placeHolder': '{2}', 'globalSyncId': '{3}' }}); syncResultsHistory.loadSyncResults(); }}, 1);",
            getMyWorkspace(),
            ID,
            sdgrdSyncHistory_Grid.ClientID,
            globalSyncId);

        if (!Page.IsPostBack)
        {
            script.AppendFormat("ready(function() {{ {0}; }} );", baseScript);
        }
        else
        {
            script.AppendLine(baseScript);
        }
        script.AppendLine("});"); // end require
        ScriptManager.RegisterStartupScript(this, GetType(), "SyncResultsHistory", script.ToString(), true);
    }

    /// <summary>
    /// Gets the smart part info.
    /// </summary>
    /// <param name="smartPartInfoType">Type of the smart part info.</param>
    /// <returns></returns>
    public ISmartPartInfo GetSmartPartInfo(Type smartPartInfoType)
    {
        ToolsSmartPartInfo tinfo = new ToolsSmartPartInfo();
        //if (BindingSource != null && BindingSource.Current != null)
        //{
        //    tinfo.Description = BindingSource.Current.ToString();
        //    tinfo.Title = BindingSource.Current.ToString();
        //}

        foreach (Control c in Controls)
        {
            SmartPartToolsContainer cont = c as SmartPartToolsContainer;
            if (cont != null)
            {
                switch (cont.ToolbarLocation)
                {
                    case SmartPartToolsLocation.Right:
                        foreach (Control tool in cont.Controls)
                        {
                            tinfo.RightTools.Add(tool);
                        }
                        break;
                    case SmartPartToolsLocation.Center:
                        foreach (Control tool in cont.Controls)
                        {
                            tinfo.CenterTools.Add(tool);
                        }
                        break;
                    case SmartPartToolsLocation.Left:
                        foreach (Control tool in cont.Controls)
                        {
                            tinfo.LeftTools.Add(tool);
                        }
                        break;
                }
            }
        }
        return tinfo;
    }
}