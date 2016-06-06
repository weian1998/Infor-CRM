/*
 * This metadata is used by the Saleslogix platform.  Do not remove.
<snippetHeader xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" id="2870e754-72ad-47a8-8557-9c5f65447ebe">
 <assembly>Sage.SnippetLibrary.CSharp</assembly>
 <name>OnAfterInsertStep</name>
 <references>
  <reference>
   <assemblyName>Sage.Entity.Interfaces.dll</assemblyName>
   <hintPath>%BASEBUILDPATH%\interfaces\bin\Sage.Entity.Interfaces.dll</hintPath>
  </reference>
  <reference>
   <assemblyName>Sage.Form.Interfaces.dll</assemblyName>
   <hintPath>%BASEBUILDPATH%\formInterfaces\bin\Sage.Form.Interfaces.dll</hintPath>
  </reference>
  <reference>
   <assemblyName>Sage.Platform.dll</assemblyName>
   <hintPath>%BASEBUILDPATH%\assemblies\Sage.Platform.dll</hintPath>
  </reference>
  <reference>
   <assemblyName>Sage.SalesLogix.Client.GroupBuilder.dll</assemblyName>
   <hintPath>%BASEBUILDPATH%\assemblies\Sage.SalesLogix.Client.GroupBuilder.dll</hintPath>
  </reference>
  <reference>
   <assemblyName>Sage.SalesLogix.Plugins.dll</assemblyName>
   <hintPath>%BASEBUILDPATH%\assemblies\Sage.SalesLogix.Plugins.dll</hintPath>
  </reference>
 </references>
</snippetHeader>
*/


#region Usings
using System;
using Sage.Entity.Interfaces;
using Sage.Form.Interfaces;
using Sage.SalesLogix.Client.GroupBuilder;
using System.Linq;
#endregion Usings

namespace Sage.BusinessRules.CodeSnippets
{
    public static partial class ActivityBusinessRules
    {
        public static void OnAfterInsertStep(IActivity activity)
        {
            string groupId = activity.GroupId;
            string groupFamily = activity.GroupFamily;
            string groupName = activity.GroupName;

            if (!String.IsNullOrEmpty(groupId))
            {
                GroupInfo group = GroupInfo.GetGroupInfo(groupId);
                System.Collections.Generic.List<String> ids = group.GetGroupIDs();
                System.Collections.Generic.Dictionary<string, string> entityInfos = new System.Collections.Generic.Dictionary<string, string>();
                foreach (string sId in ids)
                {
                    switch (groupFamily.ToUpper())
                    {
                        case "ACCOUNT":
                            entityInfos.Add("AccountId", sId);
                            break;
                        case "CONTACT":
                            IContact contact = Sage.Platform.EntityFactory.GetById<IContact>(sId);
                            entityInfos.Add("AccountId", contact.Account.Id.ToString());
                            entityInfos.Add("ContactId", sId);
                            break;
                        case "OPPORTUNITY":
                            IOpportunity opp = Sage.Platform.EntityFactory.GetById<IOpportunity>(sId);
                            entityInfos.Add("AccountId", opp.Account.Id.ToString());
                            System.Collections.Generic.ICollection<IContact> contacts = opp.Account.Contacts;
                            if (contacts != null)
                            {
                                IContact primaryContact = contacts.SingleOrDefault(x => x.IsPrimary == true);
                                if (primaryContact != null)
                                    entityInfos.Add("ContactId", primaryContact.Id.ToString());
                            }
                            entityInfos.Add("OpportunityId", sId);
                            break;
                        case "LEAD":
                            ILead lead = Sage.Platform.EntityFactory.GetById<ILead>(sId);
                            entityInfos.Add("LeadId", lead.Id.ToString());
                            break;
                        case "TICKET":
                            ITicket ticket = Sage.Platform.EntityFactory.GetById<ITicket>(sId);
                            entityInfos.Add("AccountId", ticket.Account.Id.ToString());
                            entityInfos.Add("ContactId", ticket.Contact.Id.ToString());
                            entityInfos.Add("TicketId", ticket.Id.ToString());
                            break;
                        default:
                            break;
                    }
                    Copy(activity, entityInfos);
                }
            }
        }


        private static void Copy(IActivity activity, System.Collections.Generic.Dictionary<string, string> groupInfo)
        {
            IActivity act = Sage.Platform.EntityFactory.Create<IActivity>();
            act.UserId = activity.UserId;
            act.Description = activity.Description;
            act.Location = activity.Location;
            act.StartDate = activity.StartDate;
            act.Duration = activity.Duration;
            act.Alarm = activity.Alarm;
            act.AlarmTime = activity.AlarmTime;
            act.Timeless = activity.Timeless;
            foreach (System.Collections.Generic.KeyValuePair<string, string> pair in groupInfo)
                activity[pair.Key] = pair.Value;
            act.Priority = activity.Priority;
            act.Category = activity.Category;
            act.ProjectId = activity.ProjectId;
            act.ProjectId = activity.ProjectId;

            act.CreateDate = activity.CreateDate;
            act.CreateUser = activity.CreateUser;
            act.ModifyDate = activity.ModifyDate;
            act.ModifyUser = activity.ModifyUser;
            act.Notes = activity.Notes;
            act.LongNotes = activity.LongNotes;

            act.Type = activity.Type;
            act.Save();
        }
    }
}