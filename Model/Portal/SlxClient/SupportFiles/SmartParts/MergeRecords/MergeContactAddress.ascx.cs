using System;
using System.Web.UI;
using System.Web.UI.WebControls;
using Sage.Platform;
using Sage.Platform.Application;
using Sage.Platform.Application.UI;
using Sage.Platform.Orm.Interfaces;
using Sage.Platform.WebPortal.SmartParts;
using Sage.SalesLogix.Services.PotentialMatch;
using SmartPartInfoProvider = Sage.Platform.WebPortal.SmartParts.SmartPartInfoProvider;

public partial class MergeContactAddress : SmartPartInfoProvider
{
    private Boolean _loadResults = true;
    private MergeContactAddressStateInfo _mergeContactAddressStateInfo;
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
                    MergeArguments mergeArguments = DialogService.DialogParameters["mergeArguments"] as MergeArguments;
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
    /// Gets or sets the entity service.
    /// </summary>
    /// <value>The entity service.</value>
    [ServiceDependency(Type = typeof(IEntityContextService), Required = true)]
    public IEntityContextService EntityService { get; set; }

    [ServiceDependency(Type = typeof(IContextService), Required = true)]
    public IContextService ContextService { get; set; }

    public class MergeContactAddressStateInfo
    {
        public String SelectedAddressSourceId = String.Empty;
        public String SelectedAddressTargetId = String.Empty;
        public bool IsPrimary = false;
        public int? SelectedRowSourceIndex;
        public int? SelectedRowTargetIndex;
        public int? SelectedRowContactIndex;
        public String SelectedSourceContactId;
        public String SelectedTargetContactId;
        public String SelectedSourceContact;
        public String SelectedTargetContact;
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
        _mergeContactAddressStateInfo =
            ContextService.GetContext("MergeContactAddressStateInfo") as MergeContactAddressStateInfo ??
            new MergeContactAddressStateInfo();
    }

    /// <summary>
    /// Raises the <see cref="E:System.Web.UI.Control.PreRender"/> event.
    /// </summary>
    /// <param name="e">An <see cref="T:System.EventArgs"/> object that contains the event data.</param>
    protected override void OnPreRender(EventArgs e)
    {
        if (_loadResults)
        {
            grdContacts.DataSource = SessionMergeArguments.MatchingRecordView.GetMatchedContacts();
            grdContacts.DataBind();
            grdSourceRecords.DataSource =
                SessionMergeArguments.MatchingRecordView.GetSourceContactAddressesForEntity(
                    _mergeContactAddressStateInfo.SelectedSourceContactId);
            grdSourceRecords.DataBind();
            grdTargetRecords.DataSource =
                SessionMergeArguments.MatchingRecordView.GetTargetContactAddressesForEntity(
                    _mergeContactAddressStateInfo.SelectedTargetContactId);
            grdTargetRecords.DataBind();
            grdLinkedRecords.DataSource =
                SessionMergeArguments.MatchingRecordView.GetMatchedContactAddressesForEntity(
                    _mergeContactAddressStateInfo.SelectedSourceContactId,
                    _mergeContactAddressStateInfo.SelectedTargetContactId);
            grdLinkedRecords.DataBind();
        }
        if (_mergeContactAddressStateInfo.SelectedRowContactIndex != null)
        {
            lblSourceRecords.Text = String.Format(GetLocalResourceObject("UnlinkedRecords.Caption").ToString(),
                                                  GetLocalResourceObject("lblSourceAddress.Caption"),
                                                  _mergeContactAddressStateInfo.SelectedSourceContact);
            lblTargetRecords.Text = String.Format(GetLocalResourceObject("UnlinkedRecords.Caption").ToString(),
                                                  GetLocalResourceObject("lblTargetAddress.Caption"),
                                                  _mergeContactAddressStateInfo.SelectedTargetContact);
        }
        else
        {
            lblSourceRecords.Text = GetLocalResourceObject("NoContactSelected.Caption").ToString();
            lblTargetRecords.Text = GetLocalResourceObject("NoContactSelected.Caption").ToString();
        }
    }

