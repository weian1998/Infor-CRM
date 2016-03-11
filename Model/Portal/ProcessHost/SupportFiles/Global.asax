<%@ Application Language="C#" %>
<%@ Import Namespace="System.IO" %>
<%@ Import Namespace="System.Reflection" %>
<%@ Import Namespace="log4net" %>
<%@ Import Namespace="log4net.Config" %>
<%@ Import Namespace="Sage.Platform.Application.Diagnostics" %>
<%@ Import Namespace="Sage.Platform.Application.UI.Web" %>
<%@ Import Namespace="Sage.Platform.Diagnostics" %>
<%@ Import Namespace="Sage.Platform.Process" %>

<script runat="server">

    static readonly ILog Log = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);

    void Application_Start(object sender, EventArgs e)
    {
        string path = Server.MapPath("~/log4net.config");
        XmlConfigurator.Configure(new FileInfo(path));

        ApplicationContextAccessor.Initialize(HttpRuntime.AppDomainAppPath, "application-thread");

        HierarchicalRuntime.Instance.Initialize();
    }

    void Application_End(object sender, EventArgs e)
    {
        try
        {
            WorkflowProcessManagerService.ShutdownProcessHost();
            var runtime = typeof(HttpRuntime).InvokeMember("_theRuntime", BindingFlags.NonPublic | BindingFlags.Static | BindingFlags.GetField, null, null, null) as HttpRuntime;
            if (runtime == null) return;
            var shutDownMessage = runtime.GetType().InvokeMember("_shutDownMessage", BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.GetField, null, runtime, null) as string;
            var shutDownStack = runtime.GetType().InvokeMember("_shutDownStack", BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.GetField, null, runtime, null) as string;
            if (!string.IsNullOrEmpty(shutDownMessage))
            {
                shutDownMessage = shutDownMessage.Replace(Environment.NewLine, " ").Trim();
            }
            if (!string.IsNullOrEmpty(shutDownStack))
            {
                shutDownStack = shutDownStack.Replace(Environment.NewLine, " ").Trim();
            }
            // Note: Accessing HostingEnvironment.ShutdownReason can lead to an exception, so use reflection instead.
            var shutDownReason = (ApplicationShutdownReason)runtime.GetType().InvokeMember("_shutdownReason", BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.GetField, null, runtime, null);
            Log.WarnEx(string.Format("The Saleslogix Process Host application has shutdown for the following reason: Reason={0}; Message={1}; Stack Trace={2}", shutDownReason, shutDownMessage, shutDownStack), EventIds.AdHocEvents.WarnApplicationEnd);
        }
        catch (Exception ex)
        {
            Log.WarnEx("There was an error in Application_End()", EventIds.AdHocEvents.WarnApplicationEnd, ex);
        }
    }

    void Application_Error(object sender, EventArgs e)
    {
        Exception oLastException = Server.GetLastError();
        if (oLastException != null)
        {
            Exception oException = oLastException.GetBaseException();
            Log.Error("Unhandled exception.", oException);
            Server.ClearError();
        }
    }

    void Session_Start(object sender, EventArgs e)
    {
        HierarchicalRuntime.Instance.EnsureSessionWorkItem();
    }

    void Session_End(object sender, EventArgs e)
    {
        HierarchicalRuntime.Instance.TerminateSessionWorkItem(Session);
    }

</script>