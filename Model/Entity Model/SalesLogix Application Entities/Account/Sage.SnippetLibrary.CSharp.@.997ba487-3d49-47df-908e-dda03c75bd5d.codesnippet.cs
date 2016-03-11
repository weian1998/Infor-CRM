/*
 * Diese Metadaten werden von der Saleslogix-Plattform verwendet.  Bitte nicht löschen.
<snippetHeader xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" id="997ba487-3d49-47df-908e-dda03c75bd5d">
 <assembly>Sage.SnippetLibrary.CSharp</assembly>
 <name>GetNeightborhoodByFilterStep</name>
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
    public static partial class AccountBusinessRules
    {
        public static void GetNeightborhoodByFilterStep( IAccount account,  IDictionary<string, string> filter, out IList<IAccount> result)
        {            
    		Sage.Platform.RepositoryHelper<Sage.Entity.Interfaces.IAccount> repository = Sage.Platform.EntityFactory.GetRepositoryHelper<Sage.Entity.Interfaces.IAccount>();
            Sage.Platform.Repository.ICriteria criteria = repository.CreateCriteria();
            Sage.Platform.Repository.IExpression exp = repository.EF.Like("address.PostalCode", "%");
            criteria.CreateCriteria("Address", "address", Platform.Repository.JoinType.InnerJoin);
            string[] codes = account.SearchPostalCodes(account.Address, "DE");
            Sage.Platform.Repository.IJunction disjunction = repository.EF.Disjunction();
            for(int i = 0; i < codes.Length;  i++)
                disjunction.Add(repository.EF.Like("address.PostalCode", codes[i], Platform.Repository.LikeMatchMode.BeginsWith));
            Sage.Platform.Repository.IJunction conjunction = repository.EF.Conjunction();
			if (filter != null && filter.Count > 0) { 
                foreach(KeyValuePair<string, string> pair in filter){
                    if (!string.IsNullOrEmpty(pair.Value))
                        conjunction.Add(repository.EF.Eq(pair.Key, pair.Value));
                }
            }
            criteria.Add(conjunction);
            criteria.Add(disjunction);
			result = criteria.List<IAccount>();
        }
    }
}