/*
 * Diese Metadaten werden von der Saleslogix-Plattform verwendet.  Bitte nicht löschen.
<snippetHeader xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" id="a60947bf-fea7-4275-9511-e0577bdfd01f">
 <assembly>Sage.SnippetLibrary.CSharp</assembly>
 <name>GetNeighborhoodStep</name>
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
using Repository = Sage.Platform.Repository ;
using EntityFactory = Sage.Platform.EntityFactory;
#endregion Usings

namespace Sage.BusinessRules.CodeSnippets
{
    public static partial class AccountBusinessRules
    {
		public static void GetNeighborhoodStep( IAccount account, out IList<IAccount> accounts)
        {
			accounts = account.GetNeightborhoodByFilter(null);
        }
    }
}
