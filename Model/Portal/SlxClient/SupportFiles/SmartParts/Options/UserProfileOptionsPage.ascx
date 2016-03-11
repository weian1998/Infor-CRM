<%@ Control Language="C#" AutoEventWireup="true" CodeFile="UserProfileOptionsPage.ascx.cs" Inherits="UserProfileOptionsPage" %>
<%@ Register Assembly="Sage.SalesLogix.Web.Controls" Namespace="Sage.SalesLogix.Web.Controls" TagPrefix="SalesLogix" %>

<script type="text/javascript">
    function clearRecordDirty() {
        var mgr = Sage.Services.getService("ClientBindingManagerService");
        if (mgr) {
            mgr.clearDirtyStatus();
        }
    }
</script>



<div style="display:none">
<asp:Panel ID="userProfile_RTools" runat="server">
    <asp:ImageButton ID="btnSave" OnClick="btnSave_Click" runat="server" ImageUrl="~/images/icons/Save_16x16.gif" OnClientClick="clearRecordDirty();"/>
    <SalesLogix:PageLink ID="UserOptionsHelpLink" runat="server" LinkType="HelpFileName" ToolTip="<%$ resources:Portal, Help_ToolTip %>" ImageUrl="~/ImageResource.axd?scope=global&amp;type=Global_Images&amp;key=Help_16x16"
     Target="Help" NavigateUrl="UserProfileOptions"></SalesLogix:PageLink>
</asp:Panel>
</div>

<table class="formtable optionsTable">
	<col width="50%" /><col width="50%" />
    <tr>
    	<td  class="highlightedCell">
			<asp:Label ID="lblGenOptions" runat="server" Text="User Profile" meta:resourcekey="lblUserProfile"></asp:Label>
		</td>
    </tr>
	<tr>
	    <td>
            <span class="lbl">
		        <asp:Label ID="lblLanguageSelect" runat="server" Text="Language Selection" meta:resourcekey="lblLanguageSelectResource"></asp:Label>
	        </span>
            <asp:DropDownList id="ddlLanguageSelect" data-dojo-type="Sage.UI.Controls.Select" runat="server" class="dropdown" CssClass="select-control" ClientIDMode="static"></asp:DropDownList>
        </td>
    </tr>
</table>


