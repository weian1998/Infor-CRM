/*
 * This metadata is used by the Saleslogix platform.  Do not remove.
<snippetHeader xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" id="6463e950-f2d6-43aa-ba67-bba9b40b157b">
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
#endregion Usings

namespace Sage.BusinessRules.CodeSnippets
{
    public static partial class ContactBusinessRules
    {
        public static void GetNeighborhoodStep( IContact contact, out IList<IContact> result)
        {
			result = contact.GetNeighborhoodByFilter(null);
        }
    }
}
