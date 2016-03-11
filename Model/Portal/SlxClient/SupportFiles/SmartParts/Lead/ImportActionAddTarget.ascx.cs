using System;
using System.Web.UI;
using Sage.Platform.Application.UI.Web;
using Sage.Platform.WebPortal.Services;
using Sage.Platform.Application.UI;
using Sage.Platform.WebPortal.SmartParts;
using Sage.SalesLogix.Services.Import.Actions;
using Sage.SalesLogix.Services.Import;
using Sage.Entity.Interfaces;

public partial class ImportActionAddTarget :EntityBoundSmartPartInfoProvider 
{
    #region Public Methods
    /// <summary>
    /// Gets the type of the entity.
    /// </summary>
    /// <value>The type of the entity.</value>
    public override Type EntityType
    {
        get { return typeof(IImportHistory); }
    }

    /// <summary>
    /// Gets or sets the action.
    /// </summary>
    /// <value>The action.</value>
    public ActionAddTarget Action { get; set; }

    /// <summary>
    /// Gets the smart part info.
    /// </summary>
    /// <param name="smartPartInfoType">Type of the smart part info.</param>
    /// <returns></returns>
    public override ISmartPartInfo GetSmartPartInfo(Type smartPartInfoType)
    {
        ToolsSmartPartInfo tinfo = new ToolsSmartPartInfo();
        foreach (Control c in ImportActionAddTarget_LTools.Controls)
        {
            tinfo.LeftTools.Add(c);
        }
        foreach (Control c in ImportActionAddTarget_CTools.Controls)
        {
            tinfo.CenterTools.Add(c);
        }
        foreach (Control c in ImportActionAddTarget_RTools.Controls)
        {
            tinfo.RightTools.Add(c);
        }
        tinfo.Title = GetLocalResourceObject("Title").ToString();
        return tinfo;
    }

    #endregion

    /// <summary>
    /// Override this method to add bindings to the currently bound smart part
    /// </summary>
    protected override void OnAddEntityBindings()
    {
    }

    /// <summary>
    /// Handles the Load event of the Page control.
    /// </summary>
    /// <param name="sender">The source of the event.</param>
    /// <param name="e">The <see cref="System.EventArgs"/> instance containing the event data.</param>
    protected void Page_Load(object sender, EventArgs e)
    {
    }

    /// <summary>
    /// Called when the smartpart has been bound.  Derived components should override this method to run code that depends on entity context being set and it not changing.
    /// </summary>
    protected override void OnFormBound()
    {
        if (ClientBindingMgr != null)
        {
            // register these with the ClientBindingMgr so they can do their thing without causing the dirty data warning message...
            ClientBindingMgr.RegisterBoundControl(lueCampaigns);
            ClientBindingMgr.RegisterDialogCancelButton(btnCancel);
        }
        SetActionState();
        base.OnFormBound();
    }

    /// <summary>
    /// Called when [wire event handlers].
    /// </summary>
    protected override void OnWireEventHandlers()
    {
        btnSave.Click += btnSave_OnClick;
        btnSave.Click += DialogService.CloseEventHappened;
        btnCancel.Click += DialogService.CloseEventHappened;

        base.OnWireEventHandlers();
    }

    /// <summary>
    /// Handles the OnClick event of the btnSave control.
    /// </summary>
    /// <param name="sender">The source of the event.</param>
    /// <param name="e">The <see cref="System.EventArgs"/> instance containing the event data.</param>
    protected void btnSave_OnClick(object sender, EventArgs e)
    {
         SaveActionState();
         IPanelRefreshService refresher = PageWorkItem.Services.Get<IPanelRefreshService>();
         if (refresher != null)
         {
             refresher.RefreshAll();
         }
    }

    /// <summary>
    /// Sets the state of the action.
    /// </summary>
    private void SetActionState()
    {
        ImportManager importManager = GetImportManager();
        Action = importManager.ActionManager.GetAction("AddTarget") as ActionAddTarget;
        Action.HydrateChanges();
        if (lueCampaigns.LookupResultValue == null && Action.CampaignTarget.Campaign != null)
        {
            lueCampaigns.LookupResultValue = Action.CampaignTarget.Campaign;
        }
    }

    /// <summary>
    /// Saves the state of the action.
    /// </summary>
    private void SaveActionState()
    {
        ImportManager importManager = GetImportManager();
        Action = importManager.ActionManager.GetAction("AddTarget") as ActionAddTarget;
        Action.CampaignTarget.Campaign = (ICampaign)lueCampaigns.LookupResultValue;
        if (lueCampaigns.LookupResultValue != null)
        {
            if (!Action.Initialized)
            {
                Action.Initialized = true;
                Action.Active = true;
            }
        }
        else
        {
            Action.Initialized = false;
            Action.Active = false;
        }
        Action.SaveChanges();
        Page.Session["importManager"] = importManager;
    }

    /// <summary>
    /// Gets the import manager.
    /// </summary>
    /// <returns></returns>
    private ImportManager GetImportManager()
    {
        ImportManager importManager = Page.Session["importManager"] as ImportManager;
        if (importManager == null)
        {
            DialogService.ShowMessage("error_ImportManager_NotFound");
        }
        return importManager;
    }
}