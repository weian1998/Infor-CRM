#region Usings
using System;
using Sage.Entity.Interfaces;
using Sage.Form.Interfaces;
using Sage.SalesLogix.API;
using System.Collections.Generic;
using System.Reflection;
using Sage.Platform.Orm.Interfaces;
using Sage.SalesLogix.Entities;
#endregion Usings

namespace blackpoint.icrm.umgebungssuche
{
    public class AddressUtil
    {
       
        public enum Country
        {
            Germany
        }

        public static bool isSearchDefined(IPersistentEntity address)
        {
            bool bDefined = address != null && !string.IsNullOrEmpty(GetCountry(address)) && !string.IsNullOrWhiteSpace(GetCountry(address)) && Enum.IsDefined(typeof(Country), GetCountry(address).Trim());
            return bDefined;
        }

        public static string[] GetNeightborhoodZips(IPersistentEntity address)
        {
            string[] result = new string[] { };
            
            Country country = (Country)Enum.Parse(typeof(Country), GetCountry(address).Trim());
            string sPostalCode = GetPostalCode(address);

            bool bInvalid = String.IsNullOrEmpty(sPostalCode) || String.IsNullOrWhiteSpace(sPostalCode);
            MethodInfo method = Assembly.GetExecutingAssembly().GetType("blackpoint.icrm.umgebungssuche.AddressUtil").GetMethod("GetNeighborhoodZipsFor" + Enum.GetName(typeof(Country), country));
            
            if (!bInvalid && method != null)
                result = (string[])method.Invoke(null, new object[] { sPostalCode.Trim() });
            return result;
        }


        private static string GetCountry(IPersistentEntity address)
        {
            string sCountry = string.Empty;
            if(address.GetType().BaseType == typeof(LeadAddress))
                return ((ILeadAddress)address).Country;
            if (address.GetType().BaseType == typeof(Address))
                return ((IAddress)address).Country;
            return sCountry;
        }


        private static string GetPostalCode(IPersistentEntity address)
        {
            string sPostalCode = string.Empty;
            if (address.GetType().BaseType == typeof(LeadAddress))
                return ((ILeadAddress)address).PostalCode;
            if (address.GetType().BaseType == typeof(Address))
                return ((IAddress)address).PostalCode;
            return sPostalCode;
        }

