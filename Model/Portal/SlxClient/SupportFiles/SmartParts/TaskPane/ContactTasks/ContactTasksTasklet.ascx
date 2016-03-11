<%@ Control Language="C#" AutoEventWireup="true" CodeFile="ContactTasksTasklet.ascx.cs" Inherits="ContactTasksTasklet" %>

<asp:UpdatePanel UpdateMode="Conditional" runat="server" ID="updateContactListPanel">
    <ContentTemplate>
    </ContentTemplate>
</asp:UpdatePanel>

<div data-dojo-type="Sage.TaskPane.ContactTasksTasklet" id="contactTasks"></div>

<script type="text/javascript">
    var contactTasksActions;
    require(['Sage/TaskPane/ContactTasksTasklet', 'dojo/ready'],
        function (ContactTasksTasklet, ready) {
            ready(function () {
                if (!contactTasksActions) {
                    contactTasksActions = new ContactTasksTasklet({
                        id: "contactTasksActions",
                        clientId: "<%= ClientID %>"
                    });
                }
            });
        }
    );
</script>