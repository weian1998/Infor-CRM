using System;
using System.Web.UI;
using System.Web.UI.WebControls;
using Sage.Entity.Interfaces;
using Sage.Platform.Application;
using Sage.Platform.Application.UI;
using Sage.Platform.Orm.Interfaces;
using Sage.Platform.WebPortal.SmartParts;
using Sage.SalesLogix.Services.Integration;
using Sage.SalesLogix.Services.PotentialMatch;
using SmartPartInfoProvider = Sage.Platform.WebPortal.SmartParts.SmartPartInfoProvider;

public partial class MergeAddress : SmartPartInfoProvider
{
    private IntegrationManager _integrationManager;
    private Boolean _loadResults = true;
    private MergeAddressStateInfo _mergeAddressStateInfo;
    private MergeArguments _sessionMergeArguments;

    protected void Page_Load(object sender, EventArgs e)
    {
    }

    /// <summary>
    /// Gets or sets the session merge provider.
    /// </summary>
    /// <value>The session merge provider.</value>
    public MergeArguments SessionMergeArguments
    {
        get
        {
            if (_sessionMergeArguments == null)
            {
                if (DialogService.DialogParameters.ContainsKey("mergeArguments"))
                {
                    var mergeArguments = DialogService.DialogParameters["mergeArguments"] as MergeArguments;
                    if (mergeArguments.MergeProvider == null)
                    {
                        MergeArguments.GetMergeProvider(mergeArguments);
                    }
                    _sessionMergeArguments = mergeArguments;
                }
            }
            return _sessionMergeArguments;
        }
        set { _sessionMergeArguments = value; }
    }

    /// <summary>
    /// Gets the integration manager.
    /// </summary>
    /// <value>The integration manager.</value>
    public IntegrationManager IntegrationManager
    {
        get
        {
            if (_integrationManager == null)
            {
                if (DialogService.DialogParameters.ContainsKey("IntegrationManager"))
                {
                    _integrationManager = (DialogService.DialogParameters["IntegrationManager"]) as IntegrationManager;
                }
            }
            return _integrationManager;
        }
    }

    /// <summary>
    /// Gets or sets the entity service.
    /// </summary>
    /// <value>The entity service.</value>
    [ServiceDependency(Type = typeof(IEntityContextService), Required = true)]
    public IEntityContextService EntityService { get; set; }

    [ServiceDependency(Type = typeof(IContextService), Required = true)]
    public IContextService ContextService { get; set; }

    public class MergeAddressStateInfo
    {
        public String SelectedSourceId = String.Empty;
        public String SelectedTargetId = String.Empty;
        public int? SelectedRowSourceIndex;
        public int? SelectedRowTargetIndex;
    }

    /// <summary>
    /// Derived components should override this method to wire up event handlers for buttons and other controls in the form.
    /// </summary>
    protected override void OnWireEventHandlers()
    {
        base.OnWireEventHandlers();
        btnNext.Click += btnNext_OnClick;
        btnBack.Click += btnBack_OnClick;
        btnCancel.Click += DialogService.CloseEventHappened;
    }

    /// <summary>
    /// Raises the <see cref="E:Load"/> event.
    /// </summary>
    /// <param name="e">The <see cref="System.EventArgs"/> instance containing the event data.</param>
    protected override void OnLoad(EventArgs e)
    {
        base.OnLoad(e);
        _mergeAddressStateInfo = ContextService.GetContext("MergeAddressStateInfo") as MergeAddressStateInfo ??
                                 new MergeAddressStateInfo();
        if (DialogService.DialogParameters.ContainsKey("mergeArguments"))
        {
            btnNext.Text = SessionMergeArguments.SourceEntityType == typeof (IContact)
                               ? GetLocalResourceObject("btnNext_Merge.Caption").ToString()
                               : GetLocalResourceObject("btnNext.Caption").ToString();
        }
    }

