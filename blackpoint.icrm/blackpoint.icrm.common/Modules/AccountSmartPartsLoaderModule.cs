using System;
using System.Web;
using System.Web.UI;
using Sage.Entity.Interfaces;
using Sage.Platform;
using Sage.Platform.Application;
using Sage.Platform.Application.UI.Web;
using Sage.Platform.WebPortal.Workspaces.Tab;


namespace blackpoint.icrm.common.Module
{
    public class AccountSmartPartsLoaderModule : IModule
    {
        private IPageWorkItemLocator _pageWorkItemLocator;

        [ServiceDependency]
        public IPageWorkItemLocator PageWorkItemLocator
        {
            get { return _pageWorkItemLocator; }
            set { _pageWorkItemLocator = value; }
        }

        private IEntityContextService _EntityService;

        [ServiceDependency(Type = typeof(IEntityContextService), Required = true)]
        public IEntityContextService EntityService
        {
            get
            {
                return _EntityService;
            }
            set
            {
                _EntityService = value;
            }
        }

        public void Load()
        {
            PageWorkItem workItem = PageWorkItemLocator.GetPageWorkItem();
            TabWorkspace tabWorkspace = workItem.Workspaces["TabControl"] as TabWorkspace;
            bool inRole = false;
            Sage.Entity.Interfaces.IRole role = Sage.Platform.EntityFactory.GetRepository<Sage.Entity.Interfaces.IRole>().FindFirstByProperty("RoleName", "Administrator");
            if (role != null)
                inRole = Sage.SalesLogix.API.MySlx.Security.CurrentUserInRole("Administrator");
            if (!inRole)
                tabWorkspace.Hide("AccountNeighbours", true);
        }
    }
}
