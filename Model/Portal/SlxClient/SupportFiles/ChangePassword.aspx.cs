using System;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using Sage.SalesLogix.Web;

namespace SlxClient
{
    public partial class ChangePasswordPage : Page
    {
        protected override void OnLoad(EventArgs e)
        {
            if (!Page.IsPostBack)
            {
                lblUserNameText.Text = Request.QueryString["username"];

                var changePasswordError = HttpContext.Current.Cache.Get("changePasswordError");
                if (changePasswordError != null)
                {
                    PasswordFailureMsg.Text = changePasswordError.ToString();
                }
            }
        }

        protected void btnChangePassword_Click(object sender, EventArgs e)
        {
            var newPassword = txtNewPassword.Text;
            var confirmNewPassword = txtReEnterNewPassword.Text;

            if (newPassword != confirmNewPassword)
            {
                PasswordFailureMsg.Text = "Confirmation does not match new password.";
                return;
            }

            var prov = Membership.Provider as SLXMembershipProvider;
            if (prov == null)
            {
                PasswordFailureMsg.Text = "Membership provider is null.";
                return;
            }

            var userName = lblUserNameText.Text;
            var currentPassword = txtCurrentPassword.Text;
            HttpContext.Current.Items.Add("changingPwd", true);
            if (!prov.ChangePassword(userName, currentPassword, newPassword))
            {
                PasswordFailureMsg.Text = HttpContext.Current.Cache.Get("changePasswordError").ToString();
                return;
            }

            Response.Redirect("~/Login.aspx");
        }
    }
}