    /// <summary>
    /// Raises the <see cref="E:System.Web.UI.Control.PreRender"/> event.
    /// </summary>
    /// <param name="e">An <see cref="T:System.EventArgs"/> object that contains the event data.</param>
    protected override void OnPreRender(EventArgs e)
    {
        var targetName = string.Empty;
        var sourceName = String.Empty;
        if (_loadResults && DialogService.DialogParameters.ContainsKey("mergeArguments"))
        {
            grdSourceRecords.DataSource = SessionMergeArguments.MatchingRecordView.SourceAddresses;
            grdSourceRecords.DataBind();
            grdTargetRecords.DataSource = SessionMergeArguments.MatchingRecordView.TargetAddresses;
            grdTargetRecords.DataBind();
            grdLinkedRecords.DataSource = SessionMergeArguments.MatchingRecordView.MatchedAddresses;
            grdLinkedRecords.DataBind();
            targetName = SessionMergeArguments.MergeProvider.Target.EntityData.ToString();
            sourceName = SessionMergeArguments.MergeProvider.Source.EntityData.ToString();
        }
        else if (_loadResults)
        {
            targetName = IntegrationManager.SourceMapping.Name;
            sourceName = IntegrationManager.TargetMapping.Name;
        }

        lblSourceRecords.Text = String.Format(GetLocalResourceObject("UnlinkedRecords.Caption").ToString(),
                                              GetLocalResourceObject("lblSourceAddress.Caption"),
                                              sourceName);
        lblTargetRecords.Text = String.Format(GetLocalResourceObject("UnlinkedRecords.Caption").ToString(),
                                              GetLocalResourceObject("lblTargetAddress.Caption"),
                                              targetName);
    }

    /// <summary>
    /// Handles the Click event of the Link button.
    /// </summary>
    /// <param name="sender">The source of the event.</param>
    /// <param name="e">The <see cref="System.EventArgs"/> instance containing the event data.</param>
    protected void btnLink_Click(object sender, EventArgs e)
    {
        if (_mergeAddressStateInfo.SelectedRowTargetIndex == null || _mergeAddressStateInfo.SelectedRowSourceIndex == null)
        {
            throw new ValidationException(GetLocalResourceObject("Error_SourceTargetNotSelected").ToString());
        }
        SessionMergeArguments.MatchingRecordView.AddMatchingAddress(_mergeAddressStateInfo.SelectedSourceId, _mergeAddressStateInfo.SelectedTargetId);
        SessionMergeArguments.MatchingRecordView.SourceAddresses.RemoveAt((int) _mergeAddressStateInfo.SelectedRowSourceIndex);
        SessionMergeArguments.MatchingRecordView.TargetAddresses.RemoveAt((int) _mergeAddressStateInfo.SelectedRowTargetIndex);
        ContextService.RemoveContext("MergeAddressStateInfo");
    }

    protected void grdLinkedRecords_OnRowCommand(object sender, GridViewCommandEventArgs e)
    {
        int rowIndex = Convert.ToInt32(e.CommandArgument);
        string sourceId = grdLinkedRecords.DataKeys[rowIndex].Values[0].ToString();
        string targetId = grdLinkedRecords.DataKeys[rowIndex].Values[1].ToString();
        if (DialogService.DialogParameters.ContainsKey("mergeArguments"))
        {
            SessionMergeArguments.MatchingRecordView.RemoveMatchedAddress(sourceId, targetId);
        }
        else
        {
            IntegrationManager.MatchingInfoRemoveMatchedChildPair(sourceId, targetId);
            IntegrationManager.MatchedContacts.RemoveAt(rowIndex);
        }
    }

    protected void grdSourceRecords_OnRowCommand(object sender, GridViewCommandEventArgs e)
    {
        int rowIndex = Convert.ToInt32(e.CommandArgument);
        _mergeAddressStateInfo.SelectedRowSourceIndex = rowIndex;
        _mergeAddressStateInfo.SelectedSourceId = grdSourceRecords.DataKeys[rowIndex].Values[0].ToString();
        ContextService.SetContext("MergeAddressStateInfo", _mergeAddressStateInfo);
    }

    protected void grdTargetRecords_OnRowCommand(object sender, GridViewCommandEventArgs e)
    {
        int rowIndex = Convert.ToInt32(e.CommandArgument);
        var dataKey = grdTargetRecords.DataKeys[rowIndex];
        if (dataKey != null && dataKey.Values != null)
        {
            _mergeAddressStateInfo.SelectedTargetId = dataKey.Values[0].ToString();
        }
        _mergeAddressStateInfo.SelectedRowTargetIndex = rowIndex;
        ContextService.SetContext("MergeAddressStateInfo", _mergeAddressStateInfo);
    }

