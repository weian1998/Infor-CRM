using System;
using System.Globalization;
using System.Web.UI;
using Sage.Entity.Interfaces;
using Sage.Platform.EntityBinding;
using Sage.Platform.SData;
using Sage.Platform.WebPortal;
using Sage.Platform.WebPortal.Binding;
using Sage.Platform.WebPortal.Services;
using Sage.Platform.WebPortal.SmartParts;
using Sage.SalesLogix.BusinessRules;
using Sage.SalesLogix.Entities;
using Sage.Platform.Application;
using Sage.Platform;
using TimeZone=Sage.Platform.TimeZone;
using System.Collections.Generic;
using Sage.Common.Syndication.Json;

public partial class SalesOrderSnapShot : EntityBoundSmartPartInfoProvider
{
    /// <summary>
    /// Gets the type of the entity.
    /// </summary>
    /// <value>The type of the entity.</value>
    public override Type EntityType
    {
        get { return typeof(ISalesOrder); }
    }

    /// <summary>
    /// Override this method to add bindings to the currently bound smart partmail
    /// </summary>
    protected override void OnAddEntityBindings()
    {
        BindingSource.Bindings.Add(new WebEntityBinding("CurrencyCode", lueCurrencyCode, "LookupResultValue"));
        BindingSource.Bindings.Add(new WebEntityBinding("Freight", curShipping, "Text"));
        BindingSource.Bindings.Add(new WebEntityBinding("Freight", curMyShipping, "Text"));
        BindingSource.Bindings.Add(new WebEntityBinding("Freight", curBaseShipping, "Text"));
        BindingSource.Bindings.Add(new WebEntityBinding("OrderTotal", curSubTotal, "Text"));
        BindingSource.Bindings.Add(new WebEntityBinding("OrderTotal", curMySubTotal, "Text"));
        BindingSource.Bindings.Add(new WebEntityBinding("ExchangeRate", numExchangeRateValue, "Text"));
        BindingSource.Bindings.Add(new WebEntityBinding("ExchangeRateDate", dtpExchangeRateDate, "DateTimeValue", String.Empty, null));

        ClientContextService clientcontext = PageWorkItem.Services.Get<ClientContextService>();
        if (clientcontext != null)
        {
            if (clientcontext.CurrentContext.ContainsKey(EntityPage.CONST_PREVIOUSENTITYIDKEY))
            {
                foreach (IEntityBinding binding in BindingSource.Bindings)
                {
                    WebEntityBinding pBinding = binding as WebEntityBinding;
                    if (pBinding != null)
                        pBinding.IgnoreControlChanges = true;
                }
            }
        }
    }

