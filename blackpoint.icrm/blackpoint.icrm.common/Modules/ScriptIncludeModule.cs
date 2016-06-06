using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.UI;
using Sage.Platform;
using Sage.Platform.Application;


namespace blackpoint.icrm.common.Module
{
    public class ScriptIncludeModule : IModule
    {
        public void Load()
        {
            Page page = HttpContext.Current.Handler as Page;
            if (page == null)
                return;
            ClientScriptManager cs = page.ClientScript;
            string sVirtualPath = System.Web.Hosting.HostingEnvironment.ApplicationVirtualPath;
            cs.RegisterClientScriptInclude("blackpoint_js", sVirtualPath + "/jscript/blackpoint/blackpoint.js");

            StringBuilder sb = new StringBuilder();
            sb.AppendLine("require({packages: [{ name: 'blackpoint', ");  //pkg-name
            sb.Append("location: '").Append(HttpContext.Current.Request.ApplicationPath).Append("/jscript/blackpoint'}] }, "); //pkg-location
            sb.Append("['blackpoint/Activity/ActivityEditor'], "); // class-name
            sb.Append("function(ActivityEditor) { ActivityEditor() });"); // function-name
            cs.RegisterStartupScript(page.GetType(), "CustomActivityJS", sb.ToString(), true);
        }
    }
}