    /// <summary>
    /// Gets the name of the table.
    /// </summary>
    /// <returns></returns>
    private static String GetEntityName(Type entity)
    {
        return entity.Name.Substring(1, entity.Name.Length - 1);
    }

    /// <summary>
    /// Handles the OnClick event of the btnNext control.
    /// </summary>
    /// <param name="sender">The source of the event.</param>
    /// <param name="e">The <see cref="System.EventArgs"/> instance containing the event data.</param>
    protected void btnNext_OnClick(object sender, EventArgs e)
    {
        ContextService.RemoveContext("MergeAddressStateInfo");
        if (DialogService.DialogParameters.ContainsKey("mergeArguments") && SessionMergeArguments.TargetEntityType != typeof(IAccount))
        {
            SessionMergeArguments.MergeProvider.AssignMatchedChildren(SessionMergeArguments.MatchingRecordView);
            if (Sage.SalesLogix.BusinessRules.BusinessRuleHelper.MergeRecords(SessionMergeArguments))
            {
                using (new Sage.Platform.Orm.SessionScopeWrapper(true))
                {
                    Type type = SessionMergeArguments.MergeProvider.Target.EntityType;
                    string entityId = SessionMergeArguments.MergeProvider.Source.EntityId;
                    var source = Sage.Platform.EntityFactory.GetById(type, entityId) as IPersistentEntity;
                    source.Delete();
                    EntityService.RemoveEntityHistory(type, source);
                    Response.Redirect(String.Format("{0}.aspx", GetEntityName(type)));
                }
            }
        }
        else
        {
            ShowDialog("MergeChildren", GetLocalResourceObject("LinkToAccounting.Caption").ToString(), 600, 1200);
        }
    }

    /// <summary>
    /// Handles the OnClick event of the btnBack control.
    /// </summary>
    /// <param name="sender">The source of the event.</param>
    /// <param name="e">The <see cref="System.EventArgs"/> instance containing the event data.</param>
    protected void btnBack_OnClick(object sender, EventArgs e)
    {
        string caption = GetLocalResourceObject("MergeRecordsDialog_MergeRecords.Caption").ToString();
        if (!DialogService.DialogParameters.ContainsKey("mergeArguments"))
        {
            caption = IntegrationManager.DataViewMappings.Count > 0
                                 ? GetLocalResourceObject("MergeRecordsDialog_Differences.Caption").ToString()
                                 : GetLocalResourceObject("MergeRecordsDialog_NoDifferences.Caption").ToString();
        }
        ShowDialog("MergeRecords", caption, 650, 650);
    }

    /// <summary>
    /// Shows a particular dialog setting the caption height and width.
    /// </summary>
    /// <param name="dialog">The name of the dialog to be displayed.</param>
    /// <param name="caption">The caption of the dialog to be displayed.</param>
    /// <param name="height">The height of the dialog to be displayed.</param>
    /// <param name="width">The width of the dialog to be displayed.</param>
    private void ShowDialog(string dialog, string caption, int height, int width)
    {
        DialogService.SetSpecs(200, 200, height, width, dialog, caption, true);
        if (DialogService.DialogParameters.ContainsKey("IntegrationManager"))
        {
            DialogService.DialogParameters.Remove("IntegrationManager");
        }
        DialogService.DialogParameters.Add("IntegrationManager", IntegrationManager);
        DialogService.ShowDialog();
    }

    /// <summary>
    /// Called when the dialog is closing.
    /// </summary>
    protected override void OnClosing()
    {
        ContextService.RemoveContext("MergeAddressStateInfo");
        _loadResults = false;
    }

    /// <summary>
    /// Retrieves smart part information compatible with type smartPartInfoType.
    /// </summary>
    /// <param name="smartPartInfoType">Type of information to retrieve.</param>
    /// <returns>
    /// The <see cref="T:Sage.Platform.Application.UI.ISmartPartInfo"/> instance or null if none exists in the smart part.
    /// </returns>
    public override ISmartPartInfo GetSmartPartInfo(Type smartPartInfoType)
    {
        var tinfo = new ToolsSmartPartInfo();
        foreach (Control c in MergeAddress_RTools.Controls)
        {
            tinfo.RightTools.Add(c);
        }
        return tinfo;
    }
}