using System;
using System.Web.UI;
using Sage.Entity.Interfaces;
using Sage.Platform;
using Sage.Platform.Application.UI;
using Sage.Platform.WebPortal.Services;
using Sage.Platform.WebPortal.SmartParts;

public partial class AuthorizeService : EntityBoundSmartPartInfoProvider
{
    /// <summary>
    /// Called when [add entity bindings].
    /// </summary>
    protected override void OnAddEntityBindings()
    {
    }

    /// <summary>
    /// Gets the type of the entity.
    /// </summary>
    /// <value>The type of the entity.</value>
    public override Type EntityType
    {
        get { return typeof (IUserOAuthToken); }
    }

    protected void btnOK_ClickAction(object sender, EventArgs e)
    {
        var entityPage = Page as Sage.Platform.WebPortal.EntityPage;
        string providerId = String.Empty;
        if (entityPage != null)
        {
            var provider = EntityFactory.GetById<IIntegration>(entityPage.EntityContext.EntityID);
            providerId = provider.OAuthProvider.Id.ToString();
        }
        else
        {
            if (DialogService.DialogParameters.ContainsKey("ProviderId"))
            {
                providerId = DialogService.DialogParameters["ProviderId"] as string;
            }
        }
        AuthorizationServiceViewControllerBase.HandleOkClick(txtAutheticationId.Text, txtUserName.Text, providerId);
        var refresher = PageWorkItem.Services.Get<IPanelRefreshService>();
        refresher.RefreshAll();
        DialogService.CloseEventHappened(null, EventArgs.Empty);
    }

    protected override void OnWireEventHandlers()
    {
        btnOK.Click += btnOK_ClickAction;
        btnCancel.Click += DialogService.CloseEventHappened;
        base.OnWireEventHandlers();
    }

    protected override void OnMyDialogOpening()
    {
        var entityPage = Page as Sage.Platform.WebPortal.EntityPage;
        string providerId = String.Empty;
        if (entityPage != null)
        {
            IIntegration provider = EntityFactory.GetById<IIntegration>(entityPage.EntityContext.EntityID);
            providerId = provider.OAuthProvider.Id.ToString();
        }
        else
        {
            if (DialogService.DialogParameters.ContainsKey("ProviderId"))
            {
                providerId = (string) DialogService.DialogParameters["ProviderId"];
            }
        }
        AuthorizationServiceViewControllerBase.HandleDialogOpening(providerId, Page);
        txtUserName.Text = AuthorizationServiceViewControllerBase.GetProviderUserName(providerId);
        base.OnMyDialogOpening();
    }

    /// <summary>
    /// Tries to retrieve smart part information compatible with type
    /// smartPartInfoType.
    /// </summary>
    /// <param name="smartPartInfoType">Type of information to retrieve.</param>
    /// <returns>
    /// The <see cref="T:Sage.Platform.Application.UI.ISmartPartInfo"/> instance or null if none exists in the smart part.
    /// </returns>
    public override ISmartPartInfo GetSmartPartInfo(Type smartPartInfoType)
    {
        var tinfo = new ToolsSmartPartInfo();
        foreach (Control c in AuthorizeService_RTools.Controls)
        {
            tinfo.RightTools.Add(c);
        }
        return tinfo;
    }
}