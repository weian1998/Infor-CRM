/*
 * This metadata is used by the Saleslogix platform.  Do not remove.
<snippetHeader xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" id="54680697-38c5-4079-9b38-04d9dddc8d65">
 <assembly>Sage.SnippetLibrary.CSharp</assembly>
 <name>getNeighborhoodStep</name>
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
   <assemblyName>Sage.SalesLogix.API.dll</assemblyName>
  </reference>
 </references>
</snippetHeader>
*/


#region Usings
using System;
using Sage.Entity.Interfaces;
using Sage.Form.Interfaces;
using Sage.SalesLogix.API;
using System.Collections.Generic;
#endregion Usings

namespace Sage.BusinessRules.CodeSnippets
{
    public static partial class ContactBusinessRules
    {
        public static void GetNeighborhoodByFilterStep( IContact contact,  IDictionary<string, string> filter, out IList<IContact> result)
        {
			if(String.IsNullOrEmpty(contact.Address.Country) || contact.Address.Country != "Germany")
				result = new List<IContact>();
			else
			{
				Sage.Platform.RepositoryHelper<Sage.Entity.Interfaces.IContact> repository = Sage.Platform.EntityFactory.GetRepositoryHelper<Sage.Entity.Interfaces.IContact>();
	            Sage.Platform.Repository.ICriteria criteria = repository.CreateCriteria();
	            Sage.Platform.Repository.IExpression exp = repository.EF.Like("address.PostalCode", "%");
	            criteria.CreateCriteria("Address", "address", Platform.Repository.JoinType.InnerJoin);
	            string[] codes = contact.Account.SearchPostalCodes(contact.Address, "DE");
	            Sage.Platform.Repository.IJunction disjunction = repository.EF.Disjunction();
	            for(int i = 0; i < codes.Length;  i++)
	                disjunction.Add(repository.EF.Like("address.PostalCode", codes[i], Platform.Repository.LikeMatchMode.BeginsWith));
	            Sage.Platform.Repository.IJunction conjunction = repository.EF.Conjunction();
				if(filter == null)
					filter = new Dictionary<string, string>();					
				filter.Add("address.Country", contact.Address.Country);
				foreach(KeyValuePair<string, string> pair in filter){
	                if (!string.IsNullOrEmpty(pair.Value))
	                    conjunction.Add(repository.EF.Eq(pair.Key, pair.Value));
	            }
	            criteria.Add(conjunction);
	            criteria.Add(disjunction);
				result = criteria.List<IContact>();
				result.Remove(contact);
			}
        }
    }
}
