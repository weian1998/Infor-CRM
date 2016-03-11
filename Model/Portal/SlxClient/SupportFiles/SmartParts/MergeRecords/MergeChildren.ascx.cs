using System;
using System.Collections.Generic;
using System.Web.UI;
using System.Web.UI.WebControls;
using Sage.Entity.Interfaces;
using Sage.Platform.Application;
using Sage.Platform.Application.UI;
using Sage.Platform.ComponentModel;
using Sage.Platform.Orm.Interfaces;
using Sage.Platform.WebPortal.SmartParts;
using Sage.SalesLogix.Services.Integration;
using Sage.SalesLogix.Services.PotentialMatch;
using SmartPartInfoProvider = Sage.Platform.WebPortal.SmartParts.SmartPartInfoProvider;

public partial class MergeChildren : SmartPartInfoProvider
{
    private IntegrationManager _integrationManager;
    private Boolean _loadResults = true;
    private MergeContactsStateInfo _mergeContactsStateInfo;
    private MergeArguments _sessionMergeArguments;

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

    public class MergeContactsStateInfo
    {
        public String SelectedSourceId = String.Empty;
        public String SelectedTargetId = String.Empty;
        public String FirstName = String.Empty;
        public String LastName = String.Empty;
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
        _mergeContactsStateInfo = ContextService.GetContext("MergeContactsStateInfo") as MergeContactsStateInfo ??
                                  new MergeContactsStateInfo();
    }

    /// <summary>
    /// Raises the <see cref="E:System.Web.UI.Control.PreRender"/> event.
    /// </summary>
    /// <param name="e">An <see cref="T:System.EventArgs"/> object that contains the event data.</param>
    protected override void OnPreRender(EventArgs e)
    {
        string targetName = string.Empty;
        string sourceName = string.Empty;
        if (_loadResults && DialogService.DialogParameters.ContainsKey("mergeArguments"))
        {
            grdLinkedRecords.DataSource = SessionMergeArguments.MatchingRecordView.MatchedContacts;
            grdLinkedRecords.DataBind();
            grdTargetRecords.DataSource = SessionMergeArguments.MatchingRecordView.TargetContacts;
            grdTargetRecords.DataBind();
            grdSourceRecords.DataSource = SessionMergeArguments.MatchingRecordView.SourceContacts;
            grdSourceRecords.DataBind();
            targetName = SessionMergeArguments.MergeProvider.Target.EntityData.ToString();
            sourceName = SessionMergeArguments.MergeProvider.Source.EntityData.ToString();
        }
        else if (_loadResults)
        {
            grdLinkedRecords.DataSource = IntegrationManager.MatchedContacts;
            grdLinkedRecords.DataBind();
            grdTargetRecords.DataSource = IntegrationManager.TargetContacts;
            grdTargetRecords.DataBind();
            grdSourceRecords.DataSource = IntegrationManager.SourceContacts;
            grdSourceRecords.DataBind();
            targetName = IntegrationManager.SourceMapping.Name;
            sourceName = IntegrationManager.TargetMapping.Name;
        }
        lblSourceRecords.Text = String.Format(GetLocalResourceObject("UnlinkedRecords.Caption").ToString(),
                                           GetLocalResourceObject("lblContacts.Caption"),
                                           sourceName);
        lblTargetRecords.Text = String.Format(GetLocalResourceObject("UnlinkedRecords.Caption").ToString(),
                                              GetLocalResourceObject("lblContacts.Caption"),
                                              targetName);
    }

    /// <summary>
    /// Handles the Click event of the Link button.
    /// </summary>
    /// <param name="sender">The source of the event.</param>
    /// <param name="e">The <see cref="System.EventArgs"/> instance containing the event data.</param>
    protected void btnLink_Click(object sender, EventArgs e)
    {
        if (_mergeContactsStateInfo.SelectedRowTargetIndex == null || _mergeContactsStateInfo.SelectedRowSourceIndex == null)
        {
            throw new ValidationException(GetLocalResourceObject("Error_SourceTargetNotSelected").ToString());
        }
        if (_loadResults && DialogService.DialogParameters.ContainsKey("mergeArguments"))
        {
            SessionMergeArguments.MatchingRecordView.MatchedContacts.Add(GetMatchedContact());
            SessionMergeArguments.MatchingRecordView.SourceContacts.RemoveAt((int)_mergeContactsStateInfo.SelectedRowSourceIndex);
            SessionMergeArguments.MatchingRecordView.TargetContacts.RemoveAt((int)_mergeContactsStateInfo.SelectedRowTargetIndex);
        }
        else
        {
            IntegrationManager.MatchingInfoAddMatchedChildPair(_mergeContactsStateInfo.SelectedSourceId, _mergeContactsStateInfo.SelectedTargetId);
            IList<ComponentView> matchedContacts = IntegrationManager.MatchedContacts;
            matchedContacts.Add(GetMatchedContact());
            IntegrationManager.SourceContacts.RemoveAt((int)_mergeContactsStateInfo.SelectedRowSourceIndex);
            IntegrationManager.TargetContacts.RemoveAt((int)_mergeContactsStateInfo.SelectedRowTargetIndex);
        }
    }

    private ComponentView GetMatchedContact()
    {
        var propertyNames = new[]
            {
                "sourceId", "targetId", "firstName", "lastName"
            };
        var propertyValues = new object[]
            {
                _mergeContactsStateInfo.SelectedSourceId,
                _mergeContactsStateInfo.SelectedTargetId,
                _mergeContactsStateInfo.FirstName,
                _mergeContactsStateInfo.LastName
            };
        return new ComponentView(propertyNames, propertyValues);
    }