        public static string[] GetNeighborhoodZipsForGermany(string sPostalCode)
        {
            string[] sSearchZip = { };

            if (sPostalCode.Length < 2)
                return sSearchZip;
            string sZip = sPostalCode.Trim().Substring(0, 2);

            switch (sZip)
            {
                case "01":
                    sSearchZip = new string[] { "01", "02", "03", "04", "09" };
                    break;
                case "02":
                    sSearchZip = new string[] { "01", "02", "03" };
                    break;
                case "03":
                    sSearchZip = new string[] { "01", "02", "03", "04", "15" };
                    break;
                case "04":
                    sSearchZip = new string[] { "01", "06", "03", "04", "09", "07" };
                    break;
                case "06":
                    sSearchZip = new string[] { "04", "06", "07", "14", "39", "38", "99" };
                    break;
                case "07":
                    sSearchZip = new string[] { "08", "04", "06", "99", "98", "96", "95" };
                    break;
                case "08":
                    sSearchZip = new string[] { "07", "04", "09", "08" };
                    break;
                case "09":
                    sSearchZip = new string[] { "01", "04", "08" };
                    break;
                case "10":
                    sSearchZip = new string[] { "10", "13", "14", "12", "15", "16" };
                    break;
                case "12":
                    sSearchZip = new string[] { "10", "13", "14", "15", "12" };
                    break;
                case "13":
                    sSearchZip = new string[] { "13", "10", "12", "14", "16" };
                    break;
                case "14":
                    sSearchZip = new string[] { "13", "10", "12", "14", "16", "15", "39", "06" };
                    break;
                case "15":
                    sSearchZip = new string[] { "15", "16", "14", "12", "03", "04" };
                    break;
                case "16":
                    sSearchZip = new string[] { "14", "15", "16", "17", "13", "39" };
                    break;
                case "17":
                    sSearchZip = new string[] { "18", "19", "16" };
                    break;
                case "18":
                    sSearchZip = new string[] { "18", "17", "19", "23" };
                    break;
                case "19":
                    sSearchZip = new string[] { "19", "18", "17", "16", "39", "29", "21", "23" };
                    break;
                case "20":
                    sSearchZip = new string[] { "20", "21", "22" };
                    break;
                case "21":
                    sSearchZip = new string[] { "20", "21", "22", "29", "19", "23", "27" };
                    break;
                case "22":
                    sSearchZip = new string[] { "20", "21", "22", "23", "24", "25" };
                    break;
                case "23":
                    sSearchZip = new string[] { "20", "21", "22", "18", "19", "24" };
                    break;
                case "24":
                    sSearchZip = new string[] { "22", "24", "23", "25" };
                    break;
                case "25":
                    sSearchZip = new string[] { "22", "24", "23", "25" };
                    break;
                case "26":
                    sSearchZip = new string[] { "26", "27", "28", "49" };
                    break;
                case "27":
                    sSearchZip = new string[] { "26", "27", "28", "21" };
                    break;
                case "28":
                    sSearchZip = new string[] { "28", "27", "26" };
                    break;
                case "29":
                    sSearchZip = new string[] { "29", "21", "19", "39", "38", "30", "27" };
                    break;
                case "30":
                    sSearchZip = new string[] { "29", "31", "27", "30" };
                    break;
                case "31":
                    sSearchZip = new string[] { "30", "32", "37", "27", "38", "29", "31" };
                    break;
                case "32":
                    sSearchZip = new string[] { "33", "32", "31", "37", "49" };
                    break;
                case "33":
                    sSearchZip = new string[] { "33", "32", "37", "34", "59", "49" };
                    break;
                case "34":
                    sSearchZip = new string[] { "34", "33", "37", "36", "35", "59" };
                    break;
                case "35":
                    sSearchZip = new string[] { "34", "35", "36", "61", "65", "57", "63" };
                    break;
                case "36":
                    sSearchZip = new string[] { "36", "37", "34", "99", "98", "97", "63", "35" };
                    break;
                case "37":
                    sSearchZip = new string[] { "37", "38", "99", "36", "31", "32", "34" };
                    break;
                case "38":
                    sSearchZip = new string[] { "38", "31", "39", "25", "06", "99" };
                    break;
                case "39":
                    sSearchZip = new string[] { "39", "14", "16", "19", "29", "38" };
                    break;
                case "40":
                    sSearchZip = new string[] { "40", "42", "41", "47", "45" };
                    break;
                case "41":
                    sSearchZip = new string[] { "41", "47", "52", "50", "40" };
                    break;
                case "42":
                    sSearchZip = new string[] { "42", "58", "51", "40", "44", "45" };
                    break;
                case "44":
                    sSearchZip = new string[] { "44", "59", "45", "58", "42" };
                    break;
                case "45":
                    sSearchZip = new string[] { "45", "46", "44", "42" };
                    break;
                case "46":
                    sSearchZip = new string[] { "46", "48", "47", "45" };
                    break;
                case "47":
                    sSearchZip = new string[] { "47", "41", "46", "40", "45" };
                    break;
                case "48":
                    sSearchZip = new string[] { "48", "49", "46", "59", "33" };
                    break;
                case "49":
                    sSearchZip = new string[] { "49", "48", "26", "33", "32", "27" };
                    break;
                case "50":
                    sSearchZip = new string[] { "50", "52", "41", "51", "53", "42" };
                    break;
                case "51":
                    sSearchZip = new string[] { "51", "42", "58", "53", "57", "50", "40" };
                    break;
                case "52":
                    sSearchZip = new string[] { "52", "41", "50", "53" };
                    break;
                case "53":
                    sSearchZip = new string[] { "53", "56", "54", "52", "50", "51", "57", "52" };
                    break;
                case "54":
                    sSearchZip = new string[] { "54", "66", "53", "56" };
                    break;
                case "55":
                    sSearchZip = new string[] { "55", "67", "66", "54", "56", "65", "67" };
                    break;
                case "56":
                    sSearchZip = new string[] { "56", "54", "53", "57", "65", "55" };
                    break;
                case "57":
                    sSearchZip = new string[] { "57", "35", "56", "53", "51", "58", "59" };
                    break;
                case "58":
                    sSearchZip = new string[] { "58", "44", "59", "57", "42" };
                    break;
                case "59":
                    sSearchZip = new string[] { "59", "32", "34", "35", "57", "58", "48", "44" };
                    break;
                case "60":
                    sSearchZip = new string[] { "60", "61", "63", "65", "64" };
                    break;
                case "61":
                    sSearchZip = new string[] { "61", "60", "63", "35", "65" };
                    break;
                case "63":
                    sSearchZip = new string[] { "63", "97", "64", "36", "35", "", "", "", "", "", "" };
                    break;
                case "64":
                    sSearchZip = new string[] { "64", "63", "65", "55", "68", "69" };
                    break;
                case "65":
                    sSearchZip = new string[] { "65", "61", "35", "59", "55" };
                    break;
                case "66":
                    sSearchZip = new string[] { "66", "54", "55", "67", "76" };
                    break;
                case "67":
                    sSearchZip = new string[] { "67", "55", "66", "76", "68" };
                    break;
                case "68":
                    sSearchZip = new string[] { "68", "69", "64", "74", "76" };
                    break;
                case "69":
                    sSearchZip = new string[] { "69", "68", "74", "76" };
                    break;
                case "70":
                    sSearchZip = new string[] { "70", "71", "73", "72" };
                    break;
                case "71":
                    sSearchZip = new string[] { "71", "74", "73", "70" };
                    break;
                case "72":
                    sSearchZip = new string[] { "72", "88", "89", "78", "77", "73", "71" };
                    break;
                case "73":
                    sSearchZip = new string[] { "73", "74", "86", "89", "91", "71", "72" };
                    break;
                case "74":
                    sSearchZip = new string[] { "74", "97", "91", "73", "71", "69", "75" };
                    break;
                case "75":
                    sSearchZip = new string[] { "75", "76", "72", "74" };
                    break;
                case "76":
                    sSearchZip = new string[] { "76", "77", "75", "67", "69" };
                    break;
                case "77":
                    sSearchZip = new string[] { "77", "76", "79", "78", "72" };
                    break;
                case "78":
                    sSearchZip = new string[] { "78", "88", "79", "77", "72" };
                    break;
                case "79":
                    sSearchZip = new string[] { "79", "77", "78" };
                    break;
                case "80":
                    sSearchZip = new string[] { "80", "81", "85", "82" };
                    break;
                case "81":
                    sSearchZip = new string[] { "80", "81", "85", "82" };
                    break;
                case "82":
                    sSearchZip = new string[] { "80", "81", "85", "82", "84" };
                    break;
                case "83":
                    sSearchZip = new string[] { "83", "84", "82", "81" };
                    break;
                case "84":
                    sSearchZip = new string[] { "84", "94", "83", "81", "85", "86" };
                    break;
                case "85":
                    sSearchZip = new string[] { "85", "86", "80", "81", "91" };
                    break;
                case "86":
                    sSearchZip = new string[] { "86", "85", "89", "87" };
                    break;
                case "87":
                    sSearchZip = new string[] { "87", "88", "85", "89", "82", "86" };
                    break;
                case "88":
                    sSearchZip = new string[] { "88", "87", "78", "72", "89" };
                    break;
                case "89":
                    sSearchZip = new string[] { "89", "73", "85", "87", "88", "72" };
                    break;
                case "90":
                    sSearchZip = new string[] { "90", "91", "92" };
                    break;
                case "91":
                    sSearchZip = new string[] { "91", "90", "97", "96", "95", "92", "74", "85", "86" };
                    break;
                case "92":
                    sSearchZip = new string[] { "92", "93", "90", "95", "91", "85", "86" };
                    break;
                case "93":
                    sSearchZip = new string[] { "93", "94", "92", "84", "85", "86" };
                    break;
                case "94":
                    sSearchZip = new string[] { "94", "84", "93" };
                    break;
                case "95":
                    sSearchZip = new string[] { "95", "96", "92", "91", "08", "07" };
                    break;
                case "96":
                    sSearchZip = new string[] { "96", "98", "97", "91", "95", "07" };
                    break;
                case "97":
                    sSearchZip = new string[] { "97", "98", "96", "91", "74", "63", "36" };
                    break;
                case "98":
                    sSearchZip = new string[] { "98", "99", "36", "97", "07" };
                    break;
                case "99":
                    sSearchZip = new string[] { "99", "37", "06", "07", "98", "36" };
                    break;
                default: break;
            }
            return sSearchZip;
        }

    }
}