    /// <summary>
    /// Sets the currency display values for the grid.
    /// </summary>
    private void SetDisplayValues()
    {
        ISalesOrder salesOrder = (ISalesOrder) BindingSource.Current;
        if (salesOrder != null)
        {
            IAppIdMappingService mappingService = ApplicationContext.Current.Services.Get<IAppIdMappingService>(true);
            bool closed = (ReferenceEquals(salesOrder.Status.ToUpper(), GetLocalResourceObject("SalesOrderStatus_Closed")) ||
                salesOrder.Status.ToUpper() == "Closed" ||
                ReferenceEquals(salesOrder.Status.ToUpper(), GetLocalResourceObject("SalesOrderStatus_Transmitted")) ||
                salesOrder.Status.ToUpper() == "Transmitted to Accounting");
            //if this is a Sales Order that synced from the accounting system or the Sales Order has been submitted then we disable it
            bool isOpen = false;
            if (!String.IsNullOrEmpty(salesOrder.ERPSalesOrder.ERPStatus))
            {
                isOpen =
                    (ReferenceEquals(salesOrder.ERPSalesOrder.ERPStatus, GetLocalResourceObject("ERPStatus_Open")) ||
                    salesOrder.ERPSalesOrder.ERPStatus == "Open" ||
                    ReferenceEquals(salesOrder.ERPSalesOrder.ERPStatus, GetLocalResourceObject("ERPStatus_Rejected")) ||
                    salesOrder.ERPSalesOrder.ERPStatus == "Rejected");
            }
            bool erpSalesOrder = (mappingService.IsIntegrationEnabled() && (salesOrder.GlobalSyncId.HasValue && !isOpen));

            if (mappingService.IsIntegrationEnabled())
            {
                lnkEmail.Visible = erpSalesOrder;
            }
            
            lnkDiscount.Enabled = !closed && !erpSalesOrder;
            lnkShipping.Enabled = !closed && !erpSalesOrder;
            lnkTaxRate.Enabled = !closed && !erpSalesOrder;
            lueCurrencyCode.Enabled = !closed && !erpSalesOrder;

            double subTotal = salesOrder.OrderTotal ?? 0;
            double taxRate = salesOrder.Tax ?? 0;
            double tax = Sage.SalesLogix.SalesOrder.SalesOrder.GetSalesOrderTaxAmount(salesOrder);
            double discount = salesOrder.Discount ?? 0;
            double grandTotal = Sage.SalesLogix.SalesOrder.SalesOrder.GetSalesOrderGrandTotal(salesOrder);

            if (BusinessRuleHelper.IsMultiCurrencyEnabled())
            {
                UpdateMultiCurrencyExchangeRate(salesOrder, salesOrder.ExchangeRate.GetValueOrDefault(1));
                SetControlsDisplay();
            }
            if (!salesOrder.OrderTotal.HasValue)
            {
                foreach (SalesOrderItem item in salesOrder.SalesOrderItems)
                {
                    if (item.Discount != null)
                        subTotal += item.Price.Value*(int) item.Quantity.Value*(1 - item.Discount.Value);
                    else
                        subTotal += item.Price.Value;
                }
                if (subTotal > 0 && !salesOrder.OrderTotal.Equals(subTotal))
                    salesOrder.OrderTotal = subTotal;
            }
            double discountAmount = subTotal*discount;

            curBaseSubTotal.Text = Convert.ToString(subTotal);
            curTax.Text = Convert.ToString(tax);
            curMyTax.Text = Convert.ToString(tax);
            curBaseTax.Text = Convert.ToString(tax);
            curDiscount.Text = Convert.ToString(discountAmount);
            curMyDiscount.Text = Convert.ToString(discountAmount);
            curBaseDiscount.Text = Convert.ToString(discountAmount);
            lnkDiscount.Text = discount > 0
                                   ? String.Format("{1} ({0:0.00%})", discount,
                                                   GetLocalResourceObject("lnkDiscount.Caption"))
                                   : GetLocalResourceObject("lnkDiscount.Caption").ToString();
            lnkTaxRate.Text = taxRate > 0
                                  ? String.Format("{1} ({0:0.00%})", taxRate, GetLocalResourceObject("lnkTax.Caption"))
                                  : GetLocalResourceObject("lnkTax.Caption").ToString();
            curTotal.FormattedText = Convert.ToString(grandTotal);
            curMyTotal.FormattedText = Convert.ToString(grandTotal);
            curBaseTotal.Text = Convert.ToString(grandTotal);
        }
    }

    /// <summary>
    /// Sets the controls to be displayed based on whether multi-currency is enabled.
    /// </summary>
    private void SetControlsDisplay()
    {
        tblDetails.Border = 1;
        tblDetails.Width = "100%";
        rowDetailsHeader.Visible = true;
        rowSOSubTotal.Visible = true;
        rowMyCurSubTotal.Visible = true;
        rowSODiscount.Visible = true;
        rowMyCurDiscount.Visible = true;
        rowSOShipping.Visible = true;
        rowMyCurShipping.Visible = true;
        rowSOTax.Visible = true;
        rowMyCurTax.Visible = true;
        rowSOTotal.Visible = true;
        rowMyCurTotal.Visible = true;
        tblMultiCurrency.Visible = true;
        rowSubTotal.Style.Add(HtmlTextWriterStyle.PaddingRight, "0px");
    }