    protected void grdContacts_OnRowCommand(object sender, GridViewCommandEventArgs e)
    {
        var index = Convert.ToInt32(e.CommandArgument);
        var dataKey = grdContacts.DataKeys[index];
        if (dataKey != null && dataKey.Values != null)
        {
            var targetContactId = dataKey.Values[0] as string;
            var sourceContactId = dataKey.Values[1] as string;
            if (!String.IsNullOrEmpty(targetContactId) && !String.IsNullOrEmpty(sourceContactId))
            {
                _mergeContactAddressStateInfo.SelectedRowContactIndex = index;
                _mergeContactAddressStateInfo.SelectedSourceContactId = sourceContactId;
                _mergeContactAddressStateInfo.SelectedTargetContactId = targetContactId;
                _mergeContactAddressStateInfo.SelectedSourceContact = dataKey.Values[2] as string;
                _mergeContactAddressStateInfo.SelectedTargetContact = dataKey.Values[3] as string;
                ContextService.SetContext("MergeContactAddressStateInfo", _mergeContactAddressStateInfo);
            }
        }
    }

    /// <summary>
    /// Handles the Click event of the Link button.
    /// </summary>
    /// <param name="sender">The source of the event.</param>
    /// <param name="e">The <see cref="System.EventArgs"/> instance containing the event data.</param>
    protected void btnLink_Click(object sender, EventArgs e)
    {
        if (_mergeContactAddressStateInfo.SelectedRowTargetIndex == null || _mergeContactAddressStateInfo.SelectedRowSourceIndex == null)
        {
            throw new ValidationException(GetLocalResourceObject("Error_SourceTargetNotSelected").ToString());
        }
        SessionMergeArguments.MatchingRecordView.AddMatchingContactAddress(_mergeContactAddressStateInfo.SelectedAddressSourceId, _mergeContactAddressStateInfo.SelectedAddressTargetId);
    }

    protected void grdSourceRecords_OnRowCommand(object sender, GridViewCommandEventArgs e)
    {
        int rowIndex = Convert.ToInt32(e.CommandArgument);
        _mergeContactAddressStateInfo.SelectedRowSourceIndex = rowIndex;
        _mergeContactAddressStateInfo.SelectedAddressSourceId = grdSourceRecords.DataKeys[rowIndex].Values[0].ToString();
        ContextService.SetContext("MergeContactAddressStateInfo", _mergeContactAddressStateInfo);
    }

    protected void grdTargetRecords_OnRowCommand(object sender, GridViewCommandEventArgs e)
    {
        int rowIndex = Convert.ToInt32(e.CommandArgument);
        var dataKey = grdTargetRecords.DataKeys[rowIndex];
        if (dataKey != null && dataKey.Values != null)
        {
            _mergeContactAddressStateInfo.SelectedAddressTargetId = dataKey.Values[0].ToString();
        }
        _mergeContactAddressStateInfo.SelectedRowTargetIndex = rowIndex;
        ContextService.SetContext("MergeContactAddressStateInfo", _mergeContactAddressStateInfo);
    }

    protected void grdLinkedRecords_OnRowCommand(object sender, GridViewCommandEventArgs e)
    {
        int rowIndex = Convert.ToInt32(e.CommandArgument);
        SessionMergeArguments.MatchingRecordView.RemoveMatchedContactAddress(grdLinkedRecords.DataKeys[rowIndex].Values[0].ToString());
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
        ContextService.RemoveContext("MergeContactAddressStateInfo");
        SessionMergeArguments.MergeProvider.AssignMatchedChildren(SessionMergeArguments.MatchingRecordView);
        if (Sage.SalesLogix.BusinessRules.BusinessRuleHelper.MergeRecords(SessionMergeArguments))
        {
            using (new Sage.Platform.Orm.SessionScopeWrapper(true))
            {
                Type type = SessionMergeArguments.MergeProvider.Target.EntityType;
                string entityId = SessionMergeArguments.MergeProvider.Source.EntityId;
                IPersistentEntity source = EntityFactory.GetById(type, entityId) as IPersistentEntity;
                source.Delete();
                EntityService.RemoveEntityHistory(type, source);
                Response.Redirect(String.Format("{0}.aspx", GetEntityName(type)));
            }
        }
    }

    /// <summary>
    /// Handles the OnClick event of the btnBack control.
    /// </summary>
    /// <param name="sender">The source of the event.</param>
    /// <param name="e">The <see cref="System.EventArgs"/> instance containing the event data.</param>
    protected void btnBack_OnClick(object sender, EventArgs e)
    {
        ContextService.RemoveContext("MergeContactAddressStateInfo");
        ShowDialog("MergeChildren", GetLocalResourceObject("LinkContacts.Caption").ToString(), 600, 1200);
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
        DialogService.ShowDialog();
    }

    /// <summary>
    /// Called when the dialog is closing.
    /// </summary>
    protected override void OnClosing()
    {
        ContextService.RemoveContext("MergeContactAddressStateInfo");
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
        foreach (Control c in MergeContactAddress_RTools.Controls)
        {
            tinfo.RightTools.Add(c);
        }
        return tinfo;
    }
}