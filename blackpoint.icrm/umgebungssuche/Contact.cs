#region Usings
using System;
using Sage.Entity.Interfaces;
using Sage.Form.Interfaces;
using Sage.SalesLogix.API;
using System.Collections.Generic;
#endregion Usings


namespace blackpoint.icrm.umgebungssuche
{
    public class Contact
    {
        public static void GetNeighborhoodBy(IContact contact, IDictionary<string, string> filter, out IList<IContact> result)
        {
            if (!AddressUtil.isSearchDefined(contact.Address))
                result = new List<IContact>();
            else
            {
                Sage.Platform.RepositoryHelper<Sage.Entity.Interfaces.IContact> repository = Sage.Platform.EntityFactory.GetRepositoryHelper<Sage.Entity.Interfaces.IContact>();
                Sage.Platform.Repository.ICriteria criteria = repository.CreateCriteria();
                Sage.Platform.Repository.IExpression exp = repository.EF.Like("address.PostalCode", "%");
                criteria.CreateCriteria("Address", "address", Sage.Platform.Repository.JoinType.InnerJoin);
                string[] codes = AddressUtil.GetNeightborhoodZips(contact.Address);
                Sage.Platform.Repository.IJunction disjunction = repository.EF.Disjunction();
                for (int i = 0; i < codes.Length; i++)
                    disjunction.Add(repository.EF.Like("address.PostalCode", codes[i], Sage.Platform.Repository.LikeMatchMode.BeginsWith));
                Sage.Platform.Repository.IJunction conjunction = repository.EF.Conjunction();
                if (filter == null)
                    filter = new Dictionary<string, string>();
                filter.Add("address.Country", contact.Address.Country);
                foreach (KeyValuePair<string, string> pair in filter)
                {
                    if (!string.IsNullOrEmpty(pair.Value))
                        conjunction.Add(repository.EF.Eq(pair.Key, pair.Value));
                }
                criteria.Add(conjunction);
                criteria.Add(disjunction);
                result = criteria.List<IContact>();
                result.Remove(contact);
            }
        }

        public static void GetNeighborhood(IContact contact , out IList<IContact> result)
        {
            GetNeighborhoodBy(contact, null, out result);
        }

    }
}