    protected void Page_Load(object sender, EventArgs e)
    {
        ISalesOrder salesOrder = BindingSource.Current as ISalesOrder;
        if (salesOrder != null)
        {
            if (BusinessRuleHelper.IsMultiCurrencyEnabled())
                UpdateMultiCurrencyExchangeRate(salesOrder, salesOrder.ExchangeRate.GetValueOrDefault(1));
        }
    }

    /// <summary>
    /// Called when [form bound].
    /// </summary>
    protected override void OnFormBound()
    {
        if (ClientBindingMgr != null)
        {
            // register these with the ClientBindingMgr so they can do their thing without causing the dirty data warning message...
            ClientBindingMgr.RegisterBoundControl(lnkEmail);
        }
        ISalesOrder salesOrder = BindingSource.Current as ISalesOrder;
        if (salesOrder != null)
        {
            SetDisplayValues();
            double shipping = salesOrder.Freight ?? 0;
            if (String.IsNullOrEmpty(curBaseShipping.FormattedText))
                curBaseShipping.Text = Convert.ToString(shipping);
            if (String.IsNullOrEmpty(curShipping.FormattedText))
                curShipping.Text = Convert.ToString(shipping);
            if (String.IsNullOrEmpty(curMyShipping.FormattedText))
                curMyShipping.Text = Convert.ToString(shipping);
            var systemInfo = Sage.Platform.Application.ApplicationContext.Current.Services.Get<Sage.SalesLogix.Services.ISystemOptionsService>(true);
            if (systemInfo.ChangeSalesOrderRate)
            {
                divExchangeRateLabel.Visible = false;
                divExchangeRateText.Visible = true;
            }
            else
            {
                divExchangeRateLabel.Visible = true;
                divExchangeRateText.Visible = false;
                lblExchangeRateValue.Text = numExchangeRateValue.Text;
            }
        }
    }

    /// <summary>
    /// Handles the OnClick event of the ShowDetailsView control.
    /// </summary>
    /// <param name="sender">The source of the event.</param>
    /// <param name="e">The <see cref="System.EventArgs"/> instance containing the event data.</param>
    protected void ShowDetailsView_OnClick(object sender, EventArgs e)
    {
        if (DialogService != null)
        {
            ISalesOrder salesOrder = BindingSource.Current as ISalesOrder;
            string caption = String.Format(GetLocalResourceObject("lblDetailsView.Caption").ToString(), salesOrder.SalesOrderNumber);
            DialogService.SetSpecs(300, 450, 300, 410, "EditSalesOrderDetail", caption, true);
            DialogService.EntityID = salesOrder.Id.ToString();
            DialogService.ShowDialog();
        }
    }

    /// <summary>
    /// Handles the OnChange event of the CurrencyCode control.
    /// </summary>
    /// <param name="sender">The source of the event.</param>
    /// <param name="e">The <see cref="System.EventArgs"/> instance containing the event data.</param>
    protected void CurrencyCode_OnChange(object sender, EventArgs e)
    {
        ISalesOrder salesOrder = BindingSource.Current as ISalesOrder;
        if (salesOrder != null)
        {
            IExchangeRate exchangeRate = EntityFactory.GetById<IExchangeRate>(lueCurrencyCode.LookupResultValue);
            if (exchangeRate != null)
            {
                Double rate = exchangeRate.Rate.GetValueOrDefault(1);
                salesOrder.ExchangeRate = rate;
                salesOrder.ExchangeRateDate = DateTime.UtcNow;
                salesOrder.CurrencyCode = lueCurrencyCode.LookupResultValue.ToString();
                UpdateMultiCurrencyExchangeRate(salesOrder, rate);
            }
        }
    }

