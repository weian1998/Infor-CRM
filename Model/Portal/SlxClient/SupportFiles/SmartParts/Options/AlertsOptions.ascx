<%@ Control Language="C#" AutoEventWireup="true" CodeFile="AlertsOptions.ascx.cs" Inherits="AlertsOptionsPage" %>
<%@ Register Assembly="Sage.SalesLogix.Web.Controls" Namespace="Sage.SalesLogix.Web.Controls.Lookup" TagPrefix="SalesLogix" %>
<%@ Register Assembly="Sage.SalesLogix.HighLevelTypes" Namespace="Sage.SalesLogix.HighLevelTypes" TagPrefix="SalesLogix" %>
<%@ Register Assembly="Sage.SalesLogix.Web.Controls" Namespace="Sage.SalesLogix.Web.Controls.PickList" TagPrefix="SalesLogix" %>
<%@ Register Assembly="Sage.SalesLogix.Web.Controls" Namespace="Sage.SalesLogix.Web.Controls" TagPrefix="SalesLogix" %>
<%@ Register Assembly="Sage.SalesLogix.Web.Controls" Namespace="Sage.SalesLogix.Web.Controls.DependencyLookup" TagPrefix="SalesLogix" %>

<div style="display:none">
<asp:Panel ID="LitRequest_RTools" runat="server" meta:resourcekey="LitRequest_RToolsResource1">
    <asp:ImageButton runat="server" ID="btnSave" OnClick="_save_Click" ToolTip="Save" ImageUrl="~/images/icons/Save_16x16.gif" meta:resourcekey="btnSaveResource1" OnClientClick="sessionStorage.clear();" />
    <SalesLogix:PageLink ID="AlertsOptsHelpLink" runat="server" LinkType="HelpFileName" ToolTip="<%$ resources:Portal, Help_ToolTip %>" ImageUrl="~/ImageResource.axd?scope=global&amp;type=Global_Images&amp;key=Help_16x16"
     Target="Help" NavigateUrl="prefsalerts.aspx" Text=""></SalesLogix:PageLink>
</asp:Panel>
</div>

<table border="0" cellpadding="1" cellspacing="0" class="formtable" style="margin-top:0px; width:100%">
    <tr>
     <td class="highlightedCell" colspan="2">
        <asp:Label ID="lblRemindersAlertsOptions" runat="server" Font-Bold="True" Text="<%$ resources:lblRemindersAlertsOptions.Text %>" ></asp:Label>
	</td>
  </tr>
</table>

<table border="0" cellpadding="1" cellspacing="0" class="formtable" style="margin-top:0px; width:50%">
    <tr>      
        <td>
            <span class="lbl"><asp:Label ID="lblAlertsOptions" runat="server" Text="<%$ resources:lblAlertsOptions.Text %>" /></span>
            <span class="lbl">
                <asp:CheckBox ID="chkDispAlertsInToolbar" runat="server"  onclick="javascript:ToggleAlertsEnabled();" Text="<%$ resources:chkDispAlertsInToolbar.Caption %>"  CssClass="inforAspCheckBox"  />
			</span> 
        </td>
      </tr>
      <tr>
        <td>
			<span class="lbl""><asp:Label ID="LalblSpaceholder3" runat="server" Width="100px" Text="" ></asp:Label></span>
            <span class="lbl">
                <asp:CheckBox ID="chkAlertsPrompt" runat="server" onclick="javascript:ToggleAlertsEnabled();" CssClass="inforAspCheckBox" Text="<%$ resources:chkAlertsPrompt.Caption %>"    />
			</span>
        </td>
      </tr>
       <tr>
          <td>
            <span class="lbl"><asp:Label ID="lblAlertIncludeOptions" runat="server" Text="<%$ resources:lblAlertIncludeOptions.Text %>" /></span>
            <span class="lbl">
                <asp:CheckBox ID="chkIncludeAlarms" runat="server" onclick="javascript:ToggleAlertsEnabled();" CssClass="inforAspCheckBox" Text="<%$ resources:chkIncludeAlarms.Caption %>"    />
			</span> 
        </td>
     </tr>
      <tr> 
        <td>
			<span class="lbl"><asp:Label ID="LalblSpaceholder4" runat="server" Width="100px" Text="" ></asp:Label></span>
            <span class="lbl">
                <asp:CheckBox ID="chkIncludeUnconfirmedActivities" runat="server" onclick="javascript:ToggleAlertsEnabled();" Text="<%$ resources:chkUnconfirmedActivities.Caption %>" CssClass="inforAspCheckBox" />
			</span>
        </td>
        </tr>
        <tr>
         <td>
            <span class="lbl">
                  <asp:Label ID="lblDefaultSnooze" runat="server"  Text="<%$ resources:lblDefaultSnooze.Text %>" />
            </span> 
            <span class="textcontrol">
            <asp:DropDownList ID="ddlDefaultSnooze" data-dojo-type="Sage.UI.Controls.Select" CssClass="select-control" runat="server"  DataTextField="Key" DataValueField="Value" meta:resourcekey="ddlDefaultSnooze" Width="150px" />
            </span>
        </td>
    </tr>
</table>