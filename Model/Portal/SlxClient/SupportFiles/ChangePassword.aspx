<%@ Page AutoEventWireup="true" Language="c#" MasterPageFile="~/Masters/Login.master" CodeFile="ChangePassword.aspx.cs" Inherits="SlxClient.ChangePasswordPage" Culture="auto" UICulture="auto" %>
<%@ Assembly Name="System.Web.Extensions, Version=3.5.0.0, Culture=neutral, PublicKeyToken=31BF3856AD364E35" %>

<asp:Content ID="Content1" runat="server" ContentPlaceHolderID="ContentPlaceHolderArea" >

<div class="inforLogo"></div>
<p class="inforApplicationName">Infor CRM</p>
<div id="splashimg">
      <div>
            <table style="width:100%">   
                <tr>
                    <td>
                        <asp:Label ID="lblUserNameLabel" runat="server" ClientIDMode="Static" Text="<%$ resources: UserName %>" ></asp:Label>
                        <asp:Label ID="lblUserNameText" runat="server" ClientIDMode="Static" />
                    </td>
                </tr>
                 <tr>
                    <td>
                        <asp:TextBox ID="txtCurrentPassword" runat="server" placeholder="<%$ resources: CurrentPassword %>" CssClass="editCtl inforTextbox" TextMode="Password" AutoComplete="off"></asp:TextBox>
                    </td>
                 </tr>
                 <tr>
                    <td>
                        <asp:TextBox ID="txtNewPassword" runat="server" Placeholder="<%$ resources: NewPassword %>" CssClass="editCtl inforTextbox" TextMode="Password" AutoComplete="off"></asp:TextBox>
                    </td>
                 </tr>
                  <tr>
                    <td>
                        <asp:TextBox ID="txtReEnterNewPassword" runat="server" Placeholder="<%$ resources: ConfirmNewPassword %>" CssClass="editCtl inforTextbox" TextMode="Password" AutoComplete="off"></asp:TextBox>
                    </td>
                  </tr>
                  <tr>
                    <td>
                        <asp:Button ID="btnChangePassword" runat="server"  CssClass="okButton inforFormButton default inforSignInButton" Text="<%$ resources: ChangePassword %>" OnClick="btnChangePassword_Click"  />
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2">
                         <div id="Div1" class="loginmsg">
                            <asp:Literal ID="PasswordFailureMsg" runat="server" EnableViewState="False" ></asp:Literal>
                            &nbsp;
                        </div>
                    </td>
                  </tr>
            </table>
             
            <div id="loginMsgRow" class="loginmsg">
                    <asp:Literal ID="FailureTextMsg" runat="server" EnableViewState="False" ></asp:Literal>
                    &nbsp;
            </div>
              
        </div>          
    </div>

</asp:Content>