    /// <summary>
    /// Handles the OnChange event of the ExchangeRate control.
    /// </summary>
    /// <param name="sender">The source of the event.</param>
    /// <param name="e">The <see cref="System.EventArgs"/> instance containing the event data.</param>
    protected void ExchangeRate_OnChange(object sender, EventArgs e)
    {
        ISalesOrder salesOrder = BindingSource.Current as ISalesOrder;
        if (salesOrder != null)
        {
            salesOrder.ExchangeRate = Convert.ToDouble(String.IsNullOrEmpty(numExchangeRateValue.Text) ? "1" : numExchangeRateValue.Text);
            salesOrder.ExchangeRateDate = DateTime.UtcNow;
            UpdateMultiCurrencyExchangeRate(salesOrder, salesOrder.ExchangeRate.Value);
        }
    }

    /// <summary>
    /// Updates controls which are set to use multi currency.
    /// </summary>
    /// <param name="salesOrder">The sales order.</param>
    /// <param name="exchangeRate">The exchange rate.</param>
    private void UpdateMultiCurrencyExchangeRate(ISalesOrder salesOrder, Double exchangeRate)
    {
        string myCurrencyCode = BusinessRuleHelper.GetMyCurrencyCode();
        IExchangeRate myExchangeRate =
            EntityFactory.GetById<IExchangeRate>(String.IsNullOrEmpty(myCurrencyCode) ? "USD" : myCurrencyCode);
        double myRate = 0;
        if (myExchangeRate != null)
            myRate = myExchangeRate.Rate.GetValueOrDefault(1);
        curDiscount.CurrentCode = salesOrder.CurrencyCode;
        curDiscount.ExchangeRate = exchangeRate;
        curMyDiscount.CurrentCode = myCurrencyCode;
        curMyDiscount.ExchangeRate = myRate;
        curSubTotal.CurrentCode = String.IsNullOrEmpty(lueCurrencyCode.LookupResultValue.ToString())
                              ? salesOrder.CurrencyCode
                              : lueCurrencyCode.LookupResultValue.ToString();
        curTotal.CurrentCode = curSubTotal.CurrentCode;
        curTotal.ExchangeRate = exchangeRate;
        curMyTotal.CurrentCode = myCurrencyCode;
        curMyTotal.ExchangeRate = myRate;
        curSubTotal.CurrentCode = salesOrder.CurrencyCode;
        curSubTotal.ExchangeRate = exchangeRate;
        curMySubTotal.CurrentCode = myCurrencyCode;
        curMySubTotal.ExchangeRate = myRate;
        curTax.CurrentCode = salesOrder.CurrencyCode;
        curTax.ExchangeRate = exchangeRate;
        curMyTax.CurrentCode = myCurrencyCode;
        curMyTax.ExchangeRate = myRate;
        curShipping.CurrentCode = salesOrder.CurrencyCode;
        curShipping.ExchangeRate = exchangeRate;
        curMyShipping.CurrentCode = myCurrencyCode;
        curMyShipping.ExchangeRate = myRate;
    }

    /// <summary>
    /// Sends the email.
    /// </summary>
    /// <param name="sender">The sender.</param>
    /// <param name="e">The <see cref="System.EventArgs"/> instance containing the event data.</param>
    protected void SendEmail(object sender, EventArgs e)
    {
        try
        {
            ISalesOrder salesOrder = BindingSource.Current as ISalesOrder;
            if (salesOrder != null)
            {
                const string scriptFmtString = @"dojo.require('Sage.Utility.Email');Sage.Utility.Email.writeEmail('{0}', '{1}', '{2}');";
                var to = new List<EmailTo>();
                var cc = new EmailTo();
                if (salesOrder.RequestedBy != null)
                {
                    if (!Equals(salesOrder.RequestedBy, salesOrder.ShippingContact) &&
                        !Equals(salesOrder.RequestedBy, salesOrder.BillingContact))
                    {
                        cc.firstName = salesOrder.RequestedBy.FirstName;
                        cc.lastName = salesOrder.RequestedBy.LastName;
                        cc.emailAddress = salesOrder.RequestedBy.Email;
                    }
                }
                if (salesOrder.ShippingContact != null)
                {
                    to.Add(new EmailTo(salesOrder.ShippingContact.FirstName, salesOrder.ShippingContact.LastName, salesOrder.ShippingContact.Email));
                }
                if (salesOrder.BillingContact != null && !Equals(salesOrder.BillingContact, salesOrder.ShippingContact))
                {
                    to.Add(new EmailTo(salesOrder.BillingContact.FirstName, salesOrder.BillingContact.LastName, salesOrder.BillingContact.Email));
                }

                var emailTo = new { to = to, cc = cc, bcc = string.Empty };
                string subject = PortalUtil.JavaScriptEncode(
                    String.Format(GetLocalResourceObject("lblEmailSubject.Caption").ToString(),
                    salesOrder.SalesOrderNumber, salesOrder.Account.AccountName));
                string emailBody = FormatEmailBody(salesOrder);
                ScriptManager.RegisterStartupScript(this, GetType(), "emailscript",
                                    string.Format(scriptFmtString, JsonConvert.SerializeObject(emailTo), subject, emailBody), true);
            }
        }
        catch (Exception ex)
        {
            log.Error(ex.Message);
        }
    }

