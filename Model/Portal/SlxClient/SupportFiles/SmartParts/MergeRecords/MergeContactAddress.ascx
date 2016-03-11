<%@ Control Language="C#" AutoEventWireup="true" CodeFile="MergeContactAddress.ascx.cs" Inherits="MergeContactAddress" %>
<%@ Register Assembly="Sage.SalesLogix.Web.Controls" Namespace="Sage.SalesLogix.Web.Controls" TagPrefix="SalesLogix" %>

<div style="display:none">
    <asp:Panel ID="MergeContactAddress_RTools" runat="server">
        <SalesLogix:PageLink ID="lnkMergeContactAddressHelp" runat="server" LinkType="HelpFileName"
            ToolTip="<%$ resources: Portal, Help_ToolTip %>" Target="Help" NavigateUrl="Merge_Contact_Address"
            ImageUrl="~/ImageResource.axd?scope=global&type=Global_Images&key=Help_16x16">
            &nbsp;&nbsp;&nbsp;&nbsp;
        </SalesLogix:PageLink>
    </asp:Panel>
</div>

<table border="0" cellpadding="1" cellspacing="0" class="formtable">
    <col width="2%" />
    <col width="42%" />
    <col width="8%" />
    <col width="42%" />
    <col width="2%" />
    <tr>
        <td></td>
        <td colspan="3">
            <div class="wizardsectiontitle padBottom">
                <asp:Label ID="lblDescription" runat="server" Text="<%$ resources: lblDescription.Caption %>"></asp:Label>
            </div>
        </td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td>
            <div class="wizardsectiontitle">
                <asp:Label ID="lblLinkedContacts" runat="server" Text="<%$ resources: lblLinkedContacts.Caption %>"></asp:Label>
            </div>
        </td>
    </tr>
    <tr>
        <td></td>
        <td colspan="3">
            <asp:Panel runat="server" ID="pnlContacts" Height="120px">
                <SalesLogix:SlxGridView runat="server" ID="grdContacts" GridLines="None" AutoGenerateColumns="false" CellPadding="4" Height="120" ExpandableRows="false"
                    ResizableColumns="True" DataKeyNames="targetContactId,sourceContactId,sourceContactName,targetContactName" ShowEmptyTable="true" CssClass="datagrid"
                    EmptyTableRowText="<%$ resources: EmptyTableRowText %>" EnableViewState="false" OnRowCommand="grdContacts_OnRowCommand" RowStyle-CssClass="rowlt"
                    PagerStyle-CssClass="gridPager" AlternatingRowStyle-CssClass="rowdk" >
                    <Columns>
                        <asp:BoundField DataField="targetContactId" Visible="false" />
                        <asp:BoundField DataField="sourceContactId" Visible="false" />
                        <asp:CommandField ShowSelectButton="true" SelectText="<%$ resources: Grid.Select.Text %>" ButtonType="link"></asp:CommandField>
                        <asp:BoundField DataField="sourceContactName" HeaderText="<%$ resources: Grid_SourceContactName_Column %>" />
                        <asp:BoundField DataField="targetContactName" HeaderText="<%$ resources: Grid_TargetContactName_Column %>" />
                        <asp:BoundField DataField="city" HeaderText="<%$ resources: Grid_City_Column %>" />
                        <asp:BoundField DataField="state" HeaderText="<%$ resources: Grid_State_Column %>" />
                        <asp:TemplateField HeaderText="<%$ resources: Grid_WorkPhone_Column %>">
                            <ItemTemplate>
                                <SalesLogix:Phone runat="server" ID="sourceWorkPhone" DisplayAsLabel="True" CssClass="" Text='<%# Eval("workPhone") %>' />
                            </ItemTemplate>
                        </asp:TemplateField>
                        <asp:BoundField DataField="email" HeaderText="<%$ resources: Grid_Email_Column %>" />
                    </Columns>
                    <SelectedRowStyle backcolor="#CEE6FA" />
                </SalesLogix:SlxGridView>
            </asp:Panel>
        </td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td>
            <div class="wizardsectiontitle">
                <asp:Label ID="lblSourceRecords" runat="server"></asp:Label>
            </div>
        </td>
        <td></td>
        <td>
            <div class="wizardsectiontitle">
                <asp:Label ID="lblTargetRecords" runat="server"></asp:Label>
            </div>
        </td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td>
            <asp:Panel runat="server" ID="pnlSourceRecords" Height="125px">
                <SalesLogix:SlxGridView runat="server" ID="grdSourceRecords" GridLines="None" AutoGenerateColumns="false" CellPadding="4" EnableViewState="false"
                    ResizableColumns="True" DataKeyNames="Id" ShowEmptyTable="true" CssClass="datagrid" Height="125" ExpandableRows="false"
                    EmptyTableRowText="<%$ resources: EmptyTableRowText %>" OnRowCommand="grdSourceRecords_OnRowCommand"
                    RowStyle-CssClass="rowlt" PagerStyle-CssClass="gridPager" AlternatingRowStyle-CssClass="rowdk">
                    <Columns>
                        <asp:BoundField DataField="Id" Visible="false"/>
                        <asp:CommandField ShowSelectButton="true" SelectText="<%$ resources: Grid.Select.Text %>" ButtonType="link"></asp:CommandField>
                        <asp:BoundField DataField="IsPrimary" HeaderText="<%$ resources: Grid_Primary_Column %>" />
                        <asp:BoundField DataField="Address1" HeaderText="<%$ resources: Grid_Address1_Column %>" />
                        <asp:BoundField DataField="Address2" HeaderText="<%$ resources: Grid_Address2_Column %>" />
                        <asp:BoundField DataField="City" HeaderText="<%$ resources: Grid_City_Column %>" />
                        <asp:BoundField DataField="State" HeaderText="<%$ resources: Grid_State_Column %>" />
                    </Columns>
                    <SelectedRowStyle backcolor="#CEE6FA" />
                </SalesLogix:SlxGridView>
            </asp:Panel>
            <br />
        </td>
        <td>
            <asp:Button runat="server" ID="btnLink" Text="<%$ resources: btnLink.Caption %>" OnClick="btnLink_Click" CssClass="slxbutton" />
        </td>
        <td>
            <asp:Panel runat="server" ID="pnlTarget" Height="130px">
                <SalesLogix:SlxGridView runat="server" ID="grdTargetRecords" GridLines="None" AutoGenerateColumns="false" CellPadding="4" ResizableColumns="True"
                    DataKeyNames="Id" ShowEmptyTable="true" CssClass="datagrid" ExpandableRows="false" EnableViewState="false"
                    OnRowCommand="grdTargetRecords_OnRowCommand" Height="130" EmptyTableRowText="<%$ resources: EmptyTableRowText %>" RowStyle-CssClass="rowlt"
                    PagerStyle-CssClass="gridPager" AlternatingRowStyle-CssClass="rowdk" >
                    <Columns>
                        <asp:BoundField DataField="Id" Visible="false"/>
                        <asp:CommandField ShowSelectButton="true" SelectText="<%$ resources: Grid.Select.Text %>" ButtonType="link"></asp:CommandField>
                        <asp:BoundField DataField="IsPrimary" HeaderText="<%$ resources: Grid_Primary_Column %>" />
                        <asp:BoundField DataField="Address1" HeaderText="<%$ resources: Grid_Address1_Column %>" />
                        <asp:BoundField DataField="Address2" HeaderText="<%$ resources: Grid_Address2_Column %>" />
                        <asp:BoundField DataField="City" HeaderText="<%$ resources: Grid_City_Column %>" />
                        <asp:BoundField DataField="State" HeaderText="<%$ resources: Grid_State_Column %>" />
                    </Columns>
                    <SelectedRowStyle backcolor="#CEE6FA" />
                </SalesLogix:SlxGridView>
            </asp:Panel>
            <br />
        </td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td colspan="3">
            <div class="wizardsectiontitle">
                <asp:Label ID="lblLinkedRecords" runat="server" Text="<%$ resources: LinkedAddresses.Caption %>"></asp:Label>
            </div>
        </td>
        <td></td>
    </tr>
    <tr>
        <td></td>
        <td colspan="3">
            <asp:Panel runat="server" ID="pnlLinkedRecords" Height="110px">
                <SalesLogix:SlxGridView runat="server" ID="grdLinkedRecords" GridLines="None" AutoGenerateColumns="false" CellPadding="4"
                    ResizableColumns="True" DataKeyNames="sourceAddressId,targetAddressId,sourceContactId,targetContactId" ShowEmptyTable="true" ExpandableRows="false" CssClass="datagrid"
                    EnableViewState="false" OnRowCommand="grdLinkedRecords_OnRowCommand" EmptyTableRowText="<%$ resources: EmptyTableRowText %>"
                    RowStyle-CssClass="rowlt" PagerStyle-CssClass="gridPager" Height="110" AlternatingRowStyle-CssClass="rowdk" >
                    <Columns>
                        <asp:BoundField DataField="sourceAddressId" Visible="false"/>
                        <asp:BoundField DataField="targetAddressId" Visible="false"/>
                        <asp:BoundField DataField="sourceContactId" Visible="false"/>
                        <asp:BoundField DataField="targetContactId" Visible="false"/>
                        <asp:ButtonField CommandName="Unlink" Text="<%$ resources: Grid_Unlink.Column %>" />
                        <asp:BoundField DataField="IsPrimary" HeaderText="<%$ resources: Grid_Primary_Column %>" />
                        <asp:BoundField DataField="Address1" HeaderText="<%$ resources: Grid_Address1_Column %>" />
                        <asp:BoundField DataField="Address2" HeaderText="<%$ resources: Grid_Address2_Column %>" />
                        <asp:BoundField DataField="City" HeaderText="<%$ resources: Grid_City_Column %>" />
                        <asp:BoundField DataField="State" HeaderText="<%$ resources: Grid_State_Column %>" />
                    </Columns>
                    <SelectedRowStyle backcolor="#CEE6FA" />
                </SalesLogix:SlxGridView>
            </asp:Panel>
        </td>
        <td></td>
    </tr>
</table>
<table border="0" cellpadding="1" cellspacing="0" class="formtable">
    <col width="4%" />
    <col width="25%" />
    <col width="46%" />
    <col width="25%" />
    <tr>
        <td></td>
        <td></td>
        <td>
            <asp:Panel runat="server" ID="ctrlstButtons" CssClass="controlslist qfActionContainer">
                <asp:Button runat="server" ID="btnBack" Text="<%$ resources: btnBack.Caption %>" CssClass="slxbutton" />
                <asp:Button runat="server" ID="btnNext" Text="<%$ resources: btnNext_Merge.Caption %>" CssClass="slxbutton" />
            </asp:Panel>
        </td>
        <td>
            <asp:Panel runat="server" ID="pnlCancel" CssClass="controlslist qfActionContainer">
                <asp:Button runat="server" ID="btnCancel" Text="<%$ resources: btnCancel.Caption %>" CssClass="slxbutton" />
            </asp:Panel>
        </td>
    </tr>
</table>