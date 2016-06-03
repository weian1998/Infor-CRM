#region Usings
using System;
using Sage.Entity.Interfaces;
using Sage.Form.Interfaces;
using Sage.SalesLogix.API;
using System.Collections.Generic;
#endregion Usings

namespace blackpoint.icrm.umgebungssuche
{
    public static class Account
    {
        public static void GetNeighborhoodBy(IAccount account, IDictionary<string, string> filter, out IList<IAccount> result)
        {

            if (!AddressUtil.isSearchDefined(account.Address))
                result = new List<IAccount>();
            else
            {
                Sage.Platform.RepositoryHelper<Sage.Entity.Interfaces.IAccount> repository = Sage.Platform.EntityFactory.GetRepositoryHelper<Sage.Entity.Interfaces.IAccount>();
                Sage.Platform.Repository.ICriteria criteria = repository.CreateCriteria();
                Sage.Platform.Repository.IJunction conjunction = repository.EF.Conjunction();
                Sage.Platform.Repository.IExpression exp = repository.EF.Like("address.PostalCode", "%");
                criteria.CreateCriteria("Address", "address", Sage.Platform.Repository.JoinType.InnerJoin);
                string[] codes = AddressUtil.GetNeightborhoodZips(account.Address);
                Sage.Platform.Repository.IJunction disjunction = repository.EF.Disjunction();
                for (int i = 0; i < codes.Length; i++)
                    disjunction.Add(repository.EF.Like("address.PostalCode", codes[i], Sage.Platform.Repository.LikeMatchMode.BeginsWith));
                if (filter == null)
                    filter = new Dictionary<string, string>();
                filter.Add("address.Country", account.Address.Country);
                foreach (KeyValuePair<string, string> pair in filter)
                {
                    if (!string.IsNullOrEmpty(pair.Value))
                        conjunction.Add(repository.EF.Eq(pair.Key, pair.Value));
                }
                criteria.Add(conjunction);
                criteria.Add(disjunction);
                result = criteria.List<IAccount>();
                result.Remove(account);
            }
        }

        public static void GetNeighborhood(IAccount account, out IList<IAccount> result)
        {
            GetNeighborhoodBy(account, null, out result);
        }
    }
}