    protected void grdLinkedRecords_OnRowCommand(object sender, GridViewCommandEventArgs e)
    {
        int rowIndex = Convert.ToInt32(e.CommandArgument);
        string sourceId = grdLinkedRecords.DataKeys[rowIndex].Values[0].ToString();
        string targetId = grdLinkedRecords.DataKeys[rowIndex].Values[1].ToString();
        switch (e.CommandName.ToUpper())
        {
            case "SELECT":
                lblExtendedDetails.Visible = true;
                grdMatchDetails.DataSource = DialogService.DialogParameters.ContainsKey("mergeArguments")
                                                 ? SessionMergeArguments.MatchingRecordView.GetExtendedContactDetails(
                                                     sourceId, targetId)
                                                 : IntegrationManager.GetExtendedContactDetails(sourceId, targetId);
                grdMatchDetails.DataBind();
                break;
            case "UNLINK":
                if (DialogService.DialogParameters.ContainsKey("mergeArguments"))
                {
                    SessionMergeArguments.MatchingRecordView.RemoveMatchedContact(sourceId, targetId);
                    SessionMergeArguments.MatchingRecordView.MatchedContacts.RemoveAt(rowIndex);
                }
                else
                {
                    IntegrationManager.MatchingInfoRemoveMatchedChildPair(sourceId, targetId);
                    IntegrationManager.MatchedContacts.RemoveAt(rowIndex);
                }
                break;
        }
    }

    protected void grdSourceRecords_OnRowCommand(object sender, GridViewCommandEventArgs e)
    {
        int rowIndex = Convert.ToInt32(e.CommandArgument);
        _mergeContactsStateInfo.SelectedRowSourceIndex = rowIndex;
        _mergeContactsStateInfo.SelectedSourceId = grdSourceRecords.DataKeys[rowIndex].Values[0].ToString();
        ContextService.SetContext("MergeContactsStateInfo", _mergeContactsStateInfo);
    }

    protected void grdTargetRecords_OnRowCommand(object sender, GridViewCommandEventArgs e)
    {
        int rowIndex = Convert.ToInt32(e.CommandArgument);
        _mergeContactsStateInfo.SelectedTargetId = grdTargetRecords.DataKeys[rowIndex].Values[0].ToString();
        _mergeContactsStateInfo.SelectedRowTargetIndex = rowIndex;
        var dataKey = grdTargetRecords.DataKeys[rowIndex];
        if (dataKey != null && dataKey.Values != null)
        {
            _mergeContactsStateInfo.FirstName = dataKey.Values[1] as string;
            _mergeContactsStateInfo.LastName = dataKey.Values[2] as string;
        }
        ContextService.SetContext("MergeContactsStateInfo", _mergeContactsStateInfo);
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
        lblExtendedDetails.Visible = false;
        ContextService.RemoveContext("MergeContactsStateInfo");
        if (DialogService.DialogParameters.ContainsKey("mergeArguments"))
        {
            if (SessionMergeArguments.TargetEntityType == typeof (IAccount) && SessionMergeArguments.MatchingRecordView.MatchedContacts.Count > 0)
            {
                ShowDialog("MergeContactAddress", GetLocalResourceObject("LinkContactAddresses.Caption").ToString(), 600, 1300);
            }
            else
            {
                SessionMergeArguments.MergeProvider.AssignMatchedChildren(SessionMergeArguments.MatchingRecordView);
                if (Sage.SalesLogix.BusinessRules.BusinessRuleHelper.MergeRecords(SessionMergeArguments))
                {
                    using (new Sage.Platform.Orm.SessionScopeWrapper(true))
                    {
                        Type type = SessionMergeArguments.MergeProvider.Target.EntityType;
                        string entityId = SessionMergeArguments.MergeProvider.Source.EntityId;
                        IPersistentEntity source = Sage.Platform.EntityFactory.GetById(type, entityId) as IPersistentEntity;
                        source.Delete();
                        EntityService.RemoveEntityHistory(type, source);
                        DialogService.CloseEventHappened(sender, e);
                        Response.Redirect(String.Format("{0}.aspx", GetEntityName(type)));
                    }
                }
            }
        }
        else
        {
            int height = 250;
            int width = 500;
            if (IntegrationManager.MergeData())
            {
                IntegrationManager.LinkChildren = true;
                IntegrationManager.LinkOperatingCompany();
            }
            if (!String.IsNullOrEmpty(IntegrationManager.LinkAccountError))
            {
                height = 500;
                width = 750;
            }
            ShowDialog("LinkResults", GetLocalResourceObject("LinkToAccounting.Caption").ToString(), height, width);
        }
    }

    /// <summary>
    /// Handles the OnClick event of the btnBack control.
    /// </summary>
    /// <param name="sender">The source of the event.</param>
    /// <param name="e">The <see cref="System.EventArgs"/> instance containing the event data.</param>
    protected void btnBack_OnClick(object sender, EventArgs e)
    {
        lblExtendedDetails.Visible = false;
        if (IntegrationManager != null)
        {
            var caption = IntegrationManager.DataViewMappings.Count > 0
                          ? GetLocalResourceObject("MergeRecordsDialog_Differences.Caption").ToString()
                          : GetLocalResourceObject("MergeRecordsDialog_NoDifferences.Caption").ToString();
            ShowDialog("MergeRecords", caption, 650, 650);
        }
        else
        {
            ShowDialog("MergeAddress", GetLocalResourceObject("LinkAddress.Caption").ToString(), 600, 1200);
        }
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
        ContextService.RemoveContext("MergeContactsStateInfo");
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
        ToolsSmartPartInfo tinfo = new ToolsSmartPartInfo();
        foreach (Control c in MergeChildren_RTools.Controls)
        {
            tinfo.RightTools.Add(c);
        }
        return tinfo;
    }
}