    private class EmailTo
    {
        public EmailTo()
        {
        }

        public EmailTo(string firstName, string lastName, string emailAddress)
        {
            this.firstName = firstName;
            this.lastName = lastName;
            this.emailAddress = emailAddress;
        }

        public string firstName { get; set; }

        public string lastName { get; set; }

        public string emailAddress { get; set; }
    }

    /// <summary>
    /// Checks for null value.
    /// </summary>
    /// <param name="value">The value.</param>
    /// <returns></returns>
    private string CheckForNullValue(object value)
    {
        string outValue = String.Format(GetLocalResourceObject("lblNone.Caption").ToString());

        if (value != null)
        {
            if (value.ToString().Length > 0)
                outValue = value.ToString();
        }

        return outValue;
    }

    /// <summary>
    /// Formats the email body.
    /// </summary>
    /// <param name="salesOrder">The sales order.</param>
    /// <returns></returns>
    private string FormatEmailBody(ISalesOrder salesOrder)
    {
        IContextService context = ApplicationContext.Current.Services.Get<IContextService>(true);
        TimeZone timeZone = (TimeZone)context.GetContext("TimeZone");
        bool isMultiCurr = BusinessRuleHelper.IsMultiCurrencyEnabled();
        string datePattern = CultureInfo.CurrentCulture.DateTimeFormat.ShortDatePattern;

        string products = String.Empty;
        string emailBody = String.Format("{0} \r\n", GetLocalResourceObject("lblEmailInfo.Caption"));
        emailBody += String.Format("{0} {1} \r\n", GetLocalResourceObject("lblEmailAccount.Caption"),
                                   CheckForNullValue(salesOrder.Account.AccountName));
        emailBody += String.Format("{0} {1} \r\n", GetLocalResourceObject("lblEmailOpportunity.Caption"),
                                   CheckForNullValue(salesOrder.Opportunity != null
                                                         ? salesOrder.Opportunity.Description
                                                         : String.Empty));
        emailBody += String.Format("{0} {1} \r\n", GetLocalResourceObject("lblEmailDateCreated.Caption"),
                                   timeZone.UTCDateTimeToLocalTime((DateTime)salesOrder.CreateDate).ToString(datePattern));
        emailBody += String.Format("{0} {1} \r\n", GetLocalResourceObject("lblEmailDateRequested.Caption"),
                                   salesOrder.OrderDate.HasValue
                                       ? timeZone.UTCDateTimeToLocalTime((DateTime)salesOrder.OrderDate).ToString(
                                             datePattern)
                                       : String.Empty);
        emailBody += String.Format("{0} {1} \r\n", GetLocalResourceObject("lblEmailDatePromised.Caption"),
                                   salesOrder.DatePromised.HasValue
                                       ? timeZone.UTCDateTimeToLocalTime((DateTime)salesOrder.DatePromised).ToString(
                                             datePattern)
                                       : String.Empty);
        emailBody += String.Format("{0} {1} \r\n", GetLocalResourceObject("lblEmailSalesOrderId.Caption"),
                                   salesOrder.SalesOrderNumber);
        emailBody += String.Format("{0} {1} \r\n", GetLocalResourceObject("lblEmailType.Caption"),
                                   CheckForNullValue(salesOrder.OrderType));
        emailBody += String.Format("{0} {1} \r\n\r\n", GetLocalResourceObject("lblEmailStatus.Caption"),
                                   CheckForNullValue(salesOrder.Status));
        emailBody += String.Format("{0} {1} \r\n\r\n", GetLocalResourceObject("lblEmailComments.Caption"),
                                   CheckForNullValue(salesOrder.Comments));
        emailBody += String.Format("{0} \r\n", GetLocalResourceObject("lblEmailValue.Caption"));
        curBaseTotal.Text = salesOrder.GrandTotal.ToString();
        emailBody += String.Format("{0} \r\n", String.Format(GetLocalResourceObject("lblEmailBaseGrandTotal.Caption").ToString(),
                           curBaseTotal.FormattedText));
        if (isMultiCurr)
        {
            curTotal.CurrentCode = salesOrder.CurrencyCode;
            curTotal.Text = salesOrder.GrandTotal.ToString();
            emailBody += String.Format("{0} \r\n", String.Format(GetLocalResourceObject("lblEmailSalesOrderGrandTotal.Caption").ToString(),
                                       curTotal.FormattedText));
            emailBody += String.Format("{0} {1} \r\n", GetLocalResourceObject("lblEmailCurrencyCode.Caption"),
                                       CheckForNullValue(salesOrder.CurrencyCode));
            emailBody += String.Format("{0} {1} \r\n", GetLocalResourceObject("lblEmailExchangeRate.Caption"),
                                       CheckForNullValue(salesOrder.ExchangeRate));
            if (salesOrder.ExchangeRateDate.HasValue)
                emailBody += String.Format("{0} {1} \r\n", GetLocalResourceObject("lblEmailExchangeRateDate.Caption"),
                                           timeZone.UTCDateTimeToLocalTime((DateTime)salesOrder.ExchangeRateDate).
                                               ToString(datePattern));
            else
                emailBody += String.Format("{0} {1} \r\n", GetLocalResourceObject("lblEmailExchangeRateDate.Caption"),
                                           GetLocalResourceObject("lblNone.Caption"));
        }

        emailBody += String.Format("\r\n{0} \r\n", GetLocalResourceObject("lblEmailProducts.Caption"));
        foreach (ISalesOrderItem item in salesOrder.SalesOrderItems)
            products += String.Format("{0} ({1}); ", item.Product, item.Quantity);
        emailBody += String.Format("{0} \r\n", CheckForNullValue(products));
        emailBody += String.Format("\r\n{0} \r\n", GetLocalResourceObject("lblEmailBillShipAddress.Caption"));
        emailBody += String.Format("{0} \r\n", GetLocalResourceObject("lblEmailBillingAddress.Caption"));
        emailBody += String.Format("{0} {1} \r\n",
                                   GetLocalResourceObject("lblEmailBillingAddressName.Caption"),
                                   salesOrder.BillingContact == null ? String.Empty : salesOrder.BillingContact.NameLF);
        emailBody += salesOrder.BillingAddress.FormatFullSalesOrderAddress().Replace("\r\n", "\r\n");

        emailBody += String.Format("\r\n \r\n{0} \r\n", GetLocalResourceObject("lblEmailShippingAddress.Caption"));
        emailBody += String.Format("{0} {1} \r\n",
                           GetLocalResourceObject("lblEmailShippingAddressName.Caption"),
                           salesOrder.ShippingContact == null ? String.Empty : salesOrder.ShippingContact.NameLF);
        emailBody += salesOrder.ShippingAddress.FormatFullSalesOrderAddress().Replace("\r\n", "\r\n");
        return PortalUtil.JavaScriptEncode(emailBody.Replace("+", "%20"));
    }
}