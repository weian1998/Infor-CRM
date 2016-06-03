#region Usings
using System;
using Sage.Entity.Interfaces;
using Sage.Form.Interfaces;
using Sage.SalesLogix.API;
using System.Collections.Generic;
#endregion Usings

namespace blackpoint.icrm.umgebungssuche
{
    public class Lead
    {
        public static void GetNeighborhoodBy(ILead lead, IDictionary<string, string> filter, out IList<ILead> result)
        {
            if (!AddressUtil.isSearchDefined(lead.Address))
                result = new List<ILead>();
            else
            {
                Sage.Platform.RepositoryHelper<Sage.Entity.Interfaces.ILead> repository = Sage.Platform.EntityFactory.GetRepositoryHelper<Sage.Entity.Interfaces.ILead>();
                Sage.Platform.Repository.ICriteria criteria = repository.CreateCriteria();
                Sage.Platform.Repository.IExpression exp = repository.EF.Like("address.PostalCode", "%");
                criteria.CreateCriteria("Address", "address", Sage.Platform.Repository.JoinType.InnerJoin);
                string[] codes = AddressUtil.GetNeightborhoodZips(lead.Address);
                Sage.Platform.Repository.IJunction disjunction = repository.EF.Disjunction();
                for (int i = 0; i < codes.Length; i++)
                    disjunction.Add(repository.EF.Like("address.PostalCode", codes[i], Sage.Platform.Repository.LikeMatchMode.BeginsWith));
                Sage.Platform.Repository.IJunction conjunction = repository.EF.Conjunction();
                if (filter == null)
                    filter = new Dictionary<string, string>();
                filter.Add("address.Country", lead.Address.Country);
                if (filter != null && filter.Count > 0)
                {
                    foreach (KeyValuePair<string, string> pair in filter)
                    {
                        if (!string.IsNullOrEmpty(pair.Value))
                            conjunction.Add(repository.EF.Eq(pair.Key, pair.Value));
                    }
                }
                criteria.Add(conjunction);
                criteria.Add(disjunction);
                result = criteria.List<ILead>();
                result.Remove(lead);
            }
        }

        public static void GetNeighborhood(ILead lead, out IList<ILead> result)
        {
            GetNeighborhoodBy(lead, null, out result);
        }
    }
}

